import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runStudioSyncTest() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const tempProfileDir = path.join(os.tmpdir(), `devgotchi_sync_test_${Date.now()}`);
  fs.mkdirSync(tempProfileDir, { recursive: true });

  const port = 9338;
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

    const testCases = [
      { type: 'GOLEMY', expectedStudioChar: 'dino', name: 'Dino' },
      { type: 'BYTEY', expectedStudioChar: 'cat', name: 'Bytey' },
      { type: 'OCTY', expectedStudioChar: 'octo', name: 'Octy' },
      { type: 'PUFFY', expectedStudioChar: 'puffer', name: 'Puffy' },
    ];

    console.log('=== STARTING STUDIO SYNC VERIFICATION ===');

    for (const tc of testCases) {
      console.log(`\nTesting Pet Type: ${tc.type} (${tc.name})...`);

      // 1. Navigate to page
      await send('Page.navigate', { url: 'http://localhost:5173/' });
      await delay(1000);

      // 2. Adopt pet via API and update localStorage so both backend and frontend agree
      await send('Runtime.evaluate', {
        expression: `
          (async () => {
            try {
              await fetch('/api/pets/adopt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: '${tc.type}', name: '${tc.name}' }),
              });
            } catch (e) {}

            const petState = {
              id: 'pet_${tc.type.toLowerCase()}',
              type: '${tc.type}',
              customName: '${tc.name}',
              level: 2,
              exp: 30,
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

      // 3. Find and click the Studio button
      const clickResult = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const btn = document.querySelector('button[title*="Mở Studio"]');
            if (btn) {
              btn.click();
              return { success: true };
            }
            return { success: false, error: 'Studio button not found' };
          })()
        `,
        returnByValue: true,
      });

      if (!clickResult.result?.value?.success) {
        throw new Error(`Failed to click studio button for ${tc.type}: ${JSON.stringify(clickResult)}`);
      }

      await delay(800);

      // 4. Verify Studio opened and active character matches
      const activeCharResult = await send('Runtime.evaluate', {
        expression: `
          (() => {
            // Find character buttons inside studio
            const buttons = Array.from(document.querySelectorAll('button')).filter(b => 
              b.textContent.includes('Puffy') || b.textContent.includes('Dino') || 
              b.textContent.includes('Bytey') || b.textContent.includes('Octy')
            );
            
            const activeBtn = buttons.find(b => 
              b.className.includes('ring-2') || b.className.includes('scale-102')
            );
            
            const charNames = buttons.map(b => ({
              text: b.textContent.trim(),
              isActive: b.className.includes('ring-2') || b.className.includes('scale-102')
            }));
            
            return {
              titleFound: document.body.textContent.includes('Phòng Thử Nghiệm Linh Thú'),
              charButtons: charNames,
              activeText: activeBtn ? activeBtn.textContent.trim() : null
            };
          })()
        `,
        returnByValue: true,
      });

      const verification = activeCharResult.result?.value;
      console.log('Studio state:', JSON.stringify(verification, null, 2));

      // Assertions
      if (!verification?.titleFound) {
        throw new Error(`Studio modal did not open for ${tc.type}`);
      }

      const activeCharButton = verification.charButtons.find((c) => c.isActive);
      if (!activeCharButton) {
        throw new Error(`No active character button highlighted for ${tc.type}`);
      }

      if (!activeCharButton.text.includes(tc.name)) {
        throw new Error(
          `Sync mismatch! Expected active character ${tc.name} (${tc.expectedStudioChar}), but found active button: ${activeCharButton.text}`
        );
      }

      console.log(`✅ SUCCESS: Pet ${tc.type} correctly synchronized to Studio ${tc.name}!`);

      // 5. Screenshot
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      const imgPath = path.join(process.cwd(), 'tests', `studio_sync_verified_${tc.expectedStudioChar}.png`);
      fs.writeFileSync(imgPath, Buffer.from(shot.data, 'base64'));
      console.log(`📸 Saved screenshot to ${imgPath}`);
    }

    console.log('\n🎉 ALL PET TYPES SYNCHRONIZE PERFECTLY WITH STUDIO!');
    ws.close();
  } finally {
    cleanup();
  }
}

runStudioSyncTest().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
