// Primary navigation, shared by Candidate, Employer and University.
//
// WEB PORT: this is responsive. Below DESKTOP_MIN_WIDTH it is the original dark segmented
// pill floating over the content — the active tab expands into a gold chip, inactive tabs
// are icon-only. At desktop widths a floating pill would read as a broken phone UI, so it
// becomes a fixed left rail with persistent labels, which is what a desktop app wants.
// The scene area is inset to make room for the rail; that inset lives in
// src/native/native.css and its media query MUST match DESKTOP_MIN_WIDTH below.
//
// Pass an icon map keyed by route name.
import { View, Pressable, Text, StyleSheet, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import type { LucideIcon } from "lucide-react-native";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

export const DESKTOP_MIN_WIDTH = 900;
export const RAIL_WIDTH = 232;

export default function SegmentedTabBar({
  state,
  navigation,
  icons,
  labels,
}: BottomTabBarProps & { icons: Record<string, LucideIcon>; labels?: Record<string, string> }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const desktop = width >= DESKTOP_MIN_WIDTH;
  const bottom = insets.bottom > 0 ? insets.bottom + 4 : 18;
  const first = Object.values(icons)[0];

  const tabs = state.routes.map((route, index) => {
    const focused = state.index === index;
    const Icon = icons[route.name] ?? first;
    const label = labels?.[route.name] ?? route.name;
    const onPress = () => {
      const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
    };
    return { key: route.key, focused, Icon, label, onPress };
  });

  if (desktop) {
    return (
      <View style={styles.rail}>
        <View style={styles.railHeader}>
          <Text style={styles.wordmark}>CREDO</Text>
          <Text style={styles.tagline}>Prove. Present. Perform.</Text>
        </View>
        <View style={styles.railItems}>
          {tabs.map(({ key, focused, Icon, label, onPress }) => (
            <Pressable
              key={key}
              onPress={onPress}
              style={[styles.railTab, focused && styles.railTabActive]}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
            >
              <Icon size={19} color={focused ? colors.ink : "rgba(245,237,224,0.72)"} />
              <Text style={[styles.railLabel, focused && styles.railLabelActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { bottom }]} pointerEvents="box-none">
      <View style={styles.pill}>
        {tabs.map(({ key, focused, Icon, label, onPress }) => (
          <Pressable
            key={key}
            onPress={onPress}
            style={[styles.tab, focused && styles.tabActive]}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
          >
            <Icon size={20} color={focused ? colors.ink : "rgba(245,237,224,0.7)"} />
            {focused && <Text style={styles.activeLabel}>{label}</Text>}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Phone: floating segmented pill ──────────────────────────────────────
  wrap: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  pill: {
    width: "80%",
    // Without a cap the pill stretches to ~650px on a landscape tablet, which reads as a
    // broken layout rather than a floating control.
    maxWidth: 420,
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

  // ── Desktop: fixed left rail ────────────────────────────────────────────
  rail: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: RAIL_WIDTH,
    backgroundColor: colors.ink,
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 24,
    borderRightWidth: 1,
    borderRightColor: "rgba(201,166,70,0.22)",
  },
  railHeader: { paddingHorizontal: 12, marginBottom: 30 },
  wordmark: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    letterSpacing: 3,
    color: colors.parchment,
  },
  tagline: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(245,237,224,0.45)",
    marginTop: 6,
  },
  railItems: { gap: 4 },
  railTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  railTabActive: { backgroundColor: colors.gold },
  railLabel: { fontFamily: fonts.sansMedium, fontSize: 14, color: "rgba(245,237,224,0.72)" },
  railLabelActive: { fontFamily: fonts.sansSemiBold, color: colors.ink },
});
