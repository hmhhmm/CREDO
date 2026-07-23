// Support during the chapter — the one place where *not* nudging is the respectful move.
//
// When someone is on a break, the persistent Coach should step back on their terms: pick a
// check-in cadence, and keep-warm is strictly opt-in with an easy off switch. Rest is valid.
import { useState } from "react";
import { View, Text, Pressable, Switch, StyleSheet } from "react-native";
import { Moon, Bell } from "lucide-react-native";
import GlassCard from "../shared/GlassCard";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

type Cadence = "quiet" | "monthly" | "active";

const CADENCES: { key: Cadence; label: string; blurb: string }[] = [
  { key: "quiet", label: "Go quiet", blurb: "No nudges. The Coach waits until you come back." },
  { key: "monthly", label: "Monthly", blurb: "One gentle check-in a month — nothing more." },
  { key: "active", label: "Active", blurb: "Normal cadence — you'd rather stay in the loop." },
];

export default function ChapterSupport() {
  const [onBreak, setOnBreak] = useState(false);
  const [cadence, setCadence] = useState<Cadence>("monthly");
  const [keepWarm, setKeepWarm] = useState(false);

  return (
    <GlassCard radius={18}>
      <View style={styles.wrap}>
        <View style={styles.head}>
          <Moon size={15} color={colors.ink} />
          <Text style={styles.title}>On a chapter right now?</Text>
          <Switch value={onBreak} onValueChange={setOnBreak} />
        </View>
        <Text style={styles.sub}>
          {onBreak
            ? "Coach paused on your terms. Enjoy the time — everything's here when you're ready."
            : "Flip this when you step out and the Coach adjusts to your pace."}
        </Text>

        {onBreak && (
          <>
            <View style={styles.cadenceHead}>
              <Bell size={13} color={colors.slate} />
              <Text style={styles.cadenceLabel}>Check-ins while I'm away</Text>
            </View>
            <View style={styles.cadenceList}>
              {CADENCES.map((c) => {
                const on = c.key === cadence;
                return (
                  <Pressable key={c.key} style={[styles.cadenceRow, on && styles.cadenceRowOn]} onPress={() => setCadence(c.key)}>
                    <View style={[styles.radio, on && styles.radioOn]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cadenceName}>{c.label}</Text>
                      <Text style={styles.cadenceBlurb}>{c.blurb}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.warmRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.warmTitle}>Keep-warm mode</Text>
                <Text style={styles.warmSub}>Optional, low-pressure skill touches. Rest is valid — switch off anytime.</Text>
              </View>
              <Switch value={keepWarm} onValueChange={setKeepWarm} />
            </View>
          </>
        )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 18, gap: 12 },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink },
  sub: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.slate, lineHeight: 18 },
  cadenceHead: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 2 },
  cadenceLabel: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: colors.slate },
  cadenceList: { gap: 8 },
  cadenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 11,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.08)",
    backgroundColor: "rgba(16,25,43,0.02)",
  },
  cadenceRowOn: { borderColor: colors.ink, backgroundColor: "rgba(16,25,43,0.05)" },
  radio: { width: 15, height: 15, borderRadius: 8, borderWidth: 1.5, borderColor: colors.slate },
  radioOn: { borderColor: colors.ink, backgroundColor: colors.ink },
  cadenceName: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink },
  cadenceBlurb: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.slate, marginTop: 1, lineHeight: 16 },
  warmRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(201,166,70,0.07)",
    borderWidth: 1,
    borderColor: "rgba(201,166,70,0.2)",
  },
  warmTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink },
  warmSub: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.slate, marginTop: 2, lineHeight: 16 },
});
