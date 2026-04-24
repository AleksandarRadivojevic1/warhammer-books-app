#!/usr/bin/env node
/**
 * Generates public/sitemap.xml by fetching the full catalog from the
 * Warhammer Books API. Runs automatically before `vite build` via the
 * `prebuild` npm hook.
 *
 * If the API is unreachable, exits cleanly and leaves the existing
 * sitemap in place — a stale sitemap is better than a failed deploy.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const API = 'https://warhammer-books-api.onrender.com/api/v1';
const SITE = 'https://librarium40k.com';
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sitemap.xml');

const escape = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function fetchAll(path) {
  const items = [];
  let url = `${API}${path}?page=1`;
  while (url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
    const json = await res.json();
    items.push(...(json.results ?? []));
    // API returns `next` as either a full URL or a root-relative path.
    url = json.next ? new URL(json.next, API).toString() : null;
  }
  return items;
}

const entry = (loc, priority, changefreq) =>
  `  <url>\n    <loc>${escape(loc)}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;

async function main() {
  console.log('[sitemap] fetching catalog from', API);

  const [books, authors, series, primarchs] = await Promise.all([
    fetchAll('/books'),
    fetchAll('/authors'),
    fetchAll('/series'),
    fetchAll('/primarchs'),
  ]);

  console.log(
    `[sitemap] fetched ${books.length} books, ${authors.length} authors, ${series.length} series, ${primarchs.length} primarchs`
  );

  const urls = [
    entry(`${SITE}/`, '1.0', 'weekly'),
    entry(`${SITE}/books`, '0.9', 'weekly'),
    entry(`${SITE}/series`, '0.8', 'monthly'),
    entry(`${SITE}/authors`, '0.8', 'monthly'),
    entry(`${SITE}/primarchs`, '0.8', 'monthly'),
    ...books.map((b) => entry(`${SITE}/books/${b.slug}`, '0.7', 'monthly')),
    ...series.map((s) => entry(`${SITE}/series/${s.slug}`, '0.6', 'monthly')),
    ...authors.map((a) => entry(`${SITE}/authors/${a.slug}`, '0.6', 'monthly')),
    ...primarchs.map((p) => entry(`${SITE}/primarchs/${p.slug}`, '0.6', 'monthly')),
  ];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.join('\n') +
    `\n</urlset>\n`;

  writeFileSync(OUT, xml);
  console.log(`[sitemap] wrote ${urls.length} URLs → ${OUT}`);
}

main().catch((err) => {
  console.warn(`[sitemap] ⚠  generation failed, keeping existing file: ${err.message}`);
  // Exit cleanly so the build continues.
  process.exit(0);
});
