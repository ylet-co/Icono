/**
 * MCP smoke test — speaks JSON-RPC to the stdio server exactly like a client would.
 * Run: node scripts/mcp-smoke.mjs
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const child = spawn(process.execPath, [path.join(ROOT, 'apps/mcp/src/server.js')], {
  stdio: ['pipe', 'pipe', 'pipe'],
});

let buffer = '';
const pending = new Map();
let nextId = 1;

child.stdout.on('data', (chunk) => {
  buffer += chunk.toString('utf8');
  let index;
  while ((index = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, index).trim();
    buffer = buffer.slice(index + 1);
    if (!line) continue;
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      continue;
    }
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  }
});

child.stderr.on('data', (d) => process.stderr.write(`  server: ${d}`));

function request(method, params) {
  const id = nextId++;
  const payload = JSON.stringify({ jsonrpc: '2.0', id, method, params });
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout on ${method}`)), 15000);
    pending.set(id, (msg) => {
      clearTimeout(timer);
      if (msg.error) reject(new Error(`${method}: ${JSON.stringify(msg.error)}`));
      else resolve(msg.result);
    });
    child.stdin.write(`${payload}\n`);
  });
}

function notify(method, params) {
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method, params })}\n`);
}

const text = (result) => (result.content || []).map((c) => c.text || '').join('\n');

let failures = 0;
function check(label, condition, detail = '') {
  if (condition) {
    console.log(`  PASS  ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${label} ${detail}`);
  }
}

try {
  const init = await request('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'icono-smoke', version: '1.0.0' },
  });
  check('initialize', init.serverInfo?.name === 'icono', JSON.stringify(init.serverInfo));
  notify('notifications/initialized', {});

  const tools = await request('tools/list', {});
  check('tools/list returns 10 tools', tools.tools.length === 10, `got ${tools.tools.length}`);
  check('every tool has an inputSchema', tools.tools.every((t) => t.inputSchema && t.inputSchema.type === 'object'));

  const stats = await request('tools/call', { name: 'get_stats', arguments: {} });
  const statsBody = JSON.parse(text(stats));
  check('get_stats reports 1,088,000 icons', statsBody.totalIcons === 1088000, String(statsBody.totalIcons));

  const search = await request('tools/call', { name: 'search_icons', arguments: { query: 'back arrow', limit: 5 } });
  const searchBody = JSON.parse(text(search));
  check('search_icons finds the back arrow', searchBody.items.some((i) => i.id.startsWith('arrow-left')), text(search).slice(0, 120));

  const icon = await request('tools/call', {
    name: 'get_icon',
    arguments: { id: 'send--v162', color: '#FF5C1A', size: 32, includeDataUri: true, includeJsx: true },
  });
  const iconBody = JSON.parse(text(icon));
  check('get_icon returns svg with the requested colour', iconBody.svg.includes('stroke="#FF5C1A"'));
  check('get_icon returns a data uri', String(iconBody.dataUri).startsWith('data:image/svg+xml'));

  const batch = await request('tools/call', {
    name: 'batch_render',
    arguments: { glyph: 'shield', limit: 2, palettes: ['signal', 'cobalt'] },
  });
  const batchBody = JSON.parse(text(batch));
  check('batch_render crosses glyph x palettes', batchBody.count === 4, `got ${batchBody.count}`);

  const sprite = await request('tools/call', {
    name: 'create_sprite',
    arguments: { ids: ['arrow-left--v162', 'send--v162'] },
  });
  check('create_sprite emits symbols', JSON.parse(text(sprite)).svg.includes('<symbol id="send--v162"'));

  const saved = await request('tools/call', {
    name: 'save_icons',
    arguments: { dir: path.join(ROOT, 'tmp', 'mcp-smoke'), ids: ['send--v162', 'search--v162'], size: 24 },
  });
  const savedBody = JSON.parse(text(saved));
  check('save_icons writes two files', savedBody.count === 2, text(saved).slice(0, 200));

  const resources = await request('resources/list', {});
  check('resources/list exposes the docs', resources.resources.length >= 5, `got ${resources.resources.length}`);

  const doc = await request('resources/read', { uri: 'icono://docs/API.md' });
  check('resources/read returns the API doc', doc.contents[0].text.includes('/api/v1/icons'));

  const bad = await request('tools/call', { name: 'get_icon', arguments: { id: 'does-not-exist' } });
  check('unknown icon reports isError', bad.isError === true);
} catch (error) {
  failures += 1;
  console.log(`  FAIL  ${error.message}`);
} finally {
  child.kill();
}

console.log(failures === 0 ? '\nMCP smoke test: all checks passed' : `\nMCP smoke test: ${failures} failure(s)`);
process.exit(failures === 0 ? 0 : 1);
