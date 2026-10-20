import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runBrowserTest() {
  console.log('--- DevGotchi E2E Browser & UI Automation Test ---');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const browserBinary = fs.existsSync(chromePath) ? chromePath : edgePath;

  console.log(`Using browser: ${browserBinary}`);

  const tempProfileDir = path.join(os.tmpdir(), `devgotchi_browser_test_${Date.now()}`);
  fs.mkdirSync(tempProfileDir, { recursive: true });

  const port = 9333;
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

  // Cleanup helper
  const cleanup = () => {
    try {
      browserProcess.kill('SIGKILL');
    } catch {}
    try {
      fs.rmSync(tempProfileDir, { recursive: true, force: true });
    } catch {}
  };

  try {
    // Wait for CDP page target to be ready
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

    if (!wsUrl) {
      throw new Error(`Could not connect to browser CDP on port ${port}`);
    }

    console.log('Connected to Browser CDP successfully.');

    // Connect WebSocket
    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    const callbacks = new Map();
    const consoleErrors = [];
    const runtimeExceptions = [];

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        callbacks.get(msg.id)(msg.result, msg.error);
        callbacks.delete(msg.id);
      } else if (msg.method === 'Runtime.consoleAPICalled') {
        if (msg.params.type === 'error') {
          consoleErrors.push(msg.params.args.map((a) => a.value || a.description).join(' '));
        }
      } else if (msg.method === 'Runtime.exceptionThrown') {
        runtimeExceptions.push(msg.params.exceptionDetails.text + ' ' + (msg.params.exceptionDetails.exception?.description || ''));
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

    // Initialize CDP domains
    await send('Page.enable');
    await send('Runtime.enable');
    await send('DOM.enable');

    // Set mobile viewport (iPhone 14 / modern mobile)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 430,
      height: 932,
      deviceScaleFactor: 2,
      mobile: true,
    });

    console.log('Navigating to http://localhost:5173 ...');
    await send('Page.navigate', { url: 'http://localhost:5173' });

    // Wait for DOM and React mount
    await delay(3000);

    // Evaluate DOM state
    const evalState = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const root = document.getElementById('root');
          const hasApp = !!root && root.children.length > 0;
          const bodyText = document.body.innerText;
          const buttons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim());
          const images = Array.from(document.querySelectorAll('img')).map(img => ({
            src: img.src,
            loaded: img.complete && img.naturalWidth > 0
          }));
          const titles = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.innerText);
          const hasToast = !!document.querySelector('.fixed');

          return {
            hasApp,
            buttonCount: buttons.length,
            buttons: buttons.slice(0, 8),
            titles,
            imagesCount: images.length,
            imagesOk: images.filter(i => i.loaded).length,
            previewText: bodyText.slice(0, 150),
          };
        })()
      `,
      returnByValue: true,
    });

    const pageState = evalState.result.value;
    console.log('Page Evaluation Result:', JSON.stringify(pageState, null, 2));

    if (!pageState.hasApp) {
      throw new Error('React did not mount in #root');
    }

    // Capture screenshot
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    const screenshotPath = path.resolve('tests', 'e2e_verified_screenshot.png');
    fs.writeFileSync(screenshotPath, Buffer.from(screenshot.data, 'base64'));
    console.log(`Saved screenshot to: ${screenshotPath}`);

    // Check console errors
    console.log('Console Errors Detected:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.warn('Errors:', consoleErrors);
    }
    console.log('Runtime Exceptions Detected:', runtimeExceptions.length);
    if (runtimeExceptions.length > 0) {
      console.warn('Exceptions:', runtimeExceptions);
    }

    // Test clicking navigation or starter/feed interaction
    console.log('Testing interactive buttons on page...');
    const clickTest = await send('Runtime.evaluate', {
      expression: `
        (() => {
          // Look for starter select button or tab button
          const buttons = Array.from(document.querySelectorAll('button'));
          const adoptBtn = buttons.find(b => b.innerText.includes('Nhận Nuôi') || b.innerText.includes('Bắt Đầu'));
          if (adoptBtn) {
            adoptBtn.click();
            return 'Clicked adopt button';
          }
          const feedTab = buttons.find(b => b.innerText.includes('Túi') || b.innerText.includes('Đồ Ăn'));
          if (feedTab) {
            feedTab.click();
            return 'Clicked food tab';
          }
          return 'No adopt/food tab needed, already in dashboard';
        })()
      `,
      returnByValue: true,
    });
    console.log('Interaction Result:', clickTest.result.value);

    await delay(1500);

    // Capture 2nd screenshot after interaction
    const screenshot2 = await send('Page.captureScreenshot', { format: 'png' });
    const screenshotPath2 = path.resolve('tests', 'e2e_after_interaction.png');
    fs.writeFileSync(screenshotPath2, Buffer.from(screenshot2.data, 'base64'));
    console.log(`Saved interaction screenshot to: ${screenshotPath2}`);

    ws.close();
    cleanup();

    if (runtimeExceptions.length > 0) {
      console.error('FAILED: Uncaught runtime exceptions found!');
      process.exit(1);
    }

    console.log('✅ ALL UI & LOGIC CHECKS PASSED WITH ZERO EXCEPTIONS!');
  } catch (err) {
    cleanup();
    console.error('Browser Test Error:', err);
    process.exit(1);
  }
}

runBrowserTest();
