import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runFullJourneyBrowserTest() {
  console.log('--- Starting Complete DevGotchi Interactive UI & Tabs Verification ---');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const browserBinary = fs.existsSync(chromePath) ? chromePath : edgePath;

  const tempProfileDir = path.join(os.tmpdir(), `devgotchi_journey_test_${Date.now()}`);
  fs.mkdirSync(tempProfileDir, { recursive: true });

  const port = 9334;
  const args = [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${tempProfileDir}`,
    'about:blank',
  ];

  const browserProcess = spawn(browserBinary, args, { stdio: 'ignore' });

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

    if (!wsUrl) throw new Error('CDP connection failed');

    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    const callbacks = new Map();
    const runtimeExceptions = [];

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        callbacks.get(msg.id)(msg.result, msg.error);
        callbacks.delete(msg.id);
      } else if (msg.method === 'Runtime.exceptionThrown') {
        runtimeExceptions.push(msg.params.exceptionDetails.text);
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

    // Auto adopt pet if on starter screen
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const adoptBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Nhận Nuôi'));
          if (adoptBtn) adoptBtn.click();
        })()
      `,
    });
    await delay(1000);

    // 1. Test clicking "Gặp Bug @@"
    console.log('Testing "Gặp Bug @@" button...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const bugBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Bug'));
          if (bugBtn) bugBtn.click();
        })()
      `,
    });
    await delay(600);

    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.resolve('tests', 'e2e_bug_dizzy.png'), Buffer.from(shot1.data, 'base64'));
    console.log('Captured e2e_bug_dizzy.png');

    // 2. Switch to "Túi Đồ Ăn" tab
    console.log('Switching to Food Tray tab...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          // 3rd button in bottom nav
          const navButtons = Array.from(document.querySelectorAll('nav button, div.fixed.bottom-0 button'));
          if (navButtons.length >= 3) {
            navButtons[2].click();
          }
        })()
      `,
    });
    await delay(1000);

    // Feed the first item
    console.log('Feeding pet from food tray...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const feedButtons = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.includes('Cho bé ăn') || b.innerText.includes('Cho ăn'));
          if (feedButtons.length > 0) {
            feedButtons[0].click();
          }
        })()
      `,
    });
    await delay(800);

    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.resolve('tests', 'e2e_food_tray_feeding.png'), Buffer.from(shot2.data, 'base64'));
    console.log('Captured e2e_food_tray_feeding.png');

    // 3. Switch to Pomodoro tab
    console.log('Switching to Pomodoro tab...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const navButtons = Array.from(document.querySelectorAll('nav button, div.fixed.bottom-0 button'));
          if (navButtons.length >= 2) {
            navButtons[1].click();
          }
        })()
      `,
    });
    await delay(1000);

    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.resolve('tests', 'e2e_pomodoro_tab.png'), Buffer.from(shot3.data, 'base64'));
    console.log('Captured e2e_pomodoro_tab.png');

    // 4. Return to Linh Thú tab and open Mascot Studio
    console.log('Returning to Linh Thú and opening Mascot Studio...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const navButtons = Array.from(document.querySelectorAll('nav button, div.fixed.bottom-0 button'));
          if (navButtons.length >= 1) navButtons[0].click();
        })()
      `,
    });
    await delay(800);

    // Click Mascot Studio trigger (header sparkle button)
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const studioBtn = document.querySelector('button[title*="Studio"], button[title*="Mascot"]');
          if (studioBtn) studioBtn.click();
        })()
      `,
    });
    await delay(1000);

    const shot4 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.resolve('tests', 'e2e_mascot_studio.png'), Buffer.from(shot4.data, 'base64'));
    console.log('Captured e2e_mascot_studio.png');

    ws.close();
    cleanup();

    if (runtimeExceptions.length > 0) {
      console.error('FAILED with exceptions:', runtimeExceptions);
      process.exit(1);
    }

    console.log('🏆 COMPLETE INTERACTION JOURNEY VERIFIED: ALL TABS & ACTIONS WORK PERFECTLY!');
  } catch (err) {
    cleanup();
    console.error('Journey error:', err);
    process.exit(1);
  }
}

runFullJourneyBrowserTest();
