// Dark segmented pill tab bar (CREDO navy/gold theme), shared by Candidate and Employer.
// The active tab expands into a gold chip showing icon + label; inactive tabs are icon-only.
// Pass an icon map keyed by route name.
import { View, Pressable, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import type { LucideIcon } from "lucide-react-native";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

export default function SegmentedTabBar({
  state,
  navigation,
  icons,
  labels,
}: BottomTabBarProps & { icons: Record<string, LucideIcon>; labels?: Record<string, string> }) {
  const insets = useSafeAreaInsets();
  const bottom = insets.bottom > 0 ? insets.bottom + 4 : 18;
  const first = Object.values(icons)[0];

  return (
    <View style={[styles.wrap, { bottom }]} pointerEvents="box-none">
      <View style={styles.pill}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const Icon = icons[route.name] ?? first;
          const label = labels?.[route.name] ?? route.name;

          const onPress = () => {
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={[styles.tab, focused && styles.tabActive]}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
            >
              <Icon size={20} color={focused ? colors.ink : "rgba(245,237,224,0.7)"} />
              {focused && <Text style={styles.activeLabel}>{label}</Text>}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  pill: {
    width: "80%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.ink,
    borderRadius: 32,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(201,166,70,0.28)",
    shadowColor: "rgba(16,25,43,0.4)",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    height: 44,
    width: 44,
    borderRadius: 22,
  },
  tabActive: { width: "auto", paddingHorizontal: 18, backgroundColor: colors.gold },
  activeLabel: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink },
});
