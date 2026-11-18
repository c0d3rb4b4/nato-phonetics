import config from '../../app.json';

// App configuration is the displayed version source; publishing still requires
// package/app build metadata to be checked together in the release checklist.
export const APP_NAME = config.displayName;
export const APP_VERSION = config.version;
export const SUPPORT_URL = 'https://github.com/c0d3rb4b4/nato-phonetics/issues';
export const PRIVACY_UPDATED = '18 November 2026';
