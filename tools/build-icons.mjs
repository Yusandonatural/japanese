#!/usr/bin/env node
// Renders the app icons (icons/*.png) used by the web app manifest and iOS home screen.
//   node tools/build-icons.mjs
// Needs Playwright with Chromium (a local or global install). Only re-run when the icon design changes.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }
const { chromium } = pw;

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'icons');

// Full-bleed 松葉 square so the same art works as a maskable icon (safe zone = central 80%).
const svg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#3e5c3b"/>
  <text x="256" y="300" text-anchor="middle" dominant-baseline="middle" font-family="IPAGothic, 'Noto Sans JP', sans-serif" font-size="250" fill="#fbf8f1">あ</text>
  <g transform="translate(350 142)">
    <circle r="54" fill="#c0452c"/>
    <text y="4" text-anchor="middle" dominant-baseline="middle" font-family="Georgia, serif" font-weight="700" font-size="52" fill="#fbf8f1">14</text>
  </g>
</svg>`;

const SIZES = [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]];
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'icon.svg'), svg(512));
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage();
for (const [name, size] of SIZES) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0}</style>${svg(size)}`);
  await page.screenshot({ path: path.join(OUT, name), omitBackground: false });
}
await browser.close();
console.log(`Icons written to icons/: ${SIZES.map(s => s[0]).join(', ')}, icon.svg`);
