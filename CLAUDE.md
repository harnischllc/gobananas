# Project Context for Claude

Read this before any work. If something's not covered here, ask before assuming.

## What this is

Go Bananas (full name: "Go Bananas: Banana Scanner") is a native mobile app (iOS + Android) that scans bananas with the camera and classifies their ripeness stage using a custom hue-based classifier. Solo hobby project run under Harnisch LLC. iOS is in TestFlight (Beta Bananas external group with a public join link, plus the internal Team Expo group); latest is build 1.0.0 (12), uploaded 2026-06-02 (Apple processing; carries the tappable drop-detail modal, the collection/empty-state contrast fixes, and the Second Banana avocado copy; internal Team Expo gets it automatically, external Beta Bananas still needs a "What to Test" + Beta-review submit). Android is in Google Play internal testing, latest versionCode 4 (Loggerhead Creative dev account). 10 of 11 Play Console setup tasks done as of 2026-05-24, only Store listing remains. No public release on either store yet.

Stack: Expo + React Native, the mobile app lives in `mobile/`. EAS build pipeline: `npm run ship:ios` from `mobile/` builds and auto-submits to TestFlight in one step. `appVersionSource` is `local` (reverted from `remote` on 2026-05-24 in commit `79c0476` because remote got stuck on buildNumber 4), so bump `mobile/app.json` `ios.buildNumber` manually BEFORE each ship. Marketing + privacy site lives in a separate repo at `github.com/harnischllc/bananascanner-website`, deployed to a Cloudflare Worker at `https://bananascanner.com`. The `/docs` folder in this repo is the old GitHub Pages site, now stale and replaced by bananascanner.com.

## What it used to be

- Originally a Flask webapp wrapped in a Capacitor shell to act as a "mobile" app. That whole approach was killed on 2026-05-10 in commit `e945d1e`.
- The Render service that hosted the Flask backend is fully shut down as of 2026-05-24. The SessionEnd hook in `.claude/settings.json` that reminded about this can be removed if you find it noisy.
- Don't resurrect the Flask backend, Capacitor shell, or any browser-runtime path. `mobile/` is the entire product.

## My skill by area

- **Strong:** Python, Flask, web HTML/CSS, server deploys, git basics, general scripting.
- **Weak or learning:** React Native, Expo, EAS build/submit, TestFlight, App Store Connect, iOS code signing, Xcode, Apple Developer Program plumbing in general. Same level of weak on the Android side: Google Play Console, internal/closed/open testing tracks, Play store listing requirements, content rating / data safety declarations.

On weak areas: explain steps, show me which buttons to click, don't assume I know the vocab. On strong areas: skip the basics; I'll ask if I need them.

## How I work here

- Project type: solo hobby (under Harnisch LLC).
- Branching: flat main. Commit directly to main. No feature branches, worktrees, or PRs unless I explicitly ask.
- "Done" right now means: in TestFlight (iOS) or Play internal testing (Android) and working on my phone. Public release on either store is a separate milestone.
- Iterating vs shipping: phone testing = iterate mode, not ship mode. Don't open PRs unless I explicitly say "let's ship."
- Session shape: short bursts. Save state between decisions, don't push through to a full spec. I pivot mid-session and that's usually fine.

## Don't do these without asking

- Open PRs.
- Use feature branches, worktrees, or any non-flat workflow.
- Add new dependencies.
- Suggest framework changes or migrations (e.g., JS to TS, switching off Expo, swapping the classifier).
- Touch deploy or CI config.
- Run destructive git commands (reset --hard, force push, branch -D, etc.).
- Re-introduce the deleted Flask backend or Capacitor shell.
- Write App Store or Play Store listing copy, marketing pages, or anything user-facing without me.

## Where things live

- Mobile repo (this one): https://github.com/harnischllc/gobananas
- Website repo (Astro + CF Workers, hosts privacy + support + banana facts): https://github.com/harnischllc/bananascanner-website
- Live site: https://bananascanner.com (privacy at /privacy, support at /support, banana facts at /facts). Domain registered at Cloudflare Registrar (2026-05-24).
- App Store Connect app ID: 6772261640 (team: Harnisch LLC). Privacy URL set to https://bananascanner.com/privacy.
- TestFlight groups: "Beta Bananas" (external, public join link active), "Team (Expo)" (internal)
- Google Play Console: legal entity HARNISCH LLC, public developer name "Loggerhead Creative", developer account ID 5066870933361555224, app ID 4973024295102408133, package `com.harnischllc.gobananas`. The Loggerhead Creative dev account is owned by a separate Google account from harnischllc@gmail.com — switch profile to reach it. Privacy URL updated to https://bananascanner.com/privacy on 2026-05-24 (staged, not yet sent to Google for review).
- Play tester list: "Banana Testers" (internal testing)
- EAS project: linked via `eas init` (commit `7a15e3d`). `appVersionSource: local` — bump `app.json` `ios.buildNumber` (and `android.versionCode` when shipping Android) BEFORE each `npm run ship:ios` / `ship:android`. Remote source was tried 2026-05-24 and got stuck on 4 across multiple builds; reverted to local in commit `79c0476`. Use `npm run ship:ios` / `ship:android` / `ship` from `mobile/` to build + auto-submit in one command.
- EAS submit: iOS uses `apple@aqueroministries.org` (team `TA777BLD49`); Android uses Play service account JSON at `/Users/ericharnisch/.config/eas/harnisch-llc-play-service-account.json`, track `internal`, releaseStatus `draft`.
- Render service: fully shut down 2026-05-24.
- Feedback email for testers: info@harnischllc.com (matches the bananascanner.com privacy + support pages; updated 2026-05-24, replaces the earlier eric.harnisch@gmail.com decision)
- Cloudflare account ID (Harnisch LLC): `a73bfcc0f66055f7da62abe390d117c8`

## Vocabulary

- "the classifier" = the hue-based ripeness classification logic in `mobile/` (recently recalibrated +20° for real iPhone photos in commit `2ffdd14`).
- "stages" / "stage of ripeness" = the discrete ripeness categories the classifier returns (green through overripe).
- "the diagnostic" = the calibration data panel at the bottom of the result screen, added in `8328b9d`, used to debug misclassifications.
- "Beta Bananas" = the external TestFlight group (iOS).
- "Team (Expo)" = the internal TestFlight group (iOS).
- "Banana Testers" = the Google Play internal testing list (Android).
- "Loggerhead Creative" = Eric's DBA used for development projects under Harnisch LLC. It's the public developer name on Google Play for Go Bananas; the underlying legal entity is still Harnisch LLC.
- "the webapp" = dead. Refers to the deleted Flask + Capacitor approach. If I say this, I mean the historical thing, not anything we should touch.

## Budget and ceiling

- Apple Developer Program ($99/year) is paid.
- Google Play Console developer registration ($25 one-time) is paid.
- Otherwise: free tiers only. No new paid services without asking.
- Render service is being wound down on purpose; don't suggest paid alternatives for it.

## Open questions I haven't answered yet

- App Store public release: timing, listing copy, screenshots, pricing (free? free with future paid features?). Not drafting any of this until I say so.
- Play Store: 1 of 11 setup tasks remains (Store listing). The other 10 are done. Privacy URL was updated to bananascanner.com/privacy on 2026-05-24 but not yet sent for Google review — send from Publishing overview when ready.
- v1.1 rewards loop: there's a `__DEV__`-gated demo at `mobile/app/rewards.tsx` + `lib/drops.ts` + `lib/streak.ts` + components. Flip the flag when ready. See `memory/project_gobananas.md` v2.0 ideas for the strategic thesis.
- Auth: currently none. Stays none unless I explicitly add a reason for it.

## Writing style for replies

- Direct, no filler. Bullets for lists.
- Short sentences. Active voice.
- No em dashes. Use commas, periods, semicolons.
- No "you're absolutely right," "great question," or similar preambles.
- Don't oversimplify. I'll ask if I need a basic explained.
- No metaphors, cliches, or sweeping claims.
- Avoid these words: elevate, delve, foster, realm, leverage, synergy, robust, seamless, holistic, cutting-edge, empower, dynamic, frictionless, scalable, optimize, ecosystem, deep dive, actionable insights, pain point, deliverables, quick win, framework, paradigm shift, game-changer.
- Never invent names, dates, URLs, file paths, IDs, or other specifics. Ask instead. If a placeholder is genuinely useful for template work, mark it `[TODO: ...]`.
