#!/usr/bin/env node
/**
 * Bulk-export icons to disk.
 *
 * Writes real .svg files, so you can commit a generated set into a project. The stash itself
 * never stores anything — this is the one place files are created.
 *
 *   node scripts/export-icons.mjs --out ./public/icons --style outline --limit 200
 *   node scripts/export-icons.mjs --out ./brand --glyph wallet --palette cobalt --size 48
 *   node scripts/export-icons.mjs --out ./toolbar --ids arrow-left--v162,send--v162 --sprite
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { searchIcons, parseIconId, renderIcon, renderSprite, GLYPHS, VARIANTS } from '../packages/core/src/index.js';

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    if (key === 'sprite' || key === 'flat') {
      out[key] = true;
      continue;
    }
    out[key] = argv[i + 1];
    i += 1;
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));

if (!args.out) {
  console.error(`Usage: node scripts/export-icons.mjs --out <dir> [filters]

  --out <dir>        output directory (required)
  --ids a,b,c        explicit icon ids; overrides every other selector
  --glyph <slug>     restrict to one glyph
  --query <text>     free-text search
  --tag <tag>        require a tag
  --category <id>    curated category
  --style <style>    outline | duotone | dashed | soft | contrast
  --weight <n>       1 | 1.25 | 1.5 | 1.75 | 2
  --cap <c>          round | square
  --scale <n>        0.9 | 1 | 1.1 | 1.2
  --join <j>         round | miter
  --variant <vNNN>   pin one variant
  --palette <id>     obsidian | graphite | ink | signal | cobalt | magenta | amber | violet | cyan | crimson
  --color <hex>      ink colour override
  --accent <hex>     accent colour override
  --surface <hex>    background colour
  --background       paint a rounded plate
  --size <px>        default 24
  --stroke <n>       stroke-weight multiplier
  --limit <n>        default 100, max 5000
  --offset <n>       default 0
  --sprite           also write sprite.svg for everything exported
`);
  process.exit(1);
}

const outDir = path.resolve(args.out);
const limit = Math.max(1, Math.min(Number(args.limit) || 100, 5000));
const offset = Math.max(0, Number(args.offset) || 0);

/** Resolve the requested set to a flat list of icon ids. */
function resolveIds() {
  if (args.ids) {
    return String(args.ids)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (args.glyph) {
    const found = parseIconId(String(args.glyph));
    if (!found) throw new Error(`Unknown glyph: ${args.glyph}`);
    const slug = GLYPHS[found.glyphIndex].slug;
    const vIndex = args.variant ? Number(String(args.variant).replace(/^v/i, '')) : null;
    const variants = vIndex !== null && VARIANTS[vIndex] ? [VARIANTS[vIndex]] : VARIANTS;
    return variants
      .filter((v) => {
        if (args.style && v.style !== args.style) return false;
        if (args.weight !== undefined && Number(args.weight) !== v.weight) return false;
        if (args.cap && v.cap !== args.cap) return false;
        if (args.scale !== undefined && Number(args.scale) !== v.scale) return false;
        if (args.join && v.join !== args.join) return false;
        return true;
      })
      .map((v) => `${slug}--v${String(v.index).padStart(3, '0')}`)
      .slice(offset, offset + limit);
  }
  const result = searchIcons({
    q: args.query || '',
    tag: args.tag,
    category: args.category,
    style: args.style,
    weight: args.weight,
    cap: args.cap,
    scale: args.scale,
    join: args.join,
    variant: args.variant,
    limit,
    offset,
  });
  return result.items.map((i) => i.id);
}

const ids = resolveIds();
if (!ids.length) {
  console.error('Nothing matched those filters.');
  process.exit(1);
}

const renderOptions = {
  palette: args.palette,
  color: args.color,
  accent: args.accent,
  surface: args.surface,
  background: Boolean(args.background),
  size: args.size,
  strokeScale: args.stroke,
};

await mkdir(outDir, { recursive: true });

const written = [];
const failed = [];
for (const id of ids) {
  const result = renderIcon({ id, ...renderOptions });
  if (!result.ok) {
    failed.push(`${id}: ${result.error}`);
    continue;
  }
  const file = path.join(outDir, `${result.meta.id}.svg`);
  await writeFile(file, result.svg, 'utf8');
  written.push(result.meta.id);
}

if (args.sprite) {
  const items = [];
  for (const id of written) {
    const parsed = parseIconId(id);
    if (!parsed) continue;
    items.push({ id, glyph: GLYPHS[parsed.glyphIndex], variant: VARIANTS[parsed.variantIndex] });
  }
  await writeFile(path.join(outDir, 'sprite.svg'), renderSprite(items, renderOptions), 'utf8');
}

console.log(`Wrote ${written.length} SVG file${written.length === 1 ? '' : 's'} to ${outDir}`);
if (args.sprite) console.log(`Wrote ${path.join(outDir, 'sprite.svg')}`);
if (failed.length) console.error(`Skipped ${failed.length}: ${failed.slice(0, 5).join('; ')}`);
