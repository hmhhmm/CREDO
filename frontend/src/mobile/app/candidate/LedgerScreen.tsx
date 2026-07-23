import { useEffect, useState } from "react";
import { ScrollView, View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ShieldCheck, ShieldAlert } from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { ledgerApi, ApiError, type LedgerEntryResponse, type LedgerIntegrityResponse } from "../../lib/api";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";

function shortHash(hash: string | null) {
  if (!hash) return "—";
  return `${hash.slice(0, 8)}···${hash.slice(-4)}`;
}

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
              {integrity && (
                <View style={[styles.integrityCard, integrity.intact ? styles.integrityOk : styles.integrityBad]}>
                  {integrity.intact ? (
                    <ShieldCheck size={18} color={colors.verified} />
                  ) : (
                    <ShieldAlert size={18} color={colors.alert} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.integrityTitle, { color: integrity.intact ? colors.verified : colors.alert }]}>
                      {integrity.intact ? "Chain intact" : "Chain integrity failed"}
                    </Text>
                    <Text style={styles.integritySub}>
                      {integrity.entry_count} entr{integrity.entry_count === 1 ? "y" : "ies"} · root {shortHash(integrity.stored_root)}
                    </Text>
                  </View>
                </View>
              )}

              <Text style={styles.sectionLabel}>Chain ({entries.length})</Text>
              {entries.length === 0 ? (
                <Text style={styles.empty}>No verified artifacts recorded yet.</Text>
              ) : (
                <View style={{ gap: 10 }}>
                  {entries.map((entry) => (
                    <GlassCard key={entry.id} radius={16}>
                      <View style={styles.entryCard}>
                        <View style={styles.entryHeader}>
                          <Text style={styles.entryIndex}>#{entry.block_index}</Text>
                          <Text style={styles.entryDate}>{new Date(entry.created_at).toLocaleDateString()}</Text>
                        </View>
                        <Text style={styles.entryHashLabel}>leaf hash</Text>
                        <Text style={styles.entryHash}>{shortHash(entry.leaf_hash)}</Text>
                        <Text style={styles.entryHashLabel}>prev hash</Text>
                        <Text style={styles.entryHash}>{shortHash(entry.prev_hash)}</Text>
                      </View>
                    </GlassCard>
                  ))}
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
  sectionLabel: { fontFamily: fonts.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: colors.slate, marginTop: 4 },
  error: { fontFamily: fonts.mono, fontSize: 13, color: colors.alert },
  empty: { fontFamily: fonts.sans, fontSize: 13, color: colors.slate },
  integrityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  integrityOk: { backgroundColor: "rgba(240,250,246,0.9)", borderColor: colors.verified },
  integrityBad: { backgroundColor: "rgba(254,242,240,0.9)", borderColor: colors.alert },
  integrityTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
  integritySub: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate, marginTop: 2 },
  entryCard: { padding: 16, gap: 2 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  entryIndex: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink },
  entryDate: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate },
  entryHashLabel: { fontFamily: fonts.mono, fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: colors.slate, marginTop: 4 },
  entryHash: { fontFamily: fonts.mono, fontSize: 12, color: colors.ink },
});
