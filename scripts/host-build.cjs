#!/usr/bin/env node
// Shared host execution. Dispatch/SSH/runner enrollment deliberately live outside it.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { createHash } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const npmInvocation = require('./npm-invocation.cjs');

const MODES = ['checks', 'web', 'android-debug', 'android-develop', 'android-release', 'ios-simulator', 'ios-archive', 'ios-export'];
const hash = value => createHash('sha256').update(value).digest('hex');
const json = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
function command(command, args, root) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error(`${command} ${args.join(' ')}: ${result.error?.message || result.stderr || result.stdout}`);
  return result.stdout.trim();
}

function sourceSnapshot(root) {
  const head = command('git', ['rev-parse', 'HEAD'], root);
  const names = command('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], root)
    .split('\0').filter(name => name && !name.startsWith('docs/evidence/')).sort();
  const files = {};
  for (const name of new Set(names)) {
    const file = path.join(root, name);
    if (!fs.existsSync(file)) { files[name] = null; continue; }
    const stat = fs.lstatSync(file);
    files[name] = stat.isSymbolicLink()
      ? { symlink: fs.readlinkSync(file) }
      : { sha256: hash(fs.readFileSync(file)), executable: Boolean(stat.mode & 0o111) };
  }
  const patch = spawnSync('git', ['diff', '--binary', 'HEAD', '--', '.', ':(exclude)docs/evidence'], { cwd: root, maxBuffer: 32 * 1024 * 1024 });
  if (patch.status !== 0 || patch.error) throw new Error('Unable to identify candidate patch');
  const untracked = command('git', ['ls-files', '--others', '--exclude-standard', '-z'], root).split('\0').filter(name => name && name in files);
  return { head, files, sourceId: hash(JSON.stringify({ head, files })), patch: patch.stdout, untracked };
}

function parseArgs(args) {
  const options = { mode: args.shift(), jobs: 1 };
  while (args.length) {
    const name = args.shift();
    if (name === '--install') options.install = true;
    else if (name === '--preflight-only') options.preflightOnly = true;
    else if (['--output', '--expected-source', '--jobs'].includes(name)) {
      const value = args.shift();
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${name}`);
      options[{ '--output': 'output', '--expected-source': 'expectedSource', '--jobs': 'jobs' }[name]] = value;
    } else throw new Error(`Unknown option ${name}`);
  }
  options.jobs = Number(options.jobs);
  if (!MODES.includes(options.mode) || !options.output || !Number.isInteger(options.jobs) || options.jobs < 1 || options.jobs > 4) {
    throw new Error(`Usage: node scripts/host-build.cjs ${MODES.join('|')} --output <new-directory> [--install] [--preflight-only] [--jobs 1..4] [--expected-source <sha256>]`);
  }
  return options;
}

function runHost(options) {
  const root = path.resolve(options.root || path.join(__dirname, '..'));
  const output = path.resolve(root, options.output);
  const relative = path.relative(root, output);
  if (!relative || (!relative.startsWith('..' + path.sep) && !path.isAbsolute(relative) && !relative.startsWith('artifacts' + path.sep))) {
    throw new Error('Output must be outside the checkout or under artifacts/');
  }
  if (fs.existsSync(output)) throw new Error('Output directory already exists; use a new job directory');
  fs.mkdirSync(output, { recursive: true });
  const report = { schemaVersion: 2, mode: options.mode, startedAt: new Date().toISOString(), status: 'running',
    host: { platform: process.platform, arch: process.arch, release: os.release(), node: process.versions.node },
    jobs: options.jobs || 1, install: Boolean(options.install), preflightOnly: Boolean(options.preflightOnly),
    remoteJob: process.env.GITHUB_RUN_ID ? { provider: 'github', runId: process.env.GITHUB_RUN_ID,
      runUrl: `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`, attempt: process.env.GITHUB_RUN_ATTEMPT } : null,
    steps: [], artifacts: [] };
  const reportFile = path.join(output, 'report.json');
  const lock = path.join(root, 'artifacts', '.host-build.lock');
  let ownsLock = false;
  let source;
  let staging;
  const promoted = [];
  const save = () => json(reportFile, report);
  function step(name, executable, args, { cwd = root, required = true, env = {}, jsonOutput = false } = {}) {
    const log = `logs/${String(report.steps.length + 1).padStart(2, '0')}-${name}.log`;
    fs.mkdirSync(path.join(output, 'logs'), { recursive: true });
    const fd = fs.openSync(path.join(output, log), 'wx');
    const startedAt = new Date().toISOString();
    fs.writeSync(fd, JSON.stringify({ executable, args, cwd, startedAt }) + '\n');
    console.log(`${name}: ${log}`);
    let result;
    const resultFile = path.join(output, name + '.json');
    const stdout = jsonOutput ? fs.openSync(resultFile, 'wx') : fd;
    try {
      result = spawnSync(executable, args, { cwd, stdio: ['ignore', stdout, fd],
        env: { ...process.env, NATO_BUILD_JOBS: String(report.jobs), ...env } });
      if (result.error) fs.writeSync(fd, result.error.message + '\n');
    } finally {
      fs.closeSync(fd);
      if (jsonOutput) fs.closeSync(stdout);
    }
    const record = { name, executable, args, log, startedAt, endedAt: new Date().toISOString(),
      exitCode: result.status ?? 1, signal: result.signal || null };
    report.steps.push(record); save();
    if (required && record.exitCode !== 0) throw new Error(`${name} failed (${record.exitCode}); see ${log}`);
    return jsonOutput ? JSON.parse(fs.readFileSync(resultFile, 'utf8')) : record.exitCode;
  }
  function artifact(file, name = path.basename(file)) {
    if (!fs.statSync(file).isFile()) throw new Error(`Artifact missing: ${file}`);
    const destination = path.join(staging, name);
    if (path.resolve(file) !== destination) fs.copyFileSync(file, destination);
    report.artifacts.push({ file: name, bytes: fs.statSync(destination).size, sha256: hash(fs.readFileSync(destination)) });
  }
  try {
    save();
    if (!MODES.includes(options.mode)) throw new Error('Unsupported mode; framework diagnostics require a justified regression and separate pinned source configuration');
    fs.mkdirSync(path.dirname(lock), { recursive: true });
    try { fs.mkdirSync(lock); ownsLock = true; } catch (error) {
      if (error.code === 'EEXIST') throw new Error('Another host build holds artifacts/.host-build.lock; inspect its owner before retrying');
      throw error;
    }
    json(path.join(lock, 'owner.json'), { pid: process.pid, output, startedAt: report.startedAt });
    source = sourceSnapshot(root);
    const { patch, untracked, ...identity } = source;
    report.sourceId = source.sourceId;
    report.commit = source.head;
    json(path.join(output, 'source.json'), { ...identity, patchSha256: hash(patch), untracked,
      exclusions: ['ignored files', 'docs/evidence/ (historical/generated evidence, not standard build input)'] });
    fs.writeFileSync(path.join(output, 'source.patch'), patch);
    for (const name of untracked) {
      const destination = path.join(output, 'source-untracked', name);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.cpSync(path.join(root, name), destination, { dereference: false, verbatimSymlinks: true });
    }
    if (options.expectedSource && options.expectedSource !== source.sourceId) throw new Error('Candidate source ID does not match --expected-source');
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    const expectedNode = fs.readFileSync(path.join(root, '.nvmrc'), 'utf8').trim();
    if (process.versions.node !== expectedNode) throw new Error(`Use pinned Node ${expectedNode}; found ${process.versions.node}`);
    const { executable: npm, prefix } = npmInvocation;
    const npmVersion = command(npm, [...prefix, '--version'], root);
    if (pkg.packageManager !== `npm@${npmVersion}`) throw new Error(`Use ${pkg.packageManager}; found npm@${npmVersion}`);
    const disk = fs.statfsSync(output);
    report.preflight = { npm: npmVersion, diskAvailableBytes: disk.bavail * disk.bsize,
      totalMemoryBytes: os.totalmem(), freeMemoryBytes: os.freemem(), cpus: os.availableParallelism(), tools: {},
      capacityPolicy: 'Measured inventory; no universal minimum or guarantee that a first build fits.' };
    if (options.mode.startsWith('android-')) {
      const java = spawnSync(process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin', 'java') : 'java', ['-version'], { encoding: 'utf8' });
      const version = (java.stderr || '') + (java.stdout || '');
      report.preflight.tools.java = version.trim();
      if (java.status !== 0 || !/version "17\./.test(version)) throw new Error('Android requires JDK17; set JAVA_HOME');
      const localProperties = path.join(root, 'android/local.properties');
      const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || (fs.existsSync(localProperties) && fs.readFileSync(localProperties, 'utf8').match(/^sdk\.dir=(.+)$/m)?.[1]);
      if (!sdk) throw new Error('Set ANDROID_HOME to the prepared Android SDK');
      for (const part of ['platforms/android-36/android.jar', 'build-tools/36.0.0', 'ndk/27.1.12297006/source.properties']) {
        if (!fs.existsSync(path.join(sdk, part))) throw new Error(`Android SDK prerequisite missing: ${part}`);
      }
      report.preflight.tools.android = { sdk, ndk: fs.readFileSync(path.join(sdk, 'ndk/27.1.12297006/source.properties'), 'utf8').trim(),
        cmakeInstalled: fs.existsSync(path.join(sdk, 'cmake')) ? fs.readdirSync(path.join(sdk, 'cmake')) : [] };
    }
    if (options.mode.startsWith('ios-')) {
      if (process.platform !== 'darwin') throw new Error('iOS requires a qualified macOS/Xcode host');
      report.preflight.tools.xcode = command('xcodebuild', ['-version'], root);
      report.preflight.tools.sdk = command('xcrun', ['--sdk', options.mode === 'ios-simulator' ? 'iphonesimulator' : 'iphoneos', '--show-sdk-version'], root);
      if (options.install) {
        const ruby = command('ruby', ['--version'], root);
        const pin = fs.readFileSync(path.join(root, '.ruby-version'), 'utf8').trim();
        if (!ruby.startsWith(`ruby ${pin} `)) throw new Error(`Use Ruby ${pin} before installing locked Pods`);
        report.preflight.tools.ruby = ruby;
        report.preflight.tools.bundler = command('bundle', ['--version'], root);
        const bundlerPin = fs.readFileSync(path.join(root, 'Gemfile.lock'), 'utf8').match(/BUNDLED WITH\s+([\d.]+)/)?.[1];
        if (report.preflight.tools.bundler !== `Bundler version ${bundlerPin}`) throw new Error(`Use Bundler ${bundlerPin}`);
      }
    }
    json(path.join(output, 'preflight.json'), report.preflight); save();
    if (!options.preflightOnly) {
      // Keep unqualified products outside the upload directory, including on cancellation.
      staging = fs.mkdtempSync(output + '.staging-');
      if (options.install) {
        step('locked-install', npm, [...prefix, 'ci']);
        if (options.mode.startsWith('ios-')) {
          const env = { BUNDLE_FROZEN: 'true', BUNDLE_PATH: 'vendor/bundle' };
          step('locked-ruby', 'bundle', ['install'], { env });
          step('locked-pods', 'bundle', ['exec', 'pod', 'install', '--deployment', '--project-directory=ios'], { env });
        }
      }
      if (options.mode === 'checks') {
        for (const task of ['check:dependencies', 'typecheck', 'lint', 'test', 'audit:review']) step(task.replace(':', '-'), npm, [...prefix, 'run', task], { required: false });
        if (report.steps.some(record => record.exitCode !== 0)) throw new Error('One or more quality/security checks failed; all results retained');
      } else if (options.mode === 'web') {
        step('package-regressions', process.execPath, ['--test', 'tests/web-package.test.mjs']);
        step('web-build', npm, [...prefix, 'run', 'export:web']);
        step('web-package', process.execPath, ['scripts/package-web.cjs', 'dist', path.join(staging, 'nato-web.tar.gz')]);
        artifact(path.join(staging, 'nato-web.tar.gz'));
      } else {
        step('native-build', process.execPath, ['scripts/build-native.cjs', options.mode]);
        if (options.mode.startsWith('android-')) {
          const variant = options.mode.slice('android-'.length);
          const builds = path.join(root, 'android/app/build/outputs');
          const unsigned = variant === 'release' && !process.env.NATO_UPLOAD_STORE_FILE;
          const apkName = `app-${variant}${unsigned ? '-unsigned' : ''}.apk`;
          artifact(path.join(builds, 'apk', variant, apkName));
          if (variant === 'release') artifact(path.join(builds, 'bundle/release/app-release.aab'));
          report.product = step('verify-android-product', process.platform === 'win32' ? 'python' : 'python3', [
            'scripts/verify-android-product.py', options.mode, ...report.artifacts.map(a => path.join(staging, a.file)),
          ], { jsonOutput: true });
        } else {
          const products = { 'ios-simulator': ['artifacts/ios-simulator/Build/Products/Release-iphonesimulator', 'NATOPhonetics.app'],
            'ios-archive': ['artifacts', 'NATOPhonetics.xcarchive'], 'ios-export': ['artifacts', 'ios-export'] };
          const [directory, name] = products[options.mode];
          const archive = path.join(staging, `${options.mode}.tar.gz`);
          step('preserve-native-product', 'tar', ['-czf', archive, '-C', path.join(root, directory), name]);
          artifact(archive);
          if (options.mode === 'ios-simulator') {
            report.product = step('verify-ios-simulator', 'python3', [
              'scripts/verify-ios-simulator.py', archive, path.join(output, 'ios-home.png'),
            ], { jsonOutput: true });
          }
        }
      }
    }
    if (sourceSnapshot(root).sourceId !== source.sourceId) throw new Error('Candidate source changed during execution; artifact qualification rejected');
    for (const product of report.artifacts) {
      const target = path.join(output, product.file);
      fs.renameSync(path.join(staging, product.file), target);
      promoted.push(target);
    }
    report.status = options.preflightOnly ? 'preflight-pass' : 'passed';
    report.exitCode = 0;
  } catch (error) {
    for (const file of promoted) fs.unlinkSync(file);
    report.artifacts = [];
    report.status = 'failed'; report.exitCode = 1; report.error = error.message;
    console.error(error.message);
  } finally {
    report.endedAt = new Date().toISOString(); save();
    if (staging) fs.rmSync(staging, { recursive: true, force: true });
    if (ownsLock) fs.rmSync(lock, { recursive: true });
  }
  return report;
}

if (require.main === module) {
  try { process.exitCode = runHost(parseArgs(process.argv.slice(2))).exitCode; }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { npmInvocation, parseArgs, runHost, sourceSnapshot };
