# Apple App Store Listing — Go Bananas

_Draft for App Store Connect submission. Copy fields into App Store Connect at submission time._

## App Information

| Field | Value | Notes |
|---|---|---|
| App name | Go Bananas | 10 chars (max 30) |
| Subtitle | Banana ripeness, fast. | 22 chars (max 30) |
| Bundle ID | com.harnischllc.gobananas | Set in `mobile/app.json` |
| SKU | gobananas-1 | Internal-only identifier |
| Primary language | English (U.S.) | |
| Category — primary | Food & Drink | |
| Category — secondary | Lifestyle | |
| Age rating | 4+ | |
| Price tier | Free | |

## Promotional text (170 chars max)

> Scan a banana, get its ripeness. Plan a bunch so they don't all peak at once. The fridge trick is real — your phone now proves it.

_141 chars_

## Description (4000 chars max)

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

## Keywords (100 chars max, comma-separated)

> banana,ripeness,fruit,scan,kitchen,foodie,grocery,produce,cooking,baking,fridge,fresh

_86 chars_

## URLs

| Field | Value |
|---|---|
| Support URL | [DECIDE — `gobananas-cmml.onrender.com` is suspended. Likely GitHub Pages on this repo, or repo URL itself.] |
| Marketing URL | (optional) — same as support URL |
| Privacy Policy URL | [DECIDE — same hosting question; will serve `docs/privacy.md`] |

## Review notes (App Store Connect "App Review Information")

- **Demo account:** N/A — no login.
- **Contact information:** Eric Harnisch, eric.harnisch@gmail.com.
- **Notes to reviewer:** "This app classifies banana ripeness entirely on-device. No backend. No data collection. The 'Bananas' tab is a local Tamagotchi-style game using the same color science. To test: take a photo of any banana (or any yellow/green/brown object as a smoke test); the result will appear in 1–2 seconds with no network activity."

## Open decisions

- Privacy policy + support URL hosting (likely GitHub Pages at `harnischllc.github.io/gobananas/privacy` or similar — needs confirmation from Eric).
- Whether to include screenshots taken in the bunch Tamagotchi flow alongside scan-result screenshots, or lean entirely on the scan flow.
