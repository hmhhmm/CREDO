// Persistence — the monthly check-in that makes this a mentor, not a tool.
//
// A proactive "pulse" that rolls a pay read + a move signal + one growth action into a
// single card (each line cites the data behind it), tracks a remembered goal against the
// ledger, celebrates a milestone, and offers a monthly reminder. This is the retention
// loop: a reason to open the app when you're *not* job-hunting.
import { useState } from "react";
import { View, Text, Pressable, Switch, StyleSheet } from "react-native";
import { CalendarClock, Target, Award, ArrowRight } from "lucide-react-native";
import GlassCard from "../shared/GlassCard";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

interface PulseLine {
  key: string;
  text: string;
  cite: string;
}

interface Props {
  month: string; // e.g. "July 2026"
  lines: PulseLine[];
  goal: { title: string; done: number; total: number };
  milestone: string;
  onGoalPress: () => void; // -> LifeChapter / CareerPath
}

export default function CareerPulse({ month, lines, goal, milestone, onGoalPress }: Props) {
  const [remind, setRemind] = useState(true);
  const pct = Math.round((goal.done / goal.total) * 100);

  return (
    <GlassCard radius={18}>
      <View style={styles.wrap}>
        <View style={styles.head}>
          <CalendarClock size={15} color={colors.ink} />
          <Text style={styles.title}>Your {month} pulse</Text>
          <View style={styles.newTag}>
            <Text style={styles.newText}>NEW</Text>
          </View>
        </View>

        {/* The three cited lines */}
        <View style={styles.lines}>
          {lines.map((l, i) => (
            <View key={l.key} style={[styles.lineRow, i > 0 && styles.divider]}>
              <View style={styles.lineDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.lineText}>{l.text}</Text>
                <Text style={styles.lineCite}>{l.cite}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Remembered goal */}
        <Pressable style={styles.goalBox} onPress={onGoalPress}>
          <View style={styles.goalHead}>
            <Target size={14} color={colors.verified} />
            <Text style={styles.goalTitle}>{goal.title}</Text>
            <ArrowRight size={14} color={colors.slate} />
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.goalMeta}>
            {goal.done}/{goal.total} milestones · {pct}% there
          </Text>
        </Pressable>

        {/* Milestone recognition */}
        <View style={styles.milestone}>
          <Award size={14} color={colors.gold} />
          <Text style={styles.milestoneText}>{milestone}</Text>
        </View>

        {/* Monthly reminder */}
        <View style={styles.remindRow}>
          <Text style={styles.remindLabel}>Send me a pulse every month</Text>
          <Switch value={remind} onValueChange={setRemind} />
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 18, gap: 13 },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink },
  newTag: { backgroundColor: `${colors.verified}1F`, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  newText: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1, color: colors.verified },
  lines: {},
  lineRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 9 },
  divider: { borderTopWidth: 1, borderTopColor: "rgba(16,25,43,0.08)" },
  lineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.ink, marginTop: 5 },
  lineText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink, lineHeight: 18 },
  lineCite: { fontFamily: fonts.mono, fontSize: 10.5, color: colors.slate, marginTop: 2 },
  goalBox: {
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(31,122,92,0.06)",
    borderWidth: 1,
    borderColor: "rgba(31,122,92,0.18)",
  },
  goalHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  goalTitle: { flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink },
  track: { height: 6, backgroundColor: "rgba(16,25,43,0.08)", borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: colors.verified, borderRadius: 3 },
  goalMeta: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate },
  milestone: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 11,
    borderRadius: 11,
    backgroundColor: "rgba(201,166,70,0.08)",
    borderWidth: 1,
    borderColor: "rgba(201,166,70,0.2)",
  },
  milestoneText: { flex: 1, fontFamily: fonts.sans, fontSize: 12.5, color: colors.ink, lineHeight: 17 },
  remindRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  remindLabel: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink },
});
