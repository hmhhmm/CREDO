import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PipelineScreen from "../app/employer/PipelineScreen";
import SimuHireReportScreen from "../app/employer/SimuHireReportScreen";
import CandidateProfileScreen from "../app/employer/CandidateProfileScreen";
import StageSettingsScreen from "../app/employer/StageSettingsScreen";
import { candidateHeaderOptions } from "./headerOptions";
import type { PipelineEntry } from "../data/employerData";
import type { DiscoverCandidate } from "../data/employerData";

export type PipelineStackParamList = {
  PipelineMain: undefined;
  SimuHireReport: { entry: PipelineEntry };
  CandidateProfile: { candidate: DiscoverCandidate };
  StageSettings: undefined;
};

const Stack = createNativeStackNavigator<PipelineStackParamList>();

export default function PipelineStack() {
  return (
    <Stack.Navigator screenOptions={candidateHeaderOptions}>
      <Stack.Screen name="PipelineMain" component={PipelineScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SimuHireReport" component={SimuHireReportScreen} options={{ title: "SimuHire Report" }} />
      <Stack.Screen name="CandidateProfile" component={CandidateProfileScreen} options={{ title: "Profile" }} />
      <Stack.Screen name="StageSettings" component={StageSettingsScreen} options={{ title: "Interview Rounds" }} />
    </Stack.Navigator>
  );
}
