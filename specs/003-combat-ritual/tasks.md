# Tasks 003 — Combat ritual redesign

States: `pendiente` → `en_progreso` → `implementada` → `validada`.

| # | Task | Requirements | State |
|---|---|---|---|
| T1 | Mobile-first base: tokens, type, logo `<symbol>`, bar and floating action | RF-01, 03, 04, 05, 06, 07, 08, 09 | validada |
| T2 | Hero with its single entrance | RF-11, 12, 17 | validada |
| T3 | Who we are, Classes and Combat with confirmed content | RF-10, 20, 22 | validada |
| T4 | Trajectory: semantic list and `InkStroke` | RF-13, 14, 15, 16 | validada |
| T5 | Visit: data in markup, pinned MapLibre, labeled map, fallback | RF-21, 24, 27-32 | validada |
| T6 | Fallbacks, SEO, JSON-LD and budgets | RF-02, 18, 19, 23, 25, 26 | validada |
| T7 | Full verification, `reviewer` pass and local notes | All | validada |
| T8 | Luis reviews on a real Android phone | Criterion 9 | pendiente |

## Review

Verdict: APROBADO by `reviewer` on commit `256fa54`, after a first CAMBIOS_NECESARIOS
pass. Its finding about the Soledad location name was rejected: "Parque Designado" is
the owner's own decision, pending confirmation of the official name.

Browser evidence: no horizontal overflow from 360 to 1440, 8.2 screens at 390x844,
62 KB gzipped, clean console, both labeled pins and all map controls, ink forward and
back, reduced motion, simulated no-JS styles and `file://` in Chrome.

Not yet verified: a real Android phone (T8) and true CPU throttling; the 5 ms ink
repaint on a slow phone is an estimate from 1.25 ms on this machine.
