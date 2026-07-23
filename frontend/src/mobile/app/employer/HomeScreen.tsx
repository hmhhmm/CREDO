import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AlertTriangle, Clock, TrendingUp, LogOut, Briefcase, MapPin, Check } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import ActionCard from "../../components/shared/ActionCard";
import { getEmployerIdentity, getDashboardStats, signals, type SignalLevel } from "../../data/employerData";
import { demoEmployer, type Employer } from "../../data/generateDataset";
import { currentEmployer } from "../../lib/mockApi";
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
const JOB_PREVIEW_SKILL_COUNT = 3;

const TYPE_LABEL: Record<string, string> = {
  "full-time": "Full-time",
  internship: "Internship",
  contract: "Contract",
};

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

  // The specific logged-in employer account — defaults to the demo identity until the
  // real session resolves, same fallback pattern candidate screens use.
  const [employer, setEmployer] = useState<Employer>(demoEmployer);
  useEffect(() => {
    currentEmployer().then(setEmployer);
  }, []);

  const identity = getEmployerIdentity(employer);
  const dashboardStats = getDashboardStats(employer);

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <View>
              <Text style={styles.eyebrow}>{identity.company}</Text>
              <Text style={styles.heading}>Hire Intelligence</Text>
            </View>
            <Pressable onPress={onSwitchRole} style={styles.avatarButton}>
              <Text style={styles.avatarInitial}>{identity.initial}</Text>
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
              {jobs.slice(0, JOB_PREVIEW_COUNT).map((job) => {
                const isOpen = job.status === "open";
                return (
                  <Pressable key={job.id} onPress={() => navigation.navigate("JobDetail", { job })}>
                    <GlassCard radius={18}>
                      <View style={styles.jobPreviewCard}>
                        <View style={styles.jobPreviewHead}>
                          <View style={{ flex: 1, gap: 4 }}>
                            <Text style={styles.jobPreviewTitle}>{job.title}</Text>
                            <View style={styles.jobPreviewMetaRow}>
                              <MapPin size={11} color={colors.slate} />
                              <Text style={styles.jobPreviewMeta}>{job.location}</Text>
                              <Text style={styles.jobPreviewDot}>·</Text>
                              <Text style={styles.jobPreviewMeta}>{TYPE_LABEL[job.employment_type] ?? job.employment_type}</Text>
                            </View>
                          </View>
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: isOpen ? "rgba(31,122,92,0.1)" : "rgba(16,25,43,0.06)" },
                            ]}
                          >
                            <Text style={[styles.statusText, { color: isOpen ? colors.verified : colors.slate }]}>
                              {isOpen ? "Open" : "Closed"}
                            </Text>
                          </View>
                        </View>

                        {(job.salary_min != null || job.salary_max != null) && (
                          <Text style={styles.jobPreviewSalary}>
                            {job.salary_min != null && job.salary_max != null
                              ? `RM ${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()} / mo`
                              : job.salary_min != null
                              ? `From RM ${job.salary_min.toLocaleString()} / mo`
                              : `Up to RM ${job.salary_max!.toLocaleString()} / mo`}
                          </Text>
                        )}

                        {job.required_skills.length > 0 && (
                          <View style={styles.jobPreviewSkillRow}>
                            {job.required_skills.slice(0, JOB_PREVIEW_SKILL_COUNT).map((s) => (
                              <View
                                key={s.name}
                                style={[
                                  styles.skillChip,
                                  { backgroundColor: s.verified_only ? "rgba(31,122,92,0.1)" : "rgba(16,25,43,0.06)" },
                                ]}
                              >
                                {s.verified_only && <Check size={9} color={colors.verified} strokeWidth={3} />}
                                <Text style={[styles.skillText, { color: s.verified_only ? colors.verified : colors.slate }]}>
                                  {s.name}
                                </Text>
                              </View>
                            ))}
                            {job.required_skills.length > JOB_PREVIEW_SKILL_COUNT && (
                              <View style={styles.skillChip}>
                                <Text style={styles.skillText}>+{job.required_skills.length - JOB_PREVIEW_SKILL_COUNT}</Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    </GlassCard>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Live signals — expanded by default, no tap-to-reveal */}
          <Text style={styles.sectionLabel}>Live signals</Text>
          <View style={{ gap: 12 }}>
            {signals.map((sig) => {
              const meta = LEVEL_META[sig.level];
              const isHireIntelligence = sig.feature.startsWith("E8");
              return (
                <GlassCard key={sig.id} radius={20}>
                  <Pressable
                    style={styles.signalCard}
                    disabled={!isHireIntelligence}
                    onPress={() => navigation.navigate("HireIntelligence")}
                  >
                    <View style={styles.signalHead}>
                      <View style={[styles.signalDot, { backgroundColor: meta.color }]}>
                        <meta.Icon size={13} color="#fff" strokeWidth={2.5} />
                      </View>
                      <Text style={styles.signalFeature}>{sig.feature}</Text>
                    </View>
                    <Text style={styles.signalTitle}>{sig.title}</Text>
                    {sig.person && <Text style={styles.signalPerson}>{sig.person}</Text>}
                    <Text style={styles.signalBody}>{sig.body}</Text>
                    {isHireIntelligence && <Text style={styles.signalLink}>View full dashboard →</Text>}
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

  jobsHeadRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  seeAllLink: { paddingVertical: 2 },
  seeAllText: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate, textDecorationLine: "underline" },
  jobsError: { fontFamily: fonts.mono, fontSize: 12, color: colors.alert },

  jobPreviewCard: { padding: 16, gap: 10 },
  jobPreviewHead: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  jobPreviewTitle: { fontFamily: fonts.displayBold, fontSize: 15, color: colors.ink },
  jobPreviewMetaRow: { flexDirection: "row", alignItems: "center", gap: 5, flexWrap: "wrap" },
  jobPreviewMeta: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate },
  jobPreviewDot: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate },
  jobPreviewSalary: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink },
  jobPreviewSkillRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  statusBadge: { borderRadius: 100, paddingVertical: 4, paddingHorizontal: 10, alignSelf: "flex-start" },
  statusText: { fontFamily: fonts.mono, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  skillChip: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 100, paddingVertical: 3, paddingHorizontal: 9 },
  skillText: { fontFamily: fonts.mono, fontSize: 10, color: colors.slate },

  signalCard: { padding: 18, gap: 6 },
  signalHead: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  signalDot: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  signalFeature: { fontFamily: fonts.mono, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: colors.slate },
  signalTitle: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.ink, marginTop: 2 },
  signalPerson: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.ink },
  signalBody: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.slate, lineHeight: 18, marginTop: 2 },
  signalLink: { fontFamily: fonts.monoMedium, fontSize: 11, color: colors.verified, marginTop: 4 },

  switchRoleLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 2 },
  switchRoleText: { fontFamily: fonts.mono, fontSize: 12, color: colors.slate },
});
