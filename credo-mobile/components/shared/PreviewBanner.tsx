// Marks a screen as illustrative/static content, not live backend data — used by the
// C6-C9 "(new)" features which have no backend support yet (see CREDO feature doc).
import { View, Text, StyleSheet } from "react-native";
import { Sparkles } from "lucide-react-native";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

export default function PreviewBanner() {
  return (
    <View style={styles.banner}>
      <Sparkles size={14} color={colors.pending} />
      <Text style={styles.text}>Preview — illustrative data, not yet connected to your live profile</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,251,235,0.85)",
    borderWidth: 1,
    borderColor: "rgba(217,164,65,0.35)",
    borderRadius: 14,
    padding: 12,
  },
  text: { flex: 1, fontFamily: fonts.mono, fontSize: 11, color: colors.pending, lineHeight: 15 },
});
