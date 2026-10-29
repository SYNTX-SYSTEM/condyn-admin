# Role discovery, additive (GRÜN): evidence

Branch `frontend/role-discovery-additive` on GELB's `recovery/role-discovery` 08ae201. Under PERSON all six orbits stay
unchanged; T-07 keeps the 175c481 hash.

## Commits

Each commit carries a regression test (REPRODUCE fails on its predecessor) and an inverse test (passes there).

| Commit | Feature |
|---|---|
| 75aa96e | RD-PLAN: the decoder reads the four forms of `SemanticInvestigationPlan`. Under the cache states (CACHE_UNAVAILABLE / CACHE_CORRUPT) the numbers are null. |
| d23244f | RD-PANEL: the panel in the B2 grammar; explicit pool release (one push, one GET); five groups in fixed order, two folded; header and semantic state wording. |
| 2f38c0b | RD-DETAIL: per role the trace requirement → lexical basis → proposal → quote and source; evidence limitation; open requirements. |
| 4c5c964 | RD-HANDOVER: "Gezielt untersuchen" is one push (job scope, PERSON_X_JOB, no analysisId, no release); nothing started; PxJ shows NO_ANALYSIS. |
| ec0f917 | RD-LAYOUT: the entry moves to the panel's slot, because below orbit 04 it overlapped that orbit at 1600/1440/1280; 6 px air in the stack; checkbox size; empty level. |

Focused suite: 76 files, 594 passed, 4 skipped; tsc 0. The production build (`next build --webpack`, no flag) passes.

## STANDIN walk (`scripts/rd-walk.mjs`, `rd-walk.json`, `shots/`)

Setup: production server built from ec0f917, the real worker, a loopback Gemini stand-in and the net sentinel; a disposable
database. Sentinel records: 0. Stand-in calls: only the 3 of the analysis set up for the walk; the walk itself sends no POST.

Result: 120/120 checks over 6 viewports (1920×1080, 1600×900, 1440×900, 1280×720, 960×540@2, 640×360@2). Per viewport:

- All six orbits stand, with rays and coupling.
- The entry and the panel overlap no orbit shell and no control of the shell (rect intersection).
- Opening the panel is no URL step.
- The release is one push and exactly one GET of the ticked pools, in the list's order.
- The five groups appear in fixed order.
- Every panel and trace control is reachable.
- NAV ≡ RELOAD holds: reload, Back and Forward.
- The handover is one push and leads to PxJ NO_ANALYSIS.
- No non-GET request is sent.

## Real data (GELB :41878, GET only; only counts recorded here)

PERSON `ANL_1792628831636_456` with the one ACTIVE pool:

- 200;
- 9 roles, 79 requirements, 10 proposals;
- groups 0/2/4/3/0;
- plan ENGINE_NOT_SPECIFIED, 790 pairs, 9 calls.

The strict decoder accepts the body. PxJ `ANL_1792628993472_10` returns 409 `ERR_ROLE_DISCOVERY_OPERAND_NOT_PERSON`.

## Findings for GELB / owner (not changed)

- **Legacy label:** "legacy presentation · not authority" is missing on 03–06 under PERSON. Adding it changes the PERSON markup
  and therefore the T-07 hash, which is to stay. Decision needed.
- **Entry position:** the entry stands in the panel's slot, not near orbit 04 (measured reason above).
- **B2 stack overlap (exists on 08ae201):** at 960×540 the B2 panel overlaps orbit 01's shell by 3 px (`scripts/stack-gap.mjs`).
- **Page scroll (exists without discovery):** at 1920×1080 the page scrolls (scrollHeight 1141).
- **Mode-switch overlap (exists):** an in-session mode switch PERSON → PxJ moves the guide toggle and the codex controls to the
  top (1600×900: guide 1414/13, codex 1214/13), so they overlap. This happens with the existing selector too; a fresh load does
  not show it.
- **Cross-focus not built:** GELB's earlier addition (b), mutual focus between 02 proposals and roles, is not in the new
  assignment.
- **DE wording:** proven by SSR tests; the walk ran in EN (the default locale).
