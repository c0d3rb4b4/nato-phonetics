import { View } from 'react-native';

/** Decorative icons built from platform drawing primitives; no font download.
 * Coordinates use a 24×24 grid and scale with the requested size.
 * @param {{name: import('../types').IconName, size?: number, color: string}} props */
export function Icon({ name, size = 24, color }) {
  /** @param {number} x @param {number} y @param {number} width @param {number} height @param {number} [rotation] */
  const line = (x, y, width, height = 2, rotation = 0) => <View key={`${x}:${y}:${width}:${height}:${rotation}`}
    style={{ position: 'absolute', left: x, top: y, width, height, borderRadius: 1, backgroundColor: color, transform: [{ rotate: `${rotation}deg` }] }} />;
  /** @param {number} x @param {number} y @param {number} width @param {number} height @param {number} [radius] */
  const box = (x, y, width, height, radius = 2) => <View key={`box:${x}:${y}:${width}:${height}`}
    style={{ position: 'absolute', left: x, top: y, width, height, borderRadius: radius, borderWidth: 1.8, borderColor: color }} />;
  let marks;
  switch (name) {
    case 'menu': case 'menu-outline': marks = [line(3, 5, 18), line(3, 11, 18), line(3, 17, 18)]; break;
    case 'home-outline': marks = [line(2, 7, 13, 2, -42), line(10, 7, 13, 2, 42), box(5, 9, 14, 12), box(10, 15, 4, 6)]; break;
    case 'book-outline': marks = [box(2, 3, 10, 18), box(12, 3, 10, 18), line(5, 7, 4), line(15, 7, 4)]; break;
    case 'text-outline': marks = [line(3, 3, 18), line(11, 3, 2, 18), line(7, 19, 10)]; break;
    case 'chevron-forward': marks = [line(8, 7, 9, 2, 45), line(8, 13, 9, 2, -45)]; break;
    case 'mic-outline': marks = [box(8, 1, 8, 14, 5), box(5, 8, 14, 10, 7), line(11, 17, 2, 5), line(7, 21, 10)]; break;
    case 'volume-high-outline': marks = [box(2, 9, 5, 7, 0), box(7, 5, 6, 15, 1), line(16, 8, 2, 9), line(21, 5, 2, 15)]; break;
    case 'shield-checkmark-outline': marks = [box(3, 2, 18, 20, 8), line(6, 12, 6, 2, 45), line(10, 10, 9, 2, -45)]; break;
    case 'settings-outline': marks = [box(5, 5, 14, 14, 7), box(9, 9, 6, 6, 3), line(11, 1, 2, 4), line(11, 19, 2, 4), line(1, 11, 4), line(19, 11, 4)]; break;
    case 'help-circle-outline': marks = [box(1, 1, 22, 22, 11), box(8, 5, 8, 7, 4), line(11, 11, 2, 4), line(11, 18, 2)]; break;
    default: marks = [box(1, 1, 22, 22, 11), line(11, 10, 2, 9), line(11, 5, 2)];
  }
  return <View accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden
    style={{ width: size, height: size, flexShrink: 0 }}>
    <View style={{ width: 24, height: 24, position: 'absolute', left: (size - 24) / 2, top: (size - 24) / 2, transform: [{ scale: size / 24 }] }}>{marks}</View>
  </View>;
}
