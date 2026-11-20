"""Run the six renderer regressions with libraries from a directory or one APK ABI."""
import argparse
import hashlib
import itertools
import json
import re
import subprocess
import tempfile
import zipfile
from pathlib import Path
from android_runtime_abi import ABIS


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def verify_elf(path, abi):
    with path.open('rb') as stream:
        header = stream.read(20)
    _, machine, elf_class = ABIS[abi]
    if (len(header) != 20 or header[:4] != b'\x7fELF' or header[5] != 1 or
            (header[4], int.from_bytes(header[18:20], 'little')) != (elf_class, machine)):
        raise ValueError(f'{path.name} does not match {abi}')


def apk_libraries(apk, abi, directory):
    prefix = f'lib/{abi}/'
    with zipfile.ZipFile(apk) as archive:
        for entry in archive.infolist():
            if not entry.filename.startswith(prefix) or entry.is_dir():
                continue
            name = entry.filename[len(prefix):]
            if not re.fullmatch(r'lib[\w.+-]+\.so', name):
                raise ValueError(f'Unexpected native entry: {entry.filename}')
            file = directory / name
            # Exclusive creation rejects duplicate member names.
            with file.open('xb') as stream:
                stream.write(archive.read(entry))
            verify_elf(file, abi)
    return sorted(directory.glob('*.so'))


def six_cases(stdout):
    rows = [json.loads(line) for line in stdout.splitlines() if line.startswith('{')]
    observed = []
    current = None
    for row in rows:
        if 'cloneAlreadyDirty' in row:
            current = (row['cloneAlreadyDirty'], row['environmentOnly'])
        if 'passed' in row:
            if current is None or row['passed'] is not True:
                return False
            observed.append(current)
            current = None
    return (len(observed) == 4 and set(observed) == set(itertools.product((False, True), repeat=2))
            and all([row[key] for row in rows if key in row] == [True]
                    for key in ('olderEnvironmentAdoptionPassed', 'cacheEnvironmentPassed')))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('binary', type=Path)
    parser.add_argument('libraries', type=Path, help='Library directory, or the actual APK with --apk-abi')
    parser.add_argument('output', type=Path)
    parser.add_argument('serial')
    parser.add_argument('--apk-abi', choices=ABIS)
    args = parser.parse_args()
    adb = ['adb', '-s', args.serial]

    def call(*arguments):
        return subprocess.check_output([*adb, *arguments], text=True, timeout=40).strip()

    def push(local, destination):
        expected = digest(local)
        call('push', str(local), destination)
        if call('shell', 'sha256sum', destination).split()[0] != expected:
            raise RuntimeError(f'Pushed file changed: {local.name}')
        return expected

    args.output.mkdir(parents=True, exist_ok=True)
    report = {'serial': args.serial, 'librarySha256': {}, 'passed': False}
    remote = None
    try:
        with tempfile.TemporaryDirectory() as scratch:
            if args.apk_abi:
                verify_elf(args.binary, args.apk_abi)
                libraries = apk_libraries(args.libraries, args.apk_abi, Path(scratch))
                report.update(apkSha256=digest(args.libraries), abi=args.apk_abi)
            else:
                libraries = sorted(args.libraries.glob('*.so'))
                if any(not re.fullmatch(r'lib[\w.+-]+\.so', file.name) for file in libraries):
                    raise ValueError('Unexpected native library filename')
            required = {'libreactnative.so', 'libjsi.so', 'libfbjni.so', 'libc++_shared.so'}
            if not required.issubset({file.name for file in libraries}):
                raise ValueError('Missing renderer or required runtime libraries')
            directory = call('shell', 'mktemp', '-d', '/data/local/tmp/nato-font-regression.XXXXXX')
            if not re.fullmatch(r'/data/local/tmp/nato-font-regression\.[A-Za-z0-9]{6}', directory):
                raise RuntimeError('Unexpected temporary directory on the device')
            remote = directory
            call('shell', 'mkdir', remote + '/libs')
            report['binarySha256'] = push(args.binary, remote + '/font-environment')
            for file in libraries:
                report['librarySha256'][file.name] = push(file, remote + '/libs/' + file.name)
            call('shell', 'chmod', '755', remote + '/font-environment')
            result = subprocess.run(
                [*adb, 'shell', f'cd {remote} && LD_LIBRARY_PATH={remote}/libs ./font-environment'],
                capture_output=True, text=True, timeout=40)
            report.update(exitCode=result.returncode, stdout=result.stdout, stderr=result.stderr)
            report['passed'] = result.returncode == 0 and six_cases(result.stdout)
            print(result.stdout + result.stderr, end='')
    finally:
        try:
            if remote:
                call('shell', 'rm', '-r', remote)
                report['removedOwnedTestDirectory'] = True
        finally:
            (args.output / 'native-result.json').write_text(json.dumps(report, indent=2) + '\n')
    return 0 if report['passed'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
