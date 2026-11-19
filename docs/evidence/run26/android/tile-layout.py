"""Current source candidate: reuse Run07 native baseline observations/assertions."""
from pathlib import Path
import importlib.util, json, subprocess, time

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).with_name('tile-layout'); OUT.mkdir(exist_ok=True)
spec = importlib.util.spec_from_file_location('run08_driver', ROOT/'docs/evidence/run08/android/verify_native.py')
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
m.OUT = OUT; m.SHOTS = ROOT/'docs/evidence/run26/screenshots/android/tile-final'
m.ADB = '/opt/homebrew/bin/adb'; m.checks = []; m.captures = []
def runtime(expression):
    return json.loads(subprocess.check_output(['/tmp/nato-phonetics-toolchain/node_modules/node/bin/node', str(ROOT/'docs/evidence/run07/android/read-runtime.cjs'), expression], text=True, timeout=15))
m.runtime = runtime
def capture(name):
    runtime((ROOT/'docs/evidence/run07/android/inspect-tiles.js').read_text())
    deadline = time.monotonic()+5
    while time.monotonic() < deadline:
        data = runtime('globalThis.__natoTileMeasurements')
        if not data.get('pending'): break
        time.sleep(.1)
    assert not data.get('pending'), 'Native measurement incomplete'
    (OUT/(name+'-native-layout.json')).write_text(json.dumps(data, indent=2)+'\n')
    m.screenshot(name, 'Current source candidate native geometry/baseline observation; offscreen nodes measured, visible ink scope separate')

original = m.adb('shell','settings','get','system','font_scale').strip()
try:
    m.adb('shell','settings','put','system','font_scale','1')
    m.route('alphabet', cold=True); m.expect(desc='Play A, Alfa', timeout=45)
    assert runtime('typeof globalThis.__fontProbe') == 'undefined'
    for scale in [1,2,1]:
        m.adb('shell','settings','put','system','font_scale',str(scale)); time.sleep(1)
        capture('alphabet-'+str(scale))
        data=json.loads((OUT/('alphabet-'+str(scale)+'-native-layout.json')).read_text())
        letters={r['id'].removeprefix('alphabet-') for r in data['values'] if len(r['id'])==10 and r['id'].startswith('alphabet-')}
        assert len(letters)==26, sorted(letters)
    m.route('converter'); m.expect(desc='Text to convert'); m.set_text('NUWJ359')
    for scale in [1,2,1]:
        m.adb('shell','settings','put','system','font_scale',str(scale)); time.sleep(1)
        assert m.expect(desc='Text to convert').get('text')=='NUWJ359'
        capture('converter-'+str(scale))
finally:
    m.adb('shell','settings','put','system','font_scale',original)
