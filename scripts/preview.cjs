const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const output = path.resolve(__dirname, '../dist');
const portIndex = process.argv.indexOf('--port');
const port = Number(portIndex < 0 ? process.env.PORT || 4173 : process.argv[portIndex + 1]);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Use a port between 1 and 65535.');
if (!fs.existsSync(path.join(output, 'index.html'))) throw new Error('Run npm run build before previewing.');

// Only production artifacts are served, never source, drafts, or local preview history.
const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/favicon.svg', ['favicon.svg', 'image/svg+xml']],
  ['/robots.txt', ['robots.txt', 'text/plain; charset=utf-8']]
]);
const server = http.createServer((request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end('Method not allowed');
    return;
  }
  const url = new URL(request.url, 'http://127.0.0.1');
  const file = files.get(url.pathname);
  if (!file) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
    return;
  }
  fs.readFile(path.join(output, file[0]), (error, content) => {
    if (error) {
      response.writeHead(500).end('Build output unavailable. Run npm run build.');
      return;
    }
    response.writeHead(200, {
      'Content-Type': file[1],
      'Content-Length': content.length,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    });
    response.end(request.method === 'HEAD' ? undefined : content);
  });
});
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? `Port ${port} is in use. Try npm run preview -- --port 4174.` : error.message);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => console.log(`Production preview: http://localhost:${port}/`));
