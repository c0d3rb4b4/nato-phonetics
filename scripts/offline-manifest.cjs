const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');

/** Bind one complete shell to a worker; also used by update test fixtures. */
async function writeOfflineManifest(output, routes, resourcePaths) {
  const resources = await Promise.all([...new Set(resourcePaths)].sort().map(async url => ({
    url, sha256: createHash('sha256').update(await fs.readFile(path.join(output, url.slice(1)))).digest('hex'),
  })));
  const template = await fs.readFile(path.join(__dirname, '../web/service-worker.js'), 'utf8');
  const buildId = createHash('sha256').update(JSON.stringify(resources) + JSON.stringify(routes) + template).digest('hex');
  const worker = template.replaceAll('{{BUILD_ID}}', buildId).replaceAll('{{RESOURCES}}', JSON.stringify(resources)).replaceAll('{{ROUTES}}', JSON.stringify(routes));
  await fs.writeFile(path.join(output, 'service-worker.js'), worker);
  await fs.writeFile(path.join(output, 'offline-manifest.json'), JSON.stringify({ buildId, resources, routes }, null, 2) + '\n');
  return { buildId, resources, routes };
}
module.exports = { writeOfflineManifest };
