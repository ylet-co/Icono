#!/usr/bin/env node
/** Print the stash arithmetic. Run: node scripts/stats.mjs */

import { getStats, GLYPHS, TAGS, CATEGORIES, PALETTES } from '../packages/core/src/index.js';

const s = getStats();
const line = '─'.repeat(58);

console.log(`\nIcono stash\n${line}`);
console.log(`glyphs                 ${s.glyphs}`);
console.log(`variants per glyph     ${s.variantsPerGlyph}`);
console.log(`generated icons        ${s.baseIcons.toLocaleString('en-US')}   (${s.glyphs} × ${s.variantsPerGlyph})`);
console.log(`palettes               ${s.palettes}`);
console.log(`renderable icons       ${s.totalIcons.toLocaleString('en-US')}   (${s.baseIcons.toLocaleString('en-US')} × ${s.palettes})`);
console.log(`tags                   ${TAGS.length}`);
console.log(`categories             ${CATEGORIES.length}`);
console.log(`grid                   ${s.grid} × ${s.grid}`);
console.log(`default variant        ${s.defaultVariant.id}  ${s.defaultVariant.label}`);
console.log(`\nvariant axes`);
for (const [axis, values] of Object.entries(s.variantAxes)) {
  console.log(`  ${axis.padEnd(8)} ${values.join('  ')}`);
}

console.log(`\ncategories`);
for (const c of CATEGORIES) {
  const count = GLYPHS.filter((g) => g.tags.some((t) => c.tags.includes(t))).length;
  console.log(`  ${c.id.padEnd(12)} ${String(count).padStart(3)} glyphs   ${c.name}`);
}

console.log(`\npalettes`);
for (const p of PALETTES) {
  console.log(`  ${p.id.padEnd(10)} ink ${p.ink.padEnd(9)} accent ${p.accent.padEnd(9)} surface ${p.surface}`);
}
console.log('');
