// Timing engine — "the right moment to move", as a signal, not a nag.
//
// Blends four inputs the Coach can actually observe (pay gap, skill stagnation, market
// heat, tenure) into a single move-readiness score, shows what's driving it, and gives a
// *balanced* recommendation — ask for a raise before jumping when the gap looks internal.
import { View, Text, Pressable, StyleSheet } from "react-native";
import { TrendingUp, TrendingDown, Minus, ArrowRight, Flame } from "lucide-react-native";
import GlassCard from "../shared/GlassCard";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

export interface CoachProfile {
  currency: string;
  currentSalary: number;
  marketMedian: number;
  role: string;
  tenureMonths: number;
  monthsSinceLastSkill: number;
  topSkill: string;
  marketHeatPct: number;
}

interface Props {
  profile: CoachProfile;
  onBuildCase: () => void; // -> SalaryTruth
  onExplore: () => void; // -> CareerPath
}

type Dir = "up" | "down" | "flat";

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

function band(score: number) {
  if (score >= 67) return { label: "Strong signal to move", hex: colors.pending };
  if (score >= 34) return { label: "Worth watching", hex: colors.gold };
  return { label: "Settled", hex: colors.verified };
}

export default function MoveReadiness({ profile, onBuildCase, onExplore }: Props) {
  const payGapPct = Math.round(((profile.marketMedian - profile.currentSalary) / profile.currentSalary) * 100);

  // Each factor contributes 0..100; the score is their weighted blend.
  const factors: { key: string; label: string; read: string; dir: Dir; weight: number; value: number }[] = [
    {
      key: "pay",
      label: "Pay gap",
      read: payGapPct > 0 ? `${payGapPct}% below market median` : "At or above market",
      dir: payGapPct > 8 ? "up" : "flat",
      weight: 0.35,
      value: clamp(payGapPct * 4),
    },
    {
      key: "stagnation",
      label: "Skill momentum",
      read:
        profile.monthsSinceLastSkill >= 3
          ? `${profile.monthsSinceLastSkill} months since a new verified skill`
          : "Actively adding verified skills",
      dir: profile.monthsSinceLastSkill >= 3 ? "up" : "down",
      weight: 0.25,
      value: clamp(profile.monthsSinceLastSkill * 15),
    },
    {
      key: "market",
      label: "Market heat",
      read: `${profile.topSkill} demand up ${profile.marketHeatPct}% this quarter`,
      dir: profile.marketHeatPct > 10 ? "up" : "flat",
      weight: 0.25,
      value: clamp(profile.marketHeatPct * 2.5),
    },
    {
      key: "tenure",
      label: "Tenure",
      read: `${profile.tenureMonths} months in role`,
      dir: profile.tenureMonths >= 18 ? "up" : "flat",
      weight: 0.15,
      value: clamp((profile.tenureMonths - 6) * 5),
    },
  ];

  const score = Math.round(factors.reduce((sum, f) => sum + f.weight * f.value, 0));
  const b = band(score);

  // Balanced call: if the pay gap is the main driver and tenure is short, the honest move
  // is to fix it internally first.
  const gapDriven = payGapPct >= 10 && profile.tenureMonths < 24;
  const rec = gapDriven
    ? {
        text: "Your gap looks internal-fixable. Build a data-backed raise case before you look elsewhere.",
        cta: "Build my raise case",
        onPress: onBuildCase,
      }
    : {
        text: "The signal is broad — worth exploring roles that match your verified profile.",
        cta: "Explore matched roles",
        onPress: onExplore,
      };

  const DirIcon = ({ dir }: { dir: Dir }) =>
    dir === "up" ? (
      <TrendingUp size={13} color={colors.pending} />
    ) : dir === "down" ? (
      <TrendingDown size={13} color={colors.verified} />
    ) : (
      <Minus size={13} color={colors.slate} />
    );

  return (
    <GlassCard radius={18}>
      <View style={styles.wrap}>
        <Text style={styles.label}>Move-readiness</Text>
        <View style={styles.scoreRow}>
          <Text style={[styles.score, { color: b.hex }]}>{score}</Text>
          <Text style={styles.scoreMax}>/100</Text>
          <View style={[styles.pill, { backgroundColor: `${b.hex}1A`, borderColor: `${b.hex}66` }]}>
            <Text style={[styles.pillText, { color: b.hex }]}>{b.label}</Text>
          </View>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${score}%`, backgroundColor: b.hex }]} />
        </View>

        {/* Market-heat alert */}
        <View style={styles.heatRow}>
          <Flame size={14} color={colors.alert} />
          <Text style={styles.heatText}>
            {profile.topSkill} demand is up {profile.marketHeatPct}% — roles are paying more this quarter.
          </Text>
        </View>

        {/* Factors */}
        <View style={styles.factors}>
          {factors.map((f) => (
            <View key={f.key} style={styles.factorRow}>
              <DirIcon dir={f.dir} />
              <Text style={styles.factorLabel}>{f.label}</Text>
              <Text style={styles.factorRead}>{f.read}</Text>
            </View>
          ))}
        </View>

        {/* Balanced recommendation */}
        <View style={styles.recBox}>
          <Text style={styles.recText}>{rec.text}</Text>
          <Pressable style={styles.recBtn} onPress={rec.onPress}>
            <Text style={styles.recBtnText}>{rec.cta}</Text>
            <ArrowRight size={14} color={colors.parchment} />
          </Pressable>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 18, gap: 12 },
  label: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: colors.slate },
  scoreRow: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  score: { fontFamily: fonts.displayBold, fontSize: 34, lineHeight: 36 },
  scoreMax: { fontFamily: fonts.mono, fontSize: 14, color: colors.slate, marginBottom: 4 },
  pill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, borderWidth: 1, marginBottom: 4, marginLeft: 4 },
  pillText: { fontFamily: fonts.sansSemiBold, fontSize: 11 },
  track: { height: 8, backgroundColor: "rgba(16,25,43,0.08)", borderRadius: 4, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 4 },
  heatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "rgba(196,80,58,0.07)",
    borderWidth: 1,
    borderColor: "rgba(196,80,58,0.18)",
  },
  heatText: { flex: 1, fontFamily: fonts.sans, fontSize: 12, color: colors.ink, lineHeight: 17 },
  factors: { gap: 9, marginTop: 2 },
  factorRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  factorLabel: { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.ink, width: 96 },
  factorRead: { flex: 1, fontFamily: fonts.sans, fontSize: 12, color: colors.slate },
  recBox: {
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(16,25,43,0.03)",
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.08)",
  },
  recText: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.ink, lineHeight: 18 },
  recBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.ink,
  },
  recBtnText: { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.parchment },
});
