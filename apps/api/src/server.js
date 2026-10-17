/**
 * Icono HTTP API.
 *
 * Zero dependencies on purpose: one `node:http` server that exposes the JSON API,
 * streams generated SVGs, serves the browser UI and serves the docs. Run it with
 * `npm start` (defaults to http://127.0.0.1:8787).
 */

import http from 'node:http';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
  GLYPH_INDEX,
} from '../../../packages/core/src/index.js';

import { buildOpenApi } from './openapi.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const WEB_DIR = path.join(ROOT, 'apps', 'web');
const DOCS_DIR = path.join(ROOT, 'docs');
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '127.0.0.1';
const VERSION = '1.0.0';

/* -------------------------------------------------------------------------- */
/* Response helpers                                                           */
/* -------------------------------------------------------------------------- */

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type,authorization',
  'access-control-max-age': '86400',
};

function sendJson(res, status, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    ...CORS,
    ...extraHeaders,
  });
  res.end(body);
}

function sendSvg(res, status, svg, extraHeaders = {}) {
  const etag = `"${createHash('sha1').update(svg).digest('hex').slice(0, 16)}"`;
  res.writeHead(status, {
    'content-type': 'image/svg+xml; charset=utf-8',
    'content-length': Buffer.byteLength(svg),
    'cache-control': 'public, max-age=31536000, immutable',
    etag,
    ...CORS,
    ...extraHeaders,
  });
  res.end(svg);
}

function sendText(res, status, text, contentType = 'text/plain; charset=utf-8', extraHeaders = {}) {
  res.writeHead(status, {
    'content-type': contentType,
    'content-length': Buffer.byteLength(text),
    ...CORS,
    ...extraHeaders,
  });
  res.end(text);
}

async function sendFile(res, absolutePath, contentType) {
  try {
    const body = await readFile(absolutePath);
    res.writeHead(200, {
      'content-type': contentType,
      'content-length': body.length,
      'cache-control': 'public, max-age=300',
      ...CORS,
    });
    res.end(body);
  } catch {
    sendJson(res, 404, { error: 'not_found', path: absolutePath });
  }
}

function notFound(res, message = 'Not found') {
  sendJson(res, 404, { error: 'not_found', message });
}

function badRequest(res, message) {
  sendJson(res, 400, { error: 'bad_request', message });
}

/* -------------------------------------------------------------------------- */
/* Query helpers                                                              */
/* -------------------------------------------------------------------------- */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

function mimeFor(file) {
  return MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
}

function renderOptionsFromQuery(query) {
  return {
    color: query.color,
    accent: query.accent,
    surface: query.surface || query.bg,
    background: query.background === 'true' || query.bg === 'true',
    backgroundRadius: query.radius,
    size: query.size,
    padding: query.padding,
    strokeScale: query.stroke ?? query.strokeScale,
    palette: query.palette,
    weight: query.weight,
    cap: query.cap,
    style: query.style,
    scale: query.scale,
    join: query.join,
    variant: query.variant,
  };
}

async function readJsonBody(req, limitBytes = 1_000_000) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limitBytes) throw new Error('payload too large');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

/* -------------------------------------------------------------------------- */
/* Router                                                                     */
/* -------------------------------------------------------------------------- */

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(url.pathname);
  const query = Object.fromEntries(url.searchParams.entries());

  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    res.end();
    return;
  }

  try {
    if (pathname.startsWith('/api/v1/')) {
      await handleApi(req, res, pathname, query);
      return;
    }
    if (pathname.startsWith('/docs/')) {
      const file = path.join(DOCS_DIR, pathname.slice('/docs/'.length));
      if (!file.startsWith(DOCS_DIR)) return notFound(res);
      return sendFile(res, file, mimeFor(file));
    }
    if (pathname === '/' || pathname === '/index.html') {
      return sendFile(res, path.join(WEB_DIR, 'index.html'), MIME['.html']);
    }
    if (pathname.startsWith('/assets/')) {
      const file = path.join(WEB_DIR, pathname.slice('/assets/'.length));
      if (!file.startsWith(WEB_DIR)) return notFound(res);
      return sendFile(res, file, mimeFor(file));
    }
    if (pathname === '/favicon.svg') {
      return sendSvg(res, 200, renderIcon({ id: 'hexagon', color: '#FF5C1A', size: 64 }).svg);
    }
    return notFound(res, `${req.method} ${pathname}`);
  } catch (error) {
    sendJson(res, 500, { error: 'internal_error', message: String(error && error.message ? error.message : error) });
  }
});

async function handleApi(req, res, pathname, query) {
  const route = pathname.replace('/api/v1', '');

  /* ---------------------------- meta endpoints --------------------------- */
  if (route === '/health') {
    return sendJson(res, 200, { status: 'ok', service: 'icono-api', version: VERSION, uptime: Math.round(process.uptime()) });
  }
  if (route === '/stats') {
    return sendJson(res, 200, { ...getStats(), version: VERSION });
  }
  if (route === '/palettes') {
    return sendJson(res, 200, { total: PALETTES.length, items: PALETTES });
  }
  if (route === '/variants') {
    return sendJson(res, 200, {
      total: VARIANTS.length,
      axes: getStats().variantAxes,
      items: VARIANTS.map((v) => ({ ...v, id: `v${String(v.index).padStart(3, '0')}` })),
    });
  }
  if (route === '/tags') {
    return sendJson(res, 200, { total: TAGS.length, items: TAGS });
  }
  if (route === '/categories') {
    return sendJson(res, 200, {
      total: CATEGORIES.length,
      items: CATEGORIES.map((c) => ({
        ...c,
        glyphs: GLYPHS.filter((g) => g.tags.some((t) => c.tags.includes(t))).length,
      })),
    });
  }
  if (route === '/openapi.json') {
    return sendJson(res, 200, buildOpenApi(VERSION));
  }

  /* ------------------------------ glyphs --------------------------------- */
  if (route === '/glyphs') {
    return sendJson(res, 200, listGlyphs(query));
  }
  const glyphMatch = /^\/glyphs\/([^/]+)$/.exec(route);
  if (glyphMatch) {
    const slug = glyphMatch[1];
    const index = GLYPH_INDEX.get(slug);
    if (index === undefined) return notFound(res, `Unknown glyph: ${slug}`);
    const glyph = GLYPHS[index];
    const withVariants = query.variants !== 'false' && query.variants !== '0';
    return sendJson(res, 200, {
      slug: glyph.slug,
      name: glyph.name,
      tags: glyph.tags,
      glyphIndex: index,
      grid: 24,
      paths: glyph.d,
      variantCount: VARIANTS.length,
      icons: withVariants
        ? VARIANTS.map((v) => ({
            id: `${glyph.slug}--v${String(v.index).padStart(3, '0')}`,
            variant: v.index,
            style: v.style,
            weight: v.weight,
            cap: v.cap,
            scale: v.scale,
            join: v.join,
          }))
        : undefined,
      iconsUrl: `/api/v1/glyphs/${glyph.slug}?variants=true`,
    });
  }

  /* ------------------------------- icons --------------------------------- */
  if (route === '/icons') {
    return sendJson(res, 200, searchIcons(query));
  }
  if (route === '/icons/random') {
    const count = Math.max(1, Math.min(Number(query.count) || 24, 100));
    const items = [];
    for (let i = 0; i < count; i += 1) {
      const g = Math.floor(Math.random() * GLYPHS.length);
      const v = Math.floor(Math.random() * VARIANTS.length);
      const result = renderIcon({ id: `${GLYPHS[g].slug}--v${String(v).padStart(3, '0')}`, ...renderOptionsFromQuery(query) });
      if (result.ok) items.push({ ...result.meta, svg: result.svg });
    }
    return sendJson(res, 200, { count: items.length, items });
  }

  const svgMatch = /^\/icons\/([^/]+)\/svg$/.exec(route);
  if (svgMatch) {
    const result = renderIcon({ id: svgMatch[1], ...renderOptionsFromQuery(query), title: query.title });
    if (!result.ok) return notFound(res, result.error);
    return sendSvg(res, 200, result.svg);
  }

  const dataUriMatch = /^\/icons\/([^/]+)\/data-uri$/.exec(route);
  if (dataUriMatch) {
    const result = renderIcon({ id: dataUriMatch[1], ...renderOptionsFromQuery(query) });
    if (!result.ok) return notFound(res, result.error);
    return sendText(res, 200, toDataUri(result.svg), 'text/plain; charset=utf-8');
  }

  const jsxMatch = /^\/icons\/([^/]+)\/jsx$/.exec(route);
  if (jsxMatch) {
    const result = renderIcon({ id: jsxMatch[1], ...renderOptionsFromQuery(query) });
    if (!result.ok) return notFound(res, result.error);
    const base = jsxMatch[1].split('--')[0];
    const component = base.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
    return sendText(res, 200, toJsx(result.svg, `${component}Icon`), 'text/plain; charset=utf-8');
  }

  const iconMatch = /^\/icons\/([^/]+)$/.exec(route);
  if (iconMatch) {
    const id = iconMatch[1];
    const parsed = parseIconId(id);
    if (!parsed) return notFound(res, `Unknown icon: ${id}`);
    const icon = getIcon(parsed.glyphIndex, parsed.variantIndex, query.palette);
    const result = renderIcon({ id, ...renderOptionsFromQuery(query) });
    return sendJson(res, 200, { ...icon, svg: result.svg });
  }

  /* ------------------------------ sprite --------------------------------- */
  if (route === '/sprite.svg') {
    const ids = String(query.ids || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 500);
    if (!ids.length) return badRequest(res, 'Provide ?ids=slug--vNNN,slug--vNNN');
    const items = [];
    for (const id of ids) {
      const parsed = parseIconId(id);
      if (!parsed) continue;
      items.push({ id, glyph: GLYPHS[parsed.glyphIndex], variant: VARIANTS[parsed.variantIndex] });
    }
    if (!items.length) return badRequest(res, 'None of the supplied ids resolved');
    return sendSvg(res, 200, renderSprite(items, renderOptionsFromQuery(query)));
  }

  /* ------------------------------ batch render --------------------------- */
  if (route === '/render' && req.method === 'POST') {
    const body = await readJsonBody(req);
    const requests = Array.isArray(body.icons) ? body.icons : [body];
    if (requests.length > 500) return badRequest(res, 'Max 500 icons per batch');
    const common = {
      color: body.color,
      accent: body.accent,
      surface: body.surface,
      background: body.background,
      size: body.size,
      padding: body.padding,
      strokeScale: body.stroke,
      palette: body.palette,
      style: body.style,
      weight: body.weight,
      cap: body.cap,
      scale: body.scale,
      join: body.join,
    };
    const items = [];
    const errors = [];
    for (const item of requests) {
      const result = renderIcon({ ...common, ...item });
      if (result.ok) items.push({ ...result.meta, svg: result.svg });
      else errors.push({ input: item, error: result.error });
    }
    return sendJson(res, 200, { count: items.length, errors, items });
  }


  return notFound(res, `No API route for ${pathname}`);
}

server.listen(PORT, HOST, () => {
  const stats = getStats();
  process.stdout.write(
    `Icono API on http://${HOST}:${PORT} — ${stats.baseIcons.toLocaleString('en-US')} generated icons x ${stats.palettes} palettes = ${stats.totalIcons.toLocaleString('en-US')} renderable icons\n`,
  );
});

export { server };
