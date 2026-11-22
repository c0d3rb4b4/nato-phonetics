module.exports = {
  dependencies: {
    // Android compiles the pinned bridge sources with the app's current AGP.
    'react-native-tts': { platforms: { android: null } },
  },
  project: {
    android: { sourceDir: './android' },
    ios: { sourceDir: './ios' },
  },
};
