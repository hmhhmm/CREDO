import { useState } from "react";
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MapPin, Check, Users, X } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { jobsApi, ApiError } from "../../lib/api";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { EmployerHomeStackParamList } from "../../navigation/EmployerHomeStack";

type Props = NativeStackScreenProps<EmployerHomeStackParamList, "JobDetail">;

const TYPE_LABEL: Record<string, string> = {
  "full-time": "Full-time",
  internship: "Internship",
  contract: "Contract",
};

export default function JobDetailScreen({ route, navigation }: Props) {
  const [job, setJob] = useState(route.params.job);
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  const handleClose = () => {
    Alert.alert(
      "Close this role?",
      "The listing will be marked as closed and hidden from candidates.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Close role",
          style: "destructive",
          onPress: async () => {
            setClosing(true);
            setCloseError(null);
            try {
              const updated = await jobsApi.close(job.id);
              setJob(updated);
            } catch (e) {
              console.error("JobDetailScreen close failed:", e);
              setCloseError(e instanceof ApiError ? e.message : "Could not close the role.");
            } finally {
              setClosing(false);
            }
          },
        },
      ]
    );
  };

  const handleFindCandidates = () => {
    const filterSkills = job.required_skills.map((s) => s.name);
    // Navigate to the Discover tab (sibling tab) with the skill filter pre-applied.
    // JobDetailScreen is inside EmployerHomeStack (NativeStack), whose parent is EmployerTabs.
    // Discover is now a nested stack, so we target DiscoverMain via screen/params.
    const tabNav = navigation.getParent();
    if (tabNav) {
      (tabNav as { navigate: (name: string, params?: object) => void }).navigate("Discover", {
        screen: "DiscoverMain",
        params: { filterSkills },
        initial: false,
      });
    }
  };

  const isOpen = job.status === "open";

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <GlassCard radius={22}>
            <View style={styles.header}>
              <Text style={styles.title}>{job.title}</Text>
              <View style={styles.metaRow}>
                <MapPin size={12} color={colors.slate} />
                <Text style={styles.meta}>{job.location}</Text>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.meta}>{TYPE_LABEL[job.employment_type] ?? job.employment_type}</Text>
              </View>
              {(job.salary_min != null || job.salary_max != null) && (
                <Text style={styles.salary}>
                  {job.salary_min != null && job.salary_max != null
                    ? `RM ${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()} / mo`
                    : job.salary_min != null
                    ? `From RM ${job.salary_min.toLocaleString()} / mo`
                    : `Up to RM ${job.salary_max!.toLocaleString()} / mo`}
                </Text>
              )}
              <View style={[styles.statusBadge, { backgroundColor: isOpen ? "rgba(31,122,92,0.1)" : "rgba(16,25,43,0.06)" }]}>
                <Text style={[styles.statusText, { color: isOpen ? colors.verified : colors.slate }]}>
                  {isOpen ? "Open" : "Closed"}
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* Description */}
          {job.description.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Description</Text>
              <GlassCard radius={18}>
                <Text style={styles.description}>{job.description}</Text>
              </GlassCard>
            </>
          )}

          {/* Required skills */}
          {job.required_skills.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Required Skills</Text>
              <GlassCard radius={18}>
                <View style={styles.skillsBlock}>
                  {job.required_skills.map((s) => (
                    <View key={s.name} style={styles.skillRow}>
                      <View style={[styles.skillChip, { backgroundColor: s.verified_only ? "rgba(31,122,92,0.1)" : "rgba(16,25,43,0.06)" }]}>
                        {s.verified_only && <Check size={9} color={colors.verified} strokeWidth={3} />}
                        <Text style={[styles.skillText, { color: s.verified_only ? colors.verified : colors.slate }]}>{s.name}</Text>
                      </View>
                      {s.verified_only && <Text style={styles.verifiedOnly}>Verified only</Text>}
                    </View>
                  ))}
                </View>
              </GlassCard>
            </>
          )}

          {/* Actions */}
          <Pressable style={styles.primaryBtn} onPress={handleFindCandidates}>
            <Users size={16} color={colors.parchment} />
            <Text style={styles.primaryBtnText}>Find candidates</Text>
          </Pressable>

          {isOpen && (
            <>
              <Pressable style={styles.closeBtn} onPress={handleClose} disabled={closing}>
                {closing ? (
                  <ActivityIndicator color={colors.alert} size="small" />
                ) : (
                  <>
                    <X size={14} color={colors.alert} />
                    <Text style={styles.closeBtnText}>Close role</Text>
                  </>
                )}
              </Pressable>
              {closeError && <Text style={styles.closeError}>{closeError}</Text>}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 48, gap: 14 },

  header: { padding: 20, gap: 8 },
  title: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.ink },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  meta: { fontFamily: fonts.mono, fontSize: 12, color: colors.slate },
  dot: { fontFamily: fonts.mono, fontSize: 12, color: colors.slate },
  salary: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink },
  statusBadge: { alignSelf: "flex-start", borderRadius: 100, paddingVertical: 4, paddingHorizontal: 12 },
  statusText: { fontFamily: fonts.mono, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 },

  sectionLabel: { fontFamily: fonts.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: colors.slate },
  description: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink, lineHeight: 21, padding: 18 },

  skillsBlock: { padding: 16, gap: 10 },
  skillRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  skillChip: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 100, paddingVertical: 4, paddingHorizontal: 10 },
  skillText: { fontFamily: fonts.mono, fontSize: 11 },
  verifiedOnly: { fontFamily: fonts.mono, fontSize: 10, color: colors.slate },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.ink,
    borderRadius: 16,
    paddingVertical: 16,
  },
  primaryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.parchment },

  closeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.alert,
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 14,
  },
  closeBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.alert },
  closeError: { fontFamily: fonts.mono, fontSize: 12, color: colors.alert, textAlign: "center" },
});
