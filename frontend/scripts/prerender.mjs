#!/usr/bin/env node
/**
 * Post-build prerender. Launches a headless Chromium, visits every URL from
 * dist/sitemap.xml (+ a few extras like /404), waits for React Query data to
 * settle, then snapshots the rendered HTML into dist/<route>/index.html.
 *
 * Result: crawlers get real content + meta tags + JSON-LD in the initial HTML
 * response instead of an empty React shell.
 *
 * Runs after `vite build` via the `postbuild` npm hook.
 */
import { chromium } from 'playwright';
import {
  readFileSync, writeFileSync, mkdirSync, existsSync, statSync,
} from 'node:fs';
import { join, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(ROOT, 'dist');
const PORT = 4173;
const CONCURRENCY = 1;
const TIMEOUT_MS = 45_000;
const API_WARMUP = `${process.env.VITE_BOOKS_API_URL ?? 'https://warhammer-books-api.onrender.com/api/v1'}/books?page=1`;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.mjs':  'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.txt':  'text/plain; charset=utf-8',
  '.xml':  'application/xml',
  '.webmanifest': 'application/manifest+json',
};

/* Tiny static server with SPA fallback so client-side routes resolve to index.html */
function startStaticServer(root, port) {
  return new Promise((resolveFn) => {
    const server = createServer((req, res) => {
      try {
        const pathname = decodeURIComponent(req.url.split('?')[0]);
        const candidates = [
          join(root, pathname),
          join(root, pathname, 'index.html'),
          join(root, 'index.html'),
        ];
        const file = candidates.find(
          (c) => existsSync(c) && statSync(c).isFile()
        );
        if (!file) { res.statusCode = 404; res.end('Not found'); return; }
        res.setHeader('Content-Type', MIME[extname(file)] ?? 'application/octet-stream');
        res.end(readFileSync(file));
      } catch (err) {
        res.statusCode = 500;
        res.end(String(err));
      }
    });
    server.listen(port, () => resolveFn(server));
  });
}

function urlsFromSitemap() {
  const xml = readFileSync(resolve(DIST, 'sitemap.xml'), 'utf-8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => new URL(m[1]).pathname)
    // Auth-gated and token-dependent routes aren't useful to prerender
    .filter((p) => !p.startsWith('/profile'))
    .filter((p) => !p.startsWith('/admin'));
}

/* Public routes not in the sitemap that still benefit from prerendering */
const EXTRA_PATHS = ['/404', '/login', '/register', '/forgot-password'];

function outPath(pathname) {
  if (pathname === '/')    return resolve(DIST, 'index.html');
  if (pathname === '/404') return resolve(DIST, '404.html');
  return resolve(DIST, pathname.replace(/^\/+/, ''), 'index.html');
}

const MAX_ATTEMPTS = 3;

async function renderOne(browser, pathname) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const page = await browser.newPage();
    try {
      await page.goto(`http://localhost:${PORT}${pathname}`, {
        waitUntil: 'domcontentloaded',
        timeout: TIMEOUT_MS,
      });
      // Wait for <main> to settle: no spinner, and either an h1 or a
      // terminal error state (only valid on /404).
      await page.waitForFunction(
        () => {
          const main = document.querySelector('main');
          if (!main) return false;
          if (main.querySelector('.animate-spin')) return false;
          return !!main.querySelector('h1')
              || /not found|lost to the warp/i.test(main.textContent);
        },
        { timeout: 20_000 },
      );
      const html = await page.content();

      // Detail pages must render real content. If they show a "not found"
      // state, the API is broken (CORS, DNS, backend down) — fail loudly
      // so we don't ship an empty catalog.
      if (pathname !== '/404' && /not found|lost to the warp/i.test(html)) {
        throw new Error('rendered error state (API likely unreachable)');
      }

      const out = outPath(pathname);
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, html);
      return;
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    } finally {
      await page.close();
    }
  }
  throw lastErr;
}

async function warmApi() {
  try {
    const start = Date.now();
    const res = await fetch(API_WARMUP);
    console.log(`[prerender] API warmup: HTTP ${res.status} in ${Date.now() - start}ms`);
  } catch (err) {
    console.warn(`[prerender] API warmup failed (continuing anyway): ${err.message}`);
  }
}

async function main() {
  if (!existsSync(DIST)) {
    throw new Error(`dist/ not found — run \`vite build\` first`);
  }

  const urls = [...new Set([...urlsFromSitemap(), ...EXTRA_PATHS])];
  console.log(`[prerender] ${urls.length} URLs to snapshot (concurrency ${CONCURRENCY})`);

  await warmApi();

  const server = await startStaticServer(DIST, PORT);
  // CORS/same-origin policy is hostile to build-time snapshotting — the
  // API allow-list is scoped to production origin(s) while we render from
  // localhost. Disabling web security is safe here because we control the
  // browser and the pages it visits.
  const browser = await chromium.launch({
    args: ['--disable-web-security'],
  });

  let done = 0;
  const queue = [...urls];
  const errors = [];

  async function worker() {
    while (queue.length) {
      const path = queue.shift();
      try {
        await renderOne(browser, path);
        done++;
        if (done % 25 === 0 || done === urls.length) {
          console.log(`[prerender] ${done}/${urls.length}`);
        }
      } catch (err) {
        errors.push({ path, err: err.message });
        console.warn(`[prerender] ✗ ${path} — ${err.message}`);
      }
    }
  }

  const started = Date.now();
  try {
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  } finally {
    await browser.close();
    server.close();
  }

  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`[prerender] done: ${done}/${urls.length} in ${elapsed}s, ${errors.length} errors`);
  if (errors.length) {
    console.warn(`[prerender] failed URLs:`);
    for (const { path, err } of errors.slice(0, 10)) {
      console.warn(`  ${path}: ${err}`);
    }
    if (errors.length > 10) console.warn(`  …and ${errors.length - 10} more`);
    // Partial failures still deploy the pages that succeeded. Only abort if
    // nothing rendered at all (done === 0), which means a fundamental problem.
    if (done === 0) {
      console.error('[prerender] zero pages rendered — aborting deploy');
      process.exit(1);
    }
    console.warn(`[prerender] deploying ${done} successfully rendered pages`);
  }
}

main().catch((err) => {
  console.error('[prerender] fatal:', err);
  process.exit(1);
});
