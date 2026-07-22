// Type declarations for the browser shims in this directory.
//
// The ported screens in src/mobile are TypeScript and import bare specifiers
// ("react-native", "@react-navigation/native-stack", …) that vite.config.js aliases to the
// .jsx files here. Those files are plain JS, so these ambient declarations give the editor
// and `tsc --noEmit` the types the screens are written against.
//
// This is deliberately the RN API *as this app uses it*, not a faithful reproduction of
// @types/react-native. Style props are permissive: the shims accept any RN style object
// and style.js decides what survives the trip to CSS.

declare module 'react-native' {
  import type { ComponentType, ReactNode, Ref } from 'react';

  export type ViewStyle = Record<string, unknown>;
  export type TextStyle = Record<string, unknown>;
  export type ImageStyle = Record<string, unknown>;
  export type StyleProp<T> = T | false | null | undefined | StyleProp<T>[];

  interface Accessibility {
    accessibilityRole?: string;
    accessibilityLabel?: string;
    accessibilityState?: { selected?: boolean; disabled?: boolean; checked?: boolean };
    testID?: string;
  }

  export interface ViewProps extends Accessibility {
    style?: StyleProp<ViewStyle>;
    children?: ReactNode;
    pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
    onLayout?: (event: unknown) => void;
    ref?: Ref<HTMLDivElement>;
  }

  export interface TextProps extends Accessibility {
    style?: StyleProp<TextStyle>;
    children?: ReactNode;
    numberOfLines?: number;
    onPress?: () => void;
    ref?: Ref<HTMLSpanElement>;
  }

  export interface PressableProps extends Accessibility {
    style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
    children?: ReactNode | ((state: { pressed: boolean }) => ReactNode);
    onPress?: (event?: unknown) => void;
    onLongPress?: () => void;
    disabled?: boolean;
    hitSlop?: number | { top?: number; bottom?: number; left?: number; right?: number };
  }

  export interface ScrollViewProps extends ViewProps {
    contentContainerStyle?: StyleProp<ViewStyle>;
    horizontal?: boolean;
    showsVerticalScrollIndicator?: boolean;
    showsHorizontalScrollIndicator?: boolean;
    keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
  }

  export interface TextInputProps {
    style?: StyleProp<TextStyle>;
    value?: string;
    onChangeText?: (text: string) => void;
    onSubmitEditing?: (event?: unknown) => void;
    placeholder?: string;
    placeholderTextColor?: string;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'number-pad' | 'phone-pad';
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    autoCorrect?: boolean;
    editable?: boolean;
    multiline?: boolean;
    numberOfLines?: number;
    maxLength?: number;
    returnKeyType?: string;
    textAlignVertical?: string;
  }

  export const View: ComponentType<ViewProps>;
  export const Text: ComponentType<TextProps>;
  export const Pressable: ComponentType<PressableProps>;
  export const TouchableOpacity: ComponentType<PressableProps>;
  export const ScrollView: ComponentType<ScrollViewProps>;
  export const TextInput: ComponentType<TextInputProps>;
  export const KeyboardAvoidingView: ComponentType<ViewProps & { behavior?: string; keyboardVerticalOffset?: number }>;
  export const ActivityIndicator: ComponentType<{ color?: string; size?: 'small' | 'large'; style?: StyleProp<ViewStyle> }>;
  export const Switch: ComponentType<{ value?: boolean; onValueChange?: (value: boolean) => void; disabled?: boolean }>;

  export const StyleSheet: {
    create<T extends Record<string, ViewStyle | TextStyle | ImageStyle>>(styles: T): T;
    flatten(style: StyleProp<ViewStyle | TextStyle>): Record<string, unknown>;
    absoluteFill: ViewStyle;
    absoluteFillObject: ViewStyle;
    hairlineWidth: number;
    compose(a: unknown, b: unknown): unknown[];
  };

  // Typed as the full RN union, not the literal 'web', so the ported screens' existing
  // `Platform.OS === "ios"` branches stay valid code rather than "impossible comparison"
  // errors. At runtime the shim always reports 'web' and those branches are dead.
  export const Platform: {
    OS: 'ios' | 'android' | 'web' | 'windows' | 'macos';
    Version: number;
    select<T>(spec: { ios?: T; android?: T; web?: T; native?: T; default?: T }): T;
  };

  export const Dimensions: {
    get(dim: 'window' | 'screen'): { width: number; height: number; scale: number; fontScale: number };
    addEventListener(...args: unknown[]): { remove: () => void };
  };

  export function useWindowDimensions(): { width: number; height: number; scale: number; fontScale: number };

  export const Alert: {
    alert(
      title: string,
      message?: string,
      buttons?: { text?: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }[]
    ): void;
  };

  export const Share: {
    share(content: { message?: string; url?: string; title?: string }): Promise<{ action: string }>;
    sharedAction: string;
    dismissedAction: string;
  };

  export const Linking: {
    openURL(url: string): Promise<void>;
    canOpenURL(url: string): Promise<boolean>;
  };

  export const Animated: {
    View: ComponentType<ViewProps>;
    Text: ComponentType<TextProps>;
    ScrollView: ComponentType<ScrollViewProps>;
    createAnimatedComponent<T>(component: T): T;
  };
}

declare module 'react-native-safe-area-context' {
  import type { ComponentType, Context } from 'react';
  import type { StyleProp, ViewStyle } from 'react-native';

  export type Edge = 'top' | 'right' | 'bottom' | 'left';
  export interface EdgeInsets {
    top: number;
    right: number;
    bottom: number;
    left: number;
  }

  export const SafeAreaProvider: ComponentType<{ children?: React.ReactNode; style?: StyleProp<ViewStyle> }>;
  export const SafeAreaView: ComponentType<{
    children?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    edges?: readonly Edge[];
    mode?: 'padding' | 'margin';
  }>;
  export function useSafeAreaInsets(): EdgeInsets;
  export function useSafeAreaFrame(): { x: number; y: number; width: number; height: number };
  export const SafeAreaInsetsContext: Context<EdgeInsets>;
  export const initialWindowMetrics: { insets: EdgeInsets; frame: { x: number; y: number; width: number; height: number } };
}

declare module '@react-navigation/native' {
  import type { ComponentType, ReactNode } from 'react';

  export interface NavigationProp {
    navigate(name: string, params?: object): void;
    push(name: string, params?: object): void;
    replace(name: string, params?: object): void;
    goBack(): void;
    popToTop(): void;
    canGoBack(): boolean;
    getParent(): NavigationProp | undefined;
    setOptions(options: object): void;
    setParams(params: object): void;
    addListener(...args: unknown[]): () => void;
    isFocused(): boolean;
    emit(event: { type: string; target?: string; canPreventDefault?: boolean }): { defaultPrevented: boolean };
    dispatch(action: unknown): void;
  }

  export interface Route<Params = object | undefined> {
    key: string;
    name: string;
    params: Params;
  }

  export type NavigatorScreenParams<T> = { screen?: keyof T; params?: object; initial?: boolean };

  export const NavigationContainer: ComponentType<{ children?: ReactNode }>;
  export function useNavigation<T = NavigationProp>(): T;
  export function useRoute<T = Route>(): T;
  export function useIsFocused(): boolean;
  export function useFocusEffect(effect: () => void | (() => void)): void;
}

declare module '@react-navigation/native-stack' {
  import type { ComponentType, ReactNode } from 'react';
  import type { NavigationProp, Route } from '@react-navigation/native';
  import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

  export interface NativeStackNavigationOptions {
    title?: string;
    headerShown?: boolean;
    headerStyle?: StyleProp<ViewStyle>;
    headerTitleStyle?: StyleProp<TextStyle>;
    headerTintColor?: string;
    headerShadowVisible?: boolean;
    headerBackTitle?: string;
    headerBackButtonDisplayMode?: 'default' | 'generic' | 'minimal';
    headerLeft?: () => ReactNode;
    headerRight?: () => ReactNode;
  }

  export interface NativeStackNavigationProp<ParamList = Record<string, object | undefined>, RouteName extends keyof ParamList = keyof ParamList>
    extends NavigationProp {
    navigate<K extends keyof ParamList>(name: K, params?: ParamList[K]): void;
    push<K extends keyof ParamList>(name: K, params?: ParamList[K]): void;
    replace<K extends keyof ParamList>(name: K, params?: ParamList[K]): void;
  }

  export type NativeStackScreenProps<ParamList, RouteName extends keyof ParamList = keyof ParamList> = {
    navigation: NativeStackNavigationProp<ParamList, RouteName>;
    route: Route<ParamList[RouteName]>;
  };

  // Generic over the route name so a <Screen name="JobDetail"> render prop is typed with
  // JobDetail's params, not the union of every screen's params.
  interface ScreenProps<ParamList, RouteName extends keyof ParamList> {
    name: RouteName & string;
    component?: ComponentType<never>;
    children?: (props: NativeStackScreenProps<ParamList, RouteName>) => ReactNode;
    options?:
      | NativeStackNavigationOptions
      | ((props: NativeStackScreenProps<ParamList, RouteName>) => NativeStackNavigationOptions);
    initialParams?: object;
  }

  export function createNativeStackNavigator<ParamList = Record<string, object | undefined>>(): {
    Navigator: ComponentType<{
      children?: ReactNode;
      screenOptions?: NativeStackNavigationOptions;
      initialRouteName?: keyof ParamList & string;
      id?: string;
    }>;
    Screen: <RouteName extends keyof ParamList>(props: ScreenProps<ParamList, RouteName>) => ReactNode;
    Group: ComponentType<{ children?: ReactNode }>;
  };
}

declare module '@react-navigation/bottom-tabs' {
  import type { ComponentType, ReactNode } from 'react';
  import type { NavigationProp, Route } from '@react-navigation/native';
  import type { EdgeInsets } from 'react-native-safe-area-context';

  export interface BottomTabBarProps {
    state: { index: number; routes: Route[]; key: string; routeNames: string[]; type: string };
    navigation: NavigationProp;
    descriptors: Record<string, { options: object; route: Route; navigation: NavigationProp }>;
    insets: EdgeInsets;
  }

  export function createBottomTabNavigator<ParamList = Record<string, object | undefined>>(): {
    Navigator: ComponentType<{
      children?: ReactNode;
      screenOptions?: { headerShown?: boolean };
      tabBar?: (props: BottomTabBarProps) => ReactNode;
      initialRouteName?: keyof ParamList & string;
      id?: string;
    }>;
    Screen: ComponentType<{
      name: keyof ParamList & string;
      component?: ComponentType<never>;
      children?: (props: { navigation: NavigationProp; route: Route }) => ReactNode;
      options?: object;
    }>;
    Group: ComponentType<{ children?: ReactNode }>;
  };
}

declare module 'react-native-reanimated' {
  import type { ComponentType } from 'react';
  import type { TextProps, ViewProps } from 'react-native';

  export interface SharedValue<T = number> {
    value: T;
  }

  export function useSharedValue<T>(initial: T): SharedValue<T>;
  export function useAnimatedStyle<T>(factory: () => T, deps?: unknown[]): T;
  export function useDerivedValue<T>(factory: () => T): SharedValue<T>;
  export function withSpring(toValue: number, config?: { stiffness?: number; damping?: number; mass?: number; duration?: number }): number;
  export function withTiming(toValue: number, config?: { duration?: number }): number;
  export function withDelay(delay: number, animation: number): number;
  export function interpolate(value: number, inputRange: number[], outputRange: number[], extrapolate?: unknown): number;
  export function useReducedMotion(): boolean;
  export function runOnJS<T extends (...args: never[]) => unknown>(fn: T): T;
  export function runOnUI<T extends (...args: never[]) => unknown>(fn: T): T;
  export const Easing: Record<string, unknown>;

  const Animated: {
    View: ComponentType<ViewProps>;
    Text: ComponentType<TextProps>;
    ScrollView: ComponentType<ViewProps>;
    createAnimatedComponent<T>(component: T): T;
  };
  export default Animated;
}

declare module 'react-native-gesture-handler' {
  import type { ComponentType } from 'react';
  import type { ViewProps } from 'react-native';

  export const GestureHandlerRootView: ComponentType<ViewProps>;
  export const TouchableOpacity: ComponentType<ViewProps>;
  export const RectButton: ComponentType<ViewProps>;
  export const BaseButton: ComponentType<ViewProps>;
  export const ScrollView: ComponentType<ViewProps>;
  export const Pressable: ComponentType<ViewProps>;
}

declare module 'react-native-svg' {
  import type { ComponentType, SVGProps } from 'react';

  const Svg: ComponentType<SVGProps<SVGSVGElement>>;
  export default Svg;
  export const Path: ComponentType<SVGProps<SVGPathElement>>;
  export const Circle: ComponentType<SVGProps<SVGCircleElement>>;
  export const Rect: ComponentType<SVGProps<SVGRectElement>>;
  export const G: ComponentType<SVGProps<SVGGElement>>;
  export const Line: ComponentType<SVGProps<SVGLineElement>>;
  export const Defs: ComponentType<SVGProps<SVGDefsElement>>;
  export const Stop: ComponentType<SVGProps<SVGStopElement>>;
  export const LinearGradient: ComponentType<SVGProps<SVGLinearGradientElement>>;
  export const Text: ComponentType<SVGProps<SVGTextElement>>;
  export const Polygon: ComponentType<SVGProps<SVGPolygonElement>>;
}

declare module 'react-native-qrcode-svg' {
  import type { ComponentType } from 'react';

  const QRCode: ComponentType<{
    value: string;
    size?: number;
    color?: string;
    backgroundColor?: string;
    ecl?: 'L' | 'M' | 'Q' | 'H';
  }>;
  export default QRCode;
}

declare module '@react-native-async-storage/async-storage' {
  const AsyncStorage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
    clear(): Promise<void>;
    multiSet(pairs: [string, string][]): Promise<void>;
    multiGet(keys: string[]): Promise<[string, string | null][]>;
    multiRemove(keys: string[]): Promise<void>;
    getAllKeys(): Promise<string[]>;
  };
  export default AsyncStorage;
}

declare module 'expo-linear-gradient' {
  import type { ComponentType, ReactNode } from 'react';
  import type { StyleProp, ViewStyle } from 'react-native';

  export const LinearGradient: ComponentType<{
    colors: readonly string[];
    locations?: readonly number[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    style?: StyleProp<ViewStyle>;
    children?: ReactNode;
    pointerEvents?: string;
  }>;
  export default LinearGradient;
}

declare module 'expo-blur' {
  import type { ComponentType, ReactNode } from 'react';
  import type { StyleProp, ViewStyle } from 'react-native';

  export const BlurView: ComponentType<{
    intensity?: number;
    tint?: 'light' | 'dark' | 'default';
    style?: StyleProp<ViewStyle>;
    children?: ReactNode;
  }>;
}

declare module 'expo-clipboard' {
  export function setStringAsync(text: string): Promise<boolean>;
  export function getStringAsync(): Promise<string>;
}

declare module 'expo-document-picker' {
  export interface DocumentPickerAsset {
    uri: string;
    name: string;
    size?: number;
    mimeType?: string;
    lastModified?: number;
    file?: File;
  }
  export function getDocumentAsync(options?: {
    type?: string | string[];
    multiple?: boolean;
  }): Promise<{ canceled: boolean; assets: DocumentPickerAsset[] | null }>;
}

declare module 'expo-constants' {
  const Constants: {
    expoConfig?: { hostUri?: string | null; name?: string; slug?: string } | null;
    executionEnvironment: string;
    platform: Record<string, unknown>;
  };
  export default Constants;
}

declare module 'expo-status-bar' {
  import type { ComponentType } from 'react';
  export const StatusBar: ComponentType<{ style?: 'auto' | 'light' | 'dark' }>;
}

declare module 'expo-splash-screen' {
  export function preventAutoHideAsync(): Promise<boolean>;
  export function hideAsync(): Promise<boolean>;
  export function setOptions(options: unknown): void;
}

// Aliased to lucide-react, whose icons take the same size/color props.
declare module 'lucide-react-native' {
  export * from 'lucide-react';
}
