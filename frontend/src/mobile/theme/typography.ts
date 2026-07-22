// Font family names as registered via expo-font in App.tsx.
// Matches web's Tailwind fontFamily: display=Fraunces, sans=Inter, mono=IBM Plex Mono.
export const fonts = {
  display: "Fraunces_600SemiBold",
  displayBold: "Fraunces_700Bold",
  sans: "Inter_400Regular",
  sansMedium: "Inter_500Medium",
  sansSemiBold: "Inter_600SemiBold",
  mono: "IBMPlexMono_400Regular",
  monoMedium: "IBMPlexMono_500Medium",
};

import { Platform } from "react-native";

// The NamecardPremium component on web uses "Georgia, Times New Roman, serif" directly
// (not Fraunces) for its internal SERIF constant — preserve that distinction when porting.
// RN has no cross-platform Georgia; use each platform's native serif to match the *intent*
// (a serif distinct from the sans/mono faces) rather than bundling a font web doesn't use.
export const namecardFonts = {
  serif: Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" }),
  mono: fonts.mono,
};
