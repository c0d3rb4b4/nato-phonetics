"""Verify and compare the ordinary four-ABI Release product, independently of runtime."""
import argparse
import gzip
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import zipfile


HERE = Path(__file__).resolve().parent
EVIDENCE = HERE.parents[1]
ROOT = EVIDENCE.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
from android_test_tools import build_tool, executable


ABIS = {'armeabi-v7a': (1, 40), 'arm64-v8a': (2, 183), 'x86': (1, 3), 'x86_64': (2, 62)}
UNSIGNED = 'app-release-unsigned.apk'
BUNDLE = 'app-release.aab'
SIGNED = 'app-release-local-test.apk'
JS = 'assets/index.android.bundle'
FONTS = {'assets/fonts/NatoTile-' + weight + '.ttf' for weight in ('ExtraBold', 'Italic', 'SemiBold')}
SIGNATURE = re.compile(r'META-INF/(?:MANIFEST\.MF|[^/]+\.(?:SF|RSA|DSA|EC))', re.I)
ABI_ENTRY = re.compile(r'(?:lib|base/lib|BUNDLE-METADATA/com\.android\.tools\.build\.debugsymbols)/([^/]+)/')


def check(condition, message):
    if not condition:
        raise ValueError(message)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def file_sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1 << 20), b''):
            digest.update(chunk)
    return digest.hexdigest()


def read_json(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def entries(product):
    with zipfile.ZipFile(product) as archive:
        result = {}
        for entry in archive.infolist():
            if not entry.is_dir():
                check(entry.filename not in result, f'Duplicate entry in {product.name}: {entry.filename}')
                result[entry.filename] = sha(archive.read(entry))
    return result


def differences(old, new):
    return {name: {'before': old.get(name), 'after': new.get(name)}
            for name in sorted(old.keys() | new.keys()) if old.get(name) != new.get(name)}


def project(contents, abi):
    """Keep all shared entries and only the chosen ABI's libraries and bundle debug symbols."""
    return {name: value for name, value in contents.items()
            if (match := ABI_ENTRY.match(name)) is None or match[1] == abi}


def historical(products, prior):
    comparisons = {}
    for abi in ABIS:
        path = (EVIDENCE / 'run27/android/release-artifacts.json' if abi == 'arm64-v8a' else
                EVIDENCE / f'run28/android/{abi}-artifacts.json')
        record = read_json(path)
        check(record['passed'] and record['abi'] == abi, f'Invalid prior {abi} identity')
        comparisons[f'{path.parent.parent.name}-{abi}'] = {}
        for name in (UNSIGNED, BUNDLE):
            old = record['artifacts'][name]
            new = project(products[name], abi)
            comparisons[f'{path.parent.parent.name}-{abi}'][name] = {
                'priorSha256': old['sha256'], 'beforeEntries': len(old['entries']), 'afterEntries': len(new),
                'differentEntries': differences(old['entries'], new),
            }
    previous = read_json(EVIDENCE / 'run31/android/product-identity.json')['artifacts']
    comparisons['run31-x86_64'] = {}
    for name in (UNSIGNED, BUNDLE):
        old = prior / name
        check(file_sha(old) == previous[name]['sha256'], f'Unexpected Run 31 {name}')
        old_entries = entries(old)
        new = project(products[name], 'x86_64')
        comparisons['run31-x86_64'][name] = {
            'priorSha256': previous[name]['sha256'], 'beforeEntries': len(old_entries), 'afterEntries': len(new),
            'differentEntries': differences(old_entries, new),
        }
    return comparisons


def compare_x86_64_native(products, prior, native_rows):
    """Test whether any differing library bytes are confined to the known GNU build ID."""
    previous = read_json(EVIDENCE / 'run31/android/product-identity.json')['nativeLibraries']
    results = {}
    with zipfile.ZipFile(prior / UNSIGNED) as old, zipfile.ZipFile(products / UNSIGNED) as new:
        for name, source in previous.items():
            current = native_rows[name.removeprefix('lib/')]
            if source['sha256'] == current['sha256']:
                continue
            before, after = old.read(name), new.read(name)
            old_id, new_id = bytes.fromhex(source['buildId']), bytes.fromhex(current['buildId'])
            offset = before.find(old_id)
            only_id = (old_id != new_id and len(old_id) == len(new_id) and
                       before.count(old_id) == after.count(new_id) == 1 and after.find(new_id) == offset and
                       before[:offset] == after[:offset] and before[offset+len(old_id):] == after[offset+len(new_id):])
            results[name] = {'run31BuildId': source['buildId'], 'currentBuildId': current['buildId'],
                             'differOnlyInGnuBuildIdBytes': only_id}
    return results


def native_inventory(contents, prefix):
    expected = {name.removeprefix('lib/x86_64/') for name in
                read_json(EVIDENCE / 'run31/android/product-identity.json')['nativeLibraries']}
    names = {name[len(prefix):] for name in contents if name.startswith(prefix)}
    required = {abi + '/' + lib for abi in ABIS for lib in expected}
    check(names == required, f'{prefix} inventory differs from the four complete ABI sets: {sorted(names ^ required)}')
    return sorted(names)


def build_id(readelf, path):
    notes = subprocess.check_output([readelf, '-n', path], text=True)
    ids = re.findall(r'Build ID: ([0-9a-f]+)', notes)
    check(len(ids) == 1, f'Expected a single GNU build ID in {path}')
    return ids[0]


def native(checkout, products, archives):
    apk, bundle = archives[UNSIGNED], archives[BUNDLE]
    libs = native_inventory(apk, 'lib/')
    check(libs == native_inventory(bundle, 'base/lib/'), 'APK and AAB ABI inventories differ')
    stripped = checkout / 'android/app/build/intermediates/stripped_native_libs/release/stripReleaseDebugSymbols/out/lib'
    prefab = checkout / 'node_modules/react-native/ReactAndroid/build/intermediates/prefab_package/release/prefab'
    sdk = Path(os.environ['ANDROID_HOME'])
    ndk = sdk / 'ndk/27.1.12297006/toolchains/llvm/prebuilt'
    host = {'darwin': 'darwin-x86_64', 'linux': 'linux-x86_64', 'win32': 'windows-x86_64'}[sys.platform]
    readelf = executable(ndk / host / 'bin/llvm-readelf')
    gradle = Path(os.environ.get('GRADLE_USER_HOME', Path.home() / '.gradle'))
    pinned = read_json(EVIDENCE / 'run31/host/maven-hermes-checksums.json')
    expected_aar = next(row['sha256'] for row in pinned if row['variant'] == 'release')
    aar = next((gradle / 'caches/modules-2/files-2.1/com.facebook.react/hermes-android/0.81.5')
               .glob('*/hermes-android-0.81.5-release.aar'))
    check(file_sha(aar) == expected_aar, 'Unexpected Release Hermes Maven AAR')
    results = {}
    with zipfile.ZipFile(aar) as hermes, zipfile.ZipFile(products / UNSIGNED) as archive:
        for entry in libs:
            abi, name = entry.split('/')
            digest = apk['lib/' + entry]
            local = stripped / entry
            check(digest == bundle['base/lib/' + entry] == file_sha(local), f'Stripped/APK/AAB mismatch: {entry}')
            with archive.open('lib/' + entry) as stream:
                header = stream.read(20)
            elf_class, machine = ABIS[abi]
            check(header[:6] == b'\x7fELF' + bytes([elf_class, 1]) and
                  int.from_bytes(header[18:20], 'little') == machine, f'Incorrect ELF in {entry}')
            record = {'sha256': digest, 'elfClass': elf_class, 'machine': machine, 'buildId': build_id(readelf, local)}
            if name in ('libreactnative.so', 'libjsi.so', 'libhermestooling.so'):
                module = name[3:-3]
                source = prefab / 'modules' / module / 'libs' / ('android.' + abi) / name
                source_id = build_id(readelf, source)
                check(source_id == record['buildId'], f'Prefab build ID mismatch: {entry}')
                record.update(prefabSha256=file_sha(source), prefabBuildId=source_id)
            if name == 'libhermes.so':
                record['mavenLibrarySha256'] = sha(hermes.read('jni/' + entry))
                check(record['mavenLibrarySha256'] == digest, f'Packaged Hermes differs from verified AAR: {entry}')
            results[entry] = record
    return {'mavenHermesReleaseAarSha256': expected_aar, 'libraries': results}


def source_headers(checkout):
    rn = checkout / 'node_modules/react-native'
    source_check = subprocess.check_output(['node', 'scripts/prepare-android-source.cjs', '--check'],
                                          cwd=checkout, text=True).strip()
    exported = rn / 'ReactAndroid/build/intermediates/prefab_package/release/prefab/modules/reactnative/include'
    headers = {}
    prior = read_json(EVIDENCE / 'run31/android/packaged-prefab-check.json')
    for entry in prior['packaged']:
        path = entry['path']
        digest = file_sha(exported / path)
        check(digest == entry['sha256'], 'Release prefab reviewed header mismatch: ' + path)
        headers[path] = digest
    return {'readOnlySourceGuard': source_check, 'guardNode': subprocess.check_output(['node', '--version'], text=True).strip(),
            'exportedHeaders': headers}


def source_assets(checkout, archives):
    apk, bundle = archives[UNSIGNED], archives[BUNDLE]
    assets = {name: digest for name, digest in apk.items() if name.startswith('assets/')}
    bundle_assets = {name.removeprefix('base/'): digest for name, digest in bundle.items() if name.startswith('base/assets/')}
    for profile in ('baseline.prof', 'baseline.profm'):
        bundle_assets['assets/dexopt/' + profile] = bundle['BUNDLE-METADATA/com.android.tools.build.profiles/' + profile]
    check(assets == bundle_assets, 'APK and AAB asset trees differ')
    check({name for name in assets if name.startswith('assets/fonts/')} == FONTS, 'Unexpected packaged fonts')
    for name in FONTS:
        check(assets[name] == file_sha(checkout / 'android/app/src/main' / name), f'Source font differs: {name}')
    generated = checkout / 'android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle'
    with generated.open('rb') as stream:
        check(stream.read(8).hex() == 'c61fbc03c103191f', 'Production JS is not Hermes bytecode')
    check(assets[JS] == file_sha(generated), 'APK JS differs from generated product bytecode')
    dex = {name: digest for name, digest in apk.items() if re.fullmatch(r'classes(?:\d+)?\.dex', name)}
    bundle_dex = {name.removeprefix('base/dex/'): digest for name, digest in bundle.items() if name.startswith('base/dex/')}
    check(dex and dex == bundle_dex, 'APK and AAB DEX payloads differ')
    return {'identicalAssets': len(assets), 'embedded': {name: assets[name] for name in sorted(FONTS | {JS})},
            'dex': dex}


def manifests_and_signatures(products, archives, out):
    apk, bundle, signed = (products / name for name in (UNSIGNED, BUNDLE, SIGNED))
    payload = {key: value for key, value in archives[SIGNED].items() if not SIGNATURE.fullmatch(key)}
    check(payload == archives[UNSIGNED], 'Engineering signature changed the original payload')
    signer = build_tool('apksigner')
    unsigned = subprocess.run([*signer, 'verify', '--verbose', apk], capture_output=True, text=True)
    message = unsigned.stdout + unsigned.stderr
    check(unsigned.returncode != 0 and 'DOES NOT VERIFY' in message and 'Missing META-INF/MANIFEST.MF' in message,
          f'Unexpected unsigned APK verification: {message}')
    verified = subprocess.check_output([*signer, 'verify', '--verbose', '--print-certs', signed], text=True)
    prior_signature = (EVIDENCE / 'run31/android/engineering-signature.log').read_text()
    cert_match = r'Signer #1 certificate SHA-256 digest: ([0-9a-f]{64})'
    cert = re.search(cert_match, verified)[1]
    check('Number of signers: 1' in verified and cert == re.search(cert_match, prior_signature)[1],
          'Unexpected engineering signer')
    jarsigner = executable(Path(os.environ['JAVA_HOME']) / 'bin/jarsigner')
    aab_signature = subprocess.check_output([jarsigner, '-J-Duser.language=en', '-verify', bundle], text=True)
    check('jar is unsigned' in aab_signature.lower(), f'Unexpected AAB signature: {aab_signature}')
    check(not any(SIGNATURE.fullmatch(name) for name in archives[BUNDLE]), 'Unexpected bundle signature entries')
    manifest = subprocess.check_output([*build_tool('aapt2'), 'dump', 'badging', apk], text=True)
    check("package: name='com.natophonetics.app'" in manifest and 'application-debuggable' not in manifest and
          'android.permission.RECORD_AUDIO' not in manifest, 'Unexpected release manifest or permissions')
    declared = re.findall(r"'([^']+)'", next(line for line in manifest.splitlines() if line.startswith('native-code:')))
    check(set(declared) == set(ABIS), f'Manifest ABI inventory differs: {declared}')
    (out / 'signature-checks.log').write_text(message + '\n' + aab_signature + '\n' + verified, encoding='utf-8')
    (out / 'product-manifest.log').write_text(manifest, encoding='utf-8')
    return {'originalApkUnsigned': True, 'originalBundleUnsigned': True, 'engineeringSignerCertificateSha256': cert,
            'identicalEngineeringPayloadEntries': len(payload), 'manifestAbis': declared,
            'nonDebuggable': True, 'requestedRecordAudio': False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('checkout', type=Path)
    parser.add_argument('products', type=Path)
    parser.add_argument('--prior-products', type=Path, default=ROOT / 'artifacts/run31/x86_64')
    parser.add_argument('--out', type=Path, default=HERE)
    args = parser.parse_args()
    archives = {name: entries(args.products / name) for name in (UNSIGNED, BUNDLE, SIGNED)}
    native_result = native(args.checkout, args.products, archives)
    assets = source_assets(args.checkout, archives)
    signatures = manifests_and_signatures(args.products, archives, args.out)
    comparison = historical(archives, args.prior_products)
    x86_native = compare_x86_64_native(args.products, args.prior_products, native_result['libraries'])
    report = {'artifacts': {name: {'sha256': file_sha(args.products / name), 'bytes': (args.products / name).stat().st_size,
                                   'entries': len(archives[name])} for name in archives},
              **native_result, **source_headers(args.checkout), **assets, **signatures,
              'comparedEntries': {label: {name: len(stats['differentEntries']) for name, stats in group.items()}
                                  for label, group in comparison.items()},
              'differentX86_64LibrariesComparedWithRun31': x86_native,
              'runtime': 'Separate observed runtime evidence is required.', 'passed': True}
    raw = json.dumps({name: archives[name] for name in (UNSIGNED, BUNDLE)}, sort_keys=True, indent=2).encode()
    (args.out / 'entries.json.gz').write_bytes(gzip.compress(raw, mtime=0))
    (args.out / 'prior-payload-comparisons.json').write_text(json.dumps(comparison, indent=2) + '\n', encoding='utf-8')
    (args.out / 'product-identity.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'artifacts': report['artifacts'], 'comparedEntries': report['comparedEntries']}, indent=2))


if __name__ == '__main__':
    main()
