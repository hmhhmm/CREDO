// Destigmatize the gap — a break becomes an authored, verified *chapter*, not a hole.
//
// Past and planned chapters share one timeline. Each carries an intent label, a verified
// marker (backed by the ledger), and a candidate-controlled disclosure setting the person
// can cycle right here: show it as a chapter, show a neutral "career break", or hide it.
import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Baby, HeartPulse, Compass, GraduationCap, Eye, EyeOff, ShieldCheck, Users } from "lucide-react-native";
import GlassCard from "../shared/GlassCard";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

type Disclosure = "chapter" | "break" | "hidden";
type Kind = "parental" | "health" | "sabbatical" | "education";

interface Chapter {
  id: string;
  kind: Kind;
  title: string;
  period: string;
  status: "past" | "planned";
  verified: boolean;
  note: string;
  disclosure: Disclosure;
}

const KIND_ICON = { parental: Baby, health: HeartPulse, sabbatical: Compass, education: GraduationCap };

const DISCLOSURE_META: Record<Disclosure, { label: string; hex: string; Icon: typeof Eye }> = {
  chapter: { label: "Shown as chapter", hex: colors.verified, Icon: Eye },
  break: { label: "Neutral break", hex: colors.gold, Icon: Eye },
  hidden: { label: "Hidden", hex: colors.slate, Icon: EyeOff },
};

const ORDER: Disclosure[] = ["chapter", "break", "hidden"];

const INITIAL: Chapter[] = [
  {
    id: "c1",
    kind: "health",
    title: "Health recovery",
    period: "2024",
    status: "past",
    verified: true,
    note: "Six months out. Kept two skills warm and finished one online course — rest was the point.",
    disclosure: "chapter",
  },
  {
    id: "c2",
    kind: "sabbatical",
    title: "Sabbatical",
    period: "2026 · Q4",
    status: "planned",
    verified: false,
    note: "Planned 6-month break. Runway and re-entry ramp mapped below.",
    disclosure: "break",
  },
  {
    id: "c3",
    kind: "parental",
    title: "Parental leave",
    period: "2027",
    status: "planned",
    verified: false,
    note: "Return-to-work timeline that preserves verified momentum.",
    disclosure: "chapter",
  },
];

export default function ChapterTimeline() {
  const [chapters, setChapters] = useState<Chapter[]>(INITIAL);

  const cycle = (id: string) =>
    setChapters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, disclosure: ORDER[(ORDER.indexOf(c.disclosure) + 1) % ORDER.length] } : c))
    );

  return (
    <GlassCard radius={18}>
      <View style={styles.wrap}>
        <Text style={styles.intro}>Your chapters — authored, not explained away. Tap a badge to set who sees each one.</Text>

        {chapters.map((c, i) => {
          const KindIcon = KIND_ICON[c.kind];
          const d = DISCLOSURE_META[c.disclosure];
          const last = i === chapters.length - 1;
          return (
            <View key={c.id} style={styles.row}>
              {/* Rail */}
              <View style={styles.rail}>
                <View style={[styles.node, c.status === "planned" && styles.nodePlanned]}>
                  <KindIcon size={13} color={c.status === "planned" ? colors.gold : colors.parchment} />
                </View>
                {!last && <View style={styles.line} />}
              </View>

              {/* Body */}
              <View style={styles.body}>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>{c.title}</Text>
                  <Text style={styles.period}>{c.period}</Text>
                </View>
                <View style={styles.metaRow}>
                  {c.verified ? (
                    <View style={styles.verified}>
                      <ShieldCheck size={11} color={colors.verified} />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  ) : (
                    <Text style={styles.planned}>Planned</Text>
                  )}
                </View>
                <Text style={styles.note}>{c.note}</Text>

                <Pressable style={[styles.badge, { backgroundColor: `${d.hex}14`, borderColor: `${d.hex}59` }]} onPress={() => cycle(c.id)}>
                  <d.Icon size={11} color={d.hex} />
                  <Text style={[styles.badgeText, { color: d.hex }]}>{d.label}</Text>
                </Pressable>
              </View>
            </View>
          );
        })}

        {/* Normalize */}
        <View style={styles.normalize}>
          <Users size={13} color={colors.slate} />
          <Text style={styles.normalizeText}>1 in 3 strong candidates has authored a chapter. You're in good company.</Text>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 18, gap: 12 },
  intro: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.slate, lineHeight: 18 },
  row: { flexDirection: "row", gap: 12 },
  rail: { alignItems: "center", width: 26 },
  node: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.verified,
    alignItems: "center",
    justifyContent: "center",
  },
  nodePlanned: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: colors.gold, borderStyle: "dashed" },
  line: { flex: 1, width: 2, backgroundColor: "rgba(16,25,43,0.12)", marginTop: 2, minHeight: 18 },
  body: { flex: 1, paddingBottom: 14, gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  period: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate },
  metaRow: { flexDirection: "row", alignItems: "center" },
  verified: { flexDirection: "row", alignItems: "center", gap: 4 },
  verifiedText: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.5, color: colors.verified },
  planned: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.5, color: colors.gold },
  note: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, lineHeight: 17 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 3,
  },
  badgeText: { fontFamily: fonts.sansMedium, fontSize: 11 },
  normalize: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 11,
    borderRadius: 11,
    backgroundColor: "rgba(16,25,43,0.03)",
  },
  normalizeText: { flex: 1, fontFamily: fonts.sans, fontSize: 12, color: colors.ink, lineHeight: 17 },
});
