// Grow — lifelong career intelligence hub. Salary Truth Engine deliberately dropped from
// this page (moved out per design direction); Career Path Navigator and Life Chapter
// Designer stay as their existing preview tiles, unchanged, since both are real, separately
// built screens (CareerPathScreen.tsx, LifeChapterScreen.tsx) this page must not duplicate.
//
// Round 2 rebuild: the AI Coach hub now opens CoachSessionScreen (a real diagnostic over
// the candidate's own data) instead of deep-linking straight into SimuHire — routing every
// tap back into SimuHire was exactly what was rejected. The roadmap below is driven by
// deriveNextBestAction (same logic Home's Next Best Action card uses), so each step shows
// real done/not-done state instead of static copy. Targeted Upskilling is computed by
// deriveUpskillingRecommendations against SKILLS_BY_FIELD/GAP_COURSES/CREDENTIAL_PROGRAMS —
// real data already in the app, not an invented catalog — and every card is tappable.
import { useCallback, useEffect, useState } from "react";
import { View, ScrollView, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Compass,
  BookHeart,
  ArrowRight,
  Bot,
  FileText,
  Check,
  GraduationCap,
  MessagesSquare,
  Star,
  Clock,
} from "lucide-react-native";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { useAuth } from "../../context/AuthContext";
import { namecardApi, portfolioApi, type NamecardResponse, type PortfolioResponse } from "../../lib/api";
import { deriveNextBestAction, type NextBestAction } from "../../utils/nextBestAction";
import { deriveUpskillingRecommendations } from "../../utils/upskillingRecommendations";
import { colors, namecard } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { GrowStackParamList } from "../../navigation/GrowStack";
import type { ParentNav } from "../../navigation/types";

type Props = NativeStackScreenProps<GrowStackParamList, "GrowMain">;

// Roadmap steps map 1:1 onto deriveNextBestAction's ActionKind ordering, so "done" reflects
// whether the candidate has already moved past that action, not a script.
const ROADMAP_ORDER = ["link_github", "improve_skill", "run_simuhire", "verify_more"] as const;

const ROADMAP_COPY: Record<(typeof ROADMAP_ORDER)[number], { title: string; action: "verify" | "simuhire" | "card" }> = {
  link_github: { title: "Link your GitHub", action: "verify" },
  improve_skill: { title: "Strengthen your weakest verified skill", action: "verify" },
  run_simuhire: { title: "Run a SimuHire simulation", action: "simuhire" },
  verify_more: { title: "Verify your remaining claimed skills", action: "verify" },
};

export default function GrowScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [namecardRes, setNamecardRes] = useState<NamecardResponse | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [n, p] = await Promise.all([namecardApi.get(user.id), portfolioApi.me()]);
      setNamecardRes(n);
      setPortfolio(p);
    } catch {
      // Sections below each handle their own null state.
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

  // GrowScreen is GrowStack's nested root, so getParent() correctly reaches the Tab
  // navigator (same pattern as CardScreen/SettingsScreen — unlike VerifyScreen, which sits
  // directly on the Tab navigator with no Stack of its own).
  const parent = navigation.getParent() as ParentNav;
  const goVerify = () => parent?.navigate("Portfolio");
  const goCard = () => parent?.navigate("Card");
  const goSimuHireSetup = () => parent?.navigate("Home", { screen: "SimuHire" });

  const roadmapActionHandlers: Record<"verify" | "simuhire" | "card", () => void> = {
    verify: goVerify,
    simuhire: goSimuHireSetup,
    card: goCard,
  };

  const nextAction: NextBestAction | null = namecardRes ? deriveNextBestAction(namecardRes) : null;
  const currentStepIndex = nextAction ? ROADMAP_ORDER.indexOf(nextAction.kind as (typeof ROADMAP_ORDER)[number]) : -1;

  const { skillGaps, credentialPrograms } =
    portfolio && namecardRes
      ? deriveUpskillingRecommendations(portfolio.field_of_study, namecardRes.skills)
      : { skillGaps: [], credentialPrograms: [] };

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.heading}>Grow & Evolve</Text>

          {/* AI Career Coach hub (C8) — opens a real guided session over the candidate's own
              data, not a deep link back into SimuHire. */}
          <Pressable onPress={() => navigation.navigate("CoachSession")}>
            <View style={styles.coachCardShadow}>
              <View style={styles.coachCard}>
                <View style={styles.coachBadge}>
                  <Bot size={11} color={colors.terracotta} />
                  <Text style={styles.coachBadgeText}>AI Career Coach</Text>
                </View>
                <Text style={styles.coachQuote}>
                  {nextAction ? nextAction.body : "A verified profile and a practice interview are the fastest way to look ready for what's next."}
                </Text>
                <View style={styles.coachCta}>
                  <Text style={styles.coachCtaText}>{nextAction ? nextAction.headline : "Start a guided session"}</Text>
                  <ArrowRight size={14} color={colors.terracotta} />
                </View>
              </View>
            </View>
          </Pressable>

          {/* Job-application helper tools — each opens its own dedicated screen with real
              content; neither tile routes back into an existing page. Gold icon wells tie
              these tiles into the same accent language as the nav bar's active pill and the
              Coach card, instead of flat grey icon backgrounds. */}
          <Text style={styles.sectionTitle}>Application Toolkit</Text>
          <View style={styles.halfRow}>
            <Pressable style={styles.half} onPress={() => navigation.navigate("ResumeBuilder")}>
              <GlassCard radius={20}>
                <View style={styles.halfCard}>
                  <View style={styles.halfIconWell}>
                    <FileText size={17} color="#8A6D1F" />
                  </View>
                  <Text style={styles.halfTitle}>Resume Builder</Text>
                  <Text style={styles.halfCaption}>Assembled from verified skills & artifacts</Text>
                  <View style={styles.halfArrow}>
                    <ArrowRight size={14} color={colors.ink} />
                  </View>
                </View>
              </GlassCard>
            </Pressable>
            <Pressable style={styles.half} onPress={() => navigation.navigate("InterviewPractice")}>
              <GlassCard radius={20}>
                <View style={styles.halfCard}>
                  <View style={styles.halfIconWell}>
                    <MessagesSquare size={17} color="#8A6D1F" />
                  </View>
                  <Text style={styles.halfTitle}>Interview Practice</Text>
                  <Text style={styles.halfCaption}>Casual questions & tips, no recording</Text>
                  <View style={styles.halfArrow}>
                    <ArrowRight size={14} color={colors.ink} />
                  </View>
                </View>
              </GlassCard>
            </Pressable>
          </View>

          {/* Career Stage Roadmap — driven by deriveNextBestAction, the same real diagnostic
              Home's Next Best Action card uses, so each step's status reflects actual account
              state instead of static copy. */}
          <Text style={styles.sectionTitle}>Career Stage Roadmap</Text>

          <GlassCard radius={20}>
            <View style={styles.roadmapCard}>
              {namecardRes ? (
                <View style={{ gap: 12 }}>
                  {ROADMAP_ORDER.map((kind, i) => {
                    const copy = ROADMAP_COPY[kind];
                    const done = currentStepIndex >= 0 && i < currentStepIndex;
                    const isCurrent = i === currentStepIndex;
                    return (
                      <Pressable
                        key={kind}
                        style={styles.stepRow}
                        onPress={roadmapActionHandlers[copy.action]}
                        disabled={done}
                      >
                        <View style={[styles.stepBadge, done && styles.stepBadgeDone, isCurrent && styles.stepBadgeCurrent]}>
                          {done ? (
                            <Check size={13} color={colors.verified} strokeWidth={3} />
                          ) : (
                            <Text style={styles.stepBadgeText}>{i + 1}</Text>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.stepTitle, done && styles.stepTitleDone]}>{copy.title}</Text>
                          {isCurrent && nextAction && <Text style={styles.stepDesc}>{nextAction.body}</Text>}
                        </View>
                        {!done && <ArrowRight size={14} color={isCurrent ? "#8A6D1F" : colors.slate} />}
                      </Pressable>
                    );
                  })}
                  {currentStepIndex === -1 && nextAction?.kind === "all_strong" && (
                    <Text style={styles.roadmapAllStrong}>{nextAction.body}</Text>
                  )}
                </View>
              ) : (
                <Text style={styles.roadmapSub}>Loading your progress…</Text>
              )}
            </View>
          </GlassCard>

          {/* Career Path Navigator + Life Chapter Designer — existing real screens, kept
              exactly as their own preview tiles. Life Chapter Designer here IS the real C9.
              Career Path's tile uses the terracotta accent (reserved for AI-coaching-family
              surfaces, see theme/colors.ts) to give the tile row a third identity instead of
              two identical cream cards — also renamed from the unexplained "3 paths" stat to
              a title that says what the tile actually does. */}
          <View style={styles.halfRow}>
            <Pressable style={styles.half} onPress={() => navigation.navigate("CareerPath")}>
              <View style={styles.terracottaCardShadow}>
                <View style={styles.terracottaCard}>
                  <Compass size={18} color={colors.parchment} />
                  <Text style={styles.terracottaTitle}>Explore Career Paths</Text>
                  <Text style={styles.terracottaCaption}>3 realistic next moves, mapped out</Text>
                  <View style={styles.terracottaArrow}>
                    <ArrowRight size={14} color={colors.parchment} />
                  </View>
                </View>
              </View>
            </Pressable>
            <Pressable style={styles.half} onPress={() => navigation.navigate("LifeChapter")}>
              <GlassCard radius={20}>
                <View style={styles.halfCard}>
                  <View style={styles.halfIconWell}>
                    <BookHeart size={17} color="#8A6D1F" />
                  </View>
                  <Text style={styles.halfTitle}>Life Chapter Designer</Text>
                  <Text style={styles.halfCaption}>Plan around real life events</Text>
                  <View style={styles.halfArrow}>
                    <ArrowRight size={14} color={colors.ink} />
                  </View>
                </View>
              </GlassCard>
            </Pressable>
          </View>

          {/* Targeted Upskilling — real skill gaps for the candidate's own field, computed
              against SKILLS_BY_FIELD, mapped to real GAP_COURSES course codes (the same map
              U2's Curriculum Gap Detector uses) and real CREDENTIAL_PROGRAMS. Every card opens
              its own Course Detail page — not a routed "verify" action. */}
          <Text style={styles.sectionTitle}>Targeted Upskilling</Text>

          {!portfolio || !namecardRes ? (
            <GlassCard radius={18}>
              <View style={styles.emptyUpskill}>
                <GraduationCap size={16} color={colors.slate} />
                <Text style={styles.emptyUpskillText}>Loading your skill data…</Text>
              </View>
            </GlassCard>
          ) : skillGaps.length === 0 ? (
            <GlassCard radius={18}>
              <View style={styles.emptyUpskill}>
                <Check size={16} color={colors.verified} />
                <Text style={styles.emptyUpskillText}>
                  {portfolio.field_of_study
                    ? `Every core skill expected for ${portfolio.field_of_study} is already verified.`
                    : "Add your field of study to see targeted gaps."}
                </Text>
              </View>
            </GlassCard>
          ) : (
            <View style={{ gap: 8 }}>
              {skillGaps.map((gap) => {
                const program = credentialPrograms.find((p) => p.targetSkill === gap.skill);
                return (
                  <Pressable
                    key={gap.skill}
                    onPress={() =>
                      navigation.navigate("CourseDetail", { skill: gap.skill, course: gap.course, program: program ?? null })
                    }
                  >
                    <GlassCard radius={16}>
                      <View style={styles.courseCard}>
                        <View style={styles.courseTopRow}>
                          <View style={styles.courseGapChip}>
                            <Text style={styles.courseGapChipText}>{gap.skill}</Text>
                          </View>
                          <ArrowRight size={13} color={colors.slate} />
                        </View>

                        {program ? (
                          <>
                            <Text style={styles.courseTitle} numberOfLines={1}>{program.name}</Text>
                            <View style={styles.courseStatsRow}>
                              <Text style={styles.courseIssuer} numberOfLines={1}>{program.issuer}</Text>
                              <View style={styles.courseStat}>
                                <Star size={11} color={colors.gold} fill={colors.gold} />
                                <Text style={styles.courseStatText}>{program.rating.toFixed(1)}</Text>
                              </View>
                              <View style={styles.courseLevelChip}>
                                <Text style={styles.courseLevelChipText}>{program.level}</Text>
                              </View>
                            </View>
                          </>
                        ) : gap.course ? (
                          <>
                            <Text style={styles.courseTitle} numberOfLines={1}>{gap.course}</Text>
                            <Text style={styles.courseIssuer}>Your university's curriculum</Text>
                          </>
                        ) : (
                          <Text style={styles.courseTitle}>No mapped course yet</Text>
                        )}
                      </View>
                    </GlassCard>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 110, gap: 14 },
  heading: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.ink, marginTop: 4 },

  sectionTitle: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.ink },

  // AI Career Coach — dark card with terracotta accents, not gold. Terracotta is reserved
  // in theme/colors.ts specifically for AI-coaching surfaces so this reads as its own
  // identity distinct from the Namecard/Share family, which keeps gold.
  coachCardShadow: {
    borderRadius: 20,
    shadowColor: "rgba(16,25,43,0.3)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 5,
  },
  coachCard: {
    borderRadius: 20,
    padding: 20,
    gap: 4,
    backgroundColor: namecard.bgGradientFrom,
    borderWidth: 1,
    borderColor: "rgba(193,122,61,0.3)",
  },
  coachBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "rgba(193,122,61,0.16)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    marginBottom: 10,
  },
  coachBadgeText: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.5, color: colors.terracotta },
  coachQuote: { fontFamily: fonts.display, fontSize: 15, color: namecard.primary, lineHeight: 22 },
  coachCta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16 },
  coachCtaText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.terracotta },

  roadmapCard: { padding: 20, gap: 4 },
  roadmapSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, marginTop: 2, marginBottom: 4 },
  roadmapAllStrong: { fontFamily: fonts.sans, fontSize: 13, color: colors.verified, lineHeight: 19 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(16,25,43,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepBadgeDone: { backgroundColor: "rgba(31,122,92,0.12)" },
  stepBadgeCurrent: { backgroundColor: "rgba(201,166,70,0.16)" },
  stepBadgeText: { fontFamily: fonts.mono, fontSize: 11, fontWeight: "700" as const, color: colors.slate },
  stepTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink },
  stepTitleDone: { color: colors.slate, textDecorationLine: "line-through" as const },
  stepDesc: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.slate, marginTop: 2, lineHeight: 16 },

  halfRow: { flexDirection: "row", gap: 14, alignItems: "stretch" },
  half: { flex: 1 },
  halfCard: { padding: 18, gap: 7, height: 186 },
  halfIconWell: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "rgba(201,166,70,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  halfStat: { fontFamily: fonts.displayBold, fontSize: 24, color: colors.ink, marginTop: 4 },
  halfTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink, marginTop: 4 },
  halfCaption: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, lineHeight: 16 },
  halfArrow: {
    marginTop: "auto",
    alignSelf: "flex-end",
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(16,25,43,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Career Path tile — the row's third accent color (terracotta), reserved in
  // theme/colors.ts for AI-coaching-family surfaces, so this row reads as three distinct
  // identities instead of two visually identical cream cards.
  terracottaCardShadow: {
    flex: 1,
    borderRadius: 20,
    shadowColor: "rgba(193,122,61,0.35)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 5,
  },
  terracottaCard: {
    flex: 1,
    borderRadius: 20,
    padding: 18,
    gap: 7,
    height: 186,
    backgroundColor: colors.terracotta,
  },
  terracottaTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.parchment, marginTop: 4 },
  terracottaCaption: { fontFamily: fonts.sans, fontSize: 12, color: "rgba(245,237,224,0.85)", lineHeight: 16 },
  terracottaArrow: {
    marginTop: "auto",
    alignSelf: "flex-end",
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(245,237,224,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyUpskill: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16 },
  emptyUpskillText: { flex: 1, fontFamily: fonts.sans, fontSize: 12.5, color: colors.slate, lineHeight: 17 },

  // Targeted Upskilling cards — compact by design: one line for the title, one line for
  // issuer/rating/level, a small skill-gap chip instead of a full label row, and the arrow
  // moved up next to the chip instead of its own bottom row. Roughly half the vertical
  // footprint of the previous layout (padding 18->14, 3-4 content rows -> 2).
  courseCard: { padding: 14, gap: 5 },
  courseTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  courseGapChip: {
    backgroundColor: "rgba(201,166,70,0.14)",
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  courseGapChipText: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.5, color: "#8A6D1F" },
  courseTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  courseIssuer: { flexShrink: 1, fontFamily: fonts.sans, fontSize: 11.5, color: colors.gold },
  courseStatsRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  courseStat: { flexDirection: "row", alignItems: "center", gap: 3 },
  courseStatText: { fontFamily: fonts.sans, fontSize: 11, color: colors.slate },
  courseLevelChip: {
    backgroundColor: "rgba(201,166,70,0.14)",
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  courseLevelChipText: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 0.4, color: colors.gold },
});
