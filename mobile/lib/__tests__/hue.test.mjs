// Classifier math, run with Node's built-in test runner: `npm test` from
// mobile/. No test framework installed; Node strips the TypeScript types
// (scripts/node-ts-resolver.mjs resolves the extensionless imports).
//
// Frames here are painted with REAL-WORLD saturation and brightness. The
// first version of this file painted everything at saturation 1.0, so the
// 0.10 candidate floor was never exercised near the values a camera
// produces, and a white keyboard under warm light (saturation 0.10-0.15,
// hue 55) sailed through as Stage 4. Every threshold test below is written
// against the exported constants, so renumbering keeps them meaningful.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  readHue,
  bananaVerdict,
  looksLikeBanana,
  weightedMedian,
  rgbToHue,
  isLowSaturation,
  DEFAULT_MIN_SATURATION,
  NOT_BANANA_MIN_FRACTION,
  UNSURE_MAX_FRACTION,
  UNSURE_MAX_SAT_MEDIAN,
} from '../hue.ts';
import { hueToStage, stageConfidence, HUE_ROUNDING, STAGES } from '../stages.ts';
import { classifyReading, classifyDecoded } from '../decision.ts';

/* ------------------------------------------------------------------ */
/* Synthetic frames                                                    */
/* ------------------------------------------------------------------ */

/** HSV (h deg, s 0-1, v 0-1) → [r,g,b] 0-255. */
function hsvToRgb(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

/**
 * Build a W x H RGBA frame. `paint(x, y)` returns {h, s, v} or null for a
 * neutral mid-gray pixel.
 */
function frame(width, height, paint) {
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const p = paint(x, y);
      const [r, g, b] = p === null ? [128, 128, 128] : hsvToRgb(p.h, p.s, p.v);
      data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
    }
  }
  return { data, width, height };
}

const W = 200, H = 200, STEP = 10;
const inCenter = (x, y) => x >= 40 && x < 160 && y >= 40 && y < 160; // middle 60%
const read = (img) => readHue(img.data, img.width, img.height, { step: STEP });
const stageOf = (reading) => hueToStage(Math.round(reading.hue / HUE_ROUNDING) * HUE_ROUNDING);

// Real-world colors, from measured photos and the six-banana reference image.
const RIPE = { h: 47, s: 0.6, v: 0.85 };       // Stage 5 after rounding to 45
const GREEN = { h: 95, s: 0.5, v: 0.6 };       // Stage 1
const BROWN = { h: 28, s: 0.55, v: 0.45 };     // Stage 7
const WOOD = { h: 30, s: 0.45, v: 0.5 };       // a counter, really brown
const KEYBOARD = { h: 55, s: 0.12, v: 0.9 };   // white keys under warm bulbs (measured: s 0.10-0.15)
const WARM_WHITE_WALL = { h: 55, s: 0.2, v: 0.95 };
const DIM = { h: 47, s: 0.55, v: 0.25 };       // kitchen at night
const BLOWN = { h: 50, s: 0.35, v: 1.0 };      // by a window, highlights clipping

/* ------------------------------------------------------------------ */
/* The keyboard, and warm neutral scenes in general                    */
/* ------------------------------------------------------------------ */

test('a white keyboard under warm bulbs is not a banana', () => {
  const r = read(frame(W, H, () => KEYBOARD));
  assert.equal(bananaVerdict(r), 'not');
  assert.ok(r.fraction < NOT_BANANA_MIN_FRACTION, `fraction ${r.fraction}`);
});

test('the keyboard would have passed the old 0.10 floor (regression guard on the constant)', () => {
  const r = readHue(frame(W, H, () => KEYBOARD).data, W, H, { step: STEP, minSaturation: 0.1 });
  assert.ok(r.fraction > 0.9, 'at a 0.10 floor the whole keyboard counts as banana-colored');
  assert.ok(DEFAULT_MIN_SATURATION >= 0.25, 'the shipped floor must stay above the warm-cast band');
});

test('a warm-white wall at saturation 0.2 is not a banana', () => {
  assert.equal(bananaVerdict(read(frame(W, H, () => WARM_WHITE_WALL))), 'not');
});

test('a banana on a warm-lit white counter reads the banana, not the counter', () => {
  const img = frame(W, H, (x, y) => (inCenter(x, y) ? RIPE : WARM_WHITE_WALL));
  const r = read(img);
  assert.equal(bananaVerdict(r), 'banana');
  assert.equal(stageOf(r), 5);
});

test('a saturated pixel just under the floor is dropped, just over is kept', () => {
  const under = { h: 47, s: DEFAULT_MIN_SATURATION - 0.05, v: 0.9 };
  const over = { h: 47, s: DEFAULT_MIN_SATURATION + 0.05, v: 0.9 };
  assert.equal(read(frame(W, H, () => under)).candidates, 0);
  assert.ok(read(frame(W, H, () => over)).candidates > 0);
});

/* ------------------------------------------------------------------ */
/* Real bananas keep passing                                           */
/* ------------------------------------------------------------------ */

test('ripe, green and brown bananas on gray all read as bananas at the right stage', () => {
  for (const [paint, stage] of [[RIPE, 5], [GREEN, 1], [BROWN, 7]]) {
    const r = read(frame(W, H, (x, y) => (inCenter(x, y) ? paint : null)));
    assert.equal(bananaVerdict(r), 'banana', `verdict for ${JSON.stringify(paint)}`);
    assert.equal(stageOf(r), stage);
    assert.ok(r.satMedian >= UNSURE_MAX_SAT_MEDIAN, `satMedian ${r.satMedian}`);
  }
});

test('a dim banana (kitchen at night) still reads as a banana', () => {
  const r = read(frame(W, H, (x, y) => (inCenter(x, y) ? DIM : null)));
  assert.equal(bananaVerdict(r), 'banana');
  assert.equal(stageOf(r), 5);
});

test('a small banana at 5% of the frame still reads as a banana', () => {
  // 5% of 400 samples = 20 pixels: a 5x4 block of sample points.
  const img = frame(W, H, (x, y) => (x >= 80 && x < 130 && y >= 80 && y < 120 ? RIPE : null));
  const r = read(img);
  assert.ok(r.fraction >= NOT_BANANA_MIN_FRACTION, `fraction ${r.fraction}`);
  assert.notEqual(bananaVerdict(r), 'not');
});

test('a centered ripe banana beats a wood counter filling the border', () => {
  const img = frame(W, H, (x, y) => (inCenter(x, y) ? RIPE : WOOD));
  const r = read(img);
  assert.equal(stageOf(r), 5);
  assert.equal(bananaVerdict(r), 'banana');
});

test('the same frame with the plain median would have called the counter', () => {
  const img = frame(W, H, (x, y) => (inCenter(x, y) ? RIPE : WOOD));
  const r = readHue(img.data, W, H, { step: STEP, centerWeight: 1 });
  assert.equal(stageOf(r), 7);
});

test('a sticker (small, intensely blue) cannot move the reading', () => {
  const img = frame(W, H, (x, y) =>
    x >= 90 && x < 110 && y >= 90 && y < 110 ? { h: 230, s: 0.9, v: 0.9 } : RIPE,
  );
  assert.equal(stageOf(read(img)), 5);
});

/* ------------------------------------------------------------------ */
/* The unsure band                                                     */
/* ------------------------------------------------------------------ */

test('a blown-out banana by a window lands in unsure, not in not-a-banana', () => {
  const r = read(frame(W, H, (x, y) => (inCenter(x, y) ? BLOWN : null)));
  assert.equal(bananaVerdict(r), 'unsure');
  // The stage is still computed so a "yes it is" answer needs no second pass.
  const result = classifyReading(r);
  assert.equal(result.verdict, 'unsure');
  assert.equal(result.notBanana, false);
  assert.ok(result.stage >= 1 && result.stage <= 7);
});

test('a banana covering only 4% of the frame lands in unsure', () => {
  // 16 of 400 sample points.
  const img = frame(W, H, (x, y) => (x >= 80 && x < 120 && y >= 80 && y < 120 ? RIPE : null));
  const r = read(img);
  assert.ok(r.fraction >= NOT_BANANA_MIN_FRACTION && r.fraction < UNSURE_MAX_FRACTION, `fraction ${r.fraction}`);
  assert.equal(bananaVerdict(r), 'unsure');
});

test('looksLikeBanana is strict: unsure counts as no', () => {
  const r = read(frame(W, H, (x, y) => (inCenter(x, y) ? BLOWN : null)));
  assert.equal(looksLikeBanana(r), false);
});

/* ------------------------------------------------------------------ */
/* Not a banana                                                        */
/* ------------------------------------------------------------------ */

test('an all-gray frame has no reading and is not a banana', () => {
  const r = read(frame(W, H, () => null));
  assert.equal(r.hue, null);
  assert.equal(r.candidates, 0);
  assert.equal(bananaVerdict(r), 'not');
});

test('a blue sky is not a banana (every pixel filtered out)', () => {
  const r = read(frame(W, H, () => ({ h: 215, s: 0.6, v: 0.9 })));
  assert.equal(r.candidates, 0);
  assert.equal(bananaVerdict(r), 'not');
});

test('a tiny yellow speck under the 3% floor is not a banana', () => {
  // 2 x 2 sampled pixels of 400 = 1%.
  const img = frame(W, H, (x, y) => (x < 20 && y < 20 ? RIPE : null));
  const r = read(img);
  assert.ok(r.fraction < NOT_BANANA_MIN_FRACTION, `fraction ${r.fraction}`);
  assert.equal(bananaVerdict(r), 'not');
});

test('a pink wall is not a banana, and would never be Peak banana', () => {
  const r = read(frame(W, H, () => ({ h: 350, s: 0.5, v: 0.9 })));
  assert.equal(bananaVerdict(r), 'not');
  assert.notEqual(hueToStage(350), 6);
});

test('a teal scene is not a banana', () => {
  assert.equal(bananaVerdict(read(frame(W, H, () => ({ h: 150, s: 0.5, v: 0.7 })))), 'not');
});

test('near-black noise does not count (brightness floor)', () => {
  const r = read(frame(W, H, () => ({ h: 47, s: 0.8, v: 0.05 })));
  assert.equal(r.candidates, 0);
});

test('classifyDecoded on a not-a-banana frame returns the flag and no fake confidence', () => {
  const result = classifyDecoded(frame(W, H, () => KEYBOARD));
  assert.equal(result.verdict, 'not');
  assert.equal(result.notBanana, true);
  assert.equal(result.confidence, 0);
  assert.equal(result.demo, false);
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
  assert.equal(isLowSaturation(1, 0.9, 0.88), true, 'a 12% warm cast on white is low saturation');
});

test('STAGES bands tile 0-140 with no gaps', () => {
  const bands = Object.values(STAGES).map((d) => d.hue).sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < bands.length; i++) {
    assert.equal(bands[i][0], bands[i - 1][1], `gap between ${bands[i - 1]} and ${bands[i]}`);
  }
});
