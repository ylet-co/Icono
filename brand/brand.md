# Icono brand: muted brown, calm

## Colours (light is default, dark follows the OS or the toggle)
| Token | Light | Dark | Use |
|---|---|---|---|
| --bg | #F2ECE3 Sand | #1E1814 Cocoa | page |
| --bg2 | #E9E0D3 Surface | #2A221C Bark | panels, tiles, inputs |
| --bg3 | #DFD3C2 Raised | #342B23 | hover, pressed |
| --tx | #2B221C Espresso | #EDE3D6 Oat | text, icon ink |
| --mut | #6F6054 Mocha | #A8998A | secondary text |
| --ac | #8B5E3C Clay | #C79A72 Latte | the one accent |
| --acx | #F7F1E8 Cream | #1E1814 | text on the accent |

Contrast: text 13.3:1, Mocha 5.1:1, Clay 4.8:1 on Sand. Cream on Clay 5.0:1.

## Fonts (self-hosted in /fonts, SIL OFL)
- Display: Bricolage Grotesque 600 / 700 / 800, tracking -0.035em, tight leading
- Text: DM Sans 400 / 500 / 600
- Code and ids: DM Mono 400 / 500

## Logo
Rounded tile in Clay with the Icono Vector Lens: two interlocking golden-ratio curved brackets framing a central focal spark, embodying arithmetic vector precision and icon generation.
Files: brand/logo-mark.svg, brand/logo-full.svg, brand/logo-maskable.svg, favicon.svg/.ico, icon-192/512.png, icon-maskable-512.png, apple-touch-icon.png, og-image.png (1200x630).

## Shape and motion
Radius 14px (10 small, 44 hero plate). Spacing in multiples of 8. 1px borders at 16% ink, no shadows.
Easing cubic-bezier(.16,1,.3,1), 200-400ms. Motion switches off under prefers-reduced-motion.
