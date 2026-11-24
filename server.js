// Study Planner backend: REST API + static file server (Node.js built-ins only).
const http = require('http');
const fs = require('fs');
const path = require('path');
const store = require('./store');

const PORT = process.env.PORT || 3000;
const FRONTEND = path.join(__dirname, '..', 'frontend');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 1e6) req.destroy();
    });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch { reject(new Error('Invalid JSON')); }
    });
  });
}

async function handleApi(req, res, url) {
  const parts = url.pathname.split('/').filter(Boolean); // ['api','tasks',':id']
  const id = parts[2];

  try {
    if (parts[1] !== 'tasks') return send(res, 404, { error: 'Not found' });

    if (req.method === 'GET' && !id) {
      return send(res, 200, store.list());
    }
    if (req.method === 'POST' && !id) {
      const body = await readBody(req);
      if (!body.title || !body.title.trim()) {
        return send(res, 400, { error: 'Title is required' });
      }
      return send(res, 201, store.create(body));
    }
    if (req.method === 'PATCH' && id) {
      const body = await readBody(req);
      const task = store.update(id, body);
      return task ? send(res, 200, task) : send(res, 404, { error: 'Task not found' });
    }
    if (req.method === 'DELETE' && id) {
      return store.remove(id) ? send(res, 200, { ok: true }) : send(res, 404, { error: 'Task not found' });
    }
    send(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    send(res, 400, { error: err.message });
  }
}

function serveStatic(req, res, url) {
  const rel = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  const file = path.join(FRONTEND, path.normalize(rel));
  if (!file.startsWith(FRONTEND)) { res.writeHead(403); return res.end('Forbidden'); }

  fs.readFile(file, (err, content) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(content);
  });
}

http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith('/api/')) return handleApi(req, res, url);
  serveStatic(req, res, url);
}).listen(PORT, () => console.log(`Study Planner running at http://localhost:${PORT}`));
