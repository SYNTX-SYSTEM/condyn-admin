# Decision Core artifact contracts

## Current public contracts

| Contract | Exact fields / operation | Current semantics |
| --- | --- | --- |
| `AuthoritativeStateReference` | `producerId`, `authorityContractId`, `artifactId`, `locator` | An opaque four-field pointer. Every field is required, non-empty, and captured as an enumerable own data property by the reader. It carries no payload, repository, resolver, or authority token. |
| `AuthoritativeStateResolver<TPayload>` | `producerId`, `authorityContractId`, `resolve(reference): Promise<TPayload>` | Producer-specific resolver contract. The generic reader binds it by the producer/contract pair. |
| `AuthoritativeStateResolution<TPayload>` | `reference`, `payload` | Description of one successful bound-reader operation: a detached reference plus the resolver-returned opaque payload. The generic reader does not clone the payload, and the resolution does not confer authority into another operation. |
| `BoundAuthoritativeStateReader` | `resolve(reference): Promise<AuthoritativeStateResolution>` | Reader constructed from resolver registrations. It accepts only a reference per operation. |
| `DecisionContextItemRole` | `DECISION_QUESTION`, `OBJECTIVE`, `CONSTRAINT`, `OPTION`, `OBSERVATION`, `ASSUMPTION`, `UNCERTAINTY` | Semantic role axis for a structural context item. No role establishes truth, support, adoption, or recommendation. |
| `DecisionContextItemProvenance` | `AUTHORITATIVE_STATE { stateReference }`; `HUMAN_INPUT { actorId }`; `MODEL_PROPOSAL { proposalRef }`; `DETERMINISTIC_DERIVATION { ruleId }` | Independent ownership/origin axis. Whitespace-only `actorId`, `proposalRef`, and `ruleId` values are rejected; otherwise their original string values are preserved and participate in DCI identity unchanged. `AUTHORITATIVE_STATE` requires structural membership in the context source inventory. |
| `DecisionContextItemInput` | `role`, `statement`, `provenance` | Constructor input only. Statement is trimmed at outer whitespace, without lowercasing or semantic rewriting. |
| `DecisionContextItem` | `itemId`, `role`, `statement`, `provenance` | Canonical stored item. The ID is recomputed during structural assertion. |
| `DecisionContextDraftInput` | `sourceStateReferences`, `items` | Constructor input. It does not accept a context ID, status, schema version, question ID, payload, repository, resolver, or resolution. |
| `DecisionContextDraft` | `artifactKind: "DECISION_CONTEXT_DRAFT"`, `schemaVersion: "DECISION_CONTEXT_DRAFT_V1"`, `contextId`, `validationStatus: "NOT_RUN"`, `sourceStateReferences`, `decisionQuestionId`, `items` | Detached canonical pre-validation structural artifact. It is not persisted by current Decision Core code. |
| `BoundDecisionContextAuthorityValidator` | `validate(context): Promise<void>` | Composition-time bound operation that checks current authority reachability for every context source reference. It returns no proof, payload collection, token, or validated context artifact. |
| `EvidenceBindingDisposition` | `SUPPORTED`, `PARTIALLY_SUPPORTED`, `NOT_SUPPORTED`, `CONTRADICTED` | Closed Phase-5C2 semantic evaluator disposition set. It is not authority, verified truth, completeness, recommendation, or a Phase-5C3 finding. |
| `EVIDENCE_BINDING_DISPOSITIONS` | readonly runtime list of the four disposition strings | Runtime representation of the closed disposition set. |
| `SemanticEvidenceBindingEvaluation` | `itemId`, `stateReference`, `disposition`, `rationale` | One evaluator-produced candidate relationship. The binder captures and validates it before constructing a proposal. |
| `SemanticEvidenceEvaluationInput` | `contextId`, `items: readonly DecisionContextItem[]`, `stateReference`, `payload` | Operation-local evaluator input. `items` are detached captured values exposed through a readonly array type, not a claim of deep runtime immutability; reference is detached. `payload` is the Phase-5C2 isolated opaque payload, not a repository/read capability or producer-owned shared memory. |
| `SemanticEvidenceBindingEvaluator` | `evaluate(input): Promise<readonly SemanticEvidenceBindingEvaluation[]>` | Composition-time evaluator dependency. It has no repository, resolver, reader, producer-state write capability, human decision state, or producer authority. It may mutate its operation-local detached payload without mutating the resolver-owned payload. Its output is proposal data only. |
| `SemanticEvidenceBindingProposal` | `bindingId`, `contextId`, `itemId`, `stateReference`, `disposition`, `rationale` | Canonical Phase-5C2 proposal for one item × one state reference. It is not persisted and does not validate the Decision Context. |
| `BoundSemanticEvidenceBinder` | `bind(context): Promise<SemanticEvidenceBindingProposal[]>` | Composition-time bound operation. It re-establishes authority and payload isolation before invoking semantic evaluation. |
| `STRUCTURAL_EXPECTATION_SCHEMA_VERSION` | `"STRUCTURAL_EXPECTATION_V1"` | Fixed schema-version constant for Phase 5C3A expectations. |
| `STRUCTURAL_EXPECTATION_KINDS` / `StructuralExpectationKind` | `EVIDENCE_BINDING`, `CONTEXT_ROLE`, `DEPENDENCY` | Closed Phase-5C3A expectation-kind set. These are explicit comparison-target kinds, not findings. |
| `EvidenceBindingStructuralExpectationInput` | `kind`, `subjectItemId`, `acceptedDispositions`, `provenance` | Constructor input for one item later evidence-binding comparison criterion. |
| `ContextRoleStructuralExpectationInput` | `kind`, `role`, `minimumCount`, `provenance` | Constructor input for a future count comparison against one context role. |
| `DependencyStructuralExpectationInput` | `kind`, `dependentItemId`, `prerequisiteItemId`, `provenance` | Constructor input for a future directed structural dependency comparison. |
| `StructuralExpectationInput` | Discriminated union of the three Phase-5C3A inputs | Callers supply only explicit expectation content; no context ID, artifact ID, payload, reader, resolver, repository, authority token, binding inventory, or finding. |
| `EvidenceBindingStructuralExpectation` | Common expectation fields plus `subjectItemId`, `acceptedDispositions` | Canonical explicit criterion for a future item/binding comparison. It does not inspect or claim any binding. |
| `ContextRoleStructuralExpectation` | Common expectation fields plus `role`, `minimumCount` | Canonical explicit criterion for a future role-count comparison. It does not count current items or claim satisfaction. |
| `DependencyStructuralExpectation` | Common expectation fields plus `dependentItemId`, `prerequisiteItemId` | Canonical explicit criterion for a future directed dependency comparison. It is not a Dependency finding. |
| `StructuralExpectation` | Discriminated union of the three Phase-5C3A artifacts | `artifactKind: "STRUCTURAL_EXPECTATION"`, `schemaVersion: "STRUCTURAL_EXPECTATION_V1"`, `expectationId`, `contextId`, `kind`, `provenance`, and exact variant fields. It is not persisted by current Decision Core code. |
| `createStructuralExpectation(context, input)` | `DecisionContextDraft × StructuralExpectationInput -> StructuralExpectation` | Captures/asserts one context, validates explicit input structurally, derives canonical content/identity, asserts the result, and returns a detached clone. |
| `assertStructuralExpectation(context, expectation)` | `DecisionContextDraft × StructuralExpectation -> void` | Verifies exact stored representation, context binding, membership, canonicality, and deterministic identity without repairing the artifact. |
| `STRUCTURAL_RELATION_PROPOSAL_SCHEMA_VERSION` | `"STRUCTURAL_RELATION_PROPOSAL_V1"` | Fixed schema-version constant for Phase 5C3B relation proposals. |
| `STRUCTURAL_RELATION_PROPOSAL_KINDS` / `StructuralRelationProposalKind` | `CONTRADICTION`, `DEPENDENCY` | Closed Phase-5C3B relation-proposal kind set. These are caller-supplied proposals, not relation truth or findings. |
| `ContradictionStructuralRelationProposalInput` | `kind: "CONTRADICTION"`, `itemIds: readonly [string, string]`, `provenance` | Constructor input for one proposed symmetric item/item incompatibility relation. |
| `DependencyStructuralRelationProposalInput` | `kind: "DEPENDENCY"`, `dependentItemId`, `prerequisiteItemId`, `provenance` | Constructor input for one proposed directional item/item dependency relation. |
| `StructuralRelationProposalInput` | Discriminated union of the two Phase-5C3B inputs | Callers supply one explicit relation proposal; no artifact ID, context ID, payload, reader, resolver, repository, authority token, semantic binding, expectation, or finding. |
| `ContradictionStructuralRelationProposal` | Common relation fields plus canonical `itemIds` | Canonical symmetric proposal only; it is not a formal logical contradiction or Contradiction finding. |
| `DependencyStructuralRelationProposal` | Common relation fields plus `dependentItemId`, `prerequisiteItemId` | Canonical directional proposal only; it is not a Dependency expectation or Dependency finding. |
| `StructuralRelationProposal` | Discriminated union of the two Phase-5C3B artifacts | `artifactKind: "STRUCTURAL_RELATION_PROPOSAL"`, `schemaVersion: "STRUCTURAL_RELATION_PROPOSAL_V1"`, `relationProposalId`, `contextId`, `kind`, `provenance`, and exact variant fields. It is not persisted by current Decision Core code. |
| `createStructuralRelationProposal(context, input)` | `DecisionContextDraft × StructuralRelationProposalInput -> StructuralRelationProposal` | Captures/asserts one context, structurally validates one explicit proposal, derives canonical content/identity, asserts the result, and returns a detached clone. |
| `assertStructuralRelationProposal(context, proposal)` | `DecisionContextDraft × StructuralRelationProposal -> void` | Verifies exact stored representation, context binding, membership, applicable stored canonicality, and deterministic identity without repairing the artifact. |
| `STRUCTURAL_GAP_SCHEMA_VERSION` | `"STRUCTURAL_GAP_V1"` | Fixed schema-version constant for Phase 5C3C derived gaps. |
| `StructuralGapKind` | `EVIDENCE_BINDING`, `CONTEXT_ROLE`, `DEPENDENCY` | Closed derived-gap kind union corresponding to the sealed expectation kinds. |
| `EvidenceBindingStructuralGapObservationBasis` | `kind: "EVIDENCE_BINDING"`, `bindings: readonly SemanticEvidenceBindingProposal[]` | Explicit represented EBIND observation basis. |
| `ContextRoleStructuralGapObservationBasis` | `kind: "CONTEXT_ROLE"` | The supplied structurally valid context is the represented role observation basis. |
| `DependencyStructuralGapObservationBasis` | `kind: "DEPENDENCY"`, `relationProposals: readonly StructuralRelationProposal[]` | Explicit represented DREL observation basis. |
| `StructuralGapObservationBasis` | Discriminated union of the three basis variants | Its kind must exactly match the expectation kind. |
| `EvidenceBindingStructuralGap` | Common fields plus `subjectItemId`, `acceptedDispositions`, `observedBindingIds` | Canonical basis-relative unmet evidence-binding expectation. |
| `ContextRoleStructuralGap` | Common fields plus `role`, `minimumCount`, `observedCount`, `observedItemIds` | Canonical basis-relative unmet context-role expectation. |
| `DependencyStructuralGap` | Common fields plus `dependentItemId`, `prerequisiteItemId`, `observedRelationProposalIds` | Canonical basis-relative unmet dependency expectation. |
| `StructuralGap` | Discriminated union of the three variants | `artifactKind: "STRUCTURAL_GAP"`, `schemaVersion: "STRUCTURAL_GAP_V1"`, `gapId`, `contextId`, `expectationId`, `kind`, and exact variant fields. It has no independent provenance. |
| `reconstructStructuralGap(context, expectation, basis)` | `DecisionContextDraft × StructuralExpectation × StructuralGapObservationBasis -> StructuralGap \| null` | Compares exactly one expectation against exactly one explicit represented basis. |
| `assertStructuralGap(context, expectation, basis, gap)` | `DecisionContextDraft × StructuralExpectation × StructuralGapObservationBasis × StructuralGap -> void` | Basis-bound stored-artifact assertion; verifies deterministic derivation rather than only hash consistency. |
| `STRUCTURAL_CONSEQUENCE_SCHEMA_VERSION` | `"STRUCTURAL_CONSEQUENCE_V1"` | Fixed schema-version constant for Phase 5C3D structural consequences. |
| `StructuralConsequencePropagationBasis` | `kind: "DEPENDENCY_PATH"`, `relationProposals: readonly StructuralRelationProposal[]` | One explicit ordered represented dependency path; it is not an unordered graph inventory. |
| `StructuralConsequence` | `artifactKind: "STRUCTURAL_CONSEQUENCE"`, `schemaVersion: "STRUCTURAL_CONSEQUENCE_V1"`, `consequenceId`, `contextId`, `sourceGapId`, `sourceItemId`, `affectedItemId`, `dependencyPathRelationProposalIds` | Canonical basis-relative derivation from one validated item-anchored gap and one explicit ordered dependency path. It has no independent provenance. |
| `reconstructStructuralConsequence(context, expectation, gapBasis, gap, propagationBasis)` | `DecisionContextDraft × StructuralExpectation × StructuralGapObservationBasis × StructuralGap × StructuralConsequencePropagationBasis -> StructuralConsequence` | Revalidates one source gap, validates one explicit ordered path, and derives one consequence. |
| `assertStructuralConsequence(context, expectation, gapBasis, gap, propagationBasis, consequence)` | `DecisionContextDraft × StructuralExpectation × StructuralGapObservationBasis × StructuralGap × StructuralConsequencePropagationBasis × StructuralConsequence -> void` | Reconstructs from the exact supplied derivation inputs before accepting stored representation and identity. |
| `DECISION_CONTEXT_VALIDATION_ASSEMBLY_SCHEMA_VERSION` | `"DECISION_CONTEXT_VALIDATION_ASSEMBLY_V1"` | Fixed schema-version constant for Phase 5C4 assemblies. |
| `StructuralValidationBasisDescriptor` | `CONTEXT_ROLE`; `EVIDENCE_BINDING { bindingIds }`; `DEPENDENCY { relationProposalIds }` | Assembly-only canonical descriptor: EVIDENCE_BINDING/DEPENDENCY carry complete supplied observation IDs; CONTEXT_ROLE is kind-only and uses context-bound observations. |
| `StructuralExpectationValidationInput` | `expectation`, `basis`, `result` | One caller-supplied Phase-5C3C derivation occurrence; the result is revalidated rather than trusted. |
| `StructuralConsequenceValidationInput` | `expectation`, `gapBasis`, `gap`, `propagationBasis`, `consequence` | One caller-supplied Phase-5C3D derivation occurrence; the consequence and its source gap are revalidated. |
| `DecisionContextValidationAssemblyInput` | `expectationValidations`, `consequenceValidations` | Explicit derivation inputs; both arrays may be empty. |
| `DecisionContextValidationAssembly` | `artifactKind: "DECISION_CONTEXT_VALIDATION_ASSEMBLY"`, `schemaVersion: "DECISION_CONTEXT_VALIDATION_ASSEMBLY_V1"`, `assemblyId`, `contextId`, `expectationResults`, `consequenceIds` | Separate deterministic derivational-coherence artifact. It does not mutate the draft or claim truth, completeness, authority, or decision readiness. |
| `assembleDecisionContextValidation(context, input)` | `DecisionContextDraft × DecisionContextValidationAssemblyInput -> DecisionContextValidationAssembly` | Revalidates predecessor derivations and returns a detached canonical assembly. |
| `assertDecisionContextValidationAssembly(context, input, assembly)` | `DecisionContextDraft × DecisionContextValidationAssemblyInput × DecisionContextValidationAssembly -> void` | Reconstructs the exact expected assembly before accepting stored representation and identity. |
| `DECISION_CONTEXT_REVISION_SCHEMA_VERSION` | `"DECISION_CONTEXT_REVISION_V1"` | Fixed schema-version constant for Phase 5D1 revision artifacts. |
| `DecisionContextRevisionInput` | `previousRevisionId`, `context`, `validationInput`, `validationAssembly` | Constructor input for one self-contained revision artifact; no caller-supplied revision ID or repository metadata. |
| `DecisionContextRevision` | `artifactKind: "DECISION_CONTEXT_REVISION"`, `schemaVersion: "DECISION_CONTEXT_REVISION_V1"`, `revisionId`, `previousRevisionId`, `context`, `validationInput`, `validationAssembly` | Detached canonical self-contained derivation state. It is not persisted authority, truth, a current/head/latest revision, or a parent-existence claim. |
| `createDecisionContextRevision(input)` | `DecisionContextRevisionInput -> DecisionContextRevision` | Captures once, validates/reconstructs the embedded derivation state, canonicalizes validation input, and returns a detached canonical revision. |
| `assertDecisionContextRevision(revision)` | `DecisionContextRevision -> void` | Revalidates the self-contained state and requires canonical stored body before accepting deterministic identity. |
| `DecisionContextRevisionRepository` | `getRevisionById(revisionId)` and `createDecisionContextRevisionPersister()` | Supported interface shape; it has no raw-writer member, but conformance alone does not prove 5D2A governance semantics. |
| `BoundDecisionContextRevisionPersister` | `persist(revision)` | Supported repository-bound persistence capability for one complete `DecisionContextRevision`. |
| `InMemoryDecisionContextRevisionRepository` | In-memory `DecisionContextRevisionRepository` implementation | Shipped implementation that enforces 5D2A authority semantics; it is not durable persistence. |
| `PostgresDecisionContextRevisionRepository` | Constructor receives configured `PostgresJsDatabase`; `getRevisionById(revisionId)` and `createDecisionContextRevisionPersister()` | Infrastructure adapter outside generic Decision Core that implements sealed 5D2A persistence semantics using PostgreSQL. Its physical table descriptor is internal, not a supported barrel export. |
| `DecisionContextRevisionLineage` | `startRevisionId`, `rootRevisionId`, `revisions` | Plain detached read model for one complete explicit predecessor path; it is not a persisted artifact, authority certificate, branch artifact, or current-state model. |
| `BoundDecisionContextRevisionLineageReconstructor` | `reconstruct(startRevisionId)` | Read-only bound capability that reconstructs one complete predecessor path. |
| `createBoundDecisionContextRevisionLineageReconstructor(reader)` | Exact `getRevisionById(revisionId)` reader dependency -> bound reconstructor | Captures only one own function-valued data-property reader method; no writer, persister, database, or authority dependency is accepted. |
| `DECISION_ASSESSMENT_REQUEST_SCHEMA_VERSION` | `"DECISION_ASSESSMENT_REQUEST_V1"` | Fixed schema-version constant for the Phase 6A human-owned request contract. |
| `DecisionAssessmentRequestActor` | `origin: "HUMAN_INPUT"`, `actorId` | Declared human ownership only; `HUMAN_INPUT != AUTHENTICATION`. |
| `DecisionAssessmentRequestInput` | `revisionId`, `requestedBy`, `decisionQuestionItemId`, `selectedOptionItemIds`, `selectedObjectiveItemIds`, `selectedConstraintItemIds` | Constructor input for one declared request. DREV shape is not revision existence; DCI shape is not item membership or role. |
| `DecisionAssessmentRequest` | Exact canonical nine-field stored artifact | A detached `DECISION_ASSESSMENT_REQUEST` / `DECISION_ASSESSMENT_REQUEST_V1` artifact with deterministic `DAREQ_`; request is not assessment, Decision Need, recommendation, or human decision. |
| `createDecisionAssessmentRequest(input)` | `DecisionAssessmentRequestInput -> DecisionAssessmentRequest` | Captures and validates request representation, trims `actorId`, canonicalizes selection inventories, derives `DAREQ_`, returns detached state, and loads no referenced revision. |
| `assertDecisionAssessmentRequest(value)` | `unknown -> asserts value is DecisionAssessmentRequest` | Verifies exact already-canonical stored representation and deterministic identity without sorting, trimming, deduplicating, or otherwise repairing it. |
| `DECISION_ASSESSMENT_BASIS_SCHEMA_VERSION` | `"DECISION_ASSESSMENT_BASIS_V1"` | Fixed schema-version constant for the Phase 6B revision-bound assessment-basis contract. |
| `DecisionAssessmentBasisRevisionReader` | `getRevisionById(revisionId: string): Promise<DecisionContextRevision \| null>` | Narrow exact read capability only; it is not a repository writer, persistence proof, lineage API, or authority resolver. |
| `BoundDecisionAssessmentBasisBinder` | `bind(assessmentRequest: DecisionAssessmentRequest): Promise<DecisionAssessmentBasis>` | Construction-bound read operation that creates one revision-bound basis or fails at its defined request/revision/membership boundary. |
| `DecisionAssessmentBasis` | Exact canonical five-field stored artifact | A detached `DECISION_ASSESSMENT_BASIS` / `DECISION_ASSESSMENT_BASIS_V1` artifact with deterministic `DABAS_`; basis is not assessment, Decision Need, recommendation, or human decision. |
| `createBoundDecisionAssessmentBasisBinder(reader)` | `DecisionAssessmentBasisRevisionReader -> BoundDecisionAssessmentBasisBinder` | Captures only an exact own enumerable data-method reader capability; the binder reads one exact requested revision and has no writer, repository, evaluator, lineage, or authority operation. |
| `assertDecisionAssessmentBasis(value)` | `unknown -> asserts value is DecisionAssessmentBasis` | Verifies exact already-canonical self-contained stored representation, revision binding, membership/roles, and deterministic complete-state identity without repairing it. |
| `DECISION_ASSESSMENT_PROPOSAL_SCHEMA_VERSION` | `"DECISION_ASSESSMENT_PROPOSAL_V1"` | Fixed schema-version constant for the Phase 6C semantic assessment-proposal contract. |
| `DECISION_ASSESSMENT_DISPOSITIONS` / `DecisionAssessmentDisposition` | `ALIGNED`, `PARTIALLY_ALIGNED`, `MISALIGNED`, `UNDETERMINED` | Closed semantic assessment relation disposition set; it contains no score, confidence, probability, weight, priority, severity, or rank. |
| `DecisionAssessmentEvaluation` | `optionItemId`, `criterionItemId`, `disposition`, `rationale` | One admitted selected `OPTION × OBJECTIVE/CONSTRAINT` semantic assessment relation. Rationale is trimmed and identity-bearing. |
| `DecisionAssessmentProposalProvenance` | `origin: "MODEL_PROPOSAL"`, `proposalRef` | Declared proposal provenance only; `MODEL_PROPOSAL != AUTHENTICATED MODEL != PROVIDER AUTHORITY != TRUTH`. |
| `DecisionAssessmentEvaluationInput` | `assessmentBasis` | Exact one-field detached complete-basis evaluator input. |
| `DecisionAssessmentEvaluator` | `evaluate(input): Promise<readonly DecisionAssessmentEvaluation[]>` | Exact composition-time evaluator capability with no repository, writer, persistence, authority, lineage, recommendation, or decision API. |
| `BoundDecisionAssessmentProposer` | `propose(assessmentBasis, proposedBy): Promise<DecisionAssessmentProposal>` | Bound operation that creates one canonical model semantic assessment proposal. |
| `DecisionAssessmentProposal` | Exact canonical six-field stored artifact | A detached `DECISION_ASSESSMENT_PROPOSAL` / `DECISION_ASSESSMENT_PROPOSAL_V1` artifact with deterministic `DASPR_`; it is not recommendation, Decision Need, or human decision. |
| `createBoundDecisionAssessmentProposer(evaluator)` | `DecisionAssessmentEvaluator -> BoundDecisionAssessmentProposer` | Captures exactly one own enumerable data-method `evaluate` capability and binds it at construction. |
| `assertDecisionAssessmentProposal(value)` | `unknown -> asserts value is DecisionAssessmentProposal` | Self-contained exact stored assertion; it performs no evaluator, reader, repository, lineage, authority, provider, or model call and does not repair representation. |
| `DECISION_RECOMMENDATION_PROPOSAL_SCHEMA_VERSION` | `"DECISION_RECOMMENDATION_PROPOSAL_V1"` | Fixed schema-version constant for the Phase 6D recommendation-proposal contract. |
| `DecisionRecommendation` | `optionItemId`, `rationale` | One admitted option-only recommendation representation. Rationale is trimmed, nonempty, and identity-bearing; no criterion, disposition, score, rank, priority, winner, or rejection field exists. |
| `DecisionRecommendationProposalProvenance` | `origin: "MODEL_PROPOSAL"`, `proposalRef` | Declared proposal provenance only; it does not identify or authenticate the recommendation generator, a model, or a provider. |
| `DecisionRecommendationGenerationInput` | `assessmentProposal` | Exact one-field detached predecessor input supplied to the generator. |
| `DecisionRecommendationGenerator` | `recommend(input): Promise<readonly DecisionRecommendation[]>` | Generic bound semantic recommendation capability, not model identity, provider identity, or authority. |
| `DecisionRecommendationProposal` | Exact canonical six-field stored artifact | A detached `DECISION_RECOMMENDATION_PROPOSAL` / `DECISION_RECOMMENDATION_PROPOSAL_V1` artifact with deterministic `DRECP_`; it is not decision, action, outcome, truth, or recommendation correctness. |
| `BoundDecisionRecommendationProposer` | `propose(assessmentProposal, proposedBy): Promise<DecisionRecommendationProposal>` | Bound operation that constructs canonical recommendation proposal state. |
| `createBoundDecisionRecommendationProposer(generator)` | `DecisionRecommendationGenerator -> BoundDecisionRecommendationProposer` | Captures exactly one own enumerable data-method `recommend` capability at construction. |
| `assertDecisionRecommendationProposal(value)` | `unknown -> asserts value is DecisionRecommendationProposal` | Self-contained exact stored assertion with no generator, evaluator, reader, repository, authority, lineage, provider, or model call. |
| `DECISION_PROPOSAL_COHERENCE_VALIDATION_SCHEMA_VERSION` | `"DECISION_PROPOSAL_COHERENCE_VALIDATION_V1"` | Fixed schema-version constant for deterministic Phase 6E proposal-coherence validation. |
| `DecisionRecommendationCoherenceTrace` | `optionItemId`, `representedCriterionItemIds` | Exact two-field trace from one recommendation to its already-represented assessment criterion IDs; it carries no rationale, disposition, support, correctness, completeness, or status. |
| `DecisionProposalCoherenceValidation` | Exact canonical five-field stored artifact | Detached `DECISION_PROPOSAL_COHERENCE_VALIDATION` / `DECISION_PROPOSAL_COHERENCE_VALIDATION_V1` trace-validation artifact with deterministic `DPCV_`; it is not truth, recommendation correctness, Decision Need, or human decision. |
| `validateDecisionProposalCoherence(recommendationProposal)` | `DecisionRecommendationProposal -> DecisionProposalCoherenceValidation` | Sealed-asserts one complete predecessor, deterministically reconstructs canonical represented criterion traces, and has no dependency capability. |
| `assertDecisionProposalCoherenceValidation(value)` | `unknown -> asserts value is DecisionProposalCoherenceValidation` | Self-contained exact stored assertion; it reads no generator, evaluator, reader, repository, persister, lineage, authority, provider, or model dependency and does not repair state. |
| `HUMAN_DECISION_DECLARATION_SCHEMA_VERSION` | `"HUMAN_DECISION_DECLARATION_V1"` | Fixed schema-version constant for the Phase 7A human positive-option-selection declaration. |
| `HumanDecisionActor` | `origin: "HUMAN_INPUT"`, `actorId` | Declared human ownership only; it is not authenticated identity, authorization, signature, permission, or truth. |
| `HumanDecisionDeclarationInput` | `decidedBy`, `chosenOptionItemIds`, `rationale` | Exact three-field constructor input; choices are positive selections only and rationale is `null` or a nonempty string. |
| `HumanDecisionDeclaration` | Exact canonical seven-field stored artifact | Detached `HUMAN_DECISION_DECLARATION` / `HUMAN_DECISION_DECLARATION_V1` artifact with deterministic `DHDEC_`; it is not recommendation, truth, action, outcome, or persistence authority. |
| `createHumanDecisionDeclaration(validation, input)` | `DecisionProposalCoherenceValidation × HumanDecisionDeclarationInput -> HumanDecisionDeclaration` | Sealed-asserts one complete DPCV, admits actual embedded revision `OPTION` items, canonicalizes choices/rationale/actor representation, and returns detached state. |
| `assertHumanDecisionDeclaration(value)` | `unknown -> asserts value is HumanDecisionDeclaration` | Self-contained exact stored assertion with no model, provider, evaluator, generator, reader, repository, persister, lineage, authority, or authentication call; it does not repair state. |
| `DECISION_ACTION_INTENT_SCHEMA_VERSION` | `"DECISION_ACTION_INTENT_V1"` | Fixed schema-version constant for the Phase 8A1 decision-bound action-intent artifact. |
| `ActionIntentActor` | `origin: "HUMAN_INPUT"`, `actorId` | Declared intent ownership only; it is not authenticated identity, authorization, signature, permission, or truth. |
| `DecisionActionIntentInput` | `declaredBy`, `operationalizedOptionItemIds`, `operationDescription`, `rationale` | Exact four-field constructor input. The option inventory is a nonempty subset of the sealed human decision's choices. |
| `DecisionActionIntent` | Exact canonical eight-field stored artifact | Detached `DECISION_ACTION_INTENT` / `DECISION_ACTION_INTENT_V1` artifact with deterministic `DAINT_`; it is not commitment, action, execution, outcome, or persistence authority. |
| `createDecisionActionIntent(declaration, input)` | `HumanDecisionDeclaration × DecisionActionIntentInput -> DecisionActionIntent` | Sealed-asserts one complete human declaration, canonicalizes admitted local state, and returns detached intended-operation state. |
| `assertDecisionActionIntent(value)` | `unknown -> asserts value is DecisionActionIntent` | Self-contained exact stored assertion with no model, provider, evaluator, generator, reader, repository, persister, lineage, resolver, executor, clock, or external call; it does not repair state. |
| `HUMAN_COMMITMENT_SCHEMA_VERSION` | `"HUMAN_COMMITMENT_V1"` | Fixed schema-version constant for the Phase 8A2 human-commitment artifact. |
| `HumanCommitmentActor` | `origin: "HUMAN_INPUT"`, `actorId` | Declared human commitment actor only; it is not authenticated identity, authorization, signature, permission, organizational role, or legal accountability. |
| `HumanCommitmentInput` | `committedBy`, `rationale` | Exact two-field constructor input. |
| `HumanCommitment` | Exact canonical six-field stored artifact | Detached `HUMAN_COMMITMENT` / `HUMAN_COMMITMENT_V1` artifact with deterministic `DHCOM_`; it is not assignment, action, execution, outcome, truth, or persistence authority. |
| `createHumanCommitment(actionIntent, input)` | `DecisionActionIntent × HumanCommitmentInput -> HumanCommitment` | Sealed-asserts one complete Action Intent, canonicalizes local actor/rationale state, and returns detached declared-commitment state. |
| `assertHumanCommitment(value)` | `unknown -> asserts value is HumanCommitment` | Self-contained exact stored assertion with no model, provider, evaluator, generator, reader, repository, persister, lineage, resolver, executor, clock, or external call; it does not repair state. |
| `ACTION_OCCURRENCE_CLAIM_SCHEMA_VERSION` | `"ACTION_OCCURRENCE_CLAIM_V1"` | Fixed schema-version constant for the standalone Phase 8B occurrence-claim artifact. |
| `ActionOccurrenceClaimSource` | `HUMAN_INPUT` or `AUTHORITATIVE_STATE` | Exact closed source union; it is not the Decision Context provenance union. |
| `ActionOccurrenceClaimInput` | `source`, `operationDescription` | Exact two-field constructor input. |
| `ActionOccurrenceClaim` | Exact canonical five-field stored artifact | Detached `ACTION_OCCURRENCE_CLAIM` / `ACTION_OCCURRENCE_CLAIM_V1` artifact with deterministic `DAOC_`; it is not Action fact, observation, execution proof, outcome, or persistence authority. |
| `createActionOccurrenceClaim(input)` | `ActionOccurrenceClaimInput -> ActionOccurrenceClaim` | Captures local source and opaque text only, canonicalizes only permitted fields, and returns detached represented-claim state. |
| `assertActionOccurrenceClaim(value)` | `unknown -> asserts value is ActionOccurrenceClaim` | Self-contained exact stored assertion with no reader, resolver, validator, evaluator, repository, persistence, payload, or external call; it does not repair state. |
| `STATE_CHANGE_CLAIM_SCHEMA_VERSION` | `"STATE_CHANGE_CLAIM_V1"` | Fixed schema-version constant for the standalone Phase 8C1 state-change-claim artifact. |
| `StateChangeClaimSource` | `HUMAN_INPUT` or `AUTHORITATIVE_STATE` | Exact closed source union with its own State Change Claim semantic role; it is not an alias of the occurrence-claim source type. |
| `StateChangeClaimInput` | `source`, `stateChangeDescription` | Exact two-field constructor input. |
| `StateChangeClaim` | Exact canonical five-field stored artifact | Detached `STATE_CHANGE_CLAIM` / `STATE_CHANGE_CLAIM_V1` artifact with deterministic `DSCC_`; it is not state-change fact, observation, verified change, effect, outcome, consequence, causal claim, or persistence authority. |
| `createStateChangeClaim(input)` | `StateChangeClaimInput -> StateChangeClaim` | Captures local source and opaque description only, canonicalizes only permitted fields, and returns detached represented-claim state. |
| `assertStateChangeClaim(value)` | `unknown -> asserts value is StateChangeClaim` | Self-contained exact stored assertion with no reader, resolver, validator, evaluator, repository, persistence, payload, or external call; it does not repair state. |
| `ACTION_STATE_CHANGE_ASSOCIATION_PROPOSAL_SCHEMA_VERSION` | `"ACTION_STATE_CHANGE_ASSOCIATION_PROPOSAL_V1"` | Fixed schema-version constant for the explicit Phase 8C2 association-proposal artifact. |
| `ActionStateChangeAssociationProvenance` | `HUMAN_INPUT`, `MODEL_PROPOSAL`, or `AUTHORITATIVE_STATE` | Exact closed provenance union with its own association-proposal semantic role. |
| `ActionStateChangeAssociationProposalInput` | `actionOccurrenceClaim`, `stateChangeClaim`, `provenance` | Exact three-field constructor input. |
| `ActionStateChangeAssociationProposal` | Exact canonical six-field stored artifact | Detached `ACTION_STATE_CHANGE_ASSOCIATION_PROPOSAL` / `ACTION_STATE_CHANGE_ASSOCIATION_PROPOSAL_V1` artifact with deterministic `DASCA_`; it is not relation truth, outcome, effect, consequence, attribution, causation, or persistence authority. |
| `createActionStateChangeAssociationProposal(input)` | `ActionStateChangeAssociationProposalInput -> ActionStateChangeAssociationProposal` | Captures and sealed-validates both endpoints and explicit provenance, canonicalizes only permitted local provenance fields, and returns detached proposal state. |
| `assertActionStateChangeAssociationProposal(value)` | `unknown -> asserts value is ActionStateChangeAssociationProposal` | Self-contained exact stored assertion of both sealed endpoints and provenance with no external operation; it does not repair state. |
| `OUTCOME_ATTRIBUTION_PROPOSAL_SCHEMA_VERSION` | `"OUTCOME_ATTRIBUTION_PROPOSAL_V1"` | Fixed schema-version constant for the explicit Phase 8C3 outcome-attribution-proposal artifact. |
| `OutcomeAttributionProvenance` | `HUMAN_INPUT`, `MODEL_PROPOSAL`, or `AUTHORITATIVE_STATE` | Exact closed provenance union with its own outcome-attribution-proposal semantic role. |
| `OutcomeAttributionProposalInput` | `associationProposal`, `provenance` | Exact two-field constructor input. |
| `OutcomeAttributionProposal` | Exact canonical five-field stored artifact | Detached `OUTCOME_ATTRIBUTION_PROPOSAL` / `OUTCOME_ATTRIBUTION_PROPOSAL_V1` artifact with deterministic `DOATP_`; it is not outcome truth, relation truth, causation, or persistence authority. |
| `createOutcomeAttributionProposal(input)` | `OutcomeAttributionProposalInput -> OutcomeAttributionProposal` | Captures and sealed-validates the association predecessor and explicit provenance, canonicalizes only permitted local provenance fields, and returns detached proposal state. |
| `assertOutcomeAttributionProposal(value)` | `unknown -> asserts value is OutcomeAttributionProposal` | Self-contained exact stored assertion of the sealed association and provenance with no external operation; it does not repair state. |
| `DECISION_CONTEXT_OBSERVATION_PROPOSAL_SCHEMA_VERSION` | `"DECISION_CONTEXT_OBSERVATION_PROPOSAL_V1"` | Fixed schema-version constant for the explicit Phase 8D1 Decision Context observation-candidate proposal artifact. |
| `DecisionContextObservationProposalProvenance` | `HUMAN_INPUT`, `MODEL_PROPOSAL`, or `AUTHORITATIVE_STATE` | Exact closed provenance union with its own observation-candidate semantic role. |
| `DecisionContextObservationProposalInput` | `outcomeAttributionProposal`, `statement`, `provenance` | Exact three-field constructor input. |
| `DecisionContextObservationProposal` | Exact canonical six-field stored artifact | Detached `DECISION_CONTEXT_OBSERVATION_PROPOSAL` / `DECISION_CONTEXT_OBSERVATION_PROPOSAL_V1` artifact with deterministic `DCOP_`; it is not a Context Item, Context, revision, admission, observation truth, or persistence authority. |
| `createDecisionContextObservationProposal(input)` | `DecisionContextObservationProposalInput -> DecisionContextObservationProposal` | Captures and sealed-validates the outcome-attribution predecessor, opaque statement, and explicit provenance, and returns detached candidate state. |
| `assertDecisionContextObservationProposal(value)` | `unknown -> asserts value is DecisionContextObservationProposal` | Self-contained exact stored assertion of predecessor, statement, and provenance with no external operation; it does not repair state. |

## Reference and reader behavior

The reader validates an exact own-property reference shape. It rejects `null`, primitives, arrays, missing fields, whitespace-only fields, extra enumerable/non-enumerable/symbol fields, and accessor properties with `ERR_DECISION_AUTHORITY_REFERENCE_INVALID`. It selects a resolver by the tuple:

```ts
[producerId, authorityContractId]
```

serialized by `JSON.stringify`. The reader captures resolver methods with their receiver at construction. A duplicate or malformed resolver binding fails `ERR_DECISION_AUTHORITY_RESOLVER_CONFLICT`; an unknown binding fails `ERR_DECISION_AUTHORITY_RESOLVER_NOT_FOUND`.

## Decision Context identity

The context identity implementation uses `createHash("sha256")` over `JSON.stringify(...)`, takes the first 24 hexadecimal characters, uppercases them, and adds the documented prefix.

### Reference key

For canonical ordering and duplicate detection, the reference key is exactly:

```ts
JSON.stringify([
  reference.producerId,
  reference.authorityContractId,
  reference.artifactId,
  reference.locator
])
```

References are sorted by this key using deterministic code-point string comparison.

### `DCI_` item identity

The constructor trims outer whitespace from `statement`, then derives:

```ts
DCI_ + SHA256(JSON.stringify([
  role,
  normalizedStatement,
  canonicalProvenance
])).slice(0, 24).toUpperCase()
```

`canonicalProvenance` is exactly one of:

```ts
["AUTHORITATIVE_STATE", [producerId, authorityContractId, artifactId, locator]]
["HUMAN_INPUT", actorId]
["MODEL_PROPOSAL", proposalRef]
["DETERMINISTIC_DERIVATION", ruleId]
```

Items are sorted by `itemId` with deterministic code-point comparison. Their identity does not depend on array position.

### `DCTX_` context identity

After references and item identities have been canonicalized, the constructor derives:

```ts
DCTX_ + SHA256(JSON.stringify([
  "DECISION_CONTEXT_DRAFT",
  schemaVersion,
  sourceStateReferences.map(sourceStateReferenceKey),
  decisionQuestionId,
  itemIds
])).slice(0, 24).toUpperCase()
```

`schemaVersion` is `"DECISION_CONTEXT_DRAFT_V1"`. `decisionQuestionId` is the one canonical `DECISION_QUESTION` item ID; `itemIds` are in canonical item order. Thus input ordering differences do not create alternate canonical payloads or IDs.

Identity is local structural identity. It does not itself prove semantic truth, authority, reference reachability, completeness, recommendation quality, or human adoption. The current Decision Core has no context persistence route, so `DCI_` and `DCTX_` do not identify independently persisted Decision Core records.

## Structural contract and failure semantics

`createDecisionContextDraft(...)` creates `artifactKind`, schema version, item IDs, question ID, context ID, and `NOT_RUN`; callers do not supply those fields. It returns `structuredClone(draft)`.

`assertDecisionContextDraft(...)` checks the exact top-level shape, source-reference and item shapes, canonical order, uniqueness, recomputed IDs, exactly one question, and structural membership of `AUTHORITATIVE_STATE` provenance references. Relevant current errors are:

| Condition | Error |
| --- | --- |
| Invalid draft/top-level shape or status | `ERR_DECISION_CONTEXT_INVALID` |
| Invalid reference | `ERR_DECISION_CONTEXT_REFERENCE_INVALID` |
| Duplicate or noncanonical references | `ERR_DECISION_CONTEXT_DUPLICATE_SOURCE_STATE_REFERENCE`, `ERR_DECISION_CONTEXT_SOURCE_STATE_REFERENCES_NOT_CANONICAL` |
| Invalid/duplicate/noncanonical item | `ERR_DECISION_CONTEXT_ITEM_INVALID`, `ERR_DECISION_CONTEXT_DUPLICATE_ITEM`, `ERR_DECISION_CONTEXT_ITEMS_NOT_CANONICAL` |
| Item ID mismatch | `ERR_DECISION_CONTEXT_ITEM_ID_MISMATCH` |
| Zero/multiple question or question-ID mismatch | `ERR_DECISION_CONTEXT_DECISION_QUESTION_COUNT`, `ERR_DECISION_CONTEXT_DECISION_QUESTION_ID_MISMATCH` |
| Missing listed reference for `AUTHORITATIVE_STATE` provenance | `ERR_DECISION_CONTEXT_AUTHORITATIVE_REFERENCE_MISSING` |
| Context ID mismatch | `ERR_DECISION_CONTEXT_ID_MISMATCH` |

None of these structural outcomes resolve a producer, inspect payload semantics, or establish semantic support.

## Semantic Evidence Binding identity and operation

`createBoundSemanticEvidenceBinder(reader, evaluator)` captures `reader.resolve.bind(reader)` and `evaluator.evaluate.bind(evaluator)` at construction. `bind(context)` accepts only a `DecisionContextDraft`; it accepts no caller-supplied payload, resolution, reader, resolver, repository, or evaluator.

The binder captures and structurally asserts the complete context. In Stage A it resolves every canonical source-state reference, requires every returned authority resolution envelope/reference to be well-formed and to equal the requested reference exactly, and creates a semantic payload copy. The generic Phase-5A reader does **not** clone arbitrary resolver payloads. Phase 5C2 uses `structuredClone` itself, then rejects a clone containing `SharedArrayBuffer`, a view backed by `SharedArrayBuffer`, or nested shared memory in arrays, objects, `Map`, or `Set`; cyclic/repeated graphs are inspected with cycle protection. A payload that cannot be cloned or safely inspected fails `ERR_DECISION_EVIDENCE_BINDING_PAYLOAD_NOT_DETACHABLE` before evaluator invocation.

Only after every Stage-A reference has resolved, matched, and produced an isolated semantic payload does Stage B invoke the bound evaluator once for each prepared state. The evaluator may propose zero or more item/reference relationships. The binder validates exact proposal shape, requires an existing item ID and the same listed state reference, rejects duplicate item/reference targets, then sorts proposals by `bindingId` using deterministic code-point comparison. The returned array is a detached clone. It remains semantic proposal data, not an authority certificate or validated context artifact.

### `EBIND_` binding identity

The implementation uses `createHash("sha256")` over `JSON.stringify(...)`, takes the first 24 hexadecimal characters, uppercases them, and prefixes `EBIND_`:

```ts
EBIND_ + SHA256(JSON.stringify([
  "SEMANTIC_EVIDENCE_BINDING_V1",
  contextId,
  itemId,
  [producerId, authorityContractId, artifactId, locator],
  disposition
])).slice(0, 24).toUpperCase()
```

`rationale` is trimmed for stored canonical proposal content but is not identity-bearing. Differently worded rationales for the same context, item, state reference, and disposition retain the same `EBIND_`; a different disposition changes it. Provider/model identity, request IDs, timestamps, randomness, and execution order do not participate.

An `EBIND_` identity is local deterministic proposal identity. It does not prove semantic truth, producer authority, completeness, human adoption, recommendation quality, or a structural contradiction.

### Binding failures

| Condition | Error / behavior |
| --- | --- |
| Invalid, hostile, or tampered supplied context | `ERR_DECISION_EVIDENCE_BINDING_CONTEXT_INVALID` |
| Invalid bound reader/evaluator dependency | `ERR_DECISION_EVIDENCE_BINDING_READER_INVALID`, `ERR_DECISION_EVIDENCE_BINDING_EVALUATOR_INVALID` |
| Malformed returned authority resolution envelope/reference, or returned reference differs from request | `ERR_DECISION_EVIDENCE_BINDING_AUTHORITY_REFERENCE_MISMATCH` |
| Payload cannot be detached or contains shared memory | `ERR_DECISION_EVIDENCE_BINDING_PAYLOAD_NOT_DETACHABLE` |
| Invalid evaluator output shape, disposition, or rationale | `ERR_DECISION_EVIDENCE_BINDING_EVALUATION_INVALID` |
| Unknown item | `ERR_DECISION_EVIDENCE_BINDING_ITEM_NOT_FOUND` |
| Malformed, foreign, or mismatched evaluator state reference | `ERR_DECISION_EVIDENCE_BINDING_STATE_REFERENCE_INVALID` |
| More than one proposal for an item/reference target | `ERR_DECISION_EVIDENCE_BINDING_DUPLICATE` |

Phase-5A resolver and producer errors from operation-time resolution are not reclassified by the binder and may propagate.

`AUTHORITATIVE_STATE` provenance does not imply `SUPPORTED`; provenance records origin, whereas a binding records the evaluator's proposed semantic relationship. `HUMAN_INPUT` may be `SUPPORTED`, and `MODEL_PROPOSAL` may be `CONTRADICTED`. No binding is not `NOT_SUPPORTED`: zero proposals are valid and establish neither support, completeness, incompleteness, nor a gap. `CONTRADICTED` is one evaluator-proposed item/state relationship, not the later Phase-5C3 `Contradiction` concept.

## Explicit Structural Expectation contract

Phase 5C3A adds a structural comparison target, not a structural finding. A `StructuralExpectation` is bound to a structurally valid `DecisionContextDraft` under the sealed Phase-5B contract by `contextId`; it embeds neither that draft nor a state payload, binding proposal inventory, reader, resolver, repository, authority token, validated context, or finding. It makes later comparison criteria explicit without performing that comparison.

### Exact kinds and variant semantics

`EVIDENCE_BINDING` has the exact common fields plus `subjectItemId` and `acceptedDispositions`. `subjectItemId` must identify an item in the supplied context. Its non-empty accepted-disposition set contains only sealed Phase-5C2 disposition values and is an explicit future comparison criterion; Phase 5C3A does not inspect `SemanticEvidenceBindingProposal[]`, determine that any binding exists, or determine satisfaction.

`CONTEXT_ROLE` has the exact common fields plus `role` and `minimumCount`. `role` is one sealed `DecisionContextItemRole`; `minimumCount` is a positive safe integer. The artifact says that a later comparison may require at least that count. Phase 5C3A does not count current context items, so an expectation is neither role satisfaction nor a Gap.

`DEPENDENCY` has the exact common fields plus `dependentItemId` and `prerequisiteItemId`. Both IDs must identify distinct items in the supplied context. Its direction is identity-bearing: A depends on B is different from B depends on A. It is an expectation only; Phase 5C3A does not test whether a dependency exists and does not create a Dependency finding.

All variants carry the sealed `DecisionContextItemProvenance` union unchanged. `AUTHORITATIVE_STATE` provenance requires its exact four-field reference to be structurally present in `DecisionContextDraft.sourceStateReferences`; this is membership only. It does not resolve authority, inspect a payload, establish semantic truth, or satisfy an expectation. `HUMAN_INPUT` expectation provenance is not evidence truth, and `MODEL_PROPOSAL` expectation provenance remains proposal state rather than becoming a human requirement.

### `DEXP_` expectation identity

The implementation serializes this exact five-element tuple with `JSON.stringify(...)`, hashes it with SHA-256, takes the first 24 hexadecimal characters, uppercases them, and prefixes that suffix with `DEXP_`:

The exact formula is `DEXP_ + SHA256(JSON.stringify(["STRUCTURAL_EXPECTATION_V1", contextId, kind, canonicalVariantBody, canonicalProvenance])).slice(0, 24).toUpperCase()`.

1. `"STRUCTURAL_EXPECTATION_V1"`
2. `contextId`
3. `kind`
4. `canonicalVariantBody`
5. `canonicalProvenance`

The canonical variant body is `[subjectItemId, canonicalAcceptedDispositions]` for `EVIDENCE_BINDING`, `[role, minimumCount]` for `CONTEXT_ROLE`, and `[dependentItemId, prerequisiteItemId]` for `DEPENDENCY`.

`canonicalProvenance` is exactly `["AUTHORITATIVE_STATE", [producerId, authorityContractId, artifactId, locator]]`, `["HUMAN_INPUT", actorId]`, `["MODEL_PROPOSAL", proposalRef]`, or `["DETERMINISTIC_DERIVATION", ruleId]`.

The identity excludes timestamps, randomness, execution order, rationale, and provider/model metadata beyond explicit provenance. It is local deterministic expectation identity; it does not prove fact, authority, current reachability, semantic support, satisfaction, a finding, a Gap, decision need, priority, recommendation, or human adoption.

### Canonical input and canonical stored artifacts

The `EVIDENCE_BINDING` constructor accepts a valid selected disposition set in any order, rejects duplicates, and stores selected values in the sealed Phase-5C2 disposition order.

That exact stored order is `SUPPORTED`, then `PARTIALLY_SUPPORTED`, then `NOT_SUPPORTED`, then `CONTRADICTED`. Thus a selected set containing NOT_SUPPORTED and SUPPORTED is stored with SUPPORTED first and NOT_SUPPORTED second.

Construction may canonicalize valid input. Assertion must verify that the submitted stored artifact is already canonical: canonical equivalence is not canonical stored-artifact representation.

`assertStructuralExpectation(...)` captures the submitted artifact without mutating it, validates its dispositions, derives expected canonical order, and requires its stored order to already equal that order.

A reordered stored `acceptedDispositions` array with an unchanged ID is a malformed/non-canonical representation and fails `ERR_DECISION_STRUCTURAL_EXPECTATION_INVALID`; assertion neither repairs nor reorders it.

### Structural expectation failures and defensive capture

Construction and assertion use defensive descriptor-based capture. Applicable malformed or hostile values such as missing or extra keys, symbol keys, accessors, sparse arrays, custom array state, invalid descriptors, reflection failures, and cycles where finite contract data is required are rejected. The constructor returns a detached clone: changing caller-owned nested input afterwards does not mutate the returned artifact. Assertion independently rejects hostile stored representations; no deep-freeze or runtime immutability claim is made.

| Condition | Error |
| --- | --- |
| Malformed or tampered supplied `DecisionContextDraft` | `ERR_DECISION_STRUCTURAL_EXPECTATION_CONTEXT_INVALID` |
| General malformed constructor input, invalid kind or role, invalid count, self-dependency, or malformed non-authoritative provenance | `ERR_DECISION_STRUCTURAL_EXPECTATION_INPUT_INVALID` |
| Referenced item absent from the context | `ERR_DECISION_STRUCTURAL_EXPECTATION_ITEM_NOT_FOUND` |
| Malformed or structurally unlisted `AUTHORITATIVE_STATE` provenance reference | `ERR_DECISION_STRUCTURAL_EXPECTATION_REFERENCE_INVALID` |
| Empty or unknown accepted disposition | `ERR_DECISION_STRUCTURAL_EXPECTATION_DISPOSITION_INVALID` |
| Duplicate accepted disposition | `ERR_DECISION_STRUCTURAL_EXPECTATION_DUPLICATE_DISPOSITION` |
| Stored artifact with otherwise valid canonical structural content but wrong deterministic ID | `ERR_DECISION_STRUCTURAL_EXPECTATION_ID_MISMATCH` |
| Hostile/accessor/symbol representation, unexpected or missing top-level artifact fields, invalid artifact kind/schema version/context ID/kind/expectation-ID shape, unexpected stored keys, or non-canonical stored disposition order | `ERR_DECISION_STRUCTURAL_EXPECTATION_INVALID` |

The `INVALID` code is a stored-representation error, not a blanket mapping for every invalid field in a stored artifact. After safe representation capture, assertion reconstructs variant input through the existing structural input path. Meaningful invalid variant content can still produce `INPUT_INVALID`, `ITEM_NOT_FOUND`, `REFERENCE_INVALID`, `DISPOSITION_INVALID`, or `DUPLICATE_DISPOSITION` in the structural-expectation error namespace. A wrong deterministic ID remains `ERR_DECISION_STRUCTURAL_EXPECTATION_ID_MISMATCH`.

The full specific codes are `ERR_DECISION_STRUCTURAL_EXPECTATION_INPUT_INVALID`, `ERR_DECISION_STRUCTURAL_EXPECTATION_ITEM_NOT_FOUND`, `ERR_DECISION_STRUCTURAL_EXPECTATION_REFERENCE_INVALID`, `ERR_DECISION_STRUCTURAL_EXPECTATION_DISPOSITION_INVALID`, and `ERR_DECISION_STRUCTURAL_EXPECTATION_DUPLICATE_DISPOSITION`.

Phase 5C3A performs no authority resolution, payload inspection, semantic evaluation, semantic binding execution, satisfaction evaluation, or finding derivation.

## Explicit Structural Relation Proposal contract

Phase 5C3B adds `StructuralRelationProposal`: one caller-supplied `DecisionContextItem` × `DecisionContextItem` relation proposal bound to one structurally valid `DecisionContextDraft` by `contextId`. It embeds neither the context nor item objects, a payload, `SemanticEvidenceBindingProposal`, `StructuralExpectation`, reader, resolver, repository, authority token, validated context, or finding. It represents relation proposal content only: relation proposal is not relation truth or a finding.

The schema version is exactly `"STRUCTURAL_RELATION_PROPOSAL_V1"`; the closed kind set is exactly `CONTRADICTION` and `DEPENDENCY`. There is no batch, persistence, detector, evaluator, analyzer, inference, graph-traversal, or relation-validation operation.

### Exact kinds and variant semantics

`CONTRADICTION` has the common fields plus `itemIds: [string, string]`. Both IDs must identify distinct items in the supplied context. It is a proposed symmetric structural incompatibility relation, not a formal logical contradiction and not a Phase-5C2 `CONTRADICTED` semantic binding. Construction accepts either endpoint order and stores the two IDs in deterministic code-point string order.

`DEPENDENCY` has the common fields plus `dependentItemId` and `prerequisiteItemId`. Both IDs must identify distinct items in the supplied context. Direction is preserved and identity-bearing: A depends on B differs from B depends on A. Separate A -> B and B -> A proposals are structurally representable; Phase 5C3B makes no graph-level cycle judgment or interpretation.

All variants reuse the sealed `DecisionContextItemProvenance` union unchanged. Its origin is identity-bearing but never proves relation truth. `AUTHORITATIVE_STATE` provenance requires only that its exact four-field reference is structurally present in `DecisionContextDraft.sourceStateReferences`; this does not resolve current authority, inspect payloads, execute semantic evaluation, or validate the relation.

### `DREL_` relation-proposal identity

The implementation serializes this exact five-element tuple with `JSON.stringify(...)`, hashes it with SHA-256, takes the first 24 hexadecimal characters, uppercases them, and prefixes that suffix with `DREL_`:

```ts
DREL_ + SHA256(JSON.stringify([
  "STRUCTURAL_RELATION_PROPOSAL_V1",
  contextId,
  kind,
  canonicalRelationBody,
  canonicalProvenance
])).slice(0, 24).toUpperCase()
```

`canonicalProvenance` is exactly one of:

```ts
["AUTHORITATIVE_STATE", [producerId, authorityContractId, artifactId, locator]]
["HUMAN_INPUT", actorId]
["MODEL_PROPOSAL", proposalRef]
["DETERMINISTIC_DERIVATION", ruleId]
```

For `CONTRADICTION`, `canonicalRelationBody` is `[canonicalFirstItemId, canonicalSecondItemId]` in deterministic code-point order. For `DEPENDENCY`, it is `[dependentItemId, prerequisiteItemId]`; direction is not sorted or normalized away.

`DREL_` is local deterministic proposal identity only. It does not establish relation truth, authority, semantic correctness, finding status, decision relevance, priority, recommendation, or human adoption. Timestamp, randomness, execution order, rationale, confidence, score, and provider/model metadata beyond explicit provenance are excluded.

### Constructor canonicalization, stored canonicality, and failures

Construction may canonicalize valid `CONTRADICTION` input. Thus A/B and B/A constructor input produce one canonical proposal and the same `DREL_`. Assertion is stricter: it must verify a submitted stored artifact is already canonical. It never silently repairs or reorders stored endpoints. A stored contradiction with reversed endpoints is an invalid representation even when its retained ID names the canonical equivalent.

Assertion order is exact: capture stored artifact, validate common header, validate the exact kind-specific stored key set, validate variant content, verify stored contradiction canonicality where applicable, then recompute `DREL_` identity. A dependency direction change is not canonicalized; retaining the old ID then fails identity verification.

The constructor and assertion defensively capture data through descriptors. They reject hostile or malformed values such as accessors, symbol keys, missing or unexpected keys, sparse/custom arrays, invalid descriptors, and reflection failures. The constructor returns a detached artifact; this is not a deep-freeze guarantee.

| Condition | Error |
| --- | --- |
| Malformed or tampered supplied `DecisionContextDraft` | `ERR_DECISION_STRUCTURAL_RELATION_CONTEXT_INVALID` |
| General malformed constructor input, invalid kind, self relation, or malformed non-authoritative provenance | `ERR_DECISION_STRUCTURAL_RELATION_INPUT_INVALID` |
| Relation endpoint absent from the context | `ERR_DECISION_STRUCTURAL_RELATION_ITEM_NOT_FOUND` |
| Malformed or structurally unlisted `AUTHORITATIVE_STATE` provenance reference | `ERR_DECISION_STRUCTURAL_RELATION_REFERENCE_INVALID` |
| Otherwise valid canonical stored proposal with wrong deterministic DREL | `ERR_DECISION_STRUCTURAL_RELATION_ID_MISMATCH` |
| Hostile/malformed stored representation, invalid header, missing/unexpected top-level stored fields, or noncanonical stored contradiction endpoint order | `ERR_DECISION_STRUCTURAL_RELATION_INVALID` |

`INVALID` is a stored-representation error, not a blanket mapping for all stored content. After an exact stored representation shape has been captured, meaningful variant-content errors may preserve `ERR_DECISION_STRUCTURAL_RELATION_INPUT_INVALID`, `ERR_DECISION_STRUCTURAL_RELATION_ITEM_NOT_FOUND`, or `ERR_DECISION_STRUCTURAL_RELATION_REFERENCE_INVALID`.

## Structural Gap Reconstruction contract

Phase 5C3C adds the adjacent `lib/decision-core/structural-gaps/` module. It does not add Gap APIs to the sealed `structural-findings` module, which continues to expose only `StructuralExpectation` and `StructuralRelationProposal`. A `StructuralGap` is a deterministic derived artifact only when one explicit expectation is unsatisfied within one explicit represented observation basis:

```text
STRUCTURAL GAP = EXPLICIT EXPECTATION + UNSATISFIED EXPLICIT REPRESENTED BASIS
```

It is not real-world absence, global incompleteness, semantic truth, Decision Need, priority, consequence, recommendation, or human decision. `reconstructStructuralGap(context, expectation, basis)` returns one canonical gap when the supplied expectation is unsatisfied within the supplied basis; otherwise it returns `null`. `null` establishes only that this expectation produces no gap under this basis.

### Variant comparison semantics

For `CONTEXT_ROLE`, the context itself supplies observed items. Matching-role item IDs are sorted canonically. The expectation is satisfied when `observedItemIds.length >= minimumCount`; otherwise the gap stores `role`, `minimumCount`, `observedCount`, and `observedItemIds`, with `observedCount` exactly equal to the array length.

For `EVIDENCE_BINDING`, every supplied `SemanticEvidenceBindingProposal` is defensively validated before use: exact fields, same `contextId`, a context-listed item and source reference, one sealed disposition, a non-empty canonical trimmed rationale, and the exact sealed `EBIND_` identity. The basis rejects duplicate binding IDs and duplicate item/reference targets, including different dispositions with distinct IDs. Only bindings for `subjectItemId` are relevant. At least one accepted disposition returns `null`; otherwise the gap records canonical `observedBindingIds`. Unrelated bindings do not enter the gap body or change `DGAP_`.

For `DEPENDENCY`, every supplied `StructuralRelationProposal` must pass the sealed Phase-5C3B assertion. Only an exact directional `DEPENDENCY` proposal satisfies the expectation. A reverse dependency remains relevant represented observation data and is recorded in canonical `observedRelationProposalIds`, but does not satisfy. `CONTRADICTION` proposals neither satisfy nor enter a dependency-gap observation body. No graph traversal or cycle interpretation occurs.

### `DGAP_` identity and basis relativity

```ts
DGAP_ + SHA256(JSON.stringify([
  "STRUCTURAL_GAP_V1",
  contextId,
  expectationId,
  kind,
  canonicalGapBody
])).slice(0, 24).toUpperCase()
```

The canonical bodies are `[subjectItemId, acceptedDispositions, observedBindingIds]` for `EVIDENCE_BINDING`, `[role, minimumCount, observedItemIds]` for `CONTEXT_ROLE`, and `[dependentItemId, prerequisiteItemId, observedRelationProposalIds]` for `DEPENDENCY`. `observedCount` is derived from `observedItemIds.length` and is not separately identity-bearing. Expectation provenance is already carried by `expectationId`; a gap has no separate provenance.

Thus the same context and expectation with a different relevant non-satisfying represented basis can yield a different `DGAP_`; a satisfying basis yields `null`. Irrelevant observations omitted from the canonical body do not change the identity. This is represented-field derivation, not observation of external reality.

### Basis-bound stored assertion and failures

`assertStructuralGap(context, expectation, basis, gap)` first validates the context and expectation, reconstructs against the supplied basis, and preserves basis/artifact-specific errors. If reconstruction returns `null`, any supplied gap is invalid. It then validates the exact stored gap shape and canonical stored arrays, compares every non-ID field to the reconstructed gap, and finally checks the deterministic ID. It does not repair stored artifacts.

| Condition | Error |
| --- | --- |
| Malformed/tampered context | `ERR_DECISION_STRUCTURAL_GAP_CONTEXT_INVALID` |
| Expectation failing its sealed contract for the supplied context | `ERR_DECISION_STRUCTURAL_GAP_EXPECTATION_INVALID` |
| Malformed or mismatched basis wrapper/container, or duplicate observation artifact | `ERR_DECISION_STRUCTURAL_GAP_BASIS_INVALID` |
| Malformed, foreign, noncanonical, or identity-invalid EBIND | `ERR_DECISION_STRUCTURAL_GAP_BINDING_INVALID` |
| DREL failing sealed Phase-5C3B assertion | `ERR_DECISION_STRUCTURAL_GAP_RELATION_INVALID` |
| Otherwise valid canonical stored gap body with wrong `DGAP_` | `ERR_DECISION_STRUCTURAL_GAP_ID_MISMATCH` |
| Hostile, malformed, noncanonical, body-mismatching stored gap, or a supplied gap for a satisfying basis | `ERR_DECISION_STRUCTURAL_GAP_INVALID` |

No Phase-5C3C API invokes a reader, resolver, repository, semantic binder, semantic evaluator, or relation detector; it neither resolves authority nor inspects producer payloads. Structurally consuming EBIND/DREL proposals does not make either current authority or truth.

## Structural Consequence Propagation contract

Phase 5C3D adds the adjacent `lib/decision-core/structural-consequences/` module. It does not widen the sealed `structural-findings` or `structural-gaps` barrels. A `StructuralConsequence` is one deterministic, basis-relative derivation:

```text
validated item-anchored StructuralGap
+ one explicit ordered represented DEPENDENCY path
-> one StructuralConsequence
```

It states only that the source gap is structurally upstream of `affectedItemId` along that supplied path. It is not dependency-path truth, a real-world effect, prediction, outcome, another Gap, severity, probability, confidence, priority, Decision Need, recommendation, or human decision.

### Source gap and path semantics

`reconstructStructuralConsequence(context, expectation, gapBasis, gap, propagationBasis)` operation-locally revalidates the source gap under the sealed Phase-5C3C contract. Its observable preparation order is context capture, expectation capture and validation, gap-basis capture, sealed `assertStructuralGap`, canonical `reconstructStructuralGap`, then source-anchor derivation. A `DGAP_` hash alone is not a portable derivation certificate.

An `EVIDENCE_BINDING` gap anchors at `subjectItemId`; a `DEPENDENCY` gap anchors at `dependentItemId`. A `CONTEXT_ROLE` gap has no unique missing item and rejects with `ERR_DECISION_STRUCTURAL_CONSEQUENCE_SOURCE_NOT_ITEM_ANCHORED`.

The propagation basis is exactly `{ kind: "DEPENDENCY_PATH", relationProposals }`, one caller-supplied ordered sequence. Each relation must pass the sealed Phase-5C3B assertion and have kind `DEPENDENCY`. Because stored DREL direction is `dependentItemId depends on prerequisiteItemId`, propagation travels `prerequisiteItemId -> dependentItemId`.

The sequence must be non-empty; its first prerequisite must equal the source item; each previous dependent must equal the next prerequisite; relation-proposal IDs and visited items must not repeat. A valid `CONTRADICTION` proposal is the wrong path kind. These are local validation rules for the supplied path only: Phase 5C3D does not receive an unordered graph, discover paths, search reachability, rank or shorten paths, infer relations, or make a global acyclicity claim. `affectedItemId` is the final path dependent item and is not caller-selectable.

### `DCONS_` identity and stored assertion

```ts
DCONS_ + SHA256(JSON.stringify([
  "STRUCTURAL_CONSEQUENCE_V1",
  contextId,
  sourceGapId,
  dependencyPathRelationProposalIds
])).slice(0, 24).toUpperCase()
```

The relation-proposal ID array is ordered and never sorted. `sourceItemId` and `affectedItemId` are derived fields, not independent identity axes. Thus the same source gap and same explicit ordered path have one `DCONS_`; different paths have different identities even when they end at the same item.

`assertStructuralConsequence(context, expectation, gapBasis, gap, propagationBasis, consequence)` reconstructs the expected consequence from the exact supplied inputs before accepting a stored artifact. It requires every non-ID field and the stored ordered path-ID array to equal that derivation; it does not repair or reorder stored values. A self-consistent artifact for another path is invalid. Only an otherwise exact artifact with a wrong `consequenceId` fails `ERR_DECISION_STRUCTURAL_CONSEQUENCE_ID_MISMATCH`.

| Condition | Error |
| --- | --- |
| Malformed propagation-basis wrapper/container | `ERR_DECISION_STRUCTURAL_CONSEQUENCE_BASIS_INVALID` |
| Hostile, malformed, or sealed-assertion-invalid propagation DREL | `ERR_DECISION_STRUCTURAL_CONSEQUENCE_RELATION_INVALID` |
| Empty, discontinuous, non-DEPENDENCY, duplicate-ID, repeated-item, or wrongly anchored path | `ERR_DECISION_STRUCTURAL_CONSEQUENCE_PATH_INVALID` |
| Valid `CONTEXT_ROLE` source gap | `ERR_DECISION_STRUCTURAL_CONSEQUENCE_SOURCE_NOT_ITEM_ANCHORED` |
| Otherwise exact stored consequence with wrong `DCONS_` | `ERR_DECISION_STRUCTURAL_CONSEQUENCE_ID_MISMATCH` |
| Hostile, malformed, noncanonical, or body-mismatching stored consequence | `ERR_DECISION_STRUCTURAL_CONSEQUENCE_INVALID` |

Sealed Phase-5C3C errors propagate unchanged: an invalid expectation remains `ERR_DECISION_STRUCTURAL_GAP_EXPECTATION_INVALID`; with a valid expectation, malformed gap basis, EBIND, or DREL remains the corresponding Phase-5C3C gap error. A bad source gap is not a bad propagation basis, a bad DREL is not bad path topology, and a bad path is not a bad stored consequence.

Phase 5C3D invokes no authority reader, resolver, repository, payload inspection, semantic evaluator, semantic binder, relation detector, graph traversal, scoring, recommendation, persistence, or human-decision API. Structural consumption does not upgrade a DREL proposal into relation truth, a StructuralGap into real-world absence, or a StructuralConsequence into a real-world consequence.

## Decision Context Validation Assembly contract

Phase 5C4 adds the adjacent `lib/decision-core/validation-assembly/` module. It is not an extension of the sealed Phase-5C1 `validation` authority gate:

```text
5C1 AUTHORITY VALIDATION != 5C4 VALIDATION ASSEMBLY
```

It records derivational coherence, not truth:

```text
EXPLICIT DECISION CONTEXT
+ EXPLICIT STRUCTURAL DERIVATION INPUTS
+ OPERATION-LOCAL CONTRACT REVALIDATION
= DECISION CONTEXT VALIDATION ASSEMBLY
```

The artifact is exactly:

```ts
{
  artifactKind: "DECISION_CONTEXT_VALIDATION_ASSEMBLY";
  schemaVersion: "DECISION_CONTEXT_VALIDATION_ASSEMBLY_V1";
  assemblyId: string;
  contextId: string;
  expectationResults: StructuralExpectationValidationResult[];
  consequenceIds: string[];
}
```

It has no authority status, pass/fail state, score, confidence, priority, severity, probability, recommendation, Decision Need, human decision, timestamp, model/provider metadata, persistence metadata, or revision metadata. The sealed `DecisionContextDraft` remains `validationStatus: "NOT_RUN"`; Phase 5C4 creates neither a validated context nor a `ValidatedDecisionContext` type.

### Expectation inputs and canonical results

One `StructuralExpectationValidationInput` contains exactly `expectation`, `basis`, and `result`, where `result` is `StructuralGap | null`. The caller result is not trusted. Phase 5C4 reuses the sealed Phase-5C3C reconstruction and, for a supplied gap, its basis-bound assertion.

| Canonical result | Caller result | Assembly behavior |
| --- | --- | --- |
| `null` | `null` | Store `{ expectationId, basis, outcome: "NO_GAP" }`. |
| `StructuralGap` | Exact derivation-valid `StructuralGap` | Store `{ expectationId, basis, outcome: "GAP", gapId }`. |
| `null` | `StructuralGap` | `ERR_DECISION_VALIDATION_ASSEMBLY_RESULT_MISMATCH`. |
| `StructuralGap` | `null` | `ERR_DECISION_VALIDATION_ASSEMBLY_RESULT_MISMATCH`. |

`NO_GAP` means only that this expectation produced no StructuralGap under this explicit represented basis. It is not global completeness, truth, current authority, decision readiness, or Decision Need.

One expectation ID may occur only once in an assembly; a duplicate fails `ERR_DECISION_VALIDATION_ASSEMBLY_DUPLICATE_EXPECTATION`. Empty expectation and consequence input arrays are valid and yield an empty canonical assembly. That is not a completeness proof.

### Basis-descriptor commitments and consequence coherence

`StructuralValidationBasisDescriptor` is assembly-only. The assembly commits to the complete derivation basis, but descriptor representation is variant-specific:

```ts
{ kind: "CONTEXT_ROLE" }
{ kind: "EVIDENCE_BINDING", bindingIds: string[] }
{ kind: "DEPENDENCY", relationProposalIds: string[] }
```

Its public variants are `EvidenceBindingStructuralValidationBasisDescriptor`, `ContextRoleStructuralValidationBasisDescriptor`, and `DependencyStructuralValidationBasisDescriptor`. The two public result variants are `NoGapStructuralExpectationValidationResult` and `GapStructuralExpectationValidationResult`, united by `StructuralExpectationValidationResult`.

For `EVIDENCE_BINDING` and `DEPENDENCY`, the descriptor carries the complete canonical supplied observation-ID inventory. Nested IDs are deterministic code-point sorted; input ordering is not identity-bearing; duplicates fail rather than being silently deduplicated. For `CONTEXT_ROLE`, the descriptor is only `{ kind: "CONTEXT_ROLE" }`: its represented observations are the canonical context items already bound through assembly `contextId`, not item IDs embedded in the descriptor. The descriptor stores no EBIND rationale or full EBIND/DREL artifact. EBIND participates only within the sealed Phase-5C3C evidence-binding basis: Phase 5C4 exposes no top-level binding inventory and adds no standalone EBIND assertion API.

The canonical descriptor is identity-bearing within an assembly that also commits to `contextId`. `DGAP_` alone does not commit to every supplied EVIDENCE_BINDING or DEPENDENCY basis observation, so the same expectation may produce the same `gapId` from two valid such bases that differ only by irrelevant represented observations. Those bases have distinct descriptor inventories and therefore produce different assembly identities. CONTEXT_ROLE observations remain committed through `contextId`.

One `StructuralConsequenceValidationInput` contains exactly `expectation`, `gapBasis`, `gap`, `propagationBasis`, and `consequence`. Phase 5C4 operation-locally invokes the sealed Phase-5C3D assertion rather than trusting `DCONS_`. Its source must already occur as a `GAP` result in the same assembly with the same `expectationId`, canonical `StructuralValidationBasisDescriptor`, and `gapId`; otherwise it fails `ERR_DECISION_VALIDATION_ASSEMBLY_CONSEQUENCE_SOURCE_MISSING`. A GAP may have zero or multiple explicit consequences. `consequenceIds` stores only exact validated DCONS IDs in canonical code-point order; duplicate IDs fail `ERR_DECISION_VALIDATION_ASSEMBLY_DUPLICATE_CONSEQUENCE`.

### Detached reconstruction, identity, and assertion

For each input occurrence, Phase 5C4 captures one detached operation-local snapshot and reuses it throughout predecessor validation, reconstruction, basis-descriptor construction, source-coherence checks, and identity construction:

```text
ONE DERIVATION INPUT OCCURRENCE
-> ONE DETACHED OPERATION-LOCAL SNAPSHOT

BASIS USED FOR DERIVATION
== BASIS COMMITTED INTO THE ASSEMBLY
```

This prevents caller mutation or a non-idempotent proxy from presenting different values to predecessor validation and DVASM construction. Safe capture is not semantic validation.

```ts
DVASM_ + SHA256(JSON.stringify([
  "DECISION_CONTEXT_VALIDATION_ASSEMBLY_V1",
  contextId,
  canonicalExpectationResults,
  canonicalConsequenceIds
])).slice(0, 24).toUpperCase()
```

Expectation results are code-point sorted by `expectationId`; binding IDs, relation-proposal IDs, and consequence IDs are code-point sorted. The exact canonical result objects and consequence-ID set participate in identity. Thus a context, expectation ID, canonical basis descriptor, `GAP`/`NO_GAP` outcome, gap ID, or consequence-set change changes `DVASM_`; input order alone does not.

`assertDecisionContextValidationAssembly(context, input, assembly)` reconstructs the complete canonical expected assembly from the exact supplied derivation inputs before accepting stored representation. It does not merely recompute a self-consistent hash from stored fields. A body mismatch fails `ERR_DECISION_VALIDATION_ASSEMBLY_INVALID`; only an otherwise exact artifact with a wrong `assemblyId` fails `ERR_DECISION_VALIDATION_ASSEMBLY_ID_MISMATCH`.

### Error and authority boundaries

| Condition | Error / behavior |
| --- | --- |
| Malformed 5C4 wrapper or input container | `ERR_DECISION_VALIDATION_ASSEMBLY_INPUT_INVALID` |
| Duplicate expectation ID | `ERR_DECISION_VALIDATION_ASSEMBLY_DUPLICATE_EXPECTATION` |
| Caller result differs from canonical Phase-5C3C reconstruction | `ERR_DECISION_VALIDATION_ASSEMBLY_RESULT_MISMATCH` |
| Valid consequence lacks its matching assembled GAP source | `ERR_DECISION_VALIDATION_ASSEMBLY_CONSEQUENCE_SOURCE_MISSING` |
| Duplicate consequence ID | `ERR_DECISION_VALIDATION_ASSEMBLY_DUPLICATE_CONSEQUENCE` |
| Hostile, malformed, or body-mismatching stored assembly | `ERR_DECISION_VALIDATION_ASSEMBLY_INVALID` |
| Otherwise exact stored assembly with wrong `DVASM_` | `ERR_DECISION_VALIDATION_ASSEMBLY_ID_MISMATCH` |

Meaningful sealed predecessor errors remain observable. In particular, the directly consumed Phase-5B `DecisionContextDraft` preserves `ERR_DECISION_CONTEXT_INVALID`, `ERR_DECISION_CONTEXT_SOURCE_STATE_REFERENCES_NOT_CANONICAL`, `ERR_DECISION_CONTEXT_ITEMS_NOT_CANONICAL`, `ERR_DECISION_CONTEXT_DECISION_QUESTION_COUNT`, `ERR_DECISION_CONTEXT_AUTHORITATIVE_REFERENCE_MISSING`, `ERR_DECISION_CONTEXT_DECISION_QUESTION_ID_MISMATCH`, and `ERR_DECISION_CONTEXT_ID_MISMATCH`; a bad Decision Context is not relabeled as a StructuralGap-context failure. Structural expectation, gap basis, EBIND, DREL, stored gap, propagation basis/path, and stored consequence errors likewise remain owned by their sealed predecessor contracts.

Phase 5C4 invokes no reader, resolver, repository, payload, authority validator, semantic binder, or semantic evaluator. It emits no authority certificate or authority-valid flag. Contract coherence is not current authority, semantic verification, truth, completeness, decision readiness, priority, recommendation, or human decision.

## Decision Context Revision contract

Phase 5D1 adds the adjacent `lib/decision-core/revisions/` module. It defines a self-contained canonical revision artifact. The 5D1 artifact contract itself adds no repository operation, parent lookup, lineage traversal, head/latest/current selection, or authority of record.

```ts
interface DecisionContextRevisionInput {
  previousRevisionId: string | null;
  context: DecisionContextDraft;
  validationInput: DecisionContextValidationAssemblyInput;
  validationAssembly: DecisionContextValidationAssembly;
}

interface DecisionContextRevision {
  artifactKind: "DECISION_CONTEXT_REVISION";
  schemaVersion: "DECISION_CONTEXT_REVISION_V1";
  revisionId: string;
  previousRevisionId: string | null;
  context: DecisionContextDraft;
  validationInput: DecisionContextValidationAssemblyInput;
  validationAssembly: DecisionContextValidationAssembly;
}
```

The public operations are `createDecisionContextRevision(input)` and `assertDecisionContextRevision(revision)`. No revision ID is supplied to the constructor. There are no created/updated timestamps, revision number, latest/current/active/head/superseded flag, authority status, score, confidence, priority, Decision Need, recommendation, human decision, action, outcome, feedback, provider/model metadata, or repository metadata fields.

### DCTX, DVASM, and DREV identities

`DCTX_` is the structural Decision Context identity, `DVASM_` is the derivational-coherence assembly identity, and `DREV_` is the self-contained revision-artifact identity. They are distinct identities: `DCTX_ != DVASM_`, `DVASM_ != DREV_`, and `DCTX_ != DREV_`. No one of them establishes truth or persistence authority.

```ts
DREV_ + SHA256(JSON.stringify([
  "DECISION_CONTEXT_REVISION_V1",
  previousRevisionId,
  context.contextId,
  validationAssembly.assemblyId
])).slice(0, 24).toUpperCase()
```

A root revision has `previousRevisionId === null`. A child-shaped revision has a previous ID matching `^DREV_[0-9A-F]{24}$`. This validates representation only: Phase 5D1 does not look up the parent, establish causation or semantic continuity, traverse lineage, or select a head.

### Complete payload, canonical derivation state, and snapshot isolation

`DREV_` identity is not the complete revision payload. Its tuple does not directly hash every embedded validation-input field. A canonical EBIND rationale can change without changing EBIND identity, the relevant derivation identity, `DVASM_`, or `DREV_`; two structurally valid complete revision artifacts may therefore have the same DREV identity and different identity-excluded represented payload. Phase 5D1 permits this and does not resolve a persistence conflict.

The revision embeds `context`, `validationInput`, and `validationAssembly`, so its derivational coherence can be revalidated through `assertDecisionContextDraft(context)` and `assertDecisionContextValidationAssembly(context, validationInput, validationAssembly)` without external derivation artifacts. This is self-contained revalidation state, not a durable persisted cold-restart record.

Construction safely captures caller input, validates the sealed context and supplied assembly, canonicalizes validation input, reconstructs the canonical assembly from that canonical input, and embeds detached canonical state in the revision artifact. Expectation validations sort by `expectation.expectationId`; EVIDENCE_BINDING basis bindings sort by `bindingId`; DEPENDENCY basis relation proposals sort by `relationProposalId`; consequence validations sort by `consequence.consequenceId`. `DEPENDENCY_PATH.relationProposals` preserve their supplied order because the explicit path is semantic. No silent deduplication occurs.

Constructor and stored assertion operate from one detached operation-local snapshot. After capture, caller-owned nested context, validation input, and validation assembly representation has zero authority over validation, revision construction, or canonical stored-revision comparison. Assertion compares detached captured stored revision representation against reconstructed canonical state; it does not reread caller-owned nested state after predecessor validation. Safe capture is not semantic validation, and the returned revision is detached rather than promised deeply frozen.

### Stored assertion and errors

`assertDecisionContextRevision(revision)` requires the embedded context to pass its sealed contract, canonicalizes/revalidates embedded validation input, reconstructs the canonical assembly, requires the stored validation input and assembly already equal that canonical representation, and then recomputes `DREV_`.

| Condition | Error / behavior |
| --- | --- |
| Malformed `DecisionContextRevisionInput` wrapper | `ERR_DECISION_CONTEXT_REVISION_INPUT_INVALID` |
| Syntactically invalid non-null `previousRevisionId` in otherwise captured constructor input | `ERR_DECISION_CONTEXT_REVISION_PREVIOUS_ID_INVALID` |
| Hostile, malformed, noncanonical, or body-mismatching stored revision, including malformed stored `previousRevisionId` | `ERR_DECISION_CONTEXT_REVISION_INVALID` |
| Otherwise exact valid revision body with wrong `revisionId` | `ERR_DECISION_CONTEXT_REVISION_ID_MISMATCH` |
| Invalid embedded context or derivation state after safe representation capture | Meaningful sealed predecessor error remains observable. |

A self-consistent DREV string alone does not establish a valid revision. The artifact is neither truth, persistence, persisted authority, current authority, head/latest/active/superseded state, decision readiness, Decision Need, recommendation, human decision, action, outcome, nor feedback.

## Repository-Bound Immutable Persistence Authority contract

Phase 5D2A adds the adjacent `lib/decision-core/revision-persistence/` module. Its supported public surface is deliberately small:

```ts
interface DecisionContextRevisionRepository {
  getRevisionById(revisionId: string): Promise<DecisionContextRevision | null>;
  createDecisionContextRevisionPersister(): BoundDecisionContextRevisionPersister;
}

interface BoundDecisionContextRevisionPersister {
  persist(revision: DecisionContextRevision): Promise<DecisionContextRevision>;
}
```

`DecisionContextRevisionRepository` defines only the supported `getRevisionById(...)` and persister-factory shape. Its absence of a raw-writer member does not prove that every conforming runtime object has no other method or enforces the Phase-5D2A invariant. `INTERFACE CONFORMANCE != PHASE-5D2A GOVERNANCE GUARANTEE`.

The shipped `InMemoryDecisionContextRevisionRepository` is the implementation that enforces the documented 5D2A semantics. Its supported write path is exactly `repository -> createDecisionContextRevisionPersister() -> persist(revision)`. It is tested not to expose runtime-callable `saveRevision`, `writeRevision`, `putRevision`, `replaceRevision`, `updateRevision`, or `deleteRevision`. Its runtime-private `#writeRevision(...)` is storage machinery, not a public write capability or the authority boundary.

`createBoundDecisionContextRevisionPersister(...)` is internal composition machinery in `revision-persistence/persister.ts`. It is not exported by `revision-persistence/index.ts` or `lib/decision-core/index.ts`; deep-import accessibility is not a supported repository write capability.

The supported shipped in-memory path establishes authority of record only when all of the following succeed:

```text
VALID CANONICAL DREV
  + BOUND SHIPPED REPOSITORY/PERSISTER
  + IMMEDIATE PARENT INTEGRITY
  + IMMUTABLE WRITE
  + EXACT POST-WRITE REREAD
  + EXACT COMPLETE-ARTIFACT EQUALITY
  = REPOSITORY-SELECTED AUTHORITY OF RECORD FOR THIS DREV ID DURING THIS OPERATION
```

Authority of record is not truth, semantic correctness, current producer authority, current decision state, head/latest/active selection, Decision Need, or recommendation. It is an application/API capability boundary, not cryptographic isolation or a hostile same-process sandbox.

### Operation-local snapshot and exact reread

One `persist(...)` occurrence captures and sealed-asserts one pristine detached expected revision before repository awaits. The private writer receives `structuredClone(expected)`, not the pristine expected object. The post-write reread is captured once, sealed-asserted, and compared against the pristine expected artifact.

```text
STATE VALIDATED == EXPECTED AUTHORITY STATE
WRITER INPUT    == DETACHED COPY OF EXPECTED AUTHORITY STATE
WRITER MUTATION CAPABILITY != EXPECTED AUTHORITY STATE MUTATION CAPABILITY
```

The shipped in-memory operation returns a detached `DecisionContextRevision` from the exact reread only after its revision ID and every complete payload field equal the pristine expected revision. A successful private write alone is insufficient. A missing, malformed, invalid, wrong-ID, or complete-payload-divergent reread after a successful write fails `ERR_DECISION_CONTEXT_REVISION_PERSISTENCE_INVALID`. Underlying writer/dependency errors may propagate rather than being normalized to that error.

### Root, immediate parent, and forks

`previousRevisionId === null` is a root persistence operation and performs no parent lookup. A root is not globally first, the only root, active, head, or preferred.

A non-null `previousRevisionId` requires exactly one immediate `getRevisionById(previousRevisionId)` lookup before writing. That parent must exist, pass sealed `assertDecisionContextRevision(...)`, and have the requested revision ID. An absent parent fails `ERR_DECISION_CONTEXT_REVISION_PARENT_NOT_FOUND`; a malformed, invalid, noncanonical, or identity-mismatched returned parent fails `ERR_DECISION_CONTEXT_REVISION_PARENT_INVALID`. This is immediate referential integrity only: it does not traverse ancestry, establish causation, semantic continuity, same-context/assembly continuity, or select a head.

Multiple children of one persisted parent are valid. `LINEAGE INTEGRITY != BRANCH SELECTION POLICY`. A child may preserve its parent's `contextId` and `validationAssembly.assemblyId`; `NEW REVISION != REQUIRED SEMANTIC CHANGE`.

### Immutable record key and complete payload

Repository identity is `revisionId`. Exact replay of the same complete revision is idempotent. The same DREV with a divergent complete artifact fails `ERR_DECISION_CONTEXT_REVISION_IMMUTABLE_CONFLICT`.

`DREV_` identity is deliberately not the complete revision payload. In particular, identity-excluded canonical EBIND rationale state may differ while EBIND identity, `DVASM_`, and `DREV_` remain unchanged. This is intentional identity/payload separation, not a hash collision: identity selects the record key, while exact complete-artifact equality selects the immutable record state.

### Errors and in-memory limit

| Condition | Error / behavior |
| --- | --- |
| Invalid persister-composition dependency contract | `ERR_DECISION_CONTEXT_REVISION_REPOSITORY_INVALID` |
| Required immediate parent absent | `ERR_DECISION_CONTEXT_REVISION_PARENT_NOT_FOUND` |
| Returned immediate parent malformed, invalid, or ID-mismatched | `ERR_DECISION_CONTEXT_REVISION_PARENT_INVALID` |
| Same DREV already has divergent complete artifact state | `ERR_DECISION_CONTEXT_REVISION_IMMUTABLE_CONFLICT` |
| Write reports success but reread cannot establish exact complete persisted equality | `ERR_DECISION_CONTEXT_REVISION_PERSISTENCE_INVALID` |
| Invalid caller revision | Meaningful sealed Phase-5D1 error remains observable. |

The shipped in-memory implementation enforces repository-bound authority semantics, immediate-parent integrity, immutable replay/conflict behavior, exact reread, complete equality, and detached reads/returns. It does not itself prove durable persistence, process-restart survival, database durability or transaction isolation, Postgres race guarantees, database foreign keys, or cold restart. `5D2A != DURABLE HISTORICAL MEMORY`; Phase 5D2B provides the separate durable PostgreSQL adapter. Phase 5D3 separately reconstructs one explicit read-only predecessor path through the existing generic read capability.

## Durable PostgreSQL Persistence Adapter contract

Phase 5D2B adds `PostgresDecisionContextRevisionRepository` under `lib/decision-adapters/revision-persistence/`. Its dependency direction is:

```text
decision-adapters/revision-persistence
  -> decision-core/revision-persistence
  -> decision-core/revisions
```

The adapter receives a configured `PostgresJsDatabase` dependency. It does not read `DATABASE_URL`, create a pool, create a database or table, or run migrations. Generic `lib/decision-core/**` remains free of PostgreSQL, Drizzle, Career DB, Career ontology, and frontend dependencies.

Its supported surface is `getRevisionById(revisionId)` and `createDecisionContextRevisionPersister()`. The supported write path remains `repository -> createDecisionContextRevisionPersister() -> persist(revision)`. The adapter barrel exports only `PostgresDecisionContextRevisionRepository`; the `decisionContextRevisions` Drizzle descriptor and runtime-private `#writeRevision(...)` are infrastructure machinery, not public write capability.

The physical PostgreSQL table is exactly `decision_context_revisions` with `revision_id TEXT PRIMARY KEY`, nullable `previous_revision_id TEXT`, and `payload JSONB NOT NULL`. `previous_revision_id` self-references `revision_id` with non-cascading deletion and is not unique, so forks remain physically representable. There are no timestamps, revision numbers, head/latest/current/active/superseded fields, branch fields, or payload hash.

Every accepted row must satisfy:

```text
requested revision ID == row.revision_id, where lookup supplies one
row.revision_id == payload.revisionId
row.previous_revision_id == payload.previousRevisionId
```

The read path is exact persisted representation validation:

```text
PostgreSQL row
  -> detached JSONB payload
  -> assertDecisionContextRevision(payload)
  -> physical / embedded identity equality
  -> detached DecisionContextRevision
```

`READ != RECONSTRUCT != REPAIR`. JSONB object-key normalization is accepted through structural data equality, but a malformed, noncanonical, or physical/embedded-inconsistent row fails `ERR_DECISION_CONTEXT_REVISION_POSTGRES_RECORD_INVALID` and is not normalized.

The runtime-private writer uses `INSERT ... ON CONFLICT DO NOTHING ... RETURNING`. An insert winner succeeds; an existing key causes a conflict-race reread of the winner. Exact complete artifact equality is idempotent replay, while divergent complete artifact state is `ERR_DECISION_CONTEXT_REVISION_IMMUTABLE_CONFLICT`. This race reread answers which row won the physical key; it remains distinct from the sealed 5D2A post-write reread that decides whether the bound authority operation may return. No update, overwrite, repair, or payload-hash equality criterion exists.

`DREV_` remains lookup identity, not the complete record state. Identity-excluded EBIND rationale remains conflict-relevant complete payload. PostgreSQL JSONB may reorder object keys without changing structural data; arrays remain order-sensitive. The targeted 5C4 correction made stored-assembly equality recursive, key-order-insensitive for objects, and order-sensitive for arrays without changing any 5C4 artifact shape, identity, API, or derivation semantics.

5D2B combines 5D2A application-level immediate-parent validation with the physical self foreign key. Both establish integrity layers, but `FK != FULL LINEAGE VALIDATION`: there is no parent-of-parent traversal, head selection, or branch policy. A child whose parent is not visible fails `ERR_DECISION_CONTEXT_REVISION_PARENT_NOT_FOUND`; there is no wait, polling, automatic retry, or eventual-consistency interpretation. One parent may have multiple children, and a child may retain its parent's context and assembly identities.

The focused integration suite uses isolated PostgreSQL schemas and derives test DDL from the actual internal `decisionContextRevisions` Drizzle descriptor; test provisioning is not production bootstrapping. It uses two independent postgres.js clients for physical race tests. It proves database-backed survival across repository/client reconstruction, not OS-process crash recovery, machine restart, backup, replication, or disaster recovery.

## Phase 5D3 read-only revision lineage

Phase 5D3 adds the adjacent generic `lib/decision-core/revision-lineage/` module. Its exact public read model is:

```ts
interface DecisionContextRevisionLineage {
  startRevisionId: string;
  rootRevisionId: string;
  revisions: readonly DecisionContextRevision[];
}
```

The only operation is `createBoundDecisionContextRevisionLineageReconstructor({ getRevisionById }).reconstruct(startRevisionId)`. The runtime dependency is exact: it captures only an own function-valued data property named `getRevisionById`; accessor-backed or extra-capability dependencies are rejected with `ERR_DECISION_CONTEXT_REVISION_LINEAGE_READER_INVALID`. Thus 5D3 has read capability and zero write capability. A sealed-valid result from this generic reader is not itself persistence proof or repository-selected authority of record; those semantics remain owned by the reader's repository contract when one is supplied.

`startRevisionId` must match `^DREV_[0-9A-F]{24}$` before any reader invocation or it fails `ERR_DECISION_CONTEXT_REVISION_LINEAGE_START_ID_INVALID`. For each requested ID, a `null` first read fails `ERR_DECISION_CONTEXT_REVISION_LINEAGE_START_NOT_FOUND`; a `null` later predecessor read fails `ERR_DECISION_CONTEXT_REVISION_LINEAGE_PREDECESSOR_NOT_FOUND`. Only a sealed-valid revision with explicit `previousRevisionId: null` is the root of this returned path. Missing predecessor is not root, and the operation returns no partial result. Complete means only that all explicit `previousRevisionId` links from the supplied start have been read through the bound reader until this explicit-null terminator; it does not mean global history, all branches or descendants, unique repository history, or global completeness.

Every non-null returned revision is detached, passes sealed `assertDecisionContextRevision(...)`, and must have `revisionId` exactly equal to the requested ID. Malformed/noncanonical state, malformed predecessor representation, or wrong returned ID fails `ERR_DECISION_CONTEXT_REVISION_LINEAGE_REVISION_INVALID`; 5D3 does not reconstruct or repair individual stored revisions. Reader and adapter errors, including `ERR_DECISION_CONTEXT_REVISION_POSTGRES_RECORD_INVALID`, propagate unchanged.

The returned `revisions` are in root-to-start explicit predecessor order: `R[0].revisionId === rootRevisionId`, `R[0].previousRevisionId === null`, `R[n - 1].revisionId === startRevisionId`, and each later revision names the preceding result revision as its predecessor. This is predecessor order, not chronological or temporal order. The result has no `DLINE_`, `artifactKind`, schema version, timestamp, lineage ID, depth, branch, head/latest/current/active status, authority, or semantic-change field.

The reconstructor tracks requested IDs in an operation-local visited set before each read. Repetition fails `ERR_DECISION_CONTEXT_REVISION_LINEAGE_CYCLE`; this is defensive repeated-request-ID protection for a generic reader boundary, not causal-cycle detection, semantic-cycle detection, graph analysis, or branch discovery. Each invocation owns its visited set and captured sequence; returned state is detached but not promised deep-frozen.

## Phase 6A human-owned assessment request contract

Phase 6A adds the generic `DecisionAssessmentRequest` artifact under `lib/decision-core/assessment-request/`. It records one explicitly human-declared normative assessment frame. It is not an assessment, assessment basis, recommendation, Decision Need, human decision, score, ranking, revision-resolution result, or repository-authority record.

```ts
interface DecisionAssessmentRequest {
  artifactKind: "DECISION_ASSESSMENT_REQUEST";
  schemaVersion: "DECISION_ASSESSMENT_REQUEST_V1";
  assessmentRequestId: string;
  revisionId: string;
  requestedBy: { origin: "HUMAN_INPUT"; actorId: string };
  decisionQuestionItemId: string;
  selectedOptionItemIds: readonly string[];
  selectedObjectiveItemIds: readonly string[];
  selectedConstraintItemIds: readonly string[];
}
```

No extra stored fields are valid. The runtime module exports exactly `DECISION_ASSESSMENT_REQUEST_SCHEMA_VERSION`, `createDecisionAssessmentRequest`, and `assertDecisionAssessmentRequest`; its public types are `DecisionAssessmentRequestActor`, `DecisionAssessmentRequestInput`, and `DecisionAssessmentRequest`. No identity builder is public.

### `DAREQ_` identity

`assessmentRequestId` is deterministic:

```ts
DAREQ_ + SHA256(JSON.stringify([
  "DECISION_ASSESSMENT_REQUEST_V1",
  revisionId,
  ["HUMAN_INPUT", trimmedActorId],
  decisionQuestionItemId,
  canonicalSelectedOptionItemIds,
  canonicalSelectedObjectiveItemIds,
  canonicalSelectedConstraintItemIds
])).slice(0, 24).toUpperCase()
```

There is no timestamp, randomness, UUID, provider/model metadata, or execution-order input. `DAREQ IDENTITY != DECISION AUTHORITY`, `DAREQ IDENTITY != REVISION AUTHORITY`, and `DAREQ IDENTITY != HUMAN DECISION`.

### Human ownership, references, and selections

`requestedBy` is exactly `{ origin: "HUMAN_INPUT", actorId }`. `actorId` must be non-empty after trimming; construction stores the trimmed value. This records declared human normative ownership only:

```text
HUMAN_INPUT != AUTHENTICATED HUMAN IDENTITY
HUMAN_INPUT != AUTHORIZATION
HUMAN_INPUT != SIGNATURE
HUMAN_INPUT != EVIDENCE TRUTH
HUMAN_INPUT != HUMAN DECISION
```

There is no identity provider, permission check, authentication, signature, or user database lookup.

`revisionId` must only match `^DREV_[0-9A-F]{24}$`. A DREV-shaped reference is not proof of revision existence, persisted authority, current revision, head, latest, or active state. Phase 6A performs no repository read, revision assertion, persistence check, lineage reconstruction, current/head selection, or producer-authority resolution.

Every item reference must only match `^DCI_[0-9A-F]{24}$`. A DCI-shaped reference is not proof that the item exists, belongs to the named revision, or has the declared role. Thus Phase 6A does not prove that its question is an actual `DECISION_QUESTION`, or that selected IDs are actual `OPTION`, `OBJECTIVE`, or `CONSTRAINT` items.

Selections mean only: **the human declared this item reference as part of this assessment request.** `SELECTION != OBJECTIVE IMPORTANCE`, `SELECTION != TRUTH`, and `SELECTION != COMPLETENESS`. Inclusion does not establish objective/constraint truth, enforceability, option viability, global relevance, completeness, or decision readiness. All three selection arrays may simultaneously be empty; that is valid request representation and does not imply an assessment can execute.

### Canonicalization and stored assertion

`createDecisionAssessmentRequest(...)` trims `actorId`, code-point-sorts each selection array by item ID, and returns detached selection arrays and requester state. Caller array order is non-semantic. It does not deduplicate: duplicate option, objective, or constraint IDs; a DCI repeated across categories; or reuse of `decisionQuestionItemId` in a selection all fail `ERR_DECISION_ASSESSMENT_REQUEST_DUPLICATE_SELECTION`. This is request-level declared-category consistency, not actual context-role validation.

`assertDecisionAssessmentRequest(...)` accepts only exact canonical stored representation and never repairs it:

```text
CREATE MAY CANONICALIZE
ASSERT MUST NOT REPAIR
```

It rejects malformed, accessor-backed, symbol-keyed, or non-enumerable representation; extra or missing fields; malformed IDs; untrimmed actor IDs; noncanonical order; duplicates; cross-category duplicate classification; and question reuse. An otherwise exact canonical body with the wrong `DAREQ_` fails `ERR_DECISION_ASSESSMENT_REQUEST_ID_MISMATCH`.

### Errors

```text
ERR_DECISION_ASSESSMENT_REQUEST_INPUT_INVALID
ERR_DECISION_ASSESSMENT_REQUEST_REVISION_ID_INVALID
ERR_DECISION_ASSESSMENT_REQUEST_ACTOR_INVALID
ERR_DECISION_ASSESSMENT_REQUEST_ITEM_ID_INVALID
ERR_DECISION_ASSESSMENT_REQUEST_DUPLICATE_SELECTION
ERR_DECISION_ASSESSMENT_REQUEST_INVALID
ERR_DECISION_ASSESSMENT_REQUEST_ID_MISMATCH
```

The contract defines no item-not-found, role-mismatch, revision-not-found, repository, assessment, recommendation, or Decision Need errors.

## Phase 6B revision-bound assessment basis contract

Phase 6B adds the generic `DecisionAssessmentBasis` artifact under `lib/decision-core/assessment-basis/`. It binds one sealed Phase 6A request to one exact reader-returned sealed `DecisionContextRevision`, then verifies the request's declared item membership and roles. It stops there: `ASSESSMENT BASIS != ASSESSMENT != DECISION NEED != RECOMMENDATION != HUMAN DECISION`.

```ts
interface DecisionAssessmentBasis {
  artifactKind: "DECISION_ASSESSMENT_BASIS";
  schemaVersion: "DECISION_ASSESSMENT_BASIS_V1";
  assessmentBasisId: string;
  assessmentRequest: DecisionAssessmentRequest;
  revision: DecisionContextRevision;
}
```

No extra fields are valid: no timestamp, model/provider metadata, score, recommendation, Decision Need, human decision, repository metadata, or current/head/latest state. Runtime exports are exactly `DECISION_ASSESSMENT_BASIS_SCHEMA_VERSION`, `createBoundDecisionAssessmentBasisBinder`, and `assertDecisionAssessmentBasis`. Public types are exactly `DecisionAssessmentBasisRevisionReader`, `BoundDecisionAssessmentBasisBinder`, and `DecisionAssessmentBasis`; no identity builder is public.

### Bound reader and operation order

`DecisionAssessmentBasisRevisionReader` has exactly `getRevisionById(revisionId: string): Promise<DecisionContextRevision | null>`. Construction accepts only one own enumerable data-property capability with that function-valued method. Extra own capabilities, accessor-backed methods, symbol state, a non-enumerable method, a missing method, `null`, arrays, and primitives fail `ERR_DECISION_ASSESSMENT_BASIS_READER_INVALID`. The method is captured and bound at construction, so later replacement cannot redirect the binder. This narrow reader does not prove persistence, current producer authority, or authority of record.

`bind(...)` operates in this exact order:

1. Defensively capture the complete supplied `DecisionAssessmentRequest`.
2. Sealed-assert it with `assertDecisionAssessmentRequest(...)`.
3. Only then invoke `getRevisionById(request.revisionId)`.
4. Treat `null` as `ERR_DECISION_ASSESSMENT_BASIS_REVISION_NOT_FOUND`.
5. Defensively capture the complete returned revision.
6. Sealed-assert it with `assertDecisionContextRevision(...)`.
7. Require exact returned/requested `revisionId` equality.
8. Verify decision-question membership.
9. Verify decision-question role.
10. Verify selected option membership and role.
11. Verify selected objective membership and role.
12. Verify selected constraint membership and role.
13. Construct `DecisionAssessmentBasis`.
14. Derive complete-state `DABAS_`.
15. Assert the constructed basis.
16. Return detached basis state.
17. Stop; no semantic assessment follows.

Request capture occurs before the reader await; hostile nested request accessors are rejected without execution and invalid requests are not repaired. Returned revision state is likewise captured before membership, role, or identity work; detached does not mean deep-frozen.

The question must exist in `revision.context.items`, have role `DECISION_QUESTION`, and equal `revision.context.decisionQuestionId`. Every selected option, objective, and constraint must respectively exist and have role `OPTION`, `OBJECTIVE`, and `CONSTRAINT`. Missing items fail `ERR_DECISION_ASSESSMENT_BASIS_ITEM_NOT_FOUND`; role mismatch fails `ERR_DECISION_ASSESSMENT_BASIS_ROLE_MISMATCH`. Empty selection arrays remain valid: `EMPTY SELECTIONS != READINESS`. `MEMBERSHIP != SEMANTIC SUPPORT`, `ROLE != NORMATIVE IMPORTANCE`, and `ROLE != TRUTH`.

### `DABAS_` complete-state identity

`assessmentBasisId` matches `^DABAS_[0-9A-F]{24}$` and is derived by SHA-256 over the JSON encoding of:

```ts
[
  "DECISION_ASSESSMENT_BASIS_V1",
  canonicalCompleteDecisionAssessmentRequest,
  canonicalCompleteDecisionContextRevision
]
```

The first 24 hexadecimal characters are uppercased and prefixed `DABAS_`. The private canonicalizer recursively orders object own string keys by deterministic code-point comparison, preserves array order, and preserves primitive values. Object insertion order is non-semantic; no hidden, symbol, or accessor state participates. No timestamp, randomness, or UUID participates.

`DREV IDENTITY != COMPLETE REVISION PAYLOAD`: sealed-valid revision payload can differ in identity-excluded semantic-binding rationale while retaining the same `revisionId`. Therefore the same DREV with a different complete revision payload produces a different `DABAS_`; identity is not merely `assessmentRequestId + revisionId`. `DABAS IDENTITY != REVISION AUTHORITY != DECISION AUTHORITY != TRUTH`.

### Stored assertion and errors

`assertDecisionAssessmentBasis(value)` is repository-free and has the boundary `unknown -> asserts value is DecisionAssessmentBasis`. It requires exact five-field representation, header and DABAS shape, sealed embedded request/revision assertions, exact embedded revision-ID equality, item membership/role checks, and recomputed complete-state identity. It rejects hostile nested state and does not sort, trim, deduplicate, canonicalize, or otherwise mutate the submitted stored representation as repair. The separately captured request/revision state is structurally canonicalized only inside the private DABAS identity calculation, so object property insertion order remains non-semantic; that identity canonicalization does not mutate caller state and array ordering remains preserved:

```text
ASSERT MUST NOT REPAIR
```

Hostile, malformed, noncanonical, predecessor-invalid, revision-binding-invalid, or membership/role-invalid stored basis state fails `ERR_DECISION_ASSESSMENT_BASIS_INVALID`. If the complete basis body is otherwise valid and only `assessmentBasisId` differs from the recomputed complete-state identity, assertion fails `ERR_DECISION_ASSESSMENT_BASIS_ID_MISMATCH`.

```text
IDENTITY CANONICALIZATION != STORED-ARTIFACT REPAIR
INVALID BODY != VALID COMPLETE BODY + STALE / WRONG DABAS
```

```text
ERR_DECISION_ASSESSMENT_BASIS_READER_INVALID
ERR_DECISION_ASSESSMENT_BASIS_REQUEST_INVALID
ERR_DECISION_ASSESSMENT_BASIS_REVISION_NOT_FOUND
ERR_DECISION_ASSESSMENT_BASIS_REVISION_INVALID
ERR_DECISION_ASSESSMENT_BASIS_ITEM_NOT_FOUND
ERR_DECISION_ASSESSMENT_BASIS_ROLE_MISMATCH
ERR_DECISION_ASSESSMENT_BASIS_INVALID
ERR_DECISION_ASSESSMENT_BASIS_ID_MISMATCH
```

The module remains generic Decision Core: it has no Career, Recruiting, Capability Core, matching, legacy-loop, frontend, PostgreSQL, Drizzle, decision-adapter, repository writer, evaluator/model/provider, lineage, producer-authority, assessment, recommendation, Decision Need, score, ranking, or human-decision dependency.

## Phase 6C semantic assessment proposal contract

Phase 6C adds `DecisionAssessmentProposal` under `lib/decision-core/assessment-proposal/`. It consumes one sealed `DecisionAssessmentBasis`, one bound semantic evaluator, and declared `MODEL_PROPOSAL` provenance to represent zero or more semantic assessment relations. The chain is `DecisionAssessmentRequest -> DecisionAssessmentBasis -> DecisionAssessmentProposal -> STOP`; no recommendation follows.

```ts
interface DecisionAssessmentProposal {
  artifactKind: "DECISION_ASSESSMENT_PROPOSAL";
  schemaVersion: "DECISION_ASSESSMENT_PROPOSAL_V1";
  assessmentProposalId: string;
  assessmentBasis: DecisionAssessmentBasis;
  proposedBy: DecisionAssessmentProposalProvenance;
  assessments: readonly DecisionAssessmentEvaluation[];
}
```

Exactly six top-level fields are valid. There is no timestamp, UUID, provider/model metadata beyond `proposalRef`, score, rank, priority, weight, confidence, recommendation, Decision Need, human decision, repository/persistence metadata, or current/head/latest state. Runtime exports are exactly `DECISION_ASSESSMENT_PROPOSAL_SCHEMA_VERSION`, `DECISION_ASSESSMENT_DISPOSITIONS`, `createBoundDecisionAssessmentProposer`, and `assertDecisionAssessmentProposal`. Public types are exactly `DecisionAssessmentDisposition`, `DecisionAssessmentEvaluation`, `DecisionAssessmentProposalProvenance`, `DecisionAssessmentEvaluationInput`, `DecisionAssessmentEvaluator`, `DecisionAssessmentProposal`, and `BoundDecisionAssessmentProposer`.

### Relations, dispositions, provenance, and evaluator

```ts
interface DecisionAssessmentEvaluation {
  optionItemId: string;
  criterionItemId: string;
  disposition: DecisionAssessmentDisposition;
  rationale: string;
}

interface DecisionAssessmentProposalProvenance {
  origin: "MODEL_PROPOSAL";
  proposalRef: string;
}

interface DecisionAssessmentEvaluationInput {
  assessmentBasis: DecisionAssessmentBasis;
}

interface DecisionAssessmentEvaluator {
  evaluate(input: DecisionAssessmentEvaluationInput): Promise<readonly DecisionAssessmentEvaluation[]>;
}

interface BoundDecisionAssessmentProposer {
  propose(assessmentBasis: DecisionAssessmentBasis, proposedBy: DecisionAssessmentProposalProvenance): Promise<DecisionAssessmentProposal>;
}
```

The closed disposition set is exactly `ALIGNED`, `PARTIALLY_ALIGNED`, `MISALIGNED`, and `UNDETERMINED`. An assessment relation is not ranking or option preference, and the proposal is not recommendation, Decision Need, or human decision. `proposalRef` is trimmed by `propose(...)`; stored assertion requires its already-trimmed representation. It is declarative proposal provenance, not model/provider authentication, authorization, signature, authority token, truth, human preference, or human adoption.

`createBoundDecisionAssessmentProposer(evaluator)` accepts exactly one own enumerable data-method capability named `evaluate`. Extra properties, symbols, accessor-backed or non-enumerable methods, missing methods, `null`, arrays, and primitives reject with `ERR_DECISION_ASSESSMENT_PROPOSAL_EVALUATOR_INVALID`. Its method is captured and bound at construction, so later replacement cannot redirect the proposer.

### Operation and target admission

`propose(...)` (1) captures the complete basis, (2) sealed-asserts it, (3) captures exact declared `MODEL_PROPOSAL` provenance, (4) trims valid `proposalRef`, (5) invokes the bound evaluator once with a detached complete basis, (6) captures output, (7) validates exact evaluation shape, (8) trims nonempty rationale, (9) verifies the selected option target, (10) verifies the selected objective/constraint target, (11) rejects duplicate target pairs, (12) canonicalizes evaluation order, (13) derives `DASPR_`, (14) constructs the proposal, (15) self-asserts it, (16) returns detached state, and (17) stops. Caller mutation after operation start cannot redirect basis/provenance; evaluator input and evaluator-owned output are independently detached. Detached does not mean deep-frozen.

An `optionItemId` must occur in `assessmentBasis.assessmentRequest.selectedOptionItemIds`. A `criterionItemId` must occur in either selected objectives or selected constraints. A revision-member item alone is not enough: `REVISION MEMBERSHIP != HUMAN NORMATIVE SELECTION`. The evaluator may inspect the complete detached basis, but this contract governs admitted output representation rather than claiming to constrain or prove internal evaluator reasoning.

Target identity is exactly `[optionItemId, criterionItemId]`; a second relation for the same pair fails `ERR_DECISION_ASSESSMENT_PROPOSAL_DUPLICATE`, even if disposition or rationale differs. Evaluations are code-point ordered by `JSON.stringify([optionItemId, criterionItemId])`. Zero output and partial matrices are valid: `NO ASSESSMENT != UNDETERMINED`; no missing relation is synthesized, and `PARTIAL ASSESSMENT MATRIX != INCOMPLETE DECISION STATE`.

### `DASPR_` complete-state identity

`assessmentProposalId` matches `^DASPR_[0-9A-F]{24}$`: SHA-256 of `JSON.stringify(...)`, first 24 uppercase hexadecimal characters, prefixed `DASPR_`.

```ts
[
  "DECISION_ASSESSMENT_PROPOSAL_V1",
  canonicalCompleteDecisionAssessmentBasis,
  ["MODEL_PROPOSAL", proposedBy.proposalRef],
  canonicalAssessments
]
```

The complete basis canonicalizer recursively code-point-sorts object own string keys while preserving arrays and primitive values. Object insertion order is non-semantic; array order follows predecessor contracts. Canonical assessments contain complete option ID, criterion ID, disposition, and trimmed rationale. Rationale is identity-bearing: unlike Phase 5C2 `EBIND_`, whose rationale is stored but identity-excluded, `DASPR_` identifies the complete represented assessment proposal state. `EBIND RATIONALE IDENTITY RULE != DASPR RATIONALE IDENTITY RULE` because the artifacts identify different things.

`DASPR IDENTITY = COMPLETE REPRESENTED ASSESSMENT PROPOSAL STATE`, but `DASPR IDENTITY != TRUTH != RECOMMENDATION AUTHORITY != DECISION AUTHORITY`. No timestamp, UUID, randomness, execution order, or provider metadata participates.

### Stored assertion and errors

`assertDecisionAssessmentProposal(value)` has the boundary `unknown -> asserts value is DecisionAssessmentProposal`. It is self-contained: it calls no evaluator, reader, repository, lineage, authority, provider, or model dependency. It requires exact six-field representation, header/DASPR shape, sealed embedded basis, exact already-canonical declared `MODEL_PROPOSAL` provenance, exact evaluation shape, trimmed rationale, selected targets, no duplicate pairs, canonical ordering, and complete-state identity.

```text
CREATE MAY CANONICALIZE
ASSERT MUST NOT REPAIR
IDENTITY CANONICALIZATION != STORED-ARTIFACT REPAIR
INVALID BODY != VALID COMPLETE BODY + STALE / WRONG DASPR
```

Hostile, malformed, noncanonical, embedded-invalid, target-invalid, or duplicate stored state fails `ERR_DECISION_ASSESSMENT_PROPOSAL_INVALID`. An otherwise exact valid complete body with only stale/wrong deterministic ID fails `ERR_DECISION_ASSESSMENT_PROPOSAL_ID_MISMATCH`. At construction, malformed provenance fails `ERR_DECISION_ASSESSMENT_PROPOSAL_PROVENANCE_INVALID`; valid-shaped unselected option/criterion fails its respective selection error; malformed target references fail `ERR_DECISION_ASSESSMENT_PROPOSAL_EVALUATION_INVALID`. Stored body failures collapse to `INVALID` except final otherwise-valid ID mismatch. Underlying evaluator dependency errors not owned by Phase 6C may propagate unchanged.

```text
ERR_DECISION_ASSESSMENT_PROPOSAL_EVALUATOR_INVALID
ERR_DECISION_ASSESSMENT_PROPOSAL_BASIS_INVALID
ERR_DECISION_ASSESSMENT_PROPOSAL_PROVENANCE_INVALID
ERR_DECISION_ASSESSMENT_PROPOSAL_EVALUATION_INVALID
ERR_DECISION_ASSESSMENT_PROPOSAL_OPTION_NOT_SELECTED
ERR_DECISION_ASSESSMENT_PROPOSAL_CRITERION_NOT_SELECTED
ERR_DECISION_ASSESSMENT_PROPOSAL_DUPLICATE
ERR_DECISION_ASSESSMENT_PROPOSAL_INVALID
ERR_DECISION_ASSESSMENT_PROPOSAL_ID_MISMATCH
```

The module remains generic: no Career, Recruiting, Capability Core, matching, legacy loop, frontend, PostgreSQL, Drizzle, decision adapters, revision persistence/lineage, provider implementation, model implementation, scoring, ranking, recommendation, Decision Need, or human-decision dependency exists.

## Phase 6D recommendation proposal contract

Phase 6D adds `DecisionRecommendationProposal` under `lib/decision-core/recommendation-proposal/`. It transforms one sealed assessment proposal through one bound generic semantic recommendation capability and declared `MODEL_PROPOSAL` provenance into canonical recommendation proposal state, then stops. It does not make a human decision or close the human-machine loop.

```ts
interface DecisionRecommendationProposal {
  artifactKind: "DECISION_RECOMMENDATION_PROPOSAL";
  schemaVersion: "DECISION_RECOMMENDATION_PROPOSAL_V1";
  recommendationProposalId: string;
  assessmentProposal: DecisionAssessmentProposal;
  proposedBy: DecisionRecommendationProposalProvenance;
  recommendations: readonly DecisionRecommendation[];
}
```

Exactly six top-level fields are valid. `DecisionRecommendation` is exactly `{ optionItemId, rationale }`; it contains no criterion ID, disposition, score, weight, rank, priority, confidence, timestamp, winner, or rejection state. Rationale is trimmed, nonempty, and identity-bearing. Runtime exports are exactly `DECISION_RECOMMENDATION_PROPOSAL_SCHEMA_VERSION`, `createBoundDecisionRecommendationProposer`, and `assertDecisionRecommendationProposal`. Public types are exactly `DecisionRecommendation`, `DecisionRecommendationProposalProvenance`, `DecisionRecommendationGenerationInput`, `DecisionRecommendationGenerator`, `DecisionRecommendationProposal`, and `BoundDecisionRecommendationProposer`.

### Generator, provenance, and operation

```ts
interface DecisionRecommendationGenerationInput {
  assessmentProposal: DecisionAssessmentProposal;
}

interface DecisionRecommendationGenerator {
  recommend(input: DecisionRecommendationGenerationInput): Promise<readonly DecisionRecommendation[]>;
}
```

`createBoundDecisionRecommendationProposer(generator)` accepts exactly one own enumerable data-method `recommend`. It rejects extras, symbols, accessors, non-enumerable/missing/non-function `recommend`, arrays, primitives, and `null`. The method is captured and bound at construction; later replacement cannot redirect the proposer and its receiver is preserved. The generator is a generic semantic recommendation capability: `GENERATOR CAPABILITY != MODEL IDENTITY`, and declared `MODEL_PROPOSAL` provenance does not prove generator identity, model/provider authentication, provider authority, human preference, or truth.

`propose(...)` (1) captures the complete assessment proposal, (2) sealed-asserts it, (3) captures declared `MODEL_PROPOSAL` provenance and trims valid `proposalRef`, (4) invokes the bound `recommend` capability once with a detached complete predecessor, (5) defensively captures output, (6) validates exact recommendation shape and trimmed nonempty rationale, (7) validates human selection, (8) validates assessment representation, (9) rejects duplicate option targets, (10) canonicalizes recommendation order, (11) derives `DRECP_`, (12) constructs the exact artifact, (13) self-asserts it, (14) returns detached state, and (15) stops. Caller mutation cannot redirect predecessor, selection/assessment inventory, provenance, or identity. Generator input and output are detached; detached does not mean deep-frozen.

### Target admission and disposition independence

A recommendation `optionItemId` must be DCI-shaped, occur in `assessmentProposal.assessmentBasis.assessmentRequest.selectedOptionItemIds`, and occur in at least one `assessmentProposal.assessments[*].optionItemId` relation. Thus `REVISION MEMBERSHIP != HUMAN NORMATIVE SELECTION`, `HUMAN NORMATIVE SELECTION != ASSESSMENT REPRESENTATION`, and `ASSESSMENT REPRESENTATION != RECOMMENDATION`. A selected but unassessed option is not admissible, without a claim that it is bad, rejected, incomplete, irrelevant, unsafe, or unfit.

Admission does not inspect assessment disposition. An option represented only as `ALIGNED`, `PARTIALLY_ALIGNED`, `MISALIGNED`, or `UNDETERMINED` remains structurally eligible. `DISPOSITION != RECOMMENDATION POLICY`; `ALIGNED != RECOMMENDED`, `PARTIALLY_ALIGNED != LOWER PRIORITY`, `MISALIGNED != REJECTED`, and `UNDETERMINED != BLOCKED`.

Zero, partial, and multiple recommendations are valid. Recommendation order is non-semantic and stored order is deterministic by code-point `optionItemId`. Absence means no claim; no rejection is synthesized. With empty embedded assessments, zero recommendations remain valid but no non-empty output can satisfy assessment-representation admission. Multiple recommendations do not establish ranking, best, optimality, human preference, Decision Need, decision, action, outcome, or truth.

### `DRECP_` complete-state identity

`recommendationProposalId` matches `^DRECP_[0-9A-F]{24}$`: SHA-256 of `JSON.stringify(...)`, first 24 uppercase hexadecimal characters, prefixed `DRECP_`.

```ts
[
  "DECISION_RECOMMENDATION_PROPOSAL_V1",
  canonicalCompleteDecisionAssessmentProposal,
  ["MODEL_PROPOSAL", proposedBy.proposalRef],
  canonicalRecommendations
]
```

The complete embedded assessment proposal participates; identity is not merely `assessmentProposalId + recommendations`. Its canonicalizer recursively code-point-sorts object own string keys, preserves arrays in sealed predecessor order, and preserves primitive values. Recommendation input order is non-semantic because Phase 6D canonicalizes by option ID. Changing complete assessment proposal state, `proposalRef`, recommended option, rationale, or recommendation set changes `DRECP_`. `DRECP IDENTITY != TRUTH != RECOMMENDATION CORRECTNESS != OPTION OPTIMALITY != HUMAN DECISION`.

### Stored assertion and errors

`assertDecisionRecommendationProposal(value)` is self-contained and may sealed-assert the embedded `DecisionAssessmentProposal`. It calls no generator, evaluator, reader, repository, persister, lineage, authority resolver, provider, model, or external dependency. It requires exact six fields, header/ID shape, exact canonical provenance, exact two-field recommendations, already-trimmed rationale, valid selected and assessment-represented DCI targets, no duplicates, canonical order, and recomputed complete-state identity.

```text
CREATE MAY CANONICALIZE
ASSERT MUST NOT REPAIR
```

It does not trim, sort, deduplicate, replace targets, or synthesize state. Hostile, malformed, noncanonical, embedded-invalid, target-invalid, or duplicate stored state fails `ERR_DECISION_RECOMMENDATION_PROPOSAL_INVALID`. Only an otherwise exact valid body with stale/wrong deterministic ID fails `ERR_DECISION_RECOMMENDATION_PROPOSAL_ID_MISMATCH`.

```text
ERR_DECISION_RECOMMENDATION_PROPOSAL_GENERATOR_INVALID
ERR_DECISION_RECOMMENDATION_PROPOSAL_ASSESSMENT_PROPOSAL_INVALID
ERR_DECISION_RECOMMENDATION_PROPOSAL_PROVENANCE_INVALID
ERR_DECISION_RECOMMENDATION_PROPOSAL_RECOMMENDATION_INVALID
ERR_DECISION_RECOMMENDATION_PROPOSAL_OPTION_NOT_SELECTED
ERR_DECISION_RECOMMENDATION_PROPOSAL_OPTION_NOT_ASSESSED
ERR_DECISION_RECOMMENDATION_PROPOSAL_DUPLICATE
ERR_DECISION_RECOMMENDATION_PROPOSAL_INVALID
ERR_DECISION_RECOMMENDATION_PROPOSAL_ID_MISMATCH
```

The module remains generic Decision Core: no Career, Recruiting, Capability Core, matching, legacy loop, frontend, PostgreSQL, Drizzle, decision adapters, revision persistence/lineage, provider implementation, score/rank/recommendation-policy, Decision Need, human decision, action, outcome, feedback, or learning dependency exists.

## Phase 6E proposal coherence validation contract

Phase 6E adds `DecisionProposalCoherenceValidation` under `lib/decision-core/proposal-coherence/`. It transforms one sealed `DecisionRecommendationProposal` through deterministic ConDyn trace reconstruction into a detached canonical validation artifact, then stops. It has no model, provider, evaluator, generator, human actor, reader, repository, persister, lineage, or authority dependency.

```ts
interface DecisionRecommendationCoherenceTrace {
  optionItemId: string;
  representedCriterionItemIds: readonly string[];
}

interface DecisionProposalCoherenceValidation {
  artifactKind: "DECISION_PROPOSAL_COHERENCE_VALIDATION";
  schemaVersion: "DECISION_PROPOSAL_COHERENCE_VALIDATION_V1";
  proposalCoherenceValidationId: string;
  recommendationProposal: DecisionRecommendationProposal;
  traces: readonly DecisionRecommendationCoherenceTrace[];
}
```

The trace has exactly two fields and the artifact exactly five. There are no timestamps, added provenance, model/provider metadata, validation-status boolean, `coherent` boolean, correctness field, or support field. Runtime exports are exactly `DECISION_PROPOSAL_COHERENCE_VALIDATION_SCHEMA_VERSION`, `validateDecisionProposalCoherence`, and `assertDecisionProposalCoherenceValidation`. Public types are exactly `DecisionRecommendationCoherenceTrace` and `DecisionProposalCoherenceValidation`.

### Trace reconstruction and canonicalization

For each recommendation, one trace is derived. Its `optionItemId` equals the recommendation option ID. Its `representedCriterionItemIds` are exactly every `criterionItemId` in `recommendationProposal.assessmentProposal.assessments` whose `optionItemId` equals the trace option ID. All assessment dispositions and rationales are represented data only: neither is interpreted, filtered, or treated as support, justification, correctness, completeness, or readiness.

Trace inventory order is deterministic code-point `optionItemId` order. Criterion IDs within each trace are deterministic code-point `criterionItemId` order. Phase 6E derives its own canonical trace representation rather than relying on predecessor iteration order. It does not require a selected-criterion Cartesian product or synthesize missing criteria. Assessed but unrecommended options receive no trace; zero recommendations yield `traces: []`; multiple recommendations yield one trace each.

Phase 6D already guarantees that every recommendation target is human-selected and assessment-represented at least once. A sealed-valid recommendation proposal therefore has no untraceable recommendation under the Phase 6E definition. Phase 6E adds no `UNTRACEABLE`, `INCOHERENT`, `UNSUPPORTED`, `INCOMPLETE`, `REJECTED`, or `NOT_READY` state.

`TRACEABILITY != SEMANTIC CORRECTNESS`, `STRUCTURAL COHERENCE != RECOMMENDATION CORRECTNESS`, `ASSESSMENT REPRESENTATION != SUPPORT FOR RECOMMENDATION`, `CRITERION TRACE != JUSTIFICATION`, `ASSESSMENT DISPOSITION != COHERENCE POLICY`, `MISALIGNED != INCOHERENT RECOMMENDATION`, and `UNDETERMINED != INVALID RECOMMENDATION`.

### `DPCV_` complete-state identity

`proposalCoherenceValidationId` matches `^DPCV_[0-9A-F]{24}$`: SHA-256 of `JSON.stringify(...)`, first 24 uppercase hexadecimal characters, prefixed `DPCV_`.

```ts
[
  "DECISION_PROPOSAL_COHERENCE_VALIDATION_V1",
  canonicalCompleteDecisionRecommendationProposal,
  canonicalTraces
]
```

The complete embedded recommendation proposal participates; identity is not merely `recommendationProposalId + traces`. Its canonicalizer recursively code-point-sorts object own string keys, preserves sealed predecessor array order, and preserves primitive values. Trace and criterion order are separately canonicalized. A changed complete predecessor changes `DPCV_` even if the trace summary remains the same: this includes assessment disposition or rationale, recommendation rationale, proposal reference, human assessment frame, and recommendation inventory. `TRACE SUMMARY != COMPLETE VALIDATION IDENTITY`. `DPCV IDENTITY != TRUTH != RECOMMENDATION CORRECTNESS != HUMAN DECISION`.

### Stored assertion and errors

`assertDecisionProposalCoherenceValidation(value)` is self-contained and may sealed-assert the embedded `DecisionRecommendationProposal`. It calls no generator, evaluator, reader, repository, persister, lineage, authority resolver, provider, model, or external dependency. It requires exact five fields, valid header and `DPCV_` shape, a sealed complete predecessor, exact two-field traces, exact trace/criterion inventories, canonical trace/criterion ordering, and recomputed complete-state identity.

```text
CREATE MAY DERIVE / CANONICALIZE
ASSERT MUST NOT REPAIR
```

Assertion may independently derive expected traces for comparison, but it does not sort, deduplicate, replace, add, remove, or reconstruct into the supplied stored object. Hostile, malformed, noncanonical, predecessor-invalid, or trace-mismatching stored state fails `ERR_DECISION_PROPOSAL_COHERENCE_INVALID`. Only an otherwise exact valid body with stale/wrong deterministic ID fails `ERR_DECISION_PROPOSAL_COHERENCE_ID_MISMATCH`.

```text
ERR_DECISION_PROPOSAL_COHERENCE_RECOMMENDATION_PROPOSAL_INVALID
ERR_DECISION_PROPOSAL_COHERENCE_INVALID
ERR_DECISION_PROPOSAL_COHERENCE_ID_MISMATCH
```

Phase 6E does not reuse Phase-5 `validation` or `validation-assembly`: `validation` is operation-time producer-authority reachability, `validation-assembly` is Phase-5 derivational coherence, and `proposal-coherence` is Phase-6 recommendation-to-assessment trace reconstruction. The module remains generic Decision Core and imports only the sealed recommendation-proposal contract plus standard crypto/local files.

## Phase 7A human decision declaration contract

Phase 7A adds `HumanDecisionDeclaration` under `lib/decision-core/human-decision/`. It consumes one sealed `DecisionProposalCoherenceValidation`, a declared `HUMAN_INPUT` actor, one or more explicit option choices, and optional human rationale; it creates one detached canonical declaration and stops. This is the first explicit human normative state transition, not a model proposal, recommendation, recommendation-correctness claim, truth, action, outcome, feedback, learning, or persistence-authority operation.

```ts
interface HumanDecisionActor {
  origin: "HUMAN_INPUT";
  actorId: string;
}

interface HumanDecisionDeclarationInput {
  decidedBy: HumanDecisionActor;
  chosenOptionItemIds: readonly string[];
  rationale: string | null;
}

interface HumanDecisionDeclaration {
  artifactKind: "HUMAN_DECISION_DECLARATION";
  schemaVersion: "HUMAN_DECISION_DECLARATION_V1";
  humanDecisionId: string;
  proposalCoherenceValidation: DecisionProposalCoherenceValidation;
  decidedBy: HumanDecisionActor;
  chosenOptionItemIds: readonly string[];
  rationale: string | null;
}
```

The artifact has exactly seven fields. It has no timestamp, UUID, randomness, status enum, recommendation state, score, rank, priority, action, outcome, feedback, persistence metadata, or authentication metadata. `HUMAN_INPUT` is declared origin/ownership only: it is not authenticated human identity, authorization, signature, permission, or truth, and `DECISION ACTOR != ASSESSMENT REQUESTER`.

### Human autonomy and option admission

`THE MODEL MAY NARROW ITS OWN PROPOSAL SPACE; IT MUST NOT NARROW THE HUMAN DECISION SPACE.` A chosen ID is admitted when it is DCI-shaped, exists in the complete sealed revision reached through `DPCV -> recommendation proposal -> assessment proposal -> assessment basis -> revision -> context.items`, and has role `OPTION`. It need not occur in the 6A selected options, 6C assessments, 6D recommendations, or 6E traces. Thus `HUMAN ASSESSMENT SELECTION != HUMAN DECISION ADMISSIBILITY`, `ASSESSMENT != HUMAN DECISION ADMISSIBILITY`, `RECOMMENDATION != HUMAN DECISION ADMISSIBILITY`, and `COHERENCE TRACE != HUMAN DECISION ADMISSIBILITY`.

For example, a revision with options A/B/C may have A/B selected in 6A and only A assessed, recommended, and traced through Phase 6; a Phase 7A declaration choosing C remains valid because C is an actual revision `OPTION`. This does not call C unsupported, invalid, bad, or outside the human decision space.

One or more distinct choices are required. Multiple choices are valid because no generic exclusivity/single-choice contract exists. `ONE DECISION != EXACTLY ONE OPTION`, `MULTIPLE CHOSEN OPTIONS != RANKING`, `MULTIPLE CHOSEN OPTIONS != ORDERED PREFERENCE`, and input order is canonicalized by code-point item-ID order. Empty choices reject only because 7A is explicit positive selection: `ZERO CHOSEN OPTIONS != DEFER != ABSTAIN != REJECT_ALL != NO_DECISION`.

Rationale is `null` or a trimmed nonempty string. Construction trims it; stored assertion requires already-trimmed state. `HUMAN RATIONALE != PROOF != TRUTH != RECOMMENDATION CORRECTNESS`.

### Construction, identity, and stored assertion

`createHumanDecisionDeclaration(proposalCoherenceValidation, input)` captures and sealed-asserts the complete DPCV, captures the exact three-field input, trims valid actor/rationale values, validates actual revision-option membership/role, rejects duplicates, canonicalizes choice order, derives `DHDEC_`, self-asserts, and returns detached state. It calls no model, provider, evaluator, generator, reader, repository, persister, lineage, authority resolver, or authentication dependency.

`DHDEC_` matches `^DHDEC_[0-9A-F]{24}$` and is the first 24 uppercase hexadecimal characters of SHA-256 over:

```ts
[
  "HUMAN_DECISION_DECLARATION_V1",
  canonicalCompleteDecisionProposalCoherenceValidation,
  ["HUMAN_INPUT", trimmedActorId],
  canonicalChosenOptionItemIds,
  canonicalRationale
]
```

The complete embedded DPCV participates: assessment-frame/proposal/disposition/rationale, recommendation/provenance/rationale, and coherence-trace changes alter `DHDEC_` even when choices remain the same. Decision actor, choice set, and human rationale also participate. Recursive object-key canonicalization makes object insertion order non-semantic; sealed predecessor arrays retain their represented semantics and chosen choice order is independently canonical. `DHDEC IDENTITY != AUTHENTICATED HUMAN IDENTITY != AUTHORIZATION != TRUTH != RECOMMENDATION CORRECTNESS != OPTION OPTIMALITY != ACTION != PERSISTENCE AUTHORITY`.

`assertHumanDecisionDeclaration(value)` is self-contained. It requires exact seven fields, headers and `DHDEC_` shape, a sealed complete DPCV, exact `HUMAN_INPUT` actor with trimmed nonempty ID, a nonempty canonical unique choice inventory, valid revision `OPTION` targets, valid canonical rationale, and recomputed complete-state identity. `CREATE MAY CANONICALIZE; ASSERT MUST NOT REPAIR.` Hostile, malformed, noncanonical, predecessor-invalid, or body-invalid stored state fails `ERR_DECISION_HUMAN_DECISION_INVALID`; only an otherwise exact valid body with a stale/wrong ID fails `ERR_DECISION_HUMAN_DECISION_ID_MISMATCH`.

Descriptor-based capture rejects accessors, symbol keys, hidden fields, sparse arrays, custom array state, and cycles without getter execution. Returned state is detached, not asserted deep-frozen. The module is generic and imports only `node:crypto`, sealed `proposal-coherence`, and local files. It neither reuses nor generalizes `lib/career/decisions/*`; legacy Career decision artifacts remain domain-specific and are not authority for Phase 7A.

The public runtime surface is exactly `HUMAN_DECISION_DECLARATION_SCHEMA_VERSION`, `createHumanDecisionDeclaration`, and `assertHumanDecisionDeclaration`. The public types are exactly `HumanDecisionActor`, `HumanDecisionDeclarationInput`, and `HumanDecisionDeclaration`. The exact Phase 7A error surface is:

- `ERR_DECISION_HUMAN_DECISION_INPUT_INVALID`
- `ERR_DECISION_HUMAN_DECISION_PROPOSAL_COHERENCE_INVALID`
- `ERR_DECISION_HUMAN_DECISION_ACTOR_INVALID`
- `ERR_DECISION_HUMAN_DECISION_OPTION_ID_INVALID`
- `ERR_DECISION_HUMAN_DECISION_OPTION_NOT_FOUND`
- `ERR_DECISION_HUMAN_DECISION_OPTION_ROLE_MISMATCH`
- `ERR_DECISION_HUMAN_DECISION_DUPLICATE_OPTION`
- `ERR_DECISION_HUMAN_DECISION_RATIONALE_INVALID`
- `ERR_DECISION_HUMAN_DECISION_INVALID`
- `ERR_DECISION_HUMAN_DECISION_ID_MISMATCH`

## Phase 8A1 decision-bound action-intent contract

Phase 8A1 adds `DecisionActionIntent` under `lib/decision-core/action-intent/`. It consumes one complete sealed `HumanDecisionDeclaration`, declared `HUMAN_INPUT` intent actor, a nonempty explicit subset of the human-chosen option IDs, opaque operation text, and optional human rationale; it creates one detached canonical artifact and stops. It is intended operation state only: `HUMAN DECISION != ACTION INTENT`, `ACTION INTENT != HUMAN COMMITMENT != ACTION != EXECUTION != OUTCOME`, and `INTENDED ACTION != OBSERVED ACTION`.

```ts
interface ActionIntentActor {
  origin: "HUMAN_INPUT";
  actorId: string;
}

interface DecisionActionIntentInput {
  declaredBy: ActionIntentActor;
  operationalizedOptionItemIds: readonly string[];
  operationDescription: string;
  rationale: string | null;
}

interface DecisionActionIntent {
  artifactKind: "DECISION_ACTION_INTENT";
  schemaVersion: "DECISION_ACTION_INTENT_V1";
  actionIntentId: string;
  humanDecisionDeclaration: HumanDecisionDeclaration;
  declaredBy: ActionIntentActor;
  operationalizedOptionItemIds: readonly string[];
  operationDescription: string;
  rationale: string | null;
}
```

The input has exactly four fields and the artifact exactly eight. There is no commitment/action actor, execution or status field, timestamp, target, assignee, due date, outcome, feedback, persistence metadata, or authentication metadata. `declaredBy` is declared human input only: the Action Intent declarer, decision actor, future commitment actor, and future Action actor are independent semantic role positions; no actor-ID equality or inequality is required or inferred. `HUMAN_INPUT != AUTHENTICATED IDENTITY != AUTHORIZATION != SIGNATURE != PERMISSION != TRUTH`.

### Subset admission and opaque operation text

The complete human declaration is the sole predecessor authority boundary. `createDecisionActionIntent(...)` calls `assertHumanDecisionDeclaration(...)` and does not independently reconstruct the revision, inspect context roles, inspect assessment selections/relations, inspect recommendations or traces, resolve producer authority, traverse lineage, or read persistence.

Every operationalized ID is DCI-shaped, unique, and in `humanDecisionDeclaration.chosenOptionItemIds`; construction canonicalizes code-point order and stored assertion requires it already. `ACTION INTENT SCOPE ⊆ HUMAN DECISION CHOICE SET`. This follows, rather than contradicts, `MODEL PROPOSAL SPACE != HUMAN DECISION SPACE`: the model cannot narrow pre-decision human admissibility, while an intent cannot operationalize an option the human did not choose. A/B/C may yield an A/C intent; if the human chose only A/B, actual revision option C is invalid for the intent.

`operationDescription` is trimmed nonempty opaque text. It is not parsed into an action type, target, assignee, executor, parameter set, command, workflow, timing, or expected effect. `OPERATION DESCRIPTION != EXECUTABLE COMMAND != EXECUTION PROOF != EXPECTED OUTCOME != AUTHORIZATION`. Rationale is `null` or trimmed nonempty human text; `RATIONALE != ACTION INTENT != PROOF != TRUTH != AUTHORIZATION != EXECUTION`.

One decision may have zero, one, or multiple independently declared intents. No repository/global uniqueness or cross-intent overlap constraint exists: `ONE HUMAN DECISION != ONE ACTION INTENT` and `DECISION EXISTENCE != ACTION INTENT EXISTENCE`.

### `DAINT_` complete-state identity and stored assertion

`DAINT_` matches `^DAINT_[0-9A-F]{24}$`: it is the first 24 uppercase hexadecimal characters of SHA-256 over:

```ts
[
  "DECISION_ACTION_INTENT_V1",
  canonicalCompleteHumanDecisionDeclaration,
  ["HUMAN_INPUT", trimmedDeclaredByActorId],
  canonicalOperationalizedOptionItemIds,
  canonicalOperationDescription,
  canonicalRationale
]
```

The complete embedded human declaration participates, not only `humanDecisionId`. Recursive canonicalization makes predecessor object insertion order non-semantic while retaining sealed predecessor array semantics; local option order is separately canonical. Predecessor state, declarer, option subset, operation description, and rationale each change `DAINT_`. `DAINT IDENTITY != AUTHENTICATED IDENTITY != AUTHORIZATION != EXECUTION != ACTION OCCURRENCE != OUTCOME != TRUTH != PERSISTENCE AUTHORITY != CURRENT PRODUCER AUTHORITY`.

`assertDecisionActionIntent(value)` is self-contained and may call only `assertHumanDecisionDeclaration(...)`. It requires exact headers and eight fields, a sealed complete predecessor, canonical human actor, nonempty canonical subset, trimmed opaque operation text, canonical rationale, and recomputed identity. `CREATE MAY CANONICALIZE; ASSERT MUST NOT REPAIR.` Hostile, malformed, noncanonical, predecessor-invalid, or body-invalid stored state fails `ERR_DECISION_ACTION_INTENT_INVALID`; only an otherwise exact valid body with a stale/wrong ID fails `ERR_DECISION_ACTION_INTENT_ID_MISMATCH`.

Descriptor-based capture rejects accessors, symbols, hidden fields, sparse arrays, custom array state, and cycles without getter execution, including nested hostile predecessor state. Returned state is detached, not asserted deep-frozen. The module imports only `node:crypto`, sealed `human-decision`, and local files. It does not reuse or generalize `lib/career/decisions/action.ts`; legacy `CommitmentRecord`, `ActionEvent`, action types/targets, time/random IDs, and caches remain domain-specific.

The runtime surface is exactly `DECISION_ACTION_INTENT_SCHEMA_VERSION`, `createDecisionActionIntent`, and `assertDecisionActionIntent`. The public types are exactly `ActionIntentActor`, `DecisionActionIntentInput`, and `DecisionActionIntent`. The exact error surface is:

- `ERR_DECISION_ACTION_INTENT_INPUT_INVALID`
- `ERR_DECISION_ACTION_INTENT_HUMAN_DECISION_INVALID`
- `ERR_DECISION_ACTION_INTENT_ACTOR_INVALID`
- `ERR_DECISION_ACTION_INTENT_OPTION_ID_INVALID`
- `ERR_DECISION_ACTION_INTENT_OPTION_NOT_CHOSEN`
- `ERR_DECISION_ACTION_INTENT_DUPLICATE_OPTION`
- `ERR_DECISION_ACTION_INTENT_OPERATION_INVALID`
- `ERR_DECISION_ACTION_INTENT_RATIONALE_INVALID`
- `ERR_DECISION_ACTION_INTENT_INVALID`
- `ERR_DECISION_ACTION_INTENT_ID_MISMATCH`

## Phase 8A2 human-commitment contract

Phase 8A2 adds `HumanCommitment` under `lib/decision-core/human-commitment/`. It consumes one complete sealed `DecisionActionIntent`, one declared `HUMAN_INPUT` commitment actor, and optional human rationale; it creates one detached canonical artifact and stops.

```ts
interface HumanCommitmentActor {
  origin: "HUMAN_INPUT";
  actorId: string;
}

interface HumanCommitmentInput {
  committedBy: HumanCommitmentActor;
  rationale: string | null;
}

interface HumanCommitment {
  artifactKind: "HUMAN_COMMITMENT";
  schemaVersion: "HUMAN_COMMITMENT_V1";
  humanCommitmentId: string;
  actionIntent: DecisionActionIntent;
  committedBy: HumanCommitmentActor;
  rationale: string | null;
}
```

The input has exactly two fields and the artifact exactly six. `COMMITMENT TARGET = COMPLETE SEALED ACTION INTENT`: no option IDs, operation-description duplicate, action type, target, assignment, assignee, executor, authorization, role, status, timestamp, due date, execution, outcome, feedback, persistence metadata, or authentication metadata exists. `ACTION INTENT OWNS OPERATIONALIZATION SCOPE`; Human Commitment has no partial-scope representation and does not expand or shrink that scope.

### Actor, rationale, and multiple-commitment semantics

`committedBy` is exact `{ origin: "HUMAN_INPUT", actorId }`; construction trims a nonempty actor ID and stored assertion requires it already trimmed. It is declaration only: `HUMAN_INPUT != AUTHENTICATED HUMAN IDENTITY != AUTHORIZATION != SIGNATURE != PERMISSION != ORGANIZATIONAL ROLE != LEGAL ACCOUNTABILITY`. The commitment actor may differ from both the decision actor and Action Intent declarer. These are independent semantic role positions; no actor-ID equality or inequality is required or inferred. One artifact has one actor; no actor array, joint commitment, quorum, voting, delegation, or aggregation exists.

One Action Intent may have zero, one, or multiple independent Human Commitments. This contract creates one artifact and performs no repository lookup, search for other commitments, aggregation, or global uniqueness operation: `ONE ACTION INTENT != ONE HUMAN COMMITMENT` and `ACTION INTENT EXISTENCE != COMMITMENT EXISTENCE`.

Rationale is `null` or trimmed nonempty human text; stored assertion requires it already trimmed. It represents only the declared actor's reason for committing. `COMMITMENT RATIONALE != COMMITMENT != AUTHORIZATION != EXECUTION PROOF != LEGAL SIGNATURE != ACTION PLAN != OUTCOME EXPECTATION != TRUTH`.

### Declared-commitment boundary and temporal exclusions

The artifact records declared commitment only. `DECLARED COMMITMENT != LEGAL RESPONSIBILITY != ORGANIZATIONAL ACCOUNTABILITY != OWNERSHIP`; it does not establish externally enforced obligation. It establishes neither authorization, permission, execution authority, organizational authority, assignment, assignee, nor executor. The commitment-actor role does not establish an assignee or executor role; a future workflow may represent the same or a different concrete actor.

`HUMAN COMMITMENT != ACTION`; `COMMITTED != EXECUTED != DONE != COMPLETED != ACTION OCCURRED != OUTCOME ACHIEVED`. Commitment is not a universal predecessor for the standalone Phase 8B occurrence-claim branch. Stronger Action, observation, verification, performer, outcome, feedback, learning, and temporal semantics remain future work only if separately specified.

There is no `timestamp`, `createdAt`, `committedAt`, `dueAt`, `expiresAt`, `effectiveAt`, `scheduledAt`, `Date.now()`, `Math.random()`, or UUID. `WALL-CLOCK TIME != AUTHORITY`; `TIMESTAMP != COMMITMENT != EXECUTION PROOF`; `DUE DATE != COMMITMENT`. A future temporal workflow contract requires separate justification.

### `DHCOM_` complete-state identity and stored assertion

`DHCOM_` matches `^DHCOM_[0-9A-F]{24}$`: it is the first 24 uppercase hexadecimal characters of SHA-256 over:

```ts
[
  "HUMAN_COMMITMENT_V1",
  canonicalCompleteDecisionActionIntent,
  ["HUMAN_INPUT", trimmedCommittedByActorId],
  canonicalRationale
]
```

The complete embedded Action Intent participates, not only `actionIntentId`. Recursive canonicalization makes predecessor object insertion order non-semantic while retaining sealed predecessor array semantics. Predecessor state, commitment actor, and rationale each change `DHCOM_`; the same normalized complete state is deterministic. `DHCOM IDENTITY != AUTHENTICATED IDENTITY != AUTHORIZATION != ASSIGNMENT != EXECUTION != ACTION OCCURRENCE != COMPLETION != OUTCOME != TRUTH != PERSISTENCE AUTHORITY != CURRENT PRODUCER AUTHORITY`.

`assertHumanCommitment(value)` is self-contained and may call only `assertDecisionActionIntent(...)`. It requires exact headers and six fields, sealed complete Action Intent, canonical actor/rationale state, and recomputed complete-state identity. `CREATE MAY CANONICALIZE; ASSERT MUST NOT REPAIR.` Constructor predecessor failure is `ERR_DECISION_HUMAN_COMMITMENT_ACTION_INTENT_INVALID`; hostile, malformed, noncanonical, predecessor-invalid, or body-invalid stored state is `ERR_DECISION_HUMAN_COMMITMENT_INVALID`; only otherwise exact valid stored state with a stale/wrong ID is `ERR_DECISION_HUMAN_COMMITMENT_ID_MISMATCH`.

Descriptor-based capture rejects accessors, symbols, hidden fields, cycles, nested hostile predecessor accessors, nested sparse arrays, and nested custom array state without getter execution. Returned state is detached, not asserted deep-frozen. The module imports only `node:crypto`, sealed `action-intent`, and local files. It does not reuse or generalize `lib/career/decisions/action.ts`, `CommitmentRecord`, `decisionId`, `actionType`, `targetRef`, time/random IDs, `deepFreeze`, or action caches.

The runtime surface is exactly `HUMAN_COMMITMENT_SCHEMA_VERSION`, `createHumanCommitment`, and `assertHumanCommitment`. The public types are exactly `HumanCommitmentActor`, `HumanCommitmentInput`, and `HumanCommitment`. The exact error surface is:

- `ERR_DECISION_HUMAN_COMMITMENT_INPUT_INVALID`
- `ERR_DECISION_HUMAN_COMMITMENT_ACTION_INTENT_INVALID`
- `ERR_DECISION_HUMAN_COMMITMENT_ACTOR_INVALID`
- `ERR_DECISION_HUMAN_COMMITMENT_RATIONALE_INVALID`
- `ERR_DECISION_HUMAN_COMMITMENT_INVALID`
- `ERR_DECISION_HUMAN_COMMITMENT_ID_MISMATCH`

## Phase 8B action-occurrence-claim contract

Phase 8B adds `ActionOccurrenceClaim` under `lib/decision-core/action-occurrence-claim/`. It represents only: an explicit represented source claims that a described opaque operation occurred. It is a standalone occurrence-claim boundary, not Action, Action Event, observation, verification, execution proof, occurrence proof, or authority of reality.

```ts
type ActionOccurrenceClaimSource =
  | { origin: "HUMAN_INPUT"; actorId: string }
  | { origin: "AUTHORITATIVE_STATE"; stateReference: AuthoritativeStateReference };

interface ActionOccurrenceClaimInput {
  source: ActionOccurrenceClaimSource;
  operationDescription: string;
}

interface ActionOccurrenceClaim {
  artifactKind: "ACTION_OCCURRENCE_CLAIM";
  schemaVersion: "ACTION_OCCURRENCE_CLAIM_V1";
  actionOccurrenceClaimId: string;
  source: ActionOccurrenceClaimSource;
  operationDescription: string;
}
```

The input has exactly two fields and the artifact exactly five. It contains no Decision, Action Intent, Human Commitment, revision, assessment, recommendation, coherence, performer, action type, target, external reference, rationale, status, time, outcome, feedback, persistence, or relation field. `ACTION INTENT != UNIVERSAL ACTION PREDECESSOR`; `HUMAN COMMITMENT != UNIVERSAL ACTION PREDECESSOR`; operation-text, actor, ID, or temporal similarity establishes no relation.

### Closed source union and opaque fields

Only `HUMAN_INPUT` and `AUTHORITATIVE_STATE` are valid claim sources: `ACTION OCCURRENCE CLAIM SOURCE UNION != DECISION CONTEXT PROVENANCE UNION`; `MODEL_PROPOSAL != ACTION OCCURRENCE SOURCE`; `DETERMINISTIC_DERIVATION != ACTION OCCURRENCE SOURCE`. `HUMAN_INPUT` is declared human reporting provenance only, not authenticated identity, authorization, performer, executor, assignment, responsibility, ownership, accountability, execution proof, or truth. `CLAIM SOURCE ROLE != PERFORMER ROLE`; role non-equivalence does not require actor-ID inequality.

`AUTHORITATIVE_STATE` is exact `{ origin: "AUTHORITATIVE_STATE", stateReference: { producerId, authorityContractId, artifactId, locator } }`. It stores only that exact governed-state reference. No resolution, reader, resolver, authority validator, evaluator, repository, adapter, payload read, or payload inspection occurs. `REFERENCE != AUTHORITY TOKEN`; `REFERENCE PRESENT != REFERENCE CURRENTLY RESOLVABLE`; `REFERENCE CURRENTLY RESOLVABLE != PAYLOAD SUPPORTS CLAIM`; `PAYLOAD SUPPORTS CLAIM != ACTION OCCURRED IN REALITY`.

Every reference field is a non-blank string, but its exact opaque producer-owned representation is preserved, including surrounding whitespace. Human actor ID and `operationDescription` may trim during creation; references validate non-blankness without normalization. Stored assertion repairs nothing. `operationDescription` is trimmed nonempty opaque text, not executable command, execution proof, outcome, taxonomy, performer, or relation to Action Intent. Phase 8B represents no temporal claim: no timestamp, occurrence time, clock, random ID, or scheduling state exists.

### `DAOC_` identity, capture, and assertion

`DAOC_` matches `^DAOC_[0-9A-F]{24}$`: it is the first 24 uppercase hexadecimal characters of SHA-256 over:

```ts
[
  "ACTION_OCCURRENCE_CLAIM_V1",
  canonicalSource,
  operationDescription
]
```

`canonicalSource` is `["HUMAN_INPUT", actorId]` or `["AUTHORITATIVE_STATE", [producerId, authorityContractId, artifactId, locator]]`. Object insertion order is non-semantic; every represented source axis and operation text is semantic. `DAOC IDENTITY != REAL-WORLD EVENT IDENTITY != ACTION IDENTITY != EXECUTION IDENTITY != TRUTH != CURRENT SOURCE AUTHORITY != PERSISTENCE AUTHORITY`.

Construction is deterministic and dependency-free: it captures the exact top-level input, then source, then reference under their own shallow descriptor boundaries; canonicalizes only human actor ID and operation text; self-asserts; and returns detached state. Boundary-local capture prevents outer boundaries from stealing source/reference error ownership. Accessors, symbols, hidden/non-enumerable fields, extras, invalid objects, and self/cycle state where applicable reject without getter execution. Returned state is detached, not asserted deep-frozen.

`assertActionOccurrenceClaim(value)` is self-contained and exact/canonical/non-repairing. `CREATE MAY CANONICALIZE; ASSERT MUST NOT REPAIR.` Constructor errors are respectively `...INPUT_INVALID` for malformed top level, `...SOURCE_INVALID` for malformed/unsupported source, `...REFERENCE_INVALID` for malformed authoritative reference, and `...OPERATION_INVALID` for invalid text. Hostile, malformed, noncanonical, or body-invalid stored state is `ERR_DECISION_ACTION_OCCURRENCE_CLAIM_INVALID`; only otherwise valid state with stale/wrong `DAOC_` is `ERR_DECISION_ACTION_OCCURRENCE_CLAIM_ID_MISMATCH`.

The runtime surface is exactly `ACTION_OCCURRENCE_CLAIM_SCHEMA_VERSION`, `createActionOccurrenceClaim`, and `assertActionOccurrenceClaim`. Public types are exactly `ActionOccurrenceClaimSource`, `ActionOccurrenceClaimInput`, and `ActionOccurrenceClaim`. Exact errors are:

- `ERR_DECISION_ACTION_OCCURRENCE_CLAIM_INPUT_INVALID`
- `ERR_DECISION_ACTION_OCCURRENCE_CLAIM_SOURCE_INVALID`
- `ERR_DECISION_ACTION_OCCURRENCE_CLAIM_REFERENCE_INVALID`
- `ERR_DECISION_ACTION_OCCURRENCE_CLAIM_OPERATION_INVALID`
- `ERR_DECISION_ACTION_OCCURRENCE_CLAIM_INVALID`
- `ERR_DECISION_ACTION_OCCURRENCE_CLAIM_ID_MISMATCH`

Phase 8B adds no persistence or authority-of-record operation: `ACTION OCCURRENCE CLAIM ARTIFACT != PERSISTENCE AUTHORITY`; a future persisted claim would not imply real-world truth. It is independently constructed and does not reuse `lib/career/decisions/action.ts`, `ActionEvent`, `CommitmentRecord`, action type/external reference/occurrence-time semantics, random/time identity, action cache, or a mandatory Commitment-to-Action chain. `LEGACY CAREER ACTION EVENT != AUTHORITY FOR GENERIC PHASE 8B`.

## Phase 8C1 state-change-claim contract

Phase 8C1 adds `StateChangeClaim` under `lib/decision-core/state-change-claim/`. It represents only: an explicit represented source claims that a described opaque state change occurred. It is a standalone state-change-claim boundary, not state-change fact, observed reality, verified change, effect, outcome, consequence, causal claim, semantic state-change support, or authority of reality.

```ts
type StateChangeClaimSource =
  | { origin: "HUMAN_INPUT"; actorId: string }
  | { origin: "AUTHORITATIVE_STATE"; stateReference: AuthoritativeStateReference };

interface StateChangeClaimInput {
  source: StateChangeClaimSource;
  stateChangeDescription: string;
}

interface StateChangeClaim {
  artifactKind: "STATE_CHANGE_CLAIM";
  schemaVersion: "STATE_CHANGE_CLAIM_V1";
  stateChangeClaimId: string;
  source: StateChangeClaimSource;
  stateChangeDescription: string;
}
```

The input has exactly two fields and the artifact exactly five. It contains no Action Occurrence Claim, Decision, Action Intent, Human Commitment, revision, assessment, recommendation, coherence, before/after state, delta, metric, unit, direction, magnitude, affected actor, performer, executor, assignee, target, effect, outcome, consequence, causal classification, status, rationale, evidence, time, persistence, or relation field. `ACTION OCCURRENCE CLAIM != STATE CHANGE CLAIM`; `ACTION OCCURRENCE CLAIM + STATE CHANGE CLAIM != OUTCOME`. Text, actor, ID, or temporal similarity establishes no relation.

### Closed source union and opaque fields

Only `HUMAN_INPUT` and `AUTHORITATIVE_STATE` are valid State Change Claim sources: `MODEL_PROPOSAL != STATE CHANGE CLAIM SOURCE`; `DETERMINISTIC_DERIVATION != STATE CHANGE CLAIM SOURCE`. `StateChangeClaimSource` is its own semantic type even where its represented shape resembles the occurrence-claim source type: `SAME REPRESENTATION != SAME SEMANTIC ROLE`.

`HUMAN_INPUT` is declared human reporting provenance only, not authenticated identity, authorization, signature, permission, affected actor, performer, executor, assignment, responsibility, ownership, accountability, state-change proof, or truth. `STATE CHANGE CLAIM SOURCE ROLE != AFFECTED ACTOR ROLE`; role non-equivalence does not require actor-ID inequality. No affected-actor field exists.

`AUTHORITATIVE_STATE` is exact `{ origin: "AUTHORITATIVE_STATE", stateReference: { producerId, authorityContractId, artifactId, locator } }`. It stores only that exact governed-state reference. No resolution, reader, resolver, authority validator, evaluator, repository, adapter, payload read, or payload inspection occurs. `REFERENCE != AUTHORITY TOKEN`; `REFERENCE PRESENT != CURRENT SOURCE AUTHORITY`; `CURRENT SOURCE AUTHORITY != SEMANTIC STATE CHANGE SUPPORT`; `SEMANTIC STATE CHANGE SUPPORT != STATE CHANGE FACT`.

Every reference field is a non-blank string, but its exact opaque producer-owned representation is preserved, including surrounding whitespace. Human actor ID and `stateChangeDescription` may trim during creation; references validate non-blankness without normalization. Stored assertion repairs nothing. `stateChangeDescription` is trimmed nonempty opaque text, not before/after state, structured delta, metric, effect, outcome, consequence, taxonomy, status, causal relation, or proof. `STATE CHANGE DESCRIPTION != STRUCTURED DELTA`; `STATE CHANGE DESCRIPTION != EFFECT`; `STATE CHANGE DESCRIPTION != OUTCOME`; `STATE CHANGE DESCRIPTION != CAUSAL RELATION`. Phase 8C1 represents no temporal claim: no timestamp, change time, clock, random ID, or scheduling state exists.

### `DSCC_` identity, capture, and assertion

`DSCC_` matches `^DSCC_[0-9A-F]{24}$`: it is the first 24 uppercase hexadecimal characters of SHA-256 over:

```ts
[
  "STATE_CHANGE_CLAIM_V1",
  canonicalSource,
  stateChangeDescription
]
```

`canonicalSource` is `["HUMAN_INPUT", actorId]` or `["AUTHORITATIVE_STATE", [producerId, authorityContractId, artifactId, locator]]`. Object insertion order is non-semantic; every represented source axis and exact reference string is semantic. `DSCC IDENTITY != REAL-WORLD STATE CHANGE IDENTITY`; `DSCC IDENTITY != OUTCOME IDENTITY`; `DSCC IDENTITY != CAUSAL IDENTITY`; `DSCC IDENTITY != TRUTH`; `DSCC IDENTITY != CURRENT SOURCE AUTHORITY`; `DSCC IDENTITY != PERSISTENCE AUTHORITY`.

Construction is deterministic and dependency-free: it captures exact top-level input, then source, then reference under their own shallow descriptor boundaries; canonicalizes only human actor ID and state-change description; preserves authoritative reference values exactly; self-asserts; and returns detached state. The top-level boundary owns `source` and `stateChangeDescription`; the source boundary owns its direct variant shape; the authoritative reference boundary owns its four fields. Boundary-local capture preserves nested semantic error ownership. Accessors, symbols, hidden/non-enumerable fields, extras, invalid objects, and applicable self/cycle state reject without getter execution. Returned state is detached, not asserted deep-frozen.

`assertStateChangeClaim(value)` is self-contained and exact/canonical/non-repairing. `CREATE MAY CANONICALIZE WHERE EXPLICITLY DEFINED; ASSERT MUST NOT REPAIR.` Constructor errors are respectively `...INPUT_INVALID` for malformed top level, `...SOURCE_INVALID` for malformed/unsupported source, `...REFERENCE_INVALID` for malformed authoritative reference, and `...DESCRIPTION_INVALID` for invalid description text. Hostile, malformed, noncanonical, or body-invalid stored state is `ERR_DECISION_STATE_CHANGE_CLAIM_INVALID`; only otherwise valid state with stale/wrong `DSCC_` is `ERR_DECISION_STATE_CHANGE_CLAIM_ID_MISMATCH`.

The runtime surface is exactly `STATE_CHANGE_CLAIM_SCHEMA_VERSION`, `createStateChangeClaim`, and `assertStateChangeClaim`. Public types are exactly `StateChangeClaimSource`, `StateChangeClaimInput`, and `StateChangeClaim`. Exact errors are:

- `ERR_DECISION_STATE_CHANGE_CLAIM_INPUT_INVALID`
- `ERR_DECISION_STATE_CHANGE_CLAIM_SOURCE_INVALID`
- `ERR_DECISION_STATE_CHANGE_CLAIM_REFERENCE_INVALID`
- `ERR_DECISION_STATE_CHANGE_CLAIM_DESCRIPTION_INVALID`
- `ERR_DECISION_STATE_CHANGE_CLAIM_INVALID`
- `ERR_DECISION_STATE_CHANGE_CLAIM_ID_MISMATCH`

Phase 8C1 adds no persistence or authority-of-record operation: `STATE CHANGE CLAIM ARTIFACT != PERSISTENCE AUTHORITY`; persisted state, if introduced under a separate contract, would not imply real-world truth. `PERSISTED != TRUE`; persistence is governed record authority, not state-change fact. The contract is independently constructed and does not reuse or generalize `lib/career/decisions/outcome.ts`, `OutcomeRecord`, `OutcomeState`, action ID/actor/occurrence-time/evidence fields, SUCCESS/FAILURE domain states, date/random identity, temporal Action-to-Outcome invariants, or legacy feedback attribution. `LEGACY OUTCOME RECORD != STATE CHANGE CLAIM`.

## Phase 8C2 action-state-change-association-proposal contract

Phase 8C2 adds `ActionStateChangeAssociationProposal` under `lib/decision-core/action-state-change-association/`. It represents only one explicit provenance-attributed proposal associating one complete sealed `ActionOccurrenceClaim` and one complete sealed `StateChangeClaim`. `ACTION OCCURRENCE CLAIM + STATE CHANGE CLAIM != ASSOCIATION`. The proposal is not relation truth, outcome, effect, consequence, attribution, causation, causal support, semantic support, current authority, authority of reality, persistence authority, temporal relation, Action fact, or State Change fact.

```ts
type ActionStateChangeAssociationProvenance =
  | { origin: "HUMAN_INPUT"; actorId: string }
  | { origin: "MODEL_PROPOSAL"; proposalRef: string }
  | { origin: "AUTHORITATIVE_STATE"; stateReference: AuthoritativeStateReference };

interface ActionStateChangeAssociationProposalInput {
  actionOccurrenceClaim: ActionOccurrenceClaim;
  stateChangeClaim: StateChangeClaim;
  provenance: ActionStateChangeAssociationProvenance;
}

interface ActionStateChangeAssociationProposal {
  artifactKind: "ACTION_STATE_CHANGE_ASSOCIATION_PROPOSAL";
  schemaVersion: "ACTION_STATE_CHANGE_ASSOCIATION_PROPOSAL_V1";
  actionStateChangeAssociationProposalId: string;
  actionOccurrenceClaim: ActionOccurrenceClaim;
  stateChangeClaim: StateChangeClaim;
  provenance: ActionStateChangeAssociationProvenance;
}
```

The input has exactly three fields and the artifact exactly six. It contains no `kind`, `relationKind`, outcome, effect, consequence, attribution, causal field, rationale, status, confidence, score, priority, time, repository, or persistence metadata. There is no relation-kind taxonomy. `STRUCTURAL RELATION PROPOSAL != ACTION STATE CHANGE ASSOCIATION PROPOSAL`; Phase 8C2 does not reuse, generalize, replace, or extend the sealed context-bound `StructuralRelationProposal` contract.

### Sealed endpoints and closed provenance

Construction consumes exactly one complete sealed Action Occurrence Claim in its action endpoint role and one complete sealed State Change Claim in its state-change endpoint role. Their public assertion contracts are used; construction does not repair them. Endpoint coexistence, text equality, actor equality, source-origin equality, ID similarity, temporal proximity, or temporal order does not infer association. Endpoint actor/source equality and inequality are both admitted. The explicit proposal construction is what creates represented proposal state.

The closed provenance union is exactly `HUMAN_INPUT | MODEL_PROPOSAL | AUTHORITATIVE_STATE`; `DETERMINISTIC_DERIVATION` is not admitted. `ActionStateChangeAssociationProvenance` is its own semantic type: `SAME REPRESENTATION != SAME SEMANTIC ROLE`. Human `actorId` and model `proposalRef` are trimmed nonempty text at construction and must already be canonical when stored. They represent provenance only: neither establishes authenticated identity, authorization, publication authority, responsibility, ownership, accountability, relation truth, outcome, effect, attribution, or causation. `MODEL PROPOSAL != PUBLICATION AUTHORITY`.

`AUTHORITATIVE_STATE` stores only `{ producerId, authorityContractId, artifactId, locator }`. Each is a non-blank string, while the exact opaque represented strings are preserved without trimming or normalization: `VALIDATE NON-BLANKNESS + PRESERVE EXACT REPRESENTATION`. No reader, resolver, authority validator, repository, adapter, payload inspection, semantic evaluator, model/provider invocation, or persistence operation occurs. `REFERENCE != AUTHORITY TOKEN`; `REFERENCE PRESENT != CURRENT SOURCE AUTHORITY`; `PROVENANCE != SUPPORT`; `CURRENT SOURCE AUTHORITY != ASSOCIATION TRUTH`.

### `DASCA_` identity, capture, and assertion

`DASCA_` matches `^DASCA_[0-9A-F]{24}$`: it is the first 24 uppercase hexadecimal SHA-256 characters over:

```ts
[
  "ACTION_STATE_CHANGE_ASSOCIATION_PROPOSAL_V1",
  actionOccurrenceClaim.actionOccurrenceClaimId,
  stateChangeClaim.stateChangeClaimId,
  canonicalProvenance
]
```

Canonical provenance is `['HUMAN_INPUT', actorId]`, `['MODEL_PROPOSAL', proposalRef]`, or `['AUTHORITATIVE_STATE', [producerId, authorityContractId, artifactId, locator]]`. The endpoint roles are ordered and are not sorted. Object insertion order is non-semantic; changing either endpoint ID or canonical provenance changes identity. Exact authoritative-reference strings are identity-bearing. `DASCA IDENTITY != RELATION TRUTH`; `DASCA IDENTITY != OUTCOME IDENTITY`; `DASCA IDENTITY != CAUSAL IDENTITY`; `DASCA IDENTITY != PERSISTENCE AUTHORITY`.

Construction uses boundary-local shallow descriptor capture: the top level owns both endpoints and provenance, provenance owns its direct variant shape, and the authoritative reference owns its four fields. Valid nested claims are cloned and the returned proposal is detached. Accessors, symbol keys, hidden/non-enumerable fields, extras, invalid objects, and hostile nested claims reject without getter execution where applicable. This is not a deep-freeze claim. `CREATE MAY CANONICALIZE WHERE EXPLICITLY DEFINED`; `CREATE MUST NOT REPAIR CLAIMS`; `ASSERT MUST NOT REPAIR`.

`assertActionStateChangeAssociationProposal(value)` is self-contained, exact, canonical, and non-repairing. Constructor failures are `...INPUT_INVALID` for malformed top level, `...ACTION_CLAIM_INVALID` for invalid/hostile Action Occurrence Claim, `...STATE_CHANGE_CLAIM_INVALID` for invalid/hostile State Change Claim, `...PROVENANCE_INVALID` for malformed/unsupported provenance, and `...REFERENCE_INVALID` for malformed authoritative provenance reference. Hostile, malformed, noncanonical, nested-claim-invalid, or body-invalid stored state is `ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_INVALID`. A stale nested `DAOC_` or `DSCC_` remains outer association invalid. Only otherwise canonical valid state with stale/wrong outer `DASCA_` is `ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_ID_MISMATCH`.

The exact error surface is:

- `ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_INPUT_INVALID`
- `ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_ACTION_CLAIM_INVALID`
- `ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_STATE_CHANGE_CLAIM_INVALID`
- `ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_PROVENANCE_INVALID`
- `ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_REFERENCE_INVALID`
- `ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_INVALID`
- `ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_ID_MISMATCH`

Phase 8C2 represents no temporal relation or association time. It adds no repository, adapter, database, revision, current/head/latest selection, authority-of-record operation, or persistence authority: `ASSOCIATION PROPOSAL != PERSISTENCE AUTHORITY`; `PERSISTED != TRUE`. It is independently constructed and does not reuse or generalize `lib/career/decisions/outcome.ts`, `feedback.ts`, `learning.ts`, `OutcomeRecord`, `OutcomeState`, `FeedbackRecord`, `AttributionRecord`, `AttributionType`, or legacy association/causal vocabulary.

## Phase 8C3 outcome-attribution-proposal contract

Phase 8C3 adds `OutcomeAttributionProposal` under `lib/decision-core/outcome-attribution-proposal/`. It represents only an explicit provenance-attributed proposal that the `StateChangeClaim` already represented in one complete sealed `ActionStateChangeAssociationProposal` has an outcome role relative to that association's represented `ActionOccurrenceClaim`.

```ts
type OutcomeAttributionProvenance =
  | { origin: "HUMAN_INPUT"; actorId: string }
  | { origin: "MODEL_PROPOSAL"; proposalRef: string }
  | { origin: "AUTHORITATIVE_STATE"; stateReference: AuthoritativeStateReference };

interface OutcomeAttributionProposalInput {
  associationProposal: ActionStateChangeAssociationProposal;
  provenance: OutcomeAttributionProvenance;
}

interface OutcomeAttributionProposal {
  artifactKind: "OUTCOME_ATTRIBUTION_PROPOSAL";
  schemaVersion: typeof OUTCOME_ATTRIBUTION_PROPOSAL_SCHEMA_VERSION;
  outcomeAttributionProposalId: string;
  associationProposal: ActionStateChangeAssociationProposal;
  provenance: OutcomeAttributionProvenance;
}
```

The input has exactly two fields and the artifact exactly five. `actionOccurrenceClaim` and `stateChangeClaim` are not duplicated: they remain represented inside the sealed association predecessor. There are no outcome-state, effect, consequence, causal, rationale, status, confidence, score, priority, evaluation, evidence, temporal, repository, or persistence fields. `ASSOCIATION PROPOSAL != OUTCOME ATTRIBUTION PROPOSAL`; `ASSOCIATION != OUTCOME ATTRIBUTION`; `ACTION OCCURRENCE CLAIM + STATE CHANGE CLAIM + ASSOCIATION PROPOSAL != OUTCOME ATTRIBUTION PROPOSAL`; `OUTCOME ATTRIBUTION PROPOSAL != OUTCOME TRUTH`; `OUTCOME ATTRIBUTION PROPOSAL != RELATION TRUTH`; `OUTCOME ATTRIBUTION PROPOSAL != CAUSAL CLAIM`; `OUTCOME ATTRIBUTION != CAUSATION`.

### Sealed association predecessor and closed provenance

Construction consumes exactly one complete sealed `ActionStateChangeAssociationProposal` and validates it through `assertActionStateChangeAssociationProposal(...)`. It does not repair, reinterpret, or reconstruct its embedded claims. `ASSOCIATION PROPOSAL EXISTENCE != OUTCOME ATTRIBUTION PROPOSAL EXISTENCE`: explicit Phase 8C3 construction and new represented provenance are required.

The closed provenance union is exactly `HUMAN_INPUT | MODEL_PROPOSAL | AUTHORITATIVE_STATE`; `DETERMINISTIC_DERIVATION` is not admitted. `OutcomeAttributionProvenance` is its own semantic type: `SAME REPRESENTATION != SAME SEMANTIC ROLE`. The association and outcome-attribution provenance may have the same concrete source or different concrete sources; neither equality nor inequality is required or inferred.

Human `actorId` and model `proposalRef` are trimmed nonempty strings at construction and must already be canonical when stored. They represent proposal provenance only, not authenticated identity, authorization, signature, responsibility, ownership, accountability, performer role, outcome truth, relation truth, or causal authority. `MODEL PROPOSAL != PUBLICATION AUTHORITY`; `MODEL PROPOSAL != OUTCOME TRUTH`; `MODEL PROPOSAL != CAUSAL AUTHORITY`.

`AUTHORITATIVE_STATE` stores only `{ producerId, authorityContractId, artifactId, locator }`. Every field is a non-blank string, but each exact opaque represented value is preserved without trimming or normalization: `VALIDATE NON-BLANKNESS + PRESERVE EXACT REPRESENTATION`. No reader, resolver, authority validator, repository, adapter, payload inspection, semantic evaluator, model/provider, or persistence call occurs. `REFERENCE != AUTHORITY TOKEN`; `REFERENCE PRESENT != CURRENT SOURCE AUTHORITY`; `PROVENANCE != SUPPORT`; `CURRENT SOURCE AUTHORITY != OUTCOME TRUTH`.

### `DOATP_` identity, capture, and assertion

`DOATP_` matches `^DOATP_[0-9A-F]{24}$`: it is the first 24 uppercase hexadecimal SHA-256 characters over:

```ts
[
  "OUTCOME_ATTRIBUTION_PROPOSAL_V1",
  associationProposal.actionStateChangeAssociationProposalId,
  canonicalProvenance
]
```

Canonical provenance is `['HUMAN_INPUT', actorId]`, `['MODEL_PROPOSAL', proposalRef]`, or `['AUTHORITATIVE_STATE', [producerId, authorityContractId, artifactId, locator]]`. Object insertion order is non-semantic; the sealed association identity and complete canonical provenance are identity-bearing, and exact authoritative reference strings remain identity-bearing. `DOATP IDENTITY != OUTCOME TRUTH`; `DOATP IDENTITY != RELATION TRUTH`; `DOATP IDENTITY != CAUSAL IDENTITY`; `DOATP IDENTITY != PERSISTENCE AUTHORITY`.

Construction uses boundary-local shallow descriptor capture: the top level owns `associationProposal` and `provenance`; provenance owns its direct variant shape; the authoritative reference owns its four fields. Nested association validity is delegated through the sealed public assertion contract. Construction does not repair the predecessor, and stored assertion repairs nothing. Accessors, symbol keys, hidden/non-enumerable fields, extras, invalid predecessor state, and hostile nested claim state reject without getter execution where applicable. The returned artifact is detached; this is not a deep-freeze claim. `CREATE MAY CANONICALIZE WHERE EXPLICITLY DEFINED`; `CREATE MUST NOT REPAIR PREDECESSOR`; `ASSERT MUST NOT REPAIR`.

`assertOutcomeAttributionProposal(value)` is self-contained, exact, canonical, and non-repairing. Constructor failures are `...INPUT_INVALID` for malformed top level, `...ASSOCIATION_PROPOSAL_INVALID` for invalid, hostile, or stale sealed association state, `...PROVENANCE_INVALID` for malformed/unsupported provenance, and `...REFERENCE_INVALID` for malformed authoritative provenance reference. Hostile, malformed, noncanonical, nested-association-invalid, nested-claim-invalid, or body-invalid stored state is `ERR_DECISION_OUTCOME_ATTRIBUTION_INVALID`. Only otherwise canonical valid state with stale/wrong outer `DOATP_` is `ERR_DECISION_OUTCOME_ATTRIBUTION_ID_MISMATCH`.

The exact error surface is:

- `ERR_DECISION_OUTCOME_ATTRIBUTION_INPUT_INVALID`
- `ERR_DECISION_OUTCOME_ATTRIBUTION_ASSOCIATION_PROPOSAL_INVALID`
- `ERR_DECISION_OUTCOME_ATTRIBUTION_PROVENANCE_INVALID`
- `ERR_DECISION_OUTCOME_ATTRIBUTION_REFERENCE_INVALID`
- `ERR_DECISION_OUTCOME_ATTRIBUTION_INVALID`
- `ERR_DECISION_OUTCOME_ATTRIBUTION_ID_MISMATCH`

Phase 8C3 represents no outcome-state taxonomy, time, temporal relation, effect truth, consequence truth, causation, causal support, relation truth, or outcome truth. `TEMPORAL ORDER != OUTCOME ATTRIBUTION`; `TEMPORAL ORDER != CAUSATION`. It adds no repository, adapter, database, persister, revision, current/head/latest selection, authority-of-record operation, or persistence authority: `OUTCOME ATTRIBUTION PROPOSAL != PERSISTENCE AUTHORITY`; `PERSISTED != TRUE`. Persistence, if separately introduced later, would establish governed record authority only, not outcome truth. The contract is independently reconstructed and does not reuse or generalize `lib/career/decisions/outcome.ts`, `feedback.ts`, `learning.ts`, `OutcomeRecord`, `OutcomeState`, `FeedbackRecord`, `AttributionRecord`, `AttributionType`, `ASSOCIATED_WITH`, `SUPPORTS`, `CONTRADICTS`, or `CAUSAL_CLAIM`.

## Phase 8D1 decision-context-observation-proposal contract

Phase 8D1 adds `DecisionContextObservationProposal` under `lib/decision-core/context-observation-proposal/`. It represents only one explicit provenance-attributed opaque statement, based on one complete sealed `OutcomeAttributionProposal`, as an `OBSERVATION`-role candidate for a future Decision Context.

```ts
type DecisionContextObservationProposalProvenance =
  | { origin: "HUMAN_INPUT"; actorId: string }
  | { origin: "MODEL_PROPOSAL"; proposalRef: string }
  | { origin: "AUTHORITATIVE_STATE"; stateReference: AuthoritativeStateReference };

interface DecisionContextObservationProposalInput {
  outcomeAttributionProposal: OutcomeAttributionProposal;
  statement: string;
  provenance: DecisionContextObservationProposalProvenance;
}

interface DecisionContextObservationProposal {
  artifactKind: "DECISION_CONTEXT_OBSERVATION_PROPOSAL";
  schemaVersion: typeof DECISION_CONTEXT_OBSERVATION_PROPOSAL_SCHEMA_VERSION;
  decisionContextObservationProposalId: string;
  outcomeAttributionProposal: OutcomeAttributionProposal;
  statement: string;
  provenance: DecisionContextObservationProposalProvenance;
}
```

The input has exactly three fields and the artifact exactly six. The candidate target role is semantically `OBSERVATION`, but no `DecisionContextItem` exists. There is no `role`, `itemId`, `contextId`, `revisionId`, `previousRevisionId`, feedback, evaluation, support, status, confidence, score, priority, truth, time, repository, or persistence field. `OUTCOME ATTRIBUTION PROPOSAL != DECISION CONTEXT OBSERVATION PROPOSAL`; `DECISION CONTEXT OBSERVATION PROPOSAL != DECISION CONTEXT ITEM`; `DECISION CONTEXT OBSERVATION PROPOSAL != DECISION CONTEXT`; `DECISION CONTEXT OBSERVATION PROPOSAL != DECISION CONTEXT REVISION`.

### Sealed predecessor, statement, and provenance

Construction consumes exactly one complete sealed `OutcomeAttributionProposal` and validates it only through `assertOutcomeAttributionProposal(...)`. It does not repair or reinterpret it and does not independently reconstruct its nested association or claims. `OUTCOME ATTRIBUTION PROPOSAL EXISTENCE != DECISION CONTEXT OBSERVATION PROPOSAL EXISTENCE`: explicit Phase 8D1 construction, statement, and provenance are required.

`statement` is required opaque text. Construction trims it and requires it nonempty; stored assertion requires the already canonical trimmed representation. It is identity-bearing and is not derived from predecessor descriptions, IDs, association or attribution semantics, or similarity. `OUTCOME ATTRIBUTION PROPOSAL != OBSERVATION STATEMENT`.

The closed provenance union is exactly `HUMAN_INPUT | MODEL_PROPOSAL | AUTHORITATIVE_STATE`; `DETERMINISTIC_DERIVATION` is not admitted. `DecisionContextObservationProposalProvenance` is its own semantic type: `SAME REPRESENTATION != SAME SEMANTIC ROLE`. Human `actorId` and model `proposalRef` are trimmed nonempty strings at construction and must already be canonical when stored. They represent provenance only, not authenticated identity, authorization, signature, observation truth, outcome truth, support, responsibility, ownership, or accountability. `MODEL PROPOSAL != PUBLICATION AUTHORITY`; `MODEL PROPOSAL != OBSERVATION TRUTH`; `MODEL PROPOSAL != OUTCOME TRUTH`.

`AUTHORITATIVE_STATE` stores only `{ producerId, authorityContractId, artifactId, locator }`. Every field is a non-blank string, but each exact opaque represented value is preserved without trimming or normalization: `VALIDATE NON-BLANKNESS + PRESERVE EXACT REPRESENTATION`. No reader, resolver, payload inspection, authority validator, evaluator, repository, context constructor, revision operation, or persistence operation occurs. `REFERENCE != AUTHORITY TOKEN`; `REFERENCE PRESENT != CURRENT SOURCE AUTHORITY`; `CURRENT SOURCE AUTHORITY != OBSERVATION TRUTH`; `PROVENANCE != SUPPORT`.

### `DCOP_` identity, capture, and assertion

`DCOP_` matches `^DCOP_[0-9A-F]{24}$`: it is the first 24 uppercase hexadecimal SHA-256 characters over:

```ts
[
  "DECISION_CONTEXT_OBSERVATION_PROPOSAL_V1",
  outcomeAttributionProposal.outcomeAttributionProposalId,
  statement,
  canonicalProvenance
]
```

Canonical provenance is `['HUMAN_INPUT', actorId]`, `['MODEL_PROPOSAL', proposalRef]`, or `['AUTHORITATIVE_STATE', [producerId, authorityContractId, artifactId, locator]]`. Object insertion order is non-semantic; the sealed predecessor identity, statement, and complete canonical provenance are identity-bearing, and exact authoritative reference strings remain identity-bearing. `DCOP IDENTITY != OBSERVATION TRUTH`; `DCOP IDENTITY != CONTEXT ADMISSION`; `DCOP IDENTITY != REVISION IDENTITY`; `DCOP IDENTITY != OUTCOME TRUTH`; `DCOP IDENTITY != PERSISTENCE AUTHORITY`.

Construction uses boundary-local shallow descriptor capture: the top level owns `outcomeAttributionProposal`, `statement`, and `provenance`; provenance owns only its direct variant shape; the authoritative reference owns its four fields. Nested predecessor validity is delegated only through the sealed public assertion contract. Construction does not repair predecessor state, and stored assertion repairs nothing. Accessors, symbol keys, hidden/non-enumerable fields, extras, hostile nested association state, hostile nested `ActionOccurrenceClaim`, and hostile nested `StateChangeClaim` reject without getter execution. Returned state is detached; this is not a deep-freeze claim. `CREATE MAY CANONICALIZE WHERE EXPLICITLY DEFINED`; `ASSERT MUST NOT REPAIR`.

`assertDecisionContextObservationProposal(value)` is self-contained, exact, canonical, and non-repairing. Constructor failures are `...INPUT_INVALID` for malformed top level, `...OUTCOME_ATTRIBUTION_INVALID` for invalid, hostile, or stale sealed predecessor state, `...STATEMENT_INVALID` for invalid statement, `...PROVENANCE_INVALID` for malformed/unsupported provenance, and `...REFERENCE_INVALID` for malformed authoritative provenance reference. Hostile, malformed, noncanonical, nested-predecessor-invalid, statement-invalid, provenance-invalid, reference-invalid, or body-invalid stored state is `ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_INVALID`. Only otherwise canonical valid state with stale/wrong outer `DCOP_` is `ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_ID_MISMATCH`.

The exact error surface is:

- `ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_INPUT_INVALID`
- `ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_OUTCOME_ATTRIBUTION_INVALID`
- `ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_STATEMENT_INVALID`
- `ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_PROVENANCE_INVALID`
- `ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_REFERENCE_INVALID`
- `ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_INVALID`
- `ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_ID_MISMATCH`

Phase 8D1 performs no Decision Context admission, `DecisionContextItem` materialization, revision creation, Feedback, Learning, truth promotion, semantic support, causation, time, or persistence operation. `OBSERVATION ROLE != OBSERVED REALITY`; `OBSERVATION PROPOSAL != OBSERVATION TRUTH`; `REENTRY PROPOSAL != ADMISSION`; `REENTRY PROPOSAL != REVISION`; `REENTRY PROPOSAL != LOOP CLOSED`; `REENTRY != OUTCOME TRUTH`; `REENTRY != SEMANTIC SUPPORT`; `PERSISTED != TRUE`. It is independently constructed and does not reuse or generalize legacy Career outcome, feedback, or learning semantics.
