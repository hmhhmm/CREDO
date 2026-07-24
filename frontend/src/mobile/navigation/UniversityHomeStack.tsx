// Mirrors HomeStack/EmployerHomeStack: the Pulse tab now nests its own stack so it can
// push a Settings screen (see UniversityTabs) instead of firing onSwitchRole directly
// from the header avatar.
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PulseScreen from "../app/university/PulseScreen";
import UniversitySettingsScreen from "../app/university/SettingsScreen";
import { candidateHeaderOptions } from "./headerOptions";
import type { University } from "../data/universityData";

export type UniversityHomeStackParamList = {
  PulseMain: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<UniversityHomeStackParamList>();

export default function UniversityHomeStack({
  university,
  onSwitchRole,
}: {
  university: University;
  onSwitchRole: () => void;
}) {
  return (
    <Stack.Navigator screenOptions={candidateHeaderOptions}>
      <Stack.Screen name="PulseMain" options={{ headerShown: false }}>
        {({ navigation }) => (
          <PulseScreen university={university} onOpenSettings={() => navigation.navigate("Settings")} />
        )}
      </Stack.Screen>
      <Stack.Screen name="Settings" options={{ title: "Settings" }}>
        {() => <UniversitySettingsScreen university={university} onSwitchRole={onSwitchRole} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
