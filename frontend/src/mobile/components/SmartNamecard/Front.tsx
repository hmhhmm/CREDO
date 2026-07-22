import { View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Award, FileText, Check, Plus } from "lucide-react-native";
import GitHubIcon from "../GitHubIcon";
import { namecardFonts } from "../../theme/typography";
import type { Candidate } from "../../data/types";
import { C_GOLD, C_GOLD_RING, C_PRIMARY, C_BODY, C_FOOTER, C_DIVIDER, MONO } from "./tokens";

function AgentDot({
  active,
  Icon,
}: {
  active: boolean;
  Icon: typeof Award;
}) {
  return (
    <View
      style={[
        styles.agentDot,
        {
          backgroundColor: active ? "rgba(201,166,70,0.10)" : "rgba(255,255,255,0.04)",
          borderColor: active ? C_GOLD_RING : C_DIVIDER,
        },
      ]}
    >
      <Icon size={9} color={active ? C_GOLD : C_BODY} strokeWidth={2} />
    </View>
  );
}

export default function Front({ candidate, onEmptyCta }: { candidate: Candidate; onEmptyCta?: () => void }) {
  const arts = candidate.artifacts || [];
  const hasGH = arts.some((a) => a.type === "github" && a.status === "verified");
  const hasCR = arts.some((a) => a.type === "credential" && a.status === "verified");
  const hasDOC = arts.some((a) => a.type === "document" && a.status === "verified");
  const anyVerif = hasGH || hasCR || hasDOC;

  const initials = candidate.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const badges = [
    { v: hasGH, l: "GitHub" },
    { v: hasCR, l: "Credential" },
    { v: hasDOC, l: "Document" },
  ].filter((x) => x.v);

  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={["#161A1F", "#14181C"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Specular sheen — identity-glass highlight sweeping from the top-left corner */}
      <LinearGradient
        colors={["rgba(201,166,70,0.12)", "transparent", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {/* Gold accent stripe */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundColor: C_GOLD, opacity: 0.65 }} />

      {/* Decorative concentric rings */}
      <View pointerEvents="none" style={[styles.ring, { top: -115, right: -115, width: 230, height: 230, borderColor: "rgba(201,166,70,0.18)" }]} />
      <View pointerEvents="none" style={[styles.ring, { top: -78, right: -78, width: 156, height: 156, borderColor: "rgba(201,166,70,0.10)" }]} />

      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {/* Top row */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingTop: 16 }}>
          <View>
            <Text style={{ fontSize: 17, fontFamily: namecardFonts.serif, fontWeight: "600", letterSpacing: 3, color: C_GOLD }}>
              CREDO
            </Text>
            <Text style={{ fontSize: 8, fontFamily: MONO, letterSpacing: 2, textTransform: "uppercase", color: C_BODY, marginTop: 5 }}>
              Verified career identity
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 5 }}>
            <AgentDot active={hasGH} Icon={GitHubIcon as unknown as typeof Award} />
            <AgentDot active={hasCR} Icon={Award} />
            <AgentDot active={hasDOC} Icon={FileText} />
          </View>
        </View>

        {/* Main content */}
        <View style={{ flex: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
          <View style={{ paddingBottom: 16 }}>
            <View style={styles.monogram}>
              <Text style={{ fontSize: 11, fontFamily: namecardFonts.serif, fontWeight: "500", color: C_GOLD, letterSpacing: 0.6 }}>
                {initials}
              </Text>
            </View>
            <Text style={{ fontSize: 18, fontFamily: namecardFonts.serif, fontWeight: "600", letterSpacing: 0.4, lineHeight: 22, color: C_PRIMARY, marginBottom: 4 }}>
              {candidate.name}
            </Text>
            <Text style={{ fontSize: 10, lineHeight: 16, color: C_BODY, fontFamily: MONO }}>{candidate.field}</Text>
            <Text style={{ fontSize: 10, lineHeight: 16, color: C_BODY, fontFamily: MONO }}>{candidate.university}</Text>
            {candidate.openToWork && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 }}>
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: C_GOLD }} />
                <Text style={{ fontSize: 8, fontFamily: MONO, textTransform: "uppercase", letterSpacing: 2, color: C_GOLD }}>
                  Open to Work
                </Text>
              </View>
            )}
          </View>

          <View style={{ alignItems: "flex-end", paddingBottom: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 2 }}>
              <Text style={{ fontSize: 38, fontFamily: namecardFonts.serif, fontWeight: "600", color: C_GOLD, lineHeight: 40 }}>
                {candidate.trustScore}
              </Text>
              <Text style={{ fontSize: 8, fontFamily: MONO, paddingBottom: 4, color: C_FOOTER }}>/100</Text>
            </View>
          </View>
        </View>

        {/* Bottom strip */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C_DIVIDER }}>
          <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", flex: 1 }}>
            {anyVerif ? (
              badges.map(({ l }) => (
                <View key={l} style={styles.badge}>
                  <Check size={6} color={C_GOLD} strokeWidth={2.5} />
                  <Text style={{ fontSize: 8, fontFamily: MONO, textTransform: "uppercase", letterSpacing: 1, color: C_GOLD, marginLeft: 3 }}>
                    {l}
                  </Text>
                </View>
              ))
            ) : onEmptyCta ? (
              <Pressable onPress={onEmptyCta} style={{ flexDirection: "row", alignItems: "center", gap: 4 }} hitSlop={8}>
                <Plus size={9} color={C_GOLD} strokeWidth={2.5} />
                <Text style={{ fontSize: 8, fontFamily: MONO, textTransform: "uppercase", letterSpacing: 1, color: C_GOLD }}>
                  Add your first verified skill
                </Text>
              </Pressable>
            ) : (
              <Text style={{ fontSize: 8, fontFamily: MONO, color: C_FOOTER }}>No verified artifacts</Text>
            )}
          </View>
          <Text style={{ fontSize: 8, fontFamily: MONO, letterSpacing: 1, color: C_FOOTER }}>credo.app</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  agentDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  ring: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  monogram: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C_GOLD,
    backgroundColor: "rgba(201,166,70,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C_GOLD_RING,
    borderRadius: 100,
    paddingVertical: 1,
    paddingHorizontal: 7,
  },
});
