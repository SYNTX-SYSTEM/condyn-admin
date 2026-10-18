# ROLE ORBIT REFINEMENT — evidence (owner "SFE — GRÜN | ROLE ORBIT REFINEMENT", 2026-10-18)

GRÜN, branch `frontend/role-orbit` on `frontend/demo-ui-fix` 0b5a8ea. Design and proof: `docs/career_analysis/JOB_FIELD_FRONTEND.md` §13.2.30.

| File | What it shows |
|---|---|
| `before-org_{kestrel,orbit_2,orbit_8}-{1600,1280}.png` | the organization cosmos on the base commit (3, 2 and 8 roles) |
| `after-org_{kestrel,orbit_2,orbit_8}-{1600,1280}.png` | the same organizations with the drawn-in role orbit |
| `before-measure-{1600,1280}.json`, `after-measure-{1600,1280}.json` | per organization (1, 2, 3, 5, 8, 14 roles, 8 long / 12 short titles and the two lab pools): compactness, orbit radii, card boxes, gaps at rest and over a whole turn, phases in which a card passes the orientation surface |
| `walk-results-1600.txt`, `walk-results-1280.txt` | browser walk 58/58 per size: O-1 … O-8 (cards, overlap at rest, over a turn, rendered neighbour air every half degree, in motion, 22 % for up to five roles, never widened, card sizes unchanged), N-1 … N-5 (pointer, receded anchor, Escape, Tab / Enter, centre), R-1 (reduced motion), E-1 |
| `scripts/role-orbit-walk.mjs` | the walk (`TAG=before\|after node …/role-orbit-walk.mjs <out> <lab state.json> [w h]`; `before` only measures and shoots) |
| `scripts/scale-pool.mjs` | the synthetic scale pool (organizations with 1, 2, 3, 5, 8, 14 roles, 8 long and 12 short titles), uploaded through the real route |

Measured after the D-RO-1 fix (PINK §3.45: every check every half degree, cards measured with the drawn height). Orbit radii in
px, mean distance of the cards from the centre, least rendered air between neighbours on the orbit over a whole turn beyond
12 px horizontal / 20 px vertical:

| Viewport | Organization | Compactness x / y | Orbit before → after | Mean distance | Neighbour air |
|---|---|---|---|---|---|
| 1600 × 1000 | 1 – 3 roles | 0.78 / 0.78 | 662.5 × 298 → 516.8 × 232.4 | 495 → 386 (3 roles) | 340 → 236 (3 roles) |
| 1600 × 1000 | 5, 8 roles | 0.78 / 0.78 | 648 × 298 → 505.4 × 232.4 | 489 → 381 | 73.7 → 27.4 (8) |
| 1600 × 1000 | 8 long titles | 0.79 / 0.99 | 630.5 × 289 → 498.1 × 286.1 | 475 → 399 | 37.6 → 9.8 |
| 1600 × 1000 | 12 short titles | 0.78 / 0.78 | 704 × 306 → 549.1 × 238.7 | 525 → 409 | 34.5 → 2.2 |
| 1600 × 1000 | 14 roles | 1 / 1 (unchanged) | two orbits as packed | 384 | −0.2 (as packed) |
| 1280 × 720 | 1 – 5 roles | 0.78 / 0.78 | 502.5 × 278 → 392 × 216.8 | 397 → 310 (3 roles) | 283 → 190 (3 roles) |
| 1280 × 720 | 8 roles | 0.84 / 1.00 | 488 × 278 → 409.9 × 278 | 390 → 347 | 43.3 → 26 |
| 1280 × 720 | 8 long titles | 0.98 / 1.00 | 484 × 269 → 474.3 × 269 | 384 → 379 | 10.4 → 7.9 |
| 1280 × 720 | 12 short titles | 0.78 / 0.95 | 544 × 286 → 424.3 × 271.7 | 425 → 352 | 17.4 → 1.1 |
| 1280 × 720 | 14 roles | 1 / 1 (unchanged) | static grid as packed | 485 | −78 (as packed, O-RO-PACK-14) |

Passing under the orientation surface (card phases of a whole turn, 5° steps): Kestrel 19 → 9 of 216 at 1600, 28 → 19 at 1280;
8 roles 50 → 20 of 576 at 1600, 74 → 65 at 1280.

The walk runs against GRÜN's three-mode lab (`../three-modes/scripts/modes-lab.ts`): disposable database, the real Next server and
the unchanged worker, Gemini replaced by the loopback stand-in under the network sentinel. The sentinel refused one connection, the
`next dev` version check to registry.npmjs.org; there was no Gemini host. `before` was measured on the same lab with the two changed
files reset to 0b5a8ea. Scripts run from the repository root; Playwright comes from `CONDYN_PLAYWRIGHT_MODULE`, else from the repository.
