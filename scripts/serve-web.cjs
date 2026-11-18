const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

/** Shared by local preview and browser gates, including unknown-route fallback. */
function staticHandler(directory) {
  const root = path.resolve(directory);
  return (req, res) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
    catch { res.writeHead(400); return res.end(); }
    let file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
    if (!path.extname(file)) file += '.html';
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      if (path.extname(pathname)) { res.writeHead(404); return res.end(); }
      file = path.join(root, 'index.html');
    }
    res.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.ttf': 'font/ttf' })[path.extname(file)] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-cache');
    fs.createReadStream(file).pipe(res);
  };
}

function startServer(directory, port = 8080) {
  const server = http.createServer(staticHandler(directory));
  server.listen(port, '127.0.0.1', () => console.log(`Web preview: http://127.0.0.1:${server.address().port}`));
  return server;
}

module.exports = { staticHandler, startServer };
if (require.main === module) startServer(process.argv[2] || 'dist', Number(process.env.PORT) || 8080);
