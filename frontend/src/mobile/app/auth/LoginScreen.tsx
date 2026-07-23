import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../lib/api";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import ScreenBackground from "../../components/shared/ScreenBackground";
import GlassCard from "../../components/shared/GlassCard";

export default function LoginScreen({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
    } catch (e) {
      setError(e instanceof ApiError ? "Invalid email or password." : "Could not reach the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground />
      <SafeAreaView style={styles.container}>
        <Text style={styles.wordmark}>CREDO</Text>
        <Text style={styles.heading}>Log in</Text>

        <GlassCard radius={22}>
          <View style={styles.form}>
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
              placeholder="Password"
              placeholderTextColor={colors.slate}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <Pressable style={styles.button} onPress={submit} disabled={loading}>
              {loading ? <ActivityIndicator color={colors.parchment} /> : <Text style={styles.buttonText}>Log in</Text>}
            </Pressable>
          </View>
        </GlassCard>

        <Pressable onPress={onSwitchToRegister}>
          <Text style={styles.link}>{"Don't have an account? Register"}</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  wordmark: { fontFamily: fonts.displayBold, fontSize: 32, color: colors.ink, textAlign: "center", letterSpacing: 3 },
  heading: { fontFamily: fonts.display, fontSize: 17, color: colors.slate, textAlign: "center", marginTop: 6, marginBottom: 28 },
  form: { padding: 20, gap: 12 },
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
