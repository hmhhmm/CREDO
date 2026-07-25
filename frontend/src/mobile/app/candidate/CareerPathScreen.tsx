// Career Path Navigator — real matches computed from the candidate's actual verified
// skills against real, currently-open job listings (deriveCareerPathMatches, the same
// allJobs data Job Matches/Discover use), not a fixed 3-path illustration. Match % is real
// overlap, gap skills are named specifically, and open-roles/salary/employers come from
// real postings — so this is no longer marked Preview.
import { useCallback, useEffect, useState } from "react";
import { View, ScrollView, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { ArrowRight, Briefcase, MapPin } from "lucide-react-native";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { useAuth } from "../../context/AuthContext";
import { namecardApi, portfolioApi, ApiError, type NamecardResponse, type PortfolioResponse } from "../../lib/api";
import { deriveCareerPathMatches, type CareerPathMatch } from "../../utils/careerPathMatching";
import { allEmployers } from "../../data/generateDataset";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

const EMPLOYER_NAME_BY_ID = new Map(allEmployers.map((e) => [e.id, e.name]));

function formatSalary(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) return `RM ${min.toLocaleString()} – ${max.toLocaleString()} / mo`;
  const only = (min ?? max)!;
  return `${min != null ? "From" : "Up to"} RM ${only.toLocaleString()} / mo`;
}

export default function CareerPathScreen() {
  const { user } = useAuth();
  const [namecardRes, setNamecardRes] = useState<NamecardResponse | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [n, p] = await Promise.all([namecardApi.get(user.id), portfolioApi.me()]);
      setNamecardRes(n);
      setPortfolio(p);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const matches: CareerPathMatch[] =
    namecardRes && portfolio
      ? deriveCareerPathMatches(portfolio.field_of_study, namecardRes.skills, EMPLOYER_NAME_BY_ID)
      : [];
  const verifiedCount = namecardRes?.skills.filter((s) => s.verified).length ?? 0;

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator color={colors.ink} style={{ marginTop: 40 }} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <>
              <Text style={styles.intro}>
                {verifiedCount > 0
                  ? `Based on your ${verifiedCount} verified skill${verifiedCount === 1 ? "" : "s"}, matched against real open roles right now.`
                  : "Verify a skill first — matches are computed from what's actually confirmed, not claimed."}
              </Text>

              {matches.length === 0 ? (
                <GlassCard radius={18}>
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>No real matches yet</Text>
                    <Text style={styles.emptyBody}>
                      {verifiedCount > 0
                        ? "None of your verified skills overlap with a currently open role. Verify more skills, or check back as new roles open."
                        : "Once you verify a skill, this checks it against every real open role in CREDO right now."}
                    </Text>
                  </View>
                </GlassCard>
              ) : (
                matches.map((move) => {
                  const salary = formatSalary(move.salaryMin, move.salaryMax);
                  return (
                    <GlassCard key={move.title} radius={18}>
                      <View style={styles.card}>
                        <View style={styles.cardHeader}>
                          <Text style={styles.cardTitle}>{move.title}</Text>
                          <Text style={styles.match}>{move.matchPct}% match</Text>
                        </View>
                        <View style={styles.track}>
                          <View style={[styles.fill, { width: `${move.matchPct}%` }]} />
                        </View>

                        <View style={styles.metaRow}>
                          <View style={styles.metaItem}>
                            <Briefcase size={12} color={colors.slate} />
                            <Text style={styles.metaText}>
                              {move.openRoles} open role{move.openRoles === 1 ? "" : "s"}
                              {move.employers.length > 0 ? ` · ${move.employers.join(", ")}` : ""}
                            </Text>
                          </View>
                        </View>
                        {salary && (
                          <View style={styles.metaItem}>
                            <MapPin size={12} color={colors.slate} />
                            <Text style={styles.metaText}>{salary}</Text>
                          </View>
                        )}

                        {move.matchedSkills.length > 0 && (
                          <Text style={styles.reason}>
                            You already have {move.matchedSkills.join(", ")} verified.
                          </Text>
                        )}
                        {move.gapSkills.length > 0 && (
                          <View style={styles.gapRow}>
                            <ArrowRight size={12} color={colors.pending} />
                            <Text style={styles.gap}>
                              Not yet verified: {move.gapSkills.join(", ")}.
                            </Text>
                          </View>
                        )}
                      </View>
                    </GlassCard>
                  );
                })
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  error: { fontFamily: fonts.mono, fontSize: 13, color: colors.alert },
  intro: { fontFamily: fonts.sans, fontSize: 13, color: colors.slate, lineHeight: 19 },

  card: { padding: 16, gap: 9 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink },
  match: { fontFamily: fonts.mono, fontSize: 12, color: colors.verified },
  track: { height: 5, backgroundColor: "rgba(16,25,43,0.08)", borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: colors.verified, borderRadius: 3 },

  metaRow: { flexDirection: "row", flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.slate, flexShrink: 1 },

  reason: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink, lineHeight: 17 },
  gapRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  gap: { flex: 1, fontFamily: fonts.sans, fontSize: 12, color: colors.slate, lineHeight: 17 },

  emptyCard: { padding: 20, gap: 6, alignItems: "center" },
  emptyTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  emptyBody: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.slate, textAlign: "center", lineHeight: 18 },
});
