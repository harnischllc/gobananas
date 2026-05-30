# Banana Hammock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a defendable overnight monkey raid and a Banana Hammock item to Go Bananas: a monkey raids while you are away and grabs your most valuable banana unless you tucked it into a hammock first.

**Architecture:** A new `lib/hammock.ts` state module (mirrors `lib/drops.ts` / `lib/streak.ts`: AsyncStorage plus a small API) holds hammock inventory and the pure `resolveRaid` function. `lib/pet.ts` gains a `protected` flag on the `Banana` and loses its foreground `monkey` and `bird` random events. The Bananas tab resolves at most one raid per effective day on focus and shows a reveal. Hammocks drop occasionally from the existing daily crates.

**Tech Stack:** Expo + React Native, TypeScript, AsyncStorage. No test runner exists in this project and new dependencies are out of scope, so each task is verified by `npx tsc --noEmit` (run from `mobile/`) plus a manual playtest in Fast mode using the existing demo day-advance control. The raid and hammock logic is written as pure functions so it can get real unit tests later if jest is ever added.

**Spec:** `docs/superpowers/specs/2026-05-30-banana-hammock-design.md`

---

## File structure

- `mobile/lib/pet.ts` (modify): add `protected?: boolean` to `Banana`; remove `monkey` and `bird` from `RANDOM_EVENTS`; add `setBananaProtected`.
- `mobile/lib/hammock.ts` (create): `HammockState`, `RaidOutcome`, persistence (`loadHammock`/`saveHammock`/`grantHammock`/`clearHammock`), and the pure `resolveRaid` plus helpers.
- `mobile/lib/drops.ts` (modify): ~20% chance an opened crate also grants a hammock; add `hammockAwarded` to `DropResult`.
- `mobile/app/(tabs)/bananas.tsx` (modify): resolve a raid on focus, show the reveal modal, show the hammock count, wire tuck-in.
- `mobile/components/PetActions.tsx` (modify): a Tuck-in / Take-out control on the selected banana.
- `mobile/components/BananaGrid.tsx` (modify): a small hammock badge on a protected banana.
- `mobile/app/rewards.tsx` (modify): show "+1 Banana Hammock" on the crate reveal when one was awarded.

---

## Task 1: Banana model + event cleanup (`lib/pet.ts`)

**Files:**
- Modify: `mobile/lib/pet.ts`

- [ ] **Step 1: Add the `protected` field to the `Banana` interface**

In the `Banana` interface (currently ends with `end_reason?: EndReason;`), add:

```ts
  /** True while this banana is tucked into a hammock (raid-proof). */
  protected?: boolean;
```

- [ ] **Step 2: Retire the foreground monkey and bird events**

In `RANDOM_EVENTS`, delete the two array entries whose `reason` is `'monkey'` and `'bird'`. Leave `roommate`, `dropped`, and `avocado_jealous` exactly as they are. Leave the `EndReason` union unchanged (`'monkey'` is still used by the new raid; `'bird'` may exist in old saved histories).

- [ ] **Step 3: Add `setBananaProtected`**

After `setBananaEnvironment`, add a single-slot tuck mutation. Only one banana is protected at a time, and only an alive banana can be tucked:

```ts
export async function setBananaProtected(
  bunch: Bunch,
  bananaId: string,
  value: boolean,
): Promise<Bunch> {
  const ticked = tickBunch(bunch, false);
  const updated = ticked.bananas.map((b) => {
    if (value) {
      // Single slot: the targeted alive banana is protected, all others cleared.
      return { ...b, protected: b.id === bananaId && b.alive };
    }
    return b.id === bananaId ? { ...b, protected: false } : b;
  });
  const next: Bunch = { ...ticked, bananas: updated };
  await persistBunch(next);
  return next;
}
```

- [ ] **Step 4: Verify**

Run: `cd mobile && npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add mobile/lib/pet.ts
git commit -m "Add protected flag + tuck mutation; retire foreground monkey/bird events"
```

---

## Task 2: Hammock state + raid logic (`lib/hammock.ts`)

**Files:**
- Create: `mobile/lib/hammock.ts`

- [ ] **Step 1: Write the module**

```ts
/**
 * Banana Hammock + overnight monkey raid.
 *
 * You hold N hammocks. You may tuck ONE banana in (pet.ts `protected`).
 * Once per effective day, on returning to the app, a monkey may raid and
 * take your most valuable banana. If that banana was in the hammock, the
 * hammock is spent and the banana is saved; otherwise the monkey takes it.
 * Unused hammocks carry over, so you can hoard them.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Banana, Bunch, BunchEvent, EndReason } from './pet';

const STORAGE_KEY = 'gobananas/hammock/v1';

export const DEFAULT_RAID_CHANCE = 0.35;

export type RaidOutcome =
  | { kind: 'quiet' } // no raid this time
  | { kind: 'blocked'; bananaName: string } // hammock saved it
  | { kind: 'stolen'; bananaName: string }; // monkey took it

export interface HammockState {
  count: number;
  last_raid_date: string | null;
  last_outcome: RaidOutcome | null;
}

const INITIAL: HammockState = { count: 0, last_raid_date: null, last_outcome: null };

export async function loadHammock(): Promise<HammockState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...INITIAL };
    const parsed = JSON.parse(raw) as Partial<HammockState>;
    return { ...INITIAL, ...parsed };
  } catch {
    return { ...INITIAL };
  }
}

export async function saveHammock(state: HammockState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function grantHammock(n = 1): Promise<HammockState> {
  const state = await loadHammock();
  const next = { ...state, count: state.count + n };
  await saveHammock(next);
  return next;
}

export async function clearHammock(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

/** Most valuable = closest to the middle of the peak band (ripeness 75). */
function pickMostValuable(alive: Banana[]): Banana {
  return alive.reduce((best, b) => {
    const vb = -Math.abs(b.ripeness - 75);
    const vbest = -Math.abs(best.ripeness - 75);
    if (vb > vbest) return b;
    if (vb === vbest && b.ripeness > best.ripeness) return b;
    return best;
  });
}

function raidEvent(outcome: RaidOutcome): BunchEvent {
  const iso = new Date().toISOString();
  if (outcome.kind === 'blocked') {
    return {
      iso,
      type: 'event',
      detail: `🐒 A monkey came for ${outcome.bananaName}, but it was snug in the hammock. The monkey left in a huff (and pocketed a loose peel).`,
      glyph: '🪢',
    };
  }
  return {
    iso,
    type: 'event',
    detail: `🐒 A monkey raided overnight and made off with ${outcome.bananaName}. No hammock, no mercy.`,
    glyph: '🐒',
  };
}

/**
 * Pure raid resolution. Always stamps `last_raid_date` to `today` so the
 * caller only resolves once per day. `rng` is injectable for future tests.
 */
export function resolveRaid(
  bunch: Bunch,
  state: HammockState,
  today: string,
  raidChance: number = DEFAULT_RAID_CHANCE,
  rng: () => number = Math.random,
): { bunch: Bunch; state: HammockState; outcome: RaidOutcome } {
  const stamped = { ...state, last_raid_date: today };
  const alive = bunch.bananas.filter((b) => b.alive);

  if (alive.length === 0 || rng() >= raidChance) {
    const outcome: RaidOutcome = { kind: 'quiet' };
    return { bunch, state: { ...stamped, last_outcome: outcome }, outcome };
  }

  const target = pickMostValuable(alive);

  if (target.protected && stamped.count > 0) {
    const outcome: RaidOutcome = { kind: 'blocked', bananaName: target.name };
    const bananas = bunch.bananas.map((b) =>
      b.id === target.id ? { ...b, protected: false } : b,
    );
    return {
      bunch: { ...bunch, bananas, history: [...bunch.history, raidEvent(outcome)] },
      state: { ...stamped, count: stamped.count - 1, last_outcome: outcome },
      outcome,
    };
  }

  const outcome: RaidOutcome = { kind: 'stolen', bananaName: target.name };
  const bananas = bunch.bananas.map((b) =>
    b.id === target.id
      ? { ...b, alive: false, end_reason: 'monkey' as EndReason, protected: false }
      : b,
  );
  return {
    bunch: { ...bunch, bananas, history: [...bunch.history, raidEvent(outcome)] },
    state: { ...stamped, last_outcome: outcome },
    outcome,
  };
}
```

- [ ] **Step 2: Verify**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors. Confirm `BunchEvent`, `Banana`, `Bunch`, `EndReason` are all exported from `pet.ts` (they are).

- [ ] **Step 3: Commit**

```bash
git add mobile/lib/hammock.ts
git commit -m "Add hammock state module + pure resolveRaid logic"
```

---

## Task 3: Hammocks drop from crates (`lib/drops.ts` + `app/rewards.tsx`)

**Files:**
- Modify: `mobile/lib/drops.ts`
- Modify: `mobile/app/rewards.tsx`

- [ ] **Step 1: Award a hammock sometimes**

In `drops.ts`: import `grantHammock` from `./hammock`. Add `hammockAwarded?: boolean;` to the `DropResult` interface. In `openCrate`, after the rarity is rolled, compute `const hammockAwarded = Math.random() < 0.2;`, and `if (hammockAwarded) await grantHammock(1);`. Include `hammockAwarded` on the returned `DropResult` in BOTH the peels path and the variety path.

- [ ] **Step 2: Surface it on the reveal**

In `rewards.tsx`, find where a `DropResult` is shown after opening a crate. When `result.hammockAwarded` is true, render one extra line on the reveal card, e.g. `+1 Banana Hammock 🪢 — tuck a banana in on the Bananas tab`. Match the existing reveal-card styles; do not restructure the screen.

- [ ] **Step 3: Verify**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add mobile/lib/drops.ts mobile/app/rewards.tsx
git commit -m "Drop hammocks from daily crates (~20%) and show it on the reveal"
```

---

## Task 4: Resolve the raid on app open + reveal (`app/(tabs)/bananas.tsx`)

**Files:**
- Modify: `mobile/app/(tabs)/bananas.tsx`

- [ ] **Step 1: Imports and state**

Import `effectiveToday` from `../../lib/streak`, and `loadHammock`, `saveHammock`, `resolveRaid`, `HammockState`, `RaidOutcome` from `../../lib/hammock`. Add state: `const [hammock, setHammock] = useState<HammockState | null>(null);` and `const [raidReveal, setRaidReveal] = useState<RaidOutcome | null>(null);`.

- [ ] **Step 2: Resolve once per day on focus**

Inside the existing `useFocusEffect` callback (the 4s ticker), before the interval is created, run a one-shot guarded check:

```ts
(async () => {
  const today = await effectiveToday();
  const h = await loadHammock();
  if (h.last_raid_date === today) { setHammock(h); return; }
  const current = await loadBunch();
  if (!current) { const stamped = { ...h, last_raid_date: today }; await saveHammock(stamped); setHammock(stamped); return; }
  const ticked = tickBunch(current, false);
  const r = resolveRaid(ticked, h, today);
  await persistBunch(r.bunch);
  await saveHammock(r.state);
  if (alive) { setBunch(r.bunch); setHammock(r.state); if (r.outcome.kind !== 'quiet') setRaidReveal(r.outcome); }
})();
```

(`alive` is the existing in-scope flag the focus effect already uses to avoid setting state after blur.) The guard `last_raid_date === today` makes this idempotent, so running on every focus is safe.

- [ ] **Step 3: Reveal modal**

Add a `RaidRevealModal` subcomponent (model it on `NamingModal`'s scrim + card structure) shown when `raidReveal !== null`, dismissed by setting it back to null. Copy:
- blocked: title `🪢 Hammock held!`, body `A monkey crept in for ${name} overnight. The hammock held. It left with nothing but a peel.`
- stolen: title `🐒 Monkey raid`, body `A monkey slipped in overnight and made off with ${name}. Tuck your best one into a hammock next time.`
One button: `Got it`.

- [ ] **Step 4: Verify**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors.
Manual: `npm run ios`, plant a Fast bunch, advance the demo day (Task 6 explains the control), return to the Bananas tab, confirm a raid reveal appears at most once per advanced day and a banana is gone (or saved if tucked).

- [ ] **Step 5: Commit**

```bash
git add "mobile/app/(tabs)/bananas.tsx"
git commit -m "Resolve overnight monkey raid on focus + reveal modal"
```

---

## Task 5: Tuck-in control, count, and badge

**Files:**
- Modify: `mobile/app/(tabs)/bananas.tsx`
- Modify: `mobile/components/PetActions.tsx`
- Modify: `mobile/components/BananaGrid.tsx`

- [ ] **Step 1: Tuck handler in the screen**

In `bananas.tsx` add:

```ts
const handleToggleHammock = async () => {
  if (!bunch || !selectedBanana || !hammock) return;
  const willProtect = !selectedBanana.protected;
  if (willProtect && hammock.count < 1) return; // need a hammock to tuck
  const next = await setBananaProtected(bunch, selectedBanana.id, willProtect);
  setBunch(next);
};
```

Import `setBananaProtected` from `../../lib/pet`. Pass `hammockCount={hammock?.count ?? 0}` and `onToggleHammock={handleToggleHammock}` to `PetActions`.

- [ ] **Step 2: Tuck button in PetActions**

In `PetActions.tsx`, accept the two new props. Below the eat action, render a button shown only when the banana is alive: label `🪢 Tuck into hammock` when not protected (disabled with a hint `No hammocks — open a crate` when `hammockCount < 1`), and `Take out of hammock` when `banana.protected`. Follow the existing button styles in that file.

- [ ] **Step 3: Count in the header + badge in the grid**

In `bananas.tsx` header (`styles.head`), add a small line under the lede: `🪢 {hammock?.count ?? 0} hammock(s)`. In `BananaGrid.tsx`, render a small `🪢` badge on a tile when `banana.protected` is true (corner overlay, follow existing tile styles).

- [ ] **Step 4: Verify**

Run: `cd mobile && npx tsc --noEmit`
Expected: no errors.
Manual: with at least one hammock, select a banana, tuck it in (badge appears, count logic holds), advance the demo day, return, confirm a raid targeting that banana is blocked and the count drops by one.

- [ ] **Step 5: Commit**

```bash
git add "mobile/app/(tabs)/bananas.tsx" mobile/components/PetActions.tsx mobile/components/BananaGrid.tsx
git commit -m "Tuck-in control, hammock count, and protected badge"
```

---

## Task 6: Full typecheck + playtest

**Files:** none (verification only)

- [ ] **Step 1: Typecheck the whole app**

Run: `cd mobile && npx tsc --noEmit`
Expected: clean.

- [ ] **Step 2: Playtest in Fast mode**

Run `npm run ios` (or `npm run start` and open Expo Go). Then:
- Open a few crates until you get at least one hammock (drop is ~20%, so a handful of opens).
- Plant a Fast bunch, tuck your ripest banana in.
- Trigger the day boundary so a raid resolves: use the demo day-advance control (the streak/rewards screen exposes `demoAdvanceDay` from `lib/streak.ts`; if there is no button yet, that is the control to tap). Advance the day, return to the Bananas tab.
- Confirm: the reveal fires at most once per advanced day; a tucked-and-targeted banana is saved and the count drops; an untucked best banana gets taken; quiet days show nothing.

- [ ] **Step 3: Confirm the threat model reads clean**

Play a few minutes and confirm no foreground monkey or bird events fire any more (only roommate / dropped / mush / avocado as flavor), and the monkey only shows up as the overnight raid.

- [ ] **Step 4: Ship is a separate, gated step**

Do NOT bump the build or ship. Per project rules, phone testing is iterate mode. When Eric says ship, bump `mobile/app.json` `ios.buildNumber` to 11 and run `npm run ship:ios`.

---

## Notes for the executor

- Cross-platform RN change: before the build/playtest, the project convention (Eric's P4) is to run a few subagent reviewers over the diff. Do that after Task 5.
- Tuning numbers (`DEFAULT_RAID_CHANCE = 0.35`, crate drop `0.2`) are first-pass; expect to adjust after playtest.
- Keep all user-facing copy free of em dashes (public repo, App Store surface).
