# Icono HTTP API

Base URL: `http://127.0.0.1:8787/api/v1` (override the port with `PORT=… npm start`).

Every response is **deterministic** — the same URL always returns the same bytes — so a
URL is a permanent reference to an icon. SVG responses carry
`cache-control: public, max-age=31536000, immutable` and a strong `ETag`.

Machine-readable spec: `GET /api/v1/openapi.json`. CORS is open on every route.

---

## Icon ids

An icon id has two halves:

```
<glyph-slug>--v<variant-index>
arrow-left   -- v162
```

* **glyph-slug** — one of 272 base glyphs (`arrow-left`, `send`, `search`, `shield`, …).
  See `GET /glyphs` or `packages/core/src/glyphs.js`.
* **variant-index** — `v000`–`v399`, one of the 400 style variants. A bare slug is allowed
  and resolves to the default variant `v162` (outline · 1.5px · round · 100% · round).

```
send                  → send--v162
arrow-left--v000      → 1px outline, 90% scale, round
arrow-left--v399      → 2px contrast, 120% scale, miter
```

The 400 variants are the cartesian product of five axes, in this order:

| axis   | values                                              | count |
|--------|-----------------------------------------------------|-------|
| weight | `1` `1.25` `1.5` `1.75` `2`                         | 5     |
| cap    | `round` `square`                                    | 2     |
| style  | `outline` `duotone` `dashed` `soft` `contrast`      | 5     |
| scale  | `0.9` `1` `1.1` `1.2`                               | 4     |
| join   | `round` `miter`                                     | 2     |

5 × 2 × 5 × 4 × 2 = **400**. Because the axes are ordered, a variant index is stable and
human-reconstructable: it never changes when glyphs are added.

---

## Render parameters

These query parameters are accepted by every endpoint that produces an SVG
(`/icons/{id}/svg`, `/icons/{id}/data-uri`, `/icons/{id}/jsx`, `/sprite.svg`) and by the
`POST /render` body.

| parameter    | type    | default | meaning |
|--------------|---------|---------|---------|
| `color`      | string  | `currentColor` | Ink colour — hex, `rgb()`, or a CSS colour name. |
| `accent`     | string  | = `color` | Secondary colour, used by the `duotone` and `contrast` styles. |
| `surface`    | string  | `#0B0C0F` | Background colour, painted only when `background=true`. |
| `background` | boolean | `false` | Paint a rounded background plate behind the glyph. |
| `radius`     | number  | `6` | Corner radius of that plate, in grid units. |
| `size`       | integer | `24` | Rendered `width`/`height` in px. The `viewBox` stays `0 0 24 24`. |
| `padding`    | number  | `0` | Inner padding in grid units, `0`–`6`. |
| `stroke`     | number  | `1` | Multiplier applied to the variant's stroke weight. |
| `palette`    | string  | — | Named ink/accent/surface trio — see `GET /palettes`. |
| `weight` `cap` `style` `scale` `join` | — | — | Select a variant by axis instead of by index. |
| `variant`    | string  | — | Explicit `vNNN`; overrides the axis parameters. |

Colours are validated against `^[#a-zA-Z0-9(),.%\s-]+$` and anything else is discarded in
favour of the default, so a query string can never inject markup into the SVG.


---

## Endpoints

### `GET /health`

```json
{ "status": "ok", "service": "icono-api", "version": "1.0.0", "uptime": 12 }
```

### `GET /stats`

The numbers behind the headline counter.

```json
{
  "glyphs": 272,
  "variantsPerGlyph": 400,
  "baseIcons": 108800,
  "palettes": 10,
  "totalIcons": 1088000,
  "tags": 729,
  "categories": 12,
  "grid": 24,
  "defaultVariant": { "index": 162, "id": "v162", "style": "outline", "weight": 1.5, "cap": "round", "scale": 1, "join": "round" },
  "variantAxes": {
    "weight": [1, 1.25, 1.5, 1.75, 2],
    "cap": ["round", "square"],
    "style": ["outline", "duotone", "dashed", "soft", "contrast"],
    "scale": [0.9, 1, 1.1, 1.2],
    "join": ["round", "miter"]
  }
}
```

### `GET /palettes`

The ten named colour trios. Each has `id`, `name`, `ink`, `accent`, `surface` and `note`.

`obsidian` `graphite` `ink` `signal` `cobalt` `magenta` `amber` `violet` `cyan` `crimson`

### `GET /variants`

All 400 variants with their axis values, plus the axis table.

### `GET /tags`

Every searchable tag (729 of them), alphabetically.

### `GET /categories`

The twelve curated categories with a `glyphs` count each:

`arrows` `essentials` `shapes` `security` `files` `media` `people` `dev` `commerce`
`devices` `weather` `layout`

### `GET /glyphs`

| query    | type    | default | notes |
|----------|---------|---------|-------|
| `q`      | string  | — | Free text over slug, name and tags. Multiple words must all match. |
| `tag`    | string  | — | Require one exact tag. |
| `category` | string | — | Curated category id. |
| `limit`  | integer | 60 | Max 500. |
| `offset` | integer | 0 | |

```bash
curl -s 'http://127.0.0.1:8787/api/v1/glyphs?q=arrow&limit=3'
```

### `GET /glyphs/{slug}`

One glyph: name, tags, `grid`, raw `paths`, and — unless you pass `?variants=false` — the id
of all 400 variants. The full form is large (about 68 KB), so the browser UI passes
`?variants=false` and relies on the icon id scheme instead.

### `GET /icons`

The search endpoint the browser UI is built on.

| query | type | default | notes |
|-------|------|---------|-------|
| `q` | string | — | Free text. |
| `glyph` | string | — | Restrict to one glyph slug. |
| `tag`, `category` | string | — | As above. |
| `style`, `weight`, `cap`, `scale`, `join`, `variant` | — | — | Variant filters. |
| `palette` | string | — | Attach palette ids to each result's `svgUrl`. |
| `order` | `variant` \| `glyph` | `variant` | Result ordering. |
| `limit` | integer | 60 | Max 500. |
| `offset` | integer | 0 | |

Ordering is **variant-major** by default, so one page shows many *different* glyphs in a
single consistent style instead of 400 re-weights of the same icon. Use `order=glyph` for
the inverse.

```json
{
  "total": 2160,
  "offset": 0,
  "limit": 4,
  "count": 4,
  "order": "variant",

### `GET /icons/{id}`

Metadata plus the inline SVG, honouring every [render parameter](#render-parameters).

```bash
curl -s 'http://127.0.0.1:8787/api/v1/icons/send--v162?palette=obsidian'
```

### `GET /icons/{id}/svg`

The SVG itself, as `image/svg+xml`.

```bash
curl -s 'http://127.0.0.1:8787/api/v1/icons/send--v162/svg?color=%23FF5C1A&size=48&background=true' -o send.svg
```

```html
<img src="/api/v1/icons/send--v162/svg?color=%23FF5C1A&size=48" alt="Send" width="48" height="48" />
```

### `GET /icons/{id}/data-uri`

The same SVG percent-encoded for CSS or an inline `src`.

```css
.icon-send {
  background-image: url('/api/v1/icons/send--v162/data-uri?color=%23FF5C1A');
  background-repeat: no-repeat;
  width: 24px; height: 24px;
}
```

### `GET /icons/{id}/jsx`

A ready-to-paste React component named after the glyph.

```jsx
export function ArrowLeftIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} {...props}>
      <path d="M19 12H5M12 19l-7-7 7-7" fill="none" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
```

### `GET /sprite.svg`

Bundle up to 500 icons into one sprite of `<symbol>` elements. Each symbol keeps
`stroke="currentColor"`, so a single sprite recolours per use site through CSS.

```bash
curl -s 'http://127.0.0.1:8787/api/v1/sprite.svg?ids=arrow-left--v162,send--v162,search--v162' -o toolbar.svg
```

```html
<svg width="0" height="0" style="position:absolute"><use href="#send--v162" /></svg>
```

### `POST /render`

Batch render up to 500 icons. Top-level paint options apply to every icon; per-icon entries
override them.

```bash
curl -s -X POST http://127.0.0.1:8787/api/v1/render \
  -H 'content-type: application/json' \
  -d '{
    "palette": "signal",
    "size": 32,
    "icons": [
      { "glyph": "shield", "variant": "v162" },
      { "id": "send--v000" },
      { "id": "arrow-left--v399", "color": "#FF5C1A" }
    ]
  }'
```

Response:

```json
{ "count": 3, "errors": [], "items": [ { "id": "shield--v162", "variant": { }, "svg": "<svg ...>" } ] }
```

Unresolvable entries are reported in `errors` instead of failing the whole batch.

### `GET /openapi.json`

The full OpenAPI 3.1 document, suitable for code generators, Postman, or an agent.

---

## Recipes

**Ten looks of one icon.** Loop the palettes in your client:

```bash
for p in obsidian graphite signal cobalt magenta amber violet cyan crimson ink; do
  curl -s "http://127.0.0.1:8787/api/v1/icons/wallet--v162/svg?palette=$p&size=48" -o "wallet-$p.svg"
done
```

Or let the MCP `batch_render` tool do the cross-product for you with a `palettes` array.

**A consistent icon set for a whole app.** Pin one style across every glyph:

```bash
curl -s 'http://127.0.0.1:8787/api/v1/icons?style=outline&weight=1.5&cap=round&scale=1&join=round&limit=500' \
  | jq -r '.items[].id'
```

**Build a build-time asset folder.** Use the CLI:

```bash
node scripts/export-icons.mjs --out ./public/icons --style outline --limit 200
```

**Never ship a broken icon.** Because ids are arithmetic, you can assert one in a test:

```js
const res = await fetch('http://127.0.0.1:8787/api/v1/icons/arrow-left--v162/svg');
if (!res.ok) throw new Error('icon missing');
```

---

## Errors

| status | body | when |
|--------|------|------|
| 400 | `{ "error": "bad_request", "message": … }` | Missing required query, bad batch size, unresolvable sprite ids. |
| 404 | `{ "error": "not_found", "message": … }` | Unknown glyph or icon id, unknown route. |
| 500 | `{ "error": "internal_error", "message": … }` | Unexpected failure. |

Unknown *variant* ids never 404 — an out-of-range variant falls back to the default so a typo
still renders something usable.

  "items": [
    {
      "id": "arrow-left--v000",
      "slug": "arrow-left",
      "name": "Arrow Left",
      "tags": ["arrow", "back", "previous", "navigation", "undo"],
      "variant": { "index": 0, "id": "v000", "weight": 1, "cap": "round", "style": "outline", "scale": 0.9, "join": "round", "label": "outline · 1px · round · 90%" },
      "palette": null,
      "svgUrl": "/api/v1/icons/arrow-left--v000/svg",
      "jsonUrl": "/api/v1/icons/arrow-left--v000"
    }
  ]
}
```

### `GET /icons/random`

`?count=24` (max 100). Returns random icons with inline SVG.
