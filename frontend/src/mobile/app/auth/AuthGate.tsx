import { useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../../context/AuthContext";
import LoginScreen from "./LoginScreen";
import RegisterScreen from "./RegisterScreen";
import { colors } from "../../theme/colors";

// role tells login() which mock roster to resolve the typed email against (candidate vs.
// employer) — it's data plumbing, not a UI change: LoginScreen's fields/layout/copy are
// unchanged, this is invisible to what's rendered.
export default function AuthGate({ role, children }: { role: "candidate" | "employer"; children: React.ReactNode }) {
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
      <LoginScreen role={role} onSwitchToRegister={() => setMode("register")} />
    ) : (
      <RegisterScreen onSwitchToLogin={() => setMode("login")} />
    );
  }

  return <>{children}</>;
}
