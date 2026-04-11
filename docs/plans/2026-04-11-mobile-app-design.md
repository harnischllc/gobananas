# Go Bananas — Mobile App Design

**Date:** 2026-04-11
**Status:** Approved

## Goals

1. Ship Go Bananas as a mobile app on both App Store and Play Store
2. Add camera capture, ripeness alerts, and storage tips
3. Build a learning system (global accuracy + personal preferences)
4. Upgrade banana ripeness knowledge
5. Monetize via freemium model
6. Move fast — MVP first, iterate later

## Target User

Everyday consumers wondering "is this banana ready to eat?"

## Architecture

### Current State
- Flask/Python backend on Render (https://gobananas-cmml.onrender.com)
- HTML/CSS/JS frontend served by Flask
- OpenCV + PIL color analysis — deterministic hue-to-stage mapping (7 stages, USDA scale)
- No database — browser localStorage for history
- PWA manifest already exists with app icons

### Future State
- **Mobile app (Capacitor)** — wraps existing web frontend in a native shell for iOS and Android
- **Backend API (Flask on Render)** — ripeness analysis + new endpoints for feedback, user preferences, alerts
- **Database (PostgreSQL on Render)** — stores user feedback, preferences, alert schedules

### Why Capacitor
- Keeps existing HTML/CSS/JS frontend — no rewrite
- Native camera access via Capacitor Camera plugin
- Push notifications via Capacitor Push Notifications plugin
- Generates real .ipa and .apk for app store submission
- Lowest learning curve — Eric is new to mobile development

## Features

### Free Tier
- **Camera capture** — snap a banana photo directly from the app
- **Ripeness classification** — 7-stage result with description
- **Storage tips** — how to speed up or slow down ripening per stage
- **Feedback prompt** — "Was this correct?" thumbs up/down after each scan

### Premium Tier (~$2.99/month or $19.99/year)
- **Ripeness alerts** — push notifications: "Your banana should be ready now"
- **Full history** — all past scans with trends
- **Personalized ripeness** — app learns user's preferred ripeness over time

### Learning System
- Every scan stores: hue detected, stage predicted, user correction (if any), timestamp
- **Global learning:** Aggregate corrections shift hue-to-stage boundaries when statistically significant
- **Personal learning:** Per-user preference model tracks preferred ripeness and adjusts "ready" threshold
- Free users generate training data; premium users benefit from personalized model

## Ripeness Knowledge Upgrade

Each of the 7 stages will include:
- Sugar/starch content ratio
- Texture and flavor profile
- Best uses (cooking, eating, baking, smoothies, baby food)
- Storage tips (room temp, fridge, paper bag, ethylene separation)
- Estimated days to next stage (room temp baseline)
- Nutritional highlights (resistant starch, antioxidants, prebiotics)
- Temperature factor for alert timing (counter vs fridge)

MVP covers Cavendish bananas only (95%+ of consumer purchases).

## Monetization

- **Model:** Freemium
- **Free:** Core scanning + storage tips (generates training data)
- **Premium:** Alerts + history + personalization
- **Pricing:** ~$2.99/month or $19.99/year (finalize before launch)
- **Payment:** App Store / Play Store in-app purchases (handled by each platform)

## App Store Publishing

### Apple App Store
- Apple Developer Account ($99/year)
- Xcode build on Mac
- App review ~1-3 days
- Required: icons, screenshots, description, privacy policy, age rating

### Google Play Store
- Google Play Developer Account ($25 one-time)
- AAB build
- Review ~hours to days
- Required: same assets as Apple

### Testing (Before Accounts)
- iOS: Test on own iPhone via Xcode with free Apple ID
- Android: Sideload APK directly onto any Android device
- Accounts only needed at publish time

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Mobile shell | Capacitor |
| Frontend | Existing HTML/CSS/JS (enhanced) |
| Backend | Flask/Python on Render |
| Database | PostgreSQL (Render add-on) |
| Camera | @capacitor/camera |
| Push notifications | @capacitor/push-notifications |
| In-app purchases | capacitor-purchases (RevenueCat) or platform-native |
| Color analysis | OpenCV + PIL (existing) |
