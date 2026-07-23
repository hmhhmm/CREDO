// Reframe — the Smart Namecard as a driver, not a receipt.
//
// Derives a "card strength" score purely from data already on the candidate (no new API):
// each verified source contributes weight, the card earns a tier as it fills, and the
// single highest-gain gap surfaces as a next-best-action that routes the candidate back
// into Verify / SimuHire / Portfolio.
import { View, Text, Pressable, StyleSheet } from "react-native";
import { ChevronRight, ShieldCheck, Sparkles } from "lucide-react-native";
import GlassCard from "../shared/GlassCard";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { Candidate } from "../../data/types";

interface Source {
  key: string;
  label: string;
  weight: number;
  value: number; // 0..1 how complete this source is
  cta: string;
  onPress?: () => void;
}

interface Props {
  candidate: Candidate;
  ledgerCount: number;
  onVerify: () => void;
  onSimuHire: () => void;
  onPortfolio: () => void;
}

function tierFor(score: number): { label: string; hex: string; premium: boolean } {
  if (score >= 80) return { label: "Premium", hex: colors.gold, premium: true };
  if (score >= 50) return { label: "Verified", hex: colors.verified, premium: false };
  return { label: "Building", hex: colors.slate, premium: false };
}

export default function CardStrength({ candidate, ledgerCount, onVerify, onSimuHire, onPortfolio }: Props) {
  const skillCount = candidate.verifiedSkills.filter((s) => s.verified).length;
  const artifactCount = candidate.artifacts.length;
  const hasIdentity = Boolean(candidate.bio) && Boolean(candidate.githubUrl || candidate.linkedinUrl);

  // Weights sum to 100. `value` is how far each source is toward "done".
  const sources: Source[] = [
    { key: "identity", label: "Profile identity", weight: 10, value: hasIdentity ? 1 : 0.4, cta: "Complete your profile", onPress: onVerify },
    { key: "skills", label: "Verified skills", weight: 25, value: Math.min(skillCount / 3, 1), cta: "Verify more skills", onPress: onVerify },
    { key: "artifacts", label: "Verified artifacts", weight: 25, value: Math.min(artifactCount / 3, 1), cta: "Add verified proof", onPress: onVerify },
    { key: "behavioral", label: "Behavioral proof (SimuHire)", weight: 25, value: candidate.simuHire.completed ? 1 : 0, cta: "Run a SimuHire", onPress: onSimuHire },
    { key: "audit", label: "Audit trail", weight: 15, value: ledgerCount > 0 ? 1 : 0, cta: "Build your audit trail", onPress: onPortfolio },
  ];

  const score = Math.round(sources.reduce((sum, s) => sum + s.weight * s.value, 0));
  const tier = tierFor(score);

  // Next-best-action = the incomplete source with the biggest remaining point gain.
  const gaps = sources.filter((s) => s.value < 1).sort((a, b) => b.weight * (1 - b.value) - a.weight * (1 - a.value));
  const next = gaps[0];
  const nextGain = next ? Math.round(next.weight * (1 - next.value)) : 0;

  return (
    <GlassCard radius={18}>
      <View style={styles.wrap}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Card strength</Text>
            <View style={styles.scoreRow}>
              <Text style={styles.score}>{score}</Text>
              <Text style={styles.scoreMax}>/100</Text>
              <View style={[styles.tierPill, { backgroundColor: `${tier.hex}1A`, borderColor: `${tier.hex}66` }]}>
                {tier.premium && <Sparkles size={11} color={tier.hex} />}
                <Text style={[styles.tierText, { color: tier.hex }]}>{tier.label}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.track}>
          <View style={[styles.fill, { width: `${score}%`, backgroundColor: tier.hex }]} />
        </View>

        {next ? (
          <Pressable style={styles.nextAction} onPress={next.onPress}>
            <View style={styles.nextIcon}>
              <Sparkles size={15} color={colors.gold} strokeWidth={2.4} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nextLabel}>Next: {next.cta}</Text>
              <Text style={styles.nextGain}>+{nextGain} pts · biggest boost to your card</Text>
            </View>
            <ChevronRight size={16} color={colors.slate} />
          </Pressable>
        ) : (
          <View style={styles.nextAction}>
            <View style={[styles.nextIcon, { backgroundColor: `${colors.gold}1F` }]}>
              <ShieldCheck size={15} color={colors.gold} strokeWidth={2.4} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nextLabel}>Premium card unlocked</Text>
              <Text style={styles.nextGain}>Every verified source is complete — this card is fully backed.</Text>
            </View>
          </View>
        )}

        <View style={styles.breakdown}>
          {sources.map((s) => {
            const done = s.value >= 1;
            return (
              <View key={s.key} style={styles.sourceRow}>
                <View style={[styles.dot, { backgroundColor: done ? tier.hex : "rgba(16,25,43,0.18)" }]} />
                <Text style={[styles.sourceLabel, done && { color: colors.ink }]}>{s.label}</Text>
                <Text style={[styles.sourcePts, done && { color: tier.hex }]}>
                  {Math.round(s.weight * s.value)}/{s.weight}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 18, gap: 14 },
  header: { flexDirection: "row", alignItems: "center" },
  label: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: colors.slate },
  scoreRow: { flexDirection: "row", alignItems: "flex-end", gap: 6, marginTop: 4 },
  score: { fontFamily: fonts.displayBold, fontSize: 34, color: colors.ink, lineHeight: 36 },
  scoreMax: { fontFamily: fonts.mono, fontSize: 14, color: colors.slate, marginBottom: 4 },
  tierPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 4,
    marginLeft: 4,
  },
  tierText: { fontFamily: fonts.sansSemiBold, fontSize: 11 },
  track: { height: 8, backgroundColor: "rgba(16,25,43,0.08)", borderRadius: 4, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 4 },
  nextAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(201,166,70,0.08)",
    borderWidth: 1,
    borderColor: "rgba(201,166,70,0.22)",
  },
  nextIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "rgba(201,166,70,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  nextLabel: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.ink },
  nextGain: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.slate, marginTop: 1 },
  breakdown: { gap: 7 },
  sourceRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  sourceLabel: { flex: 1, fontFamily: fonts.sans, fontSize: 12.5, color: colors.slate },
  sourcePts: { fontFamily: fonts.mono, fontSize: 11.5, color: colors.slate },
});
