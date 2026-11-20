// Reproducible static hosting candidate. No deployment or external service.
const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { gzipSync } = require('node:zlib');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const digest = data => createHash('sha256').update(data).digest('hex');
const immutable = name => /^(?:assets\/[^/]+-[A-Z0-9]{8}\.[a-z0-9]+|NatoTile-(?:ExtraBold|SemiBold|Italic)-[A-Z0-9]{8}\.ttf)$/.test(name);
const safeName = name => typeof name === 'string' && /^[a-zA-Z0-9_+./-]+$/.test(name) && !name.startsWith('/') && name.split('/').every(part => part && part !== '.' && part !== '..');

async function regularFile(directory, name) {
  if (!safeName(name)) throw new Error(`Unsafe build path: ${name}`);
  let current = directory;
  for (const segment of name.split('/')) {
    current = path.join(current, segment);
    if ((await fs.lstat(current)).isSymbolicLink()) throw new Error(`Symlink in build: ${name}`);
  }
  if (!(await fs.stat(current)).isFile()) throw new Error(`Not a build file: ${name}`);
  return fs.readFile(current);
}

async function readBuild(directory, verifyWorker = true) {
  if ((await fs.lstat(directory)).isSymbolicLink()) throw new Error('Build root must not be a symlink');
  const manifestBytes = await regularFile(directory, 'offline-manifest.json');
  const manifest = JSON.parse(manifestBytes);
  if (!/^[a-f0-9]{64}$/.test(manifest.buildId) || !Array.isArray(manifest.resources) || !manifest.resources.length || !manifest.routes || manifest.routes['/'] !== '/index.html') throw new Error('Invalid offline manifest');
  const files = new Map();
  for (const resource of manifest.resources) {
    if (typeof resource.url !== 'string' || !resource.url.startsWith('/') || !safeName(resource.url.slice(1)) || !/^[a-f0-9]{64}$/.test(resource.sha256) || files.has(resource.url.slice(1))) throw new Error('Unsafe or duplicate manifest resource');
    const name = resource.url.slice(1);
    const bytes = await regularFile(directory, name);
    if (digest(bytes) !== resource.sha256) throw new Error(`Resource digest mismatch: ${name}`);
    files.set(name, bytes);
  }
  for (const [route, target] of Object.entries(manifest.routes)) {
    if (!route.startsWith('/') || typeof target !== 'string' || !files.has(target.slice(1))) throw new Error(`Missing route resource: ${route}`);
  }
  const worker = await regularFile(directory, 'service-worker.js');
  if (verifyWorker) {
    const { ROUTE_TITLES } = await import(pathToFileURL(path.join(root, 'src/navigation/routes.js')));
    const routes = Object.fromEntries(Object.keys(ROUTE_TITLES).map(route => [route, route === '/' ? '/index.html' : route + '.html']));
    if (JSON.stringify(manifest.routes) !== JSON.stringify(routes)) throw new Error('Manifest does not cover the current route table');
    const template = await fs.readFile(path.join(root, 'web/service-worker.js'), 'utf8');
    const expectedId = digest(JSON.stringify(manifest.resources) + JSON.stringify(manifest.routes) + template);
    const expectedWorker = template.replaceAll('{{BUILD_ID}}', manifest.buildId).replaceAll('{{RESOURCES}}', JSON.stringify(manifest.resources)).replaceAll('{{ROUTES}}', JSON.stringify(manifest.routes));
    if (manifest.buildId !== expectedId || !worker.equals(Buffer.from(expectedWorker))) throw new Error('Worker and manifest do not match the current build template');
  }
  files.set('service-worker.js', worker);
  files.set('offline-manifest.json', manifestBytes);
  return { manifest, files };
}

// POSIX ustar, fixed owners/mode/mtime and sorted paths. No shell/platform tar
// flags or filesystem timestamps affect the bytes. All current names fit 100B.
function archive(files) {
  const blocks = [];
  for (const [name, bytes] of [...files].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
    if (!safeName(name) || Buffer.byteLength(name) > 100) throw new Error(`Archive path is invalid or too long: ${name}`);
    const header = Buffer.alloc(512);
    const text = (offset, value) => header.write(value, offset, 'ascii');
    const octal = (offset, length, value) => {
      const encoded = value.toString(8);
      if (encoded.length > length - 1) throw new Error('Archive file too large');
      text(offset, encoded.padStart(length - 1, '0') + '\0');
    };
    text(0, name); octal(100, 8, 0o644); octal(108, 8, 0); octal(116, 8, 0);
    octal(124, 12, bytes.length); octal(136, 12, 0);
    header.fill(32, 148, 156); text(156, '0'); text(257, 'ustar\0'); text(263, '00');
    const sum = header.reduce((total, byte) => total + byte, 0);
    text(148, sum.toString(8).padStart(6, '0') + '\0 ');
    blocks.push(header, bytes, Buffer.alloc((512 - bytes.length % 512) % 512));
  }
  blocks.push(Buffer.alloc(1024));
  return gzipSync(Buffer.concat(blocks), { level: 9 });
}

async function packageWeb({ directory, output, retain = [] }) {
  directory = path.resolve(directory); output = path.resolve(output);
  if (output.startsWith(directory + path.sep)) throw new Error('Archive must be outside the build directory');
  const { manifest, files } = await readBuild(directory);
  const retained = [];
  for (const priorDirectory of retain) {
    const prior = path.resolve(priorDirectory);
    const previous = await readBuild(prior, false);
    let priorRelease;
    // Include prior retained files as well, so repeated upgrades preserve the
    // whole immutable set. Unknown files and build metadata are never served.
    const names = [...(await fs.readdir(prior)), ...(await fs.readdir(path.join(prior, 'assets')).catch(error => { if (error.code === 'ENOENT') return []; throw error; })).map(name => 'assets/' + name)];
    for (const name of names.filter(immutable)) {
      let bytes = previous.files.get(name);
      if (!bytes) {
        // A transitive asset is outside that build's worker manifest. Require
        // its original release inventory; never bless an uninventoried file.
        if (!priorRelease) {
          try { priorRelease = JSON.parse(await regularFile(path.dirname(prior), 'release.json')); }
          catch (error) { if (error.code === 'ENOENT') throw new Error(`Uninventoried retained asset: ${name}`); throw error; }
          if (priorRelease.format !== 1 || !priorRelease.files || digest(JSON.stringify(priorRelease.files)) !== priorRelease.contentId) throw new Error('Invalid prior release inventory');
        }
        const record = priorRelease.files['public/' + name];
        bytes = await regularFile(prior, name);
        if (!record || record.sha256 !== digest(bytes) || record.bytes !== bytes.length) throw new Error(`Retained asset digest mismatch: ${name}`);
      }
      if (files.has(name)) {
        if (!files.get(name).equals(bytes)) throw new Error(`Immutable URL collision: /${name}`);
      } else { files.set(name, bytes); retained.push('/' + name); }
    }
  }
  const packed = new Map([...files].map(([name, bytes]) => ['public/' + name, bytes]));
  packed.set('Caddyfile', await fs.readFile(path.join(root, 'deploy/Caddyfile')));
  const inventory = Object.fromEntries([...packed].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([name, bytes]) => [name, { sha256: digest(bytes), bytes: bytes.length }]));
  const contentId = digest(JSON.stringify(inventory));
  const release = { format: 1, version: require('../package.json').version, shellBuildId: manifest.buildId, contentId, retainedAssets: retained.sort(), files: inventory };
  packed.set('release.json', Buffer.from(JSON.stringify(release, null, 2) + '\n'));
  const bytes = archive(packed);
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, bytes, { flag: 'wx' });
  return { output, sha256: digest(bytes), bytes: bytes.length, ...release };
}

module.exports = { packageWeb, readBuild };
if (require.main === module) {
  const [directory, output, ...retain] = process.argv.slice(2);
  if (!directory || !output) { console.error('Usage: node scripts/package-web.cjs BUILD_DIR NEW_ARCHIVE.tar.gz [PRIOR_PUBLIC_DIR ...]'); process.exitCode = 1; }
  else packageWeb({ directory, output, retain }).then(result => console.log(JSON.stringify(result, null, 2))).catch(error => { console.error(error.message); process.exitCode = 1; });
}
