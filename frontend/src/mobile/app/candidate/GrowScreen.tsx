import { View, ScrollView, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Compass, TrendingUp, MessageCircleHeart, BookHeart, ArrowRight } from "lucide-react-native";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { GrowStackParamList } from "../../navigation/GrowStack";

type Props = NativeStackScreenProps<GrowStackParamList, "GrowMain">;

// Four different kinds of tools — a benchmark, a coach, a navigator, a planner — each
// gets its own card shape and a live preview of what's inside, instead of four identical
// settings-menu rows. Preview numbers are illustrative (full PreviewBanner on detail screens).
export default function GrowScreen({ navigation }: Props) {
  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View>
            <Text style={styles.heading}>Grow</Text>
            <Text style={styles.previewHint}>Preview data — connects to your live profile soon</Text>
          </View>

          {/* Salary Truth Engine — the benchmark number IS the content, show it large */}
          <Pressable onPress={() => navigation.navigate("SalaryTruth")}>
            <GlassCard radius={20}>
              <View style={styles.salaryCard}>
                <View style={styles.cardHeaderRow}>
                  <TrendingUp size={16} color={colors.slate} />
                  <Text style={styles.cardEyebrow}>Salary Truth Engine</Text>
                  <ArrowRight size={15} color={colors.slate} />
                </View>
                <Text style={styles.salaryRange}>RM 5,200 – 6,800</Text>
                <Text style={styles.salaryCaption}>per month, benchmarked on verified skill level — not job-board claims</Text>
              </View>
            </GlassCard>
          </Pressable>

          {/* AI Career Coach — the nudge IS the content, quote it in a speech bubble */}
          <Pressable onPress={() => navigation.navigate("CareerCoach")}>
            <GlassCard radius={20}>
              <View style={styles.coachCard}>
                <View style={styles.cardHeaderRow}>
                  <MessageCircleHeart size={16} color={colors.slate} />
                  <Text style={styles.cardEyebrow}>AI Career Coach</Text>
                  <ArrowRight size={15} color={colors.slate} />
                </View>
                <View style={styles.speechBubble}>
                  <Text style={styles.speechText}>
                    {"\"You're 12% below market for your verified skills — want to talk timing?\""}
                  </Text>
                </View>
              </View>
            </GlassCard>
          </Pressable>

          {/* Navigator + Life Chapter — two smaller tools side by side */}
          <View style={styles.halfRow}>
            <Pressable style={styles.half} onPress={() => navigation.navigate("CareerPath")}>
              <GlassCard radius={20}>
                <View style={styles.halfCard}>
                  <Compass size={18} color={colors.ink} />
                  <Text style={styles.halfStat}>3 paths</Text>
                  <Text style={styles.halfCaption}>realistic next moves ready</Text>
                  <View style={styles.halfArrow}>
                    <ArrowRight size={14} color={colors.ink} />
                  </View>
                </View>
              </GlassCard>
            </Pressable>
            <Pressable style={styles.half} onPress={() => navigation.navigate("LifeChapter")}>
              <GlassCard radius={20}>
                <View style={styles.halfCard}>
                  <BookHeart size={18} color={colors.ink} />
                  <Text style={styles.halfTitle}>Life Chapter Designer</Text>
                  <Text style={styles.halfCaption}>Plan your first chapter</Text>
                  <View style={styles.halfArrow}>
                    <ArrowRight size={14} color={colors.ink} />
                  </View>
                </View>
              </GlassCard>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 110, gap: 14 },
  heading: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.ink, marginTop: 4 },
  previewHint: { fontFamily: fonts.mono, fontSize: 10, color: colors.slate, marginTop: 4, letterSpacing: 0.5 },

  cardHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardEyebrow: {
    flex: 1,
    fontFamily: fonts.mono,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: colors.slate,
  },

  salaryCard: { padding: 18, gap: 8 },
  salaryRange: { fontFamily: fonts.displayBold, fontSize: 30, color: colors.ink },
  salaryCaption: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, lineHeight: 17 },

  coachCard: { padding: 18, gap: 12 },
  speechBubble: {
    backgroundColor: "rgba(16,25,43,0.05)",
    borderRadius: 14,
    borderBottomLeftRadius: 4,
    padding: 14,
  },
  speechText: { fontFamily: fonts.display, fontSize: 14, color: colors.ink, lineHeight: 21 },

  halfRow: { flexDirection: "row", gap: 14, alignItems: "stretch" },
  half: { flex: 1 },
  // Fixed height so both tiles match exactly regardless of their (different) text lengths.
  halfCard: { padding: 16, gap: 6, height: 156 },
  halfStat: { fontFamily: fonts.displayBold, fontSize: 24, color: colors.ink, marginTop: 4 },
  halfTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink, marginTop: 4 },
  halfCaption: { fontFamily: fonts.sans, fontSize: 11, color: colors.slate, lineHeight: 15 },
  halfArrow: {
    marginTop: "auto",
    alignSelf: "flex-end",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(16,25,43,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
});
