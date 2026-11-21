/** The route table is shared by native linking, browser navigation and builds. */
export const ROUTE_TITLES = {
  '/': 'Reference',
  '/alphabet': 'Reference',
  '/converter': 'Word Converter',
  '/letter-quiz': 'Letter Quiz',
  '/progress': 'Learning Progress',
  '/menu': 'Menu',
  '/settings': 'Settings',
  '/about': 'About',
  '/voice-select': 'Select Voice',
  '/privacy': 'Privacy Policy',
  '/audio-help': 'Audio Help',
  '/_sitemap': 'Site Map',
  '/+not-found': 'Page Not Found',
};

export const PRIMARY_ROUTES = /** @type {const} */ (['/alphabet', '/converter', '/letter-quiz', '/menu']);

/** @param {import('../types').RoutePath} path */
export function primaryRoute(path) {
  const candidate = path === '/' ? '/alphabet' : path;
  return PRIMARY_ROUTES.find(route => route === candidate);
}

/** @param {string} value
 * @returns {import('../types').RoutePath} */
export function resolveRoute(value) {
  // Custom-scheme URLs use both host-style (://converter) and path-style
  // (:///converter) forms. Web routes also support static-host .html URLs.
  let path = value.replace(/^natophonetics(?:-dev)?:\/\//i, '/').split(/[?#]/)[0];
  try { path = decodeURIComponent(path); } catch { return '/+not-found'; }
  path = path.replace(/^\/+/, '/').replace(/\.html$/, '').replace(/\/+$/, '') || '/';
  if (path === '/index') path = '/';
  return Object.hasOwn(ROUTE_TITLES, path) ? /** @type {import('../types').RoutePath} */ (path) : '/+not-found';
}
