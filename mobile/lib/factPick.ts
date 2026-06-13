import AsyncStorage from '@react-native-async-storage/async-storage';
import { DROPPABLE_FACTS, type BananaFact } from './bananaFacts';

/**
 * Picks the banana fact shown on the home screen. Random, but with a
 * recently-seen cooldown: a fact that just showed will not come back for
 * COOLDOWN more opens, then it re-enters the random pool. This keeps the
 * fact feeling fresh and gives a reason to reopen, instead of handing the
 * whole catalog over at once.
 */
const RECENT_KEY = 'gobananas/facts/recent/v1';

/** How many distinct facts stay on cooldown before one can repeat. */
const COOLDOWN = 10;

async function loadRecent(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === 'string')
      : [];
  } catch {
    return [];
  }
}

/**
 * Pick the next fact to show and record it. Excludes the last COOLDOWN facts
 * already seen so nothing repeats until ~COOLDOWN more opens have passed.
 * Call once per app open.
 */
export async function pickNextFact(): Promise<BananaFact> {
  const recent = await loadRecent();
  const seen = new Set(recent);

  // With 59 family-safe facts and a 10-deep cooldown this is always
  // populated; fall back to the full pool only if the math ever changes.
  let pool = DROPPABLE_FACTS.filter((f) => !seen.has(f.id));
  if (pool.length === 0) pool = DROPPABLE_FACTS;

  const pick = pool[Math.floor(Math.random() * pool.length)];

  const next = [...recent, pick.id].slice(-COOLDOWN);
  try {
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Non-fatal: worst case a fact can recur sooner than the cooldown.
  }

  return pick;
}
