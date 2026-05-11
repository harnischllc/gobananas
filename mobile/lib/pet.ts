/**
 * The pet bunch — a household of 5–8 virtual bananas you have to ripen
 * and eat before they go bad. Each banana ripens individually, can live
 * in a different environment, and can meet its own fate (monkey theft,
 * roommate eating, dropping, mush). Lives in AsyncStorage.
 *
 * **Lifecycle pacing:** 30 minutes of real time on the counter = 0 → 100
 * ripeness. Full 7-stage arc condensed into a half-hour.
 *
 * **The puzzle:** You can't eat 7 bananas in 30 minutes. So you stagger:
 *   - Fridge a few (0.4×) to slow them down
 *   - Paper-bag the green ones (1.5×) to push them toward peak fast
 *   - Counter the rest (1.0×)
 *   - Eat them as they hit peak (stages 5–6)
 *
 * **Environments are state, not actions.** Once you put a banana in the
 * fridge, it ripens slowly until you take it out. Real-banana physics:
 *   - Counter: 1.0× baseline
 *   - Fruit basket: 1.2× (other fruits emit ethylene)
 *   - Paper bag: 1.5× (traps the banana's own ethylene)
 *   - Sunny windowsill: 2.0× (heat accelerates conversion)
 *   - Hanging hook: 0.85× (no bruising contact)
 *   - Fridge: 0.4× (cold slows enzymes; skin browns cosmetically — fact)
 *
 * **Random events** roll on each foreground tick (~1% per 10 seconds).
 * They target a single random alive banana in the bunch. Foreground-only
 * — no random events fire while the app is closed.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stage } from './stages';

const STORAGE_KEY = 'gobananas/bunch/v1';

/** Total seconds for a banana to go from 0 → 100 on the counter. */
export const LIFECYCLE_SECONDS = 30 * 60; // 30 minutes

/* ------------------------------------------------------------------ */
/* Environments                                                        */
/* ------------------------------------------------------------------ */

export type Environment =
  | 'counter'
  | 'basket'
  | 'paper_bag'
  | 'windowsill'
  | 'hook'
  | 'fridge';

export interface EnvironmentDef {
  id: Environment;
  label: string;
  short: string;
  glyph: string;
  multiplier: number;
  blurb: string;
}

export const ENVIRONMENTS: Record<Environment, EnvironmentDef> = {
  counter: {
    id: 'counter',
    label: 'On the counter',
    short: 'Counter',
    glyph: '🪵',
    multiplier: 1.0,
    blurb: 'Baseline. Steady, normal ripening.',
  },
  basket: {
    id: 'basket',
    label: 'In the fruit basket',
    short: 'Basket',
    glyph: '🧺',
    multiplier: 1.2,
    blurb: 'Other fruits release ethylene — slight speed-up.',
  },
  paper_bag: {
    id: 'paper_bag',
    label: 'In a paper bag',
    short: 'Paper bag',
    glyph: '🛍️',
    multiplier: 1.5,
    blurb: "Traps the banana's own ethylene. Real-deal fast track.",
  },
  windowsill: {
    id: 'windowsill',
    label: 'On the sunny windowsill',
    short: 'Sunny',
    glyph: '☀️',
    multiplier: 2.0,
    blurb: 'Heat accelerates everything. Risky but fast.',
  },
  hook: {
    id: 'hook',
    label: 'On the hanging hook',
    short: 'Hook',
    glyph: '🪝',
    multiplier: 0.85,
    blurb: 'No bruising contact — slightly slower.',
  },
  fridge: {
    id: 'fridge',
    label: 'In the fridge',
    short: 'Fridge',
    glyph: '🧊',
    multiplier: 0.4,
    blurb:
      'Slows ripening dramatically. Skin browns cosmetically — flesh stays fine. Real fact.',
  },
};

export const ENVIRONMENT_ORDER: Environment[] = [
  'counter',
  'basket',
  'paper_bag',
  'windowsill',
  'hook',
  'fridge',
];

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type EndReason =
  | 'eaten'
  | 'monkey'
  | 'roommate'
  | 'bird'
  | 'dropped'
  | 'mush';

export type BunchEventType =
  | 'planted'
  | 'env_change'
  | 'event'
  | 'eaten'
  | 'ended';

export interface BunchEvent {
  iso: string;
  type: BunchEventType;
  detail: string;
  glyph?: string;
  /** Which banana this event refers to (if any). */
  banana_id?: string;
}

export interface Banana {
  id: string;
  name: string;
  birth_iso: string;
  last_tick_iso: string;
  ripeness: number;
  environment: Environment;
  alive: boolean;
  end_reason?: EndReason;
}

export interface Bunch {
  id: string;
  name: string;
  planted_iso: string;
  bananas: Banana[];
  history: BunchEvent[];
}

/* ------------------------------------------------------------------ */
/* Stage mapping                                                       */
/* ------------------------------------------------------------------ */

interface StageBand {
  stage: Stage;
  min: number;
  max: number;
}

const STAGE_BANDS: StageBand[] = [
  { stage: 1, min: 0,  max: 12 },
  { stage: 2, min: 12, max: 24 },
  { stage: 3, min: 24, max: 36 },
  { stage: 4, min: 36, max: 50 },
  { stage: 5, min: 50, max: 65 },
  { stage: 6, min: 65, max: 85 }, // Peak — biggest window.
  { stage: 7, min: 85, max: 100 },
];

export function ripenessToStage(ripeness: number): Stage {
  const r = Math.max(0, Math.min(100, ripeness));
  for (const band of STAGE_BANDS) {
    if (r >= band.min && r < band.max) return band.stage;
  }
  return 7;
}

/** Seconds from current ripeness to peak (stage 6 = 65). */
export function secondsUntilPeak(ripeness: number, env: Environment): number {
  if (ripeness >= 65) return 0;
  const remaining = 65 - ripeness;
  const ratePerSecond = (100 / LIFECYCLE_SECONDS) * ENVIRONMENTS[env].multiplier;
  return Math.round(remaining / ratePerSecond);
}

/* ------------------------------------------------------------------ */
/* Naming                                                              */
/* ------------------------------------------------------------------ */

const FIRST_NAME_ROSTER = [
  'Phil', 'Carla', 'Greg', 'Stan', 'Linda', 'Hank', 'Rita', 'Vic',
  'Ned', 'Marsha', 'Doug', 'Gladys', 'Earl', 'Pearl', 'Saul', 'Maude',
  'Bev', 'Roy', 'Frank', 'Carl', 'Mona', 'Wally', 'Dot', 'Lou',
];

function pickName(taken: Set<string>): string {
  const pool = FIRST_NAME_ROSTER.filter((n) => !taken.has(n));
  if (pool.length === 0) return `Banana ${taken.size + 1}`;
  return pool[Math.floor(Math.random() * pool.length)];
}

/* ------------------------------------------------------------------ */
/* Storage                                                             */
/* ------------------------------------------------------------------ */

export async function loadBunch(): Promise<Bunch | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Bunch;
  } catch {
    return null;
  }
}

async function saveBunch(bunch: Bunch): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bunch));
}

export async function clearBunch(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export async function persistBunch(bunch: Bunch): Promise<void> {
  await saveBunch(bunch);
}

/* ------------------------------------------------------------------ */
/* Lifecycle                                                           */
/* ------------------------------------------------------------------ */

export async function plantBunch(bunchName: string): Promise<Bunch> {
  const now = new Date().toISOString();
  const trimmed = bunchName.trim() || 'The Smiths';
  // Random size 5–8 to mimic a real grocery-store bunch.
  const count = 5 + Math.floor(Math.random() * 4);

  const taken = new Set<string>();
  const bananas: Banana[] = [];
  for (let i = 0; i < count; i++) {
    const name = pickName(taken);
    taken.add(name);
    bananas.push({
      id: `b-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      birth_iso: now,
      last_tick_iso: now,
      // Tiny variance so they don't all hit peak at the exact same second
      // (real bananas in a bunch ripen on slightly different schedules).
      ripeness: Math.random() * 4,
      environment: 'counter',
      alive: true,
    });
  }

  const bunch: Bunch = {
    id: `bunch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: trimmed,
    planted_iso: now,
    bananas,
    history: [
      {
        iso: now,
        type: 'planted',
        detail: `${trimmed} arrived. ${count} green bananas, full of promise.`,
        glyph: '🌱',
      },
    ],
  };

  await saveBunch(bunch);
  return bunch;
}

/* ------------------------------------------------------------------ */
/* Tick                                                                */
/* ------------------------------------------------------------------ */

/**
 * Advance every alive banana in the bunch by elapsed real-time. Pure
 * function — caller saves the result if it differs.
 *
 * @param rollEvents Whether to roll for random events. Caller passes
 *   true only when ticking from the foreground (not on cold-start
 *   catch-up).
 */
export function tickBunch(bunch: Bunch, rollEvents = true): Bunch {
  const now = new Date();
  const newBananas: Banana[] = [];
  const newEvents: BunchEvent[] = [];
  let anyChange = false;

  for (const banana of bunch.bananas) {
    if (!banana.alive) {
      newBananas.push(banana);
      continue;
    }
    const last = new Date(banana.last_tick_iso);
    const elapsedSec = Math.max(0, (now.getTime() - last.getTime()) / 1000);
    if (elapsedSec === 0) {
      newBananas.push(banana);
      continue;
    }
    anyChange = true;
    const env = ENVIRONMENTS[banana.environment];
    const ratePerSecond = (100 / LIFECYCLE_SECONDS) * env.multiplier;
    const newRipeness = Math.min(
      100,
      banana.ripeness + elapsedSec * ratePerSecond,
    );

    const next: Banana = {
      ...banana,
      ripeness: newRipeness,
      last_tick_iso: now.toISOString(),
    };

    // Mush check.
    if (newRipeness >= 100) {
      next.alive = false;
      next.end_reason = 'mush';
      newEvents.push({
        iso: now.toISOString(),
        type: 'ended',
        detail: `${banana.name} fully liquefied. Past the bread point.`,
        glyph: '💀',
        banana_id: banana.id,
      });
    }
    newBananas.push(next);
  }

  // Random event — pick one alive banana from the bunch as victim.
  if (rollEvents && anyChange) {
    const alive = newBananas.filter((b) => b.alive);
    if (alive.length > 0) {
      const elapsedSec =
        (now.getTime() - new Date(bunch.history[bunch.history.length - 1]?.iso ?? bunch.planted_iso).getTime()) /
        1000;
      const rolls = Math.max(1, Math.floor(elapsedSec / 10));
      let triggered = false;
      for (let i = 0; i < rolls && !triggered; i++) {
        if (Math.random() < 0.01) {
          const target = alive[Math.floor(Math.random() * alive.length)];
          const ev = pickEvent(target);
          if (ev) {
            const result = applyEvent(target, ev, now.toISOString(), bunch.name);
            if (result) {
              newEvents.push(result);
              triggered = true;
            }
          }
        }
      }
    }
  }

  if (!anyChange && newEvents.length === 0) return bunch;

  return {
    ...bunch,
    bananas: newBananas,
    history: [...bunch.history, ...newEvents],
  };
}

/* ------------------------------------------------------------------ */
/* Random events                                                       */
/* ------------------------------------------------------------------ */

interface RandomEvent {
  reason: EndReason | 'avocado_jealous';
  detail: (banana: string, bunchName: string) => string;
  glyph: string;
  ends: boolean;
  sideEffect?: (banana: Banana) => void;
  minRipeness?: number;
  maxRipeness?: number;
}

const RANDOM_EVENTS: RandomEvent[] = [
  {
    reason: 'monkey',
    detail: (banana) => `🐒 A monkey took ${banana}. No recourse.`,
    glyph: '🐒',
    ends: true,
  },
  {
    reason: 'roommate',
    detail: (banana) =>
      `Your roommate ate ${banana}. Said they'd buy more. They will not.`,
    glyph: '👻',
    ends: true,
    minRipeness: 36, // Roommate doesn't want a green one.
  },
  {
    reason: 'bird',
    detail: (banana) => `A bird flew off with ${banana}. Window was open.`,
    glyph: '🐦',
    ends: true,
  },
  {
    reason: 'dropped',
    detail: (banana) =>
      `You dropped ${banana}. Bruised on impact — straight to brown-speckled.`,
    glyph: '💥',
    ends: false,
    sideEffect: (banana) => {
      banana.ripeness = Math.max(banana.ripeness, 92);
    },
    maxRipeness: 75,
  },
  {
    reason: 'avocado_jealous',
    detail: (_banana, bunchName) =>
      `The avocado on the counter ripened first. ${bunchName} feel personally attacked.`,
    glyph: '🥑',
    ends: false,
  },
];

function pickEvent(banana: Banana): RandomEvent | null {
  const eligible = RANDOM_EVENTS.filter((e) => {
    if (e.minRipeness !== undefined && banana.ripeness < e.minRipeness) return false;
    if (e.maxRipeness !== undefined && banana.ripeness > e.maxRipeness) return false;
    return true;
  });
  if (eligible.length === 0) return null;
  return eligible[Math.floor(Math.random() * eligible.length)];
}

function applyEvent(
  banana: Banana,
  ev: RandomEvent,
  iso: string,
  bunchName: string,
): BunchEvent | null {
  if (ev.ends) {
    banana.alive = false;
    banana.end_reason = ev.reason as EndReason;
  }
  ev.sideEffect?.(banana);
  return {
    iso,
    type: 'event',
    detail: ev.detail(banana.name, bunchName),
    glyph: ev.glyph,
    banana_id: banana.id,
  };
}

/* ------------------------------------------------------------------ */
/* User-driven mutations                                               */
/* ------------------------------------------------------------------ */

export async function setBananaEnvironment(
  bunch: Bunch,
  bananaId: string,
  env: Environment,
): Promise<Bunch> {
  const ticked = tickBunch(bunch, false);
  const updated = ticked.bananas.map((b) => {
    if (b.id !== bananaId || !b.alive || b.environment === env) return b;
    return { ...b, environment: env };
  });
  const moved = updated.find((b) => b.id === bananaId);
  if (!moved || moved.environment !== env) return ticked;

  const next: Bunch = {
    ...ticked,
    bananas: updated,
    history: [
      ...ticked.history,
      {
        iso: new Date().toISOString(),
        type: 'env_change',
        detail: `${moved.name} → ${ENVIRONMENTS[env].label.toLowerCase()}.`,
        glyph: ENVIRONMENTS[env].glyph,
        banana_id: bananaId,
      },
    ],
  };
  await saveBunch(next);
  return next;
}

export async function eatBanana(
  bunch: Bunch,
  bananaId: string,
): Promise<Bunch> {
  const ticked = tickBunch(bunch, false);
  const updated = ticked.bananas.map((b) => {
    if (b.id !== bananaId || !b.alive) return b;
    return { ...b, alive: false, end_reason: 'eaten' as EndReason };
  });
  const eaten = updated.find((b) => b.id === bananaId);
  if (!eaten || eaten.end_reason !== 'eaten') return ticked;

  const detail =
    eaten.ripeness >= 65 && eaten.ripeness < 85
      ? `Ate ${eaten.name} at peak. Chef's kiss.`
      : eaten.ripeness >= 85
        ? `Ate ${eaten.name}. Bit past peak — no judgment here.`
        : eaten.ripeness >= 36
          ? `Ate ${eaten.name} early. Bold choice.`
          : `Ate ${eaten.name} green. Brave.`;

  const next: Bunch = {
    ...ticked,
    bananas: updated,
    history: [
      ...ticked.history,
      {
        iso: new Date().toISOString(),
        type: 'eaten',
        detail,
        glyph: '🤤',
        banana_id: bananaId,
      },
    ],
  };
  await saveBunch(next);
  return next;
}

/* ------------------------------------------------------------------ */
/* Display helpers                                                     */
/* ------------------------------------------------------------------ */

export function bunchAlive(bunch: Bunch): number {
  return bunch.bananas.filter((b) => b.alive).length;
}

export function bunchEatenAtPeak(bunch: Bunch): number {
  return bunch.bananas.filter((b) => {
    if (b.end_reason !== 'eaten') return false;
    return b.ripeness >= 65 && b.ripeness < 85;
  }).length;
}

export function bunchOver(bunch: Bunch): boolean {
  return bunch.bananas.every((b) => !b.alive);
}

export function formatLifespan(birth_iso: string, end_iso?: string): string {
  const start = new Date(birth_iso);
  const end = end_iso ? new Date(end_iso) : new Date();
  const sec = Math.max(0, (end.getTime() - start.getTime()) / 1000);
  if (sec < 60) return `${Math.round(sec)}s`;
  if (sec < 3600) return `${Math.round(sec / 60)}m`;
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** The earliest banana in the bunch that will hit peak (for notifications). */
export function nextBananaToPeak(bunch: Bunch): Banana | null {
  const candidates = bunch.bananas.filter((b) => b.alive && b.ripeness < 65);
  if (candidates.length === 0) return null;
  candidates.sort(
    (a, b) =>
      secondsUntilPeak(a.ripeness, a.environment) -
      secondsUntilPeak(b.ripeness, b.environment),
  );
  return candidates[0];
}
