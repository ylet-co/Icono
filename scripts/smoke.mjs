/**
 * End-to-end API smoke test.
 *
 * Boots the real server on a throwaway port and exercises every route, including the
 * failure paths. Run: node scripts/smoke.mjs
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.SMOKE_PORT || 8799);
const BASE = `http://127.0.0.1:${PORT}`;
const API = `${BASE}/api/v1`;

const child = spawn(process.execPath, [path.join(ROOT, 'apps/api/src/server.js')], {
  env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
child.stdout.on('data', (d) => process.stdout.write(`  server: ${d}`));
child.stderr.on('data', (d) => process.stderr.write(`  server: ${d}`));

let failures = 0;
function check(label, condition, detail = '') {
  if (condition) console.log(`  PASS  ${label}`);
  else {
    failures += 1;
    console.log(`  FAIL  ${label}${detail ? `  ->  ${detail}` : ''}`);
  }
}

async function waitForServer(attempts = 40) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(`${API}/health`);
      if (res.ok) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  return false;
}

const json = async (url) => {
  const res = await fetch(url);
  return { status: res.status, body: await res.json() };
};

try {
  check('server boots', await waitForServer());

  /* ------------------------------ meta ------------------------------ */
  const health = await json(`${API}/health`);
  check('GET /health', health.status === 200 && health.body.status === 'ok');

  const stats = await json(`${API}/stats`);
  check('GET /stats totals', stats.body.totalIcons === 1088000 && stats.body.baseIcons === 108800, String(stats.body.totalIcons));
  check('GET /stats axes', stats.body.variantAxes.weight.length === 5 && stats.body.variantAxes.style.length === 5);

  const palettes = await json(`${API}/palettes`);
  check('GET /palettes returns 10', palettes.body.items.length === 10);

  const variants = await json(`${API}/variants`);
  check('GET /variants returns 400', variants.body.items.length === 400);
  check('GET /variants first is v000', variants.body.items[0].id === 'v000');
  check('GET /variants last is v399', variants.body.items[399].id === 'v399');

  const tags = await json(`${API}/tags`);
  check('GET /tags', tags.body.items.length > 500);

  const cats = await json(`${API}/categories`);
  check('GET /categories returns 12', cats.body.items.length === 12 && cats.body.items.every((c) => c.glyphs > 0));

  const spec = await json(`${API}/openapi.json`);
  check('GET /openapi.json', spec.body.openapi === '3.1.0' && Object.keys(spec.body.paths).length >= 12);

  /* ----------------------------- catalog ---------------------------- */
  const glyphs = await json(`${API}/glyphs?limit=5`);
  check('GET /glyphs pages', glyphs.body.count === 5 && glyphs.body.total === 272);

  const search = await json(`${API}/glyphs?q=arrow`);
  check(
    'GET /glyphs?q=arrow',
    search.body.total > 0 &&
      search.body.items.every((g) => `${g.slug} ${g.name.toLowerCase()} ${g.tags.join(' ')}`.includes('arrow')),
  );

  const one = await json(`${API}/glyphs/send?variants=false`);
  check('GET /glyphs/send?variants=false', one.body.slug === 'send' && one.body.icons === undefined);
  check('GET /glyphs/send has paths', Array.isArray(one.body.paths) && one.body.paths.length > 0);

  const full = await json(`${API}/glyphs/send`);
  check('GET /glyphs/send lists 400 variants', full.body.icons.length === 400);

  /* ------------------------------ icons ----------------------------- */
  const icons = await json(`${API}/icons?q=arrow&style=outline&limit=6`);
  check('GET /icons filters by style', icons.body.items.length === 6 && icons.body.items.every((i) => i.variant.style === 'outline'));

  const filtered = await json(`${API}/icons?style=duotone&weight=2&cap=square&scale=1.2&join=miter&limit=1`);
  const v = filtered.body.items[0]?.variant;
  check(
    'GET /icons honours every axis',
    v && v.style === 'duotone' && v.weight === 2 && v.cap === 'square' && v.scale === 1.2 && v.join === 'miter',
    JSON.stringify(v),
  );

  const paged = await json(`${API}/icons?limit=5&offset=5`);
  const page2 = await json(`${API}/icons?limit=5&offset=10`);
  check('GET /icons pages without overlap', paged.body.items[0].id !== page2.body.items[0].id);

  const glyphOrder = await json(`${API}/icons?q=send&order=glyph&limit=3`);
  check('GET /icons order=glyph keeps the glyph fixed', new Set(glyphOrder.body.items.map((i) => i.slug)).size === 1);

  const random = await json(`${API}/icons/random?count=3`);
  check('GET /icons/random', random.body.count === 3 && random.body.items.every((i) => i.svg.startsWith('<svg')));

  const record = await json(`${API}/icons/arrow-left--v162`);
  check('GET /icons/{id}', record.body.id === 'arrow-left--v162' && record.body.svg.includes('stroke-width="1.5"'));

  const bare = await json(`${API}/icons/arrow-left`);
  check('bare slug resolves to the default variant', bare.body.id === 'arrow-left--v162');

  const clamped = await json(`${API}/icons/arrow-left--v999`);
  check('out-of-range variant falls back instead of 404', clamped.status === 200 && clamped.body.variant.index === 162);

  /* ------------------------------ svg ------------------------------- */
  const svgRes = await fetch(`${API}/icons/send--v162/svg?color=%23FF5C1A&size=48&background=true`);
  const svgText = await svgRes.text();
  check('GET /icons/{id}/svg content type', svgRes.headers.get('content-type').startsWith('image/svg+xml'));
  check('GET /icons/{id}/svg immutable cache', (svgRes.headers.get('cache-control') || '').includes('immutable'));
  check('GET /icons/{id}/svg has etag', Boolean(svgRes.headers.get('etag')));
  check('GET /icons/{id}/svg applies colour', svgText.includes('stroke="#FF5C1A"'));
  check('GET /icons/{id}/svg applies size', svgText.includes('width="48"') && svgText.includes('height="48"'));
  check('GET /icons/{id}/svg paints a plate', svgText.includes('<rect'));
  check('GET /icons/{id}/svg keeps the 24 grid', svgText.includes('viewBox="0 0 24 24"'));

  const deterministic = await (await fetch(`${API}/icons/send--v162/svg?color=%23FF5C1A&size=48&background=true`)).text();
  check('render is deterministic', deterministic === svgText);

  const injectedText = await (await fetch(`${API}/icons/send--v162/svg?color=%22%3E%3Cscript%3Ealert(1)%3C/script%3E`)).text();
  check('colour injection is neutralised', !injectedText.includes('<script') && injectedText.includes('currentColor'));

  check('style override works via query', (await (await fetch(`${API}/icons/send--v162/svg?style=soft`)).text()).includes('opacity="0.65"'));
  check('dashed style emits dasharray', (await (await fetch(`${API}/icons/send--v162/svg?style=dashed`)).text()).includes('stroke-dasharray'));
  check(
    'duotone style emits the accent layer',
    (await (await fetch(`${API}/icons/send--v162/svg?style=duotone&accent=%2300E58A`)).text()).includes('stroke="#00E58A"'),
  );
  check('padding scales the glyph', (await (await fetch(`${API}/icons/send--v162/svg?padding=3`)).text()).includes('scale(0.75)'));
  check('stroke multiplier applies', (await (await fetch(`${API}/icons/send--v162/svg?stroke=2`)).text()).includes('stroke-width="3"'));
  check('palette applies ink', (await (await fetch(`${API}/icons/send--v162/svg?palette=signal`)).text()).includes('#E8FFF4'));

  /* --------------------------- derived out -------------------------- */
  const uri = await (await fetch(`${API}/icons/send/data-uri`)).text();
  check('GET /icons/{id}/data-uri', uri.startsWith('data:image/svg+xml;charset=utf-8,%3Csvg'));

  const jsx = await (await fetch(`${API}/icons/arrow-left--v162/jsx`)).text();
  check('GET /icons/{id}/jsx names the component', jsx.includes('export function ArrowLeftIcon(props)'));
  check('GET /icons/{id}/jsx converts attributes', jsx.includes('strokeLinecap="round"'));

  const sprite = await (await fetch(`${API}/sprite.svg?ids=send--v162,arrow-left--v162`)).text();
  check('GET /sprite.svg emits symbols', sprite.includes('<symbol id="send--v162"') && sprite.includes('<symbol id="arrow-left--v162"'));
  check('GET /sprite.svg keeps currentColor', sprite.includes('stroke="currentColor"'));

  const spriteBad = await json(`${API}/sprite.svg`);
  check('GET /sprite.svg without ids is 400', spriteBad.status === 400);

  /* ------------------------------ batch ----------------------------- */
  const batchRes = await fetch(`${API}/render`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      palette: 'signal',
      size: 32,
      icons: [{ glyph: 'shield', variant: 'v162' }, { id: 'send--v000' }, { id: 'nope' }],
    }),
  });
  const batch = await batchRes.json();
  check('POST /render renders the valid entries', batch.count === 2);
  check('POST /render reports the invalid entry', batch.errors.length === 1 && batch.errors[0].input.id === 'nope');
  check('POST /render applies the palette', batch.items[0].svg.includes('#E8FFF4'));

  const tooMany = await fetch(`${API}/render`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ icons: Array.from({ length: 501 }, () => ({ id: 'send' })) }),
  });
  check('POST /render rejects over 500', tooMany.status === 400);

  /* ---------------------------- failures ---------------------------- */
  const missing = await json(`${API}/icons/not-a-glyph`);
  check('unknown icon is 404', missing.status === 404 && missing.body.error === 'not_found');

  check('unknown glyph is 404', (await json(`${API}/glyphs/not-a-glyph`)).status === 404);
  check('unknown route is 404', (await json(`${API}/nope`)).status === 404);

  /* ------------------------------ static ---------------------------- */
  const page = await fetch(`${BASE}/`);
  check('GET / serves the UI', page.status === 200 && (await page.text()).includes('data-counter'));
  check('GET /assets/styles.css', (await fetch(`${BASE}/assets/styles.css`)).status === 200);
  check('GET /assets/app.js', (await fetch(`${BASE}/assets/app.js`)).status === 200);
  check('GET /favicon.svg', (await fetch(`${BASE}/favicon.svg`)).status === 200);
  check('GET /docs/API.md', (await fetch(`${BASE}/docs/API.md`)).status === 200);

  /* --------------------------- CORS + limits ------------------------ */
  check('CORS header present', (await fetch(`${API}/health`)).headers.get('access-control-allow-origin') === '*');
  check('limit is clamped to 500', (await json(`${API}/icons?limit=9999`)).body.limit === 500);

} catch (error) {
  failures += 1;
  console.log(`  FAIL  unexpected error: ${error && error.message}`);
} finally {
  child.kill();
}

console.log(failures === 0 ? '\nAPI smoke test: all checks passed' : `\nAPI smoke test: ${failures} failure(s)`);
process.exit(failures === 0 ? 0 : 1);

