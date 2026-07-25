import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import { ScanLine, QrCode as QrCodeIcon, Check, Send, X, Bookmark, BookmarkCheck, AlertCircle, Folder } from "lucide-react-native";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { getConfidenceBand } from "../../utils/confidenceBand";
import { usePipeline } from "../../context/PipelineContext";
import { useInterviewStages } from "../../context/InterviewStagesContext";
import { useSavedCandidateCards } from "../../context/SavedCandidateCardsContext";
import { useQrScanner, parseCredoQrUrl } from "../../utils/useQrScanner";
import { discoverCandidates, type DiscoverCandidate } from "../../data/employerData";
import { demoEmployer } from "../../data/generateDataset";
import { colors, surface } from "../../theme/colors";
import { fonts } from "../../theme/typography";

type Mode = "myQr" | "scan";

export default function FairModeScreen() {
  const [mode, setMode] = useState<Mode>("scan");
  const [result, setResult] = useState<DiscoverCandidate | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const { pipeline, inviteToInterview } = usePipeline();
  const { stages } = useInterviewStages();
  const { isCardSaved, saveCard, savedCardsFor } = useSavedCandidateCards();

  const savedCandidateCards = savedCardsFor(demoEmployer.id)
    .map((card) => ({ card, candidate: discoverCandidates.find((c) => c.id === card.candidateId) }))
    .filter((entry): entry is { card: (typeof entry)["card"]; candidate: DiscoverCandidate } => !!entry.candidate);

  const { status, decoded, videoRef, reset } = useQrScanner(mode === "scan" && !result);

  useEffect(() => {
    if (!decoded) return;
    const parsed = parseCredoQrUrl(decoded);
    if (!parsed || parsed.kind !== "candidate") {
      setScanError("That QR code isn't a CREDO candidate card — point the camera at a candidate's \"My QR\" screen.");
      return;
    }
    const candidate = discoverCandidates.find((c) => c.id === parsed.id);
    if (!candidate) {
      setScanError("Couldn't find that candidate in CREDO's records.");
      return;
    }
    setScanError(null);
    setResult(candidate);
  }, [decoded]);

  const band = result ? getConfidenceBand(result.trustScore) : null;
  const invited = result ? pipeline.some((p) => p.candidateId === result.id && p.currentStageId !== null) : false;
  const saved = result ? isCardSaved(demoEmployer.id, result.id) : false;
  const companyQrUrl = `http://localhost:5173/company/${demoEmployer.id}`;

  const scanAgain = () => {
    setResult(null);
    setScanError(null);
    reset();
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["top"]}>
       <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.modeSwitch}>
          <Pressable style={[styles.modeTab, mode === "scan" && styles.modeTabActive]} onPress={() => setMode("scan")}>
            <ScanLine size={13} color={mode === "scan" ? colors.parchment : colors.slate} />
            <Text style={[styles.modeTabText, mode === "scan" && styles.modeTabTextActive]}>Scan a Candidate</Text>
          </Pressable>
          <Pressable style={[styles.modeTab, mode === "myQr" && styles.modeTabActive]} onPress={() => setMode("myQr")}>
            <QrCodeIcon size={13} color={mode === "myQr" ? colors.parchment : colors.slate} />
            <Text style={[styles.modeTabText, mode === "myQr" && styles.modeTabTextActive]}>My QR</Text>
          </Pressable>
        </View>

        {mode === "myQr" ? (
          <>
            <Text style={styles.heading}>Show at a Career Fair</Text>
            <Text style={styles.sub}>A candidate scans this to save your company card to their folder.</Text>
            <View style={styles.qrWrap}>
              <View style={styles.qrCard}>
                <QRCode value={companyQrUrl} size={220} color={colors.ink} backgroundColor="#fff" />
              </View>
              <Text style={styles.urlText}>{companyQrUrl}</Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.heading}>Fair Mode</Text>
            <Text style={styles.sub}>{"Scan a candidate's QR — their verified namecard appears instantly."}</Text>

            {!result ? (
              <>
                <View style={styles.scannerWrap}>
                  <View style={styles.scanner}>
                    {status === "scanning" && (
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 28 }}
                      />
                    )}
                    <View style={[styles.corner, styles.tl]} />
                    <View style={[styles.corner, styles.tr]} />
                    <View style={[styles.corner, styles.bl]} />
                    <View style={[styles.corner, styles.br]} />
                    {status !== "scanning" && <ScanLine size={48} color="rgba(16,25,43,0.25)" />}
                  </View>
                  <Text style={styles.scanHint}>
                    {status === "requesting"
                      ? "Requesting camera access…"
                      : status === "scanning"
                        ? "Point at a candidate's CREDO QR"
                        : status === "denied"
                          ? "Camera access denied"
                          : status === "unsupported"
                            ? "Camera not available in this browser"
                            : "Point at a candidate's CREDO QR"}
                  </Text>
                  {scanError && (
                    <View style={styles.scanErrorRow}>
                      <AlertCircle size={13} color={colors.alert} />
                      <Text style={styles.scanErrorText}>{scanError}</Text>
                    </View>
                  )}
                  {(status === "denied" || status === "unsupported") && (
                    <Text style={styles.scanErrorText}>
                      {status === "denied"
                        ? "Allow camera access for this site in your browser settings, then reopen this tab."
                        : "Try a browser with camera support, like Chrome or Safari on a phone."}
                    </Text>
                  )}
                </View>
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
                {!saved ? (
                  <Pressable style={styles.saveBtn} onPress={() => saveCard(demoEmployer.id, result.id)}>
                    <Bookmark size={15} color={colors.parchment} />
                    <Text style={styles.saveBtnText}>Save to my cards</Text>
                  </Pressable>
                ) : (
                  <View style={styles.savedRow}>
                    <BookmarkCheck size={14} color={colors.verified} strokeWidth={2.5} />
                    <Text style={styles.savedText}>Saved to your folder</Text>
                  </View>
                )}
                {!invited ? (
                  <Pressable
                    style={styles.inviteBtn}
                    onPress={() => result && stages[0] && inviteToInterview(result, stages[0].id)}
                  >
                    <Send size={15} color={colors.parchment} />
                    <Text style={styles.inviteText}>Invite to Interview</Text>
                  </Pressable>
                ) : (
                  <View style={styles.inviteSent}>
                    <Check size={14} color={colors.verified} strokeWidth={3} />
                    <Text style={styles.inviteSentText}>Interview invited</Text>
                  </View>
                )}
                <Pressable style={styles.resetBtn} onPress={scanAgain}>
                  <X size={13} color={colors.slate} />
                  <Text style={styles.resetText}>Scan another</Text>
                </Pressable>
              </View>
            )}

            {/* Saved Candidate Cards — a lightweight "cards I've scanned" folder, separate
                from Pipeline (a full recruiting funnel). Mirrors the candidate side's own
                "Saved Company Cards" section on their Card tab. */}
            {savedCandidateCards.length > 0 && (
              <View style={styles.savedFolder}>
                <View style={styles.savedFolderHeadRow}>
                  <Folder size={13} color={colors.slate} />
                  <Text style={styles.sectionLabel}>Saved Candidate Cards</Text>
                </View>
                <View style={{ gap: 10 }}>
                  {savedCandidateCards.map(({ candidate }) => (
                    <GlassCard key={candidate.id} radius={16}>
                      <View style={styles.savedCardRow}>
                        <View style={styles.avatarSmall}>
                          <Text style={styles.avatarSmallText}>
                            {candidate.name.split(" ").map((n) => n[0]).join("")}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.savedCardName} numberOfLines={1}>{candidate.name}</Text>
                          <Text style={styles.savedCardMeta} numberOfLines={1}>{candidate.field} · {candidate.university}</Text>
                        </View>
                      </View>
                    </GlassCard>
                  ))}
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
  scroll: { padding: 20, paddingBottom: 40 },
  heading: { fontFamily: fonts.displayBold, fontSize: 28, color: colors.ink, marginTop: 4, textAlign: "center" },
  sub: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.slate, marginTop: 4, lineHeight: 18, textAlign: "center" },

  modeSwitch: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: "rgba(16,25,43,0.05)",
    borderRadius: 100,
    padding: 4,
    alignSelf: "center",
  },
  modeTab: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 100 },
  modeTabActive: { backgroundColor: colors.ink },
  modeTabText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.slate },
  modeTabTextActive: { color: colors.parchment },

  qrWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20, marginTop: 20 },
  qrCard: {
    padding: 24,
    backgroundColor: "#fff",
    borderRadius: 24,
    shadowColor: surface.glassShadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
  urlText: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate, textAlign: "center" },

  scannerWrap: { alignItems: "center", marginTop: 40, gap: 16 },
  scanner: {
    width: 240,
    height: 240,
    borderRadius: 28,
    backgroundColor: "rgba(16,25,43,0.04)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  corner: { position: "absolute", width: 34, height: 34, borderColor: colors.gold },
  tl: { top: 14, left: 14, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 },
  tr: { top: 14, right: 14, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12 },
  bl: { bottom: 14, left: 14, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 12 },
  br: { bottom: 14, right: 14, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12 },
  scanHint: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate, letterSpacing: 0.5, textAlign: "center" },
  scanErrorRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, paddingHorizontal: 16 },
  scanErrorText: { flex: 1, fontFamily: fonts.sans, fontSize: 11.5, color: colors.alert, lineHeight: 16, textAlign: "center" },

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

  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(16,25,43,0.05)",
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.12)",
    borderRadius: 16,
    paddingVertical: 15,
  },
  saveBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  savedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(31,122,92,0.1)",
    borderRadius: 16,
    paddingVertical: 15,
  },
  savedText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.verified },

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

  savedFolder: { marginTop: 32, gap: 12 },
  savedFolderHeadRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionLabel: { fontFamily: fonts.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: colors.slate },
  savedCardRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  avatarSmall: { width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(16,25,43,0.06)", alignItems: "center", justifyContent: "center" },
  avatarSmallText: { fontFamily: fonts.displayBold, fontSize: 13, color: colors.ink },
  savedCardName: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.ink },
  savedCardMeta: { fontFamily: fonts.mono, fontSize: 10.5, color: colors.slate, marginTop: 1 },
});
