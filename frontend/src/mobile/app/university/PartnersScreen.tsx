import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowRight, Building2, Check } from "lucide-react-native";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { getConfidenceBand } from "../../utils/confidenceBand";
import { internshipMatches, university } from "../../data/universityData";
import { usePipeline } from "../../context/PipelineContext";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

export default function PartnersScreen() {
  const { pipeline, addToPipeline } = usePipeline();

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.heading}>Partners</Text>
          <Text style={styles.subheading}>Live Internship Marketplace — match strong verified students to employers, dating-app style.</Text>

          <View style={{ gap: 12, marginTop: 8 }}>
            {internshipMatches.map((m) => {
              const band = getConfidenceBand(m.trustScore);
              const introduced = pipeline.some((p) => p.candidateId === m.candidateId);
              return (
                <GlassCard key={m.id} radius={20}>
                  <View style={styles.card}>
                    <View style={styles.matchHead}>
                      <Text style={styles.matchPct}>{m.matchPct}% match</Text>
                    </View>

                    <View style={styles.pairRow}>
                      {/* Student */}
                      <View style={styles.side}>
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>{m.student.split(" ").map((n) => n[0]).join("")}</Text>
                        </View>
                        <Text style={styles.name} numberOfLines={1}>{m.student}</Text>
                        <Text style={styles.subtext} numberOfLines={1}>{m.programme}</Text>
                        <View style={[styles.scorePill, { borderColor: band.hex }]}>
                          <Text style={[styles.scoreText, { color: band.hex }]}>Trust {m.trustScore}</Text>
                        </View>
                      </View>

                      <ArrowRight size={18} color={colors.gold} />

                      {/* Employer */}
                      <View style={styles.side}>
                        <View style={styles.empIcon}>
                          <Building2 size={18} color={colors.ink} />
                        </View>
                        <Text style={styles.name} numberOfLines={1}>{m.employer}</Text>
                        <Text style={styles.subtext} numberOfLines={2}>{m.role}</Text>
                      </View>
                    </View>

                    {introduced ? (
                      <View style={styles.introducedRow}>
                        <Check size={14} color={colors.verified} strokeWidth={2.5} />
                        <Text style={styles.introducedText}>Introduced — now in {m.employer}'s Pipeline</Text>
                      </View>
                    ) : (
                      <Pressable
                        style={styles.pushBtn}
                        onPress={() =>
                          addToPipeline({
                            id: `intro-${m.candidateId}`,
                            candidateId: m.candidateId,
                            name: m.student,
                            field: m.programme.replace(/^BSc\s*/, ""),
                            trustScore: m.trustScore,
                            stage: "invited",
                            detail: `Introduced via ${university.name} Internship Marketplace — matched ${m.matchPct}% for ${m.role} at ${m.employer}`,
                          })
                        }
                      >
                        <Text style={styles.pushText}>Introduce to employer</Text>
                      </Pressable>
                    )}
                  </View>
                </GlassCard>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 110, gap: 6 },
  heading: { fontFamily: fonts.displayBold, fontSize: 28, color: colors.ink, marginTop: 4 },
  subheading: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, marginTop: 4, lineHeight: 17 },

  card: { padding: 16, gap: 12 },
  matchHead: { alignItems: "center" },
  matchPct: { fontFamily: fonts.mono, fontSize: 11, color: colors.verified, letterSpacing: 0.5 },
  pairRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  side: { flex: 1, alignItems: "center", gap: 3 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(16,25,43,0.06)", alignItems: "center", justifyContent: "center", marginBottom: 2 },
  avatarText: { fontFamily: fonts.displayBold, fontSize: 15, color: colors.ink },
  empIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(201,166,70,0.14)", alignItems: "center", justifyContent: "center", marginBottom: 2 },
  name: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink, textAlign: "center" },
  subtext: { fontFamily: fonts.sans, fontSize: 10.5, color: colors.slate, textAlign: "center" },
  scorePill: { borderWidth: 1, borderRadius: 100, paddingVertical: 2, paddingHorizontal: 8, marginTop: 2 },
  scoreText: { fontFamily: fonts.mono, fontSize: 10 },

  pushBtn: { backgroundColor: colors.ink, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  pushText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.parchment },

  introducedRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 12 },
  introducedText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.verified },
});
