const path = require('node:path');
const {getDefaultConfig,mergeConfig}=require('@react-native/metro-config');
const root=path.resolve(__dirname,'../../../..');
module.exports=mergeConfig(getDefaultConfig(root),{
  projectRoot:root,
  server:{rewriteRequestUrl:url=>url.replace('/index.bundle','/docs/evidence/run20/android/fixture.bundle')},
});
