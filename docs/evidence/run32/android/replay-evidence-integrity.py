"""Check stored Run 32 PNGs and rerun the ABI gate using saved observations and actual APKs."""
import hashlib
import json
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
RUN = HERE.parent
ROOT = HERE.parents[3]
sys.path.insert(0, str(ROOT / 'scripts'))
from android_display_evidence import validate_png
from android_runtime_abi import check_runtime


def prior_results(value):
    if isinstance(value, dict):
        if {'pid', 'apkSha256', 'verifiedLibraries', 'nativeLibraryDir'} <= value.keys():
            yield value
        else:
            for child in value.values():
                yield from prior_results(child)
    elif isinstance(value, list):
        for child in value:
            yield from prior_results(child)


def main():
    apks = {}
    for run in ('run31', 'run32'):
        for apk in (ROOT / 'artifacts' / run).rglob('*.apk'):
            apks[hashlib.sha256(apk.read_bytes()).hexdigest()] = apk
    priors, observations = {}, {}
    for file in RUN.rglob('*.json'):
        if file.name == 'evidence-integrity-replay.json':
            continue
        data = json.loads(file.read_text(encoding='utf-8-sig'))
        for result in prior_results(data):
            key = result['pid'], result['nativeLibraryDir']
            if key in priors and priors[key]['apkSha256'] != result['apkSha256']:
                raise ValueError('Conflicting previous APK identities for one mapped process')
            priors[key] = result
        if isinstance(data, dict) and {'pid', 'mappings', 'sourceApk', 'nativeLibraryDir'} <= data.keys():
            observations[file] = data
    failed_instrumentation = json.loads((RUN / 'screenshots/android/arm64-composition/identity.json').read_text())
    failed_package = failed_instrumentation['identities']['com.natophonetics.app']
    records = []
    for file, data in sorted(observations.items()):
        prior = priors.get((data['pid'], data['nativeLibraryDir']))
        if prior:
            sha, abi = prior['apkSha256'], prior['primaryCpuAbi']
            mapped = next(iter(prior['verifiedLibraries'].values()))['mappings'][0]['path']
            archive = mapped if mapped in data.get('splitApks', []) else data['sourceApk']
        elif file.parent.name in ('quiz-arm64', 'arm64-composition-recovery'):
            sha, abi, archive = failed_package['sha256'], failed_package['primaryCpuAbi'], failed_package['installed']
        else:
            records.append({'observation': str(file.relative_to(RUN)), 'status': 'no prior candidate-bound result'})
            continue
        try:
            current = check_runtime(apks[sha], archive, sha, abi, abi, data, prior['pid'] if prior else data['pid'],
                                    base_path=data['sourceApk'] if archive != data['sourceApk'] else None)
            status = 'verified' if prior else 'unexpected acceptance'
            details = {lib: row['mappings'] for lib, row in current['verifiedLibraries'].items()}
        except ValueError as error:
            status = 'unexpected rejection' if prior else 'existing forced ARM control rejected'
            details = str(error)
        records.append({'observation': str(file.relative_to(RUN)), 'status': status, 'sha256': sha,
                        'abi': abi, 'pid': data['pid'], 'details': details})
    image_count = 0
    invalid = []
    for file in sorted(RUN.rglob('*.png')):
        image_count += 1
        try:
            validate_png(file.read_bytes())
        except Exception as error:
            invalid.append({'file': str(file.relative_to(RUN)), 'error': str(error)})
    verified = sum(row['status'] == 'verified' for row in records)
    rejected = sum(row['status'] == 'existing forced ARM control rejected' for row in records)
    summary = {'verifiedProcesses': verified, 'existingRejectedControls': rejected,
               'unclassifiedOrUnexpected': len(records) - verified - rejected,
               'savedPngs': image_count, 'invalidPngs': invalid}
    report = {**summary, 'observations': records,
              'scope': 'Stored PNG structure, CRC and complete compressed stream. The replay does not create '
                       'device hashes for older exports or change existing visual or runtime results.'}
    (HERE / 'evidence-integrity-replay.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(summary))
    return int(bool(invalid or summary['unclassifiedOrUnexpected']))


if __name__ == '__main__':
    sys.exit(main())
