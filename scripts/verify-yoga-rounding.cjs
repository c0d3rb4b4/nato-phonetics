// Compile the actual installed Yoga source, rather than a JS rounding model.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const yoga = path.join(path.dirname(require.resolve('react-native/package.json')), 'ReactCommon/yoga');
function sources(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? sources(file) : entry.name.endsWith('.cpp') ? [file] : [];
  });
}
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nato-yoga-'));
try {
  let files = sources(path.join(yoga, 'yoga'));
  // Optional frozen source is used only for the recorded before/after experiment.
  if (process.argv[2]) files = files.map(file => file.endsWith('/algorithm/PixelGrid.cpp') ? path.resolve(process.argv[2]) : file);
  const binary = path.join(tmp, 'rounding');
  const build = spawnSync(process.env.CXX || 'c++', ['-std=c++20', '-O1', '-I', yoga, path.join(root, 'tests/native/yoga-rounding.cpp'), ...files, '-o', binary], { stdio: 'inherit' });
  if (build.error) throw build.error;
  if (build.status !== 0) process.exitCode = build.status ?? 1;
  else process.exitCode = spawnSync(binary, [], { stdio: 'inherit' }).status ?? 1;
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }
