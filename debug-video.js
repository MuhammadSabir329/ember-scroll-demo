import { spawn } from 'child_process';

const chrome = spawn('C:/Users/hp/.cache/hyperframes/chrome/chrome-headless-shell/win64-152.0.7977.30/chrome-headless-shell-win64/chrome-headless-shell.exe', [
  '--remote-debugging-port=9224',
  '--no-sandbox',
  '--autoplay-policy=no-user-gesture-required',
  'http://localhost:8080/index.html'
]);

setTimeout(async () => {
  const res = await fetch('http://localhost:9224/json');
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
    const test1 = await send('Runtime.evaluate', {
      expression: `(() => {
        const v = document.querySelector('video');
        return JSON.stringify({
          duration: v.duration,
          currentTime: v.currentTime,
          readyState: v.readyState,
          paused: v.paused,
          seeking: v.seeking,
          error: v.error
        });
      })()`
    });
    console.log('Video initial:', test1);

    const test2 = await send('Runtime.evaluate', {
      expression: `(() => {
        const v = document.querySelector('video');
        v.currentTime = 6.5;
        return JSON.stringify({
          afterSet: v.currentTime,
          seeking: v.seeking
        });
      })()`
    });
    console.log('After setting 6.5s:', test2);

    await new Promise(r => setTimeout(r, 500));
    const test3 = await send('Runtime.evaluate', {
      expression: `(() => {
        const v = document.querySelector('video');
        return JSON.stringify({
          afterWait: v.currentTime,
          seeking: v.seeking
        });
      })()`
    });
    console.log('After wait:', test3);

    chrome.kill();
    process.exit(0);
  };
}, 1500);
