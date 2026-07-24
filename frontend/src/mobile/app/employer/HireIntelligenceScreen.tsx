import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Rect, Line, Text as SvgText, G } from "react-native-svg";
import { TrendingUp, ChevronRight } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import ScoreRing from "../../components/shared/ScoreRing";
import { hireIntelligence, type HireRecord, type DiscoverCandidate } from "../../data/employerData";
import { mockCandidates } from "../../data/mockData";
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
    trajectory: `Hired ${hire.hiredOn} · ${hire.reviewScore}/100 on 90-day review`,
  };
}

// Grouped bar chart, hand-rolled on react-native-svg (no charting lib in this stack).
// Fixed layout math rather than a measured container — the screen has one consumer and a
// fixed set of quarters, so this stays simple instead of general.
const CHART_HEIGHT = 160;
const BAR_WIDTH = 12;
const BAR_GAP = 6; // between the two bars in a group
const GROUP_GAP = 28; // between quarters
const MAX_VALUE = 100;

function PerformanceChart({ data }: { data: typeof hireIntelligence.performanceByQuarter }) {
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
  const { verifiedShareThisQuarter, totalHiredThisQuarter, performanceByQuarter, recentHires } = hireIntelligence;

  // Derived from the same series the chart renders, not a separately maintained constant —
  // the headline number can never drift from the chart directly beneath it.
  const latestQuarter = performanceByQuarter[performanceByQuarter.length - 1];
  const upliftPercent = Math.round(
    ((latestQuarter.verifiedAvg - latestQuarter.keywordAvg) / latestQuarter.keywordAvg) * 100
  );
  const firstQuarter = performanceByQuarter[0];

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
                {totalHiredThisQuarter} hires · {firstQuarter.quarter}–{latestQuarter.quarter}
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

          {/* This quarter's sourcing mix */}
          <Text style={styles.sectionLabel}>This Quarter</Text>
          <GlassCard radius={18}>
            <View style={styles.sourcingCard}>
              <ScoreRing score={verifiedShareThisQuarter} size="md" />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.sourcingHeadline}>{totalHiredThisQuarter} hires this quarter</Text>
                <Text style={styles.sourcingBody}>
                  {verifiedShareThisQuarter}% were sourced through verified profiles rather than keyword search —
                  and they're the ones driving the uplift above.
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* Recent verified hires */}
          <Text style={styles.sectionLabel}>Recent Verified Hires</Text>
          <View style={{ gap: 10 }}>
            {recentHires.map((h) => (
              <Pressable
                key={h.id}
                onPress={() => openCandidate(h)}
                accessibilityRole="button"
                accessibilityLabel={`${h.name}, ${h.role}, hired ${h.hiredOn}, 90-day review score ${h.reviewScore}. View profile.`}
              >
                <GlassCard radius={16}>
                  <View style={styles.hireRow}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{h.name.split(" ").map((n) => n[0]).join("")}</Text>
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.hireName}>{h.name}</Text>
                      <Text style={styles.hireMeta}>{h.role} · Hired {h.hiredOn}</Text>
                    </View>
                    <View style={styles.hireScores}>
                      <Text style={styles.hireScoreValue}>{h.reviewScore}</Text>
                      <Text style={styles.hireScoreLabel}>90-day score</Text>
                    </View>
                    <ChevronRight size={16} color={colors.slate} />
                  </View>
                </GlassCard>
              </Pressable>
            ))}
          </View>
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
});
