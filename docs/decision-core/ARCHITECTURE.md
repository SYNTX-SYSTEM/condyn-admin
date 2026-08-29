# Decision Core architecture

## Scope through Phase 8D5

Decision Core is a generic, producer-neutral module for consuming governed producer state and forming a deterministic structural `DecisionContextDraft`. It is separate from Capability Core. Capability Core publishes capability/evidence-oriented Phase-4 snapshots; Decision Core does not require that ontology and can consume any producer that implements a compatible authority resolver.

The implemented architecture through Phase 5D3 establishes the generic, producer-neutral state foundation. Phase 6A adds the adjacent generic `assessment-request` contract: a standalone, explicitly human-declared normative frame that references one DREV-shaped revision and declared DCI-shaped item selections. It does not resolve that revision, read a repository, validate referenced item membership or roles, assess anything, derive Decision Need, score or rank, recommend, record a human decision, or close the human-machine loop.

Phase 6B adds the adjacent generic `assessment-basis` contract. It binds one sealed request to one exact reader-returned sealed revision, verifies referenced item membership and declared roles, and creates a detached deterministic basis. It does not establish persistence authority, current producer authority, current/head/latest state, lineage, assessment, Decision Need, recommendation, or human decision.

Phase 6C adds the adjacent generic `assessment-proposal` contract. It consumes one sealed revision-bound assessment basis, one composition-time bound evaluator, and declared `MODEL_PROPOSAL` provenance to represent zero or more human-selected `OPTION × OBJECTIVE/CONSTRAINT` semantic assessment relations. It does not rank, score, recommend, derive Decision Need, decide, establish provider authority, or close the human-machine loop.

Phase 6D adds the adjacent generic `recommendation-proposal` contract. It consumes one sealed assessment proposal, one bound generic semantic recommendation capability, and declared `MODEL_PROPOSAL` provenance to create a detached canonical recommendation proposal. It does not rank, score, select a winner, derive Decision Need, make a human decision, persist recommendation state, or close the human-machine loop.

Phase 6E adds the adjacent generic `proposal-coherence` contract. It consumes one sealed recommendation proposal and deterministically reconstructs the represented assessment criterion trace for each recommended option. It introduces no model, provider, evaluator, generator, human actor, reader, repository, persister, lineage traversal, authority resolver, or decision maker. It does not establish truth, recommendation correctness, support, suitability, optimality, Decision Need, human decision, action, outcome, feedback, or readiness.

Phase 7A adds the adjacent generic `human-decision` contract: the first explicit human normative state transition. It consumes one sealed `DecisionProposalCoherenceValidation`, one declared human actor, one or more explicit revision `OPTION` choices, and optional human rationale to create one detached `HumanDecisionDeclaration`. Its choice admission is the complete sealed revision's `OPTION` ontology, not the assessment-selection, assessment, recommendation, or trace inventories. It does not establish recommendation correctness, truth, authenticated identity, authorization, action, outcome, feedback, learning, or persistence authority.

Phase 8A1 adds the adjacent generic `action-intent` contract: the first explicit operationalization state after human decision. It consumes one sealed `HumanDecisionDeclaration`, one declared human intent declarer, a nonempty explicit subset of the human-chosen options, an opaque operation description, and optional human rationale to create one detached `DecisionActionIntent`. It does not establish commitment, action, execution, completion, outcome, feedback, learning, authorization, authenticated identity, or persistence authority.

Phase 8A2 adds the adjacent generic `human-commitment` contract. It consumes one sealed complete `DecisionActionIntent`, one declared human commitment actor, and optional human rationale to create one detached `HumanCommitment`. It records declared commitment only: it establishes neither responsibility, ownership, accountability, assignment, authorization, execution, completion, outcome, feedback, learning, authenticated identity, nor persistence authority.

Phase 8B adds the adjacent generic `action-occurrence-claim` contract. An explicit represented `HUMAN_INPUT` or `AUTHORITATIVE_STATE` source claims that an opaque described operation occurred. It establishes neither Action occurrence fact, observed reality, execution proof, semantic occurrence support, authority of reality, outcome, feedback, learning, authenticated identity, current source authority, nor persistence authority.

Phase 8C1 adds the standalone `state-change-claim` contract. An explicit represented `HUMAN_INPUT` or `AUTHORITATIVE_STATE` source claims that an opaque described state change occurred. It establishes neither state-change fact, observed reality, verified change, effect, outcome, consequence, causal claim, semantic state-change support, authority of reality, current source authority, nor persistence authority.

Phase 8C2 adds the `action-state-change-association` contract. It consumes one complete sealed `ActionOccurrenceClaim`, one complete sealed `StateChangeClaim`, and explicit represented provenance to construct one detached `ActionStateChangeAssociationProposal`. It establishes neither relation truth, outcome, effect, consequence, attribution, causation, semantic support, current authority, authority of reality, persistence authority, temporal relation, Action fact, nor State Change fact.

Phase 8C3 adds the `outcome-attribution-proposal` contract. It consumes one complete sealed `ActionStateChangeAssociationProposal` and explicit represented outcome-attribution provenance to construct one detached `OutcomeAttributionProposal`. It represents only a proposal that the association's already represented State Change Claim has an outcome role relative to that association's already represented Action Occurrence Claim. It establishes neither outcome truth or fact, relation truth, effect truth, consequence truth, causation, causal support, semantic support, current or publication authority, authority of reality, persistence authority, nor temporal relation.

Phase 8D1 adds the `context-observation-proposal` contract. It consumes one complete sealed `OutcomeAttributionProposal`, one explicit opaque statement, and explicit represented provenance to construct one detached `DecisionContextObservationProposal`. It represents an `OBSERVATION`-role candidate for a future Decision Context only. It does not create a `DecisionContextItem`, admit state into a Decision Context, create a revision, or close the loop; it establishes neither observation truth, outcome truth, semantic support, causation, authority of reality, nor persistence authority.

Phase 8D2 adds the `context-observation-admission` contract. One declared human actor explicitly declares one sealed `DecisionContextObservationProposal` admitted as eligible for future `OBSERVATION`-role materialization in a Decision Context, with an optional opaque rationale. It is positive human normative admission declaration state only. It does not materialize a `DecisionContextItem`, create or mutate a Decision Context, create a revision, establish truth, support, causation, authentication, external authorization, persistence authority, or close the loop.

Phase 8D3 adds the `context-observation-item-projection` contract. It deterministically derives the exact future `OBSERVATION`-item input semantics represented by one sealed `DecisionContextObservationAdmissionDeclaration`, retaining the complete sealed admission lineage. It does not create a `DecisionContextItem`, establish item identity or Context membership, identify or mutate a target Context, create a revision, establish truth, support, causation, current authority, persistence authority, or close the loop.

Phase 8D4A adds the `context-observation-target-declaration` contract. One declared human actor explicitly declares one sealed `DecisionContextObservationItemProjection` intended to be carried forward from one DREV-shaped declared base-state reference in possible future Context processing. It does not prove revision existence, bind a sealed revision, establish current/head/latest state, materialize an item, establish Context membership, mutate a Context or revision, create a revision, establish truth, support, causation, persistence authority, or close the loop.

The implemented architecture has distinct branches, not one automatic pipeline:

```text
DECISION / INTENTION PATH
HumanDecisionDeclaration -> DecisionActionIntent -> HumanCommitment -> STOP

ACTION OCCURRENCE CLAIM PATH
HUMAN_INPUT -----------\
                         -> ActionOccurrenceClaim
AUTHORITATIVE_STATE ---/

STATE CHANGE CLAIM PATH
HUMAN_INPUT -----------\
                         -> StateChangeClaim
AUTHORITATIVE_STATE ---/

EXPLICIT ASSOCIATION PROPOSAL PATH
ActionOccurrenceClaim ----------------\
                                        \
StateChangeClaim ------------------------> ActionStateChangeAssociationProposal
                                        /
explicit provenance ------------------/

ActionStateChangeAssociationProposal -> STOP

NO AUTOMATIC EDGE BETWEEN THE CLAIM PATHS

EXPLICIT OUTCOME ATTRIBUTION PROPOSAL PATH
sealed ActionStateChangeAssociationProposal ---\
                                                 > OutcomeAttributionProposal
explicit outcome-attribution provenance -------/

OutcomeAttributionProposal -> STOP

NO AUTOMATIC EDGE FROM ASSOCIATION PROPOSAL
TO OUTCOME ATTRIBUTION PROPOSAL

EXPLICIT DECISION CONTEXT OBSERVATION PROPOSAL PATH
sealed OutcomeAttributionProposal --------\
                                           \
explicit opaque statement -----------------> DecisionContextObservationProposal
                                           /
explicit provenance ----------------------/

DecisionContextObservationProposal -> STOP

NO AUTOMATIC EDGE FROM OUTCOME ATTRIBUTION PROPOSAL
TO DECISION CONTEXT OBSERVATION PROPOSAL

NO AUTOMATIC EDGE FROM DECISION CONTEXT OBSERVATION PROPOSAL
TO DECISION CONTEXT

EXPLICIT DECISION CONTEXT OBSERVATION ADMISSION PATH
sealed DecisionContextObservationProposal
+ declared HUMAN_INPUT actor
+ optional opaque rationale
-> DecisionContextObservationAdmissionDeclaration
-> STOP

NO AUTOMATIC EDGE FROM DECISION CONTEXT OBSERVATION PROPOSAL
TO DECISION CONTEXT OBSERVATION ADMISSION DECLARATION

NO AUTOMATIC EDGE FROM DECISION CONTEXT OBSERVATION ADMISSION DECLARATION
TO DECISION CONTEXT ITEM

EXPLICIT DECISION CONTEXT OBSERVATION ITEM PROJECTION PATH
sealed DecisionContextObservationAdmissionDeclaration
-> DecisionContextObservationItemProjection
-> STOP

NO AUTOMATIC EDGE FROM DECISION CONTEXT OBSERVATION ADMISSION DECLARATION
TO DECISION CONTEXT OBSERVATION ITEM PROJECTION

NO AUTOMATIC EDGE FROM DECISION CONTEXT OBSERVATION ITEM PROJECTION
TO DECISION CONTEXT ITEM

EXPLICIT DECISION CONTEXT OBSERVATION TARGET DECLARATION PATH
sealed DecisionContextObservationItemProjection
+ declared DREV-shaped revision reference
+ declared HUMAN_INPUT actor
+ optional rationale
-> DecisionContextObservationTargetDeclaration
-> STOP

NO AUTOMATIC EDGE FROM DECISION CONTEXT OBSERVATION ITEM PROJECTION
TO DECISION CONTEXT OBSERVATION TARGET DECLARATION

NO AUTOMATIC EDGE FROM DECISION CONTEXT OBSERVATION TARGET DECLARATION
TO REVISION BINDING

NO AUTOMATIC EDGE FROM DECISION CONTEXT OBSERVATION TARGET DECLARATION
TO MATERIALIZATION
```

## Implemented layers

| Layer | Implemented responsibility | Principal contract |
| --- | --- | --- |
| Producer authority | A producer supplies an `AuthoritativeStateResolver` behind a producer-specific contract. | producer adapter/resolver |
| Generic authority consumption (5A) | Bind resolvers once and resolve only opaque state references. | `BoundAuthoritativeStateReader` |
| Context structure (5B) | Canonically construct and structurally assert a pre-validation decision environment. | `DecisionContextDraft` |
| Context authority gate (5C1) | Re-resolve every context source reference at operation time through a bound reader. | `BoundDecisionContextAuthorityValidator` |
| Semantic evidence binding (5C2) | Re-resolve and isolate every source payload, then produce canonical item/reference semantic proposals. | `BoundSemanticEvidenceBinder` |
| Explicit structural expectation (5C3A) | Canonically represent an explicit structural comparison target associated with one structurally valid context under the sealed Phase-5B contract. | `StructuralExpectation` |
| Explicit structural relation proposal (5C3B) | Canonically represent one caller-supplied structural item/item relation proposal associated with one structurally valid context. | `StructuralRelationProposal` |
| Structural gap reconstruction (5C3C) | Deterministically compare one explicit expectation with one explicit represented observation basis. | `StructuralGap` or `null` |
| Structural consequence propagation (5C3D) | Derive one explicit-path basis-relative consequence from one validated item-anchored gap and one caller-supplied ordered dependency path. | `StructuralConsequence` |
| Validation assembly (5C4) | Canonically assemble revalidated explicit structural derivations for one context. | `DecisionContextValidationAssembly` |
| Immutable revision artifact (5D1) | Canonically capture one self-contained context plus its revalidatable derivation state; it is not persisted authority. | `DecisionContextRevision` |
| Repository-bound immutable persistence authority (5D2A) | The shipped in-memory repository/persister path persists one valid complete revision with immediate-parent integrity, immutable replay/conflict handling, and exact post-write reread. | `DecisionContextRevisionRepository` capability shape; `InMemoryDecisionContextRevisionRepository` enforcement |
| Durable PostgreSQL persistence adapter (5D2B) | Implements the sealed 5D2A persistence semantics against an injected PostgreSQL/Drizzle dependency, with physical self-FK integrity, race-safe immutable insert, and client/repository reconstruction survival. | `PostgresDecisionContextRevisionRepository` |
| Read-only revision lineage reconstruction (5D3) | Follows one supplied revision's explicit predecessor references through a bound generic reader and returns a detached root-to-start predecessor path. | `BoundDecisionContextRevisionLineageReconstructor` |
| Human-owned assessment request (6A) | Records one declared human normative frame through shape-only DREV/DCI references; it has no revision reader, repository, evaluator, or decision operation. | `DecisionAssessmentRequest` |
| Revision-bound assessment basis (6B) | Binds one sealed request to one exact sealed revision read and validates referenced context membership/roles without assessing or deciding. | `DecisionAssessmentBasis` |
| Semantic assessment proposal (6C) | Consumes one sealed revision-bound assessment basis and one bound semantic evaluator, admits only human-selected `OPTION × OBJECTIVE/CONSTRAINT` relations, and creates one canonical model-proposal artifact without ranking, recommending, deriving Decision Need, or deciding. | `DecisionAssessmentProposal` |
| Recommendation proposal (6D) | Consumes one sealed assessment proposal and one bound semantic recommendation capability, admits only selected and assessment-represented options, and creates one canonical model-proposal artifact without ranking, deciding, or acting. | `DecisionRecommendationProposal` |
| Proposal coherence validation (6E) | Deterministically reconstructs the exact represented assessment criterion trace for each recommendation in one sealed recommendation proposal, without interpreting dispositions, rationale, support, correctness, or readiness. | `DecisionProposalCoherenceValidation` |
| Human decision declaration (7A) | Records one explicit positive human selection of one or more actual revision `OPTION` items, independent of the model-proposal path, without action or outcome semantics. | `HumanDecisionDeclaration` |
| Decision-bound action intent (8A1) | Records one opaque intended operation for a nonempty explicit subset of one sealed human decision's chosen options, without commitment, action, execution, or outcome semantics. | `DecisionActionIntent` |
| Human commitment (8A2) | Records one declared human commitment to one complete sealed Action Intent, without assignment, authorization, execution, action, outcome, or persistence semantics. | `HumanCommitment` |
| Action occurrence claim (8B) | Records one standalone source-attributed claim that an opaque described operation occurred, without fact, observation, execution, performer, temporal, outcome, or persistence semantics. | `ActionOccurrenceClaim` |
| State change claim (8C1) | Records one standalone source-attributed claim that an opaque described state change occurred, without fact, observation, verified change, effect, outcome, consequence, causation, temporal, or persistence semantics. | `StateChangeClaim` |
| Action-state-change association proposal (8C2) | Records one explicit provenance-attributed proposal associating one sealed Action Occurrence Claim endpoint with one sealed State Change Claim endpoint, without relation truth, outcome, effect, consequence, attribution, causation, temporal, or persistence semantics. | `ActionStateChangeAssociationProposal` |
| Outcome attribution proposal (8C3) | Records one explicit provenance-attributed proposal that the sealed association's represented State Change Claim has an outcome role relative to its represented Action Occurrence Claim, without outcome truth, relation truth, causation, temporal, or persistence semantics. | `OutcomeAttributionProposal` |
| Decision Context observation proposal (8D1) | Records one explicit provenance-attributed opaque statement as an `OBSERVATION`-role candidate for a future Decision Context, based on one sealed Outcome Attribution Proposal, without Context Item creation, admission, revision, truth, support, causation, temporal, or persistence semantics. | `DecisionContextObservationProposal` |
| Decision Context observation admission declaration (8D2) | Records one positive declared human admission of one sealed observation proposal as eligible for future `OBSERVATION`-role materialization, without materialization, Context mutation, revision, truth, support, causation, authentication, authorization, temporal, or persistence semantics. | `DecisionContextObservationAdmissionDeclaration` |
| Decision Context observation item projection (8D3) | Deterministically projects one sealed admission declaration into exact future `OBSERVATION`-item input semantics while retaining admission lineage, without item materialization, identity, Context membership, Context mutation, revision, truth, support, causation, temporal, or persistence semantics. | `DecisionContextObservationItemProjection` |
| Decision Context observation target declaration (8D4A) | Records one declared human target declaration over one sealed observation item projection and one DREV-shaped base-state reference, without revision binding or existence proof, materialization readiness, Context membership, Context mutation, revision creation, truth, support, causation, temporal, or persistence semantics. | `DecisionContextObservationTargetDeclaration` |

The current Capability Core adapter in `lib/decision-adapters/capability-core.ts` is one producer-specific integration. It is not part of the generic Decision Core kernel.

## Forward lifecycle

```text
Capability Core Phase-4 publisher
  -> persisted PHASE4_VERIFIED capability snapshot
  -> Capability Core authority adapter
  -> AuthoritativeStateResolver
  -> BoundAuthoritativeStateReader
  -> AuthoritativeStateResolution (detached reference + resolver-returned opaque payload)

DecisionContextDraft input
  -> deterministic structural capture and assertion
  -> canonical sourceStateReferences
  -> BoundDecisionContextAuthorityValidator
  -> operation-time bound-reader resolution for every reference
  -> exact returned-reference equality
  -> Promise<void>

DecisionContextDraft input
  -> complete structural capture and assertion
  -> Stage A: resolve every canonical reference, verify every returned reference, detach every payload, reject shared memory
  -> Stage B: bound semantic evaluation for each prepared state
  -> canonical SemanticEvidenceBindingProposal[]

DecisionContextDraft input + explicit StructuralExpectationInput
  -> defensive structural capture and assertion against the sealed Phase-5B contract
  -> context item/reference membership checks
  -> canonical expectation body and provenance
  -> deterministic DEXP identity
  -> canonical StructuralExpectation

DecisionContextDraft input + explicit StructuralRelationProposalInput
  -> defensive context/input capture and context structural assertion
  -> item membership and AUTHORITATIVE_STATE provenance-reference membership checks
  -> CONTRADICTION endpoint canonicalization or DEPENDENCY direction preservation
  -> deterministic DREL identity
  -> canonical StructuralRelationProposal

DecisionContextDraft + StructuralExpectation + explicit StructuralGapObservationBasis
  -> defensive context, expectation, and basis validation
  -> expectation-specific structural comparison
  -> null OR canonical StructuralGap

DecisionContextDraft + StructuralExpectation + StructuralGapObservationBasis + StructuralGap
+ explicit StructuralConsequencePropagationBasis
  -> operation-local source-gap revalidation
  -> explicit ordered DEPENDENCY-path validation
  -> canonical StructuralConsequence

DecisionContextDraft + explicit expectation/consequence derivation inputs
  -> operation-local predecessor contract revalidation
  -> canonical expectation results and consequence IDs
  -> DecisionContextValidationAssembly

DecisionContextRevisionInput
  -> one detached operation-local snapshot
  -> sealed DecisionContextDraft and validation-assembly revalidation
  -> canonical validation input and reconstructed canonical assembly
  -> deterministic DREV identity
  -> self-contained DecisionContextRevision

InMemoryDecisionContextRevisionRepository
  -> createDecisionContextRevisionPersister()
  -> bound persist(DecisionContextRevision)
  -> detached capture and sealed 5D1 assertion
  -> immediate parent lookup for a child only
  -> runtime-private immutable write using a detached writer copy
  -> exact post-write repository reread and sealed revision assertion
  -> complete-artifact equality with the pristine expected revision
  -> detached repository-selected DecisionContextRevision

PostgresDecisionContextRevisionRepository
  -> createDecisionContextRevisionPersister()
  -> sealed bound persist(DecisionContextRevision)
  -> immediate parent read for a child only
  -> runtime-private INSERT ... ON CONFLICT DO NOTHING writer
  -> conflict-race winner reread where needed
  -> sealed 5D2A exact post-write reread and complete-artifact equality
  -> detached PostgreSQL-backed DecisionContextRevision

BoundDecisionContextRevisionLineageReconstructor
  -> reconstruct(startRevisionId)
  -> validate DREV-shaped start ID before read
  -> bound getRevisionById(requestedRevisionId)
  -> sealed DecisionContextRevision assertion and exact requested-ID check
  -> repeat explicit previousRevisionId until null
  -> detached ROOT -> ... -> START predecessor lineage

DecisionAssessmentRequestInput
  -> defensive exact data capture
  -> DREV/DCI shape checks only
  -> actor trim + selection canonicalization
  -> deterministic DAREQ identity
  -> detached DecisionAssessmentRequest

DecisionAssessmentRequest
  + exact bound getRevisionById capability
  -> createBoundDecisionAssessmentBasisBinder(...)
  -> bind(request)
  -> exact request.revisionId read
  -> sealed DecisionContextRevision capture/assertion
  -> exact requested/returned revision-ID equality
  -> question + selected item membership/role verification
  -> complete-state DABAS identity
  -> detached DecisionAssessmentBasis
  -> STOP

DecisionAssessmentBasis
  + exact bound DecisionAssessmentEvaluator capability
  + declared MODEL_PROPOSAL provenance
  -> createBoundDecisionAssessmentProposer(...)
  -> propose(basis, proposedBy)
  -> sealed basis capture/assertion
  -> detached evaluator input
  -> zero-or-more evaluator assessment relations
  -> selected target admission
  -> duplicate-target rejection
  -> canonical relation ordering
  -> complete-state DASPR identity
  -> detached DecisionAssessmentProposal
  -> STOP

DecisionAssessmentProposal
  + exact bound DecisionRecommendationGenerator capability
  + declared MODEL_PROPOSAL provenance
  -> createBoundDecisionRecommendationProposer(...)
  -> propose(assessmentProposal, proposedBy)
  -> sealed assessment proposal capture/assertion
  -> detached generator input
  -> zero-or-more recommendation representations
  -> selected and assessment-represented option admission
  -> duplicate-option rejection
  -> canonical recommendation ordering
  -> complete-state DRECP identity
  -> detached DecisionRecommendationProposal
  -> STOP

DecisionRecommendationProposal
  -> validateDecisionProposalCoherence(...)
  -> sealed recommendation proposal capture/assertion
  -> deterministic recommended-option assessment-trace reconstruction
  -> canonical trace and criterion ordering
  -> complete-state DPCV identity
  -> detached DecisionProposalCoherenceValidation
  -> STOP

DecisionProposalCoherenceValidation
  + declared HUMAN_INPUT actor
  + one-or-more explicit option choices
  + optional human rationale
  -> createHumanDecisionDeclaration(...)
  -> sealed validation capture/assertion
  -> complete embedded revision OPTION admission
  -> canonical chosen-option order
  -> complete-state DHDEC identity
  -> detached HumanDecisionDeclaration
  -> STOP

HumanDecisionDeclaration
  + declared HUMAN_INPUT intent declarer
  + nonempty explicit subset of chosen option IDs
  + opaque operation description
  + optional human rationale
  -> createDecisionActionIntent(...)
  -> sealed human decision capture/assertion
  -> chosen-option-subset admission only
  -> canonical option order and complete-state DAINT identity
  -> detached DecisionActionIntent
  -> STOP
```

The Capability adapter captures only `getSnapshotByKey` from the supplied repository. For its fixed producer/contract pair it reads by the opaque locator, validates the existing `VerifiedCapabilitySnapshot`, requires `status: "VERIFIED"` and `publication.mode: "PHASE4_VERIFIED"`, recomputes the snapshot key, checks the locator and `snapshotId`, and returns a detached clone. That producer-specific behavior is outside the generic reader.

## State, authority, and semantics

The following distinctions are implemented architectural boundaries:

```text
STATE CONTENT                 != STATE AUTHORITY
REFERENCE                     != AUTHORITY TOKEN
SUCCESSFUL RESOLUTION         != PORTABLE AUTHORITY
AUTHORITATIVE STATE           != SEMANTIC SUPPORT
PROVENANCE                    != SEMANTIC SUPPORT
SEMANTIC EVALUATION           != VERIFIED TRUTH
SUPPORTED                     != COMPLETENESS
NOT EXAMINED                  != NOT_SUPPORTED
CONTRADICTED BINDING          != STRUCTURAL CONTRADICTION
SEMANTIC INSPECTION CAPABILITY != PRODUCER MUTATION CAPABILITY
DECISION CONTEXT              != RECOMMENDATION
DECISION CONTEXT              != SEMANTIC BINDING PROPOSAL
RECOMMENDATION                != HUMAN DECISION
HUMAN INPUT                   != EVIDENCE TRUTH
MODEL PROPOSAL                != HUMAN ADOPTION
AUTHORITY OF RECORD           != TRUTH
AUTHORITY OF RECORD           != SEMANTIC CORRECTNESS
AUTHORITY OF RECORD           != CURRENT PRODUCER AUTHORITY
AUTHORITY OF RECORD           != CURRENT DECISION STATE
AUTHORITY OF RECORD           != HEAD
AUTHORITY OF RECORD           != LATEST
AUTHORITY OF RECORD           != ACTIVE
PERSISTED                     != TRUE
PERSISTED                     != CURRENT
OBSERVED STRUCTURE            != EXPECTED STRUCTURE
EXPECTATION                   != FACT
EXPECTATION                   != OBSERVATION
EXPECTATION                   != SATISFACTION
EXPECTATION                   != FINDING
EXPECTATION                   != GAP
EXPECTATION                   != DECISION NEED
EXPECTATION                   != PRIORITY
EXPECTATION                   != RECOMMENDATION
DEPENDENCY EXPECTATION        != DEPENDENCY FINDING
EXPECTATION                   != RELATION PROPOSAL
RELATION PROPOSAL             != RELATION TRUTH
RELATION PROPOSAL             != FINDING
CONTRADICTION PROPOSAL        != FORMAL LOGICAL CONTRADICTION
CONTRADICTION PROPOSAL        != CONTRADICTED SEMANTIC EVIDENCE BINDING
DEPENDENCY PROPOSAL           != DEPENDENCY EXPECTATION
DEPENDENCY PROPOSAL           != DEPENDENCY FINDING
RELATION PROPOSAL             != GAP
RELATION PROPOSAL             != CONSEQUENCE
RELATION PROPOSAL             != DECISION NEED
RELATION PROPOSAL             != PRIORITY
RELATION PROPOSAL             != RECOMMENDATION
RELATION ONTOLOGY             != RELATION DISCOVERY
EXPECTATION / RELATION PROPOSAL != DERIVED GAP
ABSENCE                       != GAP
NO RELATION PROPOSAL          != GAP
GAP                           != REAL-WORLD ABSENCE
GAP                           != GLOBAL INCOMPLETENESS
GAP                           != SEMANTIC TRUTH
GAP                           != DECISION NEED
GAP                           != PRIORITY
GAP                           != CONSEQUENCE
GAP                           != RECOMMENDATION
GAP                           != HUMAN DECISION
DEPENDENCY PROPOSAL           != CONSEQUENCE
VALID DREL PATH               != TRUE DEPENDENCY PATH
STRUCTURAL CONSEQUENCE        != REAL-WORLD EFFECT
STRUCTURAL CONSEQUENCE        != PREDICTION
STRUCTURAL CONSEQUENCE        != OUTCOME
STRUCTURAL CONSEQUENCE        != DECISION NEED
STRUCTURAL CONSEQUENCE        != PRIORITY
STRUCTURAL CONSEQUENCE        != SEVERITY
STRUCTURAL CONSEQUENCE        != RECOMMENDATION
ASSEMBLY                      != TRUTH
ASSEMBLY                      != COMPLETENESS
ASSEMBLY                      != CURRENT AUTHORITY
ASSEMBLY                      != AUTHORITY CERTIFICATE
ASSEMBLY                      != SEMANTIC VERIFICATION
ASSEMBLY                      != DECISION READINESS
ASSEMBLY                      != DECISION NEED
ASSEMBLY                      != PRIORITY
ASSEMBLY                      != SCORE
ASSEMBLY                      != RECOMMENDATION
ASSEMBLY                      != HUMAN DECISION
VALIDATED DERIVATION           != PERSISTED AUTHORITY
REVISION ARTIFACT              != TRUTH
REVISION                       != PERSISTENCE
REVISION                       != PERSISTED AUTHORITY
REVISION                       != CURRENT AUTHORITY
REVISION                       != HEAD
REVISION                       != LATEST
REVISION                       != ACTIVE
REVISION                       != SUPERSEDED
REVISION                       != DECISION READINESS
REVISION                       != DECISION NEED
REVISION                       != RECOMMENDATION
REVISION                       != HUMAN DECISION
PREVIOUS REVISION ID           != PROOF PARENT EXISTS
PREVIOUS REVISION ID           != CAUSATION
PREVIOUS REVISION ID           != SEMANTIC CONTINUITY
PREVIOUS REVISION ID           != HEAD SELECTION
LINEAGE                        != CAUSATION
NO_GAP                        != GLOBAL COMPLETENESS
NO_GAP                        != TRUTH
NO_GAP                        != CURRENT AUTHORITY
NO_GAP                        != DECISION READINESS
NO_GAP                        != DECISION NEED
HASH CONSISTENCY              != DERIVATION VALIDITY
BAD BASIS                     != BAD STORED GAP
BAD EBIND                     != BAD STORED GAP
BAD DREL                      != BAD STORED GAP
NO BINDING                    != GAP
NO BINDING                    != NOT_SUPPORTED
OBJECTIVE                     != AUTOMATIC EXPECTATION
CONSTRAINT                    != AUTOMATIC EXPECTATION
UNCERTAINTY                   != GAP
HUMAN_INPUT EXPECTATION       != EVIDENCE TRUTH
MODEL_PROPOSAL EXPECTATION    != HUMAN REQUIREMENT
```

An `AuthoritativeStateReference` names a producer-governed artifact, but carries no payload, repository, resolver, or authority capability. A successful reader resolution describes one operation through one bound dependency; it does not confer portable authority for a later operation. A later authority-dependent operation must resolve again through its own bound reader.

`DecisionContextDraft` is a structural decision environment. It records items, semantic roles, provenance, and source-state references. It does not infer that an item statement is supported, true, contradicted, satisfied, complete, adopted, or recommended.

Phase 5C1 asks only whether each reference carried by the structurally accepted context resolves now through the bound reader. It deliberately does not inspect resolution payload semantics. In particular, a successful Phase-5C1 call proves neither semantic support nor evidence binding for a `DecisionContextItem` statement.

Phase 5C2 adds `SemanticEvidenceBindingProposal`: one `DecisionContextItem` × one `AuthoritativeStateReference`, with exactly `SUPPORTED`, `PARTIALLY_SUPPORTED`, `NOT_SUPPORTED`, or `CONTRADICTED`. It is semantic evaluator proposal data, not producer authority, verified semantic truth, human adoption, recommendation, decision, completeness proof, validated context, or Phase-5C3 structural finding. `CONTRADICTED` means one state semantically conflicts with one item according to the evaluator; it is not a `Contradiction` artifact.

Phase 5C3A adds `StructuralExpectation`, an explicit comparison target bound by `contextId` to one structurally valid `DecisionContextDraft` under the sealed Phase-5B contract. It can express an `EVIDENCE_BINDING`, `CONTEXT_ROLE`, or `DEPENDENCY` expectation and performs only the structural membership checks required by that contract; it does not evaluate expectation satisfaction against observed role counts, binding inventories, dependency findings, or other relation state. In particular, it does not inspect bindings, count roles, resolve authority, evaluate semantic payloads, establish satisfaction, or produce a Gap, Dependency finding, Contradiction finding, Consequence, Decision Need, or recommendation. `AUTHORITATIVE_STATE` expectation provenance proves only structural presence of its reference in that context's source inventory; it does not prove current authority, semantic truth, or expectation satisfaction.

Phase 5C3B adds `StructuralRelationProposal`, a caller-supplied proposal for one `DecisionContextItem` × one other `DecisionContextItem` relation. Its exact kinds are `CONTRADICTION` and `DEPENDENCY`. A contradiction proposal is symmetric and stores its distinct item IDs in deterministic canonical order; a dependency proposal is directional and preserves `dependentItemId` and `prerequisiteItemId`. Neither kind establishes relation truth, a formal logical contradiction, a Dependency finding, a structural finding, a Gap, a Consequence, a Decision Need, or a recommendation. This slice does not discover, infer, evaluate, or validate relations, and it does not consume semantic binding proposals or structural expectations. `AUTHORITATIVE_STATE` relation provenance proves only structural presence of its reference in that context source inventory; it does not prove current authority or relation truth.

Phase 5C3C adds `StructuralGap` in the adjacent `lib/decision-core/structural-gaps/` module, not in `structural-findings`. A structural gap is one explicit `StructuralExpectation` that is unsatisfied within one explicitly supplied represented observation basis. It is basis-relative: it does not claim real-world absence, global incompleteness, semantic truth, decision need, priority, consequence, recommendation, or human decision. The existing `structural-findings` module continues to own `StructuralExpectation` and `StructuralRelationProposal`; expectation or relation proposal is not itself a derived Gap.

Phase 5C3D adds `StructuralConsequence` in the adjacent `lib/decision-core/structural-consequences/` module, not in `structural-findings` or `structural-gaps`. It represents only that one validated item-anchored structural gap is structurally upstream of another context item along one explicit ordered represented dependency path. It does not establish dependency-path truth, a real-world effect, prediction, outcome, another gap, severity, priority, decision need, or recommendation.

Phase 5C4 adds `DecisionContextValidationAssembly` in the adjacent `lib/decision-core/validation-assembly/` module. It is not an extension of the sealed Phase-5C1 `validation` authority gate: `5C1 AUTHORITY VALIDATION != 5C4 VALIDATION ASSEMBLY`. Phase 5C4 validates derivational coherence, not reality. It leaves `DecisionContextDraft.validationStatus` exactly `"NOT_RUN"`, creates no validated Decision Context, and emits no authority certificate.

Phase 5D1 adds `DecisionContextRevision` in the adjacent `lib/decision-core/revisions/` module. It captures a detached `DecisionContextDraft`, its explicit `DecisionContextValidationAssemblyInput`, and the matching `DecisionContextValidationAssembly` in one self-contained canonical artifact. It revalidates that state locally and leaves the embedded draft's `validationStatus` exactly `"NOT_RUN"`. A DREV artifact alone is neither persistence, current authority, authority of record, a parent-existence proof, head/latest/active selection, semantic truth, nor a decision artifact.

Phase 5D2A adds the adjacent `lib/decision-core/revision-persistence/` module. `DecisionContextRevisionRepository` defines the supported read/factory capability shape, not a universal governance guarantee. The shipped `InMemoryDecisionContextRevisionRepository` write path is `repository -> createDecisionContextRevisionPersister() -> persist(revision)` and exposes no runtime-callable raw writer. A successful operation through that shipped path means that this bound repository selected this exact complete `DecisionContextRevision` as the immutable record for that DREV identity during that operation. This authority of record is not truth, semantic correctness, current producer authority, current decision state, head/latest/active selection, or a recommendation. It validates only the immediate parent for a child and performs no lineage traversal.

Phase 5D2B adds `PostgresDecisionContextRevisionRepository` in `lib/decision-adapters/revision-persistence/`. The dependency direction is `decision-adapters/revision-persistence -> decision-core/revision-persistence -> decision-core/revisions`; generic Decision Core remains free of PostgreSQL, Drizzle, Career DB, and frontend dependencies. The adapter receives a configured `PostgresJsDatabase`; it does not read `DATABASE_URL`, create a pool, provision tables, or run migrations. Its supported write path remains `repository -> createDecisionContextRevisionPersister() -> persist(revision)`; its runtime-private writer is storage machinery, not a public write capability. PostgreSQL implements the sealed 5D2A authority operation with `decision_context_revisions`, physical immediate-parent referential integrity, race-safe immutable insert, and database-backed survival across repository/client reconstruction. It does not establish truth, current producer authority, head/latest/active selection, or branch discovery.

Phase 5D3 adds the adjacent generic `lib/decision-core/revision-lineage/` module. It captures only an exact `getRevisionById(...)` reader capability; it receives no writer, persister, database, PostgreSQL client, resolver, binder, evaluator, or authority validator. Starting from one DREV-shaped ID, it reads and sealed-validates exactly each requested revision, requires exact returned ID equality, follows only `previousRevisionId`, and returns a detached `ROOT -> ... -> START` predecessor path. This is predecessor order, not chronological or temporal order. It establishes neither persistence authority, current producer authority, truth, semantic continuity, causation, a head/latest/current/active revision, branch selection, nor descendant discovery.

```text
LINEAGE RECONSTRUCTION != HEAD SELECTION
LINEAGE RECONSTRUCTION != BRANCH SELECTION
LINEAGE RECONSTRUCTION != DESCENDANT DISCOVERY
PREVIOUS REVISION ID  != CAUSATION
PREVIOUS REVISION ID  != SEMANTIC CONTINUITY
PREVIOUS REVISION ID  != WALL-CLOCK TIME
ROOT                  != GLOBALLY FIRST / UNIQUE / CURRENT STATE
READABLE LINEAGE      != TRUE HISTORY / CURRENT PRODUCER AUTHORITY
READABLE LINEAGE      != DECISION NEED / RECOMMENDATION
MISSING PREDECESSOR   != ROOT
PARTIAL CHAIN         != VALID LINEAGE
```

## Phase 6A human-owned assessment request boundary

Phase 6A introduces only a `DecisionAssessmentRequest`: one human-declared normative assessment frame. Its ownership axis is distinct from both the evidence-backed decision state and later proposal or decision state:

```text
EVIDENCE-BACKED STATE
!= HUMAN-OWNED NORMATIVE FRAME
!= MODEL ASSESSMENT PROPOSAL
!= MODEL RECOMMENDATION PROPOSAL
!= HUMAN DECISION

GAP != DECISION NEED
STRUCTURAL CONSEQUENCE != DECISION NEED
VALIDATION ASSEMBLY != DECISION NEED
REVISION != DECISION NEED
READABLE LINEAGE != DECISION NEED
HUMAN ASSESSMENT REQUEST != DECISION NEED
```

The request has no reader, repository, persistence operation, lineage traversal, authority resolution, evaluator, provider, or model dependency. A DREV-shaped `revisionId` names only the revision the human intends to assess later; a DCI-shaped item reference names only an item reference selected by that human. The request neither proves the revision exists nor proves item membership or roles. In particular, readable lineage does not create an assessment request, and an assessment request does not identify a current revision.

## Phase 6B revision-bound assessment basis boundary

Phase 6B implements only this chain:

```text
DecisionAssessmentRequest
-> exact bound revision read
-> sealed DecisionContextRevision
-> exact revision-ID equality
-> request item membership / role verification
-> deterministic complete-state DecisionAssessmentBasis
-> STOP
```

Its reader is one exact bound `getRevisionById(...)` capability. A reader return is not persistence proof; a sealed revision is not current revision or current producer authority; and the resulting basis is not authority of record. The request is captured before the read await, the returned revision is captured once, and the detached result does not establish deep freezing. Question membership requires the context's canonical question ID and `DECISION_QUESTION` role; selected IDs require their declared `OPTION`, `OBJECTIVE`, or `CONSTRAINT` role. This validates membership and role only: `MEMBERSHIP != SEMANTIC SUPPORT`, `ROLE != NORMATIVE IMPORTANCE`, and `ASSESSMENT BASIS != ASSESSMENT != DECISION NEED != RECOMMENDATION != HUMAN DECISION`.

## Phase 6C semantic assessment proposal boundary

Phase 6C introduces model semantic assessment proposal state only:

```text
EVIDENCE-BACKED REVISION STATE
!= HUMAN-OWNED NORMATIVE FRAME
!= MODEL SEMANTIC ASSESSMENT PROPOSAL

ASSESSMENT RELATION != RANKING
ASSESSMENT RELATION != OPTION PREFERENCE
ASSESSMENT PROPOSAL != RECOMMENDATION != DECISION NEED != HUMAN DECISION
MODEL_PROPOSAL != HUMAN PREFERENCE != AUTHENTICATED MODEL != PROVIDER AUTHORITY != TRUTH
```

The proposer admits only an `optionItemId` selected in `assessmentRequest.selectedOptionItemIds` and a `criterionItemId` selected in its objective or constraint inventory. `REVISION MEMBERSHIP != HUMAN NORMATIVE SELECTION`: the evaluator receives the complete detached basis, but Phase 6C governs only which returned relations may enter its stored artifact, not the evaluator's internal reasoning. Zero or partial relations are valid; `NO ASSESSMENT != UNDETERMINED`, and no readiness or completeness inference follows.

## Phase 6D recommendation proposal boundary

Phase 6D implements only:

```text
SEALED DecisionAssessmentProposal
+ BOUND DecisionRecommendationGenerator capability
+ DECLARED MODEL_PROPOSAL provenance
-> CANONICAL DecisionRecommendationProposal
-> STOP
```

`GENERATOR CAPABILITY != MODEL IDENTITY`, `PROPOSAL PROVENANCE != GENERATOR IDENTITY`, and `MODEL_PROPOSAL != AUTHENTICATED MODEL != PROVIDER AUTHORITY != HUMAN PREFERENCE != TRUTH`. A recommendation target must be both selected in the embedded human-owned frame and represented by at least one embedded assessment relation: `SELECTED OPTION != ASSESSED OPTION != RECOMMENDED OPTION`. Disposition does not govern admission: `ALIGNED != RECOMMENDED`, `MISALIGNED != REJECTED`, and `UNDETERMINED != BLOCKED`.

Zero, partial, and multiple recommendations are valid; output order is non-semantic and stored order is canonical. Absence from recommendations is no claim, not rejection. An option selected but not assessment-represented is not admissible, without implying it is bad, irrelevant, unsafe, or unfit. Phase 6D creates no ranking, score, priority, winner, Decision Need, human decision, action, outcome, truth, or authority of record.

## Phase 6E proposal coherence validation boundary

Phase 6E implements only:

```text
SEALED DecisionRecommendationProposal
+ DETERMINISTIC CONDYN TRACE RECONSTRUCTION
-> DecisionProposalCoherenceValidation
-> STOP
```

For every recommendation, it materializes the exact criterion IDs represented by embedded assessment relations with the same option ID. It neither interprets rationale or disposition nor establishes semantic justification, support, correctness, suitability, optimality, completeness, or readiness. `TRACEABILITY != SEMANTIC CORRECTNESS`, `STRUCTURAL COHERENCE != RECOMMENDATION CORRECTNESS`, `ASSESSMENT REPRESENTATION != SUPPORT FOR RECOMMENDATION`, and `CRITERION TRACE != JUSTIFICATION`.

```text
COHERENT PROPOSAL != GOOD RECOMMENDATION
COHERENT PROPOSAL != BEST OPTION
COHERENT PROPOSAL != OPTIMAL OPTION
COHERENT PROPOSAL != HUMAN PREFERENCE
COHERENT PROPOSAL != HUMAN ACCEPTANCE
COHERENCE VALIDATION != DECISION NEED != HUMAN DECISION != ACTION != OUTCOME != FEEDBACK
ASSESSMENT DISPOSITION != COHERENCE POLICY
MISALIGNED != INCOHERENT RECOMMENDATION
UNDETERMINED != INVALID RECOMMENDATION
VALIDATION ARTIFACT != TRUTH != AUTHORITY OF REALITY
DPCV IDENTITY != TRUTH != RECOMMENDATION CORRECTNESS != HUMAN DECISION
```

Phase 6D already guarantees each recommendation target is selected and assessment-represented, so a sealed-valid recommendation proposal has one trace per recommendation under this definition. Phase 6E introduces no `UNTRACEABLE`, `INCOHERENT`, `UNSUPPORTED`, `INCOMPLETE`, `REJECTED`, or `NOT_READY` state. It has no model, provider, evaluator, generator, human actor, reader, repository, persister, lineage, or authority dependency, and creates no Decision Need, human decision, action, outcome, feedback, truth, or authority-of-reality claim.

## Phase 7A human decision declaration boundary

Phase 7A implements only:

```text
SEALED DecisionProposalCoherenceValidation
+ DECLARED HUMAN_INPUT actor
+ ONE OR MORE explicit revision OPTION choices
+ OPTIONAL human rationale
-> HumanDecisionDeclaration
-> STOP
```

This is the first explicit human normative state transition. `THE MODEL MAY NARROW ITS OWN PROPOSAL SPACE; IT MUST NOT NARROW THE HUMAN DECISION SPACE.` A choice is admitted only when its DCI-shaped ID names an actual `OPTION` in the complete sealed revision embedded through `DecisionProposalCoherenceValidation -> DecisionRecommendationProposal -> DecisionAssessmentProposal -> DecisionAssessmentBasis -> DecisionContextRevision -> context.items`. It is not admitted from the 6A selected-options, 6C assessment, 6D recommendation, or 6E trace inventories.

Thus `HUMAN ASSESSMENT SELECTION != HUMAN DECISION ADMISSIBILITY`, `ASSESSMENT != HUMAN DECISION ADMISSIBILITY`, `RECOMMENDATION != HUMAN DECISION ADMISSIBILITY`, and `COHERENCE TRACE != HUMAN DECISION ADMISSIBILITY`. For example, a revision may contain options A, B, and C while 6A selects A/B, 6C assesses A, 6D recommends A, and 6E traces A; a human declaration choosing C remains valid because C is an actual revision `OPTION`, not because it traversed the model-proposal path.

Phase 7A represents explicit positive selection only: one or more distinct choices are required, multiple choices are valid, and caller order is canonicalized rather than treated as preference. `ONE DECISION != EXACTLY ONE OPTION`, `MULTIPLE CHOSEN OPTIONS != RANKING`, `INPUT ORDER != HUMAN PREFERENCE`, and `ZERO CHOSEN OPTIONS != DEFER != ABSTAIN != REJECT_ALL != NO_DECISION`. `decidedBy` is declared `HUMAN_INPUT` ownership only: it is neither authentication, authorization, signature, permission, nor truth, and `DECISION ACTOR != ASSESSMENT REQUESTER`.

The declaration is not a recommendation, recommendation correctness, truth, option optimality, action, outcome, feedback, learning, current producer authority, or authority of reality. Human rationale is optional (`null` or a trimmed nonempty string) and `HUMAN RATIONALE != PROOF != SEMANTIC TRUTH`. The contract is constructed independently from first principles; legacy `lib/career/decisions/*` remains domain-specific and is not authority for this ontology.

## Phase 8A1 decision-bound action-intent boundary

Phase 8A1 implements only:

```text
SEALED HumanDecisionDeclaration
+ DECLARED HUMAN_INPUT intent declarer
+ NONEMPTY EXPLICIT SUBSET OF HUMAN-CHOSEN OPTION IDS
+ EXPLICIT OPERATION DESCRIPTION
+ OPTIONAL HUMAN RATIONALE
-> DecisionActionIntent
-> STOP
```

`HUMAN DECISION != ACTION INTENT`, `ACTION INTENT != HUMAN COMMITMENT != ACTION != EXECUTION != OUTCOME`, `OPTION != ACTION`, `CHOSEN OPTION != ACTION != ACTION INTENT`, `RATIONALE != ACTION INTENT`, and `INTENDED ACTION != OBSERVED ACTION`.

The human decision establishes the admissible operationalization boundary. `MODEL PROPOSAL SPACE != HUMAN DECISION SPACE`; before decision, the model cannot narrow human admissibility. After decision, `ACTION INTENT SCOPE ⊆ HUMAN DECISION CHOICE SET`: an intent may narrow the selected set but cannot expand beyond it. Thus A/B/C chosen with A/C operationalized is valid, while revision option C is not operationalizable when the human chose only A/B. This is not recommendation gating.

`operationDescription` is trimmed nonempty opaque human/domain-provided text. It is not parsed into action type, target, assignee, executor, parameters, command, workflow, timing, or expected effect. `OPERATION DESCRIPTION != EXECUTABLE COMMAND != EXECUTION PROOF != EXPECTED OUTCOME != AUTHORIZATION`. The declared intent actor is independent of the decision actor and any future commitment or action actor; `HUMAN_INPUT != AUTHENTICATED IDENTITY != AUTHORIZATION != SIGNATURE != PERMISSION != TRUTH`.

## Phase 8A2 human-commitment boundary

Phase 8A2 implements only:

```text
SEALED DecisionActionIntent
+ DECLARED HUMAN_INPUT commitment actor
+ OPTIONAL HUMAN rationale
-> HumanCommitment
-> STOP
```

`COMMITMENT TARGET = COMPLETE SEALED ACTION INTENT`. Human Commitment does not repeat `operationalizedOptionItemIds`, `chosenOptionItemIds`, or `operationDescription`; Action Intent owns operationalization scope. There is no partial-commitment field: to represent a narrower scope, create a narrower Action Intent first and commit to that complete intent.

`committedBy` is declared human input only and may differ from the decision actor and Action Intent declarer. These are independent semantic role positions; no actor-ID equality or inequality is required or inferred. `DECLARED COMMITMENT != LEGAL RESPONSIBILITY != ORGANIZATIONAL ACCOUNTABILITY != OWNERSHIP`; `COMMITMENT != AUTHORIZATION != PERMISSION != EXECUTION AUTHORITY != ORGANIZATIONAL AUTHORITY`. The commitment-actor role does not establish an assignee or executor role; a future workflow may represent the same or a different concrete actor. One artifact contains one actor, but one Action Intent may have zero, one, or multiple independent commitments: `ACTION INTENT EXISTENCE != COMMITMENT EXISTENCE` and `ONE ACTION INTENT != ONE HUMAN COMMITMENT`.

Rationale is `null` or trimmed nonempty text and represents only the declared actor's reason for committing. `HUMAN COMMITMENT != ACTION`; `COMMITTED != EXECUTED != DONE != COMPLETED != ACTION OCCURRED != OUTCOME ACHIEVED`. There is no timestamp, schedule, assignment, authorization, action, completion, outcome, feedback, learning, or persistence authority. Commitment is not a universal predecessor for the standalone Phase 8B occurrence-claim branch; stronger Action, observation, verification, performer, outcome, feedback, learning, or temporal semantics remain future work only if separately specified.

## Phase 8B action-occurrence-claim boundary

Phase 8B implements only:

```text
HUMAN_INPUT or AUTHORITATIVE_STATE source
+ OPAQUE OPERATION DESCRIPTION
-> ActionOccurrenceClaim
-> STOP
```

`ACTION OCCURRENCE CLAIM != ACTION OCCURRENCE FACT != OBSERVED REALITY != EXECUTION PROOF`. It is standalone: `HumanDecisionDeclaration`, `DecisionActionIntent`, and `HumanCommitment` are not required predecessors; `ACTION INTENT != UNIVERSAL ACTION PREDECESSOR` and `HUMAN COMMITMENT != UNIVERSAL ACTION PREDECESSOR`. No predecessor field exists. Text equality, actor equality, ID similarity, and temporal proximity establish no relation; in particular, `ActionIntent.operationDescription == ActionOccurrenceClaim.operationDescription DOES NOT IMPLY A RELATION`.

The closed source union is `HUMAN_INPUT | AUTHORITATIVE_STATE`, not the Decision Context provenance union. A human source is reporting provenance only: `HUMAN REPORT != AUTHENTICATED IDENTITY != EXECUTION PROOF`, and `CLAIM SOURCE ROLE != PERFORMER ROLE`; role non-equivalence does not require or infer concrete actor-ID inequality. An authoritative-state source stores only its exact opaque reference: `SOURCE PROVENANCE != CURRENT SOURCE AUTHORITY`, `CURRENT SOURCE AUTHORITY != SEMANTIC OCCURRENCE SUPPORT`, and `SEMANTIC OCCURRENCE SUPPORT != AUTHORITY OF REALITY`.

No reader, resolver, authority validator, evaluator, repository, adapter, payload inspection, performer, temporal field, persistence, outcome, feedback, or learning exists. Reference strings are non-blank but preserved exactly; only human actor ID and operation text may trim at construction. `PHASE 8B REPRESENTS NO TEMPORAL CLAIM`; `WALL-CLOCK TIME != AUTHORITY`, `TIMESTAMP != OCCURRENCE PROOF`, and `TEMPORAL ORDER != CAUSATION`. `operationDescription` is opaque and is neither executable command, execution proof, outcome, nor relation to Action Intent.

## Phase 8C1 state-change-claim boundary

Phase 8C1 implements only:

```text
HUMAN_INPUT or AUTHORITATIVE_STATE source
+ OPAQUE STATE CHANGE DESCRIPTION
-> StateChangeClaim
-> STOP
```

`STATE CHANGE CLAIM != STATE CHANGE FACT`; `STATE CHANGE CLAIM != OBSERVED REALITY`; `STATE CHANGE CLAIM != VERIFIED CHANGE`; `STATE CHANGE CLAIM != EFFECT`; `STATE CHANGE CLAIM != OUTCOME`; `STATE CHANGE CLAIM != CONSEQUENCE`; `STATE CHANGE CLAIM != CAUSAL CLAIM`. It is a standalone branch: `HumanDecisionDeclaration`, `DecisionActionIntent`, `HumanCommitment`, `ActionOccurrenceClaim`, revision, assessment, recommendation, and coherence state are not required predecessors. No predecessor or relation field exists. `ACTION OCCURRENCE CLAIM != STATE CHANGE CLAIM`; `ACTION OCCURRENCE CLAIM + STATE CHANGE CLAIM != OUTCOME`. Text equality, actor equality, ID similarity, and temporal proximity establish no relation.

The closed source union is `HUMAN_INPUT | AUTHORITATIVE_STATE`. It is its own semantic source type, not an alias of `ActionOccurrenceClaimSource`: `SAME REPRESENTATION != SAME SEMANTIC ROLE`. A human source is declared reporting provenance only: it establishes neither authenticated identity, authorization, signature, permission, affected actor, performer, executor, assignee, responsibility, ownership, accountability, proof, nor truth. `STATE CHANGE CLAIM SOURCE ROLE != AFFECTED ACTOR ROLE`; role non-equivalence does not require or infer concrete actor-ID inequality. An authoritative-state source stores only its exact opaque reference: `SOURCE PROVENANCE != CURRENT SOURCE AUTHORITY`, `CURRENT SOURCE AUTHORITY != SEMANTIC STATE CHANGE SUPPORT`, and `SEMANTIC STATE CHANGE SUPPORT != AUTHORITY OF REALITY`.

No reader, resolver, authority validator, evaluator, repository, adapter, payload inspection, affected-actor field, temporal field, persistence, effect, outcome, consequence, or causal classification exists. Reference strings are non-blank but preserved exactly; only human actor ID and `stateChangeDescription` may trim at construction. `STATE CHANGE DESCRIPTION != STRUCTURED DELTA`; `STATE CHANGE DESCRIPTION != EFFECT`; `STATE CHANGE DESCRIPTION != OUTCOME`; `STATE CHANGE DESCRIPTION != CAUSAL RELATION`. Phase 8C1 represents no temporal claim: `CLAIM THAT CHANGE OCCURRED != REPRESENTATION OF WHEN CHANGE OCCURRED`, `TIMESTAMP != STATE CHANGE PROOF`, and `TEMPORAL ORDER != CAUSATION`.

## Phase 8C2 action-state-change-association boundary

Phase 8C2 implements only:

```text
SEALED ActionOccurrenceClaim
+ SEALED StateChangeClaim
+ EXPLICIT HUMAN_INPUT | MODEL_PROPOSAL | AUTHORITATIVE_STATE provenance
-> ActionStateChangeAssociationProposal
-> STOP
```

The two claims remain independent sealed endpoint artifacts. `ACTION OCCURRENCE CLAIM + STATE CHANGE CLAIM != ASSOCIATION`; their coexistence, text equality, actor equality, source equality, ID similarity, temporal proximity, or temporal order does not infer an association. Explicit Phase 8C2 construction alone creates the represented proposal artifact. Endpoint actor/source equality and inequality are both admitted and establish no additional meaning.

The proposal has no relation-kind taxonomy and does not reuse `StructuralRelationProposal`: `STRUCTURAL RELATION PROPOSAL != ACTION STATE CHANGE ASSOCIATION PROPOSAL`. It adds no predecessor field to either claim and no Decision, Intent, Commitment, Outcome, effect, consequence, attribution, causal, temporal, score, confidence, status, repository, or persistence field. `ASSOCIATION PROPOSAL != RELATION TRUTH`; `ASSOCIATION PROPOSAL != OUTCOME`; `ASSOCIATION PROPOSAL != EFFECT`; `ASSOCIATION PROPOSAL != CONSEQUENCE`; `ASSOCIATION != ATTRIBUTION`; `ASSOCIATION != CAUSATION`.

The closed provenance union is `HUMAN_INPUT | MODEL_PROPOSAL | AUTHORITATIVE_STATE`; it is its own semantic type: `SAME REPRESENTATION != SAME SEMANTIC ROLE`. Human and model local identifiers may trim at construction. An authoritative reference stores its exact non-blank opaque strings without normalization. No reader, resolver, authority validator, repository, adapter, payload inspection, semantic evaluator, model/provider invocation, or persistence operation exists. `PROVENANCE != SUPPORT`; `REFERENCE PRESENT != CURRENT SOURCE AUTHORITY`; `CURRENT SOURCE AUTHORITY != ASSOCIATION TRUTH`; `MODEL PROPOSAL != PUBLICATION AUTHORITY`.

`DASCA_` is deterministic over ordered Action Occurrence Claim ID, ordered State Change Claim ID, and complete canonical provenance. The endpoint roles are not sorted. Construction validates both sealed endpoint contracts, canonicalizes only permitted local provenance fields, self-asserts, and returns detached state. Stored assertion is exact, canonical, and non-repairing. Boundary-local shallow descriptor capture keeps top-level, provenance, and authoritative-reference errors at their semantic boundaries; hostile input is rejected without getter execution where applicable. Phase 8C2 represents no temporal relation or association time, and adds no persistence authority.

## Phase 8C3 outcome-attribution-proposal boundary

Phase 8C3 implements only:

```text
SEALED ActionStateChangeAssociationProposal
+ EXPLICIT HUMAN_INPUT | MODEL_PROPOSAL | AUTHORITATIVE_STATE provenance
-> OutcomeAttributionProposal
-> STOP
```

The sealed association remains its own predecessor artifact. `ASSOCIATION PROPOSAL EXISTENCE != OUTCOME ATTRIBUTION PROPOSAL EXISTENCE`: its existence does not automatically create attribution. Phase 8C3 does not duplicate, repair, reinterpret, or reconstruct the association's embedded claims. It represents only an explicit proposal that the embedded State Change Claim has an outcome role relative to the embedded Action Occurrence Claim. `ASSOCIATION PROPOSAL != OUTCOME ATTRIBUTION PROPOSAL`; `ASSOCIATION != OUTCOME ATTRIBUTION`; `ACTION OCCURRENCE CLAIM + STATE CHANGE CLAIM + ASSOCIATION PROPOSAL != OUTCOME ATTRIBUTION PROPOSAL`; `OUTCOME ATTRIBUTION PROPOSAL != OUTCOME TRUTH`; `OUTCOME ATTRIBUTION PROPOSAL != RELATION TRUTH`; `OUTCOME ATTRIBUTION PROPOSAL != CAUSAL CLAIM`; `OUTCOME ATTRIBUTION != CAUSATION`.

The closed provenance union is `HUMAN_INPUT | MODEL_PROPOSAL | AUTHORITATIVE_STATE`; it is its own semantic type. Association and attribution provenance may identify the same concrete source or different concrete sources; neither equality nor inequality establishes further meaning. Local human actor IDs and model proposal references may trim only during construction. Exact authoritative reference strings remain non-blank opaque data without normalization. No reader, resolver, authority validator, repository, adapter, payload inspection, semantic evaluator, model/provider invocation, or persistence operation exists. `PROVENANCE != SUPPORT`; `REFERENCE PRESENT != CURRENT SOURCE AUTHORITY`; `CURRENT SOURCE AUTHORITY != OUTCOME TRUTH`; `MODEL PROPOSAL != PUBLICATION AUTHORITY`; `MODEL PROPOSAL != OUTCOME TRUTH`; `MODEL PROPOSAL != CAUSAL AUTHORITY`.

`DOATP_` is deterministic over the sealed association ID and complete canonical attribution provenance. Construction validates the sealed association through its public assertion contract, canonicalizes only permitted local provenance fields, self-asserts, and returns detached state. Stored assertion is exact, canonical, and non-repairing. Boundary-local shallow descriptor capture retains top-level, provenance, and authoritative-reference error ownership; hostile state is rejected without getter execution where applicable. Phase 8C3 represents no outcome-state taxonomy, temporal relation, causation, or persistence authority.

## Phase 8D1 decision-context-observation-proposal boundary

Phase 8D1 implements only:

```text
SEALED OutcomeAttributionProposal
+ EXPLICIT OPAQUE STATEMENT
+ EXPLICIT HUMAN_INPUT | MODEL_PROPOSAL | AUTHORITATIVE_STATE provenance
-> DecisionContextObservationProposal
-> STOP
```

The proposal is an `OBSERVATION`-role candidate for a future Decision Context, not a `DecisionContextItem`. `OUTCOME ATTRIBUTION PROPOSAL != DECISION CONTEXT OBSERVATION PROPOSAL`; `OUTCOME ATTRIBUTION PROPOSAL EXISTENCE != DECISION CONTEXT OBSERVATION PROPOSAL EXISTENCE`; `DECISION CONTEXT OBSERVATION PROPOSAL != DECISION CONTEXT ITEM`; `DECISION CONTEXT OBSERVATION PROPOSAL != DECISION CONTEXT`; `DECISION CONTEXT OBSERVATION PROPOSAL != DECISION CONTEXT REVISION`. Explicit construction, statement, and provenance are required. The sealed predecessor is validated only through its public assertion contract; Phase 8D1 does not repair or reinterpret it or independently reconstruct its nested association or claims.

`statement` is required opaque trimmed nonempty text and is identity-bearing; it is not derived from predecessor descriptions, IDs, association semantics, attribution semantics, or similarity. `OUTCOME ATTRIBUTION PROPOSAL != OBSERVATION STATEMENT`. The closed provenance union is `HUMAN_INPUT | MODEL_PROPOSAL | AUTHORITATIVE_STATE`, and is its own semantic type: `SAME REPRESENTATION != SAME SEMANTIC ROLE`. Local human and model identifiers may trim only during construction; exact non-blank authoritative reference strings remain opaque and unnormalized. No reader, resolver, payload inspection, authority validator, evaluator, repository, context constructor, or revision operation exists. `REFERENCE != AUTHORITY TOKEN`; `REFERENCE PRESENT != CURRENT SOURCE AUTHORITY`; `CURRENT SOURCE AUTHORITY != OBSERVATION TRUTH`; `PROVENANCE != SUPPORT`; `MODEL PROPOSAL != PUBLICATION AUTHORITY`; `MODEL PROPOSAL != OBSERVATION TRUTH`; `MODEL PROPOSAL != OUTCOME TRUTH`.

`DCOP_` is deterministic over the sealed Outcome Attribution Proposal ID, statement, and complete canonical provenance. Construction canonicalizes only permitted local statement/provenance fields, self-asserts, and returns detached state. Stored assertion is exact, canonical, and non-repairing. Boundary-local shallow descriptor capture retains top-level, provenance, and authoritative-reference error ownership; hostile predecessor state is rejected without getter execution where applicable. `OBSERVATION ROLE != OBSERVED REALITY`; `OBSERVATION PROPOSAL != OBSERVATION TRUTH`; `REENTRY PROPOSAL != ADMISSION`; `REENTRY PROPOSAL != REVISION`; `REENTRY PROPOSAL != LOOP CLOSED`; `REENTRY != OUTCOME TRUTH`; `REENTRY != SEMANTIC SUPPORT`. Phase 8D1 represents no time, temporal relation, Feedback, Learning, causation, or persistence authority.

## Phase 8D2 decision-context-observation-admission boundary

Phase 8D2 implements only:

```text
SEALED DecisionContextObservationProposal
+ DECLARED HUMAN_INPUT actor
+ OPTIONAL OPAQUE RATIONALE
-> DecisionContextObservationAdmissionDeclaration
-> STOP
```

One declaration records only that the declared human actor admits its sealed proposal as eligible for future `OBSERVATION`-role materialization. `DECISION CONTEXT OBSERVATION PROPOSAL != DECISION CONTEXT OBSERVATION ADMISSION DECLARATION`; `PROPOSAL EXISTENCE != ADMISSION DECLARATION EXISTENCE`; `ADMISSION DECLARATION != DECISION CONTEXT ITEM`; `ADMISSION DECLARATION != DECISION CONTEXT`; `ADMISSION DECLARATION != DECISION CONTEXT REVISION`; `ADMISSION DECLARATION != MATERIALIZATION`; `ADMISSION DECLARATION != CONTEXT MUTATION`; `ADMISSION DECLARATION != REVISION CREATION`; `ADMISSION DECLARATION != LOOP CLOSED`. There is no automatic edge from proposal to declaration or declaration to Context Item.

`admittedBy` is exactly declared `HUMAN_INPUT` provenance. It is not authenticated identity or external authorization, and no equality or inequality is required with any actor or provenance represented in the sealed proposal: `ADMITTED BY != PROPOSAL PROVENANCE`; `HUMAN ADMISSION DECLARATION != AUTHENTICATED IDENTITY`; `HUMAN ADMISSION DECLARATION != EXTERNAL AUTHORIZATION`. `rationale` is opaque `string | null`, identity-bearing, and not support. The contract represents positive admission only; it contains no rejection, defer, ignore, abstain, block, aggregation, vote, consensus, ranking, priority, score, confidence, or decision-status state. No admission declaration does not infer any negative disposition.

The exact six-field artifact retains the complete sealed `DecisionContextObservationProposal`; no target Context, item, revision, question, or source-state inventory field exists. Phase 8D2 validates only through `assertDecisionContextObservationProposal(...)`, does not repair predecessor state, and does not inspect or resolve any authoritative reference it may carry. `ADMISSION AUTHORITY != MATERIALIZATION TARGET`; `AUTHORITATIVE DCOP ADMISSION != SOURCE STATE REFERENCE ADMISSION`; `REFERENCE PRESENT IN DCOP != REFERENCE PRESENT IN FUTURE DECISION CONTEXT`; `ADMISSION DECLARATION != SOURCE STATE INVENTORY MUTATION`.

`DCOAD_` is deterministic over the sealed `DCOP_`, declared actor, and rationale including `null` versus string. It preserves the complete predecessor identity rather than compressing it into a Decision Context Item identity. `DCOP IDENTITY != DECISION CONTEXT ITEM IDENTITY`; `DISTINCT DCOP IDENTITY != NECESSARILY DISTINCT FUTURE DCI IDENTITY`; `DCOAD IDENTITY != CONTEXT ITEM IDENTITY`; `DCOAD IDENTITY != CONTEXT IDENTITY`; `DCOAD IDENTITY != REVISION IDENTITY`; `DCOAD IDENTITY != OBSERVATION TRUTH`; `DCOAD IDENTITY != OUTCOME TRUTH`; `DCOAD IDENTITY != PERSISTENCE AUTHORITY`. Construction and assertion use boundary-local shallow descriptor capture, reject hostile representations without getter execution, are non-repairing where stored, and return detached state. Phase 8D2 represents no time, Feedback, Learning, truth, semantic support, causation, persistence, Context mutation, materialization, or loop closure.

## Phase 8D3 decision-context-observation-item-projection boundary

Phase 8D3 implements only:

```text
SEALED DecisionContextObservationAdmissionDeclaration
-> DecisionContextObservationItemProjection
-> STOP
```

The projection derives only exact future `OBSERVATION`-item input semantics: `role` is `OBSERVATION`, `statement` is the sealed DCOP statement, and `provenance` is the complete sealed DCOP provenance. `PROJECTED ITEM PROVENANCE = DCOP PROVENANCE`; `ADMISSION AUTHORITY != PROJECTED ITEM PROVENANCE`; `DETERMINISTIC PROJECTION != DETERMINISTIC_DERIVATION ITEM PROVENANCE`. Thus `HUMAN_INPUT`, `MODEL_PROPOSAL`, and `AUTHORITATIVE_STATE` provenance remain their represented variants; admission actor and rationale are not copied into projected provenance or statement.

`DECISION CONTEXT OBSERVATION ADMISSION DECLARATION != DECISION CONTEXT OBSERVATION ITEM PROJECTION`; `ADMISSION != PROJECTION`; `PROJECTION != DECISION CONTEXT ITEM`; `PROJECTED ITEM INPUT != DECISION CONTEXT ITEM`; `PROJECTED ITEM INPUT != ITEM MEMBERSHIP`; `PROJECTION != MATERIALIZATION`; `PROJECTION != TARGET CONTEXT`; `PROJECTION != CONTEXT MUTATION`; `PROJECTION != DECISION CONTEXT DRAFT`; `PROJECTION != DECISION CONTEXT REVISION`; `PROJECTION != REVISION CREATION`; `PROJECTION != LOOP CLOSED`. No item ID, Context ID, revision ID, source inventory, target Context, duplicate-membership check, Question-count check, Context ordering, Context identity, validation, or revision continuity exists.

The complete sealed admission declaration remains embedded. Distinct `DCOAD_` identities may produce equal projected item input, so the projection retains rather than compresses admission lineage: `DISTINCT ADMISSION IDENTITY != NECESSARILY DISTINCT PROJECTED ITEM INPUT`. `DCOIP_` is deterministic only over the sealed DCOAD identity. `DCOIP IDENTITY != DCI IDENTITY`; `DCOIP IDENTITY != CONTEXT IDENTITY`; `DCOIP IDENTITY != REVISION IDENTITY`; `DCOIP IDENTITY != OBSERVATION TRUTH`; `DCOIP IDENTITY != PERSISTENCE AUTHORITY`.

An `AUTHORITATIVE_STATE` reference is carried exactly in projected provenance but is not resolved, inspected, validated against, or admitted to a source inventory. `REFERENCE CARRIED BY PROJECTED ITEM INPUT != SOURCE STATE INVENTORY MEMBERSHIP`; `PROJECTED AUTHORITATIVE ITEM INPUT != SOURCE STATE REFERENCE ADMISSION`; `REFERENCE PRESENT IN PROJECTED ITEM INPUT != REFERENCE PRESENT IN FUTURE DECISION CONTEXT`. Boundary-local shallow descriptor capture and sealed predecessor assertion reject hostile state without getter execution; stored assertion repairs nothing and returned state is detached. Phase 8D3 represents no time, Feedback, Learning, truth, semantic support, causation, persistence, or loop closure.

## Phase 8D4A decision-context-observation-target-declaration boundary

Phase 8D4A implements only:

```text
SEALED DecisionContextObservationItemProjection
+ DECLARED DREV-shaped revision reference
+ DECLARED HUMAN_INPUT actor
+ OPTIONAL OPAQUE RATIONALE
-> DecisionContextObservationTargetDeclaration
-> STOP
```

The named `targetRevisionId` is a declared base-state reference for possible future Context processing, not a mutable destination. It is shape-only (`^DREV_[0-9A-F]{24}$`): `DREV SHAPE != REVISION EXISTENCE`; `TARGET REVISION ID != SEALED REVISION`; `TARGET REVISION ID != PERSISTENCE PROOF`; `TARGET REVISION ID != CURRENT REVISION`; `TARGET REVISION ID != HEAD REVISION`; `TARGET REVISION ID != LATEST REVISION`; `TARGET REVISION != MUTATION DESTINATION`; `TARGET REVISION ID != FUTURE REVISION ID`. Phase 6A is the narrow architectural precedent for a human-owned DREV-shaped reference without existence proof; Phase 6B shows that exact reader binding is separate. Phase 8D4A reuses neither assessment artifact nor assessment ontology.

`TARGET DECLARATION != TARGET BINDING`; `TARGET DECLARATION != REVISION EXISTENCE`; `TARGET DECLARATION != PERSISTENCE AUTHORITY`; `TARGET DECLARATION != MATERIALIZATION`; `TARGET DECLARATION != MATERIALIZATION READINESS`; `TARGET DECLARATION != DECISION CONTEXT ITEM`; `TARGET DECLARATION != ITEM MEMBERSHIP`; `TARGET DECLARATION != CONTEXT MEMBERSHIP`; `TARGET DECLARATION != CONTEXT MUTATION`; `TARGET DECLARATION != REVISION MUTATION`; `TARGET DECLARATION != REVISION CREATION`; `TARGET DECLARATION != LOOP CLOSED`. No reader, repository, revision object, Context object, Context Item, Context mutation, or revision operation exists at this boundary.

The exact seven-field artifact retains the complete sealed DCOIP, one target revision reference, one declared human actor, and `string | null` rationale. The declarer is canonical trimmed `HUMAN_INPUT` only: `DECLARED BY != ADMITTED BY`; `DECLARED BY != PROJECTION PROVENANCE`; `DECLARED BY != AUTHENTICATED IDENTITY`; `DECLARED BY != EXTERNAL AUTHORIZATION`; `DECLARED BY != REVISION OWNER`; `DECLARED BY != REVISION AUTHOR`. Rationale is opaque and identity-bearing: `RATIONALE != EVIDENCE`; `RATIONALE != SUPPORT`; `RATIONALE != TARGET VALIDITY`; `RATIONALE != REVISION EXISTENCE`; `RATIONALE != MATERIALIZATION AUTHORITY`. One DCOIP may have zero, one, or multiple independent declarations: `DCOIP EXISTENCE != TARGET DECLARATION EXISTENCE`; `ONE DCOIP != ONE TARGET DECLARATION`.

`DCOTD_` deterministically commits to the sealed DCOIP identity, target revision ID, declared actor, and rationale. `DCOTD IDENTITY != REVISION EXISTENCE`; `DCOTD IDENTITY != TARGET BINDING`; `DCOTD IDENTITY != MATERIALIZATION`; `DCOTD IDENTITY != PERSISTENCE AUTHORITY`; `DCOTD IDENTITY != OBSERVATION TRUTH`. `DECLARATION IDENTITY != PERSISTENCE AUTHORITY`. An embedded projected `AUTHORITATIVE_STATE` reference is neither inspected nor admitted to a source inventory: `TARGET DECLARATION != SOURCE STATE REFERENCE ADMISSION`; `TARGET DECLARATION != SOURCE STATE INVENTORY MEMBERSHIP`; `TARGET REVISION REFERENCE != MATERIALIZATION READINESS`; `AUTHORITATIVE REFERENCE CARRIED BY DCOIP != REFERENCE PRESENT IN TARGET REVISION CONTEXT`. Boundary-local shallow descriptor capture and sealed predecessor assertion reject hostile state without getter execution; stored assertion repairs nothing and returned state is detached. Phase 8D4A represents no time, truth, semantic support, causation, persistence, Feedback, Learning, or loop closure.

## Trust boundaries

1. **Producer adapter boundary.** Producer-specific persistence and artifact validation stay in adapters/resolvers. The generic kernel has no Capability Core import.
2. **Reader composition boundary.** Resolver registrations are supplied when `createBoundAuthoritativeStateReader(...)` constructs a reader. Resolver identity is the exact pair `producerId + authorityContractId`; duplicate bindings fail.
3. **Reference boundary.** Reader input is an exact four-field data-object capture. It rejects malformed, accessor-backed, extra-key, symbol-keyed, or hostile reference objects before resolver selection.
4. **Context boundary.** `DecisionContextDraft` construction and assertion are structural only. Source references are canonical, unique, and detached; an `AUTHORITATIVE_STATE` item provenance must name one of them.
5. **5C1 operation boundary.** The validator captures the complete supplied context through own data descriptors before asserting it, then resolves detached captured references in canonical order. Mutation of the caller-owned context after validation has begun cannot redirect later calls.
6. **5C2 operation boundary.** The binder performs no semantic evaluation until Stage A has resolved every canonical source reference, verified each returned reference, and prepared an isolated payload for each. It captures both reader and evaluator methods with their receivers at construction; later replacement cannot redirect the binder.
7. **Semantic payload boundary.** The Phase-5A reader returns an opaque resolver payload without generically cloning it. Phase 5C2 uses `structuredClone` for its own operation-local evaluator payload and then rejects direct or transitive shared memory, including `SharedArrayBuffer` and views backed by it. This prevents semantic inspection from granting producer-memory mutation capability.
8. **5C3A structural expectation boundary.** Construction and assertion defensively capture the entire context and expectation representation. They perform only structural context membership and deterministic identity work; they do not call a reader, resolver, repository, semantic evaluator, or Phase-5C2 binder.
9. **5C3B structural relation proposal boundary.** Construction and assertion defensively capture the entire context and relation representation. They require context item membership and, for `AUTHORITATIVE_STATE` provenance, source-reference membership only. They do not call a reader, resolver, repository, semantic evaluator, Phase-5C2 binder, or Phase-5C3A expectation API.
10. **5C3C structural gap boundary.** Reconstruction consumes a structurally valid context, expectation, and explicit basis. It validates represented EBIND/DREL proposal artifacts but invokes no reader, resolver, repository, binder, evaluator, detector, or graph traversal. `assertStructuralGap` reconstructs against the exact basis before it accepts a stored gap, so a self-consistent hash cannot make a gap valid under a satisfying basis.
11. **5C3D structural consequence boundary.** Reconstruction revalidates the source gap against the captured context, expectation, and gap basis before validating one caller-supplied ordered dependency path. It performs no graph discovery, authority resolution, semantic evaluation, or relation-truth validation; a valid DREL path remains represented proposal data.
12. **5C4 validation-assembly boundary.** Assembly operation-locally captures one detached snapshot for each derivation occurrence, then revalidates sealed predecessor contracts. The basis used for derivation is the basis committed into the assembly. It calls no authority operation, reader, resolver, repository, payload, binder, or evaluator.
13. **5D1 revision-artifact boundary.** Revision construction and assertion capture one detached operation-local revision state, revalidate its embedded Phase-5B context and Phase-5C4 derivation assembly, and compare detached stored state with reconstructed canonical state. They do not reread caller-owned nested state after capture, call a repository, resolve a parent, re-resolve authority, or select a head.
14. **5D2A bound-persistence boundary.** The shipped in-memory persister captures its repository dependencies at construction and captures one pristine detached expected revision before repository awaits. The runtime-private writer receives a detached copy, then a post-write reread is captured, sealed-asserted, and compared for exact complete-artifact equality with the pristine expected revision. Storage machinery is not a supported raw write capability, and a successful private write alone is not authority of record. Interface conformance alone does not prove a third-party repository implementation preserves this boundary.
15. **5D2B PostgreSQL adapter boundary.** The adapter lives outside generic Decision Core and receives its configured database dependency. A read captures JSONB payload, sealed-asserts that exact persisted revision representation, verifies physical and embedded revision identities, and returns a detached artifact: `READ != RECONSTRUCT != REPAIR`. The runtime-private writer uses immutable insert plus a conflict-race reread; the sealed 5D2A persister still performs its separate final authority reread. PostgreSQL rows require `row.revision_id == payload.revisionId` and `row.previous_revision_id == payload.previousRevisionId`.
16. **5D3 lineage-read boundary.** The reconstructor captures only one own data-property `getRevisionById` method at construction. Every operation validates the start ID before a read, tracks requested IDs in an operation-local visited set before each read, sealed-asserts each detached returned revision, and follows only its explicit predecessor reference. It returns only after the chain reaches explicit `previousRevisionId: null`; it does not repair stored revisions, return partial chains, write, enumerate branches, or discover descendants.
17. **6A assessment-request boundary.** Construction and assertion defensively capture exact request representation. `revisionId` is DREV-shape only; question and selection IDs are DCI-shape only; `requestedBy` is declared `HUMAN_INPUT` ownership only. Construction may trim `actorId`, canonicalize selection order, reject duplicates/category overlap/question reuse, and return detached state; stored assertion does not repair. It performs no repository read, revision resolution, persistence authority operation, lineage traversal, item existence/role validation, authority operation, evaluator/model/provider call, assessment, Decision Need derivation, recommendation, or human decision.
18. **6B assessment-basis boundary.** The binder captures one exact own enumerable `getRevisionById` reader method, captures/asserts the request before its read await, captures/asserts one returned revision, requires exact requested/returned DREV equality, verifies declared item membership/roles, derives complete-state `DABAS_`, asserts, and returns detached state. It performs no lineage traversal, producer-authority resolution, persistence-authority operation, assessment, Decision Need derivation, recommendation, or human decision.
19. **6C semantic-assessment-proposal boundary.** The proposer captures one exact own enumerable `evaluate` method, captures/asserts the complete basis before evaluator await, captures declared `MODEL_PROPOSAL` provenance before the call, supplies a detached basis, defensively captures output, admits only human-selected targets, rejects duplicate pairs, canonicalizes relations, derives complete-state `DASPR_`, self-asserts, and returns detached state. It creates no recommendation, Decision Need, or human decision.
20. **6D recommendation-proposal boundary.** The proposer captures one exact own enumerable `recommend` method, captures/asserts the complete assessment proposal before generator await, captures declared `MODEL_PROPOSAL` provenance before the call, supplies a detached assessment proposal, defensively captures output, admits only selected and assessment-represented options, rejects duplicate options, canonicalizes recommendations, derives complete-state `DRECP_`, self-asserts, and returns detached state. It creates no ranking, Decision Need, human decision, action, or authority operation.
21. **6E proposal-coherence boundary.** The validator captures and sealed-asserts one complete recommendation proposal, derives exactly one canonical criterion trace for every recommendation from its embedded assessment relations, derives complete-state `DPCV_`, self-asserts, and returns detached state. It has no dependency capability and interprets neither assessment dispositions nor rationales. It creates no semantic support/correctness claim, ranking, Decision Need, human decision, action, outcome, feedback, or authority operation.
22. **7A human-decision boundary.** Construction captures and sealed-asserts one complete DPCV, captures one declared `HUMAN_INPUT` actor, nonempty choices, and optional rationale, then admits each choice only through the embedded complete revision's actual `OPTION` items. It canonicalizes choice order, derives complete-state `DHDEC_`, self-asserts, and returns detached state. It does not require 6A selection, 6C assessment, 6D recommendation, or 6E trace membership, and creates no model proposal, truth, authorization, action, outcome, feedback, learning, or persistence-authority claim.
23. **8A1 action-intent boundary.** Construction captures and sealed-asserts one complete HumanDecisionDeclaration before exact input capture. It admits only a nonempty canonical subset of that declaration's chosen-option inventory, captures a declared `HUMAN_INPUT` intent actor and opaque operation text, derives complete-state `DAINT_`, self-asserts, and returns detached state. It does not inspect lower-phase inventories, read a dependency, create commitment/action/execution state, or establish authorization, truth, or persistence authority.
24. **8A2 human-commitment boundary.** Construction captures and sealed-asserts one complete DecisionActionIntent before exact two-field input capture, captures one declared `HUMAN_INPUT` commitment actor and optional rationale, derives complete-state `DHCOM_`, self-asserts, and returns detached state. It does not reinterpret Action Intent scope or inspect lower predecessors, read a dependency, create assignment/action/execution state, or establish authorization, externally enforced responsibility, truth, or persistence authority.
25. **8B occurrence-claim boundary.** Construction captures exact top-level input, source, and authoritative reference representations under separate shallow descriptor boundaries, derives complete-state `DAOC_`, self-asserts, and returns detached state. It calls no external dependency. The top-level boundary owns `source` and `operationDescription`; the source boundary owns its direct variant shape; the reference boundary owns its four opaque fields, so outer capture does not steal nested semantic error ownership.
26. **8C1 state-change-claim boundary.** Construction captures exact top-level input, source, and authoritative reference representations under separate shallow descriptor boundaries, derives complete-state `DSCC_`, self-asserts, and returns detached state. It calls no external dependency. The top-level boundary owns `source` and `stateChangeDescription`; the source boundary owns its direct variant shape; the reference boundary owns its four opaque fields, preserving nested semantic error ownership.
27. **8C2 action-state-change-association boundary.** Construction captures exact top-level input, one sealed Action Occurrence Claim endpoint, one sealed State Change Claim endpoint, provenance, and authoritative provenance reference under their own boundaries. It sealed-asserts both endpoints, derives ordered-endpoint `DASCA_`, self-asserts, and returns detached state. It calls no external dependency. The top-level boundary owns `actionOccurrenceClaim`, `stateChangeClaim`, and `provenance`; provenance owns its direct variant shape; the reference boundary owns its four opaque fields.

## Reachable structural states

| State | Current status |
| --- | --- |
| One `DECISION_QUESTION`, no source references, options, objectives, or constraints | Structurally valid `DecisionContextDraft`; 5C1 resolves zero references and succeeds. This does not establish completeness. |
| `AUTHORITATIVE_STATE` provenance whose reference is absent from `sourceStateReferences` | Structurally invalid. |
| A structurally valid context whose reference no longer resolves | Structurally valid, but the 5C1 operation fails through the bound reader. |
| A successfully resolved reference with unrelated payload content | Valid 5C1 operation input/result; payload remains semantically uninterpreted. |
| A structurally valid context whose evaluator proposes no bindings | Valid 5C2 result. It does not mean `NOT_SUPPORTED`, completeness, incompleteness, support, or a gap. |
| `AUTHORITATIVE_STATE` provenance item with no evaluator proposal | Valid 5C2 result; provenance does not imply `SUPPORTED`. |
| Context has no `OPTION` items and no `CONTEXT_ROLE` expectation | Phase 5C3A derives and represents no Gap. |
| Context has no `OPTION` items and an explicit `CONTEXT_ROLE` expectation with `minimumCount: 1` | A valid expectation exists; 5C3A still produces no Gap or satisfaction result. |
| Objective has zero binding proposals and no `EVIDENCE_BINDING` expectation | Phase 5C3A derives and represents no Gap. |
| Explicit `EVIDENCE_BINDING` expectation exists for an objective | A valid comparison target exists; satisfaction remains unevaluated. |
| Explicit `DEPENDENCY` expectation says A depends on B | A valid expectation exists; no Dependency finding is established. |
| Explicit `CONTRADICTION` proposal between A and B | A valid canonical relation proposal exists; no structural Contradiction finding is established. |
| Explicit `DEPENDENCY` proposal A -> B | A valid directional relation proposal exists; no Dependency finding is established. |
| Both `DEPENDENCY` proposals A -> B and B -> A | Separate artifacts are representable; 5C3B makes no graph-level cycle judgment. |
| No relation proposal | No conclusion that no relation exists. |
| Explicit `CONTEXT_ROLE` expectation below its minimum | A basis-relative `CONTEXT_ROLE` gap is derived from the context's represented items. |
| Explicit `CONTEXT_ROLE` expectation at or above its minimum | `null`; this one expectation derives no gap under this basis, not a global-completeness claim. |
| Explicit `EVIDENCE_BINDING` expectation with zero supplied bindings | A basis-relative gap is derived because that explicit expectation is evaluated against that explicit basis. |
| Explicit `EVIDENCE_BINDING` expectation with an accepted represented binding | `null` for that expectation and basis. |
| Explicit dependency expectation plus an explicit supplied `DEPENDENCY` basis with no exact satisfying directional proposal | A basis-relative `DEPENDENCY` gap is derived from that supplied basis. |
| Explicit dependency expectation plus an explicit supplied `DEPENDENCY` basis containing an exact directional proposal | `null` for that expectation and basis. |
| Explicit dependency expectation plus an explicit supplied `DEPENDENCY` basis containing only the reverse proposal | A basis-relative gap is derived; the reverse proposal ID is retained as relevant observation data but does not satisfy the direction. |
| No explicit expectation | No structural-gap reconstruction occurs; absence alone derives no Gap. |
| Valid item-anchored `EVIDENCE_BINDING` gap plus one explicit dependency proposal whose prerequisite is its subject item | A canonical one-hop basis-relative `StructuralConsequence` is derived. |
| Valid item-anchored gap plus an explicit ordered multi-hop dependency path | A canonical consequence is derived; `affectedItemId` is the final path dependent item. |
| Valid `CONTEXT_ROLE` gap | It has no unique missing item anchor and cannot propagate: `ERR_DECISION_STRUCTURAL_CONSEQUENCE_SOURCE_NOT_ITEM_ANCHORED`. |
| Explicit path contains a `CONTRADICTION`, has broken continuity, repeats an ID/item, or begins away from the source item | Path validation fails; 5C3D does not discover or repair an alternative path. |
| Phase 5C3D is not invoked | No `StructuralConsequence` is derived; no graph-reachability conclusion follows. |
| Phase 5C3D is invoked with an explicit `DEPENDENCY_PATH` whose `relationProposals` array is empty | `ERR_DECISION_STRUCTURAL_CONSEQUENCE_PATH_INVALID`. |
| Empty `expectationValidations` and `consequenceValidations` | A valid empty canonical validation assembly; it is not a completeness proof. |
| Bound basis with zero selected options, objectives, and constraints | Valid 6B basis; a 6C evaluator may return `[]`, producing a valid zero-assessment proposal. This is neither readiness nor `UNDETERMINED`. |
| Selected `OPTION × OBJECTIVE` relation with `ALIGNED` | Valid semantic assessment relation; it is not option preference or recommendation. |
| Selected `OPTION × CONSTRAINT` relation with `MISALIGNED` | Valid semantic assessment relation; it is not automatic rejection or recommendation. |
| Evaluator explicitly emits `UNDETERMINED` | Explicit proposal state, distinct from an absent relation. |
| Revision contains an option, objective, or constraint not selected by the request | It cannot be admitted as a Phase 6C option or criterion target merely through revision membership. |
| Same option/criterion pair occurs twice | `ERR_DECISION_ASSESSMENT_PROPOSAL_DUPLICATE`; differing rationale or disposition does not create another relation. |
| Partial selected evaluation matrix | Valid; no completeness or readiness inference follows. |
| Selected and assessment-represented option appears in recommendation output | Valid recommendation proposal target; it is not best, optimal, a human preference, or a human decision. |
| Selected option absent from all assessment relations | Not admissible as a recommendation target; this is neither rejection nor a readiness/Decision Need conclusion. |
| Assessment disposition `MISALIGNED` or `UNDETERMINED` on a selected represented option | The option remains structurally admissible for recommendation; disposition is not recommendation policy. |
| Empty assessment relation inventory and empty recommendation output | Valid zero-recommendation proposal; no rejection or synthetic state is created. |
| Multiple recommendation targets | Valid canonical inventory; it carries no ranking. |
| Recommended option with represented `ALIGNED`, `PARTIALLY_ALIGNED`, `MISALIGNED`, or `UNDETERMINED` relations | Valid 6E trace contains every represented criterion ID; disposition is not coherence policy. |
| Assessed but unrecommended option | Produces no 6E trace. `ASSESSED != RECOMMENDED`. |
| Zero recommendations | Valid 6E validation with `traces: []`; absence is not rejection, incompleteness, or readiness state. |
| Multiple recommendations | One canonical trace per recommendation; no trace is created for assessed but unrecommended options. |
| Revision options A, B, C; 6A selects A/B; 6C assesses A; 6D recommends A; 6E traces A; human chooses C | Valid 7A declaration because C is an actual embedded revision `OPTION`. Its absence from every model-proposal inventory is no human-choice admission failure. |
| Human chooses two distinct actual revision options in caller order C, A | Valid 7A declaration with canonical item-ID choice order; it creates no ranking or ordered preference. |
| Human supplies no chosen options | Invalid Phase 7A positive-selection input only; it does not represent defer, abstain, reject-all, or no decision. |
| Canonical C3C result is `null` and caller supplies `null` | One `NO_GAP` assembly result: no gap under this represented basis, not truth or global satisfaction. |
| Canonical C3C result is a gap and caller supplies its derivation-valid gap | One `GAP` assembly result with canonical `gapId`. |
| One EVIDENCE_BINDING or DEPENDENCY gap ID with two supplied bases differing only in irrelevant observations | The gap ID may remain the same, but the canonical descriptor inventories and `DVASM_` identities differ. For CONTEXT_ROLE, canonical context observations are already committed through `contextId` and the descriptor remains kind-only. |
| Valid consequence without matching assembled GAP source result | `ERR_DECISION_VALIDATION_ASSEMBLY_CONSEQUENCE_SOURCE_MISSING`. |
| Root revision with `previousRevisionId: null` and a valid empty assembly | A valid self-contained canonical `DecisionContextRevision`; it is not persisted or a completeness proof. |
| Child-shaped revision with a syntactically valid `previousRevisionId` | Structurally valid without a parent lookup; 5D1 does not establish that the parent exists. |
| Same context, previous revision ID, and assembly with different identity-excluded EBIND rationale payload | The complete revision payloads may differ while `DREV_` remains the same; 5D1 does not select one state for that identity. |
| Stored revision with noncanonical validation-input ordering | `ERR_DECISION_CONTEXT_REVISION_INVALID`; assertion does not repair the stored body. |
| Root revision persisted through the shipped in-memory bound path | No parent lookup occurs. A successful exact post-write reread establishes repository-selected authority of record for that DREV during that operation; it is not truth, current state, or head selection. |
| Child revision whose requested immediate parent is missing | `ERR_DECISION_CONTEXT_REVISION_PARENT_NOT_FOUND`; the child is not written. |
| Child revision whose immediate parent is malformed, invalid, or identity-mismatched | `ERR_DECISION_CONTEXT_REVISION_PARENT_INVALID`; no parent-of-parent lookup occurs and the child is not written. |
| Two children naming one persisted parent | Both children are representable and may persist. Immediate referential integrity does not select a branch, head, latest, or active revision. |
| Child preserves its parent's `contextId` and `assemblyId` | Valid: a new DREV can arise from `previousRevisionId` without a required semantic change. |
| Same DREV and exact complete artifact replayed | Idempotent replay. |
| Same DREV with divergent complete identity-excluded payload | `ERR_DECISION_CONTEXT_REVISION_IMMUTABLE_CONFLICT`; DREV alone is not the complete payload. |
| Private write succeeds but the reread is missing, invalid, wrong-ID, or complete-payload divergent | `ERR_DECISION_CONTEXT_REVISION_PERSISTENCE_INVALID`. |
| PostgreSQL row has malformed/noncanonical JSONB or physical/embedded revision identity mismatch | `ERR_DECISION_CONTEXT_REVISION_POSTGRES_RECORD_INVALID`; no read-time reconstruction or repair occurs. |
| Two PostgreSQL clients race with the same exact DREV artifact | Both persist operations may succeed idempotently; one physical row exists. |
| Two PostgreSQL clients race with divergent complete artifacts for one DREV | One immutable state wins; the divergent operation fails `ERR_DECISION_CONTEXT_REVISION_IMMUTABLE_CONFLICT`. |

## Generic core and producer adapters

The generic `lib/decision-core/**` production files are guarded against imports from Career, Capability Core, matching, recommendations, and legacy Career decision-loop code. The Capability adapter may import Capability Core because it is a producer-specific integration outside that generic kernel.

Decision Core is application-domain neutral, not ontology-free in a metaphysical sense: the current ontology is intentionally about opaque producer state, structural context items, roles, provenance, operation-time authority reachability, semantic proposals, explicit structural expectations, explicit structural relation proposals, basis-relative structural gaps and explicit-path consequences, derivational-coherence assemblies, self-contained revision artifacts, repository-bound immutable authority-of-record operations, the PostgreSQL adapter implementing those sealed persistence semantics outside the kernel, read-only explicit predecessor-lineage reconstruction, a standalone human-declared assessment-request contract, a revision-bound assessment-basis contract, a semantic assessment-proposal contract, a recommendation-proposal contract, a deterministic proposal-coherence trace-validation contract, an explicit positive human option-selection declaration, a decision-bound action-intent contract, a human-commitment contract, a standalone source-attributed action-occurrence-claim contract, a standalone source-attributed state-change-claim contract, an explicit provenance-attributed action-state-change association-proposal contract over one sealed `ActionOccurrenceClaim` and one sealed `StateChangeClaim`, an explicit provenance-attributed outcome-attribution-proposal contract over one sealed `ActionStateChangeAssociationProposal`, an explicit provenance-attributed opaque-statement observation-role candidate contract over one sealed `OutcomeAttributionProposal`, an explicit positive human admission-declaration contract over one sealed `DecisionContextObservationProposal` for future `OBSERVATION`-role materialization, and a deterministic observation-item semantic projection contract over one sealed `DecisionContextObservationAdmissionDeclaration`. These are distinct operations and artifacts, not one automatic pipeline. Recruiting is not implemented on top of this module.

## Phase 8D4B decision-context-observation-target-revision-binding boundary

Phase 8D4B is an explicit operation only: `DecisionContextObservationTargetDeclaration + bound revision-read capability -> exact sealed DecisionContextRevision -> DecisionContextObservationTargetRevisionBinding -> STOP`. There is no automatic declaration-to-binding edge. The supplied `DecisionContextObservationTargetRevisionReader` exposes only `getRevisionById(revisionId: string): Promise<DecisionContextRevision | null>`; `BoundDecisionContextObservationTargetRevisionBinder.bind(declaration)` captures and validates the complete sealed declaration before awaiting exactly one read for its captured `targetRevisionId`, then accepts only a complete sealed revision with equal `revisionId`.

The five exact fields are `artifactKind`, `schemaVersion`, `decisionContextObservationTargetRevisionBindingId`, `decisionContextObservationTargetDeclaration`, and `revision`. `DCOTRB_` is SHA-256 over `[schema, canonical complete declaration, canonical complete revision]`, first 24 uppercase hex. `COMPLETE REVISION STATE != DREV STRING ALONE`: the revision string does not prove every represented revision field identical. The reader establishes exact returned-state binding only: `READER RETURN != PERSISTENCE PROOF`; `REVISION BINDING != PERSISTENCE AUTHORITY`; `REVISION BINDING != AUTHORITY OF RECORD`; `REVISION BINDING != CURRENT REVISION`; `REVISION BINDING != HEAD REVISION`; `REVISION BINDING != LATEST REVISION`; `REVISION BINDING != ACTIVE REVISION`; `REVISION BINDING != REVISION SELECTION`; `REVISION BINDING != MUTATION DESTINATION`; `REVISION BINDING != FUTURE REVISION`.

The bound revision remains base state: `TARGET REVISION BOUND != OBSERVATION MATERIALIZED`; `REVISION BINDING != MATERIALIZATION`; `REVISION BINDING != MATERIALIZATION READINESS`; `REVISION BINDING != DECISION CONTEXT ITEM`; `REVISION BINDING != ITEM MEMBERSHIP`; `REVISION BINDING != CONTEXT MEMBERSHIP`; `REVISION BINDING != CONTEXT MUTATION`; `REVISION BINDING != REVISION MUTATION`; `REVISION BINDING != REVISION CREATION`; `REVISION BINDING != REVISION TRANSITION`; `REVISION BINDING != LOOP CLOSED`. It performs no lineage traversal, persister invocation, Context-draft construction, or revision construction.

`AUTHORITATIVE REFERENCE CARRIED BY DCOIP != REFERENCE PRESENT IN BOUND REVISION CONTEXT`; `REVISION BINDING != SOURCE STATE REFERENCE ADMISSION`; `REVISION BINDING != SOURCE STATE INVENTORY MEMBERSHIP`; `BOUND REVISION != MATERIALIZATION READINESS`. `REVISION BINDING != OBSERVATION TRUTH`; `REVISION BINDING != OBSERVED REALITY`; `REVISION BINDING != OUTCOME TRUTH`; `REVISION BINDING != SEMANTIC SUPPORT`; `REVISION BINDING != CAUSATION`; `REVISION BINDING != HUMAN DECISION`; `PERSISTED != TRUE`.

## Phase 8D5 decision-context-observation-materialization-readiness boundary

Phase 8D5 is a deterministic structural operation only: `DecisionContextObservationTargetRevisionBinding -> structural readiness checks -> DecisionContextObservationMaterializationReadiness -> STOP`. EXACT REVISION BINDING != MATERIALIZATION READINESS. The sealed binding supplies the complete predecessor lineage and its complete base revision; no independent role, statement, provenance, or target input is accepted.

The exact five fields are `artifactKind`, `schemaVersion`, `decisionContextObservationMaterializationReadinessId`, `decisionContextObservationTargetRevisionBinding`, and `candidateItemId`. `DCOMR_` is SHA-256 over `[schema, canonical complete binding, candidateItemId]`, first 24 uppercase hex. The deterministic candidate `DCI_` identity is derived using existing Context role, statement, and provenance identity semantics only. CANDIDATE ITEM ID != DECISION CONTEXT ITEM. CANDIDATE ITEM ID != MATERIALIZATION. CANDIDATE ITEM ID != CONTEXT MEMBERSHIP.

For `HUMAN_INPUT` and `MODEL_PROPOSAL`, Phase 8D5 adds no source-inventory condition. For `AUTHORITATIVE_STATE`, the exact projected reference must already be in the bound base Context's `sourceStateReferences`; otherwise no artifact is returned and `ERR_DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_SOURCE_REFERENCE_MISSING` applies. The candidate ID must be absent from bound `context.items`; otherwise no artifact is returned and `ERR_DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_ITEM_ALREADY_PRESENT` applies. SOURCE STATE INVENTORY MEMBERSHIP != EXTERNAL AUTHORITY. ITEM ALREADY PRESENT != RETURN PATH MATERIALIZED. ITEM ALREADY PRESENT != LOOP CLOSED.

The bound revision remains base state: BOUND REVISION != MUTATION DESTINATION. READINESS != MATERIALIZATION. READINESS != DECISION CONTEXT ITEM. READINESS != CONTEXT MEMBERSHIP. READINESS != CONTEXT MUTATION. READINESS != REVISION MUTATION. READINESS != REVISION CREATION. READINESS != REVISION TRANSITION. READINESS != PERSISTENCE. READINESS != OBSERVATION TRUTH. READINESS != SEMANTIC SUPPORT. READINESS != CAUSATION. READINESS != HUMAN DECISION. READINESS != LOOP CLOSED. Phase 8D5 creates no item, Context, revision, or persistence operation.
