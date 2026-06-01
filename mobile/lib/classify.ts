/**
 * Banana ripeness classifier — direct port of the Flask app's
 * `utils/color_detection.py` algorithm. Same logic, just JS:
 *
 *   1. Read the captured JPEG as bytes
 *   2. Decode to RGB pixels (jpeg-js, pure JS — works in Expo Go)
 *   3. Sample every Nth pixel for speed (matches Python's sample_rate)
 *   4. Convert each sampled RGB → HSV
 *   5. Take the MEDIAN hue of the saturated pixels (robust to sticker/glare)
 *   6. Map that hue to a stage via `hueToStage()` in lib/stages.ts
 *   7. Score confidence by how tightly the dominant hue sits inside its band
 *
 * The reference implementation is at utils/color_detection.py
 * (extract_dominant_color + calculate_stage_confidence). Same constants,
 * same buckets, same defaults.
 */

// Use the legacy import path; the new modular API doesn't expose
// readAsStringAsync the same way and isn't fully wired in SDK 54.
import * as FileSystem from 'expo-file-system/legacy';
import { decode as decodeJpeg } from 'jpeg-js';
import { Stage, hueToStage, STAGES } from './stages';

export interface ClassifyResult {
  stage: Stage;
  hue: number;
  confidence: number; // 0–100
  /** True if the result came from a fallback (decode failed). */
  demo: boolean;
}

// Sample every Nth pixel — matches the Python default. Higher = faster,
// less accurate. Tuned for ~250–500ms on a recent phone.
const SAMPLE_RATE = 10;

// Largest image dimension we'll bother decoding. Bigger = slower with
// no real accuracy gain. iOS camera shots come in around 3000–4000px;
// downscaling happens at the expo-image-picker layer (`quality: 0.7`)
// but we still cap here as a safety net.
const MAX_DIMENSION = 800;

/**
 * Classify a banana image at the given local URI.
 *
 * @param uri Local file URI from expo-image-picker (file:// or content://).
 */
export async function classifyImage(uri: string): Promise<ClassifyResult> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const bytes = base64ToUint8Array(base64);
    // useTArray=true returns a faster Uint8Array; tolerantDecoding=true
    // accepts slightly malformed JPEGs from various cameras.
    const decoded = decodeJpeg(bytes, { useTArray: true, tolerantDecoding: true });
    const hue = extractDominantHue(decoded);
    const stage = hueToStage(hue);
    const confidence = calculateStageConfidence(hue, stage);
    return { stage, hue, confidence, demo: false };
  } catch (err) {
    // Fall back to a neutral mid-yellow result so the UX still completes.
    // The DEMO chip is gone in production; this only fires on truly broken
    // image data, which should be rare. Worth logging for diagnostics.
    console.warn('classifyImage failed:', err);
    return { stage: 4, hue: 35, confidence: 50, demo: true };
  }
}

interface DecodedImage {
  width: number;
  height: number;
  data: Uint8Array | Uint8ClampedArray;
}

/**
 * Sample pixels, convert each to HSV, and return the MEDIAN hue of the
 * saturated pixels. This diverges from the Python `extract_dominant_color()`,
 * which took the mode of a 5° histogram: that let a small but intensely
 * saturated, color-uniform patch (a fruit sticker) win a single tall bin and
 * override the banana, whose color spreads across many bins (green alone spans
 * 80–140°). The median rejects a minority off-color patch by construction.
 */
function extractDominantHue(img: DecodedImage): number {
  const { width, height, data } = img;

  // Compute a step size that downsamples large images additionally,
  // mimicking the Python "resize to 800px max" step.
  const longSide = Math.max(width, height);
  const downsample = longSide > MAX_DIMENSION
    ? Math.ceil(longSide / MAX_DIMENSION)
    : 1;
  const step = SAMPLE_RATE * downsample;

  // jpeg-js returns RGBA — 4 bytes per pixel. Collect the hue of every
  // saturated banana-candidate pixel; the median is taken below.
  const hues: number[] = [];

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;

      // Skip nearly-grayscale pixels (very low saturation) — they don't
      // tell us anything about ripeness and dominate the count when a
      // banana is photographed against a white wall.
      if (isLowSaturation(r, g, b)) continue;

      const hue = rgbToHue(r, g, b);
      // Drop hues no banana ever shows — cyan through magenta. This removes the
      // blue half of a fruit sticker and blue/purple backgrounds, while keeping
      // the whole banana range (deep-brown reds ~0–40°, yellows, greens to ~150°).
      if (hue >= 160 && hue <= 340) continue;

      hues.push(hue);
    }
  }

  if (hues.length === 0) {
    return 60; // Default green, matches the Python fallback.
  }

  // Median hue of the saturated pixels. A sticker (or a glare spot) is a
  // minority of the frame, so it can't move the median the way it could win
  // the old histogram mode. Rounded to 5° to match the granularity the stage
  // boundaries in lib/stages.ts were calibrated against.
  hues.sort((a, b) => a - b);
  const mid = hues.length >> 1;
  const median = hues.length % 2 === 0
    ? (hues[mid - 1] + hues[mid]) / 2
    : hues[mid];
  return Math.round(median / 5) * 5;
}

/**
 * RGB (0–1) → hue in degrees (0–360). Standard HSV conversion.
 */
function rgbToHue(r: number, g: number, b: number): number {
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
 * wall). Skip them so the histogram reflects banana color, not the room.
 */
function isLowSaturation(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) return true;
  return (max - min) / max < 0.1;
}

/**
 * Confidence score: how centered is the detected hue within its stage's
 * range? Mirrors `calculate_stage_confidence()` in color_detection.py.
 */
function calculateStageConfidence(hue: number, stage: Stage): number {
  const def = STAGES[stage];
  const [min, max] = def.hue;
  const rangeSize = max - min;
  if (rangeSize === 0) return 100;
  const distFromEdge = Math.min(Math.abs(hue - min), Math.abs(hue - max));
  const confidence = (1 - distFromEdge / rangeSize) * 100;
  return Math.round(Math.max(50, Math.min(100, confidence)) * 10) / 10;
}

/**
 * Decode base64 string → Uint8Array. We avoid the global atob call
 * because it's not consistently available across React Native/Hermes
 * versions; this loop is small and reliable.
 */
function base64ToUint8Array(b64: string): Uint8Array {
  const cleaned = b64.replace(/[^A-Za-z0-9+/=]/g, '');
  const lookup = new Uint8Array(256);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;

  const len = cleaned.length;
  const padding = cleaned.endsWith('==') ? 2 : cleaned.endsWith('=') ? 1 : 0;
  const out = new Uint8Array(((len * 3) >> 2) - padding);

  let outIndex = 0;
  for (let i = 0; i < len; i += 4) {
    const a = lookup[cleaned.charCodeAt(i)];
    const b = lookup[cleaned.charCodeAt(i + 1)];
    const c = lookup[cleaned.charCodeAt(i + 2)];
    const d = lookup[cleaned.charCodeAt(i + 3)];
    out[outIndex++] = (a << 2) | (b >> 4);
    if (outIndex < out.length) out[outIndex++] = ((b & 15) << 4) | (c >> 2);
    if (outIndex < out.length) out[outIndex++] = ((c & 3) << 6) | d;
  }
  return out;
}
