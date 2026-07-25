import { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Wallet, MessageCircle, ChevronRight, ChevronDown, RefreshCw } from "lucide-react-native";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { getOutcomeStats, getAlumniCheckins, getLifelongWallet, getHiresByMajor, type University } from "../../data/universityData";
import { usePipeline } from "../../context/PipelineContext";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { OutcomesStackParamList } from "../../navigation/OutcomesStack";

type Props = NativeStackScreenProps<OutcomesStackParamList, "OutcomesMain"> & { university: University };

export default function OutcomesScreen({ university, navigation }: Props) {
  const { allAcceptedHires } = usePipeline();
  const hires = allAcceptedHires();
  const outcomeStats = getOutcomeStats(university, hires);
  const alumniCheckins = getAlumniCheckins(university, hires);
  const lifelongWallet = getLifelongWallet(university);
  const hiresByMajor = getHiresByMajor(university, hires);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.heading}>Outcomes</Text>
          <Text style={styles.subheading}>{"Post-grad signals feeding next year's curriculum planning."}</Text>

          {/* U9 — Outcome Loop stats */}
          <View style={styles.statsRow}>
            {outcomeStats.map((s) => (
              <GlassCard key={s.label} radius={18} style={styles.statCell}>
                <View style={styles.stat}>
                  <Text style={styles.statNum}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                  <Text style={styles.statHint}>{s.hint}</Text>
                </View>
              </GlassCard>
            ))}
          </View>

          {/* Bridge C — these are the exact same real accepted-hire numbers above; this
              banner names where they flow to (U2), it isn't a separate data source. */}
          <View style={styles.syncBanner}>
            <RefreshCw size={13} color={colors.terracotta} />
            <Text style={styles.syncBannerText}>
              Data syncing active: these outcomes feed Curriculum Gap Detector (U2) for next year's planning.
            </Text>
          </View>

          {/* U8 — Lifelong Learning Wallet */}
          <GlassCard radius={18}>
            <View style={styles.walletRow}>
              <View style={styles.walletIcon}>
                <Wallet size={18} color={colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.walletTitle}>Lifelong Learning Wallet</Text>
                <Text style={styles.walletBody}>
                  {lifelongWallet.activeAlumni.toLocaleString()} alumni keep credentials live · {lifelongWallet.reVerifiedThisYear} re-verified this year
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* U10 — Alumni Career Pulse: real accepted hires across every employer, not a
              survey response count. Tap the row to drill into the full detail screen; tap
              the chevron to expand a real per-major breakdown inline. */}
          <Text style={styles.sectionLabel}>Alumni Career Pulse</Text>
          <GlassCard radius={18}>
            <View style={styles.checkinList}>
              {alumniCheckins.map((a, i) => {
                const isOpen = !!expanded[a.window];
                return (
                  <View key={a.window} style={[i > 0 && styles.divider]}>
                    <Pressable style={styles.checkin} onPress={() => navigation.navigate("AlumniDetail", { window: a.window })}>
                      <View style={styles.checkinIcon}>
                        <MessageCircle size={14} color={colors.ink} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.checkinHead}>
                          <Text style={styles.checkinWindow}>{a.window}</Text>
                          <Text style={styles.checkinResp}>{a.responded} hired</Text>
                        </View>
                        <Text style={styles.checkinNote}>{a.note}</Text>
                      </View>
                      <ChevronRight size={16} color={colors.slate} />
                    </Pressable>

                    {a.responded > 0 && (
                      <Pressable
                        style={styles.expandToggle}
                        onPress={() => setExpanded((prev) => ({ ...prev, [a.window]: !prev[a.window] }))}
                      >
                        <View style={isOpen ? styles.chevronOpen : undefined}>
                          <ChevronDown size={13} color={colors.slate} />
                        </View>
                        <Text style={styles.expandToggleText}>{isOpen ? "Hide breakdown by major" : "Breakdown by major"}</Text>
                      </Pressable>
                    )}

                    {isOpen && (
                      <View style={styles.majorBreakdown}>
                        {hiresByMajor.map((m) => (
                          <View key={m.major} style={styles.majorGroup}>
                            <Text style={styles.majorTitle}>
                              {m.major} ({m.hires.length} hired)
                            </Text>
                            {m.hires.map((h, hi) => (
                              <Text key={hi} style={styles.majorHireLine}>
                                {h.name} → {h.employer} · Trust {h.trustScore}
                                {h.hiredOn ? ` · ${h.hiredOn}` : ""}
                              </Text>
                            ))}
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 110, gap: 16 },
  heading: { fontFamily: fonts.displayBold, fontSize: 28, color: colors.ink, marginTop: 4 },
  subheading: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, marginTop: 4 },

  statsRow: { flexDirection: "row", gap: 10 },
  statCell: { flex: 1 },
  stat: { alignItems: "center", paddingVertical: 16, paddingHorizontal: 6, gap: 3 },
  statNum: { fontFamily: fonts.displayBold, fontSize: 24, color: colors.ink },
  statLabel: { fontFamily: fonts.mono, fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: colors.slate, textAlign: "center" },
  statHint: { fontFamily: fonts.sans, fontSize: 9, color: colors.slate, textAlign: "center" },

  walletRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  walletIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(201,166,70,0.12)", alignItems: "center", justifyContent: "center" },
  walletTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  walletBody: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.slate, marginTop: 2, lineHeight: 16 },

  syncBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(193,122,61,0.08)",
    borderWidth: 1,
    borderColor: "rgba(193,122,61,0.22)",
    borderRadius: 12,
    padding: 12,
  },
  syncBannerText: { flex: 1, fontFamily: fonts.sans, fontSize: 11.5, color: colors.ink, lineHeight: 16 },

  sectionLabel: { fontFamily: fonts.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: colors.slate },
  checkinList: { padding: 16 },
  checkin: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 11 },
  divider: { borderTopWidth: 1, borderTopColor: "rgba(16,25,43,0.08)" },
  checkinIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: "rgba(16,25,43,0.06)", alignItems: "center", justifyContent: "center", marginTop: 2 },
  checkinHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  checkinWindow: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink },
  checkinResp: { fontFamily: fonts.mono, fontSize: 10, color: colors.slate },
  checkinNote: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, marginTop: 2, lineHeight: 17 },

  expandToggle: { flexDirection: "row", alignItems: "center", gap: 6, paddingBottom: 10, paddingLeft: 42 },
  chevronOpen: { transform: [{ rotate: "180deg" }] },
  expandToggleText: { fontFamily: fonts.sansMedium, fontSize: 11.5, color: colors.slate },

  majorBreakdown: { paddingLeft: 42, paddingBottom: 12, gap: 10 },
  majorGroup: { gap: 3 },
  majorTitle: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.ink },
  majorHireLine: { fontFamily: fonts.mono, fontSize: 10.5, color: colors.slate, lineHeight: 15 },
});
