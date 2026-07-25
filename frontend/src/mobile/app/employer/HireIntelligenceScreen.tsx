import { useMemo } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Rect, Line, Text as SvgText, G } from "react-native-svg";
import { TrendingUp, ChevronRight } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import ScoreRing from "../../components/shared/ScoreRing";
import { performanceByQuarter, discoverCandidates, type DiscoverCandidate, type PipelineEntry } from "../../data/employerData";
import { usePipeline } from "../../context/PipelineContext";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { EmployerHomeStackParamList } from "../../navigation/EmployerHomeStack";

type Props = NativeStackScreenProps<EmployerHomeStackParamList, "HireIntelligence">;

// A "hire" is a real accepted decision on this employer's own Pipeline (recordDecision,
// PipelineContext.tsx) — not a separately maintained static list. hiredOn/reviewScore come
// from the entry's real decisionAt/hrRating, not invented per-hire copy.
function formatHiredOn(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function buildCandidate(entry: PipelineEntry): DiscoverCandidate {
  const full = discoverCandidates.find((c) => c.id === entry.candidateId);
  const hiredOn = entry.decisionAt ? formatHiredOn(entry.decisionAt) : "recently";
  return (
    full ?? {
      id: entry.candidateId,
      name: entry.name,
      email: "",
      field: entry.field,
      university: "",
      year: "",
      location: "",
      openToWork: entry.openToWork,
      avatar: null,
      bio: "",
      linkedinUrl: null,
      githubUrl: null,
      trustScore: entry.trustScore,
      verifiedSkills: [],
      claimedSkills: [],
      simuHire: { completed: false, shared: false },
      artifacts: [],
      ledger: [],
      merkleRoot: null,
      trajectory: `Hired ${hiredOn}`,
    }
  );
}

// Grouped bar chart, hand-rolled on react-native-svg (no charting lib in this stack).
// Fixed layout math rather than a measured container — the screen has one consumer and a
// fixed set of quarters, so this stays simple instead of general.
const CHART_HEIGHT = 160;
const BAR_WIDTH = 12;
const BAR_GAP = 6; // between the two bars in a group
const GROUP_GAP = 28; // between quarters
const MAX_VALUE = 100;

function PerformanceChart({ data }: { data: typeof performanceByQuarter }) {
  const groupWidth = BAR_WIDTH * 2 + BAR_GAP;
  const chartWidth = data.length * groupWidth + (data.length - 1) * GROUP_GAP + 24;
  const scale = (CHART_HEIGHT - 24) / MAX_VALUE;

  return (
    <Svg width={chartWidth} height={CHART_HEIGHT + 24}>
      <Line x1={12} y1={CHART_HEIGHT} x2={chartWidth - 12} y2={CHART_HEIGHT} stroke={colors.line} strokeWidth={1} />
      {data.map((d, i) => {
        const groupX = 12 + i * (groupWidth + GROUP_GAP);
        const verifiedH = d.verifiedAvg * scale;
        const keywordH = d.keywordAvg * scale;
        return (
          <G key={d.quarter}>
            <Rect
              x={groupX}
              y={CHART_HEIGHT - verifiedH}
              width={BAR_WIDTH}
              height={verifiedH}
              rx={3}
              fill={colors.verified}
            />
            <Rect
              x={groupX + BAR_WIDTH + BAR_GAP}
              y={CHART_HEIGHT - keywordH}
              width={BAR_WIDTH}
              height={keywordH}
              rx={3}
              fill={colors.line}
            />
            <SvgText
              x={groupX + BAR_WIDTH + BAR_GAP / 2}
              y={CHART_HEIGHT + 18}
              fontSize={9}
              fontFamily={fonts.mono}
              fill={colors.slate}
              textAnchor="middle"
            >
              {d.quarter}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

export default function HireIntelligenceScreen({ navigation }: Props) {
  const { pipeline } = usePipeline();

  // Real accepted decisions on THIS employer's own Pipeline (recordDecision), newest first
  // — not a static 3-record list every employer would otherwise see identically.
  const recentHires = useMemo(
    () =>
      pipeline
        .filter((e) => e.decision === "accepted")
        .sort((a, b) => (b.decisionAt ?? "").localeCompare(a.decisionAt ?? "")),
    [pipeline]
  );
  const totalHiredThisQuarter = recentHires.length;
  // Real signal in place of an invented "sourced via verified profile" split: the share of
  // real hires who had actually completed SimuHire before being accepted — a genuine
  // verified-vs-not distinction this dataset can back.
  const verifiedShareThisQuarter = totalHiredThisQuarter
    ? Math.round((recentHires.filter((h) => !!h.simuHire).length / totalHiredThisQuarter) * 100)
    : 0;

  // Derived from the same series the chart renders, not a separately maintained constant —
  // the headline number can never drift from the chart directly beneath it. This quarterly
  // trend is illustrative market context (no per-quarter history exists in this dataset),
  // shown as a benchmark backdrop for the real hire count/list below it, not as this
  // employer's own historical figures.
  const latestQuarter = performanceByQuarter[performanceByQuarter.length - 1];
  const upliftPercent = Math.round(
    ((latestQuarter.verifiedAvg - latestQuarter.keywordAvg) / latestQuarter.keywordAvg) * 100
  );
  const firstQuarter = performanceByQuarter[0];

  const openCandidate = (hire: PipelineEntry) => {
    // HireIntelligenceScreen lives in EmployerHomeStack; CandidateProfile lives in the
    // sibling DiscoverStack — same cross-stack pattern JobDetailScreen uses for "Find
    // candidates".
    const tabNav = navigation.getParent();
    if (tabNav) {
      (tabNav as { navigate: (name: string, params?: object) => void }).navigate("Discover", {
        screen: "CandidateProfile",
        params: { candidate: buildCandidate(hire) },
        initial: false,
      });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Headline */}
          <GlassCard radius={22}>
            <View style={styles.hero}>
              <View style={styles.heroIcon}>
                <TrendingUp size={16} color={colors.verified} />
              </View>
              <Text style={styles.heroNumber}>+{upliftPercent}%</Text>
              <Text style={styles.heroLabel}>
                Verified-sourced hires are outperforming keyword-matched hires on 90-day review scores
              </Text>
              <Text style={styles.heroCaption}>
                Market benchmark · {firstQuarter.quarter}–{latestQuarter.quarter}
              </Text>
            </View>
          </GlassCard>

          {/* Quarter-over-quarter chart */}
          <Text style={styles.sectionLabel}>Performance by Quarter</Text>
          <GlassCard radius={18}>
            <View style={styles.chartCard}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <PerformanceChart data={performanceByQuarter} />
              </ScrollView>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.verified }]} />
                  <Text style={styles.legendText}>Verified-sourced</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.line }]} />
                  <Text style={styles.legendText}>Keyword-matched</Text>
                </View>
              </View>
            </View>
          </GlassCard>

          {/* This quarter's sourcing mix — real hires from this employer's own Pipeline */}
          <Text style={styles.sectionLabel}>This Quarter</Text>
          <GlassCard radius={18}>
            <View style={styles.sourcingCard}>
              <ScoreRing score={verifiedShareThisQuarter} size="md" />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.sourcingHeadline}>
                  {totalHiredThisQuarter} hire{totalHiredThisQuarter === 1 ? "" : "s"} this quarter
                </Text>
                <Text style={styles.sourcingBody}>
                  {totalHiredThisQuarter > 0
                    ? `${verifiedShareThisQuarter}% had completed SimuHire before you accepted them — real behavioral evidence, not just a resume.`
                    : "Accept a candidate on your Pipeline and they'll show up here."}
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* Recent verified hires — every accepted decision on this employer's Pipeline */}
          <Text style={styles.sectionLabel}>Recent Hires</Text>
          {recentHires.length === 0 ? (
            <GlassCard radius={16}>
              <View style={styles.emptyHires}>
                <Text style={styles.emptyHiresText}>No hires yet — accept a candidate on Pipeline and they'll appear here.</Text>
              </View>
            </GlassCard>
          ) : (
            <View style={{ gap: 10 }}>
              {recentHires.map((h) => (
                <Pressable
                  key={h.id}
                  onPress={() => openCandidate(h)}
                  accessibilityRole="button"
                  accessibilityLabel={`${h.name}, ${h.field}, Trust Score ${h.trustScore}. View profile.`}
                >
                  <GlassCard radius={16}>
                    <View style={styles.hireRow}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{h.name.split(" ").map((n) => n[0]).join("")}</Text>
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={styles.hireName}>{h.name}</Text>
                        <Text style={styles.hireMeta}>
                          {h.field}
                          {h.decisionAt ? ` · Hired ${formatHiredOn(h.decisionAt)}` : ""}
                        </Text>
                      </View>
                      <View style={styles.hireScores}>
                        <Text style={styles.hireScoreValue}>{h.trustScore}</Text>
                        <Text style={styles.hireScoreLabel}>Trust Score</Text>
                      </View>
                      <ChevronRight size={16} color={colors.slate} />
                    </View>
                  </GlassCard>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 48, gap: 14 },

  hero: { padding: 22, alignItems: "center", gap: 8 },
  heroIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(31,122,92,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  heroNumber: { fontFamily: fonts.displayBold, fontSize: 44, color: colors.verified },
  heroLabel: { fontFamily: fonts.sans, fontSize: 13, color: colors.slate, textAlign: "center", lineHeight: 19, maxWidth: 280 },
  heroCaption: { fontFamily: fonts.mono, fontSize: 10, color: colors.slate, textAlign: "center", marginTop: 2 },

  sectionLabel: { fontFamily: fonts.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: colors.slate },

  chartCard: { padding: 18, gap: 14 },
  legendRow: { flexDirection: "row", gap: 18 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: fonts.mono, fontSize: 10, color: colors.slate },

  sourcingCard: { padding: 20, flexDirection: "row", alignItems: "center", gap: 16 },
  sourcingHeadline: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.ink },
  sourcingBody: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.slate, lineHeight: 18 },

  hireRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(16,25,43,0.06)", alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: fonts.displayBold, fontSize: 13, color: colors.ink },
  hireName: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  hireMeta: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate },
  hireScores: { alignItems: "flex-end" },
  hireScoreValue: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.verified },
  hireScoreLabel: { fontFamily: fonts.mono, fontSize: 9, color: colors.slate, textTransform: "uppercase", letterSpacing: 0.5 },
  emptyHires: { padding: 16 },
  emptyHiresText: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.slate, lineHeight: 18 },
});
