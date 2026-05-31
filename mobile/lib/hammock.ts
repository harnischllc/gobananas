/**
 * Banana Hammock + overnight monkey raid.
 *
 * You hold N hammocks. You may tuck ONE banana in (pet.ts `protected`).
 * Once per effective day, on returning to the app, a monkey may raid and
 * take your most valuable banana. If that banana was in the hammock, the
 * hammock is spent and the banana is saved; otherwise the monkey takes it.
 * Unused hammocks carry over, so you can hoard them.
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
}

const INITIAL: HammockState = {
  count: 0,
  last_raid_date: null,
  last_outcome: null,
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

export async function grantHammock(n = 1): Promise<HammockState> {
  const state = await loadHammock();
  const next = { ...state, count: state.count + n };
  await saveHammock(next);
  return next;
}

export async function clearHammock(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
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
