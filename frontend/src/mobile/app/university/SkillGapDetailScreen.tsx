import { useState } from "react";
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TrendingDown, ArrowRight, Users, Check } from "lucide-react-native";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { getSkillGapDetail, type University } from "../../data/universityData";
import { useCurriculumAction } from "../../context/CurriculumActionContext";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

type Props = { university: University; route: { params: { skill: string } } };

export default function SkillGapDetailScreen({ university, route }: Props) {
  const { gap, action, cohort, affectedStudents } = getSkillGapDetail(university, route.params.skill);
  const { actionFor, logAction } = useCurriculumAction();
  const logged = gap ? actionFor(university.id, gap.skill) : null;
  const [draft, setDraft] = useState(logged?.action ?? action?.action ?? "");

  if (!gap) return null;

  const handleLog = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    logAction(university.id, gap.skill, trimmed);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <GlassCard radius={20}>
            <View style={styles.card}>
              <View style={styles.head}>
                <TrendingDown size={16} color={colors.alert} />
                <Text style={styles.skill}>{gap.skill}</Text>
              </View>
              <Text style={styles.rate}>{gap.verifyRate}% verify</Text>
              <Text style={styles.taught}>Taught in {gap.taughtIn}</Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${gap.verifyRate}%`, backgroundColor: colors.alert }]} />
              </View>
            </View>
          </GlassCard>

          {affectedStudents != null && cohort && (
            <GlassCard radius={18}>
              <View style={styles.affectedRow}>
                <Users size={16} color={colors.slate} />
                <Text style={styles.affectedText}>
                  ~{affectedStudents} of {cohort.students} students in {cohort.programme} haven't verified this skill yet
                </Text>
              </View>
            </GlassCard>
          )}

          <Text style={styles.sectionLabel}>Curriculum response</Text>
          {logged && (
            <GlassCard radius={18}>
              <View style={styles.loggedRow}>
                <Check size={14} color={colors.verified} strokeWidth={2.5} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.loggedText}>{logged.action}</Text>
                  <Text style={styles.loggedMeta}>Logged {logged.loggedAt}</Text>
                </View>
              </View>
            </GlassCard>
          )}
          {!logged && action && (
            <GlassCard radius={18}>
              <View style={styles.actionRow}>
                <ArrowRight size={14} color={colors.slate} />
                <Text style={styles.suggestionText}>Suggested: {action.action}</Text>
              </View>
            </GlassCard>
          )}

          <GlassCard radius={18}>
            <View style={styles.logForm}>
              <TextInput
                style={styles.input}
                placeholder="What is this programme doing about it?"
                placeholderTextColor={colors.slate}
                value={draft}
                onChangeText={setDraft}
                multiline
              />
              <Pressable style={styles.logBtn} onPress={handleLog}>
                <Text style={styles.logBtnText}>{logged ? "Update response" : "Log this response"}</Text>
              </Pressable>
            </View>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, gap: 16 },

  card: { padding: 18, gap: 8 },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  skill: { fontFamily: fonts.displayBold, fontSize: 19, color: colors.ink },
  rate: { fontFamily: fonts.mono, fontSize: 14, color: colors.alert },
  taught: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.slate },
  track: { height: 6, backgroundColor: "rgba(16,25,43,0.08)", borderRadius: 3, overflow: "hidden", marginTop: 4 },
  fill: { height: "100%", borderRadius: 3 },

  affectedRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 16 },
  affectedText: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.ink, lineHeight: 18 },

  sectionLabel: { fontFamily: fonts.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: colors.slate, marginBottom: -4 },

  loggedRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 16 },
  loggedText: { fontFamily: fonts.sansMedium, fontSize: 13.5, color: colors.verified, lineHeight: 19 },
  loggedMeta: { fontFamily: fonts.mono, fontSize: 10.5, color: colors.slate, marginTop: 3 },

  actionRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 16 },
  suggestionText: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.slate, lineHeight: 18, fontStyle: "italic" },

  logForm: { padding: 16, gap: 10 },
  input: {
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.1)",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.6)",
    padding: 12,
    minHeight: 70,
    textAlignVertical: "top",
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.ink,
  },
  logBtn: { backgroundColor: colors.ink, borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  logBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.parchment },
});
