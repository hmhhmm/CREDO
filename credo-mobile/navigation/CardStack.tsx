import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CardScreen from "../app/candidate/CardScreen";
import LedgerScreen from "../app/candidate/LedgerScreen";
import FairModeScreen from "../app/candidate/FairModeScreen";
import { candidateHeaderOptions } from "./headerOptions";

export type CardStackParamList = {
  CardHome: undefined;
  Ledger: undefined;
  FairMode: undefined;
};

const Stack = createNativeStackNavigator<CardStackParamList>();

export default function CardStack() {
  return (
    <Stack.Navigator screenOptions={candidateHeaderOptions}>
      <Stack.Screen name="CardHome" component={CardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Ledger" component={LedgerScreen} options={{ title: "Credential Ledger" }} />
      <Stack.Screen name="FairMode" component={FairModeScreen} options={{ title: "Fair Mode" }} />
    </Stack.Navigator>
  );
}
