// Independent production web build. Native builds use Metro, never this bundle.
const fs = require('node:fs/promises');
const path = require('node:path');
const { writeOfflineManifest } = require('./offline-manifest.cjs');
const { pathToFileURL } = require('node:url');
const esbuild = require('esbuild');
const { startServer } = require('./serve-web.cjs');

async function main() {
  const project = path.resolve(__dirname, '..');
  const output = path.resolve(project, process.env.WEB_OUTPUT_DIR || 'dist');
  const development = process.argv.includes('--serve');
  if (output === project || project.startsWith(output + path.sep) || output === path.parse(output).root) {
    throw new Error('Web output must be a dedicated build directory, never the project or an ancestor.');
  }
  // dist is the established disposable build directory. Custom nonempty
  // destinations must have our ownership marker before we clean them.
  if (output !== path.join(project, 'dist')) {
    const existing = await fs.readdir(output).catch(error => {
      if (error.code === 'ENOENT') return [];
      throw error;
    });
    if (existing.length && !existing.includes('.nato-web-output')) throw new Error('Custom web output is not empty or owned by this build. Choose a new directory.');
  }
  await fs.rm(output, { recursive: true, force: true });
  const { ROUTE_TITLES } = await import(pathToFileURL(path.join(project, 'src/navigation/routes.js')));
  const metadata = JSON.parse(await fs.readFile(path.join(project, 'app.json'), 'utf8'));
  const template = await fs.readFile(path.join(project, 'web/index.html'), 'utf8');
  const escape = value => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  await fs.mkdir(output, { recursive: true });
  const options = {
    absWorkingDir: project,
    entryPoints: ['index.web.js'],
    outdir: output,
    entryNames: 'assets/app-[hash]',
    bundle: true,
    minify: !development,
    sourcemap: development,
    metafile: true,
    platform: 'browser',
    format: 'esm',
    target: ['es2022'],
    jsx: 'automatic',
    loader: { '.js': 'jsx', '.png': 'file', '.ttf': 'file' },
    alias: { 'react-native': 'react-native-web' },
    resolveExtensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js', '.json'],
    define: { 'process.env.NODE_ENV': JSON.stringify(development ? 'development' : 'production'), __DEV__: String(development), global: 'globalThis' },
    logLevel: 'info',
    plugins: [{ name: 'route-pages', setup(build) {
      build.onEnd(async result => {
        if (result.errors.length || !result.metafile) return;
        const entry = Object.entries(result.metafile.outputs).find(([, details]) => details.entryPoint === 'index.web.js');
        if (!entry) throw new Error('Web entry bundle was not generated.');
        const bundle = '/' + path.relative(output, path.resolve(project, entry[0])).split(path.sep).join('/');
        await Promise.all(Object.entries(ROUTE_TITLES).map(([route, title]) => {
          const html = template.replaceAll('{{TITLE}}', escape(`${title} · ${metadata.displayName}`)).replaceAll('{{BUNDLE}}', bundle);
          return fs.writeFile(path.join(output, route === '/' ? 'index.html' : route.slice(1) + '.html'), html);
        }));
        await fs.copyFile(path.join(project, 'assets/images/favicon.png'), path.join(output, 'favicon.png'));
        if (!development) {
          const routes = Object.fromEntries(Object.keys(ROUTE_TITLES).map(route => [route, route === '/' ? '/index.html' : route + '.html']));
          await writeOfflineManifest(output, routes, [...Object.values(routes), '/favicon.png',
            ...Object.keys(result.metafile.outputs).map(file => '/' + path.relative(output, path.resolve(project, file)).split(path.sep).join('/'))]);
        }
        // No catch-all rewrite: some static hosts turn missing assets into HTML.
        // Host configuration must explicitly implement the documented routing.
        await fs.writeFile(path.join(output, '_headers'), '/service-worker.js\n  Cache-Control: no-cache\n/*.html\n  Cache-Control: no-cache\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n');
        await fs.writeFile(path.join(output, '.nato-web-output'), 'Generated NATO Phonetics web build; safe to replace.\n');
      });
    } }],
  };
  if (development) {
    const context = await esbuild.context(options);
    await context.rebuild();
    await context.watch();
    startServer(output, Number(process.env.PORT) || 8080);
  } else {
    await esbuild.build(options);
    console.log(`Built ${Object.keys(ROUTE_TITLES).length} route pages in ${output}`);
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
