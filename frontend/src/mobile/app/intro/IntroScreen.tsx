// The app's front door — page 1 of 2, page 2 being RoleSelectScreen at /app/roles.
//
// Third rewrite: expanded from 3 slides to 5 to carry two more ideas the shorter version
// couldn't fit — real-time application visibility (Smart Talent Matching, E2, plus the
// employer-side Re-Engagement Pipeline, E6, that keeps a "no" from going silent) and the
// AI Career Coach (C8) + SimuHire (C5) pairing. Every slide still holds to the rule the
// second rewrite established: one idea, a headline under ten words, one line of subtext,
// never a paragraph — five terse slides, not three terse ones padded into five verbose ones.
// Note on scope honesty: there is no built "guaranteed response" SLA feature in this system
// (checked — not in the charter's 13-feature list, not implemented anywhere in the repo), so
// slide 3 promises visibility into real matching/re-engagement state, not a fictional guarantee.
import { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView, FALLBACK_TOP_CLEARANCE } from "react-native-safe-area-context";
import Animated, { useAnimatedStyle, useSharedValue, withTiming, useReducedMotion } from "react-native-reanimated";
import {
  ArrowRight,
  ArrowDown,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  Building2,
  BookOpen,
  Wrench,
  MessagesSquare,
  Repeat,
  Search,
  Handshake,
  MessageCircle,
  Sparkles,
} from "lucide-react-native";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import VerifiedBadge from "../../components/shared/VerifiedBadge";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

const SLIDE_COUNT = 5;

const PILLARS = [
  { key: "knowledge", label: "Knowledge", icon: BookOpen },
  { key: "skills", label: "Skills", icon: Wrench },
  { key: "attitude", label: "Attitude", icon: MessagesSquare },
  { key: "consistency", label: "Consistency", icon: Repeat },
] as const;

const ROLES = [
  { key: "candidate", label: "Candidate", body: "Prove what you built", icon: GraduationCap },
  { key: "employer", label: "Employer", body: "See who's real", icon: Briefcase },
  { key: "university", label: "University", body: "Watch it work", icon: Building2 },
] as const;

const MATCH_STAGES = [
  { key: "matched", label: "Matched to roles", Icon: Search, done: true },
  { key: "reviewed", label: "Seen by employer", Icon: Handshake, done: true },
  { key: "reengaged", label: "Re-engaged, not dropped", Icon: MessageCircle, done: false },
] as const;

export default function IntroScreen({ onGetStarted }: { onGetStarted: () => void }) {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<any>(null);

  const goTo = (i: number) => {
    const clamped = Math.max(0, Math.min(SLIDE_COUNT - 1, i));
    setIndex(clamped);
    // The ScrollView shim forwards its ref straight to the underlying <div> (see
    // react-native.jsx) — it's a real DOM node, not an RN ScrollView instance, so this
    // needs the DOM's own scrollTo signature (left/behavior), not RN's (x/animated).
    // clientWidth is read fresh here rather than cached, since it can change (resize,
    // desktop breakpoint) between renders.
    const el = scrollRef.current;
    if (el) el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
  };

  const onScroll = (e: any) => {
    const el = e?.target;
    if (!el || !el.clientWidth) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) setIndex(i);
  };

  const ctaLabel = ["Next", "Next", "Next", "Next", "Choose your side"][index];

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={styles.topRow}>
          <Text style={styles.wordmark}>CREDO</Text>
          {index < SLIDE_COUNT - 1 && (
            <Pressable onPress={onGetStarted} accessibilityRole="button">
              <Text style={styles.skip}>Skip</Text>
            </Pressable>
          )}
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          className="rn-intro-carousel"
          contentContainerStyle={{ flexDirection: "row" }}
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={32}
        >
          {/* Slide 0 — landing frame: Career OS, not a job board. */}
          <Slide>
            <RingGlow />
            <View style={styles.eyebrowRow}>
              <ShieldCheck size={13} color={colors.verified} />
              <Text style={styles.eyebrow}>Your lifetime career OS</Text>
            </View>
            <Text style={styles.headline}>
              Built on <Text style={styles.headlineGold}>verified proof.</Text>
            </Text>
            <Text style={styles.subtext}>Not a job board. A system that stays with you.</Text>
          </Slide>

          {/* Slide 1 — Smart Namecard (C3): proof beats claims. */}
          <Slide>
            <Text style={styles.headline}>
              Proof beats <Text style={styles.headlineGold}>claims.</Text>
            </Text>
            <Text style={styles.subtext}>A fabricated résumé reads identical to an honest one — until it's checked.</Text>

            <GlassCard style={styles.proofCard}>
              <View style={styles.comparisonRow}>
                <View style={styles.comparisonCol}>
                  <Text style={styles.comparisonLabel}>Résumé</Text>
                  <VerifiedBadge status="not_started" />
                </View>
                <Text style={styles.vsText}>vs</Text>
                <View style={styles.comparisonCol}>
                  <Text style={styles.comparisonLabel}>Smart Namecard</Text>
                  <VerifiedBadge status="verified" />
                </View>
              </View>
            </GlassCard>
          </Slide>

          {/* Slide 2 — Smart Talent Matching (E2) + Re-Engagement Pipeline (E6): real
              visibility into where an application stands, not a fabricated SLA. */}
          <Slide>
            <Text style={styles.headline}>Know where{"\n"}you stand.</Text>
            <Text style={styles.subtext}>Matching and re-engagement happen in the open, not a black box.</Text>

            <GlassCard style={styles.trackerCard}>
              {MATCH_STAGES.map((s) => (
                <View key={s.key} style={styles.trackerRow}>
                  <View style={[styles.trackerIconWrap, s.done && styles.trackerIconWrapDone]}>
                    <s.Icon size={14} color={s.done ? colors.parchment : colors.slate} />
                  </View>
                  <Text style={[styles.trackerLabel, !s.done && styles.trackerLabelMuted]}>{s.label}</Text>
                </View>
              ))}
            </GlassCard>
          </Slide>

          {/* Slide 3 — AI Career Coach (C8) + SimuHire (C5): coaching baked into applying. */}
          <Slide>
            <Text style={styles.headline}>Learn while{"\n"}you apply.</Text>
            <Text style={styles.subtext}>An AI coach and a practice interview, not just a submit button.</Text>

            <GlassCard style={styles.coachCard}>
              <View style={styles.coachTagRow}>
                <Sparkles size={12} color={colors.gold} />
                <Text style={styles.coachTag}>AI Career Coach</Text>
              </View>
              <Text style={styles.coachQuote}>
                "Strong problem-solving in your last SimuHire round — let's tighten how you structure the answer."
              </Text>
            </GlassCard>
          </Slide>

          {/* Slide 4 — the triangle: candidate/employer/university, unchanged from before. */}
          <Slide>
            <Text style={styles.headline}>Built for whoever{"\n"}needs the truth.</Text>
            <Text style={styles.subtext}>One platform, three sides of the same problem.</Text>
            <View style={styles.roleChipRow}>
              {ROLES.map((r) => (
                <RoleChip key={r.key} icon={r.icon} label={r.label} body={r.body} />
              ))}
            </View>
          </Slide>
        </ScrollView>

        <View style={styles.bottomBar}>
          <View style={styles.dots}>
            {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
              <Pressable key={i} onPress={() => goTo(i)} accessibilityRole="button" hitSlop={10}>
                <View style={[styles.dot, i === index && styles.dotActive]} />
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={() => (index === SLIDE_COUNT - 1 ? onGetStarted() : goTo(index + 1))}
            accessibilityRole="button"
          >
            {({ pressed }) => (
              <View style={[styles.ctaButton, pressed && { opacity: 0.85 }]}>
                <Text style={styles.ctaButtonText}>{ctaLabel}</Text>
                <ArrowRight size={16} color={colors.parchment} />
              </View>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function Slide({ children }: { children: React.ReactNode }) {
  return (
    <View className="rn-intro-slide" style={styles.slide}>
      {children}
    </View>
  );
}

function RoleChip({ icon: Icon, label, body }: { icon: typeof GraduationCap; label: string; body: string }) {
  return (
    <View style={styles.roleChip}>
      <View style={styles.roleChipIcon}>
        <Icon size={20} color={colors.ink} />
      </View>
      <Text style={styles.roleChipLabel}>{label}</Text>
      <Text style={styles.roleChipBody}>{body}</Text>
    </View>
  );
}

// Same soft-glow-circle technique as ScreenBackground's ambient light pools: a flat fill
// plus a real CSS blur, oversized so the edge falls outside the visible glow.
function RingGlow() {
  const reduced = useReducedMotion();
  const grow = useSharedValue(0);
  useEffect(() => {
    grow.value = reduced ? 1 : withTiming(1, { duration: 900 });
  }, [grow, reduced]);
  const style = useAnimatedStyle(() => ({ opacity: grow.value, transform: [{ scale: 0.9 + grow.value * 0.1 }] }));
  return <Animated.View pointerEvents="none" style={[styles.ringGlow, style]} />;
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    // SafeAreaView's edges=["top"] only reserves real device notch space (env(safe-area-
    // inset-top)) — that's 0 in a plain browser tab / most emulators, which is why this
    // sat flush against the very top edge. FALLBACK_TOP_CLEARANCE gives the header the
    // same clearance a native app's status bar would, everywhere, not only on a real
    // notched device — same constant the native-stack header shim uses.
    paddingTop: FALLBACK_TOP_CLEARANCE,
  },
  wordmark: { fontFamily: fonts.displayBold, fontSize: 19, color: colors.ink, letterSpacing: 3 },
  skip: { fontFamily: fonts.mono, fontSize: 12, color: colors.slate, letterSpacing: 0.5 },

  slide: {
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },

  ringGlow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    // Blurred over a warm cream ground of a similar hue, a low-alpha gold fill nearly
    // disappears — 0.16 measured as visually blank in review. This needs to sit well
    // above the ambient light pools' own alpha (ScreenBackground uses ~0.13) to read as
    // an intentional glow rather than more background noise.
    backgroundColor: "rgba(201,166,70,0.38)",
    filter: "blur(55px)",
  },

  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  eyebrow: { fontFamily: fonts.mono, fontSize: 10.5, textTransform: "uppercase", letterSpacing: 2, color: colors.slate },

  headline: {
    fontFamily: fonts.displayBold,
    fontSize: 32,
    lineHeight: 38,
    color: colors.ink,
    textAlign: "center",
  },
  headlineGold: { color: colors.gold },

  subtext: {
    fontFamily: fonts.sans,
    fontSize: 14.5,
    lineHeight: 21,
    color: colors.slate,
    textAlign: "center",
    maxWidth: 340,
  },

  proofCard: { marginTop: 8, width: 300, padding: 18 },
  comparisonRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  comparisonCol: { alignItems: "center", gap: 8, flex: 1 },
  comparisonLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.ink },
  vsText: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate, marginHorizontal: 8 },

  trackerCard: { marginTop: 8, width: 300, padding: 18, gap: 12 },
  trackerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  trackerIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16,25,43,0.08)",
  },
  trackerIconWrapDone: { backgroundColor: colors.verified },
  trackerLabel: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink },
  trackerLabelMuted: { color: colors.slate },

  coachCard: { marginTop: 8, width: 300, padding: 18, gap: 10 },
  coachTagRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  coachTag: { fontFamily: fonts.mono, fontSize: 10.5, textTransform: "uppercase", letterSpacing: 1.5, color: colors.gold },
  coachQuote: { fontFamily: fonts.sans, fontSize: 13, fontStyle: "italic", lineHeight: 19, color: colors.ink },

  roleChipRow: { flexDirection: "row", gap: 14, marginTop: 6 },
  roleChip: { alignItems: "center", gap: 8, width: 92 },
  roleChipIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(16,25,43,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  roleChipLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.ink },
  roleChipBody: { fontFamily: fonts.sans, fontSize: 10.5, color: colors.slate, textAlign: "center", lineHeight: 14 },

  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dots: { flexDirection: "row", gap: 7 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(16,25,43,0.16)" },
  dotActive: { width: 18, backgroundColor: colors.ink },

  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 999,
    backgroundColor: colors.ink,
  },
  ctaButtonText: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.parchment },
});
