import { useMemo } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Rect, Line, Text as SvgText, G } from "react-native-svg";
import { TrendingUp, ChevronRight } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import ScoreRing from "../../components/shared/ScoreRing";
import {
  hiresFromPipeline,
  hiresThisQuarter,
  verifiedShareOf,
  trustByQuarter,
  formatMonthYear,
  type HireRecord,
  type QuarterTrust,
  type DiscoverCandidate,
} from "../../data/employerData";
import { mockCandidates } from "../../data/mockData";
import { usePipeline } from "../../context/PipelineContext";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { EmployerHomeStackParamList } from "../../navigation/EmployerHomeStack";

type Props = NativeStackScreenProps<EmployerHomeStackParamList, "HireIntelligence">;

function buildCandidate(hire: HireRecord): DiscoverCandidate {
  const full = mockCandidates.find((c) => c.id === hire.candidateId);
  return {
    ...(full ?? {
      id: hire.candidateId,
      name: hire.name,
      email: "",
      field: hire.role,
      university: "",
      year: "",
      location: "",
      openToWork: false,
      avatar: null,
      bio: "",
      linkedinUrl: null,
      githubUrl: null,
      trustScore: hire.trustScoreAtHire,
      verifiedSkills: [],
      claimedSkills: [],
      simuHire: { completed: false, shared: false },
      artifacts: [],
      ledger: [],
      merkleRoot: null,
    }),
    trajectory: `Hired ${formatMonthYear(hire.hiredOn)} · Trust ${hire.trustScoreAtHire} at time of hire`,
  };
}

// Single-series bar chart, hand-rolled on react-native-svg (no charting lib in this stack).
// Fixed layout math rather than a measured container — the screen has one consumer and a
// variable-but-small set of quarters, so this stays simple instead of general. One bar per
// quarter = that quarter's real average trust score at hire, not a fabricated comparison.
const CHART_HEIGHT = 160;
const BAR_WIDTH = 20;
const GROUP_GAP = 28; // between quarters
const MAX_VALUE = 100;

function PerformanceChart({ data }: { data: QuarterTrust[] }) {
  const chartWidth = data.length * BAR_WIDTH + (data.length - 1) * GROUP_GAP + 24;
  const scale = (CHART_HEIGHT - 24) / MAX_VALUE;

  return (
    <Svg width={chartWidth} height={CHART_HEIGHT + 24}>
      <Line x1={12} y1={CHART_HEIGHT} x2={chartWidth - 12} y2={CHART_HEIGHT} stroke={colors.line} strokeWidth={1} />
      {data.map((d, i) => {
        const barX = 12 + i * (BAR_WIDTH + GROUP_GAP);
        const barH = d.avgTrustScore * scale;
        return (
          <G key={d.quarter}>
            <Rect x={barX} y={CHART_HEIGHT - barH} width={BAR_WIDTH} height={barH} rx={4} fill={colors.verified} />
            <SvgText
              x={barX + BAR_WIDTH / 2}
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

  // Real: derived from this employer's own accepted PipelineContext entries, not a fixed
  // mock list — an "Accept" recorded on Pipeline shows up here without any extra wiring.
  const recentHires = useMemo(() => hiresFromPipeline(pipeline), [pipeline]);
  const thisQuarterHires = useMemo(() => hiresThisQuarter(recentHires), [recentHires]);
  const totalHiredThisQuarter = thisQuarterHires.length;
  const verifiedShareThisQuarter = useMemo(() => verifiedShareOf(thisQuarterHires), [thisQuarterHires]);

  // Real: quarters bucketed from actual accepted-decision dates, so both the chart and the
  // headline below read off the same series and can never drift from each other or from
  // what's actually in Pipeline.
  const quarterData = useMemo(() => trustByQuarter(recentHires), [recentHires]);
  const latestQuarter = quarterData[quarterData.length - 1];
  const firstQuarter = quarterData[0];
  const trendPercent =
    quarterData.length >= 2 && firstQuarter.avgTrustScore > 0
      ? Math.round(((latestQuarter.avgTrustScore - firstQuarter.avgTrustScore) / firstQuarter.avgTrustScore) * 100)
      : null;

  const openCandidate = (hire: HireRecord) => {
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
          {/* Headline — real trust-score-at-hire trend, not a fabricated review score */}
          <GlassCard radius={22}>
            <View style={styles.hero}>
              <View style={styles.heroIcon}>
                <TrendingUp size={16} color={colors.verified} />
              </View>
              {quarterData.length === 0 ? (
                <>
                  <Text style={styles.heroLabel}>No hires recorded yet</Text>
                  <Text style={styles.heroCaption}>Accepting a candidate on Pipeline starts this dashboard.</Text>
                </>
              ) : trendPercent !== null ? (
                <>
                  <Text style={styles.heroNumber}>
                    {trendPercent >= 0 ? "+" : ""}
                    {trendPercent}%
                  </Text>
                  <Text style={styles.heroLabel}>Average trust score at hire, {firstQuarter.quarter} to {latestQuarter.quarter}</Text>
                  <Text style={styles.heroCaption}>
                    {recentHires.length} hire{recentHires.length === 1 ? "" : "s"} · {firstQuarter.quarter}–{latestQuarter.quarter}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.heroNumber}>{latestQuarter.avgTrustScore}</Text>
                  <Text style={styles.heroLabel}>Average trust score at hire this quarter</Text>
                  <Text style={styles.heroCaption}>
                    {latestQuarter.hireCount} hire{latestQuarter.hireCount === 1 ? "" : "s"} · {latestQuarter.quarter}
                  </Text>
                </>
              )}
            </View>
          </GlassCard>

          {/* Quarter-over-quarter chart — real average trust score at hire per quarter */}
          {quarterData.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Trust Score by Quarter</Text>
              <GlassCard radius={18}>
                <View style={styles.chartCard}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <PerformanceChart data={quarterData} />
                  </ScrollView>
                  <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: colors.verified }]} />
                      <Text style={styles.legendText}>Average trust score at hire</Text>
                    </View>
                  </View>
                </View>
              </GlassCard>
            </>
          )}

          {/* This quarter's sourcing mix */}
          <Text style={styles.sectionLabel}>This Quarter</Text>
          <GlassCard radius={18}>
            <View style={styles.sourcingCard}>
              <ScoreRing score={verifiedShareThisQuarter} size="md" />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.sourcingHeadline}>{totalHiredThisQuarter} hires this quarter</Text>
                <Text style={styles.sourcingBody}>
                  {verifiedShareThisQuarter}% of this quarter's hires had a trust score of 80+ ("Highly Authentic")
                  at the time they were hired.
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* Recent verified hires — real accepted-decision entries from this employer's own
              Pipeline, most recent first. */}
          <Text style={styles.sectionLabel}>Recent Verified Hires</Text>
          {recentHires.length === 0 ? (
            <GlassCard radius={16}>
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No hires recorded yet — accepting a candidate on Pipeline will show up here.</Text>
              </View>
            </GlassCard>
          ) : (
          <View style={{ gap: 10 }}>
            {recentHires.map((h) => (
              <Pressable
                key={h.id}
                onPress={() => openCandidate(h)}
                accessibilityRole="button"
                accessibilityLabel={`${h.name}, ${h.role}, hired ${formatMonthYear(h.hiredOn)}, trust score ${h.trustScoreAtHire} at hire. View profile.`}
              >
                <GlassCard radius={16}>
                  <View style={styles.hireRow}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{h.name.split(" ").map((n) => n[0]).join("")}</Text>
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.hireName}>{h.name}</Text>
                      <Text style={styles.hireMeta}>{h.role} · Hired {formatMonthYear(h.hiredOn)}</Text>
                    </View>
                    <View style={styles.hireScores}>
                      <Text style={styles.hireScoreValue}>{h.trustScoreAtHire}</Text>
                      <Text style={styles.hireScoreLabel}>Trust at hire</Text>
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

  emptyCard: { padding: 20 },
  emptyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.slate, textAlign: "center", lineHeight: 19 },
});
