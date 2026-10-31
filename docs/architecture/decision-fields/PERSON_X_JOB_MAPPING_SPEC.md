# PERSON × JOB mapping field — phase A: data contract and architecture foundation

Owner mandate `SFE::PERSON_X_JOB | PHASE A` (2026-10-31). Phase A only: the data contract, the sign specification and the deterministic
layout specification with golden vectors. No user interface, navigation or visualisation is built here; the six PERSON orbits and the JOB
planetarium are unchanged. The full architecture (phases A–G) was released as the basis; this document is its machine-checked foundation.

## 1. Architecture contract (binding for the later phases)

| # | Binding |
|---|---|
| B-1 | PERSON × JOB gets its own **MAPPING focus** (a third field beside CAPABILITY and FIELD). |
| B-2 | The automatic mapping needs **no job scope**. The PERSON analysis and its ranking are enough. |
| B-3 | **Opening a job in the mapping is not selecting it for B2.** Opening never writes the job scope. |
| B-4 | The explicit B2 transition stays: an action "select this job" sets the existing job scope and leads to the existing B2 coverage. |
| B-5 | The mapping owns no entities, only relations: capabilities come from PERSON, jobs and requirements from JOB. |
| B-6 | Authority stays "ranking, no decision"; evidence class (STAND_IN / REAL_GEMINI) stays visible in the field. |
| B-7 | The mapping reads only; it starts no model call and writes nothing. |

## 2. Data contract — `capabilityKey`

`RankedRequirement.capabilityKey: string | null` (additive to `ROLE_RANKING_V1`, backend `role-ranking.ts`, client `lib/career/ui/auto-match.ts`).

* **Value:** the id of the PERSON proposal the coupling rests on — the id the semantic provider was shown (semantic relation) or the
  proposal the name relation names (`lexical.proposalId`). **Never derived from a name.** The proposal id is a hash of the normalised name and the scope
  (`capability-core/identity.ts`): the same name with the same scope is the same proposal (a second one in one analysis is refused upstream);
  the same name with a different scope is two proposals and keeps two keys.
* **null:** no relation (`source: NONE`), or a finding that carries no key. A key is only ever present together with `capabilityName`.
* **Backend:** the relation cache stays content-addressed (it never stores the run-bound id). The id is resolved at read time from the
  PERSON projection through the same `relationKey` the cache is read with (`auto-match.ts` `buildAnalysisRanking`), so no historical
  record is touched and no stored data changes. `SemanticFinding.capabilityKey` is optional: an older finding reads as null.
* **Client decoder:** strict and additive. An object **with** the key is valid (text or null; text only with a named capability); an
  object **without** it — a payload of an older server, an older persisted body — is the same contract and reads as null
  (`capabilityKey ?? null`). The decoder still returns the object it was given, unchanged. Any other extra field is refused.
* **Rollout:** the field is additive, so old client with new server is refused by the old strict decoder (exact key set), as with `STALLED`;
  backend and frontend ship together. A new client with an old server works.
* **Ranking numbers:** fit, order, coverage, gaps are unchanged (tested).

## 3. Sign specification — `mapping-spec/sign-table.json` (`MAPPING_SIGNS_V1`)

Ten coupling states (five semantic, four lexical bases, NONE) each have one sign, told apart by **arcLine + arcFill + beam + mark**, never
by colour or luminance alone. Honesty rules: DIFFERENT (judged different), UNCLEAR (could not tell) and NONE (not evidenced) are three
different signs; a name relation is dotted, never phase locked, at most half filled. The run states of the automatic path
(`AUTO_MATCH_STATES`) each have a time sign: only RUNNING breathes (field level), only STALLED is frozen, a resume pulse exists only for
PARTIAL/FAILED while `resumePending`. Movement happens only on new evidence (once per knowledge step, < 900 ms, with a trail).
`test/career/mapping-spec/sign-table.test.ts` ties the table to the system's real state lists, so a new state breaks it.

## 4. Layout specification — `mapping-spec/layout-spec.json` (`MAPPING_LAYOUT_V1`)

Pure function `layout(pools, roles in rank order) → sectors + bodies`; no randomness, no clock; every number rounded to 6 decimals.

* **Angle = pool.** Pools sorted by name then id; sector share ∝ max(roles, ⌈6 % of all roles⌉, 1); 4° gap between sectors; start at the top.
  Inside a sector the i-th role (by rank) sits at `start + span · (0.05 + 0.9 · frac((i+1)·0.6180339887498949))`.
* **Distance = fit.** Checked (SEMANTIC) roles: `160 + (1 − fit) · 220`; name-only roles on the shelf: `430 + 50 · (1 − min(fit, 0.5)/0.5)`; the horizon is
  at 400, the person constellation inside 90, the field ends at 500. A role without requirements (fit null) sits at the far end of the shelf.
* **Size = requirement mass.** `ρ = clamp(3 + 2.2·√Σweights, 6, 16)`.
* **Collisions.** Bodies are placed in rank order at their fit position; if it is taken the search tries radial offsets 0, +1, −1 … ±6 steps (step = 2ρ+2)
  and, at each (radial is the outer loop), angular offsets 0, +1, −1 … ±30 steps of `step/distance` inside the sector, first free wins. Collision distance is ρ₁+ρ₂+2;
  overflow bodies take no part. **Bands (inclusive):** a checked role in `[160, 400−ρ]`, a shelf role in `[430, 500−ρ]`; a candidate outside is skipped. The full rule list is `layout-spec.json` → `search.rules`;
  the vectors LV08–LV11 press bodies against all edges (inner, horizon, field edge, and wide bodies that must not leave the field) so a product module cannot get them wrong and still match. If none is free the body is counted as `overflow`
  (placed on the overflow radius 520, **not drawn**; the interface shows "+n"). `displacement` records the step taken; a displaced body is
  approximate in distance, so quantitative statements always come from the data, never from the position.
* **Requirement ring.** Necessity order REQUIRED, PREFERRED, OPTIONAL, UNKNOWN, then weight descending, then id; arc length ∝ weight; 6° gaps (none for a single arc).
* **Person constellation.** Capabilities by name then key; one in the centre; otherwise rings of radius 30 / 52 / 74 filled in order; the rest is counted.
* **Golden vectors:** `layout-golden-vectors.json` — eleven layouts (single role, three pools with mixed tiers, equal-fit ties, 60 crowded, 320 roles
  beyond capacity, four edge-pressure vectors, no roles, and the **real shape** of 73 roles in 3 pools — structure only, no text — from the real run), four requirement rings, five constellations.
  Compare `x`/`y` of the vectors directly (recomputing them from the rounded angle and distance differs by up to ~4e-6). The reference oracle is `test/support/mapping/layout-reference.ts` (not product code); a product module must match the vectors within 1e-6.

Run-state note: the backend can report STALLED together with `resumePending = true` (an interrupted run inside its window); the field then stays frozen — a resume pulse is only for PARTIAL and FAILED.

## 5. Checks (phase A)

`test/career/job-pool/capability-key.test.ts`, `auto-match-gemini.postgres.test.ts` (keys equal the ids the provider was shown),
`auto-match.postgres.test.ts`, `test/career/mapping-spec/{sign-table,layout}.test.ts`. Layout promises tested on every vector: determinism
(also with shuffled input), no overlap, horizon, sector containment, fit-is-distance, capacity of the realistic shapes, size band.

## 6. Remaining integration relations (not built in phase A)

* Per-role "pending" is not in the ranking: the breath is a field-level mark while the run is RUNNING. A per-role mark needs the run's planned role list in the view.
* The MAPPING focus changes the field selector's two-button contract (`field-focus-strip`) — to be changed together with its contract tests in the navigation phase.
* The view-model builder (`MappingView`), the layout module, the time delta and the focus state machine are the product modules of phase B; they take the golden vectors as their contract.
* PERSON × JOB analyses (one selected job) have no ranking (`NOT_PERSON`); the mapping shows that single job as a degenerate field with the B2 portal (later phase).
