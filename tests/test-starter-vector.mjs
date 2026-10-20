import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testStarter() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const tempProfileDir = path.join(os.tmpdir(), `starter_test_${Date.now()}`);
  fs.mkdirSync(tempProfileDir, { recursive: true });

  const port = 9355;
  const args = [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${tempProfileDir}`,
    'about:blank',
  ];

  const browserProcess = spawn(chromePath, args, { stdio: 'ignore' });

  const cleanup = () => {
    try {
      browserProcess.kill('SIGKILL');
    } catch {}
    try {
      fs.rmSync(tempProfileDir, { recursive: true, force: true });
    } catch {}
  };

  try {
    let wsUrl = null;
    for (let i = 0; i < 20; i++) {
      await delay(500);
      try {
        const res = await fetch(`http://127.0.0.1:${port}/json/list`);
        if (res.ok) {
          const targets = await res.json();
          const pageTarget = targets.find((t) => t.type === 'page');
          if (pageTarget && pageTarget.webSocketDebuggerUrl) {
            wsUrl = pageTarget.webSocketDebuggerUrl;
            break;
          }
        }
      } catch {}
    }

    if (!wsUrl) throw new Error('CDP connect failed');

    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let id = 1;
    const send = (method, params = {}) => {
      return new Promise((resolve, reject) => {
        const msgId = id++;
        const handler = (evt) => {
          const msg = JSON.parse(evt.data);
          if (msg.id === msgId) {
            ws.removeEventListener('message', handler);
            if (msg.error) reject(msg.error);
            else resolve(msg.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    };

    await send('Page.enable');
    await send('DOM.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 420,
      height: 860,
      deviceScaleFactor: 2,
      mobile: true,
    });

    // Reset pet to view StarterSelection
    await send('Page.navigate', { url: 'http://localhost:5173/' });
    await delay(1000);

    await send('Runtime.evaluate', {
      expression: `
        (async () => {
          try {
            await fetch('/api/pets/reset', { method: 'POST' });
          } catch(e) {}
          localStorage.removeItem('devgotchi_pet_state_v1');
          location.reload();
        })()
      `,
      awaitPromise: true,
    });
    await delay(1500);

    const shotStarter = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('tests/mascot_vector_starter.png', Buffer.from(shotStarter.data, 'base64'));
    console.log('Saved tests/mascot_vector_starter.png');

    ws.close();
  } finally {
    cleanup();
  }
}

testStarter().catch(console.error);
