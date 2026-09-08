import { assertCandidateCapabilityOperand, type CandidateCapabilityOperand } from "../../capability-core/relation-operand";
import { assertTargetRequirementRevision, type TargetRequirementRevision } from "../../target/role/requirement";
import { candidateLocatorFromOperand, createCapabilityRequirementRelation, createCapabilityRequirementRelationEvaluationResult, createCapabilityRequirementRelationEvaluationRun, createCapabilityRequirementRelationRawProviderOutputArtifact, deriveCapabilityRequirementRelationId, targetRequirementEvidenceQuotes } from "./contract";
import type { CapabilityRequirementEvidencePolicy, CapabilityRequirementLevelPolicy, CapabilityRequirementRelation, CapabilityRequirementRelationEvaluation, CapabilityRequirementRelationProducerLineage, CapabilityRequirementRelationProvider, CapabilityRequirementRelationProviderEvaluation, CapabilityRequirementScopePolicy, EvidenceSufficiency, LevelRelation, ScopeRelation } from "./types";
import type { CapabilityRequirementRelationRepository } from "./persistence";

const fail = (code: string): never => { throw new Error(code); };
const exact = (value: unknown, keys: string[]): Record<string, unknown> => { if (!value || typeof value !== "object" || Array.isArray(value)) return fail("ERR_CAPABILITY_REQUIREMENT_RELATION_PROVIDER_OUTPUT_INVALID"); const item = value as Record<string, unknown>, actual = Object.keys(item).sort(), expected = [...keys].sort(); if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) return fail("ERR_CAPABILITY_REQUIREMENT_RELATION_PROVIDER_OUTPUT_INVALID"); return item; };
const text = (value: unknown): value is string => typeof value === "string" && value.length > 0;
const unique = (value: unknown): value is string[] => Array.isArray(value) && value.every(text) && new Set(value).size === value.length;
const semantic = new Set(["SEMANTIC_EQUIVALENT", "SEMANTIC_CANDIDATE_COVERS_REQUIREMENT", "SEMANTIC_PARTIAL", "SEMANTIC_DISTINCT", "SEMANTIC_UNKNOWN"]);
const evidence = new Set(["EVIDENCE_SUFFICIENT", "EVIDENCE_INSUFFICIENT", "EVIDENCE_UNKNOWN"]);
const scope = new Set(["SCOPE_COMPATIBLE", "SCOPE_PARTIAL", "SCOPE_INCOMPATIBLE", "SCOPE_NOT_APPLICABLE", "SCOPE_UNKNOWN"]);

export interface CapabilityRequirementRelationProducerDependencies {
  repository: CapabilityRequirementRelationRepository;
  provider: CapabilityRequirementRelationProvider;
  lineage: CapabilityRequirementRelationProducerLineage;
  levelPolicy: CapabilityRequirementLevelPolicy;
  evidencePolicy: CapabilityRequirementEvidencePolicy;
  scopePolicy: CapabilityRequirementScopePolicy;
  now?: () => string;
}

function assertLineage(deps: CapabilityRequirementRelationProducerDependencies): void {
  if (!text(deps.lineage.relationProducerVersion) || !text(deps.lineage.requirementAdmissionPolicyVersion) || !text(deps.lineage.semanticPolicyVersion) || deps.levelPolicy.version !== deps.lineage.levelPolicyVersion || deps.evidencePolicy.version !== deps.lineage.evidencePolicyVersion || deps.scopePolicy.version !== deps.lineage.scopePolicyVersion || !text(deps.lineage.promptChecksum) || !text(deps.lineage.provider) || !text(deps.lineage.model) || !text(deps.lineage.outputSchemaVersion)) fail("ERR_CAPABILITY_REQUIREMENT_RELATION_OPERAND_INVALID");
}
function admitCandidate(value: CandidateCapabilityOperand): void {
  try { assertCandidateCapabilityOperand(value); } catch { return fail("ERR_CAPABILITY_REQUIREMENT_RELATION_OPERAND_INVALID"); }
  if (value.authority.publicationState !== "PHASE4_VERIFIED" || value.authority.relationEligibilityState !== "RELATION_ELIGIBLE") fail("ERR_CAPABILITY_REQUIREMENT_RELATION_CANDIDATE_OPERAND_INELIGIBLE");
}
function admitRequirement(value: TargetRequirementRevision): void {
  try { assertTargetRequirementRevision(value); } catch { return fail("ERR_CAPABILITY_REQUIREMENT_RELATION_OPERAND_INVALID"); }
  if (value.requirement.requirementType !== "CAPABILITY" || value.matchingEligibility === "MATCHING_INELIGIBLE") fail("ERR_CAPABILITY_REQUIREMENT_RELATION_TARGET_REQUIREMENT_INELIGIBLE");
  if (value.matchingEligibility !== "MATCHING_ELIGIBLE_PROPOSAL_ONLY") fail("ERR_CAPABILITY_REQUIREMENT_RELATION_TARGET_REQUIREMENT_ELIGIBILITY_UNKNOWN");
  if (value.proposalState !== "PROPOSAL_ONLY" || value.authorityState !== "NONE") fail("ERR_CAPABILITY_REQUIREMENT_RELATION_TARGET_REQUIREMENT_INELIGIBLE");
}
function providerEvaluation(value: unknown, candidate: CandidateCapabilityOperand, target: TargetRequirementRevision): CapabilityRequirementRelationProviderEvaluation {
  const x = exact(value, ["candidateCapabilityOperandId", "targetRequirementRevisionId", "semanticRelation", "evidenceAssessment", "scopeAssessment", "evidenceBasis"]);
  if (x.candidateCapabilityOperandId !== candidate.candidateCapabilityOperandId || x.targetRequirementRevisionId !== target.targetRequirementRevisionId || !semantic.has(x.semanticRelation as string) || !evidence.has(x.evidenceAssessment as string) || !scope.has(x.scopeAssessment as string)) fail("ERR_CAPABILITY_REQUIREMENT_RELATION_PROVIDER_OUTPUT_INVALID");
  const basis = exact(x.evidenceBasis, ["candidateEvidenceIds", "targetRequirementEvidenceQuotes"]);
  if (!unique(basis.candidateEvidenceIds) || !unique(basis.targetRequirementEvidenceQuotes) || !basis.candidateEvidenceIds.length || !basis.targetRequirementEvidenceQuotes.length || basis.candidateEvidenceIds.some(id => !candidate.source.evidenceIds.includes(id)) || basis.targetRequirementEvidenceQuotes.some(quote => !targetRequirementEvidenceQuotes(target).includes(quote))) fail("ERR_CAPABILITY_REQUIREMENT_RELATION_PROVIDER_OUTPUT_INVALID");
  return { candidateCapabilityOperandId: x.candidateCapabilityOperandId as string, targetRequirementRevisionId: x.targetRequirementRevisionId as string, semanticRelation: x.semanticRelation as CapabilityRequirementRelationProviderEvaluation["semanticRelation"], evidenceAssessment: x.evidenceAssessment as EvidenceSufficiency, scopeAssessment: x.scopeAssessment as ScopeRelation, evidenceBasis: { candidateEvidenceIds: [...basis.candidateEvidenceIds as string[]], targetRequirementEvidenceQuotes: [...basis.targetRequirementEvidenceQuotes as string[]] } };
}
function levelRelation(candidate: CandidateCapabilityOperand, target: TargetRequirementRevision, policy: CapabilityRequirementLevelPolicy): LevelRelation {
  const required = target.requirement.requiredLevelState;
  if (required.kind === "NOT_APPLICABLE") return "LEVEL_NOT_APPLICABLE";
  if (required.kind === "UNKNOWN" || required.kind === "UNSUPPORTED_INFERENCE" || target.requiredLevelValidationState !== "SUPPORTED") return "LEVEL_UNKNOWN";
  if (required.kind === "EXPERIENCE_DURATION" || required.kind === "LANGUAGE_PROFICIENCY" || required.kind === "CREDENTIAL_REQUIREMENT") return "LEVEL_NOT_COMPARABLE";
  if (candidate.validation.levelVerificationState !== "VERIFIED" || candidate.capability.demonstratedCapabilityLevel === null) return "LEVEL_UNKNOWN";
  const targetLevel = policy.mapTargetCapabilityLevel(required.level);
  if (targetLevel === null) return "LEVEL_UNKNOWN";
  const levels = ["L1", "L2", "L3", "L4", "L5", "L6"];
  if (!levels.includes(targetLevel)) fail("ERR_CAPABILITY_REQUIREMENT_RELATION_VALIDATION_FAILED");
  const candidateIndex = levels.indexOf(candidate.capability.demonstratedCapabilityLevel), targetIndex = levels.indexOf(targetLevel);
  return candidateIndex === targetIndex ? "LEVEL_MEETS" : candidateIndex > targetIndex ? "LEVEL_EXCEEDS" : "LEVEL_BELOW";
}
function scopeRelation(candidate: CandidateCapabilityOperand, target: TargetRequirementRevision, proposed: ScopeRelation, policy: CapabilityRequirementScopePolicy): ScopeRelation {
  const context = target.requirement.scopeContextState;
  if (context.kind === "NOT_APPLICABLE") return "SCOPE_NOT_APPLICABLE";
  if (context.kind === "UNKNOWN") return "SCOPE_UNKNOWN";
  const output = policy.assess({ proposed, candidate: { structuralDefinition: candidate.capability.structuralDefinition, primaryDomain: candidate.capability.primaryDomain }, targetScope: context });
  if (!scope.has(output) || !["SCOPE_COMPATIBLE", "SCOPE_PARTIAL", "SCOPE_INCOMPATIBLE", "SCOPE_UNKNOWN"].includes(output)) fail("ERR_CAPABILITY_REQUIREMENT_RELATION_VALIDATION_FAILED");
  return output;
}
function evidenceSufficiency(proposed: EvidenceSufficiency, basis: CapabilityRequirementRelationProviderEvaluation["evidenceBasis"], policy: CapabilityRequirementEvidencePolicy): EvidenceSufficiency {
  const output = policy.assess({ proposed, candidateEvidenceIds: basis.candidateEvidenceIds, targetRequirementEvidenceQuotes: basis.targetRequirementEvidenceQuotes });
  if (!evidence.has(output)) fail("ERR_CAPABILITY_REQUIREMENT_RELATION_VALIDATION_FAILED");
  return output;
}

async function persistFailure(candidate: CandidateCapabilityOperand, target: TargetRequirementRevision, deps: CapabilityRequirementRelationProducerDependencies, status: "PRODUCER_FAILED" | "PROVIDER_OUTPUT_INVALID" | "VALIDATION_FAILED", code: string, timestamp: string, raw: { rawProviderOutputRef: string; rawProviderOutputHash: string } | null = null): Promise<never> {
  const run = await deps.repository.persistRun(createCapabilityRequirementRelationEvaluationRun({ candidate: candidateLocatorFromOperand(candidate), targetRequirementRevisionId: target.targetRequirementRevisionId, producer: deps.lineage, status, rawProviderOutputRef: raw?.rawProviderOutputRef ?? null, rawProviderOutputHash: raw?.rawProviderOutputHash ?? null, failureCode: code, schemaVersion: "CAPABILITY_REQUIREMENT_RELATION_EVALUATION_RUN_V1", startedAt: timestamp, completedAt: timestamp }));
  await deps.repository.persistResult(createCapabilityRequirementRelationEvaluationResult({ capabilityRequirementRelationEvaluationRunId: run.capabilityRequirementRelationEvaluationRunId, candidate: run.candidate, targetRequirementRevisionId: target.targetRequirementRevisionId, resultState: "FAILED", evaluation: null, failureCode: code, schemaVersion: "CAPABILITY_REQUIREMENT_RELATION_EVALUATION_RESULT_V1", createdAt: timestamp }));
  return fail(`ERR_CAPABILITY_REQUIREMENT_RELATION_${code}`);
}

/** Active T6B producer. Legacy matching is deliberately absent; provider output never supplies identity or authority. */
export async function produceCapabilityRequirementRelation(candidate: CandidateCapabilityOperand, target: TargetRequirementRevision, deps: CapabilityRequirementRelationProducerDependencies): Promise<CapabilityRequirementRelation> {
  assertLineage(deps); admitCandidate(candidate); admitRequirement(target);
  const locator = candidateLocatorFromOperand(candidate);
  const identity = deriveCapabilityRequirementRelationId({ operands: { candidate: locator, targetRequirementRevisionId: target.targetRequirementRevisionId }, lineage: deps.lineage, schemaVersion: "CAPABILITY_REQUIREMENT_RELATION_V1" });
  const existing = await deps.repository.getRelationById(identity);
  if (existing !== null) return existing;
  const timestamp = (deps.now ?? (() => new Date().toISOString()))();
  let response: { rawOutput: string; evaluation: unknown };
  try { response = await deps.provider.execute({ candidateCapabilityOperandId: candidate.candidateCapabilityOperandId, targetRequirementRevisionId: target.targetRequirementRevisionId, candidate: { canonicalName: candidate.capability.canonicalName, structuralDefinition: candidate.capability.structuralDefinition, primaryDomain: candidate.capability.primaryDomain }, requirement: { capabilityExpression: target.requirement.capabilityExpression, structuralDefinition: target.requirement.structuralDefinition, normalizedStatement: target.requirement.normalizedStatement } }); } catch { return persistFailure(candidate, target, deps, "PRODUCER_FAILED", "PRODUCER_FAILED", timestamp); }
  if (!response || typeof response.rawOutput !== "string") return persistFailure(candidate, target, deps, "PROVIDER_OUTPUT_INVALID", "PROVIDER_OUTPUT_INVALID", timestamp);
  const raw = await deps.repository.persistRawProviderOutput(createCapabilityRequirementRelationRawProviderOutputArtifact({ rawProviderOutput: response.rawOutput, schemaVersion: "CAPABILITY_REQUIREMENT_RELATION_RAW_PROVIDER_OUTPUT_V1", createdAt: timestamp }));
  let proposed: CapabilityRequirementRelationProviderEvaluation;
  try { proposed = providerEvaluation(response.evaluation, candidate, target); } catch { return persistFailure(candidate, target, deps, "PROVIDER_OUTPUT_INVALID", "PROVIDER_OUTPUT_INVALID", timestamp, raw); }
  let evaluation: CapabilityRequirementRelationEvaluation;
  try {
    const evidenceState = evidenceSufficiency(proposed.evidenceAssessment, proposed.evidenceBasis, deps.evidencePolicy);
    if (proposed.semanticRelation === "SEMANTIC_DISTINCT" && evidenceState !== "EVIDENCE_SUFFICIENT") return persistFailure(candidate, target, deps, "VALIDATION_FAILED", "VALIDATION_FAILED", timestamp, raw);
    evaluation = { semanticRelation: proposed.semanticRelation, levelRelation: levelRelation(candidate, target, deps.levelPolicy), evidenceSufficiency: evidenceState, scopeRelation: scopeRelation(candidate, target, proposed.scopeAssessment, deps.scopePolicy), composition: { mode: "SINGLE_OPERAND", state: "COMPOSITION_NOT_EVALUATED" }, evidenceBasis: proposed.evidenceBasis };
  } catch { return persistFailure(candidate, target, deps, "VALIDATION_FAILED", "VALIDATION_FAILED", timestamp, raw); }
  const run = await deps.repository.persistRun(createCapabilityRequirementRelationEvaluationRun({ candidate: locator, targetRequirementRevisionId: target.targetRequirementRevisionId, producer: deps.lineage, status: "COMPLETED", rawProviderOutputRef: raw.rawProviderOutputRef, rawProviderOutputHash: raw.rawProviderOutputHash, failureCode: null, schemaVersion: "CAPABILITY_REQUIREMENT_RELATION_EVALUATION_RUN_V1", startedAt: timestamp, completedAt: timestamp }));
  const result = await deps.repository.persistResult(createCapabilityRequirementRelationEvaluationResult({ capabilityRequirementRelationEvaluationRunId: run.capabilityRequirementRelationEvaluationRunId, candidate: locator, targetRequirementRevisionId: target.targetRequirementRevisionId, resultState: "COMPLETED", evaluation, failureCode: null, schemaVersion: "CAPABILITY_REQUIREMENT_RELATION_EVALUATION_RESULT_V1", createdAt: timestamp }));
  const relation = createCapabilityRequirementRelation({ operands: { candidate: locator, targetRequirementRevisionId: target.targetRequirementRevisionId }, evaluation, evaluationState: "COMPLETED", proposalState: "PROPOSAL_ONLY", authorityState: "NONE", lineage: { capabilityRequirementRelationEvaluationResultId: result.capabilityRequirementRelationEvaluationResultId, relationProducerVersion: deps.lineage.relationProducerVersion, requirementAdmissionPolicyVersion: deps.lineage.requirementAdmissionPolicyVersion, semanticPolicyVersion: deps.lineage.semanticPolicyVersion, levelPolicyVersion: deps.lineage.levelPolicyVersion, scopePolicyVersion: deps.lineage.scopePolicyVersion, evidencePolicyVersion: deps.lineage.evidencePolicyVersion }, schemaVersion: "CAPABILITY_REQUIREMENT_RELATION_V1", createdAt: timestamp });
  if (relation.capabilityRequirementRelationId !== identity) fail("ERR_CAPABILITY_REQUIREMENT_RELATION_PERSISTENCE_INVALID");
  return deps.repository.persistRelation(relation);
}
