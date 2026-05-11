# Google Play Data Safety — Go Bananas

_Map for Google Play Console's Data Safety section. For Go Bananas v1.0, the app collects and shares no user data._

## Top-level answers

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **No** |
| Is all of the user data collected by your app encrypted in transit? | N/A — no data transmitted |
| Do you provide a way for users to request that their data be deleted? | N/A — no data collected, but users can clear local scan history from the History tab |

## Data types — all marked "Not collected"

| Category | Examples | Collected? |
|---|---|---|
| Personal info | Name, email, address, user IDs | No |
| Financial info | Payment info, purchase history | No |
| Health & fitness | — | No |
| Messages | Emails, SMS, MMS, in-app messages | No |
| **Photos and videos** | **Camera images** | **No — processed on-device only** |
| Audio files | Voice/sound recordings, music | No |
| Files and docs | — | No |
| Calendar | Events | No |
| Contacts | — | No |
| App activity | Page views, taps, in-app search | No |
| Web browsing | — | No |
| App info and performance | Crash logs, diagnostics, performance | No (no analytics SDK installed) |
| Device or other IDs | Advertising ID, device ID | No |

## Why "No" on photos specifically

Camera and photo library permissions are requested to scan bananas. The captured/selected image is:

1. Decoded in-memory via the on-device JavaScript code in `mobile/lib/classify.ts` (uses `jpeg-js` + HSV histogram).
2. Rendered on the result screen.
3. Stored in local app storage (`AsyncStorage`) as part of the user's scan history.

At no point is the image transmitted off the device. There is no backend in v1.0.

## Security practices

| Practice | Answer | Notes |
|---|---|---|
| Data is encrypted in transit | N/A | No data is transmitted |
| Users can request data deletion | Yes (local) | Clear scan history from the History tab; clear app data from system settings |
| Committed to Play's Families Policy | N/A | App is not in the Designed for Families program |
| Independent security review | No | |

## Future v1.1 considerations

When the "Send anonymous corrections" feature is wired to a real endpoint, this form will need updating:

- **App info and performance → Diagnostics** — predicted hue, predicted stage, user correction
- **Sharing:** Yes — sent to a Harnisch LLC-controlled corrections endpoint
- **Encryption in transit:** Yes (HTTPS)
- **Optional or required:** Optional (user opt-in only)
- **Used for:** App functionality (improving the classifier)

Also revise the privacy policy (`docs/privacy.md`) when this changes.
