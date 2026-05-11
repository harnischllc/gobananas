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

export interface ScanRecord {
  id: string;
  /** ISO 8601 timestamp. */
  timestamp: string;
  /** Local image URI (cache dir). */
  imageUri: string;
  /** Predicted stage from the classifier. */
  stage: Stage;
  /** Hue in degrees the classifier saw. */
  hue: number;
  /** Confidence 0–100. */
  confidence: number;
  /** True if the classifier was running in demo mode. */
  demo: boolean;
  /** User correction, if any. */
  corrected?: Stage;
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
  return full;
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
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
