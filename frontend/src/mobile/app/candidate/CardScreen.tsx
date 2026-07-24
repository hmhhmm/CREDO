import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, Share, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Clipboard from "expo-clipboard";
import { QrCode, Link2, Share2, ShieldCheck, ChevronRight, Plus, Check } from "lucide-react-native";
import SmartNamecard from "../../components/SmartNamecard";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import CardStrength from "../../components/namecard/CardStrength";
import CardAudience from "../../components/namecard/CardAudience";
import CardDistribution from "../../components/namecard/CardDistribution";
import { useDemo } from "../../context/DemoContext";
import { useAuth } from "../../context/AuthContext";
import { namecardApi, portfolioApi, ApiError, type PortfolioResponse } from "../../lib/api";
import { namecardResponseToCandidate, artifactResponsesToArtifacts } from "../../lib/adapters";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { Candidate } from "../../data/types";
import type { CardStackParamList } from "../../navigation/CardStack";
import type { ParentNav } from "../../navigation/types";

type Props = NativeStackScreenProps<CardStackParamList, "CardHome">;

function shortHash(hash: string | null) {
  if (!hash) return "—";
  return `${hash.slice(0, 8)}···${hash.slice(-4)}`;
}

export default function CardScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { liveCandidate } = useDemo();
  const [realCandidate, setRealCandidate] = useState<Candidate | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [n, p] = await Promise.all([namecardApi.get(user.id), portfolioApi.me()]);
      setPortfolio(p);
      setRealCandidate({
        ...namecardResponseToCandidate(n),
        artifacts: artifactResponsesToArtifacts(p.verified_artifacts),
        merkleRoot: p.ledger_summary.root_hash,
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // Refresh whenever the tab regains focus (e.g. after uploading in Verify) so a newly
  // verified artifact shows up without needing an app restart.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Real verified skills/trust score take priority once any exist; otherwise fall back to
  // the local DemoContext simulation so the card isn't just a flat "0/100" before a real
  // GitHub OAuth connection exists (still blocked — see VerifyScreen).
  const hasRealData = !!realCandidate && (realCandidate.verifiedSkills.length > 0 || realCandidate.trustScore > 0);
  const candidate = hasRealData
    ? realCandidate
    : { ...liveCandidate, name: realCandidate?.name ?? liveCandidate.name };

  const skills = candidate.verifiedSkills;
  const timeline = portfolio?.timeline.slice(0, 3) ?? [];
  const ledger = portfolio?.ledger_summary ?? null;
  const publicUrl = portfolio?.public_url ?? null;

  const goToVerify = () => {
    (navigation.getParent() as ParentNav)?.navigate("Verify");
  };
  const goToPortfolio = () => {
    (navigation.getParent() as ParentNav)?.navigate("Home", { screen: "Portfolio" });
  };
  const goToSimuHire = () => {
    (navigation.getParent() as ParentNav)?.navigate("Home", { screen: "SimuHire" });
  };

  const handle = (candidate.name || "you").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 16) || "you";

  const copyLink = async () => {
    if (!publicUrl) return;
    await Clipboard.setStringAsync(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    if (!publicUrl) return;
    try {
      await Share.share({ message: `My verified CREDO namecard: ${publicUrl}` });
    } catch {
      // user dismissed the share sheet — nothing to do
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.heading}>Smart Namecard</Text>

          {loading ? (
            <ActivityIndicator color={colors.ink} style={{ marginTop: 60 }} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <>
              {/* 1 — Identity */}
              <View style={styles.cardWrap}>
                <SmartNamecard candidate={candidate} onEmptyCta={goToVerify} />
              </View>

              {/* 1b — Card strength (drives the candidate back into Verify / SimuHire) */}
              <CardStrength
                candidate={candidate}
                ledgerCount={ledger?.entry_count ?? 0}
                onVerify={goToVerify}
                onSimuHire={goToSimuHire}
                onPortfolio={goToPortfolio}
              />

              {/* 2 — Verified Skills */}
              <Text style={styles.sectionLabel}>Verified Skills</Text>
              <GlassCard radius={18}>
                {skills.length > 0 ? (
                  <View style={styles.skillsList}>
                    {skills.map((s, i) => (
                      <View key={s.name} style={[styles.skillItem, i > 0 && styles.itemDivider]}>
                        <View style={styles.skillRow}>
                          <Text style={styles.skillName}>{s.name}</Text>
                          <Text style={styles.skillScore}>{s.confidence}</Text>
                        </View>
                        <View style={styles.track}>
                          <View style={[styles.fill, { width: `${s.confidence}%` }]} />
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Pressable onPress={goToVerify} style={styles.emptySkills}>
                    <View style={styles.emptyIcon}>
                      <Plus size={16} color={colors.gold} strokeWidth={2.5} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.emptyTitle}>Add your first verified skill</Text>
                      <Text style={styles.emptyBody}>Connect GitHub or upload a credential to start building proof.</Text>
                    </View>
                    <ChevronRight size={16} color={colors.slate} />
                  </Pressable>
                )}
              </GlassCard>

              {/* 3 — Career Timeline preview */}
              <Text style={styles.sectionLabel}>Career Timeline</Text>
              <GlassCard radius={18}>
                <View style={styles.timelineList}>
                  {timeline.length > 0 ? (
                    timeline.map((node, i) => (
                      <View key={node.artifact_id} style={[styles.timelineRow, i > 0 && styles.itemDivider]}>
                        <View style={styles.timelineDot} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.timelineName} numberOfLines={1}>
                            {node.artifact_name}
                          </Text>
                          <Text style={styles.timelineDate}>
                            {new Date(node.verified_at ?? node.created_at).toLocaleDateString()}
                            {node.confidence != null ? ` · ${Math.round(node.confidence)}/100` : ""}
                          </Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyBody}>Verified artifacts will appear here as your history grows.</Text>
                  )}
                  <Pressable onPress={goToPortfolio} style={styles.inlineLink} hitSlop={8}>
                    <Text style={styles.inlineLinkText}>View full portfolio</Text>
                    <ChevronRight size={13} color={colors.ink} />
                  </Pressable>
                </View>
              </GlassCard>

              {/* 4 — Audit Trail */}
              <Text style={styles.sectionLabel}>Audit Trail</Text>
              <Pressable onPress={() => navigation.navigate("Ledger")}>
                <GlassCard radius={18}>
                  <View style={styles.auditRow}>
                    <ShieldCheck size={17} color={ledger && ledger.entry_count > 0 ? colors.verified : colors.slate} />
                    <Text style={styles.auditText}>
                      {ledger && ledger.entry_count > 0
                        ? `${ledger.entry_count} entr${ledger.entry_count === 1 ? "y" : "ies"} · ${shortHash(ledger.root_hash)}`
                        : "No ledger entries yet"}
                    </Text>
                    <ChevronRight size={16} color={colors.slate} />
                  </View>
                </GlassCard>
              </Pressable>

              {/* 5 — Share */}
              <Text style={styles.sectionLabel}>Share</Text>
              <View style={styles.shareRow}>
                <Pressable style={styles.shareOption} onPress={() => navigation.navigate("FairMode")}>
                  <GlassCard radius={16}>
                    <View style={styles.shareInner}>
                      <QrCode size={18} color={colors.ink} />
                      <Text style={styles.shareLabel}>Show QR</Text>
                    </View>
                  </GlassCard>
                </Pressable>
                <Pressable style={styles.shareOption} onPress={copyLink} disabled={!publicUrl}>
                  <GlassCard radius={16}>
                    <View style={styles.shareInner}>
                      {copied ? <Check size={18} color={colors.verified} /> : <Link2 size={18} color={colors.ink} />}
                      <Text style={[styles.shareLabel, copied && { color: colors.verified }]}>
                        {copied ? "Copied" : "Copy link"}
                      </Text>
                    </View>
                  </GlassCard>
                </Pressable>
                <Pressable style={styles.shareOption} onPress={shareLink} disabled={!publicUrl}>
                  <GlassCard radius={16}>
                    <View style={styles.shareInner}>
                      <Share2 size={18} color={colors.ink} />
                      <Text style={styles.shareLabel}>Share</Text>
                    </View>
                  </GlassCard>
                </Pressable>
              </View>

              {/* 6 — Audience & privacy (candidate control over the verified identity) */}
              <Text style={styles.sectionLabel}>Audience & Privacy</Text>
              <CardAudience handle={handle} />

              {/* 7 — Distribution (get the verified card out into the world) */}
              <Text style={styles.sectionLabel}>Distribution</Text>
              <CardDistribution handle={handle} name={candidate.name} tagline={candidate.field} />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 110, gap: 12 },
  heading: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.ink, marginTop: 4, marginBottom: 4 },
  cardWrap: { alignItems: "center", marginVertical: 8 },
  sectionLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: colors.slate,
    marginTop: 10,
  },
  error: { fontFamily: fonts.mono, fontSize: 13, color: colors.alert, textAlign: "center", marginTop: 40 },

  skillsList: { padding: 16 },
  skillItem: { paddingVertical: 9, gap: 5 },
  itemDivider: { borderTopWidth: 1, borderTopColor: "rgba(16,25,43,0.08)" },
  skillRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  skillName: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink },
  skillScore: { fontFamily: fonts.mono, fontSize: 13, color: colors.verified },
  track: { height: 5, backgroundColor: "rgba(16,25,43,0.08)", borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: colors.verified, borderRadius: 3 },

  emptySkills: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  emptyIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(201,166,70,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  emptyBody: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, marginTop: 2, lineHeight: 17 },

  timelineList: { padding: 16 },
  timelineRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 8 },
  timelineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gold, marginTop: 6 },
  timelineName: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink },
  timelineDate: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate, marginTop: 1 },
  inlineLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(16,25,43,0.08)",
  },
  inlineLinkText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink },

  auditRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  auditText: { flex: 1, fontFamily: fonts.mono, fontSize: 12, color: colors.ink },

  shareRow: { flexDirection: "row", gap: 10 },
  shareOption: { flex: 1 },
  shareInner: { alignItems: "center", gap: 7, paddingVertical: 16 },
  shareLabel: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.ink },
});
