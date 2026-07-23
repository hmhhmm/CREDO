import { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ShieldCheck, Users, ChevronDown, ChevronUp, FileBadge } from "lucide-react-native";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { getConfidenceBand } from "../../utils/confidenceBand";
import { getCohorts, studentsOf, type University } from "../../data/universityData";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

export default function CohortsScreen({ university }: { university: University }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const cohorts = getCohorts(university);

  // U5: credentials this university has actually issued into the ledger, for a given
  // programme — derived from the shared candidate roster instead of a static flag.
  function issuedCredentialsFor(programme: string) {
    const subject = programme.replace(/^BSc\s*/, "");
    return studentsOf(university)
      .filter((c) => c.field === subject)
      .flatMap((c) => c.artifacts.filter((a) => a.type === "credential").map((a) => ({ candidate: c.name, artifact: a })));
  }

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.heading}>Cohorts</Text>
          <Text style={styles.subheading}>Adaptive readiness per programme — a live signal, not a fixed graduation date.</Text>

          <View style={{ gap: 12, marginTop: 8 }}>
            {cohorts.map((c) => {
              const band = getConfidenceBand(c.readiness);
              const isOpen = expanded === c.programme;
              const issued = c.issuerActive ? issuedCredentialsFor(c.programme) : [];
              return (
                <GlassCard key={c.programme} radius={20}>
                  <View style={styles.card}>
                    <View style={styles.head}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.programme}>{c.programme}</Text>
                        <Text style={styles.year}>{c.year} · {c.students} students</Text>
                      </View>
                      <View style={[styles.ring, { borderColor: band.hex }]}>
                        <Text style={[styles.ringText, { color: band.hex }]}>{c.readiness}</Text>
                      </View>
                    </View>

                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Users size={13} color={colors.slate} />
                        <Text style={styles.metaText}>{c.verifiedPct}% verified</Text>
                      </View>
                      {c.issuerActive && (
                        <Pressable
                          style={styles.issuerChip}
                          onPress={() => setExpanded(isOpen ? null : c.programme)}
                        >
                          <ShieldCheck size={12} color={colors.verified} />
                          <Text style={styles.issuerText}>Credential issuer active</Text>
                          {isOpen ? (
                            <ChevronUp size={12} color={colors.verified} />
                          ) : (
                            <ChevronDown size={12} color={colors.verified} />
                          )}
                        </Pressable>
                      )}
                    </View>

                    <View style={styles.track}>
                      <View style={[styles.fill, { width: `${c.readiness}%`, backgroundColor: band.hex }]} />
                    </View>

                    {isOpen && (
                      <View style={styles.issuerPanel}>
                        {issued.length === 0 ? (
                          <Text style={styles.issuerEmpty}>No credentials issued into the ledger for this programme yet.</Text>
                        ) : (
                          issued.map(({ candidate, artifact }) => (
                            <View key={artifact.id} style={styles.issuedRow}>
                              <FileBadge size={13} color={colors.gold} />
                              <View style={{ flex: 1 }}>
                                <Text style={styles.issuedName}>{artifact.name}</Text>
                                <Text style={styles.issuedMeta}>{candidate} · {artifact.date}</Text>
                              </View>
                            </View>
                          ))
                        )}
                      </View>
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

  card: { padding: 16, gap: 11 },
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
  programme: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink },
  year: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate, marginTop: 1 },
  ring: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  ringText: { fontFamily: fonts.mono, fontSize: 13 },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate },
  issuerChip: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(31,122,92,0.1)", borderRadius: 100, paddingVertical: 3, paddingHorizontal: 9 },
  issuerText: { fontFamily: fonts.mono, fontSize: 10, color: colors.verified },

  track: { height: 5, backgroundColor: "rgba(16,25,43,0.08)", borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 3 },

  issuerPanel: { gap: 8, paddingTop: 4, borderTopWidth: 1, borderTopColor: "rgba(16,25,43,0.08)" },
  issuerEmpty: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.slate, fontStyle: "italic" },
  issuedRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  issuedName: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.ink },
  issuedMeta: { fontFamily: fonts.mono, fontSize: 10.5, color: colors.slate, marginTop: 1 },
});
