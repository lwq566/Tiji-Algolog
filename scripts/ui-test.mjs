import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const errors = [];
let nextId = 1;
const pending = new Map();

function assert(condition, message) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

async function getPageTarget() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch('http://127.0.0.1:9222/json/list');
      const targets = await response.json();
      const page = targets.find(
        (target) => target.type === 'page' && target.url.includes('index.html'),
      );
      if (page?.webSocketDebuggerUrl) return page;
    } catch {
      // Electron is still starting.
    }
    await sleep(250);
  }
  throw new Error('Could not find Electron page target on port 9222.');
}

const page = await getPageTarget();
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const callbacks = pending.get(message.id);
    if (!callbacks) return;
    pending.delete(message.id);
    if (message.error) callbacks.reject(new Error(JSON.stringify(message.error)));
    else callbacks.resolve(message.result);
    return;
  }
  if (message.method === 'Runtime.exceptionThrown') {
    const details = message.params.exceptionDetails;
    errors.push(details.exception?.description || details.text);
  }
  if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
    errors.push(message.params.entry.text);
  }
});

function cdp(method, params = {}) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
    setTimeout(() => {
      if (!pending.has(id)) return;
      pending.delete(id);
      reject(new Error(`CDP timeout: ${method}`));
    }, 15000);
  });
}

async function evaluate(expression) {
  const result = await cdp('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  });
  if (result.exceptionDetails) {
    throw new Error(
      result.exceptionDetails.exception?.description ||
        result.exceptionDetails.text ||
        'Renderer evaluation failed',
    );
  }
  return result.result.value;
}

async function waitFor(expression, label, timeout = 8000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await evaluate(`Boolean(${expression})`)) return;
    await sleep(80);
  }
  console.error('Renderer errors:', errors);
  try {
    console.error('Modal HTML:', await evaluate("document.querySelector('#modal-root').innerHTML.slice(0, 700)"));
    console.error('State:', await evaluate('JSON.stringify(window.__algolog.getState())'));
    console.error('View:', await evaluate("document.querySelector('#page-title')?.textContent"));
  } catch (error) {
    console.error('Debug read failed:', error.message);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function click(selector) {
  const found = await evaluate(`(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!element) return false;
    element.click();
    return true;
  })()`);
  assert(found, `element ${selector} exists`);
}

async function setValue(selector, value) {
  const found = await evaluate(`(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!element) return false;
    element.value = ${JSON.stringify(value)};
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  assert(found, `field ${selector} exists`);
}

await cdp('Runtime.enable');
await cdp('Log.enable');
await waitFor('window.__algolog', 'app bridge');
await waitFor("document.querySelector('#page-title')?.textContent === '总览'", 'dashboard');

let data = await evaluate('window.__algolog.getState()');
assert(data.sites.length === 0, 'fresh data starts with no sites');
assert(data.records.length === 0, 'fresh data starts with no records');

// 1. Add a site.
await click('[data-action="add-site"]');
await waitFor("document.querySelector('#site-form')", 'site modal');
await setValue('#site-name', '测试 OJ');
await setValue('#site-url', 'test-oj.example.com');
await click('#site-form button[type="submit"]');
await waitFor('window.__algolog.getState().sites.length === 1', 'site saved');
await waitFor("!document.querySelector('#site-form')", 'site modal closed');

data = await evaluate('window.__algolog.getState()');
assert(data.sites[0].name === '测试 OJ', 'site name saved');
assert(
  data.sites[0].url === 'https://test-oj.example.com/',
  `site URL normalized (got ${data.sites[0].url})`,
);

// 2. Add a record.
await click('.top-actions [data-action="add-record"]');
await waitFor("document.querySelector('#record-form')", 'record modal');
await setValue('#record-date', '2026-10-19');
await setValue('#record-site', data.sites[0].id);
await setValue('#record-number', 'T-001');
await setValue('#record-title', '测试题目');
await setValue('#record-difficulty', '1800');
await setValue('#record-tags', '动态规划, 二分');
await click('#record-form button[value="save"]');
await waitFor('window.__algolog.getState().records.length === 1', 'record saved');
await waitFor("!document.querySelector('#record-form')", 'record modal closed');

data = await evaluate('window.__algolog.getState()');
assert(data.records[0].problemNumber === 'T-001', 'problem number saved');
assert(data.records[0].problemTitle === '测试题目', 'problem title saved');
assert(data.records[0].siteId === data.sites[0].id, 'record references existing site');
assert(data.records[0].difficulty === '1800', 'difficulty saved');
assert(JSON.stringify(data.records[0].tags) === JSON.stringify(['动态规划', '二分']), 'tags parsed');

// 3. Add another record using "save and continue".
await click('.top-actions [data-action="add-record"]');
await waitFor("document.querySelector('#record-form')", 'record modal again');
await setValue('#record-number', 'T-002');
await setValue('#record-title', '第二道题');
await setValue('#record-tags', '图论');
await click('#record-form button[value="continue"]');
await waitFor('window.__algolog.getState().records.length === 2', 'second record saved');
await waitFor("document.querySelector('#record-form') && document.querySelector('#record-number').value === ''", 'continue modal');
await click('#record-form [data-action="close-modal"]');
await waitFor("!document.querySelector('#record-form')", 'modal closed');

// 4. Edit a record from the records view.
await click('[data-view="records"]');
await waitFor("!document.querySelector('#view-records').hidden", 'records view');
await click('#records-list [data-action="edit-record"]');
await waitFor("document.querySelector('#record-form')", 'edit modal');
const firstTitle = await evaluate("document.querySelector('#record-title').value");
assert(firstTitle === '第二道题', 'edit modal contains latest record');
await setValue('#record-title', '第二道题（已改）');
await click('#record-form button[value="save"]');
await waitFor(
  "window.__algolog.getState().records.some((record) => record.problemTitle === '第二道题（已改）')",
  'record updated',
);
await waitFor("!document.querySelector('#record-form')", 'edit modal closed');

// 5. Delete with undo.
const countBeforeDelete = await evaluate('window.__algolog.getState().records.length');
await click('#records-list [data-action="delete-record"]');
await waitFor("document.querySelector('[data-action=\"confirm\"]')", 'delete confirm');
await click('[data-action="confirm"]');
await waitFor(
  `window.__algolog.getState().records.length === ${countBeforeDelete - 1}`,
  'record deleted',
);
await waitFor("document.querySelector('.toast-action')", 'undo toast');
await click('.toast-action');
await waitFor(
  `window.__algolog.getState().records.length === ${countBeforeDelete}`,
  'record restored',
);

// 6. Site deletion should be blocked while records exist.
await click('[data-view="sites"]');
await waitFor("!document.querySelector('#view-sites').hidden", 'sites view');
await click('#view-sites [data-action="delete-site"]');
await waitFor("document.querySelector('#confirm-title')", 'blocked delete dialog');
const blockedTitle = await evaluate("document.querySelector('#confirm-title').textContent");
assert(blockedTitle.includes('还在使用'), 'site delete is blocked while records exist');
await click('[data-action="close-modal"]');
await waitFor("!document.querySelector('#confirm-title')", 'dialog closed');

// 7. Delete all records, then delete the site.
await click('[data-view="records"]');
await waitFor("!document.querySelector('#view-records').hidden", 'records view again');
for (let i = 0; i < 2; i += 1) {
  const remaining = await evaluate('window.__algolog.getState().records.length');
  if (!remaining) break;
  await click('#records-list [data-action="delete-record"]');
  await waitFor("document.querySelector('[data-action=\"confirm\"]')", 'delete confirm');
  await click('[data-action="confirm"]');
  await waitFor(
    `window.__algolog.getState().records.length === ${remaining - 1}`,
    'record removed',
  );
  await sleep(250);
}

await click('[data-view="sites"]');
await waitFor("!document.querySelector('#view-sites').hidden", 'sites view final');
await click('#view-sites [data-action="delete-site"]');
await waitFor("document.querySelector('#confirm-title')", 'site delete confirm');
await click('[data-action="confirm"]');
await waitFor('window.__algolog.getState().sites.length === 0', 'site deleted');

await sleep(500);
const filePath = path.resolve('.test-functional', 'data.json');
const persisted = JSON.parse(fs.readFileSync(filePath, 'utf8'));
assert(persisted.sites.length === 0, 'site deletion persisted');
assert(persisted.records.length === 0, 'record deletion persisted');

if (errors.length) {
  console.error('Renderer errors:', errors);
  throw new Error(`Renderer reported ${errors.length} error(s).`);
}

console.log('UI test passed: site CRUD, record CRUD, save-and-continue, undo, site guard, persistence.');
socket.close();
process.exit(0);
