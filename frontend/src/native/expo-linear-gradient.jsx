// expo-linear-gradient shim — RN's {x,y} start/end vectors become a CSS gradient angle.
import { View } from './react-native';

function angleFromVector(start = { x: 0.5, y: 0 }, end = { x: 0.5, y: 1 }) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  // CSS gradient angles run clockwise from "to top" (0deg); RN's y axis points down.
  return (Math.atan2(dx, dy) * 180) / Math.PI;
}

export function LinearGradient({ colors = [], locations, start, end, style, children, ...rest }) {
  const stops = colors
    .map((color, i) => (locations?.[i] != null ? `${color} ${locations[i] * 100}%` : color))
    .join(', ');
  const background = `linear-gradient(${angleFromVector(start, end)}deg, ${stops})`;
  return (
    <View style={[style, { backgroundImage: background }]} {...rest}>
      {children}
    </View>
  );
}

export default LinearGradient;
