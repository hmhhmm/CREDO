import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Users } from "lucide-react-native";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import ScoreRing from "../../components/shared/ScoreRing";
import { getBenchmarkDetail, type University } from "../../data/universityData";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

type Props = { university: University; route: { params: { dimension: string } } };

export default function BenchmarkDetailScreen({ university, route }: Props) {
  const { dimensionName, benchmark, contributors } = getBenchmarkDetail(university, route.params.dimension);

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <GlassCard radius={24}>
            <View style={styles.hero}>
              <Text style={styles.dimensionName}>{dimensionName}</Text>
              <ScoreRing score={benchmark?.score ?? 0} size="lg" />
              <Text style={styles.caption}>
                Averaged from {contributors.length} completed SimuHire session{contributors.length === 1 ? "" : "s"}
              </Text>
            </View>
          </GlassCard>

          <Text style={styles.sectionLabel}>Contributing sessions</Text>
          {contributors.length === 0 ? (
            <Text style={styles.empty}>No completed SimuHire sessions for this dimension yet.</Text>
          ) : (
            <GlassCard radius={18}>
              <View style={styles.list}>
                {contributors.map((s, i) => (
                  <View key={s.name} style={[styles.row, i > 0 && styles.divider]}>
                    <Users size={14} color={colors.slate} />
                    <Text style={styles.name}>{s.name}</Text>
                    <Text style={styles.score}>{s.score}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, gap: 16 },

  hero: { alignItems: "center", padding: 24, gap: 10 },
  dimensionName: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.ink },
  caption: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, textAlign: "center" },

  sectionLabel: { fontFamily: fonts.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: colors.slate },
  empty: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.slate, fontStyle: "italic" },

  list: { padding: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  divider: { borderTopWidth: 1, borderTopColor: "rgba(16,25,43,0.08)" },
  name: { flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.ink },
  score: { fontFamily: fonts.mono, fontSize: 14, color: colors.ink },
});
