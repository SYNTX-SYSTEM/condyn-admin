# SFE::SEMIOTIC_ENTRY_FIX — evidence (GRÜN, branch `frontend/semiotic-entry` from `main` cd1e4de)

The entry line into the Capability Field is now a calm field-state line, not a prohibition. It has:

- a node path (origin ⟶ ◈ CAPABILITY FIELD);
- one sentence;
- one transition (`→ …`);
- at most one existing action.

It is a quiet status channel: `role="status"` with `aria-live="polite"` (it used to be `role="note"`), in the field's cool cyan tokens (it used to be an amber border and title). The gate (`capabilityGateOpen`) and the mode logic are **unchanged**; only presentation and text changed.

## State model (named explicitly, as GELB asked)

The states come from `lib/career/view-model/field-entry-state.ts`. Its only inputs are existing state: mode, gate, focus, job-scope validation, pool list, opened pool and observed role.

| Owner state | Entry state | Condition |
|---|---|---|
| 1 | `NO_POOL` | PERSON × JOB, pool list `EMPTY` |
| 2 (a) | `POOL_NOT_OPENED` | PERSON × JOB, pools `AVAILABLE`, none opened |
| 2 (b) | `ROLE_NOT_OPENED` | PERSON × JOB, a pool opened, no role opened in it |
| 3 | `PERSON_OPEN` | PERSON in the **Job Field** (gate open). In the Capability Field nothing is shown, so T-07 bytes are unchanged |
| 4 | `ROLE_NOT_CHOSEN` | PERSON × JOB, pool opened **and** role opened (URL `jobOrganizationId`/`jobRoleId`), not yet chosen as the job |
| — | `POOLS_UNREAD` | PERSON × JOB, pool list not read (IDLE / LOADING / FAILED / NOT_PROVISIONED): makes no claim about pools |
| — | `CHECKING` / `INVALID` / `JOB` | unchanged meaning, same grammar |
| — | *(nothing)* | gate open with a valid job; PERSON inside the Capability Field |

**Deviation from GELB's 4-state proposal:**

- Owner state 2 is split into 2a and 2b, because "open a pool" and "open a role in it" are different next contexts.
- `POOLS_UNREAD` is added, so the line never says "no pool" before the list is read.

`data-gate` stays `NONE` for every PxJ no-job state, as before. The new attribute is `data-entry-state`.

## Wording (EN / DE)

| State | EN line | EN transition | DE line | DE transition | Action |
|---|---|---|---|---|---|
| NO_POOL | No job pool in the field yet. | → add one with + INTAKE · PERSON needs no role | Im Feld liegt noch kein Job-Pool. | → mit + INTAKE einen hinzufügen · PERSON braucht keine Rolle | → PERSON |
| POOL_NOT_OPENED | Job pools are in the field; none is open. | → open a pool, then a role · PERSON needs no role | Job-Pools liegen im Feld; keiner ist geöffnet. | → einen Pool öffnen, dann eine Rolle · PERSON braucht keine Rolle | → PERSON |
| ROLE_NOT_OPENED | The pool is open; no role is open in it yet. | → open a role in the pool · PERSON needs no role | Der Pool ist geöffnet; darin ist noch keine Rolle offen. | → eine Rolle im Pool öffnen · PERSON braucht keine Rolle | → PERSON |
| PERSON_OPEN | PERSON reads capabilities without a role. | → continue in the Capability Field | PERSON liest Fähigkeiten ohne Rolle. | → im Capability-Feld weiter | ◈ CAPABILITY FIELD / ◈ CAPABILITY-FELD |
| ROLE_NOT_CHOSEN | A role is open; it is not the job yet. | → select it as the job to read the person against it | Eine Rolle ist geöffnet; sie ist noch nicht der Job. | → als Job wählen, um die Person an ihr zu lesen | SELECT AS JOB / ALS JOB WÄHLEN |
| POOLS_UNREAD | PERSON × JOB reads the person against one chosen role. | → choose a role in the Job Field · PERSON needs no role | PERSON × JOB liest die Person an einer gewählten Rolle. | → im Job-Feld eine Rolle wählen · PERSON braucht keine Rolle | → PERSON |
| CHECKING | The chosen job is being read. | → the Capability Field follows once it is read | Der gewählte Job wird gelesen. | → das Capability-Feld folgt, sobald er gelesen ist | — |
| INVALID | The chosen job is not readable in this field · *reason*. | → open another role in the Job Field · SELECT AS JOB | Der gewählte Job ist in diesem Feld nicht lesbar · *Grund*. | → im Job-Feld eine andere Rolle öffnen · ALS JOB WÄHLEN | — |
| JOB | JOB reads the job alone; the person stays outside. | → PERSON or PERSON × JOB brings the person in | JOB liest den Job allein; die Person bleibt außen vor. | → PERSON oder PERSON × JOB holt die Person herein | → PERSON |

**Node path:** `PERSON × JOB ⟶ ◈ CAPABILITY FIELD`, `PERSON ⟶ ◈ CAPABILITY FIELD`, `JOB · ◈ CAPABILITY FIELD` (DE: `◈ CAPABILITY-FELD`).

**Tooltip** on the closed controls (capability button and exit button): the line plus the transition.

**Actions reuse existing handlers only:**

- `selectInvestigationMode("PERSON")`
- `switchFieldFocus("CAPABILITY")`
- `selectJobScope(observedRoleId)` — the same handler as the Job Field's SELECT AS JOB button.

## Layout

**Since the PINK §3.82 fix (F-SEM-1):** the line stands in the Job Field's **right column**, under the mode selector, `right: 28px`,
`top: 128px`, width `clamp(220px, calc(50vw − 460px), 316px)`. It mirrors the Job Field panel on the left.

- The Job Field cosmos (the planetarium box, at most 800 × 1.04 = 832 px) is centred in the viewport. The column right of it is
  `50vw − 416px`; the line keeps 16 px of air to it and 28 px to the edge.
- At 1280–1920 px it lies fully outside the box. Only below 1248 px viewport width (fit tier, not one of the six viewports) does
  the 220 px minimum reach into the box's empty upper-right corner, outside the organization ring.
- The intake panel opens in the same column (`right: 28px`, top 150 px in the Job Field). While the line is there, the intake
  starts 12 px below it. The dashboard's existing layout observer writes the line's bottom edge as `--sx-entry-clear`; the rule
  sits in the full and the fit tier. Without a line the intake keeps its own 150 px.
- The stack tier (200 %) still sets the line into the page's column; `right` is undone there.
- The earlier fit-tier rule (line right of the uploaded-pools list) is removed: it only corrected the centred line.

**Why:** at the top centre, the line lay over the pool's first organization (KESTREL) whenever a pool was open:

- in PERSON (new with the line — PINK F-SEM-1: 13 % of the node at 1920, 27 % at 1280–1600, and its action took clicks on the
  node's rim);
- in PxJ 2b and JOB (pre-existing, reduced in the first delivery).

The cosmos reaches up to y ≈ 134 px. Below the selector (y 120) there is no band free of nodes, so the line left the centre.

## Proofs

- **tsc:** 0.
- **Focused suite:** 89/89 files, 749 passed (pxj-first-screen, three-modes, job-pool, career-demo-ui, F12, HR dock, build). Orbit and SIL suites: 13/13 files, 90 passed.
- **Adjusted literal-string tests (named):**
  - `job-pool/syntx-field-ssr` (title regex)
  - `pxj-first-screen/gate-reason` (EN/DE cause/way, INVALID, JOB)
  - `pxj-first-screen/gate-title` (CHECKING / INVALID / no-job tooltips)
  - `pxj-first-screen/gate-dual-way` (needles "no role" / "keine Rolle", copy keys)
  - `pxj-first-screen/recovery-ways` (V-05 reason keys)
  - `three-modes/three-modes-ssr` (JOB tooltip)
- **New tests:**
  - `pxj-first-screen/field-entry-state.test.tsx`: SSR for every state EN/DE; channel and token checks; no-prohibition lexicon; gate unchanged; inverses; FIT layout rule; pure `fieldEntryState`.
  - `pxj-first-screen/field-entry-actions.test.tsx`: harness tests showing the actions are the existing URL writes.
- **Mutants, each one line, each red, each restored:**

  | Mutant | Change | Failed |
  |---|---|---|
  | M1 | NO_POOL removed | 3 |
  | M2 | 2a removed | 4 |
  | M3 | 2b removed | 4 |
  | M4a | state 3 never shown | 4 |
  | M4b | state 3 also in the Capability Field | 4, incl. **T-07** `person-markup` bytes |
  | M5 | state 4 folded into 2b | 3 |
  | M6 | open gate still speaks | 1 |
  | M7 | state-4 action not `selectJobScope` | 1 |
  | M8 | `role="alert"` | 1 |
  | — | FIT layout rule removed | 2 |
- **Production build:** `next build --webpack`, without `NEXT_PUBLIC_CONDYN_RESULT_INSPECTOR_UI`. STAND-IN lab, `GEMINI_API_KEY` unset, no Gemini call.
- **Walk** (`scripts/entry-walk.mjs`): 6 viewports × EN/DE × 7 states = 84 visits, before (cd1e4de) and after. 0 page errors on both.
  - Every state is its own line.
  - `s4-chosen` (click SELECT AS JOB) opens the gate by its own rule; the line is gone.
  - Compared to before: **0 new overlaps, 0 larger overlaps, 0 new page scroll.**
  - Overlaps removed: `job-pool-list` in s1/s2/JOB at 1280–1600.
  - Overlaps reduced: the line is 66 px high, was 82–99 px.
    - `syntx-organization-org_kestrel`: 59 → 42 px.
    - `syntx-pool`: 45 → 29 px.
- **Shots** (`shots/`): before and after for all 7 states EN/DE at 1600×900, and after at 640×360 (200 %) for states 1, 2b, 3, 4. The reports (`before-report.json`, `after-report.json`) cover all 6 viewports.

## PINK §3.82 follow-up (F-SEM-1 … F-SEM-4, O-SEM-2, O-SEM-3)

PINK's verdict was NO-GO because of one finding, F-SEM-1; everything else passed. The fixes sit on top of 84e4551/20bf662, on the
same branch.

### F-SEM-1: the line over KESTREL, its action taking clicks

**Fix:** placement (see *Layout*). The action stays, because it is the state's transition, but it no longer lies over a node.

**Walk** (`scripts/entry-walk.mjs`, extended), production build, STAND-IN lab :41884, `GEMINI_API_KEY` unset:

- 12 states × EN/DE × 6 viewports = **144 visits**, 0 page errors (`after-fsem1-report.json`).
- New states:
  - PINK's state `s3-person-pool` (`?investigationMode=PERSON&jobPoolUploadId=…`);
  - `s3-person-role`;
  - `job-pool`;
  - `s2b-intake` and `s3-person-intake` (the intake opened).

**Results:**

- **Node test:** 0 cosmos nodes (organization, role, requirement, pool) meet the line's box in any visit.
- **Hit test:** sampled points inside every visible node (11 × 7 per node) hit the line or its action **0 times in 72,567**.
- **Click proof:** a real click on the top rim of KESTREL (x centre, y 12 % of the node) in `s2b-pool-open`, `s3-person-pool`
  and `job-pool` at 1920/1600/1440/1280, EN/DE — **24 of 24** land on `syntx-body-org_kestrel` and open the organization
  (`jobOrganizationId=org_kestrel`). `focus` stays unset; never `CAPABILITY`. On 84e4551 this point opened the Capability Field
  (PINK `pink-steal`).
- **Intake:** in every intake visit the intake panel starts below the line (e.g. 1280 DE: line 128–258, intake from 270).
- **Shell:** 0 overlaps with the shell controls, the Job Field panel, the pools list or the state panels.
- **Stack (200 %):** the line stays in the page's column.
- **Shots:** `shots/fsem1-*.jpg` (PERSON with an opened pool at 1920/1600/1440/1280 and 640×360, 2b, JOB, state 4, the intake
  opened, state 1).

### F-SEM-2 … F-SEM-4: test gaps (tests only)

| Gap | Test | Mutant (PINK) |
|---|---|---|
| F-SEM-2 | An opened REQUIREMENT counts as an opened role: state 4 with SELECT AS JOB (SSR EN/DE), and the action selects the requirement's role (harness). | E11 → 2 red |
| F-SEM-3 | Every colour in the whole line (path label, sentence, transition, action, frame), in 6 states, is cool: hue 150°–260° or near neutral. An inverse holds that the check sees amber, the old gate tone and red. | E19 → red |
| F-SEM-4 | In each closed state the line carries an id that is unique in the page. The capability button's and the exit button's `aria-describedby` both resolve to it. Inverse: the open PERSON line has no id and nothing points to it. | E20 → red |

**New placement mutants, each red:**

- N1: line back to the top centre
- N2: line width unbounded
- N3 / N4: intake rule dropped in the full / fit tier
- N5: the stack tier keeps `right`
- N6: the clearance ignores page scroll
- N7: the clearance stays without a line

**Coverage boundary:** the dashboard's call of `applyCareerDemoEntryClearance` inside its observer runs only in a browser. There
is no jsdom here, the same boundary as before. The walk's intake visits prove it.

### O-SEM-2: wording (taken)

| Before | After |
|---|---|
| INVALID: "The chosen job does not hold here." / "Der gewählte Job trägt hier nicht." | "The chosen job is not readable in this field." / "Der gewählte Job ist in diesem Feld nicht lesbar." |
| CHECKING: "… follows once it holds" / "… folgt, sobald er trägt" | "… follows once it is read" / "… folgt, sobald er gelesen ist" |
| JOB (DE): "die Person bleibt außen." | "die Person bleibt außen vor." |

The tests name the new literals.

### O-SEM-3: `→ PERSON` keeps `focus=CAPABILITY` (left as is)

The action is the existing mode handler (`selectInvestigationMode`). It behaves exactly like PERSON in the mode selector: someone
who asked for the Capability Field (`focus=CAPABILITY`) and chooses PERSON lands there, because the gate is now open. Changing
this would change mode logic, which this mandate excludes. It is reported for the owner.

**Proofs for the follow-up:**

- tsc 0.
- Production build (`next build --webpack`, no flag) clean.
- Suite: 112/112 files, 875 passed, 7 skipped. That is the same file set as the first delivery, plus 7 tests.

## Open (not changed here)

- **INVALID reason code:** INVALID still carries the validation's reason code (e.g. `ROLE_NOT_IN_POOL`), as V-05 requires. A human wording for the codes would be an owner decision.
- **Page scroll:** the page scrolls at every viewport, on the base and after (pre-existing).
