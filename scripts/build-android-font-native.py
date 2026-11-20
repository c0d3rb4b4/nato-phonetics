"""Compile a real Android renderer regression against an explicit RN prefab.

Usage: python3 scripts/build-android-font-native.py PREFAB OUTPUT [--release]
PREFAB is an extracted react-android/prefab directory from the exact candidate.
Run the resulting executable with that candidate's libs on the test emulator.
"""
import hashlib,json,os,subprocess,sys
from pathlib import Path

root=Path(__file__).resolve().parents[1]
prefab=Path(sys.argv[1]).resolve()
out=Path(sys.argv[2]).resolve();out.mkdir(parents=True,exist_ok=True)
release='--release' in sys.argv[3:]
sdk=Path(os.environ['ANDROID_HOME'])
ndk=sdk/'ndk/27.1.12297006/toolchains/llvm/prebuilt/darwin-x86_64'
rn=root/'node_modules/react-native'
if json.loads((rn/'package.json').read_text())['version']!='0.81.5':
    raise RuntimeError('Re-review native harness for new RN version')
compiler=ndk/'bin/clang++'
fbjni=next((Path.home()/'.gradle/caches/8.14.3/transforms').glob('*/transformed/fbjni-0.7.0/prefab/modules/fbjni'))
libraries={}
for name in ['reactnative','jsi']:
    libraries[name]=prefab/f'modules/{name}/libs/android.arm64-v8a/lib{name}.so'
    if not libraries[name].is_file():raise RuntimeError(f'Missing {libraries[name]}')
symbols=subprocess.check_output([str(ndk/'bin/llvm-nm'),'-D','--defined-only',str(libraries['reactnative'])],text=True)
debug_abi='_ZN8facebook5react8SealableC' in symbols
if release == debug_abi:
    raise RuntimeError('Native harness mode must match the library Sealable/debug-string ABI; use --release for Release prefab')
new_abi='configureYogaTreeEff' in symbols
header=prefab/'modules/reactnative/include/react/renderer/components/view/YogaLayoutableShadowNode.h'
patch=json.loads((root/'scripts/patches/react-native-0.81.5-font-environment.json').read_text())
guard=next(file for file in patch['files'] if file['path'].endswith('YogaLayoutableShadowNode.h'))
expected=guard['patchedSha256' if new_abi else 'originalSha256']
if hashlib.sha256(header.read_bytes()).hexdigest()!=expected:
    raise RuntimeError('Exported Yoga header/library ABI mismatch; regenerate source prefab headers before compiling')
cache_guard=next((file for file in patch['files'] if file['path'].endswith('/TextMeasureCache.h')),None)
if cache_guard:
    cache_header=prefab/'modules/reactnative/include/react/renderer/textlayoutmanager/TextMeasureCache.h'
    cache_generation=b'getTextMeasurementGeneration' in libraries['reactnative'].read_bytes()
    cache_expected=cache_guard['patchedSha256' if cache_generation else 'originalSha256']
    if hashlib.sha256(cache_header.read_bytes()).hexdigest()!=cache_expected:
        raise RuntimeError('Exported text-cache header/library ABI mismatch; regenerate source prefab headers')
context_generation_abi='configureYogaTreeEffm8YGErratab' in symbols
for suffix,exported in [('/core/LayoutContext.h','react/renderer/core/LayoutContext.h'),('/fabric/SurfaceHandlerBinding.h','react/fabric/SurfaceHandlerBinding.h')]:
    guard=next((file for file in patch['files'] if file['path'].endswith(suffix)),None)
    if guard:
        expected_header=guard['patchedSha256' if context_generation_abi else 'originalSha256']
        actual_header=prefab/'modules/reactnative/include'/exported
        if hashlib.sha256(actual_header.read_bytes()).hexdigest()!=expected_header:
            raise RuntimeError('Exported context/surface header/library ABI mismatch: '+exported)
command=[str(compiler),'--target=aarch64-none-linux-android24',f'--sysroot={ndk}/sysroot','-std=c++20','-fexceptions','-frtti','-g1','-O0','-DANDROID','-DRN_SERIALIZABLE_STATE','-DFOLLY_NO_CONFIG=1','-DFOLLY_MOBILE=1','-DFOLLY_USE_LIBCPP=1','-DFOLLY_CFG_NO_COROUTINES=1','-DFOLLY_HAVE_CLOCK_GETTIME=1','-DFOLLY_HAVE_RECVMMSG=1','-DFOLLY_HAVE_PTHREAD=1','-DFOLLY_HAVE_XSI_STRERROR_R=1',f'-I{prefab}/modules/reactnative/include',f'-I{prefab}/modules/jsi/include',f'-I{fbjni}/include',f'-I{rn}/ReactCommon',f'-I{rn}/ReactCommon/react/renderer/graphics/platform/android',f'-I{rn}/ReactCommon/react/renderer/components/view/platform/android',str(root/'scripts/native-tests/font-environment.cpp'),str(libraries['reactnative']),str(libraries['jsi']),str(fbjni/'libs/android.arm64-v8a/libfbjni.so'),'-llog','-landroid','-o',str(out/'font-environment')]
if release:
    # Match the production class layout in react/debug/flags.h. The harness's
    # six explicit result predicates remain identical in both variants.
    command[command.index('-O0')]='-O2'
    command.insert(1,'-DNDEBUG')
result=subprocess.run(command,capture_output=True,text=True)
(out/'compile.log').write_text(result.stdout+result.stderr)
(out/'compile.json').write_text(json.dumps({'command':command,'buildVariant':'Release' if release else 'Debug','libraryDebugAbi':debug_abi,'exitCode':result.returncode,'libraries':{name:{'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for name,p in libraries.items()}},indent=2)+'\n')
if result.returncode==0:
    report=json.loads((out/'compile.json').read_text())
    report['executableSha256']=hashlib.sha256((out/'font-environment').read_bytes()).hexdigest()
    report['fontEnvironmentAbi']=new_abi
    report['exportedYogaHeaderSha256']=expected
    (out/'compile.json').write_text(json.dumps(report,indent=2)+'\n')
print(result.stdout+result.stderr,end='')
sys.exit(result.returncode)
