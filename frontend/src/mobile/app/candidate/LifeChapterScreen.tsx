import { View, ScrollView, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Baby, HeartPulse, Compass, Plus } from "lucide-react-native";
import PreviewBanner from "../../components/shared/PreviewBanner";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import ChapterTimeline from "../../components/lifechapter/ChapterTimeline";
import ChapterPlanner from "../../components/lifechapter/ChapterPlanner";
import ChapterSupport from "../../components/lifechapter/ChapterSupport";
import ChapterPrinciples from "../../components/lifechapter/ChapterPrinciples";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

const CHAPTER_TYPES = [
  { Icon: Baby, label: "Parental leave", description: "Plan a return-to-work timeline that preserves verified momentum" },
  { Icon: HeartPulse, label: "Health break", description: "Pause without losing credential ledger continuity" },
  { Icon: Compass, label: "Sabbatical", description: "Plan re-entry with a skills-refresh checklist" },
];

export default function LifeChapterScreen() {
  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
          <PreviewBanner />
          <Text style={styles.intro}>
            Plan your career around real life events — not just continuous, uninterrupted employment.
          </Text>

          {/* Destigmatize — chapters, not gaps, with candidate-controlled disclosure */}
          <Text style={styles.sectionLabel}>Your chapters</Text>
          <ChapterTimeline />

          {/* Design ahead — plan the next break: runway, timing, re-entry */}
          <Text style={styles.sectionLabel}>Plan the next one</Text>
          <ChapterPlanner />

          {/* Support during — the Coach steps back on your terms */}
          <Text style={styles.sectionLabel}>While you're away</Text>
          <ChapterSupport />

          {/* Tone & safety — the non-negotiable, made explicit */}
          <Text style={styles.sectionLabel}>Tone & safety</Text>
          <ChapterPrinciples />

          {/* Start a new chapter from a template */}
          <Text style={styles.sectionLabel}>Start a chapter</Text>
          {CHAPTER_TYPES.map(({ Icon, label, description }) => (
            <GlassCard key={label} radius={18}>
              <View style={styles.card}>
                <Icon size={18} color={colors.ink} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{label}</Text>
                  <Text style={styles.cardBody}>{description}</Text>
                </View>
              </View>
            </GlassCard>
          ))}
          <Pressable style={styles.addButton}>
            <Plus size={14} color={colors.ink} />
            <Text style={styles.addButtonText}>Plan a chapter</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  intro: { fontFamily: fonts.sans, fontSize: 13, color: colors.slate, lineHeight: 19 },
  sectionLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: colors.slate,
    marginTop: 6,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
  },
  cardTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  cardBody: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, lineHeight: 18, marginTop: 3 },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: "rgba(16,25,43,0.18)",
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 16,
  },
  addButtonText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink },
});
