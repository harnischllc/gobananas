#!/usr/bin/env node
// voice-ok: the double hyphens below are npm's argument separator, not prose.
//
// Run the shipped classifier decision over real JPEGs and print one line per
// file. This is the real validation for lib/hue.ts changes: the unit tests
// use synthetic frames, this uses your phone photos.
//
//   npm run fixtures -- ~/Pictures/bananas/*.jpg
//   npm run fixtures -- ~/Pictures/bananas            (a folder; one level)
//
// Prints: stage (or NOT A BANANA), rounded hue, raw hue, confidence, and the
// share of sampled pixels that looked banana-colored. No files are modified.
// Uses jpeg-js (already a dependency) and Node's TypeScript type stripping,
// so there is nothing to install.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { decode } from 'jpeg-js';

// lib/classify.ts imports expo-file-system, which Node cannot load, so the
// decision is mirrored here from classifyReading() in that file. Keep the two
// in step: round to HUE_ROUNDING, map, score from the raw hue.
import { readHue, looksLikeBanana } from '../lib/hue.ts';
import { STAGES, HUE_ROUNDING, hueToStage, stageConfidence } from '../lib/stages.ts';

const SAMPLE_RATE = 10;
const MAX_DIMENSION = 800;
function sampleStep(width, height) {
  const longSide = Math.max(width, height);
  return SAMPLE_RATE * (longSide > MAX_DIMENSION ? Math.ceil(longSide / MAX_DIMENSION) : 1);
}
function classifyReading(reading) {
  if (!looksLikeBanana(reading)) {
    return { notBanana: true, stage: 3, hue: 60, rawHue: reading.hue, confidence: 0, candidateFraction: reading.fraction };
  }
  const rawHue = reading.hue;
  const hue = Math.round(rawHue / HUE_ROUNDING) * HUE_ROUNDING;
  const stage = hueToStage(hue);
  return { notBanana: false, stage, hue, rawHue, confidence: stageConfidence(rawHue, stage), candidateFraction: reading.fraction };
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('usage: npm run fixtures -- <photo.jpg | folder> [...]');
  process.exit(2);
}

const files = [];
for (const a of args) {
  let st;
  try {
    st = statSync(a);
  } catch {
    console.error(`skip (not found): ${a}`);
    continue;
  }
  if (st.isDirectory()) {
    for (const f of readdirSync(a)) {
      if (/\.jpe?g$/i.test(extname(f))) files.push(join(a, f));
    }
  } else {
    files.push(a);
  }
}

if (files.length === 0) {
  console.error('no .jpg files found');
  process.exit(2);
}

const pad = (s, n) => String(s).padEnd(n);
console.log(
  `${pad('file', 36)} ${pad('result', 28)} ${pad('hue', 5)} ${pad('raw', 7)} ${pad('conf', 5)} frac`,
);
for (const f of files) {
  let img;
  try {
    img = decode(readFileSync(f), { useTArray: true, tolerantDecoding: true });
  } catch (err) {
    console.log(`${pad(basename(f), 36)} DECODE FAILED (${err.message})`);
    continue;
  }
  const reading = readHue(img.data, img.width, img.height, {
    step: sampleStep(img.width, img.height),
  });
  const r = classifyReading(reading);
  const label = r.notBanana
    ? 'NOT A BANANA'
    : `Stage ${r.stage} ${STAGES[r.stage].label}`;
  console.log(
    `${pad(basename(f), 36)} ${pad(label, 28)} ${pad(r.hue, 5)} ${pad(
      r.rawHue === null ? '-' : r.rawHue.toFixed(1),
      7,
    )} ${pad(r.confidence, 5)} ${(r.candidateFraction * 100).toFixed(1)}%`,
  );
}
