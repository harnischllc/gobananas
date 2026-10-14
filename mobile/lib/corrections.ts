import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Stage } from './stages';

/**
 * Anonymous corrections loop. When the user opts in and then taps the real
 * stage on a result, we send the numbers the classifier saw plus the
 * corrected stage, so the hue ranges in lib/stages can be retuned from real
 * misses.
 *
 * What is sent: predicted stage, corrected stage, hue, confidence, demo flag,
 * app version, timestamp. No photo, no account, no device id. Truly
 * anonymous, matching the consent copy ("No photos, no account, no tracking").
 * Sending is gated on consent and is fire-and-forget: a failure (offline, or
 * the backend not up yet) is dropped and the correction still saves locally.
 *
 * Consent is tri-state. Build 14 only had on/off and never asked, so the
 * table sat at zero rows for four months: the toggle lived in the You tab,
 * off by default, and nobody went looking. Build 15 asks inline at the first
 * correction. 'unset' means never asked; 'off' means asked and declined (or
 * switched off later) and must NOT be re-asked on every correction.
 */
const CONSENT_KEY = 'gobananas/corrections/consent/v1';

/** Same Cloudflare deploy as the marketing site. */
const CORRECTIONS_URL = 'https://bananascanner.com/api/corrections';

export type ConsentState = 'on' | 'off' | 'unset';

export async function loadConsentState(): Promise<ConsentState> {
  try {
    const raw = await AsyncStorage.getItem(CONSENT_KEY);
    if (raw === '1') return 'on';
    if (raw === '0') return 'off';
    return 'unset';
  } catch {
    return 'unset';
  }
}

export async function loadConsent(): Promise<boolean> {
  return (await loadConsentState()) === 'on';
}

export async function setConsent(on: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(CONSENT_KEY, on ? '1' : '0');
  } catch {
    // Non-fatal: worst case the toggle doesn't stick across a restart.
  }
}

export interface CorrectionInput {
  predictedStage: Stage;
  correctedStage: Stage;
  /** Rounded hue (always present). */
  hue: number;
  /** Unrounded hue when the row has one (build 15+). Preferred for the payload. */
  rawHue?: number;
  confidence: number;
  demo: boolean;
}

export async function sendCorrection(c: CorrectionInput): Promise<void> {
  if (!(await loadConsent())) return;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    await fetch(CORRECTIONS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        predictedStage: c.predictedStage,
        correctedStage: c.correctedStage,
        // 1° resolution so boundary retuning is not stuck on the 5° grid.
        hue: Math.round(c.rawHue ?? c.hue),
        confidence: Math.round(c.confidence),
        demo: c.demo,
        appVersion: Constants.expoConfig?.version ?? 'unknown',
        ts: new Date().toISOString(),
      }),
      signal: controller.signal,
    });
  } catch {
    // Offline, timed out, or backend not up yet. Drop it; the local record stays.
  } finally {
    clearTimeout(timeout);
  }
}
