# Web Version — Design Spec

Date: 2026-06-27
Status: Approved for planning

## 1. Overview

Ship a web version of the Game of SKATE app that delivers the **exact same
experience** as the native app for people who use the site instead of
downloading it. Achieved by enabling the **react-native-web (RNW)** target on the
existing Expo app — one codebase, shared UI and engine — rather than building a
separate web app.

Verified feasible: `expo export --platform web` already builds the current app
with no changes (produces `index.html`, a ~50KB compiled CSS from uniwind, and
the JS bundle). Reanimated, gesture-handler, bottom-sheet, and heroui all bundle
for web.

### Goals

- Identical look, behavior, and animations on web and native.
- Maximum reuse: the pure engine (`lib/skate`) and all UI components are shared
  unchanged.
- Web runs offline/local like the app (no backend).

### Non-goals

- A separate web UI / Next.js app (would duplicate the UI and drift).
- SSR/SEO (irrelevant for a single-screen trick generator SPA).
- Web push, PWA installability (possible later, out of scope now).

## 2. Locked decisions

| Decision | Choice |
| --- | --- |
| Approach | RNW on the existing `apps/native` app (one codebase) |
| Desktop layout | Centered phone-width column with a muted backdrop |
| Persistence on web | `localStorage` (native keeps `expo-secure-store`) |
| Haptics on web | No-op wrapper |
| Deployment | Static SPA via `expo export -p web` (target TBD, not in this scope) |

## 3. Architecture

The web build is the same app rendered by react-native-web. The website is
produced by Metro from `apps/native`:

- Dev: `expo start --web` (script `pnpm -F native web`).
- Build: `expo export --platform web` → static `dist/` (html + js + css + assets).

No new workspace package. `apps/native` now also targets web (the folder name is
a mild misnomer; left as-is to avoid churn across scripts/turbo filters).

Everything in `lib/skate`, `stores/settings.tsx`, `app/`, and
`components/skate/` is shared without modification except the three
platform-specific seams below.

## 4. Platform-specific work

### 4.1 Persistence (`stores/persist.ts`)

`expo-secure-store` has no web implementation. Branch on `Platform.OS`:

- **web**: `localStorage.getItem` / `localStorage.setItem` (synchronous — maps
  directly onto the existing `loadSync` + debounced `save`).
- **native**: unchanged `expo-secure-store` (`getItem` sync, `setItemAsync`).

The public interface (`loadSync(key)`, `save(key, value)`) does not change, so
`stores/settings.tsx` and everything downstream are untouched. Guard
`localStorage` access in try/catch (private-mode / disabled storage → fall back
to in-memory, returns `undefined`).

### 4.2 Haptics (`lib/haptics.ts`, new)

Add a thin wrapper so haptics can never throw on web and the call sites stay
clean:

- `impact()`, `notify()`, `select()` — native → the corresponding
  `expo-haptics` calls; web → no-op.

Replace the direct `expo-haptics` imports/calls in: `trick-reveal.tsx`,
`generate-surface.tsx`, `domain-pill.tsx`, `difficulty-bar.tsx`,
`theme-toggle.tsx`. Call sites still gate on `hapticsEnabled` as today.

### 4.3 Desktop "phone frame" (`components/app-frame.tsx`, new)

A wrapper applied at the root (`app/_layout.tsx`) that, **on web only**,
constrains content to a centered mobile-width column:

- Outer view: `flex: 1`, centered (`alignItems: "center"`), muted backdrop color.
- Inner view: `flex: 1`, `width: "100%"`, `maxWidth: 440`, app background.
- On native (and narrow mobile web ≤ maxWidth) it is effectively full-width.

Supporting web polish:

- Root fills the viewport (`100vh`) — add minimal global web CSS if Expo's
  default root height is insufficient.
- `userSelect: "none"` on the trick text / tap surface so tapping doesn't select
  text; pointer cursor on interactive surfaces.

### 4.4 Web metadata (`app.json`)

Set web `name`/title, `themeColor`, description; favicon already present
(`assets/images/favicon.png`).

## 5. What stays identical

Engine (enumerate/select/preset/settings), the generator screen, slot-machine
reveal (Reanimated runs on the JS thread on web), the bottom-sheet menu, the
draggable difficulty bar (gesture-handler responds to mouse drag), theme, and
reduce-motion handling — all shared, no web-specific forks.

## 6. Tooling

- Add root script `dev:web` → `turbo -F native web` (optional convenience).
- `apps/native` already has a `web` script (`expo start --web`).

## 7. Testing & verification

- Engine unit tests (Vitest) unchanged — still green.
- `expo export --platform web` builds clean (already verified).
- Manual web pass (Chrome + mobile browser):
  1. Tap the trick → flicker reveal + settle (no haptics on web; no errors).
  2. Open menu → toggle stances/tricks; drag difficulty bar (mouse) → preset
     applies.
  3. Settings persist across a page reload (localStorage).
  4. Theme toggle; reduce-motion → crossfade.
  5. Desktop: centered phone-width frame; narrow mobile web: full-width.

## 8. Risks

- `@gorhom/bottom-sheet` and gesture-handler on web: expected to work; confirm
  sheet open/drag/backdrop and bar drag in a browser.
- Bundle size (~3.8MB JS) — acceptable for an SPA; can optimize later (e.g.,
  trim unused vector-icon fonts).
- `localStorage` unavailable (private mode) → in-memory fallback, no crash.

## 9. Future (out of scope)

PWA/installable web app, deployment pipeline (Vercel static), bundle trimming,
optional `navigator.vibrate` on supporting mobile browsers.
