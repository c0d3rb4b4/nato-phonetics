import { View } from 'react-native';

/** Header-local platform chrome avoidance. Ordinary safe areas stay in RootLayout.
 * @param {{children: import('react').ReactNode}} props */
export function HeaderInsets({ children }) {
  return <View>{children}</View>;
}
