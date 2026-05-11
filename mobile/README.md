# Go Bananas — Mobile

Expo / React Native demo build for the Go Bananas banana ripeness app.
Sibling to the existing Flask web app at the repo root.

**Status: v0.1 demo.** UI is real; classification is currently mocked
with a clear "DEMO MODE" indicator on the result screen. Replacing the
mock with the on-device port of `utils/color_detection.py` is the next
implementation chunk.

## Run it on your phone in 3 steps

1. Install **Expo Go** on your iPhone or Android phone (free, App Store / Play Store).
2. From this directory:
   ```bash
   cd mobile
   npm start
   ```
   (or `npx expo start` — same thing)
3. Scan the QR code that appears in your terminal with:
   - **iOS**: the built-in Camera app (it'll offer to open in Expo Go)
   - **Android**: the Expo Go app's "Scan QR code" button

Phone and computer must be on the same Wi-Fi network. If they're not,
press `s` in the terminal to switch to **tunnel** mode (slower but
crosses networks) and rescan.

## What's in here

```
mobile/
├── app/                      # expo-router screens (file-based routes)
│   ├── _layout.tsx           # Root stack: tabs + result modal
│   ├── result.tsx            # Result screen (modal)
│   └── (tabs)/
│       ├── _layout.tsx       # Bottom tab bar
│       ├── index.tsx         # Scan / Home
│       ├── history.tsx       # Local scan history
│       ├── bananas.tsx       # 7-stage USDA scale, plain English
│       └── you.tsx           # Settings stub + corrections opt-in
├── components/
│   ├── ScanCard.tsx          # The yellow "scan with camera" hero card
│   ├── HistoryRow.tsx        # One row in any history list
│   └── StageDot.tsx          # The colored stage badge
└── lib/
    ├── stages.ts             # Port of utils/constants.py + hueToStage()
    ├── classify.ts           # MOCKED classifier — replace next
    ├── history.ts            # AsyncStorage wrapper for scan records
    └── theme.ts              # Colors, spacing, shadows
```

## What works in the demo

- Home screen with hero scan card matching `docs/mockups/homescreen-concept-v1.html`
- Tap "Scan with camera" → camera permission flow → take photo
- "Analyzing…" state, then a result screen with stage, days-to-peak,
  confidence (words and number), playful one-liner, suggestions
- Result auto-saves to local history (AsyncStorage)
- History tab lists every scan, taps re-open the result
- "Bananas" tab explains all 7 stages with persona-friendly copy
- "You" tab has the corrections opt-in toggle (UI only — no endpoint)
- "Was this off?" button on the result screen with a stub correction flow
- Share Sheet integration for bragging about a peak banana

## What's faked

- **Classification.** `lib/classify.ts` returns a deterministic-but-varied
  result keyed off the image URI hash. Same photo → same result. Different
  photos → different results. Convincing enough to test the UX, useless
  as an actual classifier.

  The real port: pixel decode from the captured image (likely via
  `jpeg-js` in pure JS, or a thin native module if we leave Expo Go),
  then the histogram + dominant-hue logic that's already in
  `utils/color_detection.py`. About a half-day of work on its own.

- **Corrections endpoint.** The opt-in toggle and the "Was this off?"
  flow exist but don't POST anywhere. Endpoint design is a separate
  spec.

## Editing the app

Saves hot-reload in Expo Go. Just save the file and the phone updates.
If state gets weird, shake the phone → "Reload."

## Why React Native, not Flutter

We picked Flutter in the brainstorm. Switched to React Native + Expo
when the request became "preview on my phone via Expo Go" — Expo Go is
React Native specifically. Tradeoffs are similar (one codebase, both
stores) and JS is closer to the Flask app's web stack. Both are valid;
this is the path that lets us iterate fastest right now.
