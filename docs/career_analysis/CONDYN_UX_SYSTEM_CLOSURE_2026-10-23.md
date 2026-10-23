# CONDYN — recursive UX/UI & system closure (2026-10-23)

Owner mandate „SYNTX::SFE::OWNER_GO — RECURSIVE UX/UI & SYSTEM CLOSURE“ (baseline 49e2bc6, candidate 421e382; integration,
deployment, new Gemini calls and production data mutation forbidden). GELB record: inventory, dependency graph, priorities, scope
and authority control, GELB fixes, orchestration. Evidence classes stay separate: REAL_GEMINI · PERSISTED_REAL_RESULT · STAND_IN ·
DETERMINISTIC_FIXTURE (plus CODE_INSPECTION and MEASUREMENT as methods).

## 1 Inventory

Sources: owner UX-01…07 (§03), GELB walks on the real result (`CONDYN_PXJ_FULL_CLOSURE_2026-10-23.md` §3/§7, screenshots
`evidence/pxj-full-closure/acceptance-421e382/shots/`), PINK §3.60, code inspection of 421e382.

| ID | Observation (source) | Cause (reconstructed) | Lane | Prio |
|---|---|---|---|---|
| UX-05 / D-PICK | Persisted analyses cannot be chosen in the UI; only a deep link or a new ANALYZE reaches them (owner; GELB §3) | No UI reads the existing list; the first screen binds only to `analysisId` from the URL or the session job | GRÜN | P1 |
| UX-03 | After a valid role selection NO_ANALYSIS stays without a next step (owner) | The NO_ANALYSIS statement names ANALYZE only; no way to an existing analysis (UX-05) | GRÜN | P1 |
| UX-04 | CAPABILITY FIELD not reachable „before an analysis“ (owner) | The gate is the **selected job** (PxJ: VALID job scope; PERSON: open; JOB: closed), not an analysis; the closed control does not say why nor how to open it | GRÜN | P1 |
| O-PXJ-720 | At 1280×720 the B2 panel is below the fold; page + panel scroll; shell overlaps while scrolled (GELB/PINK) | Below ~1600 px width the panel is placed under orbit 02 (top 485 px) with a fixed height; the page scrolls under the fixed shell | GRÜN | P1 |
| O-NAV-SUBMIT | Back ≈0.3 s after ANALYZE: the 202 is discarded by the released controller; job persisted, no entry names it (PINK I24) | The job controller lives per mount; the remount (N-1) releases it while the POST is in flight; the job id exists only after the 202 | GRÜN (in-app); owner (reload) | P1 |
| UX-01 | Pool, organisation and role views are not recognisable as levels (owner) | The panel header is „JOB FIELD“ on every level; the level is only implied by the breadcrumb | GRÜN | P2 |
| UX-02 | SELECT AS JOB appears only inside a role view without saying so (owner) | The action renders only at ROLE level; pool/organisation level shows no hint; at ROLE level the legacy box sits between title and action | GRÜN | P2 |
| UX-07 | Uploaded vs opened vs selected job not clearly distinct (owner) | Three states with partly the same visual language (pool list item, observed role card, job indicator) | GRÜN | P2 |
| UX-06 | No re-upload of an existing pool must be needed (owner) | CODE/MEASUREMENT: existing pools are listed (`job-pool-list`) and selectable (GELB R04b); the list sits behind the POOLS toggle, the empty start does not lead to it | GRÜN (discoverability) | P2 |
| F-G1-MD | `.md`/`.txt` from the file input are staged as `pdf` (base64) and fail (pre-existing) | `SourceDock.handleFileSelect` reads every file as a data URL with `type: "pdf"` | GRÜN | P2 |
| V-TYPO | Small type in real use: requirement labels, footer invariants, panel meta (GELB screenshots) | Fixed small font sizes from the field grammar | GRÜN | P3 |
| V-FOCUS | Focus and hover states, interactivity of cards, non-colour cues (§04) | To be measured (PINK pre-sweep) | GRÜN | P3 |
| V-NAMES | Long organisation/role names (§04) | Truncation in the shell indicator (`role_kestrel_fu…`) | GRÜN | P3 |
| B-3 | `next build` failed at type check (proxy route export; after that `relay-check.mts`) | See §3 | GELB | done |
| F-RF-4 | stale analysisId comment | fixed in 1dcc273 (N-4) | — | done |
| B-SRC | staged sources do not survive reload/Back | browser memory only; persistence = new data storage of a CV | owner (D-SRC) | STOP |
| B-NAV / B-RUN / O-RF-1 / O-RF-2 | closed in 421e382 (PINK §3.60); O-RF-2 dev-only | — | — | regression only |

## 2 Dependency graph

```
UX-06 (pools reachable) → UX-01 (levels) → UX-02 (select-as-job condition) → UX-07 (uploaded/opened/selected)
        → UX-04 (gate reason + way) → UX-03 (next step) → UX-05 D-PICK (existing analysis) → first screen B2
        → O-PXJ-720 (B2 visible at every viewport) → V-* (type, focus, names)
O-NAV-SUBMIT ← N-1 remount (CareerDemoHistory) + job controller lifetime
F-G1-MD ← SourceDock staging (independent)
B-3 → production build without exception → every later browser proof of cross-document navigation
```

## 3 GELB fix B-3 (done)

`70d1cb4` on `build/b3-proxy-route-export` (base 421e382):
- `app/api/admin/proxy/[...path]/route.ts`: `handleProxy` no longer exported (a route file may export only HTTP handlers and segment
  config). GET/POST/PUT/DELETE unchanged; nothing imported it. No contract change.
- `docs/…/video-readiness/scripts/relay-check.mts`: the second blocker after the first fix (Buffer body → `Uint8Array`, same
  bytes); offline check still 16/16.
- Regression `test/build/route-exports.test.ts`: 3/3; on 421e382 2 FAIL (`handleProxy`).
- `next build --webpack` exit 0 and `tsc --noEmit` 0 errors **without** `typescript.ignoreBuildErrors`.

## 4 Contracts given to GRÜN (summary; full text in the assignment)

- **D-PICK (UX-05):** GET only, existing routes: `GET /api/career/analyses` (id, createdAt, validationState) and
  `GET /api/career/analyses/{id}/investigation` (mode, bound job). Offered are only analyses whose persisted mode equals the
  interface mode and — in PERSON × JOB — whose `jobScopeSelection` equals the selected job exactly (upload id and role id). An
  analysis whose boundary cannot be read is not offered. Selection only by an explicit click (one push of `analysisId`), never
  automatic, also not for a single candidate. Opening it runs the existing B2 scope-hash check unchanged. From the Job Field role view the click pushes `analysisId` and `focus=CAPABILITY` as one entry (GELB K-UX-1); each candidate shows its own persisted binding (upload id, role id) from its investigation read. Bounded read (newest
  25, at most 4 parallel), lazily when the list is opened. A server-side filtered list would be new backend semantics → owner.
- **O-NAV-SUBMIT:** no analysis submitted in this session may become unnamed. If the field remounts while the POST is in flight,
  the 202's job id is handed to the field now mounted and written by replace into the entry on view, then followed by GET only (no
  second POST). A **reload** during SUBMITTING cannot be recovered without a server lookup (e.g. by the idempotency key) → owner
  architecture decision, not implemented.
- Everything else (UX-01…04, 06, 07, O-PXJ-720, F-G1-MD, V-*) inside the existing architecture and data contracts, keeping the
  SYNTX field identity (orbits, motion, neon grammar), FOCUS ≠ SELECTION, HOVER ≠ AUTHORITY, COVERED ≠ VERIFIED, no colour-only
  meaning, no new score.

## 5 STOP items (owner)

- D-SRC (B-SRC persistence) — new storage of personal documents.
- Reload during SUBMITTING — server lookup contract (§4).
- Server-side filtered analysis list — only if D-PICK's bounded client read proves too slow.
- D-PICK-PERSON — a place for choosing existing PERSON analyses would change the PERSON first screen (G1 owner decision: PERSON unchanged); D-PICK is PxJ-only in the UI, its filter is mode-exact and tested for PERSON.
- Integration GO.

## 6 PINK pre-sweep §3.61 (7f3ec3f) — mapped

PINK measured 421e382 on :41872 (PERSISTED_REAL_RESULT, GET only) and its stand-in production build; 15 findings, no fixes
(`evidence/ux-presweep-421e382/findings.txt`). GELB mapping, forwarded to GRÜN:

| PINK | Inventory | Prio | Note |
|---|---|---|---|
| V-01 inspector overlays the source dock (1280×720, 200 %) | new — blocked action | P1 | §10.6 |
| V-02 shell cut at 200 % of 1280 (JOB mode unreachable by pointer) | new — blocked action | P1 | §10.6 |
| V-03 B2 below the fold < 1600 px | O-PXJ-720 | P1 | 1440×900 94 %, 1280×720 53 %, 200 % 13 %/0 % |
| V-04 gate reason only in a disabled button's title | UX-04 | P1 | not reachable by keyboard/screen reader |
| V-05 CHECKING/INVALID shown as „select a job first“ | UX-04 | P1 | honest per state |
| V-06 NO_ANALYSIS / RESULT_NOT_FOUND / job NOT_FOUND without an action | UX-03 | P1 | NOT_FOUND banner needs a close |
| V-07 empty start does not point to + INTAKE | UX-06 | P2 | |
| V-08 .md as PDF + useless retry | F-G1-MD | P2 | |
| V-11 9–14 tabs to SELECT AS JOB | UX-02 | P2 | |
| V-12 mode radiogroup selects on arrow | FOCUS ≠ SELECTION | P2 | GELB decision (§09, small, reversible): manual activation — arrow moves focus, Enter/Space selects |
| V-09 type 7.5–9.5 px | V-TYPO | P3 | |
| V-10 contrast below AA (telemetry labels, receded titles) | V-TYPO | P3 | gradient text INCONCLUSIVE |
| V-13 no visible hover on SELECT AS JOB / pool item | V-FOCUS | P3 | |
| V-14 POOLS toggle 23 px high | V-FOCUS | P3 | |
| V-15 long names cut without ellipsis/title | V-NAMES | P3 | |

Held (PINK): no focus trap, focus indicators present, 600 tabs without URL/history change, Esc chain, Shift+Tab exact, text chips
for COVERED / NOT COVERED, no horizontal page scroll, MODE_MISMATCH and ROLE_MISMATCH offer exactly one action.
