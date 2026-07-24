import { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MapPin, TrendingUp, Check, Award, FileText, Send, ThumbsUp, ThumbsDown, Star, GraduationCap } from "lucide-react-native";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import GitHubIcon from "../../components/GitHubIcon";
import { getConfidenceBand } from "../../utils/confidenceBand";
import { usePipeline } from "../../context/PipelineContext";
import { useInterviewStages } from "../../context/InterviewStagesContext";
import { useSkillFeedback } from "../../context/SkillFeedbackContext";
import { useAuth } from "../../context/AuthContext";
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

export default function CandidateProfileScreen({ route }: Props) {
  const { candidate: c } = route.params;
  const { pipeline, inviteToInterview, setRating, addComment } = usePipeline();
  const { stages } = useInterviewStages();
  const { submitFeedback } = useSkillFeedback();
  const { user } = useAuth();
  const [commentDraft, setCommentDraft] = useState("");
  const [feedbackSkill, setFeedbackSkill] = useState<string | null>(null);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Derived from the shared pipeline, not local state — so status set from here shows up
  // in Pipeline too, and status set in Pipeline (or via a prior visit to this profile)
  // shows up here, instead of two disconnected "invited" flags going out of sync.
  const entry = pipeline.find((p) => p.candidateId === c.id);
  const currentStageId = entry?.currentStageId ?? null;
  const currentStageName = stages.find((s) => s.id === currentStageId)?.name;

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

          {/* HR rating + comments — capture-and-display only; only makes sense once the
              candidate is actually being evaluated (already invited to interview). */}
          {entry && (
            <GlassCard radius={18}>
              <View style={styles.block}>
                <Text style={styles.blockTitle}>HR Notes</Text>

                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Pressable key={n} onPress={() => setRating(entry.id, n)} hitSlop={6}>
                      <Star
                        size={22}
                        color={colors.gold}
                        fill={(entry.hrRating ?? 0) >= n ? colors.gold : "transparent"}
                        strokeWidth={1.5}
                      />
                    </Pressable>
                  ))}
                </View>

                {(entry.hrComments ?? []).length > 0 && (
                  <View style={styles.commentList}>
                    {entry.hrComments!.map((cm) => (
                      <View key={cm.id} style={styles.commentRow}>
                        <View style={styles.commentHead}>
                          <Text style={styles.commentAuthor}>{cm.author}</Text>
                          <Text style={styles.commentDate}>{cm.date}</Text>
                        </View>
                        <Text style={styles.commentText}>{cm.text}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.commentComposeRow}>
                  <TextInput
                    style={styles.commentInput}
                    value={commentDraft}
                    onChangeText={setCommentDraft}
                    placeholder="Add a note about this candidate…"
                    placeholderTextColor={colors.slate}
                    multiline
                  />
                  <Pressable
                    style={[styles.commentSendBtn, !commentDraft.trim() && styles.commentSendBtnDisabled]}
                    onPress={() => {
                      addComment(entry.id, commentDraft);
                      setCommentDraft("");
                    }}
                    disabled={!commentDraft.trim()}
                  >
                    <Send size={14} color={colors.parchment} />
                  </Pressable>
                </View>
              </View>
            </GlassCard>
          )}

          {/* Skill feedback to university — E9 Bridge C. Lets an employer flag a skill gap
              straight to the candidate's university, separate from HR Notes (which stays
              internal to this employer). */}
          {c.university && (
            <GlassCard radius={18}>
              <View style={styles.block}>
                <View style={styles.simuHireHeader}>
                  <GraduationCap size={16} color={colors.gold} />
                  <Text style={styles.blockTitle}>Feedback to {c.university}</Text>
                </View>
                {feedbackSent ? (
                  <Text style={styles.emptySlate}>Feedback sent to {c.university}.</Text>
                ) : (
                  <>
                    <Text style={styles.feedbackHint}>Flag a skill this candidate should sharpen before graduating.</Text>
                    <View style={styles.chipRow}>
                      {[...c.verifiedSkills.map((s) => s.name), ...(c.claimedSkills ?? [])].map((skill) => (
                        <Pressable
                          key={skill}
                          style={[styles.skillChip, feedbackSkill === skill && styles.skillChipActive]}
                          onPress={() => setFeedbackSkill(skill)}
                        >
                          <Text style={[styles.skillChipText, feedbackSkill === skill && styles.skillChipTextActive]}>
                            {skill}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    <View style={styles.commentComposeRow}>
                      <TextInput
                        style={styles.commentInput}
                        value={feedbackNote}
                        onChangeText={setFeedbackNote}
                        placeholder="What should they improve on?"
                        placeholderTextColor={colors.slate}
                        multiline
                      />
                      <Pressable
                        style={[
                          styles.commentSendBtn,
                          (!feedbackSkill || !feedbackNote.trim()) && styles.commentSendBtnDisabled,
                        ]}
                        onPress={() => {
                          if (!feedbackSkill || !feedbackNote.trim()) return;
                          submitFeedback({
                            universityName: c.university,
                            candidateId: c.id,
                            candidateName: c.name,
                            employerName: (user?.role === "employer" ? user.company_name : null) || "An employer",
                            skill: feedbackSkill,
                            note: feedbackNote.trim(),
                          });
                          setFeedbackSent(true);
                        }}
                        disabled={!feedbackSkill || !feedbackNote.trim()}
                      >
                        <Send size={14} color={colors.parchment} />
                      </Pressable>
                    </View>
                  </>
                )}
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

          {/* E-Decision — read-only here; the actual Accept/Reject action lives on the
              Pipeline card so an employer doesn't need to open a profile to decide. */}
          {entry?.decision && (
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

  starRow: { flexDirection: "row", gap: 6 },
  commentList: { gap: 10 },
  commentRow: { gap: 3, borderTopWidth: 1, borderTopColor: "rgba(16,25,43,0.06)", paddingTop: 10 },
  commentHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  commentAuthor: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.ink },
  commentDate: { fontFamily: fonts.mono, fontSize: 10.5, color: colors.slate },
  commentText: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.slate, lineHeight: 18 },
  commentComposeRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  commentInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.ink,
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.12)",
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    minHeight: 40,
  },
  commentSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  commentSendBtnDisabled: { opacity: 0.4 },

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

  // Skill feedback to university
  feedbackHint: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate },
  skillChip: {
    borderWidth: 1,
    borderColor: colors.slate,
    borderRadius: 100,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  skillChipActive: { borderColor: colors.gold, backgroundColor: "rgba(201,166,70,0.14)" },
  skillChipText: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate },
  skillChipTextActive: { color: colors.gold },

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

  decisionResult: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderWidth: 1, borderRadius: 16, padding: 16 },
  decisionResultTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
  decisionResultMessage: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.slate, lineHeight: 18 },
});
