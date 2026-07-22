// react-native-svg shim. RN's Svg components are one-to-one with the DOM SVG elements,
// so these are thin renames (Svg -> <svg>, Path -> <path>, ...).
import { css } from './style';

export function Svg({ width, height, viewBox, fill, style, children, ...rest }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      fill={fill}
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, ...css(style) }}
      {...rest}
    >
      {children}
    </svg>
  );
}

export const Path = (props) => <path {...props} />;
export const Circle = (props) => <circle {...props} />;
export const Rect = (props) => <rect {...props} />;
export const G = (props) => <g {...props} />;
export const Line = (props) => <line {...props} />;
export const Defs = (props) => <defs {...props} />;
export const Stop = (props) => <stop {...props} />;
export const LinearGradient = (props) => <linearGradient {...props} />;
export const Text = (props) => <text {...props} />;
export const Polygon = (props) => <polygon {...props} />;

export default Svg;
