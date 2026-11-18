import { useWindowDimensions } from 'react-native';

// Native fonts are synchronously validated and registered before React starts.
export function useTileEnvironment() {
  const { fontScale } = useWindowDimensions();
  return { fontScale, textScale: 1, ready: true, error: '' };
}
