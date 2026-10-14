# Go Bananas: Mobile

Expo / React Native app for Go Bananas (banana ripeness scanner). This
folder is the whole product; the old Flask web app and Capacitor shell were
deleted in May 2026 and are not coming back.

**Status: live on both stores.** iOS App Store and Google Play carry 1.0.0
(build 14). The repo is at 1.1.1 (build 16); see `CHANGELOG.md`.
Classification is real and on-device (`lib/classify.ts` + `lib/hue.ts` +
`lib/decision.ts`).

## Run it on your phone

1. Install **Expo Go** on your iPhone or Android phone.
2. From this directory:
   ```bash
   cd mobile
   npm start
   ```
3. Scan the QR code with the Camera app (iOS) or Expo Go (Android).

Phone and computer must be on the same Wi-Fi. If not, press `s` in the
terminal for tunnel mode and rescan.

## Test and ship

```bash
npm test                                   # unit tests + the real-photo corpus gate (voice-ok)
npm run fixtures                           # corpus gate alone: fixtures/photos vs expectations.json
npm run fixtures -- ~/path/to/photos       # ad hoc: classifier decision for JPEG or HEIC files
npm run fixtures:add -- ~/Downloads/IMG_1.HEIC 5   # label a photo (1-7, not, unsure) into the corpus
npm run stats -- ~/Downloads/IMG_1.HEIC    # the pixel statistics behind a reading
npx tsc --noEmit -p .                      # type check
```

The corpus is the contract for every threshold in `lib/hue.ts`: no number
there changes unless `npm run fixtures` passes, and every misread photo is
added with its label before the fix is written. Photos are shrunk to 800 px
and re-encoded on the way in, which strips EXIF and GPS.

Bump `app.json` `ios.buildNumber` and `android.versionCode` by hand before
shipping (`appVersionSource` is `local`), then:

```bash
npm run ship:ios       # EAS build + auto-submit to TestFlight
npm run ship:android   # EAS build + auto-submit to Play internal (draft)
npm run ship           # both
```

## What's in here

```
mobile/
├── app/                      # expo-router screens (file-based routes)
│   ├── _layout.tsx           # Root stack: tabs + modals
│   ├── result.tsx            # Result screen: stage, aside, corrections, not-a-banana
│   ├── rewards.tsx           # Daily crate, streak, variety collection
│   └── (tabs)/
│       ├── _layout.tsx       # Bottom tab bar (center Scan button fires the camera)
│       ├── index.tsx         # Home: scan card, bunch preview, fact, crate, recent
│       ├── history.tsx       # Local scan history
│       ├── bananas.tsx       # The bunch game + the 7-stage USDA scale
│       └── you.tsx           # Settings, corrections toggle, about
├── components/               # Cards, rows, the dancing banana, crate animation
├── lib/
│   ├── hue.ts                # Pixel math: candidate filter, center-weighted median, banana/unsure/not verdict
│   ├── decision.ts           # Reading to result: rounding, stage, confidence (no RN imports, runs in Node)
│   ├── classify.ts           # Expo side: JPEG read + decode, hands pixels to decision.ts
│   ├── stages.ts             # 7 stages, hueToStage (nearest band), stageConfidence
│   ├── history.ts            # AsyncStorage scan records, lifetime scan counter
│   ├── asides.ts             # Rare one-liners chosen at scan time
│   ├── corrections.ts        # Anonymous corrections POST, tri-state consent
│   ├── nameReactions.ts      # Easter-egg replies to bunch family names
│   ├── pet.ts / hammock.ts   # The bunch game
│   ├── drops.ts / streak.ts  # Rewards loop
│   ├── bananaFacts.ts        # 61 curated facts
│   └── theme.ts              # Colors, spacing, shadows
├── lib/__tests__/            # node --test specs (*.mjs importing the .ts directly)
├── fixtures/
│   ├── photos/               # Real-photo regression corpus (800 px, no EXIF)
│   └── expectations.json     # filename -> 1-7 | NOT_BANANA | UNSURE
└── scripts/
    ├── node-ts-resolver.mjs  # Lets Node import the app's .ts files (type stripping)
    ├── classify-fixtures.mjs # Corpus gate, or ad hoc decisions for given photos
    ├── fixtures-add.mjs      # Convert, shrink, strip, label a photo into the corpus
    └── hue-stats.mjs         # Pixel statistics behind a reading
```

## Editing the app

Saves hot-reload in Expo Go. If state gets weird, shake the phone and tap
Reload. Unit tests import `lib/*.ts` straight into Node (type stripping),
so anything they touch must stay free of React Native imports.
