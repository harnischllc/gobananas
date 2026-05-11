# Go Bananas — Handoff (2026-05-10, end of day)

Read top-to-bottom. Supersedes [2026-05-10-mobile-pivot.md](2026-05-10-mobile-pivot.md) — the dual-architecture decision was resolved this session.

## TL;DR

- **Webapp killed.** Flask backend + Capacitor shell deleted from repo. Render web service + Postgres suspended by Eric.
- **`mobile/` (Expo + RN) is the sole product.** Single track, no more bundle-ID collision.
- **Phase A engineering done. Phase B drafts written** (privacy policy + Apple/Google store metadata).
- **GitHub Pages plumbing is in place** but Pages itself is **NOT yet enabled** in repo settings — that's the next action.
- **SessionEnd hook installed** to remind Eric to verify Render shutdown every future session close (may not fire until Claude Code reloads settings — open `/hooks` or restart once).

## State of `origin/main`

```
727d6c4 Set up GitHub Pages site under /docs
2bd9221 Phase B drafts: rewritten privacy policy + Apple/Google store metadata
04f1523 Add SessionEnd hook: remind to shut down Render infra
e945d1e Kill webapp: delete Flask backend and Capacitor shell
4d40b5c Update handoff doc for dual-architecture reality (pre-decision; now obsolete)
```

All four of tonight's commits are on `main`. No PR opened — direct push since solo project.

## Repo layout now

```
gobananas/
├── mobile/                              ← the entire product (Expo + RN)
├── docs/
│   ├── _config.yml                      ← Jekyll config for Pages site
│   ├── index.md                         ← landing (will be support URL)
│   ├── privacy.md                       ← privacy policy (will be privacy URL)
│   ├── store/                           ← INTERNAL — excluded from Pages
│   │   ├── apple/{app-store-listing,privacy-labels}.md
│   │   └── google/{play-store-listing,data-safety}.md
│   ├── handoff/                         ← INTERNAL — excluded from Pages (you are here)
│   ├── mockups/                         ← INTERNAL — excluded from Pages
│   └── plans/                           ← INTERNAL — excluded from Pages
├── .claude/
│   ├── settings.json                    ← SessionEnd hook (Render reminder)
│   ├── launch.json                      ← dev server configs
│   └── settings.local.json              ← gitignored
└── README.md                            ← still Flask-focused, STALE
```

## Where we left off — next concrete action

**Enable GitHub Pages.** Once on:
- `https://harnischllc.github.io/gobananas/` → landing page (Apple + Google support URL)
- `https://harnischllc.github.io/gobananas/privacy.html` → privacy policy

Two equivalent paths:

1. **GitHub UI:** Repo → Settings → Pages → Source: "Deploy from a branch" → Branch: `main` → Folder: `/docs` → Save.
2. **`gh` CLI:** `gh api repos/harnischllc/gobananas/pages -X POST -f 'build_type=legacy' -F 'source[branch]=main' -F 'source[path]=/docs'`

Verify after a few minutes: `curl -sI https://harnischllc.github.io/gobananas/privacy.html | head -1` should return `HTTP/2 200`.

---

## Roadmap

### v1 — ship to App Store + Play Store (remaining)

| # | Item | Who | Notes |
|---|---|---|---|
| 1 | Enable GitHub Pages | Eric (or me) | One-click in repo settings, OR `gh` command above |
| 2 | Screenshots | **Eric** (needs his phone) | ~5 shots: home, scan result, bunch overview, bunch detail, education tab. iOS sizes: 6.7" / 6.5" / 5.5". Android: 1080×1920 min. |
| 3 | Feature graphic (Google) | Me | 1024×500 PNG. Banana icon left, "GO BANANAS" wordmark right, yellow background |
| 4 | EAS build setup | Me | `npm i -g eas-cli`, `eas login`, `eas build:configure` from `mobile/`, then prod builds for iOS + Android (~15–25 min each) |
| 5 | Apple submission | Me + Eric | App Store Connect: new app, paste from `docs/store/apple/app-store-listing.md`, privacy labels from `docs/store/apple/privacy-labels.md`, `eas submit --platform ios`, send for review. Apple 1–3 day turnaround. |
| 6 | Google submission | Me + Eric | Play Console: new app, paste from `docs/store/google/play-store-listing.md`, Data Safety from `docs/store/google/data-safety.md`, `eas submit --platform android`, internal testing → production. Hours-to-days turnaround. |
| 7 | Watch reviews, fix rejections | Eric | Apple emails per state change; Google has a Play Console banner |

### v1.1 — after launch

- **Corrections endpoint.** Needs a new tiny host (Render is gone). Likely Cloudflare Workers (Eric has CF account from HWDJ) or Vercel. One endpoint accepting `{predicted_hue, predicted_stage, user_correction, timestamp}`.
- **Wire the "Send anonymous corrections" toggle** on the You tab to actually POST. Update privacy policy + Apple labels + Google Data Safety to reflect.
- **Splash screen verification** on a real phone (Phase A4 was deferred — visual smoke test, regenerate splash-icon if it looks off).

### v2 — daily-scan engagement loop (Eric's monetization thesis)

**Strategic thesis (Eric's, locked 2026-05-02):** the scanner and the bunch game stop being two separate features and become a feedback loop. Scanning a real banana every day is the engagement engine that powers the game.

**Core drop mechanic — "crates off the boat":**
- Common: peels only, monkeys got in (the comedy beat, not a punishment — persona-critical)
- Uncommon: real rare cultivars (Lady Finger, Red, Manzano)
- Rare: fictional varieties — **Baboon Delight** (banana crème flavor), **Yellow Scorcher** (banana × ghost pepper). 6–12 at launch, seasonal additions.

**Streak rewards stacked on top:**
- 7-day → bigger drop
- 28/30-day → bigger still
- Miss → reset; "streak insurance" item undoes one missed day

**Holiday theming overlay:**
- Halloween / Christmas / Thanksgiving / Valentine's / summer
- Themed crate art, holiday-only fictional varieties ("Christmas Mash", "Mummy Banana")
- Themed event icons (e.g. 🦇 instead of 🐦 for the Halloween bird steal)

**Paid upgrade catalog (Eric's list, still applies):**
- Banana varieties as paid content (real cultivars with distinct ripening curves)
- Premium environments (greenhouse, banana hammock, "the perfect counter")
- Cosmetic skins (gold, rainbow, vintage)
- Themed name rosters (sci-fi, royal, vintage Hollywood; default = American casual)
- Multiple concurrent bunches (free = one at a time)
- Streak insurance (also acts as monkey-block)
- Custom event packs (Holiday, Office life)

**Monetization model (Eric's call):** one-time IAP at $0.99–$2.99 each, **NOT subscription**. Free drops from daily scans = engagement engine. Paid drops with better odds = monetization tier.

---

## Things Eric needs to do himself (between sessions)

- ✅ Suspended Render web service + Postgres (done 2026-05-10).
- ⏳ Enable GitHub Pages (one-click, OR delegate to me).
- ⏳ Take v1 screenshots on his phone.
- ⏳ Verify Apple Developer + Google Play Console accounts are still in good standing before submission.

## Things still stale (housekeeping, not urgent)

- `README.md` at repo root is still Flask-focused. Needs rewriting to describe the mobile app + reflect the single-track architecture. Low priority — does not block submission.
- `~/.claude/plans/frolicking-zooming-frog.md` has stale references to `gobananas-cmml.onrender.com`. The phase structure is still right, but B1 (Flask `/privacy` route) is obsolete — replaced by GitHub Pages. Lives in Eric's personal Claude folder, not in the repo.

## Known gotchas

- `mobile/` `npm install` needs `--legacy-peer-deps` (react-dom@19 peer conflict with expo-linear-gradient).
- `expo-file-system` v55 broke `readAsStringAsync`; classifier uses `import * as FileSystem from 'expo-file-system/legacy'`. Intentional.
- `expo-notifications` pinned to `~0.32.17` for SDK 54.
- AI-generated icons sometimes save as `.png` but are actually JPEG — convert via `sips -s format png -z 1024 1024 file.png --out file.png`.
- The SessionEnd hook in `.claude/settings.json` may not fire on the FIRST session after install — Claude Code's settings watcher only watches `.claude/` if a settings.json existed at session start. Fix: open `/hooks` once (reloads config) or restart Claude Code.
- Same bundle ID `com.harnischllc.gobananas` is now uniquely owned by `mobile/app.json` (no longer collides with anything since Capacitor is deleted).

## How to resume next session

1. **Read this doc first.**
2. Read `/Users/ericharnisch/.claude/projects/-Users-ericharnisch-Documents-GitHub-Local-Clone-gobananas/memory/project_gobananas.md` for full project memory.
3. Search Open Brain: tags `gobananas`, `phase-b-ready`, `webapp-killed`, `checkpoint`, `session-end`.
4. State check: `cd mobile && npx tsc --noEmit && npx expo-doctor`. Both should be clean.
5. Confirm GitHub Pages status. If not yet enabled, that's action #1. If enabled, verify `/privacy.html` returns 200.
6. Then jump to v1 #2 (screenshots) or #3 (feature graphic) depending on what Eric brings to the session.
