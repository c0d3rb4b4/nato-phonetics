"""Run the affected native builds serially; retain every exit code."""
import subprocess,json
from pathlib import Path
root=Path(__file__).resolve().parents[4]
results=[]
for mode in ['android-debug','android-release','ios-simulator']:
 command=['python3','docs/evidence/run23/shared/run-command.py',mode,'node','scripts/host-build.cjs',mode,'--output','artifacts/run23/'+mode]
 result=subprocess.run(command,cwd=root)
 results.append({'mode':mode,'exitCode':result.returncode})
 (Path(__file__).parent/'native-builds.json').write_text(json.dumps(results,indent=2)+'\n')
raise SystemExit(1 if any(r['exitCode'] for r in results) else 0)
