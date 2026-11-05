# PERSON × JOB mapping field — phase D: the MAPPING field on its own stage, L0 to L3

Owner mandate `SFE::PERSON × JOB PHASE D` (OTTAVIO, 2026-11-05), **architecture decision: variant A**. Lane GELB owns this document and the
re-stated field-selector contract; GRÜN implements the frontend; PINK validates independently and inversely.

Base: `origin/main` **e360caf9**. Branch of this document: `architecture/mapping-phase-d`. No product file is changed by this commit.

Phase B stays the semantic foundation and is consumed byte-identical. Phase C is the starting point and is carried over, not rebuilt.

**State: CONTRACTED.** PINK holds C-1 … C-11 and D-1 … D-7 (2026-11-05, evidence commits e814e841 and 2ec50d79). D-5's exact
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

| # | Clause | Status |
|---|---|---|
| C-1 | One element `[data-testid="field-focus-strip"]` carries `data-field-focus` with the current focus | **unchanged** |
| C-2 | `data-field-focus` ∈ `CAPABILITY` \| `MAPPING` \| `FIELD` | **extended** (was two values) |
| C-3 | The strip holds **exactly three** buttons. **Every** strip button-count assertion goes 2 → 3, at all three sites named above, and the two stale artifacts are corrected with them | **changed** |
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
| **D-2** | Protected paths unchanged against the base — the phase-C list **minus two carve-outs**: `SyntxFieldSelector.tsx` leaves protection (it is now a phase-D entry point, C-4), and `lib/career/ui` is protected **except** `lib/career/ui/career-demo-url.ts` (C-9). Everything else carries, `lib/career/job-pool`, `app/api` and `lib/career/result-inspector` included — now at their `e360caf9` state | **re-stated (a)** |
| **D-3** | Phase-D change sets: every non-merge commit after the base whose files include a phase-D file may change only phase-D files, and the working tree joins as a pending set once it touches one. **The phase-C artifacts are baseline at `e360caf9`**, so `mapping-field.ts`, `PersonJobMappingField.tsx` and `mapping-field-copy.ts` move from *new files* to **entry points**. The four contract files of §5.1 are phase-D-editable, or a commit bundling a contract fix with a field change would trip the "only phase files" rule | **re-stated (b)** |
| **D-4** | `AutoJobRankingPanel.tsx` is **not** an entry point. D-Q4 keeps it untouched, so it equals the base and moves **into** D-2's protected set. The stale `+`/`−` pin on it is removed, not updated | **re-stated (c)** |
| **D-5** | The entry-point diff pin: `SemanticCareerIntelligenceField.tsx` is pinned to the removal of the `field={…}` prop (D-Q4) and the mount of the MAPPING stage, and nothing else. **The exact lines are fixed when GRÜN delivers, by GELB, and then held by PINK** — they are not invented here, because inventing them would pin a shape nobody has written yet | **re-stated (c)** |
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
15. **Preservation, MAP-D-ARCH D-1 … D-7.** Orbits, planetarium, B2, job scope, job pool, capability core, `app/api` and
    `lib/career/ui` (except `career-demo-url.ts`) byte-identical against `PHASE_D_BASE`; `AutoJobRankingPanel.tsx` byte-identical
    (D-4); the engine and spec byte-identical (D-1); the read-only envelope intact (D-7).
16. **Execution, not exit code (D-Q8).** Every e2e result claimed for §8.14 records that the suite executed — the resolved
    Playwright module and the per-case results. A skipped suite is reported as a gap, never counted as a pass.
17. **The ring-order overflow (D-Q3).** An implementation that drops collar arcs by index, or merges several light requirements into
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
2. **Never leave evidence in the working tree.** After each run the evidence directory is moved out of the repository into the
   session scratchpad and reported by path. Nothing is committed, and **MAP-D-ARCH is run only on a working tree cleaned that way** —
   otherwise it is red for the test harness's own output, which would be a false finding and would teach everyone to ignore it.
3. **`live-browser-workflow.e2e.test.ts` is not part of phase D's proof surface.** Its destination is hardcoded, so it cannot be
   redirected without editing a non-phase-D file, which D-3 forbids. It is not run here. That is a stated limitation of this phase,
   not a silent omission: if a later phase needs it, it needs a switch first.

---

## 11. Hand-over

* **GRÜN** implements §7 against the contract of §5.1 and the proofs of §8, on `PHASE_D_BASE`. Architecture questions come back here
  before a workaround is built.
* **PINK** first re-states or refuses the contract (§5.1) and the base (§5.2), then validates §8 independently and inversely.
* **GELB** holds this document; any change of a binding is a change here first, never only in code.
* **OTTAVIO** holds the provider budget (§0) and the missing third pool. Both are preconditions for seeing the field in its full
  vocabulary, and neither is a blocker for building it.
