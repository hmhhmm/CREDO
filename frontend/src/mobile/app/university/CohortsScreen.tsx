import { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ShieldCheck, Users, ChevronRight, Stamp, X } from "lucide-react-native";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { getConfidenceBand } from "../../utils/confidenceBand";
import { getCohorts, getEligibleCredentials, type University } from "../../data/universityData";
import { useCredentialIssuer } from "../../context/CredentialIssuerContext";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { CohortsStackParamList } from "../../navigation/CohortsStack";

type Props = NativeStackScreenProps<CohortsStackParamList, "CohortsMain"> & { university: University };

// ASKC pillar order/labels shared by the mini-breakdown row below.
const ASKC_PILLARS: { key: "skills" | "attitude" | "knowledge"; label: string }[] = [
  { key: "skills", label: "S" },
  { key: "attitude", label: "A" },
  { key: "knowledge", label: "K" },
];

export default function CohortsScreen({ university, navigation }: Props) {
  const cohorts = getCohorts(university);
  const { isIssued, issueCredential } = useCredentialIssuer();
  const [batchSheetOpen, setBatchSheetOpen] = useState(false);

  // The badge only lights up once the university has actually issued something — not
  // merely because a student happens to hold a verified credential artifact.
  const pendingFor = (programme: string) =>
    getEligibleCredentials(university, programme).filter(({ artifact }) => !isIssued(university.id, artifact.id));
  const hasIssuedFor = (programme: string) =>
    getEligibleCredentials(university, programme).some(({ artifact }) => isIssued(university.id, artifact.id));

  // U5 batch co-sign — issues every real eligible-but-not-yet-issued credential in one
  // cohort with a single tap. Still the exact same real issueCredential(universityId,
  // artifactId) call CohortDetailScreen's one-at-a-time "Issue" button uses, just looped;
  // no credential is signed that wasn't already a real verified artifact on a real student.
  const batchIssue = (programme: string) => {
    for (const { artifact } of pendingFor(programme)) issueCredential(university.id, artifact.id);
    setBatchSheetOpen(false);
  };

  const cohortsWithPending = cohorts.filter((c) => pendingFor(c.programme).length > 0);

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.headRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heading}>Cohorts</Text>
              <Text style={styles.subheading}>Adaptive readiness per programme — a live signal, not a fixed graduation date.</Text>
            </View>
          </View>

          <Pressable
            style={[styles.batchBtn, cohortsWithPending.length === 0 && styles.batchBtnDisabled]}
            disabled={cohortsWithPending.length === 0}
            onPress={() => setBatchSheetOpen(true)}
          >
            <Stamp size={14} color={colors.parchment} />
            <Text style={styles.batchBtnText}>Batch Co-Sign Credentials (U5)</Text>
            {cohortsWithPending.length > 0 && (
              <View style={styles.batchCount}>
                <Text style={styles.batchCountText}>{cohortsWithPending.reduce((s, c) => s + pendingFor(c.programme).length, 0)}</Text>
              </View>
            )}
          </Pressable>

          <View style={{ gap: 12, marginTop: 4 }}>
            {cohorts.map((c) => {
              const band = getConfidenceBand(c.readiness);
              return (
                <GlassCard key={c.programme} radius={20}>
                  <Pressable
                    style={styles.card}
                    onPress={() => navigation.navigate("CohortDetail", { programme: c.programme })}
                  >
                    <View style={styles.head}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.programme}>{c.programme}</Text>
                        <Text style={styles.year}>{c.year} · {c.students} students</Text>
                      </View>
                      <View style={[styles.ring, { borderColor: band.hex }]}>
                        <Text style={[styles.ringText, { color: band.hex }]}>{c.readiness}</Text>
                      </View>
                      <ChevronRight size={16} color={colors.slate} />
                    </View>

                    {/* Real ASKC pillar averages for this cohort — SimuHire score
                        (Attitude), verified GitHub-artifact confidence (Skills), verified
                        credential+document confidence (Knowledge). A pillar with no
                        verified signal in this cohort reads as "—", never a fake 0. */}
                    <View style={styles.askcRow}>
                      {ASKC_PILLARS.map(({ key, label }) => {
                        const score = c.askc[key];
                        return (
                          <View key={key} style={styles.askcItem}>
                            <Text style={styles.askcLabel}>{label}</Text>
                            <Text style={styles.askcValue}>{score != null ? `${score}%` : "—"}</Text>
                          </View>
                        );
                      })}
                    </View>

                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Users size={13} color={colors.slate} />
                        <Text style={styles.metaText}>{c.verifiedPct}% verified</Text>
                      </View>
                      {c.eligibleForIssuance && hasIssuedFor(c.programme) && (
                        <View style={styles.issuerChip}>
                          <ShieldCheck size={12} color={colors.verified} />
                          <Text style={styles.issuerText}>Credential issuer active</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.track}>
                      <View style={[styles.fill, { width: `${c.readiness}%`, backgroundColor: band.hex }]} />
                    </View>
                  </Pressable>
                </GlassCard>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>

      {batchSheetOpen && (
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Batch Co-Sign Credentials</Text>
              <Pressable onPress={() => setBatchSheetOpen(false)} hitSlop={10}>
                <X size={20} color={colors.slate} />
              </Pressable>
            </View>
            <Text style={styles.sheetSub}>
              Issues every eligible, verified, not-yet-issued credential in a programme at once — the same real action as issuing
              one at a time, just batched.
            </Text>
            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              <View style={{ gap: 10 }}>
                {cohortsWithPending.map((c) => {
                  const pending = pendingFor(c.programme);
                  return (
                    <View key={c.programme} style={styles.sheetRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sheetRowTitle}>{c.programme}</Text>
                        <Text style={styles.sheetRowMeta}>{pending.length} pending credential{pending.length === 1 ? "" : "s"}</Text>
                      </View>
                      <Pressable style={styles.sheetIssueBtn} onPress={() => batchIssue(c.programme)}>
                        <Text style={styles.sheetIssueBtnText}>Issue all</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 110, gap: 6 },
  headRow: { flexDirection: "row", alignItems: "flex-start" },
  heading: { fontFamily: fonts.displayBold, fontSize: 28, color: colors.ink, marginTop: 4 },
  subheading: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, marginTop: 4, lineHeight: 17 },

  batchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.ink,
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 12,
    marginBottom: 8,
  },
  batchBtnDisabled: { opacity: 0.4 },
  batchBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.parchment },
  batchCount: { backgroundColor: "rgba(245,237,224,0.2)", borderRadius: 100, paddingHorizontal: 8, paddingVertical: 2 },
  batchCountText: { fontFamily: fonts.mono, fontSize: 11, color: colors.parchment },

  card: { padding: 16, gap: 11 },
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
  programme: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink },
  year: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate, marginTop: 1 },
  ring: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  ringText: { fontFamily: fonts.mono, fontSize: 13 },

  askcRow: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "rgba(16,25,43,0.03)",
    borderRadius: 12,
    padding: 10,
  },
  askcItem: { flex: 1, alignItems: "center", gap: 1 },
  askcLabel: { fontFamily: fonts.mono, fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: colors.slate },
  askcValue: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate },
  issuerChip: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(31,122,92,0.1)", borderRadius: 100, paddingVertical: 3, paddingHorizontal: 9 },
  issuerText: { fontFamily: fonts.mono, fontSize: 10, color: colors.verified },

  track: { height: 5, backgroundColor: "rgba(16,25,43,0.08)", borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 3 },

  sheetBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(16,25,43,0.45)",
    justifyContent: "flex-end",
    zIndex: 50,
  },
  sheet: {
    backgroundColor: colors.parchment,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    gap: 10,
    maxHeight: "80%",
  },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sheetTitle: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.ink },
  sheetSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, lineHeight: 17 },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "rgba(16,25,43,0.03)",
  },
  sheetRowTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.ink },
  sheetRowMeta: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate, marginTop: 2 },
  sheetIssueBtn: { backgroundColor: colors.ink, borderRadius: 100, paddingVertical: 8, paddingHorizontal: 14 },
  sheetIssueBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.parchment },
});
