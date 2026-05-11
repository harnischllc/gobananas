/**
 * Drop / crate system — v2.0 demo.
 *
 * Real banana scanned today → unlock a crate from the boat. Open the
 * crate → variable reward. Most often it's empty (the monkeys got in,
 * the joke is the failure). Sometimes a real rare variety. Rarely a
 * fictional one. Very rarely something mythic.
 *
 * Variety catalog is intentionally over-flavored — short readable names
 * and persona-voiced flavor text. "Baboon Delight" and "Yellow Scorcher"
 * are Eric's coinages from 2026-05-04 brainstorm.
 *
 * Demo-mode notes:
 *   - Drop weights here are tuned for fun-while-demo, not production.
 *     See WEIGHTS_DEMO vs WEIGHTS_PRODUCTION below.
 *   - "Today's drop" can be re-rolled freely in demo (the streak gate
 *     in lib/streak.ts has a "force a new day" debug control).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const COLLECTION_KEY = 'gobananas/drops/collection/v1';
const HISTORY_KEY = 'gobananas/drops/history/v1';

export type Rarity = 'peels' | 'real' | 'fictional' | 'mythic';
export type Season =
  | 'halloween'
  | 'christmas'
  | 'thanksgiving'
  | 'valentines'
  | 'summer';

export interface Variety {
  id: string;
  name: string;
  rarity: Rarity;
  /** Emoji shown on the crate-reveal card. */
  glyph: string;
  /** Background tint for cards/badges. */
  color: string;
  /** Soft tint for cards. */
  colorSoft: string;
  /** One-line flavor text. */
  flavor: string;
  /** Optional gameplay perk (used by the bunch feature in v2.0; flavor only for now). */
  perk?: string;
  /** Only drops during this season (skipped outside). */
  seasonal?: Season;
}

/* ------------------------------------------------------------------ */
/* Variety catalog                                                     */
/* ------------------------------------------------------------------ */

/**
 * Peels = the joke. Multiple flavors of "you got nothing" so it doesn't
 * feel repetitive. Selected at random when the drop rolls peels.
 */
export const PEELS_VARIETY: Variety = {
  id: 'peels',
  name: 'Just peels',
  rarity: 'peels',
  glyph: '🍌',
  color: '#8a5a2b',
  colorSoft: '#ead7c1',
  flavor: 'The monkeys got here first. Better luck tomorrow.',
};

const PEELS_FLAVORS: string[] = [
  'The monkeys got here first. Better luck tomorrow.',
  'All peels, no banana. The classic gag.',
  'Aristotle says it\'s a metaphor. Aristotle is unhelpful.',
  'Empty. Suspiciously empty. There\'s a single banana sticker.',
  'A note: "IOU one banana — the monkeys."',
  'You unwrap it slowly. It\'s peels all the way down.',
];

export const VARIETIES: Variety[] = [
  // ---- Real (uncommon) — educational tier ----
  {
    id: 'lady_finger',
    name: 'Lady Finger',
    rarity: 'real',
    glyph: '🍌',
    color: '#f5c518',
    colorSoft: '#fdf2bf',
    flavor: 'Smaller, sweeter, ripens faster. Real cultivar.',
    perk: 'Ripens 1.3× faster than Cavendish.',
  },
  {
    id: 'red_banana',
    name: 'Red banana',
    rarity: 'real',
    glyph: '🍌',
    color: '#c64a2b',
    colorSoft: '#f5cdc1',
    flavor: 'Reddish skin, denser flesh. Real cultivar (Dacca).',
    perk: 'Slower ripening; longer peak window.',
  },
  {
    id: 'manzano',
    name: 'Manzano',
    rarity: 'real',
    glyph: '🍌',
    color: '#d8c64a',
    colorSoft: '#f4ecb8',
    flavor: 'Apple-banana flavor. Real cultivar (Latin American).',
    perk: 'Short peak; eat fast or lose it.',
  },
  {
    id: 'plantain',
    name: 'Plantain',
    rarity: 'real',
    glyph: '🍌',
    color: '#5d9a3f',
    colorSoft: '#d6ebc8',
    flavor: 'Cooking banana. Real cultivar. Eat raw at your peril.',
    perk: 'Stays starchy longer. Best for the basket.',
  },

  // ---- Fictional (rare) — Eric's coinages + extensions ----
  {
    id: 'baboon_delight',
    name: 'Baboon Delight',
    rarity: 'fictional',
    glyph: '🍌',
    color: '#f5c518',
    colorSoft: '#fff5b1',
    flavor: 'Banana crème filling. Tastes like a beignet at the county fair.',
    perk: 'Peak window 2× longer. Sticky regret guaranteed.',
  },
  {
    id: 'yellow_scorcher',
    name: 'Yellow Scorcher',
    rarity: 'fictional',
    glyph: '🌶️',
    color: '#d9a800',
    colorSoft: '#ffd966',
    flavor: 'Cross-bred with ghost peppers. Eat at your own peril.',
    perk: 'Ripens 3× faster. Mouthfeel unwise.',
  },
  {
    id: 'phantom_plantain',
    name: 'Phantom Plantain',
    rarity: 'fictional',
    glyph: '👻',
    color: '#9aa0a6',
    colorSoft: '#e0e0e0',
    flavor: 'Translucent. Never fully ripens, never tastes like much.',
    perk: 'Never mushes. Worth zero peak points either.',
  },
  {
    id: 'lunar_banana',
    name: 'Lunar Banana',
    rarity: 'fictional',
    glyph: '🌙',
    color: '#5b6cae',
    colorSoft: '#dfe3f5',
    flavor: 'Glows in moonlight. Smells faintly of ozone.',
    perk: 'Only ripens on the windowsill. Peak shimmers.',
  },
  {
    id: 'glacier_banana',
    name: 'Glacier Banana',
    rarity: 'fictional',
    glyph: '🧊',
    color: '#3690d4',
    colorSoft: '#cfe5f6',
    flavor: 'Discovered in a melting Alaskan glacier. Probably a hoax.',
    perk: 'Peaks in the fridge. Other environments slow it.',
  },
  {
    id: 'jazz_banana',
    name: 'Jazz Banana',
    rarity: 'fictional',
    glyph: '🎷',
    color: '#7a4ab0',
    colorSoft: '#e1d3f3',
    flavor: 'Improvisational ripening. Refuses to schedule.',
    perk: 'Ripeness curve randomized every 60 seconds.',
  },

  // ---- Mythic (3% drop) ----
  {
    id: 'abuelos_special',
    name: "Abuelo's Special",
    rarity: 'mythic',
    glyph: '✨',
    color: '#d9a800',
    colorSoft: '#fff5b1',
    flavor: 'Recipe lost to time. Hand-pollinated by hummingbirds, allegedly.',
    perk: "Stays at peak forever in the fruit basket. No, really.",
  },
  {
    id: 'thunderbanana',
    name: 'Thunderbanana',
    rarity: 'mythic',
    glyph: '⚡',
    color: '#facc15',
    colorSoft: '#fef3c7',
    flavor: 'Crackles when you peel it. Fully legal in 19 states.',
    perk: 'Ripens to peak in 30 seconds, then explodes (cosmetically).',
  },

  // ---- Seasonal (only drop during their holiday) ----
  {
    id: 'mummy_banana',
    name: 'Mummy Banana',
    rarity: 'fictional',
    glyph: '🎃',
    color: '#dd7a1f',
    colorSoft: '#fbe2c3',
    flavor: 'Wrapped in white peel. Probably cursed.',
    perk: 'Reanimates after eaten — adds one back to the bunch.',
    seasonal: 'halloween',
  },
  {
    id: 'pumpkin_spice',
    name: 'Pumpkin Spice Banana',
    rarity: 'fictional',
    glyph: '☕',
    color: '#dd7a1f',
    colorSoft: '#fbe2c3',
    flavor: 'Cinnamon, nutmeg, controversy.',
    perk: 'Triggers a Starbucks order on contact.',
    seasonal: 'halloween',
  },
  {
    id: 'candy_cane_banana',
    name: 'Candy Cane',
    rarity: 'fictional',
    glyph: '🍬',
    color: '#c64a4a',
    colorSoft: '#f5cdc1',
    flavor: 'Striped red and white. Smells like peppermint.',
    perk: 'Doubles peak rating during December.',
    seasonal: 'christmas',
  },
];

/* ------------------------------------------------------------------ */
/* Rarity weights                                                      */
/* ------------------------------------------------------------------ */

interface Weights {
  peels: number;
  real: number;
  fictional: number;
  mythic: number;
}

/** Tuned for fun-during-demo. Real production weights are leaner. */
export const WEIGHTS_DEMO: Weights = {
  peels: 25,
  real: 30,
  fictional: 35,
  mythic: 10,
};

/** Production-ish — peels show up enough that it's a running gag. */
export const WEIGHTS_PRODUCTION: Weights = {
  peels: 40,
  real: 35,
  fictional: 22,
  mythic: 3,
};

/** Active weights. Toggle DEMO_MODE off when you ship. */
export const ACTIVE_WEIGHTS: Weights = WEIGHTS_DEMO;

/* ------------------------------------------------------------------ */
/* Rarity colors (for badges/borders/glows)                            */
/* ------------------------------------------------------------------ */

export const RARITY_COLOR: Record<Rarity, string> = {
  peels: '#8a5a2b',
  real: '#5d9a3f',
  fictional: '#d9a800',
  mythic: '#7a4ab0',
};

export const RARITY_LABEL: Record<Rarity, string> = {
  peels: 'Peels',
  real: 'Real variety',
  fictional: 'Fictional',
  mythic: 'Mythic',
};

/* ------------------------------------------------------------------ */
/* Open a crate                                                        */
/* ------------------------------------------------------------------ */

export interface DropResult {
  variety: Variety;
  /** True if this is the first time the user got this variety. */
  firstTime: boolean;
  /** Peels-flavor text varies; this is the chosen one for this drop. */
  peelsFlavor?: string;
  iso: string;
}

/** Roll a rarity tier from the active weights. */
function rollRarity(weights: Weights): Rarity {
  const total = weights.peels + weights.real + weights.fictional + weights.mythic;
  const roll = Math.random() * total;
  let cum = 0;
  cum += weights.peels;
  if (roll < cum) return 'peels';
  cum += weights.real;
  if (roll < cum) return 'real';
  cum += weights.fictional;
  if (roll < cum) return 'fictional';
  return 'mythic';
}

/**
 * Open a crate. Picks a rarity from the weights, then a variety from
 * that rarity's pool. Adds it to the user's collection and history.
 */
export async function openCrate(): Promise<DropResult> {
  const rarity = rollRarity(ACTIVE_WEIGHTS);

  if (rarity === 'peels') {
    const flavor =
      PEELS_FLAVORS[Math.floor(Math.random() * PEELS_FLAVORS.length)];
    const result: DropResult = {
      variety: { ...PEELS_VARIETY, flavor },
      firstTime: false,
      peelsFlavor: flavor,
      iso: new Date().toISOString(),
    };
    await pushHistory(result);
    return result;
  }

  // Active season filter: skip seasonals not currently in season.
  const activeSeason = currentSeason();
  const pool = VARIETIES.filter(
    (v) => v.rarity === rarity && (!v.seasonal || v.seasonal === activeSeason),
  );
  const fallbackPool = pool.length > 0 ? pool : VARIETIES.filter((v) => v.rarity === rarity && !v.seasonal);
  const variety = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];

  const collection = await loadCollection();
  const firstTime = !collection.includes(variety.id);
  if (firstTime) {
    await saveCollection([...collection, variety.id]);
  }

  const result: DropResult = {
    variety,
    firstTime,
    iso: new Date().toISOString(),
  };
  await pushHistory(result);
  return result;
}

/* ------------------------------------------------------------------ */
/* Holiday season                                                      */
/* ------------------------------------------------------------------ */

/** Returns the active season for now, or null. */
export function currentSeason(): Season | null {
  const now = new Date();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  if (m === 10) return 'halloween';
  if (m === 11 && d <= 30) return 'thanksgiving';
  if (m === 12) return 'christmas';
  if (m === 2 && d >= 7 && d <= 16) return 'valentines';
  if (m >= 6 && m <= 8) return 'summer';
  return null;
}

/* ------------------------------------------------------------------ */
/* Collection storage                                                  */
/* ------------------------------------------------------------------ */

export async function loadCollection(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(COLLECTION_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

async function saveCollection(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(COLLECTION_KEY, JSON.stringify(ids));
}

export async function clearCollection(): Promise<void> {
  await AsyncStorage.removeItem(COLLECTION_KEY);
  await AsyncStorage.removeItem(HISTORY_KEY);
}

/* ------------------------------------------------------------------ */
/* History (last N drops, for a small log on the rewards screen)        */
/* ------------------------------------------------------------------ */

const HISTORY_CAP = 20;

export async function loadDropHistory(): Promise<DropResult[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DropResult[]) : [];
  } catch {
    return [];
  }
}

async function pushHistory(drop: DropResult): Promise<void> {
  const existing = await loadDropHistory();
  const next = [drop, ...existing].slice(0, HISTORY_CAP);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export function findVariety(id: string): Variety | undefined {
  if (id === 'peels') return PEELS_VARIETY;
  return VARIETIES.find((v) => v.id === id);
}

export function totalUnlockable(): number {
  // Don't count peels; do count seasonals so the collection grid shows
  // them as "locked, only drops in October" etc.
  return VARIETIES.length;
}
