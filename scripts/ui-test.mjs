/**
 * Browser UI boot test.
 *
 * Loads the real index.html + app.js into a DOM, points the client at a live API server,
 * lets boot() finish, then asserts on the rendered result: the animated counter, the hero
 * icon field, the search grid, the palette swatches, the recolor lab and the docs cards.
 *
 * Run: node scripts/ui-test.mjs
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { JSDOM, VirtualConsole } from 'jsdom';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.UI_PORT || 8798);
const BASE = `http://127.0.0.1:${PORT}`;

/** Node's real fetch, captured before we install the page's shim. */
const nodeFetch = globalThis.fetch;

const server = spawn(process.execPath, [path.join(ROOT, 'apps/api/src/server.js')], {
  env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1' },
  stdio: ['ignore', 'ignore', 'pipe'],
});
server.stderr.on('data', (d) => process.stderr.write(`  server: ${d}`));

let failures = 0;
const check = (label, condition, detail = '') => {
  if (condition) console.log(`  PASS  ${label}`);
  else {
    failures += 1;
    console.log(`  FAIL  ${label}${detail ? `  ->  ${String(detail).slice(0, 300)}` : ''}`);
  }
};

async function waitForServer() {
  for (let i = 0; i < 60; i += 1) {
    try {
      if ((await fetch(`${BASE}/api/v1/health`)).ok) return true;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  return false;
}

/** Poll until `predicate()` is true or the timeout elapses. */
async function waitFor(predicate, timeout = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      if (predicate()) return true;
    } catch {
      /* keep waiting */
    }
    await new Promise((r) => setTimeout(r, 60));
  }
  return false;
}

/** Wire the jsdom window up as the ambient globals app.js expects. */
function installBrowserGlobals(window) {
  window.fetch = (input, init) => {
    const url = typeof input === 'string' && input.startsWith('/') ? `${BASE}${input}` : input;
    return nodeFetch(url, init);
  };
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  window.IntersectionObserver = class {
    constructor(cb) {
      this.cb = cb;
    }
    observe(el) {
      this.cb([{ isIntersecting: true, target: el }]);
    }
    unobserve() {}
    disconnect() {}
  };
  window.URL.createObjectURL = () => 'blob:stub';
  window.URL.revokeObjectURL = () => {};
  window.HTMLElement.prototype.scrollIntoView = () => {};

  const originalCreate = window.document.createElement.bind(window.document);
  window.document.createElement = (tag, ...rest) => {
    const el = originalCreate(tag, ...rest);
    if (tag === 'canvas') el.getContext = () => ({ fillStyle: '#000000' });
    return el;
  };

  const define = (key, value) => {
    try {
      Object.defineProperty(globalThis, key, { value, writable: true, configurable: true });
    } catch {
      /* some globals are locked down in newer Node versions */
    }
  };
  define('window', window);
  define('document', window.document);
  define('fetch', window.fetch);
  define('localStorage', window.localStorage);
  define('location', window.location);
  define('Image', window.Image);
  define('requestAnimationFrame', (cb) => setTimeout(() => cb(Date.now()), 0));
  define('cancelAnimationFrame', (id) => clearTimeout(id));
  define('matchMedia', window.matchMedia);
  define('IntersectionObserver', window.IntersectionObserver);
  define('navigator', window.navigator);
}

try {
  check('api server boots', await waitForServer());

  const html = await readFile(path.join(ROOT, 'apps/web/index.html'), 'utf8');
  const virtualConsole = new VirtualConsole();
  const pageErrors = [];
  virtualConsole.on('jsdomError', (e) => pageErrors.push(e.message));
  virtualConsole.on('error', (m) => pageErrors.push(String(m)));

  const dom = new JSDOM(html, { url: `${BASE}/`, pretendToBeVisual: true, virtualConsole });
  const { window } = dom;
  installBrowserGlobals(window);
  const doc = window.document;

  await import(pathToFileURL(path.join(ROOT, 'apps/web/app.js')).href);

  /* ---------------------------- boot ------------------------------ */
  const booted = await waitFor(() => doc.querySelectorAll('[data-grid] .cell').length > 0);
  check('boot() fetched a page of icons', booted, `${doc.querySelectorAll('[data-grid] .cell').length} cells`);
  check('no page errors during boot', pageErrors.length === 0, pageErrors[0]);

  /* --------------------------- counter ---------------------------- */
  const counter = doc.querySelector('[data-counter]');
  check('counter animates up from zero', await waitFor(() => Number(String(counter.textContent).replace(/,/g, '')) > 0), counter.textContent);
  check('counter lands on 1,088,000', await waitFor(() => String(counter.textContent).replace(/,/g, '') === '1088000', 9000), counter.textContent);
  check('counter is formatted with separators', /1,088,000/.test(counter.textContent), counter.textContent);

  /* ------------------------- hero + ticker ------------------------ */
  check('hero renders drift tiles', doc.querySelectorAll('.tile').length > 30, String(doc.querySelectorAll('.tile').length));
  check('hero tiles reference real symbols', doc.querySelectorAll('.tile use').length > 30);
  check('ticker is populated', doc.querySelectorAll('[data-ticker] span').length >= 18, String(doc.querySelectorAll('[data-ticker] span').length));
  check('chrome icons were hydrated', doc.querySelectorAll('[data-icon] svg').length > 5, String(doc.querySelectorAll('[data-icon] svg').length));

  /* ---------------------------- field ----------------------------- */
  check('grid cells carry icon ids', doc.querySelectorAll('[data-grid] [data-icon-id]').length > 0);
  check('grid cells render a sprite reference', doc.querySelectorAll('[data-grid] use').length > 0);
  check('result count is filled in', /\d/.test(doc.querySelector('[data-result-count]').textContent), doc.querySelector('[data-result-count]').textContent);
  check('category filter is populated', doc.querySelectorAll('[data-filter="category"] option').length === 13, String(doc.querySelectorAll('[data-filter="category"] option').length));
  check('palette swatches render', doc.querySelectorAll('[data-palettes] .swatch').length === 11, String(doc.querySelectorAll('[data-palettes] .swatch').length));
  check('weight label starts at "any"', doc.querySelector('[data-weight-out]').textContent === 'any', doc.querySelector('[data-weight-out]').textContent);
  check('scale label starts at "any"', doc.querySelector('[data-scale-out]').textContent === 'any', doc.querySelector('[data-scale-out]').textContent);
  check('load-more button is enabled', doc.querySelector('[data-more]').disabled === false);
  check(
    'default view exposes the whole 108,800-icon stash',
    doc.querySelector('[data-result-count]').textContent === '108,800 matches',
    doc.querySelector('[data-result-count]').textContent,
  );

  /* ----------------------------- lab ------------------------------ */
  check('lab variant select has 400 options', doc.querySelectorAll('[data-lab-variant] option').length === 400, String(doc.querySelectorAll('[data-lab-variant] option').length));
  check('lab glyph datalist is populated', doc.querySelectorAll('[data-glyph-list] option').length === 272, String(doc.querySelectorAll('[data-glyph-list] option').length));
  check('lab renders a 20-icon recolor set', doc.querySelectorAll('[data-lab-set-grid] .setcell').length === 20, String(doc.querySelectorAll('[data-lab-set-grid] .setcell').length));
  check('lab preview points at the API', String(doc.querySelector('[data-lab-plate] img')?.getAttribute('src')).startsWith('/api/v1/icons/'), doc.querySelector('[data-lab-plate] img')?.getAttribute('src'));
  check('lab id label is set', doc.querySelector('[data-lab-id]').textContent === 'send--v162', doc.querySelector('[data-lab-id]').textContent);

  /* ------------------------ api + mcp + docs ---------------------- */
  check('curl sample is rendered', doc.querySelector('[data-code="curl"]').textContent.includes('curl -s'));
  check('mcp config is rendered', doc.querySelector('[data-code="mcp"]').textContent.includes('mcpServers'));
  check('live API preview is embedded', String(doc.querySelector('[data-api-live] img')?.getAttribute('src')).startsWith('/api/v1/icons/'));
  check('route table is rendered', doc.querySelectorAll('[data-routes] .route').length === 10, String(doc.querySelectorAll('[data-routes] .route').length));
  check('mcp tool list is rendered', doc.querySelectorAll('[data-tools] .tool').length === 10, String(doc.querySelectorAll('[data-tools] .tool').length));
  check('docs cards are rendered', doc.querySelectorAll('[data-docs] .doc').length === 6, String(doc.querySelectorAll('[data-docs] .doc').length));
  check('footer totals are filled', doc.querySelector('[data-foot-total]').textContent === '1,088,000', doc.querySelector('[data-foot-total]').textContent);
  check('document title cites the total', doc.title.includes('1,088,000'), doc.title);

  /* --------------------------- interaction ------------------------ */
  const firstCell = doc.querySelector('[data-grid] [data-icon-id]');
  const firstId = firstCell.getAttribute('data-icon-id');
  firstCell.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  check('clicking a cell opens the inspector', await waitFor(() => doc.querySelector('[data-drawer]').classList.contains('is-open')));
  check(
    'inspector shows the icon record',
    await waitFor(() => (doc.querySelector('[data-drawer-body] .drawer__title')?.textContent || '').length > 0),
    doc.querySelector('[data-drawer-body] .drawer__title')?.textContent,
  );
  check('inspector shows the icon id', doc.querySelector('[data-drawer-body] .drawer__id')?.textContent === firstId, doc.querySelector('[data-drawer-body] .drawer__id')?.textContent);
  check('inspector offers 10 palette recolors', doc.querySelectorAll('[data-drawer-body] .stripcell').length === 10, String(doc.querySelectorAll('[data-drawer-body] .stripcell').length));

  doc.querySelector('[data-drawer-close]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  check('inspector closes', !doc.querySelector('[data-drawer]').classList.contains('is-open'));

  const search = doc.querySelector('[data-search]');
  search.value = 'wallet';
  search.dispatchEvent(new window.Event('input', { bubbles: true }));
  check(
    'typing in search re-queries the API',
    await waitFor(() => doc.querySelector('[data-grid] .cell__name')?.textContent === 'wallet'),
    doc.querySelector('[data-grid] .cell__name')?.textContent,
  );

  doc.querySelector('[data-reset]').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  check(
    'reset restores the unfiltered stash',
    await waitFor(() => doc.querySelector('[data-result-count]').textContent.includes('108,800')),
    doc.querySelector('[data-result-count]').textContent,
  );

} catch (error) {
  failures += 1;
  console.log(`  FAIL  unexpected error: ${error && error.stack}`);
} finally {
  server.kill();
}

console.log(failures === 0 ? '\nUI test: all checks passed' : `\nUI test: ${failures} failure(s)`);
process.exit(failures === 0 ? 0 : 1);

