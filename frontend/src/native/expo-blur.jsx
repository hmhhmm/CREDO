// expo-blur shim. backdrop-filter is the browser's native equivalent of BlurView, and
// unlike the native module it degrades to a plain translucent tint where unsupported.
import { View } from './react-native';

export function BlurView({ intensity = 50, tint = 'default', style, children, ...rest }) {
  const radius = Math.max(1, Math.round(intensity * 0.25));
  const overlay =
    tint === 'dark'
      ? 'rgba(16,25,43,0.35)'
      : tint === 'light'
        ? 'rgba(255,255,255,0.35)'
        : 'rgba(255,255,255,0.20)';
  return (
    <View
      style={[
        style,
        {
          backdropFilter: `blur(${radius}px) saturate(140%)`,
          WebkitBackdropFilter: `blur(${radius}px) saturate(140%)`,
          backgroundColor: overlay,
        },
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

export default { BlurView };
