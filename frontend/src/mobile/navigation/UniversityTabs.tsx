import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Activity, Users, TrendingUp, Handshake } from "lucide-react-native";
import PulseScreen from "../app/university/PulseScreen";
import CohortsScreen from "../app/university/CohortsScreen";
import OutcomesScreen from "../app/university/OutcomesScreen";
import PartnersScreen from "../app/university/PartnersScreen";
import SegmentedTabBar from "./SegmentedTabBar";

const Tab = createBottomTabNavigator();

const ICONS = { Pulse: Activity, Cohorts: Users, Outcomes: TrendingUp, Partners: Handshake };

export default function UniversityTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <SegmentedTabBar {...props} icons={ICONS} />}
    >
      <Tab.Screen name="Pulse" component={PulseScreen} />
      <Tab.Screen name="Cohorts" component={CohortsScreen} />
      <Tab.Screen name="Outcomes" component={OutcomesScreen} />
      <Tab.Screen name="Partners" component={PartnersScreen} />
    </Tab.Navigator>
  );
}
