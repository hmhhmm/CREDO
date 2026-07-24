// The app's one identity mark — a navy circle with a thin gold hairline ring and a soft
// gold-tinted drop shadow for depth, echoing the SmartNamecard's own dark/gold seal
// language (see components/SmartNamecard) instead of a flat, undecorated circle. Used at
// "sm" in every role's Home header (opens Settings) and "lg" at the top of Settings
// itself, so the same mark reads consistently at both sizes. A blurred glow View sat
// behind an earlier version of this — dropped, it read as a muddy dark smear rather than
// a clean halo; a tinted shadow gives depth without that artifact.
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

const SIZES = {
  sm: { outer: 44, font: 16, ring: 2 },
  lg: { outer: 72, font: 24, ring: 2.5 },
} as const;

interface Props {
  initial: string;
  size?: keyof typeof SIZES;
  // Callers whose mark is a multi-letter code rather than a single initial (University's
  // "UTM") pass a smaller size explicitly — the component doesn't guess from string
  // length, since a future caller's label shape shouldn't require another guess bolted on.
  fontSize?: number;
}

export default function Avatar({ initial, size = "sm", fontSize }: Props) {
  const s = SIZES[size];
  return (
    <View
      style={[
        styles.circle,
        { width: s.outer, height: s.outer, borderRadius: s.outer / 2, borderWidth: s.ring },
      ]}
    >
      <Text style={[styles.initial, { fontSize: fontSize ?? s.font }]} numberOfLines={1}>
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.ink,
    borderColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  initial: { fontFamily: fonts.displayBold, color: colors.parchment },
});
