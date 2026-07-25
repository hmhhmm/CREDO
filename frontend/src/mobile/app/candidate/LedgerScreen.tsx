import { useEffect, useState } from "react";
import { ScrollView, View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { ledgerApi, ApiError, type LedgerEntryResponse, type LedgerIntegrityResponse } from "../../lib/api";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import ScreenBackground from "../../components/shared/ScreenBackground";
import { LedgerChain, LedgerIntegrityBanner } from "../../components/shared/LedgerChain";

export default function LedgerScreen() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LedgerEntryResponse[]>([]);
  const [integrity, setIntegrity] = useState<LedgerIntegrityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([ledgerApi.list(user.id), ledgerApi.verify(user.id)])
      .then(([entryList, integrityResult]) => {
        if (cancelled) return;
        setEntries(entryList);
        setIntegrity(integrityResult);
      })
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
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator color={colors.ink} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <>
              {integrity && <LedgerIntegrityBanner integrity={integrity} />}
              <Text style={styles.sectionLabel}>Chain ({entries.length})</Text>
              <LedgerChain entries={entries} />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionLabel: { fontFamily: fonts.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: colors.slate, marginTop: 4 },
  error: { fontFamily: fonts.mono, fontSize: 13, color: colors.alert },
});
