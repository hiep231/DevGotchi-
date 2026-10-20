import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function verifyAllMascots() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const tempProfileDir = path.join(os.tmpdir(), `devgotchi_studio_test_${Date.now()}`);
  fs.mkdirSync(tempProfileDir, { recursive: true });

  const port = 9336;
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

    let msgId = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        callbacks.get(msg.id)(msg.result, msg.error);
        callbacks.delete(msg.id);
      }
    };

    const send = (method, params = {}) => {
      const id = msgId++;
      return new Promise((resolve, reject) => {
        callbacks.set(id, (result, error) => {
          if (error) reject(error);
          else resolve(result);
        });
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 430,
      height: 932,
      deviceScaleFactor: 2,
      mobile: true,
    });

    await send('Page.navigate', { url: 'http://localhost:5173' });
    await delay(2000);

    // Open studio modal by clicking the Sparkles button
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('button[title*="Studio"]');
          if (btn) btn.click();
        })()
      `,
    });
    await delay(1200);

    const chars = [
      { name: 'Puffy', file: 'studio_puffy.png' },
      { name: 'Dino', file: 'studio_dino.png' },
      { name: 'Bytey', file: 'studio_bytey.png' },
      { name: 'Octy', file: 'studio_octy.png' },
    ];

    for (const item of chars) {
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const target = buttons.find(b => b.innerText.includes('${item.name}'));
            if (target) target.click();
          })()
        `,
      });
      await delay(900);

      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.resolve('tests', item.file), Buffer.from(shot.data, 'base64'));
      console.log(`Saved ${item.file}`);
    }

    ws.close();
    cleanup();
    console.log('✅ ALL 4 MASCOTS CAPTURED!');
  } catch (err) {
    cleanup();
    console.error('Error:', err);
    process.exit(1);
  }
}

verifyAllMascots();
