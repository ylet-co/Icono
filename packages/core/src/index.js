/**
 * Icono core — public surface.
 *
 * Everything the HTTP API and the MCP server need lives here so both transports
 * stay thin and behave identically.
 */

export { GLYPHS, GRID } from './glyphs.js';
export {
  VARIANTS,
  VARIANTS_PER_GLYPH,
  WEIGHTS,
  CAPS,
  STYLES,
  SCALES,
  JOINS,
  DEFAULT_SPEC,
  DEFAULT_VARIANT_INDEX,
  variantIndex,
  variantId,
  parseVariantId,
  describeVariant,
} from './variants.js';
export { PALETTES, PALETTE_IDS, getPalette } from './palettes.js';
export {
  CATEGORIES,
  TAGS,
  GLYPH_INDEX,
  makeIconId,
  parseIconId,
  filterGlyphs,
  filterVariants,
  searchIcons,
  describeIcon,
  getIcon,
  getStats,
  listGlyphs,
  randomIcons,
} from './catalog.js';
export { renderSvg, renderSprite, toDataUri, toJsx, safeColor } from './render.js';

import { GLYPHS, parseIconId, GLYPH_INDEX, describeIcon, makeIconId } from './catalog.js';
import { VARIANTS, DEFAULT_VARIANT_INDEX, variantIndex, parseVariantId } from './variants.js';
import { getPalette } from './palettes.js';
import { renderSvg, toDataUri, toJsx, safeColor } from './render.js';

/**
 * Resolve any icon request — by id, by slug, or by explicit variant axes — into a
 * rendered SVG plus the metadata that produced it.
 *
 * @returns {{ok: true, meta: object, svg: string, dataUri: string, jsx: string}
 *          | {ok: false, error: string}}
 */
export function renderIcon(request = {}) {
  const {
    id,
    glyph: glyphSlug,
    variant,
    palette,
    color,
    accent,
    surface,
    background,
    backgroundRadius,
    size,
    padding,
    strokeScale,
    title,
    className,
    jsx,
    dataUri,
  } = request;

  let glyphIndex = null;
  let vIndex = null;

  const idSource = id || glyphSlug;
  if (idSource) {
    const parsed = parseIconId(idSource);
    if (parsed) {
      glyphIndex = parsed.glyphIndex;
      vIndex = parsed.variantIndex;
    } else if (GLYPH_INDEX.has(String(idSource))) {
      glyphIndex = GLYPH_INDEX.get(String(idSource));
    } else {
      return { ok: false, error: `Unknown glyph or icon id: ${idSource}` };
    }
  }

  if (glyphIndex === null) return { ok: false, error: 'Provide an `id` or a `glyph` slug.' };

  if (variant !== undefined && variant !== null && variant !== '') {
    const numeric = Number(String(variant).replace(/^v/i, ''));
    const explicit = Number.isInteger(numeric) ? numeric : parseVariantId(String(variant));
    if (explicit === null || explicit === undefined || !VARIANTS[explicit]) {
      return { ok: false, error: `Unknown variant: ${variant}` };
    }
    vIndex = explicit;
  } else if (hasAxisParams(request)) {
    // An explicit axis request is more specific than a variant baked into the id.
    vIndex = variantIndex({ weight: request.weight, cap: request.cap, style: request.style, scale: request.scale, join: request.join });
  } else if (vIndex === null) {
    vIndex = DEFAULT_VARIANT_INDEX;
  }

  const pal = getPalette(palette);
  const resolvedColor = safeColor(color, pal ? pal.ink : 'currentColor');
  const resolvedAccent = safeColor(accent, pal ? pal.accent : resolvedColor);
  const resolvedSurface = safeColor(surface, pal ? pal.surface : '#0B0C0F');

  const glyph = GLYPHS[glyphIndex];
  const variantDef = VARIANTS[vIndex];
  const meta = describeIcon(glyphIndex, vIndex, pal ? pal.id : null);

  const svg = renderSvg(glyph, variantDef, {
    color: resolvedColor,
    accent: resolvedAccent,
    surface: resolvedSurface,
    background: Boolean(background),
    backgroundRadius,
    size,
    padding,
    strokeScale,
    title: title || `${glyph.name} icon`,
    className,
  });

  return {
    ok: true,
    meta: {
      ...meta,
      id: makeIconId(glyph.slug, vIndex),
      color: resolvedColor,
      accent: resolvedAccent,
      surface: resolvedSurface,
      size: Number(size) > 0 ? Number(size) : 24,
      background: Boolean(background),
      palette: pal ? pal.id : null,
      paths: glyph.d,
      grid: 24,
    },
    svg,
    dataUri: dataUri ? toDataUri(svg) : undefined,
    jsx: jsx ? toJsx(svg, pascal(glyph.name)) : undefined,
  };
}

function pascal(name) {
  return String(name)
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('');
}

/** True when the caller asked for a specific style axis rather than a variant id. */
function hasAxisParams(request) {
  return ['weight', 'cap', 'style', 'scale', 'join'].some(
    (key) => request[key] !== undefined && request[key] !== null && request[key] !== '',
  );
}

export { DEFAULT_VARIANT_INDEX as defaultVariantIndex };
