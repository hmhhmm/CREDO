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
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RoleSelect">
        {({ navigation }) => (
          <RoleSelectScreen
            onSelect={(role: AppRole) => {
              const screen =
                role === "candidate" ? "CandidateTabs" : role === "employer" ? "EmployerTabs" : "UniversityTabs";
              navigation.navigate(screen);
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="CandidateTabs">
        {({ navigation }) => <AuthedTabs role="candidate" onSwitchRole={() => navigation.navigate("RoleSelect")} />}
      </Stack.Screen>
      <Stack.Screen name="EmployerTabs">
        {({ navigation }) => <AuthedTabs role="employer" onSwitchRole={() => navigation.navigate("RoleSelect")} />}
      </Stack.Screen>
      <Stack.Screen name="UniversityTabs" component={UniversityTabs} />
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
