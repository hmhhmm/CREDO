import { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import { ScanLine, QrCode as QrCodeIcon, Check, Bookmark, BookmarkCheck, X, AlertCircle } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../../context/AuthContext";
import { useSavedCompanyCards } from "../../context/SavedCompanyCardsContext";
import { portfolioApi, ApiError } from "../../lib/api";
import { allEmployers, type Employer } from "../../data/generateDataset";
import { useQrScanner, parseCredoQrUrl } from "../../utils/useQrScanner";
import { colors, surface } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import type { CardStackParamList } from "../../navigation/CardStack";

type Mode = "myQr" | "scan";
type Props = NativeStackScreenProps<CardStackParamList, "FairMode">;

export default function FairModeScreen({ route }: Props) {
  const { user } = useAuth();
  const { isCardSaved, saveCard } = useSavedCompanyCards();
  const [mode, setMode] = useState<Mode>(route.params?.initialMode ?? "myQr");
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanned, setScanned] = useState<Employer | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const { status, decoded, videoRef, reset } = useQrScanner(mode === "scan" && !scanned);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    portfolioApi
      .me()
      .then((p) => !cancelled && setPublicUrl(p.public_url))
      .catch((e) => !cancelled && setError(e instanceof ApiError ? e.message : "Could not reach the server."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Decode a real QR frame into a real employer lookup — the camera reads an actual
  // /company/{id} URL (see the employer's own "My QR" tab), parsed and matched against the
  // real seeded roster rather than fabricated.
  useEffect(() => {
    if (!decoded) return;
    const parsed = parseCredoQrUrl(decoded);
    if (!parsed || parsed.kind !== "employer") {
      setScanError("That QR code isn't a CREDO company card — point the camera at an employer's \"My QR\" screen.");
      return;
    }
    const employer = allEmployers.find((e) => e.id === parsed.id);
    if (!employer) {
      setScanError("Couldn't find that company in CREDO's records.");
      return;
    }
    setScanError(null);
    setScanned(employer);
  }, [decoded]);

  const saved = scanned && user ? isCardSaved(user.id, scanned.id) : false;

  const scanAgain = () => {
    setScanned(null);
    setScanError(null);
    reset();
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.modeSwitch}>
          <Pressable
            style={[styles.modeTab, mode === "myQr" && styles.modeTabActive]}
            onPress={() => setMode("myQr")}
          >
            <QrCodeIcon size={13} color={mode === "myQr" ? colors.parchment : colors.slate} />
            <Text style={[styles.modeTabText, mode === "myQr" && styles.modeTabTextActive]}>My QR</Text>
          </Pressable>
          <Pressable
            style={[styles.modeTab, mode === "scan" && styles.modeTabActive]}
            onPress={() => setMode("scan")}
          >
            <ScanLine size={13} color={mode === "scan" ? colors.parchment : colors.slate} />
            <Text style={[styles.modeTabText, mode === "scan" && styles.modeTabTextActive]}>Scan a Company</Text>
          </Pressable>
        </View>

        {mode === "myQr" ? (
          <>
            <Text style={styles.heading}>Show at a Career Fair</Text>
            <Text style={styles.sub}>An employer scans this to see your verified namecard instantly.</Text>

            <View style={styles.qrWrap}>
              {loading ? (
                <ActivityIndicator color={colors.ink} />
              ) : error ? (
                <Text style={styles.error}>{error}</Text>
              ) : publicUrl ? (
                <View style={styles.qrCard}>
                  <QRCode value={publicUrl} size={220} color={colors.ink} backgroundColor="#fff" />
                </View>
              ) : null}
            </View>

            {publicUrl && <Text style={styles.urlText}>{publicUrl}</Text>}
          </>
        ) : (
          <>
            <Text style={styles.heading}>Scan a Company Card</Text>
            <Text style={styles.sub}>Scan an employer&apos;s CREDO code to save their card to your folder.</Text>

            {!scanned ? (
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
                    {status !== "scanning" && <ScanLine size={44} color="rgba(16,25,43,0.25)" />}
                  </View>
                  <Text style={styles.scanHint}>
                    {status === "requesting"
                      ? "Requesting camera access…"
                      : status === "scanning"
                        ? "Point at an employer's CREDO QR"
                        : status === "denied"
                          ? "Camera access denied"
                          : status === "unsupported"
                            ? "Camera not available in this browser"
                            : "Point at an employer's CREDO QR"}
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
                  <Text style={styles.resultBadgeText}>Company card loaded</Text>
                </View>
                <GlassCard radius={22}>
                  <View style={styles.resultCard}>
                    <View style={styles.resultHead}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{scanned.initial}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.resultName}>{scanned.name}</Text>
                        <Text style={styles.resultMeta}>{scanned.industry} · {scanned.city}</Text>
                      </View>
                    </View>
                    <Text style={styles.resultContact}>Contact: {scanned.contactName}</Text>
                  </View>
                </GlassCard>
                {!saved ? (
                  <Pressable
                    style={styles.saveBtn}
                    onPress={() => user && saveCard(user.id, scanned.id)}
                  >
                    <Bookmark size={15} color={colors.parchment} />
                    <Text style={styles.saveBtnText}>Save to my cards</Text>
                  </Pressable>
                ) : (
                  <View style={styles.savedRow}>
                    <BookmarkCheck size={14} color={colors.verified} strokeWidth={2.5} />
                    <Text style={styles.savedText}>Saved to your folder</Text>
                  </View>
                )}
                <Pressable style={styles.resetBtn} onPress={scanAgain}>
                  <X size={13} color={colors.slate} />
                  <Text style={styles.resetText}>Scan another</Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingBottom: 96, alignItems: "center" },
  heading: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.ink, marginTop: 8, textAlign: "center" },
  sub: { fontFamily: fonts.sans, fontSize: 13, color: colors.slate, marginTop: 8, textAlign: "center", paddingHorizontal: 12 },

  modeSwitch: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: "rgba(16,25,43,0.05)",
    borderRadius: 100,
    padding: 4,
    marginTop: 4,
  },
  modeTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 100,
  },
  modeTabActive: { backgroundColor: colors.ink },
  modeTabText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.slate },
  modeTabTextActive: { color: colors.parchment },

  qrWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
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
  urlText: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate, marginBottom: 24, textAlign: "center" },
  error: { fontFamily: fonts.mono, fontSize: 13, color: colors.alert, textAlign: "center" },

  scannerWrap: { alignItems: "center", marginTop: 32, gap: 16 },
  scanner: {
    width: 220,
    height: 220,
    borderRadius: 28,
    backgroundColor: "rgba(16,25,43,0.04)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  corner: { position: "absolute", width: 30, height: 30, borderColor: colors.gold },
  tl: { top: 12, left: 12, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 },
  tr: { top: 12, right: 12, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12 },
  bl: { bottom: 12, left: 12, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 12 },
  br: { bottom: 12, right: 12, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12 },
  scanHint: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate, letterSpacing: 0.5, textAlign: "center" },
  scanErrorRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, paddingHorizontal: 16 },
  scanErrorText: { flex: 1, fontFamily: fonts.sans, fontSize: 11.5, color: colors.alert, lineHeight: 16, textAlign: "center" },

  resultWrap: { marginTop: 20, gap: 14, width: "100%" },
  resultBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    backgroundColor: "rgba(31,122,92,0.1)",
    borderRadius: 100,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  resultBadgeText: { fontFamily: fonts.mono, fontSize: 11, color: colors.verified },
  resultCard: { padding: 18, gap: 10 },
  resultHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 14, backgroundColor: "rgba(16,25,43,0.06)", alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.ink },
  resultName: { fontFamily: fonts.displayBold, fontSize: 17, color: colors.ink },
  resultMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, marginTop: 1 },
  resultContact: { fontFamily: fonts.mono, fontSize: 11.5, color: colors.slate },

  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.ink,
    borderRadius: 16,
    paddingVertical: 15,
  },
  saveBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.parchment },
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
  resetBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 4 },
  resetText: { fontFamily: fonts.mono, fontSize: 12, color: colors.slate },
});
