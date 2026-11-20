"""Verify the APK-backed native runner against real archived observations and ELF inputs."""
from pathlib import Path
import importlib.util
import json
import sys
import tempfile

here = Path(__file__).resolve().parent
root = here.parents[3]
sys.path.insert(0, str(root / 'scripts'))
spec = importlib.util.spec_from_file_location('font_native', root / 'scripts/run-android-font-native.py')
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)

previous = json.loads((root / 'docs/evidence/run31/android/native/native-result.json').read_text())
rows = [json.loads(line) for line in previous['stdout'].splitlines()]
missing = [row for row in rows if 'cacheEnvironmentPassed' not in row]
duplicate = [dict(row, environmentOnly=False) if 'environmentOnly' in row else row for row in rows]


def observations(records):
    return '\n'.join(json.dumps(row) for row in records)


checks = {
    'archivedSixCasesPass': runner.six_cases(observations(rows)),
    'missingCacheResultRejected': not runner.six_cases(observations(missing)),
    'duplicatedCombinationsRejected': not runner.six_cases(observations(duplicate)),
    'emptyOutputRejected': not runner.six_cases(''),
}
with tempfile.TemporaryDirectory() as tmp:
    libraries = runner.apk_libraries(Path(sys.argv[1]), 'x86_64', Path(tmp))
    checks['allArchivedElfDigestsMatch'] = {f.name: runner.digest(f) for f in libraries} == previous['librarySha256']
    try:
        runner.verify_elf(next(f for f in libraries if f.name == 'libreactnative.so'), 'arm64-v8a')
    except ValueError:
        checks['x86RendererRejectedAsARM64'] = True
    else:
        checks['x86RendererRejectedAsARM64'] = False
print(json.dumps(checks, indent=2))
sys.exit(0 if all(checks.values()) else 1)
