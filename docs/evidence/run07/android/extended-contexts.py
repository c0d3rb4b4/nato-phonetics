"""Final installed-candidate coverage after Android repair verification.

Uses real accessibility controls, native frames/events and original screencaps.
Run only after the platform owner hands over the emulator and Metro process.
"""
from verify_native import *
import importlib.util

spec = importlib.util.spec_from_file_location('tiles', OUT / 'tile-scenarios.py')
tiles = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tiles)


def capture(name, theme, scale):
    density = runtime("[...__r.getModules().values()].find(m=>m.verboseName.endsWith('/Dimensions.js')).publicModule.exports.default.get('window').scale")
    rectangles = tiles.geometry(name, density, scale)
    screenshot(name, 'Final native context: real tile frames, line events and raster', theme)
    return {row['testID'] for row in rectangles}


def scroll_step():
    png = adb('exec-out', 'screencap', '-p', raw=True)
    width = int.from_bytes(png[16:20], 'big')
    height = int.from_bytes(png[20:24], 'big')
    # Overlap deliberately: every tile must appear fully in at least one image.
    adb('shell', 'input', 'swipe', str(width // 2), str(int(height * .72)),
        str(width // 2), str(int(height * .47)), '350')
    time.sleep(.4)


def cover(prefix, required, theme, scale, limit=28):
    png = adb('exec-out', 'screencap', '-p', raw=True)
    width = int.from_bytes(png[16:20], 'big')
    height = int.from_bytes(png[20:24], 'big')
    for _ in range(8):
        adb('shell', 'input', 'swipe', str(width // 2), str(int(height * .35)),
            str(width // 2), str(int(height * .85)), '150')
    time.sleep(.3)
    seen = set()
    for page in range(limit):
        seen.update(capture(f'{prefix}-{page}', theme, scale))
        if required <= seen:
            mark(prefix + '-coverage', expected=sorted(required), observed=sorted(seen))
            return
        scroll_step()
    raise AssertionError(f'{prefix}: missing {sorted(required - seen)}')


def main():
    adb('shell', 'settings', 'put', 'system', 'font_scale', '1')
    time.sleep(2)
    route('settings'); tap(desc='Light'); route('alphabet')
    expect(desc='Play A, Alfa', timeout=45)
    cover('final-alphabet-light', {'alphabet-' + chr(n) for n in range(65, 91)}, 'light', 1)
    route('converter'); set_text('NUWJ359')
    cover('final-converter-light', {'converter-' + str(n) for n in range(7)}, 'light', 1)
    route('settings'); tap(desc='Dark'); route('converter'); set_text('NUWJ359')
    cover('final-converter-dark', {'converter-' + str(n) for n in range(7)}, 'dark', 1)
    adb('shell', 'settings', 'put', 'system', 'font_scale', '2'); time.sleep(3)
    cover('final-converter-dark-scale2', {'converter-' + str(n) for n in range(7)}, 'dark', 2)
    route('letter-quiz'); expect(contains='Choose ', timeout=30)
    capture('final-quiz-question-dark-scale2', 'dark', 2)
    choice = None
    for _ in range(12):
        tree = dump()
        choice = next((node for node in nodes(tree) if node.get('resource-id') == 'quiz-choice-0'
                       and node.get('bounds') != '[0,0][0,0]'), None)
        if choice is not None:
            break
        scroll_step()
    assert choice is not None, 'First answer must be reachable'
    tap(desc=choice.get('content-desc'))
    # Return to the top without recreating the submitted quiz.
    for _ in range(6):
        adb('shell', 'input', 'swipe', '360', '400', '360', '1250', '250')
    time.sleep(.5)
    capture('final-quiz-feedback-dark-scale2', 'dark', 2)
    for _ in range(4):
        scroll_step()
        if find(dump(), desc='Next question') is not None:
            break
    screenshot('final-quiz-controls-dark-scale2', 'Enlarged persistent feedback, Next and Replay', 'dark')
    assert find(dump(), desc='Next question') is not None, 'Next must be reachable'
    mark('final-dark-quiz-controls', nextPresent=True)


if __name__ == '__main__':
    main()
