"""Real OS Paste, live size change, continued editing, Copy, system chooser, paging and Clear."""
import argparse
import hashlib
import importlib.util
import json
import time
from pathlib import Path

here = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('quiz_driver', here / 'quiz-round.py')
driver = importlib.util.module_from_spec(spec)
spec.loader.exec_module(driver)
product, ui = driver.product, driver.ui


def sample(name, seed=False):
    command = json.dumps({'name': name, 'converterClipboard': seed}).encode()
    ui.adb('shell', f'cat > {product.REMOTE}/request.tmp && mv {product.REMOTE}/request.tmp {product.REMOTE}/request.json',
           input=command)
    product.wait_file(name + '-done.json')
    row = json.loads(ui.adb('exec-out', 'cat', product.REMOTE + '/' + name + '.json'))
    result = {k: row[k] for k in ('runtimePid', 'activityIdentity', 'dimensions', 'converterClipboard')}
    result['cardIds'] = [item['id'] for item in row['values'] if item['id'].removeprefix('converter-').isdigit()]
    (ui.OUT / (name + '.json')).write_text(json.dumps(result, indent=2) + '\n')
    return result


def digest(data):
    return {'chars': len(data.decode()), 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('apk', 'observer', 'serial', 'abi', 'attempt'):
        parser.add_argument(name)
    args = parser.parse_args()
    ui.SERIAL, ui.ADB = args.serial, driver.shutil.which('adb')
    assert ui.adb('shell', 'getprop', 'ro.kernel.qemu').strip() == '1'
    product.APK, product.TEST = Path(args.apk).resolve(strict=True), Path(args.observer).resolve(strict=True)
    ui.OUT = product.OUT = here / args.attempt
    ui.SHOTS = here.parent / 'screenshots/android' / args.attempt
    ui.OUT.mkdir()
    ui.SHOTS.mkdir(parents=True)
    ui.checks, ui.captures = [], []
    prior = here.parents[1] / 'run24/ios'
    source = (prior / 'input.txt').read_text(encoding='utf-8').encode()
    output = (prior / 'expected-copy.txt').read_bytes()
    assert len(source) == 2000 and len(output) == 10123
    app_path = ui.adb('shell', 'pm', 'path', ui.APP).strip().removeprefix('package:')
    sha = ui.adb('shell', 'sha256sum', app_path).split()[0]
    assert sha == hashlib.sha256(product.APK.read_bytes()).hexdigest()
    abi = driver.installed_abi(ui.adb('shell', 'dumpsys', 'package', ui.APP))
    assert abi == args.abi
    original = ui.adb('shell', 'settings', 'get', 'system', 'font_scale').strip()
    process, log = product.start()
    result = {'passed': False, 'apkSha256': sha, 'expectedInput': digest(source), 'expectedCopy': digest(output)}
    try:
        ui.tap(desc='Light')
        ui.route('converter')
        ui.tap(desc='Text to convert')
        before = sample('seed', True)
        assert before['converterClipboard']['clipboard'] == digest(source)
        ui.adb('shell', 'input', 'keyevent', 'KEYCODE_PASTE')
        time.sleep(1)
        pasted = sample('pasted')
        assert pasted['converterClipboard']['input'] == digest(source)
        ui.screenshot('pasted-1', 'Focused multiline field after actual 2,000-character OS Paste', 'light')
        ui.adb('shell', 'settings', 'put', 'system', 'font_scale', '2')
        time.sleep(1.5)
        live = sample('pasted-live-2')
        field = live['converterClipboard']
        assert field['input'] == digest(source) and field['selectionEnd'] == 2000
        assert field['viewIdentity'] == pasted['converterClipboard']['viewIdentity']
        assert field['editableIdentity'] == pasted['converterClipboard']['editableIdentity']
        assert field['inputPaintPx'] > pasted['converterClipboard']['inputPaintPx']
        ui.adb('shell', 'input', 'text', 'j')
        time.sleep(.7)
        edited = sample('edited')
        assert edited['converterClipboard']['input'] == digest(source + b'j')
        ui.screenshot('edited-2', 'Live 2× input with one appended character', 'light')
        if 'mInputShown=true' in ui.adb('shell', 'dumpsys', 'input_method'):
            ui.adb('shell', 'input', 'keyevent', 'KEYCODE_BACK')
        driver.tap(product.seek(desc='Copy conversion'))
        ui.expect(text='Copied conversion.')
        copied = sample('copied')
        assert copied['converterClipboard']['clipboard'] == digest(output)
        ui.screenshot('copied-2', 'Complete plain-text export copied at 2×', 'light')
        driver.tap(product.seek(desc='Share conversion'))
        time.sleep(.7)
        assert 'ChooserActivity' in ui.adb('shell', 'dumpsys', 'activity', 'top')
        ui.screenshot('share-2', 'Android system chooser for the complete conversion', 'system')
        ui.adb('shell', 'input', 'keyevent', 'KEYCODE_BACK')
        ui.expect(desc='Open menu')
        returned = sample('after-chooser')
        assert returned['converterClipboard']['input'] == edited['converterClipboard']['input']
        result['imeReopenedAfterChooser'] = 'mInputShown=true' in ui.adb('shell', 'dumpsys', 'input_method')
        if result['imeReopenedAfterChooser']:
            ui.adb('shell', 'input', 'keyevent', 'KEYCODE_BACK')
            time.sleep(.4)
            assert 'mInputShown=true' not in ui.adb('shell', 'dumpsys', 'input_method')
        driver.tap(product.seek(desc='Next cards'))
        page = product.byid(ui.dump(), 'converter-card-page')
        assert page is not None and page.get('text').startswith('Card page 2 of '), None if page is None else page.attrib
        result['secondPage'] = page.get('text')
        paged = sample('paged')
        assert paged['converterClipboard']['input'] == edited['converterClipboard']['input']
        ui.screenshot('page-two-2', 'Second card page with the full conversion retained', 'light')
        product.top()
        driver.tap(product.seek(desc='Clear input'))
        cleared = sample('cleared')
        assert cleared['converterClipboard']['input'] == digest(b'') and not cleared['cardIds']
        assert not any(n.get('text') == 'Copied conversion.' for n in ui.nodes(ui.dump()))
        ui.screenshot('clear-2', 'Empty input after Clear at 2×', 'light')
        assert len({s['runtimePid'] for s in (before, pasted, live, edited, copied, returned, paged, cleared)}) == 1
        mappings = json.loads(ui.adb('exec-out', 'cat', product.REMOTE + '/runtime-libraries.json'))
        (ui.OUT / 'mapped-libraries.json').write_text(json.dumps(mappings, indent=2) + '\n')
        result['runtime'] = driver.check_runtime(product.APK, app_path, sha, abi, args.abi, mappings, live['runtimePid'])
        result['passed'] = True
    except Exception as failure:
        result['error'] = repr(failure)
        ui.screenshot('diagnostic', 'Screen at the failed converter check', 'observed in capture')
        raise
    finally:
        (ui.OUT / 'result.json').write_text(json.dumps(result, indent=2) + '\n')
        if process.poll() is None:
            product.request('finish', True)
            process.wait(timeout=20)
        log.close()
        if original == 'null':
            ui.adb('shell', 'settings', 'delete', 'system', 'font_scale')
        else:
            ui.adb('shell', 'settings', 'put', 'system', 'font_scale', original)


if __name__ == '__main__':
    main()
