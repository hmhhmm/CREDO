import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../app/candidate/HomeScreen";
import PortfolioScreen from "../app/candidate/PortfolioScreen";
import SimuHireStack from "./SimuHireStack";
import { candidateHeaderOptions } from "./headerOptions";

export type HomeStackParamList = {
  HomeMain: undefined;
  Portfolio: undefined;
  SimuHire: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack({ onSwitchRole }: { onSwitchRole: () => void }) {
  return (
    <Stack.Navigator screenOptions={candidateHeaderOptions}>
      <Stack.Screen name="HomeMain" options={{ headerShown: false }}>
        {(props) => <HomeScreen {...props} onSwitchRole={onSwitchRole} />}
      </Stack.Screen>
      <Stack.Screen name="Portfolio" component={PortfolioScreen} options={{ title: "Living Portfolio" }} />
      <Stack.Screen name="SimuHire" component={SimuHireStack} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
