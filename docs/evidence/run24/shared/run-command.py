#!/usr/bin/env python3
"""Record real Run24 commands, output and status without altering old evidence."""
import datetime, fcntl, json, os, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parents[4]
OUT = ROOT / 'docs/evidence/run24'
name, args = sys.argv[1], sys.argv[2:]
env = os.environ.copy()
env.update(PATH='/tmp/nato-phonetics-toolchain/node_modules/node/bin:/tmp/nato-phonetics-toolchain/node_modules/.bin:' + env['PATH'],
           NODE_PATH='/tmp/nato-run19-browser/node_modules:/Users/mac/.npm/_npx/e5f4bcd55d2c7c9f/node_modules',
           BROWSER_EXECUTABLE='/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
           CADDY_EXECUTABLE='/tmp/nato-run20-caddy/caddy', CI='1')
log = OUT / name
log.parent.mkdir(parents=True, exist_ok=True)
started = datetime.datetime.now(datetime.timezone.utc).isoformat()
with log.open('wb') as handle:
    result = subprocess.run(args, cwd=ROOT, env=env, stdout=handle, stderr=subprocess.STDOUT)
row = dict(command=args, cwd=str(ROOT), startedAt=started,
           endedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(), exitCode=result.returncode,
           log=name, toolchain=dict(node='22.23.0', npm='10.9.4'))
record = OUT / 'shared/commands.json'
with (ROOT / 'artifacts/run24/commands.lock').open('w') as handle:
    fcntl.flock(handle, fcntl.LOCK_EX)
    rows = json.loads(record.read_text()) if record.exists() else []
    rows.append(row)
    record.write_text(json.dumps(rows, indent=2) + '\n')
print(json.dumps(row))
print('\n'.join(log.read_text(errors='replace').splitlines()[-8:]), flush=True)
sys.exit(result.returncode)
