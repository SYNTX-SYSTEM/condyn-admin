# PERSON × JOB mapping field — phase D: the MAPPING field on its own stage, L0 to L3

Owner mandate `SFE::PERSON × JOB PHASE D` (OTTAVIO, 2026-11-05), **architecture decision: variant A**. Lane GELB owns this document and the
re-stated field-selector contract; GRÜN implements the frontend; PINK validates independently and inversely.

Base: `origin/main` **e360caf9**. Branch of this document: `architecture/mapping-phase-d`. No product file is changed by this commit.

Phase B stays the semantic foundation and is consumed byte-identical. Phase C is the starting point and is carried over, not rebuilt.

**State: REVIEWED — PINK GO on `86e36924`** (§11.6, evidence `20e059e9`). The GO covers the §5.1/§5.2 contract as delivered and is
document- and branch-local: it is **not** a merge or rollout authorisation, and the visual acceptance of the full stage is OTTAVIO's
and still open.

**Contract:** PINK holds C-1 … C-11 and D-1 … D-7 (2026-11-05, evidence commits e814e841 and 2ec50d79). D-5's exact
host-file pin is prospective and lands at GRÜN's delivery. GRÜN is released for §7.

§5.1 and §5.2 carry PINK's two corrections; §10 carries GRÜN's nine. Not implemented, not reviewed.

---

## 0. What is measured, not assumed

Three measurements bind this architecture. They are stated first because two of them limit what can honestly be drawn.

| Measurement | Value (2026-11-05, production `condyn`) |
|---|---|
| Job pools persisted | **2** — `DLL Enterprise Scale Pool` (48 roles, 290 requirements), `DLL Engineering & Architecture Pool` (9 roles, 79 requirements). `AI/Data` is **not** uploaded. |
| Provider budget | `GEMINI_JOB_CALL_LIMIT=0` → `readJobCallLimit` returns 0 → every reservation in `career_relation_call_ledger` is refused. |
| Ranking source | The automatic path exists only for a **PERSON** analysis. `PERSON_X_JOB` (one job) answers `NOT_PERSON` and carries no ranking. |

**Consequence of the budget, and it governs the whole field:** no SEMANTIC coupling can arise on this system. Every role is
`LEXICAL_ONLY` or carries no relation; every reading is `EvidenceClass = STAND_IN`. The SEMANTIC half of the sign vocabulary is
specified, implemented and **structurally unreachable in production**. The field must therefore say so permanently (§6, AUTHORITY),
and nothing may be drawn that suggests a model checked anything. The owner's sentence stands: *no invented semantic results.*

**Consequence of the ranking source:** the MAPPING field is the PERSON investigation seen against all pools. It is **not** the stage of
the `PERSON_X_JOB` investigation mode, despite the name. That mode keeps its own boundary and is untouched.

---

## 1. FIELD — one field, three apertures, one repeating unit

### 1.1 The stage

The MAPPING field becomes a third field on the shell's field membrane, beside CAPABILITY and FIELD, at full stage width. It is no
longer a 400 px slot inside `AutoJobRankingPanel`; the panel's `field` prop and its ranked list stay exactly as they are and keep
working without the field (phase C tested that path byte-equal).

Order on the membrane is **CAPABILITY · MAPPING · FIELD**. MAPPING sits in the middle because it *is* the relation between the two it
separates: the person on the left, the job on the right. The two existing options keep their ends, so `Home` and `End` still land
where they landed.

### 1.2 The repeating unit — why L0 to L3 is one structure, not four screens

The field has exactly one structural unit, drawn at four magnifications:

```
sector (pool)  ⊃  body (role)  ⊃  collar / ring (requirements)  ⊃  arc (one requirement's coupling)
```

| Level | Camera | Sectors | Bodies | Requirements | Couplings |
|---|---|---|---|---|---|
| **L0** | whole field (`fieldViewBox`) | all pools | all drawn roles, class line | **collar**: one tick per requirement, its own `arcLine` + `arcFill` | — |
| **L1** | one sector (`sectorViewBox`) | the open pool | same bodies, now with titles | same collar, larger | beams of the marked role |
| **L2** | one body (`roleViewBox`, new) | — | the opened role at the centre | the collar **is** the full requirement ring | every coupling as a beam to its constellation node |
| **L3** | one arc | — | — | the opened arc | its state, explanation, evidence limitation, verbatim quotes |

The collar at L0 and the ring at L2 are **the same data drawn with the same signs** — `couplingSign(class, state)` per requirement,
ordered REQUIRED → PREFERRED → OPTIONAL → UNKNOWN then weight descending then id, arc length ∝ weight. Nothing is aggregated,
summarised or averaged anywhere. That is what makes the recursion honest: going deeper magnifies, it never changes the meaning of a
mark, and it never reveals a different fact.

This is also the answer to the owner's requirement that **L0 already shows visibly different relations**. Phase C drew one line per
body (its class). Phase D draws, on the same body, one tick per requirement in that requirement's own state — so a role with three
exact name relations and four unevidenced requirements reads differently from a role with seven unevidenced ones, at L0, without a
number and without opening anything. With the measured data this is 6–7 ticks on a 6–16 unit body; at full stage width (§4, A2) that
is 11–29 px of body, which carries them.

### 1.3 What is preserved

The six orbits (`01` IDENTITY CORE, `02` CAPABILITY FIELD, `03` RESONANCE ORBITS, `04` ROLE MANIFESTATION, `05` TENSION FIELD,
`06` EVOLUTION PATHS), the JOB FIELD planetarium, `PxjFirstScreen`/B2 and the explicit job scope are untouched. The mapping's person
constellation is a reduction of orbit `02` and uses the **same capability ids**, so the two stay navigable into each other in a later
phase without being merged now.

---

## 2. RELATION — what is drawn, and from which already-existing value

Every channel below is read from `docs/architecture/decision-fields/mapping-spec/sign-table.json` (`MAPPING_SIGNS_V1`) through
`lib/career/mapping/signs.ts`. **Phase D adds no sign, no state and no channel.** It draws channels that phase C left undrawn.

| Channel | Source | L0 | L1 | L2 | L3 |
|---|---|---|---|---|---|
| `class` → body line | `CLASS_LINE[cls]` (built) | ● | ● | ● | ● |
| `arcLine` per requirement | `couplingSign(...).arcLine` | ● collar tick | ● | ● ring arc | ● |
| `arcFill` per requirement | `couplingSign(...).arcFill` | ● tick fill | ● | ● | ● |
| `beam` capability → arc | `couplingSign(...).beam` | — | ● marked role | ● all | ● the one |
| `phaseLocked` | `couplingSign(...).phaseLocked` | — | ● | ● | ● |
| `mark` (double, counterTick, alias, constituent) | `couplingSign(...).mark` | — | ● | ● | ● |
| `luminance` | table, **reinforcing only** | ● | ● | ● | ● |

Colour carries no state at any level. A state is told by `arcLine + arcFill + beam + mark`, never by colour or luminance alone — the
table's own principle, and PINK's inverse check should attack exactly it.

### 2.1 The beam — the coupling becomes visible

For the marked role (L1) or the opened role (L2), a beam is drawn from each constellation node whose `capabilityKey` couples a
requirement of that role, to that requirement's arc. The beam's form is the coupling state's `beam` value:

| Coupling state | Beam | Reads as |
|---|---|---|
| EQUIVALENT, COVERS | solid, phase locked | the model checked and the capability carries the requirement |
| PARTIAL | thin, phase locked | checked, carries it in part (`arcFill` 0.5) |
| UNCLEAR | broken, not phase locked | the model could not tell |
| DIFFERENT | **none** | the model checked and judged them different — the arc carries a counter-mark instead |
| NAME_EXACT, NAME_ALIAS | dotted, never phase locked, `arcFill` ≤ 0.5 | a name matched; nothing was checked |
| NAME_COMPOSITE_CONSTITUENT | faint dotted | a part of a name matched |
| WEAK_TOKEN_CONTAINMENT | **none** | a token was contained; too weak to draw a line of effect |
| NONE | **none**, open arc | not evidenced |

That DIFFERENT and NONE both have no beam but **different arcs** (open with counter-mark vs. open without) is the honesty rule, not an
oversight: *judged different* and *not evidenced* must never read alike. Nor may either read as *absent from the person*.

### 2.2 The inverse effect — the capability as the subject

`reverseView(view, capabilityKey)` exists in phase B and has no caller in any interface. Phase D gives it one: selecting a
constellation node lights every role it couples, **across all pools and at every level**, with the beams of §2.1. This is the most
direct statement of "semantic effect between person and jobs" the data allows, and it costs one already-implemented action
(`SELECT_CAPABILITY`) plus the lifting of phase C's whitelist.

Binding: the reverse view couples **only over `capabilityKey`**. A coupling without a key is never collected, whatever its name reads
like. A key that no PERSON capability carries is kept and marked `NOT_IN_PERSON`; it is not silently dropped.

### 2.3 Open positions

A requirement with no coupling is an **open arc with no beam** — at L0 an unfilled tick in the collar, at L2 a gap in the ring. Because
the ring begins at REQUIRED, the heavy open positions always lie first. There is no gap count, no coverage percentage and no red.

The sentence an open arc makes is *"not evidenced"* — never *"you lack this"*. The field never speaks about the person's abilities,
only about what the reading evidenced.

---

## 3. STATE — run states, and nothing new

No new state is introduced. The ten coupling states and the eight run states of `MAPPING_SIGNS_V1` cover the field.

The run's time sign stays at field level, as built: only `RUNNING` breathes (and only while `rolesEvaluated < rolesPlanned`), only
`STALLED` is frozen with a still sentence (also with `resumePending`), one quiet edge pulse for `PARTIAL`/`FAILED` while a
continuation is due. Under `prefers-reduced-motion` nothing breathes, pulses or travels and pending is a static dashed outline.

The empty readings keep their own sentences and are not drawn as an empty field: `NO_RANKING`, `NO_ROLES`, and the ranking states
`NOT_PERSON`, `PROJECTION_ABSENT`, `BOUNDARY_UNRESOLVED`, `NOT_PROVISIONED`, `ANALYSIS_NOT_FOUND`. Each says why, in its own words.

---

## 4. A2 and A3 — the two decisions the owner returned

### 4.1 A2 · full stage, readable bodies

Resolved by §1.1. At full stage the field radius 500 is drawn at roughly 900–1200 px, so the body radius band 6–16 becomes about
11–29 px on screen and the collar ticks are separable. Rules:

* **L0 carries no text except the pool names at the sectors.** Role titles appear from L1.
* Stroke widths are normalised to the camera (`k = box.width / DRAWN_PX`, as phase C already does) so a line stays about one pixel at
  every level.
* The overflow count ("+n not drawn · in the list") stays; overflow bodies are counted, never drawn at a wrong place.

### 4.2 A3 · stable position, and layout change told from evidence change

**The governing sentence: movement means evidence. Always, and only.**

The layout is a pure function of the whole ranking, so a body can take a new place because *another* role changed. That cannot be
removed without changing the layout function — and the layout function is pinned by the twelve golden vectors to 1e-6, which the owner
requires for visual validation. So phase D does not touch it. It makes the cause **visible and distinguishable** instead:

| Cause | How it is told | Drawn as |
|---|---|---|
| **EVIDENCE** — the body's own `ROLE_TIER_CHANGED` or `ROLE_FIT_CHANGED` | `diffRankings` names this body | moves ≤ 0.8 s with a trail fading in 0.9 s; several changes of one reading are one movement |
| **LAYOUT** — position differs, no own evidence change (a neighbour moved, a role was added) | position differs, delta does not name it | **takes its new place with no transition and no trail**; carries `data-layout-shift="true"` and a quiet static mark |
| **NONE** — same position, no change | — | nothing |

`bodyMovements` already returns `moved` only for the EVIDENCE case, and phase C's `F-RC-T1` pins that every other body carries
`transition: none`. Phase D makes the third value explicit rather than implicit, so that a LAYOUT shift is *stated* instead of merely
not animated, and names it at field level in one quiet line: *"n bodies took a new place without their own evidence changing."*

Additionally, `displaced` (a body moved off its fit position by the collision search) stays as it is and gets a visible, still mark
with the sentence *"place approximate — quantities come from the data"*. A displaced body's distance must never be read as a value.

**What this buys:** the viewer can always answer "did something change about *this* role, or did the picture just rearrange?" without
asking anyone. That is the whole of A3.

---

## 5. BOUNDARY — what phase D may touch, and the re-stated contract

### 5.1 The field-selector contract, re-stated (GELB ↔ PINK)

The contract of `field-focus-strip` was two buttons. It becomes three. Everything below is restated so the whole contract stands in
one place.

> **Correction (PINK, 2026-11-05).** An earlier revision of this section claimed "exactly one assertion changes". That was **false**,
> and I verified PINK's finding against the files at `e360caf9` rather than against my own prose. **Three** existing assertions
> hardcode the two-button strip, all three in files this section already listed as reached:
>
> | Site | Assertion |
> |---|---|
> | `test/career/job-pool/job-scope-ssr.test.tsx:60` | `expect(strip(html).match(/<button/g)).toHaveLength(2)` |
> | `test/job-pool-validation/syntx-walk.e2e.test.ts:911` | `expect(await page.locator('[data-testid="field-focus-strip"] button').count()).toBe(2)` |
> | `test/job-pool-validation/support/syntx-readonly-walk.mjs:193` | `check("strip has two buttons", … === 2)` |
>
> Plus two stale artifacts that are not assertions but would outlive the change and mislead a later reader:
> `syntx-walk.e2e.test.ts:925` writes the evidence string `"strip buttons: field-focus-capability-btn, job-pool-panel-toggle"`
> (missing the new id), and the `describe` title at `job-scope-ssr.test.tsx:51` names the "two-button strip".
>
> Had the table stood as written, GRÜN would have fixed one site and left two red — or, worse, read the surviving two-button
> assertions as still binding.

> **Correction to C-8 (GRÜN, 2026-11-05).** An earlier revision ended C-8 with *"Enter/Space choose. Focus ≠ selection"*. That
> sentence belongs to `SyntxInvestigationSelector` — the investigation membrane, whose manual-activation model is a documented
> decision (V-12) — and I imported it into the field strip by mistake. `SyntxFieldSelector.tsx:129-134` does the opposite: an arrow
> key calls `select(next)` and then moves the DOM focus, so **the strip selects on arrow today**, and no test covers it.
>
> Implementing C-8 literally would therefore have changed the behaviour of the two existing options, untested and unnoticed, while
> the contract's purpose is only to admit a third field. C-8 now preserves select-on-arrow. The one genuine change is that stepping
> runs over three positions instead of jumping between two ends, which is unavoidable once there is a middle.
>
> PINK cleared C-8 on the question it was asked — that the new stepping breaks no existing test, which holds either way. This
> correction changes what C-8 *says the strip does*, so PINK re-reads it.

| # | Clause | Status |
|---|---|---|
| C-1 | One element `[data-testid="field-focus-strip"]` carries `data-field-focus` with the current focus | **unchanged** |
| C-2 | `data-field-focus` ∈ `CAPABILITY` \| `MAPPING` \| `FIELD` | **extended** (was two values) |
| C-3 | The strip holds **exactly three** buttons. **Every** strip button-count assertion goes 2 → 3, at all three sites named above, and the two stale artifacts are corrected with them | **changed** |
| C-4 | Button ids: `field-focus-capability-btn`, **`field-focus-mapping-btn`** (new), `job-pool-panel-toggle` | **extended**; the two existing ids are **not renamed** |
| C-5 | Order on the membrane: CAPABILITY, MAPPING, FIELD | **new** |
| C-6 | Each button carries `data-field-focus-active` and `aria-pressed` | **unchanged** |
| C-7 | The job-scope indicator stays a shell element **outside** the strip | **unchanged** |
| C-8 | Keyboard: ←/→ move **by one position and select**, skipping a gated option; `Home` → CAPABILITY, `End` → FIELD, both selecting. Select-on-arrow is the strip's existing behaviour and is **preserved** | **extended** (stepping over three), endpoints and activation model unchanged |
| C-9 | URL `focus=MAPPING` opens the mapping field; `FIELD`/`JOB`/`POOL` stay aliases of FIELD; anything unknown stays CAPABILITY | **extended** (`career-demo-url.ts`) |
| C-10 | MAPPING is **gated** when no PERSON ranking can be shown, using the existing closed-gate pattern (`capabilityGated` / UX-04 reason-and-way), with reasons `NO_ANALYSIS`, `NOT_PERSON`, `NO_RANKING`, `NO_POOL` | **new** |
| C-11 | A gated option cannot be selected, states its reason and its way, and is not merely disabled in silence | **unchanged pattern** |

Files the re-statement reaches: `SyntxFieldSelector.tsx`, `SemanticCareerIntelligenceField.tsx`, `career-demo-url.ts`,
`test/career/job-pool/job-scope-ssr.test.tsx`, `test/job-pool-validation/job-scope-gate.e2e.test.ts`,
`test/job-pool-validation/syntx-walk.e2e.test.ts`, `test/job-pool-validation/support/syntx-readonly-walk.mjs`.

**PINK holds C-1 … C-11 from the moment they are accepted.** Until then this table is a proposal.

### 5.2 The phase base and MAP-D-ARCH

`PHASE_C_BASE` is `5ca0f3f5`; `main` is `e360caf9`; `test/career/mapping-field/architecture.test.ts` (MAP-C-ARCH) is consequently red.
That is the designed re-statement point, not a defect — the test exists to force exactly this moment. It is red for the right reason:
the FINAL INTEGRATION round touched `app/api`, `lib/career/job-pool` and `lib/career/result-inspector`, all protected against
`5ca0f3f5`, and re-pinning is how those authorised changes are accepted.

**`PHASE_D_BASE = e360caf9`.**

> **Correction (PINK, 2026-11-05).** An earlier revision said the phase-C logic was "carried over unchanged, only the base moves".
> That was **false**, and I verified it in `architecture.test.ts` at `e360caf9`. The change-set *algorithm* carries; the guard's
> path sets and content assertions do **not**, and moving the base does not fix them because they are hardcoded, not base-relative.
> Four of the seven assertions invert or contradict phase D outright. A one-line base swap would have produced a guard that forbids
> precisely what phase D is mandated to build.

MAP-D-ARCH is therefore stated explicitly, assertion by assertion. **D-1, D-6 and D-7 carry verbatim from phase C; D-2 … D-5 are
re-stated.**

| # | Assertion | Status vs. phase C |
|---|---|---|
| **D-1** | The engine and its specification are byte-identical to the base: `lib/career/mapping`, `mapping-spec/`, `PERSON_X_JOB_MAPPING_SPEC.md` — committed, staged, unstaged and untracked | **verbatim.** `lib/career/view-model/mapping-field.ts` is a different directory from `lib/career/mapping`; there is no collision |
| **D-2** | Protected paths unchanged against the base — the phase-C list **minus three carve-outs**: `SyntxFieldSelector.tsx` leaves protection (it is now a phase-D entry point, C-4), `lib/career/ui` is protected **except** `lib/career/ui/career-demo-url.ts` (C-9), and `app/components/career/demo/career-demo-layout.ts` leaves protection (D-Q13, additive only). Everything else carries, `lib/career/job-pool`, `app/api` and `lib/career/result-inspector` included — now at their `e360caf9` state | **re-stated (a)**, third carve-out added 2026-11-05 |
| **D-3** | Phase-D change sets: every non-merge commit after the base whose files include a phase-D file may change only phase-D files, and the working tree joins as a pending set once it touches one. **The phase-C artifacts are baseline at `e360caf9`**, so `mapping-field.ts`, `PersonJobMappingField.tsx` and `mapping-field-copy.ts` move from *new files* to **entry points**. The four contract files of §5.1 are phase-D-editable, or a commit bundling a contract fix with a field change would trip the "only phase files" rule | **re-stated (b)** |
| **D-4** | `AutoJobRankingPanel.tsx` is **not** an entry point. D-Q4 keeps it untouched, so it equals the base and moves **into** D-2's protected set. The stale `+`/`−` pin on it is removed, not updated | **re-stated (c)** |
| **D-5** | The entry-point diff pins — **four surfaces at delivery**: `SemanticCareerIntelligenceField.tsx`, `CareerIntelligenceDashboard.tsx` (exactly two type widenings, `:82` untouched) and `career-demo-layout.ts` (four additive changes, **no existing line altered**, D-Q13/D-Q16) and the **narrowed T-07 seal**, which is held by PINK's independent re-derivation and mutants rather than by a diff pin (D-Q15). `SemanticCareerIntelligenceField.tsx` is pinned to the removal of the `field={…}` prop (D-Q4) and the mount of the MAPPING stage, and nothing else. **The exact lines are fixed when GRÜN delivers, by GELB, and then held by PINK** — they are not invented here, because inventing them would pin a shape nobody has written yet | **re-stated (c)** |
| **D-6** | The model is pure: no React, no fetch, no clock, no randomness, no timer, no storage, no `window`; engine and spec only | **verbatim** |
| **D-7** | The read-only envelope: no fetch, no POST, no URL or history write, no storage, **no job scope**, no model call — in the model, the component and the copy | **verbatim.** This is what carries B-3/B-4, and §8.8 and §8.11 rest on it |

**The inverted assertion, stated plainly.** Phase C's last assertion — *"phase C names no action that opens a role or a requirement,
or selects anything"* — is the exact negation of phase D. §7 lifts `FIELD_ACTIONS`, §2.2 drives `reverseView` through
`SELECT_CAPABILITY`, and L2/L3 exist only through `OPEN_ROLE` and `OPEN_REQUIREMENT`. Phase D therefore **admits the full
`FOCUS_ACTIONS` set of the phase-B machine**, `MARK_REQUIREMENT` included — marking an arc at L2 is the exact analogue of marking a
body at L0, and withholding it would be an arbitrary stop.

That makes the action whitelist no longer the thing that enforces the boundary. **D-7 is.** B-3 is kept by the absence of a job
scope anywhere in the field — not by withholding an action from a focus machine that never had a scope to write. The explicitly
forbidden names stay forbidden: no `SELECT_ROLE`, `SELECT_JOB`, `SELECT_POOL` or any `jobScope` in the model, the component or the
copy.

PINK holds D-1 … D-7 together with C-1 … C-11.

### 5.3 Unchanged, and tested as unchanged

`lib/career/mapping/` (the phase-B engine, byte-identical), `docs/architecture/decision-fields/mapping-spec/` (sign table, layout
spec, golden vectors), `PERSON_X_JOB_MAPPING_SPEC.md`, the six orbits, the planetarium (`manifestation/`, `SyntxField`), B2
(`PxjFirstScreen`, `pxj-first-screen.ts`, `useRoleInvestigation`), `lib/career/ui`, `lib/career/job-pool`,
`lib/career/capability-core`, `app/api`, and the whole backend.

**The job scope is written by nothing in this field.** B-3 and B-4 stand: opening is a look, selecting stays the JOB FIELD's explicit
action. The focus machine has no field for a scope and gets none. L2 may *offer* the B2 portal as an explicit action; it may never
perform it.

---

## 6. AUTHORITY

"Ranking, no decision" stands with the field (`authorityState: "NONE"`), and the evidence class stands with it (B-6). No new figure
enters the field: no percentage, no fit number, no coverage score, no claim word.

**While `GEMINI_JOB_CALL_LIMIT=0`,** the field carries a permanent, plainly worded line stating that no semantic check took place and
that every relation shown rests on names only. Without it, a fully drawn field of dotted arcs reads like a result. This line is not a
warning banner and not an alarm; it is the reading's provenance, in the same register as the evidence class.

Evidence class is a property of the **reading**, not of a role: `RoleRanking.evidenceClass` is one value for the whole ranking.
Phase D therefore shows it at field level and does **not** vary it per body — drawing a per-body difference would invent a
distinction the data does not carry. The owner's requirement that L0 show evidence classes is met by the field-level statement plus
the per-requirement relation signs of §1.2; if a per-role evidence class is wanted, it needs a backend change and a new owner mandate.

---

## 7. DELTA — the minimal change set, for GRÜN

| File | Kind | What |
|---|---|---|
| `lib/career/view-model/mapping-field.ts` | change | lift `FIELD_ACTIONS` to admit `OPEN_ROLE`, `OPEN_REQUIREMENT`, `SELECT_CAPABILITY`; `fieldLevel` → L0…L3; new `roleViewBox`; per-body requirement projection (collar/ring); beam model from `couplingSign().beam`; `bodyMovements` → three-valued `EVIDENCE` \| `LAYOUT` \| `NONE` |
| `app/components/career/demo/PersonJobMappingField.tsx` | change | full stage; collar at L0/L1; ring at L2; beams; marks; L3 evidence view; layout-shift mark; reduced-motion paths |
| `app/components/career/demo/SyntxFieldSelector.tsx` | change | third option, gate, keyboard over three (contract C-1…C-11) |
| `app/components/career/demo/SemanticCareerIntelligenceField.tsx` | change | MAPPING stage mount; the ranking panel keeps its `field` prop and its list |
| `lib/career/ui/career-demo-url.ts` | change | `focus=MAPPING` (C-9) |
| `app/components/career/demo/CareerIntelligenceDashboard.tsx` | change | two type widenings only, no logic change (D-Q10) |
| `app/components/career/demo/career-demo-layout.ts` | change | four additive changes: the `mapping-gate` marker, clearance over both lines, a **new** intake rule beside the byte-identical existing one, the narrow-tier order (D-Q13, D-Q16) |
| `test/career/pxj-first-screen/person-markup.test.tsx` + its fixture | change | T-07: narrow the hash by two elements, digests re-derived from a render at `49e2bc6` (D-Q15) |
| `app/components/career/demo/mapping-field-copy.ts` | change | EN/DE for L2/L3, open positions, evidence limitation, the budget sentence, the layout-shift line |
| `test/career/mapping-field/phase-base.ts` | change | `PHASE_D_BASE = e360caf9` (§5.2) |
| `test/career/mapping-field/architecture.test.ts` | change | MAP-D-ARCH: D-1 … D-7 of §5.2, replacing the phase-C guard |
| `test/career/mapping/architecture.test.ts` | change | the phase-B "engine unchanged" test binds to `PHASE_D_BASE` |
| `test/career/mapping-field/*`, `test/career/mapping-spec/*` | add | the proofs of §8 |
| `test/career/job-pool/job-scope-ssr.test.tsx` | change | C-3 (`toHaveLength(2)` → `3`), the `describe` title at :51 |
| `test/job-pool-validation/syntx-walk.e2e.test.ts` | change | C-3 (`.toBe(2)` → `3` at :911), the evidence id string at :925 |
| `test/job-pool-validation/support/syntx-readonly-walk.mjs` | change | C-3 (`=== 2` → `3` at :193) |
| `test/job-pool-validation/job-scope-gate.e2e.test.ts` | change | the third focus value and the gated MAPPING option (C-2, C-10) |

The phase-B engine is not touched in any of it. Everything new is composition and drawing.

**Out of scope for phase D, by the owner's instruction (no additional functions):** merging the mapping with orbit `02`, a per-role
pending mark, the degenerate `PERSON_X_JOB` single-job field with the B2 portal, any capability editing, any write path, any backend
change, and any change to the ranking formula.

---

## 8. PROOF — what PINK should attack, inversely

Not "does it look right". The questions that can falsify this field:

1. **Sign fidelity.** For each of the ten coupling states: is the drawn `arcLine`, `arcFill`, `beam`, `phaseLocked` and `mark`
   exactly the table's, and nothing else? Mutate one cell of the table and verify the drawing changes with it.
2. **No beam where the table says none.** DIFFERENT, WEAK_TOKEN_CONTAINMENT and NONE must never draw a line of effect.
3. **Three distinguishable absences.** DIFFERENT, UNCLEAR and NONE must differ in `arcLine` + `mark` and not only in luminance.
4. **Lexical weakness is structural.** No name relation is ever phase locked, ever fully filled, or ever drawn solid — at any level.
5. **Colour carries nothing.** Render every state in greyscale; every distinction must survive.
6. **Recursion identity.** The collar tick of requirement *q* at L0 and the ring arc of *q* at L2 must resolve to the same
   `couplingSign` call. A magnification may not change a meaning.
7. **Reverse view purity.** `SELECT_CAPABILITY` must collect only couplings whose `capabilityKey` equals the selected key — never one
   that merely shares the capability's name, and never one with a null key.
8. **No scope write — driven, not grepped.** No path of the field, at any level, including the offered B2 portal, writes the job
   scope, the URL or history. **This proof must EXERCISE the actions phase D newly admits** — `OPEN_ROLE`, `OPEN_REQUIREMENT`,
   `SELECT_CAPABILITY` and `MARK_REQUIREMENT`, the last two at L2 — and assert that nothing was written. A grep for absent write
   calls is not enough (PINK's condition on the hold, 2026-11-05): phase D removed the action whitelist that used to carry B-3, so
   the proof has to rest demonstrably on D-7 and on the structural absence of a scope in the focus machine. A claim that rests on a
   guard that no longer exists is weaker than it reads.
9. **A3.** A reading in which role X's fit changes and role Y only shifts position: X animates with a trail, Y does not, Y carries
   `data-layout-shift`, and the field states the count. The inverse mutant (Y animating) must turn it red.
10. **Golden vectors.** All twelve layout vectors still match to 1e-6 after phase D; the drawn positions are the layout's output 1:1.
11. **Budget honesty.** With `GEMINI_JOB_CALL_LIMIT=0`, nothing anywhere in the field asserts or implies a semantic check, and the
    provenance line is present at every level — including while the newly admitted actions are driven (§8.8), so that opening a role,
    opening a requirement or selecting a capability cannot reach a state in which the line is lost.
12. **Level round trip.** L0 → L1 → L2 → L3 → UP ×3 returns the identical focus state object.
13. **Empty and error readings.** Each of `NO_RANKING`, `NO_ROLES`, `NOT_PERSON`, `PROJECTION_ABSENT`, `BOUNDARY_UNRESOLVED`,
    `NOT_PROVISIONED`, `ANALYSIS_NOT_FOUND` states its own reason and is not drawn as an empty field.
14. **Contract C-1 … C-11**, including the gated MAPPING option's reason and way, that the two pre-existing button ids did not move,
    and that **no** two-button assertion survives at any of the three sites of §5.1.
15. **Preservation, MAP-D-ARCH D-1 … D-7, and the narrowed seal (D-Q15).** PINK's five inverse checks on T-07 — independent
    re-derivation at `49e2bc6`, out-of-exclusion mutant, vacuity mutant, exclusion exactness, asymmetry — are part of this item.
    The intake clearance is checked in all three line states (D-Q16). Orbits, planetarium, B2, job scope, job pool, capability core, `app/api` and
    `lib/career/ui` (except `career-demo-url.ts`) byte-identical against `PHASE_D_BASE`; `AutoJobRankingPanel.tsx` byte-identical
    (D-4); the engine and spec byte-identical (D-1); the read-only envelope intact (D-7).
16. **Execution, not exit code (D-Q8).** Every e2e result claimed for §8.14 records that the suite executed — the resolved
    Playwright module and the per-case results. A skipped suite is reported as a gap, never counted as a pass.
17. **The capsule ceiling (D-Q14), measured not computed.** At the tested viewports **and in both locales** the strip's right edge
    lies left of the investigation membrane's left edge **by at least 12 px**, and the job-scope indicator's right edge lies left of
    the strip's left edge. A bare `<` is not the assertion: a 2 px pass is inside rendering variance.
18. **The ring-order overflow (D-Q3).** An implementation that drops collar arcs by index, or merges several light requirements into
    one tick, must turn a test red. What is counted away is always the lightest and least necessary, never an arbitrary pick.

PINK's mutant method from phase C §7 is the right instrument for 1, 2, 4, 7 and 9: apply the mutant, show the test red, restore.

---

## 9. RECONSTRUCTION

Every statement here is reconstructable from four sources, and nothing in it was invented:

* `PERSON_X_JOB_MAPPING_SPEC.md` — the seven bindings B-1…B-7, the `capabilityKey` data contract, the three layout operators.
* `mapping-spec/sign-table.json` and `layout-spec.json` with `layout-golden-vectors.json` — the ten coupling states, the eight run
  states, the honesty rules, the geometry (field 500, person 90, best fit 160, horizon 400, shelf 430–480, constellation rings
  30/52/74), the twelve vectors.
* `lib/career/mapping/{view,layout,signs,delta,focus}.ts` — the engine, including `reverseView` and all four focus levels, which exist
  and are tested today.
* `PERSON_X_JOB_MAPPING_PHASE_C.md` §1–§8 — what was built, what was deliberately refused, and the open items A2 and A3.

The three measurements of §0 are reproducible on the server: a count of `career_job_pool_uploads`, `readJobCallLimit` against
`.env.local`, and the `JobRankingState` surface in `lib/career/ui/auto-match.ts`.

---

## 10. Decided bindings (GRÜN's questions, 2026-11-05)

GRÜN asked seven architecture questions before building. The answers are bindings and therefore stand here, not only in the
hand-over. Each is numbered as GRÜN numbered it.

### D-Q1 · The provenance line hangs on the reading, never on the configuration

**Bound: source (a) — the content of the reading.** The line appears when the reading holds at least one requirement and **no**
requirement in it has `source: "SEMANTIC"`. It then stands at every level, and it speaks about the reading:

> *"In dieser Lesung fand keine semantische Prüfung statt; jede gezeigte Beziehung beruht nur auf Namen."*

Under `GEMINI_JOB_CALL_LIMIT=0` the condition is always true, so the line is in practice permanent — but it is permanent **because
the reading says so**, not because a server value was asserted from the browser. On a fixture with SEMANTIC couplings it falls away
by itself, which is exactly right.

The requirement-count guard matters: a reading with no requirements at all would otherwise carry the line vacuously. An empty reading
speaks with its own sentence (`NO_RANKING`, `NO_ROLES`, §3), never with this one.

**`autoMatch.budget.callsJobLimit` must NOT be used for this.** It is `null` before any call is registered, so it cannot tell "limit
is 0" from "no call has happened yet". A sentence built on it would be a guess dressed as a fact. Forbidden here.

Note on a partial run: while a run is `RUNNING`, some requirements may already carry SEMANTIC and others not. The line then correctly
disappears, and the not-yet-evaluated relations are told by their own signs plus the pending breath. That is the honest reading.

### D-Q2 · A beam needs a drawn start point; three cases have none

Approved as proposed, extended by the third case GRÜN did not name.

| Case | Beam | What the field says instead |
|---|---|---|
| The capability is in the **constellation overflow** (counted, not drawn — capacity is 13 + 23 + 33 = **69** nodes over the rings 30/52/74 at spacing 14) | **none** | the arc keeps its own sign unchanged; a quiet count names the undrawn sources |
| `keyStatus: NOT_IN_PERSON` — a key no PERSON capability carries | **none** | at L2/L3 the arc names the coupling's capability name with *"not in the person"* |
| `keyStatus: ABSENT` — `capabilityKey` is null (an older payload) | **none** | at L3 the arc says the **key** is absent — never that the relation is absent |

The governing rule behind all three: **a missing beam says "this cannot be drawn", never "this does not exist".** The arc's own sign
is never weakened to compensate for a start point the field could not place.

### D-Q3 · The collar and the ring are one output

Confirmed exactly as proposed. `layoutRequirementArcs` is called **once** per role; L0/L1 draw its output at the body's radius, L2
draws the same output at the ring's radius. Order, gap (6°) and start (−90°) come from `layout-spec.json` → `arcs`; there is no second
ordering and no second tick algorithm anywhere. One `couplingSign` call per requirement, and proof §8.6 checks that identity.

**One rule phase D must add, because L0 bodies are small.** When a body's circumference cannot carry all its arcs at the legible
minimum, L0 draws the arcs it can **in ring order** and counts the rest as `+n`, exactly like the existing body-overflow convention.
Because ring order begins at REQUIRED and then descends by weight, what goes uncounted is always the lightest and least necessary —
never an arbitrary pick, never a merge, never an average. With the measured data (290 requirements over 48 roles, 79 over 9) this is
about 6–9 arcs per body and will rarely trigger; it must still be specified, or a product module will invent its own answer.

### D-Q4 · One field, not two

Confirmed as proposed. `AutoJobRankingPanel` stays **unchanged** — it keeps its optional `field` prop and its ranked list, and the
phase-C proof that it renders byte-equal without `field` keeps holding. `SemanticCareerIntelligenceField` no longer passes `field`,
so the small panel field disappears and the full stage is the only mapping field. Two fields side by side would be two answers to one
question.

This changes the exact-diff-tested phase-C line in the host file. That is expected and is precisely what §5.2's re-pin covers: the
phase-C tests were built to go red at this moment and to force the boundary to be said again.

### D-Q5 · The three-valued movement, settled

Approved as proposed, with two additions:

* `LAYOUT` applies only to a body **drawn in both readings** whose position differs while the delta names no `ROLE_TIER_CHANGED` or
  `ROLE_FIT_CHANGED` of its own. A `displaced` change (the collision search moved it) is a position difference and therefore `LAYOUT`.
* A body that appears, or comes out of overflow, is `NONE` and carries no trail. A body that goes **into** overflow between readings
  is not a movement at all — it is an absence, told by the overflow count, never by a body sliding out of the field.
* Equal position in the same analysis is `NONE`; across analyses everything is `NONE` (phase C's T2 stands unchanged).

### D-Q6 · The e2e environment

(a) is the right answer and is approved **as architecture**: a real `node_modules` in a fresh worktree, because Turbopack refuses the
symlink and the contract files of §5.1 need a running Next server. It touches no production path, no foreign application and no
boundary of the hardlock — it is ordinary local engineering. If GRÜN's own permission frame blocks the install, that is GRÜN's to
surface to the owner; it is not to be routed around, and (b) — adapting the e2e files without ever running them — is then the stated
fallback, reported as a gap rather than passed off as covered.

### D-Q7 · Workplace

Approved. Branch `frontend/mapping-phase-d` from `origin/main` `e360caf9`, in a new worktree
`/home/codi/Entwicklung/condyn-admin-mapping-d` with a **real** `node_modules` (see D-Q6). `condyn-admin-mapping-b` stays untouched.
### D-Q8 · A skipped e2e suite is a gap, never a pass

Found by GRÜN while preparing the environment, and it bears directly on proof §8.14. **Playwright is not a project dependency.** The
e2e files resolve it through `CONDYN_PLAYWRIGHT_MODULE`; without that variable they **skip** rather than fail. A run reported as
green without it therefore proves nothing at all.

**Bound:** every e2e result claimed for phase D must record that the suite *executed* — the resolved module path and the per-case
results — not merely that the run exited 0. A suite that skipped is reported as a **gap**, in those words, and never counted toward
§8.14. This applies to whoever runs it, GRÜN or PINK.

The one installation on this machine lives in another project (`nquiry`, playwright 1.63.0). Referencing it read-only and
process-locally is acceptable; nothing in that project is changed and nothing is set globally.

### D-Q9 · Phase-D runs write their evidence to their own directory

The e2e suite writes screenshots and JSON under `docs/architecture/decision-fields/evidence/job-scope-gate-<TIP>`, and `TIP` defaults
to `cb3d33f` — a **past phase's checked-in evidence**. A phase-D run with the default overwrites it. GRÜN observed exactly that (14
files overwritten, 5 added) and restored them.

Two reasons this must not happen again, and the second is the harder one:

1. Another phase's evidence is that phase's proof. Overwriting it destroys the record a later reconstruction depends on.
2. **D-3 trips on it.** Files under `docs/.../evidence/` are not phase-D files, so a change set carrying them violates "every
   phase-D change set changes only phase-D files". The boundary forbids it independently of the hygiene argument.

> **Correction (GRÜN, 2026-11-05).** An earlier revision of D-Q9 bound only `JOB_SCOPE_TIP` and said the evidence is "not
> committed". Both halves were insufficient, and I verified GRÜN's finding in the code rather than accepting it.
>
> First, a tip variable only changes the directory **name**; the directory still lands under `docs/…/evidence/`. D-3's working-tree
> set is built with `git ls-files --others --exclude-standard` (`architecture.test.ts:49`), so **untracked** files count. An
> untracked evidence directory therefore trips D-3 in that working tree the moment it also holds a phase-D file — *without any
> commit at all*. Not committing is not enough. Second, there is more than one writer.

**Four writers, and only two have a switch.** This is a property of the existing suites; phase D works around it and changes none of
them, since three of the four are not phase-D files.

| Writer | Destination | Switch |
|---|---|---|
| `job-scope-gate.e2e.test.ts:46` | `evidence/job-scope-gate-<tip>` | `JOB_SCOPE_TIP`, default `cb3d33f` |
| `syntx-walk.e2e.test.ts:46` | `evidence/syntx-walk-<tip>` | `SYNTX_WALK_TIP`, default `9e86d44` |
| `syntx-readonly-walk.mjs:13` | `argv[2]`, default `./evidence` | the path is an **argument** |
| `live-browser-workflow.e2e.test.ts:34` | `evidence/job-pool-validation` | **none — hardcoded** |

**Bound, in three parts:**

1. **Never overwrite another phase's evidence.** Phase-D runs set **both** `JOB_SCOPE_TIP` and `SYNTX_WALK_TIP` to the phase-D tip,
   and pass an explicit output path to `syntx-readonly-walk.mjs` so it writes outside the repository in the first place.
   `job-scope-gate-cb3d33f` and `syntx-walk-9e86d44` stay exactly as checked in.
2. **Never leave evidence in the working tree, and clean surgically.** After each run the evidence directory is moved out of the
   repository into the session scratchpad and reported by path. Nothing is committed, and **MAP-D-ARCH is run only on a working tree
   cleaned that way** — otherwise it is red for the test harness's own output, which would be a false finding and would teach
   everyone to ignore it.

   **The clean is by exact path, never blanket** (PINK's refinement on the hold, 2026-11-05). Only the enumerated outputs are moved:
   `evidence/job-scope-gate-<tip>`, `evidence/syntx-walk-<tip>`, the readonly walk's given output path, and `evidence/job-pool-validation`
   if it was ever produced. **Never `git clean -fdx`, never a wildcard.** D-3 exists to catch stray untracked files; a broad clean
   blinds it to exactly the thing it is for. Any other untracked file in the tree is a **real finding** and must not be swept away to
   make MAP-D-ARCH green.

   **Run order,** because both errors are possible: e2e run → capture the §8.16 execution proof → move the enumerated evidence to the
   scratchpad → MAP-D-ARCH on the surgically cleaned tree. Cleaning earlier loses the execution proof; cleaning later or more broadly
   gives a false D-3 result in either direction.
3. **`live-browser-workflow.e2e.test.ts` is not part of phase D's proof surface.** Its destination is hardcoded, so it cannot be
   redirected without editing a non-phase-D file, which D-3 forbids. It is not run here. That is a stated limitation of this phase,
   not a silent omission: if a later phase needs it, it needs a switch first.

### D-Q10 · `CareerIntelligenceDashboard.tsx` is a phase-D entry point (a file §7 was missing)

GRÜN found a gap in §7 and D-3, not a question: `focus=MAPPING` cannot reach the host at all without it. The dashboard types
`fieldFocus?: "CAPABILITY" | "FIELD"` (`:17`) and holds `activeField` as `useState<"CAPABILITY" | "FIELD">` (`:41`), so widening
`CareerDemoUrlProps.fieldFocus` (C-9) breaks the type at page → dashboard. Verified at `e360caf9`.

**Bound:** `app/components/career/demo/CareerIntelligenceDashboard.tsx` is a phase-D entry point under D-3 and D-5. It is **not** in
D-2's protected set, so no further carve-out is needed. Its change is **two type widenings to `"CAPABILITY" | "MAPPING" | "FIELD"`
and nothing else** — no logic change.

**The shell mark stays the person mark for MAPPING** — the existing `else` branch at `:82`, untouched. GRÜN's alternative (giving
MAPPING the DLL mark like FIELD) is refused: it is a logic change the contract does not ask for, and it would be wrong anyway. The
MAPPING field *is* the PERSON investigation seen against all pools (§0); the person belongs on it.

### D-Q11 · Where the gated MAPPING states its reason

**The shared fixed-column container is refused, and by measurement rather than taste.**
`test/career/pxj-first-screen/field-entry-state.test.tsx:247` asserts the existing line's style contains
`"position:fixed;right:28px;top:128px"` — exactly. That file is **not** a phase-D file, so D-3 forbids editing it, and moving the
positional style into a container would break it. The boundary decides this one.

**Bound:** a separate element with its own id `mapping-gate-reason` (`role="status"`,
`data-gate="NO_ANALYSIS|NOT_PERSON|NO_RANKING|NO_POOL"`, cause + way), with the MAPPING button carrying `disabled`/`aria-disabled`,
`aria-describedby="mapping-gate-reason"` and a `title` of the same text — the existing pattern, as GRÜN proposed. The existing line
keeps its content, its ids **and its positional style**, untouched.

Two constraints on the placement, both measured:

1. **The new line must not carry `data-sx-shell="gate-reason"`.** `applyCareerDemoEntryClearance` finds *the* line by that selector
   (`entry-clearance-wiring.test.tsx:32`) and measures its box to set `--sx-entry-clear`; a second element with the same marker would
   change which element is measured and silently move the intake panel.
2. **The two lines must never overlap, at any viewport.** They can be shown together — the capability gate and the MAPPING gate are
   derived from different conditions. A hardcoded top that collides when the first line wraps to two lines is not acceptable.

The mechanism inside those two constraints is GRÜN's to choose. If the only workable one needs a non-phase-D file, it comes back
here before it is built. Not under the capsule centre, per PINK §3.82 F-SEM-1.

### D-Q12 · Gate semantics

(a), (b) and (c) approved as GRÜN derived them, with one gap closed.

* **(a)** A requested but gated MAPPING behaves exactly like `capabilityGated`: the Job Field is active, the request is remembered,
  and the field returns to MAPPING when the gate opens. Reusing the existing pattern is right; inventing a second one would not be.
* **(b) The reasons need a deterministic order, which the derivation did not state.** Several can hold at once. **First match wins,
  in this order: `NOT_PERSON` → `NO_ANALYSIS` → `NO_RANKING` → `NO_POOL`.** The boundary is named before the absence, and the
  absence before the detail. `NO_ROLES` is **not** a gate reason: the gate is open and the field says its own sentence (§3).
* **(c)** `field-entry-state.ts` is not a phase-D file, so `fieldEntryState` receives `"FIELD"` for MAPPING and the entry line reads
  `PERSON_OPEN`. GRÜN's reasoning is accepted: one is indeed not in the Capability Field, so the line is true as it stands.
* **(d)** See the C-8 correction in §5.1. Select-on-arrow is preserved; the sentence GRÜN queried was imported from the wrong
  selector and is withdrawn.

### D-Q13 · M1: `career-demo-layout.ts` becomes a phase-D entry point (a carve-out from the held D-2)

GRÜN brought back the finding I asked for: inside the two constraints of D-Q11 **there is no placement at all**. Verified at
`e360caf9`:

* `career-demo-layout.ts:87` finds the line with `querySelector('[data-sx-shell="gate-reason"]')` — first match in DOM order — and
  `:90` sets `--sx-entry-clear` from its bottom edge plus 12 px. `:125` `INTAKE_BELOW_ENTRY` starts the intake panel there. **Any**
  second line below the first in that column therefore lies on top of the intake panel in the Job Field — including GRÜN's
  measurement-free placeholder, which is collision-free against the gate line and still wrong.
* `:169-177` the narrow tier moves the shell elements into a grid by `[data-sx-shell=…]` with `order`. A new fixed element with no
  rule of its own stays fixed there and overlaps.

**Bound: M1.** `app/components/career/demo/career-demo-layout.ts` leaves D-2's protected set and becomes a phase-D entry point, with
three **additive** changes: (a) the new line carries its own marker `data-sx-shell="mapping-gate"`, never `gate-reason`; (b) the
clearance measures `max(bottom)` over both markers, so the intake panel starts below **both** lines; (c) the narrow tier gets an
`order` rule placing `mapping-gate` directly after `gate-reason`. The existing line keeps its content, its ids and its positional
style, and `field-entry-state.test.tsx:247` stays green.

**This changes a clause PINK holds. PINK re-stated D-2 with the carve-out and HELD it, bounded, with one condition on (c) — the
refusal I invited.** The reasoning is the one PINK already accepted for `CareerIntelligenceDashboard.tsx`: this is the necessary
reach of the held C-10/C-11, not scope creep. (b) and (c) are not new mechanisms — they are the existing rules generalised from one
fixed line to the set of them, and without either one the result is a real defect (a covered intake panel, an overlapping line),
not a cosmetic one.

**This carve-out is held tighter than the other two, and rightly.** `career-demo-url.ts` is a leaf; `CareerIntelligenceDashboard.tsx`
was type-only. `career-demo-layout.ts` is shell geometry — the orbit grid, the viewport tiers, the intake clearance, the planetarium
fit, all of which D-2 exists to preserve. Its D-5 pin at delivery is **exactly the three additive changes**: nothing touching the
orbit grid, the other tier rules, the planetarium fit, or the single-line clearance of the capability gate.

**Condition on (b) — every pre-existing state identical in effect.** `gate-reason` present and `mapping-gate` absent must yield the
same `--sx-entry-clear` as today; both absent must still `removeProperty`. The only new behaviour is for states where
`mapping-gate` is present, and those are new to phase D, so nothing existing can regress.

**Condition on (c) — shared order 4 and DOM-after, never a renumbering.** Measured at `e360caf9`: among the **direct children of
`FIELD`** the narrow tier's orders are fixed integers — `controls`/`guide` **1**, `selector` **2**, `job-scope`/`investigation` **3**,
`gate-reason` **4** (`:176`), the three intake banners **5** (`:177`), the panel wrap **6** (`:178`), the HUD **5** (`:179`),
`rd-entry` **5** (`:201`). Among those siblings, order 4 is `gate-reason`'s alone.

> **Correction to the measurement (PINK, 2026-11-05).** An earlier revision stated flatly that "order 4 belongs to `gate-reason`
> alone". Scoped to `FIELD`'s direct children that is true, but **unscoped it is false**, and I had the counter-evidence in my own
> output without reading it. `order: 4` occurs **three** times in the file: `:176` (`FIELD >` `gate-reason`), `:187`
> (`FIELD [data-pxj-panel] [data-pxj-section=proposals]`, a descendant inside the pxj panel) and `:210`
> (`JOB > [data-testid="job-pool-non-claims"]`, a different box). They do not collide because `order` sorts only among siblings of
> one flex or grid container, so the additive property stands exactly as bound — but the sentence that justified it did not.
>
> **The delivery check is therefore scoped, not file-wide.** After the change the file holds **four** `order: 4` rules. A file-wide
> count would either fail the additivity check wrongly or, worse, pass it for the wrong reason. What is asserted at delivery:
> *among the `FIELD > [data-sx-shell=…]` rules, `mapping-gate` is the only addition, at order 4; no existing `FIELD`-direct-child
> order integer changed* — together with the DOM-order build requirement below.

So "directly after `gate-reason`, before the banners" is additive **only** when `mapping-gate` carries the **same** `order: 4` and
sits **after `gate-reason` in DOM order** — equal order values fall back to DOM order, which puts `gate-reason` first, `mapping-gate`
second, and both before the `order: 5` group. One new rule, no existing integer touched.

**Renumbering the banners, HUD or panel to open a slot is refused.** It edits existing rules, is not additive, and risks a layout
that has nothing to do with this phase. The DOM order of the two lines is therefore a build requirement, not an accident, and is
checked at delivery.

**M2 is refused.** Reason and way inside the disabled button would put them in a different register from the capability gate, inside
a control that assistive technology may skip, with the capsule growing taller in the gated state, and GRÜN measures the way as
barely fitting. Consistency of the gate pattern is worth more than avoiding one carve-out.

### D-Q14 · The capsule ceiling, and typography is the last concession

`SyntxInvestigationSelector.tsx:57` is fixed at `left: calc(50% + 245px)` and is protected, so the capsule's **half-width may not
exceed 236 px**. Today: 2 × 214 px buttons + 2 × 34 px connectors + 10 px padding = 472 px, half 236 — it is already exactly at the
ceiling. Three buttons at 214 px would be 720 px and would cover the investigation membrane.

One measurement GRÜN did not name, checked here: the job-scope indicator (`SyntxFieldSelector.tsx:107`) carries
`maxWidth: calc(50% - 283px)`, so its right edge sits at `50% − 255px`. It permits a half-width up to 255 px and is therefore **not**
the binding constraint; 236 is.

**Resolved by measurement, 2026-11-05 (GRÜN, e2e G-12, Playwright 1.63.0, `getBoundingClientRect` at 1920×1080, 1600×1000 and
1280×720 × {JOB, PERSON_X_JOB}).** My estimate was wrong: steps 1–3 do **not** fit.

| Built | Capsule width | Verdict |
|---|---|---|
| steps 1 + 2 (width → auto, connectors 34 → 22), type unchanged | 552.25 px | 62 px over |
| + step 3 (padding 15/20 → 10/12) | 513.25 px | **23.25 px over** — right edge 11.6 px past the membrane |

The condition `strip.right < membrane.left` requires a capsule below **490 px**. The indicator check is green throughout (it ends at
309.4, the capsule starts at ≥ 383.4), so 236 remains the only binding side.

GRÜN stopped before touching type, as bound, and offered two levers that are **not** in my list and leave type untouched:
(a) connectors 22 → 14 px (≈ −16 px), (b) the lamp↔label gap 9 → 6 px (≈ −9 px).

**Decision.** (a) and (b) are spacing, not type, so by this section's own principle they belong **before** letterSpacing. They are
accepted and inserted as steps 2b and 2c. But (a) + (b) alone land at ≈ 488 px — **a 2 px clearance is not a clearance.** It is
inside the variance of font fallback, platform rasterisation and locale, and shipping on it would mean the guard passes today and
fails on someone else's machine. Refused as a stopping point.

**Therefore step 4 is accepted: `letterSpacing` 1.6 → 1.2**, reaching ≈ 473 px with ≈ 17 px of room. This is a visible change to the
two existing buttons and it is mine to accept, which I do: 1.2 px on 12 px uppercase mono is still generous, and the shell already
runs the investigation membrane at 0.3 px below 1366 px, so it is well inside the existing design language.

**Step 5 is refused. `fontSize` stays 12 px.** Font size is the readability-critical dimension; letter-spacing is not. A2 argues for
readable bodies, and shrinking the type of the shell's primary navigation to make room for the field that argues for readability
would contradict it.

**Minimum clearance is bound at ≥ 12 px**, not merely `<`. And the acceptance is the **measurement**, never the estimate: if the
built combination does not reach 12 px, it comes back here before any font-size change. Both locales are measured — EN is expected
to bind (DE reads `◈ CAPABILITY-FELD` and `⬡ JOB-FELD`, both shorter), but that is asserted, not assumed, and the DE MAPPING label
is measured rather than presumed equal.

---

**Bound:** the ceiling is a hard constraint, and the concessions are made **in this order, stopping at the first that fits**:

1. the fixed `width: "214px"` becomes `auto` (the labels are of very different lengths; a fixed width wastes the most);
2. the connectors 34 px → 22 px;
2b. the connectors 22 px → 14 px;
2c. the lamp ↔ label gap 9 px → 6 px;
3. horizontal padding;
4. `letterSpacing` 1.6 → 1.2;
5. `fontSize` 12 → 11.5.

GRÜN's estimate reaches the ceiling by changing typography. **Typography is last, not first.** Steps 1 and 2 alone plausibly suffice
— three auto-width labels at the unchanged 12 px / 1.6 come out near 468 px — and if they do, the two existing options keep their
legibility untouched. A2 in this very phase is about readable bodies; shrinking the shell's primary navigation to make room for the
field that argues for readability would be the wrong instinct.

**Measured, not estimated.** Whatever is built, the result is proven, not computed on paper: an e2e assertion at the tested
viewports that the strip's right edge lies left of the investigation membrane's left edge, and that the indicator's right edge lies
left of the strip's left edge. `job-scope-gate.e2e.test.ts` already measures with `getBoundingClientRect` (`:123`) and is a phase-D
file. This is proof §8.17. If steps 1–3 do not fit, GRÜN reports the measured width before changing type, because a visible change
to the two existing options is mine to accept, not GRÜN's to assume. **And if no concession short of covering the membrane fits
three buttons, that comes back here — never a silent typography shrink** (PINK's falsifiability note on §8.17).

Geometry is not named in C-1 … C-11, so none of this changes the contract.

### D-Q15 · T-07, the PERSON markup seal: narrow the hash, never re-base it

GRÜN found a third file that phase D must reach and that neither §7 nor D-3 named.
`test/career/pxj-first-screen/person-markup.test.tsx` hashes the **whole** SSR markup of the host at PERSON ×
`fieldFocus=CAPABILITY` — L0, each focused orbit, and DE — with `createHash("sha256").update(markup)` (`:28`) against
`fixtures/person-markup-49e2bc6.sha256.json`, seven digests, and the file's own comment records that they "were rendered from this
same file on 49e2bc6".

Phase D necessarily changes that markup: the strip gains its third button and the geometry of D-Q14 (C-3, C-4), and a MAPPING gate
line stands in it whenever MAPPING is gated, which without an analysis is `NO_ANALYSIS` (C-10, C-11). T-07 is red, for the right
reason. Phase C only held it because the strip stayed untouched.

**Bound: GRÜN's option (2), narrowing the hash — with the derivation path made explicit, because its wording hid the thing that
matters.**

Option (1), re-basing the digests on the phase-D render, is refused: it would keep the reassuring filename while destroying the
only thing the test asserts, that PERSON is unchanged against `49e2bc6`.

But (2) is **not** "the digests stay the same". They cannot: the old digests were taken over the full markup, so a stripped render
can never match them. (2) means the seven digests are **re-derived from a render at `49e2bc6`** with the same two elements removed
by the same extraction — not from today's output. If they are instead taken from the phase-D render, (2) silently becomes (1) and
nobody can tell from the file. The test's own comment already documents the reproducible procedure, so this is a re-derivation of
the same reference, not a new one.

**The exclusion is exactly two elements:** `[data-testid="field-focus-strip"]` and the new `mapping-gate-reason`. The existing
capability-gate / entry line is **not** excluded — phase D does not change it, so it stays inside the hash and keeps its coverage.
Removal is by depth-matched element extraction, as `job-scope-ssr.test.tsx:34` already does, never by a regex that can over-match.

**Vacuity guard, because a stripper that matches nothing passes for the wrong reason.** The test asserts presence as well as
equality: `field-focus-strip` is present in **both** renders; `mapping-gate-reason` is present in the phase-D render for the gated
variants and **absent** at `49e2bc6`, which is itself the asymmetry to assert rather than to paper over.

**The fixture must say what it hashed.** The file keeps naming `49e2bc6` — the reference is unchanged — and carries an `excluded`
field listing the two selectors, so no later reader can mistake a narrowed seal for the original one.

T-07 therefore joins §7 and D-3's entry set. **PINK re-stated D-3 with it and HELD, the tightest of the four expansions** — and
answered the question I put to it: narrowing a seal **is** a different class of change. A carve-out or an entry-set expansion admits
a file as editable with a bounded diff pinned at delivery; narrowing T-07 **permanently reduces a standing seal's coverage**. After
phase D it no longer catches changes in the strip or `mapping-gate-reason` regions, and not only during this phase. That is why it
gets an inverse check rather than a pin.

**PINK's inverse complement, part of §8.15 at delivery** — and the first item is the one that makes the whole thing real, because
GRÜN's digests are not taken on their face:

1. **Independent re-derivation.** PINK checks out `49e2bc6` in an isolated worktree, renders the seven variants itself, applies the
   same extraction, hashes, and requires the fixture's digests to equal **its own** computation. A disguised re-base from the
   phase-D render passes GRÜN's test and fails this one. This is the direct catch for the silent (1).
2. **Out-of-exclusion mutant.** One byte changed outside the two excluded subtrees — the capability gate line, or an orbit — must
   turn T-07 **red**. The narrowed seal still covers everything it did not exclude.
3. **Vacuity mutant.** A render missing `field-focus-strip`, or missing `mapping-gate-reason` while MAPPING is gated, must turn it
   **red**. The exclusion masks no dropped element.
4. **Exclusion exactness.** The extraction removes exactly the two subtrees and nothing else.
5. **Asymmetry.** The phase-D render minus `mapping-gate-reason` has byte-identical surroundings against `49e2bc6` minus the strip —
   the delicate whitespace and sibling case, which falls out of 1.

### D-Q16 · (b) is additive in the stricter sense GRÜN found

`field-entry-state.test.tsx:255` expects the existing clearance rule verbatim — `:has(> [data-sx-shell="gate-reason"]) ${INTAKE}` —
and that file is not a phase-D file. GRÜN's first cut of (b) widened that rule into a selector list, which would have broken it.

**Corrected and bound, and it is stricter than what I had bound:** the existing `INTAKE_BELOW_ENTRY` rule stays **byte-identical**,
and `mapping-gate` gets its **own new rule** beside it in the same media block. So (b) is now the measurement over both markers plus
one new rule — two additions, zero edits — rather than one generalised rule. The D-5 pin for `career-demo-layout.ts` follows that
shape: four additive changes, no existing line altered.

GRÜN found this itself and fixed it before reporting. That is the right order.

**One thing neither GRÜN nor I had said, and it decides whether (b) works** (PINK's behavioural check). Two `:has()` rules both
setting `top` do **not** compose: in CSS the later match wins, it does not take a maximum. So with both lines present the intake
could clear one and sit under the other.

**Bound:** there is **one** variable. `applyCareerDemoEntryClearance` computes `--sx-entry-clear` as the **max** over both markers,
and **both** CSS rules reference that same variable. The second rule exists only so the `:has()` condition also matches when
`mapping-gate` is present without `gate-reason`; since both rules resolve to the same value, their source order cannot change the
result. Two variables, one per rule, would be the defect — the composition must live in the measurement, not in the cascade.

Checked at delivery in all three states: `gate-reason` alone (today's value), `mapping-gate` alone, and both present (the intake
clears **both**).

---

## 11. Delivery — `86e36924` (GRÜN, 2026-11-05)

Branch `frontend/mapping-phase-d`, parent `e360caf9`, 26 files, +2095/−433. Not pushed, not merged, not rolled out. Evidence in the
session scratchpad, reported by path (D-Q9).

### 11.1 D-Q16 was unsatisfiable — my binding, GRÜN's correction

I bound (b) as "the existing `INTAKE_BELOW_ENTRY` stays **byte-identical**, `mapping-gate` gets its **own new rule**". That cannot
be built, and GRÜN found it. Verified here at `e360caf9`:

* `field-entry-state.test.tsx:234` defines `INTAKE` as the selector tail **plus its declaration block**
  `[data-sx-field="job"] > [data-sx-panel="intake"] { top: max(150px, var(--sx-entry-clear, 150px)) !important; }`.
* `:276` asserts that string occurs **exactly twice** in the whole CSS — once per fixed tier. A second rule makes four, and that
  file is not a phase-D file.

**The delivered solution is right and is now the binding.** One rule, two selectors, `mapping-gate` **first** and `gate-reason`
**last**, so the declaration block follows `gate-reason` directly and `:256`'s contiguous substring
`:has(> [data-sx-shell="gate-reason"]) ${INTAKE}` still matches, while `:276` still counts two. The existing line is therefore
**changed, not byte-identical** — and that is accepted, because the stricter form I asked for does not exist.

GRÜN also names the case that makes the second condition necessary rather than decorative: **PERSON × JOB with a valid job has no
capability line, but MAPPING is gated `NOT_PERSON`**, so the MAPPING line stands alone and without its own condition would lie on
the intake panel.

Note that this is the reverse of D-Q16: GRÜN's *first* cut was a selector list, PINK and I "corrected" it to two rules, and the
correction was wrong. The one-variable requirement of `fb7010aa` survives intact and is what the delivered rule does.

### 11.2 The D-5 pins, as delivered and as I now fix them

| Surface | Pinned to |
|---|---|
| `CareerIntelligenceDashboard.tsx` | exactly two type widenings; `:82` untouched |
| `career-demo-layout.ts` | three hunks: clearance as `max(bottom)` over both markers with both-null handling; the one intake rule with two conditions on **one** variable; the `mapping-gate` narrow-tier rule at `order: 4`, a `FIELD >` direct child, source-after `gate-reason`. No other line |
| `SemanticCareerIntelligenceField.tsx` | six categories, below |
| T-07 | held by PINK's independent re-derivation and mutants, not by a diff pin |

**The host's six categories**, read against the delivered diff: (1) the focus union widened to `"CAPABILITY" \| "MAPPING" \| "FIELD"`
at the prop, the callback, the state and `switchFieldFocus`; (2) the `mappingGate` derivation with D-Q12's bound precedence and the
gated-switch refusal; (3) the extraction of `capabilityActive`, which must be **behaviour-identical** at the three pre-existing call
sites — `jobPoolWorkflow` (`activeFieldFocus === "FIELD"` → `!capabilityActive`), the telemetry `focus` field (kept two-valued on
purpose, which is what keeps D-Q12(c) true) and `coverageRequest`; (4) the brand effect moved **after** `activeFieldFocus`, which is
forced by the temporal dead zone now that it depends on `mappingGate` — a required move, not a tidy-up; (5) the `field` prop removed
and the MAPPING stage mounted; (6) the selector's new `mappingLabel` and `mappingGate` props. The pin test's line list must be
exactly these and nothing else.

### 11.3 Gaps, stated as gaps

1. **`syntx-walk` Q-01 … Q-11 is red on the base.** GRÜN measured it at `e360caf9` in a separate clone: same line `:440:143`, same
   message (`focus-transition-stage-shell-*` count 0). The case aborts before reaching `:911`, so **C-3 at that site is changed
   without ever executing**. That is a gap, not a proof. C-3 is covered twice over elsewhere — `job-scope-ssr` (SSR) and the new
   G-12 (e2e) — so the contract is not unproven, but this site is. **PINK confirms the base-red independently**: a gap claim that
   excuses a contract site from execution must not rest on the measurement of the lane that benefits from it.
2. **`syntx-readonly-walk.mjs` was changed (`=== 3`) and not executed.** It needs a standing environment with persisted analyses.
   A gap.
3. **`live-browser-workflow.e2e` not run**, as bound (D-Q9, no switch).
4. **Three new timeouts** in the two `outcome-valence-feedback-context-revision` files (postgres 2, replay 1), the environment class
   PINK confirmed on both sides in §3.100; those files fail 5/13 standalone and phase D does not touch them. Not phase D's.

### 11.4 Accepted without change

* **Step 3 re-tightened.** With (a) + (b) + step 4 the measured EN clearance was 8.48 px, under the bound 12. GRÜN went **back** to
  step 3 — padding 10/12 → 8/10 — rather than forward to step 5. That is spacing, not type, and is exactly the bound order honoured
  rather than deviated from. Final: EN 461.05 px / 14.48 px clear, DE 444.25 px / 22.88 px. `fontSize` stayed 12.
* **The B2 portal on L2 was not built.** §5.3 says the field *may* offer it; §7 excludes additional functions. GRÜN left it out
  instead of inventing it. Correct.
* **The T-07 fixture** carries `reference`, `excluded`, `note`, the re-derived `digests` and `atReference` presence counts
  (strip 1, `mapping-gate-reason` 0 at the reference). All four conditions of D-Q15 are met in form; PINK's re-derivation decides
  them in substance.
* **T-07's derivation subtlety, reported rather than hidden:** the test file did not exist at `49e2bc6`; its own comment records
  that it was applied to `49e2bc6`'s code. GRÜN therefore rendered the `e360caf9` version of the test file against `49e2bc6`, and
  controlled it by checking that the **unchanged** base file still reproduces its old digests there.

### 11.5 Measured

`tsc` 0 errors. No new eslint finding. Phase-D suites 653/653 in 82 files, `mapping-field` 95/95 in 9. MAP-D-ARCH D-1 … D-7 11/11 on
the surgically cleaned tree. Full isolated suite 3553/3603 green, 30 red = 27 known legacy + the 3 of §11.3.4. Eighteen mutants
applied and restored with a byte check, **all red**. `job-scope-gate` 1/1 green on the tip with the module resolved (Playwright
1.63.0), 355 530 ms, including the new G-12 across three viewports × two locales × two modes.

Three previously unrunnable files now pass with a real `node_modules`: `g2-g3-vertical-proof` 63/63, `hr-decision-loop-p7` 7/7,
`local-decision-context-http` 1/1.

---

### 11.6 PINK's independent §8 pass — **GO** (evidence `20e059e9`)

PINK re-measured everything in isolated worktrees at `86e36924`, `e360caf9` and `49e2bc6` against disposable databases. Nothing
pushed or merged, no server and no shared database touched. The three things I escalated came back resolved by PINK's **own**
measurement, not by accepting GRÜN's or mine:

* **D-Q16.** PINK records its own prior condition as **superseded** and derived why rather than take it: a separate rule ends in the
  `INTAKE` constant once per tier, so `:275`'s exactly-twice becomes four, in a file phase D may not edit. The two-selector fold is
  the **only satisfiable form**. PINK's one-variable requirement survives. My "mapping-gate alone" case is covered non-vacuously, and
  PINK extended it to **both orderings** — the symmetry I had not asked for.
* **The base-red gap.** Confirmed by PINK's own run on `e360caf9`: `syntx-walk` Q-01 … Q-11 is red at `:440:143` and aborts before
  `:911`. So C-3 at that site is changed without executing — an honest gap, as stated in §11.3 — and **C-3 rests on neither gap**: it
  is proven at the executing SSR site (`toHaveLength(3)`, 12/12) and in-browser by G-12.
* **T-07.** PINK re-derived from `49e2bc6` itself. Rendering `49e2bc6`'s own component with the delivered extraction reproduces the
  **delivered** narrowed digests with `found={strip:1, mgr:0}` — my control reproduced — while the control reproduces the
  **original full** digests. The chain `sealed(49e2bc6) == delivered == sealed(86e36924)` proves phase D changed **only the two
  excluded subtrees**. PINK's own mutants: a byte outside the exclusion still flips the hash (the seal still bites), a byte inside
  the strip is absorbed (**the honest coverage cost**), and the vacuity guard fires.

PINK also measured that **MAP-D-ARCH bites** rather than merely passes: 11/11, and a change to a D-2-protected file or a D-5-pinned
line turns it red. §8.17 confirmed as spacing, not type — `fontSize` held at 12, clearance EN 14.4766 px / DE 22.875 px across three
viewports × two locales × two modes, G-12 158/158.

**The GO is for the §5.1 / §5.2 contract as delivered, document- and branch-local. It is not a merge or rollout authorisation.**

**The GO is pinned to `86e36924` and does not carry over.** Anything that re-delivers — a fix, a reword, even a zero-logic change
to a `describe` string — breaks the pin, and PINK re-runs the §8 pass against the new tip before the GO applies again. A GO must
not ride a commit nobody measured. PINK holds the four §8 artefacts (findings, its own base-walk and G-12 runs, `review.txt` §8 at
`20e059e9`) and the D-5 pins against that re-run.

### 11.7 A stated limit of D-3, not a defect

PINK's one contradiction, raised under the scope habit and left to me: D-3 filters change sets with
`sets.filter(set => set.files.some(phaseD))`, so a commit touching **zero** phase-D files is dropped and never judged. What D-3
guarantees is therefore "every change set that touches a phase-D file changes only phase-D files" — it catches foreign files riding
**alongside** phase-D ones, which is the realistic failure, but not a separate commit of only foreign files.

**Moot for this delivery, measured:** `e360caf9..86e36924` is exactly **one** commit. And the shape is identical to phase C's,
which was accepted. I am not changing the guard now: doing so for a hypothetical would cost another build and another review pass.
It is recorded here as a candidate for a later phase — a clause that every commit in `base..HEAD` is a change set — so that nobody
later reads D-3's sentence as wider than D-3's reach.

**A second reason not to reword now, PINK's and better than mine:** the GO is pinned to `86e36924`. Even a change to a `describe`
string, with zero logic in it, makes a new commit on the frontend branch, unpins the GO and strictly obliges a re-confirmation that
nothing else moved — all for a sentence.

**The trigger, carried here so it is not lost.** A later phase will open `architecture.test.ts` anyway to re-state the base
(`phaseDBase` → `phaseEBase`), exactly as D re-stated C. **Fold the narrower sentence into D-3's own `describe` string in that
edit** — *"every change set that **touches** a phase-E file changes only phase-E files"* — so the precise wording lands where the
mechanism lives, at the moment the file is open for other reasons, at no extra build and no extra review pass. Pair it there with
the companion clause *"every commit in `base..HEAD` is a change set"* **only if that phase delivers as more than one commit**; at a
single commit the gap is unreachable and the clause stays dormant at no cost.

So: the note is the instrument for D. The narrower sentence and its companion become live when **both** hold — the file is being
edited regardless, and a multi-commit delivery actually makes the gap reachable.

---

## 12. Hand-over

* **GRÜN** implements §7 against the contract of §5.1 and the proofs of §8, on `PHASE_D_BASE`. Architecture questions come back here
  before a workaround is built.
* **PINK** first re-states or refuses the contract (§5.1) and the base (§5.2), then validates §8 independently and inversely.
* **GELB** holds this document; any change of a binding is a change here first, never only in code.
* **OTTAVIO** holds the provider budget (§0) and the missing third pool. Both are preconditions for seeing the field in its full
  vocabulary, and neither is a blocker for building it.
