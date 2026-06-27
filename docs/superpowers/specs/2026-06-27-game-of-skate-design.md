# Game of SKATE Helper — Design Spec

Date: 2026-06-27
Status: Approved for planning

## 1. Overview

A minimal, fast mobile app that generates skateboarding tricks for the Game of
SKATE. The primary experience is a single screen: tap to get a trick. Everything
else (filters, modes, settings) lives in a minimal bottom-sheet menu.

The app must run flawlessly and feel fast, with quick, satisfying reveal
animations and haptic feedback. It is fully offline/local (no backend).

### Goals

- Generate flatground tricks across all stances and the full combinatorial
  trick space, with correct skate names.
- Generate ledge/rail tricks (slides & grinds) for skatepark sessions.
- Difficulty-aware generation: the user picks a difficulty range; harder tricks
  appear rarer.
- A one-tap interaction with a satisfying, sub-450ms animated reveal.
- Minimal UI: one screen + one menu.

### Non-goals (v1)

- Letter / S-K-A-T-E tracking and multiplayer scoring (architecture leaves a
  clean slot to add this later).
- Trick history view, stats, streaks.
- Entry flips into grinds (e.g. kickflip-to-boardslide).
- Trick-name alias polish (Half Cab, Caballerial, etc.).
- Frontside/backside difficulty asymmetry.
- Backend, accounts, sync, custom trick authoring.

## 2. Locked decisions (from brainstorming)

| Decision | Choice |
| --- | --- |
| Trick vocabulary | Combinatorial + validity/naming rules; derive valid tricks and correct names from components |
| Selection | Difficulty-weighted; range filter, harder = rarer |
| Letter tracking | None in v1 |
| Primary interaction | Big tap → reanimated reveal + haptics |
| Skatepark mode | Slides/grinds is a second domain in v1, sharing the engine |
| Persistence | `expo-secure-store` (JSON), abstracted so it can swap to MMKV later |
| Navigation | Replace the scaffold's drawer/tabs demo with a single generator screen |

## 3. Architecture

A pure, domain-agnostic generation core feeds a single generator screen. A
*domain* supplies its stances, base tricks, and rules. Flatground and
Grinds/Slides are two domain configs using the same engine and same UI.

```
apps/native/
  lib/skate/
    types.ts             # Stance, Dir, BaseTrick, Domain, Trick, Settings
    domains/
      flatground.ts      # stances, base tricks (data)
      grinds.ts          # ledge/rail vocab (data)
      index.ts           # domain registry
    stance.ts            # stance modifiers + name prefixes
    enumerate.ts         # (domain) -> Trick[]  (valid, named, difficulty)
    select.ts            # difficulty-weighted, no-repeat sampler (pure)
    tier.ts              # difficulty <-> tier mapping
    __tests__/           # vitest specs for the pure core
  stores/
    settings.ts          # context/hook: active domain, enabled components, tiers, haptics
    persist.ts           # tiny wrapper over expo-secure-store (debounced)
  app/
    _layout.tsx          # providers + single-screen Stack (existing providers kept)
    index.tsx            # the generator screen
  components/skate/
    GenerateSurface.tsx  # full-screen tap target + haptics
    TrickReveal.tsx      # reanimated slot/settle reveal
    DomainPill.tsx       # Flatground <-> Grinds switch
    SettingsSheet.tsx    # @gorhom/bottom-sheet minimal menu
    DifficultyTiers.tsx  # tier chips
    ToggleChips.tsx      # stance + base-trick toggles
```

Kept from scaffold: `components/container.tsx`, `components/theme-toggle.tsx`,
`contexts/app-theme-context.tsx`, `global.css`, all providers in `_layout.tsx`.

Removed from scaffold: `app/(drawer)/**`, `app/(drawer)/(tabs)/**`,
`app/modal.tsx`, `app/+not-found.tsx` sample content (a real not-found can stay),
and the demo cards.

Principles:
- The core (`lib/skate`) imports nothing React Native specific. Pure functions,
  fully unit-testable, fast.
- No app state lives in the engine. State is the user's `Settings` + the current
  trick + the previous trick id (for no-repeat).
- React Compiler is enabled — do not hand-memoize defensively; use `useMemo`
  only for the (cheap) enumeration keyed on domain + settings where it clarifies
  intent.

## 4. Domain model & types

```ts
export type Stance = "regular" | "fakie" | "switch" | "nollie";
export type Dir = "fs" | "bs"; // frontside / backside

export type BaseTrick = {
  id: string;
  name: string;                          // canonical base name
  base: number;                          // base difficulty 1-10
  dir: "none" | "optional" | "required"; // none: no FS/BS; optional: emit FS+BS; required: direction is part of identity
};

export type DomainId = "flatground" | "grinds";

export type Domain = {
  id: DomainId;
  label: string;
  stances: Stance[];
  bases: BaseTrick[];
};

export type Trick = {
  id: string;          // stable: `${domain}:${stance}:${base}:${dir ?? "x"}`
  domain: DomainId;
  name: string;        // composed display name; "regular" omitted
  difficulty: number;  // base + stanceMod (+ dirMod, 0 in v1), clamped >= 1
  stance: Stance;
  base: string;        // BaseTrick id
  dir?: Dir;
};

export type Tier = "beginner" | "intermediate" | "advanced";

export type DomainSettings = {
  enabledStances: Stance[]; // >= 1
  enabledBases: string[];   // BaseTrick ids, >= 1
  tiers: Tier[];            // >= 1 selected
};

export type Settings = {
  activeDomain: DomainId;
  hapticsEnabled: boolean;
  domains: Record<DomainId, DomainSettings>;
};
```

## 5. Trick data

### Stance modifiers

`regular +0` · `fakie +1` · `nollie +2` · `switch +3`

Name prefix: regular omitted; others title-cased (`Switch`, `Nollie`, `Fakie`).

### Flatground bases

| base | difficulty | dir |
| --- | --- | --- |
| Ollie | 1 | none |
| Shuvit (pop shuvit) | 2 | optional |
| 180 | 2 | required |
| Kickflip | 3 | none |
| Heelflip | 3 | none |
| 360 Shuvit | 4 | optional |
| Varial Kickflip | 4 | none |
| Varial Heelflip | 4 | none |
| Bigspin | 5 | required |
| 360 Flip (treflip) | 6 | none |
| Hardflip | 6 | none |
| Inward Heelflip | 6 | none |
| Bigspin Flip | 7 | required |
| Laser Flip | 7 | none |

### Grinds / slides bases

| base | difficulty | dir |
| --- | --- | --- |
| 50-50 | 1 | optional |
| Boardslide | 2 | optional |
| Noseslide | 3 | optional |
| 5-0 | 3 | optional |
| Nosegrind | 3 | optional |
| Tailslide | 4 | optional |
| Lipslide | 4 | optional |
| Crooked Grind | 5 | optional |
| Smith Grind | 6 | optional |
| Feeble Grind | 6 | optional |
| Bluntslide | 7 | optional |
| Nosebluntslide | 8 | optional |

## 6. Rules: composition, naming, difficulty

### Name composition

`name = [stance prefix if not regular] [FS/BS if dir present] [base name]`

- `dir: "optional"` → enumerate both `fs` and `bs` variants.
- `dir: "required"` → the direction is part of identity (180, bigspin); never
  emit a bare variant.
- `dir: "none"` → a single trick, no direction.

Examples: `Kickflip`, `Switch Kickflip`, `Nollie Backside 360 Shuvit`,
`Fakie Frontside Bigspin`, `Backside 50-50`, `Switch Frontside Boardslide`.

`fs` renders as `Frontside`, `bs` as `Backside`.

### Difficulty

`difficulty = base + stanceMod` (dirMod = 0 in v1; tunable later). Clamp to >= 1.

### Tiers

| tier | difficulty |
| --- | --- |
| beginner | 1-4 |
| intermediate | 5-8 |
| advanced | 9+ |

`tier.ts` maps a numeric difficulty to a `Tier` and back to a difficulty range.

## 7. Selection algorithm (pure)

```
pool(domain, settings) =
  enumerate(domain)
    .filter(t => settings.enabledStances.includes(t.stance))
    .filter(t => settings.enabledBases.includes(t.base))
    .filter(t => settings.tiers.includes(tierOf(t.difficulty)))

pick(pool, lastId):
  if pool empty -> null (UI shows an empty-state hint)
  candidates = pool.length > 1 ? pool.filter(t => t.id !== lastId) : pool
  weight(t) = (maxDifficultyInPool - t.difficulty + 1)   // harder = rarer
  return weightedRandom(candidates, weight)
```

- Enumeration is computed once per (domain) and cached; re-filtered when settings
  change. A few hundred items max — trivial cost.
- `pick` is pure aside from `Math.random` (acceptable in app code). Returns a
  `Trick` or `null`.
- No immediate repeat unless the pool has a single trick.

## 8. Settings & persistence

- `stores/settings.ts`: a React context + `useSettings()` hook exposing the
  `Settings` object and mutators (set active domain, toggle stance, toggle base,
  set tiers, toggle haptics, reset to defaults). Enforces invariants: at least
  one stance, one base, and one tier enabled per domain.
- Defaults: all stances on, all bases on, all tiers on, haptics on,
  activeDomain = flatground.
- `stores/persist.ts`: `load<T>(key, fallback)` / `save(key, value)` over
  `expo-secure-store` (`getItemAsync` / `setItemAsync`, JSON). Writes are
  debounced (~300ms). On boot, hydrate once and merge over defaults; render
  defaults until hydrated (non-blocking).
- The wrapper isolates storage so it can later swap to MMKV when the app moves to
  a dev build.

## 9. UI, interaction & animation

### Generator screen (`app/index.tsx`)

- Tiny top bar: menu button (opens the sheet) + a `DomainPill` showing the active
  domain, tappable to switch Flatground <-> Grinds.
- Center: the current trick name in large, bold type, with a difficulty-tier
  accent (color + small label). Subtle first-run hint: "Tap to roll".
- The whole area below the top bar is a `GenerateSurface` tap target → `roll()`.
- Empty state (no tricks match filters): a short hint to widen the filters,
  with a shortcut to open the menu.

### Reveal animation (`TrickReveal.tsx`, reanimated 4)

- On tap: medium impact haptic.
- Slot-machine flicker: cycle ~6-8 random names over ~300ms; a light haptic tick
  per flicker (scheduled on the UI thread, throttled).
- Settle: spring in with a slight scale overshoot; the outgoing name fades up and
  out; tier accent animates in. Success/selection haptic on settle.
- Total budget < ~450ms so it feels snappy.
- Reduce-motion: skip the flicker, do a simple crossfade; reduce haptics.
- All transforms/opacity run as worklets on the UI thread.

### Minimal menu (`SettingsSheet.tsx`, `@gorhom/bottom-sheet`)

Contents:
- Domain switch (segmented: Flatground / Grinds).
- Difficulty: tier chips (Beginner / Intermediate / Advanced), multi-select,
  >= 1 required.
- Stance toggles (chips): Regular / Fakie / Switch / Nollie, >= 1 required.
- Base-trick toggles for the active domain (chips/list), with Select all / none,
  >= 1 required.
- Haptics on/off.
- Theme toggle (reuse existing `ThemeToggle`).
- Reset to defaults.

## 10. Navigation changes

- `app/_layout.tsx`: keep `GestureHandlerRootView`, `KeyboardProvider`,
  `AppThemeProvider`, `HeroUINativeProvider`. Wrap with
  `BottomSheetModalProvider` and `SafeAreaProvider` as needed. Replace the
  drawer/tabs Stack with a single `index` screen (header hidden).
- Remove `app/(drawer)/**`, `app/(drawer)/(tabs)/**`, `app/modal.tsx`, and demo
  content. Keep or replace `+not-found.tsx` with a minimal version.
- Settings is a bottom sheet (overlay), not a route.

## 11. Performance

- Reanimated 4 worklets run animations on the UI thread (60/120fps). No
  JS-thread work during the reveal except throttled haptic ticks.
- Enumeration runs once and is cached; selection is O(n) over a few hundred
  items.
- `expo-secure-store` reads only at boot; writes are debounced.
- React Compiler handles memoization; avoid manual over-memoization.

## 12. Testing

- `vitest` (new devDep) over the pure core in `lib/skate/__tests__`:
  - `enumerate`: correct trick counts per domain; FS/BS expansion for
    `optional`; required-direction never bare; `regular` omitted from names;
    difficulty = base + stanceMod; stable ids.
  - `tier`: difficulty <-> tier mapping boundaries.
  - `select`: respects stance/base/tier filters; no immediate repeat; allows
    repeat when pool size is 1; weighting makes easier tricks more frequent
    (statistical sanity over many draws with a seeded/mocked random); empty pool
    returns null.
- No RN-runtime/component tests in v1; the reveal animation and sheet are
  verified manually on device.

## 13. Future extension hooks

- Letter tracking / multiplayer: add a `stores/game.ts` (players, letters, turn
  order) and an optional overlay above the generator. Tricks already carry stable
  ids and difficulty.
- MMKV persistence: swap `persist.ts` internals when moving to a dev build.
- Trick-name aliases (Half Cab, Caballerial), FS/BS asymmetry, entry flips into
  grinds: data/rule additions, no architecture change.
