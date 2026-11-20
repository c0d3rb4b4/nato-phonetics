"""P05.2-F1: actual current product raster, isolated from historical outputs.

Run07 capture/check scope and thresholds are preserved. Only current quiz-start
navigation, output binding, serial, and inspector executable are adapted.
"""
from pathlib import Path
import importlib.util
import json
import os
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('verify_native', ROOT / 'docs/evidence/run08/android/verify_native.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
m.OUT = OUT
m.SHOTS = OUT.parent / 'screenshots/android'
m.ADB = os.environ.get('ADB', '/Users/mac/Library/Android/sdk/platform-tools/adb')
m.checks = json.loads((OUT / 'checks.json').read_text()) if (OUT / 'checks.json').exists() else []
m.captures = json.loads((m.SHOTS / 'metadata.json').read_text()) if (m.SHOTS / 'metadata.json').exists() else []


def runtime(expression):
    return json.loads(subprocess.check_output([
        '/tmp/nato-phonetics-toolchain/node_modules/node/bin/node',
        str(ROOT / 'docs/evidence/run07/android/read-runtime.cjs'), expression
    ], text=True, timeout=15))


m.runtime = runtime
sys.modules['verify_native'] = m
spec = importlib.util.spec_from_file_location('tiles', ROOT / 'docs/evidence/run07/android/tile-scenarios.py')
tiles = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tiles)


def capture(name, theme, scale):
    density = runtime("[...__r.getModules().values()].find(m=>m.verboseName.endsWith('/Dimensions.js')).publicModule.exports.default.get('window').scale")
    rectangles = tiles.geometry(name, density, scale)
    m.screenshot(name, 'Current source candidate: actual native frames, baseline events and raster', theme)
    return {row['testID'] for row in rectangles}


def scroll_step():
    png = m.adb('exec-out', 'screencap', '-p', raw=True)
    width, height = int.from_bytes(png[16:20], 'big'), int.from_bytes(png[20:24], 'big')
    # The converter now contains nested input/plain-text scrollers. Use the
    # outer gutter, keeping page navigation out of those child hit targets.
    m.adb('shell', 'input', 'swipe', '12', str(int(height * .72)),
          '12', str(int(height * .47)), '350')
    time.sleep(.4)


def to_top():
    png = m.adb('exec-out', 'screencap', '-p', raw=True)
    width, height = int.from_bytes(png[16:20], 'big'), int.from_bytes(png[20:24], 'big')
    for _ in range(8):
        m.adb('shell', 'input', 'swipe', '12', str(int(height * .35)),
              '12', str(int(height * .85)), '150')
    time.sleep(.3)


def cover(prefix, required, theme, scale, limit=28):
    to_top()
    seen = set()
    for page in range(limit):
        # Earlier flows had tiles at the top. Current converter export/pacing
        # controls precede the cards; do not call an offscreen node raster.
        if complete_tiles(scale):
            seen.update(capture(f'{prefix}-{page}', theme, scale))
        if required <= seen:
            m.mark(prefix + '-coverage', expected=sorted(required), observed=sorted(seen))
            return
        scroll_step()
    raise AssertionError(f'{prefix}: missing {sorted(required - seen)}')


def complete_tiles(scale, test_id=None):
    density = runtime("[...__r.getModules().values()].find(m=>m.verboseName.endsWith('/Dimensions.js')).publicModule.exports.default.get('window').scale")
    result = []
    for node in m.nodes(m.dump()):
        name = node.get('resource-id', '').split('/')[-1]
        if (name == test_id if test_id else name.startswith(('alphabet-', 'converter-'))):
            b = tiles.bounds(node)
            if (abs(b['width'] - 110 * scale * density) <= 2
                    and abs(b['height'] - 150 * scale * density) <= 2):
                result.append(node)
    return result


def seek_tile(test_id, scale):
    for _ in range(28):
        if complete_tiles(scale, test_id):
            return
        scroll_step()
    raise AssertionError('No completely visible tile: ' + test_id)


def visible(test_id=None, desc=None):
    for _ in range(28):
        tree = m.dump()
        node = tiles.by_id(tree, test_id) if test_id else m.find(tree, desc=desc)
        if node is not None:
            b = tiles.bounds(node)
            if b['width'] > 0 and b['height'] > 0 and b['y'] >= 55 and b['y'] + b['height'] <= 1540:
                return node
        scroll_step()
    raise AssertionError('Control not completely visible: ' + str(test_id or desc))


def click_id(test_id):
    b = tiles.bounds(visible(test_id))
    m.adb('shell', 'input', 'tap', str(b['x'] + b['width'] // 2), str(b['y'] + b['height'] // 2))


def finish_feedback():
    # Submitted choices push Next below the visible viewport at 2x. Establish
    # its real reachability before returning to the fully visible answer card.
    visible(desc='Next question')
    to_top()
    seek_tile('quiz-card', 2)
    capture('final-quiz-feedback-dark-scale2', 'dark', 2)
    visible(desc='Next question')
    m.screenshot('final-quiz-controls-dark-scale2', 'Enlarged persistent feedback, Next and Replay', 'dark')
    m.mark('final-dark-quiz-controls', nextPresent=True)


def main():
    original = m.adb('shell', 'settings', 'get', 'system', 'font_scale').strip()
    try:
        m.adb('shell', 'settings', 'put', 'system', 'font_scale', '1')
        time.sleep(2)
        if '--finish-feedback' in sys.argv:
            # Continue the same submitted round after the archived offscreen
            # control precondition failure, reusing unchanged earlier captures.
            m.adb('shell', 'settings', 'put', 'system', 'font_scale', '2')
            time.sleep(3)
            finish_feedback()
            return
        m.route('settings', cold=True)
        m.expect(desc='Light', timeout=90)
        assert runtime('typeof globalThis.__fontProbe') == 'undefined', 'Fixture entry remains active'
        m.tap(desc='Light')
        m.route('alphabet')
        m.expect(desc='Play A, Alfa', timeout=45)
        cover('final-alphabet-light', {'alphabet-' + chr(n) for n in range(65, 91)}, 'light', 1)
        m.route('converter')
        m.set_text('NUWJ359')
        cover('final-converter-light', {'converter-' + str(n) for n in range(7)}, 'light', 1)
        m.route('settings')
        m.tap(desc='Dark')
        m.route('converter')
        m.set_text('NUWJ359')
        cover('final-converter-dark', {'converter-' + str(n) for n in range(7)}, 'dark', 1)
        m.adb('shell', 'settings', 'put', 'system', 'font_scale', '2')
        time.sleep(3)
        cover('final-converter-dark-scale2', {'converter-' + str(n) for n in range(7)}, 'dark', 2)
        m.route('letter-quiz')
        visible(desc='5 questions')
        m.tap(desc='5 questions')
        click_id('quiz-start')
        m.expect(contains='Question 1 of 5', timeout=30)
        to_top()
        seek_tile('quiz-card', 2)
        capture('final-quiz-question-dark-scale2', 'dark', 2)
        click_id('quiz-choice-0')
        finish_feedback()
    except Exception:
        m.screenshot('failed-raster-capture', 'Failed capture precondition; not a raster acceptance pass', 'dark')
        raise
    finally:
        m.adb('shell', 'settings', 'put', 'system', 'font_scale', original)


if __name__ == '__main__':
    main()
