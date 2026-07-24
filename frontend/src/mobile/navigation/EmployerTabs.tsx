import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { LayoutDashboard, Search, ListChecks, ScanLine, Users } from "lucide-react-native";
import type { NavigatorScreenParams } from "@react-navigation/native";
import EmployerHomeStack from "./EmployerHomeStack";
import DiscoverStack from "./DiscoverStack";
import PipelineStack from "./PipelineStack";
import type { PipelineStackParamList } from "./PipelineStack";
import FairModeScreen from "../app/employer/FairModeScreen";
import CommunityScreen from "../app/community/CommunityScreen";
import SegmentedTabBar from "./SegmentedTabBar";
import type { DiscoverStackParamList } from "./DiscoverStack";

export type EmployerTabsParamList = {
  Home: undefined;
  FairMode: undefined;
  Discover: NavigatorScreenParams<DiscoverStackParamList> | undefined;
  Pipeline: NavigatorScreenParams<PipelineStackParamList> | undefined;
  Community: undefined;
};

const Tab = createBottomTabNavigator<EmployerTabsParamList>();

const ICONS = { Home: LayoutDashboard, Discover: Search, Pipeline: ListChecks, FairMode: ScanLine, Community: Users };
const LABELS = { Home: "Home", Discover: "Discover", Pipeline: "Pipeline", FairMode: "Fair", Community: "Community" };

export default function EmployerTabs({ onSwitchRole }: { onSwitchRole: () => void }) {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <SegmentedTabBar {...props} icons={ICONS} labels={LABELS} centerRoute="FairMode" />}
    >
      <Tab.Screen name="Home">{() => <EmployerHomeStack onSwitchRole={onSwitchRole} />}</Tab.Screen>
      <Tab.Screen name="Discover" component={DiscoverStack} />
      <Tab.Screen name="FairMode" component={FairModeScreen} />
      <Tab.Screen name="Pipeline" component={PipelineStack} />
      <Tab.Screen name="Community" component={CommunityScreen} />
    </Tab.Navigator>
  );
}
