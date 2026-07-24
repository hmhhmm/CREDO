// E4 — lightweight "what/when/who" view for a single interview, reached by tapping a row
// in Home's Today's Interviews list. Deliberately not the full CandidateProfileScreen (too
// evidence-heavy for "am I about to walk into the right meeting") — that's one tap away via
// "View full profile" for anyone who wants the deeper read.
import { useState } from "react";
import { View, Text, ScrollView, Pressable, Linking, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, ArrowRight, CalendarCheck, Video, Copy, Check as CheckIcon } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { getConfidenceBand } from "../../utils/confidenceBand";
import { formatInterviewDateTime } from "../../utils/interviewSlots";
import { STAGE_META, INTERVIEW_STATUS_META } from "../../data/employerData";
import { mockCandidates } from "../../data/mockData";
import { usePipeline } from "../../context/PipelineContext";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { EmployerHomeStackParamList } from "../../navigation/EmployerHomeStack";

type Props = NativeStackScreenProps<EmployerHomeStackParamList, "InterviewDetail">;

export default function InterviewDetailScreen({ route, navigation }: Props) {
  const { entry } = route.params;
  const { completeInterview } = usePipeline();
  const band = getConfidenceBand(entry.trustScore);
  const stage = STAGE_META[entry.stage];
  const interview = INTERVIEW_STATUS_META[entry.interviewStatus];
  const initials = entry.name.split(" ").map((n) => n[0]).join("");
  const [copied, setCopied] = useState(false);

  const copyMeetingLink = async () => {
    if (!entry.meetingLink) return;
    await Clipboard.setStringAsync(entry.meetingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openProfile = () => {
    const full = mockCandidates.find((c) => c.id === entry.candidateId);
    const tabNav = navigation.getParent();
    if (tabNav && full) {
      (tabNav as { navigate: (name: string, params?: object) => void }).navigate("Discover", {
        screen: "CandidateProfile",
        params: { candidate: { ...full, trajectory: entry.detail } },
        initial: false,
      });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <GlassCard radius={22}>
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{entry.name}</Text>
                  <Text style={styles.field}>{entry.field}</Text>
                </View>
                <View style={[styles.scoreRing, { borderColor: band.hex }]}>
                  <Text style={[styles.scoreText, { color: band.hex }]}>{entry.trustScore}</Text>
                </View>
              </View>

              {entry.interviewDate && (
                <View style={styles.timeRow}>
                  <Calendar size={14} color={colors.ink} />
                  <Text style={styles.timeText}>{formatInterviewDateTime(entry.interviewDate)}</Text>
                </View>
              )}

              {entry.meetingLink && (
                <View style={styles.meetingRow}>
                  <View style={styles.meetingLinkChip}>
                    <Video size={13} color={colors.slate} />
                    <Text style={styles.meetingLinkText} numberOfLines={1}>{entry.meetingLink}</Text>
                  </View>
                  <Pressable style={styles.meetingIconBtn} onPress={copyMeetingLink}>
                    {copied ? <CheckIcon size={14} color={colors.verified} /> : <Copy size={14} color={colors.ink} />}
                  </Pressable>
                  <Pressable style={styles.meetingJoinBtn} onPress={() => Linking.openURL(entry.meetingLink!)}>
                    <Text style={styles.meetingJoinText}>Join</Text>
                  </Pressable>
                </View>
              )}

              <View style={styles.pillRow}>
                <View style={[styles.pill, { borderColor: stage.color }]}>
                  <Text style={[styles.pillText, { color: stage.color }]}>{stage.label}</Text>
                </View>
                <View style={[styles.pill, { borderColor: interview.color }]}>
                  <Text style={[styles.pillText, { color: interview.color }]}>{interview.label}</Text>
                </View>
              </View>
            </View>
          </GlassCard>

          <GlassCard radius={18}>
            <View style={styles.detailBlock}>
              <Text style={styles.sectionLabel}>Context</Text>
              <Text style={styles.detailText}>{entry.detail}</Text>
            </View>
          </GlassCard>

          <Pressable style={styles.profileLink} onPress={openProfile}>
            <Text style={styles.profileLinkText}>View full profile</Text>
            <ArrowRight size={14} color={colors.ink} />
          </Pressable>

          {entry.interviewStatus === "scheduled" && (
            <Pressable style={styles.completeBtn} onPress={() => completeInterview(entry.id)}>
              <CalendarCheck size={16} color={colors.parchment} />
              <Text style={styles.completeBtnText}>Mark completed</Text>
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 48, gap: 14 },

  header: { padding: 20, gap: 14 },
  headerTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(16,25,43,0.06)", alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.ink },
  name: { fontFamily: fonts.displayBold, fontSize: 19, color: colors.ink },
  field: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.slate, marginTop: 1 },
  scoreRing: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  scoreText: { fontFamily: fonts.mono, fontSize: 13 },

  timeRow: { flexDirection: "row", alignItems: "center", gap: 8, borderTopWidth: 1, borderTopColor: "rgba(16,25,43,0.08)", paddingTop: 12 },
  timeText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },

  meetingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  meetingLinkChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(16,25,43,0.06)",
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  meetingLinkText: { flex: 1, fontFamily: fonts.mono, fontSize: 11, color: colors.slate },
  meetingIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  meetingJoinBtn: { backgroundColor: colors.ink, borderRadius: 100, paddingVertical: 8, paddingHorizontal: 14 },
  meetingJoinText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.parchment },

  pillRow: { flexDirection: "row", gap: 8 },
  pill: { borderWidth: 1, borderRadius: 100, paddingVertical: 4, paddingHorizontal: 10 },
  pillText: { fontFamily: fonts.mono, fontSize: 10.5 },

  sectionLabel: { fontFamily: fonts.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: colors.slate, marginBottom: 8 },
  detailBlock: { padding: 18 },
  detailText: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.ink, lineHeight: 20 },

  profileLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  profileLinkText: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.ink },

  completeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.ink,
    borderRadius: 16,
    paddingVertical: 15,
  },
  completeBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.parchment },
});
