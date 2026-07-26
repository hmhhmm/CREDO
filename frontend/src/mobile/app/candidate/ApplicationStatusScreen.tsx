// One of the main features (Bridge B — Candidate <-> Employer): the candidate-facing half
// of the same PipelineEntry state employers actually mutate on their Pipeline screen (invite,
// schedule, advance stage, decide, re-engage, or simply open a profile — see markViewed).
// Not a preview — pipelineForCandidate reads the exact same shared store PipelineScreen
// writes to, so an employer action here shows up live the next time this screen focuses.
import { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Eye, CalendarCheck, ThumbsUp, ThumbsDown, RefreshCw, Video, ExternalLink, MessagesSquare, FileStack, Clock } from "lucide-react-native";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { usePipeline } from "../../context/PipelineContext";
import { useInterviewStages } from "../../context/InterviewStagesContext";
import { useAuth } from "../../context/AuthContext";
import { allEmployers } from "../../data/generateDataset";
import type { PipelineEntry } from "../../data/employerData";
import { formatInterviewDateTime, formatRelativeTime } from "../../utils/interviewSlots";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { HomeStackParamList } from "../../navigation/HomeStack";

type Props = NativeStackScreenProps<HomeStackParamList, "ApplicationStatus">;

// CREDO's own platform commitment (Anti-Ghosting Transparency) — a fixed response window
// once HR has actually opened the profile, not something a specific employer configured.
// No such SLA field exists on PipelineEntry, so this is stated as CREDO's guarantee, not
// attributed to the employer.
const DECISION_WINDOW_DAYS = 5;

type TrackerStageKey = "applied" | "screening" | "interview" | "outcome";
type DotState = "done" | "terminal" | "pending";

const TRACKER_STAGES: { key: TrackerStageKey; label: string }[] = [
  { key: "applied", label: "Applied" },
  { key: "screening", label: "Screening" },
  { key: "interview", label: "Interview" },
  { key: "outcome", label: "Outcome" },
];

// Per-stage state, not a single linear "how far along" index — so a stage that was actually
// skipped never gets falsely marked complete just because a later one was reached.
//   - Accepted: every stage reads as done (green) — the whole path succeeded.
//   - Rejected before ever being invited to interview: the rejection is a Screening-stage
//     outcome, not an Outcome-stage one — Screening is the (red) terminal dot, Interview and
//     Outcome never happened and stay pending, not falsely marked reached.
//   - Rejected after being invited: Applied/Screening/Interview all genuinely happened (done),
//     Outcome is the (red) terminal dot.
//   - No decision yet: stages reached so far are "done," the first one not yet reached is
//     the active (in-progress) stage.
function stageStates(entry: PipelineEntry): Record<TrackerStageKey, DotState> {
  if (entry.decision === "accepted") {
    return { applied: "done", screening: "done", interview: "done", outcome: "done" };
  }
  if (entry.decision === "rejected") {
    if (entry.currentStageId === null) {
      return { applied: "done", screening: "terminal", interview: "pending", outcome: "pending" };
    }
    return { applied: "done", screening: "done", interview: "done", outcome: "terminal" };
  }
  const screeningReached = !!entry.hrViewedAt;
  const interviewReached = entry.currentStageId !== null;
  return {
    applied: "done",
    screening: screeningReached ? "done" : "pending",
    interview: interviewReached ? "done" : "pending",
    outcome: "pending",
  };
}

function StageTracker({ entry, accent }: { entry: PipelineEntry; accent: string }) {
  const states = stageStates(entry);
  // Only meaningful while nothing's been decided yet — the first pending stage is what's
  // currently in progress. Once decided, every dot is either done or genuinely skipped, so
  // nothing gets the "in progress" highlight anymore.
  const activeKey: TrackerStageKey | null = entry.decision
    ? null
    : TRACKER_STAGES.find((s) => states[s.key] === "pending")?.key ?? null;

  // One color for the whole reached portion of the line — accent is already verified/alert/
  // terracotta depending on decision, so accepted reads as an unbroken green line, rejected
  // as an unbroken red line (dots and connectors both), and in-progress as terracotta. Only
  // pending (unreached/skipped) stages stay neutral.
  return (
    <View style={styles.tracker}>
      <View style={styles.trackerRow}>
        {TRACKER_STAGES.map((s, i) => {
          const reached = states[s.key] !== "pending";
          const isActive = s.key === activeKey;
          const next = TRACKER_STAGES[i + 1];
          // A connector only reads as "traveled" if both stages it joins actually happened —
          // a skipped stage keeps the line neutral, showing the real gap.
          const connectorTraveled = reached && !!next && states[next.key] !== "pending";
          return (
            <View key={s.key} style={styles.trackerNode}>
              <View
                style={[
                  styles.trackerDot,
                  reached && { backgroundColor: accent, borderColor: accent },
                  isActive && { borderColor: accent },
                ]}
              />
              {i < TRACKER_STAGES.length - 1 && (
                <View style={[styles.trackerConnector, connectorTraveled && { backgroundColor: accent }]} />
              )}
            </View>
          );
        })}
      </View>
      <View style={styles.trackerLabelRow}>
        {TRACKER_STAGES.map((s) => (
          <Text
            key={s.key}
            style={[
              styles.trackerLabel,
              s.key === activeKey && { color: colors.ink, fontFamily: fonts.sansSemiBold },
            ]}
            numberOfLines={1}
          >
            {s.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

function ApplicationCard({
  entry,
  stageName,
  onPrepareInterview,
  onViewAssessment,
}: {
  entry: PipelineEntry;
  stageName: string | null;
  onPrepareInterview: () => void;
  onViewAssessment: () => void;
}) {
  const employer = allEmployers.find((e) => e.id === entry.employerId);
  const isInvited = entry.currentStageId !== null;
  const isScheduled = !!entry.interviewDate;
  const isCompleted = !!entry.stageCompletedAt;
  const decision = entry.decision;

  const accent = decision === "accepted" ? colors.verified : decision === "rejected" ? colors.alert : colors.terracotta;

  // Decision window only starts once HR has actually opened the profile — before that,
  // there's nothing yet to count down from.
  const decisionDeadline = entry.hrViewedAt
    ? new Date(new Date(entry.hrViewedAt).getTime() + DECISION_WINDOW_DAYS * 86400000)
    : null;
  const daysLeft = decisionDeadline
    ? Math.max(0, Math.ceil((decisionDeadline.getTime() - Date.now()) / 86400000))
    : null;

  return (
    <GlassCard radius={22}>
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <View style={[styles.employerBadge, { backgroundColor: `${accent}1A` }]}>
            <Text style={[styles.employerInitial, { color: accent }]}>{employer?.initial ?? "?"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.employerName}>{employer?.name ?? "Employer"}</Text>
            <Text style={styles.roleDetail} numberOfLines={1}>{entry.detail}</Text>
          </View>
          {decision && (
            <View style={[styles.decisionPill, { borderColor: accent }]}>
              {decision === "accepted" ? (
                <ThumbsUp size={11} color={accent} />
              ) : (
                <ThumbsDown size={11} color={accent} />
              )}
              <Text style={[styles.decisionPillText, { color: accent }]}>
                {decision === "accepted" ? "Accepted" : "Not this time"}
              </Text>
            </View>
          )}
        </View>

        <StageTracker entry={entry} accent={accent} />

        {/* Transparency timestamps — the Anti-Ghosting core: real events, not a black box. */}
        <View style={styles.transparencyBlock}>
          {entry.hrViewedAt && (
            <View style={styles.transparencyRow}>
              <Eye size={13} color={colors.slate} />
              <Text style={styles.transparencyText}>
                {employer?.name ?? "Employer"} viewed your profile {formatRelativeTime(entry.hrViewedAt)}
              </Text>
            </View>
          )}
          {daysLeft != null && !decision && (
            <View style={styles.transparencyRow}>
              <Clock size={13} color={daysLeft <= 1 ? colors.terracotta : colors.slate} />
              <Text style={[styles.transparencyText, daysLeft <= 1 && { color: colors.terracotta }]}>
                {daysLeft > 0
                  ? `Guaranteed decision window: ${daysLeft} day${daysLeft === 1 ? "" : "s"} left`
                  : "Decision window has closed — CREDO has flagged this for follow-up"}
              </Text>
            </View>
          )}
          {isInvited && (
            <View style={styles.transparencyRow}>
              <CalendarCheck size={13} color={colors.slate} />
              <Text style={styles.transparencyText}>
                {isCompleted
                  ? `${stageName} completed`
                  : isScheduled
                  ? `${stageName} scheduled — ${formatInterviewDateTime(entry.interviewDate!)}`
                  : `Invited to ${stageName} — awaiting scheduling`}
              </Text>
            </View>
          )}
        </View>

        {entry.meetingLink && isScheduled && !isCompleted && (
          <Pressable style={styles.meetingLink} onPress={() => Linking.openURL(entry.meetingLink!)}>
            <Video size={14} color={colors.ink} />
            <Text style={styles.meetingLinkText}>Join interview link</Text>
            <ExternalLink size={12} color={colors.slate} />
          </Pressable>
        )}

        {/* Quick actions — one tap to the tool that's actually relevant to this stage. */}
        {!decision && (
          <View style={styles.actionRow}>
            {isInvited && (
              <Pressable style={styles.actionBtn} onPress={onPrepareInterview}>
                <MessagesSquare size={13} color={colors.ink} />
                <Text style={styles.actionBtnText}>Prepare for interview</Text>
              </Pressable>
            )}
            {entry.simuHire && (
              <Pressable style={styles.actionBtn} onPress={onViewAssessment}>
                <FileStack size={13} color={colors.ink} />
                <Text style={styles.actionBtnText}>View assessment</Text>
              </Pressable>
            )}
          </View>
        )}

        {entry.lastTouchedAt && (
          <View style={styles.touchedBanner}>
            <RefreshCw size={12} color={colors.gold} />
            <Text style={styles.touchedBannerText}>
              {employer?.name ?? "Employer"} re-engaged you on {entry.lastTouchedAt}
              {entry.lastTouchMessage ? `: "${entry.lastTouchMessage}"` : ""}
            </Text>
          </View>
        )}
      </View>
    </GlassCard>
  );
}

export default function ApplicationStatusScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { pipelineForCandidate } = usePipeline();
  const { stagesForEmployer } = useInterviewStages();

  const entries = useMemo(
    () => (user ? pipelineForCandidate(user.id) : []),
    [user, pipelineForCandidate]
  );

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {entries.length === 0 ? (
            <GlassCard radius={20}>
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No applications yet</Text>
                <Text style={styles.emptyBody}>
                  Once an employer reviews your profile, real-time status — invitations, interview
                  scheduling, and decisions — will show up here as it happens.
                </Text>
              </View>
            </GlassCard>
          ) : (
            entries.map((entry) => (
              <ApplicationCard
                key={entry.id}
                entry={entry}
                stageName={
                  entry.currentStageId
                    ? stagesForEmployer(entry.employerId).find((s) => s.id === entry.currentStageId)?.name ??
                      entry.currentStageId
                    : null
                }
                onPrepareInterview={() => navigation.navigate("SimuHire")}
                onViewAssessment={() => navigation.navigate("SimuHire")}
              />
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingTop: 12, paddingBottom: 110, gap: 14 },

  card: { padding: 18, gap: 16 },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  employerBadge: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  employerInitial: { fontFamily: fonts.displayBold, fontSize: 15 },
  employerName: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink },
  roleDetail: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.slate, marginTop: 1 },
  decisionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 100,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  decisionPillText: { fontFamily: fonts.mono, fontSize: 10 },

  tracker: { gap: 8 },
  trackerRow: { flexDirection: "row", alignItems: "center" },
  trackerNode: { flexDirection: "row", alignItems: "center", flex: 1 },
  trackerDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(16,25,43,0.15)",
    backgroundColor: "transparent",
  },
  trackerConnector: { flex: 1, height: 2, backgroundColor: "rgba(16,25,43,0.1)" },
  trackerLabelRow: { flexDirection: "row" },
  trackerLabel: {
    flex: 1,
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.slate,
    textAlign: "left",
  },

  transparencyBlock: { gap: 8, paddingTop: 2 },
  transparencyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  transparencyText: { flex: 1, fontFamily: fonts.sans, fontSize: 12.5, color: colors.ink, lineHeight: 17 },

  meetingLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    backgroundColor: "rgba(47,110,143,0.08)",
  },
  meetingLinkText: { flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink },

  actionRow: { flexDirection: "row", gap: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.12)",
    borderRadius: 12,
    paddingVertical: 10,
  },
  actionBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.ink },

  touchedBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 12,
    padding: 12,
    backgroundColor: "rgba(201,166,70,0.1)",
  },
  touchedBannerText: { flex: 1, fontFamily: fonts.sans, fontSize: 12, color: colors.ink, lineHeight: 17 },

  emptyCard: { padding: 24, gap: 8, alignItems: "center" },
  emptyTitle: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.ink },
  emptyBody: { fontFamily: fonts.sans, fontSize: 13, color: colors.slate, textAlign: "center", lineHeight: 19 },
});
