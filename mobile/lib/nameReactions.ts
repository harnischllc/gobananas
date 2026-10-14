/**
 * Reactions to the family name people type when planting a bunch. The name
 * field is the one surface users already poke with jokes, so it gets a small
 * pool of replies, each seen once per bunch, posted to the story log right
 * after the "arrived" line. Pure function, no imports. Copy is Eric's.
 */

/** Roster first names are passed in by pet.ts to avoid an import cycle. */
export function nameReaction(
  typedName: string,
  roster: readonly string[],
): string | null {
  const raw = typedName.trim();
  if (!raw) return null;
  const key = normalize(raw);

  const firstName = roster.find((n) => normalize(n) === key);
  if (firstName) {
    return `${firstName} is a banana, not a family. Proceeding anyway.`;
  }

  return REACTIONS[key] ?? null;
}

const REACTIONS: Record<string, string> = {
  monkeys: 'Bold. The monkey has noted this.',
  monkey: 'Bold. The monkey has noted this.',
  smiths: 'Finally. A family that eats its bananas.',
  bananas: 'The Bananas. Very on brand.',
  banana: 'The Bananas. Very on brand.',
  'second banana': 'Second banana? The avocado will be thrilled.',
  'second bananas': 'Second banana? The avocado will be thrilled.',
  avocados: 'An avocado raising bananas. Brave.',
  avocado: 'An avocado raising bananas. Brave.',
  test: 'Test. Classic. The bananas are real, though.',
  testing: 'Test. Classic. The bananas are real, though.',
  asdf: 'Test. Classic. The bananas are real, though.',
  'gros michel': "A Gros Michel. We're not supposed to have those anymore.",
  cavendish: "Cavendish. That's every banana at the store. Ambitious.",
};

/** Lowercase, drop a leading "the", strip punctuation, collapse spaces. */
export function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^the /, '');
}
