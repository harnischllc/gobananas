import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Stage } from './stages';

/**
 * Anonymous corrections loop. When the user opts in (the toggle in the You
 * tab) and then taps the real stage on a result, we send the numbers the
 * classifier saw plus the corrected stage, so the hue ranges in lib/stages
 * can be retuned from real misses.
 *
 * What is sent: predicted stage, corrected stage, hue, confidence, demo flag,
 * app version, timestamp. No photo, no account, no device id. Truly
 * anonymous, matching the consent copy ("No photos, no account, no tracking").
 * Sending is gated on consent and is fire-and-forget: a failure (offline, or
 * the backend not up yet) is dropped and the correction still saves locally.
 */
const CONSENT_KEY = 'gobananas/corrections/consent/v1';

/** Same Cloudflare deploy as the marketing site. */
const CORRECTIONS_URL = 'https://bananascanner.com/api/corrections';

export async function loadConsent(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(CONSENT_KEY)) === '1';
  } catch {
    return false;
  }
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
  hue: number;
  confidence: number;
  demo: boolean;
}

export async function sendCorrection(c: CorrectionInput): Promise<void> {
  if (!(await loadConsent())) return;
  try {
    await fetch(CORRECTIONS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        predictedStage: c.predictedStage,
        correctedStage: c.correctedStage,
        hue: Math.round(c.hue),
        confidence: Math.round(c.confidence),
        demo: c.demo,
        appVersion: Constants.expoConfig?.version ?? 'unknown',
        ts: new Date().toISOString(),
      }),
    });
  } catch {
    // Offline or backend not deployed yet. Drop it; the local record stays.
  }
}
