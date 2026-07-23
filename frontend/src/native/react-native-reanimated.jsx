// react-native-reanimated shim.
//
// Reanimated drives animations off the UI thread and re-evaluates worklets per frame.
// The browser equivalent is a CSS transition: shared values are set to their *target*
// synchronously and Animated.View interpolates between the resulting styles. So
// `useAnimatedStyle` runs once per render (not per frame) and the browser tweens.
import { forwardRef, useEffect, useReducer, useState } from 'react';
import { View as RNView, Text as RNText, ScrollView as RNScrollView } from './react-native';

// withSpring/withTiming return a descriptor; assigning it to a shared value means
// "animate to toValue" rather than "jump to it".
const ANIMATED = Symbol('animated');

export function withSpring(toValue, config) {
  return { [ANIMATED]: true, toValue, config, kind: 'spring' };
}

export function withTiming(toValue, config) {
  return { [ANIMATED]: true, toValue, config, kind: 'timing' };
}

export function withDelay(_delay, animation) {
  return animation;
}

export function useSharedValue(initial) {
  const [, rerender] = useReducer((n) => n + 1, 0);
  // Reanimated shared values mutate without re-rendering; here a render is exactly what
  // makes useAnimatedStyle produce the new target style, so writes force one.
  const [box] = useState(() => {
    let current = initial;
    const value = {
      animated: false,
      duration: 0,
      get value() {
        return current;
      },
      set value(next) {
        const isAnimated = next != null && typeof next === 'object' && next[ANIMATED];
        const resolved = isAnimated ? next.toValue : next;
        if (resolved === current) return;
        current = resolved;
        value.animated = !!isAnimated;
        value.duration = isAnimated ? springDuration(next.config) : 0;
        rerender();
      },
    };
    return value;
  });
  return box;
}

// Approximate a critically-damped spring's settle time so the CSS transition lasts about
// as long as the native one would.
function springDuration(config = {}) {
  const { stiffness = 100, damping = 10, mass = 1, duration } = config;
  if (duration) return duration;
  const settle = (4 * Math.PI * Math.sqrt(mass / stiffness)) / (damping / (2 * Math.sqrt(stiffness * mass)) || 1);
  return Math.min(1200, Math.max(180, Math.round(settle * 1000) / 4));
}

export function useAnimatedStyle(factory, deps) {
  void deps;
  return factory();
}

export function useDerivedValue(factory) {
  return { value: factory() };
}

export function interpolate(value, inputRange, outputRange, extrapolate) {
  void extrapolate;
  if (!inputRange || !outputRange) return value;
  if (value <= inputRange[0]) return outputRange[0];
  const last = inputRange.length - 1;
  if (value >= inputRange[last]) return outputRange[last];
  for (let i = 0; i < last; i += 1) {
    const [inMin, inMax] = [inputRange[i], inputRange[i + 1]];
    if (value >= inMin && value <= inMax) {
      const t = inMax === inMin ? 0 : (value - inMin) / (inMax - inMin);
      return outputRange[i] + t * (outputRange[i + 1] - outputRange[i]);
    }
  }
  return outputRange[last];
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return undefined;
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

export function runOnJS(fn) {
  return fn;
}

export function runOnUI(fn) {
  return fn;
}

// The transition that stands in for the worklet. Only transform is tweened: call sites
// pair the rotation with a hard opacity/backface swap that must land immediately.
const SPRING_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

function animated(Component) {
  return forwardRef(function Animated({ style, ...rest }, ref) {
    return (
      <Component
        ref={ref}
        style={[{ transition: `transform 480ms ${SPRING_EASING}`, willChange: 'transform' }, style]}
        {...rest}
      />
    );
  });
}

const AnimatedView = animated(RNView);

const Animated = {
  View: AnimatedView,
  Text: animated(RNText),
  ScrollView: animated(RNScrollView),
  createAnimatedComponent: animated,
};

export default Animated;
export { AnimatedView as View };
export const Easing = { linear: 'linear', ease: 'ease', inOut: (f) => f, out: (f) => f, bezier: () => 'ease' };
