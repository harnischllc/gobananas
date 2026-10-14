/**
 * The classifier's decision, separated from the Expo file read so Node can
 * run the exact shipped logic over real photos (scripts/classify-fixtures.mjs)
 * and the unit tests can cover it. No React Native imports here.
 */
// `import type` matters: Node runs this file with type stripping for the
// fixtures gate and the tests, and a type pulled in as a value import fails.
import type { Stage } from './stages';
import { HUE_ROUNDING, hueToStage, stageConfidence } from './stages';
import type { HueReading, BananaVerdict } from './hue';
import { readHue, bananaVerdict } from './hue';

export interface ClassifyResult {
  stage: Stage;
  /** Hue rounded to HUE_ROUNDING degrees; this is what picked the stage. */
  hue: number;
  /** Unrounded center-weighted median hue. Null when nothing was read. */
  rawHue: number | null;
  /** 0-100, distance from the nearest stage boundary. See stageConfidence. */
  confidence: number;
  /** 'banana' | 'unsure' | 'not'. See bananaVerdict in lib/hue.ts. */
  verdict: BananaVerdict;
  /** True when the frame had nothing banana-colored in it (verdict 'not'). */
  notBanana: boolean;
  /** Share of sampled pixels that passed the filters (0-1). */
  candidateFraction: number;
  /** Median saturation of the banana-colored pixels (0-1), or null. */
  satMedian: number | null;
  /** True if the result came from a fallback (decode failed). */
  demo: boolean;
}

// Sample every Nth pixel on each axis. Higher = faster, less accurate.
// Tuned for ~250–500ms on a recent phone.
export const SAMPLE_RATE = 10;

// Largest image dimension we'll bother decoding. Bigger = slower with
// no real accuracy gain. iOS camera shots come in around 3000–4000px;
// downscaling happens at the expo-image-picker layer (`quality: 0.7`)
// but we still cap here as a safety net.
export const MAX_DIMENSION = 800;

/** What hueToStage gets when the frame carried no usable color. */
export const NO_READING_HUE = 60;

export interface DecodedImage {
  width: number;
  height: number;
  data: ArrayLike<number>;
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

/** Turn a hue reading into a result. Pure. */
export function classifyReading(reading: HueReading): ClassifyResult {
  const verdict = bananaVerdict(reading);
  if (verdict === 'not') {
    return {
      stage: hueToStage(NO_READING_HUE),
      hue: NO_READING_HUE,
      rawHue: reading.hue,
      confidence: 0,
      verdict,
      notBanana: true,
      candidateFraction: reading.fraction,
      satMedian: reading.satMedian,
      demo: false,
    };
  }
  // 'unsure' still computes the real stage: if the user says it is a
  // banana, the result screen shows this stage with no second pass.
  const rawHue = reading.hue as number;
  const hue = Math.round(rawHue / HUE_ROUNDING) * HUE_ROUNDING;
  const stage = hueToStage(hue);
  return {
    stage,
    hue,
    rawHue,
    confidence: stageConfidence(rawHue, stage),
    verdict,
    notBanana: false,
    candidateFraction: reading.fraction,
    satMedian: reading.satMedian,
    demo: false,
  };
}

/** The decode-failure fallback. The result screen shows a "couldn't read" card for demo:true. */
export function unreadableResult(): ClassifyResult {
  return {
    stage: 4,
    hue: 35,
    rawHue: null,
    confidence: 0,
    verdict: 'not',
    notBanana: false,
    candidateFraction: 0,
    satMedian: null,
    demo: true,
  };
}

/** Classify a decoded image end to end (decode happens in classify.ts). */
export function classifyDecoded(img: DecodedImage): ClassifyResult {
  return classifyReading(readImage(img));
}
