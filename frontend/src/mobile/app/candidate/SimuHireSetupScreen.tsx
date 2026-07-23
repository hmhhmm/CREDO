import { useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AlertTriangle, Play } from "lucide-react-native";
import { simuhireApi, ApiError, type SimulationType } from "../../lib/api";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { SimuHireStackParamList } from "../../navigation/SimuHireStack";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";
import { SCENARIO_BRIEFS } from "../../data/simuhireBriefs";

const TYPES: { key: SimulationType; label: string; description: string }[] = [
  { key: "technical", label: "Technical", description: "A junior engineer scenario under production pressure" },
  { key: "business", label: "Business", description: "A stakeholder-management scenario with shifting requirements" },
  { key: "general", label: "General", description: "A cross-functional scenario testing adaptability" },
];

const DIMENSIONS = ["Adaptability", "Communication", "Problem-Solving", "Stress Response", "Systems Thinking"];

type Props = NativeStackScreenProps<SimuHireStackParamList, "SimuHireSetup">;

export default function SimuHireSetupScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<SimulationType>("technical");
  const [consent, setConsent] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const brief = SCENARIO_BRIEFS[selected];

  const start = async (autoPlay: boolean) => {
    setError(null);
    setStarting(true);
    try {
      await simuhireApi.consent();
      const session = await simuhireApi.createSession(selected);
      navigation.navigate("SimuHireChat", { session, brief: SCENARIO_BRIEFS[selected], autoPlay });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not reach the server.");
    } finally {
      setStarting(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 110 }}>
          <Text style={styles.kicker}>{selected.toUpperCase()} SIMULATION · 4 STAGES · ~30 MIN</Text>
          <Text style={styles.intro}>
            {"A 20–30 minute multi-agent AI interview simulation. You'll see your own behavioral report first, and choose whether to share it with employers."}
          </Text>

          {TYPES.map(({ key, label, description }) => (
            <Pressable key={key} onPress={() => setSelected(key)} disabled={starting}>
              <GlassCard radius={18}>
                <View style={[styles.card, selected === key && styles.cardSelected]}>
                  <View style={[styles.radio, selected === key && styles.radioSelected]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{label}</Text>
                    <Text style={styles.cardSubtitle}>{description}</Text>
                  </View>
                </View>
              </GlassCard>
            </Pressable>
          ))}

          <GlassCard radius={18}>
            <View style={{ padding: 18, gap: 14 }}>
              <View>
                <Text style={styles.sectionLabel}>YOUR SCENARIO</Text>
                <Text style={styles.situation}>{brief.situation}</Text>
              </View>
              <View>
                <Text style={styles.sectionLabel}>YOU HAVE ACCESS TO</Text>
                {brief.access.map((a) => (
                  <View key={a} style={styles.bulletRow}>
                    <View style={styles.dot} />
                    <Text style={styles.bulletText}>{a}</Text>
                  </View>
                ))}
              </View>
              <View>
                <Text style={styles.sectionLabel}>CONSTRAINTS</Text>
                {brief.constraints.map((c) => (
                  <View key={c} style={styles.bulletRow}>
                    <AlertTriangle size={11} color={colors.pending} />
                    <Text style={styles.bulletMuted}>{c}</Text>
                  </View>
                ))}
              </View>
              <View>
                <Text style={styles.sectionLabel}>{"HOW YOU'LL BE EVALUATED"}</Text>
                <View style={styles.dimGrid}>
                  {DIMENSIONS.map((d) => (
                    <View key={d} style={styles.bulletRow}>
                      <View style={[styles.dot, { backgroundColor: colors.slate }]} />
                      <Text style={styles.bulletMuted}>{d}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.evalNote}>
                  The Evaluator agent scores your full transcript at the end — not per message. Think out loud. Reasoning matters more than conclusions.
                </Text>
              </View>
            </View>
          </GlassCard>

          <Text style={styles.cameraNote}>
            Camera access will be requested when the simulation begins. Video is used for integrity monitoring only.
          </Text>

          <Pressable style={styles.consentRow} onPress={() => setConsent(!consent)}>
            <View style={[styles.checkbox, consent && styles.checkboxChecked]}>
              {consent && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.consentText}>
              I consent to CREDO processing my simulation responses to generate a Behavioral Traits Report. My transcript is visible only to me unless I choose to share.
            </Text>
          </Pressable>

          <Pressable
            style={[styles.beginButton, (!consent || starting) && { opacity: 0.4 }]}
            onPress={() => start(false)}
            disabled={!consent || starting}
          >
            {starting ? (
              <ActivityIndicator color={colors.parchment} size="small" />
            ) : (
              <Text style={styles.beginText}>Begin Simulation →</Text>
            )}
          </Pressable>

          <Pressable style={styles.sampleButton} onPress={() => start(true)} disabled={starting}>
            <Play size={12} color={colors.slate} />
            <Text style={styles.sampleText}>Watch sample run (demo — no input needed)</Text>
          </Pressable>

          {error && <Text style={styles.error}>{error}</Text>}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  kicker: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.5, color: colors.slate },
  intro: { fontFamily: fonts.sans, fontSize: 13, color: colors.slate, lineHeight: 19 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 18, borderRadius: 18 },
  cardSelected: { borderWidth: 1.5, borderColor: colors.ink },
  radio: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: colors.slate },
  radioSelected: { borderColor: colors.ink, backgroundColor: colors.ink },
  cardTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink },
  cardSubtitle: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, marginTop: 2 },
  sectionLabel: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.5, color: colors.slate, marginBottom: 6 },
  situation: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink, lineHeight: 19 },
  bulletRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.ink },
  bulletText: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink, flex: 1 },
  bulletMuted: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, flex: 1 },
  dimGrid: { flexDirection: "row", flexWrap: "wrap", columnGap: 16 },
  evalNote: { fontFamily: fonts.sans, fontSize: 11, color: colors.slate, lineHeight: 16, marginTop: 8 },
  cameraNote: { fontFamily: fonts.sans, fontSize: 11, color: colors.slate, lineHeight: 16 },
  consentRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.slate,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: colors.ink, borderColor: colors.ink },
  checkmark: { color: colors.parchment, fontSize: 11, lineHeight: 13 },
  consentText: { fontFamily: fonts.sans, fontSize: 11, color: colors.slate, lineHeight: 16, flex: 1 },
  beginButton: {
    backgroundColor: colors.ink,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  beginText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.parchment },
  sampleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.15)",
    borderRadius: 12,
    paddingVertical: 11,
  },
  sampleText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.slate },
  error: { fontFamily: fonts.mono, fontSize: 13, color: colors.alert },
});
