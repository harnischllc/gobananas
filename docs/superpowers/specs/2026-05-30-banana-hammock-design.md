# Banana Hammock + Monkey Raid, v1 design

Date: 2026-05-30
Status: locked 2026-05-30, ready for implementation planning

## Summary

A monkey raids overnight and grabs your most valuable banana. A Banana Hammock lets you tuck one banana in safe before you close the app. Hammocks are scarce, hoardable across days, and consumed only when they actually block a raid. The hook is the morning reveal (did a monkey come, did I protect the right banana) plus loss aversion on a near-peak banana.

## Decisions locked with Eric

- Single villain: monkeys. No other critters.
- Monkey strikes as an overnight raid you react to, resolved when you next open the app (not a live, tap-to-shoo event).
- Protection is manual: you pick which banana sleeps in the hammock.
- A hammock is spent only when it actually blocks a monkey. Quiet night, it stays, so unused ones stack up.
- v1 is hammock-only. Peel, Decoy Plantain, Chill Pill and the rest are deferred.

## How it plugs into the existing code

The game already models a "bunch" of individual bananas with per-banana ripeness, environments, and fates. A monkey theft already exists as a foreground random event ("A monkey took {banana}. No recourse.") in `lib/pet.ts`. This feature turns that into a defendable overnight mechanic.

- **Banana model** (`lib/pet.ts`, `Banana` interface): add one optional field, `protected?: boolean`. Tuck-in sets it true; backwards compatible with saved bunches.
- **New module** `lib/hammock.ts`, mirroring the `drops.ts` / `streak.ts` pattern (AsyncStorage, small load/save API). Key `gobananas/hammock/v1`. Holds: hammock `count`, `last_raid_date`, and the `last_outcome` for the reveal.
- **Day boundary**: reuse `effectiveToday()` from `lib/streak.ts` (already handles a per-day notion plus the demo day-advance control).
- **Raid resolution**: on app foreground / Bananas-tab open, if today's raid is unresolved, roll it. Existing cold-start catch-up in `tickBunch` stays event-free; the raid is its own pass so the "no random events while closed" rule is preserved.
- **UI** (`app/(tabs)/bananas.tsx`): a "tuck into hammock" action on each banana card (enabled when you hold a hammock and the banana is loose), a hammock badge on a protected banana, a hammock count in the tab header, and a morning-reveal modal. A raid writes one entry into the existing bunch `history`.

## The target and block rule (the heart of it)

1. The monkey targets your **most valuable alive banana** (closest to the peak window, stage 6 / ripeness 65). That is the one you would most regret losing.
2. If that banana is in the hammock: the hammock is **consumed**, the banana is **saved**, and the monkey leaves empty-handed that night.
3. If the target is **not** in the hammock: the monkey takes it (`alive=false`, `end_reason='monkey'`), and any hammock you hold is untouched (it did not block this raid, so it carries over).

The strategy: predict the monkey's target (your best banana) and tuck it in. Protect the wrong banana and you lose your prize while the hammock sits unused. That single tense read, repeated daily, is the addiction.

## Decisions (locked 2026-05-30, Eric delegated the calls: "make it fun, not confusing, funny, cool")

1. **Sourcing.** Hammocks drop from the daily crates at a low rate. No new currency in v1; the coin shop moves to v2. (Scarcity comes free from the drop rate, which is the addictive lever.)
2. **Existing events.** Retire the foreground `monkey` event (the overnight raid replaces it) and the `bird` event. Keep `roommate`, `dropped`, `mush`, and `avocado_jealous` as non-monkey flavor, so the monkey stays the single creature you actually defend against. Clean threat model: live mishaps happen while you play, the monkey raids while you are away.
3. **Block behavior.** A blocked monkey leaves empty-handed that night, a clean and satisfying save, with a funny reveal line (it tried, the banana was snug in the hammock, it left in a huff and grabbed a loose peel instead). No next-best grab.
4. **Numbers (first-pass, to playtest).** Raid chance ~35% on a new day with a live banana; ~20% chance a daily crate also yields a hammock; at most one banana lost per raid.

## Out of scope for v1

Coin shop, any second item (peel, decoy, chill pill, SPF, ethylene bomb), and push notifications. Push ("a monkey's eyeing your bananas") is a strong follow-on since `lib/notifications.ts` already exists, but it is not required for the core loop.

## Tuning knobs (first-pass guesses, to playtest)

- Raid chance: ~35% on a new day with at least one alive banana.
- Hammock drop: ~20% chance to also yield a hammock when you open a daily crate.
- At most one banana lost per raid resolution.
