import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../app/candidate/HomeScreen";
import PortfolioScreen from "../app/candidate/PortfolioScreen";
import CandidateSettingsScreen from "../app/candidate/SettingsScreen";
import SimuHireStack from "./SimuHireStack";
import { candidateHeaderOptions } from "./headerOptions";

export type HomeStackParamList = {
  HomeMain: undefined;
  Portfolio: undefined;
  SimuHire: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack({ onSwitchRole }: { onSwitchRole: () => void }) {
  return (
    <Stack.Navigator screenOptions={candidateHeaderOptions}>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Portfolio" component={PortfolioScreen} options={{ title: "Living Portfolio" }} />
      <Stack.Screen name="SimuHire" component={SimuHireStack} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" options={{ title: "Settings" }}>
        {({ navigation }) => <CandidateSettingsScreen navigation={navigation} onSwitchRole={onSwitchRole} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
