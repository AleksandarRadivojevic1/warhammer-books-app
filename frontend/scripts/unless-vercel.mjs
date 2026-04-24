#!/usr/bin/env node
// Runs the given command only when not in a Vercel build environment.
// Usage: node scripts/unless-vercel.mjs <command> [args…]
import { execSync } from 'node:child_process';

const [,, ...cmd] = process.argv;
if (process.env.VERCEL) {
  console.log(`[unless-vercel] Skipping (VERCEL env detected): ${cmd.join(' ')}`);
} else {
  execSync(cmd.join(' '), { stdio: 'inherit' });
}
