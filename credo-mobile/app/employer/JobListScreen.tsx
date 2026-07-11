import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Plus, MapPin, Check } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { jobsApi, ApiError, type JobListingResponse } from "../../lib/api";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { EmployerHomeStackParamList } from "../../navigation/EmployerHomeStack";

type Props = NativeStackScreenProps<EmployerHomeStackParamList, "JobList">;

const TYPE_LABEL: Record<string, string> = {
  "full-time": "Full-time",
  internship: "Internship",
  contract: "Contract",
};

function JobCard({ job, onPress }: { job: JobListingResponse; onPress: () => void }) {
  const isOpen = job.status === "open";
  return (
    <Pressable onPress={onPress}>
      <GlassCard radius={20}>
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.title}>{job.title}</Text>
              <View style={styles.metaRow}>
                <MapPin size={11} color={colors.slate} />
                <Text style={styles.meta}>{job.location}</Text>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.meta}>{TYPE_LABEL[job.employment_type] ?? job.employment_type}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: isOpen ? "rgba(31,122,92,0.1)" : "rgba(16,25,43,0.06)" }]}>
              <Text style={[styles.statusText, { color: isOpen ? colors.verified : colors.slate }]}>
                {isOpen ? "Open" : "Closed"}
              </Text>
            </View>
          </View>

          {job.salary_min != null && job.salary_max != null && (
            <Text style={styles.salary}>
              RM {job.salary_min.toLocaleString()} – {job.salary_max.toLocaleString()} / mo
            </Text>
          )}

          {job.required_skills.length > 0 && (
            <View style={styles.skillRow}>
              {job.required_skills.map((s) => (
                <View
                  key={s.name}
                  style={[styles.skillChip, { backgroundColor: s.verified_only ? "rgba(31,122,92,0.1)" : "rgba(16,25,43,0.06)" }]}
                >
                  {s.verified_only && <Check size={9} color={colors.verified} strokeWidth={3} />}
                  <Text style={[styles.skillText, { color: s.verified_only ? colors.verified : colors.slate }]}>{s.name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </GlassCard>
    </Pressable>
  );
}

export default function JobListScreen({ navigation }: Props) {
  const [jobs, setJobs] = useState<JobListingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await jobsApi.list();
      setJobs(data);
    } catch (e) {
      console.error("JobListScreen load failed:", e);
      setError(e instanceof ApiError ? e.message : "Could not load jobs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        {loading ? (
          <ActivityIndicator color={colors.ink} style={{ marginTop: 40 }} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {jobs.length === 0 ? (
              <GlassCard radius={20}>
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>No roles posted yet</Text>
                  <Text style={styles.emptyBody}>Tap + to post your first role and start matching verified candidates.</Text>
                </View>
              </GlassCard>
            ) : (
              jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onPress={() => navigation.navigate("JobDetail", { job })}
                />
              ))
            )}
          </ScrollView>
        )}

        <Pressable style={styles.fab} onPress={() => navigation.navigate("JobCreate")}>
          <Plus size={22} color={colors.parchment} strokeWidth={2.5} />
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 110, gap: 12 },
  error: { fontFamily: fonts.mono, fontSize: 13, color: colors.alert, padding: 20 },

  card: { padding: 16, gap: 10 },
  cardHead: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  title: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.ink },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, flexWrap: "wrap" },
  meta: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate },
  dot: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate },
  statusBadge: { borderRadius: 100, paddingVertical: 4, paddingHorizontal: 10, alignSelf: "flex-start" },
  statusText: { fontFamily: fonts.mono, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  salary: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink },
  skillRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  skillChip: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 100, paddingVertical: 3, paddingHorizontal: 9 },
  skillText: { fontFamily: fonts.mono, fontSize: 10 },

  emptyCard: { padding: 24, gap: 8, alignItems: "center" },
  emptyTitle: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.ink },
  emptyBody: { fontFamily: fonts.sans, fontSize: 13, color: colors.slate, textAlign: "center", lineHeight: 19 },

  fab: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(16,25,43,0.4)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
});
