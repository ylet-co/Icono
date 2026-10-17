# How the uploaded skill was used

The repository ships a design skill at `web-ui-design(skill)/` — `SKILL.md` plus
`references/style-library.md` and `references/technical-details.md`. It was not decorative
documentation: the interface in `apps/web/` was built by executing its workflow in order. This
file is the audit trail, so the next person can see which rule produced which decision.

The skill's own opening warning is the one that mattered most: *most AI-generated websites look
the same.* So the workflow below is reported as it actually ran, including the parts where the
first answer was rejected.

---

## Step 1 — Classify the site

The skill asks what kind of thing this really is, before any code.

**Answer: developer tool / API product.** Icono is an icon API with an MCP server. Its visitor
is an engineer or designer who wants to find a mark and get it into a codebase.

The classification decides one thing immediately: per hard rule 11, dark mode is only earned by
dev tools, AI/tech products, gaming, and premium SaaS. A developer tool is on that list, so dark
is legitimate here rather than reflexive. Every other category default was still checked — the
skill warns that cream/burgundy/editorial and near-black/single-accent are becoming the new
templates, so "dev tool" alone was not treated as sufficient permission to be generic.

## Step 2 — One primary style, at most one accent

`references/style-library.md` was read before choosing. The pick:

* **Primary: dark-mode-premium / cinematic.** Earned by the category. Its motion language —
  smooth confident easing with sparing glow — is the base motion of the page.
* **Accent: kinetic.** The brief asked for a page that does not obey normal webpage layout and
  animates. The style library lists maximalism/kinetic as a legitimate language for brands with
  licence to be bold; here it is scoped to two elements only (the hero icon field and the
  ticker), and it borrows the kinetic motion language only for those two, exactly as the
  "Choosing an accent technique" section requires.

Rejected: glassmorphism (nothing meaningful to blur against in a dev tool), claymorphism (a toy
language on a tool), brutalism (would fight the precision the icon previews need).

## Step 3 — The system before the layout

`references/technical-details.md` was read during this step rather than relied on from memory.

* **Radius** — one curve family, `6 / 12 / 20 / full`, declared once as `--r-1..3` and
  `--r-full` and used everywhere. Hard rule 5 (never mix radius systems) is satisfied by
  construction: there is no literal `border-radius` value in the stylesheet outside the token
  block and the `--r-full` dots.
* **Spacing** — a 4px base (`--s-1` … `--s-24`). No arbitrary padding survives in the final
  stylesheet.
* **Type** — one display/text family plus a mono for machine strings, with an explicit scale
  rather than framework defaults. The counter uses `clamp(3.4rem, 12vw, 11rem)`, which is the
  skill's "larger, more confident headline sizes and tighter tracking" instruction.
* **Colour** — a real palette, not untouched Tailwind: signal orange on a five-step near-black
  ramp, with one green reserved for live/GET status. See `DESIGN.md` Step 3.5 for where the
  orange came from.
* **Elevation** — one method (hairline borders plus a single ambient glow). No shadow-heavy card
  next to a flat section.
* **Icons** — the product's own library. The rail, the buttons, the toast and the empty states
  all render from the same glyphs the API sells. This is the strongest possible way to satisfy
  hard rule 2 (never use emoji as icons) and the "custom SVG icons matching the palette and
  stroke weight" instruction.
* **Loading states** — skeleton tiles shaped exactly like the grid cells, plus a skeleton in the
  drawer. Hard rule 6 says a bare spinner or a flash of unstyled content is a tell of unfinished
  work, so the grid renders skeletons *before* its first fetch resolves.
* **Motion** — taken from the dark-premium entry in the style library, not chosen separately.

## Step 3.5 — Two decisions that could not be made for a different brand

This is the step that actually prevents "generic," and the skill calls it mandatory rather than
polish. Two decisions were required; two were made:

1. **Signal orange, derived from the subject.** The category default is navy/electric-blue
   (fintech) or near-black/indigo or near-black/violet (dev tool). Icono is about marks on a
   surface — ink, stamps, stencils — so the accent is the colour of a highlighter and of signal
   paint. It is used for exactly one meaning: the thing you are currently acting on.
2. **A continuous icon field instead of a section stack.** Hard rule 4 forbids the generic
   AI-site template, and hard rule 8 forbids reusing the same section skeleton. So there is no
   stat row with dividers and no three equal icon-title-paragraph cards. The stash itself is the
   middle of the page; the API and MCP sections are live panes (real request beside real result,
   real config beside real tool list).

## Step 4.5 — The nav was chosen, not defaulted

Hard rule 9 forbids defaulting to logo-left / centered-links / CTA-right. The nav pattern picked
from the style library's list is **vertical rail/sidebar**, which the library says is earned by
"dashboards, admin tools, and content-heavy apps with many top-level sections" — exactly this
page (stash, field, editor, API, MCP, docs). It collapses to a bottom bar on mobile instead of a
hamburger, so the section model survives the breakpoint.


## Hard rules — checked one by one

| # | rule | how it is satisfied |
|---|------|---------------------|
| 1 | never a sentence inside a pill/chip/badge | the only pills hold `arrows`, `2,160 matches`, `GET`, `POST` — never copy |
| 2 | never emoji as icons | every mark is a glyph from the engine; no emoji character appears in the UI |
| 3 | never leave default framework colours/spacing | hand-authored token block; there is no framework |
| 4 | never the generic AI-site template | no centered hero + blob + three equal cards; see Step 3.5 |
| 5 | never mix corner-radius systems | one token family, referenced by name everywhere |
| 6 | never skip loading/empty/error states | skeleton tiles, skeleton drawer, "nothing matched — try a shorter word", and an explicit API-unreachable message |
| 7 | never let "tasteful" substitute for "specific" | Step 3.5 was executed for real |
| 8 | never reuse the section skeleton unexamined | conveyor structure, not a stack |
| 9 | never default to the same navbar | vertical rail, chosen for this product |
| 10 | never one motion language regardless of style | dark-premium easing is the base; kinetic is scoped to two elements |
| 11 | default to light unless dark is earned | dark is earned by the category and documented; light still ships as a toggle |

## The WebGL clause

The skill's final section says that if 3D/WebGL/shader visuals are requested, they must be real
`<canvas>` WebGL rather than a CSS fake. **No 3D or shader visual was requested here**, so no
WebGL was added — and the hero motion is honest about what it is: real SVG icons on CSS
transforms, not a screenshot pretending to be interactive.

## Where the skill lives

```
web-ui-design(skill)/
├── SKILL.md
└── references/
    ├── style-library.md
    └── technical-details.md
```

It is committed unchanged alongside the code it produced, so the next interface built in this
repository can run the same workflow instead of re-deriving it. The MCP server also serves
`DESIGN.md` and this file as resources (`icono://docs/DESIGN.md`, `icono://docs/SKILL-USAGE.md`),
so an agent generating UI in this repo can read the rules before it writes markup.
