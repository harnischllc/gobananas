# Go Bananas — Handoff (2026-05-10)

This doc gets a fresh Claude session up to speed. Read it top to bottom before touching anything.

## ⚠️ STOP — REPO HAS TWO PARALLEL MOBILE PIVOTS

Both shipped to `origin/main`. They use the **same bundle identifier** (`com.harnischllc.gobananas`), so only one can be submitted to App Store Connect / Play Console under that ID. Eric needs to decide which one to ship before any submission work.

| | **Track 1: Capacitor** | **Track 2: Expo + RN** |
|---|---|---|
| When built | April 11–12, 2026 (separate session) | May 10, 2026 (this session) |
| Approach | Native shell wraps live Flask site in a WebView | Fully native React Native app, on-device classifier |
| Location in repo | root + `android/` + `ios/` + `package.json` + `capacitor.config.json` | `mobile/` (self-contained Expo app) |
| Server dependency | Hard requirement (`server.url: https://gobananas-cmml.onrender.com`) | None for v1 (corrections endpoint is v1.1) |
| Privacy policy | ✅ Done (`templates/privacy.html`) | ⏳ Plan B1 — pending (can reuse Track 1's privacy page) |
| Visual design | ✅ "Warm banana identity" redesign across Flask templates | ✅ Native UI built from scratch w/ persona |
| Native camera | ✅ `@capacitor/camera` + device registration | ✅ `expo-image-picker` |
| Push notifications | ✅ `@capacitor/push-notifications` | ✅ `expo-notifications` |
| Feedback / learning loop | ✅ `utils/learning.py` + DB + `tests/test_learning.py` | ⏳ v1.1 |
| Classifier | Server-side (Flask `utils/color_detection.py`) | On-device (`mobile/lib/classify.ts`, jpeg-js port of same algorithm) |
| Bunch Tamagotchi feature | ❌ Not implemented | ✅ Built — bunch of 5–8 named bananas, environment-based ripening, random foreground events |
| App Store posture | ⚠️ **Risk: Guideline 4.2** ("thin WebView wrappers" often rejected) | Safer — true native code |

**Default recommendation if Eric hasn't picked yet:** Track 2 (Expo) wins. Native > thin WebView for App Store review, on-device classification is faster + private, and the bunch feature is real native UX that doesn't translate to a WebView. But Track 1 has the privacy policy + visual redesign + learning system already shipped — non-trivial work to throw away.

## What's on `origin/main` right now

Two streams of commits, in order:

1. **April 11–12 (Track 1, Capacitor)** — 17 commits ending at `ef05a50 Merge pull request #2 from harnischllc/feature/mobile-app`. Brought in: Capacitor iOS+Android projects, native camera, push notifications, feedback API, learning system, DB models + Flask-Migrate, privacy policy, visual redesign, native camera capture, ripeness alerts, iOS safe-area fixes, SPA frontend with inline JSON results.
2. **May 10 (Track 2, Expo)** — 2 commits: `ca30ab4 Pivot to native mobile app (Expo + RN, Phase A complete)` and `77cabf5 Add session handoff doc for mobile pivot`. Brought in: entire `mobile/` Expo app.

## Where things live

```
gobananas/
├── app.py, templates/, static/, utils/, models.py, migrations/   ← Flask app (still live at gobananas-cmml.onrender.com)
│                                                                     also the backend for Track 1 Capacitor (WebView target)
├── templates/privacy.html                                        ← TRACK 1 — privacy policy (URL: /privacy)
├── utils/learning.py, tests/test_learning.py                     ← TRACK 1 — feedback/learning system
├── android/, ios/                                                ← TRACK 1 — Capacitor native projects
├── capacitor.config.json                                         ← TRACK 1 — appId com.harnischllc.gobananas, webDir static, server.url Render
├── package.json (root)                                           ← TRACK 1 — @capacitor/* deps
│
├── mobile/                                                       ← TRACK 2 — Expo app, self-contained
│   ├── app/                                                          expo-router screens
│   │   ├── (tabs)/                                                   5-tab bar w/ center Scan action button
│   │   │   ├── index.tsx                                             Home
│   │   │   ├── history.tsx
│   │   │   ├── scan.tsx                                              invisible — emits DeviceEventEmitter
│   │   │   ├── bananas.tsx                                           Bunch Tamagotchi
│   │   │   └── you.tsx
│   │   ├── _layout.tsx                                               root stack, gates rewards behind __DEV__
│   │   ├── result.tsx                                                post-scan modal
│   │   └── rewards.tsx                                               v2 demo, dev-only
│   ├── components/
│   ├── lib/
│   │   ├── classify.ts                                               on-device JPEG decode + HSV histogram (port of utils/color_detection.py)
│   │   ├── stages.ts                                                 hueToStage(), STAGES persona copy
│   │   ├── pet.ts                                                    bunch data layer
│   │   ├── drops.ts, streak.ts                                       v2 rewards (dev-only)
│   │   ├── history.ts                                                AsyncStorage
│   │   └── notifications.ts                                          expo-notifications
│   ├── assets/                                                       icon (1024×1024), splash, adaptive (safe-zone), favicon
│   └── app.json                                                      v1.0.0, buildNumber 1, versionCode 1, bundle com.harnischllc.gobananas
│
├── docs/
│   ├── handoff/                                                  ← you are here
│   └── mockups/
└── .claude/
    ├── launch.json                                               ← dev server configs (Expo Go + Expo web)
    └── settings.local.json                                       ← gitignored
```

## What's done — Track 2 (Expo), Phase A

All five engineering items committed in `ca30ab4`:

- **A1** Classifier ported from `utils/color_detection.py` → `mobile/lib/classify.ts`. Reads JPEG bytes via `expo-file-system/legacy`, decodes with `jpeg-js`, samples every 10th pixel, skips low-saturation pixels, buckets to 5° hue bins, picks dominant, maps via `hueToStage()`. `demo: true` only on decode failure.
- **A2** v2 rewards gated behind `__DEV__` — entry card on You tab + `<Stack.Screen name="rewards" />` registration. Code stays on disk; v1.1 flips the flag.
- **A3** "Was this off?" picker, DEMO MODE chip, and demo footnote stripped from `result.tsx`. Corrections opt-in toggle on You tab stays (labeled "Send anonymous corrections", harmless without endpoint).
- **A5** Adaptive Android icon regenerated with safe-zone padding (banana ~66% of canvas, transparent outside). Composites over `#F5C518` per `app.json`.
- **A6** Version bump: `1.0.0`, `buildNumber: "1"`, `versionCode: 1`.

**A4** (splash screen visual verification) — manual smoke for Eric on device.

Verification: `cd mobile && npx tsc --noEmit && npx expo-doctor` both clean.

## What's done — Track 1 (Capacitor), partial Phase B/C

Already shipped via PR #2 on April 12:

- Privacy policy at `templates/privacy.html`, served at `/privacy` route in `app.py`. URL: `https://gobananas-cmml.onrender.com/privacy`.
- Visual redesign with warm banana identity, Nunito font, CTA contrast fixes, banana-icon home-nav.
- Capacitor iOS + Android projects (Xcode + Gradle ready).
- DB layer (Postgres on Render, Flask-Migrate, `models.py`).
- Feedback API + learning system (`utils/learning.py`, `tests/test_learning.py`).
- Native camera capture via `@capacitor/camera`.
- Push notifications via `@capacitor/push-notifications`.
- Ripeness alerts.

## What's next (depends on which track Eric picks)

Plan file: `~/.claude/plans/frolicking-zooming-frog.md` — written assuming Track 2 (Expo). Reality check: several Phase B items are already done in Track 1.

**If Track 2 (Expo) wins:**
- B1 Privacy policy ✅ already done by Track 1 — just point at the URL.
- B2/B3 Store metadata — draft to `docs/store/apple/` and `docs/store/google/`.
- B4/B5 Apple privacy labels + Google Data Safety — Expo track has zero data collection by design.
- C1/C2 Screenshots — Eric drives.
- C3 Feature graphic (1024×500 for Google).
- D Build infra: `eas build` for iOS + Android.
- E Apple submission.
- F Google submission.
- Cleanup: decide whether to delete or archive Track 1 (`android/`, `ios/`, root `package.json`, `capacitor.config.json`, `models.py`, `migrations/`, `utils/learning.py`). Keeping them just clutters the repo if Expo is the canonical path.

**If Track 1 (Capacitor) wins:**
- B2/B3 Store metadata — draft.
- B4 Apple privacy labels — be honest about server-side classification + DB. Photos transmitted to `gobananas-cmml.onrender.com`.
- B5 Google Data Safety — same.
- C1/C2 Screenshots — of the Flask web app inside the Capacitor shell. Eric drives.
- C3 Feature graphic.
- D Build infra: Xcode + Android Studio direct builds (or EAS-like alternative).
- E Apple submission — **prepare for possible Guideline 4.2 pushback**. Show that the native shell adds value beyond the website (camera plugin, push notifications, native UX patterns).
- F Google submission.
- Cleanup: archive or delete `mobile/`.

## Critical decisions baked in (Track 2 — Expo)

Locked during the May 10 session brainstorm. Don't re-litigate without Eric:

- **On-device classification only for v1.** No upload. Corrections endpoint is v1.1.
- **Hybrid architecture target** (on-device + future corrections endpoint).
- **v2 rewards (streaks/drops/varieties) is dev-only for v1.** Flip `__DEV__` in v1.1.
- **Bunch feature ships in v1.** Family-naming, 5–8 bananas, environment-based ripening, foreground events.
- **Persona: late-20s American casual foodie, humor-friendly.** Voice in `stages.ts`.
- **5-tab bar with center Scan action button.** Scan is a DeviceEventEmitter event, not a tab screen.
- **5-🍌 ratings, not confidence percent.** Stage glyphs: 🙉 stage 1, 🍌 stages 2–6, 🙈 stage 7.

## Known gotchas

- **`npm install` in `mobile/` needs `--legacy-peer-deps`.** `react-dom@19` peer conflict with expo-linear-gradient. Don't fight it.
- **`expo-file-system` v55 broke `readAsStringAsync`.** Classifier uses `import * as FileSystem from 'expo-file-system/legacy';`. Intentional.
- **`expo-notifications` pinned to `~0.32.17`** for SDK 54.
- **Flask `preview_start` TCC-fails** reading `app.py`. Workaround: grant FDA to `/usr/bin/python3`, or launch via `Bash` background.
- **AI-generated JPEGs sometimes save as `.png`.** Convert with `sips -s format png -z 1024 1024 file.png --out file.png`.
- **`mobile/.gitignore` covers Expo-specific stuff.** Root `.gitignore` covers Flask + Capacitor.
- **`__DEV__` is a React Native global.** True in `expo start`, false in `eas build --profile production`.
- **Same bundle ID `com.harnischllc.gobananas` is set in BOTH `capacitor.config.json` AND `mobile/app.json`.** App Store Connect / Play Console will not accept the same bundle ID for two apps. Pick one before submitting.

## How to resume

1. **First action:** confirm with Eric which track (Capacitor or Expo) he wants to ship. Don't proceed past this without an answer.
2. Read `~/.claude/plans/frolicking-zooming-frog.md` (assumes Track 2).
3. Read `~/.claude/projects/-Users-ericharnisch-Documents-GitHub-Local-Clone-gobananas/memory/project_gobananas.md` for full project memory.
4. Search Open Brain: tags `phase-a-complete`, `dual-architecture`, `gobananas`, `session-end`.
5. Verify state: `cd mobile && npx tsc --noEmit && npx expo-doctor`. For Capacitor track, `cd .. && npm install && pytest tests/`.

## Open questions for Eric

- **Which track ships?** Capacitor (close to submission but Apple 4.2 risk) or Expo (true native, more remaining work)?
- After deciding: archive or delete the other track's files?
- Is the Flask backend staying live forever (Track 1 hard-depends on it) or eventually sunset (Track 2 doesn't care)?
