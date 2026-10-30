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
| CHECKING | The chosen job is being read. | → the Capability Field follows once it holds | Der gewählte Job wird gelesen. | → das Capability-Feld folgt, sobald er trägt | — |
| INVALID | The chosen job does not hold here · *reason*. | → open another role in the Job Field · SELECT AS JOB | Der gewählte Job trägt hier nicht · *Grund*. | → im Job-Feld eine andere Rolle öffnen · ALS JOB WÄHLEN | — |
| JOB | JOB reads the job alone; the person stays outside. | → PERSON or PERSON × JOB brings the person in | JOB liest den Job allein; die Person bleibt außen. | → PERSON oder PERSON × JOB holt die Person herein | → PERSON |

**Node path:** `PERSON × JOB ⟶ ◈ CAPABILITY FIELD`, `PERSON ⟶ ◈ CAPABILITY FIELD`, `JOB · ◈ CAPABILITY FIELD` (DE: `◈ CAPABILITY-FELD`).

**Tooltip** on the closed controls (capability button and exit button): the line plus the transition.

**Actions reuse existing handlers only:**

- `selectInvestigationMode("PERSON")`
- `switchFieldFocus("CAPABILITY")`
- `selectJobScope(observedRoleId)` — the same handler as the Job Field's SELECT AS JOB button.

## Layout

The FIT tier (1100–1599 px, or height under 1000 px) places the uploaded pools list beside the Job Field panel (x 380–696). Every centred entry line used to sit on top of that list; this was pre-existing in the PxJ states and would have been new for state 3.

One CSS rule in `career-demo-layout.ts` fixes this: while the list is visible in the Job Field, the line starts right of the list (list left + width + 16 px). The full tier (the list sits below) and the stack tier are unchanged.

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

## Open (not changed here)

- **Pre-existing overlaps in 2b and 4:** at 1280–1920 the line still lies partly over the top organization node / pool node of the Job Field cosmos (reduced, not removed). A full fix needs a stage-layout decision.
- **INVALID reason code:** INVALID still carries the validation's reason code (e.g. `ROLE_NOT_IN_POOL`), as V-05 requires. A human wording for the codes would be an owner decision.
- **Page scroll:** the page scrolls at every viewport, on the base and after (pre-existing).
