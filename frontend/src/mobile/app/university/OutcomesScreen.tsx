import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Wallet, MessageCircle } from "lucide-react-native";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { getOutcomeStats, getAlumniCheckins, getLifelongWallet, type University } from "../../data/universityData";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

export default function OutcomesScreen({ university }: { university: University }) {
  const outcomeStats = getOutcomeStats(university);
  const alumniCheckins = getAlumniCheckins(university);
  const lifelongWallet = getLifelongWallet(university);
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

          {/* U10 — Alumni Career Pulse */}
          <Text style={styles.sectionLabel}>Alumni Career Pulse</Text>
          <GlassCard radius={18}>
            <View style={styles.checkinList}>
              {alumniCheckins.map((a, i) => (
                <View key={a.window} style={[styles.checkin, i > 0 && styles.divider]}>
                  <View style={styles.checkinIcon}>
                    <MessageCircle size={14} color={colors.ink} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.checkinHead}>
                      <Text style={styles.checkinWindow}>{a.window} check-in</Text>
                      <Text style={styles.checkinResp}>{a.responded} responses</Text>
                    </View>
                    <Text style={styles.checkinNote}>{a.note}</Text>
                  </View>
                </View>
              ))}
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

  sectionLabel: { fontFamily: fonts.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: colors.slate },
  checkinList: { padding: 16 },
  checkin: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 11 },
  divider: { borderTopWidth: 1, borderTopColor: "rgba(16,25,43,0.08)" },
  checkinIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: "rgba(16,25,43,0.06)", alignItems: "center", justifyContent: "center", marginTop: 2 },
  checkinHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  checkinWindow: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink },
  checkinResp: { fontFamily: fonts.mono, fontSize: 10, color: colors.slate },
  checkinNote: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, marginTop: 2, lineHeight: 17 },
});
