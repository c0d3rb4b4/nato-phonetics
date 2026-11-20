/** @param {string} text */
export async function copyConversion(text) {
  if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
  await navigator.clipboard.writeText(text);
}

/** No silent clipboard write when sharing is denied or unsupported.
 * @param {string} text */
export async function shareConversion(text) {
  if (!navigator.share) return 'unavailable';
  try {
    await navigator.share({ text });
    return 'opened';
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return 'cancelled';
    throw error;
  }
}
