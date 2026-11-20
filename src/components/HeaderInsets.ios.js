import { useState } from 'react';
import { requireNativeComponent, StyleSheet, View } from 'react-native';

/** @typedef {{left: number, right: number}} Insets */
/** @type {import('react').ComponentType<import('react-native').ViewProps & {
 * onInsetsChange: (event: import('react-native').NativeSyntheticEvent<Insets>) => void
 * }>} */
const NativeHeaderInsets = requireNativeComponent('NatoHeaderInsets');

/** Read the actual header's corner-adapted region as the scene changes.
 * @param {{children: import('react').ReactNode}} props */
export function HeaderInsets({ children }) {
  const [insets, setInsets] = useState({ left: 0, right: 0 });
  return <View testID="header-insets" style={{ paddingLeft: insets.left, paddingRight: insets.right }}>
    <NativeHeaderInsets pointerEvents="none" style={StyleSheet.absoluteFill}
      onInsetsChange={({ nativeEvent }) => setInsets(previous =>
        previous.left === nativeEvent.left && previous.right === nativeEvent.right ? previous
          : { left: nativeEvent.left, right: nativeEvent.right })} />
    {children}
  </View>;
}
