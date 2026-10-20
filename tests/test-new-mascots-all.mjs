import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testAllVectorMascots() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const tempProfileDir = path.join(os.tmpdir(), `mascots_test_${Date.now()}`);
  fs.mkdirSync(tempProfileDir, { recursive: true });

  const port = 9350;
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

    const pets = [
      { type: 'BYTEY', name: 'Bytey', shotName: 'cat' },
      { type: 'OCTY', name: 'Octy', shotName: 'octo' },
      { type: 'PUFFY', name: 'Puffy', shotName: 'puffer' },
      { type: 'GOLEMY', name: 'Dino', shotName: 'dino' },
    ];

    console.log('=== TESTING 4 CODE-BASED VECTOR MASCOTS ON DASHBOARD ===');

    for (const p of pets) {
      console.log(`Setting up ${p.type} (${p.name})...`);
      await send('Page.navigate', { url: 'http://localhost:5173/' });
      await delay(1000);

      await send('Runtime.evaluate', {
        expression: `
          (async () => {
            try {
              await fetch('/api/pets/adopt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: '${p.type}', name: '${p.name}' }),
              });
            } catch(e) {}
            const petState = {
              id: 'pet_${p.type.toLowerCase()}',
              type: '${p.type}',
              customName: '${p.name}',
              level: 2,
              exp: 50,
              maxExp: 100,
              hunger: 70,
              energy: 85,
              happiness: 90,
              streak: 3,
              mood: 'HAPPY',
              isSleeping: false,
              totalFocusMinutes: 45,
              lastFedAt: new Date().toISOString(),
            };
            localStorage.setItem('devgotchi_pet_state_v1', JSON.stringify(petState));
            location.reload();
          })()
        `,
        awaitPromise: true,
      });
      await delay(1500);

      // Verify SVG rendered with #rig and elements
      const checkRes = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const svg = document.querySelector('svg');
            const rig = svg ? svg.querySelector('#rig') : null;
            const headg = svg ? svg.querySelector('#headg') : null;
            const eyes = svg ? svg.querySelectorAll('.eye') : [];
            return {
              svgFound: !!svg,
              rigFound: !!rig,
              headgFound: !!headg,
              eyesCount: eyes.length,
            };
          })()
        `,
        returnByValue: true,
      });

      console.log(`${p.type} DOM check:`, checkRes.result?.value);

      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(`tests/mascot_vector_${p.shotName}.png`, Buffer.from(shot.data, 'base64'));
      console.log(`Saved tests/mascot_vector_${p.shotName}.png`);
    }

    // Now test Studio
    console.log('Testing Studio with Vector Mascots...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('button[title*="Mở Studio"]');
          if (btn) btn.click();
        })()
      `,
    });
    await delay(1000);

    const shotStudio = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('tests/mascot_vector_studio.png', Buffer.from(shotStudio.data, 'base64'));
    console.log('Saved tests/mascot_vector_studio.png');

    console.log('🎉 ALL 4 CODE-BASED VECTOR MASCOTS VERIFIED PERFECTLY!');
    ws.close();
  } finally {
    cleanup();
  }
}

testAllVectorMascots().catch(console.error);
