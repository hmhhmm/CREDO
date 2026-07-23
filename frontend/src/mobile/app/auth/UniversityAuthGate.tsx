// University has no backend role and no shared AuthContext session (per the original
// brief — Candidate/Employer are the only real backend roles). It now still gets the
// same LoginScreen UI as the other two roles (unchanged fields/layout/copy), but resolves
// against the seeded university roster locally instead of going through AuthContext.
import { useState } from "react";
import { View, ActivityIndicator } from "react-native";
import LoginScreen from "./LoginScreen";
import { resolveUniversityByEmail, type University } from "../../data/universityData";
import { colors } from "../../theme/colors";

export default function UniversityAuthGate({
  children,
}: {
  children: (university: University) => React.ReactNode;
}) {
  const [university, setUniversity] = useState<University | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (email: string, _password: string) => {
    setLoading(true);
    // Dev-phase bypass — any input succeeds. A recognized seeded email resolves to that
    // specific university's own data; anything else falls back to the demo one.
    await new Promise((r) => setTimeout(r, 350));
    setUniversity(resolveUniversityByEmail(email));
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.parchment, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  if (!university) {
    return <LoginScreen role="university" onLogin={handleLogin} onSwitchToRegister={() => {}} />;
  }

  return <>{children(university)}</>;
}
