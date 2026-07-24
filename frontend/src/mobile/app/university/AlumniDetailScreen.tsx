import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MessageCircle, Sparkles } from "lucide-react-native";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { getAlumniDetail, type University } from "../../data/universityData";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

type Props = { university: University; route: { params: { window: string } } };

export default function AlumniDetailScreen({ university, route }: Props) {
  const { checkin, signals } = getAlumniDetail(university, route.params.window);

  if (!checkin) return null;

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <GlassCard radius={20}>
            <View style={styles.card}>
              <View style={styles.head}>
                <MessageCircle size={16} color={colors.ink} />
                <Text style={styles.window}>{checkin.window} check-in</Text>
              </View>
              <Text style={styles.responded}>{checkin.responded} alumni responded</Text>
              <Text style={styles.note}>{checkin.note}</Text>
            </View>
          </GlassCard>

          <Text style={styles.sectionLabel}>Anonymised follow-up signals</Text>
          <View style={{ gap: 10 }}>
            {signals.map((s, i) => (
              <GlassCard key={i} radius={16}>
                <View style={styles.signalRow}>
                  <Sparkles size={14} color={colors.gold} />
                  <Text style={styles.signalText}>{s}</Text>
                </View>
              </GlassCard>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, gap: 16 },

  card: { padding: 18, gap: 8 },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  window: { fontFamily: fonts.displayBold, fontSize: 19, color: colors.ink },
  responded: { fontFamily: fonts.mono, fontSize: 12, color: colors.slate },
  note: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.ink, lineHeight: 19, marginTop: 4 },

  sectionLabel: { fontFamily: fonts.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: colors.slate },
  signalRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 16 },
  signalText: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.ink, lineHeight: 18 },
});
