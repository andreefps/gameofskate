# Game of SKATE

A fast, minimal trick generator for the skateboarding **Game of SKATE** — tap to
get a trick, go skate it. Covers all flatground stances and a full combinatorial
trick space, plus a grinds & slides mode for the skatepark.

> Built with React Native + Expo. Offline, no backend, no accounts.

## Features

- **Tap to roll** — one screen, one gesture. A quick slot-machine reveal with
  spring settle and haptics. Tapping the trick rolls a new one.
- **All the tricks, named correctly** — tricks are generated combinatorially
  from stance × base trick × direction (e.g. _Nollie Backside 360 Shuvit_),
  pruned by naming rules so you never get nonsense.
- **Two modes** — **Flatground** and **Grinds & Slides** (ledges/rails), sharing
  the same engine.
- **Difficulty presets** — a draggable bar (Beginner · Intermediate · Advanced)
  enables a curated set of stances and tricks per level. Fully customizable
  afterward; reset restores defaults.
- **Minimal menu** — a bottom sheet for mode, difficulty, stance/trick toggles,
  haptics, and light/dark theme. Settings persist locally.
- **Feels good** — UI-thread animations (Reanimated) and haptic feedback; honors
  reduce-motion.

## Tech stack

- [Expo](https://expo.dev) SDK 56, React Native 0.85, React 19 (React Compiler)
- [expo-router](https://docs.expo.dev/router/introduction/) (file-based routing)
- [uniwind](https://github.com/saadeghi/uniwind) (Tailwind CSS v4 for RN) +
  [heroui-native](https://github.com/heroui-inc/heroui-native)
- [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/)
  4 + [gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/)
- [@gorhom/bottom-sheet](https://gorhom.dev/react-native-bottom-sheet/),
  expo-haptics, expo-secure-store
- [Turborepo](https://turbo.build) monorepo, [Vitest](https://vitest.dev) for the
  engine

## Getting started

Prerequisites: **Node 20+**, **pnpm 10+**, and the
[Expo Go](https://expo.dev/go) app (or an iOS/Android simulator).

```bash
pnpm install        # install dependencies
pnpm dev:native     # start the Expo dev server
```

Then scan the QR code with Expo Go, or press `i` / `a` for a simulator.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev:native` | Start the Expo dev server |
| `pnpm test` | Run the engine unit tests (Vitest) |
| `pnpm check-types` | Type-check the workspace |
| `pnpm -F native ios` / `android` | Build & run a native dev build |

## How it works

The trick logic is a **pure, dependency-free engine** in
`apps/native/lib/skate/`, unit-tested in isolation:

- `domains/` — the stances and base tricks for each mode (data).
- `enumerate.ts` — expands components into the full set of valid, named,
  difficulty-scored tricks (difficulty = base + stance modifier).
- `select.ts` — weighted random pick (harder tricks are rarer) with no immediate
  repeats.
- `preset.ts` — maps a difficulty level to its curated stances + tricks.
- `settings.ts` — pure reducer + persistence hydration.

The UI (`app/`, `components/skate/`, `stores/`) is a thin layer over that engine.

## Project structure

```
apps/native/
  app/                 # expo-router screens (single generator screen)
  components/skate/     # generator UI: reveal, tap surface, menu, difficulty bar
  stores/               # settings context + persistence (expo-secure-store)
  lib/skate/            # pure trick-generation engine (+ __tests__)
docs/                   # design spec
```

## Roadmap

Deliberately out of scope for now, but the architecture leaves room:

- S-K-A-T-E letter tracking / pass-and-play scoring
- Trick name aliases (Half Cab, Caballerial), frontside/backside difficulty split
- Entry flips into grinds (e.g. kickflip to boardslide)

## Acknowledgements

Bootstrapped with
[Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack).

## License

[MIT](./LICENSE) © Andre Silva
