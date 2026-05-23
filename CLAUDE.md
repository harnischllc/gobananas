# Project Context for Claude

Read this before any work. If something's not covered here, ask before assuming.

## What this is

Go Bananas (full name: "Go Bananas: Banana Scanner") is a native iPhone app that scans bananas with the camera and classifies their ripeness stage using a custom hue-based classifier. Solo hobby project run under Harnisch LLC. Currently in TestFlight first-external review for build 1.0.0 (3). No public App Store release yet.

Stack: Expo + React Native (the entire product lives in `mobile/`). EAS build pipeline is set up. GitHub Pages marketing/support site lives under `/docs`.

## What it used to be

- Originally a Flask webapp wrapped in a Capacitor shell to act as a "mobile" app. That whole approach was killed on 2026-05-10 in commit `e945d1e`.
- The Render service that hosted the Flask backend is being shut down (verify status if it matters; a SessionEnd hook in `.claude/settings.json` reminds about this).
- Don't resurrect the Flask backend, Capacitor shell, or any browser-runtime path. `mobile/` is the entire product.

## My skill by area

- **Strong:** Python, Flask, web HTML/CSS, server deploys, git basics, general scripting.
- **Weak or learning:** React Native, Expo, EAS build/submit, TestFlight, App Store Connect, iOS code signing, Xcode, Apple Developer Program plumbing in general.

On weak areas: explain steps, show me which buttons to click, don't assume I know the vocab. On strong areas: skip the basics; I'll ask if I need them.

## How I work here

- Project type: solo hobby (under Harnisch LLC).
- Branching: flat main. Commit directly to main. No feature branches, worktrees, or PRs unless I explicitly ask.
- "Done" right now means: in TestFlight and working on my phone. Public App Store release is a separate milestone.
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
- Write App Store listing copy, marketing pages, or anything user-facing without me.

## Where things live

- Repo: https://github.com/harnischllc/gobananas
- App Store Connect app ID: 6772261640 (team: Harnisch LLC)
- TestFlight groups: "Beta Bananas" (external), "Team (Expo)" (internal)
- EAS project: linked via `eas init` (commit `7a15e3d`)
- GitHub Pages: served from `/docs` in this repo
- Render service: [TODO: confirm whether it's fully shut down or still draining]
- Custom domain (if any): [TODO]
- Feedback email for testers: eric.harnisch@gmail.com (unless I set up an alias later)

## Vocabulary

- "the classifier" = the hue-based ripeness classification logic in `mobile/` (recently recalibrated +20° for real iPhone photos in commit `2ffdd14`).
- "stages" / "stage of ripeness" = the discrete ripeness categories the classifier returns (green through overripe).
- "the diagnostic" = the calibration data panel at the bottom of the result screen, added in `8328b9d`, used to debug misclassifications.
- "Beta Bananas" = the external TestFlight group.
- "Team (Expo)" = the internal TestFlight group.
- "the webapp" = dead. Refers to the deleted Flask + Capacitor approach. If I say this, I mean the historical thing, not anything we should touch.

## Budget and ceiling

- Apple Developer Program ($99/year) is paid.
- Otherwise: free tiers only. No new paid services without asking.
- Render service is being wound down on purpose; don't suggest paid alternatives for it.

## Open questions I haven't answered yet

- Is the Render service actually shut down, or still running?
- Do I need a dedicated feedback email alias for beta testers, or is eric.harnisch@gmail.com fine for now?
- App Store public release: timing, listing copy, screenshots, pricing (free? free with future paid features?). Not drafting any of this until I say so.
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
