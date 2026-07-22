import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { STAGE_META } from "../../data/employerData";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { PipelineStackParamList } from "../../navigation/PipelineStack";

type Props = NativeStackScreenProps<PipelineStackParamList, "SimuHireReport">;

const DIMENSION_KEYS = ["adaptability", "communication", "problemSolving", "stressResponse", "systemsThinking"] as const;

const DIMENSION_LABELS: Record<string, string> = {
  adaptability: "Adaptability",
  communication: "Communication",
  problemSolving: "Problem Solving",
  stressResponse: "Stress Response",
  systemsThinking: "Systems Thinking",
};

export default function SimuHireReportScreen({ route }: Props) {
  const { entry } = route.params;
  const stage = STAGE_META[entry.stage];
  const initials = entry.name.split(" ").map((n) => n[0]).join("");

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Header card */}
          <GlassCard radius={22}>
            <View style={styles.headerBlock}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <Text style={styles.name}>{entry.name}</Text>
              <Text style={styles.fieldMeta}>{entry.field} · <Text style={styles.trustMono}>Trust {entry.trustScore}</Text></Text>
              <View style={[styles.stagePill, { borderColor: stage.color }]}>
                <Text style={[styles.stageText, { color: stage.color }]}>{stage.label}</Text>
              </View>
            </View>
          </GlassCard>

          {/* Score block */}
          <GlassCard radius={22}>
            <View style={styles.scoreBlock}>
              <Text style={styles.scoreLabel}>OVERALL SCORE</Text>
              <Text style={styles.scoreBig}>{entry.simuHire?.overallScore ?? "—"}</Text>
              {entry.simuHire?.type ? (
                <View style={styles.typePill}>
                  <Text style={styles.typeText}>{entry.simuHire.type}</Text>
                </View>
              ) : null}
            </View>
          </GlassCard>

          {/* Behavioral dimensions */}
          {entry.simuHire?.dimensions ? (
            <GlassCard radius={22}>
              <View style={styles.dimensionsBlock}>
                <Text style={styles.sectionLabel}>BEHAVIORAL DIMENSIONS</Text>
                <View style={styles.dimensionsList}>
                  {DIMENSION_KEYS.map((key) => {
                    const score = entry.simuHire!.dimensions[key] ?? 0;
                    return (
                      <View key={key} style={styles.dimensionRow}>
                        <Text style={styles.dimensionLabel}>{DIMENSION_LABELS[key]}</Text>
                        <View style={styles.barTrack}>
                          <View style={[styles.barFill, { width: `${score}%` }]} />
                        </View>
                        <Text style={styles.dimensionScore}>{score}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </GlassCard>
          ) : null}

          {/* Note */}
          <Text style={styles.note}>
            Behavioral evidence from a 30-min AI simulation — not self-reported.
          </Text>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40, gap: 14 },

  // Header card
  headerBlock: { padding: 20, alignItems: "center", gap: 8 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(16,25,43,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.ink },
  name: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.ink, textAlign: "center" },
  fieldMeta: { fontFamily: fonts.sans, fontSize: 13, color: colors.slate },
  trustMono: { fontFamily: fonts.mono, fontSize: 12, color: colors.slate },
  stagePill: { borderWidth: 1, borderRadius: 100, paddingVertical: 4, paddingHorizontal: 12 },
  stageText: { fontFamily: fonts.mono, fontSize: 11 },

  // Score block
  scoreBlock: { padding: 24, alignItems: "center", gap: 10 },
  scoreLabel: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate, letterSpacing: 0.5 },
  scoreBig: { fontFamily: fonts.displayBold, fontSize: 48, color: colors.ink, lineHeight: 56 },
  typePill: {
    backgroundColor: "rgba(31,122,92,0.1)",
    borderRadius: 100,
    paddingVertical: 4,
    paddingHorizontal: 14,
  },
  typeText: { fontFamily: fonts.mono, fontSize: 12, color: colors.verified },

  // Dimensions
  dimensionsBlock: { padding: 18, gap: 14 },
  sectionLabel: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate, letterSpacing: 0.5 },
  dimensionsList: { gap: 12 },
  dimensionRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dimensionLabel: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink, width: 120 },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(16,25,43,0.08)",
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: { height: 6, backgroundColor: colors.verified, borderRadius: 3 },
  dimensionScore: { fontFamily: fonts.mono, fontSize: 12, color: colors.slate, width: 28, textAlign: "right" },

  // Note
  note: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, textAlign: "center", lineHeight: 17, paddingHorizontal: 20 },
});
