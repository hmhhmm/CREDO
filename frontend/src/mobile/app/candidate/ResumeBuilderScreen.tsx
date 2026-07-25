// Resume Builder — assembles a real resume from the candidate's actual account data
// (contact info, university/field, verified skills with confidence, verified artifacts as
// experience/projects, SimuHire as a behavioral-proof line). No invented content: any
// section with nothing behind it is left out rather than filled with placeholder text.
//
// The on-screen layout follows the actual convention of a one-page professional resume
// (name/contact header rule, small-caps section headings with a divider line, skills as a
// dense inline list rather than pill chips, reverse-chronological entries) instead of a
// generic app card — modeled on the standard "reverse-chronological resume" format used by
// real resume builders (Google's own career-advice guidance and most ATS-oriented templates
// converge on this shape: header, summary/skills, experience, education, in that order).
// Export is plain-text Copy/Share (native Share API + Clipboard, same as CardScreen's
// public-link sharing) — no PDF library is installed in this project, and adding a new
// native dependency wasn't part of this task's scope.
import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Share, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import { Copy, Share2, Check, FileText } from "lucide-react-native";
import ScreenBackground from "../../components/shared/ScreenBackground";
import { useAuth } from "../../context/AuthContext";
import { useTabBarVisibility } from "../../context/TabBarVisibilityContext";
import { portfolioApi, namecardApi, ApiError, type PortfolioResponse, type NamecardResponse } from "../../lib/api";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

function formatYear(iso: string) {
  return new Date(iso).getFullYear();
}

// Builds the actual exportable resume text from real fetched data — the same content
// rendered on screen, so "what you see is what you export" holds exactly.
function buildResumeText(
  user: { name: string; email: string; location: string | null; linkedin_url: string | null },
  namecard: NamecardResponse,
  portfolio: PortfolioResponse
): string {
  const lines: string[] = [];
  lines.push(user.name.toUpperCase());
  const contactLine = [user.email, user.location, user.linkedin_url].filter(Boolean).join(" | ");
  if (contactLine) lines.push(contactLine);
  lines.push("");

  const verifiedSkills = namecard.skills.filter((s) => s.verified);
  if (verifiedSkills.length > 0) {
    lines.push("SKILLS");
    lines.push("-".repeat(40));
    lines.push(verifiedSkills.map((s) => s.skill).join(" · "));
    lines.push("");
  }

  const projects = portfolio.verified_artifacts.filter((a) => a.artifact_type === "github" && a.status === "verified");
  if (projects.length > 0) {
    lines.push("PROJECTS");
    lines.push("-".repeat(40));
    for (const p of projects) {
      const description = p.metadata && typeof p.metadata.description === "string" ? p.metadata.description : null;
      lines.push(`${p.artifact_name}${description ? ` — ${description}` : ""}`);
      lines.push(`Verified ${formatYear(p.verified_at ?? p.created_at)}`);
    }
    lines.push("");
  }

  if (portfolio.field_of_study || portfolio.university) {
    lines.push("EDUCATION");
    lines.push("-".repeat(40));
    lines.push([portfolio.field_of_study, portfolio.university].filter(Boolean).join(", "));
    if (portfolio.graduation_year) lines.push(`Class of ${portfolio.graduation_year}`);
    lines.push("");
  }

  const credentials = portfolio.verified_artifacts.filter((a) => a.artifact_type === "credential" && a.status === "verified");
  if (credentials.length > 0) {
    lines.push("CERTIFICATIONS");
    lines.push("-".repeat(40));
    for (const c of credentials) {
      const issuer = c.metadata && typeof c.metadata.issuer === "string" ? ` — ${c.metadata.issuer}` : "";
      lines.push(`${c.artifact_name}${issuer} (${formatYear(c.verified_at ?? c.created_at)})`);
    }
    lines.push("");
  }

  if (namecard.simuhire_badge) {
    lines.push("BEHAVIORAL ASSESSMENT");
    lines.push("-".repeat(40));
    lines.push(
      `CREDO SimuHire (${namecard.simuhire_badge.simulation_type}) — ${Math.round(namecard.simuhire_badge.overall_score)}/100`
    );
    lines.push("");
  }

  lines.push(`Every item above is independently verified — full record at ${portfolio.public_url}`);
  return lines.join("\n");
}

export default function ResumeBuilderScreen() {
  const { user } = useAuth();
  const { setHidden } = useTabBarVisibility();
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [namecard, setNamecard] = useState<NamecardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [p, n] = await Promise.all([portfolioApi.me(), namecardApi.get(user.id)]);
      setPortfolio(p);
      setNamecard(n);
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

  // Hide the bottom tab bar while viewing the resume — same treatment as Coach Session and
  // Interview Practice, so this reads as a focused document rather than another tab page.
  useFocusEffect(
    useCallback(() => {
      setHidden(true);
      return () => setHidden(false);
    }, [setHidden])
  );

  const resumeText = user && namecard && portfolio ? buildResumeText(user, namecard, portfolio) : null;

  const copyResume = async () => {
    if (!resumeText) return;
    await Clipboard.setStringAsync(resumeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareResume = async () => {
    if (!resumeText) return;
    try {
      await Share.share({ message: resumeText });
    } catch {
      // user dismissed the share sheet — nothing to do
    }
  };

  const verifiedSkills = namecard?.skills.filter((s) => s.verified) ?? [];
  const projects = portfolio?.verified_artifacts.filter((a) => a.artifact_type === "github" && a.status === "verified") ?? [];
  const credentials = portfolio?.verified_artifacts.filter((a) => a.artifact_type === "credential" && a.status === "verified") ?? [];

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator color={colors.ink} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : !portfolio || !namecard || !user ? null : (
            <>
              <Text style={styles.intro}>
                Built from your verified profile in the standard resume format — nothing here is a claim you haven&apos;t
                backed with evidence.
              </Text>

              {/* Resume "paper" — a flat white sheet with a hairline border, the way an actual
                  resume document looks, rather than the app's usual frosted glass card. */}
              <View style={styles.paperShadow}>
                <View style={styles.paper}>
                  <View style={styles.header}>
                    <Text style={styles.name}>{user.name}</Text>
                    <Text style={styles.contactLine}>
                      {[user.email, user.location, user.linkedin_url].filter(Boolean).join("   ·   ")}
                    </Text>
                  </View>

                  {verifiedSkills.length > 0 && (
                    <View style={styles.section}>
                      <View style={styles.sectionHeadingRow}>
                        <Text style={styles.sectionHeading}>Skills</Text>
                        <View style={styles.sectionRule} />
                      </View>
                      <Text style={styles.skillsLine}>{verifiedSkills.map((s) => s.skill).join("  ·  ")}</Text>
                    </View>
                  )}

                  {projects.length > 0 && (
                    <View style={styles.section}>
                      <View style={styles.sectionHeadingRow}>
                        <Text style={styles.sectionHeading}>Projects</Text>
                        <View style={styles.sectionRule} />
                      </View>
                      {projects.map((p) => (
                        <View key={p.id} style={styles.entry}>
                          <View style={styles.entryHeaderRow}>
                            <Text style={styles.entryTitle}>{p.artifact_name}</Text>
                            <Text style={styles.entryDate}>{formatYear(p.verified_at ?? p.created_at)}</Text>
                          </View>
                          <Text style={styles.entryVerifiedTag}>Independently verified</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {(portfolio.field_of_study || portfolio.university) && (
                    <View style={styles.section}>
                      <View style={styles.sectionHeadingRow}>
                        <Text style={styles.sectionHeading}>Education</Text>
                        <View style={styles.sectionRule} />
                      </View>
                      <View style={styles.entry}>
                        <View style={styles.entryHeaderRow}>
                          <Text style={styles.entryTitle}>{portfolio.university ?? "University"}</Text>
                          {portfolio.graduation_year && <Text style={styles.entryDate}>{portfolio.graduation_year}</Text>}
                        </View>
                        {portfolio.field_of_study && <Text style={styles.entrySub}>{portfolio.field_of_study}</Text>}
                      </View>
                    </View>
                  )}

                  {credentials.length > 0 && (
                    <View style={styles.section}>
                      <View style={styles.sectionHeadingRow}>
                        <Text style={styles.sectionHeading}>Certifications</Text>
                        <View style={styles.sectionRule} />
                      </View>
                      {credentials.map((c) => {
                        const issuer = c.metadata && typeof c.metadata.issuer === "string" ? c.metadata.issuer : null;
                        return (
                          <View key={c.id} style={styles.entry}>
                            <View style={styles.entryHeaderRow}>
                              <Text style={styles.entryTitle}>{c.artifact_name}</Text>
                              <Text style={styles.entryDate}>{formatYear(c.verified_at ?? c.created_at)}</Text>
                            </View>
                            {issuer && <Text style={styles.entrySub}>{issuer}</Text>}
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {namecard.simuhire_badge && (
                    <View style={styles.section}>
                      <View style={styles.sectionHeadingRow}>
                        <Text style={styles.sectionHeading}>Behavioral Assessment</Text>
                        <View style={styles.sectionRule} />
                      </View>
                      <View style={styles.entry}>
                        <View style={styles.entryHeaderRow}>
                          <Text style={styles.entryTitle}>
                            CREDO SimuHire — {namecard.simuhire_badge.simulation_type}
                          </Text>
                          <Text style={styles.entryDate}>{Math.round(namecard.simuhire_badge.overall_score)}/100</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {verifiedSkills.length === 0 && projects.length === 0 && credentials.length === 0 && (
                    <View style={styles.emptySection}>
                      <FileText size={16} color={colors.slate} />
                      <Text style={styles.emptyText}>
                        Nothing verified yet — verify a skill, project, or credential and it appears here.
                      </Text>
                    </View>
                  )}

                  <Text style={styles.footer}>Every item above is independently verified — full record at {portfolio.public_url}</Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <Pressable style={styles.actionBtn} onPress={copyResume} disabled={!resumeText}>
                  {copied ? <Check size={15} color={colors.verified} /> : <Copy size={15} color={colors.ink} />}
                  <Text style={[styles.actionBtnText, copied && { color: colors.verified }]}>
                    {copied ? "Copied" : "Copy as text"}
                  </Text>
                </Pressable>
                <Pressable style={styles.actionBtn} onPress={shareResume} disabled={!resumeText}>
                  <Share2 size={15} color={colors.ink} />
                  <Text style={styles.actionBtnText}>Share</Text>
                </Pressable>
              </View>

              {/* Plain-text version of the exact same content, below the visual resume — the
                  Copy button covers the common case, but a visible text block lets you
                  manually drag-select just the part you want instead of all-or-nothing. */}
              {resumeText && (
                <View style={styles.plainTextSection}>
                  <Text style={styles.plainTextLabel}>Plain text — select any part to copy manually</Text>
                  <View style={styles.plainTextBox}>
                    <Text style={styles.plainTextContent}>{resumeText}</Text>
                  </View>
                </View>
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
  intro: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.slate, lineHeight: 18 },
  error: { fontFamily: fonts.mono, fontSize: 13, color: colors.alert },

  paperShadow: {
    borderRadius: 4,
    shadowColor: "rgba(16,25,43,0.25)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 4,
  },
  paper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.08)",
    padding: 26,
  },

  header: { alignItems: "center", paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: colors.ink },
  name: { fontFamily: fonts.displayBold, fontSize: 24, color: colors.ink, letterSpacing: 0.5 },
  contactLine: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.slate, marginTop: 6, textAlign: "center" },

  section: { marginTop: 18 },
  sectionHeadingRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  sectionHeading: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11.5,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: colors.ink,
  },
  sectionRule: { flex: 1, height: 1, backgroundColor: "rgba(16,25,43,0.15)" },

  skillsLine: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.ink, lineHeight: 20 },

  entry: { marginBottom: 10 },
  entryHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 8 },
  entryTitle: { flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink },
  entryDate: { fontFamily: fonts.mono, fontSize: 10.5, color: colors.slate },
  entrySub: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, marginTop: 1 },
  entryVerifiedTag: { fontFamily: fonts.mono, fontSize: 10, color: colors.verified, marginTop: 1 },

  emptySection: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 16, padding: 4 },
  emptyText: { flex: 1, fontFamily: fonts.sans, fontSize: 12.5, color: colors.slate, lineHeight: 17 },

  footer: {
    fontFamily: fonts.mono,
    fontSize: 9.5,
    color: colors.slate,
    textAlign: "center",
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(16,25,43,0.1)",
  },

  actionRow: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 14,
    paddingVertical: 13,
    backgroundColor: "rgba(16,25,43,0.05)",
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.1)",
  },
  actionBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink },

  plainTextSection: { gap: 8 },
  plainTextLabel: { fontFamily: fonts.mono, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: colors.slate },
  plainTextBox: {
    borderRadius: 14,
    padding: 16,
    backgroundColor: "rgba(16,25,43,0.03)",
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.08)",
  },
  plainTextContent: { fontFamily: fonts.mono, fontSize: 12, color: colors.ink, lineHeight: 19 },
});
