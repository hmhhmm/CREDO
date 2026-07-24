import { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MapPin, TrendingUp, Check, Award, FileText, Send, ThumbsUp, ThumbsDown, X } from "lucide-react-native";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import GitHubIcon from "../../components/GitHubIcon";
import { getConfidenceBand } from "../../utils/confidenceBand";
import { usePipeline } from "../../context/PipelineContext";
import { useInterviewStages } from "../../context/InterviewStagesContext";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { DiscoverCandidate } from "../../data/employerData";
import type { Artifact } from "../../data/types";

type Props = { route: { params: { candidate: DiscoverCandidate } }; navigation?: unknown };

// The specific proof behind an artifact's confidence score — commit/complexity for GitHub,
// issuer/name-match for credentials, AI-probability/writing-complexity for documents. Reads
// straight from the same metadata VerifyPage's ArtifactCard shows on the candidate side, so
// the employer sees the same evidence the candidate's own verification produced.
function artifactDetailLine(a: Artifact): string {
  const m = a.metadata as Record<string, unknown>;
  switch (a.type) {
    case "github":
      return `${m.commits ?? "—"} commits · ${m.complexity ?? "—"} complexity · ${m.flags ?? 0} flags`;
    case "credential":
      return `${m.issuer ?? "Unknown issuer"} · name match ${m.nameMatch ? "confirmed" : "not confirmed"}`;
    case "document":
      return `${m.aiProbability ?? "—"}% AI-probability · ${m.writingComplexity ?? "—"} writing complexity`;
    default:
      return "";
  }
}

function ArtifactTypeIcon({ type, size, color }: { type: Artifact["type"]; size: number; color: string }) {
  if (type === "github") return <GitHubIcon size={size} color={color} />;
  if (type === "credential") return <Award size={size} color={color} strokeWidth={2.5} />;
  return <FileText size={size} color={color} strokeWidth={2.5} />;
}

const DIMENSION_LABELS: Record<string, string> = {
  adaptability: "Adaptability",
  communication: "Communication",
  problemSolving: "Problem Solving",
  stressResponse: "Stress Response",
  systemsThinking: "Systems Thinking",
};

const DIMENSION_KEYS = ["adaptability", "communication", "problemSolving", "stressResponse", "systemsThinking"] as const;

// Default templates — always editable before sending, never forced verbatim.
function defaultAcceptMessage(name: string): string {
  const firstName = name.split(" ")[0];
  return `Hi ${firstName} — great news! We'd like to move forward and extend you an offer. We'll follow up shortly with next steps.`;
}
function defaultRejectMessage(name: string): string {
  const firstName = name.split(" ")[0];
  return `Hi ${firstName} — thank you for the time you put into interviewing with us. After careful consideration, we've decided to move forward with other candidates. We wish you the best in your search.`;
}

export default function CandidateProfileScreen({ route }: Props) {
  const { candidate: c } = route.params;
  const { pipeline, inviteToInterview, recordDecision } = usePipeline();
  const { stages } = useInterviewStages();
  const [decidingAs, setDecidingAs] = useState<"accepted" | "rejected" | null>(null);
  const [decisionDraft, setDecisionDraft] = useState("");

  // Derived from the shared pipeline, not local state — so status set from here shows up
  // in Pipeline too, and status set in Pipeline (or via a prior visit to this profile)
  // shows up here, instead of two disconnected "invited" flags going out of sync.
  const entry = pipeline.find((p) => p.candidateId === c.id);
  const currentStageId = entry?.currentStageId ?? null;
  const currentStageName = stages.find((s) => s.id === currentStageId)?.name;

  const startDeciding = (decision: "accepted" | "rejected") => {
    setDecidingAs(decision);
    setDecisionDraft(decision === "accepted" ? defaultAcceptMessage(c.name) : defaultRejectMessage(c.name));
  };
  const cancelDeciding = () => {
    setDecidingAs(null);
    setDecisionDraft("");
  };
  const confirmDecision = () => {
    if (!entry || !decidingAs || !decisionDraft.trim()) return;
    recordDecision(entry.id, decidingAs, decisionDraft);
    setDecidingAs(null);
    setDecisionDraft("");
  };

  const band = getConfidenceBand(c.trustScore);
  const initials = c.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  const simuHire = c.simuHire;

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header block */}
          <GlassCard radius={22}>
            <View style={styles.headerBlock}>
              <View style={styles.headerTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={styles.headerInfo}>
                  <Text style={styles.name}>{c.name}</Text>
                  <Text style={styles.fieldMeta} numberOfLines={1}>
                    {c.field} · {c.university}
                  </Text>
                  {c.location ? (
                    <View style={styles.locationRow}>
                      <MapPin size={12} color={colors.slate} />
                      <Text style={styles.locationText}>{c.location}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={[styles.trustRing, { borderColor: band.hex }]}>
                  <Text style={[styles.trustScore, { color: band.hex }]}>{c.trustScore}</Text>
                </View>
              </View>
              {c.openToWork && (
                <View style={styles.openPill}>
                  <Text style={styles.openPillText}>Open to work</Text>
                </View>
              )}
            </View>
          </GlassCard>

          {/* Verified skills */}
          <GlassCard radius={18}>
            <View style={styles.block}>
              <Text style={styles.blockTitle}>Verified Skills</Text>
              {c.verifiedSkills.length > 0 ? (
                <View style={styles.skillsList}>
                  {c.verifiedSkills.map((s) => (
                    <View key={s.name} style={styles.skillRow}>
                      <Text style={styles.skillName}>{s.name}</Text>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${s.confidence}%` }]} />
                      </View>
                      <Text style={styles.skillConfidence}>{s.confidence}%</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptySlate}>No verified skills yet</Text>
              )}
            </View>
          </GlassCard>

          {/* Claimed skills — only if present */}
          {c.claimedSkills && c.claimedSkills.length > 0 && (
            <GlassCard radius={18}>
              <View style={styles.block}>
                <Text style={styles.blockTitle}>Also claims</Text>
                <View style={styles.chipRow}>
                  {c.claimedSkills.map((skill) => (
                    <View key={skill} style={styles.claimedChip}>
                      <Text style={styles.claimedChipText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </GlassCard>
          )}

          {/* Evidence — the specific proof behind the verified-skill scores above */}
          {c.artifacts.some((a) => a.status === "verified") && (
            <GlassCard radius={18}>
              <View style={styles.block}>
                <Text style={styles.blockTitle}>Evidence</Text>
                <View style={{ gap: 12 }}>
                  {c.artifacts
                    .filter((a) => a.status === "verified")
                    .map((a) => (
                      <View key={a.id} style={styles.evidenceRow}>
                        <View style={styles.evidenceIcon}>
                          <ArtifactTypeIcon type={a.type} size={14} color={colors.ink} />
                        </View>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={styles.evidenceName}>{a.name}</Text>
                          <Text style={styles.evidenceDetail}>{artifactDetailLine(a)}</Text>
                        </View>
                        <Text style={styles.evidenceConfidence}>{a.confidence}%</Text>
                      </View>
                    ))}
                </View>
              </View>
            </GlassCard>
          )}

          {/* SimuHire block */}
          <GlassCard radius={18}>
            <View style={styles.block}>
              {simuHire.completed && simuHire.shared ? (
                <>
                  <View style={styles.simuHireHeader}>
                    <Text style={styles.blockTitle}>
                      SimuHire{simuHire.type ? ` · ${simuHire.type}` : ""}
                    </Text>
                    <View style={[styles.scoreBadge, { backgroundColor: "rgba(31,122,92,0.12)" }]}>
                      <Text style={[styles.scoreBadgeText, { color: colors.verified }]}>
                        {simuHire.overallScore ?? "—"}/100
                      </Text>
                    </View>
                  </View>
                  {simuHire.dimensions && (
                    <View style={styles.dimensionsList}>
                      {DIMENSION_KEYS.map((key) => {
                        const score = (simuHire.dimensions as Record<string, number>)[key] ?? 0;
                        return (
                          <View key={key} style={styles.dimensionRow}>
                            <Text style={styles.dimensionLabel}>{DIMENSION_LABELS[key]}</Text>
                            <View style={styles.dimensionBarTrack}>
                              <View style={[styles.dimensionBarFill, { width: `${score}%` }]} />
                            </View>
                            <Text style={styles.dimensionScore}>{score}</Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </>
              ) : simuHire.completed && !simuHire.shared ? (
                <Text style={styles.emptySlate}>SimuHire completed — candidate chose to keep private</Text>
              ) : (
                <Text style={styles.emptySlate}>SimuHire not yet completed</Text>
              )}
            </View>
          </GlassCard>

          {/* Trajectory block */}
          {"trajectory" in c && typeof c.trajectory === "string" && (
            <GlassCard radius={18}>
              <View style={styles.trajBlock}>
                <TrendingUp size={14} color={colors.gold} />
                <Text style={styles.trajText}>{c.trajectory}</Text>
              </View>
            </GlassCard>
          )}

          {/* Bottom action — E9 Interview Invitation. SimuHire is compulsory now, so there's
              nothing to invite the candidate to at this stage; the action here is the human
              interview, tracked further in Pipeline. */}
          {currentStageId === null ? (
            <Pressable
              style={styles.inviteBtn}
              onPress={() => stages[0] && inviteToInterview(c, stages[0].id)}
              disabled={stages.length === 0}
            >
              <Send size={15} color={colors.parchment} />
              <Text style={styles.inviteBtnText}>Invite to Interview</Text>
            </Pressable>
          ) : (
            <View style={styles.invitedRow}>
              <Check size={16} color={colors.verified} strokeWidth={2.5} />
              <Text style={styles.invitedText}>{currentStageName ?? "In interview process"}</Text>
            </View>
          )}

          {/* E-Decision — only offered once the candidate is actually in the interview
              process; an employer can accept/reject mid-process, not only after the last
              round. Message is always editable before sending, default or custom. */}
          {entry && currentStageId !== null && (
            entry.decision ? (
              <View
                style={[
                  styles.decisionResult,
                  { borderColor: entry.decision === "accepted" ? colors.verified : colors.alert },
                ]}
              >
                {entry.decision === "accepted" ? (
                  <ThumbsUp size={15} color={colors.verified} />
                ) : (
                  <ThumbsDown size={15} color={colors.alert} />
                )}
                <View style={{ flex: 1, gap: 2 }}>
                  <Text
                    style={[
                      styles.decisionResultTitle,
                      { color: entry.decision === "accepted" ? colors.verified : colors.alert },
                    ]}
                  >
                    {entry.decision === "accepted" ? "Accepted" : "Rejected"}
                  </Text>
                  {entry.decisionMessage && <Text style={styles.decisionResultMessage}>{entry.decisionMessage}</Text>}
                </View>
              </View>
            ) : decidingAs ? (
              <View style={{ gap: 8 }}>
                <GlassCard radius={14}>
                  <TextInput
                    style={styles.decisionInput}
                    value={decisionDraft}
                    onChangeText={setDecisionDraft}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </GlassCard>
                <View style={styles.decisionComposeRow}>
                  <Pressable style={styles.decisionCancelBtn} onPress={cancelDeciding}>
                    <X size={14} color={colors.ink} />
                    <Text style={styles.decisionCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.decisionSendBtn,
                      { backgroundColor: decidingAs === "accepted" ? colors.verified : colors.alert },
                      !decisionDraft.trim() && styles.decisionSendDisabled,
                    ]}
                    onPress={confirmDecision}
                    disabled={!decisionDraft.trim()}
                  >
                    <Text style={styles.decisionSendText}>
                      {decidingAs === "accepted" ? "Send acceptance" : "Send rejection"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.decisionRow}>
                <Pressable style={styles.acceptBtn} onPress={() => startDeciding("accepted")}>
                  <ThumbsUp size={15} color={colors.verified} />
                  <Text style={styles.acceptBtnText}>Accept</Text>
                </Pressable>
                <Pressable style={styles.rejectBtn} onPress={() => startDeciding("rejected")}>
                  <ThumbsDown size={15} color={colors.alert} />
                  <Text style={styles.rejectBtnText}>Reject</Text>
                </Pressable>
              </View>
            )
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40, gap: 14 },

  // Header block
  headerBlock: { padding: 20, gap: 12 },
  headerTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(16,25,43,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.ink },
  headerInfo: { flex: 1, gap: 3 },
  name: { fontFamily: fonts.displayBold, fontSize: 24, color: colors.ink },
  fieldMeta: { fontFamily: fonts.sans, fontSize: 13, color: colors.slate },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  locationText: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate },
  trustRing: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  trustScore: { fontFamily: fonts.mono, fontSize: 13 },
  openPill: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.verified,
    borderRadius: 100,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  openPillText: { fontFamily: fonts.mono, fontSize: 11, color: colors.verified },

  // Shared block chrome
  block: { padding: 18, gap: 12 },
  blockTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink },
  emptySlate: { fontFamily: fonts.sans, fontSize: 13, color: colors.slate },

  // Verified skills bars
  skillsList: { gap: 10 },
  skillRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  skillName: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink, width: 110 },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(16,25,43,0.08)",
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: { height: 6, backgroundColor: colors.verified, borderRadius: 3 },
  skillConfidence: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate, width: 34, textAlign: "right" },

  // Claimed skill chips
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  claimedChip: {
    borderWidth: 1,
    borderColor: colors.slate,
    borderRadius: 100,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  claimedChipText: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate },

  // Evidence — per-artifact proof
  evidenceRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  evidenceIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(16,25,43,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  evidenceName: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink },
  evidenceDetail: { fontFamily: fonts.mono, fontSize: 10.5, color: colors.slate },
  evidenceConfidence: { fontFamily: fonts.mono, fontSize: 12, color: colors.verified },

  // SimuHire
  simuHireHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  scoreBadge: { borderRadius: 100, paddingVertical: 4, paddingHorizontal: 10 },
  scoreBadgeText: { fontFamily: fonts.mono, fontSize: 12 },
  dimensionsList: { gap: 10 },
  dimensionRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dimensionLabel: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, width: 110 },
  dimensionBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(16,25,43,0.08)",
    borderRadius: 3,
    overflow: "hidden",
  },
  dimensionBarFill: { height: 6, backgroundColor: colors.verified, borderRadius: 3 },
  dimensionScore: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate, width: 24, textAlign: "right" },

  // Trajectory
  trajBlock: { flexDirection: "row", alignItems: "flex-start", padding: 18, gap: 10 },
  trajText: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.slate, lineHeight: 18 },

  // Bottom action
  inviteBtn: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: colors.ink,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  inviteBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.parchment },
  invitedRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16 },
  invitedText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.verified },

  decisionRow: { flexDirection: "row", gap: 10 },
  acceptBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderWidth: 1.5,
    borderColor: colors.verified,
    borderRadius: 16,
    paddingVertical: 14,
  },
  acceptBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.verified },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderWidth: 1.5,
    borderColor: colors.alert,
    borderRadius: 16,
    paddingVertical: 14,
  },
  rejectBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.alert },

  decisionInput: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink, padding: 14, minHeight: 96 },
  decisionComposeRow: { flexDirection: "row", gap: 8 },
  decisionCancelBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 16,
    paddingVertical: 14,
    backgroundColor: "rgba(16,25,43,0.06)",
  },
  decisionCancelText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  decisionSendBtn: { flex: 2, alignItems: "center", justifyContent: "center", borderRadius: 16, paddingVertical: 14 },
  decisionSendDisabled: { opacity: 0.4 },
  decisionSendText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.parchment },

  decisionResult: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderWidth: 1, borderRadius: 16, padding: 16 },
  decisionResultTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
  decisionResultMessage: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.slate, lineHeight: 18 },
});
