import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const delay = ms => new Promise(r => setTimeout(r, ms));
const prof = path.join(os.tmpdir(), 'hdr_' + Date.now());
fs.mkdirSync(prof, { recursive: true });
const p = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--remote-debugging-port=9341', '--headless=new', '--disable-gpu', '--no-first-run', `--user-data-dir=${prof}`, 'about:blank'], { stdio: 'ignore' });
try {
  let ws;
  for (let i = 0; i < 20 && !ws; i++) { await delay(500); try { const t = await (await fetch('http://127.0.0.1:9341/json/list')).json(); const pg = t.find(x => x.type === 'page'); if (pg) ws = new WebSocket(pg.webSocketDebuggerUrl); } catch {} }
  await new Promise(r => ws.onopen = r);
  let id = 1; const cb = new Map();
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && cb.has(m.id)) { cb.get(m.id)(m.result); cb.delete(m.id); } };
  const send = (method, params = {}) => new Promise(res => { const i = id++; cb.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable'); await send('Runtime.enable');
  for (const w of [320, 340, 390]) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 700, deviceScaleFactor: 2, mobile: true });
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await delay(1800);
    await send('Runtime.evaluate', { expression: `(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('Nhận Nuôi'));if(b)b.click();})()` });
    await delay(1500);
    const r = await send('Runtime.evaluate', { returnByValue: true, expression: `document.documentElement.scrollWidth - document.documentElement.clientWidth` });
    console.log(w, 'horizontal overflow px:', r.result.value);
    const s = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: w, height: 200, scale: 1 } });
    fs.writeFileSync(`tests/header_${w}.png`, Buffer.from(s.data, 'base64'));
  }
  ws.close();
} finally { p.kill('SIGKILL'); }
