import { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Send, RefreshCw, Check, CalendarPlus, CalendarCheck, Settings, ThumbsUp, ThumbsDown, X } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { STAGE_META, sortPipelineForAttention, type PipelineEntry } from "../../data/employerData";
import type { DiscoverCandidate } from "../../data/employerData";
import { mockCandidates } from "../../data/mockData";
import { usePipeline } from "../../context/PipelineContext";
import { useInterviewStages } from "../../context/InterviewStagesContext";
import { getUpcomingInterviewSlots, formatInterviewDateTime } from "../../utils/interviewSlots";
import { defaultAcceptMessage, defaultRejectMessage } from "../../utils/decisionMessages";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { PipelineStackParamList } from "../../navigation/PipelineStack";

type Props = NativeStackScreenProps<PipelineStackParamList, "PipelineMain">;

function buildCandidate(e: PipelineEntry): DiscoverCandidate {
  const full = mockCandidates.find((c) => c.id === e.candidateId);
  return {
    ...(full ?? {
      id: e.id,
      name: e.name,
      email: "",
      field: e.field,
      university: "",
      year: "",
      location: "",
      openToWork: false,
      avatar: null,
      bio: "",
      linkedinUrl: null,
      githubUrl: null,
      trustScore: e.trustScore,
      verifiedSkills: [],
      claimedSkills: [],
      simuHire: { completed: false, shared: false },
      artifacts: [],
      ledger: [],
      merkleRoot: null,
    }),
    trajectory: e.detail,
  };
}

// Light-touch default: references the reason logged on the entry rather than repeating a
// hard "are you available now" invite — re-engagement is meant to read as low-pressure.
function buildLightTouchMessage(entry: PipelineEntry): string {
  const firstName = entry.name.split(" ")[0];
  return `Hi ${firstName} — it's been a while since we last spoke. Wanted to check in and see if the timing might be better now. No pressure either way — always happy to reconnect when it works for you.`;
}

export default function PipelineScreen({ navigation }: Props) {
  const { pipeline, reEngage, markInterviewInvited, scheduleInterview, advanceStage, completeInterview, recordDecision } =
    usePipeline();
  const { stages } = useInterviewStages();
  const [composingId, setComposingId] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [selectedSlotIso, setSelectedSlotIso] = useState<string | null>(null);
  const upcomingSlots = useMemo(() => getUpcomingInterviewSlots(), []);
  // E8 — engaged/open-to-work candidates resurface to the top instead of sitting wherever
  // they landed; decided (accepted/rejected) candidates sink to the bottom.
  const sortedPipeline = useMemo(() => sortPipelineForAttention(pipeline), [pipeline]);
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [decidingAs, setDecidingAs] = useState<"accepted" | "rejected" | null>(null);
  const [decisionDraft, setDecisionDraft] = useState("");

  const startDeciding = (entry: PipelineEntry, decision: "accepted" | "rejected") => {
    setDecidingId(entry.id);
    setDecidingAs(decision);
    setDecisionDraft(decision === "accepted" ? defaultAcceptMessage(entry.name) : defaultRejectMessage(entry.name));
  };
  const cancelDeciding = () => {
    setDecidingId(null);
    setDecidingAs(null);
    setDecisionDraft("");
  };
  const confirmDecision = (entry: PipelineEntry) => {
    if (!decidingAs || !decisionDraft.trim()) return;
    recordDecision(entry.id, decidingAs, decisionDraft);
    setDecidingId(null);
    setDecidingAs(null);
    setDecisionDraft("");
  };

  const startComposing = (entry: PipelineEntry) => {
    setComposingId(entry.id);
    setDraftMessage(buildLightTouchMessage(entry));
  };

  const cancelComposing = () => {
    setComposingId(null);
    setDraftMessage("");
  };

  const sendTouch = (entry: PipelineEntry) => {
    reEngage(entry.id, draftMessage);
    setComposingId(null);
    setDraftMessage("");
  };

  const startScheduling = (entry: PipelineEntry) => {
    setSchedulingId(entry.id);
    setSelectedSlotIso(null);
  };

  const cancelScheduling = () => {
    setSchedulingId(null);
    setSelectedSlotIso(null);
  };

  const confirmSchedule = (entry: PipelineEntry) => {
    if (!selectedSlotIso) return;
    scheduleInterview(entry.id, selectedSlotIso);
    setSchedulingId(null);
    setSelectedSlotIso(null);
  };

  const interviewSummary = {
    awaitingScheduling: pipeline.filter((e) => e.currentStageId !== null && !e.interviewDate && !e.stageCompletedAt).length,
    scheduled: pipeline.filter((e) => e.currentStageId !== null && e.interviewDate && !e.stageCompletedAt).length,
    completed: pipeline.filter((e) => !!e.stageCompletedAt).length,
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.headingRow}>
            <View>
              <Text style={styles.heading}>Pipeline</Text>
              <Text style={styles.subheading}>SimuHire reviews, interviews & re-engagement — behavioral evidence before the first interview.</Text>
            </View>
            <Pressable onPress={() => navigation.navigate("StageSettings")} style={styles.settingsBtn}>
              <Settings size={16} color={colors.ink} />
            </Pressable>
          </View>

          {/* E9 — aggregate interview status, so the "who's where" question doesn't require
              scrolling every card individually. */}
          {(interviewSummary.awaitingScheduling > 0 || interviewSummary.scheduled > 0 || interviewSummary.completed > 0) && (
            <View style={styles.summaryRow}>
              {interviewSummary.awaitingScheduling > 0 && (
                <Text style={styles.summaryItem}>{interviewSummary.awaitingScheduling} awaiting scheduling</Text>
              )}
              {interviewSummary.scheduled > 0 && (
                <Text style={styles.summaryItem}>{interviewSummary.scheduled} scheduled</Text>
              )}
              {interviewSummary.completed > 0 && (
                <Text style={styles.summaryItem}>{interviewSummary.completed} completed</Text>
              )}
            </View>
          )}

          <View style={{ gap: 12, marginTop: 8 }}>
            {sortedPipeline.map((e) => {
              const stage = STAGE_META[e.stage];
              const initials = e.name.split(" ").map((n) => n[0]).join("");
              const isComposing = composingId === e.id;
              const isTouched = e.stage === "re_engage" && !!e.lastTouchedAt;

              // E9 — round name is employer-configured data (Settings), not a fixed enum;
              // stageIndex placement decides whether the next action advances to another
              // round or completes the whole process.
              const roundIndex = stages.findIndex((s) => s.id === e.currentStageId);
              const roundName = stages[roundIndex]?.name;
              const isLastRound = roundIndex === stages.length - 1;
              const interviewColor = e.stageCompletedAt
                ? colors.verified
                : e.currentStageId === null
                ? colors.slate
                : e.interviewDate
                ? "#2F6E8F"
                : colors.pending;
              const interviewLabel = e.stageCompletedAt
                ? `${roundName} · Completed`
                : e.currentStageId === null
                ? "Not invited"
                : e.interviewDate
                ? `${roundName} · ${formatInterviewDateTime(e.interviewDate)}`
                : `${roundName} · Awaiting scheduling`;

              const openProfile = () => navigation.navigate("CandidateProfile", { candidate: buildCandidate(e) });

              // Why this card resurfaced to the top — visible, not a silent reorder.
              const attentionReasons = !e.decision
                ? [e.openToWork && "Open to work", e.lastTouchedAt && "Re-engaged"].filter(Boolean).join(" · ")
                : "";

              return (
                <GlassCard key={e.id} radius={20}>
                  <View style={styles.card}>
                    <View style={styles.head}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initials}</Text>
                      </View>
                      <Pressable style={{ flex: 1 }} onPress={openProfile}>
                        <Text style={styles.name}>{e.name}</Text>
                        <Text style={styles.meta}>{e.field} · Trust {e.trustScore}</Text>
                      </Pressable>
                      <View style={[styles.stagePill, { borderColor: stage.color }]}>
                        <Text style={[styles.stageText, { color: stage.color }]}>{stage.label}</Text>
                      </View>
                    </View>

                    {attentionReasons !== "" && (
                      <View style={styles.attentionBadge}>
                        <Text style={styles.attentionBadgeText}>↑ {attentionReasons}</Text>
                      </View>
                    )}

                    <Text style={styles.detail}>{e.detail}</Text>

                    {e.stage !== "re_engage" ? null : isComposing ? (
                      <View style={{ gap: 8 }}>
                        <GlassCard radius={14}>
                          <TextInput
                            style={styles.composeInput}
                            value={draftMessage}
                            onChangeText={setDraftMessage}
                            placeholder="Write a light-touch message…"
                            placeholderTextColor={colors.slate}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                          />
                        </GlassCard>
                        <View style={styles.composeRow}>
                          <Pressable style={styles.composeCancel} onPress={cancelComposing}>
                            <Text style={styles.composeCancelText}>Cancel</Text>
                          </Pressable>
                          <Pressable
                            style={[styles.composeSend, !draftMessage.trim() && styles.composeSendDisabled]}
                            onPress={() => sendTouch(e)}
                            disabled={!draftMessage.trim()}
                          >
                            <Send size={13} color={colors.parchment} />
                            <Text style={styles.composeSendText}>Send</Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : isTouched ? (
                      <View style={styles.touchedRow}>
                        <Check size={14} color={colors.verified} strokeWidth={2.5} />
                        <Text style={styles.touchedText}>Touched {e.lastTouchedAt} — following up in your own time</Text>
                      </View>
                    ) : (
                      <Pressable style={styles.action} onPress={() => startComposing(e)}>
                        <RefreshCw size={14} color={colors.ink} />
                        <Text style={styles.actionText}>Re-engage</Text>
                      </Pressable>
                    )}

                    {/* E9 Interview Invitation — orthogonal to the stage action above; a
                        candidate can be e.g. "Shortlisted" and mid-way through the round
                        sequence at once. Round names come from Settings, not a fixed enum. */}
                    <View style={styles.interviewBlock}>
                      <View style={styles.interviewHead}>
                        <View style={[styles.interviewDot, { backgroundColor: interviewColor }]} />
                        <Text style={[styles.interviewLabel, { color: interviewColor }]}>{interviewLabel}</Text>
                      </View>

                      {schedulingId === e.id ? (
                        <View style={{ gap: 8, marginTop: 8 }}>
                          <View style={styles.slotGrid}>
                            {upcomingSlots.map((slot) => {
                              const selected = selectedSlotIso === slot.iso;
                              return (
                                <Pressable
                                  key={slot.iso}
                                  style={[styles.slotChip, selected && styles.slotChipSelected]}
                                  onPress={() => setSelectedSlotIso(slot.iso)}
                                >
                                  <Text style={[styles.slotChipText, selected && styles.slotChipTextSelected]}>
                                    {slot.label}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </View>
                          <View style={styles.composeRow}>
                            <Pressable style={styles.composeCancel} onPress={cancelScheduling}>
                              <Text style={styles.composeCancelText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                              style={[styles.composeSend, !selectedSlotIso && styles.composeSendDisabled]}
                              onPress={() => confirmSchedule(e)}
                              disabled={!selectedSlotIso}
                            >
                              <CalendarCheck size={13} color={colors.parchment} />
                              <Text style={styles.composeSendText}>Confirm</Text>
                            </Pressable>
                          </View>
                        </View>
                      ) : e.currentStageId === null ? (
                        <Pressable
                          style={styles.interviewAction}
                          onPress={() => stages[0] && markInterviewInvited(e.id, stages[0].id)}
                          disabled={stages.length === 0}
                        >
                          <Send size={14} color={colors.ink} />
                          <Text style={styles.interviewActionText}>Invite to Interview</Text>
                        </Pressable>
                      ) : e.stageCompletedAt ? null : !e.interviewDate ? (
                        <Pressable style={styles.interviewAction} onPress={() => startScheduling(e)}>
                          <CalendarPlus size={14} color={colors.ink} />
                          <Text style={styles.interviewActionText}>Mark scheduled</Text>
                        </Pressable>
                      ) : isLastRound ? (
                        <Pressable style={styles.interviewAction} onPress={() => completeInterview(e.id)}>
                          <CalendarCheck size={14} color={colors.ink} />
                          <Text style={styles.interviewActionText}>Mark completed</Text>
                        </Pressable>
                      ) : (
                        stages[roundIndex + 1] && (
                          <Pressable
                            style={styles.interviewAction}
                            onPress={() => advanceStage(e.id, stages[roundIndex + 1].id)}
                          >
                            <CalendarCheck size={14} color={colors.ink} />
                            <Text style={styles.interviewActionText}>Advance to {stages[roundIndex + 1].name}</Text>
                          </Pressable>
                        )
                      )}
                    </View>

                    {/* E-Decision — offered once a candidate is actually in the interview
                        process (any round, not only after the last one), right here on the
                        card so an employer never has to open a profile just to decide. */}
                    {e.decision ? (
                      <View
                        style={[
                          styles.decisionBadge,
                          { borderColor: e.decision === "accepted" ? colors.verified : colors.alert },
                        ]}
                      >
                        <Text
                          style={[
                            styles.decisionBadgeText,
                            { color: e.decision === "accepted" ? colors.verified : colors.alert },
                          ]}
                        >
                          {e.decision === "accepted" ? "✓ Accepted" : "✕ Rejected"}
                        </Text>
                      </View>
                    ) : e.currentStageId !== null ? (
                      decidingId === e.id ? (
                        <View style={{ gap: 8, marginTop: 8 }}>
                          <GlassCard radius={14}>
                            <TextInput
                              style={styles.decisionInput}
                              value={decisionDraft}
                              onChangeText={setDecisionDraft}
                              multiline
                              numberOfLines={3}
                              textAlignVertical="top"
                            />
                          </GlassCard>
                          <View style={styles.composeRow}>
                            <Pressable style={styles.composeCancel} onPress={cancelDeciding}>
                              <X size={13} color={colors.ink} />
                              <Text style={styles.composeCancelText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                              style={[
                                styles.composeSend,
                                { backgroundColor: decidingAs === "accepted" ? colors.verified : colors.alert },
                                !decisionDraft.trim() && styles.composeSendDisabled,
                              ]}
                              onPress={() => confirmDecision(e)}
                              disabled={!decisionDraft.trim()}
                            >
                              <Text style={styles.composeSendText}>
                                {decidingAs === "accepted" ? "Send acceptance" : "Send rejection"}
                              </Text>
                            </Pressable>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.decisionRow}>
                          <Pressable style={styles.acceptBtn} onPress={() => startDeciding(e, "accepted")}>
                            <ThumbsUp size={13} color={colors.verified} />
                            <Text style={styles.acceptBtnText}>Accept</Text>
                          </Pressable>
                          <Pressable style={styles.rejectBtn} onPress={() => startDeciding(e, "rejected")}>
                            <ThumbsDown size={13} color={colors.alert} />
                            <Text style={styles.rejectBtnText}>Reject</Text>
                          </Pressable>
                        </View>
                      )
                    ) : null}
                  </View>
                </GlassCard>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 110, gap: 6 },
  headingRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  heading: { fontFamily: fonts.displayBold, fontSize: 28, color: colors.ink, marginTop: 4 },
  subheading: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, marginTop: 4, lineHeight: 17, flexShrink: 1 },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },

  card: { padding: 16, gap: 10 },
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(16,25,43,0.06)", alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: fonts.displayBold, fontSize: 14, color: colors.ink },
  name: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink },
  meta: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate, marginTop: 1 },
  stagePill: { borderWidth: 1, borderRadius: 100, paddingVertical: 3, paddingHorizontal: 9 },
  stageText: { fontFamily: fonts.mono, fontSize: 10 },
  detail: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.slate, lineHeight: 18 },
  attentionBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(217,164,65,0.14)",
    borderRadius: 100,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  attentionBadgeText: { fontFamily: fonts.mono, fontSize: 10, color: colors.pending },
  action: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "rgba(16,25,43,0.06)",
    borderRadius: 12,
    paddingVertical: 11,
  },
  actionText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink },

  composeInput: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink, padding: 12, minHeight: 84 },
  composeRow: { flexDirection: "row", gap: 8 },
  composeCancel: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 11,
    backgroundColor: "rgba(16,25,43,0.06)",
  },
  composeCancelText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink },
  composeSend: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 12,
    paddingVertical: 11,
    backgroundColor: colors.ink,
  },
  composeSendDisabled: { opacity: 0.4 },
  composeSendText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.parchment },

  touchedRow: { flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 11 },
  touchedText: { flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.verified },

  summaryRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 },
  summaryItem: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate },

  interviewBlock: { borderTopWidth: 1, borderTopColor: "rgba(16,25,43,0.08)", paddingTop: 10, marginTop: 2 },
  decisionBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 100,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  decisionBadgeText: { fontFamily: fonts.mono, fontSize: 10.5 },
  decisionInput: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink, padding: 12, minHeight: 72 },
  decisionRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  acceptBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.verified,
    borderRadius: 12,
    paddingVertical: 10,
  },
  acceptBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.verified },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.alert,
    borderRadius: 12,
    paddingVertical: 10,
  },
  rejectBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.alert },
  interviewHead: { flexDirection: "row", alignItems: "center", gap: 7 },
  interviewDot: { width: 7, height: 7, borderRadius: 3.5 },
  interviewLabel: { fontFamily: fonts.mono, fontSize: 11 },
  interviewAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.12)",
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  interviewActionText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.ink },
  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slotChip: {
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.12)",
    borderRadius: 100,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  slotChipSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  slotChipText: { fontFamily: fonts.mono, fontSize: 11, color: colors.ink },
  slotChipTextSelected: { color: colors.parchment },
});
