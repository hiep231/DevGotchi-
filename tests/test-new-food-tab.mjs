import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testNewFoodTab() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const tempProfileDir = path.join(os.tmpdir(), `food_test_${Date.now()}`);
  fs.mkdirSync(tempProfileDir, { recursive: true });

  const port = 9345;
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

    // Setup active pet Bytey (whose favorite food is Bánh Cá RAM)
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
            exp: 40,
            maxExp: 100,
            hunger: 55,
            energy: 80,
            happiness: 75,
            streak: 3,
            mood: 'HAPPY',
            isSleeping: false,
            totalFocusMinutes: 60,
            lastFedAt: new Date().toISOString(),
          };
          localStorage.setItem('devgotchi_pet_state_v1', JSON.stringify(petState));
          localStorage.removeItem('devgotchi_food_state_v1'); // reset to all 12 initial foods
          location.reload();
        })()
      `,
      awaitPromise: true,
    });
    await delay(1500);

    // Switch to FOOD tab
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const navBtns = Array.from(document.querySelectorAll('nav button'));
          const foodBtn = navBtns.find(b => b.textContent.includes('Túi') || navBtns.indexOf(b) === 2);
          if (foodBtn) foodBtn.click();
        })()
      `,
    });
    await delay(1000);

    // Capture initial Food Tab view
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('tests/new_food_tab_all.png', Buffer.from(shot1.data, 'base64'));
    console.log('Saved tests/new_food_tab_all.png');

    // Inspect elements count
    const inspectResult = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const foodCards = document.querySelectorAll('.grid.grid-cols-2 > div');
          const filterButtons = Array.from(document.querySelectorAll('button')).filter(b => 
            b.textContent.includes('Tất cả') || b.textContent.includes('Khoái khẩu') || 
            b.textContent.includes('Món chính') || b.textContent.includes('Ăn vặt') || b.textContent.includes('Đồ uống')
          );
          return {
            totalFoodCards: foodCards.length,
            filtersFound: filterButtons.map(b => b.textContent.trim()),
          };
        })()
      `,
      returnByValue: true,
    });
    console.log('Inspection result:', inspectResult.result?.value);

    // Test Feed Favorite Food (Bánh Cá RAM)
    console.log('Clicking "Đút ăn" on Bánh Cá RAM (favorite food)...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const cards = Array.from(document.querySelectorAll('.grid.grid-cols-2 > div'));
          const ramCard = cards.find(c => c.textContent.includes('Bánh Cá RAM'));
          if (ramCard) {
            const feedBtn = ramCard.querySelector('button');
            if (feedBtn) feedBtn.click();
            else ramCard.click();
          }
        })()
      `,
    });
    await delay(500);

    // Capture feeding animation screenshot
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('tests/new_food_tab_feeding.png', Buffer.from(shot2.data, 'base64'));
    console.log('Saved tests/new_food_tab_feeding.png');

    await delay(2000);

    // Switch to 'Món chính' filter
    console.log('Switching to Món chính filter...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const filterBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Món chính'));
          if (filterBtn) filterBtn.click();
        })()
      `,
    });
    await delay(500);

    // Capture category filter view
    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('tests/new_food_tab_category.png', Buffer.from(shot3.data, 'base64'));
    console.log('Saved tests/new_food_tab_category.png');

    console.log('🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
    ws.close();
  } finally {
    cleanup();
  }
}

testNewFoodTab().catch(console.error);
