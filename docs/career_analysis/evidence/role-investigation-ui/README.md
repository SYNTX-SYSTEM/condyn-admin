# RI-START / RI-URL / RI-CONTROL — frontend of the explicit semantic investigation

Branch `frontend/role-investigation-ui`, rebased onto `edae658` (recovery/role-discovery: GELB's stage-3 start route,
PINK §3.74/§3.75). Commits:

- `f74a6a3` RI-CONTROL — `discovery.startControl` decoded strictly; the panel names apart why no start is offered
  (not configured, provider not authorised, cache unreadable).
- `5559169` RI-START — the explicit "START SEMANTIC CHECK" from the panel: role pick (none preselected, at most
  `startControl.maxRoles`), the confirmed call count shown before the start and sent exactly as `confirmedCalls`;
  one click is one POST; every stored state (planned/running/completed/partial/budget exhausted/failed/interrupted,
  refused, no readable answer) said honestly; stand-in named as no model, never a provider name; no relation, no
  ranking; D-RD-4 status groups unchanged.
- `704cff6` RI-URL — `roleInvestigationId` in the URL (GELB STOP-point reply): written once as a replace after the
  stored answer, read again by GET only (NAV ≡ RELOAD), removed on a new release / CLOSE / a new analysis / the
  "Gezielt untersuchen" handover; O-START-5 (the panel's owner line shows the real stored status instead of "not
  started" once one is known).
- `50dac39` fix — `CareerIntelligenceDashboard` had no `roleInvestigationId` in its own explicit prop list, so a real
  reload lost it silently between `page.tsx` and the field even though the shared parser and the field itself both
  already supported it. Found by the production browser walk below, not by the unit suite (which calls the field
  directly and skips that hop); a regression test was added that checks the prop at each hop.

## Proofs

- `test/career/pxj-first-screen`: 46 files, 276 passed, 4 skipped. Six-orbit + related suites (`test/career/three-modes`,
  `career-demo-ui`, `career-f12-pulse-alignment`, `career-sil-empty-orbit-visual-attention`,
  `career-sil-global-language-wiring`, `career-frontend-job-lifecycle`): 8 files, 154 passed.
- `tsc --noEmit`: 0 errors.
- Production build (`next build --webpack`, no flag): clean; the two new routes
  (`/api/career/analyses/[analysisId]/role-discovery/investigations[/…]`) are in the route table.
- Every regression test (RI-CONTROL, RI-START, RI-URL) was counter-checked on its direct predecessor commit and
  fails there; the matching inverse holds on both.

## STANDIN production walk (`scripts/ri-walk.mjs`, `ri-walk-report.json`)

Lab on :41882, production build of `50dac39`, real Next server + real worker, loopback Gemini stand-in,
`ROLE_DISCOVERY_SEMANTIC_PROVIDER=stand-in`, `ROLE_DISCOVERY_DAY_LIMIT=1000` (explicit — PINK §3.74 O-START-3: the
day limit fails closed without it). A PERSON analysis built from the stand-in's own fixed phrases (so real capability
proposals exist); the DLL engineering pool released; one role picked per viewport; START; reload; Back; Forward.

All 13 checks pass on every one of the 6 required viewports (1920×1080, 1600×900, 1440×900, 1280×720,
960×540 @2, 640×360 @2): the start is offered only on READY; exactly one POST per START; the investigation reaches
COMPLETED; "Stand-in, no model" is shown and no real model name ever appears; the URL names the investigation after
the stored answer; a reload reads it again by GET only (no POST) with the same status; Back removes the release and
investigation from the URL; Forward restores both, again by GET only.

The first viewport's role (`role_brightwater_backend_ledger`, pool `JPOOL_B94850…`) had open pairs and triggered one
real (in-process, no network) stand-in evaluation (`confirmedCalls: 1`); the relation cache being global by engine
hash, every later viewport's identical pick was `CACHED` (`confirmedCalls: 0`) — both paths are exercised across the
six runs. `standin.jsonl` records only the two PERSON `analyze()` runs (DISCOVERY/CONVERGENCE/LEGACY); the semantic
relation check itself never leaves the process (`StandInSemanticProvider` is in-process word-overlap logic, no
HTTP). The network sentinel's log (`net.jsonl`) was never created — nothing was refused because nothing reached it.

## A note on the base

My first attempt based this branch on `0e03f69` (GELB's STOP-point reply named it as the base for points 3/4) and
missed that `097e376` (PINK §3.74) and `edae658` (PINK §3.75) already sat on top of it on `recovery/role-discovery`
by the time I rebased. The production walk caught this directly: the live GET response had no `evidenceClass` field
at all, which my strict decoder correctly refused (FAILED) — exactly the kind of silent regression a browser walk
against the real server finds that a unit suite built against hand-written fixtures cannot. Rebased
`--onto edae658 0e03f69 HEAD`, no conflicts (my four commits never touch the server route files), re-verified in
full (tests, tsc, build, six-viewport walk) above.

## Open with GELB

- Ports / process: the lab ran on :41882 and is stopped (own PID, cwd checked); its database was torn down with it.
- Nothing here touches :3017, Gemini, or any merge/deployment boundary.
