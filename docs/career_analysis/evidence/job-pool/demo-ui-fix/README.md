# DEMO UI FIX + SEMIONTIC REFINEMENT — evidence (owner, 2026-10-15)

GRÜN, branch `frontend/demo-ui-fix` on the integration tree 5434c01. Design and proof: `docs/career_analysis/JOB_FIELD_FRONTEND.md` §13.2.29.

| File | What it shows |
|---|---|
| `00-before-role-gemini-pools-open-1280.png` | before the fix (lab probe on 5434c01): at a role with GEMINI OUTPUT and the pool list open, the list covers the action row with HIDE GEMINI OUTPUT |
| `01-role-gemini-pools-open-{1600,1280}.png` | after: the list opens below the orientation surface; HIDE GEMINI OUTPUT, POOLS and INTAKE free |
| `02-no-analysis-signal-{1600,1280}.png` | the NO ANALYSIS state line as a signal (surface) and the field's own statement (bottom, still) |
| `03-no-analysis-surface-{1600,1280}.png` | the orientation surface alone |
| `walk-results-1600.txt`, `walk-results-1280.txt` | browser walk 36/36 per size: U-1 … U-6 (closing, focus, a modal layer above the field, field and Capability Field afterwards, pool and mode kept), S-1 … S-10 (copy, type, contrast, motion, box stability, keyframes, reduced motion, infinite-motion inventory, signal scope, bottom statement), X-1 |
| `walk-stability.txt` | repeated runs |
| `scripts/ui-fix-walk.mjs` | the walk (`node …/ui-fix-walk.mjs <out> <lab state.json> [w h]`) |

The walk runs against GRÜN's three-mode lab (`../three-modes/scripts/modes-lab.ts`): disposable database, the real Next server and
the unchanged worker `scripts/run-career-worker.ts`, Gemini replaced by the loopback stand-in under the network sentinel. The
sentinel refused one connection, the `next dev` version check to registry.npmjs.org; there was no Gemini host. Scripts run from the
repository root; Playwright comes from `CONDYN_PLAYWRIGHT_MODULE`, else from the repository.
