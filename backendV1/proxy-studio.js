import http from 'http';
import httpProxy from 'http-proxy';

// Create a proxy server that forwards requests and websockets to Prisma Studio
const proxy = httpProxy.createProxyServer({
  target: 'http://localhost:5555',
  ws: true, // Very important for Prisma Studio's live data
  changeOrigin: true
});

// Rewrite the Origin header to bypass Prisma Studio's CSRF/CORS protection
proxy.on('proxyReq', function(proxyReq, req, res, options) {
  if (req.headers.origin) {
    proxyReq.setHeader('origin', 'http://localhost:5555');
  }
});

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    http.get('http://localhost:5555/', (proxyRes) => {
      let body = '';
      proxyRes.on('data', chunk => body += chunk);
      proxyRes.on('end', () => {
        const polyfill = `
<script>
if (!window.crypto) window.crypto = {};
if (!window.crypto.randomUUID) {
  window.crypto.randomUUID = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
}
</script>`;
        body = body.replace('<head>', '<head>' + polyfill);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(body);
      });
    }).on('error', (err) => {
      console.error('Fetch HTML error:', err.message);
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Prisma Studio is not running. Please start it on port 5555 first.');
    });
  } else {
    proxy.web(req, res, (err) => {
      console.error('Proxy WEB error:', err.message);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'text/plain' });
        res.end('Prisma Studio is not running. Please start it on port 5555 first.');
      }
    });
  }
});

server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head, (err) => {
    console.error('Proxy WS error:', err.message);
    socket.destroy();
  });
});

const PORT = 5556;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`\n======================================================`);
  console.log(`🌐 Prisma Studio Network Proxy Started!`);
  console.log(`======================================================`);
  console.log(`You can now access Prisma Studio from other devices at:`);
  console.log(`👉 http://172.16.97.209:${PORT}`);
  console.log(`======================================================\n`);
  console.log(`(Make sure 'npx prisma studio --port 5555' is running in another terminal)`);
});
