import { useEffect, useState } from "react";
import { View, ScrollView, Text, Switch, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import ScoreRing from "../../components/shared/ScoreRing";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { simuhireApi, ApiError, type ReportResponse } from "../../lib/api";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { SimuHireStackParamList } from "../../navigation/SimuHireStack";

type Props = NativeStackScreenProps<SimuHireStackParamList, "SimuHireReport">;

export default function SimuHireReportScreen({ route }: Props) {
  const { sessionId } = route.params;
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    simuhireApi
      .getReport(sessionId)
      .then((r) => !cancelled && setReport(r))
      .catch((e) => !cancelled && setError(e instanceof ApiError ? e.message : "Could not reach the server."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const toggleShare = async (value: boolean) => {
    if (!report) return;
    setSharing(true);
    try {
      const res = await simuhireApi.share(sessionId, value);
      setReport({ ...report, candidate_shared: res.candidate_shared });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not reach the server.");
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator color={colors.ink} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : report ? (
            <>
              <GlassCard radius={22}>
                <View style={styles.scoreRow}>
                  <ScoreRing score={report.overall_score} size="lg" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.simType}>{report.simulation_type} SimuHire</Text>
                    {report.completed_at && (
                      <Text style={styles.completedAt}>{new Date(report.completed_at).toLocaleDateString()}</Text>
                    )}
                  </View>
                </View>
              </GlassCard>

              <Text style={styles.sectionLabel}>Behavioral Dimensions</Text>
              <GlassCard radius={18}>
                <View style={styles.dimensionsList}>
                  {Object.entries(report.evaluator_scores).map(([dimension, score]) => (
                    <View key={dimension} style={styles.dimensionItem}>
                      <View style={styles.dimensionRow}>
                        <Text style={styles.dimensionName}>{dimension.replace(/([A-Z])/g, " $1").trim()}</Text>
                        <Text style={styles.dimensionScore}>{score}/100</Text>
                      </View>
                      <View style={styles.track}>
                        <View style={[styles.fill, { width: `${score}%` }]} />
                      </View>
                    </View>
                  ))}
                </View>
              </GlassCard>

              <GlassCard radius={18}>
                <View style={styles.shareRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.shareTitle}>Share with employers</Text>
                    <Text style={styles.shareSubtitle}>
                      {report.candidate_shared ? "Visible on your Smart Namecard" : "Private — only you can see this report"}
                    </Text>
                  </View>
                  {sharing ? <ActivityIndicator color={colors.ink} /> : <Switch value={report.candidate_shared} onValueChange={toggleShare} />}
                </View>
              </GlassCard>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  error: { fontFamily: fonts.mono, fontSize: 13, color: colors.alert },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 16, padding: 20 },
  simType: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.ink, textTransform: "capitalize" },
  completedAt: { fontFamily: fonts.mono, fontSize: 12, color: colors.slate, marginTop: 4 },
  sectionLabel: { fontFamily: fonts.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: colors.slate },
  dimensionsList: { padding: 18, gap: 14 },
  dimensionItem: { gap: 4 },
  dimensionRow: { flexDirection: "row", justifyContent: "space-between" },
  dimensionName: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink, textTransform: "capitalize" },
  dimensionScore: { fontFamily: fonts.mono, fontSize: 13, color: colors.ink },
  track: { height: 5, backgroundColor: "rgba(16,25,43,0.08)", borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: colors.verified, borderRadius: 3 },
  shareRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 18,
  },
  shareTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  shareSubtitle: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, marginTop: 2 },
});
