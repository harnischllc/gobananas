# Go Bananas — Build pipeline ready (2026-05-12)

## TL;DR

The build setup is done. When you sit down next, you do **two short tasks** and then I take over.

- Tonight (me, solo): wrote `mobile/eas.json` (the config Expo's build service needs).
- Next session start (you, ~3 minutes): create a free Expo account, run one sign-in command.
- Same session (me): trigger the build. Expo's cloud cooks the iPhone install file and the Android install file. That takes ~15–25 minutes per platform, running on their servers while you do something else.
- Then we're sitting on the two files Apple and Google need.

## What the heck is "Expo's build service"?

Same pattern you already know from Render/Heroku: you don't compile the app on your laptop, you push it to a cloud service that does it for you. The Expo company runs that cloud service. It's called **EAS Build**. Free tier is generous — definitely enough for this app's launch.

You don't need to install anything on your laptop to use it. Every command starts with `npx eas …` which downloads the tool on demand. That's why `mobile/eas.json` exists in the repo but no `eas-cli` is in the dependencies — Expo's official guidance is to use `npx` instead.

## What you do next session (3 things, 3 minutes)

### 1. Make a free Expo account

Go to https://expo.dev/signup. Email + password. No payment. You can use `eric.harnisch@gmail.com` or whatever you use for dev things.

### 2. Sign in on the command line

From the repo root, one command:

```
cd mobile && npx -y eas-cli@latest login
```

It'll prompt for the email + password you just made. Done.

### 3. Tell me you're in

Just say "logged in." That's all I need.

## What I do once you're logged in (~2 min of clicking, then ~25 min of waiting)

```
# Links this codebase to your Expo account — first-time only
cd mobile && npx -y eas-cli@latest init

# Builds the iPhone file AND the Android file in parallel on Expo's cloud
npx -y eas-cli@latest build --platform all --profile production
```

The first command writes a `projectId` into `mobile/app.json` — that's how Expo's servers know which project of yours this is. I'll commit that.

The second command uploads the codebase to Expo's cloud and starts two builds running in parallel (one Apple, one Android). Each build takes ~15–25 minutes. You don't have to watch — they email you when done. You can close the laptop. Background work.

When they finish, you've got:
- A `.ipa` file (the iPhone install file Apple wants)
- An `.aab` file (the Android install file Google wants)

Those are downloadable from your Expo dashboard, or `eas build:list` shows them.

## What blocks the ACTUAL store submission (separate from the build)

The build pipeline gives us the files. To actually submit them, you also need accounts on Apple and Google's side:

| What | Cost | Time to activate | Status |
|---|---|---|---|
| Apple Developer Program | $99/year | Same day to 48 hours after payment | ❓ — need to confirm |
| Google Play Console | $25 one-time | Hours to 1–2 days | ❓ — need to confirm |

If you haven't done these yet, do them BEFORE the next session — they take real-world time to activate (Apple sometimes needs identity verification, Google sometimes needs a test deployment). Sign up here:

- Apple: https://developer.apple.com/programs/enroll/
- Google: https://play.google.com/console/signup

If you already have them, great — we move straight to submission after the build finishes.

## What happens after the build files exist (the actual store submission)

Two parallel paths:

**Apple submission:**
1. You log into App Store Connect (https://appstoreconnect.apple.com) with your Apple Developer account.
2. Click "+ New App," fill in the metadata from `docs/store/apple/app-store-listing.md` (I'll walk you through). Bundle ID: `com.harnischllc.gobananas`.
3. I run `npx -y eas-cli@latest submit --platform ios` — this uploads the `.ipa` file from Expo's cloud directly to App Store Connect. You don't have to handle the file yourself.
4. In App Store Connect: upload the 5 phone screenshots, fill out privacy labels (template ready at `docs/store/apple/privacy-labels.md`), submit for review.
5. Apple emails decisions in 1–3 days. They might reject for trivial reasons (privacy text wording, screenshot dimensions). We iterate.

**Google submission:**
1. You log into Play Console (https://play.google.com/console) with your Google Play account.
2. Create the app, paste fields from `docs/store/google/play-store-listing.md`.
3. I run `npx -y eas-cli@latest submit --platform android` — uploads the `.aab` to Play Console.
4. In Play Console: upload screenshots, the feature graphic (already done — `docs/store/google/feature-graphic.png`), fill Data Safety form (`docs/store/google/data-safety.md`), submit for review.
5. Google is hours-to-days, usually faster than Apple.

## Files I added tonight

- `mobile/eas.json` — Expo Build Service config. Has three "profiles": `development` (for dev), `preview` (for internal testing), `production` (for stores). The `production` profile is what we'll use.

## What I did NOT do

- Did not install `eas-cli` into `mobile/` as a dependency. Expo's own health check (`expo-doctor`) flags that as bad practice. We use `npx -y eas-cli@latest …` instead — works just as well, no install needed.
- Did not run `eas init` — that needs your Expo account to exist first.
- Did not bump version numbers in `mobile/app.json`. They're at 1.0.0 / buildNumber 1 / versionCode 1, which is correct for the first release.

## Quick check before submission

When you're back, you can verify everything's still healthy with these:

```
cd mobile
npx tsc --noEmit         # should be silent (no TypeScript errors)
npx expo-doctor          # should say 17/17 checks passed
```

I ran both tonight after the changes and they're clean.

---

**Bottom line:** I did all the prep solo. You'll spend ~3 minutes doing account creation and sign-in. The actual build is a button I press while you do other things, then it cooks on Expo's servers in the background. After that, the only thing standing between us and the stores is your Apple/Google account status.
