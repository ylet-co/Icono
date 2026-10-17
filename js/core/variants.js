/**
 * Variant engine.
 *
 * A variant is a deterministic styling of a glyph: how thick the stroke is, how
 * it is capped and joined, how it is scaled inside the 24x24 box, and which
 * rendering style is applied. Every glyph supports every variant, so the stash
 * size is simply `GLYPHS.length * VARIANTS.length`.
 *
 *   5 weights x 2 caps x 5 styles x 4 scales x 2 joins = 400 variants per glyph
 *
 * The axes are ordered so a variant index is a stable, human-reconstructable
 * number: it never changes when new glyphs are added.
 */

export const WEIGHTS = [1, 1.25, 1.5, 1.75, 2];
export const CAPS = ['round', 'square'];
export const STYLES = ['outline', 'duotone', 'dashed', 'soft', 'contrast'];
export const SCALES = [0.9, 1, 1.1, 1.2];
export const JOINS = ['round', 'miter'];

/** The variant used when an icon id does not name one. */
export const DEFAULT_SPEC = {
  weight: 1.5,
  cap: 'round',
  style: 'outline',
  scale: 1,
  join: 'round',
};

function buildVariants() {
  const list = [];
  let index = 0;
  for (const weight of WEIGHTS) {
    for (const cap of CAPS) {
      for (const style of STYLES) {
        for (const scale of SCALES) {
          for (const join of JOINS) {
            list.push({ index, weight, cap, style, scale, join });
            index += 1;
          }
        }
      }
    }
  }
  return list;
}

export const VARIANTS = buildVariants();
export const VARIANTS_PER_GLYPH = VARIANTS.length;

export const DEFAULT_VARIANT_INDEX = variantIndex(DEFAULT_SPEC);

/**
 * Turn a variant specification into its stable index.
 * Unknown or out-of-range values fall back to the default for that axis.
 */
export function variantIndex(spec = {}) {
  const weight = WEIGHTS.includes(Number(spec.weight)) ? WEIGHTS.indexOf(Number(spec.weight)) : WEIGHTS.indexOf(DEFAULT_SPEC.weight);
  const cap = CAPS.includes(spec.cap) ? CAPS.indexOf(spec.cap) : CAPS.indexOf(DEFAULT_SPEC.cap);
  const style = STYLES.includes(spec.style) ? STYLES.indexOf(spec.style) : STYLES.indexOf(DEFAULT_SPEC.style);
  const scale = SCALES.includes(Number(spec.scale)) ? SCALES.indexOf(Number(spec.scale)) : SCALES.indexOf(DEFAULT_SPEC.scale);
  const join = JOINS.includes(spec.join) ? JOINS.indexOf(spec.join) : JOINS.indexOf(DEFAULT_SPEC.join);
  return ((((weight * CAPS.length + cap) * STYLES.length + style) * SCALES.length + scale) * JOINS.length + join);
}

/** Describe a variant index for API responses and the browser UI. */
export function describeVariant(index) {
  const v = VARIANTS[index];
  if (!v) return null;
  return {
    index: v.index,
    id: variantId(v.index),
    weight: v.weight,
    cap: v.cap,
    style: v.style,
    scale: v.scale,
    join: v.join,
    label: `${v.style} · ${v.weight}px · ${v.cap} · ${Math.round(v.scale * 100)}%`,
  };
}

export function variantId(index) {
  return `v${String(index).padStart(3, '0')}`;
}

export function parseVariantId(value) {
  if (typeof value !== 'string') return null;
  const match = /^v(\d{1,3})$/i.exec(value.trim());
  if (!match) return null;
  const index = Number(match[1]);
  return index >= 0 && index < VARIANTS.length ? index : null;
}
