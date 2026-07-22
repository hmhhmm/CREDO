import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, ShieldCheck, IdCard, TrendingUp } from "lucide-react-native";
import HomeStack from "./HomeStack";
import VerifyScreen from "../app/candidate/VerifyScreen";
import CardStack from "./CardStack";
import GrowStack from "./GrowStack";
import SegmentedTabBar from "./SegmentedTabBar";

const Tab = createBottomTabNavigator();

const ICONS = { Home, Verify: ShieldCheck, Card: IdCard, Grow: TrendingUp };

export default function CandidateTabs({ onSwitchRole }: { onSwitchRole: () => void }) {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <SegmentedTabBar {...props} icons={ICONS} />}
    >
      <Tab.Screen name="Home">{() => <HomeStack onSwitchRole={onSwitchRole} />}</Tab.Screen>
      <Tab.Screen name="Verify" component={VerifyScreen} />
      <Tab.Screen name="Card" component={CardStack} />
      <Tab.Screen name="Grow" component={GrowStack} />
    </Tab.Navigator>
  );
}
