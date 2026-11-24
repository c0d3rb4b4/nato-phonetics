/** Android added the on-device recognition factory in API 31. Provider, model
 * and permission checks still run when the learner chooses to record.
 * @param {{OS: string, Version?: number | string}} platform */
export function getSpokenPracticeSupport(platform) {
  const android = platform.OS === 'android';
  const eligible = android && Number(platform.Version) >= 31;
  return {
    eligible,
    versionNotice: android && !eligible ? 'Spoken answers require Android 12 or later.' : '',
  };
}
