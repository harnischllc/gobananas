/**
 * Banana Hammock + overnight monkey raid.
 *
 * You hold N hammocks. You may tuck ONE banana in (pet.ts `protected`).
 * Once per effective day, on returning to the app, a monkey may raid and
 * take your most valuable banana. If that banana was in the hammock, the
 * hammock is spent and the banana is saved; otherwise the monkey takes it.
 * Unused hammocks carry over, so you can hoard them.
 *
 * Supply: a fresh wallet starts with STARTER_HAMMOCKS. After that, the
 * first crate of each new week tops you up 1-2 (see grantWeeklyIfDue, called
 * from lib/drops.ts openCrate). Run dry between grants and you have to do
 * without — or, later, buy more.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Banana, Bunch, BunchEvent, EndReason } from './pet';

const STORAGE_KEY = 'gobananas/hammock/v1';

export const DEFAULT_RAID_CHANCE = 0.35;

export type RaidOutcome =
  | { kind: 'quiet' } // no raid this time
  | { kind: 'blocked'; bananaName: string } // hammock saved it
  | { kind: 'stolen'; bananaName: string }; // monkey took it

export interface HammockState {
  count: number;
  last_raid_date: string | null;
  last_outcome: RaidOutcome | null;
  /** Week key (see weekKeyOf) of the last weekly supply grant, or null if never. */
  last_grant_week: string | null;
}

/** Hammocks a brand-new wallet is born with. */
export const STARTER_HAMMOCKS = 5;

/** Weekly top-up range, inclusive. */
export const WEEKLY_HAMMOCK_MIN = 1;
export const WEEKLY_HAMMOCK_MAX = 2;

const INITIAL: HammockState = {
  count: STARTER_HAMMOCKS,
  last_raid_date: null,
  last_outcome: null,
  last_grant_week: null,
};

export async function loadHammock(): Promise<HammockState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...INITIAL };
    const parsed = JSON.parse(raw) as Partial<HammockState>;
    return { ...INITIAL, ...parsed };
  } catch {
    return { ...INITIAL };
  }
}

export async function saveHammock(state: HammockState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function clearHammock(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

/* ------------------------------------------------------------------ */
/* Weekly supply                                                       */
/* ------------------------------------------------------------------ */

/**
 * Week bucket for a YYYY-MM-DD date: the integer count of 7-day windows
 * since the Unix epoch. Aligned to the epoch (a Thursday), not to Monday,
 * which is fine — we only need a stable "is this a different week" key, and
 * it advances cleanly when the demo day-offset jumps forward.
 */
export function weekKeyOf(today: string): string {
  const [y, m, d] = today.split('-').map((s) => parseInt(s, 10));
  const epochDay = Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
  return String(Math.floor(epochDay / 7));
}

/**
 * Weekly hammock supply, resolved against an effective `today`. Pure: hand
 * it the loaded state and it returns the next state plus how many it granted.
 *
 * The starter wallet covers week one, so the very first call
 * (last_grant_week === null) only primes the clock and grants nothing.
 * Each later week's first call grants WEEKLY_HAMMOCK_MIN..MAX. Idempotent
 * within a week: once last_grant_week is stamped, repeat calls the same week
 * return the same state and grant 0.
 */
export function grantWeeklyIfDue(
  state: HammockState,
  today: string,
  rng: () => number = Math.random,
): { state: HammockState; granted: number } {
  const week = weekKeyOf(today);
  if (state.last_grant_week === week) return { state, granted: 0 };
  if (state.last_grant_week === null) {
    return { state: { ...state, last_grant_week: week }, granted: 0 };
  }
  const granted = rng() < 0.5 ? WEEKLY_HAMMOCK_MIN : WEEKLY_HAMMOCK_MAX;
  return {
    state: { ...state, last_grant_week: week, count: state.count + granted },
    granted,
  };
}

/** Most valuable = closest to the middle of the peak band (ripeness 75). */
function pickMostValuable(alive: Banana[]): Banana {
  return alive.reduce((best, b) => {
    const vb = -Math.abs(b.ripeness - 75);
    const vbest = -Math.abs(best.ripeness - 75);
    if (vb > vbest) return b;
    if (vb === vbest && b.ripeness > best.ripeness) return b;
    return best;
  });
}

function raidEvent(
  outcome: { kind: 'blocked' | 'stolen'; bananaName: string },
): BunchEvent {
  const iso = new Date().toISOString();
  if (outcome.kind === 'blocked') {
    return {
      iso,
      type: 'event',
      detail: `🐒 A monkey came for ${outcome.bananaName}, but it was snug in the hammock. The monkey left in a huff (and pocketed a loose peel).`,
      glyph: '🪢',
    };
  }
  return {
    iso,
    type: 'event',
    detail: `🐒 A monkey raided overnight and made off with ${outcome.bananaName}. No hammock, no mercy.`,
    glyph: '🐒',
  };
}

/**
 * Pure raid resolution. Always stamps `last_raid_date` to `today` so the
 * caller only resolves once per day. `rng` is injectable for future tests.
 * Quiet outcomes add no history entry; only an actual raid is logged.
 */
export function resolveRaid(
  bunch: Bunch,
  state: HammockState,
  today: string,
  raidChance: number = DEFAULT_RAID_CHANCE,
  rng: () => number = Math.random,
): { bunch: Bunch; state: HammockState; outcome: RaidOutcome } {
  const stamped = { ...state, last_raid_date: today };
  const alive = bunch.bananas.filter((b) => b.alive);

  if (alive.length === 0 || rng() >= raidChance) {
    const outcome: RaidOutcome = { kind: 'quiet' };
    return { bunch, state: { ...stamped, last_outcome: outcome }, outcome };
  }

  const target = pickMostValuable(alive);

  if (target.protected && stamped.count > 0) {
    const outcome: RaidOutcome = { kind: 'blocked', bananaName: target.name };
    const bananas = bunch.bananas.map((b) =>
      b.id === target.id ? { ...b, protected: false } : b,
    );
    return {
      bunch: {
        ...bunch,
        bananas,
        history: [...bunch.history, raidEvent(outcome)],
      },
      state: { ...stamped, count: stamped.count - 1, last_outcome: outcome },
      outcome,
    };
  }

  const outcome: RaidOutcome = { kind: 'stolen', bananaName: target.name };
  const bananas = bunch.bananas.map((b) =>
    b.id === target.id
      ? { ...b, alive: false, end_reason: 'monkey' as EndReason, protected: false }
      : b,
  );
  return {
    bunch: {
      ...bunch,
      bananas,
      history: [...bunch.history, raidEvent(outcome)],
    },
    state: { ...stamped, last_outcome: outcome },
    outcome,
  };
}
