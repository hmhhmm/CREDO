// Distribution — get the verified card *out* into the world.
//
// A vanity handle, wallet pass / NFC / print entry points, a social export, and a
// ready-to-paste email signature. Copy actions use the clipboard; the physical exports
// are demo stubs that confirm inline (no capture/hardware wired up yet).
import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import * as Clipboard from "expo-clipboard";
import { AtSign, Check, Wallet, Nfc, Printer, ImageDown, Mail } from "lucide-react-native";
import GlassCard from "../shared/GlassCard";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

interface Props {
  handle: string;
  name: string;
  tagline: string; // e.g. field / headline
}

export default function CardDistribution({ handle, name, tagline }: Props) {
  const [done, setDone] = useState<string | null>(null);

  const vanityUrl = `credo.id/@${handle}`;
  const signature = `${name} — verified on CREDO\n${tagline}\n${vanityUrl}`;

  const flash = (key: string) => {
    setDone(key);
    setTimeout(() => setDone((d) => (d === key ? null : d)), 2000);
  };

  const copy = async (key: string, text: string) => {
    await Clipboard.setStringAsync(text);
    flash(key);
  };

  const tiles = [
    { key: "wallet", label: "Add to Wallet", Icon: Wallet, onPress: () => flash("wallet"), doneLabel: "Added" },
    { key: "image", label: "Save as image", Icon: ImageDown, onPress: () => flash("image"), doneLabel: "Saved" },
    { key: "nfc", label: "Tap to share", Icon: Nfc, onPress: () => flash("nfc"), doneLabel: "Ready" },
    { key: "print", label: "Print card", Icon: Printer, onPress: () => flash("print"), doneLabel: "Queued" },
  ];

  return (
    <GlassCard radius={18}>
      <View style={styles.wrap}>
        {/* Vanity handle */}
        <Pressable style={styles.vanityRow} onPress={() => copy("vanity", vanityUrl)}>
          <View style={styles.vanityIcon}>
            <AtSign size={15} color={colors.gold} strokeWidth={2.4} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.vanityLabel}>Your card link</Text>
            <Text style={styles.vanityUrl}>{vanityUrl}</Text>
          </View>
          {done === "vanity" ? <Check size={16} color={colors.verified} /> : <Text style={styles.copyHint}>Copy</Text>}
        </Pressable>

        {/* Physical / export tiles */}
        <View style={styles.grid}>
          {tiles.map(({ key, label, Icon, onPress, doneLabel }) => {
            const isDone = done === key;
            return (
              <Pressable key={key} style={styles.tile} onPress={onPress}>
                {isDone ? <Check size={18} color={colors.verified} /> : <Icon size={18} color={colors.ink} />}
                <Text style={[styles.tileLabel, isDone && { color: colors.verified }]}>{isDone ? doneLabel : label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Email signature */}
        <View style={styles.sigBlock}>
          <View style={styles.sigHead}>
            <Mail size={13} color={colors.slate} />
            <Text style={styles.sigTitle}>Email signature</Text>
          </View>
          <Text style={styles.sigPreview}>{signature}</Text>
          <Pressable style={styles.sigBtn} onPress={() => copy("sig", signature)}>
            {done === "sig" ? <Check size={14} color={colors.verified} /> : <Mail size={14} color={colors.parchment} />}
            <Text style={[styles.sigBtnText, done === "sig" && { color: colors.verified }]}>
              {done === "sig" ? "Copied" : "Copy signature"}
            </Text>
          </Pressable>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 18, gap: 14 },
  vanityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(201,166,70,0.07)",
    borderWidth: 1,
    borderColor: "rgba(201,166,70,0.22)",
  },
  vanityIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "rgba(201,166,70,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  vanityLabel: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: colors.slate },
  vanityUrl: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: colors.ink, marginTop: 1 },
  copyHint: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.slate },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: {
    width: "47%",
    flexGrow: 1,
    alignItems: "center",
    gap: 7,
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: "rgba(16,25,43,0.03)",
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.08)",
  },
  tileLabel: { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.ink },
  sigBlock: {
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(16,25,43,0.03)",
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.08)",
  },
  sigHead: { flexDirection: "row", alignItems: "center", gap: 7 },
  sigTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink },
  sigPreview: { fontFamily: fonts.mono, fontSize: 11.5, color: colors.slate, lineHeight: 17 },
  sigBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.ink,
  },
  sigBtnText: { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.parchment },
});
