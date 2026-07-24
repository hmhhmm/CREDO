// Mirrors HomeStack/EmployerHomeStack: the Pulse tab now nests its own stack so it can
// push a Settings screen (see UniversityTabs) instead of firing onSwitchRole directly
// from the header avatar.
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PulseScreen from "../app/university/PulseScreen";
import CurriculumGapScreen from "../app/university/CurriculumGapScreen";
import BenchmarkScreen from "../app/university/BenchmarkScreen";
import SkillGapDetailScreen from "../app/university/SkillGapDetailScreen";
import BenchmarkDetailScreen from "../app/university/BenchmarkDetailScreen";
import UniversitySettingsScreen from "../app/university/SettingsScreen";
import { candidateHeaderOptions } from "./headerOptions";
import type { University } from "../data/universityData";

export type UniversityHomeStackParamList = {
  PulseMain: undefined;
  CurriculumGapHub: undefined;
  BenchmarkHub: undefined;
  SkillGapDetail: { skill: string };
  BenchmarkDetail: { dimension: string };
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
          <PulseScreen university={university} navigation={navigation} onOpenSettings={() => navigation.navigate("Settings")} />
        )}
      </Stack.Screen>
      <Stack.Screen name="CurriculumGapHub" options={{ title: "Curriculum Gaps" }}>
        {(props) => <CurriculumGapScreen {...props} university={university} />}
      </Stack.Screen>
      <Stack.Screen name="BenchmarkHub" options={{ title: "Behavioral Benchmark" }}>
        {(props) => <BenchmarkScreen {...props} university={university} />}
      </Stack.Screen>
      <Stack.Screen name="SkillGapDetail" options={{ title: "Skill Gap" }}>
        {(props) => <SkillGapDetailScreen {...props} university={university} />}
      </Stack.Screen>
      <Stack.Screen name="BenchmarkDetail" options={{ title: "Benchmark" }}>
        {(props) => <BenchmarkDetailScreen {...props} university={university} />}
      </Stack.Screen>
      <Stack.Screen name="Settings" options={{ title: "Settings" }}>
        {() => <UniversitySettingsScreen university={university} onSwitchRole={onSwitchRole} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
