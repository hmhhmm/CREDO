// "See more" destination for Home's Popular Jobs / Matched to Your Portfolio cards.
// Bridge B (Candidate <-> Employer): reads the same jobsFeedApi feed every employer's
// JobCreateScreen posting lands in — real listings, not a separate illustrative dataset —
// and ranks them against the candidate's verified skills (Smart Talent Matching, E2, run
// from the candidate's side instead of the employer's).
import { useCallback, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MapPin, Check, ShieldCheck, MessagesSquare, Bookmark, Send, ThumbsUp } from "lucide-react-native";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { jobsFeedApi, namecardApi, ApiError, type JobFeedListing, type SkillEntry } from "../../lib/api";
import { rankJobMatches, scoreJobMatch, type JobMatch } from "../../utils/jobMatch";
import { useAuth } from "../../context/AuthContext";
import { usePipeline } from "../../context/PipelineContext";
import { useSavedJobs } from "../../context/SavedJobsContext";
import { allCandidates } from "../../data/generateDataset";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { HomeStackParamList } from "../../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "JobMatches">;

const TYPE_LABEL: Record<string, string> = { "full-time": "Full-time", internship: "Internship", contract: "Contract" };

type Tab = "matched" | "popular";

export default function JobMatchesScreen({ route }: Props) {
  const { user } = useAuth();
  const { applyToJob, isInPipelineFor } = usePipeline();
  const { isSaved, toggleSaved } = useSavedJobs();
  const [tab, setTab] = useState<Tab>(route.params?.initialTab ?? "matched");
  const [jobs, setJobs] = useState<JobFeedListing[]>([]);
  const [skills, setSkills] = useState<SkillEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      const [feed, namecard] = await Promise.all([jobsFeedApi.list(), namecardApi.get(user.id)]);
      setJobs(feed);
      setSkills(namecard.skills);
    } catch (e) {
      console.error("JobMatchesScreen load failed:", e);
      setError(e instanceof ApiError ? e.message : "Could not load jobs.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const matches = useMemo(() => rankJobMatches(jobs, skills), [jobs, skills]);
  const popularMatches = useMemo(
    () =>
      [...jobs]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .map((job) => scoreJobMatch(job, skills)),
    [jobs, skills]
  );

  const handleApply = useCallback(
    (job: JobFeedListing) => {
      if (!user) return;
      const candidate = allCandidates.find((c) => c.id === user.id);
      if (!candidate) return;
      applyToJob(candidate, job.employer_id, job.title);
    },
    [user, applyToJob]
  );

  // Real applied state, not a screen-local click flag — reads the same persisted pipeline
  // store Application Status and the employer's Pipeline both read/write, so "Applied"
  // survives a reload and reflects an application made from anywhere, not just this screen.
  // applyToJob dedupes per employer (one application per employer, not per job posting), so
  // a job reads as applied whenever the candidate has any pipeline entry with that employer.
  const hasApplied = useCallback(
    (job: JobFeedListing) => (user ? isInPipelineFor(job.employer_id, user.id) : false),
    [user, isInPipelineFor]
  );

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.tabRow}>
          <TabButton label="Matched to you" active={tab === "matched"} onPress={() => setTab("matched")} />
          <TabButton label="Popular" active={tab === "popular"} onPress={() => setTab("popular")} />
        </View>

        {loading ? (
          <ActivityIndicator color={colors.ink} style={{ marginTop: 40 }} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {tab === "matched" ? (
              matches.length === 0 ? (
                <EmptyState
                  title="No matches yet"
                  body="Verify a skill to see roles that line up with your Smart Namecard."
                />
              ) : (
                matches.map((m) => (
                  <JobCard
                    key={m.job.id}
                    match={m}
                    saved={user ? isSaved(user.id, m.job.id) : false}
                    applied={hasApplied(m.job)}
                    onToggleSave={() => user && toggleSaved(user.id, m.job.id)}
                    onApply={() => handleApply(m.job)}
                  />
                ))
              )
            ) : popularMatches.length === 0 ? (
              <EmptyState title="No open roles right now" body="Check back soon — employers post here directly." />
            ) : (
              popularMatches.map((m) => (
                <JobCard
                  key={m.job.id}
                  match={m}
                  saved={user ? isSaved(user.id, m.job.id) : false}
                  applied={hasApplied(m.job)}
                  onToggleSave={() => user && toggleSaved(user.id, m.job.id)}
                  onApply={() => handleApply(m.job)}
                />
              ))
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tabButton, active && styles.tabButtonActive]}>
      <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>{label}</Text>
    </Pressable>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <GlassCard radius={20}>
      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptyBody}>{body}</Text>
      </View>
    </GlassCard>
  );
}

// Work-type badge: only Remote/On-site are real signals in this data (location is either
// "Remote" or a city name) — no explicit hybrid field exists anywhere upstream, so this
// doesn't invent a "Hybrid" tag that isn't backed by anything.
function WorkTypeBadge({ location }: { location?: string }) {
  if (!location) return null;
  const isRemote = location === "Remote";
  return (
    <View style={[styles.workTypeBadge, isRemote && styles.workTypeBadgeRemote]}>
      <Text style={[styles.workTypeBadgeText, isRemote && styles.workTypeBadgeTextRemote]}>
        {isRemote ? "Remote" : "On-site"}
      </Text>
    </View>
  );
}

function JobMeta({ job }: { job: JobFeedListing }) {
  return (
    <View style={styles.metaRow}>
      {job.location && (
        <>
          <MapPin size={11} color={colors.slate} />
          <Text style={styles.meta}>{job.location}</Text>
          <Text style={styles.dot}>·</Text>
        </>
      )}
      {job.employment_type && <Text style={styles.meta}>{TYPE_LABEL[job.employment_type] ?? job.employment_type}</Text>}
    </View>
  );
}

function RequirementBadges({ job }: { job: JobFeedListing }) {
  if (!job.require_verified && !job.require_simuhire) return null;
  return (
    <View style={styles.reqRow}>
      {job.require_verified && (
        <View style={styles.reqChip}>
          <ShieldCheck size={10} color={colors.verified} />
          <Text style={styles.reqText}>Verified skills required</Text>
        </View>
      )}
      {job.require_simuhire && (
        <View style={styles.reqChip}>
          <MessagesSquare size={10} color={colors.gold} />
          <Text style={styles.reqText}>SimuHire required</Text>
        </View>
      )}
    </View>
  );
}

function JobCard({
  match,
  saved,
  applied,
  onToggleSave,
  onApply,
}: {
  match: JobMatch;
  saved: boolean;
  applied: boolean;
  onToggleSave: () => void;
  onApply: () => void;
}) {
  const { job, matchedSkills, missingSkills, score } = match;
  return (
    <GlassCard radius={20}>
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.title}>{job.title}</Text>
            <Text style={styles.company}>{job.company}</Text>
            <View style={styles.metaWrapRow}>
              <JobMeta job={job} />
              <WorkTypeBadge location={job.location} />
            </View>
          </View>
          <View style={styles.headActions}>
            <Pressable onPress={onToggleSave} hitSlop={8} style={styles.saveBtn}>
              <Bookmark size={16} color={saved ? colors.terracotta : colors.slate} fill={saved ? colors.terracotta : "none"} />
            </Pressable>
            {score > 0 && (
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreNum}>{score}%</Text>
                <Text style={styles.scoreLabel}>match</Text>
              </View>
            )}
          </View>
        </View>

        {(job.salary_min != null || job.salary_max != null) && (
          <Text style={styles.salary}>
            {job.salary_min != null && job.salary_max != null
              ? `RM ${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()} / mo`
              : job.salary_min != null
              ? `From RM ${job.salary_min.toLocaleString()} / mo`
              : `Up to RM ${job.salary_max!.toLocaleString()} / mo`}
          </Text>
        )}

        {matchedSkills.length > 0 || missingSkills.length > 0 ? (
          <View style={styles.skillRow}>
            {matchedSkills.map((s) => (
              <View key={s} style={[styles.skillChip, styles.skillChipMatched]}>
                <Check size={9} color={colors.verified} strokeWidth={3} />
                <Text style={[styles.skillText, { color: colors.verified }]}>{s}</Text>
              </View>
            ))}
            {missingSkills.map((s) => (
              <View key={s} style={[styles.skillChip, styles.skillChipMissing]}>
                <Text style={[styles.skillText, { color: colors.slate }]}>{s}</Text>
              </View>
            ))}
          </View>
        ) : (
          job.required_skills &&
          job.required_skills.length > 0 && (
            <View style={styles.skillRow}>
              {job.required_skills.map((s) => (
                <View key={s} style={styles.skillChip}>
                  <Text style={styles.skillText}>{s}</Text>
                </View>
              ))}
            </View>
          )
        )}

        <RequirementBadges job={job} />

        <Pressable
          style={[styles.applyBtn, applied && styles.applyBtnDone]}
          onPress={onApply}
          disabled={applied}
        >
          {applied ? (
            <ThumbsUp size={13} color={colors.verified} />
          ) : (
            <Send size={13} color={colors.parchment} />
          )}
          <Text style={[styles.applyBtnText, applied && styles.applyBtnTextDone]}>
            {applied ? "Applied" : "Apply with Smart Namecard"}
          </Text>
        </Pressable>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingTop: 4, paddingBottom: 110, gap: 12 },
  error: { fontFamily: fonts.mono, fontSize: 13, color: colors.alert, padding: 20 },

  tabRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  tabButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 100, backgroundColor: "rgba(16,25,43,0.05)" },
  tabButtonActive: { backgroundColor: colors.ink },
  tabButtonText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.slate },
  tabButtonTextActive: { color: colors.parchment },

  card: { padding: 16, gap: 12 },
  cardHead: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  title: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.ink },
  company: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.slate },
  metaWrapRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, flexWrap: "wrap" },
  meta: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate },
  dot: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate },

  workTypeBadge: {
    borderRadius: 100,
    paddingVertical: 2,
    paddingHorizontal: 8,
    backgroundColor: "rgba(16,25,43,0.06)",
  },
  workTypeBadgeRemote: { backgroundColor: "rgba(193,122,61,0.14)" },
  workTypeBadgeText: { fontFamily: fonts.mono, fontSize: 9.5, color: colors.slate, textTransform: "uppercase", letterSpacing: 0.5 },
  workTypeBadgeTextRemote: { color: colors.terracotta },

  headActions: { alignItems: "center", gap: 8 },
  saveBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16,25,43,0.05)",
  },
  scoreBadge: { alignItems: "center", gap: 0 },
  scoreNum: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.verified },
  scoreLabel: { fontFamily: fonts.mono, fontSize: 8.5, textTransform: "uppercase", letterSpacing: 1, color: colors.slate },

  salary: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink },

  skillRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  skillChip: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 100, paddingVertical: 3, paddingHorizontal: 9, backgroundColor: "rgba(16,25,43,0.06)" },
  skillChipMatched: { backgroundColor: "rgba(31,122,92,0.1)" },
  skillChipMissing: { backgroundColor: "rgba(16,25,43,0.05)" },
  skillText: { fontFamily: fonts.mono, fontSize: 10, color: colors.slate },

  reqRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  reqChip: { flexDirection: "row", alignItems: "center", gap: 5 },
  reqText: { fontFamily: fonts.mono, fontSize: 10, color: colors.slate },

  applyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 12,
    paddingVertical: 11,
    backgroundColor: colors.ink,
    marginTop: 2,
  },
  applyBtnDone: { backgroundColor: "rgba(31,122,92,0.1)" },
  applyBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.parchment },
  applyBtnTextDone: { color: colors.verified },

  emptyCard: { padding: 24, gap: 8, alignItems: "center" },
  emptyTitle: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.ink },
  emptyBody: { fontFamily: fonts.sans, fontSize: 13, color: colors.slate, textAlign: "center", lineHeight: 19 },
});
