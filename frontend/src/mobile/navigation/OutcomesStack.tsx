import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OutcomesScreen from "../app/university/OutcomesScreen";
import AlumniDetailScreen from "../app/university/AlumniDetailScreen";
import { candidateHeaderOptions } from "./headerOptions";
import type { University } from "../data/universityData";

export type OutcomesStackParamList = {
  OutcomesMain: undefined;
  AlumniDetail: { window: string };
};

const Stack = createNativeStackNavigator<OutcomesStackParamList>();

export default function OutcomesStack({ university }: { university: University }) {
  return (
    <Stack.Navigator screenOptions={candidateHeaderOptions}>
      <Stack.Screen name="OutcomesMain" options={{ headerShown: false }}>
        {(props) => <OutcomesScreen {...props} university={university} />}
      </Stack.Screen>
      <Stack.Screen name="AlumniDetail" options={{ title: "Alumni Check-in" }}>
        {(props) => <AlumniDetailScreen {...props} university={university} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
