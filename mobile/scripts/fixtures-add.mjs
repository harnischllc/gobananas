#!/usr/bin/env node
// voice-ok: the double hyphens below are npm's argument separator, not prose.
//
// Add a real photo to the classifier's regression corpus with its label.
//
//   npm run fixtures:add -- ~/Downloads/IMG_7340.HEIC 5
//   npm run fixtures:add -- ~/Downloads/IMG_7341.jpg not
//   npm run fixtures:add -- ~/Downloads/IMG_7342.HEIC unsure
//
// Label: a stage 1-7 (what the banana actually was), `not` (nothing banana
// in the frame), or `unsure` (the app should ask). The photo is converted
// (HEIC via sips on macOS), shrunk to 800 px on the long side, and
// re-encoded with jpeg-js, which drops EXIF including GPS, before it lands
// in fixtures/photos/. Then the whole corpus gate runs so you see at once
// whether the shipped thresholds already get it right.
import { readFileSync, writeFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, copyFileSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { decode, encode } from 'jpeg-js';

const ROOT = new URL('..', import.meta.url).pathname;
const CORPUS_DIR = join(ROOT, 'fixtures', 'photos');
const EXPECTATIONS = join(ROOT, 'fixtures', 'expectations.json');

const [src, labelArg] = process.argv.slice(2);
if (!src || !labelArg) {
  console.error('usage: npm run fixtures:add -- <photo.heic|jpg> <1-7|not|unsure>');
  process.exit(2);
}
if (!existsSync(src)) {
  console.error(`not found: ${src}`);
  process.exit(2);
}
const label = parseLabel(labelArg);
if (label === null) {
  console.error(`label must be a stage 1-7, "not" or "unsure"; got "${labelArg}"`);
  process.exit(2);
}

mkdirSync(CORPUS_DIR, { recursive: true });
const tmp = mkdtempSync(join(tmpdir(), 'gobananas-add-'));
try {
  // 1. Get a JPEG at <= 800 px (sips handles HEIC and the resize on macOS).
  const stem = basename(src, extname(src)).replace(/[^A-Za-z0-9_-]+/g, '_');
  const small = join(tmp, stem + '.jpg');
  const sips = spawnSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '92', '-Z', '800', src, '--out', small], { stdio: 'ignore' });
  if (sips.status !== 0) {
    if (/\.jpe?g$/i.test(src)) copyFileSync(src, small);
    else {
      console.error('could not convert (sips failed and the file is not a JPEG)');
      process.exit(1);
    }
  }
  // 2. Re-encode through jpeg-js: strips every metadata segment (EXIF, GPS).
  const img = decode(readFileSync(small), { useTArray: true, tolerantDecoding: true });
  const clean = encode({ data: img.data, width: img.width, height: img.height }, 88).data;
  let dest = join(CORPUS_DIR, stem + '.jpg');
  let n = 2;
  while (existsSync(dest)) dest = join(CORPUS_DIR, `${stem}-${n++}.jpg`);
  writeFileSync(dest, clean);

  // 3. Record the expectation.
  const expectations = existsSync(EXPECTATIONS) ? JSON.parse(readFileSync(EXPECTATIONS, 'utf8')) : {};
  expectations[basename(dest)] = label;
  writeFileSync(EXPECTATIONS, JSON.stringify(expectations, null, 2) + '\n');
  console.log(`added ${basename(dest)} (${img.width}x${img.height}) as ${label}\n`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

// 4. Run the gate so the verdict on this photo is visible right away.
execFileSync('node', ['--import', './scripts/node-ts-resolver.mjs', 'scripts/classify-fixtures.mjs'], {
  cwd: ROOT,
  stdio: 'inherit',
});

function parseLabel(s) {
  const t = String(s).trim().toLowerCase();
  if (t === 'not' || t === 'not_banana' || t === 'no') return 'NOT_BANANA';
  if (t === 'unsure') return 'UNSURE';
  const n = Number(t);
  return Number.isInteger(n) && n >= 1 && n <= 7 ? n : null;
}
