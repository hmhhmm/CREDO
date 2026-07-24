// U2 — Curriculum Gap Detector, full list, paired with U9's closed-loop response. Pulled
// out of Pulse (which used to embed this whole feature inline) into its own hub — a
// teaser card on Pulse links in here, and each card still drills into
// SkillGapDetailScreen.
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TrendingDown, ArrowRight, Check, ChevronRight } from "lucide-react-native";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { getSkillGaps, getCurriculumActions, type University } from "../../data/universityData";
import { useCurriculumAction } from "../../context/CurriculumActionContext";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { UniversityHomeStackParamList } from "../../navigation/UniversityHomeStack";

type Props = NativeStackScreenProps<UniversityHomeStackParamList, "CurriculumGapHub"> & { university: University };

export default function CurriculumGapScreen({ university, navigation }: Props) {
  const skillGaps = getSkillGaps(university);
  const curriculumActions = getCurriculumActions(skillGaps);
  const { actionFor } = useCurriculumAction();

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.subheading}>Skills that are taught but consistently fail verification across this cohort.</Text>

          <View style={{ gap: 12 }}>
            {skillGaps.map((g) => {
              const suggestion = curriculumActions.find((a) => a.skill === g.skill);
              const logged = actionFor(university.id, g.skill);
              return (
                <GlassCard key={g.skill} radius={18}>
                  <Pressable
                    style={styles.gapCard}
                    onPress={() => navigation.navigate("SkillGapDetail", { skill: g.skill })}
                  >
                    <View style={styles.gapHead}>
                      <TrendingDown size={15} color={colors.alert} />
                      <Text style={styles.gapSkill}>{g.skill}</Text>
                      <Text style={styles.gapRate}>{g.verifyRate}% verify</Text>
                      <ChevronRight size={14} color={colors.slate} />
                    </View>
                    <Text style={styles.gapTaught}>Taught in {g.taughtIn}</Text>
                    <View style={styles.track}>
                      <View style={[styles.fill, { width: `${g.verifyRate}%`, backgroundColor: colors.alert }]} />
                    </View>
                    {logged ? (
                      <View style={styles.actionRow}>
                        <Check size={13} color={colors.verified} strokeWidth={2.5} />
                        <Text style={styles.actionText}>{logged.action}</Text>
                      </View>
                    ) : (
                      suggestion && (
                        <View style={styles.actionRow}>
                          <ArrowRight size={13} color={colors.slate} />
                          <Text style={styles.suggestionText}>Suggested: {suggestion.action}</Text>
                        </View>
                      )
                    )}
                  </Pressable>
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
  scroll: { padding: 20, gap: 16 },
  subheading: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.slate, lineHeight: 18 },

  track: { height: 5, backgroundColor: "rgba(16,25,43,0.08)", borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 3 },

  gapCard: { padding: 16, gap: 7 },
  gapHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  gapSkill: { flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  gapRate: { fontFamily: fonts.mono, fontSize: 12, color: colors.alert },
  gapTaught: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.slate },
  actionRow: { flexDirection: "row", alignItems: "flex-start", gap: 7, marginTop: 2 },
  actionText: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 11.5, color: colors.verified, lineHeight: 16 },
  suggestionText: { flex: 1, fontFamily: fonts.sans, fontSize: 11.5, color: colors.slate, lineHeight: 16, fontStyle: "italic" },
});
