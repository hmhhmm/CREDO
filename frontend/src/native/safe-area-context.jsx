// react-native-safe-area-context shim.
// The web app renders inside a phone-shaped column, so the only real insets come from
// iOS Safari's notch/home-indicator via env(safe-area-inset-*). Those are CSS-only
// values, so SafeAreaView applies them as padding and useSafeAreaInsets reports the
// numeric values it can measure (0 on desktop).
import { createContext, useContext, useEffect, useState } from 'react';
import { View } from './react-native';

const InsetsCtx = createContext({ top: 0, right: 0, bottom: 0, left: 0 });

function readEnvInsets() {
  if (typeof window === 'undefined' || !window.getComputedStyle) return { top: 0, right: 0, bottom: 0, left: 0 };
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:fixed;visibility:hidden;top:env(safe-area-inset-top,0px);right:env(safe-area-inset-right,0px);' +
    'bottom:env(safe-area-inset-bottom,0px);left:env(safe-area-inset-left,0px);';
  document.body.appendChild(probe);
  const s = window.getComputedStyle(probe);
  const insets = {
    top: parseFloat(s.top) || 0,
    right: parseFloat(s.right) || 0,
    bottom: parseFloat(s.bottom) || 0,
    left: parseFloat(s.left) || 0,
  };
  probe.remove();
  return insets;
}

export function SafeAreaProvider({ children, style }) {
  const [insets, setInsets] = useState({ top: 0, right: 0, bottom: 0, left: 0 });

  useEffect(() => {
    const measure = () => setInsets(readEnvInsets());
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, []);

  return (
    <InsetsCtx.Provider value={insets}>
      <View style={[{ flex: 1 }, style]}>{children}</View>
    </InsetsCtx.Provider>
  );
}

export function useSafeAreaInsets() {
  return useContext(InsetsCtx);
}

export function useSafeAreaFrame() {
  return { x: 0, y: 0, width: typeof window === 'undefined' ? 0 : window.innerWidth, height: typeof window === 'undefined' ? 0 : window.innerHeight };
}

const ALL_EDGES = ['top', 'right', 'bottom', 'left'];

export function SafeAreaView({ style, children, edges = ALL_EDGES, mode = 'padding', ...rest }) {
  const insets = useSafeAreaInsets();
  const prop = mode === 'margin' ? 'margin' : 'padding';
  const applied = {};
  for (const edge of edges) {
    const value = insets[edge];
    if (value) applied[`${prop}${edge[0].toUpperCase()}${edge.slice(1)}`] = value;
  }
  // Every screen wraps its content in a SafeAreaView, sitting as a sibling *after* the
  // full-bleed ScreenBackground. That makes it the one place to constrain the content
  // column at desktop widths without also constraining the background — see the
  // .rn-safe-area rule in native.css.
  return (
    <View style={[style, applied]} className="rn-safe-area" {...rest}>
      {children}
    </View>
  );
}

export const SafeAreaInsetsContext = InsetsCtx;
export const initialWindowMetrics = { insets: { top: 0, right: 0, bottom: 0, left: 0 }, frame: { x: 0, y: 0, width: 0, height: 0 } };
