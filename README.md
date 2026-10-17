# Icono (static)

1,088,000 recolorable SVG icons, generated in the browser from 272 glyphs x 400 variants x 10 palettes.
No server, no build step, no API key. Based on https://github.com/ylet-co/Icono (Apache-2.0).

## Run it
Double-click `index.html`, or serve the folder:

    python3 -m http.server 5180

## Files
- `index.html` the site. `brand.html` colours, fonts, logo. `css/tokens.css` all brand tokens and font-face.
- `js/core/` the original Icono engine, unchanged. `js/app.js` the UI source. `js/app.bundle.js` the same, bundled so it also works from file://.
- `fonts/` self-hosted Bricolage Grotesque, DM Sans, DM Mono. `brand/` logo SVGs and brand.md.
- `og-image.png`, `favicon.*`, `icon-*.png`, `apple-touch-icon.png`, `site.webmanifest`.

## Rebuild the bundle after editing js/app.js
    npx esbuild js/app.js --bundle --minify --format=iife --outfile=js/app.bundle.js

## Before you deploy (link previews)
Preview bots need absolute URLs. Replace the placeholder once with your real domain:

    # Mac / Linux / Git Bash
    sed -i 's#https://YOUR-DOMAIN#https://your-domain.com#g' *.html
    # Windows PowerShell
    Get-ChildItem *.html | ForEach-Object { (Get-Content $_) -replace 'https://YOUR-DOMAIN','https://your-domain.com' | Set-Content $_ }

`vercel.json` turns on clean URLs (`/brand` instead of `/brand.html`). Works on any static host.

## API and MCP
The static site does not include the HTTP API or MCP server. Run those from the original repo.
