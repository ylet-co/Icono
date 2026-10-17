# Icono MCP server

Icono ships a [Model Context Protocol](https://modelcontextprotocol.io) server that exposes the
whole stash to an agent over **stdio**. No API key, no network, no rate limit — the model
searches, recolours, batch-renders and writes SVG files straight into your project.

## Install and run

```bash
npm install          # installs @modelcontextprotocol/sdk for this workspace
npm run mcp          # starts the server on stdio
```

## Client configuration

Add this block to your MCP client config (Claude Desktop: `claude_desktop_config.json`;
Cursor: `.cursor/mcp.json`; anything else: the equivalent `mcpServers` map).

```json
{
  "mcpServers": {
    "icono": {
      "command": "node",
      "args": ["/absolute/path/to/Icono/apps/mcp/src/server.js"]
    }
  }
}
```

Use an **absolute** path. Restart the client and Icono's ten tools appear.

## Tools

### `get_stats`

No arguments. Returns glyph count, variants per glyph, palette count and the resulting total.
Call this first when you need to cite a number.

```json
{ "glyphs": 272, "variantsPerGlyph": 400, "baseIcons": 108800, "palettes": 10, "totalIcons": 1088000 }
```

### `search_icons`

Free-text search over slug, name and tags, with variant filters. Returns ready-to-use ids.

| argument | type | notes |
|----------|------|-------|
| `query` | string | **required** — e.g. `"back arrow"`, `"wallet"`, `"send"` |
| `glyph` | string | restrict to one glyph slug |
| `tag` | string | require one exact tag |
| `category` | string | `arrows` `essentials` `shapes` `security` `files` `media` `people` `dev` `commerce` `devices` `weather` `layout` |
| `style` | string | `outline` `duotone` `dashed` `soft` `contrast` |
| `weight` | number | `1` `1.25` `1.5` `1.75` `2` |
| `cap` | string | `round` `square` |
| `scale` | number | `0.9` `1` `1.1` `1.2` |
| `join` | string | `round` `miter` |
| `order` | string | `variant` (default) or `glyph` |
| `limit` | integer | default 40, max 500 |
| `offset` | integer | paging |

### `get_icon`

Resolve one icon by id and get the finished SVG. Also accepts a bare glyph slug.

| argument | type | notes |
|----------|------|-------|
| `id` | string | **required** — `arrow-left--v162`, or just `arrow-left` |
| `variant` | string | `v000`–`v399` |
| `color` `accent` `surface` | string | colours |
| `palette` | string | named trio, e.g. `signal` |
| `background` | boolean | paint a rounded plate |
| `size` | integer | px, default 24 |
| `padding` | number | grid units, 0–6 |
| `stroke` | number | stroke-weight multiplier |
| `includeDataUri` | boolean | also return a `data:` URI |
| `includeJsx` | boolean | also return a React component |

### `render_icon`

Compose an icon from a glyph slug plus explicit axes, when you want a specific
weight/cap/style rather than an existing variant id. Same paint arguments as `get_icon`, with
`glyph` required.

### `batch_render`

Render many icons in one call — the tool for "give me twenty looks of this icon".

| argument | type | notes |
|----------|------|-------|
| `ids` | string[] | explicit ids |
| `glyph` | string | instead of ids, render variants of this glyph |
| `palettes` | string[] | render the same icons once **per palette** (cross-product) |
| `limit` | integer | max icons, default 24, cap 500 |
| plus | | all paint + axis arguments |

```json
{ "glyph": "shield", "palettes": ["signal", "cobalt", "magenta"], "limit": 2, "size": 32 }
```

→ 6 SVGs (2 variants × 3 palettes).

### `create_sprite`

Merge up to 500 icons into one SVG sprite of `<symbol>` elements. Symbols keep
`stroke="currentColor"`, so a single file recolours per use site through CSS.

```json
{ "ids": ["arrow-left--v162", "send--v162", "search--v162"], "size": 24 }
```

### `save_icons`

Write rendered SVGs into a directory so they land in the user's project. Creates the directory
if needed and returns every file path.

```json
{ "dir": "public/icons", "query": "arrow", "style": "outline", "limit": 24, "color": "#FF5C1A", "size": 24 }
```

Files are named `<slug>--v<NNN>.svg`, so a re-run is idempotent.

### `list_glyphs`

Enumerate base glyphs with names, tags and a `defaultIconId`. Arguments: `query`, `tag`,
`category`, `limit` (default 60, max 500), `offset`.

### `list_palettes`


## Resources

The server also exposes its own documentation as MCP resources, so an agent can read the
contract before it calls anything:

| URI | Contents |
|-----|----------|
| `icono://docs/API.md` | HTTP API reference |
| `icono://docs/MCP.md` | This document |
| `icono://docs/ICON-ENGINE.md` | How glyphs and variants combine |
| `icono://docs/DESIGN.md` | Design system behind the interface |
| `icono://docs/SKILL-USAGE.md` | How the premium-ui-design skill was applied |
| `icono://catalog/stats` | Live stash statistics as JSON |

## Prompt recipes

**"Add a proper empty state to the settings screen."**

> Search for `settings` and `alert` with `style: outline`, pick ids, then `save_icons` into
> `src/assets/icons` and reference them by file path.

**"Give me the wallet icon in twenty different colours for a comparison table."**

> `batch_render` with `{ "glyph": "wallet", "palettes": [all ten], "limit": 2 }` — twenty SVGs in
> one call.

**"Make a toolbar sprite with back, forward, refresh, share."**

> `create_sprite` with `["arrow-left--v162","arrow-right--v162","refresh-cw--v162","share--v162"]`,
> then write the result to `public/toolbar.svg`.

**"Match our brand orange."**

> `get_icon` with `{ "id": "send--v162", "color": "#FF5C1A", "size": 24, "includeJsx": true }`.

**"Make the icons lighter than the rest of the UI."**

> `search_icons` with `{ "style": "soft" }`, or pass `stroke: 0.75` to `get_icon`.

**"Which icons exist for money?"**

> `list_glyphs` with `{ "category": "commerce" }`, or `search_icons` with
> `{ "query": "money" }`.

## Verifying the server

```bash
node scripts/mcp-smoke.mjs
```

This speaks raw JSON-RPC to the stdio server — `initialize` → `tools/list` → `tools/call` for
every tool, plus `resources/list` and `resources/read` — and exits non-zero on any failure.

## Design notes

* **stdout is protocol-only.** All diagnostics go to stderr, prefixed `[icono-mcp]`.
* **No network.** The engine is imported in-process, so the MCP server works offline and
  cannot be rate-limited.
* **Bounded output.** Search results are trimmed to `id`, `name`, tags, style, stroke and
  `svgUrl`; `limit` is clamped at 500 everywhere, so a tool call can never blow up a context
  window.
* **Safe writes.** `save_icons` only ever creates the directory you name and writes
  `<slug>--v<NNN>.svg` files inside it.

The ten named trios: `obsidian` `graphite` `ink` `signal` `cobalt` `magenta` `amber` `violet`
`cyan` `crimson`.

### `list_variants`

The 400 variants and the five axes they come from. Arguments: `style`, `limit` (default 60,
max 400).
