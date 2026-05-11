# Apple App Privacy Labels — Go Bananas

_Map for App Store Connect's "App Privacy" section. For Go Bananas v1.0, every category answer is "No, we do not collect data of this type from this app."_

## Top-level answers

| Question | Answer |
|---|---|
| Does this app collect data? | **No** |
| Data used to track you | None |
| Data linked to you | None |
| Data not linked to you | None |

## Per-data-type breakdown

| Data type | Collected? | Linked? | Tracking? |
|---|---|---|---|
| Contact info (name, email, phone, address) | No | — | — |
| Health & fitness | No | — | — |
| Financial info | No | — | — |
| Location (precise or coarse) | No | — | — |
| Sensitive info | No | — | — |
| Contacts | No | — | — |
| **User content — photos** | **No — processed on-device, never uploaded** | — | — |
| User content — audio, video, messages, files | No | — | — |
| Browsing history | No | — | — |
| Search history | No | — | — |
| Identifiers (user ID, device ID, advertising ID) | No | — | — |
| Purchases (purchase history) | No | — | — |
| Usage data (interactions, app activity) | No | — | — |
| Diagnostics (crash data, performance) | No | — | — |
| Other data | No | — | — |

## Why "No" on photos specifically

The camera permission (`NSCameraUsageDescription`) and photo library permission (`NSPhotoLibraryUsageDescription`) are requested so the user can scan a banana. The captured/selected image is:

1. Decoded in-memory via the on-device JavaScript code in `mobile/lib/classify.ts` (uses `jpeg-js` + HSV histogram).
2. Rendered on the result screen.
3. Stored in local AsyncStorage as part of the user's scan history.

At no point is the image transmitted off the device. There is no backend.

## Future v1.1 considerations

The "Send anonymous corrections" toggle on the You tab is wired up in the UI but does not POST anywhere in v1.0. When the corrections endpoint ships, the labels will need updating to:

- **Data Not Linked to You → Diagnostics** — predicted hue (integer), predicted stage (integer), user correction (integer)
- Still no photos, no contact info, no identifiers, no tracking.
- Mark as "Optional" since it's gated behind user opt-in.

When this changes, also revise the privacy policy (`docs/privacy.md`) to describe exactly what is sent.
