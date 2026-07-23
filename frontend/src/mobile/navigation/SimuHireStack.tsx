import { Pressable } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ChevronLeft } from "lucide-react-native";
import SimuHireSetupScreen from "../app/candidate/SimuHireSetupScreen";
import SimuHireChatScreen from "../app/candidate/SimuHireChatScreen";
import SimuHireReportScreen from "../app/candidate/SimuHireReportScreen";
import { candidateHeaderOptions } from "./headerOptions";
import { colors } from "../theme/colors";
import type { SessionCreateResponse } from "../lib/api";

export type SimuHireStackParamList = {
  SimuHireSetup: undefined;
  SimuHireChat: { session: SessionCreateResponse };
  SimuHireReport: { sessionId: string };
};

const Stack = createNativeStackNavigator<SimuHireStackParamList>();

export default function SimuHireStack() {
  return (
    <Stack.Navigator screenOptions={candidateHeaderOptions}>
      {/* Setup is the first screen of this nested stack, so it has no back of its own —
          give it a header-left that pops the parent (Home) stack back to Home. */}
      <Stack.Screen
        name="SimuHireSetup"
        component={SimuHireSetupScreen}
        options={({ navigation }) => ({
          title: "SimuHire",
          headerLeft: () => (
            <Pressable onPress={() => navigation.getParent()?.goBack()} hitSlop={12} style={{ paddingRight: 8 }}>
              <ChevronLeft size={26} color={colors.ink} />
            </Pressable>
          ),
        })}
      />
      <Stack.Screen name="SimuHireChat" component={SimuHireChatScreen} options={{ title: "SimuHire" }} />
      <Stack.Screen name="SimuHireReport" component={SimuHireReportScreen} options={{ title: "Your Report" }} />
    </Stack.Navigator>
  );
}
