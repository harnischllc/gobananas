/**
 * Local scan history, persisted in AsyncStorage.
 *
 * Single key, JSON-encoded array, capped to last 50 entries. No DB needed for v1.
 * If/when the corrections feedback loop ships, the row already has a
 * `corrected` slot for the user's "actually it was Stage X" override.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stage } from './stages';

const KEY = 'gobananas/history/v1';
const MAX = 50;

/**
 * Lifetime count of banana scans (not-a-banana and unreadable scans excluded).
 * History is capped at MAX, so milestones like "scan 100" need their own
 * counter. Seeded from history length the first time it is read on a device
 * that predates it.
 */
const COUNT_KEY = 'gobananas/scan_count/v1';

export interface ScanRecord {
  id: string;
  /** ISO 8601 timestamp. */
  timestamp: string;
  /** Local image URI (cache dir). */
  imageUri: string;
  /**
   * Predicted stage from the classifier. Always a valid Stage, even on
   * not-a-banana rows (where it is meaningless), so every STAGES[record.stage]
   * lookup on an older build or an older row keeps working.
   */
  stage: Stage;
  /** Hue in degrees the classifier saw, rounded to the stage-lookup grid. */
  hue: number;
  /** Unrounded hue (build 15+). Absent on older rows. */
  rawHue?: number;
  /** Confidence 0–100. Build 14 rows carry the old inverted number. */
  confidence: number;
  /** True if the classifier could not decode the photo (fallback result). */
  demo: boolean;
  /** True when the frame had nothing banana-colored in it (build 15+). */
  notBanana?: boolean;
  /** Aside key (lib/asides.ts) chosen at scan time, if any (build 15+). */
  aside?: string;
  /** User correction, if any. */
  corrected?: Stage;
}

/** A row the stage UI should treat as a real banana reading. */
export function isBananaScan(r: ScanRecord): boolean {
  return !r.notBanana && !r.demo;
}

export async function loadHistory(): Promise<ScanRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ScanRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addScan(record: Omit<ScanRecord, 'id' | 'timestamp'>): Promise<ScanRecord> {
  const full: ScanRecord = {
    ...record,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
  };
  const existing = await loadHistory();
  const next = [full, ...existing].slice(0, MAX);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  if (isBananaScan(full)) {
    const count = await loadScanCount(existing);
    await saveScanCount(count + 1);
  }
  return full;
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

/**
 * Lifetime banana-scan count. Pass the current history so a device that
 * predates the counter is seeded with what it already has (at most MAX).
 */
export async function loadScanCount(history: ScanRecord[]): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(COUNT_KEY);
    if (raw !== null) {
      const n = parseInt(raw, 10);
      if (Number.isFinite(n) && n >= 0) return n;
    }
  } catch {
    // fall through to the seed
  }
  const seed = history.filter(isBananaScan).length;
  await saveScanCount(seed);
  return seed;
}

async function saveScanCount(n: number): Promise<void> {
  try {
    await AsyncStorage.setItem(COUNT_KEY, String(n));
  } catch {
    // Non-fatal: the milestone aside may fire late or not at all.
  }
}

/** Banana scans whose local calendar day matches `now`. */
export function countScansOnDay(history: ScanRecord[], now: Date): number {
  return history.filter((r) => {
    if (!isBananaScan(r)) return false;
    const t = new Date(r.timestamp);
    return (
      t.getFullYear() === now.getFullYear() &&
      t.getMonth() === now.getMonth() &&
      t.getDate() === now.getDate()
    );
  }).length;
}

/**
 * How many not-a-banana scans in a row ended at this record (including it),
 * walking from this row toward older rows. Drives the escalation line on the
 * not-a-banana card.
 */
export function notBananaRunEndingAt(history: ScanRecord[], id: string): number {
  const start = history.findIndex((r) => r.id === id);
  if (start < 0 || !history[start].notBanana) return 0;
  let run = 0;
  for (let i = start; i < history.length && history[i].notBanana; i++) run++;
  return run;
}

/** Set (or change) the user's stage correction on an existing record. */
export async function updateScanCorrection(
  id: string,
  corrected: Stage,
): Promise<void> {
  const existing = await loadHistory();
  const next = existing.map((r) => (r.id === id ? { ...r, corrected } : r));
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

/**
 * Two-line time format for HistoryRow.
 *   < 1 min   → { primary: 'Just now' }
 *   today     → { primary: 'Today',     secondary: '9:14 AM' }
 *   yesterday → { primary: 'Yesterday', secondary: '6:02 PM' }
 *   older     → { primary: 'Apr 28',    secondary: '8:30 AM' }
 *
 * Two lines avoid the wrap-the-last-character bug that hits "Yesterday"
 * and "Today, 9:14 AM" in a narrow right-aligned column.
 */
export interface ScanTimeLabel {
  primary: string;
  secondary?: string;
}

export function formatScanTime(iso: string): ScanTimeLabel {
  const then = new Date(iso);
  const now = new Date();
  const diffMin = (now.getTime() - then.getTime()) / 60_000;
  if (diffMin < 1) return { primary: 'Just now' };

  const time = then.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  const sameDay =
    then.getFullYear() === now.getFullYear() &&
    then.getMonth() === now.getMonth() &&
    then.getDate() === now.getDate();
  if (sameDay) return { primary: 'Today', secondary: time };

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    then.getFullYear() === yesterday.getFullYear() &&
    then.getMonth() === yesterday.getMonth() &&
    then.getDate() === yesterday.getDate();
  if (isYesterday) return { primary: 'Yesterday', secondary: time };

  return {
    primary: then.toLocaleDateString([], { month: 'short', day: 'numeric' }),
    secondary: time,
  };
}

/**
 * Single-line version, e.g. for screen-reader labels and any place we
 * actually want one inline string.
 */
export function formatScanTimeFlat(iso: string): string {
  const t = formatScanTime(iso);
  return t.secondary ? `${t.primary}, ${t.secondary}` : t.primary;
}
