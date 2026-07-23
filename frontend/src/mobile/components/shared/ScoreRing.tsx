// Trust-score hero element. Redesigned from a thin flat stamp to a soft-glow ring with
// a large Fraunces numeral — the score is the single most important number in the app,
// so it gets real typographic weight instead of a small mono digit in a hairline circle.
import { View, Text, StyleSheet } from "react-native";
import { getConfidenceBand } from "../../utils/confidenceBand";
import { fonts } from "../../theme/typography";

const SIZES = {
  sm: { outer: 56, font: 20, label: 8, ring: 3 },
  md: { outer: 84, font: 28, label: 9, ring: 4 },
  lg: { outer: 112, font: 38, label: 10, ring: 5 },
  xl: { outer: 156, font: 56, label: 11, ring: 6 },
} as const;

const COLOR_MAP: Record<string, { ring: string; text: string; glow: string; bg: string }> = {
  verified: { ring: "#1F7A5C", text: "#1F7A5C", glow: "rgba(31,122,92,0.18)", bg: "rgba(240,250,246,0.9)" },
  blue: { ring: "#2F6E8F", text: "#2F6E8F", glow: "rgba(47,110,143,0.18)", bg: "rgba(236,243,246,0.9)" },
  pending: { ring: "#D9A441", text: "#D9A441", glow: "rgba(217,164,65,0.2)", bg: "rgba(255,251,235,0.9)" },
  alert: { ring: "#C4503A", text: "#C4503A", glow: "rgba(196,80,58,0.18)", bg: "rgba(254,242,240,0.9)" },
  neutral: { ring: "#6B7785", text: "#6B7785", glow: "rgba(107,119,133,0.14)", bg: "rgba(255,255,255,0.75)" },
};

interface Props {
  score: number;
  size?: keyof typeof SIZES;
}

export default function ScoreRing({ score, size = "md" }: Props) {
  // Zero is "hasn't started yet", not "scored badly" — an alarming red "LOW CONFIDENCE"
  // at 0 makes a brand-new account read as broken. Red is reserved for a genuinely low
  // non-zero score from a real verification.
  const band = score === 0 ? { label: "Get Started", color: "neutral", hex: "#6B7785" } : getConfidenceBand(score);
  const s = SIZES[size];
  const col = COLOR_MAP[band.color] || COLOR_MAP.pending;
  const glowSize = s.outer + 28;

  return (
    <View
      style={styles.wrap}
      accessibilityRole="image"
      accessibilityLabel={`Trust score ${score} out of 100 — ${band.label}`}
    >
      <View style={[styles.ringWrap, { width: glowSize, height: glowSize }]}>
        <View
          style={[
            styles.glow,
            { width: glowSize, height: glowSize, borderRadius: glowSize / 2, backgroundColor: col.glow },
          ]}
        />
        <View
          style={[
            styles.ring,
            {
              width: s.outer,
              height: s.outer,
              borderRadius: s.outer / 2,
              borderWidth: s.ring,
              borderColor: col.ring,
              backgroundColor: col.bg,
            },
          ]}
        >
          <Text style={{ fontFamily: fonts.displayBold, fontSize: s.font, color: col.text, lineHeight: s.font * 1.05 }}>
            {score}
          </Text>
        </View>
      </View>
      <Text style={[styles.label, { fontSize: s.label, color: col.text }]}>{band.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", gap: 10 },
  ringWrap: { alignItems: "center", justifyContent: "center" },
  glow: { position: "absolute" },
  ring: { alignItems: "center", justifyContent: "center" },
  label: { fontFamily: "IBMPlexMono_500Medium", textTransform: "uppercase", letterSpacing: 2, textAlign: "center" },
});
