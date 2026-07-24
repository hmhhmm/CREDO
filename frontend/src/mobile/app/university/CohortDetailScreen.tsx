import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ShieldCheck, Users, FileBadge, Stamp } from "lucide-react-native";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import ScoreRing from "../../components/shared/ScoreRing";
import { getConfidenceBand } from "../../utils/confidenceBand";
import { getCohortDetail, type University } from "../../data/universityData";
import { useCredentialIssuer } from "../../context/CredentialIssuerContext";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

type Props = { university: University; route: { params: { programme: string } } };

export default function CohortDetailScreen({ university, route }: Props) {
  const { cohort, students, eligible } = getCohortDetail(university, route.params.programme);
  const { isIssued, issueCredential } = useCredentialIssuer();

  if (!cohort) return null;
  const band = getConfidenceBand(cohort.readiness);

  const issuedList = eligible.filter(({ artifact }) => isIssued(university.id, artifact.id));
  const pendingList = eligible.filter(({ artifact }) => !isIssued(university.id, artifact.id));

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <GlassCard radius={24}>
            <View style={styles.hero}>
              <Text style={styles.year}>{cohort.year} · {cohort.students} students</Text>
              <ScoreRing score={cohort.readiness} size="lg" />
              <View style={styles.metaRow}>
                <Users size={13} color={colors.slate} />
                <Text style={styles.metaText}>{cohort.verifiedPct}% verified</Text>
              </View>
            </View>
          </GlassCard>

          {eligible.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Issued into the ledger</Text>
              <GlassCard radius={18}>
                <View style={styles.list}>
                  {issuedList.length === 0 ? (
                    <Text style={styles.empty}>Nothing issued yet — issue an eligible credential below.</Text>
                  ) : (
                    issuedList.map(({ candidate, artifact }, i) => (
                      <View key={artifact.id} style={[styles.issuedRow, i > 0 && styles.divider]}>
                        <FileBadge size={14} color={colors.gold} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.issuedName}>{artifact.name}</Text>
                          <Text style={styles.issuedMeta}>{candidate} · {artifact.date}</Text>
                        </View>
                        <ShieldCheck size={14} color={colors.verified} />
                      </View>
                    ))
                  )}
                </View>
              </GlassCard>

              {pendingList.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>Eligible — not yet issued</Text>
                  <GlassCard radius={18}>
                    <View style={styles.list}>
                      {pendingList.map(({ candidate, artifact }, i) => (
                        <View key={artifact.id} style={[styles.pendingRow, i > 0 && styles.divider]}>
                          <FileBadge size={14} color={colors.slate} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.issuedName}>{artifact.name}</Text>
                            <Text style={styles.issuedMeta}>{candidate} · verified {artifact.date}</Text>
                          </View>
                          <Pressable
                            style={styles.issueBtn}
                            onPress={() => issueCredential(university.id, artifact.id)}
                          >
                            <Stamp size={13} color={colors.parchment} />
                            <Text style={styles.issueBtnText}>Issue</Text>
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  </GlassCard>
                </>
              )}
            </>
          )}

          <Text style={styles.sectionLabel}>Students in this programme</Text>
          {students.length === 0 ? (
            <Text style={styles.empty}>No students on record for this programme yet.</Text>
          ) : (
            <View style={{ gap: 10 }}>
              {students.map((s) => {
                const sBand = getConfidenceBand(s.trustScore);
                return (
                  <GlassCard key={s.id} radius={16}>
                    <View style={styles.studentRow}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{s.name.split(" ").map((n) => n[0]).join("")}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.studentName}>{s.name}</Text>
                        <Text style={styles.studentMeta}>{s.verifiedSkills.length} verified skill{s.verifiedSkills.length === 1 ? "" : "s"}</Text>
                      </View>
                      <View style={[styles.scorePill, { borderColor: sBand.hex }]}>
                        <Text style={[styles.scoreText, { color: sBand.hex }]}>{s.trustScore}</Text>
                      </View>
                    </View>
                  </GlassCard>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, gap: 16 },

  hero: { alignItems: "center", padding: 24, gap: 10 },
  year: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate },

  sectionLabel: { fontFamily: fonts.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: colors.slate },
  empty: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.slate, fontStyle: "italic" },

  list: { padding: 16 },
  issuedRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  pendingRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  divider: { borderTopWidth: 1, borderTopColor: "rgba(16,25,43,0.08)" },
  issuedName: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink },
  issuedMeta: { fontFamily: fonts.mono, fontSize: 10.5, color: colors.slate, marginTop: 1 },

  issueBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.ink, borderRadius: 100, paddingVertical: 6, paddingHorizontal: 12 },
  issueBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.parchment },

  studentRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(16,25,43,0.06)", alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: fonts.displayBold, fontSize: 14, color: colors.ink },
  studentName: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  studentMeta: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.slate, marginTop: 1 },
  scorePill: { borderWidth: 1, borderRadius: 100, paddingVertical: 3, paddingHorizontal: 10 },
  scoreText: { fontFamily: fonts.mono, fontSize: 12 },
});
