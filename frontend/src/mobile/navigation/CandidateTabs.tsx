import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useLocation } from "react-router-dom";
import { Home, ShieldCheck, IdCard, TrendingUp, Users } from "lucide-react-native";
import HomeStack from "./HomeStack";
import VerifyScreen from "../app/candidate/VerifyScreen";
import CardStack from "./CardStack";
import GrowStack from "./GrowStack";
import CommunityScreen from "../app/community/CommunityScreen";
import SegmentedTabBar from "./SegmentedTabBar";

const Tab = createBottomTabNavigator();

const ICONS = { Home, Verify: ShieldCheck, Card: IdCard, Grow: TrendingUp, Community: Users };
const BASE_PATH = "/app/candidate";
const PATH_TO_SCREEN: Record<string, string> = { home: "Home", verify: "Verify", card: "Card", grow: "Grow", community: "Community" };

export default function CandidateTabs({ onSwitchRole }: { onSwitchRole: () => void }) {
  const location = useLocation();
  const segment = location.pathname.replace(new RegExp(`^${BASE_PATH}/?`), "").split("/")[0];
  const initialRouteName = PATH_TO_SCREEN[segment] ?? "Home";

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={initialRouteName}
      tabBar={(props) => <SegmentedTabBar {...props} icons={ICONS} basePath={BASE_PATH} />}
    >
      <Tab.Screen name="Home">{() => <HomeStack onSwitchRole={onSwitchRole} />}</Tab.Screen>
      <Tab.Screen name="Verify" component={VerifyScreen} />
      <Tab.Screen name="Card" component={CardStack} />
      <Tab.Screen name="Grow" component={GrowStack} />
      <Tab.Screen name="Community" component={CommunityScreen} />
    </Tab.Navigator>
  );
}
