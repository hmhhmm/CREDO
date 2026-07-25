// The app's front door — page 1 of 2, page 2 being RoleSelectScreen at /app/roles.
//
// Fourth rewrite: the 5-slide carousel now plays a small animated infographic scene per
// slide (framer-motion, already a project dependency — used elsewhere on the marketing
// site at src/pages/Landing.jsx/src/components/Card3D.jsx, not previously inside src/
// mobile/). It targets real DOM nodes, so it works fine alongside the RN-web shim's View/
// Text (which render to <div>/<span> underneath) — scenes are built with plain motion.div/
// motion.svg rather than trying to route animation through RN's style prop, which the
// shim's css() transform doesn't guarantee framer-motion could drive predictably. Content/
// scope stays what earlier rewrites settled on: one idea per slide, no invented features
// (see the SLA note below, still true) — only the *staging* changed, not the claims.
// Note on scope honesty: there is no built "guaranteed response" SLA feature in this system
// (checked — not in the charter's 13-feature list, not implemented anywhere in the repo), so
// slide 2 promises visibility into real matching/re-engagement state, not a fictional guarantee.
import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView, FALLBACK_TOP_CLEARANCE } from "react-native-safe-area-context";
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withSpring, useReducedMotion } from "react-native-reanimated";
import { motion, AnimatePresence, useReducedMotion as useFramerReducedMotion } from "framer-motion";
import { ArrowRight, ShieldCheck, GraduationCap, Briefcase, Building2, FileX, Check, Sparkles } from "lucide-react-native";
import ScreenBackground from "../../components/shared/ScreenBackground";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

const SLIDE_COUNT = 5;

const MATCH_STAGES = [
  { key: "matched", label: "Matched to roles" },
  { key: "reviewed", label: "Seen by employer" },
  { key: "reengaged", label: "Re-engaged, not dropped" },
] as const;

const ROLES = [
  { key: "candidate", label: "Candidate", body: "Prove what you built", icon: GraduationCap },
  { key: "employer", label: "Employer", body: "See who's real", icon: Briefcase },
  { key: "university", label: "University", body: "Watch it work", icon: Building2 },
] as const;

// Stage 1 of the app's front door — a brief centered-logo entrance (spring scale + fade)
// before Stage 2's slide carousel below. Internal state rather than a separate navigator
// route: onGetStarted stays the one contract IntroScreen exposes to RootNavigator, so this
// doesn't touch the /app/roles URL-mapping logic at all.
function SplashStage({ onStart }: { onStart: () => void }) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      scale.value = 1;
      opacity.value = 1;
      return;
    }
    scale.value = withSpring(1, { damping: 12, stiffness: 120 });
    opacity.value = withTiming(1, { duration: 500 });
  }, [reduced, scale, opacity]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.splashContainer} edges={["top", "bottom"]}>
        <View style={styles.splashCenter}>
          <Animated.View style={[styles.splashLogoGroup, logoStyle]}>
            <Text style={styles.splashWordmark}>CREDO</Text>
            <Text style={styles.splashSub}>CAREER OPERATING SYSTEM</Text>
          </Animated.View>
        </View>

        <View style={styles.splashBottom}>
          <Pressable onPress={onStart} accessibilityRole="button">
            {({ pressed }) => (
              <View style={[styles.ctaButton, styles.splashCtaButton, pressed && { opacity: 0.85 }]}>
                <Text style={styles.ctaButtonText}>Start Journey</Text>
                <ArrowRight size={16} color={colors.parchment} />
              </View>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

export default function IntroScreen({ onGetStarted }: { onGetStarted: () => void }) {
  const [stage, setStage] = useState<"splash" | "carousel">("splash");
  const [index, setIndex] = useState(0);
  const dragging = useRef(false);

  const goTo = (i: number) => setIndex(Math.max(0, Math.min(SLIDE_COUNT - 1, i)));

  const ctaLabel = ["Next", "Next", "Next", "Next", "Choose your side"][index];

  if (stage === "splash") {
    return <SplashStage onStart={() => setStage("carousel")} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={styles.topRow}>
          <View style={styles.topRowSide} />
          <View style={styles.topRowCenter}>
            <Text style={styles.wordmark}>CREDO</Text>
          </View>
          <View style={[styles.topRowSide, styles.topRowSideRight]}>
            {index < SLIDE_COUNT - 1 && (
              <Pressable onPress={onGetStarted} accessibilityRole="button" hitSlop={8}>
                <View style={styles.skipPill}>
                  <Text style={styles.skip}>Skip</Text>
                </View>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.viewport}>
          <AnimatePresence mode="wait" custom={index}>
            <SlideScene key={index} index={index} onDragAdvance={goTo} />
          </AnimatePresence>
        </View>

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

// One slide's full content + its own small animated scene, swiped in/out via drag (mouse
// or touch — framer-motion's drag prop handles both) and cross-faded via AnimatePresence.
// Re-mounts on every index change (key={index} at the call site), so each scene's entrance
// animation replays every time it comes into view rather than only on first mount.
function SlideScene({ index, onDragAdvance }: { index: number; onDragAdvance: (i: number) => void }) {
  const reduced = useFramerReducedMotion();

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    const THRESHOLD = 60;
    if (info.offset.x < -THRESHOLD) onDragAdvance(index + 1);
    else if (info.offset.x > THRESHOLD) onDragAdvance(index - 1);
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragEnd={handleDragEnd}
      initial={reduced ? false : { opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduced ? undefined : { opacity: 0, x: -24 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, width: "100%", touchAction: "pan-y" }}
    >
      {index === 0 && <LandingScene />}
      {index === 1 && <ProofScene />}
      {index === 2 && <TransparencyScene />}
      {index === 3 && <CoachScene />}
      {index === 4 && <TriangleScene />}
    </motion.div>
  );
}

// ── Slide 0 — landing frame: Career OS, not a job board. Breathing gold glow behind a
// fade-up headline. ──────────────────────────────────────────────────────────────────
function LandingScene() {
  return (
    <View style={styles.slide}>
      {/* Restrained two-tone ambient glow (same spirit as ScreenBackground's light pools)
          instead of a single saturated gold blob, which read as a flat yellow wash over
          the whole page rather than ambient light. */}
      <motion.div
        style={{ position: "absolute", width: 300, height: 300, borderRadius: 150, backgroundColor: "rgba(16,25,43,0.05)", filter: "blur(70px)" }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: [0, 1, 0.85, 1], scale: [0.9, 1, 0.96, 1] }}
        transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
      />
      <motion.div
        style={{ position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(201,166,70,0.16)", filter: "blur(50px)" }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: [0, 1, 0.8, 1], scale: [0.9, 1, 0.97, 1] }}
        transition={{ duration: 2.6, ease: "easeInOut", repeat: Infinity, repeatType: "mirror", delay: 0.2 }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55, type: "spring", stiffness: 180, damping: 16 }}
        style={{ position: "relative", width: 108, height: 108, marginBottom: 6 }}
      >
        <svg width="108" height="108" style={{ position: "absolute", top: 0, left: 0 }}>
          <circle cx={54} cy={54} r={48} fill="none" stroke="rgba(201,166,70,0.25)" strokeWidth={2} />
          <motion.circle
            cx={54} cy={54} r={48} fill="none" stroke={colors.gold} strokeWidth={3}
            strokeLinecap="round" strokeDasharray={2 * Math.PI * 48}
            initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 48 * 0.22 }}
            transition={{ delay: 0.3, duration: 1.1, ease: "easeInOut" }}
            transform="rotate(-90 54 54)"
          />
        </svg>
        <View style={styles.landingRingCenter}>
          <ShieldCheck size={38} color={colors.verified} strokeWidth={1.75} />
        </View>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }} style={{ width: "100%", textAlign: "center" }}>
        <View style={styles.eyebrowRow}>
          <Text style={styles.eyebrow}>Your lifetime career OS</Text>
        </View>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.45 }} style={{ width: "100%", textAlign: "center" }}>
        <Text style={styles.headline}>
          Built on <Text style={styles.headlineGold}>verified proof.</Text>
        </Text>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.45 }} style={{ width: "100%", textAlign: "center" }}>
        <Text style={styles.subtext}>Not a job board. A system that stays with you.</Text>
      </motion.div>
    </View>
  );
}

// ── Slide 1 — Smart Namecard (C3): a torn/fading résumé icon gives way to a verified
// badge that draws its checkmark stroke in, then a confidence number counts up. ────────
function ProofScene() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(0);
    let raf: number;
    const start = performance.now();
    const DURATION = 900;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      setCount(Math.round(t * 94));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    const delay = setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, 500);
    return () => {
      clearTimeout(delay);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <View style={styles.slide}>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ width: "100%", textAlign: "center" }}>
        <Text style={styles.headline}>
          Proof beats <Text style={styles.headlineGold}>claims.</Text>
        </Text>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }} style={{ width: "100%", textAlign: "center" }}>
        <Text style={styles.subtext}>A fabricated résumé reads identical to an honest one — until it's checked.</Text>
      </motion.div>

      <div style={{ marginTop: 26, position: "relative", width: 280, height: 190 }}>
        <motion.div
          style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0, scale: 0.85 }}
          transition={{ delay: 0.55, duration: 0.4 }}
        >
          <FileX size={52} color={colors.slate} />
          <Text style={styles.ghostLabel}>Unverified résumé</Text>
        </motion.div>

        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.5, type: "spring", stiffness: 200, damping: 16 }}
        >
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 26,
              backgroundColor: "rgba(31,122,92,0.1)",
              border: `2px solid ${colors.verified}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.95, duration: 0.4 }}
              style={{ display: "flex" }}
            >
              <Check size={40} color={colors.verified} strokeWidth={3} />
            </motion.div>
          </div>
          <Text style={styles.proofCount}>{count}% verified</Text>

          <motion.div
            style={{ display: "flex", gap: 8, marginTop: 2 }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.15, duration: 0.4 }}
          >
            {["GitHub", "Credential", "Document"].map((src) => (
              <div key={src} style={{ display: "flex", alignItems: "center", gap: 4, backgroundColor: "rgba(31,122,92,0.08)", borderRadius: 100, padding: "4px 10px" }}>
                <Check size={9} color={colors.verified} strokeWidth={3} />
                <span style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.verified }}>{src}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </View>
  );
}

// ── Slide 2 — real-time application visibility: three stage dots light up in sequence
// with a progress line sweeping between them, left to right. ───────────────────────────
function TransparencyScene() {
  return (
    <View style={styles.slide}>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ width: "100%", textAlign: "center" }}>
        <Text style={styles.headline}>Know where{"\n"}you stand.</Text>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }} style={{ width: "100%", textAlign: "center" }}>
        <Text style={styles.subtext}>Matching and re-engagement happen in the open, not a black box.</Text>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        style={{ marginTop: 4 }}
      >
        <View style={styles.liveBadge}>
          <motion.div
            style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.verified }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
          <Text style={styles.liveBadgeText}>Live status — updated moments ago</Text>
        </View>
      </motion.div>

      <div style={{ marginTop: 22, width: 320, position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: 21,
            left: 20,
            right: 20,
            height: 3,
            backgroundColor: "rgba(16,25,43,0.1)",
            borderRadius: 1.5,
          }}
        />
        <motion.div
          style={{
            position: "absolute",
            top: 21,
            left: 20,
            height: 3,
            backgroundColor: colors.verified,
            borderRadius: 1.5,
          }}
          initial={{ width: 0 }}
          animate={{ width: "50%" }}
          transition={{ delay: 0.5, duration: 0.7, ease: "easeInOut" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {MATCH_STAGES.map((s, i) => {
            const done = i < 2;
            const active = i === 2;
            return (
              <div key={s.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: 100 }}>
                <motion.div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 21,
                    backgroundColor: done ? colors.verified : colors.parchment,
                    border: done ? "none" : `2px solid rgba(16,25,43,0.15)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1,
                    boxShadow: done ? "0 4px 10px rgba(31,122,92,0.25)" : "none",
                  }}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.25 + i * 0.22, duration: 0.35, type: "spring", stiffness: 260, damping: 18 }}
                >
                  {done && <Check size={18} color={colors.parchment} strokeWidth={3} />}
                  {active && (
                    <motion.div
                      style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold }}
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </motion.div>
                <Text style={[styles.stageLabel, !done && styles.stageLabelMuted]}>{s.label}</Text>
              </div>
            );
          })}
        </div>
      </div>
    </View>
  );
}

// ── Slide 3 — AI Career Coach (C8) + SimuHire (C5): a chat bubble that types its quote
// character-by-character, like a live coaching message arriving. ───────────────────────
const COACH_QUOTE = "Strong problem-solving in your last SimuHire round — let's tighten how you structure the answer.";

function CoachScene() {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    setShown(0);
    const id = setInterval(() => {
      setShown((prev) => {
        if (prev >= COACH_QUOTE.length) {
          clearInterval(id);
          return prev;
        }
        return prev + 1;
      });
    }, 18);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.slide}>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ width: "100%", textAlign: "center" }}>
        <Text style={styles.headline}>Learn while{"\n"}you apply.</Text>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }} style={{ width: "100%", textAlign: "center" }}>
        <Text style={styles.subtext}>An AI coach and a practice interview, not just a submit button.</Text>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.24, duration: 0.4, type: "spring", stiffness: 220, damping: 16 }}
        style={{
          marginTop: 26,
          width: 56,
          height: 56,
          borderRadius: 18,
          backgroundColor: colors.ink,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Sparkles size={26} color={colors.gold} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        style={{
          marginTop: 10,
          width: 320,
          backgroundColor: colors.parchment,
          borderRadius: 20,
          borderTopLeftRadius: 4,
          padding: 20,
          boxShadow: "0 10px 26px rgba(16,25,43,0.1)",
          border: "1px solid rgba(201,166,70,0.28)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <span style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: colors.gold }}>
            AI Career Coach
          </span>
        </div>
        <Text style={styles.coachQuote}>
          {COACH_QUOTE.slice(0, shown)}
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.6, repeat: shown < COACH_QUOTE.length ? Infinity : 0, repeatType: "mirror" }}
            style={{ display: "inline-block", width: 6 }}
          >
            {shown < COACH_QUOTE.length ? "▍" : ""}
          </motion.span>
        </Text>
      </motion.div>
    </View>
  );
}

// ── Slide 4 — the triangle: candidate/employer/university nodes fly in from their own
// corner and connecting lines draw between them, forming the literal triangle. ─────────
function TriangleScene() {
  return (
    <View style={styles.slide}>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ width: "100%", textAlign: "center" }}>
        <Text style={styles.headline}>Built for whoever{"\n"}needs the truth.</Text>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }} style={{ width: "100%", textAlign: "center" }}>
        <Text style={styles.subtext}>One platform, three sides of the same problem.</Text>
      </motion.div>

      <div style={{ marginTop: 30, position: "relative", width: 320, height: 200 }}>
        <motion.div
          style={{ position: "absolute", top: 30, left: 60, width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(201,166,70,0.22)", filter: "blur(45px)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        />
        <svg width="320" height="150" style={{ position: "absolute", top: 30, left: 0 }}>
          <motion.line
            x1={56} y1={30} x2={264} y2={30}
            stroke="rgba(201,166,70,0.55)" strokeWidth={2}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.5 }}
          />
          <motion.line
            x1={56} y1={30} x2={160} y2={128}
            stroke="rgba(201,166,70,0.55)" strokeWidth={2}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          />
          <motion.line
            x1={264} y1={30} x2={160} y2={128}
            stroke="rgba(201,166,70,0.55)" strokeWidth={2}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.85, duration: 0.5 }}
          />
        </svg>

        {ROLES.map((r, i) => {
          const pos = [
            { left: 0, top: 0 },
            { left: 208, top: 0 },
            { left: 104, top: 92 },
          ][i];
          return (
            <motion.div
              key={r.key}
              style={{ position: "absolute", ...pos, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 112 }}
              initial={{ opacity: 0, y: -10, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.14, duration: 0.4, type: "spring", stiffness: 240, damping: 18 }}
            >
              <View style={styles.roleChipIcon}>
                <r.icon size={26} color={colors.ink} />
              </View>
              <Text style={styles.roleChipLabel}>{r.label}</Text>
              <Text style={styles.roleChipBody}>{r.body}</Text>
            </motion.div>
          );
        })}
      </div>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingBottom: 6,
    // SafeAreaView's edges=["top"] only reserves real device notch space (env(safe-area-
    // inset-top)) — that's 0 in a plain browser tab / most emulators, which is why this
    // sat flush against the very top edge. FALLBACK_TOP_CLEARANCE gives the header the
    // same clearance a native app's status bar would, everywhere, not only on a real
    // notched device — same constant the native-stack header shim uses.
    paddingTop: FALLBACK_TOP_CLEARANCE,
  },
  // Equal-width flanking spacers pin the wordmark to the true row center regardless of its
  // own width or Skip's presence — the right spacer hosts Skip, the left is an empty
  // same-width twin so the center slot's flex:1 stays balanced on both sides.
  topRowSide: { width: 64 },
  topRowSideRight: { alignItems: "flex-end" },
  topRowCenter: { flex: 1, alignItems: "center" },
  wordmark: { fontFamily: fonts.displayBold, fontSize: 24, color: colors.ink, letterSpacing: 4 },
  skipPill: {
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.14)",
    borderRadius: 100,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  skip: { fontFamily: fonts.mono, fontSize: 11.5, color: colors.slate, letterSpacing: 0.5 },

  splashContainer: { flex: 1, justifyContent: "space-between", paddingHorizontal: 24 },
  splashCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  splashLogoGroup: { alignItems: "center" },
  splashWordmark: { fontFamily: fonts.displayBold, fontSize: 38, letterSpacing: 5, color: colors.ink },
  splashSub: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 2.5, color: colors.gold, marginTop: 8 },
  splashBottom: { paddingBottom: 32 },
  splashCtaButton: { justifyContent: "center", paddingVertical: 16, borderRadius: 30 },

  viewport: { flex: 1, overflow: "hidden" },

  slide: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },

  eyebrowRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
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

  landingRingCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 108,
    height: 108,
    alignItems: "center",
    justifyContent: "center",
  },

  ghostLabel: { fontFamily: fonts.mono, fontSize: 12, color: colors.slate },
  proofCount: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.verified },

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(31,122,92,0.08)",
    borderRadius: 100,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  liveBadgeText: { fontFamily: fonts.mono, fontSize: 10.5, color: colors.verified, letterSpacing: 0.3 },

  stageLabel: { fontFamily: fonts.sansMedium, fontSize: 11.5, color: colors.ink, textAlign: "center", lineHeight: 15 },
  stageLabelMuted: { color: colors.slate },

  coachQuote: { fontFamily: fonts.sans, fontSize: 14.5, fontStyle: "italic", lineHeight: 21, color: colors.ink },

  roleChipIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(16,25,43,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  roleChipLabel: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.ink },
  roleChipBody: { fontFamily: fonts.sans, fontSize: 11, color: colors.slate, textAlign: "center", lineHeight: 15 },

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
