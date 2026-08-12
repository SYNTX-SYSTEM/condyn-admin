# Decision Looper Regression Ledger

This document serves as the persistent history of discovered system failures, their architectural roots, and their regression coverage within the Condyn Decision Looper pipeline.

## BUG 001
**Date:** 2026-08-09
**Trigger:** Live analysis with sparse text input (TXT: "Manuelle Text-Eingabe").
**Observable Symptom:** `ERR_ROLE_HIERARCHY_DISCONNECTED` during validation.
**Root Cause:** The prompt contract allowed roles to be generated without requiring a grounded organization, resulting in an orphan role (`RO_001`).
**Affected Layer:** LLM Inference / Prompt Contract.
**Architectural Invariant:** No Organization may be invented merely to satisfy graph structure. No orphan Role enters validated knowledge.
**RED Test:** `test/career-role-extraction.test.ts` (Failed on missing relationship).
**Correction:** Added explicit `ROLE EXTRACTION RULE` to `PC-CONDYN-CAP-v1.0`.
**GREEN Verification:** Confirmed via `npx vitest run test/career-role-extraction.test.ts`.
**Live GUI Verification:** (Pending full pipeline clear).
**Files Changed:** `lib/career/adapter.ts`, `test/career-role-extraction.test.ts`.

## BUG 002
**Date:** 2026-08-09
**Trigger:** Next.js application rebuild after fixing BUG 001.
**Observable Symptom:** `Expected a semicolon` parsing failure in `adapter.ts`.
**Root Cause:** The `ROLE EXTRACTION RULE` text injected into the template literal contained unescaped backticks that closed the prompt string prematurely.
**Affected Layer:** Prompt Engine (TypeScript Syntax).
**Architectural Invariant:** Prompt text is production code and must compile properly.
**RED Test:** Build failure.
**Correction:** Replaced internal markdown backticks with standard quotes in `PC-CONDYN-CAP-v1.0`.
**GREEN Verification:** TypeScript build passed.
**Live GUI Verification:** Confirmed (Next.js server resumed).
**Files Changed:** `lib/career/adapter.ts`.

## BUG 003
**Date:** 2026-08-09
**Trigger:** Regression test run for `career-role-extraction.test.ts` (Case 4).
**Observable Symptom:** Validated graph contained a disconnected Role, yet `validateCareerAnalysis` returned success.
**Root Cause:** Validator Phase 2.4 (Semantic Rules) executed before Phase 2.5 (Partial Graph Repair). The dangling edge passed Phase 2.4, then was removed by 2.5, leaving a corrupted final graph.
**Affected Layer:** Semantic Validator Pipeline.
**Architectural Invariant:** THE FINAL GRAPH RETURNED BY VALIDATION MUST SATISFY ALL SEMANTIC INVARIANTS.
**RED Test:** `career-role-extraction.test.ts` (Case 4 specifically testing final graph constraints).
**Correction:** Swapped Phase 2.4 and Phase 2.5 so semantic invariants run on the sanitized graph.
**GREEN Verification:** `test/career-role-extraction.test.ts` (4 PASS).
**Live GUI Verification:** Confirmed via test harness.
**Files Changed:** `lib/career/validator.ts`.

## BUG 004
**Date:** 2026-08-09
**Trigger:** Live analysis GUI execution after pipeline repair.
**Observable Symptom:** Successful API analysis returned data, but the Semantic Career Intelligence Field still rendered demo capabilities and demo source badges.
**Root Cause:** `SemanticCareerIntelligenceField` discarded `json.data` after a successful fetch. Child components (like the `stages` planetary generator) were hardcoded to read the original static `data` prop instead of `activeData`. The SIL v3.0 field expects a `DemoCareerIntelligenceData` shape, while the API returns `CanonicalCareerAnalysis`.
**Affected Layer:** React State & UI Projection.
**Architectural Invariant:** No demo semantic object may survive a successful real analysis unless it genuinely exists in the analyzed data.
**RED Test:** `test/career-ui-adapter.test.ts` (Failed: `expected null not to be null`).
**Correction:** (In progress) Pure deterministic canonical → SIL adapter.
**GREEN Verification:** CONFIRMED BY REAL LOCAL TEST EXECUTION (Targeted: 2/2 PASS, Full Regression: 22/22 PASS)
**Live GUI Verification:** FAIL (Cannot read properties of undefined (reading 'structured_data'))
**Files Changed:** `test/career-ui-adapter.test.ts`, `lib/career/ui-adapter.ts`, `app/components/career/demo/SemanticCareerIntelligenceField.tsx`, `app/api/career/analyze/route.ts`

### BUG 004 TDD LOG
**RED 1:** Adapter returned null.
**RED 2:** Real source metadata existed but sourceTitle became "Unknown Document".
**RED 3:** SOURCE CORRELATION INVARIANT covered by multi-source regression. 2/2 tests failed before deterministic provenance transport existed.
**LIVE FAIL:** `Cannot read properties of undefined (reading 'structured_data')` at `adaptCanonicalToDemoState`. API response contract mismatch; `route.ts` does not emit `data`, so `json.data` is undefined.

**BUG 004 API RESPONSE CONTRACT GREEN**
API RESPONSE CONTRACT GREEN: CONFIRMED BY REAL LOCAL EXECUTION

**SOURCE PRESENTATION GREEN**
TARGETED GREEN CONFIRMED 1/1
PREVIOUS FULL REGRESSION: 25/25 PASS

**NEW COMPONENT WIRING RED**
TARGETED RED CONFIRMED 1/1
Exact failure: ReferenceError: sourcePresentation is not defined in OrbitalResonanceBubble.tsx:635

**BUG 004B COMPONENT WIRING GREEN**
TARGETED GREEN CONFIRMED 1/1
PRODUCTION BUILD: PASS
FULL REGRESSION: 26/26 PASS (across 7 test files)

**BUG 004 STATUS:**
- BUG 004A (Semantic Propagation): LIVE PASS
- BUG 004B (Source Rendering): LIVE PASS

**LIVE TEST 001A:**
FAIL

**NEW DEFECT: BUG 005 VERIFIED CANONICAL ROLE INVARIANT ESCAPE**
BUG 005 STATUS: CLOSED / LIVE PASS
- BEHAVIORAL RED CONFIRMED
- TARGETED GREEN 12/12
- FULL REGRESSION 27/27
- BUILD PASS
- LIVE E2E PASS (Role Manifestation = 0, Resonance Orbits = 0, 1 SOURCE ACTIVE TXT)

Observed live: organizations = [], roles = [Senior Software Engineer & Lecturer], role relationships = [{ relation_type: "ROLE_IN_ORGANIZATION", target_id: "DOC_..." }]
Despite this, the live analysis completed successfully.
Classification: TESTED VALIDATOR BEHAVIOR ≠ LIVE VERIFIED RESPONSE BEHAVIOR
Root cause: Phase 2.5 Role hierarchy validator rule only checks `relation_type === "ROLE_IN_ORGANIZATION"`. It does not verify the target is actually an organization. Since the ID exists in the global registry (e.g. as a Document), Phase 2.4 does not remove the edge, and Phase 2.5 passes.
Secondary issue: ui-adapter currently masks propagated invalid Role hierarchy through "Unknown Organization".

**RUNTIME GRAPH METRIC INVARIANT:**
VIOLATED (BUG 006). Any numeric UI metric presented as current evidence density, confidence, verified object count, graph count, or comparable runtime semantic state must either:
A) be deterministically derived from the current validated runtime graph / canonical analysis, or
B) be explicitly labeled as static visualization taxonomy / illustrative metadata.
Demo constants must never masquerade as measurements of the current analyzed graph.
If the current runtime model does not contain enough information to support a metric, the UI must not fabricate a numeric value. Absence of a valid metric is preferable to false precision.

**NEW DEFECT: BUG 006 RUNTIME METRIC PROVENANCE VIOLATION**
BUG 006A CLOSED (HUD RUNTIME METRIC FABRICATION) - LIVE E2E PASS CONFIRMED.
BUG 006B CLOSED (STATIC CLUSTER METRICS MASQUERADING AS RUNTIME) - LIVE E2E PASS CONFIRMED.
- LIVE TEST 001A proves runtime-labeled semantic metrics (confidence, evidence density) are fabricated by presentation logic (e.g. `Math.max(12, itemCount * 14)` for density, hardcoded "96%" for confidence).
- BUG 006A ROOT CAUSE CONFIRMED: No valid field Confidence currently exists in the canonical graph. No directly derivable field Evidence Density currently exists. OrbitalResonanceBubble fabricates both when secondaryMetrics is absent. TDD boundary established at OrbitalResonanceBubble implicit metric fallback.
- BUG 006A RED 1: BEHAVIORAL RED CONFIRMED BY REAL LOCAL EXECUTION. `career-ui-metrics-wiring.test.tsx`: 1 PASS, 1 FAIL, 2 TOTAL.
- BUG 006A TARGETED GREEN: 2/2 PASS CONFIRMED. Production fix in `OrbitalResonanceBubble.tsx`. Invariant enforced: EXPLICIT METRIC → RENDER, MISSING METRIC → ABSENT.
- BUG 006A FULL REGRESSION: 29/29 PASS CONFIRMED.
- BUG 006A STATUS: CLOSED / LIVE E2E PASS.
- BUG 006B ROOT CAUSE CONFIRMED: SemanticCareerIntelligenceField fabricates cluster metric literals (e.g. 98%, 14 Verified Objects). TDD boundary: DEMO illustrative metric may exist, but VERIFIED LIVE unsupported metric must be absent. Behavioral component RED blocked by SSR infra. TESTABILITY REFACTOR VERIFIED (29/29). RED TEST CREATED against view-model boundary. BEHAVIORAL RED CONFIRMED. TARGETED GREEN CONFIRMED (1/1 PASS). FULL REGRESSION CONFIRMED (30/30 PASS). PRODUCTION BUILD CONFIRMED (PASS). STATUS: CLOSED / LIVE E2E PASS.

**OPTIONAL COSMETIC DEBT RECORDED:**
The cluster UI still displays the non-numeric label "Verified Objects". This is NOT a BUG 006B failure because no unsupported numeric measurement is presented.

**LIVE STABILITY RECORDS (TEST 001A COMPLETE):**
- BUG 004B source presentation: LIVE STABLE
- BUG 005 role target semantics: LIVE STABLE
- BUG 006A runtime HUD metric provenance: LIVE STABLE

**TEST 001B PDF ONLY**
STATUS: FAIL AT PDF INGESTION BOUNDARY
FIRST FAILURE: ERR_PDF_PARSE_FAILURE (PDF buffer or base64 data is empty or missing)

**BUG 007 PDF PAYLOAD / DATA LOSS**
STATUS: ACTIVE / TARGETED GREEN CONFIRMED

**BUG 008 PDF PARSER RUNTIME IMPORT / INVOCATION FAILURE**
STATUS: ACTIVE / TARGETED GREEN CONFIRMED

**REGRESSION CLUSTER A: Provider/Test Isolation**
STATUS: REPAIRED (Provider Factory Strictly Mocked)

**REGRESSION CLUSTER B: Legacy UI Metric Expectation**
STATUS: REPAIRED (Stale Assertions Removed)

**BUG 009 NEXT.JS / TURBOPACK PDF WORKER RUNTIME RESOLUTION**
STATUS: ACTIVE / TARGETED GREEN CONFIRMED / PDF REGRESSION SUBSET PENDING
- Root Cause: Next/Turbopack server bundling severed pdf.js worker resolution.
- Minimal GREEN: `serverExternalPackages: ["pdf-parse"]` in `next.config.ts` plus server-side `import "pdf-parse/worker"` in loader.
- Test Infrastructure Findings: The automated Next-runtime RED required substantial test-harness hardening to resolve port collisions (EADDRINUSE) and Next.js dev lock conflicts. Additional test-harness flakiness arose from stdout chunking/ANSI codes masking the "Ready" event, which was subsequently mitigated by independent HTTP polling.

**BUG 010A GEMINI SCHEMA-CONSTRAINED OUTPUT GAP**
STATUS: CANDIDATE / TARGETED GREEN PENDING / FULL REGRESSION PENDING
- Live Error: "Invalid enum value. Expected: SUPPORTS, REQUIRES... Received: BELONONGS_TO_CLASS"
- Minimal GREEN Implemented: Injected projected `responseJsonSchema`.

**BUG 010B GEMINI SCHEMA ACCEPTANCE FAILURE**
STATUS: CANDIDATE / GENUINE CONTRACT RED CONFIRMED / TARGETED GREEN PENDING
- Live Error: "400 INVALID_ARGUMENT reference to undefined schema at top-level"
- Trace Finding: The external dependency `zod-to-json-schema` defaults to emitting `definitions` and `$ref: "#/definitions/..."` despite `target: "jsonSchema2019-09"`. Because Gemini parses `$defs` internally but receives `definitions`, the top-level `$ref` fails to resolve.
- Genuine RED: SDK mock test successfully failed because `schema.definitions` was defined instead of undefined.
- Minimal GREEN Implemented: Configured `definitionPath: "$defs"` in the converter options to natively emit Gemini-compatible references without manual path rewriting.
- Regression Status: BUG010B first GREEN attempt reached compatibility audit but exposed a test walker false positive caused by the canonical domain property "$schema". Fixed test walker to semantically distinguish schema keywords from property names. No production regression.
- Action: Awaiting `career-gemini-schema-projector.test.ts` targeted GREEN execution by user.

**ROLE RELATION TARGET-TYPE INVARIANT:**
A ROLE_IN_ORGANIZATION relationship is valid only when its target_id resolves to an entity in the canonical organizations collection. Global target existence is necessary but not sufficient. Role → Document (or any non-Organization entity) must NOT satisfy the Role hierarchy requirement.

**FINAL TEST BOUNDARY:**
`route.ts` → imports `buildCareerAnalysisSuccessResponse` → `lib/career/api-response.ts`
integration test → imports SAME production function → `lib/career/api-response.ts`
No duplicated test implementation.

### INVARIANTS DISCOVERED

#### VERIFIED RESPONSE CONTRACT INVARIANT
Any `/api/career/analyze` response with `success = true` and `status = VERIFIED` that is consumable by SIL MUST expose the complete validated `CanonicalCareerAnalysis` at exactly `response.data`. Transport/provenance metadata remains outside canonical semantic data (e.g. `response.sourceManifest`, `response.inferenceTelemetry`). There is ONE success contract. No alternate canonical response paths, no client guessing, no demo fallback.

#### SIL SOURCE RENDERING INVARIANT
After successful analysis, every visible source count, source badge, source label and source provenance indicator in SIL must derive from the current runtime source state associated with the validated analysis. Initialization/demo sources must never remain visible after real analysis has replaced runtime state. A semantic entity may not be presented as grounded in a source that was not part of the current analysis. Wrong provenance is forbidden.

#### SOURCE CORRELATION INVARIANT
Semantic document identity and ingestion source identity are distinct. Any projection from canonical analysis back to source metadata must use an explicit deterministic correlation mechanism. Source metadata must never be attached to a canonical document merely because both happen to occupy the same array index. Wrong provenance is forbidden.

#### SOURCE IDENTITY OWNERSHIP INVARIANT
Ingestion provenance identity is assigned and preserved by deterministic system layers. An LLM must never be responsible for creating the identity used to correlate a validated document back to its physical/input source. LLM semantic extraction may enrich a document; it may not establish provenance correlation.

#### STATE PROPAGATION INVARIANT
After successful real analysis, `activeData` is the runtime single source of truth (SSOT) for SIL visualization. Demo semantic data is initialization-only and must not survive as fallback knowledge.



### SOURCE CORRELATION INVARIANT
**Semantic document identity and ingestion source identity are distinct.**
Any projection from canonical analysis back to source metadata must use an explicit deterministic correlation mechanism. Source metadata must never be attached to a canonical document merely because both happen to occupy the same array index. Wrong provenance is forbidden.
