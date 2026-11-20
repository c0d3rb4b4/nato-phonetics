"""Inspect the packaged Android products using the pinned SDK, JDK and standard library."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
from zipfile import ZipFile

from android_test_tools import build_tool, executable


ROOT = Path(__file__).resolve().parents[1]
DEV_CERT = 'fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c'
MACHINES = {'armeabi-v7a': (1, 40), 'arm64-v8a': (2, 183), 'x86': (1, 3), 'x86_64': (2, 62)}
SIGNATURE = re.compile(r'META-INF/[^/]+\.(SF|RSA|DSA|EC)', re.I)


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def command(args, *, check=True):
    result = subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
                            encoding='utf-8', errors='replace', timeout=120)
    if check and result.returncode:
        raise ValueError(f'{Path(args[0]).name} failed ({result.returncode}): {result.stdout}')
    return result


def jdk_tool(name):
    return [executable(Path(os.environ['JAVA_HOME']) / 'bin' / name),
            '-J-Duser.language=en', '-J-Duser.country=US']


def manifest(apk):
    output = command([*build_tool('aapt2'), 'dump', 'badging', apk]).stdout
    match = re.search(r"^package: name='([^']+)' versionCode='(\d+)' versionName='([^']+)'", output, re.M)
    require(match, 'Missing Android package or version')
    return dict(packageId=match[1], versionCode=int(match[2]), version=match[3],
                debuggable='application-debuggable' in output.splitlines())


def payload(archive, prefix, abis, bundled):
    """Map comparable paths in the APK and the bundle base module to their content hashes."""
    names = archive.namelist()
    require(len(set(names)) == len(names), 'Duplicate ZIP entries')
    libs = {}
    for name in names:
        match = re.fullmatch(re.escape(prefix) + r'lib/([^/]+)/([^/]+\.so)', name)
        if not match:
            continue
        abi, library = match.groups()
        data = archive.read(name)
        require(abi in abis and len(data) >= 20 and data[:4] == b'\x7fELF' and data[5] == 1 and
                (data[4], int.from_bytes(data[18:20], 'little')) == MACHINES[abi], f'Wrong ELF ABI in {name}')
        libs.setdefault(abi, {})[library] = sha(data)
    require(set(libs) == set(abis), 'Configured and packaged ABI sets differ')
    for abi, names_to_hash in libs.items():
        require({'libhermes.so', 'libreactnative.so', 'libjsi.so'} <= names_to_hash.keys(),
                f'Missing runtime libraries for {abi}')
    fonts = {}
    for source in sorted((ROOT / 'android/app/src/main/assets/fonts').glob('*.ttf')):
        font = 'assets/fonts/' + source.name
        fonts[font] = sha(archive.read(prefix + font))
        require(fonts[font] == sha(source.read_bytes()), f'Wrong packaged font: {font}')
    require(fonts, 'No source fonts')
    bundle = None
    if bundled:
        data = archive.read(prefix + 'assets/index.android.bundle')
        require(data.startswith(bytes.fromhex('c61fbc03c103191f')), 'Missing bundled Hermes bytecode')
        bundle = sha(data)
    dex_prefix = prefix + 'dex/' if prefix else ''
    dex_names = [n for n in names if re.fullmatch(re.escape(dex_prefix) + r'classes\d*\.dex', n)]
    require(dex_prefix + 'classes.dex' in dex_names, 'Missing packaged DEX')
    dex = {n[len(dex_prefix):]: sha(archive.read(n)) for n in dex_names}
    return dict(nativeLibraries=libs, fonts=fonts, bundleSha256=bundle, dex=dex)


def apk_signing(apk):
    result = command([*build_tool('apksigner'), 'verify', '--verbose', '--print-certs', apk], check=False)
    if result.returncode == 0:
        certificates = re.findall(r'^Signer #\d+ certificate SHA-256 digest: ([0-9a-fA-F]{64})$',
                                  result.stdout, re.M)
        require(len(certificates) == 1, 'Expected one verified APK signer')
        return certificates[0].lower()
    # Only the known, complete unsigned case qualifies. Broken signing blocks, V1
    # signatures or other verifier errors must not become a successful unsigned build.
    with ZipFile(apk) as archive, apk.open('rb') as stream:
        stream.seek(archive.start_dir - 16)
        require(not any(SIGNATURE.fullmatch(n) for n in archive.namelist()) and
                stream.read(16) != b'APK Sig Block 42' and
                result.stdout.strip().splitlines() == ['DOES NOT VERIFY', 'ERROR: Missing META-INF/MANIFEST.MF'],
                'Invalid APK signature: ' + result.stdout)
    return None


def aab_signing(aab, archive):
    output = command([*jdk_tool('jarsigner'), '-verify', aab]).stdout
    if 'jar is unsigned.' in output:
        require(not any(SIGNATURE.fullmatch(n) for n in archive.namelist()), 'Unverifiable AAB signature')
        return None
    require('jar verified.' in output and 'unsigned entries' not in output, 'Invalid/incomplete AAB signature: ' + output)
    certificate = command([*jdk_tool('keytool'), '-printcert', '-jarfile', aab]).stdout
    # A chain may include issuer certificates. Only the first leaf identifies this signer.
    require('Signer #2:' not in certificate, 'Multiple AAB signers')
    match = re.search(r'SHA256:\s*((?:[0-9A-F]{2}:){31}[0-9A-F]{2})', certificate)
    require(match, 'Missing AAB signer certificate')
    return match[1].replace(':', '').lower()


def inspect(mode, apk, aab):
    develop = mode == 'android-develop'
    release = mode == 'android-release'
    require(release == bool(aab), 'Release requires an APK and AAB together')
    abi_config = (ROOT / 'android/gradle.properties').read_text()
    abis = re.search(r'^reactNativeArchitectures=(.+)$', abi_config, re.M)[1].strip().split(',')
    actual = manifest(apk)
    expected_version = json.loads((ROOT / 'package.json').read_text())['version'] + ('-dev' if develop else '')
    require(actual['packageId'] == 'com.natophonetics.app' + ('.dev' if develop else '') and
            actual['version'] == expected_version and actual['versionCode'] > 0 and
            actual['debuggable'] == (mode == 'android-debug'), f'Unexpected APK manifest: {actual}')
    with ZipFile(apk) as archive:
        contents = payload(archive, '', abis, mode != 'android-debug')
    cert = apk_signing(apk)
    if release:
        with ZipFile(aab) as archive, tempfile.TemporaryDirectory() as temp:
            # SDK aapt2 reads a proto APK. Preserve the exact manifest/resources bytes
            # from the AAB base module in the two locations aapt2 expects.
            base = Path(temp) / 'base.apk'
            with ZipFile(base, 'w') as package:
                for name, target in [('base/manifest/AndroidManifest.xml', 'AndroidManifest.xml'),
                                     ('base/resources.pb', 'resources.pb')]:
                    package.writestr(target, archive.read(name))
            require(manifest(base) == actual, 'APK/AAB manifest disagreement')
            require(payload(archive, 'base/', abis, True) == contents, 'APK/AAB packaged payloads differ')
            require(aab_signing(aab, archive) == cert, 'APK/AAB signing identities differ')
        require(cert != DEV_CERT, 'Release artifacts use the public development certificate')
        supplied = [bool(os.environ.get('NATO_UPLOAD_' + name, '').strip()) for name in
                    ('STORE_FILE', 'STORE_PASSWORD', 'KEY_ALIAS', 'KEY_PASSWORD')]
        require(all(supplied) == bool(cert) and all(supplied) == any(supplied),
                'Release artifact signing differs from the supplied release configuration')
    else:
        require(cert == DEV_CERT, 'Development APK signer differs from the stable development identity')
    files = {p.name: dict(bytes=p.stat().st_size, sha256=sha(p.read_bytes())) for p in [apk, aab] if p}
    return dict(platform='android', mode=mode, **actual, abis=abis,
                signing='unsigned' if not cert else 'release-signed' if release else 'development-signed',
                certificateSha256=cert, files=files, **contents)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=['android-debug', 'android-develop', 'android-release'])
    parser.add_argument('apk', type=Path)
    parser.add_argument('aab', type=Path, nargs='?')
    args = parser.parse_args()
    print(json.dumps(inspect(args.mode, args.apk, args.aab), indent=2))
