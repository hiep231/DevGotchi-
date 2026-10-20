import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const delay = ms => new Promise(r => setTimeout(r, ms));
const files = ['cache-cat', 'puffy-ram', 'dino-deploy', 'octy-bug'];
const moods = ['idle', 'happy', 'hungry', 'sleepy', 'eating'];
const prof = path.join(os.tmpdir(), 'mascot_shot_' + Date.now());
fs.mkdirSync(prof, { recursive: true });
const p = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--remote-debugging-port=9340', '--headless=new', '--disable-gpu', '--no-first-run', `--user-data-dir=${prof}`, 'about:blank'], { stdio: 'ignore' });
try {
  let ws;
  for (let i = 0; i < 20 && !ws; i++) {
    await delay(500);
    try { const t = await (await fetch('http://127.0.0.1:9340/json/list')).json(); const pg = t.find(x => x.type === 'page'); if (pg) ws = new WebSocket(pg.webSocketDebuggerUrl); } catch {}
  }
  await new Promise(r => ws.onopen = r);
  let id = 1; const cb = new Map();
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && cb.has(m.id)) { cb.get(m.id)(m.result); cb.delete(m.id); } };
  const send = (method, params = {}) => new Promise(res => { const i = id++; cb.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 460, height: 560, deviceScaleFactor: 1.5, mobile: false });
  for (const f of files) {
    await send('Page.navigate', { url: 'file:///' + path.resolve('mascot_demo', f + '.html').replace(/\\/g, '/') });
    await delay(1500);
    for (const m of moods) {
      await send('Runtime.evaluate', { expression: `document.querySelector('[data-m=${m}]').click()` });
      await delay(450);
      const s = await send('Page.captureScreenshot', { format: 'png', clip: { x: 20, y: 90, width: 420, height: 400, scale: 1 } });
      fs.mkdirSync('tests/mascot_html', { recursive: true });
      fs.writeFileSync(`tests/mascot_html/${f}_${m}.png`, Buffer.from(s.data, 'base64'));
    }
    console.log('shot', f);
  }
  ws.close();
} finally { p.kill('SIGKILL'); }
