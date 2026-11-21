"""Install the inspected development APK on a test emulator, cold-launch offline and reinstall."""
import argparse
import hashlib
import json
from pathlib import Path
import socket
import subprocess
import sys
import time
import uuid
import xml.etree.ElementTree as ET

from android_display_evidence import validate_png


def smoke(apk, output, serial):
    package = 'com.natophonetics.app.dev'
    activity = package + '/com.natophonetics.app.MainActivity'
    output.mkdir(parents=True, exist_ok=False)
    report = {'status': 'running', 'serial': serial, 'apkSha256': hashlib.sha256(apk.read_bytes()).hexdigest()}
    def save():
        (output / 'smoke.json').write_text(json.dumps(report, indent=2) + '\n')
    def adb(*args, binary=False, check=True):
        result = subprocess.run(['adb', '-s', serial, *args], stdout=subprocess.PIPE,
                                stderr=subprocess.PIPE, timeout=90)
        if check and result.returncode:
            raise RuntimeError(result.stderr.decode(errors='replace') or result.stdout.decode(errors='replace'))
        return result.stdout if binary else result.stdout.decode(errors='replace').strip()
    def shell(*args):
        return adb('shell', *args)
    def installed_sha(name):
        if 'package:' + name not in shell('pm', 'list', 'packages', name).splitlines():
            return None
        paths = shell('pm', 'path', name).splitlines()
        if not paths:
            raise ValueError('Package manager did not return an installed APK path for ' + name)
        return {p: shell('sha256sum', p.removeprefix('package:')).split()[0] for p in paths}
    def visible(state, labels):
        # Read only our package's accessibility nodes; launcher text cannot satisfy the gate.
        deadline = time.monotonic() + 55
        while time.monotonic() < deadline:
            dump = adb('shell', 'uiautomator', 'dump', xml_path, check=False)
            if 'dumped to' in dump:
                tree = adb('exec-out', 'cat', xml_path, binary=True)
                try:
                    nodes = ET.fromstring(tree).iter('node')
                    words = ' '.join(n.get(k, '') for n in nodes if n.get('package') == package
                                     for k in ['text', 'content-desc', 'resource-id'])
                    if all(label in words for label in labels):
                        (output / (state + '.xml')).write_bytes(tree)
                        image = adb('exec-out', 'screencap', '-p', binary=True)
                        validate_png(image)
                        report.setdefault('screenshots', {})[state] = hashlib.sha256(image).hexdigest()
                        (output / (state + '.png')).write_bytes(image)
                        return
                except ET.ParseError:
                    pass
            time.sleep(1)
        last_tree = adb('exec-out', 'cat', xml_path, binary=True, check=False)
        (output / (state + '-failed.xml')).write_bytes(last_tree)
        image = adb('exec-out', 'screencap', '-p', binary=True, check=False)
        (output / (state + '-failed.png')).write_bytes(image)
        raise RuntimeError(f'{state} did not expose {labels}')
    xml_path = '/data/local/tmp/nato-develop-' + uuid.uuid4().hex + '.xml'
    try:
        if '1' not in [shell('getprop', prop) for prop in ('ro.kernel.qemu', 'ro.boot.qemu')]:
            raise ValueError('Use an isolated Android test emulator')
        inspector = Path(__file__).with_name('verify-android-product.py')
        product = json.loads(subprocess.check_output([sys.executable, inspector, 'android-develop', apk]))
        report.update(product=product, api=shell('getprop', 'ro.build.version.sdk'),
                      image=shell('getprop', 'ro.build.fingerprint'), viewport=shell('wm', 'size'),
                      uiMode=shell('cmd', 'uimode', 'night'))
        if 'tcp:8081' in adb('reverse', '--list'):
            raise ValueError('Disconnect the existing Metro port reverse before this test')
        with socket.socket() as probe:
            probe.settimeout(1)
            if probe.connect_ex(('127.0.0.1', 8081)) == 0:
                raise ValueError('Stop the Metro listener before this test')
        report['productionBefore'] = installed_sha('com.natophonetics.app')
        report['install'] = adb('install', '-r', str(apk))
        package_info = shell('dumpsys', 'package', package)
        first_install = [r.strip() for r in package_info.splitlines() if 'firstInstallTime=' in r]
        if not first_install or set((installed_sha(package) or {}).values()) != {report['apkSha256']}:
            raise ValueError('Installed APK differs from inspected artifact')
        shell('am', 'force-stop', package)
        report['launch'] = shell('am', 'start', '-W', '-n', activity)
        visible('reference', ['Letters A–Z', 'Digits 0–9', 'Word Converter'])
        report['pid'] = shell('pidof', package)
        if not report['pid'].isdigit():
            raise ValueError('Missing running application PID')
        report['deepLink'] = shell('am', 'start', '-W', '-a', 'android.intent.action.VIEW',
                                   '-d', 'natophonetics-dev://converter')
        visible('converter', ['Text to convert'])
        report['reinstall'] = adb('install', '-r', str(apk))
        after_install = [r.strip() for r in shell('dumpsys', 'package', package).splitlines() if 'firstInstallTime=' in r]
        if after_install != first_install or set(installed_sha(package).values()) != {report['apkSha256']}:
            raise ValueError('Development reinstall did not preserve the installation')
        report['productionAfter'] = installed_sha('com.natophonetics.app')
        if report['productionAfter'] != report['productionBefore']:
            raise ValueError('Production install changed')
        report.update(status='passed', firstInstall=first_install)
    except Exception as error:
        report.update(status='failed', error=str(error))
        raise
    finally:
        save()
        adb('shell', 'rm', '-f', xml_path, check=False)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('apk', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--serial', required=True)
    args = parser.parse_args()
    smoke(args.apk, args.output, args.serial)
