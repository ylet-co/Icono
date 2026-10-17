# Icono design system

This is the record of the design decision behind the Icono interface. It follows the
`web-ui-design` skill in this repository (`web-ui-design(skill)/SKILL.md`); see
`SKILL-USAGE.md` for the step-by-step trace.

---

## Step 1 — Classify the site

**Category: developer tool / API product.** The audience is engineers and designers wiring an
icon set into a codebase. They arrive knowing what they want, judge a product on whether it
answers a question in ten seconds, and are allergic to being sold to.

That classification earns exactly one thing per the skill: **dark mode is permitted here.**
The skill's rule 11 says dark mode must be earned by dev tools, AI/tech products, gaming or
premium SaaS — a developer tool qualifies. It is not chosen because it "looks technical."

## Step 2 — One primary style, one accent technique

**Primary: dark-mode-premium / cinematic.**
**Accent: kinetic.** The brief explicitly asked for a page that refuses the standard marketing
layout and moves — a kinetic accent is earned, not decoration.

Nothing else is layered on. There is no glassmorphism on the cards, no clay on the buttons, no
brutalist 0-radius section next to rounded ones.

## Step 3 — The system, built before any layout

| decision | value |
|----------|-------|
| **Radius family** | `6 / 12 / 20 / full` — one curve system, used everywhere. No pills mixed with sharp corners. |
| **Spacing** | 4px base unit (`--s-1` … `--s-24`). No arbitrary padding values anywhere in the stylesheet. |
| **Type** | One family, Space Grotesk, in four weights; JetBrains Mono for every machine string (ids, endpoints, counts, labels). Display sizes are a real scale (`clamp(3.4rem, 12vw, 11rem)` for the counter) rather than framework defaults. |
| **Colour** | A signal orange `#FF5C1A` against a near-black ramp `#08090B → #1B1F26`, plus one green `#2FBF71` for live/GET status. Derived in Step 3.5. |
| **Elevation** | Depth is **borders + one ambient glow**, never stacked drop shadows. Cards are `1px` hairlines on a slightly lighter surface. |
| **Iconography** | The product's own icons, dogfooded: the rail, buttons, empty states and toasts all render from the same glyph library the API sells. Zero emoji, zero mismatched icon packs. |
| **Loading states** | Skeleton tiles (`shimmer` keyframes) matching the exact geometry of the grid cells, plus a skeleton in the inspector drawer while the icon record loads. Never a bare spinner. |
| **Motion** | `cubic-bezier(.22,1,.36,1)` — long, confident, no overshoot. Durations `180 / 320 / 620 / 1200ms`. Continuous motion is limited to the hero field and the ticker. |

## Step 3.5 — Two decisions that come from *this* brand, not the category

The skill's warning is that a correct style pick can still be generic. The dev-tool default is
near-black plus a single electric-blue or indigo accent; the other current default is
near-black plus violet. Both were avoided deliberately.

1. **The accent is signal orange, drawn from the product's own subject matter.** Icono is about
   *marks on a surface* — ink, stamps, stencils. Orange is the colour of a highlighter and of
   signal paint, i.e. of a mark that is meant to be noticed. It is the one hue used for "this is
   the thing you are acting on": the counter gradient, the active rail item, the focused input
   ring, the GET/POST verbs, the hovered grid cell. It appears nowhere else.

2. **The structural motif is a continuous icon field, not a section stack.** The brief asked for
   a layout that does not obey normal rules, so the page was built as one conveyor rather than
   hero → stat row → three feature cards → CTA. Three diagonal marquee rows of real icons drift
   behind the counter; a ticker of stash facts runs along the hero's bottom edge; the browse
   grid *is* the middle of the page rather than a feature demo; and the API and MCP sections are
   presented as live panes (a real `curl` next to a real rendered result, a real config block
   next to the real tool list) instead of as icon-title-paragraph cards.

The nav decision (Step 4.5) is also brand-driven: a **persistent vertical rail**, not a
logo-left/links-right bar. Icono is content-heavy and section-based — stash, field, editor, API,
MCP, docs — so a rail is the earned pattern, and on mobile it collapses into a bottom bar
rather than a hamburger.

## What the counter is

The headline is a single number that animates from `0` to the real total read from
`GET /api/v1/stats` — **1,088,000**. It is not a marketing figure: it is
`272 glyphs × 400 variants × 10 palettes`, and the sub-line under it breaks that arithmetic out.
The count is animated with an ease-out cubic so it decelerates into the true value instead of
stopping abruptly, and it respects `prefers-reduced-motion` by snapping to the final number.


## Motion inventory

| element | motion | why |
|---------|--------|-----|
| counter | 2.4s ease-out count | the one "reveal" moment on the page |
| hero field | 64s / 82s / 96s linear drift, three directions | continuous kinetic texture at a speed that never competes with reading |
| hero glow | 7 tiles light up every 2.6s | "sparing glow" — enough to signal liveness, not enough to flicker |
| grid cells | 10px rise, 12ms stagger, capped at 400ms | the stagger caps so a 500-icon page never feels like it is loading slowly |
| inspector drawer | 620ms translate | the slowest UI transition, so opening it feels deliberate |
| theme switch | colour tokens swap, no cross-fade | a fade here would read as a glitch |

Every continuous animation is disabled under `prefers-reduced-motion: reduce`.

## Light theme

The skill says default to light unless dark is earned. Dark *is* earned here, so it is the
default — but a light theme ships alongside it because designers pulling icons into a
light-mode product need to judge them against the surface they will actually sit on. The toggle
swaps the token block only; geometry, type and motion are identical, so nothing re-flows. The
choice persists in `localStorage` and otherwise follows `prefers-color-scheme`.

## Things this design deliberately does not do

* No emoji anywhere in the UI, including empty states and toasts (skill rule 2).
* No sentence inside a pill. The pills on this page hold two or three words: `arrows`,
  `2,160 matches`, `GET`.
* No default framework palette, no `shadow-md` on everything, no unstyled focus ring — focus is
  an explicit 2px signal-orange ring with a 2px offset.
* No centered hero + tagline + two CTAs + gradient blob + three equal cards.
* No loading flash: the grid renders skeleton tiles before its first fetch resolves.

## Accessibility notes

* The counter has an `aria-label` carrying the spoken value ("One million eighty eight thousand
  icons") while the visual digits animate, so a screen reader never reads a number mid-tween.
* The rail is a `<nav>` with `aria-label`; the active item is tracked by an
  `IntersectionObserver` so keyboard users get the same positional feedback as pointer users.
* The drawer is `aria-hidden` when closed and closes on `Escape` and on scrim click.
* `/` focuses the search field from anywhere on the page.
* The grid is a list of real `<button>` elements, so it is tab-reachable and Enter-activatable.
* Reduced motion removes the marquee, the ticker, the count animation, the cell stagger and the
  pulse, leaving a fully static but complete page.
