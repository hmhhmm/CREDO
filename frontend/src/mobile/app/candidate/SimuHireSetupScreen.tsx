import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { simuhireApi, ApiError, type SimulationType } from "../../lib/api";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import type { SimuHireStackParamList } from "../../navigation/SimuHireStack";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";

const TYPES: { key: SimulationType; label: string; description: string }[] = [
  { key: "technical", label: "Technical", description: "A junior engineer scenario under production pressure" },
  { key: "business", label: "Business", description: "A stakeholder-management scenario with shifting requirements" },
  { key: "general", label: "General", description: "A cross-functional scenario testing adaptability" },
];

type Props = NativeStackScreenProps<SimuHireStackParamList, "SimuHireSetup">;

export default function SimuHireSetupScreen({ navigation }: Props) {
  const [starting, setStarting] = useState<SimulationType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = async (type: SimulationType) => {
    setError(null);
    setStarting(type);
    try {
      await simuhireApi.consent();
      const session = await simuhireApi.createSession(type);
      navigation.navigate("SimuHireChat", { session });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not reach the server.");
    } finally {
      setStarting(null);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={{ padding: 20, gap: 14, paddingBottom: 110 }}>
          <Text style={styles.intro}>
            {"A 20–30 minute multi-agent AI interview simulation. You'll see your own behavioral report first, and choose whether to share it with employers."}
          </Text>
          {TYPES.map(({ key, label, description }) => (
            <Pressable key={key} onPress={() => start(key)} disabled={starting !== null}>
              <GlassCard radius={18}>
                <View style={styles.card}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{label}</Text>
                    <Text style={styles.cardSubtitle}>{description}</Text>
                  </View>
                  {starting === key && <ActivityIndicator color={colors.ink} />}
                </View>
              </GlassCard>
            </Pressable>
          ))}
          {error && <Text style={styles.error}>{error}</Text>}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  intro: { fontFamily: fonts.sans, fontSize: 13, color: colors.slate, lineHeight: 19 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 18,
  },
  cardTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink },
  cardSubtitle: { fontFamily: fonts.sans, fontSize: 12, color: colors.slate, marginTop: 2 },
  error: { fontFamily: fonts.mono, fontSize: 13, color: colors.alert },
});
