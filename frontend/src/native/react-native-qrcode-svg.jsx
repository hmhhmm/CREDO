// react-native-qrcode-svg shim. Same props, backed by qrcode.react's SVG renderer
// (react-native-qrcode-svg itself is a react-native-svg wrapper around the same
// QR encoding, so the output is equivalent).
import { QRCodeSVG } from 'qrcode.react';

export default function QRCode({
  value,
  size = 100,
  color = '#000000',
  backgroundColor = '#ffffff',
  ecl = 'M',
}) {
  return <QRCodeSVG value={value} size={size} fgColor={color} bgColor={backgroundColor} level={ecl} />;
}
