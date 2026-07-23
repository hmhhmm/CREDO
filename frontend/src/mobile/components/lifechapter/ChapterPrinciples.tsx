// The non-negotiable — tone and safety, made explicit and visible.
//
// This feature touches genuinely sensitive things (health, parental status, caregiving).
// The guarantees below aren't marketing copy — they're the design constraints that keep it
// from becoming a discrimination vector. Stated plainly so the candidate can trust it.
import { View, Text, StyleSheet } from "react-native";
import { Lock, SlidersHorizontal, EyeOff, Heart } from "lucide-react-native";
import GlassCard from "../shared/GlassCard";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

const PRINCIPLES = [
  { Icon: Lock, title: "Private by default", body: "Your chapters are yours. Nothing here is shared until you decide to share it." },
  { Icon: SlidersHorizontal, title: "You control disclosure", body: "Per employer, show a chapter, show a neutral break, or hide it entirely." },
  { Icon: EyeOff, title: "Health & family stay private", body: "The reason behind a chapter is never shown to employers — only what you choose to." },
  { Icon: Heart, title: "Rest is valid", body: "A chapter doesn't have to be productive. Time off is a legitimate part of a career." },
];

export default function ChapterPrinciples() {
  return (
    <GlassCard radius={18}>
      <View style={styles.wrap}>
        <Text style={styles.header}>How we handle this</Text>
        {PRINCIPLES.map(({ Icon, title, body }, i) => (
          <View key={title} style={[styles.row, i > 0 && styles.divider]}>
            <View style={styles.iconWrap}>
              <Icon size={15} color={colors.verified} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.body}>{body}</Text>
            </View>
          </View>
        ))}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 18, gap: 2 },
  header: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: colors.slate, marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 11 },
  divider: { borderTopWidth: 1, borderTopColor: "rgba(16,25,43,0.07)" },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(31,122,92,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.ink },
  body: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, lineHeight: 17, marginTop: 2 },
});
