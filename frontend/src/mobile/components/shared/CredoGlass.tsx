// CredoGlass — the app's glass surface.
//
// On iOS 26+ this renders Apple's real Liquid Glass (expo-glass-effect / UIVisualEffectView),
// which produces genuine refraction, specular edges and adaptive tint — the look expo-blur
// could never achieve on our low-detail cream background (BlurView blurs what's behind it,
// and a near-uniform gradient has nothing to blur, so it collapsed to a flat tint).
//
// On everything else (older iOS, Android) it falls back to a blur + layered gradient
// approximation so the app still reads as glassy, just not truly refractive.
//
// WEB PORT: expo-glass-effect is an iOS-only native module with no browser counterpart,
// so the Liquid Glass branch is dropped here and the blur fallback — backed by CSS
// backdrop-filter, which does composite against real page content — is the only path.
import React from "react";
import { View, StyleSheet, type ViewStyle, type StyleProp } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../theme/colors";

type GlassVariant = "light" | "identity";

interface CredoGlassProps {
  children: React.ReactNode;
  variant?: GlassVariant;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export function CredoGlass({
  children,
  variant = "light",
  borderRadius = 20,
  style,
  contentStyle,
}: CredoGlassProps) {
  const isIdentity = variant === "identity";

  // ── blur + layered gradients ───────────────────────────────────────────────
  return (
    <View style={[{ borderRadius, overflow: "hidden" }, style]}>
      <BlurView
        intensity={isIdentity ? 55 : 65}
        tint={isIdentity ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={
          isIdentity
            ? ["rgba(201,166,70,0.10)", "rgba(16,25,43,0.42)"]
            : ["rgba(255,255,255,0.55)", "rgba(255,255,255,0.16)"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View
        style={[
          styles.fill,
          {
            borderRadius,
            borderColor: isIdentity ? `${colors.gold}59` : "rgba(255,255,255,0.85)",
            borderWidth: 1,
          },
        ]}
      >
        <LinearGradient
          colors={[isIdentity ? `${colors.gold}26` : "rgba(255,255,255,0.5)", "transparent", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          locations={[0, 0.35, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={[styles.content, contentStyle]}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { position: "relative" },
  content: { padding: 16 },
});
