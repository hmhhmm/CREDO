import { View, ScrollView, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TrendingUp } from "lucide-react-native";
import PreviewBanner from "../../components/shared/PreviewBanner";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

const BENCHMARK = {
  role: "Junior ML Engineer",
  location: "Kuala Lumpur",
  verifiedRange: { low: 4200, high: 5600 },
  selfReportedMedian: 3800,
  percentile: 68,
};

export default function SalaryTruthScreen() {
  const { low, high } = BENCHMARK.verifiedRange;
  const mid = Math.round((low + high) / 2);

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
          <PreviewBanner />
          <Text style={styles.intro}>
            Benchmarked against verified skill level for {BENCHMARK.role} roles in {BENCHMARK.location} — not
            self-reported claims from job boards.
          </Text>

          <GlassCard radius={20}>
            <View style={styles.card}>
              <Text style={styles.rangeLabel}>Verified-skill salary range</Text>
              <Text style={styles.range}>
                RM{low.toLocaleString()} – RM{high.toLocaleString()}
              </Text>
              <View style={styles.track}>
                <View style={styles.trackFill} />
              </View>
              <Text style={styles.midLabel}>Typical: RM{mid.toLocaleString()}/mo</Text>
            </View>
          </GlassCard>

          <View style={styles.compareRow}>
            <TrendingUp size={16} color={colors.verified} />
            <Text style={styles.compareText}>
              Self-reported median for this role is RM{BENCHMARK.selfReportedMedian.toLocaleString()} — your verified
              profile places you in the {BENCHMARK.percentile}th percentile.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  intro: { fontFamily: fonts.sans, fontSize: 13, color: colors.slate, lineHeight: 19 },
  card: { padding: 18, gap: 8 },
  rangeLabel: { fontFamily: fonts.mono, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: colors.slate },
  range: { fontFamily: fonts.displayBold, fontSize: 28, color: colors.ink },
  track: { height: 6, backgroundColor: "rgba(16,25,43,0.08)", borderRadius: 3, overflow: "hidden", marginTop: 4 },
  trackFill: { height: "100%", width: "70%", backgroundColor: colors.verified, borderRadius: 3 },
  midLabel: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate },
  compareRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(31,122,92,0.25)",
    borderRadius: 16,
    backgroundColor: "rgba(240,250,246,0.85)",
    padding: 16,
  },
  compareText: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.ink, lineHeight: 19 },
});
