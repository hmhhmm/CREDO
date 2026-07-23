import { View, ScrollView, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AlertTriangle, Lightbulb, Check } from "lucide-react-native";
import PreviewBanner from "../../components/shared/PreviewBanner";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

const INSIGHTS = [
  {
    Icon: AlertTriangle,
    color: colors.pending,
    title: "You may be underpaid",
    body: "Your verified skill level benchmarks 15% above your last reported salary. Worth a conversation at your next review.",
  },
  {
    Icon: Lightbulb,
    color: colors.verified,
    title: "Good moment to explore",
    body: "You've verified 4 skills and completed SimuHire — your profile is stronger than 68% of candidates in your field right now.",
  },
  {
    Icon: Check,
    color: colors.slate,
    title: "Keep building",
    body: "Verifying one more artifact (a credential or second repo) would move you into the top quartile for ML roles.",
  },
];

export default function CareerCoachScreen() {
  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
          <PreviewBanner />
          <Text style={styles.intro}>Persistent, verified-data-aware nudges — not generic career advice.</Text>
          {INSIGHTS.map(({ Icon, color, title, body }) => (
            <GlassCard key={title} radius={18}>
              <View style={styles.card}>
                <Icon size={18} color={color} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color }]}>{title}</Text>
                  <Text style={styles.cardBody}>{body}</Text>
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
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
  },
  cardTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
  cardBody: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink, lineHeight: 18, marginTop: 3 },
});
