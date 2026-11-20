/** Replaceable platform boundary; deprecated Clipboard is confined here for
 * the pinned RN 0.81.5 runtime. Reassess on a framework upgrade.
 * @param {string} text */
export async function copyConversion(text) {
  const { Clipboard } = require('react-native');
  Clipboard.setString(text);
}

/** Android confirms opening the sheet, not delivery to another application.
 * @param {string} text
 * @returns {Promise<'opened' | 'cancelled' | 'unavailable'>} */
export async function shareConversion(text) {
  const { Share } = require('react-native');
  const result = await Share.share({ message: text });
  return result.action === Share.dismissedAction ? 'cancelled' : 'opened';
}
