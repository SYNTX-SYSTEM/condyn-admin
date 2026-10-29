# CONDYN / DLL — full system recovery and reconstruction (2026-10-28)

Owner mandate „SYNTX::SFE — DLL FULL SYSTEM RECOVERY & RECONSTRUCTION“. GELB (architecture lead). Method: reconstruct from Git,
worktrees, processes and databases; no Codex claim taken over unverified. Boundaries: (1) nothing existing broken, (2) test-driven
and recursive with real integration proof, (3) everything documented.

## 1 GELB's own state before the interruption (from Git and the session)

| Line | State | Where |
|---|---|---|
| UX/UI closure | **closed**, candidate `b77c851` on `frontend/pxj-ux-closure`, PINK §3.64 PASS, full suite 27 red = known baseline; owner accepted it as validated candidate, **not integrated** | docs `CONDYN_UX_SYSTEM_CLOSURE_2026-10-23.md` §10 |
| Role discovery stage 1 (GELB) | `POOL_ROLE_DISCOVERY_V1` read route, PERSON only, explicitly released pools, lexical, no score/ranking — `96651af` | `backend/pool-role-discovery` |
| Relation cache (GELB) | content-addressed `PRREL_` store `ccc0cc1`; PINK §3.65–§3.67 → database immutability `2dba126`, convergence `600c7c1`, transactional convergence `88ac5ed` | same branch |
| In flight at the interruption | separate guarded cache registration + fail-closed plan states (availability boundary), tests written, not committed | committed now as `94e6028` (61 files 484 passed, 4 skipped; tsc 0) |
| Stage 2 (GRÜN) | `frontend/role-discovery-map` on ccc0cc1: RD-URL `1d3ccf7`, RD-READ `9112682`, RD-5 `12e01f6` (03–06 hidden under PERSON per D-RD-5 = B); T-07 re-set prepared, **never committed** (files still uncommitted in that worktree, 10-24) | `condyn-admin-role-discovery` |
| Stage 3 (GELB) | specification only (`CONDYN_SEMANTIC_RELATION_ENGINE_SPEC_2026-10-24.md`): role-level unit, explicit start, budget ledger, no silent retry, idempotency, replay, stand-in vs real; real Gemini needs a GO | docs |
| Open owner items | persistence contract stage 3, roles per investigation, Gemini daily budget, model/retention, C-LEGACY, PERSON-HASH-REBASE, D-PICK-PERSON, D-SRC, integration GO | docs |

## 2 What Codex actually changed (verified)

**(a) `_sfe` sandboxes** (`<dev>/_sfe/condyn-admin/{gelb,gruen,pink}`): clones of `origin` on `ee06ff6`
(2026-08-31) — two months older than the system (no job pools, no three modes, no B2, no G1/UX, no stage 1). gelb and pink: no
new commits. gruen: **50 commits on 10-24/25** (57 files, +2152) building a second role discovery next to ours — own route
`/api/career/role-discovery`, own `lib/career/matching/{role-discovery,gemini-runtime,job-assignment,authorized-job-pool-adapter,
person-profile,…}`; per PINK §3.69 it is built on `embeddings/search` and orders by `similarityScore` (the embedding similarity D-RD-2 D
excludes as proof), not on the demo-pool engine. **Classification: parallel implementation on a stale base, not
integrable; duplicates POOL_ROLE_DISCOVERY_V1 and the job pool architecture.** One idea kept as input: an explicitly authorised
pool list. Nothing of it was pushed.

**(b) Main checkout** `<dev>/condyn-admin`: switched to a new branch `capability-mapping` (`59076c0` = two docs
commits on `ee06ff6`) with four untracked files (`RUNNING`, `currentOperation`, `exact`, `rejected`) — empty, dated 2026-08-31, i.e. older than the Codex
work (PINK §3.69); not a Codex change. Left untouched (owner's checkout).

**(c) The real branch `frontend/role-discovery-map`** (GRÜN's worktree, local only, never pushed) — 13 commits on 10-26:

| Commit | Change | Verdict |
|---|---|---|
| `d821bb6` | `activeDiscoveryPoolIds`: every ACTIVE pool, sorted by id, silently cut at 10 | violates D-RD-1 („No silent comparison against every stored pool“; explicit authorisation) |
| `a139392` | `RoleDiscoveryCapabilityMap` overlay in the field | superseded by 175c481 (unused afterwards) |
| `993397e` | legacy `/matches` resonance candidates under PERSON („automatic job candidates“) | shows the forbidden legacy score |
| `d4616c7` | Gemini relation evaluation + `rankSemanticRoles` **inside the read-only GET route** whenever `GEMINI_API_KEY` is set; ad-hoc prompt, name-based mapping, no evidence-id citation, no budget, no explicit start, writes the cache on GET | violates D-RD-3 conditions, D-RD-4 (ranking), the stage-3 spec and the read contract; up to 77 model calls per page view on 4 pools |
| `eff2480` | `/matches?discovery=PERSON` bypasses the PERSON refusal (`ERR_JOB_POOL_MATCHES_PERSON_ANALYSIS`) | authority regression: any caller gets legacy scores for a PERSON analysis |
| `887da98` | test for that bypass | — |
| `17cc828` | unscoped demo opens in PERSON | reverted by 175c481 |
| `175c481` | restores the six PERSON orbits (undoes RD-5's hiding), removes the overlay | keeps the owner's six-orbit field; **left 9 tests red** (four test files still asserted the RD-5 inverses; Codex verified only a DB-free subset of 59 tests) |
| `91a7a6c`, `5bed6c9`, `a7d1304`, `4682784`, `ac7d669` | docs of the above | kept as history, marked SUPERSEDED |

**(d) Runtime.** `:3017` (owner environment) now runs from `condyn-admin-role-discovery` (Codex branch code, `next dev`, started
~10-26) with the local runner `hr-decision-loop-local.ts up --with-worker` on disposable `condyn_test_48c146bfe9c3b69d`
(0 analyses, 0 pools, 0 relation rows — the empty runner database), **`GEMINI_API_KEY` set, model gemini-3.1-pro-preview**.
With the Codex route, a role discovery read for a PERSON analysis there would call Gemini per role without budget. So far no such
call is possible (no analysis, no pool). Not touched by GELB (owner rule for :3017). **Risk (PINK §3.69):** :3017 runs `175c481`, which still contains the Gemini-in-GET path
(`d4616c7`) and the `?discovery=PERSON` bypass; the recovery branch removes both, :3017 does not.

## 3 Reconstruction on `recovery/role-discovery` (GELB, no integration)

Base `175c481` (the real line incl. GRÜN's RD-URL/RD-READ and the restored six orbits), then:

1. **Reverts** of the boundary violations, one revert commit each, conflicts resolved towards 175c481's field (which had already
   removed the Codex blocks): `887da98`, `eff2480`, `d4616c7`, `993397e`, `a139392`, `d821bb6`. Inverse check: `application.ts`,
   `http.ts`, the role-discovery route, `relation-cache.ts`, `useJobPool.ts` and their tests are byte-identical to `ccc0cc1`;
   `lib/career/ui/role-discovery.ts` and its test to GRÜN's `9112682`; no `discovery=PERSON`, `activeDiscoveryPoolIds`,
   Gemini relation provider or ranking left in app/lib/test.
2. **Merge** of `backend/pool-role-discovery` (`2dba126 … 94e6028`): database-enforced immutability, first wins, convergence,
   transactional convergence, separate cache registration with fail-closed plan states. Clean merge.
3. **Superseded banners** on the two Codex docs (history kept).
4. **Six-orbit tests:** the four files 175c481 left on the RD-5 inverses return to their pre-RD-5 version (`9112682`) — the
   six-orbit PERSON contract PINK had validated; `career-demo-ui` and `first-screen-ssr` keep their 175c481 version, which holds
   every pre-RD-5 assertion plus more. Route read-only test tolerates the lazily registered cache table.
   Focused group: **79 files, 630 passed, 4 skipped; tsc 0**.

## 4 Architecture after recovery (SFE)

FIELD: Capability Field (01 Identity Core, 02 Capability Field) + legacy orbits 03 Resonance, 04 Role Manifestation, 05 Tension,
06 Evolution — **all six under PERSON**, hidden under PERSON × JOB (G1), JOB without Capability Field.
RELATION: source → PERSON discovery (scope-free) → projection → POOL_ROLE_DISCOVERY_V1 (explicitly released pools, lexical) →
semantic layer (stage 3, cache-backed, not executed) → Capability Map. PERSON × JOB: selected job → scoped discovery → B2.
BOUNDARY: no silent pool set, no model call on a read, no legacy score for PERSON, cache failures stay in the semantic layer.
AUTHORITY: lexical and semantic layers authority NONE; no ranking until the owner decides how an explainable ranking is formed.

**Owner direction 2026-10-28 vs earlier decisions** (to be confirmed): the recovery mandate keeps the six orbits (supersedes the
replacement in D-RD-5 = B — role discovery must be **added** without removing orbits) and names „semantisches Matching und
nachvollziehbares Ranking“ as the goal (D-RD-4 = A had excluded ranking by coverage). GELB proposal in §6.

## 5 Proof levels (kept strictly apart)

| Level | State |
|---|---|
| Implementation | recovery branch as above |
| Tests | focused 79 / 630; full suite: §7 |
| Host runtime | §7 |
| Browser proof | §7 |
| Full product E2E (PDF → PERSON → authorised pools → semantic matching → map) | **not reached**: semantic execution (stage 3) is specified, not built; real Gemini needs the owner's GO; the UI does not render role discovery since 175c481 |

## 6 Next steps and owner decisions (minimal)

- GRÜN: role discovery in the Capability Map **additively** with all six orbits (proposal: reachable from 04 Role Manifestation /
  the B2 panel grammar, explicit pool authorisation); decide the uncommitted RD-5 T-07 files (obsolete now).
- GELB: stage 3 engine per the spec with the stand-in provider; explicit start, budget, no call on GET.
- PINK: independent validation of the recovery branch.
- Owner: (1) confirm „six orbits stay, role discovery added“; (2) ranking rule (explainable, from semantic relations, never
  from lexical coverage or legacy scores); (3) how pools are authorised (explicit release per analysis vs. an owner-maintained
  authorised list); (4) GO for real Gemini with a call budget; (5) whether :3017 should move off the Codex code.

## 8 Autonomous decisions derived from the existing architecture (owner „AUTONOMOUS ARCHITECTURE RECOVERY“, 2026-10-29)

Derivation order: owner texts → G1 / UX decisions → D-RD-1…5 → stage-3 spec. Where texts conflict the **newer owner text wins**, the
older contract is narrowed, never silently dropped.

| Decision | Derived rule | Source |
|---|---|---|
| **Six orbits** | All six stay under PERSON with their rays, coupling, HUD actions and interactions; hidden only under PERSON × JOB (G1). Nothing removed. Supersedes the replacement in D-RD-5 = B. | recovery mandate §2/§4; boundary 1; G1 Q1 |
| **Role discovery placement (D-RD-5 narrowed)** | Additive: a role-discovery panel in the B2 panel grammar (fit/stack/telemetry rules), opened by an explicit „DISCOVER JOBS“ action and reachable from orbit 04 (Role Manifestation, the roles orbit); the planetarium stays the centre. The panel is the only place that shows discovery results; orbits 03–06 keep their original content. | D-RD-5 („preserve the existing PERSON proposals; no legacy scoring in the **map** of discovery“), UX closure grammar |
| **Legacy score** | Not touched in the legacy orbits (original behaviour, boundary 1). Discovery never reads or shows it; the legacy orbit content gets the existing label „legacy presentation · not authority“ if it lacks one (label only). | D-RD-5, G1 |
| **D-RD-4 and „nachvollziehbares Ranking“** | Grouping by relation status stays (D-RD-4 A). A **ranking exists only from persisted semantic relations** (stage 3): inside a group, roles are ordered by an explicit, displayed relation profile — (required requirements EQUIVALENT/COVERS, then PARTIAL, then open), then pool, organisation, role — shown as such („ordering by established relations, not a suitability score“); never from lexical coverage, similarity or the legacy score. Without executed semantic relations: no ranking, status „semantic check not executed“. | owner recovery text (explainable ranking) narrows D-RD-4 „no numeric coverage ranking“ to: no ranking from unverified signals |
| **Pool authorisation** | Explicit per analysis through the existing `discoveryPoolUploadId` (RD-URL: one push, NAV ≡ RELOAD); no default, no „all pools“. The UI lists uploaded pools as unchecked choices. Pools created by Codex sandboxes or the runner's empty database are not authorised by existing. | D-RD-1; „no silent comparison against every stored pool“ |
| **Execution contract** | Stage-3 spec unchanged: explicit start, role-level calls, ledger budget, no silent retry, idempotency, replay, provider in the engine identity. Real Gemini stays blocked behind a budget number the owner names. Stand-in development proceeds. | D-RD-3, spec 2026-10-24 |
| **Codex semantic code** | Not reused: read-only GET stays read-only. The useful parts (Gemini provider adapter idea) are reimplemented against the spec by GELB. | boundary 1, D-RD-3 |
| **:3017** | Not touched; reported. | owner rule |

Returned to the owner (missing authorisations only): the Gemini call budget number for real execution; whether :3017 may be moved
to the recovered branch.

## 9 PINK §3.69 on 08ae201 (`cabc168`)

Reverts, six orbits / PxJ (REAL + STAND_IN, DOM identical to b77c851 in 16/16 PERSON scenes), no model call in a GET (stand-in call count 6 → 6; three
suite files 71/71 in a real checkout), decoupling measured (dirty cache table: pool list 200, plan CACHE_UNAVAILABLE, recovery without restart): PASS.
Point 3 narrow FAIL — the German empty-projection checks of components 03–06 — fixed in the next commit (`restore the German/English
empty-projection checks`). Observation O-REC-1: the RD-URL state in the field (`discoveryPools`, `releaseDiscoveryPools`) is parsed but unused until
stage 2 — dead code by design until GRÜN's panel. INCONCLUSIVE for PINK: :3017's key/model/database (PINK does not read process environments).
