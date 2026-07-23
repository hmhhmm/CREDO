import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import { useAuth } from "../../context/AuthContext";
import { portfolioApi, ApiError } from "../../lib/api";
import { colors, surface } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import ScreenBackground from "../../components/shared/ScreenBackground";

export default function FairModeScreen() {
  const { user } = useAuth();
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
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
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingBottom: 96, alignItems: "center" },
  heading: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.ink, marginTop: 8, textAlign: "center" },
  sub: { fontFamily: fonts.sans, fontSize: 13, color: colors.slate, marginTop: 8, textAlign: "center", paddingHorizontal: 12 },
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
});
