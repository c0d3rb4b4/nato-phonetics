"""Export named, asserted screenshots from successful final XCTest runs.
Usage: python3 export-screenshots.py <app-path> <exported-attachments-dir> [...]
"""
import datetime
import hashlib
import json
from pathlib import Path
import shutil
import struct
import sys

root = Path(__file__).resolve().parent
artifact = json.loads((root / 'artifact.json').read_text())
app = Path(sys.argv[1])
hash_file = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
assert hash_file(app / 'NATOPhonetics') == artifact['nativeExecutableSha256']
assert hash_file(app / 'main.jsbundle') == artifact['javaScriptBundleSha256']
states = {
    'home-light': ('light', 'Home, native header/status insets and feature controls'),
    'alphabet-light': ('light', 'Alphabet reference with canonical A–H viewport'),
    'converter-empty-light': ('light', 'Empty converter and disabled phrase button'),
    'converter-populated-light': ('light', 'CV34 7AP; consecutive individual key events without artificial character sleeps, exact prefix/full value and all seven output cards asserted'),
    'quiz-light': ('light', 'Unanswered random quiz; four unique options and hidden answer'),
    'quiz-feedback-light': ('light', 'Submitted answer; persistent feedback, Next and Replay asserted'),
    'settings-dark': ('dark', 'Dark appearance selected with ordinary app control'),
    'home-dark-restarted': ('dark', 'Saved dark theme retained after terminate/relaunch'),
    'voice-dark': ('dark', 'Real installed English voices and System Default'),
    'audio-help-light': ('light', 'Audio help and test controls'),
    'menu-cold-light': ('light', 'Cold Menu URL, followed by asserted Back to App → Home'),
    'audio-playing': ('light', 'Real native provider request with visible playback progress and Stop'),
    'converter-edited': ('light', 'CV34 7XY after individual key events, deletion, append and Menu/Back; exact text and output asserted'),
    'converter-pasted': ('light', 'CV34 7AP inserted through actual native clipboard Paste; full text/cards asserted'),
    'legacy-preferences-migrated-dark': ('dark', 'Seeded legacy darkMode/selectedVoice restored in native app; persistent schema checked separately'),
    'preferences-reset': ('system', 'Reset Preferences restores System appearance/System Default voice; unrelated storage sentinel remains'),
}
found = {}
for source_name in sys.argv[2:]:
    source = Path(source_name)
    for test in json.loads((source / 'manifest.json').read_text()):
        for attachment in test['attachments']:
            name = attachment.get('suggestedHumanReadableName', '').split('_0_')[0]
            if name in states:
                assert attachment['deviceId'] == artifact['simulator']['udid']
                found[name] = (source, test['testIdentifier'], attachment)
assert set(states) <= set(found), f'Missing captures: {set(states) - set(found)}'
output = root.parent / 'screenshots/ios'
output.mkdir(parents=True, exist_ok=True)
captures = []
for name, (theme, state) in states.items():
    source, test_id, attachment = found[name]
    target = output / f'{name}.png'
    shutil.copyfile(source / attachment['exportedFileName'], target)
    data = target.read_bytes()
    assert data[:8] == b'\x89PNG\r\n\x1a\n'
    width, height = struct.unpack('>II', data[16:24])
    captures.append({'file': target.name, 'theme': theme, 'state': state,
                     'capturedAt': datetime.datetime.fromtimestamp(attachment['timestamp'], datetime.timezone.utc).isoformat(),
                     'pixels': {'width': width, 'height': height}, 'bytes': len(data),
                     'sha256': hash_file(target), 'testIdentifier': test_id,
                     'originalAttachment': attachment})
metadata = dict(date='2026-11-16', platform='ios', device=artifact['simulator'],
                captureMethod='XCUIScreen.main.screenshot(), retained XCTest PNG attachment exported by xcresulttool',
                xcode=artifact['xcode'], version=artifact['version'], build=artifact['build'],
                executableSha256=artifact['nativeExecutableSha256'], bundleSha256=artifact['javaScriptBundleSha256'],
                captures=captures)
(output / 'metadata.json').write_text(json.dumps(metadata, indent=2) + '\n')
print(f'Exported {len(captures)} actual native app screenshots; visual inspection required before accepting.')
