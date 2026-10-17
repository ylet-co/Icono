import Lenis from 'lenis';
import {
  renderIcon,
  filterGlyphs,
  CATEGORIES,
  PALETTES,
  getStats,
  variantIndex,
  WEIGHTS,
  CAPS,
  STYLES,
  SCALES,
  JOINS,
  GLYPHS,
  VARIANTS
} from './core/index.js';

const $ = id => document.getElementById(id);
const root = document.documentElement;
const st = getStats();
const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;

const S = {
  slug: 'arrow-left',
  weight: 1.5,
  cap: 'round',
  style: 'outline',
  scale: 1,
  join: 'round',
  pal: 'calm',
  transparentBg: false,
  cat: '',
  q: '',
  tab: 'svg',
  pvSize: 96,
  pvBg: '',
  density: 'comfort'
};

const css = n => getComputedStyle(root).getPropertyValue(n).trim();

const look = () => {
  const isDark = root.getAttribute('data-theme') === 'dark';
  if (S.pal === 'calm') {
    return {
      color: isDark ? '#EDE3D6' : '#2B221C',
      accent: isDark ? '#C79A72' : '#8B5E3C',
      surface: isDark ? '#2A221C' : '#E9E0D3'
    };
  }
  const p = PALETTES.find(x => x.id === S.pal);
  return { color: p.ink, accent: p.accent, surface: p.surface };
};

const ic = (slug, size, extra = {}) => {
  const l = look();
  return renderIcon({
    glyph: slug,
    variant: variantIndex(S),
    color: l.color,
    accent: l.accent,
    surface: l.surface,
    size,
    ...extra
  });
};

const calm = (slug, v, size) => {
  const isDark = root.getAttribute('data-theme') === 'dark';
  return renderIcon({
    glyph: slug,
    variant: v,
    color: isDark ? '#EDE3D6' : '#2B221C',
    accent: isDark ? '#C79A72' : '#8B5E3C',
    surface: isDark ? '#2A221C' : '#E9E0D3',
    size
  }).svg;
};

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = n => n.toLocaleString('en-US');

/* toast */
let toastTimer;
function toast(msg) {
  const el = $('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1600);
}

/* hero big animated counter (random between 900k and 1m) */
(function() {
  const bgEl = $('hero-big-num');
  if (!bgEl) return;
  const min = 900000;
  const max = 1000000;
  const to = Math.floor(Math.random() * (max - min + 1)) + min;
  if (rm) {
    bgEl.textContent = fmt(to);
    return;
  }
  const t0 = performance.now();
  (function f(t) {
    const p = Math.min((t - t0) / 1800, 1);
    const curr = Math.round(to * (1 - Math.pow(1 - p, 3)));
    bgEl.textContent = fmt(curr);
    if (p < 1) requestAnimationFrame(f);
    else bgEl.textContent = fmt(to);
  })(t0);
})();




/* marquees */
function marquee() {
  $('mq').innerHTML = [[7, 0], [11, 3]].map(([k, o]) => {
    const h = Array.from({ length: 20 }, (_, i) => {
      const g = GLYPHS[(i * k + o) % GLYPHS.length];
      return `<div class="mt" data-s="${g.slug}" title="${esc(g.name)}">${calm(g.slug, 162 + (i % 5) * 40, 40)}</div>`;
    }).join('');
    return `<div class="mr">${h + h}</div>`;
  }).join('');
}
marquee();

/* Lenis smooth scroll engine + 3D scroll physics */
let lenis = null;
if (!rm) {
  try {
    lenis = new Lenis({
      duration: 1.15,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.4,
      infinite: false
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  } catch (e) {
    console.warn('Lenis smooth scroll fallback:', e);
  }
}

let targetVel = 0;
let currentVel = 0;
let scrollYPos = window.scrollY || 0;

if (lenis) {
  lenis.on('scroll', e => {
    targetVel = e.velocity || 0;
    scrollYPos = e.scroll || 0;
    $('nav')?.classList.toggle('on', scrollYPos > 24);
  });
} else {
  window.addEventListener('scroll', () => {
    const cur = window.scrollY;
    targetVel = cur - scrollYPos;
    scrollYPos = cur;
    $('nav')?.classList.toggle('on', scrollYPos > 24);
  }, { passive: true });
}

function updateScrollPhysics() {
  currentVel += (targetVel - currentVel) * 0.16;
  targetVel *= 0.92;
  const clamped = Math.max(-14, Math.min(14, currentVel));
  const pitch = (clamped * 0.32).toFixed(2);
  const skew = (clamped * -0.2).toFixed(2);
  root.style.setProperty('--scroll-y', scrollYPos.toFixed(1) + 'px');
  root.style.setProperty('--scroll-vel', clamped.toFixed(2));
  root.style.setProperty('--scroll-pitch', pitch + 'deg');
  root.style.setProperty('--scroll-skew', skew + 'deg');
  requestAnimationFrame(updateScrollPhysics);
}
if (!rm) requestAnimationFrame(updateScrollPhysics);

/* smooth scroll helper for targets */
function scrollToTarget(selectorOrEl, offset = -70) {
  const target = typeof selectorOrEl === 'string' ? document.querySelector(selectorOrEl) : selectorOrEl;
  if (!target) return;
  if (lenis) {
    lenis.scrollTo(target, { offset, duration: 1.15 });
  } else {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/* smooth anchor scroll */
document.querySelectorAll('a[href^="#"], a[href^="index.html#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    const hash = href.includes('#') ? href.slice(href.indexOf('#')) : '';
    if (hash && hash !== '#' && document.querySelector(hash)) {
      e.preventDefault();
      scrollToTarget(hash);
      try { history.pushState(null, null, hash); } catch (_) {}
    }
  });
});

$('mq').addEventListener('click', e => {
  const mt = e.target.closest('.mt');
  if (!mt) return;
  S.slug = mt.dataset.s;
  all();
  scrollToTarget('#browse');
  toast(`Selected ${S.slug}`);
});

/* browse & workbench */
const cats = [
  { id: '', name: 'All', count: GLYPHS.length },
  ...CATEGORIES.map(c => ({
    ...c,
    count: filterGlyphs({ category: c.id }).length
  }))
];

$('chips').innerHTML = cats.map(c =>
  `<button data-c="${c.id}" class="${c.id ? '' : 'on'}">${esc(c.name.split(' & ')[0])} <span class="c-cnt">${c.count}</span></button>`
).join('');

const axis = (id, label, vals, fmtv, key) => {
  $(id).innerHTML = `<b>${label}</b><div class="seg">${vals.map(v =>
    `<button data-k="${key}" data-v="${v}">${fmtv(v)}</button>`
  ).join('')}</div>`;
};

axis('f-cap', 'Cap', CAPS, v => v, 'cap');
axis('f-style', 'Style', STYLES, v => v, 'style');
axis('f-scale', 'Scale', SCALES, v => Math.round(v * 100) + '%', 'scale');
axis('f-join', 'Join', JOINS, v => v, 'join');

const palList = [{ id: 'calm', name: 'Calm (Theme)', desc: 'Follows page theme' }, ...PALETTES];
$('pal').innerHTML = palList.map(p => {
  const c = p.id === 'calm' ? ['var(--bg)', 'var(--ac)'] : [p.surface, p.accent];
  return `<button data-p="${p.id}" aria-label="${esc(p.name)}" title="${esc(p.name)}" style="background:${c[0]}"><i style="background:${c[1]}"></i></button>`;
}).join('');

function grid() {
  const items = filterGlyphs({ q: S.q, category: S.cat });
  const l = look();
  const pal = S.pal !== 'calm';

  $('count').textContent = `${items.length} of ${GLYPHS.length} glyphs`;
  const gridEl = $('grid');

  if (!items.length) {
    gridEl.innerHTML = `
      <div class="empty">
        <svg class="i20" style="width:36px;height:36px" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M16 16l4 4"/><path d="M8 11h6"/></svg>
        <span>No glyph matches "<strong>${esc(S.q)}</strong>"</span>
        <div class="empty-tags">
          <button class="btn sm" data-suggest="arrow">arrow</button>
          <button class="btn sm" data-suggest="user">user</button>
          <button class="btn sm" data-suggest="lock">lock</button>
          <button class="btn sm" data-suggest="chart">chart</button>
          <button class="btn sm" data-suggest="heart">heart</button>
        </div>
      </div>`;
    return;
  }

  gridEl.innerHTML = items.map(({ glyph }) => `
    <button class="gt" data-s="${glyph.slug}" aria-pressed="${glyph.slug === S.slug}" title="${esc(glyph.name)}" ${pal ? `style="background:${l.surface};color:${l.color}"` : ''}>
      <span class="gt-copy-btn" data-copy-slug="${glyph.slug}" title="Quick copy SVG">
        <svg class="i16" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
      </span>
      ${ic(glyph.slug, 36).svg}
      <span>${esc(glyph.name)}</span>
    </button>
  `).join('');
}

function panel() {
  const r = ic(S.slug, S.pvSize, { jsx: true, dataUri: true, background: S.pal !== 'calm' });
  const l = look();

  const pv = $('pv');
  pv.className = 'pv ' + (S.pvBg || '');
  pv.style.background = S.pvBg ? '' : (S.pal === 'calm' ? '' : l.surface);
  pv.innerHTML = ic(S.slug, S.pvSize).svg;

  $('pname').textContent = r.meta.name;
  $('pid').textContent = r.meta.id;

  $('wo').textContent = S.weight + 'px';
  $('wr').value = WEIGHTS.indexOf(S.weight);

  document.querySelectorAll('.seg [data-k]').forEach(b => {
    b.classList.toggle('on', String(S[b.dataset.k]) === b.dataset.v);
  });

  document.querySelectorAll('#pal button').forEach(b => {
    b.setAttribute('aria-pressed', b.dataset.p === S.pal);
  });

  const palObj = palList.find(p => p.id === S.pal);
  $('pal-label').textContent = palObj ? palObj.name : S.pal;

  document.querySelectorAll('.ct button').forEach(b => {
    b.classList.toggle('on', b.dataset.t === S.tab);
  });

  document.querySelectorAll('#pv-scales button').forEach(b => {
    b.classList.toggle('on', +b.dataset.sz === S.pvSize);
  });

  document.querySelectorAll('#pv-bgs button').forEach(b => {
    b.classList.toggle('on', b.dataset.bg === S.pvBg);
  });

  const txt = {
    svg: r.svg,
    jsx: r.jsx,
    uri: r.dataUri,
    id: r.meta.id + (S.pal !== 'calm' ? `  (palette: ${S.pal})` : '')
  }[S.tab];

  $('code').textContent = txt;
  $('code').dataset.v = txt;
  $('dl').dataset.svg = r.svg;
  $('dl').dataset.name = r.meta.id;
}

const all = () => {
  grid();
  panel();
};
all();

/* search */
const qInput = $('q');
const qClear = $('q-clear');

qInput.addEventListener('input', e => {
  S.q = e.target.value;
  qClear.classList.toggle('show', Boolean(S.q));
  grid();
});

qClear.addEventListener('click', () => {
  S.q = '';
  qInput.value = '';
  qClear.classList.remove('show');
  qInput.focus();
  grid();
});

/* categories */
$('chips').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  S.cat = b.dataset.c;
  document.querySelectorAll('#chips button').forEach(x => x.classList.toggle('on', x === b));
  grid();
});

/* grid interactions */
$('grid').addEventListener('click', e => {
  const copyBtn = e.target.closest('[data-copy-slug]');
  if (copyBtn) {
    e.stopPropagation();
    const slug = copyBtn.dataset.copySlug;
    const iconData = ic(slug, 24);
    copyText(iconData.svg, `Copied ${slug} SVG`);
    return;
  }

  const tagSuggest = e.target.closest('[data-suggest]');
  if (tagSuggest) {
    S.q = tagSuggest.dataset.suggest;
    qInput.value = S.q;
    qClear.classList.add('show');
    grid();
    return;
  }

  const b = e.target.closest('.gt');
  if (!b) return;
  S.slug = b.dataset.s;
  document.querySelectorAll('.gt').forEach(x => x.setAttribute('aria-pressed', x === b));
  panel();
  if (innerWidth <= 960) {
    $('panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

/* range weight */
$('wr').addEventListener('input', e => {
  S.weight = WEIGHTS[+e.target.value];
  all();
});

/* inspector controls */
document.querySelector('.panel').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;

  if (b.dataset.k) {
    const v = b.dataset.v;
    S[b.dataset.k] = ['scale'].includes(b.dataset.k) ? +v : v;
    all();
  } else if (b.dataset.p) {
    S.pal = b.dataset.p;
    all();
  } else if (b.dataset.t) {
    S.tab = b.dataset.t;
    panel();
  } else if (b.dataset.sz) {
    S.pvSize = +b.dataset.sz;
    panel();
  } else if (b.dataset.bg !== undefined) {
    S.pvBg = b.dataset.bg;
    panel();
  }
});

/* randomize variant */
$('btn-rand-var').addEventListener('click', () => {
  const v = VARIANTS[Math.floor(Math.random() * VARIANTS.length)];
  S.weight = v.weight;
  S.cap = v.cap;
  S.style = v.style;
  S.scale = v.scale;
  S.join = v.join;
  all();
  toast(`Variant: ${v.id} (${v.style}, ${v.weight}px)`);
});

/* surprise me */
$('btn-surprise').addEventListener('click', () => {
  const randGlyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
  const randVar = VARIANTS[Math.floor(Math.random() * VARIANTS.length)];
  S.slug = randGlyph.slug;
  S.weight = randVar.weight;
  S.cap = randVar.cap;
  S.style = randVar.style;
  S.scale = randVar.scale;
  S.join = randVar.join;
  all();
  toast(`Rolled: ${randGlyph.name} (${randVar.id})`);
});

/* density toggle */
const densityToggle = $('density-toggle');
densityToggle.addEventListener('click', () => {
  const isCompact = S.density === 'compact';
  S.density = isCompact ? 'comfort' : 'compact';
  $('grid').classList.toggle('compact', S.density === 'compact');
  $('density-label').textContent = S.density === 'compact' ? 'Comfort' : 'Compact';
  toast(`Grid density: ${S.density}`);
});

/* copy helper */
async function copyText(text, label = 'Copied to clipboard') {
  try {
    await navigator.clipboard.writeText(text);
  } catch (_) {
    const a = document.createElement('textarea');
    a.value = text;
    document.body.appendChild(a);
    a.select();
    document.execCommand('copy');
    a.remove();
  }
  toast(label);
}

$('cp').addEventListener('click', () => {
  const t = $('code').dataset.v;
  copyText(t, `Copied ${S.tab.toUpperCase()} to clipboard`);
});

/* download svg */
$('dl').addEventListener('click', e => {
  const b = e.currentTarget;
  const u = URL.createObjectURL(new Blob([b.dataset.svg], { type: 'image/svg+xml' }));
  const a = document.createElement('a');
  a.href = u;
  a.download = b.dataset.name + '.svg';
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 500);
  toast(`Downloaded ${b.dataset.name}.svg`);
});

/* download png */
$('dl-png').addEventListener('click', () => {
  const svgStr = $('dl').dataset.svg;
  const name = $('dl').dataset.name;
  const canvas = document.createElement('canvas');
  const size = 512;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const img = new Image();
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  img.onload = () => {
    ctx.drawImage(img, 0, 0, size, size);
    URL.revokeObjectURL(url);
    const a = document.createElement('a');
    a.download = name + '.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
    toast(`Downloaded ${name}.png (512x512)`);
  };
  img.src = url;
});

/* keyboard navigation */
addEventListener('keydown', e => {
  const active = document.activeElement;
  const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');

  if (e.key === '/' && !isInput) {
    e.preventDefault();
    qInput.focus();
    qInput.select();
  } else if (e.key === 'Escape') {
    if (S.q) {
      S.q = '';
      qInput.value = '';
      qClear.classList.remove('show');
      grid();
    }
  } else if (e.key === 'c' && !isInput && !e.metaKey && !e.ctrlKey) {
    const t = $('code').dataset.v;
    copyText(t, `Copied ${S.tab.toUpperCase()}`);
  }
});

/* theme toggle */
$('th').addEventListener('click', () => {
  const n = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', n);
  try {
    localStorage.setItem('icono.theme', n);
  } catch (_) {}
  requestAnimationFrame(() => {
    marquee();
    stage();
    all();
  });
});
