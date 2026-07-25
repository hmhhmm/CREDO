// Course Detail — what a Targeted Upskilling card opens into. Laid out like a real course
// listing (level/duration/rating up front, a description, a syllabus/topics list) using the
// catalog content on CREDENTIAL_PROGRAMS and GAP_COURSE_DETAILS. Neither data source in this
// app carries a real course-provider URL, so this stays an honest detail view rather than a
// fake "Enroll" button — no invented link, no fake progress tracking.
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GraduationCap, Award, Info, Star, Clock, Users, BarChart3 } from "lucide-react-native";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { GAP_COURSE_DETAILS } from "../../data/universityData";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { GrowStackParamList } from "../../navigation/GrowStack";

type Props = NativeStackScreenProps<GrowStackParamList, "CourseDetail">;

export default function CourseDetailScreen({ route }: Props) {
  const { skill, course, program } = route.params;
  const courseDetail = course ? GAP_COURSE_DETAILS[course] : null;

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          <View>
            <Text style={styles.skillLabel}>SKILL GAP</Text>
            <Text style={styles.skillTitle}>{skill}</Text>
          </View>

          {course && (
            <GlassCard radius={20}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <GraduationCap size={16} color={colors.gold} />
                  <Text style={styles.cardLabel}>University Course</Text>
                </View>
                <Text style={styles.cardTitle}>{course}</Text>

                {courseDetail && (
                  <>
                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <BarChart3 size={13} color={colors.slate} />
                        <Text style={styles.metaText}>{courseDetail.credits} credits</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Clock size={13} color={colors.slate} />
                        <Text style={styles.metaText}>{courseDetail.format}</Text>
                      </View>
                    </View>
                    <Text style={styles.description}>{courseDetail.description}</Text>
                    <Text style={styles.subheading}>What you'll cover</Text>
                    <View style={styles.topicList}>
                      {courseDetail.topics.map((topic) => (
                        <View key={topic} style={styles.topicChip}>
                          <Text style={styles.topicChipText}>{topic}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                <Text style={styles.enrolNote}>
                  This course code comes from your university's own curriculum mapping. Check your student portal or
                  academic advisor to enrol.
                </Text>
              </View>
            </GlassCard>
          )}

          {program && (
            <GlassCard radius={20}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Award size={16} color={colors.gold} />
                  <Text style={styles.cardLabel}>Third-Party Credential</Text>
                </View>
                <Text style={styles.cardTitle}>{program.name}</Text>
                <Text style={styles.cardIssuer}>{program.issuer}</Text>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Star size={13} color={colors.gold} fill={colors.gold} />
                    <Text style={styles.metaText}>{program.rating.toFixed(1)}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Users size={13} color={colors.slate} />
                    <Text style={styles.metaText}>{program.learners}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Clock size={13} color={colors.slate} />
                    <Text style={styles.metaText}>{program.duration}</Text>
                  </View>
                </View>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>{program.level}</Text>
                </View>

                <Text style={styles.description}>{program.description}</Text>

                <Text style={styles.subheading}>Skills you'll gain</Text>
                <View style={styles.topicList}>
                  {program.skillsCovered.map((s) => (
                    <View key={s} style={styles.topicChip}>
                      <Text style={styles.topicChipText}>{s}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.enrolNote}>
                  Search "{program.name}" directly with {program.issuer} to enrol — CREDO doesn't have a live
                  enrollment integration with this provider yet, so there's no in-app signup link here.
                </Text>
              </View>
            </GlassCard>
          )}

          {!course && !program && (
            <GlassCard radius={18}>
              <View style={styles.emptyCard}>
                <Info size={16} color={colors.slate} />
                <Text style={styles.emptyText}>
                  No specific course or credential is mapped to {skill} yet — this gap was flagged from your field's
                  expected skills, but a learning path for it hasn't been added to CREDO's catalog.
                </Text>
              </View>
            </GlassCard>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skillLabel: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.5, color: colors.slate },
  skillTitle: { fontFamily: fonts.displayBold, fontSize: 24, color: colors.ink, marginTop: 4 },

  card: { padding: 20, gap: 10 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardLabel: { fontFamily: fonts.mono, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: colors.slate },
  cardTitle: { fontFamily: fonts.sansSemiBold, fontSize: 17, color: colors.ink, marginTop: 2 },
  cardIssuer: { fontFamily: fonts.sans, fontSize: 13, color: colors.gold, marginTop: -4 },

  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 4 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate },

  levelBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(201,166,70,0.14)",
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  levelBadgeText: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.5, color: colors.gold },

  description: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.ink, lineHeight: 20, marginTop: 4 },
  subheading: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.ink, marginTop: 6 },

  topicList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  topicChip: {
    backgroundColor: "rgba(16,25,43,0.05)",
    borderRadius: 100,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.08)",
  },
  topicChipText: { fontFamily: fonts.sansSemiBold, fontSize: 11.5, color: colors.ink },

  enrolNote: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    color: colors.slate,
    lineHeight: 17,
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(16,25,43,0.06)",
  },

  emptyCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 18 },
  emptyText: { flex: 1, fontFamily: fonts.sans, fontSize: 12.5, color: colors.slate, lineHeight: 18 },
});
