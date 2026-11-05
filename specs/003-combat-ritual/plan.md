# Plan 003 — Combat ritual redesign

## Decisions and why

- **Rewrite the three files in place.** Most sections, classes and rules change.
  `main` preserves the current site, so nothing is lost.
- **Mobile first in CSS.** Base styles target the phone and `min-width` queries
  extend them. This keeps the phone from being an afterthought.
- **The ink stroke tells the group's history.** It no longer needs a specific
  poomsae, which removes a blocked decision and fits the new focus.
- **Vertical ink on phones.** The prototype's sticky canvas used half the screen.
  A line beside the text costs little height and reads as a timeline.
- **Canvas for the ink.** Thousands of bristle segments suit canvas better than
  SVG. A seeded generator keeps the stroke identical on every redraw.
- **Remove the hero particles, tilt, dock, marquee and scroll reveals.** They
  compete with the single memorable moment. They stay available in `main`.
- **Remove the six-link navigation.** A short linear story needs the seal and one
  action. The decision can be revisited if real content grows.
- **Location data lives in markup.** `data-*` attributes feed the map, ending the
  duplication that caused the mixed location names.
- **Keep MapLibre and its dark top-down view.** Reuse `selectLocation`,
  `fitLocations`, `applyBrandPalette` and lazy loading from the current
  `MapLibreIntegration`, pinned to an exact version. Add pin labels and a control
  that returns to both locations. Satellite imagery is not included: it needs
  another tile provider with its own terms.
- **Embed the fonts in `style.css`.** Subset WOFF2 as base64 keeps three files,
  works over `file://` and sends no visitor data to a font service.

## Files

- `index.html`: rewritten markup, `<symbol>`, updated SEO and JSON-LD.
- `style.css`: rewritten as mobile-first tokens and sections.
- `script.js`: reduced to `InkStroke`, `MapLibreIntegration`, the floating action
  and `App.bootstrap()`.
- Local notes (`AGENTS.md`, `CLAUDE.md`, `MEMORY.md`): updated at the end, since
  many of their contracts stop applying.

## Risks

- **Embedded fonts add weight.** Subsetting keeps each font small, but base64
  inflates it by about a third and leaves a long block in `style.css`. The block
  stays at the end of the file, and the budget is checked in T6.
- **Ink cost on low-end phones.** Mitigated by a capped device pixel ratio,
  incremental painting and stopping off screen; measured with CPU throttling.
- **The page depends on real content.** With little history, Trajectory and Combat
  feel empty. Those sections must degrade gracefully and omit missing items.
- **The logo will change.** Hero composition is tuned to the current wolf, so it
  must be reviewed once the rebrand lands.
- **`file://` and photos.** Photos cannot be inside the three files without
  inflating them. Decision pending: a separate image folder when photos exist.

## Verification

No runner exists. Each task is verified in Playwright at the widths in the spec,
with reduced motion, without JS and with a 4x CPU slowdown, plus a real Android
review by Luis. A `reviewer` pass closes the work before any merge proposal.
