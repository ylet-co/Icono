/**
 * Catalog.
 *
 * The catalog is generated, never stored: an icon id is just
 * `<glyph-slug>--<variant-id>`, and both halves are resolved arithmetically.
 * That is what lets the stash be 108,800 icons (and 1,088,000 with palettes)
 * without shipping a single generated SVG file in the repository.
 */

import { GLYPHS, GRID } from './glyphs.js';
import {
  VARIANTS,
  VARIANTS_PER_GLYPH,
  DEFAULT_VARIANT_INDEX,
  variantIndex,
  variantId,
  parseVariantId,
  describeVariant,
} from './variants.js';
import { PALETTES, getPalette } from './palettes.js';

export const GLYPH_INDEX = new Map(GLYPHS.map((g, i) => [g.slug, i]));

export const TAGS = (() => {
  const set = new Set();
  for (const g of GLYPHS) for (const t of g.tags) set.add(t);
  return [...set].sort();
})();

export const CATEGORIES = [
  { id: 'arrows', name: 'Arrows & Navigation', tags: ['arrow', 'chevron', 'navigation', 'back', 'forward', 'caret', 'turn'] },
  { id: 'essentials', name: 'Controls & Essentials', tags: ['plus', 'minus', 'close', 'check', 'add', 'cancel', 'done'] },
  { id: 'shapes', name: 'Shapes & Symbols', tags: ['shape', 'circle', 'square', 'star', 'heart', 'polygon', 'diamond'] },
  { id: 'security', name: 'Security & Status', tags: ['lock', 'shield', 'security', 'alert', 'warning', 'info', 'ban'] },
  { id: 'files', name: 'Files & Editing', tags: ['file', 'edit', 'copy', 'clipboard', 'folder', 'save', 'crop'] },
  { id: 'media', name: 'Media & Audio', tags: ['play', 'pause', 'media', 'video', 'audio', 'music', 'camera'] },
  { id: 'people', name: 'People & Social', tags: ['user', 'users', 'social', 'team', 'github', 'linkedin'] },
  { id: 'dev', name: 'Developer & Data', tags: ['code', 'terminal', 'database', 'server', 'git', 'cpu', 'chart', 'package'] },
  { id: 'commerce', name: 'Commerce & Finance', tags: ['cart', 'money', 'payment', 'shopping', 'card', 'wallet'] },
  { id: 'devices', name: 'Devices & Hardware', tags: ['device', 'monitor', 'mobile', 'battery', 'power', 'keyboard'] },
  { id: 'weather', name: 'Weather & Nature', tags: ['weather', 'sun', 'moon', 'cloud', 'rain', 'nature', 'leaf'] },
  { id: 'layout', name: 'Layout & Typography', tags: ['layout', 'grid', 'text', 'align', 'list', 'table', 'menu'] },
];

/* -------------------------------------------------------------------------- */
/* Ids                                                                        */
/* -------------------------------------------------------------------------- */

export function makeIconId(slug, vIndex) {
  return `${slug}--${variantId(vIndex)}`;
}

/**
 * Parse an icon id, a bare glyph slug, or a `slug--vNNN` pair.
 * Returns null when the glyph cannot be resolved.
 */
export function parseIconId(input) {
  if (!input) return null;
  const raw = String(input).trim();
  const [slugPart, variantPart] = raw.split('--');
  const glyphIndex = GLYPH_INDEX.get(slugPart);
  if (glyphIndex === undefined) return null;
  const parsed = variantPart ? parseVariantId(variantPart) : null;
  return { glyphIndex, variantIndex: parsed === null ? DEFAULT_VARIANT_INDEX : parsed };
}

/* -------------------------------------------------------------------------- */
/* Filtering                                                                  */
/* -------------------------------------------------------------------------- */

function matchesQuery(glyph, terms) {
  if (!terms.length) return true;
  const haystack = `${glyph.slug} ${glyph.name.toLowerCase()} ${glyph.tags.join(' ')}`;
  return terms.every((t) => haystack.includes(t));
}

export function filterGlyphs({ q, tag, category } = {}) {
  const terms = String(q || '')
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);

  let tagSet = null;
  if (category) {
    const cat = CATEGORIES.find((c) => c.id === String(category).toLowerCase());
    if (cat) tagSet = new Set(cat.tags);
  }

  const out = [];
  for (let i = 0; i < GLYPHS.length; i += 1) {
    const glyph = GLYPHS[i];
    if (!matchesQuery(glyph, terms)) continue;
    if (tag && !glyph.tags.includes(String(tag).toLowerCase())) continue;
    if (tagSet && !glyph.tags.some((t) => tagSet.has(t))) continue;
    out.push({ glyph, glyphIndex: i });
  }
  return out;
}

export function filterVariants({ style, weight, cap, scale, join, variant } = {}) {
  if (variant !== undefined && variant !== null && variant !== '') {
    const numeric = Number(String(variant).replace(/^v/i, ''));
    const idx = Number.isInteger(numeric) ? numeric : parseVariantId(String(variant));
    const found = idx === null || idx === undefined ? undefined : VARIANTS[idx];
    return found ? [found] : [];
  }
  return VARIANTS.filter((v) => {
    if (style && v.style !== String(style).toLowerCase()) return false;
    if (cap && v.cap !== String(cap).toLowerCase()) return false;
    if (join && v.join !== String(join).toLowerCase()) return false;
    if (weight !== undefined && weight !== '' && Number(weight) !== v.weight) return false;
    if (scale !== undefined && scale !== '' && Number(scale) !== v.scale) return false;
    return true;
  });
}

/* -------------------------------------------------------------------------- */
/* Search                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Search the stash.
 *
 * Default ordering is variant-major, so a page of results shows many *different*
 * glyphs rendered in one consistent style rather than 400 re-weights of the same
 * icon. Pass `order: 'glyph'` for the inverse.
 */
export function searchIcons(options = {}) {
  const { limit = 60, offset = 0, order = 'variant', palette } = options;
  const glyphs = filterGlyphs(options);
  const variants = filterVariants(options);
  const total = glyphs.length * variants.length;

  const take = Math.max(0, Math.min(Number(limit) || 0, 500));
  const skip = Math.max(0, Number(offset) || 0);

  const items = [];
  if (total > 0 && take > 0) {
    const glyphMajor = order === 'glyph';
    const outer = glyphMajor ? glyphs : variants;
    const inner = glyphMajor ? variants : glyphs;
    let seen = 0;
    for (let o = 0; o < outer.length && items.length < take; o += 1) {
      for (let i = 0; i < inner.length && items.length < take; i += 1) {
        if (seen < skip) {
          seen += 1;
          continue;
        }
        seen += 1;
        const glyphIndex = glyphMajor ? outer[o].glyphIndex : inner[i].glyphIndex;
        const vIndex = glyphMajor ? inner[i].index : outer[o].index;
        items.push(describeIcon(glyphIndex, vIndex, palette));
      }
    }
  }

  return { total, offset: skip, limit: take, count: items.length, order, items };
}

/* -------------------------------------------------------------------------- */
/* Records                                                                    */
/* -------------------------------------------------------------------------- */

export function describeIcon(glyphIndex, vIndex, paletteId) {
  const glyph = GLYPHS[glyphIndex];
  const safeV = VARIANTS[vIndex] ? vIndex : DEFAULT_VARIANT_INDEX;
  const palette = getPalette(paletteId);
  const id = makeIconId(glyph.slug, safeV);
  const query = palette ? `?palette=${palette.id}` : '';
  return {
    id,
    slug: glyph.slug,
    name: glyph.name,
    tags: glyph.tags,
    variant: describeVariant(safeV),
    palette: palette ? palette.id : null,
    svgUrl: `/api/v1/icons/${id}/svg${query}`,
    jsonUrl: `/api/v1/icons/${id}`,
  };
}

export function getIcon(glyphIndex, vIndex, paletteId) {
  if (glyphIndex === undefined || glyphIndex === null) return null;
  const glyph = GLYPHS[glyphIndex];
  if (!glyph) return null;
  const record = describeIcon(glyphIndex, vIndex, paletteId);
  return { ...record, grid: GRID, paths: glyph.d };
}

/* -------------------------------------------------------------------------- */
/* Stats                                                                      */
/* -------------------------------------------------------------------------- */

export function getStats() {
  const baseIcons = GLYPHS.length * VARIANTS_PER_GLYPH;
  const palettes = PALETTES.length;
  return {
    glyphs: GLYPHS.length,
    variantsPerGlyph: VARIANTS_PER_GLYPH,
    baseIcons,
    palettes,
    totalIcons: baseIcons * palettes,
    tags: TAGS.length,
    categories: CATEGORIES.length,
    grid: GRID,
    defaultVariant: describeVariant(DEFAULT_VARIANT_INDEX),
    variantAxes: {
      weight: [1, 1.25, 1.5, 1.75, 2],
      cap: ['round', 'square'],
      style: ['outline', 'duotone', 'dashed', 'soft', 'contrast'],
      scale: [0.9, 1, 1.1, 1.2],
      join: ['round', 'miter'],
    },
  };
}

export function listGlyphs({ q, tag, category, limit = 60, offset = 0 } = {}) {
  const found = filterGlyphs({ q, tag, category });
  const take = Math.max(0, Math.min(Number(limit) || 0, 500));
  const skip = Math.max(0, Number(offset) || 0);
  return {
    total: found.length,
    offset: skip,
    limit: take,
    count: Math.max(0, Math.min(take, found.length - skip)),
    items: found.slice(skip, skip + take).map(({ glyph, glyphIndex }) => ({
      slug: glyph.slug,
      name: glyph.name,
      tags: glyph.tags,
      glyphIndex,
      variants: VARIANTS_PER_GLYPH,
      defaultIconId: makeIconId(glyph.slug, DEFAULT_VARIANT_INDEX),
      svgUrl: `/api/v1/icons/${makeIconId(glyph.slug, DEFAULT_VARIANT_INDEX)}/svg`,
    })),
  };
}

export function randomIcons(count = 12, paletteId) {
  const n = Math.max(1, Math.min(Number(count) || 12, 100));
  const out = [];
  for (let i = 0; i < n; i += 1) {
    const g = Math.floor(Math.random() * GLYPHS.length);
    const v = Math.floor(Math.random() * VARIANTS_PER_GLYPH);
    out.push(describeIcon(g, v, paletteId));
  }
  return out;
}

export {
  GLYPHS,
  VARIANTS,
  VARIANTS_PER_GLYPH,
  DEFAULT_VARIANT_INDEX,
  PALETTES,
  getPalette,
  variantIndex,
  variantId,
  describeVariant,
  GRID,
};
