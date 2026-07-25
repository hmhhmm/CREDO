import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ChevronRight,
  ChevronDown,
  Briefcase,
  Send,
  CalendarClock,
  ThumbsUp,
  ThumbsDown,
  ShieldCheck,
  Sparkles,
  MessagesSquare,
  GitBranch,
  Award,
} from "lucide-react-native";
import ScoreRing from "../../components/shared/ScoreRing";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import Avatar from "../../components/shared/Avatar";
import { useDemo } from "../../context/DemoContext";
import { useAuth } from "../../context/AuthContext";
import { usePipeline } from "../../context/PipelineContext";
import { useCredentialIssuer } from "../../context/CredentialIssuerContext";
import { namecardApi, portfolioApi, jobsFeedApi, type PortfolioResponse, type NamecardResponse, type JobFeedListing } from "../../lib/api";
import { deriveAskcBreakdown } from "../../utils/askcBreakdown";
import { rankJobMatches } from "../../utils/jobMatch";
import { deriveNextBestAction, type ActionKind } from "../../utils/nextBestAction";
import { deriveCoSignStatus } from "../../utils/institutionalCoSign";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { HomeStackParamList } from "../../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "HomeMain">;

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const ACTION_ICON: Record<ActionKind, typeof GitBranch> = {
  link_github: GitBranch,
  improve_skill: Sparkles,
  run_simuhire: MessagesSquare,
  verify_more: ShieldCheck,
  all_strong: Award,
};

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { liveCandidate, trustScore: demoTrustScore } = useDemo();
  const { pipelineForCandidate } = usePipeline();
  const { isIssued } = useCredentialIssuer();
  const [realScore, setRealScore] = useState<number | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [namecardData, setNamecardData] = useState<NamecardResponse | null>(null);
  const [jobs, setJobs] = useState<JobFeedListing[]>([]);
  const [heroExpanded, setHeroExpanded] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [n, p, feed] = await Promise.all([namecardApi.get(user.id), portfolioApi.me(), jobsFeedApi.list()]);
      setRealScore(Math.round(n.trust_score));
      setPortfolio(p);
      setNamecardData(n);
      setJobs(feed);
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

  const askc = useMemo(
    () => (namecardData ? deriveAskcBreakdown(namecardData, portfolio) : []),
    [namecardData, portfolio]
  );

  // Bridge A ("Verify Together") — real check against CredentialIssuerContext, the same
  // store University's CohortDetailScreen writes to when co-signing a real artifact.
  const coSign = useMemo(
    () => deriveCoSignStatus(user?.university, portfolio, isIssued),
    [user?.university, portfolio, isIssued]
  );

  // AI Career Coach (C8) — derived from real namecard state (GitHub link, weakest verified
  // skill, SimuHire status, unverified claims), not a fixed script.
  const nextAction = useMemo(() => (namecardData ? deriveNextBestAction(namecardData) : null), [namecardData]);
  const ActionIcon = nextAction ? ACTION_ICON[nextAction.kind] : Sparkles;

  const matches = useMemo(
    () => (namecardData ? rankJobMatches(jobs, namecardData.skills) : []),
    [jobs, namecardData]
  );
  const matchScoreByJobId = useMemo(() => new Map(matches.map((m) => [m.job.id, m.score])), [matches]);
  const popular = useMemo(
    () => [...jobs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6),
    [jobs]
  );

  // Real, live pipeline state — the same entries employers create/mutate on their Pipeline
  // screen (invite/schedule/advance/decide), not a static preview array.
  const applications = useMemo(
    () => (user ? pipelineForCandidate(user.id) : []),
    [user, pipelineForCandidate]
  );
  const decidedCount = applications.filter((a) => a.decision).length;
  const inProgressCount = applications.length - decidedCount;
  const mostRecent = applications[0];
  const statusAccent = mostRecent?.decision === "accepted"
    ? colors.verified
    : mostRecent?.decision === "rejected"
    ? colors.alert
    : "#2F6E8F";
  const StatusIcon = mostRecent?.decision === "accepted"
    ? ThumbsUp
    : mostRecent?.decision === "rejected"
    ? ThumbsDown
    : mostRecent?.currentStageId
    ? CalendarClock
    : Send;

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
            <Pressable onPress={() => navigation.navigate("Settings")}>
              <Avatar initial={initial} />
            </Pressable>
          </View>

          {/* Hero score card */}
          <GlassCard radius={28}>
            <View style={styles.heroCard}>
              <View style={styles.heroRow}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.heroLabel}>Career Identity Score</Text>
                  <View style={styles.heroFieldRow}>
                    <Text style={styles.heroField}>{field}</Text>
                    {coSign.isCoSigned && (
                      <View style={styles.coSignBadge}>
                        <ShieldCheck size={10} color="#2F6E8F" />
                        <Text style={styles.coSignBadgeText}>Co-signed by {coSign.universityName}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.heroCaption}>Verified across GitHub, credentials & documents</Text>
                </View>
                <ScoreRing score={trustScore} size="lg" />
              </View>

              {heroExpanded && (
                <View style={styles.askcGrid}>
                  {askc.map((p) => (
                    <AskcPillarCell key={p.pillar} label={p.label} score={p.score} />
                  ))}
                </View>
              )}

              {/* Small, low-contrast affordance in the corner rather than a full-width row —
                  present for anyone who wants the detail, invisible to anyone who doesn't. */}
              <Pressable
                onPress={() => setHeroExpanded((v) => !v)}
                accessibilityRole="button"
                hitSlop={8}
                style={styles.heroExpandTab}
              >
                <View style={heroExpanded ? styles.heroExpandIconFlipped : undefined}>
                  <ChevronDown size={12} color="rgba(16,25,43,0.28)" />
                </View>
              </Pressable>
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

          {/* AI Career Coach (C8) — Next Best Action, derived from real profile state.
              Terracotta identity: the third accent color, reserved for coaching/SimuHire
              surfaces so it never collides with gold (jobs) or green (verified). */}
          {nextAction && (
            <Pressable onPress={() => navigation.navigate("SimuHire")} accessibilityRole="button">
              <View style={styles.coachCard}>
                <View style={styles.coachIconWrap}>
                  <ActionIcon size={18} color={colors.terracotta} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.coachEyebrow}>AI Career Coach</Text>
                  <Text style={styles.coachHeadline}>{nextAction.headline}</Text>
                  <Text style={styles.coachBody} numberOfLines={2}>{nextAction.body}</Text>
                </View>
              </View>
            </Pressable>
          )}

          {/* SimuHire quick launch (C5) — a direct shortcut, not buried inside Grow. */}
          <Pressable onPress={() => navigation.navigate("SimuHire")} accessibilityRole="button">
            <View style={styles.simuhireCard}>
              <View style={styles.simuhireRow}>
                <View style={styles.simuhireIconWrap}>
                  <MessagesSquare size={18} color={colors.parchment} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.simuhireHeadline}>Practice a 2-minute interview</Text>
                  <Text style={styles.simuhireBody}>SimuHire gives employers real behavioral evidence before you apply.</Text>
                </View>
                <ChevronRight size={16} color="rgba(245,237,224,0.5)" />
              </View>
            </View>
          </Pressable>

          {/* Popular jobs — Bridge B, unscoped feed every employer posting lands in.
              Gold/amber identity distinguishes this from the green "verified" language used
              everywhere else, so it reads as its own section rather than more of the same card. */}
          <SectionHeader
            title="Popular jobs"
            onSeeMore={() => navigation.navigate("JobMatches", { initialTab: "popular" })}
          />
          {popular.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
              {popular.map((job) => {
                const matchScore = matchScoreByJobId.get(job.id);
                return (
                  <Pressable
                    key={job.id}
                    style={styles.jobCardWrap}
                    onPress={() => navigation.navigate("JobMatches", { initialTab: "popular" })}
                  >
                    <GlassCard radius={18} style={styles.jobCardGlass}>
                      <View style={styles.jobCard}>
                        <View style={styles.jobCardTopRow}>
                          <View style={styles.jobCardIcon}>
                            <Briefcase size={15} color={colors.gold} />
                          </View>
                          {matchScore != null && matchScore > 0 && (
                            <View style={styles.jobCardMatchBadge}>
                              <Text style={styles.jobCardMatchBadgeText}>{matchScore}%</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.jobCardTitle} numberOfLines={2}>{job.title}</Text>
                        <Text style={styles.jobCardCompany} numberOfLines={1}>{job.company}</Text>
                        {job.location && <Text style={styles.jobCardMeta} numberOfLines={1}>{job.location}</Text>}
                      </View>
                    </GlassCard>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            <EmptyCard text="No open roles yet — employers post here directly." />
          )}

          {/* Application status — one of the main features: real, live PipelineEntry state
              from the employer side (Bridge B), not preview content. Dark identity-style card
              (same treatment family as the Smart Namecard) so it reads as the anchor feature
              on this page, not one more cream tile among many. */}
          <Text style={styles.sectionLabel}>Your application status</Text>
          <Pressable onPress={() => navigation.navigate("ApplicationStatus")} accessibilityRole="button">
            <View style={styles.statusCard}>
              {applications.length === 0 ? (
                <View style={styles.statusEmptyRow}>
                  <View style={styles.statusEmptyIcon}>
                    <Send size={15} color={colors.parchment} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.statusEmptyTitle}>No applications yet</Text>
                    <Text style={styles.statusEmptyBody}>Employer activity will show up here as it happens.</Text>
                  </View>
                  <ChevronRight size={16} color="rgba(245,237,224,0.5)" />
                </View>
              ) : (
                <>
                  <View style={styles.statusTopRow}>
                    <View style={styles.statusIconRing}>
                      <StatusIcon size={16} color={statusAccent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.statusHeadline}>
                        {inProgressCount > 0
                          ? `${inProgressCount} application${inProgressCount === 1 ? "" : "s"} in progress`
                          : "All applications decided"}
                      </Text>
                      <Text style={styles.statusSubline} numberOfLines={1}>
                        {mostRecent.detail}
                      </Text>
                    </View>
                    <ChevronRight size={16} color="rgba(245,237,224,0.5)" />
                  </View>
                  <View style={styles.statusCountRow}>
                    <Text style={styles.statusCountText}>{applications.length} total</Text>
                    {decidedCount > 0 && <Text style={styles.statusCountText}>· {decidedCount} decided</Text>}
                  </View>
                </>
              )}
            </View>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function SectionHeader({ title, onSeeMore }: { title: string; onSeeMore: () => void }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <Pressable onPress={onSeeMore} accessibilityRole="button" hitSlop={8}>
        <View style={styles.seeMoreRow}>
          <Text style={styles.seeMoreText}>See more</Text>
          <ChevronRight size={13} color={colors.slate} />
        </View>
      </Pressable>
    </View>
  );
}

function EmptyCard({ text, onPress }: { text: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <GlassCard radius={18}>
        <View style={styles.emptyJobsCard}>
          <Text style={styles.emptyBody}>{text}</Text>
        </View>
      </GlassCard>
    </Pressable>
  );
}

// Zero is "not yet verified" — neutral grey, never a red zero, per the charter's fairness
// principle (§05): coverage and quality are always shown separately.
function AskcPillarCell({ label, score }: { label: string; score: number | null }) {
  const notVerified = score == null;
  return (
    <View style={styles.askcCell}>
      <Text style={[styles.askcScore, notVerified && styles.askcScoreMuted]}>{notVerified ? "—" : score}</Text>
      <Text style={styles.askcLabel}>{label}</Text>
      <View style={styles.askcBarTrack}>
        <View
          style={[
            styles.askcBarFill,
            { width: notVerified ? "0%" : `${score}%`, backgroundColor: notVerified ? colors.line : colors.verified },
          ]}
        />
      </View>
      {notVerified && <Text style={styles.askcNotVerified}>Not yet verified</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 110, gap: 18 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: 4 },
  eyebrow: { fontFamily: fonts.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: colors.slate },
  heading: { fontFamily: fonts.displayBold, fontSize: 30, color: colors.ink, marginTop: 2 },

  heroCard: { padding: 22, paddingBottom: 16, gap: 4 },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  heroLabel: { fontFamily: fonts.mono, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: colors.slate },
  heroFieldRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 2 },
  heroField: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.ink },
  heroCaption: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, marginTop: 4, lineHeight: 17 },

  // Bridge A — real institutional co-sign, not decorative. Blue identity (matches the
  // interview/scheduling blue used elsewhere for "an institution/process vouches for this").
  coSignBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 100,
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: "rgba(47,110,143,0.1)",
  },
  coSignBadgeText: { fontFamily: fonts.mono, fontSize: 9, color: "#2F6E8F" },

  // Deliberately tiny and low-contrast — a discoverable affordance for anyone who taps
  // around, not a labeled row competing with the score for attention.
  heroExpandTab: { alignSelf: "center", marginTop: 10, padding: 4 },
  heroExpandIconFlipped: { transform: [{ rotate: "180deg" }] },

  askcGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 },
  askcCell: {
    flexBasis: "47%",
    flexGrow: 1,
    gap: 6,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.06)",
  },
  askcScore: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.ink },
  askcScoreMuted: { color: colors.slate },
  askcLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.ink },
  askcBarTrack: { height: 4, borderRadius: 2, backgroundColor: "rgba(16,25,43,0.08)", overflow: "hidden" },
  askcBarFill: { height: 4, borderRadius: 2 },
  askcNotVerified: { fontFamily: fonts.mono, fontSize: 9.5, color: colors.slate, letterSpacing: 0.3 },

  statsRow: { flexDirection: "row", gap: 10 },
  statCell: { flex: 1 },
  stat: { alignItems: "center", paddingVertical: 16, paddingHorizontal: 6, gap: 4 },
  statNum: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.ink },
  statLabel: { fontFamily: fonts.mono, fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: colors.slate, textAlign: "center", lineHeight: 12 },

  // AI Career Coach card — terracotta-tinted cream, distinct from every other card family
  // on this page (gold job cards, dark status card, plain cream stat cells).
  coachCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(193,122,61,0.08)",
    borderWidth: 1,
    borderColor: "rgba(193,122,61,0.22)",
  },
  coachIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(193,122,61,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  coachEyebrow: { fontFamily: fonts.mono, fontSize: 9.5, textTransform: "uppercase", letterSpacing: 1.2, color: colors.terracotta },
  coachHeadline: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: colors.ink, marginTop: 2 },
  coachBody: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, marginTop: 3, lineHeight: 17 },

  // SimuHire quick-launch — dark, same family as the status card, so the two "do something
  // now" cards read as siblings while Popular/Coach stay in the lighter cream register.
  simuhireCard: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: colors.ink,
  },
  simuhireRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  simuhireIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(193,122,61,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  simuhireHeadline: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.parchment },
  simuhireBody: { fontFamily: fonts.sans, fontSize: 11.5, color: "rgba(245,237,224,0.65)", marginTop: 2, lineHeight: 15 },

  sectionLabel: { fontFamily: fonts.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: colors.slate },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  seeMoreRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeMoreText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.slate },

  hScroll: { gap: 10, paddingRight: 8 },
  // Wide enough that a two-line title never collides with the location line below it —
  // the previous fixed 170px width plus numberOfLines={1} was what clipped longer titles.
  jobCardWrap: { width: 188 },
  jobCardGlass: { borderColor: "rgba(201,166,70,0.22)" },
  jobCard: { padding: 14, gap: 4, minHeight: 132 },
  jobCardTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  jobCardIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "rgba(201,166,70,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  jobCardMatchBadge: {
    borderRadius: 100,
    paddingVertical: 2,
    paddingHorizontal: 7,
    backgroundColor: "rgba(31,122,92,0.12)",
  },
  jobCardMatchBadgeText: { fontFamily: fonts.mono, fontSize: 10, color: colors.verified },
  jobCardTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.ink, lineHeight: 17 },
  jobCardCompany: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.slate, marginTop: 2 },
  jobCardMeta: { fontFamily: fonts.mono, fontSize: 10, color: colors.slate, marginTop: "auto", paddingTop: 6 },

  emptyJobsCard: { padding: 16 },
  emptyBody: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate },

  // Same dark-card treatment as the SimuHire quick-launch card above (colors.ink fill, no
  // border/shadow, parchment/terracotta text) so the two read as one consistent card
  // family instead of two different dark identities on the same page.
  statusCard: {
    borderRadius: 18,
    padding: 16,
    gap: 12,
    backgroundColor: colors.ink,
  },
  statusEmptyRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  statusEmptyIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(193,122,61,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  statusEmptyTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.parchment },
  statusEmptyBody: { fontFamily: fonts.sans, fontSize: 12, color: "rgba(245,237,224,0.65)", marginTop: 2 },

  statusTopRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  statusIconRing: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(193,122,61,0.3)",
    borderWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  statusHeadline: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.parchment },
  statusSubline: { fontFamily: fonts.sans, fontSize: 11.5, color: "rgba(245,237,224,0.65)", marginTop: 2 },
  statusCountRow: {
    flexDirection: "row",
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(245,237,224,0.12)",
  },
  statusCountText: { fontFamily: fonts.mono, fontSize: 11, color: "rgba(245,237,224,0.5)" },
});
