import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, Text, View, ActivityIndicator, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { Award, FileText } from "lucide-react-native";
import GitHubIcon from "../../components/GitHubIcon";
import ActionCard from "../../components/shared/ActionCard";
import VerifiedBadge, { type BadgeStatus } from "../../components/shared/VerifiedBadge";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { portfolioApi, verifyApi, ApiError, type ArtifactResponse } from "../../lib/api";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

type AgentKey = "github" | "credential" | "document";

const AGENTS: { key: AgentKey; label: string; subtitle: string; icon: React.ReactNode }[] = [
  { key: "github", label: "GitHub", subtitle: "Repo commits & AST analysis", icon: <GitHubIcon size={18} color={colors.slate} /> },
  { key: "credential", label: "Credential", subtitle: "Upload a certificate (PDF/DOCX)", icon: <Award size={18} color={colors.slate} /> },
  { key: "document", label: "Document", subtitle: "Upload a paper (PDF/DOCX)", icon: <FileText size={18} color={colors.slate} /> },
];

function badgeStatusFor(artifact: ArtifactResponse | undefined): BadgeStatus {
  if (!artifact) return "not_started"; // nothing triggered yet — distinct from an in-flight "Pending"
  if (artifact.status === "verified") return "verified";
  if (artifact.status === "failed") return "failed";
  return "pending";
}

export default function VerifyScreen() {
  const [artifactsByType, setArtifactsByType] = useState<Partial<Record<AgentKey, ArtifactResponse>>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<AgentKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollTimers = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const loadPortfolio = useCallback(async () => {
    try {
      const portfolio = await portfolioApi.me();
      const latest: Partial<Record<AgentKey, ArtifactResponse>> = {};
      // verified_artifacts is ordered most-recent-first per the backend query.
      for (const a of portfolio.verified_artifacts) {
        const key = a.artifact_type as AgentKey;
        if (!latest[key]) latest[key] = a;
      }
      setArtifactsByType(latest);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPortfolio();
    const timers = pollTimers;
    return () => {
      Object.values(timers.current).forEach(clearInterval);
    };
  }, [loadPortfolio]);

  const pollArtifact = useCallback((agentKey: AgentKey, artifactId: string) => {
    if (pollTimers.current[artifactId]) return;
    pollTimers.current[artifactId] = setInterval(async () => {
      try {
        const artifact = await verifyApi.getArtifact(artifactId);
        setArtifactsByType((prev) => ({ ...prev, [agentKey]: artifact }));
        if (artifact.status !== "pending") {
          clearInterval(pollTimers.current[artifactId]);
          delete pollTimers.current[artifactId];
        }
      } catch {
        clearInterval(pollTimers.current[artifactId]);
        delete pollTimers.current[artifactId];
      }
    }, 2000);
  }, []);

  const uploadFor = useCallback(
    async (agentKey: "credential" | "document") => {
      setError(null);
      const picked = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
      });
      if (picked.canceled || !picked.assets?.[0]) return;
      const asset = picked.assets[0];

      setUploading(agentKey);
      try {
        await verifyApi.consent(agentKey);
        const trigger = await (agentKey === "credential" ? verifyApi.triggerCredential : verifyApi.triggerDocument)({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType ?? "application/pdf",
          file: (asset as { file?: File }).file,
        });
        const artifact = await verifyApi.getArtifact(trigger.artifact_id);
        setArtifactsByType((prev) => ({ ...prev, [agentKey]: artifact }));
        pollArtifact(agentKey, trigger.artifact_id);
      } catch (e) {
        console.error("Verify upload failed:", e);
        Alert.alert("Upload failed", e instanceof ApiError ? e.message : "Could not reach the server.");
      } finally {
        setUploading(null);
      }
    },
    [pollArtifact]
  );

  const onPressAgent = useCallback(
    (agentKey: AgentKey) => {
      if (agentKey === "github") {
        Alert.alert(
          "GitHub not connected",
          "GitHub verification requires connecting your GitHub account via OAuth, which this build's server hasn't been configured with yet."
        );
        return;
      }
      uploadFor(agentKey);
    },
    [uploadFor]
  );

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
          <Text style={styles.heading}>Verify</Text>

          {loading ? (
            <ActivityIndicator color={colors.ink} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <>
              <View style={{ gap: 12 }}>
                {AGENTS.map(({ key, label, subtitle, icon }) => {
                  const artifact = artifactsByType[key];
                  const isUploading = uploading === key;
                  return (
                    <ActionCard
                      key={key}
                      title={label}
                      subtitle={
                        isUploading
                          ? "Uploading…"
                          : artifact
                            ? artifact.artifact_name
                            : subtitle
                      }
                      icon={icon}
                      onPress={() => !isUploading && onPressAgent(key)}
                    />
                  );
                })}
              </View>

              <Text style={styles.sectionLabel}>Status</Text>
              <GlassCard radius={16}>
                <View style={styles.statusList}>
                  {AGENTS.map(({ key, label }, i) => (
                    <View key={key} style={[styles.statusRow, i > 0 && styles.statusRowDivider]}>
                      <Text style={styles.statusLabel}>{label}</Text>
                      <VerifiedBadge status={badgeStatusFor(artifactsByType[key])} />
                    </View>
                  ))}
                </View>
              </GlassCard>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heading: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.ink, marginTop: 4, marginBottom: 2 },
  sectionLabel: { fontFamily: fonts.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: colors.slate, marginTop: 4 },
  statusList: { padding: 16, gap: 0 },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10 },
  statusRowDivider: { borderTopWidth: 1, borderTopColor: "rgba(16,25,43,0.08)" },
  statusLabel: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink },
  error: { fontFamily: fonts.mono, fontSize: 13, color: colors.alert },
});
