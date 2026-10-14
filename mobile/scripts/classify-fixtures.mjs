#!/usr/bin/env node
// voice-ok: the double hyphens below are npm's argument separator, not prose.
//
// Runs the SHIPPED classifier decision (lib/decision.ts, the same code the
// app runs after the JPEG decode) over real photos and prints one line per
// file. Two modes:
//
//   npm run fixtures                          corpus gate: every photo in
//                                             fixtures/photos/ is checked
//                                             against fixtures/expectations.json;
//                                             exits 1 on any miss
//   npm run fixtures -- <photo|folder> [...]  ad hoc: print the decision for
//                                             the given files (JPEG, or HEIC
//                                             on macOS via sips)
//
// Columns: result, rounded hue, raw hue, confidence, banana-colored share of
// the frame, median saturation of those pixels. Nothing is modified. Needs
// `node --import ./scripts/node-ts-resolver.mjs` (the npm script adds it).
import { readFileSync, readdirSync, statSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { decode } from 'jpeg-js';

import { classifyDecoded } from '../lib/decision.ts';
import { STAGES } from '../lib/stages.ts';

const ROOT = new URL('..', import.meta.url).pathname;
const CORPUS_DIR = join(ROOT, 'fixtures', 'photos');
const EXPECTATIONS = join(ROOT, 'fixtures', 'expectations.json');
/** A stage expectation passes within this many stages either side. */
const STAGE_TOLERANCE = 1;

const args = process.argv.slice(2);
const corpusMode = args.length === 0;

const files = corpusMode ? listPhotos(CORPUS_DIR) : expand(args);
if (files.length === 0) {
  console.error(
    corpusMode
      ? `no photos in ${CORPUS_DIR}; add one with: npm run fixtures:add -- <photo> <stage|not>`
      : 'no .jpg/.heic files found',
  );
  process.exit(corpusMode ? 0 : 2);
}

const expectations = corpusMode && existsSync(EXPECTATIONS)
  ? JSON.parse(readFileSync(EXPECTATIONS, 'utf8'))
  : {};

const pad = (s, n) => String(s).padEnd(n);
console.log(
  `${pad('file', 34)} ${pad('result', 26)} ${pad('hue', 4)} ${pad('raw', 6)} ${pad('conf', 5)} ${pad('frame', 6)} sat${corpusMode ? '    expected  ok' : ''}`,
);

let misses = 0;
const tmp = mkdtempSync(join(tmpdir(), 'gobananas-fixtures-'));
try {
  for (const f of files) {
    const r = classifyFile(f, tmp);
    const name = basename(f);
    if (!r) {
      console.log(`${pad(name, 34)} DECODE FAILED`);
      if (corpusMode) misses++;
      continue;
    }
    const label = describe(r);
    let tail = '';
    if (corpusMode) {
      const expected = expectations[name];
      const ok = matches(r, expected);
      if (ok === false) misses++;
      tail = `    ${pad(expected === undefined ? '(unlabeled)' : String(expected), 9)} ${ok === null ? '?' : ok ? 'ok' : 'MISS'}`;
    }
    console.log(
      `${pad(name, 34)} ${pad(label, 26)} ${pad(r.hue, 4)} ${pad(r.rawHue === null ? '-' : r.rawHue.toFixed(1), 6)} ${pad(r.confidence, 5)} ${pad((r.candidateFraction * 100).toFixed(1) + '%', 6)} ${r.satMedian === null ? '-' : r.satMedian.toFixed(2)}${tail}`,
    );
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (corpusMode) {
  const unlabeled = files.filter((f) => expectations[basename(f)] === undefined).length;
  console.log(
    `\n${files.length} photos, ${misses} miss${misses === 1 ? '' : 'es'}${unlabeled ? `, ${unlabeled} unlabeled` : ''}`,
  );
  if (misses > 0) process.exit(1);
}

/* ------------------------------------------------------------------ */

function describe(r) {
  if (r.demo) return 'UNREADABLE';
  if (r.verdict === 'not') return 'NOT A BANANA';
  const stage = `Stage ${r.stage} ${STAGES[r.stage].label}`;
  return r.verdict === 'unsure' ? `UNSURE (${stage})` : stage;
}

/** true / false, or null when there is no expectation for the file. */
function matches(r, expected) {
  if (expected === undefined) return null;
  if (expected === 'NOT_BANANA' || expected === 'not') return r.verdict === 'not';
  if (expected === 'UNSURE' || expected === 'unsure') return r.verdict === 'unsure';
  const stage = Number(expected);
  if (!Number.isInteger(stage)) return null;
  return r.verdict === 'banana' && Math.abs(r.stage - stage) <= STAGE_TOLERANCE;
}

function classifyFile(f, tmp) {
  let path = f;
  if (/\.heic$/i.test(f)) {
    // macOS only: sips converts HEIC. Downsize while we are at it.
    path = join(tmp, basename(f, extname(f)) + '.jpg');
    execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '90', '-Z', '1600', f, '--out', path], { stdio: 'ignore' });
  }
  try {
    const img = decode(readFileSync(path), { useTArray: true, tolerantDecoding: true });
    return classifyDecoded(img);
  } catch {
    return null;
  }
}

function listPhotos(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /\.jpe?g$/i.test(f))
    .sort()
    .map((f) => join(dir, f));
}

function expand(paths) {
  const out = [];
  for (const a of paths) {
    let st;
    try {
      st = statSync(a);
    } catch {
      console.error(`skip (not found): ${a}`);
      continue;
    }
    if (st.isDirectory()) {
      for (const f of readdirSync(a)) {
        if (/\.(jpe?g|heic)$/i.test(extname(f))) out.push(join(a, f));
      }
    } else {
      out.push(a);
    }
  }
  return out;
}
