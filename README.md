# Skate Call

A fast, minimal trick caller for skateboarding's **Game of S.K.A.T.E.** Tap to
get a trick, go skate it — or hand the phone around and let the app keep score.

> React Native + Expo. iOS, Android and web. Offline, no backend, no accounts.

## Features

- **Tap to call** — one big, readable trick name (sized to fit, one word per
  line) with a quick staggered reveal and haptics. Tap the stage, the button, or
  press <kbd>Space</kbd> on web.
- **Correct names** — tricks are generated from stance × base trick × direction
  (e.g. _Nollie Backside 360 Shuvit_), with well-known aliases (_Half Cab_,
  _Tre Flip_) and naming rules (a nollie ollie is just a _Nollie_).
- **Flat & Ledge** — flatground tricks or grinds & slides, one tap to switch.
- **No repeats** — recent tricks are kept out of the next few calls; harder
  tricks come up less often.
- **Game of S.K.A.T.E.** — pass-and-play for 2–8 skaters: the setter sets, the
  rest match, misses earn letters, last one standing wins. Undo, rematch, and a
  solo mode (how many can you land before S.K.A.T.E.?). Games survive an app
  reload. Web hotkeys: <kbd>L</kbd> landed, <kbd>M</kbd> missed, <kbd>U</kbd> undo.
- **Trick bag** — a settings sheet with level presets (Beginner / Intermediate /
  Advanced), stance and trick toggles, haptics, and System / Light / Dark theme.
  Everything persists locally.

## Tech stack

- [Expo](https://expo.dev) SDK 56, React Native 0.85, React 19 (React Compiler)
- [expo-router](https://docs.expo.dev/router/introduction/), react-native-web
- [Reanimated](https://docs.swmansion.com/react-native-reanimated/) 4,
  gesture-handler, [@gorhom/bottom-sheet](https://gorhom.dev/react-native-bottom-sheet/)
- Plain `StyleSheet` + a small token theme (`apps/native/theme/`)
- [Turborepo](https://turbo.build) + pnpm, [Vitest](https://vitest.dev)

## Getting started

Prerequisites: **Node 20+**, **pnpm 10+**, and [Expo Go](https://expo.dev/go)
(or an iOS/Android simulator).

```bash
pnpm install
pnpm dev:native     # Expo dev server (press i / a / w)
pnpm dev:web        # web only
```

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev:native` | Start the Expo dev server |
| `pnpm dev:web` | Start the web dev server |
| `pnpm test` | Run the unit tests (Vitest) |
| `pnpm check-types` | Type-check the workspace |

## How it works

The logic is pure TypeScript in `apps/native/lib/`, unit-tested in isolation:

- `skate/domains/` — stances and base tricks per spot (data).
- `skate/enumerate.ts` — expands components into every valid, named,
  difficulty-scored trick, including aliases.
- `skate/select.ts` — weighted pick that avoids recent tricks.
- `skate/preset.ts`, `skate/settings.ts` — level presets and the settings reducer.
- `skate/game.ts` — the Game of S.K.A.T.E. state machine (sets, matches,
  letters, elimination, solo, undo, rematch).
- `ui/fit-hero.ts` — sizes the trick name to the screen.

The UI is a thin layer on top:

```
apps/native/
  app/              # single screen (expo-router)
  components/       # trick stage, header, settings sheet
  components/game/  # players strip, controls, game over, setup sheet
  components/ui/    # button, segmented, chip, switch… primitives
  hooks/            # trick caller, per-turn game trick, web hotkeys
  stores/           # settings + game context, persistence
  theme/            # color tokens (light/dark), fonts, radius, spacing
  lib/              # pure engine (+ __tests__)
```

## License

[MIT](./LICENSE) © Andre Silva
