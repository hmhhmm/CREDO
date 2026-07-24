import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PartnersScreen from "../app/university/PartnersScreen";
import CandidateProfileScreen from "../app/employer/CandidateProfileScreen";
import { candidateHeaderOptions } from "./headerOptions";
import type { University } from "../data/universityData";
import type { DiscoverCandidate } from "../data/employerData";

export type PartnersStackParamList = {
  PartnersMain: undefined;
  CandidateProfile: { candidate: DiscoverCandidate };
};

const Stack = createNativeStackNavigator<PartnersStackParamList>();

export default function PartnersStack({ university }: { university: University }) {
  return (
    <Stack.Navigator screenOptions={candidateHeaderOptions}>
      <Stack.Screen name="PartnersMain" options={{ headerShown: false }}>
        {(props) => <PartnersScreen {...props} university={university} />}
      </Stack.Screen>
      <Stack.Screen name="CandidateProfile" component={CandidateProfileScreen} options={{ title: "Profile" }} />
    </Stack.Navigator>
  );
}
