// Shared native-stack header options for every candidate sub-stack.
// - icon-only back button (no previous-route-name label like "GrowMain")
// - flat header on the warm ground, bold serif title
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

export const candidateHeaderOptions: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: colors.parchment },
  headerShadowVisible: false,
  headerTintColor: colors.ink,
  headerBackButtonDisplayMode: "minimal", // icon-only, drops the back-title text
  headerBackTitle: "",
  headerTitleStyle: { fontFamily: fonts.displayBold, fontSize: 17, color: colors.ink },
};
