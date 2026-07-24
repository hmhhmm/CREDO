// The brand's rotated-seal motif (DESIGN.md: "Rotated -4deg — this is non-negotiable; it
// mimics an ink stamp"), never ported to mobile until now. Reserved for the one state that
// actually earns it: a candidate with all three verification types (GitHub, credential,
// document) verified — not a generic decorative badge.
import { View, Text, StyleSheet } from "react-native";
import { ShieldCheck } from "lucide-react-native";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

export default function FullyVerifiedStamp() {
  return (
    <View
      style={styles.wrap}
      accessibilityRole="text"
      accessibilityLabel="Fully verified — GitHub, credential, and document all verified"
    >
      <ShieldCheck size={11} color={colors.verified} strokeWidth={2.5} />
      <Text style={styles.text}>Fully Verified</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.verified,
    borderRadius: 100,
    paddingVertical: 3,
    paddingHorizontal: 9,
    backgroundColor: "rgba(31,122,92,0.08)",
    transform: [{ rotate: "-4deg" }],
  },
  text: { fontFamily: fonts.monoMedium, fontSize: 9.5, textTransform: "uppercase", letterSpacing: 0.5, color: colors.verified },
});
