// CredoGlass — the app's glass surface.
//
// On iOS 26+ this renders Apple's real Liquid Glass (expo-glass-effect / UIVisualEffectView),
// which produces genuine refraction, specular edges and adaptive tint — the look expo-blur
// could never achieve on our low-detail cream background (BlurView blurs what's behind it,
// and a near-uniform gradient has nothing to blur, so it collapsed to a flat tint).
//
// On everything else (web preview, older iOS, Android) it falls back to a blur + layered
// gradient approximation so the app still reads as glassy, just not truly refractive.
import React from "react";
import { View, StyleSheet, Platform, type ViewStyle, type StyleProp } from "react-native";
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

// expo-glass-effect is a NATIVE module — if the app binary wasn't rebuilt after installing it
// (e.g. only a JS reload happened), importing it or calling isLiquidGlassAvailable() throws and
// red-screens the whole app. Load it defensively so a stale binary just uses the blur fallback.
let GlassView: React.ComponentType<Record<string, unknown>> | null = null;
let LIQUID_GLASS = false;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const glass = require("expo-glass-effect");
  GlassView = glass.GlassView;
  LIQUID_GLASS = Platform.OS === "ios" && typeof glass.isLiquidGlassAvailable === "function" && glass.isLiquidGlassAvailable();
} catch {
  LIQUID_GLASS = false;
}

export function CredoGlass({
  children,
  variant = "light",
  borderRadius = 20,
  style,
  contentStyle,
}: CredoGlassProps) {
  const isIdentity = variant === "identity";

  if (LIQUID_GLASS && GlassView) {
    const Glass = GlassView;
    return (
      <Glass
        glassEffectStyle="regular"
        tintColor={isIdentity ? "rgba(16,25,43,0.55)" : "rgba(255,252,246,0.30)"}
        colorScheme={isIdentity ? "dark" : "light"}
        style={[{ borderRadius, overflow: "hidden" }, style]}
      >
        <View style={[styles.content, contentStyle]}>{children}</View>
      </Glass>
    );
  }

  // ── Fallback (web / non-iOS-26): blur + layered gradients ──────────────────
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
