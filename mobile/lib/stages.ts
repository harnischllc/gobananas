/**
 * Banana ripeness stage definitions.
 *
 * Ported from utils/constants.py and utils/color_detection.py in the Flask app.
 * Same numbers, same hue ranges, same USDA scale — just typed for TS and with
 * persona-friendly copy added on top of the clinical descriptions.
 */

export type Stage = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface StageDef {
  stage: Stage;
  /** Short label, used in lists and badges. */
  label: string;
  /** USDA-style clinical description. */
  description: string;
  /** Persona voice — what a friend would say about this banana. */
  vibe: string;
  /** Hue range in degrees for this stage (matches Python). */
  hue: [number, number];
  /** Min/max days from this stage to the next (matches Python). */
  daysToNext: [number, number];
  /** Bulleted recommendations. */
  recommendations: string[];
  /** Hex color used for the stage badge across the app. */
  color: string;
  /** Hex color for the soft background of the stage badge. */
  colorSoft: string;
}

export const STAGES: Record<Stage, StageDef> = {
  1: {
    stage: 1,
    label: 'Green',
    description: 'Entirely green, firm and starchy. High in resistant starch.',
    vibe: "Not ready. This banana hasn't lived yet.",
    hue: [80, 140],
    daysToNext: [1, 4],
    recommendations: [
      'Wait 3–4 days for peak sweetness',
      'Leave on the counter, not the fridge',
      'OK for cooking if you like less sweet',
    ],
    color: '#5d9a3f',
    colorSoft: '#d6ebc8',
  },
  2: {
    stage: 2,
    label: 'Light Green',
    description: 'Breaking toward yellow. Still firm and less sweet.',
    vibe: 'Getting there. Patience.',
    hue: [70, 80],
    daysToNext: [1, 3],
    recommendations: ['Wait 2–3 days for better sweetness', 'Counter, not fridge'],
    color: '#a4c64a',
    colorSoft: '#e6f1c5',
  },
  3: {
    stage: 3,
    label: 'Yellowish',
    description: 'Mostly green-yellow. Sweetness starting to show up.',
    vibe: 'Almost. Tomorrow-you will thank you.',
    hue: [60, 70],
    daysToNext: [1, 3],
    recommendations: [
      'Wait 1–2 days for peak ripeness',
      'Edible now if you like less sweet',
    ],
    color: '#d8c64a',
    colorSoft: '#f4ecb8',
  },
  4: {
    stage: 4,
    label: 'More Yellow',
    description: 'Mostly yellow with some green. Starches converting to sugars.',
    vibe: 'Eatable. But not yet showing off.',
    hue: [50, 60],
    daysToNext: [1, 3],
    recommendations: ['Wait 1 day for full sweetness', 'Already great for smoothies'],
    color: '#f0c93b',
    colorSoft: '#fbecb0',
  },
  5: {
    stage: 5,
    label: 'Yellow with Green Tips',
    description: 'Yellow with hints of green at the ends. The retail sweet spot.',
    vibe: "This one's having a moment. Ideal for snacking.",
    hue: [45, 50],
    daysToNext: [1, 3],
    recommendations: ['Eat now', 'This is the peak-purchase stage'],
    color: '#f5c518',
    colorSoft: '#fdf2bf',
  },
  6: {
    stage: 6,
    label: 'Yellow',
    description: 'Fully yellow, aromatic, peak eating quality.',
    vibe: 'Peak banana. Eat it before it changes its mind.',
    hue: [40, 45],
    daysToNext: [1, 3],
    recommendations: ['Eat within 1–2 days', 'This is as good as bananas get'],
    color: '#f5a623',
    colorSoft: '#fde2b1',
  },
  7: {
    stage: 7,
    label: 'Yellow with Brown Flecks',
    description: 'Heavily speckled or browning. Overripe for fresh eating.',
    vibe: 'Past peak — but banana bread is calling.',
    hue: [0, 40],
    daysToNext: [2, 5],
    recommendations: [
      'Banana bread, smoothies, freezing',
      'Too sweet/soft for fresh snacking',
    ],
    color: '#8a5a2b',
    colorSoft: '#ead7c1',
  },
};

/**
 * Map a hue (in degrees, 0–360) to a ripeness stage.
 * Direct port of hue_to_stage() in utils/color_detection.py.
 */
export function hueToStage(hue: number): Stage {
  // Boundaries recalibrated 2026-05-22 for real iPhone-camera banana photos.
  // The Python original used color-theory ideals (pure yellow = 60°) but
  // photographed bananas systematically read 15–25° higher than the ideal due
  // to white balance, JPEG compression, and ambient lighting. First TestFlight
  // calibration: a Stage 6/7 banana scanned at hue=40°. Shifting all bounds
  // up by 20° from the Python defaults; further tuning from more data later.
  const h = ((hue % 360) + 360) % 360;
  if (h >= 80 && h <= 140) return 1;
  if (h >= 70 && h < 80) return 2;
  if (h >= 60 && h < 70) return 3;
  if (h >= 50 && h < 60) return 4;
  if (h >= 45 && h < 50) return 5;
  if (h >= 40 && h < 45) return 6;
  if (h >= 0 && h < 40) return 7;
  return 6; // Default for any unmapped hue. Was Stage 3 pre-calibration.
}

/**
 * Estimate days from current stage until peak (stage 6).
 * Direct port of estimate_days_until_peak() in utils/color_detection.py.
 */
export function daysUntilPeak(stage: Stage): number {
  if (stage >= 6) return 0;
  let total = 0;
  for (let s = stage; s < 6; s++) {
    const [min, max] = STAGES[s as Stage].daysToNext;
    total += (min + max) / 2;
  }
  return Math.round(total);
}

/**
 * A short, persona-friendly time-to-peak label.
 *
 *   stage 1 → "Peak in ~7 days"
 *   stage 5 → "Peak in ~2 days"
 *   stage 6 → "At peak"
 *   stage 7 → "Past peak · banana bread"
 */
export function peakLabel(stage: Stage): string {
  if (stage === 6) return 'At peak';
  if (stage === 7) return 'Past peak · banana bread';
  return `Peak in ~${daysUntilPeak(stage)} day${daysUntilPeak(stage) === 1 ? '' : 's'}`;
}

/**
 * Convert a numeric confidence (0–100) to friendly words.
 * Algorithmic confidence is no longer surfaced to the user (the persona
 * doesn't care how confident the algorithm is — they care how good the
 * banana is, see ratingFromStage). Kept for the corrections endpoint
 * payload and any future debug/admin surface.
 */
export function confidenceWord(confidence: number): string {
  if (confidence >= 90) return 'Pretty sure';
  if (confidence >= 75) return 'Fairly sure';
  if (confidence >= 60) return 'Best guess';
  return 'Not sure';
}

/**
 * Banana-readiness rating, 1–5. Implicit use case is "snacking right now"
 * — that's what a casual foodie is asking when they scan a banana.
 *
 *   1 🍌 — Not yet (green, hard)
 *   2 🍌 — Past its prime (overripe for fresh eating; great for baking)
 *   3 🍌 — Eatable (decent, not exciting)
 *   4 🍌 — Solid pick
 *   5 🍌 — Chef's kiss
 *
 * Rating is derived from stage, not stored. This is on purpose: stage
 * is the primary fact, rating is a UI translation of it. Change the
 * mapping here, every screen updates.
 */
export type Rating = 1 | 2 | 3 | 4 | 5;

export function ratingFromStage(stage: Stage): Rating {
  switch (stage) {
    case 1: return 1; // Green, starchy, hard. Not ready.
    case 2: return 2; // Still firm.
    case 3: return 3; // Decent.
    case 4: return 4; // Great snacking territory.
    case 5: return 5; // Retail sweet spot.
    case 6: return 5; // Peak eating quality.
    case 7: return 2; // Overripe for fresh eating (5 if you're baking).
  }
}

/**
 * Persona voice for each rating. Foodie-coded.
 */
export function ratingLabel(rating: Rating): string {
  switch (rating) {
    case 5: return "Chef's kiss";
    case 4: return 'Solid pick';
    case 3: return 'Eatable';
    case 2: return 'Past its prime';
    case 1: return 'Not yet';
  }
}

/**
 * The glyph the rating widget uses at this stage. Bananas in the middle,
 * monkeys at the extremes:
 *   Stage 1 → 🙉 hear-no-evil ("not listening to your impatience")
 *   Stages 2–6 → 🍌
 *   Stage 7 → 🙈 see-no-evil ("can't even look at this banana anymore")
 */
export function ratingGlyph(stage: Stage): string {
  if (stage === 1) return '🙉';
  if (stage === 7) return '🙈';
  return '🍌';
}
