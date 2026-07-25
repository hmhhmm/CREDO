// Interview Practice — a casual, self-paced practice flow. Deliberately NOT SimuHire: no
// AI-judged scenario, no scoring, no recording. The candidate reads a real interview
// question, optionally speaks their answer using the browser's live speech-to-text (Web
// Speech API — nothing is recorded or uploaded, transcription happens locally in the
// browser and is discarded on next question), sees a rule-based read on that answer, checks
// a practical tip, and moves on at their own pace. After the 6th question, a summary report
// aggregates the per-question rule-based checks. If the browser doesn't support speech
// recognition, the question/tip flow still works fully — voice input is an enhancement, not
// a requirement.
import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Mic, MicOff, ChevronRight, Lightbulb, RotateCcw, Check, X, AlertCircle, Award } from "lucide-react-native";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { useTabBarVisibility } from "../../context/TabBarVisibilityContext";
import { colors, namecard } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { analyzeInterviewAnswer, type AnswerAnalysisResult } from "../../utils/analyzeInterviewAnswer";

interface PracticeQuestion {
  prompt: string;
  tip: string;
}

const QUESTIONS: PracticeQuestion[] = [
  {
    prompt: "Tell me about a time you disagreed with a teammate. How did you handle it?",
    tip: "Name the disagreement plainly, then spend most of your answer on what you did next — not on who was right.",
  },
  {
    prompt: "Describe a project that didn't go the way you planned. What did you learn?",
    tip: "Pick a real failure, not a disguised humblebrag. Interviewers notice when the 'failure' was actually a win.",
  },
  {
    prompt: "Why are you interested in this role specifically, not just any job in the field?",
    tip: "Reference something concrete about the role or company — a project, a product decision, a team you'd work with.",
  },
  {
    prompt: "Walk me through how you prioritize when you have more tasks than time.",
    tip: "Give your actual method, even if it's simple. A concrete habit beats a vague 'I stay organized.'",
  },
  {
    prompt: "Tell me about a time you had to learn something quickly to get a task done.",
    tip: "Be specific about how you learned it — what you read, who you asked — not just that you 'figured it out.'",
  },
  {
    prompt: "What's a piece of feedback you received that changed how you work?",
    tip: "Show that you actually changed behavior, with a small before/after example.",
  },
];

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: unknown) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => SpeechRecognitionLike) | null;
}

function micErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case "not-allowed":
    case "permission-denied":
      return "Microphone access was blocked. Allow microphone permission for this site in your browser settings, then try again.";
    case "no-speech":
      return "Didn't catch anything — tap the mic and try speaking again.";
    case "audio-capture":
      return "No microphone found. Check that one is connected and try again.";
    case "network":
      return "Speech recognition needs an internet connection — check yours and try again.";
    default:
      return "Voice input hit a snag. You can try again, or just read the question and think through your answer.";
  }
}

// Per-question outcome kept for the final report — the transcript itself is discarded
// (never stored beyond the current question) but the pass/fail read on it is summarized.
interface QuestionOutcome {
  index: number;
  attempted: boolean;
  analysis: AnswerAnalysisResult[] | null;
}

export default function InterviewPracticeScreen() {
  const { setHidden } = useTabBarVisibility();
  const [index, setIndex] = useState(0);
  const [showTip, setShowTip] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [analysis, setAnalysis] = useState<AnswerAnalysisResult[] | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<QuestionOutcome[]>([]);
  const [finished, setFinished] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const speechSupported = useRef(getSpeechRecognitionCtor() !== null).current;

  const question = QUESTIONS[index];
  const isLastQuestion = index === QUESTIONS.length - 1;

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  // Hide the bottom tab bar while practicing — same treatment as Coach Session and Resume
  // Builder, so this reads as a focused task rather than another tab-nested page.
  useFocusEffect(
    useCallback(() => {
      setHidden(true);
      return () => setHidden(false);
    }, [setHidden])
  );

  // onresult/onend fire from the SpeechRecognition instance's own event loop, not React's,
  // so they close over whatever `transcript` was at recognition.start() time — a ref mirrors
  // the live value so onend can run analysis on what was actually just said.
  const transcriptRef = useRef("");

  const toggleListening = () => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    setAnalysis(null);
    setMicError(null);
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event: unknown) => {
      const e = event as { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }>> };
      let combined = "";
      for (let i = 0; i < e.results.length; i++) {
        combined += e.results[i][0].transcript;
      }
      transcriptRef.current = combined;
      setTranscript(combined);
    };
    recognition.onerror = (event: unknown) => {
      const e = event as { error?: string };
      setListening(false);
      setMicError(micErrorMessage(e.error ?? "unknown"));
    };
    recognition.onend = () => {
      setListening(false);
      if (transcriptRef.current.trim().length > 0) {
        const result = analyzeInterviewAnswer(transcriptRef.current);
        setAnalysis(result);
        setOutcomes((prev) => [
          ...prev.filter((o) => o.index !== index),
          { index, attempted: true, analysis: result },
        ]);
        // The tip is most useful right after seeing the read on your own answer, not
        // before — auto-reveal it instead of requiring a second tap.
        setShowTip(true);
      }
    };
    recognitionRef.current = recognition;
    transcriptRef.current = "";
    recognition.start();
    setListening(true);
  };

  const resetQuestionState = () => {
    recognitionRef.current?.stop();
    setListening(false);
    setTranscript("");
    transcriptRef.current = "";
    setAnalysis(null);
    setMicError(null);
    setShowTip(false);
  };

  const goNext = () => {
    if (isLastQuestion) {
      resetQuestionState();
      setFinished(true);
      return;
    }
    resetQuestionState();
    setIndex((i) => i + 1);
  };

  const restart = () => {
    resetQuestionState();
    setOutcomes([]);
    setFinished(false);
    setIndex(0);
  };

  if (finished) {
    const attempted = outcomes.filter((o) => o.attempted);
    const totalChecks = attempted.reduce((sum, o) => sum + (o.analysis?.length ?? 0), 0);
    const totalPassed = attempted.reduce((sum, o) => sum + (o.analysis?.filter((a) => a.pass).length ?? 0), 0);

    return (
      <View style={{ flex: 1 }}>
        <ScreenBackground />
        <SafeAreaView style={styles.container} edges={["bottom"]}>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
            <View style={styles.reportHeaderShadow}>
              <View style={styles.reportHeader}>
                <View style={styles.reportBadge}>
                  <Award size={14} color={colors.terracotta} />
                  <Text style={styles.reportBadgeText}>SESSION COMPLETE</Text>
                </View>
                <Text style={styles.reportHeading}>
                  {attempted.length} of {QUESTIONS.length} questions practiced out loud
                </Text>
                {totalChecks > 0 && (
                  <Text style={styles.reportSub}>
                    {totalPassed} of {totalChecks} rule-based checks passed across your answers.
                  </Text>
                )}
              </View>
            </View>

            {attempted.length === 0 ? (
              <View style={styles.emptyReportNote}>
                <Text style={styles.emptyReportText}>
                  You moved through the questions without speaking an answer, so there's nothing to analyze — that's
                  fine for reading through the questions, just re-run the session and tap the mic when you want a
                  read on your answers.
                </Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {QUESTIONS.map((q, i) => {
                  const outcome = outcomes.find((o) => o.index === i);
                  return (
                    <GlassCard key={q.prompt} radius={16}>
                      <View style={styles.reportRow}>
                        <Text style={styles.reportQuestionText} numberOfLines={2}>{q.prompt}</Text>
                        {outcome?.analysis ? (
                          <View style={styles.reportChecksRow}>
                            {outcome.analysis.map((r) => (
                              <View key={r.label} style={[styles.reportCheckChip, r.pass ? styles.reportCheckPass : styles.reportCheckFail]}>
                                {r.pass ? (
                                  <Check size={10} color={colors.verified} strokeWidth={3} />
                                ) : (
                                  <X size={10} color={colors.alert} strokeWidth={3} />
                                )}
                                <Text style={[styles.reportCheckText, { color: r.pass ? colors.verified : colors.alert }]}>
                                  {r.label}
                                </Text>
                              </View>
                            ))}
                          </View>
                        ) : (
                          <Text style={styles.reportSkipped}>Not attempted out loud</Text>
                        )}
                      </View>
                    </GlassCard>
                  );
                })}
              </View>
            )}

            <Pressable style={styles.nextBtn} onPress={restart}>
              <RotateCcw size={15} color={colors.terracotta} />
              <Text style={styles.nextBtnText}>Practice again</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>Question {index + 1} of {QUESTIONS.length}</Text>
            <Pressable onPress={restart} hitSlop={8}>
              <RotateCcw size={15} color={colors.slate} />
            </Pressable>
          </View>

          <View style={styles.questionCardShadow}>
            <View style={styles.questionCard}>
              <Text style={styles.questionText}>{question.prompt}</Text>
            </View>
          </View>

          {speechSupported ? (
            <GlassCard radius={18}>
              <View style={styles.voiceCard}>
                <Pressable
                  style={[styles.micButton, listening && styles.micButtonActive]}
                  onPress={toggleListening}
                >
                  {listening ? <MicOff size={20} color={colors.parchment} /> : <Mic size={20} color={colors.ink} />}
                </Pressable>
                <Text style={styles.voiceHint}>
                  {listening ? "Listening — speak your answer" : "Tap to practice out loud"}
                </Text>
                {transcript.length > 0 && (
                  <Text style={styles.transcript}>{transcript}</Text>
                )}
                {micError && (
                  <View style={styles.micErrorRow}>
                    <AlertCircle size={13} color={colors.alert} />
                    <Text style={styles.micErrorText}>{micError}</Text>
                  </View>
                )}
                <Text style={styles.voiceDisclosure}>
                  Transcribed locally in your browser. Nothing is recorded, saved, or scored.
                </Text>
              </View>
            </GlassCard>
          ) : (
            <View style={styles.unsupportedNote}>
              <Text style={styles.unsupportedText}>
                Voice input isn't supported in this browser — you can still practice by thinking through your answer
                out loud or jotting it down.
              </Text>
            </View>
          )}

          {analysis && (
            <GlassCard radius={18}>
              <View style={styles.analysisCard}>
                <Text style={styles.analysisHeading}>Quick read on that answer</Text>
                <Text style={styles.analysisSubheading}>
                  Rule-based checks on your words — not a judgment of whether the story itself was good.
                </Text>
                {analysis.map((r) => (
                  <View key={r.label} style={styles.analysisRow}>
                    <View style={[styles.analysisIcon, r.pass ? styles.analysisIconPass : styles.analysisIconFail]}>
                      {r.pass ? (
                        <Check size={12} color={colors.verified} strokeWidth={3} />
                      ) : (
                        <X size={12} color={colors.alert} strokeWidth={3} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.analysisLabel}>{r.label}</Text>
                      <Text style={styles.analysisDetail}>{r.detail}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </GlassCard>
          )}

          {showTip ? (
            <GlassCard radius={18}>
              <View style={styles.tipCard}>
                <View style={styles.tipHeader}>
                  <Lightbulb size={14} color={colors.gold} />
                  <Text style={styles.tipLabel}>TIP</Text>
                </View>
                <Text style={styles.tipText}>{question.tip}</Text>
              </View>
            </GlassCard>
          ) : (
            <Pressable style={styles.revealTip} onPress={() => setShowTip(true)}>
              <Lightbulb size={14} color={colors.slate} />
              <Text style={styles.revealTipText}>Show tip</Text>
            </Pressable>
          )}

          <Pressable style={styles.nextBtn} onPress={goNext}>
            <Text style={styles.nextBtnText}>{isLastQuestion ? "Finish & see summary" : "Next question"}</Text>
            <ChevronRight size={16} color={colors.terracotta} />
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  progressText: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 0.5, color: colors.slate },

  questionCardShadow: {
    borderRadius: 20,
    shadowColor: "rgba(16,25,43,0.3)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 5,
  },
  questionCard: {
    borderRadius: 20,
    padding: 22,
    backgroundColor: namecard.bgGradientFrom,
    borderWidth: 1,
    borderColor: "rgba(193,122,61,0.3)",
  },
  questionText: { fontFamily: fonts.display, fontSize: 17, color: namecard.primary, lineHeight: 25 },

  voiceCard: { padding: 18, alignItems: "center", gap: 10 },
  micButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16,25,43,0.06)",
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.1)",
  },
  micButtonActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  voiceHint: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.ink },
  transcript: { fontFamily: fonts.sans, fontSize: 13, color: colors.slate, lineHeight: 19, textAlign: "center", marginTop: 4 },
  voiceDisclosure: { fontFamily: fonts.mono, fontSize: 9.5, color: colors.slate, textAlign: "center", marginTop: 6 },

  micErrorRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, paddingHorizontal: 8 },
  micErrorText: { flex: 1, fontFamily: fonts.sans, fontSize: 12, color: colors.alert, lineHeight: 16 },

  unsupportedNote: { padding: 16, borderRadius: 14, backgroundColor: "rgba(16,25,43,0.05)" },
  unsupportedText: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.slate, lineHeight: 18 },

  analysisCard: { padding: 18, gap: 12 },
  analysisHeading: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  analysisSubheading: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.slate, lineHeight: 16, marginTop: -6 },
  analysisRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  analysisIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  analysisIconPass: { backgroundColor: "rgba(31,122,92,0.12)" },
  analysisIconFail: { backgroundColor: "rgba(196,80,58,0.1)" },
  analysisLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.ink },
  analysisDetail: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, lineHeight: 17, marginTop: 1 },

  tipCard: { padding: 16, gap: 6 },
  tipHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  tipLabel: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.5, color: colors.gold },
  tipText: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink, lineHeight: 19 },

  revealTip: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", padding: 4 },
  revealTipText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.slate },

  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: colors.ink,
  },
  nextBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.terracotta },

  reportHeaderShadow: {
    borderRadius: 20,
    shadowColor: "rgba(16,25,43,0.3)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 5,
  },
  reportHeader: {
    borderRadius: 20,
    padding: 22,
    gap: 6,
    backgroundColor: namecard.bgGradientFrom,
    borderWidth: 1,
    borderColor: "rgba(193,122,61,0.3)",
  },
  reportBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "rgba(193,122,61,0.16)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    marginBottom: 4,
  },
  reportBadgeText: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.5, color: colors.terracotta },
  reportHeading: { fontFamily: fonts.display, fontSize: 16.5, color: namecard.primary, lineHeight: 23 },
  reportSub: { fontFamily: fonts.sans, fontSize: 12.5, color: namecard.body, lineHeight: 18 },

  emptyReportNote: { padding: 16, borderRadius: 14, backgroundColor: "rgba(16,25,43,0.05)" },
  emptyReportText: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.slate, lineHeight: 18 },

  reportRow: { padding: 16, gap: 8 },
  reportQuestionText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink, lineHeight: 18 },
  reportChecksRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  reportCheckChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 100,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  reportCheckPass: { backgroundColor: "rgba(31,122,92,0.1)" },
  reportCheckFail: { backgroundColor: "rgba(196,80,58,0.08)" },
  reportCheckText: { fontFamily: fonts.sansMedium, fontSize: 10.5 },
  reportSkipped: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate },
});
