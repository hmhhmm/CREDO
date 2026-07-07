import { useCallback, useEffect, useState } from "react";
import { ScrollView, View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Award, FileText, Check, Clock, X } from "lucide-react-native";
import GitHubIcon from "../../components/GitHubIcon";
import ScoreRing from "../../components/shared/ScoreRing";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { useAuth } from "../../context/AuthContext";
import { portfolioApi, ApiError, type PortfolioResponse, type ArtifactResponse } from "../../lib/api";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

const TYPE_ICON: Record<string, typeof GitHubIcon> = {
  github: GitHubIcon as unknown as typeof GitHubIcon,
  credential: Award as unknown as typeof GitHubIcon,
  document: FileText as unknown as typeof GitHubIcon,
};

const STATUS_CONFIG = {
  verified: { label: "Verified", Icon: Check, color: colors.verified },
  pending: { label: "Pending", Icon: Clock, color: colors.pending },
  failed: { label: "Unverified", Icon: X, color: colors.alert },
} as const;

function ArtifactRow({ artifact }: { artifact: ArtifactResponse }) {
  const Icon = TYPE_ICON[artifact.artifact_type] ?? FileText;
  const status = STATUS_CONFIG[artifact.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
  const StatusIcon = status.Icon;

  return (
    <GlassCard radius={14}>
      <View style={styles.artifactRow}>
        <View style={styles.artifactIconWrap}>
          <Icon size={16} color={colors.ink} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.artifactName} numberOfLines={1}>
            {artifact.artifact_name}
          </Text>
          <Text style={styles.artifactMeta}>
            {artifact.artifact_type} · {new Date(artifact.created_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={[styles.statusPill, { borderColor: status.color }]}>
          <StatusIcon size={10} color={status.color} strokeWidth={3} />
          <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>
    </GlassCard>
  );
}

export default function PortfolioScreen() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setPortfolio(await portfolioApi.me());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator color={colors.ink} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : portfolio ? (
            <>
              <GlassCard radius={22}>
                <View style={styles.headerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{portfolio.name}</Text>
                    {portfolio.university && <Text style={styles.sub}>{portfolio.university}</Text>}
                    {portfolio.field_of_study && <Text style={styles.sub}>{portfolio.field_of_study}</Text>}
                  </View>
                  <ScoreRing score={Math.round(portfolio.trust_score)} size="sm" />
                </View>
              </GlassCard>

              <Text style={styles.sectionLabel}>Verified Artifacts ({portfolio.verified_artifacts.length})</Text>
              {portfolio.verified_artifacts.length === 0 ? (
                <Text style={styles.empty}>No artifacts submitted yet.</Text>
              ) : (
                <View style={{ gap: 10 }}>
                  {portfolio.verified_artifacts.map((a) => (
                    <ArtifactRow key={a.id} artifact={a} />
                  ))}
                </View>
              )}

              <Text style={styles.sectionLabel}>Timeline</Text>
              {portfolio.timeline.length === 0 ? (
                <Text style={styles.empty}>Nothing recorded yet.</Text>
              ) : (
                <GlassCard radius={16}>
                  <View style={styles.timelineList}>
                    {portfolio.timeline.map((node, i) => (
                      <View key={node.artifact_id} style={[styles.timelineRow, i > 0 && styles.timelineRowDivider]}>
                        <View style={styles.timelineDot} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.timelineName}>{node.artifact_name}</Text>
                          <Text style={styles.timelineDate}>
                            {new Date(node.verified_at ?? node.created_at).toLocaleDateString()}
                            {node.confidence != null ? ` · ${Math.round(node.confidence)}/100` : ""}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </GlassCard>
              )}

              <Text style={styles.sectionLabel}>Ledger</Text>
              <GlassCard radius={16}>
                <View style={styles.ledgerSummary}>
                  <Text style={styles.ledgerText}>
                    {portfolio.ledger_summary.entry_count} entr{portfolio.ledger_summary.entry_count === 1 ? "y" : "ies"} recorded
                  </Text>
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
  empty: { fontFamily: fonts.sans, fontSize: 13, color: colors.slate },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 20 },
  name: { fontFamily: fonts.displayBold, fontSize: 21, color: colors.ink },
  sub: { fontFamily: fonts.sans, fontSize: 13, color: colors.slate, marginTop: 2 },
  sectionLabel: { fontFamily: fonts.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: colors.slate },
  artifactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  artifactIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(16,25,43,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  artifactName: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink },
  artifactMeta: { fontFamily: fonts.mono, fontSize: 10, color: colors.slate, marginTop: 2 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 100,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  statusLabel: { fontFamily: fonts.mono, fontSize: 10 },
  timelineList: { padding: 16 },
  timelineRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 10 },
  timelineRowDivider: { borderTopWidth: 1, borderTopColor: "rgba(16,25,43,0.08)" },
  timelineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.pending, marginTop: 6 },
  timelineName: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink },
  timelineDate: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate, marginTop: 1 },
  ledgerSummary: { padding: 16 },
  ledgerText: { fontFamily: fonts.mono, fontSize: 12, color: colors.ink },
});
