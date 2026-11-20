"""Record actual commands with pinned local tools; no shell interpretation."""
import datetime
import json
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
name, *command = sys.argv[1:]
env = os.environ.copy()
env.update({
    'PATH': '/tmp/nato-phonetics-toolchain/node_modules/.bin:' + env['PATH'],
    'JAVA_HOME': '/tmp/nato-run22-jdk/jdk-17.0.13+11/Contents/Home',
    'ANDROID_HOME': str(Path.home() / 'Library/Android/sdk'),
    'DEVELOPER_DIR': '/Applications/Xcode.app/Contents/Developer',
})
started = datetime.datetime.now(datetime.timezone.utc).isoformat()
with (OUT / (name + '.log')).open('xb') as log:
    result = subprocess.run(command, cwd=ROOT, env=env, stdout=log, stderr=subprocess.STDOUT)
record = {
    'command': command, 'startedAt': started,
    'endedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'exitCode': result.returncode, 'log': name + '.log',
    'environment': {key: env[key] for key in ['PATH', 'JAVA_HOME', 'ANDROID_HOME', 'DEVELOPER_DIR']},
}
(OUT / (name + '.json')).write_text(json.dumps(record, indent=2) + '\n')
print(json.dumps(record), flush=True)
sys.exit(result.returncode)
