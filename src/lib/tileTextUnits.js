/** iOS supplies linear accessibility scaling while laying out native Text.
 * @param {number} base @param {number} contextScale @param {number} _fontScale */
export function tileTextUnits(base, contextScale, _fontScale) {
  return base * contextScale;
}
