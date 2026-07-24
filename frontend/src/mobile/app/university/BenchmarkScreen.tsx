// U4 — Behavioral Benchmark, full list. Pulled out of Pulse (which used to embed this
// whole feature inline) into its own hub so Pulse can stay a "pulse" — a teaser card links
// in from there, and each row here still drills into BenchmarkDetailScreen.
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronRight } from "lucide-react-native";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { getBehavioralBenchmark, type University } from "../../data/universityData";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { UniversityHomeStackParamList } from "../../navigation/UniversityHomeStack";

type Props = NativeStackScreenProps<UniversityHomeStackParamList, "BenchmarkHub"> & { university: University };

export default function BenchmarkScreen({ university, navigation }: Props) {
  const behavioralBenchmark = getBehavioralBenchmark(university);

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.subheading}>Aggregated from completed SimuHire sessions across this cohort.</Text>

          <GlassCard radius={18}>
            <View style={styles.benchList}>
              {behavioralBenchmark.map((d, i) => (
                <Pressable
                  key={d.name}
                  style={[styles.benchItem, i > 0 && styles.divider]}
                  onPress={() => navigation.navigate("BenchmarkDetail", { dimension: d.name })}
                >
                  <View style={styles.benchRow}>
                    <Text style={styles.benchName}>{d.name}</Text>
                    <Text style={styles.benchScore}>{d.score}</Text>
                    <ChevronRight size={14} color={colors.slate} />
                  </View>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${d.score}%` }]} />
                  </View>
                </Pressable>
              ))}
            </View>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, gap: 16 },
  subheading: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.slate, lineHeight: 18 },

  benchList: { padding: 16 },
  benchItem: { gap: 5, paddingVertical: 12 },
  divider: { borderTopWidth: 1, borderTopColor: "rgba(16,25,43,0.08)" },
  benchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  benchName: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 13.5, color: colors.ink },
  benchScore: { fontFamily: fonts.mono, fontSize: 13, color: colors.ink },
  track: { height: 5, backgroundColor: "rgba(16,25,43,0.08)", borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: colors.verified, borderRadius: 3 },
});
