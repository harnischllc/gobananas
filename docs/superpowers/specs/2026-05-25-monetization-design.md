# Go Bananas: Monetization Design (v1.1)

**Status:** Draft, paused 2026-05-25. Three open decisions block finalization (see §6).
**Resume cue:** Say "resume monetization" in chat.
**Scope:** v1.1 monetization layer on top of the existing rewards/streak/drops system (`mobile/app/rewards.tsx`, `mobile/lib/drops.ts`, `mobile/lib/streak.ts`). No subscriptions. One-time purchases only. Opt-in rewarded ads only.

## 1. Power-ups (consumable IAPs)

Each power-up is a consumable purchase. The user owns a count; using one decrements it. Counts and entitlements are held by RevenueCat, no backend required.

| Power-up | Gameplay effect |
|---|---|
| Streak insurance | Saves your daily-claim streak if you miss a day. One-shot. |
| Crate re-roll | Re-opens a crate that rolled peels. One-shot. |
| Loaded dice | Boosts rare/mythic odds for the next N crates. Charge-based. |
| Bonus crate | Claim a second crate today without breaking the once-per-day rule. |
| Reveal rarity | Peek at a crate's rarity tier before opening (the variety itself is still hidden). |

For Pro buyers, "Reveal rarity" becomes a permanent toggleable feature, not a consumable.

## 2. IAP catalog and pricing

All one-time purchases. No subscriptions.

**Consumable packs:**
- Streak insurance: 3 for $1.99, 10 for $4.99
- Crate re-roll: 5 for $1.99, 20 for $4.99
- Loaded dice: 3 for $2.99, 10 for $7.99
- Bonus crate: 5 for $1.99, 20 for $4.99
- Starter bundle: $4.99 for a mix of all four (about $9 of retail value)

**Non-consumable:**
- **Pro unlock: $9.99 one-time.** Removes all ads forever. Unlocks Reveal-rarity permanently (no consumable charge). Grants a one-time generous stock of all consumables on purchase.
- **Remove ads: $2.99 one-time.** Separate path for users who want no ads but don't care about power-ups.

## 3. Ads strategy

**Format:** Rewarded video ads only. Always opt-in. No interstitials. No banners.

**Placements:**
- Peels result screen: "Watch a 30s ad to re-roll" button, with a clear "Skip" right next to it.
- Rewards screen, only after the user has already claimed today's crate: a small link reading "Watch ad for one bonus crate today" (one per day max, can't be farmed).

**Caps and gates:**
- Total of 3 rewarded ads per day across the whole app.
- No ads at all in the first 5 launches after install.
- Never any ad in the scan flow itself.

## 4. Tech stack

- **Payments:** RevenueCat. Free up to $2.5K monthly revenue. Handles entitlement state across Apple and Google without a backend.
- **Ads:** `react-native-google-mobile-ads` (AdMob SDK, Expo-compatible).
- Both require dev client builds, which Eric is already producing via EAS.

## 5. UI surfaces

- **Shop screen.** New screen reached from a single "Shop" button on the rewards screen, near the streak header. Lists all IAPs in one place (consumable packs, starter bundle, Pro, Remove ads). No popups, no auto-launch.
- **"Watch ad?" prompts.** Two specific placements, both opt-in (see §3).
- **Pro paywall.** Reachable from the shop. Default behavior is never pushed at the user (see open question #1).
- **Restore purchases.** Small text link at the bottom of the shop screen. Required by Apple and Google for non-consumable purchases (Pro, Remove ads) so users get them back after reinstalling.
- **Onboarding gate.** No monetization surface appears for the first 5 launches after install. The Shop button is hidden during that window.

## 6. Open questions (pause point)

These three answers unblock finalization of the design doc.

1. **Pro paywall push behavior.**
   - (A) Never pushed, only reachable through the shop. *Eric's stated preference for non-annoying lands here.*
   - (B) One soft intro tip after the user's first peels result, dismissible.
   - (C) Soft banner on rewards screen.

2. **AdMob Google account ownership.**
   - (A) `eric.harnisch@gmail.com` (personal Google account).
   - (B) The Loggerhead Creative Google account that already owns the Play Console developer profile. Cleaner for tax and revenue reporting since it matches the published developer name.

3. **App age rating target.**
   - (A) 4+. Kids category. AdMob runs in kid-safe mode, where fewer ad networks bid, so payout per ad is lower.
   - (B) 9+. Normal ad mode, broad audience.
   - (C) 12+. Widest ad network participation, audience cap slightly higher.

## 7. Out of scope for v1.1

Revisit in v1.2 or later:
- Cosmetic IAPs (banana skins, themes, custom result animations).
- First-time-buyer bonus mechanic.
- Subscription tier (currently ruled out).
- Cross-device entitlement syncing (would require user auth and a backend).

## 8. Locked decisions summary

For fast resume:
- Approach A from brainstorm session 2026-05-25.
- 5 power-up SKUs as consumables.
- Pro unlock $9.99 (non-consumable). Remove ads $2.99 (non-consumable).
- Opt-in rewarded ads only, no interstitials, no banners.
- RevenueCat for IAP. AdMob for ads.
- Shop screen as the single entry point. No paywall pushes.
- 5-launch grace period before any monetization shows.
