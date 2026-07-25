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

// "Verify" renamed to "Portfolio" — the tab is a personal-records hub (verification ledger
// + verified credentials + resume/certificate documents), not just an action button, so the
// name should describe the place, not the action performed on it.
const ICONS = { Home, Portfolio: ShieldCheck, Card: IdCard, Grow: TrendingUp, Community: Users };
const BASE_PATH = "/app/candidate";
const PATH_TO_SCREEN: Record<string, string> = { home: "Home", portfolio: "Portfolio", card: "Card", grow: "Grow", community: "Community" };

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
      <Tab.Screen name="Portfolio" component={VerifyScreen} />
      <Tab.Screen name="Card" component={CardStack} />
      <Tab.Screen name="Grow" component={GrowStack} />
      <Tab.Screen name="Community" component={CommunityScreen} />
    </Tab.Navigator>
  );
}
