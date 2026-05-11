/**
 * Daily-scan streak — v2.0 demo.
 *
 * Real production: streak advances when the user scans a real banana
 * once per calendar day. Missing a day resets the streak (unless they
 * have streak insurance).
 *
 * Demo notes:
 *   - "Today" is computed from a stored `today_offset` so demo can
 *     fake-advance days without waiting overnight.
 *   - Perfect-week / perfect-month milestones are independently
 *     tracked but for demo just compute "current streak" and call out
 *     the milestones inline.
 *
 * One scan per "day" claims the daily crate. After claiming, the next
 * claim is gated until "tomorrow" — in demo, advance the day to retry.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STREAK_KEY = 'gobananas/streak/v1';
const OFFSET_KEY = 'gobananas/streak/demo_offset_v1';

export interface StreakState {
  /** ISO date (YYYY-MM-DD) of last claimed crate, or null if never claimed. */
  last_claim_date: string | null;
  /** Current consecutive-day streak. */
  current: number;
  /** Best streak ever. */
  best: number;
  /** Days the user has claimed (cumulative — used for month/week math demo). */
  total_days: number;
}

const INITIAL: StreakState = {
  last_claim_date: null,
  current: 0,
  best: 0,
  total_days: 0,
};

/* ------------------------------------------------------------------ */
/* "Today" with demo offset                                            */
/* ------------------------------------------------------------------ */

/** Read demo day offset (positive = forward in time). */
async function loadOffset(): Promise<number> {
  const raw = await AsyncStorage.getItem(OFFSET_KEY);
  if (!raw) return 0;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : 0;
}

async function saveOffset(offset: number): Promise<void> {
  await AsyncStorage.setItem(OFFSET_KEY, String(offset));
}

/** Today's effective date (YYYY-MM-DD), accounting for demo offset. */
export async function effectiveToday(): Promise<string> {
  const offset = await loadOffset();
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

/** Demo helper: advance the in-app calendar by one day. */
export async function demoAdvanceDay(): Promise<void> {
  const offset = await loadOffset();
  await saveOffset(offset + 1);
}

/** Demo helper: reset the demo calendar back to real today. */
export async function demoResetCalendar(): Promise<void> {
  await AsyncStorage.removeItem(OFFSET_KEY);
}

/* ------------------------------------------------------------------ */
/* Streak storage                                                      */
/* ------------------------------------------------------------------ */

export async function loadStreak(): Promise<StreakState> {
  try {
    const raw = await AsyncStorage.getItem(STREAK_KEY);
    if (!raw) return { ...INITIAL };
    const parsed = JSON.parse(raw) as StreakState;
    return { ...INITIAL, ...parsed };
  } catch {
    return { ...INITIAL };
  }
}

async function saveStreak(state: StreakState): Promise<void> {
  await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(state));
}

export async function clearStreak(): Promise<void> {
  await AsyncStorage.removeItem(STREAK_KEY);
}

/* ------------------------------------------------------------------ */
/* Claim logic                                                         */
/* ------------------------------------------------------------------ */

export interface ClaimGate {
  canClaim: boolean;
  alreadyClaimedToday: boolean;
  /** What the streak will become if they claim now. */
  willBecome: number;
  /** True if claiming now will continue the streak (claimed yesterday). */
  continuesStreak: boolean;
}

export async function evaluateClaim(): Promise<ClaimGate> {
  const today = await effectiveToday();
  const state = await loadStreak();

  if (state.last_claim_date === today) {
    return {
      canClaim: false,
      alreadyClaimedToday: true,
      willBecome: state.current,
      continuesStreak: false,
    };
  }

  // Did they claim yesterday?
  const yesterday = shiftDate(today, -1);
  const continues = state.last_claim_date === yesterday;
  const willBecome = continues ? state.current + 1 : 1;

  return {
    canClaim: true,
    alreadyClaimedToday: false,
    willBecome,
    continuesStreak: continues,
  };
}

export interface ClaimResult {
  /** New streak after claim. */
  current: number;
  /** True if the streak just hit a 7-day milestone. */
  hitWeek: boolean;
  /** True if the streak just hit a 30-day milestone. */
  hitMonth: boolean;
  best: number;
}

export async function claim(): Promise<ClaimResult | null> {
  const today = await effectiveToday();
  const state = await loadStreak();

  if (state.last_claim_date === today) return null;

  const yesterday = shiftDate(today, -1);
  const continues = state.last_claim_date === yesterday;
  const current = continues ? state.current + 1 : 1;
  const next: StreakState = {
    last_claim_date: today,
    current,
    best: Math.max(state.best, current),
    total_days: state.total_days + 1,
  };
  await saveStreak(next);

  return {
    current,
    hitWeek: current > 0 && current % 7 === 0,
    hitMonth: current > 0 && current % 30 === 0,
    best: next.best,
  };
}

/* ------------------------------------------------------------------ */
/* Date helpers                                                        */
/* ------------------------------------------------------------------ */

function shiftDate(yyyymmdd: string, byDays: number): string {
  const [y, m, d] = yyyymmdd.split('-').map((s) => parseInt(s, 10));
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + byDays);
  return date.toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ */
/* Milestone display helpers                                           */
/* ------------------------------------------------------------------ */

export function streakHeadline(current: number): string {
  if (current === 0) return 'No streak yet';
  if (current === 1) return '1-day streak';
  if (current % 30 === 0) return `${current}-day streak · perfect month 🎉`;
  if (current % 7 === 0) return `${current}-day streak · perfect week 🔥`;
  return `${current}-day streak 🔥`;
}

/** Days remaining until the next 7-day milestone (1–7). */
export function daysToWeek(current: number): number {
  if (current === 0) return 7;
  const r = current % 7;
  return r === 0 ? 7 : 7 - r;
}

/** Days remaining until the next 30-day milestone. */
export function daysToMonth(current: number): number {
  if (current === 0) return 30;
  const r = current % 30;
  return r === 0 ? 30 : 30 - r;
}
