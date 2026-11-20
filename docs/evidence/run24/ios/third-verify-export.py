"""Actual Run23 Release app; only the standalone XCTest harness is compiled."""
import datetime, hashlib, json, os, pathlib, shutil, subprocess

ROOT = pathlib.Path(__file__).resolve().parents[4]
OUT = ROOT / 'docs/evidence/run24'
env = os.environ.copy()
env.update(DEVELOPER_DIR='/Applications/Xcode.app/Contents/Developer',
           PATH='/tmp/nato-phonetics-toolchain/node_modules/node/bin:' + env['PATH'])
commands = []
def run(args, data=None, check=True, log=None):
    started = datetime.datetime.now(datetime.timezone.utc).isoformat()
    if log:
        with (OUT / log).open('wb') as handle:
            result = subprocess.run(args, cwd=ROOT, env=env, input=data, stdout=handle, stderr=subprocess.STDOUT)
        output = (OUT / log).read_bytes()
    else:
        result = subprocess.run(args, cwd=ROOT, env=env, input=data, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        output = result.stdout
    row = dict(command=args, startedAt=started, endedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(), exitCode=result.returncode, log=log)
    commands.append(row)
    (OUT / 'ios/commands.json').write_text(json.dumps(commands, indent=2) + '\n')
    print(json.dumps(row), flush=True)
    if check and result.returncode: raise RuntimeError(output.decode(errors='replace')[-3000:])
    return output
def inventory(directory):
    return {str(p.relative_to(directory)): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(directory.rglob('*')) if p.is_file()}

devices = json.loads(run(['xcrun', 'simctl', 'list', 'devices', 'available', '-j']))['devices']
device = next(d for runtime, group in devices.items() if '26-2' in runtime for d in group if d['name'] == 'iPhone 17 Pro')
uid = device['udid']
original_appearance = original_size = clipboard = None
try:
    if device['state'] != 'Booted': run(['xcrun', 'simctl', 'boot', uid])
    run(['xcrun', 'simctl', 'bootstatus', uid, '-b'], log='ios/boot.log')
    original_appearance = run(['xcrun', 'simctl', 'ui', uid, 'appearance']).decode().strip()
    original_size = run(['xcrun', 'simctl', 'ui', uid, 'content_size']).decode().strip()
    clipboard = run(['xcrun', 'simctl', 'pbpaste', uid], check=False)
    installed = pathlib.Path(run(['xcrun', 'simctl', 'get_app_container', uid, 'com.natophonetics.app', 'app']).decode().strip())
    expected_files = json.loads((ROOT / 'docs/evidence/run23/ios/installed-artifact.json').read_text())['installedFiles']
    assert inventory(installed) == expected_files
    (OUT / 'ios/installed-artifact.json').write_text(json.dumps(dict(matchesRun23=True, files=expected_files, device=device, originalAppearance=original_appearance, originalSize=original_size), indent=2) + '\n')
    fixture = ('CV34 7AP / G-ABCD\n' * 118)[:2000]
    (OUT / 'ios/input.txt').write_text(fixture)
    script = "import {convertText,conversionOutput} from './src/lib/conversion.js'; import fs from 'node:fs'; process.stdout.write(conversionOutput(convertText(fs.readFileSync('docs/evidence/run24/ios/input.txt','utf8')+'j')).text)"
    expected_clipboard = run(['node', '--input-type=module', '-e', script])
    (OUT / 'ios/expected-copy.txt').write_bytes(expected_clipboard)
    results = []
    for size, theme in [('large', 'light'), ('accessibility-extra-extra-extra-large', 'dark')]:
        run(['xcrun', 'simctl', 'ui', uid, 'content_size', size])
        run(['xcrun', 'simctl', 'ui', uid, 'appearance', theme])
        run(['xcrun', 'simctl', 'pbcopy', uid], data=fixture.encode())
        label = 'default' if size == 'large' else 'maximum'
        result_bundle = 'artifacts/run24/ios-' + label + '-copy.xcresult'
        run(['xcodebuild', 'test', '-project', 'docs/evidence/run24/ios/harness/Capture.xcodeproj', '-scheme', 'Capture', '-configuration', 'Debug',
             '-destination', 'platform=iOS Simulator,id=' + uid, '-derivedDataPath', 'artifacts/run24/ios-harness', '-resultBundlePath', result_bundle,
             '-jobs', '1', 'CODE_SIGNING_ALLOWED=NO', '-parallel-testing-enabled', 'NO', '-test-timeouts-enabled', 'YES', '-maximum-test-execution-time-allowance', '180', '-only-testing:CaptureUITests/ExportUITests/testLongCopyAndScroll'], log='ios/' + label + '-copy.log')
        actual = run(['xcrun', 'simctl', 'pbpaste', uid])
        (OUT / ('ios/actual-copy-' + label + '.txt')).write_bytes(actual)
        assert actual == expected_clipboard, 'Native clipboard bytes differ'
        assert inventory(installed) == expected_files
        results.append(dict(size=size, theme=theme, inputCharacters=2001, clipboardBytes=len(actual), clipboardSha256=hashlib.sha256(actual).hexdigest(), exactClipboardMatch=True, installedUnchanged=True))
        (OUT / 'ios/results.json').write_text(json.dumps(results, indent=2) + '\n')
        attachments = ROOT / ('artifacts/run24/ios-attachments-' + label)
        run(['xcrun', 'xcresulttool', 'export', 'attachments', '--path', result_bundle, '--output-path', str(attachments)])
        manifest = json.loads((attachments / 'manifest.json').read_text())
        (OUT / ('ios/attachments-' + label + '.json')).write_text(json.dumps(manifest, indent=2) + '\n')
        for test in manifest:
            for a in test['attachments']:
                if a['exportedFileName'].endswith('.png') and '_0_' in a['suggestedHumanReadableName']:
                    name = a['suggestedHumanReadableName'].split('_0_')[0]
                    shutil.copyfile(attachments / a['exportedFileName'], OUT / 'screenshots/ios' / (label + '-' + name + '.png'))
        # Keep copy/scroll/clipboard qualification independent of the system sheet.
        run(['xcrun', 'simctl', 'terminate', uid, 'com.natophonetics.app'], check=False)
        run(['xcrun', 'simctl', 'pbcopy', uid], data=fixture.encode())
        share_bundle = 'artifacts/run24/ios-' + label + '-share.xcresult'
        run(['xcodebuild', 'test', '-project', 'docs/evidence/run24/ios/harness/Capture.xcodeproj', '-scheme', 'Capture', '-configuration', 'Debug',
             '-destination', 'platform=iOS Simulator,id=' + uid, '-derivedDataPath', 'artifacts/run24/ios-harness', '-resultBundlePath', share_bundle,
             '-jobs', '1', 'CODE_SIGNING_ALLOWED=NO', '-parallel-testing-enabled', 'NO', '-test-timeouts-enabled', 'YES', '-maximum-test-execution-time-allowance', '180', '-only-testing:CaptureUITests/ExportUITests/testShareAndCancel'], log='ios/' + label + '-share.log')
        results[-1]['shareAndCancel'] = True
        (OUT / 'ios/results.json').write_text(json.dumps(results, indent=2) + '\n')
        share_attachments = ROOT / ('artifacts/run24/ios-attachments-' + label + '-share')
        run(['xcrun', 'xcresulttool', 'export', 'attachments', '--path', share_bundle, '--output-path', str(share_attachments)])
        share_manifest = json.loads((share_attachments / 'manifest.json').read_text())
        (OUT / ('ios/attachments-' + label + '-share.json')).write_text(json.dumps(share_manifest, indent=2) + '\n')
        for test in share_manifest:
            for a in test['attachments']:
                if a['exportedFileName'].endswith('.png') and '_0_' in a['suggestedHumanReadableName']:
                    name = a['suggestedHumanReadableName'].split('_0_')[0]
                    shutil.copyfile(share_attachments / a['exportedFileName'], OUT / 'screenshots/ios' / (label + '-share-' + name + '.png'))
finally:
    run(['xcrun', 'simctl', 'terminate', uid, 'com.natophonetics.app'], check=False)
    if original_appearance: run(['xcrun', 'simctl', 'ui', uid, 'appearance', original_appearance], check=False)
    if original_size: run(['xcrun', 'simctl', 'ui', uid, 'content_size', original_size], check=False)
    if clipboard is not None: run(['xcrun', 'simctl', 'pbcopy', uid], data=clipboard, check=False)
    if device['state'] != 'Booted': run(['xcrun', 'simctl', 'shutdown', uid], check=False)
