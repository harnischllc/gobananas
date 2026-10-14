/**
 * Pixel math for the banana classifier. Pure functions over a decoded RGBA
 * buffer, no imports, so `node --test` can exercise it with zero installs
 * (see lib/__tests__/hue.test.mjs). lib/classify.ts owns the file read and
 * the JPEG decode and calls readHue() with the result.
 */

/** Hues no banana ever shows: cyan through magenta. Inclusive bounds. */
export const EXCLUDED_HUE_MIN = 160;
export const EXCLUDED_HUE_MAX = 340;

/**
 * Deepest green we still call a banana. Survivors at or above this (teal,
 * blue-green) are a wall or a plant, not fruit. Stage 1's nominal band ends
 * at 140; the gap up to here is still mapped to Stage 1 by hueToStage.
 */
export const BANANA_HUE_MAX = 145;

/**
 * Below this share of sampled pixels passing the saturation + hue filters,
 * there is nothing banana-colored in the frame worth reading. At the default
 * step a 4000x3000 photo samples ~4800 pixels, so this is ~144 of them; a
 * banana covering 5% of the frame clears it comfortably.
 */
export const NOT_BANANA_MIN_FRACTION = 0.03;

export interface HueReadOptions {
  /** Sample every Nth pixel on each axis. */
  step: number;
  /**
   * Fraction of each axis that counts as "center". 0.6 means the middle 60%
   * of width and of height (36% of the area). Pixels there get centerWeight.
   */
  centerFraction?: number;
  /** Weight for center pixels; everything else weighs 1. */
  centerWeight?: number;
  /** (max-min)/max below this is gray-ish and skipped. */
  minSaturation?: number;
}

export interface HueReading {
  /**
   * Center-weighted median hue (0-360) of the banana-candidate pixels, or
   * null when no pixel passed the filters.
   */
  hue: number | null;
  /** Pixels visited. */
  sampled: number;
  /** Pixels that passed the saturation and hue filters. */
  candidates: number;
  /** candidates / sampled, unweighted. 0 when nothing was sampled. */
  fraction: number;
}

export const DEFAULT_CENTER_FRACTION = 0.6;
export const DEFAULT_CENTER_WEIGHT = 3;
export const DEFAULT_MIN_SATURATION = 0.1;

/**
 * Read the dominant banana hue from an RGBA buffer.
 *
 * Why a weighted median: the plain median (shipped in build 14) defeats a
 * minority patch like a fruit sticker, but a surface covering more than half
 * the saturated pixels (a wood counter at 20-35°, a green cloth) becomes the
 * answer. People center the banana, so pixels in the middle of the frame
 * get extra votes. A centered banana now beats a counter that fills the
 * whole border; an off-center banana still votes.
 */
export function readHue(
  data: ArrayLike<number>,
  width: number,
  height: number,
  opts: HueReadOptions,
): HueReading {
  const step = Math.max(1, Math.floor(opts.step));
  const centerFraction = opts.centerFraction ?? DEFAULT_CENTER_FRACTION;
  const centerWeight = opts.centerWeight ?? DEFAULT_CENTER_WEIGHT;
  const minSaturation = opts.minSaturation ?? DEFAULT_MIN_SATURATION;

  const cx0 = (width * (1 - centerFraction)) / 2;
  const cx1 = width - cx0;
  const cy0 = (height * (1 - centerFraction)) / 2;
  const cy1 = height - cy0;

  const hues: number[] = [];
  const weights: number[] = [];
  let sampled = 0;

  for (let y = 0; y < height; y += step) {
    const inCenterY = y >= cy0 && y < cy1;
    for (let x = 0; x < width; x += step) {
      sampled++;
      const i = (y * width + x) * 4;
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;

      if (isLowSaturation(r, g, b, minSaturation)) continue;

      const hue = rgbToHue(r, g, b);
      if (!isBananaCandidateHue(hue)) continue;

      hues.push(hue);
      weights.push(inCenterY && x >= cx0 && x < cx1 ? centerWeight : 1);
    }
  }

  const candidates = hues.length;
  const fraction = sampled === 0 ? 0 : candidates / sampled;
  if (candidates === 0) {
    return { hue: null, sampled, candidates, fraction };
  }
  return { hue: weightedMedian(hues, weights), sampled, candidates, fraction };
}

/**
 * Not-a-banana rule. True when the frame had almost nothing banana-colored
 * in it, or when what it had is a color no banana shows (teal, magenta).
 * Honest limits: a wooden table reads as brown and a red apple as Stage 7;
 * neither trips this. It catches walls, desks, sky, screens, and the dog.
 */
export function looksLikeBanana(reading: HueReading): boolean {
  if (reading.hue === null) return false;
  if (reading.fraction < NOT_BANANA_MIN_FRACTION) return false;
  if (reading.hue >= BANANA_HUE_MAX && reading.hue <= EXCLUDED_HUE_MAX) {
    return false;
  }
  if (reading.hue > EXCLUDED_HUE_MAX) return false; // magenta survivors
  return true;
}

export function isBananaCandidateHue(hue: number): boolean {
  return hue < EXCLUDED_HUE_MIN || hue > EXCLUDED_HUE_MAX;
}

/** Weighted median: the hue where cumulative weight first reaches half. */
export function weightedMedian(hues: number[], weights: number[]): number {
  const order = hues.map((_, i) => i).sort((a, b) => hues[a] - hues[b]);
  let total = 0;
  for (const w of weights) total += w;
  const half = total / 2;
  let acc = 0;
  for (const i of order) {
    acc += weights[i];
    if (acc >= half) return hues[i];
  }
  return hues[order[order.length - 1]];
}

/** RGB (0-1) to hue in degrees (0-360). Standard HSV conversion. */
export function rgbToHue(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return h;
}

/**
 * Pixels with very low saturation are gray-ish (background, shadow, white
 * wall). Skipped so the reading reflects banana color, not the room.
 */
export function isLowSaturation(
  r: number,
  g: number,
  b: number,
  minSaturation: number = DEFAULT_MIN_SATURATION,
): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) return true;
  return (max - min) / max < minSaturation;
}
