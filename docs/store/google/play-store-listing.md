# Google Play Store Listing — Go Bananas: Banana Scanner

_Draft for Google Play Console submission. Play Console org account "Loggerhead Creative" (account ID 5066870933361555224) created 2026-05-22. App record TBD._

## App information

| Field | Value | Notes |
|---|---|---|
| App name | Go Bananas: Banana Scanner | Matches Apple App Store name for brand consistency. "Go Bananas" alone is still the home-screen icon label. |
| Application ID | com.harnischllc.gobananas | Set in `mobile/app.json` |
| Publisher (developer name) | Loggerhead Creative | Set on the developer account; appears on every Play listing. |
| Default language | English (United States) | |
| Application type | App (not Game) | |
| Category | Food & Drink | |
| Tags | (pick 2–3 in Play Console) | Suggested: "Food", "Cooking", "Productivity" |
| Content rating | Everyone | Run through Play Console's questionnaire — no violence, drugs, gambling, or user-generated content |
| Price | Free | |
| Contains ads | No | |
| In-app purchases | No (v1.0) | v2 may introduce |

## Short description (80 chars max)

> Scan a banana for its ripeness. Plan your bunch so nothing goes to waste.

_73 chars_

## Full description (4000 chars max)

> Go Bananas tells you when a banana is at its peak.
>
> Point your camera. The app reads the color of the peel and gives you a stage rating — from "not yet" to "past its prime" — plus a vibe-check description and a 5-banana rating you can trust.
>
> No upload. No account. No tracking. Everything runs on your phone.
>
> **What it does**
>
> • Scan — take a photo. The app analyzes the dominant hue, maps it to a 7-stage ripeness scale, and tells you whether it's ready, almost ready, or past it.
>
> • History — every scan you've done, time-stamped, tap-to-reopen.
>
> • Bananas — plant a virtual bunch of 5–8 named bananas. They ripen individually based on where you put them (counter, basket, paper bag, windowsill, hook, or fridge). Eat them at peak before something goes wrong.
>
> **Why**
>
> Bananas are one of the most-wasted fruits at home. Most of that waste happens because people guess wrong about when "ripe" is. Go Bananas takes the guess out of it.
>
> The bunch feature is a kitchen tool first, a goofy game second. Real environments multiply ripening speed by real amounts — the windowsill is roughly twice as fast as the counter, the fridge is about 2.5× slower. Move bananas around to stagger their peak times so the last one doesn't go to waste.
>
> **Who it's for**
>
> Anyone who buys bananas. Especially:
>
> • People who batch-bake banana bread and need every banana to be at peak the same morning
> • Households where half the bunch gets thrown out
> • Foodies who like the food-science angle
>
> **What we don't do**
>
> No accounts. No emails collected. No photos uploaded. The algorithm runs entirely on your phone. Your scan history is yours and only yours.

## Graphic assets (Phase C)

| Asset | Spec | Status |
|---|---|---|
| App icon (high-res) | 512×512 PNG, 32-bit, alpha | Generate from `mobile/assets/icon.png` (already 1024×1024 — downsample) |
| Feature graphic | 1024×500 PNG | ✅ Shipped at `docs/store/google/feature-graphic.png` (commit ff723be). Banana A sticker + "GO BANANAS" wordmark + "Catch every banana at its peak." tagline on yellow #F5C518. |
| Phone screenshots | 16:9, 1080×1920 or higher, 2–8 images | **TODO (Phase C2)** |
| 7-inch tablet screenshots | optional | Skip for v1.0 |
| 10-inch tablet screenshots | optional | Skip for v1.0 |

## Store listing contact information

| Field | Value |
|---|---|
| Website | https://harnischllc.github.io/gobananas/ |
| Email | hello@harnischllc.com | (existing Cloudflare Email Routing alias → harnischllc@gmail.com. A dedicated privacy@ can be added before submission if Google flags hello@ as too generic.)
| Phone | (skip) |
| Privacy Policy | https://harnischllc.github.io/gobananas/privacy.html |

URLs go live after enabling GitHub Pages in repo settings (Settings → Pages → Source: `main` branch, `/docs` folder).

## Target audience

- Target age range: 13+ (the default for non-children categories)
- App is not directed primarily at children
- Mark "No" on "Designed for Families" program

## Release strategy

- F4 from plan: send to **Internal testing track** first. Add Eric (or his Android device's Google account) as a tester. Confirm the build works end-to-end.
- F5: promote to **Production** once smoke-tested.
- Skip Closed/Open testing tracks for v1.0; revisit for v1.1 if there's beta-tester interest.

## Open decisions

- Whether to enable Google Play's "Pre-registration" for the launch (gives some pre-launch visibility but adds calendar pressure — leaning skip).
