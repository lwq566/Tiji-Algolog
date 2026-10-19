import fs from 'node:fs';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let targets;
for (let attempt = 0; attempt < 40; attempt += 1) {
  try {
    const response = await fetch('http://127.0.0.1:9222/json/list');
    targets = await response.json();
    if (targets.some((target) => target.type === 'page')) break;
  } catch {
    // Still starting.
  }
  await sleep(250);
}
const page = targets?.find((target) => target.type === 'page');
if (!page) throw new Error('No page target');

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let nextId = 1;
const pending = new Map();
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (!message.id) return;
  const callbacks = pending.get(message.id);
  if (!callbacks) return;
  pending.delete(message.id);
  if (message.error) callbacks.reject(new Error(JSON.stringify(message.error)));
  else callbacks.resolve(message.result);
});
const cdp = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });

await cdp('Page.enable');
await sleep(1200);
const evaluated = await cdp('Runtime.evaluate', {
  expression: `JSON.stringify({
    title: document.title,
    visibility: document.visibilityState,
    focus: document.hasFocus(),
    width: innerWidth,
    height: innerHeight,
    hero: Boolean(document.querySelector('.hero')),
    titleText: document.querySelector('#page-title')?.textContent,
    body: document.body.innerText.slice(0, 120),
  })`,
  returnByValue: true,
});
console.log('STATE', evaluated.result.value);

const screenshot = await cdp('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('D:\\deepseekwork\\window-check.png', Buffer.from(screenshot.data, 'base64'));
console.log('screenshot bytes', screenshot.data.length);
socket.close();
process.exit(0);
