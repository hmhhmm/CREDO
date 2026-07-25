import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../app/candidate/HomeScreen";
import JobMatchesScreen from "../app/candidate/JobMatchesScreen";
import ApplicationStatusScreen from "../app/candidate/ApplicationStatusScreen";
import CandidateSettingsScreen from "../app/candidate/SettingsScreen";
import CardPrivacyScreen from "../app/candidate/CardPrivacyScreen";
import SimuHireStack from "./SimuHireStack";
import { candidateHeaderOptions } from "./headerOptions";
import type { ParentNav } from "./types";

export type HomeStackParamList = {
  HomeMain: undefined;
  JobMatches: { initialTab?: "matched" | "popular" } | undefined;
  ApplicationStatus: undefined;
  SimuHire: undefined;
  Settings: undefined;
  CardPrivacy: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack({ onSwitchRole }: { onSwitchRole: () => void }) {
  return (
    <Stack.Navigator screenOptions={candidateHeaderOptions}>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="JobMatches" component={JobMatchesScreen} options={{ title: "Jobs" }} />
      <Stack.Screen name="ApplicationStatus" component={ApplicationStatusScreen} options={{ title: "Application Status" }} />
      <Stack.Screen name="SimuHire" component={SimuHireStack} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" options={{ title: "Settings" }}>
        {({ navigation }) => (
          <CandidateSettingsScreen
            navigation={navigation as unknown as { getParent: () => ParentNav; navigate: (name: string, params?: object) => void }}
            onSwitchRole={onSwitchRole}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="CardPrivacy" component={CardPrivacyScreen} options={{ title: "Audience & Privacy" }} />
    </Stack.Navigator>
  );
}
