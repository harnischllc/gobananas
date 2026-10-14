/**
 * Banana ripeness classifier, Expo side. Reads the captured JPEG, decodes
 * it, and hands the pixels to lib/decision.ts, which owns the decision:
 *
 *   1. Read the captured JPEG as bytes (here)
 *   2. Decode to RGB pixels with jpeg-js, pure JS (here)
 *   3. Sample every Nth pixel; keep pixels that are bright enough, saturated
 *      enough (>= 0.30) and in a banana hue (lib/hue.ts)
 *   4. Center-weighted median hue of what survives (lib/hue.ts)
 *   5. Verdict: banana / unsure / not a banana (lib/hue.ts bananaVerdict)
 *   6. Round to 5°, map to a stage, score confidence (lib/decision.ts)
 *
 * The split exists so `npm run fixtures` and `npm test` run the exact
 * shipped decision in Node, where this file cannot load.
 */

// Use the legacy import path; the new modular API doesn't expose
// readAsStringAsync the same way and isn't fully wired in SDK 54.
import * as FileSystem from 'expo-file-system/legacy';
import { decode as decodeJpeg } from 'jpeg-js';
import { classifyDecoded, unreadableResult, ClassifyResult } from './decision';

export type { ClassifyResult } from './decision';
export { classifyReading, readImage, sampleStep } from './decision';

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
    return classifyDecoded(decoded);
  } catch (err) {
    // Fall back so the UX still completes. The result screen shows a
    // "couldn't read that photo" card for demo:true rather than a stage.
    console.warn('classifyImage failed:', err);
    return unreadableResult();
  }
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
