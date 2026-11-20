"""Focused controls for host evidence and settings, runnable without an Android guest."""
import hashlib
from pathlib import Path
import struct
import sys
import tempfile
import unittest
import zipfile
import zlib

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from android_display_evidence import pull_png, validate_png
from android_runtime_abi import ABIS, check_runtime, executable_segments
from android_test_tools import TEST_IME, restore_font_scale, restore_ime


def segmented_elf(abi):
    _, machine, bits = ABIS[abi]
    data = bytearray(0x2000)
    data[:6] = b'\x7fELF' + bytes((bits, 1))
    struct.pack_into('<H', data, 18, machine)
    # A readable ELF header and a separate executable PT_LOAD whose file offset
    # must be rounded down for mmap on a 4 KiB system.
    if bits == 1:
        struct.pack_into('<I', data, 28, 52)
        struct.pack_into('<HH', data, 42, 32, 2)
        for i, offset, flags in [(0, 0, 4), (1, 0x1800, 5)]:
            struct.pack_into('<IIIIIIII', data, 52 + i*32, 1, offset, offset, 0, 512, 512, flags, 0x1000)
    else:
        struct.pack_into('<Q', data, 32, 64)
        struct.pack_into('<HH', data, 54, 56, 2)
        for i, offset, flags in [(0, 0, 4), (1, 0x1800, 5)]:
            struct.pack_into('<IIQQQQQQ', data, 64 + i*56, 1, flags, offset, offset, 0, 512, 512, 0x1000)
    return bytes(data)


class RuntimeAbiControls(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.apk = Path(self.temp.name) / 'native.apk'
        self.installed = '/data/app/test/base.apk'
        self.lib_dir = '/data/app/test/lib/x86'
        self.data = segmented_elf('x86')
        self.libraries = ('libreactnative.so', 'libhermes.so', 'libjsi.so')
        with zipfile.ZipFile(self.apk, 'w') as archive:
            for lib in self.libraries:
                archive.writestr('lib/x86/' + lib, self.data)
        self.sha = hashlib.sha256(self.apk.read_bytes()).hexdigest()
        self.observation = {'sourceApk': self.installed, 'nativeLibraryDir': self.lib_dir, 'pageSize': 4096,
                            'is64Bit': False, 'pid': 41, 'mappings': []}
        with zipfile.ZipFile(self.apk) as archive:
            for entry in archive.infolist():
                offset = entry.header_offset + 30 + len(entry.filename)
                self.observation['mappings'].extend([
                    {'path': self.installed, 'permissions': 'r--p', 'offset': offset},
                    {'path': self.installed, 'permissions': 'r-xp', 'offset': offset + 0x1000}])

    def check(self, **kw):
        return check_runtime(self.apk, self.installed, self.sha, 'x86', 'x86', self.observation, 41, **kw)

    def test_separate_executable_segment_and_both_elf_classes(self):
        for abi, (_, _, bits) in ABIS.items():
            self.assertEqual(executable_segments(segmented_elf(abi), bits, 4096), {4096})
            self.assertEqual(executable_segments(segmented_elf(abi), bits, None), {0x1800})
        self.assertTrue(self.check()['passed'])

    def test_header_only_and_unrelated_executable_offset_fail(self):
        rows = self.observation['mappings']
        for replacement in [dict(rows[1], permissions='r--p'), dict(rows[1], offset=rows[0]['offset']),
                            dict(rows[1], offset=rows[1]['offset'] + 4096)]:
            with self.subTest(replacement=replacement):
                self.observation['mappings'] = [rows[0], replacement, *rows[2:]]
                with self.assertRaisesRegex(ValueError, 'executable mapping'):
                    self.check()

    def test_extracted_bytes_must_match(self):
        self.observation['mappings'] = []
        hashes = {}
        for lib in self.libraries:
            path = self.lib_dir + '/' + lib
            hashes[path] = hashlib.sha256(self.data).hexdigest()
            self.observation['mappings'].extend([{'path': path, 'permissions': 'r--p', 'offset': 0},
                                                 {'path': path, 'permissions': 'r-xp', 'offset': 4096}])
        with self.assertRaisesRegex(ValueError, 'digest differs or is missing'):
            self.check()
        self.observation['extractedLibrarySha256'] = hashes
        self.assertTrue(self.check()['passed'])
        hashes[self.lib_dir + '/' + self.libraries[0]] = '0'*64
        with self.assertRaisesRegex(ValueError, 'digest differs or is missing'):
            self.check()

    def test_split_membership_and_pid(self):
        self.observation.update(sourceApk='/base.apk', splitApks=[self.installed])
        self.assertTrue(self.check(base_path='/base.apk')['passed'])
        self.observation['splitApks'].clear()
        with self.assertRaisesRegex(ValueError, 'does not belong'):
            self.check(base_path='/base.apk')
        self.observation.update(sourceApk=self.installed, pid=42)
        with self.assertRaisesRegex(ValueError, 'different measurement process'):
            self.check()


def chunk(kind, data):
    return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data))


class DisplayControls(unittest.TestCase):
    signature = b'\x89PNG\r\n\x1a\n'
    header = chunk(b'IHDR', struct.pack('>IIBBBBB', 1, 1, 8, 2, 0, 0, 0))
    image = zlib.compress(b'\0\x10\x20\x30')
    end = chunk(b'IEND', b'')
    png = signature + header + chunk(b'IDAT', image) + end

    def test_complete_external_and_run_as_exports(self):
        for package in (None, 'com.natophonetics.app'):
            path = 'test.png'
            prefix = ('exec-out', 'run-as', package) if package else ('exec-out',)
            responses = {(*prefix, 'cat', path): self.png,
                         (*prefix, 'sha256sum', path): hashlib.sha256(self.png).hexdigest().encode() + b'  test.png\n'}
            self.assertEqual(pull_png(lambda *args: responses[args], path, package=package), self.png)

    def test_partial_invalid_and_different_exports(self):
        with self.assertRaisesRegex(ValueError, 'differs from device'):
            pull_png(lambda *args: self.png if 'cat' in args else b'0'*64, 'test.png')
        for invalid in [self.png[:8], self.png[:-1], self.png + b'extra', self.png[:-1] + b'X',
                        self.signature + self.header + chunk(b'IDAT', self.image[:-1]) + self.end,
                        self.signature + self.header + chunk(b'IDAT', zlib.compress(b'\0')) + self.end]:
            with self.subTest(invalid=invalid), self.assertRaises(ValueError):
                validate_png(invalid)


class RestorationControls(unittest.TestCase):
    def commands(self, function, *args):
        commands = []
        function(lambda *cmd: commands.append(cmd), *args)
        return commands

    def test_unset_and_numeric_font_scale(self):
        self.assertEqual(self.commands(restore_font_scale, 'null'), [('settings', 'delete', 'system', 'font_scale')])
        self.assertEqual(self.commands(restore_font_scale, '1.30'), [('settings', 'put', 'system', 'font_scale', '1.30')])

    def test_enabled_selected_disabled_and_unset_ime(self):
        self.assertEqual(self.commands(restore_ime, TEST_IME, True), [('ime', 'enable', TEST_IME), ('ime', 'set', TEST_IME)])
        self.assertEqual(self.commands(restore_ime, 'keyboard/.Ime', True),
                         [('ime', 'enable', TEST_IME), ('ime', 'set', 'keyboard/.Ime')])
        self.assertEqual(self.commands(restore_ime, 'keyboard/.Ime', False),
                         [('ime', 'set', 'keyboard/.Ime'), ('ime', 'disable', TEST_IME)])
        self.assertEqual(self.commands(restore_ime, 'null', False),
                         [('ime', 'disable', TEST_IME), ('settings', 'delete', 'secure', 'default_input_method')])


if __name__ == '__main__':
    unittest.main()
