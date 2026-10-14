/**
 * Asides: conditional one-liners that replace the stage vibe on a result,
 * at most one per scan and rare by design. Picked at SCAN time and stored on
 * the ScanRecord (history.ts), never computed at render time, so the line
 * survives reopening the result and rides into the share text unchanged.
 *
 * Triggers (priority order):
 *   hundredth      exactly the 100th banana scan on this device
 *   seventh_today  the 7th banana scan today
 *   midnight       a scan between midnight and 3:59 am
 *
 * Each key has a cooldown so a night owl does not see the midnight line
 * every night. Copy is Eric's to revise.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const FIRED_KEY = 'gobananas/asides/v1';

export type AsideKey = 'hundredth' | 'seventh_today' | 'midnight';

export interface AsideDef {
  line: string;
  /** Self-contained enough to stand in for the vibe in the share text. */
  shareable: boolean;
  /** Days before the same aside may fire again. 0 = no cap. */
  cooldownDays: number;
}

export const ASIDES: Record<AsideKey, AsideDef> = {
  hundredth: {
    line: 'Scan 100. The bananas recognize you now.',
    shareable: true,
    cooldownDays: 0,
  },
  seventh_today: {
    line: 'Seven today. Technically a bunch.',
    shareable: true,
    cooldownDays: 7,
  },
  midnight: {
    line: 'Midnight banana. Nobody has to know.',
    shareable: true,
    cooldownDays: 7,
  },
};

const PRIORITY: AsideKey[] = ['hundredth', 'seventh_today', 'midnight'];

export interface AsideContext {
  now: Date;
  /** Banana scans today INCLUDING the one being saved. */
  todayCount: number;
  /** Lifetime banana scans INCLUDING the one being saved. */
  lifetimeCount: number;
}

/** Pure eligibility check, exported for tests. */
export function eligibleAsides(ctx: AsideContext): AsideKey[] {
  const out: AsideKey[] = [];
  if (ctx.lifetimeCount === 100) out.push('hundredth');
  if (ctx.todayCount === 7) out.push('seventh_today');
  const hour = ctx.now.getHours();
  if (hour >= 0 && hour < 4) out.push('midnight');
  return PRIORITY.filter((k) => out.includes(k));
}

/**
 * Pick the aside for this scan, honoring cooldowns, and stamp it as fired.
 * Returns null most of the time; that is the point.
 */
export async function pickAside(ctx: AsideContext): Promise<AsideKey | null> {
  const candidates = eligibleAsides(ctx);
  if (candidates.length === 0) return null;
  const fired = await loadFired();
  for (const key of candidates) {
    const def = ASIDES[key];
    const last = fired[key];
    if (def.cooldownDays > 0 && last) {
      const ageDays =
        (ctx.now.getTime() - new Date(last).getTime()) / 86_400_000;
      if (ageDays < def.cooldownDays) continue;
    }
    fired[key] = ctx.now.toISOString();
    await saveFired(fired);
    return key;
  }
  return null;
}

/** Look up a stored key; unknown keys (future builds, hand edits) return null. */
export function asideFor(key: string | undefined): AsideDef | null {
  if (!key) return null;
  return (ASIDES as Record<string, AsideDef>)[key] ?? null;
}

type FiredMap = Partial<Record<AsideKey, string>>;

async function loadFired(): Promise<FiredMap> {
  try {
    const raw = await AsyncStorage.getItem(FIRED_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as FiredMap) : {};
  } catch {
    return {};
  }
}

async function saveFired(map: FiredMap): Promise<void> {
  try {
    await AsyncStorage.setItem(FIRED_KEY, JSON.stringify(map));
  } catch {
    // Non-fatal: worst case an aside repeats sooner than its cooldown.
  }
}
