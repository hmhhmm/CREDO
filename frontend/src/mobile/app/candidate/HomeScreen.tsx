import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ShieldCheck,
  MessagesSquare,
  FileStack,
  QrCode,
  ChevronRight,
  LogOut,
  Sparkles,
} from "lucide-react-native";
import ScoreRing from "../../components/shared/ScoreRing";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { useDemo } from "../../context/DemoContext";
import { useAuth } from "../../context/AuthContext";
import { namecardApi, portfolioApi, type PortfolioResponse } from "../../lib/api";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { HomeStackParamList } from "../../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "HomeMain"> & { onSwitchRole: () => void };

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// Parent tab navigator, used to jump to sibling tabs (Verify / Card) from Home quick actions.
type ParentNav = { navigate: (name: string) => void } | undefined;

export default function HomeScreen({ navigation, onSwitchRole }: Props) {
  const { user, logout } = useAuth();
  const { liveCandidate, trustScore: demoTrustScore } = useDemo();
  const [realScore, setRealScore] = useState<number | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [n, p] = await Promise.all([namecardApi.get(user.id), portfolioApi.me()]);
      setRealScore(Math.round(n.trust_score));
      setPortfolio(p);
    } catch {
      // Home degrades to demo score + empty stats; no blocking error needed here.
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

  const trustScore = realScore && realScore > 0 ? realScore : demoTrustScore;
  const displayName = (user?.name || liveCandidate.name).split(" ")[0];
  const field = user?.field_of_study || liveCandidate.field;
  const initial = displayName[0]?.toUpperCase() ?? "?";

  const verifiedCount = portfolio?.verified_artifacts.filter((a) => a.status === "verified").length ?? 0;
  const artifactCount = portfolio?.verified_artifacts.length ?? 0;
  const ledgerCount = portfolio?.ledger_summary.entry_count ?? 0;
  const recent = portfolio?.timeline.slice(0, 2) ?? [];

  const parent = navigation.getParent() as ParentNav;
  const goVerify = () => parent?.navigate("Verify");
  const goCard = () => parent?.navigate("Card");

  const switchRole = async () => {
    await logout();
    onSwitchRole();
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Greeting row */}
          <View style={styles.topRow}>
            <View>
              <Text style={styles.eyebrow}>{greeting(new Date().getHours())}</Text>
              <Text style={styles.heading}>{displayName}</Text>
            </View>
            <Pressable onPress={switchRole} style={styles.avatarButton}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </Pressable>
          </View>

          {/* Hero score card */}
          <GlassCard radius={28}>
            <View style={styles.heroRow}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.heroLabel}>Career Identity Score</Text>
                <Text style={styles.heroField}>{field}</Text>
                <Text style={styles.heroCaption}>Verified across GitHub, credentials & documents</Text>
              </View>
              <ScoreRing score={trustScore} size="lg" />
            </View>
          </GlassCard>

          {/* Stats strip */}
          <View style={styles.statsRow}>
            <GlassCard radius={18} style={styles.statCell}>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{verifiedCount}</Text>
                <Text style={styles.statLabel}>Verified{"\n"}skills</Text>
              </View>
            </GlassCard>
            <GlassCard radius={18} style={styles.statCell}>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{artifactCount}</Text>
                <Text style={styles.statLabel}>Artifacts{"\n"}submitted</Text>
              </View>
            </GlassCard>
            <GlassCard radius={18} style={styles.statCell}>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{ledgerCount}</Text>
                <Text style={styles.statLabel}>Ledger{"\n"}entries</Text>
              </View>
            </GlassCard>
          </View>

          {/* Quick actions */}
          <Text style={styles.sectionLabel}>Quick actions</Text>
          <View style={styles.quickGrid}>
            <QuickAction icon={<ShieldCheck size={20} color={colors.ink} />} label="Verify" onPress={goVerify} />
            <QuickAction icon={<MessagesSquare size={20} color={colors.ink} />} label="SimuHire" onPress={() => navigation.navigate("SimuHire")} />
            <QuickAction icon={<FileStack size={20} color={colors.ink} />} label="Portfolio" onPress={() => navigation.navigate("Portfolio")} />
            <QuickAction icon={<QrCode size={20} color={colors.ink} />} label="Show QR" onPress={goCard} />
          </View>

          {/* Recent activity */}
          <Text style={styles.sectionLabel}>Recent activity</Text>
          <GlassCard radius={18}>
            <View style={styles.activityList}>
              {recent.length > 0 ? (
                recent.map((node, i) => (
                  <Pressable
                    key={node.artifact_id}
                    onPress={() => navigation.navigate("Portfolio")}
                    style={[styles.activityRow, i > 0 && styles.activityDivider]}
                  >
                    <View style={styles.activityDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.activityName} numberOfLines={1}>
                        {node.artifact_name}
                      </Text>
                      <Text style={styles.activityDate}>
                        {new Date(node.verified_at ?? node.created_at).toLocaleDateString()}
                        {node.confidence != null ? ` · ${Math.round(node.confidence)}/100` : ""}
                      </Text>
                    </View>
                    <ChevronRight size={16} color={colors.slate} />
                  </Pressable>
                ))
              ) : (
                <Pressable onPress={goVerify} style={styles.emptyActivity}>
                  <View style={styles.emptyIcon}>
                    <Sparkles size={16} color={colors.gold} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.emptyTitle}>Start building your identity</Text>
                    <Text style={styles.emptyBody}>Verify your first skill to see it appear here.</Text>
                  </View>
                  <ChevronRight size={16} color={colors.slate} />
                </Pressable>
              )}
            </View>
          </GlassCard>

          <Pressable onPress={switchRole} style={styles.switchRoleLink}>
            <LogOut size={13} color={colors.slate} />
            <Text style={styles.switchRoleText}>Switch role</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function QuickAction({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.quickItem} onPress={onPress}>
      <GlassCard radius={18}>
        <View style={styles.quickInner}>
          <View style={styles.quickIcon}>{icon}</View>
          <Text style={styles.quickLabel}>{label}</Text>
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 110, gap: 18 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: 4 },
  eyebrow: { fontFamily: fonts.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: colors.slate },
  heading: { fontFamily: fonts.displayBold, fontSize: 30, color: colors.ink, marginTop: 2 },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.parchment },

  heroRow: { flexDirection: "row", alignItems: "center", gap: 16, padding: 22 },
  heroLabel: { fontFamily: fonts.mono, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: colors.slate },
  heroField: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.ink, marginTop: 2 },
  heroCaption: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, marginTop: 4, lineHeight: 17 },

  statsRow: { flexDirection: "row", gap: 10 },
  statCell: { flex: 1 },
  stat: { alignItems: "center", paddingVertical: 16, paddingHorizontal: 6, gap: 4 },
  statNum: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.ink },
  statLabel: { fontFamily: fonts.mono, fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: colors.slate, textAlign: "center", lineHeight: 12 },

  sectionLabel: { fontFamily: fonts.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: colors.slate },

  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickItem: { width: "47%", flexGrow: 1 },
  quickInner: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(16,25,43,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },

  activityList: { padding: 16 },
  activityRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11 },
  activityDivider: { borderTopWidth: 1, borderTopColor: "rgba(16,25,43,0.08)" },
  activityDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.gold },
  activityName: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink },
  activityDate: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate, marginTop: 1 },

  emptyActivity: { flexDirection: "row", alignItems: "center", gap: 12 },
  emptyIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(201,166,70,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  emptyBody: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, marginTop: 2 },

  switchRoleLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 2 },
  switchRoleText: { fontFamily: fonts.mono, fontSize: 12, color: colors.slate },
});
