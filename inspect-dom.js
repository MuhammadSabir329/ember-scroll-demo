import { spawn } from 'child_process';

const chrome = spawn('C:/Users/hp/.cache/hyperframes/chrome/chrome-headless-shell/win64-152.0.7977.30/chrome-headless-shell-win64/chrome-headless-shell.exe', [
  '--remote-debugging-port=9225',
  '--no-sandbox',
  'http://localhost:8080/index.html'
]);

setTimeout(async () => {
  const res = await fetch('http://localhost:9225/json');
  const list = await res.json();
  const ws = new WebSocket(list[0].webSocketDebuggerUrl);
  let id = 1;
  const send = (m, p = {}) => new Promise(r => {
    const curId = id++;
    const handler = (e) => {
      const d = JSON.parse(e.data);
      if (d.id === curId) {
        ws.removeEventListener('message', handler);
        r(d.result?.result?.value);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method: m, params: p }));
  });

  ws.onopen = async () => {
    await send('Runtime.enable');
    await new Promise(r => setTimeout(r, 2000));
    await send('Runtime.evaluate', { expression: `window.scrollTo({ top: 4050, behavior: 'auto' })` });
    await new Promise(r => setTimeout(r, 1500));
    const r = await send('Runtime.evaluate', {
      expression: `JSON.stringify({
        videoSeeking: document.querySelector('video')?.seeking,
        videoTime: document.querySelector('video')?.currentTime,
        videoReady: document.querySelector('video')?.readyState,
        elementsAtPoint: document.elementsFromPoint(1400, 700).map(e => e.className || e.tagName)
      })`
    });
    console.log('DOM at 4050:', r);
    chrome.kill();
    process.exit(0);
  };
}, 1000);
