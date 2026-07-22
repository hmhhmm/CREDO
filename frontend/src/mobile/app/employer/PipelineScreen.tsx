import { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FileText, Send, RefreshCw, ChevronRight, Check } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { STAGE_META, type PipelineEntry } from "../../data/employerData";
import type { DiscoverCandidate } from "../../data/employerData";
import { mockCandidates } from "../../data/mockData";
import { usePipeline } from "../../context/PipelineContext";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { PipelineStackParamList } from "../../navigation/PipelineStack";

type Props = NativeStackScreenProps<PipelineStackParamList, "PipelineMain">;

function buildCandidate(e: PipelineEntry): DiscoverCandidate {
  const full = mockCandidates.find((c) => c.id === e.candidateId);
  return {
    ...(full ?? {
      id: e.id,
      name: e.name,
      field: e.field,
      university: "",
      year: "",
      location: "",
      openToWork: false,
      avatar: null,
      bio: "",
      linkedinUrl: null,
      githubUrl: null,
      trustScore: e.trustScore,
      verifiedSkills: [],
      claimedSkills: [],
      simuHire: { completed: false, shared: false },
      artifacts: [],
      ledger: [],
      merkleRoot: null,
    }),
    trajectory: e.detail,
  };
}

function actionFor(entry: PipelineEntry): { label: string; Icon: typeof Send } {
  switch (entry.stage) {
    case "simuhire_done":
      return { label: "Review report", Icon: FileText };
    case "shortlisted":
      return { label: "View profile", Icon: ChevronRight };
    case "invited":
      return { label: "Resend invite", Icon: Send };
    case "re_engage":
      return { label: "Re-engage", Icon: RefreshCw };
    default:
      return { label: "View", Icon: ChevronRight };
  }
}

export default function PipelineScreen({ navigation }: Props) {
  const { pipeline } = usePipeline();
  const [sent, setSent] = useState<string | null>(null);

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.heading}>Pipeline</Text>
          <Text style={styles.subheading}>SimuHire invites, reviews & re-engagement — behavioral evidence before the first interview.</Text>

          <View style={{ gap: 12, marginTop: 8 }}>
            {pipeline.map((e) => {
              const stage = STAGE_META[e.stage];
              const action = actionFor(e);
              const initials = e.name.split(" ").map((n) => n[0]).join("");
              const isSent = sent === e.id;

              const handlePress = () => {
                if (e.stage === "simuhire_done") {
                  navigation.navigate("SimuHireReport", { entry: e });
                } else if (e.stage === "shortlisted") {
                  navigation.navigate("CandidateProfile", { candidate: buildCandidate(e) });
                } else {
                  setSent(e.id);
                }
              };

              return (
                <GlassCard key={e.id} radius={20}>
                  <View style={styles.card}>
                    <View style={styles.head}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initials}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.name}>{e.name}</Text>
                        <Text style={styles.meta}>{e.field} · Trust {e.trustScore}</Text>
                      </View>
                      <View style={[styles.stagePill, { borderColor: stage.color }]}>
                        <Text style={[styles.stageText, { color: stage.color }]}>{stage.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.detail}>{e.detail}</Text>
                    {isSent ? (
                      <View style={styles.sentRow}>
                        <Check size={14} color={colors.verified} strokeWidth={2.5} />
                        <Text style={styles.sentText}>Sent</Text>
                      </View>
                    ) : (
                      <Pressable style={styles.action} onPress={handlePress}>
                        <action.Icon size={14} color={colors.ink} />
                        <Text style={styles.actionText}>{action.label}</Text>
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

  card: { padding: 16, gap: 10 },
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(16,25,43,0.06)", alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: fonts.displayBold, fontSize: 14, color: colors.ink },
  name: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink },
  meta: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate, marginTop: 1 },
  stagePill: { borderWidth: 1, borderRadius: 100, paddingVertical: 3, paddingHorizontal: 9 },
  stageText: { fontFamily: fonts.mono, fontSize: 10 },
  detail: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.slate, lineHeight: 18 },
  action: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "rgba(16,25,43,0.06)",
    borderRadius: 12,
    paddingVertical: 11,
  },
  actionText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink },
  sentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 11,
  },
  sentText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.verified },
});
