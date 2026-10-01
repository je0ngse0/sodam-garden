import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';
const root = fileURLToPath(new URL('.', import.meta.url));
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root.endsWith(sep) ? root : root + sep) || !mime[extname(file)] || file.includes(`${sep}.`)) {
      res.writeHead(404).end('Not found'); return;
    }
    const content = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[extname(file)], 'Cache-Control': 'no-cache' }).end(content);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(Number(process.env.PORT || 4173), '127.0.0.1', () => console.log('Sodam Garden: http://127.0.0.1:' + (process.env.PORT || 4173)));
