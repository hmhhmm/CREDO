import { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AlertTriangle, Clock, TrendingUp, LogOut, Briefcase } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import ActionCard from "../../components/shared/ActionCard";
import { employer, dashboardStats, signals, type SignalLevel } from "../../data/employerData";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { EmployerHomeStackParamList } from "../../navigation/EmployerHomeStack";

type Props = NativeStackScreenProps<EmployerHomeStackParamList, "EmployerHome"> & {
  onSwitchRole: () => void;
};

const LEVEL_META: Record<SignalLevel, { color: string; Icon: typeof AlertTriangle }> = {
  critical: { color: colors.alert, Icon: AlertTriangle },
  warning: { color: colors.pending, Icon: Clock },
  good: { color: colors.verified, Icon: TrendingUp },
};

export default function EmployerHomeScreen({ navigation, onSwitchRole }: Props) {
  const [expandedSignal, setExpandedSignal] = useState<string | null>(null);

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <View>
              <Text style={styles.eyebrow}>{employer.company}</Text>
              <Text style={styles.heading}>Hire Intelligence</Text>
            </View>
            <Pressable onPress={onSwitchRole} style={styles.avatarButton}>
              <Text style={styles.avatarInitial}>{employer.initial}</Text>
            </Pressable>
          </View>

          {/* Stats strip */}
          <View style={styles.statsRow}>
            {dashboardStats.map((s) => (
              <GlassCard key={s.label} radius={18} style={styles.statCell}>
                <View style={styles.stat}>
                  <Text style={styles.statNum}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                  <Text style={styles.statHint}>{s.hint}</Text>
                </View>
              </GlassCard>
            ))}
          </View>

          {/* Job Posting quick action */}
          <ActionCard
            title="Job Posting"
            subtitle="Post and manage job listings"
            icon={<Briefcase size={18} color={colors.ink} />}
            onPress={() => navigation.navigate("JobList")}
          />

          {/* Live signals */}
          <Text style={styles.sectionLabel}>Live signals</Text>
          <View style={{ gap: 12 }}>
            {signals.map((sig) => {
              const meta = LEVEL_META[sig.level];
              const expanded = expandedSignal === sig.id;
              return (
                <GlassCard key={sig.id} radius={20}>
                  <Pressable
                    style={styles.signalCard}
                    onPress={() => setExpandedSignal(expanded ? null : sig.id)}
                  >
                    <View style={styles.signalHead}>
                      <View style={[styles.signalDot, { backgroundColor: meta.color }]}>
                        <meta.Icon size={13} color="#fff" strokeWidth={2.5} />
                      </View>
                      <Text style={styles.signalFeature}>{sig.feature}</Text>
                      <Text style={styles.signalChevron}>{expanded ? "▲" : "▼"}</Text>
                    </View>
                    <Text style={styles.signalTitle}>{sig.title}</Text>
                    {sig.person && <Text style={styles.signalPerson}>{sig.person}</Text>}
                    {expanded && <Text style={styles.signalBody}>{sig.body}</Text>}
                  </Pressable>
                </GlassCard>
              );
            })}
          </View>

          <Pressable onPress={onSwitchRole} style={styles.switchRoleLink}>
            <LogOut size={13} color={colors.slate} />
            <Text style={styles.switchRoleText}>Switch role</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 110, gap: 18 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: 4 },
  eyebrow: { fontFamily: fonts.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: colors.slate },
  heading: { fontFamily: fonts.displayBold, fontSize: 28, color: colors.ink, marginTop: 2 },
  avatarButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.parchment },

  statsRow: { flexDirection: "row", gap: 10 },
  statCell: { flex: 1 },
  stat: { alignItems: "center", paddingVertical: 16, paddingHorizontal: 6, gap: 3 },
  statNum: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.ink },
  statLabel: { fontFamily: fonts.mono, fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: colors.slate, textAlign: "center" },
  statHint: { fontFamily: fonts.sans, fontSize: 9, color: colors.slate, textAlign: "center" },

  sectionLabel: { fontFamily: fonts.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: colors.slate },

  signalCard: { padding: 18, gap: 6 },
  signalHead: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  signalChevron: { marginLeft: "auto", fontFamily: fonts.mono, fontSize: 9, color: colors.slate },
  signalDot: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  signalFeature: { fontFamily: fonts.mono, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: colors.slate },
  signalTitle: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.ink, marginTop: 2 },
  signalPerson: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.ink },
  signalBody: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.slate, lineHeight: 18, marginTop: 2 },

  switchRoleLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 2 },
  switchRoleText: { fontFamily: fonts.mono, fontSize: 12, color: colors.slate },
});
