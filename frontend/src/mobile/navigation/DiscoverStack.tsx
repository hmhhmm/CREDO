import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DiscoverScreen from "../app/employer/DiscoverScreen";
import CandidateProfileScreen from "../app/employer/CandidateProfileScreen";
import { candidateHeaderOptions } from "./headerOptions";
import type { DiscoverCandidate } from "../data/employerData";

export type DiscoverStackParamList = {
  DiscoverMain: { filterSkills?: string[] } | undefined;
  CandidateProfile: { candidate: DiscoverCandidate };
};

const Stack = createNativeStackNavigator<DiscoverStackParamList>();

export default function DiscoverStack() {
  return (
    <Stack.Navigator screenOptions={candidateHeaderOptions}>
      <Stack.Screen name="DiscoverMain" component={DiscoverScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CandidateProfile" component={CandidateProfileScreen} options={{ title: "Profile" }} />
    </Stack.Navigator>
  );
}
