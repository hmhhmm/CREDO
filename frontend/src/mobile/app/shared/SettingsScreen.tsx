// One Settings screen shared by all three roles (Candidate/Employer/University) — each
// caller supplies its own identity block, editable rows/links, and log-out handler. The
// shell (identity hero, section layout, "Log out" treatment) is identical everywhere
// rather than three near-duplicate screens.
//
// Deliberately links out to real controls that already exist elsewhere (Card's Audience &
// Privacy, Life Chapter preferences) instead of rebuilding them here — there is no
// profile-update endpoint in mockApi.ts, so a second, disconnected "edit" UI would just be
// decoration. openToWork is the one field wired to real (if unpersisted) local state,
// since it's genuinely a boolean flip with nowhere else to live.
import { View, Text, ScrollView, Pressable, Switch, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogOut, ArrowLeftRight, Info, ChevronRight } from "lucide-react-native";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import Avatar from "../../components/shared/Avatar";
import { MOCK_MODE } from "../../lib/config";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

export interface SettingsRow {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  // For a toggle row: renders a Switch instead of a chevron/value.
  toggle?: { value: boolean; onValueChange: (v: boolean) => void };
}

export interface SettingsSection {
  title: string;
  rows: SettingsRow[];
}

interface Props {
  initial: string;
  name: string;
  subtitle: string; // role-specific context line under the name, e.g. field of study, company, or university office
  sections: SettingsSection[];
  onLogOut: () => void;
  // University has no real session to end (see UniversityAuthGate) — "logging out" there
  // is just returning to the role picker, not a real sign-out, so it gets a neutral tone
  // (slate icon/label, no red) instead of the destructive styling Candidate/Employer's
  // real sign-out uses. Both the label and the danger styling travel together here,
  // rather than only the text changing while the icon/color still imply something
  // destructive is happening.
  logOutLabel?: string;
  logOutTone?: "destructive" | "neutral";
}

// Every role's About section ends with the same demo-mode indicator — built once here
// instead of each of the three role SettingsScreens retyping the identical row.
const ABOUT_SECTION: SettingsSection = {
  title: "About",
  rows: [{ icon: <Info size={15} color={colors.ink} />, label: "Demo mode", value: MOCK_MODE ? "On" : "Off" }],
};

export default function SettingsScreen({
  initial,
  name,
  subtitle,
  sections,
  onLogOut,
  logOutLabel = "Log out",
  logOutTone = "destructive",
}: Props) {
  const isDestructive = logOutTone === "destructive";
  const LogOutIcon = isDestructive ? LogOut : ArrowLeftRight;
  const logOutColor = isDestructive ? colors.alert : colors.slate;
  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      {/* This screen is always reached via a header-shown stack screen (the native
          header itself now reserves top clearance — see StackHeader in navigation.jsx),
          so only the bottom edge needs handling here, matching PortfolioScreen and every
          other header-shown screen in the app. */}
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.identityCard}>
            <Avatar initial={initial} size="lg" />
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          {[...sections, ABOUT_SECTION].map((section) => (
            <View key={section.title} style={{ gap: 10 }}>
              <Text style={styles.sectionLabel}>{section.title}</Text>
              <GlassCard radius={18}>
                <View>
                  {section.rows.map((row, i) => (
                    <Pressable
                      key={row.label}
                      onPress={row.onPress}
                      disabled={!row.onPress && !row.toggle}
                      style={[styles.row, i > 0 && styles.rowDivider]}
                    >
                      <View style={styles.rowIcon}>{row.icon}</View>
                      <Text style={styles.rowLabel}>{row.label}</Text>
                      {row.toggle ? (
                        <Switch value={row.toggle.value} onValueChange={row.toggle.onValueChange} />
                      ) : (
                        <>
                          {row.value && <Text style={styles.rowValue}>{row.value}</Text>}
                          {row.onPress && <ChevronRight size={16} color={colors.slate} />}
                        </>
                      )}
                    </Pressable>
                  ))}
                </View>
              </GlassCard>
            </View>
          ))}

          <Pressable
            onPress={onLogOut}
            style={({ pressed }) => [
              styles.logOutButton,
              isDestructive ? styles.logOutButtonDestructive : styles.logOutButtonNeutral,
              pressed && { opacity: 0.85 },
            ]}
          >
            <LogOutIcon size={16} color={logOutColor} />
            <Text style={[styles.logOutText, { color: logOutColor }]}>{logOutLabel}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // 110, not an arbitrary smaller value — matches every other screen's clearance for the
  // floating tab bar, which stays visible on pushed stack screens throughout this app
  // (see PortfolioScreen). A smaller value here left Log Out sitting behind the bar.
  scroll: { padding: 20, paddingBottom: 110, gap: 24 },

  identityCard: { alignItems: "center", gap: 12, paddingTop: 8, paddingBottom: 4 },
  name: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.ink, textAlign: "center" },
  subtitle: { fontFamily: fonts.sans, fontSize: 13, color: colors.slate, textAlign: "center", marginTop: 2 },

  sectionLabel: { fontFamily: fonts.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: colors.slate },

  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13, paddingHorizontal: 16 },
  rowDivider: { borderTopWidth: 1, borderTopColor: "rgba(16,25,43,0.08)" },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(16,25,43,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink },
  rowValue: { fontFamily: fonts.mono, fontSize: 12.5, color: colors.slate },

  logOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1,
  },
  logOutButtonDestructive: { backgroundColor: "rgba(196,80,58,0.08)", borderColor: "rgba(196,80,58,0.22)" },
  logOutButtonNeutral: { backgroundColor: "rgba(16,25,43,0.05)", borderColor: "rgba(16,25,43,0.12)" },
  logOutText: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
});
