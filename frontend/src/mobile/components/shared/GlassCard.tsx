// Frosted-glass card surface used across the app. Implemented on CredoGlass (light
// variant) with a soft warm drop shadow; call sites manage their own inner padding,
// so CredoGlass's default content padding is zeroed here.
import { View, StyleSheet, type ViewStyle, type StyleProp } from "react-native";
import { CredoGlass } from "./CredoGlass";
import { surface } from "../../theme/colors";

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
}

export default function GlassCard({ children, style, radius = 20 }: Props) {
  return (
    <View style={[styles.shadowWrap, { borderRadius: radius }, style]}>
      <CredoGlass borderRadius={radius} contentStyle={styles.noPadding}>
        {children}
      </CredoGlass>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    shadowColor: surface.glassShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 6,
  },
  noPadding: { padding: 0 },
});
