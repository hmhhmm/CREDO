import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useLocation } from "react-router-dom";
import { Activity, Users, TrendingUp, Handshake } from "lucide-react-native";
import PulseScreen from "../app/university/PulseScreen";
import CohortsScreen from "../app/university/CohortsScreen";
import OutcomesScreen from "../app/university/OutcomesScreen";
import PartnersScreen from "../app/university/PartnersScreen";
import CommunityScreen from "../app/community/CommunityScreen";
import SegmentedTabBar from "./SegmentedTabBar";
import type { University } from "../data/universityData";

const Tab = createBottomTabNavigator();

const ICONS = { Pulse: Activity, Cohorts: Users, Outcomes: TrendingUp, Partners: Handshake, Community: Users };
const BASE_PATH = "/app/university";
const PATH_TO_SCREEN: Record<string, string> = {
  pulse: "Pulse",
  cohorts: "Cohorts",
  outcomes: "Outcomes",
  partners: "Partners",
  community: "Community",
};

export default function UniversityTabs({
  university,
  onSwitchRole,
}: {
  university: University;
  onSwitchRole: () => void;
}) {
  const location = useLocation();
  const segment = location.pathname.replace(new RegExp(`^${BASE_PATH}/?`), "").split("/")[0];
  const initialRouteName = PATH_TO_SCREEN[segment] ?? "Pulse";

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={initialRouteName}
      tabBar={(props) => <SegmentedTabBar {...props} icons={ICONS} basePath={BASE_PATH} />}
    >
      <Tab.Screen name="Pulse">{() => <PulseScreen university={university} onSwitchRole={onSwitchRole} />}</Tab.Screen>
      <Tab.Screen name="Cohorts">{() => <CohortsScreen university={university} />}</Tab.Screen>
      <Tab.Screen name="Outcomes">{() => <OutcomesScreen university={university} />}</Tab.Screen>
      <Tab.Screen name="Partners">{() => <PartnersScreen university={university} />}</Tab.Screen>
      <Tab.Screen name="Community">
        {() => (
          <CommunityScreen
            identity={{ id: university.id, name: `${university.name} Career Services`, subtitle: university.city, role: "university" }}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
