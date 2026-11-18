// Versioned logical metrics. All contexts use this composition without overrides.
export const TILE_DESIGN = Object.freeze({
  version: 1,
  colors: Object.freeze({ text: '#1F2933', guide: '#374151', divider: 'rgba(0,0,0,0.1)' }),
  width: 110,
  height: 150,
  radius: 12,
  headerHeight: 60,
  divider: 2,
  paddingHorizontal: 8,
  paddingVertical: 12,
  wordGap: 6,
  letter: Object.freeze({ x: 0, y: 4, width: 110, height: 50, size: 36, weight: '800', family: 'NatoTile-ExtraBold', baseline: 40.844 }),
  word: Object.freeze({ x: 8, y: 83, width: 94, height: 22, size: 16, weight: '600', family: 'NatoTile-SemiBold', baseline: 99.264 }),
  pronunciation: Object.freeze({ x: 8, y: 111, width: 94, height: 16, size: 11, weight: '400', family: 'NatoTile-Italic', baseline: 122.619 }),
});

/** @param {number} contextScale @param {number} fontScale */
export function tileScale(contextScale = 1, fontScale = 1) {
  if (!Number.isFinite(contextScale) || contextScale <= 0 || !Number.isFinite(fontScale) || fontScale <= 0) {
    throw new Error('Tile scale must be positive and finite.');
  }
  return contextScale * fontScale;
}
