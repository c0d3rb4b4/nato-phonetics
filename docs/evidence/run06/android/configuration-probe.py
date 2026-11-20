from verify_native import *
route('alphabet',cold=True);expect(desc='Play A, Alfa',timeout=60)
for scale in [2,1]:
    adb('shell','settings','put','system','font_scale',str(scale));time.sleep(3)
    print(json.dumps({'systemFontScale':scale,'runtime':runtime("(()=>{const modules=[...__r.getModules().values()];return {dimensions:modules.find(m=>m.verboseName.endsWith('/Dimensions.js')).publicModule.exports.default.get('window'),flag:modules.find(m=>m.verboseName.endsWith('/ReactNativeFeatureFlags.js')).publicModule.exports.enableFontScaleChangesUpdatingLayout()};})()")}),flush=True)
(OUT/'diagnostics'/'font-scale-probe'/'native-context.log').write_text(adb('logcat','-d','-s','NatoFontScale:I'))
