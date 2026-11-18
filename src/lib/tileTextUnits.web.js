/** Browser accessibility/root text scale is measured by the grid's rem probe.
 * @param {number} base @param {number} contextScale @param {number} fontScale */
export function tileTextUnits(base, contextScale, fontScale) {
  return base * contextScale * fontScale;
}
