import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AlertTriangle, Clock, TrendingUp, LogOut, Briefcase } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import ActionCard from "../../components/shared/ActionCard";
import { employer, dashboardStats, signals, type SignalLevel } from "../../data/employerData";
import { jobsApi, ApiError, type JobListingResponse } from "../../lib/api";
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

const JOB_PREVIEW_COUNT = 3;

export default function EmployerHomeScreen({ navigation, onSwitchRole }: Props) {
  const [jobs, setJobs] = useState<JobListingResponse[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    try {
      const data = await jobsApi.list();
      setJobs(data);
      setJobsError(null);
    } catch (e) {
      setJobsError(e instanceof ApiError ? e.message : "Could not load jobs.");
    } finally {
      setJobsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

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

          {/* Job Posting — preview a few open roles before drilling into the full list */}
          <View style={styles.jobsHeadRow}>
            <Text style={styles.sectionLabel}>Job Posting</Text>
            <Pressable onPress={() => navigation.navigate("JobList")} style={styles.seeAllLink}>
              <Text style={styles.seeAllText}>See all</Text>
            </Pressable>
          </View>
          {jobsLoading ? (
            <ActivityIndicator color={colors.ink} />
          ) : jobsError ? (
            <Text style={styles.jobsError}>{jobsError}</Text>
          ) : jobs.length === 0 ? (
            <ActionCard
              title="Post your first role"
              subtitle="No job listings yet"
              icon={<Briefcase size={18} color={colors.ink} />}
              onPress={() => navigation.navigate("JobList")}
            />
          ) : (
            <View style={{ gap: 10 }}>
              {jobs.slice(0, JOB_PREVIEW_COUNT).map((job) => (
                <Pressable key={job.id} onPress={() => navigation.navigate("JobDetail", { job })}>
                  <GlassCard radius={18}>
                    <View style={styles.jobPreviewCard}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={styles.jobPreviewTitle}>{job.title}</Text>
                        <Text style={styles.jobPreviewMeta}>
                          {job.location} · {job.employment_type}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: job.status === "open" ? colors.verified : colors.slate },
                        ]}
                      />
                    </View>
                  </GlassCard>
                </Pressable>
              ))}
            </View>
          )}

          {/* Live signals — expanded by default, no tap-to-reveal */}
          <Text style={styles.sectionLabel}>Live signals</Text>
          <View style={{ gap: 12 }}>
            {signals.map((sig) => {
              const meta = LEVEL_META[sig.level];
              return (
                <GlassCard key={sig.id} radius={20}>
                  <View style={styles.signalCard}>
                    <View style={styles.signalHead}>
                      <View style={[styles.signalDot, { backgroundColor: meta.color }]}>
                        <meta.Icon size={13} color="#fff" strokeWidth={2.5} />
                      </View>
                      <Text style={styles.signalFeature}>{sig.feature}</Text>
                    </View>
                    <Text style={styles.signalTitle}>{sig.title}</Text>
                    {sig.person && <Text style={styles.signalPerson}>{sig.person}</Text>}
                    <Text style={styles.signalBody}>{sig.body}</Text>
                  </View>
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

  jobsHeadRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  seeAllLink: { paddingVertical: 2 },
  seeAllText: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate, textDecorationLine: "underline" },
  jobsError: { fontFamily: fonts.mono, fontSize: 12, color: colors.alert },
  jobPreviewCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  jobPreviewTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  jobPreviewMeta: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate },
  statusDot: { width: 8, height: 8, borderRadius: 4 },

  signalCard: { padding: 18, gap: 6 },
  signalHead: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  signalDot: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  signalFeature: { fontFamily: fonts.mono, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: colors.slate },
  signalTitle: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.ink, marginTop: 2 },
  signalPerson: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.ink },
  signalBody: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.slate, lineHeight: 18, marginTop: 2 },

  switchRoleLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 2 },
  switchRoleText: { fontFamily: fonts.mono, fontSize: 12, color: colors.slate },
});
