# Field 02 — Canonical Career End-to-End Runtime

## Status and dependency

Planned; depends on Field 01. It is one field spanning canonical production,
identity persistence, read composition, API, SIL, and the six-orbit frontend.

## Semantic objective

Close this exact path without duplicate carriers or selection authority:

authorized canonical inputs → canonical artifacts → persistence → exact runtime
identities → `CanonicalSilReadIdentitySet` → `readCanonicalSilReadModel(...)`
→ `CanonicalSilReadModel` → product API → frontend transport →
`SemanticCareerIntelligenceField` → six orbit projections.

## Current executable state

Existing implementation includes `lib/career/sil-projection/canonical-read-model.ts`,
`server-read-service.ts`, the `/career/demo` route,
`CareerIntelligenceDashboard`, `SemanticCareerIntelligenceField`, and existing
SIL/read-model tests. Existing career relation persistence covers organization,
role, tension, evolution, and proposal-adjacent artifacts. Field 01 determines
which production carriers and local overlay components are canonical before any
new identity carrier is introduced.

## Authority, inputs, and non-goals

This field reuses only exact persisted identities:
`candidateSourceBundleId`, `verifiedCapabilitySnapshotId`,
`organizationRelationId`, `roleRelationId`, `tensionStateId`, and
`evolutionInputStateId`. It must first inspect manifests, association rows,
projection references, job lineage, T5–T11 results, and persisted carriers.
It must not infer latest Target, current revision, best Role, preferred
Organization, active branch, fit truth, success, causality, or recommendation
authority. If an input is absent, stop that branch with
`SEMANTIC_AUTHORITY_DECISION_REQUIRED` or `PRODUCT_DECISION_REQUIRED`.

## Internal work units

1. Reuse or close canonical production and exact six-identity persistence.
2. Close restart-safe SIL read composition and authority-neutral API transport.
3. Migrate the six-orbit frontend from proven legacy compatibility surfaces and
   prove the full product integration path.

## SIL, API, and frontend scope

Preserve `AVAILABLE`, `EMPTY`, `NOT_PRODUCED`, `UNKNOWN`, and `FAILED` across
repository, application, API, and rendering. API exposes exact canonical read
state and never discovers a current/latest artifact. The frontend may render,
format, position, animate, and focus; it may not create semantic authority.

The mapping is fixed: Identity ← identity; Capability ← capability; Resonance ←
resonance; Role ← role; Tension ← tension; Evolution ← evolution, all from the
canonical read model. Trace legacy `adaptCanonicalToDemoState`, legacy verified
analysis projections, organizations, roles, capability gaps, and strategies
before removing semantic dependence; retain compatibility until replacement is
proven.

## RED/GREEN and integration proof

RED covers authorized inputs through canonical artifacts, six exact identities,
restart, SIL read, API, and six projections. GREEN must prove persisted
artifacts → identity association → read identity set → read model → transport
→ frontend, preserving every identity and absence state. Rebound frontend
failures to API, read composition, identity propagation, or production.

## Completion, stop, and report

Complete when the visible six-orbit product is canonically driven end to end;
legacy verified analysis may remain only without semantic authority. Stop at a
true authority/product boundary. Report reused versus added carriers, all
identity lineage, state preservation, transport/UI proof, legacy residuals,
and unimplemented authority boundaries.
