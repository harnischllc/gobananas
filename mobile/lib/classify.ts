/**
 * Banana ripeness classifier. Descended from the Flask app's
 * `utils/color_detection.py`; the pixel math now lives in lib/hue.ts so it
 * can be unit tested without Expo.
 *
 *   1. Read the captured JPEG as bytes
 *   2. Decode to RGB pixels (jpeg-js, pure JS)
 *   3. Sample every Nth pixel, skip gray-ish pixels and non-banana hues
 *   4. Take the CENTER-WEIGHTED MEDIAN hue of what survives (lib/hue.ts)
 *   5. If almost nothing survived, or the color is one no banana shows,
 *      report not-a-banana instead of inventing a stage
 *   6. Round to 5° and map to a stage via `hueToStage()` in lib/stages.ts
 *   7. Score confidence from the UNROUNDED hue (`stageConfidence()`)
 */

// Use the legacy import path; the new modular API doesn't expose
// readAsStringAsync the same way and isn't fully wired in SDK 54.
import * as FileSystem from 'expo-file-system/legacy';
import { decode as decodeJpeg } from 'jpeg-js';
import { Stage, HUE_ROUNDING, hueToStage, stageConfidence } from './stages';
import { readHue, looksLikeBanana, HueReading } from './hue';

export interface ClassifyResult {
  stage: Stage;
  /** Hue rounded to HUE_ROUNDING degrees; this is what picked the stage. */
  hue: number;
  /** Unrounded center-weighted median hue. Null when nothing was read. */
  rawHue: number | null;
  /** 0-100, distance from the nearest stage boundary. See stageConfidence. */
  confidence: number;
  /** True when the frame had nothing banana-colored in it. */
  notBanana: boolean;
  /** Share of sampled pixels that passed the filters (0-1). */
  candidateFraction: number;
  /** True if the result came from a fallback (decode failed). */
  demo: boolean;
}

// Sample every Nth pixel on each axis. Higher = faster, less accurate.
// Tuned for ~250–500ms on a recent phone.
const SAMPLE_RATE = 10;

// Largest image dimension we'll bother decoding. Bigger = slower with
// no real accuracy gain. iOS camera shots come in around 3000–4000px;
// downscaling happens at the expo-image-picker layer (`quality: 0.7`)
// but we still cap here as a safety net.
const MAX_DIMENSION = 800;

/** What hueToStage gets when the frame carried no usable color. */
const NO_READING_HUE = 60;

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
    const reading = readImage(decoded);
    return classifyReading(reading);
  } catch (err) {
    // Fall back so the UX still completes. The result screen shows a
    // "couldn't read that photo" card for demo:true rather than a stage.
    console.warn('classifyImage failed:', err);
    return {
      stage: 4,
      hue: 35,
      rawHue: null,
      confidence: 0,
      notBanana: false,
      candidateFraction: 0,
      demo: true,
    };
  }
}

/**
 * Turn a hue reading into a result. Pure; exported so the fixture script
 * (scripts/classify-fixtures.mjs) can run the exact shipped decision.
 */
export function classifyReading(reading: HueReading): ClassifyResult {
  if (!looksLikeBanana(reading)) {
    return {
      stage: hueToStage(NO_READING_HUE),
      hue: NO_READING_HUE,
      rawHue: reading.hue,
      confidence: 0,
      notBanana: true,
      candidateFraction: reading.fraction,
      demo: false,
    };
  }
  const rawHue = reading.hue as number;
  const hue = Math.round(rawHue / HUE_ROUNDING) * HUE_ROUNDING;
  const stage = hueToStage(hue);
  return {
    stage,
    hue,
    rawHue,
    confidence: stageConfidence(rawHue, stage),
    notBanana: false,
    candidateFraction: reading.fraction,
    demo: false,
  };
}

interface DecodedImage {
  width: number;
  height: number;
  data: Uint8Array | Uint8ClampedArray;
}

/** Sample step that also downsamples large images, like the Python "resize to 800px" step. */
export function sampleStep(width: number, height: number): number {
  const longSide = Math.max(width, height);
  const downsample = longSide > MAX_DIMENSION
    ? Math.ceil(longSide / MAX_DIMENSION)
    : 1;
  return SAMPLE_RATE * downsample;
}

export function readImage(img: DecodedImage): HueReading {
  return readHue(img.data, img.width, img.height, {
    step: sampleStep(img.width, img.height),
  });
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
