# Go Bananas 🍌

A native iOS + Android app that tells you when a banana is at its peak. Point your camera, get a ripeness rating. No upload, no account, no tracking. The classifier runs entirely on the device.

A second mode, the **Bananas** tab, lets you plant a virtual bunch of 5–8 bananas and stages their ripening based on where you store them (counter, basket, paper bag, windowsill, hook, fridge) using real-world rates.

Built by [Harnisch LLC](https://harnischllc.com) and published on Google Play as **Loggerhead Creative**.

## Where it is right now

- **iOS:** in TestFlight at App Store Connect App ID `6772261640` (listing name "Go Bananas: Banana Scanner"). Not yet submitted for App Store review.
- **Android:** Google Play Console app created at Play App ID `4973024295102408133` (publisher "Loggerhead Creative"). Internal testing track wired up via EAS submit.
- **Bundle ID:** `com.harnischllc.gobananas` (matches across both stores).
- **Public landing + privacy policy:** https://harnischllc.github.io/gobananas/ (served from `/docs/` on `main` via GitHub Pages).

## What the app does

- **Scan** — take a photo, the app reads the dominant peel hue, maps it to a 7-stage USDA-style ripeness scale, and returns a 5-banana rating with persona-voiced suggestions ("Chef's kiss", "Solid pick", "Past its prime").
- **History** — every scan saved locally with a tap-to-reopen list. Stays on the device, never synced.
- **Bananas tab (the bunch)** — Tamagotchi-style resource game. Plant a named bunch (Phil, Carla, Greg, etc.), each banana ripens independently based on environment multiplier (counter 1.0×, basket 1.2×, paper bag 1.5×, windowsill 2.0×, hook 0.85×, fridge 0.4× with the "skin browns cosmetically, flesh stays fine" educational blurb). Eat at peak before random events (monkeys, roommates, birds) take them.
- **You tab** — settings, opt-in toggle for future anonymous corrections (v1.1).

## Tech

- **Mobile:** Expo SDK 54, React Native, TypeScript, expo-router 6, expo-image-picker for camera, AsyncStorage for history, expo-notifications for peak alerts.
- **Classifier:** in-process JavaScript. `mobile/lib/classify.ts` decodes the captured JPEG via `jpeg-js`, samples pixels, computes the dominant hue, and `mobile/lib/stages.ts` maps it to a stage. Calibrated against real iPhone-camera banana photos (the Python original was calibrated against color theory and read ~20° too low).
- **Build / submit:** Expo Application Services (EAS). `mobile/eas.json` is the source of truth for build profiles (development, preview, production) and submit metadata (iOS ASC App ID + Apple Team baked in; Android service-account path baked in).
- **Hosting:** GitHub Pages for the static landing + privacy page. No backend in v1. v1.1 will likely add a tiny corrections endpoint on Cloudflare Workers.

## Repo layout

```
gobananas/
├── mobile/                 the whole product (Expo + RN, what users install)
│   ├── app/                expo-router screens (Home, History, Bananas, You, scan, result)
│   ├── components/         shared UI (ScanCard, StageDot, DancingBanana, etc.)
│   ├── lib/                classify.ts, stages.ts, history.ts, pet.ts, theme.ts
│   ├── assets/             icons, splash, fonts
│   ├── app.json            bundle IDs, version numbers, plugin config
│   └── eas.json            build + submit profiles for EAS
├── docs/                   GitHub Pages site + store metadata + handoffs
│   ├── _config.yml         Jekyll config — excludes /store, /handoff, /mockups, /plans
│   ├── index.md            landing page (Apple + Google support URL)
│   ├── privacy.md          privacy policy (Apple + Google privacy URL)
│   ├── store/              Apple + Google listing drafts (internal, not published)
│   ├── handoff/            chronological session notes (internal, not published)
│   ├── mockups/            visual reference material (internal, not published)
│   └── plans/              detailed plan files (internal, not published)
├── .claude/                Claude Code config (launch.json, hooks, agent worktrees)
└── README.md               this file
```

## Running locally

You only need to touch `mobile/`. The rest is docs + config.

```bash
cd mobile
npm install --legacy-peer-deps
npx expo start
```

Scan the QR code with the Expo Go app on your phone (must be on the same Wi-Fi as your Mac). Or hit `s` in the terminal to switch to tunnel mode.

The `--legacy-peer-deps` is required because react-dom@19 conflicts with expo-linear-gradient's pinned peer. Without it, npm refuses to resolve.

### Health checks before any dep change

```bash
cd mobile
npx tsc --noEmit      # must be silent
npx expo-doctor       # must be 18/18
```

## Build + submit

All builds run on Expo's cloud via EAS. There is no Xcode or Android Studio toolchain required locally.

```bash
cd mobile
npx -y eas-cli@latest build --platform all --profile production --auto-submit
```

This compiles iOS + Android builds in parallel on Expo's servers, then auto-submits the iOS build to App Store Connect (TestFlight) and the Android AAB to Google Play Console (internal testing track, draft state).

Credentials baked in (see `mobile/eas.json`):
- iOS submit: ASC App ID, Apple Team ID, Apple ID
- Android submit: path to Google Play service-account JSON (lives outside the repo at `~/.config/eas/harnisch-llc-play-service-account.json`)

For first-time setup on a fresh machine see `docs/handoff/2026-05-12-build-pipeline-ready.md`.

## License

Source is not currently open. Contact Harnisch LLC for any reuse questions.
