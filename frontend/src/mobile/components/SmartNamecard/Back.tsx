import { View, Text, StyleSheet, Pressable, Linking } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Check, ExternalLink } from "lucide-react-native";
import type { Candidate } from "../../data/types";
import { C_GOLD, C_GOLD_RING, C_PRIMARY, C_BODY, C_FOOTER, C_DIVIDER, MONO } from "./tokens";

export default function Back({ candidate }: { candidate: Candidate }) {
  const topSkills = (candidate.verifiedSkills || []).slice(0, 3);
  const simu = candidate.simuHire;
  const verCount = (candidate.artifacts || []).filter((a) => a.status === "verified").length;
  const hasMerkle = !!candidate.merkleRoot;

  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={["#161A1F", "#14181C"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Specular sheen — identity-glass highlight, mirrored to match the back face */}
      <LinearGradient
        colors={["rgba(201,166,70,0.12)", "transparent", "transparent"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundColor: C_GOLD, opacity: 0.65 }} />

      <View pointerEvents="none" style={[styles.ring, { top: -115, left: -115, width: 230, height: 230, borderColor: "rgba(201,166,70,0.18)" }]} />
      <View pointerEvents="none" style={[styles.ring, { top: -78, left: -78, width: 156, height: 156, borderColor: "rgba(201,166,70,0.10)" }]} />

      <View style={{ flex: 1, paddingHorizontal: 20, paddingVertical: 16 }}>
        <Text style={{ fontSize: 8, fontFamily: MONO, textTransform: "uppercase", letterSpacing: 2, color: C_FOOTER, marginBottom: 10 }}>
          Verified Evidence
        </Text>

        {topSkills.length > 0 ? (
          <View style={{ gap: 7 }}>
            {topSkills.map((s) => (
              <View key={s.name}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontSize: 10, fontFamily: MONO, color: C_PRIMARY }}>{s.name}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                    <Text style={{ fontSize: 10, fontFamily: MONO, fontWeight: "500", color: C_GOLD }}>{s.confidence}</Text>
                    <Check size={8} color={C_GOLD} strokeWidth={2.5} />
                  </View>
                </View>
                <View style={{ height: 2, backgroundColor: C_DIVIDER, borderRadius: 1, marginTop: 3 }}>
                  <View style={{ height: "100%", width: `${s.confidence}%`, backgroundColor: C_GOLD, opacity: 0.25, borderRadius: 1 }} />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={{ fontSize: 10, fontFamily: MONO, color: C_BODY }}>No verified skills yet</Text>
        )}

        <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C_DIVIDER, marginVertical: 7 }} />

        {simu?.completed && simu?.shared ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <View style={[styles.pill, { borderColor: C_GOLD_RING }]}>
              <Text style={{ fontSize: 8, fontFamily: MONO, textTransform: "uppercase", letterSpacing: 1.5, color: C_GOLD }}>
                SimuHire
              </Text>
            </View>
            <Text style={{ fontSize: 10, fontFamily: MONO, color: C_PRIMARY }}>
              {simu.type} <Text style={{ color: C_FOOTER }}>·</Text> <Text style={{ color: C_GOLD }}>{simu.overallScore}/100</Text>
            </Text>
          </View>
        ) : (
          <Text style={{ fontSize: 8, fontFamily: MONO, color: C_FOOTER, marginBottom: 6, opacity: 0.7 }}>
            SimuHire not completed
          </Text>
        )}

        {verCount > 0 && (
          <View style={{ flexDirection: "row", gap: 5, marginBottom: "auto" }}>
            <View style={[styles.pill, { borderColor: C_BODY, flexDirection: "row", alignItems: "center", gap: 3 }]}>
              <Check size={6} color={C_BODY} strokeWidth={2.5} />
              <Text style={{ fontSize: 8, fontFamily: MONO, textTransform: "uppercase", letterSpacing: 1, color: C_BODY }}>
                {verCount} artifact{verCount !== 1 ? "s" : ""} verified
              </Text>
            </View>
            {hasMerkle && (
              <View style={[styles.pill, { borderColor: C_BODY }]}>
                <Text style={{ fontSize: 8, fontFamily: MONO, textTransform: "uppercase", letterSpacing: 1, color: C_BODY }}>
                  🔒 Merkle intact
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={{ flex: 1 }} />

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C_DIVIDER }}>
          <Pressable
            onPress={() => Linking.openURL(`https://credo.app/portfolio/${candidate.id}`)}
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <Text style={{ fontSize: 10, fontFamily: MONO, color: C_PRIMARY }}>View Portfolio</Text>
            <ExternalLink size={8} color={C_PRIMARY} />
          </Pressable>
          <Text style={{ fontSize: 8, fontFamily: MONO, letterSpacing: 1, color: C_FOOTER }}>credo.app</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pill: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 100,
    paddingVertical: 1,
    paddingHorizontal: 6,
  },
});
