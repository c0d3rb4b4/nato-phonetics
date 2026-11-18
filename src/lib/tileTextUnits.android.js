import { NativeModules } from 'react-native';

/** @type {{spForUniformDp(targetDp: number): number} | undefined} */
const typography = NativeModules.TileTypography;
/** @param {number} base @param {number} contextScale @param {number} fontScale */
export function tileTextUnits(base, contextScale, fontScale) {
  if (!typography) throw new Error('The native tile typography adapter is missing. Rebuild this app.');
  // Dimensions can report a new fontScale before React Native's renderer
  // metrics change after an Activity/configuration transition. Always invert
  // the metrics PixelUtil actually uses; a cached result for the same reported
  // scale/density can otherwise produce enlarged, clipped glyphs on return.
  const result = typography.spForUniformDp(base * contextScale * fontScale);
  if (!Number.isFinite(result) || result <= 0) throw new Error('The native tile typography adapter returned an invalid size.');
  return result;
}
