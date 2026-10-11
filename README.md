# Pascal Skannavis · Portfolio

Personal portfolio site for Pascal Skannavis, a Computer Science graduate (BSc, Newcastle University, 2026) working across applied machine learning, data and software engineering.

Each section of the page is its own design world (paper, lab notebook, ledger, postcard, road, Bauhaus, glass, cobalt, iron, ember). The hero has a pointer-reactive WebGL background with six selectable treatments.

## Stack

- [Vite](https://vitejs.dev/) (vanilla JS, no UI framework)
- [GSAP](https://gsap.com/) + ScrollTrigger for animation
- [Lenis](https://lenis.darkroom.engineering/) as the single smooth-scroll engine
- [Three.js](https://threejs.org/) for the hero background (static poster fallback if WebGL is unavailable)
- Self-hosted fonts via Fontsource: Bricolage Grotesque, Instrument Serif, JetBrains Mono
- Solar icon set via Iconify (inlined as SVG)

## Run on Replit

1. Import this repo into Replit (Create Repl → Import from GitHub).
2. Press **Run**. The `.replit` file runs `npm run dev` (Vite on port 5173, mapped to port 80), and Replit installs dependencies automatically.
3. To publish, use **Deploy → Static**. The build command is `npm run build` and the public directory is `dist` (both preset in `.replit`).

The dev server listens on `0.0.0.0` and accepts any host so Replit's proxied preview URL works.

## Run it

```bash
npm install
npm run dev        # local dev server
npm run build      # production build into dist/
npm run preview    # serve the production build
```

The build uses relative paths and emits a classic (non-module) script, so `dist/index.html` also opens by double-click. Note that the embedded YouTube video needs a real web address to play; opened from disk, its thumbnail opens the video on YouTube instead.

## Structure

```
index.html            page markup (one <section class="scene t-…"> per design world)
src/main.js           scroll engine, reveals, hero wiring, video facade
src/hero-scene.js     WebGL hero backgrounds (contours, network, ripple, waves, aurora, halftone)
src/style.css         base, header and hero styles
src/scenes.css        per-section designs
src/icons.js          inlined icons
public/media/         photos and video thumbnail
public/shots/         project screenshots (see public/shots/README.txt)
```

## Scroll transitions

Every section change has its own scrubbed transition (`src/transitions.js`, `src/transitions.css`). Each one is a tall block with a sticky stage; scrolling through it drives a GSAP timeline, starting on the previous section's background and ending on the next one's. The twelve scenes are joined by eleven different transitions: torn paper, index bars, a scatter-to-forecast fit, a ledger page turn, a globe and flight route, a road drive, Bauhaus assembly, frosted glass, an ascending staircase, a barbell being loaded, and a rising heat front.

## Deploying

Workflow: edit locally, push to `main` on GitHub, then pull in Replit (Git tab → Pull) and redeploy. The site is published from Replit; there is no GitHub Pages workflow.

## Accessibility and performance

- Semantic landmarks, skip link, visible focus states, accessible split-word headings
- Automated axe-core checks pass on desktop and mobile widths; no horizontal overflow
- Hero animation pauses off-screen and when the tab is hidden; pixel ratio is capped
- YouTube video loads only on click, using the privacy-enhanced domain

## Content and licence

Photos, text and video are personal content, © Pascal Skannavis, all rights reserved. Code is shared for reference; please don't republish the site as your own. Third-party libraries and fonts keep their own licences (the fonts are SIL OFL).
