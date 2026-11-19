// Postduif: AirDrop-achtige bestandsuitwisseling. Server regelt alleen het vinden van elkaar
// (signalering via Server-Sent Events). Bestanden gaan rechtstreeks tussen browsers (WebRTC).
// Geen dependencies nodig.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 5600;
const PUBLIC = path.join(__dirname, 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };

// id -> { id, name, kind, room, res }
const peers = new Map();

function clientIp(req) {
  const xf = req.headers['cf-connecting-ip'] || (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  let ip = xf || req.socket.remoteAddress || '';
  return ip.replace(/^::ffff:/, '');
}

// Privé-adressen: groepeer op /24 (apparaten op hetzelfde thuisnetwerk). Publiek: groepeer op IP.
function autoRoom(ip) {
  const m = ip.match(/^(10|192\.168|172\.(1[6-9]|2\d|3[01]))\./);
  if (/^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
    return m ? 'lan:' + ip.split('.').slice(0, 3).join('.') : 'ip:' + ip;
  }
  return 'ip:' + ip;
}

function send(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function roomPeers(room) {
  return [...peers.values()].filter(p => p.room === room);
}

function broadcastList(room) {
  const list = roomPeers(room).map(p => ({ id: p.id, name: p.name, kind: p.kind }));
  for (const p of roomPeers(room)) send(p.res, 'peers', list.filter(x => x.id !== p.id));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let b = '';
    req.on('data', c => { b += c; if (b.length > 1e6) { req.destroy(); reject(new Error('te groot')); } });
    req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch (e) { reject(e); } });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');

  if (url.pathname === '/events') {
    const id = (url.searchParams.get('id') || '').slice(0, 40);
    const name = (url.searchParams.get('name') || 'Apparaat').slice(0, 30);
    const kind = (url.searchParams.get('kind') || 'desktop').slice(0, 10);
    const code = (url.searchParams.get('room') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
    if (!id) { res.writeHead(400); return res.end(); }
    const room = code ? 'code:' + code : autoRoom(clientIp(req));
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    const old = peers.get(id);
    if (old) { try { old.res.end(); } catch (e) {} }
    const peer = { id, name, kind, room, res };
    peers.set(id, peer);
    send(res, 'hello', { id, room: code || null });
    broadcastList(room);
    const ka = setInterval(() => res.write(': ka\n\n'), 20000);
    req.on('close', () => {
      clearInterval(ka);
      if (peers.get(id) === peer) { peers.delete(id); broadcastList(room); }
    });
    return;
  }

  if (url.pathname === '/signal' && req.method === 'POST') {
    try {
      const { from, to, data } = await readBody(req);
      const a = peers.get(from), b = peers.get(to);
      if (a && b && a.room === b.room) send(b.res, 'signal', { from, data });
      res.writeHead(204); res.end();
    } catch (e) { res.writeHead(400); res.end(); }
    return;
  }

  if (url.pathname === '/health') { res.writeHead(200); return res.end('ok'); }

  // statische bestanden
  let p = url.pathname === '/' ? '/index.html' : url.pathname;
  const file = path.normalize(path.join(PUBLIC, p));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('Niet gevonden'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(buf);
  });
});

server.listen(PORT, '0.0.0.0', () => console.log(`Postduif draait op poort ${PORT}`));
