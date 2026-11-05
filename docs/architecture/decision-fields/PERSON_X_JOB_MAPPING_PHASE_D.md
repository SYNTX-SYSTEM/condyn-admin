# PERSON × JOB mapping field — phase D: the MAPPING field on its own stage, L0 to L3

Owner mandate `SFE::PERSON × JOB PHASE D` (OTTAVIO, 2026-11-05), **architecture decision: variant A**. Lane GELB owns this document and the
re-stated field-selector contract; GRÜN implements the frontend; PINK validates independently and inversely.

Base: `origin/main` **e360caf9**. Branch of this document: `architecture/mapping-phase-d`. No product file is changed by this commit.

Phase B stays the semantic foundation and is consumed byte-identical. Phase C is the starting point and is carried over, not rebuilt.

**State: PROPOSED.** Not CONTRACTED (PINK has not yet re-stated the selector contract), not implemented, not reviewed.

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

The contract of `field-focus-strip` was two buttons. It becomes three. **Exactly one assertion changes.** Everything else below is
carried over unchanged and is restated here so the whole contract stands in one place.

| # | Clause | Status |
|---|---|---|
| C-1 | One element `[data-testid="field-focus-strip"]` carries `data-field-focus` with the current focus | **unchanged** |
| C-2 | `data-field-focus` ∈ `CAPABILITY` \| `MAPPING` \| `FIELD` | **extended** (was two values) |
| C-3 | The strip holds **exactly three** buttons | **changed** — `job-scope-ssr.test.tsx` `toHaveLength(2)` → `3` |
| C-4 | Button ids: `field-focus-capability-btn`, **`field-focus-mapping-btn`** (new), `job-pool-panel-toggle` | **extended**; the two existing ids are **not renamed** |
| C-5 | Order on the membrane: CAPABILITY, MAPPING, FIELD | **new** |
| C-6 | Each button carries `data-field-focus-active` and `aria-pressed` | **unchanged** |
| C-7 | The job-scope indicator stays a shell element **outside** the strip | **unchanged** |
| C-8 | Keyboard: ←/→ move the focus along the three; `Home` → CAPABILITY, `End` → FIELD; Enter/Space choose. Focus ≠ selection | **extended**, endpoints unchanged |
| C-9 | URL `focus=MAPPING` opens the mapping field; `FIELD`/`JOB`/`POOL` stay aliases of FIELD; anything unknown stays CAPABILITY | **extended** (`career-demo-url.ts`) |
| C-10 | MAPPING is **gated** when no PERSON ranking can be shown, using the existing closed-gate pattern (`capabilityGated` / UX-04 reason-and-way), with reasons `NO_ANALYSIS`, `NOT_PERSON`, `NO_RANKING`, `NO_POOL` | **new** |
| C-11 | A gated option cannot be selected, states its reason and its way, and is not merely disabled in silence | **unchanged pattern** |

Files the re-statement reaches: `SyntxFieldSelector.tsx`, `SemanticCareerIntelligenceField.tsx`, `career-demo-url.ts`,
`test/career/job-pool/job-scope-ssr.test.tsx`, `test/job-pool-validation/job-scope-gate.e2e.test.ts`,
`test/job-pool-validation/syntx-walk.e2e.test.ts`, `test/job-pool-validation/support/syntx-readonly-walk.mjs`.

**PINK holds C-1 … C-11 from the moment they are accepted.** Until then this table is a proposal.

### 5.2 The phase base

`PHASE_C_BASE` is `5ca0f3f5`; `main` is `e360caf9`; `test/career/mapping-field/architecture.test.ts` (MAP-C-ARCH) is consequently red.
That is the designed re-statement point, not a defect — the test exists to force exactly this moment.

**Proposed: `PHASE_D_BASE = e360caf9`**, with the phase-C change-set logic carried over unchanged (every non-merge commit after the
base whose files include a phase-D file may change only phase-D files; protected paths are compared as trees — committed, staged,
unstaged and untracked). PINK confirms or refuses the base; it is a boundary statement, not a convenience.

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
| `app/components/career/demo/mapping-field-copy.ts` | change | EN/DE for L2/L3, open positions, evidence limitation, the budget sentence, the layout-shift line |
| `test/career/mapping-field/phase-base.ts` | change | `PHASE_D_BASE` (§5.2) |
| `test/career/mapping-field/*`, `test/career/mapping-spec/*` | add | the proofs of §8 |
| contract test files of §5.1 | change | the one assertion and the new id |

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
8. **No scope write.** No path of the field, at any level, including the offered B2 portal, writes the job scope, the URL or history.
9. **A3.** A reading in which role X's fit changes and role Y only shifts position: X animates with a trail, Y does not, Y carries
   `data-layout-shift`, and the field states the count. The inverse mutant (Y animating) must turn it red.
10. **Golden vectors.** All twelve layout vectors still match to 1e-6 after phase D; the drawn positions are the layout's output 1:1.
11. **Budget honesty.** With `GEMINI_JOB_CALL_LIMIT=0`, nothing anywhere in the field asserts or implies a semantic check, and the
    provenance line is present at every level.
12. **Level round trip.** L0 → L1 → L2 → L3 → UP ×3 returns the identical focus state object.
13. **Empty and error readings.** Each of `NO_RANKING`, `NO_ROLES`, `NOT_PERSON`, `PROJECTION_ABSENT`, `BOUNDARY_UNRESOLVED`,
    `NOT_PROVISIONED`, `ANALYSIS_NOT_FOUND` states its own reason and is not drawn as an empty field.
14. **Contract C-1 … C-11**, including the gated MAPPING option's reason and way, and that the two pre-existing button ids did not move.
15. **Preservation.** Orbits, planetarium, B2, job scope, `lib/career/ui`, job pool, capability core and `app/api` byte-identical
    against `PHASE_D_BASE`.

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

## 10. Hand-over

* **GRÜN** implements §7 against the contract of §5.1 and the proofs of §8, on `PHASE_D_BASE`. Architecture questions come back here
  before a workaround is built.
* **PINK** first re-states or refuses the contract (§5.1) and the base (§5.2), then validates §8 independently and inversely.
* **GELB** holds this document; any change of a binding is a change here first, never only in code.
* **OTTAVIO** holds the provider budget (§0) and the missing third pool. Both are preconditions for seeing the field in its full
  vocabulary, and neither is a blocker for building it.
