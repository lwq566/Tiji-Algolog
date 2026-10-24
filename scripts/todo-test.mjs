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
  for (let attempt = 0; attempt < 40; attempt += 1) {
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
await cdp('Page.enable');
await waitFor('window.__algolog', 'app bridge');
await waitFor("document.querySelector('#page-title')?.textContent === '总览'", 'dashboard');

const initial = await evaluate('window.__algolog.getState()');
assert(Array.isArray(initial.todos), 'todos array exists');
assert(initial.todos.length === 0, 'initial todo list is empty');
assert(initial.records.length > 0, 'existing records are present');
assert(initial.sites.length > 0, 'existing sites are present');
const recordsSnapshot = JSON.stringify(initial.records);
const siteId = initial.sites[0].id;

await click('[data-view="todos"]');
await waitFor("!document.querySelector('#view-todos').hidden", 'todos view');

await click('#view-todos [data-action="add-todo"]');
await waitFor("document.querySelector('#todo-form')", 'todo modal');
await setValue('#todo-site', siteId);
await setValue('#todo-number', 'TODO-001');
await setValue('#todo-title', '待做测试题');
await setValue('#todo-difficulty', '1800');
await setValue('#todo-tags', '动态规划, 二分');
await setValue('#todo-note', '先看题解再独立写一遍');
await click('#todo-form button[type="submit"]');
await waitFor('window.__algolog.getState().todos.length === 1', 'todo saved');
await waitFor("!document.querySelector('#todo-form')", 'todo modal closed');

let data = await evaluate('window.__algolog.getState()');
assert(data.todos[0].problemNumber === 'TODO-001', 'todo number saved');
assert(data.todos[0].problemTitle === '待做测试题', 'todo title saved');
assert(data.todos[0].note === '先看题解再独立写一遍', 'todo note saved');
assert(JSON.stringify(data.records) === recordsSnapshot, 'adding a todo does not change records');

const screenshot = await cdp('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('D:\\deepseekwork\\todos-test.png', Buffer.from(screenshot.data, 'base64'));

await click('#view-todos [data-action="edit-todo"]');
await waitFor("document.querySelector('#todo-form')", 'edit todo modal');
await setValue('#todo-title', '待做测试题（已改）');
await click('#todo-form button[type="submit"]');
await waitFor(
  "window.__algolog.getState().todos[0]?.problemTitle === '待做测试题（已改）'",
  'todo updated',
);
await waitFor("!document.querySelector('#todo-form')", 'edit todo modal closed');

await click('#view-todos [data-action="start-todo"]');
await waitFor("document.querySelector('#record-form')", 'record modal from todo');
const prefilledNumber = await evaluate("document.querySelector('#record-number').value");
const prefilledTitle = await evaluate("document.querySelector('#record-title').value");
assert(prefilledNumber === 'TODO-001', 'todo number prefilled into record');
assert(prefilledTitle === '待做测试题（已改）', 'todo title prefilled into record');
await click('#record-form button[value="save"]');
await waitFor('window.__algolog.getState().todos.length === 0', 'todo completed');
await waitFor(
  `window.__algolog.getState().records.length === ${initial.records.length + 1}`,
  'record added from todo',
);
await waitFor("!document.querySelector('#record-form')", 'record modal closed');

data = await evaluate('window.__algolog.getState()');
assert(
  data.records.filter((record) => initial.records.some((old) => old.id === record.id)).length ===
    initial.records.length,
  'existing records are preserved after completing a todo',
);
assert(
  JSON.stringify(data.records.filter((record) => initial.records.some((old) => old.id === record.id))) ===
    recordsSnapshot,
  'existing record contents are unchanged',
);
const added = data.records.find((record) => record.problemNumber === 'TODO-001');
assert(Boolean(added), 'completed todo produced a record');
assert(added.problemTitle === '待做测试题（已改）', 'record has todo title');
assert(added.siteId === siteId, 'record keeps todo site');

// Add a second todo, then test delete + undo.
await click('#view-todos [data-action="add-todo"]');
await waitFor("document.querySelector('#todo-form')", 'second todo modal');
await setValue('#todo-number', 'TODO-002');
await setValue('#todo-title', '第二道待做');
await click('#todo-form button[type="submit"]');
await waitFor('window.__algolog.getState().todos.length === 1', 'second todo saved');
await waitFor("!document.querySelector('#todo-form')", 'second todo modal closed');

await click('#view-todos [data-action="delete-todo"]');
await waitFor("document.querySelector('#confirm-title')", 'todo delete confirm');
await click('[data-action="confirm"]');
await waitFor('window.__algolog.getState().todos.length === 0', 'todo deleted');
await waitFor("document.querySelector('.toast-action')", 'todo undo toast');
await click('.toast-action');
await waitFor('window.__algolog.getState().todos.length === 1', 'todo restored');
await waitFor(
  "document.querySelector('#view-todos [data-action=\"delete-todo\"]')",
  'restored todo row',
);

await click('#view-todos [data-action="delete-todo"]');
await waitFor("document.querySelector('#confirm-title')", 'todo delete confirm again');
await click('[data-action="confirm"]');
await waitFor('window.__algolog.getState().todos.length === 0', 'todo deleted again');

await sleep(600);
const dataDir = process.env.TODO_TEST_DATA_DIR || '.test-todo-data';
const persisted = JSON.parse(fs.readFileSync(path.resolve(dataDir, 'data.json'), 'utf8'));
assert(Array.isArray(persisted.todos), 'todos persisted as array');
assert(persisted.todos.length === 0, 'deleted todos persisted');
assert(persisted.records.length === initial.records.length + 1, 'record persisted');
assert(persisted.sites.length === initial.sites.length, 'sites preserved');
const persistedOriginal = persisted.records.filter((record) =>
  initial.records.some((old) => old.id === record.id),
);
assert(JSON.stringify(persistedOriginal) === recordsSnapshot, 'persisted original records unchanged');

if (errors.length) {
  console.error('Renderer errors:', errors);
  throw new Error(`Renderer reported ${errors.length} error(s).`);
}

console.log(
  `Todo test passed: ${initial.records.length} existing records preserved, ${initial.sites.length} sites preserved, todo add/edit/start/delete/undo persisted.`,
);
socket.close();
process.exit(0);
