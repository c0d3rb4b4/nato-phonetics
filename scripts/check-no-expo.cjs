const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const lock = require('../package-lock.json');
const errors = [];
const forbiddenPackage = name => /^(?:expo(?:-|$)|@expo\/|eas-cli$)/.test(name);
for (const [location, pkg] of Object.entries(lock.packages)) {
  const name = pkg.name || location.split('node_modules/').at(-1);
  if (forbiddenPackage(name)) errors.push(`Lockfile: ${location}`);
}
const graph = spawnSync('npm', ['ls', '--all', '--json'], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
if (graph.status !== 0) errors.push(`Installed graph invalid: ${graph.stderr.trim()}`);
const visitGraph = node => {
  for (const [name, dependency] of Object.entries(node.dependencies || {})) {
    if (forbiddenPackage(name)) errors.push(`Installed dependency: ${name}`);
    visitGraph(dependency);
  }
};
try { visitGraph(JSON.parse(graph.stdout)); } catch { errors.push('Installed dependency graph unreadable'); }
const roots = ['app', 'src', 'web', 'android', 'ios', '.github', 'scripts', 'index.js', 'index.web.js', 'app.json', 'package.json', 'metro.config.js', 'babel.config.js'];
const ignored = new Set(['node_modules', 'Pods', 'build', '.gradle', '.cxx']);
const check = file => {
  if (path.resolve(file) === __filename) return;
  if (!fs.existsSync(file)) return;
  if (fs.statSync(file).isDirectory()) {
    for (const name of fs.readdirSync(file)) if (!ignored.has(name)) check(path.join(file, name));
  } else if (/\.(?:[cm]?js|jsx|tsx?|json|gradle|properties|rb|pbxproj|sh|yml|yaml|kt|java|swift|mm?|h|xml|plist|xcscheme|xcworkspacedata)$/.test(file) || /Podfile(?:\.lock)?$/.test(file)) {
    if (/(?:["'](?:expo(?:\/|-[\w/-]*|["'])|@expo\/)|\bexpo (?:start|export|prebuild|install)|\beas build|\beas-cli\b|\bEXPO_\w+|\bExpo(?:ModulesCore|ModulesProvider|[A-Z]\w*)?\b)/.test(fs.readFileSync(file, 'utf8'))) {
      errors.push(`Maintained consumer: ${file}`);
    }
  }
};
roots.forEach(check);
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`Expo-free manifest, ${Object.keys(lock.packages).length - 1} locked packages, installed graph and maintained native/web consumers verified.`);
