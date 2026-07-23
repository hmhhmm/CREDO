// The app's front door — page 1 of 2, page 2 being RoleSelectScreen at /app/roles.
//
// Second rewrite: the first two drafts were both a single long vertical scroll (first
// dark, then light) with paragraph-level explanations of the trust model. Rejected both
// times — nobody opening an app wants to read an essay before they can tap anything.
// Real onboarding across polished consumer apps (Duolingo, Revolut, Cash App, Linear)
// converges on the same shape: a short swipeable carousel, 3 slides, one idea per slide,
// a headline under ten words and one line of subtext — never a paragraph — with dot
// indicators and a skip affordance, reaching the actual CTA in a couple of taps/swipes.
// This rebuild follows that shape instead of inventing a new one.
import { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
} from "lucide-react-native";
import ScreenBackground from "../../components/shared/ScreenBackground";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

const SLIDE_COUNT = 3;

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
          <Slide>
            <RingGlow />
            <View style={styles.eyebrowRow}>
              <ShieldCheck size={13} color={colors.verified} />
              <Text style={styles.eyebrow}>Verified career identity</Text>
            </View>
            <Text style={styles.headline}>
              Proof beats <Text style={styles.headlineGold}>claims.</Text>
            </Text>
            <Text style={styles.subtext}>
              A student's honest three years of work looks, on paper, identical to a
              fabricated résumé. CREDO checks which one is true.
            </Text>
          </Slide>

          <Slide>
            <Text style={styles.headline}>Checked,{"\n"}not self-reported.</Text>
            <Text style={styles.subtext}>What a claim goes through before it becomes proof.</Text>

            {/* Flow: a bare claim -> four checks -> a verified credential. The transform
                is the actual thing worth showing, not just the four words on their own. */}
            <View style={styles.flow}>
              <View style={styles.flowChipMuted}>
                <Text style={styles.flowChipMutedText}>"I know React"</Text>
              </View>

              <FlowArrow />

              <View style={styles.pillarGrid}>
                {PILLARS.map((p) => (
                  <View key={p.key} style={styles.pillarChip}>
                    <View style={styles.pillarChipIcon}>
                      <p.icon size={16} color={colors.ink} />
                    </View>
                    <Text style={styles.pillarChipLabel}>{p.label}</Text>
                  </View>
                ))}
              </View>

              <FlowArrow />

              <View style={styles.flowChipVerified}>
                <ShieldCheck size={14} color={colors.parchment} />
                <Text style={styles.flowChipVerifiedText}>Verified · 87</Text>
              </View>
            </View>
          </Slide>

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
                <Text style={styles.ctaButtonText}>{index === SLIDE_COUNT - 1 ? "Choose your side" : "Next"}</Text>
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

function FlowArrow() {
  return (
    <View style={styles.flowArrow}>
      <ArrowDown size={14} color={colors.slate} />
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
    // sat flush against the very top edge. A fixed padding on top of that gives the
    // header the same clearance a native app's status bar would, everywhere, not only on
    // a real notched device.
    paddingTop: 20,
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

  flow: { alignItems: "center", gap: 10, marginTop: 8 },
  flowArrow: { opacity: 0.6 },

  flowChipMuted: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "rgba(16,25,43,0.05)",
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.09)",
    borderStyle: "dashed",
  },
  flowChipMutedText: { fontFamily: fonts.mono, fontSize: 12.5, color: colors.slate, fontStyle: "italic" },

  flowChipVerified: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: colors.verified,
  },
  flowChipVerifiedText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.parchment },

  pillarGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, maxWidth: 280 },
  pillarChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.08)",
  },
  pillarChipIcon: { width: 22, height: 22, alignItems: "center", justifyContent: "center" },
  pillarChipLabel: { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.ink },

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
