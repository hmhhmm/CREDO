import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CohortsScreen from "../app/university/CohortsScreen";
import CohortDetailScreen from "../app/university/CohortDetailScreen";
import { candidateHeaderOptions } from "./headerOptions";
import type { University } from "../data/universityData";

export type CohortsStackParamList = {
  CohortsMain: undefined;
  CohortDetail: { programme: string };
};

const Stack = createNativeStackNavigator<CohortsStackParamList>();

export default function CohortsStack({ university }: { university: University }) {
  return (
    <Stack.Navigator screenOptions={candidateHeaderOptions}>
      <Stack.Screen name="CohortsMain" options={{ headerShown: false }}>
        {(props) => <CohortsScreen {...props} university={university} />}
      </Stack.Screen>
      <Stack.Screen name="CohortDetail" options={{ title: "Cohort" }}>
        {(props) => <CohortDetailScreen {...props} university={university} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
