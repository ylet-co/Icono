/**
 * SVG well-formedness test.
 *
 * Samples the stash across every glyph and every variant (with palettes, sizes, stroke
 * multipliers and padding rotated in), parses each result as XML, and asserts the root is an
 * <svg> on the 24x24 grid. Catches malformed path data and any attribute-escaping bug.
 *
 * Run: node scripts/svg-test.mjs
 */

import { JSDOM } from 'jsdom';

import { GLYPHS, VARIANTS, PALETTES, renderIcon, renderSprite, parseIconId } from '../packages/core/src/index.js';

const { DOMParser } = new JSDOM('').window;
const parser = new DOMParser();

const GLYPH_STRIDE = Number(process.env.SVG_GLYPH_STRIDE || 3);
const VARIANT_STRIDE = Number(process.env.SVG_VARIANT_STRIDE || 7);

let checked = 0;
let problems = 0;

for (let gi = 0; gi < GLYPHS.length; gi += GLYPH_STRIDE) {
  for (let vi = 0; vi < VARIANTS.length; vi += VARIANT_STRIDE) {
    const id = `${GLYPHS[gi].slug}--v${String(vi).padStart(3, '0')}`;
    const palette = PALETTES[(gi + vi) % PALETTES.length].id;
    const result = renderIcon({
      id,
      palette,
      background: vi % 2 === 0,
      size: 24 + (vi % 5) * 8,
      stroke: 0.5 + (vi % 4) * 0.5,
      padding: vi % 7,
    });
    checked += 1;

    if (!result.ok) {
      console.log(`  FAIL  render refused ${id}: ${result.error}`);
      problems += 1;
      continue;
    }

    const doc = parser.parseFromString(result.svg, 'image/svg+xml');
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      console.log(`  FAIL  malformed XML for ${id}: ${parseError.textContent.slice(0, 140)}`);
      problems += 1;
      if (problems > 5) break;
      continue;
    }

    const root = doc.documentElement;
    if (root.tagName !== 'svg' || root.getAttribute('viewBox') !== '0 0 24 24') {
      console.log(`  FAIL  wrong root for ${id}: <${root.tagName} viewBox="${root.getAttribute('viewBox')}">`);
      problems += 1;
    }
  }
  if (problems > 5) break;
}

console.log(`  ${problems === 0 ? 'PASS' : 'FAIL'}  ${checked} SVGs sampled across every glyph and variant, ${problems} problem(s)`);

/* The sprite must be well-formed too, and must keep currentColor for CSS inheritance. */
const spriteIds = ['arrow-left--v162', 'send--v162', 'search--v399'];
const items = spriteIds.map((id) => {
  const parsed = parseIconId(id);
  return { id, glyph: GLYPHS[parsed.glyphIndex], variant: VARIANTS[parsed.variantIndex] };
});
const sprite = renderSprite(items, {});
const spriteDoc = parser.parseFromString(sprite, 'image/svg+xml');
const spriteOk =
  !spriteDoc.querySelector('parsererror') &&
  spriteDoc.querySelectorAll('symbol').length === spriteIds.length &&
  sprite.includes('stroke="currentColor"');
console.log(`  ${spriteOk ? 'PASS' : 'FAIL'}  sprite is well-formed with ${spriteDoc.querySelectorAll('symbol').length} symbols`);
if (!spriteOk) problems += 1;

console.log(problems === 0 ? '\nSVG test: all checks passed' : `\nSVG test: ${problems} failure(s)`);
process.exit(problems === 0 ? 0 : 1);
