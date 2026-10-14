// Classifier math, run with Node's built-in test runner: `npm test` from
// mobile/. No test framework installed; Node strips the TypeScript types
// when importing lib/hue.ts and lib/stages.ts directly (explicit .ts
// extension required). Both modules are import-free on purpose.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  readHue,
  looksLikeBanana,
  weightedMedian,
  rgbToHue,
  isLowSaturation,
  NOT_BANANA_MIN_FRACTION,
} from '../hue.ts';
import { hueToStage, stageConfidence, HUE_ROUNDING, STAGES } from '../stages.ts';

/* ------------------------------------------------------------------ */
/* Synthetic frames                                                    */
/* ------------------------------------------------------------------ */

/** Hue (deg) at full saturation and value → [r,g,b] 0-255. */
function hsvToRgb(h) {
  const c = 1;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Build a W x H RGBA frame. `paint(x, y)` returns a hue in degrees, or null
 * for a gray pixel.
 */
function frame(width, height, paint) {
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const h = paint(x, y);
      const [r, g, b] = h === null ? [128, 128, 128] : hsvToRgb(h);
      data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
    }
  }
  return { data, width, height };
}

const W = 200, H = 200, STEP = 10;
const inCenter = (x, y) => x >= 40 && x < 160 && y >= 40 && y < 160; // middle 60%
const read = (img) => readHue(img.data, img.width, img.height, { step: STEP });
const stageOf = (reading) => hueToStage(Math.round(reading.hue / HUE_ROUNDING) * HUE_ROUNDING);

const YELLOW = 47;  // Stage 5 after rounding to 45
const BROWN = 28;   // Stage 7
const WOOD = 30;    // a counter

/* ------------------------------------------------------------------ */
/* readHue: center weighting                                           */
/* ------------------------------------------------------------------ */

test('a centered yellow banana beats a wood counter filling the border', () => {
  const img = frame(W, H, (x, y) => (inCenter(x, y) ? YELLOW : WOOD));
  const r = read(img);
  // Border is 64% of the area at weight 1 (0.64), center 36% at weight 3 (1.08).
  assert.equal(stageOf(r), 5);
  assert.ok(looksLikeBanana(r));
});

test('the same frame with the plain median would have called the counter', () => {
  const img = frame(W, H, (x, y) => (inCenter(x, y) ? YELLOW : WOOD));
  const r = readHue(img.data, img.width, img.height, { step: STEP, centerWeight: 1 });
  assert.equal(stageOf(r), 7);
});

test('a brown banana in the center on a yellow cloth reads brown', () => {
  const img = frame(W, H, (x, y) => (inCenter(x, y) ? BROWN : YELLOW));
  assert.equal(stageOf(read(img)), 7);
});

test('an off-center banana still wins when the background is gray', () => {
  // Banana in the top-left corner, everything else gray (skipped).
  const img = frame(W, H, (x, y) => (x < 60 && y < 60 ? YELLOW : null));
  const r = read(img);
  assert.equal(stageOf(r), 5);
  assert.ok(r.fraction > NOT_BANANA_MIN_FRACTION);
  assert.ok(looksLikeBanana(r));
});

test('a sticker (small, intensely blue) cannot move the reading', () => {
  const img = frame(W, H, (x, y) =>
    x >= 90 && x < 110 && y >= 90 && y < 110 ? 230 : YELLOW,
  );
  assert.equal(stageOf(read(img)), 5);
});

/* ------------------------------------------------------------------ */
/* looksLikeBanana                                                     */
/* ------------------------------------------------------------------ */

test('an all-gray frame has no reading and is not a banana', () => {
  const r = read(frame(W, H, () => null));
  assert.equal(r.hue, null);
  assert.equal(r.candidates, 0);
  assert.equal(looksLikeBanana(r), false);
});

test('a blue sky is not a banana (every pixel filtered out)', () => {
  const r = read(frame(W, H, () => 215));
  assert.equal(r.candidates, 0);
  assert.equal(looksLikeBanana(r), false);
});

test('a tiny yellow speck under the 3% floor is not a banana', () => {
  // 2 x 2 sampled pixels of 400 = 1%.
  const img = frame(W, H, (x, y) => (x < 20 && y < 20 ? YELLOW : null));
  const r = read(img);
  assert.ok(r.fraction < NOT_BANANA_MIN_FRACTION, `fraction ${r.fraction}`);
  assert.equal(looksLikeBanana(r), false);
});

test('a pink wall is not a banana, and would never be Peak banana', () => {
  const r = read(frame(W, H, () => 350));
  assert.equal(looksLikeBanana(r), false);
  assert.notEqual(hueToStage(350), 6);
});

test('a teal scene is not a banana', () => {
  const r = read(frame(W, H, () => 150));
  assert.equal(looksLikeBanana(r), false);
});

/* ------------------------------------------------------------------ */
/* hueToStage: no fallthrough to Stage 6                               */
/* ------------------------------------------------------------------ */

test('every hue on the 5° grid maps to its nearest band, never a fallthrough', () => {
  for (let h = 0; h < 360; h += 5) {
    const s = hueToStage(h);
    assert.ok(s >= 1 && s <= 7, `hue ${h} -> ${s}`);
  }
  assert.equal(hueToStage(145), 1);
  assert.equal(hueToStage(155), 1);
  assert.equal(hueToStage(345), 7);
  assert.equal(hueToStage(355), 7);
  assert.equal(hueToStage(40), 6);
  assert.equal(hueToStage(45), 5);
  assert.equal(hueToStage(110), 1);
});

/* ------------------------------------------------------------------ */
/* stageConfidence                                                     */
/* ------------------------------------------------------------------ */

test('confidence is high in the middle of a band and low at its edge', () => {
  // Stage 4 nominal [50,60) is raw [47.5, 57.5) after rounding; center 52.5.
  assert.equal(stageConfidence(52.5, 4), 100);
  assert.ok(stageConfidence(47.6, 4) < 10);
  assert.ok(stageConfidence(57.4, 4) < 10);
});

test('the one-sided bands are confident deep into the open side', () => {
  assert.equal(stageConfidence(110, 1), 100); // deep green
  assert.equal(stageConfidence(135, 1), 100);
  assert.equal(stageConfidence(5, 7), 100); // deep brown
  assert.equal(stageConfidence(350, 7), 100); // magenta-side survivor
  assert.ok(stageConfidence(80, 1) < 20);
  assert.ok(stageConfidence(37, 7) < 20);
});

test('the 5° bands no longer print a constant', () => {
  const vals = [40, 41, 42.4].map((h) => stageConfidence(h, 6));
  assert.ok(new Set(vals).size > 1, vals.join(','));
  for (const v of vals) assert.ok(v >= 0 && v <= 100);
});

test('the raw-vs-rounded boundary case scores low, not high', () => {
  // Raw 43 rounds to 45 (Stage 5) but sits 0.5° past the raw boundary 42.5.
  assert.equal(hueToStage(Math.round(43 / HUE_ROUNDING) * HUE_ROUNDING), 5);
  assert.ok(stageConfidence(43, 5) < 25);
});

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

test('weightedMedian weights the center votes', () => {
  assert.equal(weightedMedian([10, 20, 30], [1, 1, 1]), 20);
  assert.equal(weightedMedian([10, 20, 30], [5, 1, 1]), 10);
  assert.equal(weightedMedian([30, 10, 20], [1, 1, 5]), 20);
});

test('rgbToHue and isLowSaturation behave', () => {
  assert.equal(Math.round(rgbToHue(1, 0, 0)), 0);
  assert.equal(Math.round(rgbToHue(1, 1, 0)), 60);
  assert.equal(Math.round(rgbToHue(0, 1, 0)), 120);
  assert.equal(isLowSaturation(0.5, 0.5, 0.5), true);
  assert.equal(isLowSaturation(1, 0.9, 0.2), false);
  assert.equal(isLowSaturation(0, 0, 0), true);
});

test('STAGES bands tile 0-140 with no gaps', () => {
  const bands = Object.values(STAGES).map((d) => d.hue).sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < bands.length; i++) {
    assert.equal(bands[i][0], bands[i - 1][1], `gap between ${bands[i - 1]} and ${bands[i]}`);
  }
});
