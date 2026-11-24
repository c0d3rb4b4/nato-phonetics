import { useState } from 'react';
import { requireNativeComponent, StyleSheet, View } from 'react-native';

/** @typedef {{docked: boolean, bottom: number}} KeyboardInsets */
/** @type {import('react').ComponentType<import('react-native').ViewProps & {
 * onKeyboardInsetsChange: (event: import('react-native').NativeSyntheticEvent<KeyboardInsets>) => void
 * }>} */
const NativeKeyboardInsets = requireNativeComponent('NatoKeyboardInsets');

/** @param {{children: import('react').ReactNode, tabs: import('react').ReactNode}} props */
export function KeyboardViewport({ children, tabs }) {
  const [keyboardBottom, setKeyboardBottom] = useState(/** @type {number | null} */ (null));
  const docked = keyboardBottom !== null;
  return <View style={{ flex: 1 }}>
    <NativeKeyboardInsets style={StyleSheet.absoluteFill} pointerEvents="none" importantForAccessibility="no"
      onKeyboardInsetsChange={({ nativeEvent }) => setKeyboardBottom(nativeEvent.docked ? nativeEvent.bottom : null)} />
    <View style={{ flex: 1, paddingBottom: keyboardBottom ?? 0 }}>
      {children}
    </View>
    {/* Keep the footer's bottom safe area measured throughout the IME animation. */}
    <View collapsable={false} style={docked && styles.coveredTabs} pointerEvents={docked ? 'none' : 'auto'}
      importantForAccessibility={docked ? 'no-hide-descendants' : 'auto'}>
      {tabs}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  coveredTabs: { position: 'absolute', bottom: 0, left: 0, right: 0, opacity: 0 },
});
