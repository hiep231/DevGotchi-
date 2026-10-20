import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function captureStarters() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const tempProfileDir = path.join(os.tmpdir(), `devgotchi_starter_test_${Date.now()}`);
  fs.mkdirSync(tempProfileDir, { recursive: true });

  const port = 9337;
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

    // Clear localStorage on page load
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await delay(1500);
    await send('Runtime.evaluate', {
      expression: 'localStorage.clear(); location.reload();',
    });
    await delay(2000);

    for (let i = 0; i < 4; i++) {
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.resolve('tests', `starter_pet_${i}.png`), Buffer.from(shot.data, 'base64'));
      console.log(`Saved starter_pet_${i}.png`);

      // Click next chevron
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            const nextBtn = document.querySelector('button[title*="sau"], button[title*="tiếp"]');
            if (nextBtn) {
              nextBtn.click();
            } else {
              const buttons = Array.from(document.querySelectorAll('button'));
              if (buttons.length > 2) buttons[1].click();
            }
          })()
        `,
      });
      await delay(800);
    }

    ws.close();
    cleanup();
    console.log('✅ ALL 4 STARTER PETS CAPTURED!');
  } catch (err) {
    cleanup();
    console.error('Error:', err);
    process.exit(1);
  }
}

captureStarters();
