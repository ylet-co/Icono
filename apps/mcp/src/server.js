#!/usr/bin/env node
/**
 * Icono MCP server.
 *
 * Exposes the generated icon stash to any MCP client over stdio: search, render,
 * recolour, bundle into sprites, and write SVGs straight into a project.
 *
 * Protocol notes:
 *  - stdout is reserved for JSON-RPC. All logging goes to stderr.
 *  - tool input schemas are plain JSON Schema, so no extra validation layer.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import {
  GLYPHS,
  VARIANTS,
  PALETTES,
  CATEGORIES,
  TAGS,
  getStats,
  listGlyphs,
  searchIcons,
  getIcon,
  parseIconId,
  renderIcon,
  renderSprite,
  toDataUri,
  toJsx,
} from '../../../packages/core/src/index.js';

const VERSION = '1.0.0';
const log = (...args) => process.stderr.write(`[icono-mcp] ${args.join(' ')}\n`);

/* -------------------------------------------------------------------------- */
/* Shared JSON Schema fragments                                               */
/* -------------------------------------------------------------------------- */

const styleProps = {
  style: { type: 'string', enum: ['outline', 'duotone', 'dashed', 'soft', 'contrast'], description: 'Rendering style.' },
  weight: { type: 'number', enum: [1, 1.25, 1.5, 1.75, 2], description: 'Stroke weight in grid units.' },
  cap: { type: 'string', enum: ['round', 'square'], description: 'Line cap and join shape.' },
  scale: { type: 'number', enum: [0.9, 1, 1.1, 1.2], description: 'Inner scale of the glyph inside the 24x24 box.' },
  join: { type: 'string', enum: ['round', 'miter'], description: 'Line join style.' },
  variant: { type: 'string', description: 'Explicit variant id such as "v162" (0-399). Overrides the axis parameters.' },
};

const paintProps = {
  color: { type: 'string', description: 'Ink colour: hex, rgb() or a CSS colour name. Defaults to currentColor.' },
  accent: { type: 'string', description: 'Secondary colour used by the duotone and contrast styles.' },
  surface: { type: 'string', description: 'Background colour, painted only when background is true.' },
  background: { type: 'boolean', description: 'Paint a rounded background plate behind the glyph.' },
  size: { type: 'integer', description: 'Rendered width/height in px. Default 24.' },
  padding: { type: 'number', description: 'Inner padding in grid units, 0-6.' },
  stroke: { type: 'number', description: 'Multiplier applied to the variant stroke weight.' },
  palette: { type: 'string', enum: PALETTES.map((p) => p.id), description: 'Named ink/accent/surface palette.' },
};

const PALETTE_IDS = PALETTES.map((p) => p.id);
const CATEGORY_IDS = CATEGORIES.map((c) => c.id);
const STYLE_IDS = ['outline', 'duotone', 'dashed', 'soft', 'contrast'];

const TOOLS = [
  {
    name: 'search_icons',
    title: 'Search icons',
    description:
      'Search the stash. Filters glyphs by free text (slug, name, tags) and variants by style axes, and returns ready-to-use icon ids with their svgUrl. Use this first to discover what exists.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Free text, e.g. "back arrow", "wallet", "send".' },
        glyph: { type: 'string', description: 'Restrict to one glyph slug.' },
        tag: { type: 'string', description: 'Require an exact tag, e.g. "media".' },
        category: { type: 'string', enum: CATEGORY_IDS, description: 'Curated category.' },
        ...styleProps,
        palette: paintProps.palette,
        order: { type: 'string', enum: ['variant', 'glyph'], description: 'Result ordering. Default variant.' },
        limit: { type: 'integer', description: 'Page size, 1-500. Default 40.' },
        offset: { type: 'integer', description: 'Pagination offset.' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_icon',
    title: 'Get one icon',
    description:
      'Resolve one icon by id (or bare glyph slug) and return the finished SVG, plus optional data URI and React component. Use this when you already know which icon you want.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Icon id like "arrow-left--v162", or a bare glyph slug like "arrow-left".' },
        ...styleProps,
        ...paintProps,
        includeDataUri: { type: 'boolean', description: 'Also return a data: URI.' },
        includeJsx: { type: 'boolean', description: 'Also return a React component.' },
      },
      required: ['id'],
    },
  },
  {
    name: 'render_icon',
    title: 'Compose an icon',
    description:
      'Build an icon from a glyph slug and explicit style axes, when you want a specific weight/cap/style rather than an existing variant id.',
    inputSchema: {
      type: 'object',
      properties: { glyph: { type: 'string', description: 'Glyph slug, e.g. "send".' }, ...styleProps, ...paintProps },
      required: ['glyph'],
    },
  },
  {
    name: 'batch_render',
    title: 'Batch render',
    description:
      'Render many icons in one call — ideal for generating a recoloured set of the same glyph across palettes, or a whole toolbar.',
    inputSchema: {
      type: 'object',
      properties: {
        ids: { type: 'array', items: { type: 'string' }, description: 'Explicit icon ids to render.' },
        glyph: { type: 'string', description: 'Instead of ids, render variants of this glyph (first `limit`).' },
        palettes: {
          type: 'array',
          items: { type: 'string', enum: PALETTE_IDS },
          description: 'Render the same icons once per palette — this is how you get 10-20 looks of one icon.',
        },
        limit: { type: 'integer', description: 'Max icons, 1-500. Default 24.' },
        ...styleProps,
        ...paintProps,
      },
    },
  },
  {
    name: 'create_sprite',
    title: 'Create an SVG sprite',
    description: 'Merge up to 500 icons into a single SVG sprite of <symbol> elements for a web project.',
    inputSchema: {
      type: 'object',
      properties: {
        ids: { type: 'array', items: { type: 'string' }, description: 'Icon ids to include.' },
        ...paintProps,
      },
      required: ['ids'],
    },
  },
  {
    name: 'save_icons',
    title: 'Save icons to disk',
    description:
      "Write rendered SVGs into a directory so they land in the user's project. Creates the directory if needed and returns the file paths.",
    inputSchema: {
      type: 'object',
      properties: {
        dir: { type: 'string', description: 'Absolute or relative output directory, e.g. "public/icons".' },
        ids: { type: 'array', items: { type: 'string' }, description: 'Icon ids to save.' },
        query: { type: 'string', description: 'Instead of ids, save the top results for this search.' },
        limit: { type: 'integer', description: 'Max files, 1-500. Default 24.' },
        ...styleProps,
        ...paintProps,
      },
      required: ['dir'],
    },
  },
  {
    name: 'list_glyphs',
    title: 'List glyphs',
    description: 'Enumerate the base glyphs with their names and tags. 272 glyphs in total.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        tag: { type: 'string' },
        category: { type: 'string', enum: CATEGORY_IDS },
        limit: { type: 'integer', description: 'Default 60, max 500.' },
        offset: { type: 'integer' },
      },
    },
  },
  {
    name: 'list_palettes',
    title: 'List palettes',
    description: 'The ten named ink/accent/surface palettes.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'list_variants',
    title: 'List variants',
    description: 'The 400 style variants and the five axes they are built from.',
    inputSchema: {
      type: 'object',
      properties: { style: { type: 'string', enum: STYLE_IDS }, limit: { type: 'integer', description: 'Default 60, max 400.' } },
    },
  },
  {
    name: 'get_stats',
    title: 'Stash statistics',
    description: 'Glyph count, variants per glyph, palettes and the resulting total icon count.',
    inputSchema: { type: 'object', properties: {} },
  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const ok = (payload) => ({
  content: [{ type: 'text', text: typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2) }],
});
const fail = (message) => ({ content: [{ type: 'text', text: `Icono error: ${message}` }], isError: true });

const clamp = (value, max, fallback) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.floor(n), max);
};

const idFrom = (glyphIndex, vIndex) => `${GLYPHS[glyphIndex].slug}--v${String(vIndex).padStart(3, '0')}`;

/** Turn "v162" | 162 | undefined into a valid variant index. */
function resolveVariantIndex(args) {
  if (args.variant === undefined || args.variant === null || args.variant === '') return null;
  const numeric = Number(String(args.variant).replace(/^v/i, ''));
  if (Number.isInteger(numeric) && VARIANTS[numeric]) return numeric;
  return null;
}

function variantLine(v) {
  return `${v.style} · ${v.weight}px · ${v.cap} · ${Math.round(v.scale * 100)}% · ${v.join}`;
}

/** Shorten search hits so a tool result stays readable. */
function brief(icon) {
  return {
    id: icon.id,
    name: icon.name,
    tags: icon.tags.slice(0, 6),
    style: icon.variant.style,
    stroke: icon.variant.weight,
    svgUrl: icon.svgUrl,
  };
}

/** Collect icon ids for the tools that operate on many icons at once. */
function collectIds(args, defaultLimit) {
  const limit = clamp(args.limit, 500, defaultLimit);
  if (Array.isArray(args.ids) && args.ids.length) return args.ids.slice(0, 500);

  if (args.glyph) {
    const found = parseIconId(String(args.glyph));
    if (!found) throw new Error(`Unknown glyph: ${args.glyph}`);
    const vIndex = resolveVariantIndex(args);
    if (vIndex !== null) return [idFrom(found.glyphIndex, vIndex)];
    const out = [];
    for (let v = 0; v < VARIANTS.length && out.length < limit; v += 1) {
      const variant = VARIANTS[v];
      if (args.style && variant.style !== args.style) continue;
      if (args.weight !== undefined && Number(args.weight) !== variant.weight) continue;
      if (args.cap && variant.cap !== args.cap) continue;
      out.push(idFrom(found.glyphIndex, v));
    }
    return out;
  }

  const search = searchIcons({
    q: args.query || '',
    limit,
    offset: 0,
    style: args.style,
    weight: args.weight,
    cap: args.cap,
    scale: args.scale,
    join: args.join,
    palette: args.palette,
  });
  if (!search.items.length) throw new Error('No icons matched — pass `ids`, a `glyph`, or a broader `query`.');
  return search.items.map((i) => i.id);
}

/* -------------------------------------------------------------------------- */
/* Tool dispatch                                                              */
/* -------------------------------------------------------------------------- */

async function callTool(name, args) {
  switch (name) {
    case 'search_icons': {
      const result = searchIcons({
        q: args.query,
        glyph: args.glyph,
        tag: args.tag,
        category: args.category,
        style: args.style,
        weight: args.weight,
        cap: args.cap,
        scale: args.scale,
        join: args.join,
        variant: args.variant,
        palette: args.palette,
        order: args.order || 'variant',
        limit: clamp(args.limit, 500, 40),
        offset: Number(args.offset) || 0,
      });
      return ok({
        total: result.total,
        offset: result.offset,
        count: result.count,
        items: result.items.map(brief),
        hint: result.total > result.count ? 'Increase `limit` or use `offset` to page.' : undefined,
      });
    }

    case 'get_icon': {
      const result = renderIcon({
        id: args.id,
        variant: args.variant,
        style: args.style,
        weight: args.weight,
        cap: args.cap,
        scale: args.scale,
        join: args.join,
        color: args.color,
        accent: args.accent,
        surface: args.surface,
        background: args.background,
        size: args.size,
        padding: args.padding,
        strokeScale: args.stroke,
        palette: args.palette,
        dataUri: Boolean(args.includeDataUri),
        jsx: Boolean(args.includeJsx),
      });
      if (!result.ok) return fail(result.error);
      return ok({
        id: result.meta.id,
        name: result.meta.name,
        tags: result.meta.tags,
        variant: result.meta.variant,
        color: result.meta.color,
        size: result.meta.size,
        svg: result.svg,
        dataUri: result.dataUri,
        jsx: result.jsx,
      });
    }

    case 'render_icon': {
      const result = renderIcon({
        glyph: args.glyph,
        variant: args.variant,
        style: args.style,
        weight: args.weight,
        cap: args.cap,
        scale: args.scale,
        join: args.join,
        color: args.color,
        accent: args.accent,
        surface: args.surface,
        background: args.background,
        size: args.size,
        padding: args.padding,
        strokeScale: args.stroke,
        palette: args.palette,
      });
      if (!result.ok) return fail(result.error);
      return ok({ id: result.meta.id, variant: result.meta.variant, svg: result.svg });
    }

    case 'batch_render': {
      const ids = collectIds(args, 24);
      const palettes = Array.isArray(args.palettes) && args.palettes.length ? args.palettes : [args.palette || undefined];
      const items = [];
      for (const palette of palettes) {
        for (const id of ids) {
          if (items.length >= 500) break;
          const result = renderIcon({
            id,
            palette,
            color: args.color,
            accent: args.accent,
            surface: args.surface,
            background: args.background,
            size: args.size,
            padding: args.padding,
            strokeScale: args.stroke,
          });
          if (result.ok) items.push({ id: result.meta.id, palette: result.meta.palette, svg: result.svg });
        }
      }
      return ok({ count: items.length, items });
    }

    case 'create_sprite': {
      const resolved = [];
      for (const id of (args.ids || []).slice(0, 500)) {
        const parsed = parseIconId(String(id));
        if (!parsed) continue;
        resolved.push({ id, glyph: GLYPHS[parsed.glyphIndex], variant: VARIANTS[parsed.variantIndex] });
      }
      if (!resolved.length) return fail('None of the supplied ids resolved.');
      const svg = renderSprite(resolved, { color: args.color, accent: args.accent, size: args.size });
      return ok({ symbols: resolved.length, ids: resolved.map((r) => r.id), svg });
    }

    case 'save_icons': {
      if (!args.dir) return fail('`dir` is required.');
      const ids = collectIds(args, 24);
      const outDir = path.resolve(String(args.dir));
      await mkdir(outDir, { recursive: true });
      const written = [];
      for (const id of ids.slice(0, 500)) {
        const result = renderIcon({
          id,
          palette: args.palette,
          color: args.color,
          accent: args.accent,
          surface: args.surface,
          background: args.background,
          size: args.size,
          padding: args.padding,
          strokeScale: args.stroke,
        });
        if (!result.ok) continue;
        const file = path.join(outDir, `${result.meta.id}.svg`);
        await writeFile(file, result.svg, 'utf8');
        written.push(file);
      }
      return ok({ dir: outDir, count: written.length, files: written });
    }

    case 'list_glyphs': {
      const result = listGlyphs({
        q: args.query,
        tag: args.tag,
        category: args.category,
        limit: clamp(args.limit, 500, 60),
        offset: Number(args.offset) || 0,
      });
      return ok({
        total: result.total,
        count: result.count,
        items: result.items.map((g) => ({ slug: g.slug, name: g.name, tags: g.tags, defaultIconId: g.defaultIconId })),
      });
    }

    case 'list_palettes':
      return ok({ total: PALETTES.length, items: PALETTES });

    case 'list_variants': {
      const list = args.style ? VARIANTS.filter((v) => v.style === args.style) : VARIANTS;
      const limit = clamp(args.limit, 400, 60);
      return ok({
        total: list.length,
        axes: getStats().variantAxes,
        items: list
          .slice(0, limit)
          .map((v) => ({ id: `v${String(v.index).padStart(3, '0')}`, index: v.index, label: variantLine(v) })),
      });
    }

    case 'get_stats':
      return ok({ ...getStats(), tags: TAGS.length });

    default:
      return fail(`Unknown tool: ${name}`);
  }
}

/* -------------------------------------------------------------------------- */
/* Server wiring                                                              */
/* -------------------------------------------------------------------------- */

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..');

const RESOURCES = [
  { uri: 'icono://docs/API.md', name: 'API reference', description: 'Every HTTP endpoint and query parameter.', mimeType: 'text/markdown', file: 'docs/API.md' },
  { uri: 'icono://docs/MCP.md', name: 'MCP reference', description: 'Client config, tool reference and prompt recipes.', mimeType: 'text/markdown', file: 'docs/MCP.md' },
  { uri: 'icono://docs/ICON-ENGINE.md', name: 'Icon engine', description: 'How glyphs and variants combine, and how to extend them.', mimeType: 'text/markdown', file: 'docs/ICON-ENGINE.md' },
  { uri: 'icono://docs/DESIGN.md', name: 'Design system', description: 'The design decisions behind the Icono interface.', mimeType: 'text/markdown', file: 'docs/DESIGN.md' },
  { uri: 'icono://docs/SKILL-USAGE.md', name: 'Skill usage', description: 'How the premium-ui-design skill was applied.', mimeType: 'text/markdown', file: 'docs/SKILL-USAGE.md' },
  { uri: 'icono://catalog/stats', name: 'Stash statistics', description: 'Live counts for the whole stash.', mimeType: 'application/json' },
];

const server = new Server(
  { name: 'icono', version: VERSION, title: 'Icono icon stash' },
  { capabilities: { tools: {}, resources: {} }, instructions: 'Icono serves a generated stash of SVG icons. Call get_stats first, then search_icons to find ids, then get_icon or batch_render to produce SVG. save_icons writes files into the user\'s project.' },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params || {};
  try {
    return await callTool(name, args);
  } catch (error) {
    log(`tool ${name} failed: ${error && error.message}`);
    return fail(String((error && error.message) || error));
  }
});

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: RESOURCES.map(({ uri, name, description, mimeType }) => ({ uri, name, description, mimeType })),
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params || {};
  const resource = RESOURCES.find((r) => r.uri === uri);
  if (!resource) throw new Error(`Unknown resource: ${uri}`);

  if (resource.mimeType === 'application/json') {
    return {
      contents: [{ uri, mimeType: 'application/json', text: JSON.stringify({ ...getStats(), tags: TAGS.length, palettes: PALETTES }, null, 2) }],
    };
  }

  const text = await readFile(path.join(ROOT, resource.file), 'utf8');
  return { contents: [{ uri, mimeType: resource.mimeType, text }] };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  const stats = getStats();
  log(
    `ready · ${stats.glyphs} glyphs × ${stats.variantsPerGlyph} variants × ${stats.palettes} palettes = ${stats.totalIcons} icons · ${TOOLS.length} tools`,
  );
}

main().catch((error) => {
  log(`fatal: ${error && error.stack ? error.stack : error}`);
  process.exit(1);
});




