import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AlertTriangle, TrendingDown, ArrowRight, LogOut } from "lucide-react-native";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import ScoreRing from "../../components/shared/ScoreRing";
import { university, campusReadiness, behavioralBenchmark, skillGaps, curriculumActions, getInterventionAlert } from "../../data/universityData";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

export default function PulseScreen({ onSwitchRole }: { onSwitchRole: () => void }) {
  const interventionAlert = getInterventionAlert();

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <View>
              <Text style={styles.eyebrow}>{university.name} · {university.office}</Text>
              <Text style={styles.heading}>Campus Pulse</Text>
            </View>
            <Pressable onPress={onSwitchRole} style={styles.avatarButton}>
              <Text style={styles.avatarInitial}>{university.initial}</Text>
            </Pressable>
          </View>

          {/* U1 — Cohort Readiness hero */}
          <GlassCard radius={28}>
            <View style={styles.heroRow}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.heroLabel}>Cohort Readiness Score</Text>
                <Text style={styles.heroTrend}>{campusReadiness.trend}</Text>
                <Text style={styles.heroCaption}>Across {campusReadiness.cohortSize.toLocaleString()} students, anonymised & aggregated</Text>
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

          {/* U4 — Behavioral Benchmark */}
          <Text style={styles.sectionLabel}>Behavioral Benchmark</Text>
          <GlassCard radius={18}>
            <View style={styles.benchList}>
              {behavioralBenchmark.map((d) => (
                <View key={d.name} style={styles.benchItem}>
                  <View style={styles.benchRow}>
                    <Text style={styles.benchName}>{d.name}</Text>
                    <Text style={styles.benchScore}>{d.score}</Text>
                  </View>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${d.score}%` }]} />
                  </View>
                </View>
              ))}
            </View>
          </GlassCard>

          {/* U2 — Curriculum Gap Detector, paired with U9's closed-loop response */}
          <Text style={styles.sectionLabel}>Curriculum Gap Detector</Text>
          <View style={{ gap: 12 }}>
            {skillGaps.map((g) => {
              const response = curriculumActions.find((a) => a.skill === g.skill);
              return (
                <GlassCard key={g.skill} radius={18}>
                  <View style={styles.gapCard}>
                    <View style={styles.gapHead}>
                      <TrendingDown size={15} color={colors.alert} />
                      <Text style={styles.gapSkill}>{g.skill}</Text>
                      <Text style={styles.gapRate}>{g.verifyRate}% verify</Text>
                    </View>
                    <Text style={styles.gapTaught}>Taught in {g.taughtIn}</Text>
                    <View style={styles.track}>
                      <View style={[styles.fill, { width: `${g.verifyRate}%`, backgroundColor: colors.alert }]} />
                    </View>
                    {response && (
                      <View style={styles.actionRow}>
                        <ArrowRight size={13} color={colors.verified} />
                        <Text style={styles.actionText}>{response.action}</Text>
                      </View>
                    )}
                  </View>
                </GlassCard>
              );
            })}
          </View>

          <Pressable onPress={onSwitchRole} style={styles.switchRoleLink}>
            <LogOut size={13} color={colors.slate} />
            <Text style={styles.switchRoleText}>Switch role</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 110, gap: 16 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  eyebrow: { fontFamily: fonts.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: colors.slate },
  heading: { fontFamily: fonts.displayBold, fontSize: 28, color: colors.ink, marginTop: 2 },
  avatarButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.parchment },
  switchRoleLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 2 },
  switchRoleText: { fontFamily: fonts.mono, fontSize: 12, color: colors.slate },

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

  benchList: { padding: 16, gap: 12 },
  benchItem: { gap: 5 },
  benchRow: { flexDirection: "row", justifyContent: "space-between" },
  benchName: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink },
  benchScore: { fontFamily: fonts.mono, fontSize: 13, color: colors.ink },
  track: { height: 5, backgroundColor: "rgba(16,25,43,0.08)", borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: colors.verified, borderRadius: 3 },

  gapCard: { padding: 16, gap: 7 },
  gapHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  gapSkill: { flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  gapRate: { fontFamily: fonts.mono, fontSize: 12, color: colors.alert },
  gapTaught: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.slate },
  actionRow: { flexDirection: "row", alignItems: "flex-start", gap: 7, marginTop: 2 },
  actionText: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 11.5, color: colors.verified, lineHeight: 16 },
});
