"""Real installed app tile capture/geometry checks; no rendering hooks or mock providers."""
from verify_native import *


def by_id(tree, test_id):
    for node in nodes(tree):
        if node.get('resource-id') in [test_id, 'com.natophonetics.app:id/'+test_id]:
            return node
    return None


def bounds(node):
    left, top, right, bottom = map(int, re.findall(r'-?\d+', node.get('bounds', '')))
    return dict(x=left, y=top, width=right-left, height=bottom-top)


def geometry(name, density, scale=1):
    tree = dump(name)
    records = []
    for node in nodes(tree):
        test_id = node.get('resource-id', '')
        if not re.fullmatch(r'(alphabet-[A-Z]|converter-\d+|quiz-card)', test_id):
            continue
        b = bounds(node)
        # UIAutomator clips partially visible rectangles; record only complete tiles.
        expected_w, expected_h = 110*scale*density, 150*scale*density
        if abs(b['width'] - expected_w) <= 2 and abs(b['height'] - expected_h) <= 2:
            records.append({'testID': test_id, 'pixels': b, 'logical': {key: val/density for key, val in b.items()}})
    assert records, ('No complete tile rectangles found', name, ET.tostring(tree).decode())
    mark(name, density=density, scale=scale, tiles=records)
    runtime((OUT/'inspect-tiles.js').read_text()); time.sleep(.3)
    (OUT/(name+'-native-layout.json')).write_text(json.dumps(runtime('globalThis.__natoTileMeasurements'),indent=2)+'\n')
    return records


def scroll_up():
    # wm size reports natural orientation even when the display is rotated.
    png=adb('exec-out','screencap','-p',raw=True)
    width,height=int.from_bytes(png[16:20],'big'),int.from_bytes(png[20:24],'big')
    adb('shell','input','swipe', str(width//2), str(int(height*.80)), str(width//2), str(int(height*.35)), '350')
    time.sleep(.3)


def scroll_until(test_id, limit=20):
    for _ in range(limit):
        node=by_id(dump(), test_id)
        if node is not None and bounds(node)['height'] > 100: return node
        scroll_up()
    raise AssertionError('Could not reach '+test_id)


def main():
    route('settings'); expect(desc='Light', timeout=45); tap(desc='Light'); route('alphabet')
    expect(desc='Play A, Alfa')
    density = int(adb('shell','wm','density').strip().split(':')[-1].strip())/160
    seen=set()
    for page in range(15):
        measured=geometry(f'alphabet-page-{page}',density)
        seen.update(r['testID'].split('-')[1] for r in measured)
        screenshot(f'alphabet-light-{page}', f'Alphabet page {page}; real native tile rectangles measured')
        if len(seen)==26: break
        scroll_up()
    assert len(seen)==26, sorted(seen)
    mark('all-26-alphabet-rectangles', letters=sorted(seen))
    route('converter'); set_text('NUWJ359'); geometry('converter-light',density)
    screenshot('converter-light','Populated converter NUWJ359, same tile composition')
    route('letter-quiz'); expect(contains='Choose ')
    tree=dump('quiz-question')
    assert by_id(tree,'quiz-card-word') is None
    geometry('quiz-question-light',density); screenshot('quiz-question-light','Quiz unrevealed answer, portrait shared tile')
    choice=next(n for n in nodes(tree) if n.get('resource-id')=='quiz-choice-0')
    tap(desc=choice.get('content-desc')); expect(desc='Next question')
    geometry('quiz-feedback-light',density); screenshot('quiz-feedback-light','Quiz revealed answer and persistent feedback')
    route('settings'); tap(desc='Dark'); route('alphabet')
    geometry('alphabet-dark',density); screenshot('alphabet-dark','Alphabet in dark app theme','dark')
    mark('default-tile-flows-complete')

if __name__ == '__main__': main()
