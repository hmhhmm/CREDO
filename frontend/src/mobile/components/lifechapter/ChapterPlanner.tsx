// Design ahead — the "Designer" part. Plan a break instead of stumbling into it.
//
// For the next planned chapter: a financial runway (are you ready?), a least-costly window
// hint, and a re-entry ramp so coming back doesn't mean starting over. Runway numbers stay
// consistent with the SalaryTruth benchmark (RM / KL).
import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Wallet, CalendarClock, Circle, CheckCircle2 } from "lucide-react-native";
import GlassCard from "../shared/GlassCard";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

const CHAPTER = "Sabbatical · 2026 Q4";
const RUNWAY = { currency: "RM", target: 30000, saved: 22500, readyBy: "Sep 2026" };
const BEST_WINDOW = "Least career-costly window: right after your Q3 review, once this cycle's raise lands.";

const RAMP_ITEMS = [
  "Keep PyTorch & SQL warm — one small project each quarter",
  "Refresh your Smart Namecard before you step out",
  "Run a SimuHire the week before interviews restart",
  "Re-open the Coach's monthly pulse two months before return",
];

export default function ChapterPlanner() {
  const [done, setDone] = useState<Record<number, boolean>>({});
  const pct = Math.round((RUNWAY.saved / RUNWAY.target) * 100);
  const gap = RUNWAY.target - RUNWAY.saved;

  const toggle = (i: number) => setDone((prev) => ({ ...prev, [i]: !prev[i] }));

  return (
    <GlassCard radius={18}>
      <View style={styles.wrap}>
        <Text style={styles.chapter}>{CHAPTER}</Text>

        {/* Financial runway */}
        <View style={styles.block}>
          <View style={styles.blockHead}>
            <Wallet size={14} color={colors.ink} />
            <Text style={styles.blockTitle}>Financial runway</Text>
            <Text style={styles.pct}>{pct}%</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.runwayMeta}>
            {RUNWAY.currency}
            {RUNWAY.saved.toLocaleString()} of {RUNWAY.currency}
            {RUNWAY.target.toLocaleString()} · {RUNWAY.currency}
            {gap.toLocaleString()} to go · on pace for {RUNWAY.readyBy}
          </Text>
        </View>

        {/* Best window */}
        <View style={styles.window}>
          <CalendarClock size={14} color={colors.gold} />
          <Text style={styles.windowText}>{BEST_WINDOW}</Text>
        </View>

        {/* Re-entry ramp */}
        <View>
          <Text style={styles.rampLabel}>Re-entry ramp</Text>
          {RAMP_ITEMS.map((item, i) => {
            const checked = !!done[i];
            return (
              <Pressable key={i} style={styles.rampRow} onPress={() => toggle(i)}>
                {checked ? <CheckCircle2 size={17} color={colors.verified} /> : <Circle size={17} color={colors.slate} />}
                <Text style={[styles.rampText, checked && styles.rampTextDone]}>{item}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 18, gap: 14 },
  chapter: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink },
  block: { gap: 7 },
  blockHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  blockTitle: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink },
  pct: { fontFamily: fonts.mono, fontSize: 13, color: colors.verified },
  track: { height: 8, backgroundColor: "rgba(16,25,43,0.08)", borderRadius: 4, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: colors.verified, borderRadius: 4 },
  runwayMeta: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate, lineHeight: 16 },
  window: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 11,
    borderRadius: 11,
    backgroundColor: "rgba(201,166,70,0.08)",
    borderWidth: 1,
    borderColor: "rgba(201,166,70,0.2)",
  },
  windowText: { flex: 1, fontFamily: fonts.sans, fontSize: 12, color: colors.ink, lineHeight: 17 },
  rampLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.slate,
    marginBottom: 8,
  },
  rampRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 7 },
  rampText: { flex: 1, fontFamily: fonts.sans, fontSize: 12.5, color: colors.ink, lineHeight: 17 },
  rampTextDone: { color: colors.slate, textDecorationLine: "line-through" },
});
