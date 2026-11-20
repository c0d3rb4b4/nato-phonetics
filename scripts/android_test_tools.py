"""Host tools for the pinned Android font qualification harness."""
import os
from pathlib import Path


TEST_IME = 'com.natophonetics.fonttest/.FontTestIme'


def restore_font_scale(shell, original):
    if original == 'null':
        shell('settings', 'delete', 'system', 'font_scale')
    else:
        shell('settings', 'put', 'system', 'font_scale', original)


def restore_ime(shell, original, test_was_enabled):
    if test_was_enabled:
        shell('ime', 'enable', TEST_IME)
    if original and original != 'null':
        shell('ime', 'set', original)
    if not test_was_enabled:
        shell('ime', 'disable', TEST_IME)
    if original == 'null':
        shell('settings', 'delete', 'secure', 'default_input_method')


def executable(path):
    return str(path.with_name(path.name + '.exe') if os.name == 'nt' else path)


def build_tool(name):
    directory = Path(os.environ['ANDROID_HOME']) / 'build-tools/36.0.0'
    if os.name == 'nt' and name in ('d8', 'apksigner'):
        # Use the same JAR, entry point and JVM defaults as the SDK's .bat
        # launchers without passing checkout or output paths through a shell.
        java = executable(Path(os.environ['JAVA_HOME']) / 'bin/java')
        jar = str(directory / 'lib' / (name + '.jar'))
        entry = ['-cp', jar, 'com.android.tools.r8.D8'] if name == 'd8' else ['-jar', jar]
        return [java, '-Xmx1024M', '-Xss1m', *entry]
    return [executable(directory / name)]
