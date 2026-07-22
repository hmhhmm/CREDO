import { useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../../context/AuthContext";
import LoginScreen from "./LoginScreen";
import RegisterScreen from "./RegisterScreen";
import { colors } from "../../theme/colors";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.parchment, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  if (!user) {
    return mode === "login" ? (
      <LoginScreen onSwitchToRegister={() => setMode("register")} />
    ) : (
      <RegisterScreen onSwitchToLogin={() => setMode("login")} />
    );
  }

  return <>{children}</>;
}
