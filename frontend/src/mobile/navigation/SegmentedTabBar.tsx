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
import { useLocation, useNavigate as useRouterNavigate } from "react-router-dom";
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
  centerRoute,
  basePath,
}: BottomTabBarProps & {
  icons: Record<string, LucideIcon>;
  labels?: Record<string, string>;
  // TnG-style layout: this route renders as a big, raised circular button in the middle
  // of the pill instead of an inline tab, with the remaining routes split left/right of it
  // in registration order. Phone width only — the desktop rail stays a plain vertical list.
  centerRoute?: string;
  // When set, each tab press also pushes `${basePath}/${route.name.toLowerCase()}` so every
  // top-level tab has its own shareable, direct-loadable URL — mirrors the pattern
  // RootNavigator uses for the role tabs themselves, one level down.
  basePath?: string;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const desktop = width >= DESKTOP_MIN_WIDTH;
  const bottom = insets.bottom > 0 ? insets.bottom + 4 : 18;
  const first = Object.values(icons)[0];
  const location = useLocation();
  const routerNavigate = useRouterNavigate();

  const tabs = state.routes.map((route, index) => {
    const focused = state.index === index;
    const Icon = icons[route.name] ?? first;
    const label = labels?.[route.name] ?? route.name;
    const onPress = () => {
      const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
      if (basePath) {
        const path = `${basePath}/${route.name.toLowerCase()}`;
        if (path !== location.pathname) routerNavigate(path);
      }
    };
    return { key: route.key, name: route.name, focused, Icon, label, onPress };
  });

  const centerIndex = centerRoute ? tabs.findIndex((t) => t.name === centerRoute) : -1;
  const center = centerIndex >= 0 ? tabs[centerIndex] : null;
  const leftTabs = center ? tabs.slice(0, centerIndex) : tabs;
  const rightTabs = center ? tabs.slice(centerIndex + 1) : [];

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

  if (center) {
    return (
      <View style={[styles.wrap, { bottom }]} pointerEvents="box-none">
        <View style={styles.pillWithCenter}>
          <View style={styles.pillSide}>
            {leftTabs.map(({ key, focused, Icon, label, onPress }) => (
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
          <Pressable
            onPress={center.onPress}
            style={styles.centerButton}
            accessibilityRole="button"
            accessibilityState={center.focused ? { selected: true } : {}}
          >
            <center.Icon size={26} color={colors.ink} strokeWidth={2.25} />
          </Pressable>
          <View style={styles.pillSide}>
            {rightTabs.map(({ key, focused, Icon, label, onPress }) => (
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

  // ── Phone: TnG-style pill with a raised center button ──────────────────
  pillWithCenter: {
    width: "84%",
    maxWidth: 440,
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
  pillSide: { flexDirection: "row", alignItems: "center", gap: 4 },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -28,
    borderWidth: 4,
    borderColor: colors.parchment,
    shadowColor: "rgba(16,25,43,0.5)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 12,
  },

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
