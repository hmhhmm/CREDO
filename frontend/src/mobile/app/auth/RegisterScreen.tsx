import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../lib/api";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";

export default function RegisterScreen({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const { register } = useAuth();
  const [role, setRole] = useState<"candidate" | "employer">("candidate");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      await register({ name, email, password, role });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not reach the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container}>
        <Text style={styles.wordmark}>CREDO</Text>
        <Text style={styles.heading}>Create an account</Text>

        <GlassCard radius={22}>
          <View style={styles.form}>
            <View style={styles.roleRow}>
              {(["candidate", "employer"] as const).map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setRole(r)}
                  style={[styles.roleChip, role === r && styles.roleChipActive]}
                >
                  <Text style={[styles.roleChipText, role === r && styles.roleChipTextActive]}>
                    {r === "candidate" ? "Candidate" : "Employer"}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput style={styles.input} placeholder="Name" placeholderTextColor={colors.slate} value={name} onChangeText={setName} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.slate}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Password (min. 8 characters)"
              placeholderTextColor={colors.slate}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <Pressable style={styles.button} onPress={submit} disabled={loading}>
              {loading ? <ActivityIndicator color={colors.parchment} /> : <Text style={styles.buttonText}>Register</Text>}
            </Pressable>
          </View>
        </GlassCard>

        <Pressable onPress={onSwitchToLogin}>
          <Text style={styles.link}>Already have an account? Log in</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  wordmark: { fontFamily: fonts.displayBold, fontSize: 32, color: colors.ink, textAlign: "center", letterSpacing: 3 },
  heading: { fontFamily: fonts.display, fontSize: 17, color: colors.slate, textAlign: "center", marginTop: 6, marginBottom: 20 },
  form: { padding: 20, gap: 12 },
  roleRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  roleChip: { flex: 1, borderWidth: 1, borderColor: "rgba(16,25,43,0.1)", borderRadius: 14, padding: 11, alignItems: "center", backgroundColor: "rgba(255,255,255,0.7)" },
  roleChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  roleChipText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink },
  roleChipTextActive: { color: colors.parchment },
  input: {
    borderWidth: 1,
    borderColor: "rgba(16,25,43,0.1)",
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.7)",
    padding: 15,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink,
  },
  error: { fontFamily: fonts.mono, fontSize: 12, color: colors.alert },
  button: { backgroundColor: colors.ink, borderRadius: 14, padding: 15, alignItems: "center", marginTop: 4 },
  buttonText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.parchment },
  link: { fontFamily: fonts.sans, fontSize: 13, color: colors.slate, textAlign: "center", marginTop: 22 },
});
