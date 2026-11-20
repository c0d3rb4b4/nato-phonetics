"""Record an exact command/log, exit, UTC time and resources without shell quoting."""
from pathlib import Path
import datetime,json,os,shutil,subprocess,sys,time
target=Path(sys.argv[1]);command=sys.argv[2:];target.parent.mkdir(parents=True,exist_ok=True)
start=time.monotonic()
row={'command':command,'cwd':os.getcwd(),'startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'availableBytesBefore':shutil.disk_usage('.').free}
with target.with_suffix('.log').open('w') as log:
    p=subprocess.run(command,stdout=log,stderr=subprocess.STDOUT)
row.update(exitCode=p.returncode,durationSeconds=time.monotonic()-start,availableBytesAfter=shutil.disk_usage('.').free,finishedAt=datetime.datetime.now(datetime.timezone.utc).isoformat())
target.write_text(json.dumps(row,indent=2)+'\n');print(json.dumps(row));sys.exit(p.returncode)
