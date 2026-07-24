import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AlertTriangle, TrendingDown, Activity, ChevronRight, Settings, GraduationCap } from "lucide-react-native";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import ScoreRing from "../../components/shared/ScoreRing";
import Avatar from "../../components/shared/Avatar";
import {
  getCampusReadiness,
  getBehavioralBenchmark,
  getSkillGaps,
  getCohorts,
  getInterventionAlert,
  type University,
} from "../../data/universityData";
import { useSkillFeedback } from "../../context/SkillFeedbackContext";
import { getConfidenceBand } from "../../utils/confidenceBand";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { UniversityHomeStackParamList } from "../../navigation/UniversityHomeStack";

type Props = {
  university: University;
  onOpenSettings: () => void;
  navigation: NativeStackScreenProps<UniversityHomeStackParamList, "PulseMain">["navigation"];
};

export default function PulseScreen({ university, onOpenSettings, navigation }: Props) {
  const campusReadiness = getCampusReadiness(university);
  const behavioralBenchmark = getBehavioralBenchmark(university);
  const skillGaps = getSkillGaps(university);
  const interventionAlert = getInterventionAlert(getCohorts(university), skillGaps);
  const { feedbackFor } = useSkillFeedback();
  const employerFeedback = feedbackFor(university.name);

  // Teaser lines only — the full lists live in their own hub screens now, reached by
  // tapping through. Pulse's job is "is everything OK at a glance," not hosting two
  // entire features inline.
  const worstGap = skillGaps[0] ?? null;
  const sortedBenchmark = [...behavioralBenchmark].sort((a, b) => b.score - a.score);
  const strongest = sortedBenchmark[0] ?? null;
  const weakest = sortedBenchmark[sortedBenchmark.length - 1] ?? null;
  const readinessBand = getConfidenceBand(campusReadiness.score);

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow} numberOfLines={1}>{university.name} · {university.office}</Text>
              <Text style={styles.heading}>Campus Pulse</Text>
            </View>
            <Pressable onPress={onOpenSettings}>
              <Avatar initial={university.short} fontSize={11} />
            </Pressable>
          </View>

          {/* U1 — Cohort Readiness hero */}
          <GlassCard radius={28}>
            <View style={styles.heroRow}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.heroLabel}>Cohort Readiness Score</Text>
                <Text style={[styles.heroTrend, { color: readinessBand.hex }]}>{readinessBand.label}</Text>
                <Text style={styles.heroCaption}>Averaged across {campusReadiness.cohortSize.toLocaleString()} students in this cohort</Text>
              </View>
              <ScoreRing score={campusReadiness.score} size="lg" />
            </View>
          </GlassCard>

          {/* U3 — Early Intervention Alert (only renders when a cohort crosses the threshold) */}
          {interventionAlert && (
            <View style={styles.alert}>
              <View style={styles.alertHead}>
                <AlertTriangle size={16} color={colors.alert} />
                <Text style={styles.alertTag}>Early Intervention Alert</Text>
              </View>
              <Text style={styles.alertCohort}>{interventionAlert.cohort}</Text>
              <Text style={styles.alertBody}>{interventionAlert.message}</Text>
            </View>
          )}

          {/* U4 teaser — full Behavioral Benchmark lives in its own hub */}
          <Pressable onPress={() => navigation.navigate("BenchmarkHub")}>
            <GlassCard radius={18}>
              <View style={styles.teaserCard}>
                <View style={styles.teaserIcon}>
                  <Activity size={16} color={colors.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.teaserTitle}>Behavioral Benchmark</Text>
                  {strongest && weakest && (
                    <Text style={styles.teaserBody}>
                      {strongest.name} leads at {strongest.score} · {weakest.name} lags at {weakest.score}
                    </Text>
                  )}
                </View>
                <ChevronRight size={16} color={colors.slate} />
              </View>
            </GlassCard>
          </Pressable>

          {/* U2 teaser — full Curriculum Gap Detector lives in its own hub */}
          <Pressable onPress={() => navigation.navigate("CurriculumGapHub")}>
            <GlassCard radius={18}>
              <View style={styles.teaserCard}>
                <View style={styles.teaserIcon}>
                  <TrendingDown size={16} color={colors.alert} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.teaserTitle}>Curriculum Gap Detector</Text>
                  <Text style={styles.teaserBody}>
                    {skillGaps.length} skill{skillGaps.length === 1 ? "" : "s"} failing verification
                    {worstGap ? ` · worst: ${worstGap.skill} at ${worstGap.verifyRate}%` : ""}
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.slate} />
              </View>
            </GlassCard>
          </Pressable>

          {/* E9 Bridge C — skill gaps employers flagged for specific students, closing the
              loop from an individual hire back to the curriculum, separate from the
              auto-detected Curriculum Gap Detector above. */}
          {employerFeedback.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Employer Feedback</Text>
              <View style={{ gap: 12 }}>
                {employerFeedback.map((f) => (
                  <GlassCard key={f.id} radius={18}>
                    <View style={styles.gapCard}>
                      <View style={styles.gapHead}>
                        <GraduationCap size={15} color={colors.gold} />
                        <Text style={styles.gapSkill}>{f.skill}</Text>
                        <Text style={styles.feedbackDate}>{f.date}</Text>
                      </View>
                      <Text style={styles.feedbackBody}>{f.note}</Text>
                      <Text style={styles.feedbackMeta}>{f.candidateName} · {f.employerName}</Text>
                    </View>
                  </GlassCard>
                ))}
              </View>
            </>
          )}

          <Pressable onPress={onOpenSettings} style={styles.settingsLink}>
            <Settings size={13} color={colors.slate} />
            <Text style={styles.settingsText}>Settings</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 110, gap: 16 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  eyebrow: { fontFamily: fonts.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: colors.slate },
  heading: { fontFamily: fonts.displayBold, fontSize: 28, color: colors.ink, marginTop: 2 },
  settingsLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 2 },
  settingsText: { fontFamily: fonts.mono, fontSize: 12, color: colors.slate },

  heroRow: { flexDirection: "row", alignItems: "center", gap: 16, padding: 22 },
  heroLabel: { fontFamily: fonts.mono, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: colors.slate },
  heroTrend: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.verified, marginTop: 2 },
  heroCaption: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, marginTop: 4, lineHeight: 17 },

  alert: { backgroundColor: "rgba(196,80,58,0.08)", borderWidth: 1, borderColor: "rgba(196,80,58,0.3)", borderRadius: 18, padding: 16, gap: 6 },
  alertHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  alertTag: { fontFamily: fonts.mono, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: colors.alert },
  alertCohort: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  alertBody: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.slate, lineHeight: 18 },

  sectionLabel: { fontFamily: fonts.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: colors.slate },

  teaserCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  teaserIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: "rgba(16,25,43,0.06)", alignItems: "center", justifyContent: "center" },
  teaserTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  teaserBody: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, marginTop: 2, lineHeight: 16 },

  // Reused by the Employer Feedback section below (E9 Bridge C) — not a full skill-gap
  // list anymore, that moved to CurriculumGapScreen.
  gapCard: { padding: 16, gap: 7 },
  gapHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  gapSkill: { flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  feedbackDate: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate },
  feedbackBody: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.ink, lineHeight: 18 },
  feedbackMeta: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate },
});
