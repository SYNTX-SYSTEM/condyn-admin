# HR Decision Looper: manual local test

Status: environment script on `frontend/hr-decision-dock-finalization`. Local only. No
deployment. The shared `condyn` database is never used: the environment runs on a
disposable `condyn_test_<16 hex>` database created, positively verified and dropped only by
the helpers of `lib/database-isolation` (owner mandate 2026-10-10).

## 1. Start

```bash
cd ~/Entwicklung/condyn-admin-hr-dock            # any worktree on this branch
TEST_DATABASE_ADMIN_URL=postgresql://postgres:postgres@localhost:5432/postgres npm run hr-loop:local
```

What happens, in order: a disposable database is created and marked; it is verified by a
read-only connection (name and marker); the unified persistence registration runs (T11,
post-decision chain, `decision_context_revisions`, DCDRB bindings); the sealed-producer world
is seeded (target chain, PHASE4_VERIFIED snapshot, RRL, TSN, EIS, RPR, RCP, DAR, DCTXREV A
and B, the full chain DCR → … → COVFCR on A, a G2 root DREV bound to A by one DCDRB, and a
directly formed D2-shaped child DREV); the database is verified again; `next dev --webpack`
starts on `http://127.0.0.1:3017` (override with `HR_LOOP_LOCAL_PORT`). The banner prints
the exact URLs with the seeded ids. The state (ids, database name) is in
`.hr-loop-local/state.json`, ignored by git.

Other commands: `npm run hr-loop:local:seed` (database only), `npm run hr-loop:local:serve`
(server on the existing database), `npm run hr-loop:local:status` (print URLs),
`npm run hr-loop:local:drop` (remove exactly that database). Stopping the server keeps the
database so the operator can continue later.

Credentials: there is no login in front of `/career/demo`. The only "credential" is the
declarant actor id the seeded Decision Authority Grant authorizes: `HR_DECIDER_LOCAL`
(grantor `HR_GRANTOR_LOCAL`, window open-ended from 2026-01-01). The dock sends it as the
local self-declared principal (boundary B2: this is not authentication).

## 2. Walkthrough

1. Open the "Context A" URL from the banner. Close the onboarding overlay. The planetarium is
   unchanged; the HR DECISION LOOP dock is on the right.
2. Context section: DCTXREV id, DAR id with authorized actor and window, RCP id, the two
   exact decision subjects (ordinal, disposition PROPOSED, kind, tension code), permitted
   classes.
3. Chain section: fifteen families, all PERSISTED · 1 (DCR, DAINT, HCOM, EAGR, ECTXREV, AOC,
   SCD, ASCAD, CORD, COVD, COVFAD, COVFTD, COVFTRB, COVFCR, DCDRB). Values are persisted
   fields; the valence DESIRABLE is green because it is that declared value, nothing more.
4. DREV section: the child DREV from the URL is preloaded. Expected labels: ENTRY: EXPLICIT
   ID FROM URL (ASSUMED, NOT BOUND); child card CHILD REVISION · NOT BOUND TO THIS CONTEXT ·
   INVENTORY EXTENDED BEYOND PREDECESSOR (formed outside the governed 8D return, D2 shape);
   root card ROOT REVISION · BOUND TO THIS CONTEXT · DCDRB_…; terminal ROOT REACHED.
5. Click the bound DREV button. Expected: ENTRY: DCDRB BINDING OF THIS CONTEXT · DCDRB_…, the
   root alone, ROOT REACHED, and the URL now carries `decisionContextRevisionId=<root>`.
6. Type an id such as `DREV_000000000000000000000000` and READ EXACT REVISION. Expected: NO
   PERSISTED REVISION WITH THIS EXACT ID (absence, not failure).
7. Open the "Context B" URL. Every family reads NONE PERSISTED; the binding list reads NO
   PERSISTED BINDING FOR THIS CONTEXT (the family is persisted as empty, not unprovisioned).
8. Declare with declarant `INTRUDER`, class REJECT_RECOMMENDATION, one evidence line. Expected:
   DECLARATION REJECTED · ERR_HUMAN_DECISION_DECLARANT_MISMATCH (the sealed DAR gate, verbatim).
9. Declare with declarant `HR_DECIDER_LOCAL`, class REQUEST_FURTHER_EVIDENCE. Expected:
   ERR_HUMAN_DECISION_SUBJECT_NOT_ADMISSIBLE (sealed T11C: the seeded subjects are
   semantic-uncertainty items; only ACCEPT, REJECT, DEFER are admissible, boundary B10).
10. Declare with `HR_DECIDER_LOCAL`, class REJECT_RECOMMENDATION (or ACCEPT, DEFER). Expected:
    HUMAN DECISION RECORD PERSISTED · DCR_…, and the DCR family shows PERSISTED · 1 with that
    id. Click DECLARE again unchanged: IMMUTABLE RECORD WITH THIS IDENTITY ALREADY EXISTS
    (409: same identity, different `createdAt`).
11. Inverse by hand: open the "API: seeded human decision record" URL, then the context A
    read-model URL; every id you saw in the dock is an exact key there.
12. Open the "SIL field without the dock" URL: no dock, no loop attribute, field unchanged.

## 3. What this environment does not do

- No HTTP ingress for DAINT … COVFCR or for DCDRB bindings (B-INGRESS); those states are
  seeded. The dock represents them; it cannot create them.
- No root DREV creation from the dock; the frozen API v1 POST exists and the R2 builder exists
  on this branch, but no UI calls them.
- The server uses `initDbSchema()` on first request; the post-decision tables exist here only
  because the script ran the unified registration first (B-ENTRY unchanged).
- Locale switch is in the System Codex ([DE|EN]).
- Next.js 16 allows one `next dev` per project directory: stop the manual server before
  running the browser e2e in the same worktree (it starts its own server), or run the e2e from
  another worktree.
- Reproducibility: the seed is deterministic except for `createdAt` stamps that are fixed
  constants; ids differ per database only where the sealed identity includes the base context
  evidence refs, so compare by role (context A / B), not by id, across environments.
