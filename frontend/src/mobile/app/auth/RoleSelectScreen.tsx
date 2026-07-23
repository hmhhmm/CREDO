import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GraduationCap, Briefcase, Building2 } from "lucide-react-native";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { AppRole } from "../../navigation/RootNavigator";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";

const ROLES: { key: AppRole; label: string; subtitle: string; icon: typeof GraduationCap }[] = [
  { key: "candidate", label: "Candidate", subtitle: "Verify skills, build your Smart Namecard", icon: GraduationCap },
  { key: "employer", label: "Employer", subtitle: "Discover verified talent", icon: Briefcase },
  { key: "university", label: "University", subtitle: "Cohort intelligence dashboard", icon: Building2 },
];

export default function RoleSelectScreen({ onSelect }: { onSelect: (role: AppRole) => void }) {
  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container}>
        <Text style={styles.wordmark}>CREDO</Text>
        <Text style={styles.tagline}>Prove. Present. Perform.</Text>

        <View style={{ gap: 14, marginTop: 44 }}>
          {ROLES.map(({ key, label, subtitle, icon: Icon }) => (
            <Pressable key={key} onPress={() => onSelect(key)}>
              {({ pressed }) => (
                <GlassCard radius={20} style={pressed && { opacity: 0.85 }}>
                  <View style={styles.card}>
                    <View style={styles.iconWrap}>
                      <Icon size={22} color={colors.ink} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{label}</Text>
                      <Text style={styles.cardSubtitle}>{subtitle}</Text>
                    </View>
                  </View>
                </GlassCard>
              )}
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  wordmark: { fontFamily: fonts.displayBold, fontSize: 36, color: colors.ink, letterSpacing: 3, textAlign: "center" },
  tagline: { fontFamily: fonts.mono, fontSize: 12, color: colors.slate, textAlign: "center", marginTop: 8, letterSpacing: 2 },
  card: { flexDirection: "row", alignItems: "center", gap: 16, padding: 20 },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(16,25,43,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.ink },
  cardSubtitle: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, marginTop: 2 },
});
