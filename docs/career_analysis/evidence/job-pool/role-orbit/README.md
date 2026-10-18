# ROLE ORBIT REFINEMENT — evidence (owner "SFE — GRÜN | ROLE ORBIT REFINEMENT", 2026-10-18; "… — SECOND VISUAL REFINEMENT", 2026-10-19)

GRÜN, branch `frontend/role-orbit` on `frontend/demo-ui-fix` 0b5a8ea. Design and proof: `docs/career_analysis/JOB_FIELD_FRONTEND.md`
§13.2.30 (first pass, 7a51d89) and §13.2.31 (second pass: the smallest orbit the geometry carries).

| File | What it shows |
|---|---|
| `before-org_{kestrel,orbit_2,orbit_8}-{1600,1280}.png` | the organization cosmos on the base commit (3, 2 and 8 roles) |
| `pass1-org_{kestrel,orbit_2,orbit_8}-{1600,1280}.png` | the same organizations after the first pass (7a51d89, 0.78 orientation) |
| `after-org_{kestrel,orbit_2,orbit_8}-{1600,1280}.png` | the same organizations with the orbit drawn in to its geometric minimum |
| `before-measure-*.json`, `pass1-measure-*.json`, `after-measure-*.json` | per organization (1, 2, 3, 5, 8, 14 roles, 8 long / 12 short titles and the two lab pools): compactness, orbit radii, card boxes, gaps at rest and over a whole turn, phases in which a card passes the orientation surface |
| `walk-results-{1600,1280}.txt` | browser walk 59/59 per size: O-1 … O-9 (cards, overlap at rest, over a turn, rendered air of every card pair on an orbit every half degree, in motion, beyond 0.78 for up to five roles, never widened and lying, card sizes unchanged, at the limit), N-1 … N-5 (pointer, receded anchor, Escape, Tab / Enter, centre), R-1 (reduced motion), E-1 |
| `pass1-walk-results-{1600,1280}.txt` | the first pass's walk (58/58) |
| `scripts/role-orbit-walk.mjs` | the walk (`TAG=before\|after node …/role-orbit-walk.mjs <out> <lab state.json> [w h]`; `before` only measures and shoots) |
| `scripts/scale-pool.mjs` | the synthetic scale pool (organizations with 1, 2, 3, 5, 8, 14 roles, 8 long and 12 short titles), uploaded through the real route |

Orbit radii in px (packed → first pass → now), mean distance of the cards from the centre, least rendered air over a whole turn
between two cards of the orbit beyond 12 px horizontal / 20 px vertical:

| Viewport | Organization | Now x / y | Orbit packed → first pass → now | Mean distance | Card air (first pass → now) |
|---|---|---|---|---|---|
| 1600 × 1000 | Kestrel (3 roles) | 0.38 / 0.64 | 662.5 × 298 → 516.8 × 232.4 → 251.8 × 190.7 | 495 → 386 → 222 | 238.2 → 109.4 |
| 1600 × 1000 | 1 role (PINK alpha) | 0.34 / 0.62 | 681 × 298 → 531.2 × 232.4 → 231.5 × 184.8 | 301 → 235 → 185 | – |
| 1600 × 1000 | 5 roles | 0.40 / 0.67 | 648 × 298 → 505.4 × 232.4 → 259.2 × 199.7 | 489 → 382 → 230 | 115.7 → 29.9 |
| 1600 × 1000 | 8 roles | 0.61 / 0.74 | 648 × 298 → 505.4 × 232.4 → 395.3 × 220.5 | 489 → 381 → 314 | 27.4 → 4.8 |
| 1600 × 1000 | 8 long titles | 0.81 / 0.93 | 630.5 × 289 → 498.1 × 286.1 → 510.7 × 268.8 | 475 → 399 → 399 | 9.8 → 7.8 |
| 1600 × 1000 | 12 short titles | 0.57 / 0.93 | 704 × 306 → 549.1 × 238.7 → 401.3 × 284.6 | 525 → 409 → 345 | 2.2 → 0.8 |
| 1600 × 1000 | 14 roles | 1 / 1 (unchanged) | two orbits as packed | 384 | as packed |
| 1280 × 720 | Kestrel (3 roles) | 0.49 / 0.70 | 502.5 × 278 → 392 × 216.8 → 246.2 × 194.6 | 397 → 310 → 221 | 191.7 → 108.6 |
| 1280 × 720 | 5 roles | 0.53 / 0.72 | 488 × 278 → 380.6 × 216.8 → 258.6 × 200.2 | 390 → 304 → 230 | 80.4 → 30.1 |
| 1280 × 720 | 8 roles | 0.85 / 0.76 | 488 × 278 → 409.9 × 278 → 414.8 × 211.3 | 390 → 347 → 321 | 26 → 5.4 |
| 1280 × 720 | 8 long titles | 0.98 / 1.00 | 484 × 269 → 474.3 × 269 → 474.3 × 269 | 384 → 379 → 379 | 7.9 → 8.4 |
| 1280 × 720 | 12 short titles | 0.74 / 0.99 | 544 × 286 → 424.3 × 271.7 → 402.6 × 283.1 | 425 → 352 → 345 | 1.1 → 0.8 |
| 1280 × 720 | 14 roles | 1 / 1 (unchanged) | static grid as packed | 485 | as packed (O-RO-PACK-14) |

The smallest orbit is the least area of the factor pairs that hold, so where the vertical axis binds it may come out slightly wider
than the first pass with a smaller area (8 long titles at 1600, 8 roles at 1280). Passing under the orientation surface (card phases
of a whole turn, 5° steps; packed → first pass → now): Kestrel 19 → 9 → 0 of 216 at 1600, 28 → 19 → 3 at 1280; 8 roles
50 → 20 → 0 of 576 at 1600, 74 → 65 → 51 at 1280.

The walk runs against GRÜN's three-mode lab (`../three-modes/scripts/modes-lab.ts`): disposable database, the real Next server and
the unchanged worker, Gemini replaced by the loopback stand-in under the network sentinel. The sentinel recorded one connection, the
`next dev` version check to registry.npmjs.org; there was no Gemini host. `before` was measured on the same lab with the two changed
files reset to 0b5a8ea. Scripts run from the repository root; Playwright comes from `CONDYN_PLAYWRIGHT_MODULE`, else from the repository.
