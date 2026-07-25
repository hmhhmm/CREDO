// Audience & Privacy — moved here from the Card tab's own page (where it sat alongside
// Share/Distribution, redundant with them) so Settings is the one place a candidate manages
// how their verified identity is controlled and exposed, while the Card tab stays focused on
// the namecard itself and getting it out into the world. CardAudience is unchanged, just
// relocated — same local-state-only controls (audience preset, field visibility, expiring
// share link, who-viewed activity).
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenBackground from "../../components/shared/ScreenBackground";
import CardAudience from "../../components/namecard/CardAudience";
import { useAuth } from "../../context/AuthContext";
import { useDemo } from "../../context/DemoContext";
import { fonts } from "../../theme/typography";
import { colors } from "../../theme/colors";

export default function CardPrivacyScreen() {
  const { user } = useAuth();
  const { liveCandidate } = useDemo();
  const name = user?.name || liveCandidate.name;
  const handle = (name || "you").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 16) || "you";

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          <Text style={styles.intro}>Controls who sees your verified namecard, and what they see.</Text>
          <CardAudience handle={handle} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  intro: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.slate, lineHeight: 18 },
});
