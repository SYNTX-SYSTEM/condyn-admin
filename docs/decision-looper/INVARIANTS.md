# Decision Looper Invariants

The Decision Looper domain within CONDYN adheres to a strict set of architectural and domain logic invariants. Any violation of these invariants fails the system integrity checks.

## 1. The Explainability Bound
**`FIT_SCORE <= EXPLAINABILITY_SCORE`**
Every supported requirement is inherently resolved. A recommendation cannot have an explainability score lower than its underlying evidence-grounded fit score. An opaque model guess is invalid.

## 2. The Decision Boundary
**`RECOMMENDATION ≠ DECISION`**
A Recommendation is a calculated proposal. A Decision is an intentional, irreversible snapshot of that recommendation taken by a designated actor. A Decision must accurately reflect the snapshot of the Recommendation at the time it was made.

## 3. The Outcome Independence Rule
**`ACTION ≠ OUTCOME ≠ EVALUATION`**
Actions merely produce Outcomes (a state of the world). Outcomes are objective observations and do not inherently carry subjective Evaluation (desirable/undesirable). 

## 4. The Learning Attribution Boundary
**`OUTCOME ≠ FEEDBACK ≠ ATTRIBUTION ≠ LEARNING`**
Feedback evaluates Outcomes. Attribution traces that Feedback back to canonical graph features (Capabilities/Requirements). Learning Proposals analyze those Attributions to suggest Policy improvements. The chain must be rigorously connected but remain semantically distinct.

## 5. Explicit Policy Promotion
**`LEARNING ≠ POLICY ACTIVATION`**
Learning may propose a different future. Learning may never mutate historical truth, and may never silently change the active decision policy. Policy activation is a discrete, auditable event (Promotion) and historical evaluations must explicitly declare the baseline and candidate policies compared.

## 6. Immutable Lifecycle Persistence
**`Persistence preserves canonical truth; it must never re-interpret or fabricate it.`**
Historical artifacts are append-only. Any attempt to overwrite or silently repair a persisted ID with a divergent canonical payload must result in a Hard Conflict (`ERR_IMMUTABLE_RECORD_CONFLICT`). Lineage tracking (e.g., Action back to Commitment) must be enforced via relational foreign keys.

## 7. The Concurrency Truth Boundary
**`DUPLICATE DELIVERY ≠ DUPLICATE REALITY`**
Exactly-once transport is not claimed. The architecture guarantees at-least-once delivery with effectively-once historical persistence. Two concurrent processes attempting to register identical facts will result in one physical record without error, while conflicting submissions for the same ID strictly raise an immutable conflict. No duplicate count or fuzzy deduplication is permitted.
