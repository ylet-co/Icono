/**
 * SVG renderer.
 *
 * Takes a glyph (raw path data) plus a variant (weight/cap/style/scale/join) plus
 * optional colour overrides and returns a finished, self-contained SVG string.
 * Nothing is cached and nothing is written to disk — the same inputs always
 * produce byte-identical output, which is what makes the stash reproducible.
 */

const SAFE_COLOR = /^[#a-zA-Z0-9(),.%\s-]+$/;

export function safeColor(value, fallback) {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed || !SAFE_COLOR.test(trimmed)) return fallback;
  return trimmed;
}

function n(value) {
  const rounded = Math.round(value * 1000) / 1000;
  return String(rounded);
}

function escapeAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeText(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * @param {object} glyph            entry from glyphs.js
 * @param {object} variant          entry from variants.js
 * @param {object} [options]
 * @param {string} [options.color]  ink colour, defaults to currentColor
 * @param {string} [options.accent] secondary colour for duotone / contrast
 * @param {string} [options.surface] background colour used when background is true
 * @param {boolean} [options.background] paint a rounded background plate
 * @param {number} [options.size]   rendered width/height in px
 * @param {number} [options.padding] inner padding in grid units (0-6)
 * @param {number} [options.strokeScale] multiply the variant weight
 * @param {string} [options.title]  accessible title
 * @param {string} [options.className]
 */
export function renderSvg(glyph, variant, options = {}) {
  if (!glyph) throw new Error('renderSvg requires a glyph');
  const v = variant || { weight: 1.5, cap: 'round', style: 'outline', scale: 1, join: 'round' };

  const color = safeColor(options.color, 'currentColor');
  const accent = safeColor(options.accent, color);
  const surface = safeColor(options.surface, '#000000');
  const size = Number(options.size) > 0 ? Number(options.size) : 24;
  const padding = Math.max(0, Math.min(Number(options.padding) || 0, 6));
  const strokeScale = Number(options.strokeScale) > 0 ? Number(options.strokeScale) : 1;
  const weight = Math.max(0.1, v.weight * strokeScale);

  const inner = 24 - padding * 2;
  const transforms = [];
  if (padding) transforms.push(`translate(${n(padding)} ${n(padding)}) scale(${n(inner / 24)})`);
  if (v.scale !== 1) transforms.push(`translate(12 12) scale(${n(v.scale)}) translate(-12 -12)`);

  const common = [
    'fill="none"',
    `stroke-linecap="${v.cap === 'square' ? 'square' : 'round'}"`,
    `stroke-linejoin="${v.join === 'miter' ? 'miter' : 'round'}"`,
  ].join(' ');

  const layer = (stroke, width, opacity, extra = '') =>
    `<path d="${glyph.d.join(' ')}" ${common} stroke="${stroke}" stroke-width="${n(width)}"${
      opacity !== 1 ? ` opacity="${n(opacity)}"` : ''
    }${extra ? ` ${extra}` : ''} />`;

  let body;
  switch (v.style) {
    case 'soft':
      body = layer(color, weight, 0.65);
      break;
    case 'dashed':
      body = layer(color, weight, 1, `stroke-dasharray="${n(weight * 2.4)} ${n(weight * 1.9)}"`);
      break;
    case 'duotone':
      body = `${layer(accent, weight * 2.6, 0.42)}\n    ${layer(color, weight, 1)}`;
      break;
    case 'contrast':
      body = `${layer(color, weight * 2.9, 0.22)}\n    ${layer(color, weight, 1)}`;
      break;
    case 'outline':
    default:
      body = layer(color, weight, 1);
      break;
  }

  const open = transforms.length ? `\n    <g transform="${transforms.join(' ')}">` : '';
  const close = transforms.length ? '\n    </g>' : '';
  const title = options.title ? `\n  <title>${escapeText(options.title)}</title>` : '';
  const plate = options.background
    ? `\n  <rect x="0" y="0" width="24" height="24" rx="${options.backgroundRadius === undefined ? 6 : n(Number(options.backgroundRadius) || 0)}" fill="${surface}" />`
    : '';
  const cls = options.className ? ` class="${escapeAttr(options.className)}"` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${n(size)}" height="${n(size)}"${cls} aria-hidden="${options.title ? 'false' : 'true'}" role="img">${title}${plate}${open}
    ${body}${close}
</svg>`;
}

/** Inline a set of icons into one SVG sprite of <symbol> elements. */
export function renderSprite(items, options = {}) {
  const size = Number(options.size) > 0 ? Number(options.size) : 24;
  const symbols = items
    .map(({ id, glyph, variant }) => {
      const svg = renderSvg(glyph, variant, { ...options, size: 24 });
      const inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
      return `  <symbol id="${escapeAttr(id)}" viewBox="0 0 24 24">${inner.trim()}</symbol>`;
    })
    .join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true" data-icono-sprite="${items.length}" data-size="${n(size)}">
${symbols}
</svg>`;
}

/** `data:` URI for CSS `background-image` or an `<img src>`. */
export function toDataUri(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** A JSX component string for React consumers. */
export function toJsx(svg, name = 'Icon') {
  const body = svg
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/xmlns="[^"]*"\s*/g, '')
    .trim()
    .replace(/([a-z-]+)="([^"]*)"/g, (m, attr, value) => {
      const camel = attr.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      return `${camel === 'class' ? 'className' : camel}="${value}"`;
    });
  return `export function ${name}(props) {\n  return (\n    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} {...props}>\n      ${body}\n    </svg>\n  );\n}\n`;
}
