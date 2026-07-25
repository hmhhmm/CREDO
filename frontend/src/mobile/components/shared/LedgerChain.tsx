// Redesigned ledger visual — a connected hash-chain timeline (dot + connector per block,
// same tracker language as ApplicationStatusScreen) instead of a stack of flat, unrelated
// cards. Each block visibly links to the one before it via a rendered connector, which is
// the actual point of a hash chain (each entry's prev_hash == the previous entry's leaf_hash)
// — the previous flat-card layout didn't make that relationship visible at all.
import { View, Text, Pressable, StyleSheet } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { ShieldCheck, ShieldAlert, Copy, Check } from "lucide-react-native";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { LedgerEntryResponse, LedgerIntegrityResponse } from "../../lib/api";

function shortHash(hash: string | null) {
  if (!hash) return "—";
  return `${hash.slice(0, 8)}···${hash.slice(-4)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function CopyChip({ hash }: { hash: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await Clipboard.setStringAsync(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Pressable onPress={copy} style={styles.copyChip} hitSlop={6} accessibilityRole="button">
      {copied ? <Check size={9} color={colors.verified} strokeWidth={3} /> : <Copy size={9} color={colors.slate} />}
    </Pressable>
  );
}

export function LedgerIntegrityBanner({ integrity }: { integrity: LedgerIntegrityResponse }) {
  return (
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
  );
}

export function LedgerChain({ entries }: { entries: LedgerEntryResponse[] }) {
  if (entries.length === 0) {
    return <Text style={styles.empty}>No verified artifacts recorded yet.</Text>;
  }
  return (
    <View>
      {entries.map((entry, i) => {
        const isLast = i === entries.length - 1;
        return (
          <View key={entry.id} style={styles.row}>
            <View style={styles.rail}>
              <View style={[styles.dot, isLast && styles.dotLatest]} />
              {!isLast && <View style={styles.connector} />}
            </View>
            <View style={[styles.entryCard, !isLast && styles.entryCardSpacing]}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryIndex}>Block #{entry.block_index}</Text>
                <Text style={styles.entryDate}>{formatDate(entry.created_at)}</Text>
              </View>
              <View style={styles.hashRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.entryHashLabel}>Leaf hash</Text>
                  <Text style={styles.entryHash} numberOfLines={1}>{shortHash(entry.leaf_hash)}</Text>
                </View>
                <CopyChip hash={entry.leaf_hash} />
              </View>
              {entry.prev_hash && (
                <View style={styles.hashRow}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.entryHashLabel}>Linked from</Text>
                    <Text style={styles.entryHashMuted} numberOfLines={1}>{shortHash(entry.prev_hash)}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
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

  empty: { fontFamily: fonts.sans, fontSize: 13, color: colors.slate },

  row: { flexDirection: "row", gap: 12 },
  rail: { alignItems: "center", width: 14 },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.verified,
    borderWidth: 2,
    borderColor: colors.verified,
  },
  dotLatest: { backgroundColor: colors.gold, borderColor: colors.gold },
  connector: { flex: 1, width: 2, backgroundColor: "rgba(31,122,92,0.25)", marginVertical: 2, minHeight: 24 },

  entryCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.07)",
    gap: 8,
  },
  entryCardSpacing: { marginBottom: 12 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  entryIndex: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.ink },
  entryDate: { fontFamily: fonts.mono, fontSize: 10.5, color: colors.slate },

  hashRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 8 },
  entryHashLabel: { fontFamily: fonts.mono, fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: colors.slate },
  entryHash: { fontFamily: fonts.mono, fontSize: 12, color: colors.ink, marginTop: 2 },
  entryHashMuted: { fontFamily: fonts.mono, fontSize: 11, color: colors.slate, marginTop: 2 },
  copyChip: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16,25,43,0.05)",
  },
});
