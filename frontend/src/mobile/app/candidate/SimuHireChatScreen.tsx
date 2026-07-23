import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Send, Clock, X, ChevronDown, ChevronUp, BookOpen, Play, Pause } from "lucide-react-native";
import Svg, { Line, Polygon, Text as SvgText } from "react-native-svg";
import { simuhireApi, ApiError } from "../../lib/api";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { getConfidenceBand } from "../../utils/confidenceBand";
import type { SimuHireStackParamList } from "../../navigation/SimuHireStack";
import ScreenBackground from "../../components/shared/ScreenBackground";

const STAGES = ["Setup", "Challenge", "Escalation", "Resolution"];

const STAGE_DESCRIPTIONS: Record<string, string> = {
  Setup: "Understand the scenario. State your initial approach.",
  Challenge: "New information surfaces. Adapt your diagnosis.",
  Escalation: "Stakeholder pressure increases. Manage competing demands.",
  Resolution: "Drive toward a decision. Justify your final recommendation.",
};

const SUBMIT_LABELS = ["Respond to scenario", "Diagnose and respond", "Respond under pressure", "Make your final call"];

const DIM_LABELS: Record<string, string> = {
  adaptability: "Adaptability",
  communication: "Communication",
  problemSolving: "Problem-Solving",
  stressResponse: "Stress Response",
  systemsThinking: "Systems Thinking",
};

// Live indicators climb toward these as the candidate responds — indicative only;
// the Evaluator agent scores the full transcript at session end.
const INDICATOR_CAPS: Record<string, number> = { adaptability: 86, communication: 75, problemSolving: 84, stressResponse: 78, systemsThinking: 88 };
const INDICATOR_STEPS: Record<string, number> = { adaptability: 12, communication: 10, problemSolving: 13, stressResponse: 11, systemsThinking: 12 };
const INDICATOR_START: Record<string, number> = { adaptability: 12, communication: 10, problemSolving: 14, stressResponse: 8, systemsThinking: 11 };

// Scenario-agnostic scripted answers for the demo auto-pilot, so a sample run
// plays hands-free against the real session API for any simulation type.
const DEMO_ANSWERS = [
  "First I'd scope the problem: confirm what exactly is failing, who is affected, and how urgent it really is before acting.",
  "I'd gather the facts from the sources I have access to and form a working hypothesis about the root cause.",
  "I'd send a short status update to the stakeholder now — what we know, what we're doing, and when they'll hear from me next.",
  "My proposed fix addresses the root cause with the smallest safe change, and I'd prepare a rollback path before applying it.",
  "Given the constraints, I'd escalate through the proper channel with a clear summary and a concrete recommendation rather than acting alone.",
  "If approval stays blocked, I'd apply a low-risk mitigation that reduces user impact without violating any constraint.",
  "Before calling it done I'd verify the fix end-to-end and confirm the affected users are no longer impacted.",
  "To close out: a short incident summary — impact, root cause, fix, timeline — plus one process change to prevent recurrence.",
];

interface ChatTurn {
  speaker: "interviewer" | "stakeholder" | "candidate" | "system";
  text: string;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// ── Radar chart ───────────────────────────────────────────────────────────────

function RadarChart({ dims, size = 180 }: { dims: Record<string, number>; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.35;
  const keys = Object.keys(dims);
  const n = keys.length;

  const point = (i: number, val: number) => {
    const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
    const rv = (val / 100) * r;
    return `${cx + rv * Math.cos(angle)},${cy + rv * Math.sin(angle)}`;
  };

  const gridPoly = (level: number) => keys.map((_, i) => point(i, level)).join(" ");
  const dataPoly = keys.map((k, i) => point(i, dims[k])).join(" ");

  const shortLabel: Record<string, string> = {
    adaptability: "Adapt",
    communication: "Comm",
    problemSolving: "Problem",
    stressResponse: "Stress",
    systemsThinking: "Systems",
  };

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
      {[25, 50, 75, 100].map((lvl) => (
        <Polygon key={lvl} points={gridPoly(lvl)} fill="none" stroke={colors.line} strokeWidth="0.8" />
      ))}
      {keys.map((_, i) => {
        const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
        return (
          <Line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)} stroke={colors.line} strokeWidth="0.8" />
        );
      })}
      <Polygon points={dataPoly} fill={colors.verified} fillOpacity="0.15" stroke={colors.verified} strokeWidth="1.5" />
      {keys.map((k, i) => {
        const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
        const lr = r + size * 0.12;
        return (
          <SvgText
            key={k}
            x={cx + lr * Math.cos(angle)}
            y={cy + lr * Math.sin(angle)}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={size * 0.05}
            fill={colors.slate}
            fontFamily="IBM Plex Mono, monospace"
          >
            {shortLabel[k] ?? k}
          </SvgText>
        );
      })}
    </Svg>
  );
}

// ── Live indicators panel (radar + bars + camera) ─────────────────────────────

function IndicatorsPanel({ indicators, videoRef, hasCamera, recElapsed }: {
  indicators: Record<string, number>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  hasCamera: boolean;
  recElapsed: number;
}) {
  const recClock = `${String(Math.floor(recElapsed / 60)).padStart(2, "0")}:${String(recElapsed % 60).padStart(2, "0")}`;
  return (
    <View style={{ gap: 12, alignItems: "center" }}>
      <View style={[styles.cameraBox, !hasCamera && ({ display: "none" } as const)]}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
        />
        {/* Integrity-monitoring badge. Visual only — the camera is previewed live
            but nothing is captured, uploaded, or stored. */}
        <View style={styles.recBadge}>
          <View style={styles.recDot} className="rn-rec-dot" />
          <Text style={styles.recText}>REC {recClock}</Text>
        </View>
      </View>
      <View style={{ alignSelf: "stretch" }}>
        <Text style={styles.panelLabel}>LIVE INDICATORS</Text>
        <Text style={styles.panelSub}>Updates as you respond.</Text>
      </View>
      <RadarChart dims={indicators} />
      <View style={{ alignSelf: "stretch", gap: 8 }}>
        {Object.entries(indicators).map(([k, v]) => {
          const band = getConfidenceBand(v);
          return (
            <View key={k} style={styles.barRow}>
              <Text style={styles.barLabel}>{DIM_LABELS[k]}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${v}%`, backgroundColor: band.hex }]} />
              </View>
              <Text style={[styles.barValue, { color: band.hex }]}>{v}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.panelNote}>Indicative only — the Evaluator scores the full transcript at the end.</Text>
    </View>
  );
}

// ── Session screen ────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<SimuHireStackParamList, "SimuHireChat">;

export default function SimuHireChatScreen({ navigation, route }: Props) {
  const { session, brief } = route.params;
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  const [turns, setTurns] = useState<ChatTurn[]>([{ speaker: "interviewer", text: session.opening_message }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false); // awaiting API or streaming a reply
  const [streamingTurn, setStreamingTurn] = useState<ChatTurn | null>(null);
  const [stageIndex, setStageIndex] = useState(Math.max(0, STAGES.indexOf(session.stage)));
  const [stageOverlay, setStageOverlay] = useState<string | null>(null);
  const [briefOpen, setBriefOpen] = useState(false);
  const [indicators, setIndicators] = useState(INDICATOR_START);
  const [showIndicators, setShowIndicators] = useState(false); // narrow-screen overlay
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [ending, setEnding] = useState(false);
  const [autoPlay, setAutoPlay] = useState(route.params.autoPlay ?? false);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const autoIndex = useRef(0);
  const streamTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Countdown timer
  useEffect(() => {
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  // Camera for integrity monitoring — one stream for the whole session, previewed
  // wherever the indicators panel happens to render.
  useEffect(() => {
    let stream: MediaStream | null = null;
    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: false })
      .then((s) => {
        stream = s;
        setCameraStream(s);
      })
      .catch(() => {});
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Re-attach the stream whenever the <video> remounts (panel toggled, layout change).
  useEffect(() => {
    if (videoRef.current && cameraStream) videoRef.current.srcObject = cameraStream;
  }, [cameraStream, isWide, showIndicators]);

  // Tab-switch detection
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        setTurns((prev) => [...prev, { speaker: "system", text: "— Candidate switched tabs —" }]);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Keep the newest message in view
  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [turns, streamingTurn]);

  useEffect(() => () => clearInterval(streamTimer.current), []);

  // Reveal a reply word-by-word, then commit it to `turns`.
  const streamReply = (speaker: ChatTurn["speaker"], full: string, onDone?: () => void) => {
    if (prefersReducedMotion()) {
      setTurns((prev) => [...prev, { speaker, text: full }]);
      onDone?.();
      return;
    }
    const words = full.split(" ");
    let i = 0;
    setStreamingTurn({ speaker, text: "" });
    streamTimer.current = setInterval(() => {
      i += 1;
      if (i >= words.length) {
        clearInterval(streamTimer.current);
        setStreamingTurn(null);
        setTurns((prev) => [...prev, { speaker, text: full }]);
        onDone?.();
      } else {
        setStreamingTurn({ speaker, text: words.slice(0, i).join(" ") });
      }
    }, 40);
  };

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || busy || ending) return;
    setTurns((prev) => [...prev, { speaker: "candidate", text }]);
    // Each response nudges the live indicators toward (but never past) their caps.
    setIndicators((prev) => {
      const next: Record<string, number> = {};
      for (const k of Object.keys(prev)) next[k] = Math.min(INDICATOR_CAPS[k], prev[k] + INDICATOR_STEPS[k]);
      return next;
    });
    setBusy(true);
    try {
      const res = await simuhireApi.sendMessage(session.session_id, text);
      const nextIndex = STAGES.indexOf(res.stage);
      if (nextIndex > stageIndex) {
        setStageIndex(nextIndex);
        setStageOverlay(res.stage);
        setTimeout(() => setStageOverlay(null), 2500);
        setTurns((prev) => [...prev, { speaker: "system", text: `— Stage ${nextIndex + 1}: ${res.stage} —` }]);
      }
      streamReply("interviewer", res.interviewer_message, () => {
        if (res.stakeholder_message) {
          streamReply("stakeholder", res.stakeholder_message, () => setBusy(false));
        } else {
          setBusy(false);
        }
      });
    } catch (e) {
      Alert.alert("Message failed", e instanceof ApiError ? e.message : "Could not reach the server.");
      setBusy(false);
    }
  };

  const handleSubmit = () => {
    if (!input.trim()) return;
    const text = input;
    setInput("");
    void send(text);
  };

  const endSession = async () => {
    if (ending) return;
    setEnding(true);
    setAutoPlay(false);
    try {
      await simuhireApi.endSession(session.session_id);
      navigation.replace("SimuHireReport", { sessionId: session.session_id });
    } catch (e) {
      Alert.alert("Could not end session", e instanceof ApiError ? e.message : "Could not reach the server.");
      setEnding(false);
    }
  };

  // Demo auto-pilot: while idle, type and submit the next scripted answer; when the
  // script runs out, end the session so the run flows through to the report.
  useEffect(() => {
    if (!autoPlay || busy || ending) return;
    if (autoIndex.current >= DEMO_ANSWERS.length) {
      setAutoPlay(false);
      void endSession();
      return;
    }
    const text = DEMO_ANSWERS[autoIndex.current];
    const show = setTimeout(() => setInput(text), 500);
    const submit = setTimeout(() => {
      autoIndex.current += 1;
      setInput("");
      void send(text);
    }, 1400);
    return () => {
      clearTimeout(show);
      clearTimeout(submit);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, busy, ending]);

  const startAutoPlay = () => {
    autoIndex.current = Math.min(turns.filter((t) => t.speaker === "candidate").length, DEMO_ANSWERS.length);
    setAutoPlay(true);
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const timerUrgent = timeLeft < 5 * 60;
  const stageName = STAGES[stageIndex];

  const speakerLabel = (speaker: ChatTurn["speaker"]) =>
    speaker === "interviewer" ? "Scenario Master" : `Stakeholder · ${session.stakeholder_persona}`;

  const renderBubble = (turn: ChatTurn, key: React.Key, streaming = false) => {
    if (turn.speaker === "system") {
      return (
        <Text key={key} style={styles.systemText}>{turn.text}</Text>
      );
    }
    const isCandidate = turn.speaker === "candidate";
    const isStakeholder = turn.speaker === "stakeholder";
    return (
      <View
        key={key}
        style={[
          styles.bubble,
          isCandidate ? styles.bubbleCandidate : isStakeholder ? styles.bubbleStakeholder : styles.bubbleInterviewer,
        ]}
      >
        {!isCandidate && (
          <Text style={[styles.speakerLabel, { color: isStakeholder ? colors.pending : colors.verified }]}>
            {speakerLabel(turn.speaker)}
          </Text>
        )}
        <Text style={isCandidate ? styles.bubbleTextCandidate : styles.bubbleText}>
          {turn.text}
          {streaming ? " ▋" : ""}
        </Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        {/* Header: stage progress + timer + demo + end */}
        <View style={styles.headerBar}>
          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={styles.stageChip}>{stageName}</Text>
              {autoPlay && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <View style={styles.demoDot} />
                  <Text style={styles.demoText}>DEMO</Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              {STAGES.map((s, i) => (
                <View
                  key={s}
                  style={[
                    styles.progressSeg,
                    { width: i === stageIndex ? 36 : 22 },
                    i < stageIndex ? { backgroundColor: "rgba(16,25,43,0.5)" } : i === stageIndex ? { backgroundColor: colors.ink } : null,
                  ]}
                />
              ))}
              <Text style={styles.progressCount}>{stageIndex + 1}/4</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Clock size={13} color={timerUrgent ? colors.alert : colors.slate} />
            <Text style={[styles.timerText, timerUrgent && { color: colors.alert }]}>{formatTime(timeLeft)}</Text>
          </View>
          {!isWide && (
            <Pressable style={styles.headerButton} onPress={() => setShowIndicators(true)}>
              <Text style={styles.headerButtonText}>Indicators</Text>
            </Pressable>
          )}
          <Pressable
            style={[styles.headerButton, autoPlay && { backgroundColor: colors.verified, borderColor: colors.verified }]}
            onPress={() => (autoPlay ? setAutoPlay(false) : startAutoPlay())}
          >
            {autoPlay ? <Pause size={11} color={colors.parchment} /> : <Play size={11} color={colors.slate} />}
            <Text style={[styles.headerButtonText, autoPlay && { color: colors.parchment }]}>
              {autoPlay ? "Stop" : "Auto-play"}
            </Text>
          </Pressable>
          <Pressable style={styles.headerButton} onPress={() => setShowEndConfirm(true)}>
            <Text style={[styles.headerButtonText, { color: colors.ink }]}>End</Text>
          </Pressable>
        </View>

        {/* Collapsible scenario brief */}
        <Pressable style={styles.briefToggle} onPress={() => setBriefOpen(!briefOpen)}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <BookOpen size={11} color={colors.slate} />
            <Text style={styles.briefToggleText}>Scenario brief</Text>
          </View>
          {briefOpen ? <ChevronUp size={12} color={colors.slate} /> : <ChevronDown size={12} color={colors.slate} />}
        </Pressable>
        {briefOpen && (
          <View style={styles.briefBody}>
            <Text style={styles.briefSituation}>{brief.situation}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 20 }}>
              <View style={{ flex: 1, minWidth: 200 }}>
                <Text style={styles.briefColTitle}>Access</Text>
                {brief.access.map((a) => (
                  <Text key={a} style={styles.briefItem}>· {a}</Text>
                ))}
              </View>
              <View style={{ flex: 1, minWidth: 200 }}>
                <Text style={styles.briefColTitle}>Constraints</Text>
                {brief.constraints.map((c) => (
                  <Text key={c} style={styles.briefItem}>· {c}</Text>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Body: conversation (+ side panel on wide screens) */}
        <View style={{ flex: 1, flexDirection: "row" }}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
              {turns.map((turn, i) => renderBubble(turn, i))}
              {busy && !streamingTurn && (
                <View style={[styles.bubble, styles.bubbleInterviewer]}>
                  <Text style={[styles.speakerLabel, { color: colors.verified }]}>Scenario Master</Text>
                  <ActivityIndicator color={colors.slate} size="small" />
                </View>
              )}
              {streamingTurn && renderBubble(streamingTurn, "streaming", true)}
              <div ref={bottomRef} />
            </ScrollView>

            <View style={[styles.inputArea, { marginBottom: isWide ? 0 : 80 }]}>
              <TextInput
                style={[styles.input, autoPlay && { opacity: 0.6 }]}
                placeholder="Think out loud — reasoning matters more than conclusions…"
                placeholderTextColor={colors.slate}
                value={input}
                onChangeText={setInput}
                multiline
                editable={!autoPlay && !ending}
              />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Pressable
                  style={[styles.sendButton, (busy || autoPlay || !input.trim()) && { opacity: 0.4 }]}
                  onPress={handleSubmit}
                  disabled={busy || autoPlay || !input.trim()}
                >
                  <Send size={12} color={colors.parchment} />
                  <Text style={styles.sendText}>{SUBMIT_LABELS[stageIndex] ?? "Submit"}</Text>
                </Pressable>
                {input.length > 0 && <Text style={styles.charCount}>{input.length} chars</Text>}
              </View>
            </View>
          </KeyboardAvoidingView>

          {isWide && (
            <ScrollView style={styles.sidePanel} contentContainerStyle={{ padding: 14 }}>
              <IndicatorsPanel indicators={indicators} videoRef={videoRef} hasCamera={cameraStream !== null} recElapsed={30 * 60 - timeLeft} />
            </ScrollView>
          )}
        </View>
      </SafeAreaView>

      {/* Stage transition overlay */}
      {stageOverlay && (
        <View style={[styles.overlay, { pointerEvents: "none" } as never]}>
          <Text style={styles.overlayKicker}>STAGE {STAGES.indexOf(stageOverlay) + 1} OF 4</Text>
          <Text style={styles.overlayTitle}>{stageOverlay}</Text>
          <Text style={styles.overlaySub}>{STAGE_DESCRIPTIONS[stageOverlay]}</Text>
        </View>
      )}

      {/* Narrow-screen indicators overlay */}
      {!isWide && showIndicators && (
        <View style={styles.overlayDim}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <Text style={styles.modalTitle}>Live indicators</Text>
              <Pressable onPress={() => setShowIndicators(false)} hitSlop={10}>
                <X size={16} color={colors.slate} />
              </Pressable>
            </View>
            <IndicatorsPanel indicators={indicators} videoRef={videoRef} hasCamera={cameraStream !== null} recElapsed={30 * 60 - timeLeft} />
          </View>
        </View>
      )}

      {/* End confirmation */}
      {showEndConfirm && (
        <View style={styles.overlayDim}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <Text style={styles.modalTitle}>End simulation?</Text>
              <Pressable onPress={() => setShowEndConfirm(false)} hitSlop={10} disabled={ending}>
                <X size={16} color={colors.slate} />
              </Pressable>
            </View>
            <Text style={styles.modalBody}>
              The Evaluator agent will score your transcript so far. You cannot return to this session once it ends.
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
              <Pressable style={[styles.modalPrimary, ending && { opacity: 0.6 }]} onPress={endSession} disabled={ending}>
                {ending ? (
                  <ActivityIndicator color={colors.parchment} size="small" />
                ) : (
                  <Text style={styles.modalPrimaryText}>End and see report</Text>
                )}
              </Pressable>
              <Pressable style={styles.modalSecondary} onPress={() => setShowEndConfirm(false)} disabled={ending}>
                <Text style={styles.modalSecondaryText}>Continue</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(16,25,43,0.1)",
  },
  stageChip: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.parchment,
    backgroundColor: colors.ink,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: "hidden",
  },
  demoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.verified },
  demoText: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1.5, color: colors.verified },
  progressSeg: { height: 4, borderRadius: 2, backgroundColor: colors.line },
  progressCount: { fontFamily: fonts.mono, fontSize: 10, color: colors.slate, marginLeft: 4 },
  timerText: { fontFamily: fonts.mono, fontSize: 13, color: colors.slate },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.15)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerButtonText: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.slate },
  briefToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(235,224,204,0.6)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(16,25,43,0.08)",
  },
  briefToggleText: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.slate },
  briefBody: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 8,
    backgroundColor: "rgba(235,224,204,0.6)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(16,25,43,0.08)",
  },
  briefSituation: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink, lineHeight: 17 },
  briefColTitle: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.slate, marginBottom: 3 },
  briefItem: { fontFamily: fonts.sans, fontSize: 11, color: colors.slate, lineHeight: 16 },
  bubble: { maxWidth: "88%", padding: 13, borderRadius: 14 },
  bubbleInterviewer: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.85)",
    borderLeftWidth: 2,
    borderLeftColor: colors.verified,
    borderBottomLeftRadius: 4,
  },
  bubbleStakeholder: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFBEB",
    borderLeftWidth: 2,
    borderLeftColor: colors.pending,
    borderBottomLeftRadius: 4,
  },
  bubbleCandidate: { alignSelf: "flex-end", backgroundColor: colors.ink, borderBottomRightRadius: 4 },
  speakerLabel: { fontFamily: fonts.mono, fontSize: 9, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  bubbleText: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink, lineHeight: 20 },
  bubbleTextCandidate: { fontFamily: fonts.sans, fontSize: 14, color: colors.parchment, lineHeight: 20 },
  systemText: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate, textAlign: "center", paddingVertical: 2 },
  inputArea: {
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(16,25,43,0.1)",
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.1)",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.85)",
    padding: 12,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink,
    minHeight: 68,
    maxHeight: 120,
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: colors.ink,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  sendText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.parchment },
  charCount: { fontFamily: fonts.mono, fontSize: 10, color: colors.slate },
  sidePanel: {
    width: 280,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(16,25,43,0.1)",
    flexGrow: 0,
    flexShrink: 0,
  },
  cameraBox: {
    alignSelf: "stretch",
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
    position: "relative",
  },
  recBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  recDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.alert },
  recText: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.5, color: "#FFFFFF" },
  panelLabel: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.5, color: colors.slate },
  panelSub: { fontFamily: fonts.sans, fontSize: 11, color: colors.slate, marginTop: 2 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  barLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.slate, width: 92 },
  barTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: "rgba(220,210,188,0.7)", overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3 },
  barValue: { fontFamily: fonts.mono, fontSize: 11, width: 24, textAlign: "right" },
  panelNote: { fontFamily: fonts.sans, fontSize: 10, color: colors.slate, fontStyle: "italic", textAlign: "center", lineHeight: 14 },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(16,25,43,0.6)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
  },
  overlayKicker: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 2, color: "rgba(245,237,224,0.6)", marginBottom: 8 },
  overlayTitle: { fontFamily: fonts.displayBold, fontSize: 36, color: colors.parchment, marginBottom: 8 },
  overlaySub: { fontFamily: fonts.sans, fontSize: 14, color: "rgba(245,237,224,0.7)", textAlign: "center", paddingHorizontal: 24 },
  overlayDim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(16,25,43,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 50,
  },
  modalCard: {
    backgroundColor: colors.parchment,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 20,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: { fontFamily: fonts.displayBold, fontSize: 17, color: colors.ink },
  modalBody: { fontFamily: fonts.sans, fontSize: 13, color: colors.slate, lineHeight: 19 },
  modalPrimary: {
    flex: 1,
    backgroundColor: colors.ink,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalPrimaryText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.parchment },
  modalSecondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSecondaryText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink },
});
