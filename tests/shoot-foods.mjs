import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const delay = ms => new Promise(r => setTimeout(r, ms));
const prof = path.join(os.tmpdir(), 'food_' + Date.now());
fs.mkdirSync(prof, { recursive: true });
const p = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--remote-debugging-port=9342', '--headless=new', '--disable-gpu', '--allow-file-access-from-files', '--no-first-run', `--user-data-dir=${prof}`, 'about:blank'], { stdio: 'ignore' });
try {
  let ws;
  for (let i = 0; i < 20 && !ws; i++) { await delay(500); try { const t = await (await fetch('http://127.0.0.1:9342/json/list')).json(); const pg = t.find(x => x.type === 'page'); if (pg) ws = new WebSocket(pg.webSocketDebuggerUrl); } catch {} }
  await new Promise(r => ws.onopen = r);
  let id = 1; const cb = new Map();
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && cb.has(m.id)) { cb.get(m.id)(m.result); cb.delete(m.id); } };
  const send = (method, params = {}) => new Promise(res => { const i = id++; cb.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 880, height: 520, deviceScaleFactor: 1.5, mobile: false });
  await send('Page.navigate', { url: 'file:///' + path.resolve('tests/foods_preview.html').replace(/\\/g, '/') });
  await delay(1200);
  const s = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('tests/foods_preview.png', Buffer.from(s.data, 'base64'));
  console.log('ok');
  ws.close();
} finally { p.kill('SIGKILL'); }
