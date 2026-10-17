/* ==========================================================================
   Icono — browser client
   No framework, no build step. Talks to the same HTTP API the docs describe.
   ========================================================================== */

const API = '/api/v1';

/* ── chrome icons ─────────────────────────────────────────────────────
   The UI draws itself with the same icon language it sells, but the chrome
   icons are inlined so the shell paints before any network round trip.      */
const UI = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35',
  palette: 'M12 22a10 10 0 1 1 0-20c5.52 0 10 4.03 10 9 0 2.76-2.24 5-5 5h-2.5a2.5 2.5 0 0 0-2.5 2.5c0 .61.22 1.17.6 1.6.37.42.6.98.6 1.55A1.35 1.35 0 0 1 12 22zM7.5 10.5h.01M12 7.5h.01M16.5 10.5h.01',
  terminal: 'M4 17l6-6-6-6M12 19h8',
  blocks: 'M10 3H5a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM19 3h-5a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM10 12H5a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2zM19 12h-5a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2z',
  'file-text': 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42',
  github: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  layers: 'M12 2l10 5-10 5L2 7zM2 17l10 5 10-5M2 12l10 5 10-5',
  copy: 'M9 9h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
  x: 'M18 6L6 18M6 6l12 12',
  shuffle: 'M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5',
  check: 'M20 6L9 17l-5-5',
  code: 'M16 18l6-6-6-6M8 6l-6 6 6 6',
  database: 'M12 8c4.97 0 9-1.34 9-3s-4.03-3-9-3-9 1.34-9 3 4.03 3 9 3zM21 12c0 1.66-4 3-9 3s-9-1.34-9-3M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5',
  wand: 'M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M17.8 6.2L19 5M3 21l9-9',
  scan: 'M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M3 12h18',
};

function uiIcon(name, size = 18) {
  const d = UI[name];
  if (!d) return '';
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${d}" /></svg>`;
}

function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => {
    if (el.dataset.iconDone) return;
    el.innerHTML = uiIcon(el.dataset.icon, Number(el.dataset.iconSize) || 18);
    el.dataset.iconDone = '1';
  });
}

/* ── small helpers ──────────────────────────────────────────────────── */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const fmt = (n) => Number(n).toLocaleString('en-US');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let toastTimer;
function toast(message) {
  let el = $('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 2200);
}

async function getJson(url) {
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function getText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

async function copy(text, label = 'Copied') {
  try {
    await navigator.clipboard.writeText(text);
    toast(label);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    toast(label);
  }
}

function download(filename, text, type = 'image/svg+xml') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* ── state ──────────────────────────────────────────────────────────── */
const AXES = { weight: [1, 1.25, 1.5, 1.75, 2], scale: [0.9, 1, 1.1, 1.2] };

const state = {
  q: '',
  category: '',
  style: '',
  weightIndex: 2,
  scaleIndex: 1,
  palette: '',
  offset: 0,
  total: 0,
  items: [],
  palettes: [],
  stats: null,
  categories: [],
};

const SPRITE_HOST_ID = 'icono-sprite';
const loadedSymbols = new Set();

/** Fetch any not-yet-loaded icons as one sprite and stash it in the DOM. */
async function ensureSymbols(ids) {
  const missing = ids.filter((id) => !loadedSymbols.has(id));
  if (!missing.length) return;
  const url = `${API}/sprite.svg?ids=${encodeURIComponent(missing.join(','))}`;
  const markup = await getText(url);
  const inner = markup.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  let host = document.getElementById(SPRITE_HOST_ID);
  if (!host) {
    host = document.createElement('div');
    host.id = SPRITE_HOST_ID;
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    document.body.prepend(host);
  }
  host.insertAdjacentHTML('beforeend', inner);
  missing.forEach((id) => loadedSymbols.add(id));
}

function useIcon(id, size = 28) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><use href="#${id}" /></svg>`;
}

/* ── animated counter ───────────────────────────────────────────────── */
function animateCount(el, target, duration = 2400) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    el.textContent = fmt(target);
    return;
  }
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    // confident ease-out, no bounce — matches the dark-premium motion language
    const eased = 1 - Math.pow(1 - t, 3.2);
    el.textContent = fmt(Math.round(target * eased));
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = fmt(target);
  };
  requestAnimationFrame(tick);
}

/* ── hero: drifting icon field + ticker ─────────────────────────────── */
const DRIFT_SLUGS = [
  'send', 'arrow-left', 'arrow-right', 'search', 'plus', 'x', 'check', 'star', 'heart',
  'bell', 'mail', 'user', 'users', 'lock', 'shield', 'settings', 'trash', 'edit', 'copy',
  'download', 'upload', 'share', 'link', 'eye', 'calendar', 'clock', 'image', 'video',
  'play', 'pause', 'music', 'camera', 'globe', 'pin', 'tag', 'gift', 'cart', 'credit-card',
  'wallet', 'chart', 'code', 'terminal', 'cpu', 'database', 'server', 'cloud', 'sun', 'moon',
];

async function buildHero() {
  const rows = $$('[data-drift]');
  if (!rows.length) return;
  const chunk = Math.ceil(DRIFT_SLUGS.length / rows.length);

  await ensureSymbols(DRIFT_SLUGS.map((s) => `${s}--v162`));

  rows.forEach((row, i) => {
    const slice = DRIFT_SLUGS.slice(i * chunk, i * chunk + chunk);
    const set = slice.concat(slice); // duplicated so the -50% translate loops seamlessly
    row.innerHTML = set
      .map((slug) => `<div class="tile" data-tile="${slug}">${useIcon(`${slug}--v162`, 32)}</div>`)
      .join('');
  });

  // sparing glow: a handful of tiles light up, cycling slowly
  const tiles = $$('.tile');
  if (tiles.length) {
    let hot = 0;
    setInterval(() => {
      tiles.forEach((t) => t.classList.remove('is-hot'));
      for (let i = 0; i < 7; i += 1) {
        const idx = (hot + i * 13) % tiles.length;
        tiles[idx]?.classList.add('is-hot');
      }
      hot = (hot + 7) % tiles.length;
    }, 2600);
  }
}

function buildTicker(stats) {
  const host = $('[data-ticker]');
  if (!host) return;
  const bits = [
    `stash <b>${fmt(stats.totalIcons)}</b> renderable icons`,
    `glyphs <b>${stats.glyphs}</b>`,
    `variants per glyph <b>${stats.variantsPerGlyph}</b>`,
    `palettes <b>${stats.palettes}</b>`,
    `grid <b>${stats.grid}×${stats.grid}</b>`,
    `endpoint <b>GET /api/v1/icons/{id}/svg</b>`,
    `mcp <b>stdio · 10 tools</b>`,
    `license <b>Apache-2.0</b>`,
    `render <b>deterministic</b>`,
  ];
  const line = bits.map((b) => `<span>${b}</span>`).join('');
  host.innerHTML = line + line;
}

/* ── field: filters, grid, paging ───────────────────────────────────── */
function queryFor(offset) {
  const p = new URLSearchParams();
  if (state.q) p.set('q', state.q);
  if (state.category) p.set('category', state.category);
  if (state.style) p.set('style', state.style);
  p.set('weight', String(AXES.weight[state.weightIndex]));
  p.set('scale', String(AXES.scale[state.scaleIndex]));
  if (state.palette) p.set('palette', state.palette);
  p.set('order', 'variant');
  p.set('limit', '60');
  p.set('offset', String(offset));
  return p.toString();
}

function skeletonGrid(count = 30) {
  const grid = $('[data-grid]');
  grid.setAttribute('aria-busy', 'true');
  grid.innerHTML = Array.from({ length: count }, () => '<div class="skel"></div>').join('');
}

function renderCells(items, append) {
  const grid = $('[data-grid]');
  const html = items
    .map(
      (icon, i) => `<button class="cell" type="button" data-icon-id="${esc(icon.id)}"
        style="animation-delay:${Math.min(i * 12, 400)}ms">
        <span class="cell__svg">${useIcon(icon.id, 28)}</span>
        <span class="cell__name">${esc(icon.slug)}</span>
        <span class="cell__badge">${esc(icon.variant.style)}</span>
      </button>`,
    )
    .join('');
  if (append) grid.insertAdjacentHTML('beforeend', html);
  else grid.innerHTML = html;
  grid.setAttribute('aria-busy', 'false');
}

async function loadPage({ append = false } = {}) {
  const grid = $('[data-grid]');
  if (!append) {
    state.offset = 0;
    state.items = [];
    skeletonGrid();
  }
  try {
    const data = await getJson(`${API}/icons?${queryFor(state.offset)}`);
    state.total = data.total;
    state.items = append ? state.items.concat(data.items) : data.items;
    await ensureSymbols(data.items.map((i) => i.id));
    renderCells(data.items, append);
    state.offset += data.items.length;

    const count = $('[data-result-count]');
    const hint = $('[data-result-hint]');
    count.textContent = `${fmt(data.total)} match${data.total === 1 ? '' : 'es'}`;
    hint.textContent = data.total
      ? `showing ${fmt(state.items.length)} of ${fmt(data.total)} · order: variant-major`
      : 'nothing matched — try a shorter word';
    $('[data-more]').disabled = state.items.length >= data.total;
    $('[data-more]').textContent = state.items.length >= data.total ? 'That is the whole stash for this filter' : 'Load 60 more';
  } catch (error) {
    grid.innerHTML = `<p class="field__hint">Could not reach the API: ${esc(error.message)}</p>`;
    grid.setAttribute('aria-busy', 'false');
  }
}

/* ── filters ────────────────────────────────────────────────────────── */
function syncFilterLabels() {
  $('[data-weight-out]').textContent = AXES.weight[state.weightIndex];
  $('[data-scale-out]').textContent = `${Math.round(AXES.scale[state.scaleIndex] * 100)}%`;
}

function buildPaletteSwatches() {
  const host = $('[data-palettes]');
  if (!host) return;
  const all = [{ id: '', name: 'No palette (currentColor)', ink: 'transparent', accent: 'transparent' }, ...state.palettes];
  host.innerHTML = all
    .map(
      (p) => `<button class="swatch${state.palette === p.id ? ' is-active' : ''}" type="button"
        data-palette="${esc(p.id)}" title="${esc(p.name)}"
        style="background:linear-gradient(135deg, ${esc(p.ink)} 0 55%, ${esc(p.accent)} 55% 100%)"></button>`,
    )
    .join('');
}

function wireFilters() {
  const search = $('[data-search]');
  let debounce;
  search.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      state.q = search.value.trim();
      loadPage();
    }, 260);
  });
  $('[data-finder]').addEventListener('submit', (e) => {
    e.preventDefault();
    state.q = search.value.trim();
    loadPage();
    $('#field').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  $('[data-quick]').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-quick-q]');
    if (!btn) return;
    search.value = btn.dataset.quickQ;
    state.q = btn.dataset.quickQ;
    loadPage();
    $('#field').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  $$('[data-filter]').forEach((el) => {
    el.addEventListener('input', () => {
      const key = el.dataset.filter;
      if (key === 'weightIndex' || key === 'scaleIndex') state[key] = Number(el.value);
      else state[key] = el.value;
      syncFilterLabels();
      loadPage();
    });
  });

  $('[data-palettes]').addEventListener('click', (e) => {
    const sw = e.target.closest('[data-palette]');
    if (!sw) return;
    state.palette = sw.dataset.palette;
    buildPaletteSwatches();
    loadPage();
  });

  $('[data-reset]').addEventListener('click', () => {
    Object.assign(state, { q: '', category: '', style: '', weightIndex: 2, scaleIndex: 1, palette: '' });
    search.value = '';
    $('[data-filter="category"]').value = '';
    $('[data-filter="style"]').value = '';
    $('[data-filter="weightIndex"]').value = '2';
    $('[data-filter="scaleIndex"]').value = '1';
    syncFilterLabels();
    buildPaletteSwatches();
    loadPage();
  });

  $('[data-more]').addEventListener('click', () => loadPage({ append: true }));

  $('[data-grid]').addEventListener('click', (e) => {
    const cell = e.target.closest('[data-icon-id]');
    if (!cell) return;
    openInspector(cell.dataset.iconId);
  });
}

/* ── inspector drawer ───────────────────────────────────────────────── */
function paletteOf(id) {
  return state.palettes.find((p) => p.id === id) || null;
}

function svgUrl(id, params = {}) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  });
  const qs = p.toString();
  return `${API}/icons/${id}/svg${qs ? `?${qs}` : ''}`;
}

function openDrawer() {
  $('[data-drawer]').classList.add('is-open');
  $('[data-drawer]').setAttribute('aria-hidden', 'false');
  const scrim = $('[data-scrim]');
  scrim.hidden = false;
  requestAnimationFrame(() => scrim.classList.add('is-open'));
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  $('[data-drawer]').classList.remove('is-open');
  $('[data-drawer]').setAttribute('aria-hidden', 'true');
  const scrim = $('[data-scrim]');
  scrim.classList.remove('is-open');
  setTimeout(() => { scrim.hidden = true; }, 320);
  document.body.style.overflow = '';
}

async function openInspector(id) {
  const body = $('[data-drawer-body]');
  body.innerHTML = '<div class="skel" style="aspect-ratio:1;max-width:200px;margin:0 auto"></div>';
  openDrawer();

  let icon;
  try {
    icon = await getJson(`${API}/icons/${id}`);
  } catch {
    body.innerHTML = '<p class="field__hint">That icon could not be loaded.</p>';
    return;
  }

  const bigUrl = svgUrl(id, { palette: state.palette, size: 96 });
  const stripPalettes = state.palettes.slice(0, 10);
  const specs = [
    ['style', icon.variant.style],
    ['stroke', `${icon.variant.weight}px`],
    ['cap', icon.variant.cap],
    ['join', icon.variant.join],
    ['scale', `${Math.round(icon.variant.scale * 100)}%`],
    ['variant', icon.variant.id],
  ];

  body.innerHTML = `
    <div class="drawer__hero"><img src="${esc(bigUrl)}" alt="${esc(icon.name)}" width="96" height="96" /></div>
    <h2 class="drawer__title">${esc(icon.name)}</h2>
    <p class="drawer__id mono">${esc(icon.id)}</p>
    <div class="drawer__spec">
      ${specs.map(([k, v]) => `<div class="spec"><div class="spec__k">${esc(k)}</div><div class="spec__v">${esc(v)}</div></div>`).join('')}
    </div>
    <div class="drawer__actions">
      <button class="btn" type="button" data-act="download"><span data-icon="download"></span>Download SVG</button>
      <button class="btn btn--ghost" type="button" data-act="copy-svg"><span data-icon="copy"></span>Copy SVG markup</button>
      <button class="btn btn--ghost" type="button" data-act="copy-jsx"><span data-icon="code"></span>Copy as React component</button>
      <button class="btn btn--ghost" type="button" data-act="copy-uri"><span data-icon="link"></span>Copy data: URI</button>
      <button class="btn btn--ghost" type="button" data-act="copy-url"><span data-icon="link"></span>Copy API URL</button>
      <button class="btn btn--ghost" type="button" data-act="send-lab"><span data-icon="palette"></span>Open in Recolor lab</button>
    </div>
    <div class="drawer__strip">
      <div class="spec__k">Same icon · 10 palettes</div>
      <div class="drawer__stripGrid">
        ${stripPalettes
          .map(
            (p) => `<button class="stripcell" type="button" data-strip="${esc(p.id)}" title="${esc(p.name)}"
              style="background:${esc(p.surface)}"><img src="${esc(svgUrl(id, { palette: p.id, size: 24 }))}" alt="" width="22" height="22" /></button>`,
          )
          .join('')}
      </div>
    </div>`;

  hydrateIcons(body);

  body.onclick = async (e) => {
    const strip = e.target.closest('[data-strip]');
    if (strip) {
      state.palette = strip.dataset.strip;
      buildPaletteSwatches();
      openInspector(id);
      loadPage();
      return;
    }
    const act = e.target.closest('[data-act]');
    if (!act) return;
    const url = svgUrl(id, { palette: state.palette, size: 48 });
    switch (act.dataset.act) {
      case 'download': {
        const svg = await getText(url);
        download(`${id}.svg`, svg);
        toast(`Saved ${id}.svg`);
        break;
      }
      case 'copy-svg':
        await copy(await getText(url), 'SVG markup copied');
        break;
      case 'copy-jsx':
        await copy(await getText(`${API}/icons/${id}/jsx?palette=${state.palette}`), 'React component copied');
        break;
      case 'copy-uri':
        await copy(await getText(`${API}/icons/${id}/data-uri?palette=${state.palette}`), 'data: URI copied');
        break;
      case 'copy-url':
        await copy(new URL(url, location.origin).href, 'API URL copied');
        break;
      case 'send-lab':
        closeDrawer();
        loadIntoLab(id);
        $('#editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      default:
        break;
    }
  };
}

/* ── recolor lab ────────────────────────────────────────────────────── */
const lab = {
  slug: 'send',
  variant: 'v162',
  color: '#F4F4F6',
  accent: '#FF5C1A',
  surface: '#0B0C0F',
  size: 64,
  stroke: 1,
  padding: 0,
  background: true,
};

function labId() {
  return `${lab.slug}--${lab.variant}`;
}

function labParams(extra = {}) {
  return {
    color: lab.color,
    accent: lab.accent,
    surface: lab.surface,
    size: lab.size,
    stroke: lab.stroke,
    padding: lab.padding,
    background: lab.background,
    ...extra,
  };
}

function labUrl(extra = {}) {
  return svgUrl(labId(), labParams(extra));
}

function hueSet() {
  // ten generated hues rotating around the wheel, each paired with a deep surface
  return Array.from({ length: 10 }, (_, i) => {
    const h = (i * 36 + 12) % 360;
    return {
      name: `Hue ${h}`,
      ink: `hsl(${h}, 88%, 68%)`,
      accent: `hsl(${(h + 28) % 360}, 92%, 58%)`,
      surface: `hsl(${h}, 42%, 7%)`,
    };
  });
}

function recolorSet() {
  return [...state.palettes, ...hueSet()];
}

function renderLab() {
  const plate = $('[data-lab-plate]');
  const img = new Image();
  img.alt = lab.slug;
  img.width = lab.size;
  img.height = lab.size;
  img.src = labUrl();
  plate.replaceChildren(img);
  plate.style.background = lab.background ? lab.surface : 'transparent';

  $('[data-lab-id]').textContent = labId();

  const setHost = $('[data-lab-set-grid]');
  setHost.innerHTML = recolorSet()
    .map(
      (c) => `<button class="setcell" type="button" data-set-color="${esc(c.ink)}" data-set-accent="${esc(c.accent)}"
        data-set-surface="${esc(c.surface)}" data-set-name="${esc(c.name)}">
        <span class="setcell__art" style="background:${esc(c.surface)}">
          <img src="${esc(labUrl({ color: c.ink, accent: c.accent, surface: c.surface, size: 34 }))}" alt="" width="34" height="34" />
        </span>
        <span class="setcell__label">${esc(c.name)}</span>
      </button>`,
    )
    .join('');
}

function loadIntoLab(id) {
  const [slug, variant] = String(id).split('--');
  lab.slug = slug || lab.slug;
  if (variant) lab.variant = variant;
  $('[data-lab-glyph]').value = lab.slug;
  const sel = $('[data-lab-variant]');
  if (sel.querySelector(`option[value="${lab.variant}"]`)) sel.value = lab.variant;
  updateLabTags();
  renderLab();
}

async function updateLabTags() {
  try {
    const data = await getJson(`${API}/glyphs/${lab.slug}?variants=false`);
    $('[data-lab-tags]').textContent = data.tags.join(' · ');
  } catch {
    $('[data-lab-tags]').textContent = '';
  }
}

function toHex(color) {
  if (/^#[0-9a-f]{6}$/i.test(color)) return color;
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.fillStyle = '#000000';
  ctx.fillStyle = color;
  return /^#[0-9a-f]{6}$/i.test(ctx.fillStyle) ? ctx.fillStyle : '#000000';
}

/** Compose N recoloured icons into one shareable sheet SVG. */
function buildSheet(set, svgs, cols) {
  const cell = 56;
  const rows = Math.ceil(svgs.length / cols);
  const pad = 10;
  const w = cols * cell + pad * 2;
  const h = rows * cell + pad * 2;
  const parts = svgs
    .map((svg, i) => {
      const x = pad + (i % cols) * cell + 4;
      const y = pad + Math.floor(i / cols) * cell + 4;
      const body = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
      const bg = set[i]?.surface || '#0B0C0F';
      return `<g><rect x="${x - 4}" y="${y - 4}" width="48" height="48" rx="8" fill="${bg}"/><svg x="${x}" y="${y}" width="40" height="40" viewBox="0 0 24 24">${body}</svg></g>`;
    })
    .join('\n  ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="#08090B"/>
  ${parts}
</svg>`;
}

async function wireLab() {
  const variants = await getJson(`${API}/variants`);
  const byStyle = new Map();
  variants.items.forEach((v) => {
    if (!byStyle.has(v.style)) byStyle.set(v.style, []);
    byStyle.get(v.style).push(v);
  });
  $('[data-lab-variant]').innerHTML = [...byStyle.entries()]
    .map(
      ([style, list]) =>
        `<optgroup label="${esc(style)}">${list
          .map((v) => `<option value="${esc(v.id)}">${esc(v.id)} · ${v.weight}px · ${v.cap} · ${Math.round(v.scale * 100)}%</option>`)
          .join('')}</optgroup>`,
    )
    .join('');
  $('[data-lab-variant]').value = lab.variant;

  const glyphs = await getJson(`${API}/glyphs?limit=500`);
  $('[data-glyph-list]').innerHTML = glyphs.items
    .map((g) => `<option value="${esc(g.slug)}">${esc(g.name)}</option>`)
    .join('');

  $('[data-lab-glyph]').addEventListener('input', () => {
    lab.slug = $('[data-lab-glyph]').value.trim() || 'send';
    updateLabTags();
    renderLab();
  });
  $('[data-lab-variant]').addEventListener('change', () => {
    lab.variant = $('[data-lab-variant]').value;
    renderLab();
  });
  $$('[data-lab-color]').forEach((input) => {
    input.addEventListener('input', () => {
      lab[input.dataset.labColor] = input.value;
      $(`[data-lab-color-out="${input.dataset.labColor}"]`).textContent = input.value;
      renderLab();
    });
  });
  $$('[data-lab-range]').forEach((input) => {
    input.addEventListener('input', () => {
      const key = input.dataset.labRange;
      lab[key] = Number(input.value);
      $(`[data-lab-out="${key}"]`).textContent = input.value;
      renderLab();
    });
  });
  $('[data-lab-toggle="background"]').addEventListener('change', (e) => {
    lab.background = e.target.checked;
    renderLab();
  });

  $('[data-lab-set-grid]').addEventListener('click', async (e) => {
    const cell = e.target.closest('[data-set-color]');
    if (!cell) return;
    const { setColor, setAccent, setSurface, setName } = cell.dataset;
    lab.color = setColor;
    lab.accent = setAccent;
    lab.surface = setSurface;
    const hexes = { color: toHex(setColor), accent: toHex(setAccent), surface: toHex(setSurface) };
    Object.entries(hexes).forEach(([k, v]) => {
      $(`[data-lab-color="${k}"]`).value = v;
      $(`[data-lab-color-out="${k}"]`).textContent = v;
    });
    renderLab();
    download(`${lab.slug}-${String(setName).toLowerCase().replace(/\s+/g, '-')}.svg`, await getText(labUrl({ size: 48 })));
    toast(`${setName} downloaded`);
  });

  $('[data-lab-download]').addEventListener('click', async () => {
    download(`${labId()}.svg`, await getText(labUrl({ size: 48 })));
    toast(`Saved ${labId()}.svg`);
  });

  $('[data-lab-copy]').addEventListener('click', async () => {
    await copy(await getText(labUrl({ size: 48 })), 'SVG markup copied');
  });

  $('[data-lab-set]').addEventListener('click', async () => {
    const set = recolorSet();
    toast('Bundling 20 recolours…');
    const svgs = await Promise.all(
      set.map((c) => getText(labUrl({ color: c.ink, accent: c.accent, surface: c.surface, size: 48 }))),
    );
    download(`${lab.slug}-recolor-set-20.svg`, buildSheet(set, svgs, 5), 'image/svg+xml');
    toast('Saved the 20-icon sheet');
  });

  $('[data-lab-palette-random]').addEventListener('click', () => {
    const p = state.palettes[Math.floor(Math.random() * state.palettes.length)];
    if (!p) return;
    Object.assign(lab, { color: p.ink, accent: p.accent, surface: p.surface, background: true });
    Object.entries({ color: p.ink, accent: p.accent, surface: p.surface }).forEach(([k, v]) => {
      $(`[data-lab-color="${k}"]`).value = v;
      $(`[data-lab-color-out="${k}"]`).textContent = v;
    });
    renderLab();
  });
}

/* ── api + mcp + docs sections ──────────────────────────────────────── */
function paintCode(el, text) {
  el.innerHTML = esc(text)
    .replace(/(&quot;[^&]*?&quot;)(?=:)/g, '<span class="k">$1</span>')
    .replace(/(&quot;[^&]*?&quot;)(?=,|\s*$)/gm, '<span class="s">$1</span>')
    .replace(/(#[^\n]*)/g, '<span class="c">$1</span>');
}

function renderApiSection() {
  const sampleId = 'send--v162';
  const curl = `# one icon, recoloured, 48px, with a plate
curl -s "http://127.0.0.1:8787/api/v1/icons/${sampleId}/svg?color=%23FF5C1A&size=48&background=true" -o send.svg

# search the stash: every outline icon whose tags mention "arrow"
curl -s "http://127.0.0.1:8787/api/v1/icons?q=arrow&style=outline&limit=20"

# 24 recolours of one glyph in a single request
curl -s -X POST "http://127.0.0.1:8787/api/v1/render" \\
  -H 'content-type: application/json' \\
  -d '{"glyph":"shield","palette":"signal","size":32,"icons":[{"variant":"v162"},{"variant":"v000"},{"variant":"v399"}]}'

# bundle a whole toolbar into one sprite
curl -s "http://127.0.0.1:8787/api/v1/sprite.svg?ids=arrow-left--v162,send--v162,search--v162" -o toolbar.svg`;

  paintCode($('[data-code="curl"]'), curl);

  const liveUrl = `${API}/icons/${sampleId}/svg?color=%23FF5C1A&size=96&background=true&surface=%230B0C0F&radius=6`;
  $('[data-api-live]').innerHTML = `
    <img src="${esc(liveUrl)}" alt="Live icon rendered by the API" width="96" height="96" />
    <p class="mono">GET /api/v1/icons/${sampleId}/svg<br />?color=%23FF5C1A&amp;size=96&amp;background=true</p>`;

  const routes = [
    ['GET', '/api/v1/stats', 'stash size, axes and totals'],
    ['GET', '/api/v1/glyphs', 'browse the 272 base glyphs'],
    ['GET', '/api/v1/icons', 'search icons with style filters'],
    ['GET', '/api/v1/icons/{id}', 'metadata plus inline SVG'],
    ['GET', '/api/v1/icons/{id}/svg', 'the SVG itself'],
    ['GET', '/api/v1/icons/{id}/jsx', 'a ready React component'],
    ['GET', '/api/v1/icons/{id}/data-uri', 'a CSS-usable data: URI'],
    ['GET', '/api/v1/sprite.svg', 'bundle up to 500 icons'],
    ['POST', '/api/v1/render', 'batch render up to 500 icons'],
    ['GET', '/api/v1/openapi.json', 'OpenAPI 3.1 document'],
  ];
  $('[data-routes]').innerHTML = routes
    .map(
      ([verb, path, desc]) => `<li class="route">
        <span class="route__verb route__verb--${verb.toLowerCase()}">${verb}</span>
        <span class="route__path">${esc(path)}</span>
        <span class="route__desc">${esc(desc)}</span>
      </li>`,
    )
    .join('');
}

function renderMcpSection() {
  const config = `{
  "mcpServers": {
    "icono": {
      "command": "node",
      "args": ["/absolute/path/to/Icono/apps/mcp/src/server.js"]
    }
  }
}`;
  paintCode($('[data-code="mcp"]'), config);

  const tools = [
    ['search_icons', 'Full-text + style search across all 108,800 generated icons.'],
    ['get_icon', 'One icon as SVG with colour, size, stroke and palette overrides.'],
    ['render_icon', 'Compose an icon from a glyph slug and explicit style axes.'],
    ['create_sprite', 'Merge up to 500 icons into one <symbol> sprite.'],
    ['batch_render', 'Render a whole recoloured set in a single call.'],
    ['save_icons', 'Write the SVGs straight into a directory on disk.'],
    ['list_glyphs', 'Enumerate base glyphs with their tags.'],
    ['list_palettes', 'The ten ink/accent/surface palettes.'],
    ['list_variants', 'The 400 style variants and the axes behind them.'],
    ['get_stats', 'Stash totals, for when the model needs to cite a number.'],
  ];
  $('[data-tools]').innerHTML = tools
    .map(([name, desc]) => `<div class="tool"><div class="tool__name">${esc(name)}</div><div class="tool__desc">${esc(desc)}</div></div>`)
    .join('');
}

function renderDocsSection() {
  const docs = [
    ['API.md', 'Every endpoint, every query parameter, with copy-paste examples.', 'terminal', '/docs/API.md'],
    ['MCP.md', 'Client config, the full tool reference and prompt recipes.', 'blocks', '/docs/MCP.md'],
    ['ICON-ENGINE.md', 'How 272 glyphs become 108,800 icons, and how to add more.', 'database', '/docs/ICON-ENGINE.md'],
    ['DESIGN.md', 'The design decisions behind this page, per the premium-ui skill.', 'palette', '/docs/DESIGN.md'],
    ['SKILL-USAGE.md', 'How the uploaded web-ui-design skill was applied here.', 'wand', '/docs/SKILL-USAGE.md'],
    ['README.md', 'Install, run, and wire Icono into a project in two minutes.', 'file-text', 'https://github.com/ylet-co/Icono#readme'],
  ];
  $('[data-docs]').innerHTML = docs
    .map(
      ([file, desc, icon, href]) => `<a class="doc" href="${esc(href)}">
        <span class="doc__ico" data-icon="${esc(icon)}"></span>
        <span class="doc__name">${esc(file)}</span>
        <span class="doc__desc">${esc(desc)}</span>
      </a>`,
    )
    .join('');
  hydrateIcons($('[data-docs]'));
}

/* ── theme, scroll spy, copy buttons ────────────────────────────────── */
function wireTheme() {
  const root = document.documentElement;
  const stored = localStorage.getItem('icono-theme');
  if (stored) root.dataset.theme = stored;
  else if (window.matchMedia('(prefers-color-scheme: light)').matches) root.dataset.theme = 'light';

  const btn = $('[data-theme-toggle]');
  const sync = () => {
    const dark = root.dataset.theme !== 'light';
    btn.querySelector('.rail__ico').innerHTML = uiIcon(dark ? 'moon' : 'sun', 20);
    btn.querySelector('.rail__ico').dataset.iconDone = '1';
  };
  sync();
  btn.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('icono-theme', root.dataset.theme);
    sync();
  });
}

function wireScrollSpy() {
  const sections = ['top', 'field', 'editor', 'api', 'mcp', 'docs']
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const links = $$('[data-rail]');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((l) => l.classList.toggle('is-active', l.dataset.rail === entry.target.id));
      });
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  sections.forEach((s) => observer.observe(s));
}

function wireGlobal() {
  $('[data-drawer-close]').addEventListener('click', closeDrawer);
  $('[data-scrim]').addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
    if (e.key === '/' && document.activeElement !== $('[data-search]')) {
      e.preventDefault();
      $('[data-search]').focus();
    }
  });
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-copy-target]');
    if (!btn) return;
    const which = btn.dataset.copyTarget;
    const code = $(`[data-code="${which}"]`);
    if (code) copy(code.textContent, 'Copied to clipboard');
  });
}

/* ── boot ───────────────────────────────────────────────────────────── */
async function boot() {
  hydrateIcons();
  wireTheme();
  wireGlobal();
  wireScrollSpy();

  renderApiSection();
  renderMcpSection();
  renderDocsSection();

  try {
    const [stats, palettes, categories] = await Promise.all([
      getJson(`${API}/stats`),
      getJson(`${API}/palettes`),
      getJson(`${API}/categories`),
    ]);

    state.stats = stats;
    state.palettes = palettes.items;
    state.categories = categories.items;

    // headline: the animated counter lands on the real stash total
    animateCount($('[data-counter]'), stats.totalIcons);
    $$('[data-stat]').forEach((el) => {
      el.textContent = fmt(stats[el.dataset.stat]);
    });
    $('[data-foot-total]').textContent = fmt(stats.totalIcons);
    $('[data-foot-base]').textContent = fmt(stats.baseIcons);
    document.title = `Icono — ${fmt(stats.totalIcons)} recolorable SVG icons with an API and an MCP server`;

    $('[data-filter="category"]').innerHTML =
      '<option value="">all categories</option>' +
      state.categories.map((c) => `<option value="${esc(c.id)}">${esc(c.name)} (${c.glyphs})</option>`).join('');

    buildTicker(stats);
    buildPaletteSwatches();
    syncFilterLabels();
    wireFilters();

    await Promise.all([buildHero(), wireLab()]);
    await loadPage();
    updateLabTags();
    renderLab();
  } catch (error) {
    $('[data-result-hint]').textContent = `The API did not answer: ${error.message}. Start it with: npm start`;
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();








