import { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, TrendingUp } from "lucide-react-native";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { getConfidenceBand } from "../../utils/confidenceBand";
import { discoverCandidates, type DiscoverCandidate } from "../../data/employerData";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

function CandidateCard({ c }: { c: DiscoverCandidate }) {
  const band = getConfidenceBand(c.trustScore);
  const initials = c.name.split(" ").map((n) => n[0]).join("");
  return (
    <GlassCard radius={20}>
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{c.name}</Text>
            <Text style={styles.meta} numberOfLines={1}>
              {c.field} · {c.university}
            </Text>
          </View>
          <View style={[styles.scoreRing, { borderColor: band.hex }]}>
            <Text style={[styles.scoreText, { color: band.hex }]}>{c.trustScore}</Text>
          </View>
        </View>

        {/* E1 — verified skills */}
        {c.verifiedSkills.length > 0 && (
          <View style={styles.skillRow}>
            {c.verifiedSkills.slice(0, 3).map((s) => (
              <View key={s.name} style={styles.skillChip}>
                <Check size={9} color={colors.verified} strokeWidth={3} />
                <Text style={styles.skillText}>{s.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* E2 — smart matching trajectory */}
        <View style={styles.trajRow}>
          <TrendingUp size={13} color={colors.gold} />
          <Text style={styles.trajText}>{c.trajectory}</Text>
        </View>
      </View>
    </GlassCard>
  );
}

export default function DiscoverScreen() {
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const list = useMemo(
    () =>
      discoverCandidates
        .filter((c) => !verifiedOnly || c.verifiedSkills.length > 0)
        .sort((a, b) => b.trustScore - a.trustScore),
    [verifiedOnly]
  );

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Text style={styles.heading}>Discover</Text>
            <Pressable
              onPress={() => setVerifiedOnly((v) => !v)}
              style={[styles.filterChip, verifiedOnly && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, verifiedOnly && styles.filterTextActive]}>Verified only</Text>
            </Pressable>
          </View>
          <Text style={styles.subheading}>Filtered by verified skill confidence — not keyword guessing.</Text>

          <View style={{ gap: 12, marginTop: 4 }}>
            {list.map((c) => (
              <CandidateCard key={c.id} c={c} />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 110, gap: 6 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heading: { fontFamily: fonts.displayBold, fontSize: 28, color: colors.ink, marginTop: 4 },
  subheading: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, marginTop: 4 },
  filterChip: { borderWidth: 1, borderColor: colors.line, borderRadius: 100, paddingVertical: 7, paddingHorizontal: 14, backgroundColor: "rgba(255,255,255,0.5)" },
  filterChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  filterText: { fontFamily: fonts.mono, fontSize: 11, color: colors.ink },
  filterTextActive: { color: colors.parchment },

  card: { padding: 16, gap: 12 },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(16,25,43,0.06)", alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: fonts.displayBold, fontSize: 15, color: colors.ink },
  name: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink },
  meta: { fontFamily: fonts.sans, fontSize: 11, color: colors.slate, marginTop: 1 },
  scoreRing: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  scoreText: { fontFamily: fonts.mono, fontSize: 13 },

  skillRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  skillChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(31,122,92,0.1)", borderRadius: 100, paddingVertical: 3, paddingHorizontal: 9 },
  skillText: { fontFamily: fonts.mono, fontSize: 10, color: colors.verified },

  trajRow: { flexDirection: "row", alignItems: "center", gap: 7, borderTopWidth: 1, borderTopColor: "rgba(16,25,43,0.08)", paddingTop: 10 },
  trajText: { flex: 1, fontFamily: fonts.sans, fontSize: 11.5, color: colors.slate, lineHeight: 16 },
});
