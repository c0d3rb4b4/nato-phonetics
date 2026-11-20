"""Retain exact exit/log/resource evidence for one serialized command."""
from pathlib import Path
import datetime
import json
import os
import shutil
import subprocess
import sys
import time

output = Path(sys.argv[1]).resolve()
command = sys.argv[2:]
output.parent.mkdir(parents=True, exist_ok=True)


def resources():
    return {'availableBytes': shutil.disk_usage('.').free,
            'swap': subprocess.check_output(['/usr/sbin/sysctl', 'vm.swapusage'], text=True).strip()}


report = {'command': command, 'cwd': str(Path.cwd()),
          'environment': {key: os.environ[key] for key in ['JAVA_HOME', 'ANDROID_HOME', 'ANDROID_SERIAL', 'NATO_BUILD_JOBS', 'PATH'] if key in os.environ},
          'startedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'before': resources()}
start = time.monotonic()
output.with_suffix('.json').write_text(json.dumps(report, indent=2) + '\n')
with output.with_suffix('.log').open('w') as log:
    result = subprocess.run(command, stdout=log, stderr=subprocess.STDOUT)
report.update(exitCode=result.returncode, durationSeconds=time.monotonic() - start,
              after=resources(), finishedAt=datetime.datetime.now(datetime.timezone.utc).isoformat())
output.with_suffix('.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({key: report[key] for key in ['command', 'exitCode', 'durationSeconds', 'before', 'after']}))
sys.exit(result.returncode)
