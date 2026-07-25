// Design ahead — the "Designer" part. Plan a break instead of stumbling into it.
//
// Reads the candidate's most recently planned chapter (real, from LifeChapterContext) and
// shows its real financial runway if a savings goal was set. No chapter yet, or a chapter
// with no goal set, gets an honest empty/partial state instead of invented numbers — the
// re-entry ramp checklist is generic prep advice, kept even with no chapter selected, and
// persisted per-candidate so ticking items off actually sticks.
import { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Wallet, Circle, CheckCircle2 } from "lucide-react-native";
import GlassCard from "../shared/GlassCard";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { useAuth } from "../../context/AuthContext";
import { useLifeChapters } from "../../context/LifeChapterContext";
import { usePersistentState } from "../../utils/usePersistentState";

const RAMP_ITEMS = [
  "Keep your top verified skills warm — one small project each quarter",
  "Refresh your Smart Namecard before you step out",
  "Run a SimuHire the week before interviews restart",
  "Re-open the Coach's monthly pulse two months before return",
];

export default function ChapterPlanner() {
  const { user } = useAuth();
  const { chaptersFor, updateChapter } = useLifeChapters();
  const [done, setDone] = usePersistentState<Record<number, boolean>>("life_chapter_ramp_" + (user?.id ?? "anon"), {});

  const chapter = useMemo(() => {
    if (!user) return null;
    const planned = chaptersFor(user.id).filter((c) => c.status === "planned");
    return planned[0] ?? null;
  }, [chaptersFor, user]);

  const toggle = (i: number) => setDone((prev) => ({ ...prev, [i]: !prev[i] }));

  if (!chapter) {
    return (
      <GlassCard radius={18}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Nothing planned yet</Text>
          <Text style={styles.emptyBody}>Plan a chapter below and its runway and re-entry checklist will show up here.</Text>
        </View>
      </GlassCard>
    );
  }

  const hasGoal = chapter.savingsGoal != null && chapter.savingsGoal > 0;
  const pct = hasGoal ? Math.round((chapter.savingsSaved / chapter.savingsGoal!) * 100) : 0;
  const gap = hasGoal ? Math.max(chapter.savingsGoal! - chapter.savingsSaved, 0) : 0;

  const bumpSaved = (delta: number) => {
    if (!hasGoal) return;
    const next = Math.max(0, Math.min(chapter.savingsGoal!, chapter.savingsSaved + delta));
    updateChapter(chapter.id, { savingsSaved: next });
  };

  return (
    <GlassCard radius={18}>
      <View style={styles.wrap}>
        <Text style={styles.chapter}>
          {chapter.title} · {chapter.period}
        </Text>

        {/* Financial runway */}
        {hasGoal ? (
          <View style={styles.block}>
            <View style={styles.blockHead}>
              <Wallet size={14} color={colors.ink} />
              <Text style={styles.blockTitle}>Financial runway</Text>
              <Text style={styles.pct}>{pct}%</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.min(pct, 100)}%` }]} />
            </View>
            <Text style={styles.runwayMeta}>
              RM{chapter.savingsSaved.toLocaleString()} of RM{chapter.savingsGoal!.toLocaleString()} · RM{gap.toLocaleString()} to go
            </Text>
            <View style={styles.bumpRow}>
              <Pressable style={styles.bumpButton} onPress={() => bumpSaved(-500)}>
                <Text style={styles.bumpButtonText}>− RM500</Text>
              </Pressable>
              <Pressable style={styles.bumpButton} onPress={() => bumpSaved(500)}>
                <Text style={styles.bumpButtonText}>+ RM500</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Text style={styles.noGoal}>No savings goal set for this chapter yet — edit it above to track runway here.</Text>
        )}

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
  bumpRow: { flexDirection: "row", gap: 8, marginTop: 2 },
  bumpButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.12)",
    backgroundColor: "rgba(16,25,43,0.02)",
  },
  bumpButtonText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.ink },
  noGoal: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.slate, lineHeight: 18 },
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
  emptyWrap: { padding: 18, gap: 4 },
  emptyTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  emptyBody: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.slate, lineHeight: 18 },
});
