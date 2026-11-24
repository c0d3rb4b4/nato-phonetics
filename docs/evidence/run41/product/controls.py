"""From the app root: python docs/evidence/run41/product/controls.py <Run 38 scoped-unsigned.apk>."""
from hashlib import sha256
import json
import os
from pathlib import Path
import runpy
import subprocess
import sys
import tempfile
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / 'scripts'))
inspector = runpy.run_path(str(ROOT / 'scripts/verify-android-product.py'))


def expected_rejection(check, error):
    try:
        check()
    except ValueError as exc:
        if str(exc) == error:
            return str(exc)
        raise
    raise AssertionError('Expected rejection: ' + error)


def old_classes(apk):
    digest = sha256(apk.read_bytes()).hexdigest()
    recorded = json.loads((ROOT / 'docs/evidence/run38/controls.json').read_text())
    expected = next(item for item in recorded['products'] if item['input'].endswith('/scoped-unsigned.apk'))
    assert digest == expected['sha256']
    with ZipFile(apk) as archive:
        classes = set().union(*(inspector['speech_classes'](archive.read(name))
                                for name in set(expected['definitions'].values())))
        assert {name.decode('ascii') for name in classes} == set(expected['definitions'])
        reason = expected_rejection(
            lambda: inspector['payload'](archive, '', ['x86_64'], True),
            'Missing packaged speech classes: Lcom/natophonetics/app/SpokenAnswerModule;')
    return dict(source=expected['input'], sha256=digest, historicalDefinitions=expected['definitions'],
                rejectedByPayload=reason)


def manifest_controls(directory, aapt, android_jar, proto):
    permission = '<uses-permission android:name="android.permission.RECORD_AUDIO"/>'
    optional = '<uses-feature android:name="android.hardware.microphone" android:required="false"/>'
    required = '<uses-feature android:name="android.hardware.microphone" android:required="true"/>'
    microphone_error = 'The microphone must be optional for devices using other practice modes'
    cases = [
        ('optional-with-permission', permission + optional, None),
        ('missing-permission', optional, 'Missing recording permission for spoken practice'),
        ('required-microphone', permission + required, microphone_error),
        ('implied-microphone', permission, microphone_error),
    ]
    results = []
    for name, declarations, error in cases:
        xml = directory / 'AndroidManifest.xml'
        xml.write_text('<manifest xmlns:android="http://schemas.android.com/apk/res/android" '
                       'package="com.natophonetics.fixture" android:versionCode="1" android:versionName="1.0">'
                       + declarations + '<application android:hasCode="false"/></manifest>', encoding='utf-8')
        apk = directory / 'manifest.apk'
        subprocess.run([*aapt, 'link', *(['--proto-format'] if proto else []),
                        '-I', android_jar, '--manifest', xml, '-o', apk], check=True)
        if error:
            outcome = dict(rejected=expected_rejection(lambda: inspector['manifest'](apk), error))
        else:
            parsed = inspector['manifest'](apk)
            assert parsed['recordingPermission'] == 'android.permission.RECORD_AUDIO' and parsed['microphoneRequired'] is False
            outcome = dict(accepted=parsed)
        results.append(dict(case=name, **outcome))
    return results


if __name__ == '__main__':
    aapt = inspector['build_tool']('aapt2')
    android_jar = Path(os.environ['ANDROID_HOME']) / 'platforms/android-36/android.jar'
    report = dict(aapt2=inspector['command']([*aapt, 'version']).stdout.strip(),
                  compileSdk=36, historicalDex=old_classes(Path(sys.argv[1])))
    with tempfile.TemporaryDirectory() as temp:
        for name, proto in [('binaryApk', False), ('protoBase', True)]:
            report[name] = manifest_controls(Path(temp), aapt, android_jar, proto)
    print(json.dumps(report, indent=2))
