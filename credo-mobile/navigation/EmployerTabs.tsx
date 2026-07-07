import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { LayoutDashboard, Search, ListChecks, ScanLine } from "lucide-react-native";
import EmployerHomeScreen from "../app/employer/HomeScreen";
import DiscoverScreen from "../app/employer/DiscoverScreen";
import PipelineScreen from "../app/employer/PipelineScreen";
import FairModeScreen from "../app/employer/FairModeScreen";
import SegmentedTabBar from "./SegmentedTabBar";

const Tab = createBottomTabNavigator();

const ICONS = { Home: LayoutDashboard, Discover: Search, Pipeline: ListChecks, FairMode: ScanLine };
const LABELS = { Home: "Home", Discover: "Discover", Pipeline: "Pipeline", FairMode: "Fair" };

export default function EmployerTabs({ onSwitchRole }: { onSwitchRole: () => void }) {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <SegmentedTabBar {...props} icons={ICONS} labels={LABELS} />}
    >
      <Tab.Screen name="Home">{() => <EmployerHomeScreen onSwitchRole={onSwitchRole} />}</Tab.Screen>
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Pipeline" component={PipelineScreen} />
      <Tab.Screen name="FairMode" component={FairModeScreen} />
    </Tab.Navigator>
  );
}
