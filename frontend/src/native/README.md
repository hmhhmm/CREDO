# React Native compat layer

`src/mobile/` is the Expo app from `credo-mobile/`, moved into this web app. Its screens
were **not** rewritten — they still `import { View, Text } from "react-native"`, still use
`StyleSheet.create`, and still take `navigation` / `route` props. This directory is what
makes those imports resolve in a browser.

`vite.config.js` aliases every native package to a file here (and `tsconfig.json` mirrors
those aliases for the editor):

| Package                                     | Shim                            | Notes |
| ------------------------------------------- | ------------------------------- | ----- |
| `react-native`                              | `react-native.jsx`              | View, Text, Pressable, ScrollView, TextInput, Switch, ActivityIndicator, StyleSheet, Platform, Dimensions, Alert, Share, Linking |
| `react-native-safe-area-context`            | `safe-area-context.jsx`         | insets read from `env(safe-area-inset-*)` |
| `@react-navigation/*`                       | `navigation.jsx`                | nested stacks + bottom tabs as React state |
| `react-native-reanimated`                   | `react-native-reanimated.jsx`   | shared values + CSS transitions |
| `react-native-svg`                          | `react-native-svg.jsx`          | renames to DOM SVG elements |
| `react-native-qrcode-svg`                   | `react-native-qrcode-svg.jsx`   | backed by `qrcode.react` |
| `react-native-gesture-handler`              | `gesture-handler.jsx`           | passthrough — DOM events need no gesture root |
| `@react-native-async-storage/async-storage` | `async-storage.js`              | `localStorage`, memory fallback |
| `expo-linear-gradient`                      | `expo-linear-gradient.jsx`      | RN vectors → CSS gradient angle |
| `expo-blur`                                 | `expo-blur.jsx`                 | `backdrop-filter` |
| `expo-clipboard` / `-document-picker`       | matching files                  | async Clipboard API / hidden `<input type=file>` |
| `expo-constants` / `-status-bar` / `-splash-screen` | matching files          | no-ops on the web |
| `lucide-react-native`                       | `lucide-react`                  | same icon set, DOM renderer |

`style.js` is the heart of it: RN style objects are close to CSS but not identical, and it
reconciles the differences that actually bite — `shadow*`/`elevation` → `boxShadow`,
`paddingHorizontal`/`paddingVertical` → physical edges, `lineHeight: 17` → `"17px"` (React
treats `lineHeight` as unitless, so a bare number would mean 17× the font size),
`transform` arrays → a CSS transform string, and expo-font's per-weight family names
(`Inter_600SemiBold`) → family + numeric weight.

## Responsive layout

The app fills the viewport at every size — it is phone-sized on a phone and desktop-sized
on a desktop, not a phone mock-up floating in a bezel. One breakpoint, **900px**, switches
between the two modes, and it is declared in two places that must stay in sync:

- `DESKTOP_MIN_WIDTH` in `src/mobile/navigation/SegmentedTabBar.tsx`
- the `@media (min-width: 900px)` block in `native.css`

Below it: the original phone layout — content runs full-bleed and the nav is the floating
segmented pill (now width-capped so it does not stretch on a tablet).

At or above it: the nav becomes a fixed left rail (`RAIL_WIDTH`, 232px) with persistent
labels, `.rn-tab-scenes` is inset to clear it, and `.rn-safe-area` caps the content column
at 880px and centres it. The cap is applied to the screens' `SafeAreaView` root rather than
to their ScrollViews so that everything in a screen shares one column — capping only the
scroll area left the SimuHire composer misaligned under its message list. `ScreenBackground`
is a sibling of that element, so the warm ground still runs full-bleed behind the column.

The screens themselves are untouched by any of this.

## Divergences from `credo-mobile/`

The ported tree is otherwise a straight copy. Four files changed; the first two are marked
with a `WEB PORT:` comment:

- **`src/mobile/components/shared/CredoGlass.tsx`** — drops the `expo-glass-effect`
  (iOS-only Liquid Glass) branch, which has no browser counterpart. The blur fallback that
  the Expo app already used everywhere else is now the only path.
- **`src/mobile/lib/api.ts`** — the Expo version defers `mockApi` with `require()`, which
  does not exist in an ES module. There was no runtime cycle to avoid (mockApi's only
  import from `api.ts` is `import type`), so it is a static import here.
- **`src/mobile/navigation/SegmentedTabBar.tsx`** — gained the desktop rail described
  above. Portable: it branches on `useWindowDimensions()`, a real RN API, so a tablet build
  would get the same treatment.
- **`src/mobile/components/shared/ScreenBackground.tsx`** — the ambient light pools are
  blurred rather than flat-tinted circles. A hard-edged circle only reads as "light" while
  its edge stays out of frame; in a desktop window the arc was plainly visible. `filter` is
  supported on `View` in RN 0.76+, so this is portable too.

Anything else diverging means the two trees have drifted and should be re-synced.

## Known limitations

- `Alert.alert` maps to `window.alert`/`window.confirm`, so it looks like a browser dialog
  rather than a native one.
- Reanimated's worklets run per frame on the UI thread; here `useAnimatedStyle` is
  evaluated once per render and the browser tweens between results with a CSS transition.
  Good enough for the namecard flip; a gesture-driven animation would need more.
- `Dimensions.get('window').width` reports the phone-column width (`APP_WIDTH`), not the
  viewport. It is a module-scope constant, so it must stay in sync with
  `.app-shell__device` in `src/pages/app-shell.css`.
