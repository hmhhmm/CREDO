// Ported from frontend/src/components/NamecardPremium.jsx.
// Continuous mouse-tilt parallax has no mobile equivalent and is intentionally dropped
// (see project decision) — flip, grain-look gradient, and gold metallic border are kept.
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  useReducedMotion,
  withSpring,
  interpolate,
} from "react-native-reanimated";
import { useCallback, useState } from "react";
import type { Candidate } from "../../data/types";
import Front from "./Front";
import Back from "./Back";
import { CARD_WIDTH, CARD_HEIGHT } from "./tokens";

const FLIP_SPRING = { stiffness: 180, damping: 30, mass: 1 };

export default function SmartNamecard({
  candidate,
  onEmptyCta,
}: {
  candidate: Candidate;
  onEmptyCta?: () => void;
}) {
  const reduced = useReducedMotion();
  const [flipped, setFlipped] = useState(false);
  const flipAngle = useSharedValue(0);

  const onFlip = useCallback(() => {
    const next = !flipped;
    setFlipped(next);
    const target = next ? 180 : 0;
    flipAngle.value = reduced ? target : withSpring(target, FLIP_SPRING);
  }, [flipped, flipAngle, reduced]);

  const frontStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipAngle.value, [0, 180], [0, 180]);
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
      opacity: rotateY > 90 ? 0 : 1,
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipAngle.value, [0, 180], [180, 360]);
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
      opacity: rotateY < 270 ? 0 : 1,
    };
  });

  return (
    <Pressable
      onPress={onFlip}
      accessibilityRole="button"
      accessibilityLabel={`${candidate.name}'s verified identity card. Trust score ${candidate.trustScore}. Tap to flip.`}
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
    >
      <Animated.View style={[styles.face, frontStyle]}>
        <Front candidate={candidate} onEmptyCta={onEmptyCta} />
      </Animated.View>
      <Animated.View style={[styles.face, backStyle]}>
        <Back candidate={candidate} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  face: {
    ...StyleSheet.absoluteFill,
    borderRadius: 16,
    overflow: "hidden",
    backfaceVisibility: "hidden",
    // Identity-glass treatment: gold hairline border (the blur layer of the identity
    // variant is invisible behind this card's opaque navy gradient, so the border and
    // the specular sheen inside Front/Back are the visible parts).
    borderWidth: 1,
    borderColor: "rgba(201,166,70,0.35)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
  },
});
