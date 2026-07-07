import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ShieldCheck, Users } from "lucide-react-native";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { getConfidenceBand } from "../../utils/confidenceBand";
import { cohorts } from "../../data/universityData";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

export default function CohortsScreen() {
  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.heading}>Cohorts</Text>
          <Text style={styles.subheading}>Adaptive readiness per programme — a live signal, not a fixed graduation date.</Text>

          <View style={{ gap: 12, marginTop: 8 }}>
            {cohorts.map((c) => {
              const band = getConfidenceBand(c.readiness);
              return (
                <GlassCard key={c.programme} radius={20}>
                  <View style={styles.card}>
                    <View style={styles.head}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.programme}>{c.programme}</Text>
                        <Text style={styles.year}>{c.year} · {c.students} students</Text>
                      </View>
                      <View style={[styles.ring, { borderColor: band.hex }]}>
                        <Text style={[styles.ringText, { color: band.hex }]}>{c.readiness}</Text>
                      </View>
                    </View>

                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Users size={13} color={colors.slate} />
                        <Text style={styles.metaText}>{c.verifiedPct}% verified</Text>
                      </View>
                      {c.issuerActive && (
                        <View style={styles.issuerChip}>
                          <ShieldCheck size={12} color={colors.verified} />
                          <Text style={styles.issuerText}>Credential issuer active</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.track}>
                      <View style={[styles.fill, { width: `${c.readiness}%`, backgroundColor: band.hex }]} />
                    </View>
                  </View>
                </GlassCard>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 110, gap: 6 },
  heading: { fontFamily: fonts.displayBold, fontSize: 28, color: colors.ink, marginTop: 4 },
  subheading: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, marginTop: 4, lineHeight: 17 },

  card: { padding: 16, gap: 11 },
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
  programme: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink },
  year: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate, marginTop: 1 },
  ring: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  ringText: { fontFamily: fonts.mono, fontSize: 13 },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate },
  issuerChip: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(31,122,92,0.1)", borderRadius: 100, paddingVertical: 3, paddingHorizontal: 9 },
  issuerText: { fontFamily: fonts.mono, fontSize: 10, color: colors.verified },

  track: { height: 5, backgroundColor: "rgba(16,25,43,0.08)", borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 3 },
});
