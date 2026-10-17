# The Icono icon engine

How 272 hand-authored glyphs become **108,800 generated icons**, and how those become
**1,088,000 renderable icons** once colour is in play — without storing a single generated file.

---

## The multiplication

```
272 glyphs  ×  400 variants        = 108,800 generated icons      (the "stash")
108,800     ×  10 palettes         = 1,088,000 renderable icons  (the counter)
```

Nothing in that table is a file on disk. An icon id is arithmetic:

```
arrow-left--v162
└────┬────┘ └─┬─┘
   glyph     variant index
  (index 0)   (index 162)
```

`parseIconId()` splits the string, looks the slug up in a `Map`, converts the variant id back
to an integer, and hands both to the renderer. That is the entire lookup. Consequences:

* The stash is **O(1)** to address — no index file, no database, no build step.
* Adding a glyph adds 400 icons instantly and changes nothing that already exists.
* A URL is a permanent reference: the same URL returns byte-identical SVG forever.

---

## Glyphs

A glyph is authored on a **24 × 24 grid** and described as raw SVG path data plus metadata.

```js
{ slug: 'arrow-left',
  name: 'Arrow Left',
  tags: ['arrow', 'back', 'previous', 'navigation', 'undo'],
  d: ['M19 12H5M12 19l-7-7 7-7'] }
```

* `slug` is the machine identifier used in icon ids. It never changes once published.
* `tags` are the search surface. 729 distinct tags across the 272 glyphs.
* `d` is an array, so a glyph can be several subpaths (a circle plus a check, say).
* **No stroke information lives here.** Weight, cap, join, style and scale are applied at
  render time, which is exactly why one glyph can become 400 icons.

Glyphs are grouped into twelve curated categories (`arrows`, `essentials`, `shapes`,
`security`, `files`, `media`, `people`, `dev`, `commerce`, `devices`, `weather`, `layout`)
that the browser UI exposes as a filter.

### Adding a glyph

1. Draw it on a 24×24 grid using only `d` path data. Keep strokes out of the path.
2. Append an entry to `GLYPHS` in `packages/core/src/glyphs.js`.
3. Give it 3–6 lowercase tags that a designer would actually search for.
4. That is it — 400 icons, all ten palettes and every API surface pick it up immediately.

Because variant indices are derived from axis positions and not from the glyph list, inserting
a glyph in the middle of the array does not invalidate any existing id.

---

## Variants

A variant is the styling half of an icon id. The 400 variants are the cartesian product of
five axes, iterated in this order:

```js
for (const weight of [1, 1.25, 1.5, 1.75, 2])                          // 5
 for (const cap of ['round', 'square'])                                 // 2
  for (const style of ['outline','duotone','dashed','soft','contrast']) // 5
   for (const scale of [0.9, 1, 1.1, 1.2])                              // 4
    for (const join of ['round', 'miter'])                              // 2
      variants.push({ index, weight, cap, style, scale, join })
```

5 × 2 × 5 × 4 × 2 = **400**, and the ordering means the index is reconstructable:

```js
index = ((((weightIdx * 2 + capIdx) * 5 + styleIdx) * 4 + scaleIdx) * 2 + joinIdx)
```

The default variant — the one a bare slug resolves to — is
`outline · 1.5px · round · 100% · round` = **`v162`**.

### What each style does

| style | rendering |
|-------|-----------|
| `outline` | one path, `stroke-width = weight` |
| `soft` | same, at 65% opacity |
| `dashed` | `stroke-dasharray` derived from the weight, so dashes stay proportional |
| `duotone` | an accent-coloured underlay at 2.6× weight and 42% opacity behind the ink stroke |
| `contrast` | an ink-coloured halo at 2.9× weight and 22% opacity behind the ink stroke |

`scale` is applied as `translate(12 12) scale(s) translate(-12 -12)` inside the 24×24 viewBox,
so it optically re-sizes the mark without changing the box — useful when a set mixes glyphs of
very different visual weight.

`padding` (a render parameter, not a variant axis) insets the whole glyph, which is how the
API produces icons that sit correctly inside a filled plate.

---

## Palettes

A palette is the recolour layer: `{ id, name, ink, accent, surface, note }`. Ten ship by
default — `obsidian`, `graphite`, `ink`, `signal`, `cobalt`, `magenta`, `amber`, `violet`,
`cyan`, `crimson` — which is where the 1,088,000 figure comes from.

A palette never changes geometry, so a set built from one palette stays optically consistent.
The browser's Recolor lab additionally generates ten HSL hues on the fly, which is how it can
hand you "the same icon in twenty looks" — ten palettes plus ten generated hues.

---

## Rendering

`renderSvg(glyph, variant, options)` is pure: same inputs, same bytes. It emits:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" role="img">
  <title>Send icon</title>
  <rect x="0" y="0" width="24" height="24" rx="6" fill="#0B0C0F" />
  <g transform="translate(12 12) scale(1.1) translate(-12 -12)">
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" fill="none"
          stroke-linecap="round" stroke-linejoin="round"
          stroke="#FF5C1A" stroke-width="1.5" />
  </g>
</svg>
```

Colour inputs are validated against `^[#a-zA-Z0-9(),.%\s-]+$`. Anything else is replaced with
the default, so no query parameter can inject markup into the document. `color` defaults to
`currentColor`, which is why a sprite symbol inherits its colour from CSS at the use site.

Three derived outputs sit on top of `renderSvg`:

* `toDataUri(svg)` — percent-encoded `data:image/svg+xml;…` for CSS or an inline `src`.
* `toJsx(svg)` — a React component, with `stroke-linecap` rewritten to `strokeLinecap` and so on.
* `renderSprite(items)` — one SVG of `<symbol>` elements, ids preserved, `currentColor` kept.

---

## Performance

* No generated file is ever read from disk, so cold start is an `import` of two arrays.
* `searchIcons()` iterates glyphs × filtered variants and skips with an offset counter; it
  never materialises the full product. A search that matches 108,800 icons still only builds
  the page you asked for.
* SVGs are immutable and cached for a year with a strong ETag, so the browser does the
  repeat-work for you.
* The sprite endpoint collapses 60 grid requests into one in the browser UI.

---

## Extending the axes

Adding a sixth style means: append it to `STYLES`, and `VARIANTS` grows to 480 per glyph. Every
existing `v000`–`v399` keeps its exact meaning because the new values are appended, not
interleaved — the axis order is the contract. Then the numbers in the UI update themselves,
since the page reads `GET /api/v1/stats` at boot.

## File map

| file | role |
|------|------|
| `packages/core/src/glyphs.js` | the 272 glyph definitions |
| `packages/core/src/variants.js` | the five axes and the 400-variant table |
| `packages/core/src/palettes.js` | the ten palettes |
| `packages/core/src/catalog.js` | id parsing, filtering, search, stats |
| `packages/core/src/render.js` | SVG, sprite, data-URI and JSX output |
| `packages/core/src/index.js` | `renderIcon()`, the one call the API and MCP both use |

