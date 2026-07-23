import { useLocation, useNavigate as useRouterNavigate } from "react-router-dom";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DemoProvider } from "../context/DemoContext";
import { PipelineProvider } from "../context/PipelineContext";
import { AuthProvider } from "../context/AuthContext";
import AuthGate from "../app/auth/AuthGate";
import RoleSelectScreen from "../app/auth/RoleSelectScreen";
import CandidateTabs from "./CandidateTabs";
import EmployerTabs from "./EmployerTabs";
import UniversityTabs from "./UniversityTabs";

export type AppRole = "candidate" | "employer" | "university";

const Stack = createNativeStackNavigator();

// Maps the top-level role stack's screen names to the URL segment under /app that should
// represent them, so a hard load/refresh of /app/candidate lands on the right screen and
// picking a role in-app pushes a real, shareable URL instead of only updating in-memory
// navigator state.
const SCREEN_TO_PATH: Record<string, string> = {
  RoleSelect: "/app",
  CandidateTabs: "/app/candidate",
  EmployerTabs: "/app/employer",
  UniversityTabs: "/app/university",
};
const PATH_TO_SCREEN: Record<string, string> = {
  candidate: "CandidateTabs",
  employer: "EmployerTabs",
  university: "UniversityTabs",
};

// Candidate/Employer require a real logged-in account (backend only supports these two
// roles). University has no backend role — it stays a no-auth demo entry point, matching
// the original brief ("reachable with no auth from Landing's University demo link").
// Each role's own tab navigator supplies its own in-content "switch role" affordance
// (see HomeScreen's profile button) instead of a system stack header — a native header
// here would double up with each tab's own screen chrome and show the previous route's
// name as an ugly, undesigned back label.
function AuthedTabs({ role, onSwitchRole }: { role: "candidate" | "employer"; onSwitchRole: () => void }) {
  return (
    <AuthGate>
      {role === "candidate" ? <CandidateTabs onSwitchRole={onSwitchRole} /> : <EmployerTabs onSwitchRole={onSwitchRole} />}
    </AuthGate>
  );
}

function RoleStackNavigator() {
  const location = useLocation();
  const routerNavigate = useRouterNavigate();

  // /app -> RoleSelect, /app/candidate -> CandidateTabs, etc. Anything unrecognized
  // (including a bare /app) falls back to RoleSelect.
  const segment = location.pathname.replace(/^\/app\/?/, "").split("/")[0];
  const initialRouteName = PATH_TO_SCREEN[segment] ?? "RoleSelect";

  // Wraps the shim's in-memory navigate() so every top-level role transition also pushes
  // the matching /app/* URL — direct loads, refreshes, and shared links all resolve to
  // the right screen via initialRouteName above.
  const goTo = (navigate: (name: string) => void, screen: string) => {
    navigate(screen);
    const path = SCREEN_TO_PATH[screen];
    if (path && path !== location.pathname) routerNavigate(path);
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRouteName}>
      <Stack.Screen name="RoleSelect">
        {({ navigation }) => (
          <RoleSelectScreen
            onSelect={(role: AppRole) => {
              const screen =
                role === "candidate" ? "CandidateTabs" : role === "employer" ? "EmployerTabs" : "UniversityTabs";
              goTo(navigation.navigate, screen);
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="CandidateTabs">
        {({ navigation }) => (
          <AuthedTabs role="candidate" onSwitchRole={() => goTo(navigation.navigate, "RoleSelect")} />
        )}
      </Stack.Screen>
      <Stack.Screen name="EmployerTabs">
        {({ navigation }) => (
          <AuthedTabs role="employer" onSwitchRole={() => goTo(navigation.navigate, "RoleSelect")} />
        )}
      </Stack.Screen>
      <Stack.Screen name="UniversityTabs">
        {({ navigation }) => (
          <UniversityTabs onSwitchRole={() => goTo(navigation.navigate, "RoleSelect")} />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <DemoProvider>
            <PipelineProvider>
              <NavigationContainer>
                <RoleStackNavigator />
              </NavigationContainer>
            </PipelineProvider>
          </DemoProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
