import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const sides = ['http://127.0.0.1:9444'];

function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.addEventListener('open', () => resolve(ws));
    ws.addEventListener('error', (e) => reject(new Error('WebSocket error: ' + e.message)));
  });
}

const pages = await (await fetch(sides[0] + '/json')).json();
const page = pages.find((p) => p.type === 'page');
if (!page) throw new Error('No page target');
const ws = await connect(page.webSocketDebuggerUrl);

let seq = 0;
const pending = new Map();
const errors = [];

ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result);
    return;
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    errors.push(msg.params.exceptionDetails.text + ' ' + (msg.params.exceptionDetails.exception?.description || ''));
  }
  if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
    errors.push(msg.params.args.map((a) => a.value ?? a.description ?? '').join(' '));
  }
});

function send(method, params = {}) {
  const id = ++seq;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression, awaitPromise = false) {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise,
    returnByValue: true,
    userGesture: true
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text + ': ' + (result.exceptionDetails.exception?.description || ''));
  }
  return result.result.value;
}

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok: Boolean(ok), detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

await send('Runtime.enable');
await send('Page.enable');
await send('Log.enable');

const loaded = await evaluate(`({
  title: document.title,
  url: location.href,
  ready: document.readyState,
  origin: location.origin,
  buttons: document.querySelectorAll('button').length,
  views: document.querySelectorAll('.view').length
})`, false);
check('Window loads app:// origin', loaded.url.startsWith('app://gateos/'), loaded.url);
check('Title is correct', loaded.title === 'GATE ECE Study OS', loaded.title);
check('DOM fully parsed', loaded.ready === 'complete', loaded.ready);
check('All 5 main views present', loaded.views === 5, String(loaded.views));
check('App UI rendered', loaded.buttons > 20, loaded.buttons + ' buttons');

const storage = await evaluate(`(async () => {
  const out = {};
  try { localStorage.setItem('__desktop_smoke', 'ok'); out.localStorage = localStorage.getItem('__desktop_smoke') === 'ok'; } catch (e) { out.localStorage = 'ERR ' + e.message; }
  try {
    out.indexedDB = await new Promise((resolve) => {
      const req = indexedDB.open('__desktop_smoke', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('kv');
      req.onsuccess = () => { req.result.close(); resolve(true); };
      req.onerror = () => resolve('ERR ' + req.error?.message);
    });
  } catch (e) { out.indexedDB = 'ERR ' + e.message; }
  out.persisted = await navigator.storage?.persisted?.() ?? null;
  return out;
})()`, true);
check('localStorage works on app:// origin', storage.localStorage === true, String(storage.localStorage));
check('IndexedDB works on app:// origin', storage.indexedDB === true, String(storage.indexedDB));

const onboarding = await evaluate(`({
  open: document.getElementById('onboardDialog').open,
  demoBtn: !!document.getElementById('onboardDemoBtn')
})`);
check('Onboarding dialog opens on first run', onboarding.open === true);
check('Demo button available', onboarding.demoBtn === true);

await evaluate(`document.getElementById('onboardDemoBtn').click()`);
await new Promise((r) => setTimeout(r, 900));

const demo = await evaluate(`({
  demo: JSON.parse(localStorage.getItem('gateos.state.v2') || '{}').demo,
  tasks: document.querySelectorAll('[data-task-id], .task-item, .task').length,
  mistakes: document.querySelectorAll('.vault-item, .mistake-item').length,
  stats: document.querySelectorAll('.stat, .metric').length,
  bodyText: document.body.innerText.length
})`);
check('Demo state loads', demo.demo === true, String(demo.demo));
check('Dashboard renders content', demo.bodyText > 1200, demo.bodyText + ' chars');

for (const view of ['planner', 'vault', 'tests', 'coach']) {
  await evaluate(`(async () => { const btn = document.querySelector('[data-nav="${view}"]'); btn.click(); await new Promise(r => setTimeout(r, 300)); })()`, true);
  const state = await evaluate(`({
    hash: location.hash,
    active: !!document.querySelector('.view.active[data-view="${view}"]') || !!document.querySelector('#view-${view}.active'),
    visible: (() => { const el = document.getElementById('view-${view}'); if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; })()
  })`);
  check('View: ' + view, state.hash === '#' + view && state.active && state.visible, `${state.hash} active=${state.active}`);
}

const theme = await evaluate(`(async () => {
  const before = document.documentElement.dataset.theme;
  const btn = document.querySelector('[data-theme-toggle], #themeToggle');
  if (btn) btn.click();
  await new Promise(r => setTimeout(r, 200));
  const after = document.documentElement.dataset.theme;
  if (btn) btn.click();
  return { before, after };
})()`, true);
check('Theme toggle switches', theme.before && theme.after && theme.before !== theme.after, `${theme.before} -> ${theme.after}`);

await send('Emulation.setDeviceMetricsOverride', { width: 420, height: 820, deviceScaleFactor: 2, mobile: true });
await new Promise((r) => setTimeout(r, 400));
const mobile = await evaluate(`({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth })`);
check('No horizontal overflow at 420 px', mobile.sw <= mobile.cw + 1, `${mobile.sw}/${mobile.cw}`);
await send('Emulation.clearDeviceMetricsOverride');

await send('Emulation.setDeviceMetricsOverride', { width: 1360, height: 900, deviceScaleFactor: 1, mobile: false });
await evaluate(`document.querySelector('[data-nav="dashboard"]').click()`);
await new Promise((r) => setTimeout(r, 700));
const shot = await send('Page.captureScreenshot', { format: 'png' });
await mkdir('shots', { recursive: true });
await writeFile(path.join('shots', 'desktop-packaged.png'), Buffer.from(shot.data, 'base64'));
console.log('Screenshot saved to shots/desktop-packaged.png');

check('No uncaught errors or console errors', errors.length === 0, errors.join(' | '));

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
ws.close();
if (failed.length) process.exit(1);
