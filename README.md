# Icono

**1,088,000 recolorable SVG icons — with a documented HTTP API and an MCP server.**

Icono is an icon stash built for the marks every designer and developer actually reaches for:
back button, send, search, close, settings, trash, download, shield, wallet, code. It ships
**272 hand-authored glyphs × 400 style variants = 108,800 generated icons**, and every one of
them recolours through **10 palettes** — which is where the 1,088,000 figure comes from.

Nothing generated is stored. An icon id is arithmetic, so the same URL always returns the same
bytes, and the stash costs a few hundred kilobytes of source instead of a hundred gigabytes of
files.

```
272 glyphs  ×  400 variants  = 108,800 generated icons
108,800     ×  10 palettes   = 1,088,000 renderable icons
```

---

## Quick start

```bash
npm install
npm start          # API + the animated browser UI on http://127.0.0.1:8787
```

Open `http://127.0.0.1:8787`. You get:

* an **animated counter** that counts up to the real stash total, over a drifting field of icons;
* a **searchable field** of the whole stash with live style, weight, scale and palette filters;
* an **inspector** on every icon — metadata, one-click SVG / JSX / data-URI / URL copy, and the
  same icon in ten palettes;
* a **recolor lab** that turns one glyph into twenty looks (ten palettes plus ten generated
  hues) and downloads the whole set as a single sheet;
* live **API** and **MCP** panes with copyable config, plus the docs.

Other commands:

```bash
npm run mcp        # start the MCP server on stdio
npm run stats      # print the stash arithmetic
npm test           # API smoke test + MCP smoke test
npm run smoke      # API only
npm run smoke:mcp  # MCP only
node scripts/ui-test.mjs            # boots the real UI in a DOM and asserts on the result
node scripts/export-icons.mjs --out ./public/icons --style outline --limit 200
```

---

## Get an icon

```bash
# SVG, recoloured, 48px, on a plate
curl -s 'http://127.0.0.1:8787/api/v1/icons/send--v162/svg?color=%23FF5C1A&size=48&background=true' -o send.svg

# search
curl -s 'http://127.0.0.1:8787/api/v1/icons?q=back%20arrow&style=outline&limit=5'
```

```html
<img src="/api/v1/icons/send--v162/svg?color=%23FF5C1A&size=48" alt="Send" width="48" height="48" />
```

```css
.icon-send { background-image: url('/api/v1/icons/send--v162/data-uri?color=%23FF5C1A'); }
```

```jsx
// curl -s '/api/v1/icons/arrow-left--v162/jsx'
export function ArrowLeftIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} {...props}>
      <path d="M19 12H5M12 19l-7-7 7-7" fill="none" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
```

## Use it from an agent

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

Ten tools: `search_icons`, `get_icon`, `render_icon`, `batch_render`, `create_sprite`,
`save_icons`, `list_glyphs`, `list_palettes`, `list_variants`, `get_stats` — plus the docs as MCP

---

## How it works

An icon id is `<glyph-slug>--v<variant-index>`:

```
arrow-left--v162
└────┬────┘ └─┬─┘
  glyph     variant (0-399)
```

The 400 variants are the cartesian product of five axes — `weight(5) × cap(2) × style(5) ×
scale(4) × join(2)`. Because the axes are iterated in a fixed order, a variant index is stable
and reconstructable, so adding glyphs never invalidates an existing id.

The styles are `outline`, `duotone`, `dashed`, `soft` and `contrast`. Render parameters
(`color`, `accent`, `surface`, `background`, `size`, `padding`, `stroke`, `palette`) sit on top
of the variant and are query-controllable on every endpoint.

Details, including how to add a glyph: [`docs/ICON-ENGINE.md`](docs/ICON-ENGINE.md).

---

## Repository layout

```
packages/core/           the icon engine (zero dependencies)
  src/glyphs.js            272 glyph definitions on a 24x24 grid
  src/variants.js          the five axes and the 400-variant table
  src/palettes.js          the ten ink/accent/surface palettes
  src/catalog.js           id parsing, filtering, search, stats
  src/render.js            SVG, sprite, data-URI and JSX output
  src/index.js             renderIcon() — the one call both transports use

apps/api/                zero-dependency node:http server
  src/server.js            JSON API, SVG streaming, static UI, docs
  src/openapi.js           the OpenAPI 3.1 document

apps/mcp/                MCP server over stdio (official SDK)
  src/server.js            10 tools + docs resources

apps/web/                the animated browser UI (no build step)
  index.html  styles.css  app.js

scripts/                 stats, export CLI, and the three test suites
docs/                    API.md  MCP.md  ICON-ENGINE.md  DESIGN.md  SKILL-USAGE.md
web-ui-design(skill)/    the design skill that produced the interface
```

## Tests

```bash
npm test                    # API + MCP smoke tests
node scripts/ui-test.mjs    # boots index.html + app.js in a DOM against a live API
```

* `scripts/smoke.mjs` — assertions over every route, including the failure paths (404s,
  injection attempts, over-limit batches, pagination, determinism, cache headers).
* `scripts/mcp-smoke.mjs` — raw JSON-RPC `initialize` → `tools/list` → `tools/call` for every
  tool, plus `resources/list` and `resources/read`.
* `scripts/ui-test.mjs` — loads the real page in jsdom, lets `boot()` finish, and asserts the
  counter reached 1,088,000, the grid rendered sprite-backed cells, the lab built its 20-icon
  set, the inspector opens on click, and search and reset re-query the API.

## Design

The interface follows the design skill committed at `web-ui-design(skill)/`. The decision record
is in [`docs/DESIGN.md`](docs/DESIGN.md) and the step-by-step audit is in
[`docs/SKILL-USAGE.md`](docs/SKILL-USAGE.md). In short: dark-mode-premium (earned by the
dev-tool category) with a kinetic accent, a signal-orange palette derived from the product's own
subject matter, and a continuous icon-field structure instead of the usual hero → stat row →
three cards → CTA skeleton.

## License

Apache-2.0.

resources. Full reference in [`docs/MCP.md`](docs/MCP.md).
