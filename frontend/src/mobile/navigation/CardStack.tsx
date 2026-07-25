import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CardScreen from "../app/candidate/CardScreen";
import FairModeScreen from "../app/candidate/FairModeScreen";
import { candidateHeaderOptions } from "./headerOptions";

export type CardStackParamList = {
  CardHome: undefined;
  FairMode: { initialMode?: "myQr" | "scan" } | undefined;
};

const Stack = createNativeStackNavigator<CardStackParamList>();

export default function CardStack() {
  return (
    <Stack.Navigator screenOptions={candidateHeaderOptions}>
      <Stack.Screen name="CardHome" component={CardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="FairMode" component={FairModeScreen} options={{ title: "Fair Mode" }} />
    </Stack.Navigator>
  );
}
