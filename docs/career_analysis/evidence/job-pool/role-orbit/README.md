# ROLE ORBIT REFINEMENT — evidence (owner "SFE — GRÜN | ROLE ORBIT REFINEMENT", 2026-10-18)

GRÜN, branch `frontend/role-orbit` on `frontend/demo-ui-fix` 0b5a8ea. Design and proof: `docs/career_analysis/JOB_FIELD_FRONTEND.md` §13.2.30.

| File | What it shows |
|---|---|
| `before-org_{kestrel,orbit_2,orbit_8}-{1600,1280}.png` | the organization cosmos on the base commit (3, 2 and 8 roles) |
| `after-org_{kestrel,orbit_2,orbit_8}-{1600,1280}.png` | the same organizations with the drawn-in role orbit |
| `before-measure-{1600,1280}.json`, `after-measure-{1600,1280}.json` | per organization (1, 2, 3, 5, 8, 14 roles and the two lab pools): compactness, orbit radii, card boxes, gaps at rest and over a whole turn, phases in which a card passes the orientation surface |
| `walk-results-1600.txt`, `walk-results-1280.txt` | browser walk 41/41 per size: O-1 … O-8 (cards, overlap at rest, over a turn and in motion, 22 % for up to five roles, never widened, card sizes unchanged), N-1 … N-5 (pointer, receded anchor, Escape, Tab / Enter, centre), R-1 (reduced motion), E-1 |
| `scripts/role-orbit-walk.mjs` | the walk (`TAG=before\|after node …/role-orbit-walk.mjs <out> <lab state.json> [w h]`; `before` only measures and shoots) |
| `scripts/scale-pool.mjs` | the synthetic scale pool (organizations with 1, 2, 3, 5, 8, 14 roles), uploaded through the real route |

Measured (orbit radii in px, the mean distance of the cards from the centre, the least air to the centre disc over a whole turn):

| Viewport | Roles | Compactness x / y | Orbit before → after | Mean distance | Air to the centre over a turn |
|---|---|---|---|---|---|
| 1600 × 1000 | 1 – 3 | 0.78 / 0.78 | 662.5 × 298 → 516.8 × 232.4 | 495 → 386 (3 roles) | 159 → 93 |
| 1600 × 1000 | 5, 8 | 0.78 / 0.78 | 648 × 298 → 505.4 × 232.4 | 489 → 381 | 159 → 93 |
| 1600 × 1000 | 14 | 1 / 1 (unchanged) | two orbits as packed | 384 | 5 (as before) |
| 1280 × 720 | 1 – 5 | 0.78 / 0.78 | 502.5 × 278 → 392 × 216.8 | 397 → 310 (3 roles) | 136 → 74 |
| 1280 × 720 | 8 | 0.79 / 0.95 | 488 × 278 → 385.5 × 264.1 | 390 → 328 | 134 → 110 |
| 1280 × 720 | 14 | 1 / 1 (unchanged) | static grid as packed | 485 | 18 (as before) |

Passing under the orientation surface (card phases of a whole turn): Kestrel 19 → 9 of 216 at 1600, 28 → 19 at 1280; 8 roles 50 → 20
of 576 at 1600, 74 → 55 at 1280.

The walk runs against GRÜN's three-mode lab (`../three-modes/scripts/modes-lab.ts`): disposable database, the real Next server and
the unchanged worker, Gemini replaced by the loopback stand-in under the network sentinel. The sentinel refused one connection, the
`next dev` version check to registry.npmjs.org; there was no Gemini host. `before` was measured on the same lab with the two changed
files reset to 0b5a8ea. Scripts run from the repository root; Playwright comes from `CONDYN_PLAYWRIGHT_MODULE`, else from the repository.
