import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testTapEffects() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const tempProfileDir = path.join(os.tmpdir(), `tap_effects_${Date.now()}`);
  fs.mkdirSync(tempProfileDir, { recursive: true });

  const port = 9360;
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

    await send('Page.navigate', { url: 'http://localhost:5173/' });
    await delay(1200);

    // Setup active pet
    await send('Runtime.evaluate', {
      expression: `
        (async () => {
          try {
            await fetch('/api/pets/adopt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'BYTEY', name: 'Bytey' }),
            });
          } catch(e) {}
          const petState = {
            id: 'pet_bytey',
            type: 'BYTEY',
            customName: 'Bytey',
            level: 2,
            exp: 60,
            maxExp: 100,
            hunger: 70,
            energy: 85,
            happiness: 90,
            streak: 3,
            mood: 'HAPPY',
            isSleeping: false,
            totalFocusMinutes: 50,
            lastFedAt: new Date().toISOString(),
          };
          localStorage.setItem('devgotchi_pet_state_v1', JSON.stringify(petState));
          location.reload();
        })()
      `,
      awaitPromise: true,
    });
    await delay(1500);

    console.log('Simulating taps across screen to trigger particle bursts...');
    // Dispatch 3 rapid clicks at different coordinates
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const ev1 = new PointerEvent('pointerdown', { clientX: 180, clientY: 260, bubbles: true });
          const ev2 = new PointerEvent('pointerdown', { clientX: 240, clientY: 340, bubbles: true });
          const ev3 = new PointerEvent('pointerdown', { clientX: 120, clientY: 380, bubbles: true });
          window.dispatchEvent(ev1);
          window.dispatchEvent(ev2);
          window.dispatchEvent(ev3);
        })()
      `,
    });
    await delay(120);

    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('tests/tap_effect_particles.png', Buffer.from(shot1.data, 'base64'));
    console.log('Saved tests/tap_effect_particles.png');

    await delay(800);

    // Click on Pet / Mascot directly to test poke floating heart reaction
    console.log('Tapping directly on Mascot...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const mascotStage = document.querySelector('svg#rig, .relative.w-full.h-full.flex');
          const btnPoke = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Chọc bé'));
          if (btnPoke) btnPoke.click();
        })()
      `,
    });
    await delay(200);

    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('tests/tap_effect_mascot_poke.png', Buffer.from(shot2.data, 'base64'));
    console.log('Saved tests/tap_effect_mascot_poke.png');

    console.log('🎉 TAP EFFECTS VERIFICATION COMPLETED!');
    ws.close();
  } finally {
    cleanup();
  }
}

testTapEffects().catch(console.error);
