# Changelog

<!-- voice-ok: the double hyphens in the npm commands below are npm's argument separator -->

Versions follow `mobile/app.json`. Build numbers are the iOS `buildNumber`
and Android `versionCode`, which move together.

## 1.1.0 (build 15), 2026-10-14

Six changes picked and then revised by a review panel (product, comedy,
React Native engineering, a skeptic). User-facing copy below is a first
draft for Eric to revise.

### Classifier
- **Nearest-band stage mapping.** `hueToStage` used to fall through to
  Stage 6 ("Peak banana") for any color no band claimed, so a pink wall
  or a teal scene read as peak. Every hue now maps to its nearest band.
- **Center-weighted median.** Pixels in the middle 60% of each axis weigh
  3x. A centered banana now beats a wood counter or green cloth that fills
  the border; the old plain median lost that vote. Pixel math moved to
  `lib/hue.ts` (import-free) so it is unit tested.
- **Not a banana.** Frames with under 3% banana-colored pixels, or whose
  dominant color is teal or magenta, return a not-a-banana result (🙊)
  instead of the old bogus "Stage 3, Yellowish". Own result card, own
  history row, no correction chips. Third one in a row gets a sharper
  line. Decode failures now show a "couldn't read that photo" card too,
  instead of a fake Stage 4 "Eatable".
- **Confidence number fixed and hidden.** The build 14 formula was
  inverted (band edge = 100%, center = 50%) and was fed the 5°-rounded
  hue, so Stages 5 and 6 could only print 100. The result card no longer
  shows a percentage. The corrected score (`stageConfidence`, computed
  from the unrounded hue) rides in the corrections payload, which now
  also sends the hue at 1° resolution.

### Corrections loop
- **Inline consent.** The live table had 0 rows since 2026-06-13 because
  consent was an off-by-default toggle on the You tab. The first time you
  correct a stage, the result card asks "Send this one in?" with Send it /
  Keep it on my phone. Consent is tri-state now (never asked / on / off)
  so a decline is not re-asked. Declined users get a one-tap "Send
  anonymously" on later corrections. Nothing new is collected.

### Humor
- **Asides.** Rare one-liners that replace the stage vibe for one scan and
  ride into the share text: "Scan 100. The bananas recognize you now."
  (lifetime scan 100, new counter since history caps at 50), "Seven today.
  Technically a bunch." (7th banana scan of the day, weekly cap),
  "Midnight banana. Nobody has to know." (00:00 to 03:59, weekly cap).
  Chosen at scan time and stored on the record.
- **Family-name reactions.** Planting a bunch named after a roster banana
  ("Phil"), "The Monkeys", "The Smiths" (typed, not defaulted), "Second
  Banana", "Avocados", "Test", "Gros Michel" or "Cavendish" adds a 🐒 line
  to the story log. `lib/nameReactions.ts`.

### Housekeeping
- Em dashes removed from all user-facing strings (share text, stage 7
  vibe, bunch events, environment blurbs, rewards copy).
- The "Why hue?" footer on the Bananas tab quoted pre-recalibration
  numbers (yellow ~25°, brown under 20°); now matches the stage table.
- Expo SDK 54 patch bumps via `expo install --fix` (expo ~54.0.37,
  expo-router ~6.0.24 and friends).
- `npm test` runs `node --test lib/__tests__/` (Node's built-in runner, no
  framework; 22 tests). `npm run fixtures -- <photos>` prints the shipped
  classifier's decision for real JPEGs.

## 1.0.0 (build 14), 2026-07

Public release on both stores. Banana facts, SVG banana-mark branding,
anonymous corrections loop, You-tab lede fix, rewards loop (daily crate,
streak, collection, hammocks). History before this lives in git.
