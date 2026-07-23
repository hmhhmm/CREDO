import { View, ScrollView, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AlertTriangle, Lightbulb, Check } from "lucide-react-native";
import PreviewBanner from "../../components/shared/PreviewBanner";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import MoveReadiness, { type CoachProfile } from "../../components/coach/MoveReadiness";
import CareerPulse from "../../components/coach/CareerPulse";
import AfterHire from "../../components/coach/AfterHire";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { GrowStackParamList } from "../../navigation/GrowStack";

// Demo profile — kept consistent with the SalaryTruth benchmark (RM, KL, ~underpaid).
// In production these come from the ledger + verified skills + market data.
const PROFILE: CoachProfile = {
  currency: "RM",
  currentSalary: 4200,
  marketMedian: 4900,
  role: "Junior ML Engineer",
  tenureMonths: 14,
  monthsSinceLastSkill: 4,
  topSkill: "PyTorch",
  marketHeatPct: 22,
};

const PULSE_LINES = [
  {
    key: "pay",
    text: "You're tracking ~14% below the verified market median for your role.",
    cite: "Verified skills · SalaryTruth benchmark",
  },
  {
    key: "move",
    text: "Move-readiness ticked up this month — mostly skill momentum stalling.",
    cite: "No new verified skill in 4 months",
  },
  {
    key: "grow",
    text: "One more verified artifact moves you into the top quartile for ML roles.",
    cite: "Ledger · peer distribution",
  },
];

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

type Props = NativeStackScreenProps<GrowStackParamList, "CareerCoach">;

export default function CareerCoachScreen({ navigation }: Props) {
  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
          <PreviewBanner />
          <Text style={styles.intro}>Persistent, verified-data-aware nudges — not generic career advice.</Text>

          {/* Persistence — the monthly check-in that brings candidates back */}
          <Text style={styles.sectionLabel}>This month</Text>
          <CareerPulse
            month="July 2026"
            lines={PULSE_LINES}
            goal={{ title: "Senior ML Engineer by 2027", done: 3, total: 5 }}
            milestone="One year since your first verified skill — you've added 4 since."
            onGoalPress={() => navigation.navigate("LifeChapter")}
          />

          {/* Timing engine — the right moment to move */}
          <Text style={styles.sectionLabel}>Should you move?</Text>
          <MoveReadiness
            profile={PROFILE}
            onBuildCase={() => navigation.navigate("SalaryTruth")}
            onExplore={() => navigation.navigate("CareerPath")}
          />

          {/* After-hire value — leverage while employed */}
          <Text style={styles.sectionLabel}>While you're employed</Text>
          <AfterHire
            employer="Northwind Labs"
            lastReviewLabel="Jan 2026"
            verifiedSinceReview={7}
            rampPct={72}
            internalRoles={[
              { title: "ML Engineer II", team: "Recommendations", match: 84 },
              { title: "Applied Scientist", team: "Search", match: 61 },
            ]}
          />

          {/* Standing insights */}
          <Text style={styles.sectionLabel}>Ongoing signals</Text>
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
  sectionLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: colors.slate,
    marginTop: 6,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
  },
  cardTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
  cardBody: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink, lineHeight: 18, marginTop: 3 },
});
