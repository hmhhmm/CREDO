// react-native-gesture-handler shim. Browser DOM events need no gesture root; the app
// only mounts GestureHandlerRootView as a full-screen wrapper.
import { View, Pressable, ScrollView } from './react-native';

export function GestureHandlerRootView({ style, children, ...rest }) {
  return (
    <View style={style} {...rest}>
      {children}
    </View>
  );
}

export { Pressable, ScrollView };
export const TouchableOpacity = Pressable;
export const RectButton = Pressable;
export const BaseButton = Pressable;

export default { GestureHandlerRootView, TouchableOpacity: Pressable, ScrollView };
