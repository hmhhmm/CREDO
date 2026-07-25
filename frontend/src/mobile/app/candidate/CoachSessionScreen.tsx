// Coach Session — an actual chat interface, not a static form. There is no LLM wired up in
// this build (ANTHROPIC_API_KEY is unset and the backend isn't reachable in MOCK_MODE), so
// this doesn't pretend to be a general conversational AI — it's a real chat transcript with
// a real text input, where typed messages are matched against each topic's real keywords
// (matchTopicFromText below) rather than parsed by an LLM, plus the same quick-reply chips
// as a faster path to the same topics. The coach's replies are computed live from the
// candidate's actual verified skills, artifacts, and SimuHire result. Every reply hands off
// to a real, dedicated tool page (Resume Builder, Interview Practice, Verify, Course Detail)
// — never back into another existing screen with different content.
import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FileText, MessagesSquare, Target, GraduationCap, Bot, ArrowRight, Send } from "lucide-react-native";
import ScreenBackground from "../../components/shared/ScreenBackground";
import { useAuth } from "../../context/AuthContext";
import { useTabBarVisibility } from "../../context/TabBarVisibilityContext";
import { namecardApi, portfolioApi, ApiError, type NamecardResponse, type PortfolioResponse } from "../../lib/api";
import { deriveUpskillingRecommendations } from "../../utils/upskillingRecommendations";
import { colors, namecard } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { GrowStackParamList } from "../../navigation/GrowStack";
import type { ParentNav } from "../../navigation/types";

type Props = NativeStackScreenProps<GrowStackParamList, "CoachSession">;

type Topic = "resume" | "interview" | "skills" | "courses";

const TOPICS: { key: Topic; label: string; Icon: typeof FileText }[] = [
  { key: "resume", label: "Help with my resume", Icon: FileText },
  { key: "interview", label: "Prep for an interview", Icon: MessagesSquare },
  { key: "skills", label: "What am I missing?", Icon: Target },
  { key: "courses", label: "What should I study?", Icon: GraduationCap },
];

// Real typed input still has no LLM behind it — this matches the actual words against each
// topic's real keyword set rather than faking free-form understanding. Ordered so a message
// mentioning multiple topics resolves to the most specific match first (interview/course
// keywords are more specific than the general "skills" catch-all).
const TOPIC_KEYWORDS: Record<Topic, string[]> = {
  resume: ["resume", "cv", "curriculum vitae"],
  interview: ["interview", "practice", "prep", "question"],
  courses: ["course", "study", "learn", "certification", "certificate"],
  skills: ["skill", "missing", "gap", "lack", "weak"],
};

function matchTopicFromText(text: string): Topic | null {
  const lower = text.toLowerCase();
  for (const key of ["interview", "courses", "resume", "skills"] as Topic[]) {
    if (TOPIC_KEYWORDS[key].some((kw) => lower.includes(kw))) return key;
  }
  return null;
}

interface ChatMessage {
  id: string;
  from: "coach" | "user";
  text: string;
  ctaLabel?: string;
  onCta?: () => void;
}

function buildReply(
  topic: Topic,
  namecardRes: NamecardResponse,
  portfolio: PortfolioResponse
): { body: string; ctaLabel: string } {
  const verifiedCount = namecardRes.skills.filter((s) => s.verified).length;
  const artifactCount = portfolio.verified_artifacts.filter((a) => a.status === "verified").length;

  switch (topic) {
    case "resume":
      if (verifiedCount === 0 && artifactCount === 0) {
        return {
          body: "You don't have anything verified yet, so there's nothing real to put on a resume. Verify a skill or credential first — the builder pulls straight from what's actually confirmed.",
          ctaLabel: "Open Resume Builder",
        };
      }
      return {
        body: `You have ${verifiedCount} verified skill${verifiedCount === 1 ? "" : "s"} and ${artifactCount} verified artifact${artifactCount === 1 ? "" : "s"} ready to go. The builder assembles them into a resume automatically — nothing to write from scratch.`,
        ctaLabel: "Open Resume Builder",
      };
    case "interview":
      if (namecardRes.simuhire_badge) {
        return {
          body: `Your last SimuHire session scored ${Math.round(namecardRes.simuhire_badge.overall_score)}/100 on ${namecardRes.simuhire_badge.simulation_type}. Want a lower-pressure warm-up first? Interview Practice is casual — no scoring, no recording, just real questions and tips.`,
          ctaLabel: "Open Interview Practice",
        };
      }
      return {
        body: "Let's start casual — no recording, no scoring, just real questions with tips, at your own pace. When you're ready for something closer to the real thing, SimuHire is the next step.",
        ctaLabel: "Open Interview Practice",
      };
    case "skills": {
      const gaps = deriveUpskillingRecommendations(portfolio.field_of_study, namecardRes.skills).skillGaps;
      if (gaps.length === 0) {
        return {
          body: portfolio.field_of_study
            ? `Every core skill expected for ${portfolio.field_of_study} is already verified on your profile. Nothing outstanding right now.`
            : "Add your field of study to your profile and this can check it against expected skills for the role.",
          ctaLabel: "Go to Verify",
        };
      }
      return {
        body: `Based on ${portfolio.field_of_study ?? "your field"}, you're missing verification in: ${gaps.map((g) => g.skill).join(", ")}.`,
        ctaLabel: "Go to Verify",
      };
    }
    case "courses": {
      const { skillGaps, credentialPrograms } = deriveUpskillingRecommendations(portfolio.field_of_study, namecardRes.skills);
      if (skillGaps.length === 0) {
        return {
          body: "No gaps to target right now — check back once you've picked up a new skill you want to formalize.",
          ctaLabel: "Browse upskilling anyway",
        };
      }
      const withCourse = skillGaps.find((g) => g.course);
      const parts: string[] = [];
      if (withCourse) parts.push(`${withCourse.course} covers ${withCourse.skill}.`);
      if (credentialPrograms.length > 0) parts.push(`${credentialPrograms[0].name} (${credentialPrograms[0].issuer}) targets the same gap.`);
      return {
        body: parts.length > 0 ? parts.join(" ") : `Targeting ${skillGaps[0].skill} first would close your biggest gap.`,
        ctaLabel: "View course details",
      };
    }
  }
}

export default function CoachSessionScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { setHidden } = useTabBarVisibility();
  const [namecardRes, setNamecardRes] = useState<NamecardResponse | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [askedTopics, setAskedTopics] = useState<Set<Topic>>(new Set());
  const [draft, setDraft] = useState("");
  // The web shim forwards ScrollView's ref straight to its underlying scrollable <div>
  // (frontend/src/native/react-native.jsx), not a native scrollTo/scrollToEnd API, so
  // auto-scroll sets scrollTop directly rather than calling a method that doesn't exist here.
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [n, p] = await Promise.all([namecardApi.get(user.id), portfolioApi.me()]);
      setNamecardRes(n);
      setPortfolio(p);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not reach the server.");
    } finally {
      setLoading(false);
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

  // Hide the bottom tab bar while this screen is focused — it's meant to feel like a
  // dedicated chat, not another tab-nested page. Restored automatically on blur/unmount.
  useFocusEffect(
    useCallback(() => {
      setHidden(true);
      return () => setHidden(false);
    }, [setHidden])
  );

  // CoachSession is nested inside GrowStack, so getParent() correctly reaches the Tab
  // navigator (same pattern as GrowScreen itself).
  const parent = navigation.getParent() as ParentNav;
  const goVerify = () => parent?.navigate("Portfolio");

  const scrollToEnd = () => {
    setTimeout(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }, 100);
  };

  const askTopic = (topic: Topic, userLabel?: string) => {
    if (!namecardRes || !portfolio) return;
    const t = TOPICS.find((x) => x.key === topic)!;
    const reply = buildReply(topic, namecardRes, portfolio);

    let cta: (() => void) | undefined;
    switch (topic) {
      case "resume":
        cta = () => navigation.navigate("ResumeBuilder");
        break;
      case "interview":
        cta = () => navigation.navigate("InterviewPractice");
        break;
      case "skills":
        cta = goVerify;
        break;
      case "courses": {
        const gaps = deriveUpskillingRecommendations(portfolio.field_of_study, namecardRes.skills);
        const target = gaps.skillGaps[0];
        cta = target
          ? () =>
              navigation.navigate("CourseDetail", {
                skill: target.skill,
                course: target.course,
                program: gaps.credentialPrograms.find((p) => p.targetSkill === target.skill) ?? null,
              })
          : goVerify;
        break;
      }
    }

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, from: "user", text: userLabel ?? t.label },
      { id: `c-${Date.now() + 1}`, from: "coach", text: reply.body, ctaLabel: reply.ctaLabel, onCta: cta },
    ]);
    setAskedTopics((prev) => new Set(prev).add(topic));
    scrollToEnd();
  };

  // Real typed input, matched against each topic's real keyword set (see
  // matchTopicFromText above) — no LLM behind it, so an unmatched message gets an honest
  // "didn't understand" reply instead of a faked answer, with the topic chips offered as a
  // fallback.
  const sendDraft = () => {
    const text = draft.trim();
    if (!text || !namecardRes || !portfolio) return;
    setDraft("");
    const topic = matchTopicFromText(text);
    if (topic) {
      askTopic(topic, text);
      return;
    }
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, from: "user", text },
      {
        id: `c-${Date.now() + 1}`,
        from: "coach",
        text: "I didn't catch a topic I can help with in that — try mentioning your resume, an interview, your skills, or what to study, or tap one of these:",
      },
    ]);
    scrollToEnd();
  };

  const remainingTopics = TOPICS.filter((t) => !askedTopics.has(t.key));

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 16, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.coachIntroRow}>
            <View style={styles.coachAvatar}>
              <Bot size={15} color={colors.terracotta} />
            </View>
            <View style={styles.coachBubble}>
              <Text style={styles.coachBubbleText}>
                Hi{user?.name ? ` ${user.name.split(" ")[0]}` : ""} — what do you need help with?
              </Text>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.ink} style={{ marginTop: 20 }} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            messages.map((m) =>
              m.from === "user" ? (
                <View key={m.id} style={styles.userRow}>
                  <View style={styles.userBubble}>
                    <Text style={styles.userBubbleText}>{m.text}</Text>
                  </View>
                </View>
              ) : (
                <View key={m.id} style={styles.coachIntroRow}>
                  <View style={styles.coachAvatar}>
                    <Bot size={15} color={colors.terracotta} />
                  </View>
                  <View style={[styles.coachBubble, styles.coachReplyBubble]}>
                    <Text style={styles.coachReplyText}>{m.text}</Text>
                    {m.onCta && (
                      <Pressable style={styles.ctaBtn} onPress={m.onCta}>
                        <Text style={styles.ctaBtnText}>{m.ctaLabel}</Text>
                        <ArrowRight size={13} color={namecard.bgGradientFrom} />
                      </Pressable>
                    )}
                  </View>
                </View>
              )
            )
          )}
        </ScrollView>

        {!loading && !error && (
          <View style={styles.inputBar}>
            {remainingTopics.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickReplyRow}
              >
                {remainingTopics.map((t) => (
                  <Pressable key={t.key} style={styles.quickReplyChip} onPress={() => askTopic(t.key)}>
                    <t.Icon size={13} color={colors.terracotta} />
                    <Text style={styles.quickReplyText} numberOfLines={1}>{t.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
            <View style={styles.textInputRow}>
              <TextInput
                style={styles.textInput}
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={sendDraft}
                placeholder="Ask the coach anything…"
                placeholderTextColor={colors.slate}
                returnKeyType="send"
              />
              <Pressable style={styles.sendBtn} onPress={sendDraft} disabled={!draft.trim()}>
                <Send size={16} color={namecard.bgGradientFrom} />
              </Pressable>
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  error: { fontFamily: fonts.mono, fontSize: 13, color: colors.alert, marginTop: 20 },

  coachIntroRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, maxWidth: "88%" },
  coachAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  coachBubble: {
    backgroundColor: "rgba(16,25,43,0.05)",
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 12,
    flexShrink: 1,
  },
  coachBubbleText: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.ink, lineHeight: 19 },

  // Coach replies use terracotta, not gold — gold is reserved for the Namecard/Share
  // identity elsewhere in the app (see theme/colors.ts's own comment: terracotta is
  // "reserved for AI-coaching/SimuHire surfaces" specifically so this doesn't reuse gold
  // for an unrelated concept). This is the one surface in the app that actually uses it.
  coachReplyBubble: {
    backgroundColor: namecard.bgGradientFrom,
    borderWidth: 1,
    borderColor: "rgba(193,122,61,0.3)",
    gap: 10,
  },
  coachReplyText: { fontFamily: fonts.display, fontSize: 13.5, color: namecard.primary, lineHeight: 20 },

  userRow: { flexDirection: "row", justifyContent: "flex-end" },
  userBubble: {
    maxWidth: "80%",
    backgroundColor: colors.ink,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubbleText: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.terracotta },

  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    alignSelf: "flex-start",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.terracotta,
  },
  ctaBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: "#fff" },

  // Input bar — a real text input plus a horizontally-scrolling row of quick-reply chips
  // above it (not a wrapping grid, which previously pushed the last row flush against the
  // tab bar with no bottom clearance). paddingBottom leaves genuine breathing room instead
  // of ending right at the safe-area edge.
  inputBar: {
    borderTopWidth: 1,
    borderTopColor: "rgba(16,25,43,0.08)",
    paddingTop: 10,
    paddingBottom: 14,
    paddingHorizontal: 16,
    gap: 10,
    backgroundColor: colors.parchment,
  },
  quickReplyRow: { gap: 8, paddingHorizontal: 4 },
  quickReplyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 100,
    paddingHorizontal: 13,
    paddingVertical: 8,
    backgroundColor: "rgba(193,122,61,0.1)",
    borderWidth: 1,
    borderColor: "rgba(193,122,61,0.28)",
  },
  quickReplyText: { flexShrink: 1, fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.ink },

  textInputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  textInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: "#fff",
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.1)",
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.terracotta,
  },
});
