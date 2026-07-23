import { View, ScrollView, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowRight } from "lucide-react-native";
import PreviewBanner from "../../components/shared/PreviewBanner";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { useDemo } from "../../context/DemoContext";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

const NEXT_MOVES = [
  {
    title: "Machine Learning Engineer",
    match: 82,
    reason: "Your verified Python and ML skills cover most requirements.",
    gap: "Add a deployed model project to close the gap on MLOps.",
  },
  {
    title: "Data Platform Engineer",
    match: 68,
    reason: "SQL and Docker verification carry over directly.",
    gap: "Cloud infrastructure experience (AWS/GCP) isn't yet verified.",
  },
  {
    title: "Backend Engineer",
    match: 61,
    reason: "Strong systems fundamentals from verified repos.",
    gap: "No verified API/backend-framework project yet.",
  },
];

export default function CareerPathScreen() {
  const { liveCandidate } = useDemo();

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
          <PreviewBanner />
          <Text style={styles.intro}>
            Based on {liveCandidate.verifiedSkills.length > 0 ? "your verified skills" : "a candidate with verified Python/ML/SQL/Docker skills"}, here are realistic next moves — not guesses.
          </Text>
          {NEXT_MOVES.map((move) => (
            <GlassCard key={move.title} radius={18}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{move.title}</Text>
                  <Text style={styles.match}>{move.match}% match</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${move.match}%` }]} />
                </View>
                <Text style={styles.reason}>{move.reason}</Text>
                <View style={styles.gapRow}>
                  <ArrowRight size={12} color={colors.pending} />
                  <Text style={styles.gap}>{move.gap}</Text>
                </View>
              </View>
            </GlassCard>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  intro: { fontFamily: fonts.sans, fontSize: 13, color: colors.slate, lineHeight: 19 },
  card: { padding: 16, gap: 9 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink },
  match: { fontFamily: fonts.mono, fontSize: 12, color: colors.verified },
  track: { height: 5, backgroundColor: "rgba(16,25,43,0.08)", borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: colors.verified, borderRadius: 3 },
  reason: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink, lineHeight: 17 },
  gapRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  gap: { flex: 1, fontFamily: fonts.sans, fontSize: 12, color: colors.slate, lineHeight: 17 },
});
