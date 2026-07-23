// After-hire value — the reason the Coach keeps working once you're placed.
//
// While employed, it turns the still-filling ledger into leverage: a self-review draft
// from verified accomplishments, internal roles you're already qualified for (grow without
// churning), and a ramp tracker for the current role. Employers never see any of this.
import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Briefcase, FileText, Check, ArrowUpRight, Lock } from "lucide-react-native";
import GlassCard from "../shared/GlassCard";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

interface InternalRole {
  title: string;
  team: string;
  match: number; // 0..100 readiness
}

interface Props {
  employer: string;
  lastReviewLabel: string; // e.g. "Jan 2026"
  verifiedSinceReview: number;
  rampPct: number; // onboarding-to-mastery in current role
  internalRoles: InternalRole[];
}

export default function AfterHire({ employer, lastReviewLabel, verifiedSinceReview, rampPct, internalRoles }: Props) {
  const [drafted, setDrafted] = useState(false);

  return (
    <GlassCard radius={18}>
      <View style={styles.wrap}>
        <View style={styles.head}>
          <Briefcase size={15} color={colors.ink} />
          <Text style={styles.title}>At {employer}</Text>
          <View style={styles.privateTag}>
            <Lock size={9} color={colors.slate} />
            <Text style={styles.privateText}>Private</Text>
          </View>
        </View>

        {/* Ramp tracker */}
        <View style={styles.rampBlock}>
          <View style={styles.rampHead}>
            <Text style={styles.rampLabel}>Onboarding → mastery</Text>
            <Text style={styles.rampPct}>{rampPct}%</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${rampPct}%` }]} />
          </View>
        </View>

        {/* Review prep */}
        <View style={styles.reviewBox}>
          <View style={{ flex: 1 }}>
            <Text style={styles.reviewTitle}>{verifiedSinceReview} verified wins since your last review</Text>
            <Text style={styles.reviewSub}>Since {lastReviewLabel} · ready to assemble into a self-review</Text>
          </View>
          <Pressable style={[styles.reviewBtn, drafted && styles.reviewBtnDone]} onPress={() => setDrafted(true)}>
            {drafted ? <Check size={14} color={colors.verified} /> : <FileText size={14} color={colors.parchment} />}
            <Text style={[styles.reviewBtnText, drafted && { color: colors.verified }]}>
              {drafted ? "Drafted" : "Draft review"}
            </Text>
          </Pressable>
        </View>

        {/* Internal mobility */}
        <View>
          <Text style={styles.sectionLabel}>Ready for internally</Text>
          {internalRoles.map((r) => (
            <View key={r.title} style={styles.roleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.roleTitle}>{r.title}</Text>
                <Text style={styles.roleTeam}>{r.team}</Text>
              </View>
              <Text style={styles.roleMatch}>{r.match}% ready</Text>
              <ArrowUpRight size={15} color={colors.slate} />
            </View>
          ))}
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 18, gap: 14 },
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink },
  privateTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16,25,43,0.05)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  privateText: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 0.5, color: colors.slate },
  rampBlock: { gap: 6 },
  rampHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rampLabel: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink },
  rampPct: { fontFamily: fonts.mono, fontSize: 13, color: colors.verified },
  track: { height: 6, backgroundColor: "rgba(16,25,43,0.08)", borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: colors.verified, borderRadius: 3 },
  reviewBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(16,25,43,0.03)",
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.08)",
  },
  reviewTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink },
  reviewSub: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.slate, marginTop: 2, lineHeight: 16 },
  reviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: colors.ink,
  },
  reviewBtnDone: { backgroundColor: `${colors.verified}1A` },
  reviewBtnText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.parchment },
  sectionLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.slate,
    marginBottom: 6,
  },
  roleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: "rgba(16,25,43,0.08)",
  },
  roleTitle: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink },
  roleTeam: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.slate, marginTop: 1 },
  roleMatch: { fontFamily: fonts.mono, fontSize: 11.5, color: colors.verified },
});
