// Professional warm ground: a soft vertical cream gradient with two large, very-soft
// ambient light pools (one warm-gold top, one cool-navy bottom) that frame the content
// rather than reading as decorative "blobs". Kept low-opacity and oversized so the effect
// is ambient light, not shapes — and so glass surfaces above have gentle colour to refract.
import { View, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { surface } from "../../theme/colors";

const { width } = Dimensions.get("window");
const POOL = width * 1.25;

export default function ScreenBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[surface.groundFrom, surface.groundTo]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Warm light pool — upper area, gold */}
      <View
        style={[
          styles.pool,
          { width: POOL, height: POOL, borderRadius: POOL / 2, top: -POOL * 0.45, right: -POOL * 0.3, backgroundColor: "rgba(201,166,70,0.13)" },
        ]}
      />
      {/* Cool light pool — lower area, navy */}
      <View
        style={[
          styles.pool,
          { width: POOL, height: POOL, borderRadius: POOL / 2, bottom: -POOL * 0.5, left: -POOL * 0.35, backgroundColor: "rgba(16,25,43,0.06)" },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pool: { position: "absolute" },
});
