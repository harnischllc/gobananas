# Go Bananas — Handoff (2026-05-10)

This doc gets a fresh Claude session up to speed. Read it top to bottom before touching anything.

## TL;DR

Go Bananas is pivoting from a Flask web app to a native mobile app for App Store + Play Store distribution. The mobile app lives in `mobile/` (Expo SDK 54 + React Native 0.81.5 + expo-router 6 + TypeScript). **Phase A engineering is complete and committed** — the app is technically ready to submit. Phases B–G (privacy policy, store metadata, screenshots, EAS builds, submission) are next and are the gating items between now and Eric tapping "Submit for Review."

The authoritative plan is `~/.claude/plans/frolicking-zooming-frog.md` (outside the repo — global plans dir). The authoritative memory file is `~/.claude/projects/-Users-ericharnisch-Documents-GitHub-Local-Clone-gobananas/memory/project_gobananas.md`. Read both before working.

## Where things live

```
gobananas/
├── app.py, templates/, static/, utils/   ← legacy Flask app (still deployed at gobananas-cmml.onrender.com)
├── mobile/                                ← the actual product going forward
│   ├── app/                               ← expo-router screens
│   │   ├── (tabs)/                        ← 5-tab bar with center Scan action
│   │   │   ├── index.tsx                  ← Home
│   │   │   ├── history.tsx                ← History
│   │   │   ├── scan.tsx                   ← invisible — fires DeviceEventEmitter
│   │   │   ├── bananas.tsx                ← Bunch (Tamagotchi feature)
│   │   │   └── you.tsx                    ← You / settings
│   │   ├── _layout.tsx                    ← root stack, gates rewards route behind __DEV__
│   │   ├── result.tsx                     ← post-scan result modal
│   │   └── rewards.tsx                    ← v2 demo, dev-only
│   ├── components/                        ← BananaRating, DancingBanana, PetBananaCard, etc.
│   ├── lib/
│   │   ├── classify.ts                    ← real on-device classifier (jpeg-js + HSV histogram)
│   │   ├── stages.ts                      ← hueToStage(), STAGES persona copy
│   │   ├── pet.ts                         ← Bunch data layer (environments, events, family naming)
│   │   ├── drops.ts                       ← v2 rewards varieties
│   │   ├── streak.ts                      ← v2 streak math
│   │   ├── history.ts                     ← AsyncStorage-backed scan history
│   │   └── notifications.ts               ← expo-notifications wrapper
│   ├── assets/                            ← icon.png, splash-icon.png, adaptive-icon.png (safe-zone), favicon.png
│   └── app.json                           ← version 1.0.0, buildNumber 1, versionCode 1
├── docs/
│   ├── handoff/                           ← session handoff docs (you are here)
│   └── mockups/                           ← icon-exploration assets
├── .claude/
│   ├── launch.json                        ← dev server configs (Expo Go + Expo web)
│   └── settings.local.json                ← gitignored, Eric's local permissions
└── .cursor/rules                          ← repo-wide IDE rules (Cursor-era, still useful as principles)
```

## What's done (Phase A)

All five items from the plan's Phase A are committed:

- **A1** Classifier ported from Python (`utils/color_detection.py` → `mobile/lib/classify.ts`). Reads JPEG bytes via `expo-file-system/legacy`, decodes with `jpeg-js`, samples every 10th pixel, skips low-saturation pixels, buckets to 5° hue bins, picks dominant, maps to stage via `hueToStage()`. Same algorithm and constants as the Flask version. `demo: true` only on decode failure.
- **A2** v2 rewards gated behind `__DEV__` — both the entry card on the You tab and the `<Stack.Screen name="rewards" />` registration. The code stays on disk; v1.1 flips the flag.
- **A3** "Was this off?" picker stripped from `result.tsx`. DEMO MODE chip and demo footnote also gone. Corrections opt-in toggle on the You tab stays (labeled "Send anonymous corrections," no endpoint yet — opt-in is harmless).
- **A5** Adaptive Android icon regenerated with safe-zone padding (banana scaled to ~66% of the canvas, transparent outside). Composites over `#F5C518` background per `app.json`.
- **A6** Version bumped: `1.0.0`, iOS `buildNumber: 1`, Android `versionCode: 1`.

**A4** (splash screen visual verification) is a manual smoke test — left for Eric to eyeball on device.

Verification: `cd mobile && npx tsc --noEmit` and `npx expo-doctor` both pass.

## What's next (Phases B–G)

Plan file: `~/.claude/plans/frolicking-zooming-frog.md`.

- **Phase B — Privacy + content.** Add `/privacy` route + `templates/privacy.html` to the Flask app (it's still serving `gobananas-cmml.onrender.com`). Draft App Store + Play Store metadata to `docs/store/apple/` and `docs/store/google/` (these dirs don't exist yet — create them). Final privacy URL for both stores: `https://gobananas-cmml.onrender.com/privacy`.
- **Phase C — Marketing assets.** iOS screenshots at 6.7", 6.5", 5.5". Android phone screenshots. 1024×500 feature graphic for Google. Eric drives the screenshots (needs his device/simulator).
- **Phase D — Build infra.** `npm install -g eas-cli`, `eas login`, `eas build:configure`, then `eas build --platform ios --profile production` and same for android. ~15–25 min each on EAS cloud.
- **Phase E — Apple.** App Store Connect new app (bundle `com.harnischllc.gobananas`), `eas submit --platform ios`, fill metadata, submit. Apple reviews 1–3 days.
- **Phase F — Google.** Play Console new app, `eas submit --platform android`, fill metadata + Data Safety, internal testing track first.
- **Phase G — Post-submission.** Monitor, fix rejections, announce.

## Critical decisions baked in (override at review)

These were locked during the brainstorm in the previous session. Don't re-litigate without asking Eric:

- **On-device classification only for v1.** No upload to server. Corrections endpoint is v1.1.
- **Hybrid architecture target** (on-device + future corrections endpoint), not pure offline forever.
- **v2 rewards (streaks/drops/varieties) is dev-only for v1.** Reviewer-safe. Flip `__DEV__` in v1.1.
- **Bunch feature ships in v1.** Family-naming, 5–8 bananas, environment-based ripening, random foreground events.
- **Persona: late-20s American casual foodie, humor-friendly.** Voice already baked into `stages.ts` copy.
- **5-tab bar with center Scan action button.** Scan is not a tab — it's an event emitter (DeviceEventEmitter `SCAN_REQUEST_EVENT`) that any tab can listen to.
- **5-🍌 ratings, not confidence percent**, with stage-specific glyphs (🙉 stage 1, 🍌 stages 2–6, 🙈 stage 7).
- **Bundle ID `com.harnischllc.gobananas`** — already in `app.json`, must match App Store Connect / Play Console exactly.

## Known gotchas

- **`npm install` always needs `--legacy-peer-deps`** in `mobile/`. `react-dom@19` has a peer conflict that expo-linear-gradient triggers. Standard pattern across the project — don't fight it.
- **`expo-file-system` v55 ships a new modular API that doesn't expose `readAsStringAsync` the way SDK 54 expects.** Classifier uses `import * as FileSystem from 'expo-file-system/legacy';`. Don't "fix" the import — it's intentional.
- **`expo-notifications` is pinned to `~0.32.17`** for SDK 54. Auto-installer wants 55.x; that's wrong for this SDK.
- **`preview_start` for the Flask app TCC-fails** reading `app.py` ("Operation not permitted") because system python3 lacks Full Disk Access for `~/Documents/`. Workarounds: grant FDA to `/usr/bin/python3` in System Settings → Privacy & Security, OR launch Flask via `Bash` with `run_in_background: true`. Don't keep retrying `preview_start` — it'll loop.
- **JPEG paths sometimes come in with `.png` extensions** when generated/saved from AI tools. Convert with `sips -s format png -z 1024 1024 file.png --out file.png` if you see a "JPEG with wrong extension" error. The icon went through this.
- **`mobile/` has its own `.gitignore`** that excludes `node_modules/`, `.expo/`, generated `/ios` and `/android` dirs. Don't duplicate those in the root gitignore.
- **`__DEV__` is a React Native global** — true in `expo start`, false in `eas build --profile production`. Use it directly, no import needed.

## How to resume

1. **Open the plan**: `~/.claude/plans/frolicking-zooming-frog.md` — has Phases A–G with file-level execution detail.
2. **Read project memory**: `~/.claude/projects/-Users-ericharnisch-Documents-GitHub-Local-Clone-gobananas/memory/project_gobananas.md`.
3. **Search Open Brain** for prior context: tags `phase-a-complete`, `session-end`, `gobananas`. Capture id 58 has the most recent state snapshot.
4. **Start dev servers** if doing hands-on work: see `.claude/launch.json`. Expo Go (port 8081) for phone, Expo web (port 8091) for browser preview.
5. **Verify nothing broke** before changing anything: `cd mobile && npx tsc --noEmit && npx expo-doctor`. Should be clean.

## Test plan before submission

End-to-end smoke before pressing submit on either store:

- Cold-start the app.
- Take 3 photos: green-ish banana → stage 1–3, yellow → stage 4–6, brown → stage 7. Confidence should land 60–95%.
- Plant a bunch of 5, name the family, set environment.
- Trigger an event (force-quit and reopen — random foreground events fire).
- Eat one at peak, see verdict screen.
- Confirm rewards card and "Was this off?" button are **absent** in the production build (they should only appear with `expo start`).
- Confirm DEMO MODE chip is **absent** on the result screen.

## Open questions for Eric (next session)

- Which Phase B/C tasks do you want delegated vs. driven hands-on? (Privacy policy + metadata drafts can be Claude-led. Screenshots have to be you.)
- Are you signed in to the Expo CLI yet? `eas login` needed before Phase D.
- Do you want to keep the Flask app deployed past store approval, or sunset it once the mobile app is live?
