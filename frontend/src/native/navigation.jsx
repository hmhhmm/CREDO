// React Navigation compat layer.
//
// Reimplements the slice of @react-navigation the app uses — nested native stacks, a
// bottom-tab navigator with a custom tabBar, `navigation.navigate/replace/goBack/
// getParent`, `route.params`, and `useFocusEffect` — as plain React state.
//
// Two behaviours are load-bearing and deliberately preserved from the real library:
//   * navigate(name) on a name this navigator doesn't own bubbles to the parent, which
//     is how HomeScreen's quick actions jump from a stack screen to a sibling tab.
//   * Screens stay mounted when covered (hidden, not unmounted) so their state survives
//     a push/pop, and useFocusEffect re-fires on return instead of on remount.
import { Children, createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { View, Text, Pressable, StyleSheet } from './react-native';
import { css } from './style';
import { FALLBACK_TOP_CLEARANCE } from './safe-area-context';

/* ── Contexts ───────────────────────────────────────────────────────────── */

const NavigationCtx = createContext(null);
const RouteCtx = createContext({ key: 'root', name: 'root', params: undefined });
const FocusCtx = createContext(true);

export function NavigationContainer({ children }) {
  return <View style={{ flex: 1 }}>{children}</View>;
}

export function useNavigation() {
  return useContext(NavigationCtx);
}

export function useRoute() {
  return useContext(RouteCtx);
}

export function useIsFocused() {
  return useContext(FocusCtx);
}

/**
 * Runs `effect` when the screen gains focus and tears down when it loses focus —
 * including tab switches and stack pushes, which a plain useEffect would miss.
 */
export function useFocusEffect(effect) {
  const focused = useContext(FocusCtx);
  useEffect(() => {
    if (!focused) return undefined;
    return effect();
  }, [focused, effect]);
}

/* ── Screen config extraction ───────────────────────────────────────────── */

// <Stack.Screen> never renders; the Navigator reads its props as configuration, which is
// how the real library works too.
function ScreenDefinition() {
  return null;
}

function readScreens(children) {
  return Children.toArray(children)
    .filter((child) => child && child.props && child.props.name)
    .map((child) => ({
      name: child.props.name,
      component: child.props.component,
      render: typeof child.props.children === 'function' ? child.props.children : undefined,
      options: child.props.options,
      initialParams: child.props.initialParams,
    }));
}

let keySeed = 0;
const nextKey = (name) => `${name}-${++keySeed}`;

/* ── Screen host ────────────────────────────────────────────────────────── */

// Kept mounted while covered so state survives a push/pop; `display: none` rather than
// unmount is what makes that identical to the native stack's behaviour.
function ScreenHost({ config, route, navigation, focused, header, sceneStyle }) {
  const Component = config.component;
  const props = { navigation, route };
  return (
    <FocusCtx.Provider value={focused}>
      <RouteCtx.Provider value={route}>
        <NavigationCtx.Provider value={navigation}>
          <View
            style={[
              { flex: 1 },
              sceneStyle,
              !focused && { display: 'none' },
            ]}
          >
            {header}
            <View style={{ flex: 1 }}>
              {config.render ? config.render(props) : Component ? <Component {...props} /> : null}
            </View>
          </View>
        </NavigationCtx.Provider>
      </RouteCtx.Provider>
    </FocusCtx.Provider>
  );
}

/* ── Header ─────────────────────────────────────────────────────────────── */

function StackHeader({ options, canGoBack, onBack }) {
  const {
    title,
    headerStyle,
    headerTintColor = '#10192B',
    headerTitleStyle,
    headerLeft,
    headerRight,
    headerShadowVisible,
  } = options;

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          // FALLBACK_TOP_CLEARANCE, not just env(safe-area-inset-top): that inset is 0 in
          // a plain browser tab or most emulators (no real notch to report), so a header
          // relying on it alone sits flush against the very top edge everywhere except a
          // real notched device. Same constant the intro screen's header row uses.
          paddingTop: FALLBACK_TOP_CLEARANCE,
          height: 52 + FALLBACK_TOP_CLEARANCE,
          paddingHorizontal: 12,
          flexShrink: 0,
          zIndex: 2,
        },
        headerShadowVisible === false ? null : { borderBottomWidth: 1, borderBottomColor: 'rgba(16,25,43,0.08)' },
        headerStyle,
      ]}
    >
      <View style={{ width: 34, alignItems: 'flex-start' }}>
        {headerLeft ? (
          headerLeft()
        ) : canGoBack ? (
          <Pressable onPress={onBack} accessibilityLabel="Go back" style={{ padding: 4, marginLeft: -4 }}>
            <ChevronLeft size={26} color={headerTintColor} />
          </Pressable>
        ) : null}
      </View>
      <Text style={[{ flex: 1, textAlign: 'center', color: headerTintColor }, headerTitleStyle]} numberOfLines={1}>
        {title}
      </Text>
      <View style={{ width: 34, alignItems: 'flex-end' }}>{headerRight ? headerRight() : null}</View>
    </View>
  );
}

/* ── Stack navigator ────────────────────────────────────────────────────── */

function StackNavigator({ children, screenOptions, initialRouteName, id }) {
  const parent = useContext(NavigationCtx);
  const parentFocused = useContext(FocusCtx);
  const hostRoute = useContext(RouteCtx);
  const screens = useMemo(() => readScreens(children), [children]);

  const initial = useMemo(() => {
    const first = screens.find((s) => s.name === initialRouteName) ?? screens[0];
    return first ? [{ key: nextKey(first.name), name: first.name, params: first.initialParams }] : [];
  }, [screens, initialRouteName]);

  const [stack, setStack] = useState(initial);
  // Per-route setOptions overrides, keyed by route key.
  const [overrides, setOverrides] = useState({});

  const names = useMemo(() => new Set(screens.map((s) => s.name)), [screens]);

  // `screens` is derived from `children`, so it is a fresh object every render. The
  // navigation object must NOT be, or the nested-params effect below would re-fire on
  // every render and loop. So navigation reads `names`/`parent` through this latest-value
  // ref, refreshed after each commit — safe because navigation methods only ever run from
  // event handlers and effects, both of which happen after the ref is up to date. That is
  // also why passing `navigation` down during render is fine, despite react-hooks/refs
  // not being able to prove it (see the suppressions below).
  const latest = useRef({ names, parent });
  useEffect(() => {
    latest.current = { names, parent };
  }, [names, parent]);

  const navigation = useMemo(() => {
    const nav = {
      navigate(name, params) {
        if (!latest.current.names.has(name)) {
          // Not ours — bubble up, exactly like React Navigation's action dispatch.
          latest.current.parent?.navigate(name, params);
          return;
        }
        setStack((prev) => {
          const existing = prev.findIndex((r) => r.name === name);
          if (existing >= 0) {
            // navigate() to a route already in the stack pops back to it rather than
            // stacking a duplicate.
            const popped = prev.slice(0, existing + 1);
            popped[existing] = { ...popped[existing], params: params ?? popped[existing].params };
            return popped;
          }
          return [...prev, { key: nextKey(name), name, params }];
        });
      },
      push(name, params) {
        if (!latest.current.names.has(name)) return latest.current.parent?.navigate(name, params);
        setStack((prev) => [...prev, { key: nextKey(name), name, params }]);
      },
      replace(name, params) {
        if (!latest.current.names.has(name)) return latest.current.parent?.navigate(name, params);
        setStack((prev) => [...prev.slice(0, -1), { key: nextKey(name), name, params }]);
      },
      goBack() {
        setStack((prev) => {
          if (prev.length <= 1) {
            latest.current.parent?.goBack?.();
            return prev;
          }
          return prev.slice(0, -1);
        });
      },
      popToTop() {
        setStack((prev) => prev.slice(0, 1));
      },
      canGoBack: () => true,
      getParent: () => latest.current.parent,
      setOptions(opts) {
        // Bound per-screen below; this base version is a no-op safety net.
        void opts;
      },
      setParams() {},
      addListener: () => () => {},
      isFocused: () => true,
      emit: () => ({ defaultPrevented: false }),
      dispatch: () => {},
      id,
    };
    return nav;
  }, [id]);

  // Nested navigation: navigate("Discover", { screen: "DiscoverMain", params }) targets a
  // screen inside *this* navigator from outside it. The parent stores the payload on the
  // host route's params; we unwrap it here, mirroring React Navigation's nested actions.
  const hostParams = hostRoute?.params;
  useEffect(() => {
    if (!hostParams || typeof hostParams !== 'object' || !hostParams.screen) return;
    if (!latest.current.names.has(hostParams.screen)) return;
    navigation.navigate(hostParams.screen, hostParams.params);
  }, [hostParams, navigation]);

  const topIndex = stack.length - 1;

  return (
    <View style={{ flex: 1 }}>
      {/* `navigation` closes over the latest-value ref above. Handing it to screens during
          render is safe — nothing reads the ref until an event or effect fires — but the
          rule cannot see through the closure, so it is suppressed here rather than
          contorting the navigator around a lint heuristic. */}
      {/* eslint-disable-next-line react-hooks/refs */}
      {stack.map((route, index) => {
        const config = screens.find((s) => s.name === route.name);
        if (!config) return null;

        // Per-screen navigation object: identical API, but setOptions/canGoBack are
        // bound to this route.
        const screenNav = {
          ...navigation,
          canGoBack: () => index > 0 || !!parent,
          setOptions: (opts) =>
            setOverrides((prev) => ({ ...prev, [route.key]: { ...prev[route.key], ...opts } })),
        };

        const raw = typeof config.options === 'function'
          ? config.options({ navigation: screenNav, route })
          : config.options;
        const options = { ...screenOptions, ...raw, ...overrides[route.key] };

        const focused = index === topIndex && parentFocused;
        const header =
          options.headerShown === false ? null : (
            <StackHeader
              options={options}
              canGoBack={index > 0 || !!parent}
              onBack={() => screenNav.goBack()}
            />
          );

        return (
          <ScreenHost
            key={route.key}
            config={config}
            route={route}
            navigation={screenNav}
            focused={focused}
            header={header}
            sceneStyle={index === topIndex ? null : StyleSheet.absoluteFill}
          />
        );
      })}
    </View>
  );
}

export function createNativeStackNavigator() {
  return { Navigator: StackNavigator, Screen: ScreenDefinition, Group: ({ children }) => children };
}

export const createStackNavigator = createNativeStackNavigator;

/* ── Bottom-tab navigator ───────────────────────────────────────────────── */

function TabNavigator({ children, screenOptions, tabBar, initialRouteName, id }) {
  const parent = useContext(NavigationCtx);
  const parentFocused = useContext(FocusCtx);
  const screens = useMemo(() => readScreens(children), [children]);

  const routes = useMemo(
    () => screens.map((s) => ({ key: `tab-${s.name}`, name: s.name, params: s.initialParams })),
    [screens]
  );

  const startIndex = Math.max(0, routes.findIndex((r) => r.name === initialRouteName));
  const [index, setIndex] = useState(startIndex);
  const [params, setParams] = useState({});
  // Tabs mount lazily and stay mounted afterwards, like React Navigation's default.
  const [visited, setVisited] = useState(() => new Set([routes[startIndex]?.name]));

  // Same reasoning as StackNavigator: keep `navigation` stable, read fresh values from a
  // latest-value ref refreshed after commit.
  const latest = useRef({ routes, parent });
  useEffect(() => {
    latest.current = { routes, parent };
  }, [routes, parent]);

  const navigation = useMemo(
    () => ({
      navigate(name, routeParams) {
        const target = latest.current.routes.findIndex((r) => r.name === name);
        if (target < 0) {
          latest.current.parent?.navigate(name, routeParams);
          return;
        }
        setIndex(target);
        setVisited((prev) => new Set(prev).add(name));
        if (routeParams) setParams((prev) => ({ ...prev, [name]: routeParams }));
      },
      goBack() {
        latest.current.parent?.goBack?.();
      },
      canGoBack: () => !!latest.current.parent,
      getParent: () => latest.current.parent,
      emit: () => ({ defaultPrevented: false }),
      setOptions: () => {},
      addListener: () => () => {},
      isFocused: () => true,
      dispatch: () => {},
      id,
    }),
    [id]
  );

  const state = { index, routes, key: `tabs-${id ?? 'default'}`, routeNames: routes.map((r) => r.name), type: 'tab' };
  const descriptors = Object.fromEntries(
    routes.map((r) => [r.key, { options: { ...screenOptions }, route: r, navigation }])
  );

  return (
    <View style={{ flex: 1 }}>
      {/* rn-tab-scenes is inset at desktop widths to clear SegmentedTabBar's left rail —
          see the media query in native.css. */}
      <View style={{ flex: 1 }} className="rn-tab-scenes">
        {screens.map((config, i) => {
          const route = { ...routes[i], params: params[config.name] ?? routes[i].params };
          if (!visited.has(config.name)) return null;
          return (
            <ScreenHost
              key={route.key}
              config={config}
              route={route}
              navigation={navigation}
              focused={i === index && parentFocused}
              header={null}
              sceneStyle={i === index ? null : StyleSheet.absoluteFill}
            />
          );
        })}
      </View>
      {/* Same as in StackNavigator: `navigation` closes over the latest-value ref, and the
          tabBar only invokes it from onPress. */}
      {/* eslint-disable-next-line react-hooks/refs */}
      {tabBar ? tabBar({ state, navigation, descriptors, insets: { top: 0, right: 0, bottom: 0, left: 0 } }) : null}
    </View>
  );
}

export function createBottomTabNavigator() {
  return { Navigator: TabNavigator, Screen: ScreenDefinition, Group: ({ children }) => children };
}

export { css as __css };
