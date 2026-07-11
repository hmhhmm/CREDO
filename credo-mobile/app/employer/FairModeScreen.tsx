import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScanLine, Check, Send, X } from "lucide-react-native";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { getConfidenceBand } from "../../utils/confidenceBand";
import { discoverCandidates } from "../../data/employerData";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

// E4 — scan a candidate's QR at a fair; verified namecard appears in ~2s. Camera scanning
// needs native permissions and can't be demoed offline, so this simulates a successful scan
// (the resulting namecard reveal is the demoable moment the PDF calls out as most relatable).
const scanned = discoverCandidates[0];

export default function FairModeScreen() {
  const [result, setResult] = useState<typeof scanned | null>(null);
  const [invited, setInvited] = useState(false);
  const band = result ? getConfidenceBand(result.trustScore) : null;

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Text style={styles.heading}>Fair Mode</Text>
        <Text style={styles.sub}>{"Scan a candidate's QR — their verified namecard appears instantly."}</Text>

        {!result ? (
          <>
            {/* Scanner frame */}
            <View style={styles.scannerWrap}>
              <View style={styles.scanner}>
                <View style={[styles.corner, styles.tl]} />
                <View style={[styles.corner, styles.tr]} />
                <View style={[styles.corner, styles.bl]} />
                <View style={[styles.corner, styles.br]} />
                <ScanLine size={48} color="rgba(16,25,43,0.25)" />
              </View>
              <Text style={styles.scanHint}>{"Point at a candidate's CREDO QR"}</Text>
            </View>
            <Pressable style={styles.scanBtn} onPress={() => setResult(scanned)}>
              <ScanLine size={16} color={colors.parchment} />
              <Text style={styles.scanBtnText}>Simulate scan</Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.resultWrap}>
            <View style={styles.resultBadge}>
              <Check size={14} color={colors.verified} strokeWidth={3} />
              <Text style={styles.resultBadgeText}>Verified namecard loaded</Text>
            </View>
            <GlassCard radius={22}>
              <View style={styles.resultCard}>
                <View style={styles.resultHead}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{result.name.split(" ").map((n) => n[0]).join("")}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultName}>{result.name}</Text>
                    <Text style={styles.resultMeta}>{result.field} · {result.university}</Text>
                  </View>
                  <View style={[styles.scoreRing, { borderColor: band!.hex }]}>
                    <Text style={[styles.scoreText, { color: band!.hex }]}>{result.trustScore}</Text>
                  </View>
                </View>
                <View style={styles.skillRow}>
                  {result.verifiedSkills.slice(0, 4).map((s) => (
                    <View key={s.name} style={styles.skillChip}>
                      <Check size={9} color={colors.verified} strokeWidth={3} />
                      <Text style={styles.skillText}>{s.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </GlassCard>
            {!invited ? (
              <Pressable style={styles.inviteBtn} onPress={() => setInvited(true)}>
                <Send size={15} color={colors.parchment} />
                <Text style={styles.inviteText}>Send SimuHire invite</Text>
              </Pressable>
            ) : (
              <View style={styles.inviteSent}>
                <Check size={14} color={colors.verified} strokeWidth={3} />
                <Text style={styles.inviteSentText}>SimuHire invite sent</Text>
              </View>
            )}
            <Pressable style={styles.resetBtn} onPress={() => { setResult(null); setInvited(false); }}>
              <X size={13} color={colors.slate} />
              <Text style={styles.resetText}>Scan another</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  heading: { fontFamily: fonts.displayBold, fontSize: 28, color: colors.ink, marginTop: 4 },
  sub: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.slate, marginTop: 4, lineHeight: 18 },

  scannerWrap: { alignItems: "center", marginTop: 40, gap: 16 },
  scanner: {
    width: 240,
    height: 240,
    borderRadius: 28,
    backgroundColor: "rgba(16,25,43,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  corner: { position: "absolute", width: 34, height: 34, borderColor: colors.gold },
  tl: { top: 14, left: 14, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 },
  tr: { top: 14, right: 14, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12 },
  bl: { bottom: 14, left: 14, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 12 },
  br: { bottom: 14, right: 14, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12 },
  scanHint: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate, letterSpacing: 0.5 },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.ink,
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 32,
  },
  scanBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.parchment },

  resultWrap: { marginTop: 24, gap: 14 },
  resultBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center", backgroundColor: "rgba(31,122,92,0.1)", borderRadius: 100, paddingVertical: 6, paddingHorizontal: 14 },
  resultBadgeText: { fontFamily: fonts.mono, fontSize: 11, color: colors.verified },
  resultCard: { padding: 18, gap: 14 },
  resultHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(16,25,43,0.06)", alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.ink },
  resultName: { fontFamily: fonts.displayBold, fontSize: 18, color: colors.ink },
  resultMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, marginTop: 1 },
  scoreRing: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  scoreText: { fontFamily: fonts.mono, fontSize: 14 },
  skillRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  skillChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(31,122,92,0.1)", borderRadius: 100, paddingVertical: 4, paddingHorizontal: 9 },
  skillText: { fontFamily: fonts.mono, fontSize: 10, color: colors.verified },
  inviteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.ink,
    borderRadius: 16,
    paddingVertical: 15,
  },
  inviteText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.parchment },
  inviteSent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(31,122,92,0.1)",
    borderRadius: 16,
    paddingVertical: 15,
  },
  inviteSentText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.verified },
  resetBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 4 },
  resetText: { fontFamily: fonts.mono, fontSize: 12, color: colors.slate },
});
