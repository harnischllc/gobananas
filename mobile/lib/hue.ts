/**
 * Pixel math for the banana classifier. Pure functions over a decoded RGBA
 * buffer, no imports, so `node --test` can exercise it with zero installs
 * (see lib/__tests__/hue.test.mjs). lib/classify.ts owns the file read and
 * the JPEG decode; lib/decision.ts turns a reading into a result.
 *
 * Every threshold here is a shipped constant. Rule (2026-10-14, after a
 * white keyboard was called Stage 4): no constant below changes unless
 * `npm run fixtures` passes on the committed real-photo corpus in
 * mobile/fixtures/, and every misread photo enters that corpus with its
 * label before the fix is written.
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
 * Saturation floor for a pixel to count as banana-colored, as (max-min)/max.
 *
 * Why 0.30 and not 0.10: a neutral white or gray surface under warm bulbs
 * keeps a 10-15% warm cast after auto white balance, which is a faint
 * yellow (hue ~55) at saturation 0.10-0.15. At the old 0.10 floor a white
 * Apple keyboard put 26% of its pixels through as banana-colored and read as
 * Stage 4. Measured on that photo: 25.9% of pixels pass at 0.10, 1.0% at
 * 0.20, 0.2% at 0.30. Banana peel, green through brown, sits at saturation
 * 0.4-0.75 (median ~0.6), so the floor costs bananas almost nothing: the six
 * reference bananas lose 2-6 points of candidate share between 0.10 and
 * 0.40. Saturation is brightness-free, so a dim banana keeps its number.
 */
export const DEFAULT_MIN_SATURATION = 0.3;

/**
 * Brightness (max channel) floor. Only drops near-black noise, where hue is
 * meaningless; a dim banana sits at 0.14-0.30 and clears it.
 */
export const DEFAULT_MIN_VALUE = 0.12;

/**
 * Below this share of sampled pixels passing the filters, there is nothing
 * banana-colored in the frame worth reading. A banana covering 5% of the
 * frame clears it. Kept at 3% on purpose: raising it is what would reject a
 * small or blown-out banana (see UNSURE_MAX_FRACTION for the hedge instead).
 */
export const NOT_BANANA_MIN_FRACTION = 0.03;

/**
 * The "unsure" band. A frame whose banana-colored share is under this, or
 * whose candidates are only weakly saturated (UNSURE_MAX_SAT_MEDIAN), is
 * where stressed real bananas land (blown out by a window, a strong warm
 * cast) and where a surface that barely clears the floor lands. The app
 * asks instead of guessing.
 */
export const UNSURE_MAX_FRACTION = 0.06;
export const UNSURE_MAX_SAT_MEDIAN = 0.4;

export type BananaVerdict = 'banana' | 'unsure' | 'not';

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
  /** (max-min)/max below this is not banana-colored. */
  minSaturation?: number;
  /** max channel below this is too dark to read. */
  minValue?: number;
}

export interface HueReading {
  /**
   * Center-weighted median hue (0-360) of the banana-candidate pixels, or
   * null when no pixel passed the filters.
   */
  hue: number | null;
  /** Pixels visited. */
  sampled: number;
  /** Pixels that passed the saturation, brightness and hue filters. */
  candidates: number;
  /** candidates / sampled, unweighted. 0 when nothing was sampled. */
  fraction: number;
  /** Median saturation of the candidate pixels (0-1), or null when none. */
  satMedian: number | null;
  /** 10th-percentile saturation of the candidate pixels, or null when none. */
  satP10: number | null;
}

export const DEFAULT_CENTER_FRACTION = 0.6;
export const DEFAULT_CENTER_WEIGHT = 3;

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
  const minValue = opts.minValue ?? DEFAULT_MIN_VALUE;

  const cx0 = (width * (1 - centerFraction)) / 2;
  const cx1 = width - cx0;
  const cy0 = (height * (1 - centerFraction)) / 2;
  const cy1 = height - cy0;

  const hues: number[] = [];
  const weights: number[] = [];
  const sats: number[] = [];
  let sampled = 0;

  for (let y = 0; y < height; y += step) {
    const inCenterY = y >= cy0 && y < cy1;
    for (let x = 0; x < width; x += step) {
      sampled++;
      const i = (y * width + x) * 4;
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;

      const max = Math.max(r, g, b);
      if (max < minValue) continue;
      const sat = saturationOf(r, g, b);
      if (sat < minSaturation) continue;

      const hue = rgbToHue(r, g, b);
      if (!isBananaCandidateHue(hue)) continue;

      hues.push(hue);
      sats.push(sat);
      weights.push(inCenterY && x >= cx0 && x < cx1 ? centerWeight : 1);
    }
  }

  const candidates = hues.length;
  const fraction = sampled === 0 ? 0 : candidates / sampled;
  if (candidates === 0) {
    return { hue: null, sampled, candidates, fraction, satMedian: null, satP10: null };
  }
  sats.sort((a, b) => a - b);
  return {
    hue: weightedMedian(hues, weights),
    sampled,
    candidates,
    fraction,
    satMedian: sats[sats.length >> 1],
    satP10: sats[Math.floor(0.1 * (sats.length - 1))],
  };
}

/**
 * Three-way call on a reading.
 *   'not'    nothing banana-colored, or a color no banana shows (teal, magenta)
 *   'unsure' barely enough, or only weakly saturated: the app asks the user
 *   'banana' read it as a banana
 * Honest limits: anything genuinely yellow-to-brown with real saturation
 * (a lemon, a wooden desk, skin, a yellow Lab) still reads as a banana. This
 * is a "nothing banana-colored here" check, not a banana recognizer.
 */
export function bananaVerdict(reading: HueReading): BananaVerdict {
  if (reading.hue === null) return 'not';
  if (reading.fraction < NOT_BANANA_MIN_FRACTION) return 'not';
  if (reading.hue >= BANANA_HUE_MAX && reading.hue <= EXCLUDED_HUE_MAX) {
    return 'not';
  }
  if (reading.hue > EXCLUDED_HUE_MAX) return 'not'; // magenta survivors
  if (reading.fraction < UNSURE_MAX_FRACTION) return 'unsure';
  if (reading.satMedian !== null && reading.satMedian < UNSURE_MAX_SAT_MEDIAN) {
    return 'unsure';
  }
  return 'banana';
}

/** Kept for callers that only need a yes/no; 'unsure' counts as no. */
export function looksLikeBanana(reading: HueReading): boolean {
  return bananaVerdict(reading) === 'banana';
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

/** HSV saturation, (max-min)/max, 0 for black. */
export function saturationOf(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) return 0;
  return (max - min) / max;
}

/**
 * Pixels with low saturation are gray-ish (background, shadow, white wall,
 * a warm-lit white keyboard). Skipped so the reading reflects banana color.
 */
export function isLowSaturation(
  r: number,
  g: number,
  b: number,
  minSaturation: number = DEFAULT_MIN_SATURATION,
): boolean {
  return saturationOf(r, g, b) < minSaturation;
}
