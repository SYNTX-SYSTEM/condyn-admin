import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createDecisionAuthorityGrantRevision } from "../../../../lib/career/relation/decision-authority";
import { createCareerDecisionContextRevision } from "../../../../lib/career/relation/decision-context";
import { deriveEvolutionInputStateId } from "../../../../lib/career/relation/evolution-input";
import { deriveRecommendationPolicyRevisionId, deriveRecommendationProposal } from "../../../../lib/career/relation/recommendation-proposal";
import { createHumanDecisionRecord } from "../../../../lib/career/relation/decision-record";

const domainPath = "../../../../lib/career/relation/action-intent";
const sourcePath = resolve(process.cwd(), "lib/career/relation/action-intent/index.ts");
const stamp = "2027-02-01T00:00:00.000Z";
const later = "2027-02-02T00:00:00.000Z";

async function domain(): Promise<any> {
  return import(domainPath);
}

const authority = createDecisionAuthorityGrantRevision({
  grantorActorId: "GRANTOR_DAINT",
  authorizedActorId: "DECIDER_DAINT",
  authorityScope: "CAREER_RECOMMENDATION_DECISION",
  permittedDecisionClasses: ["ACCEPT_RECOMMENDATION", "DEFER_DECISION", "REJECT_RECOMMENDATION", "REQUEST_FURTHER_EVIDENCE", "REQUEST_TARGET_CLARIFICATION"],
  permittedSubjectKinds: ["RCP_ITEM"],
  authorityEvidenceRefs: ["evidence://grant/daint"],
  declaredAt: stamp,
  effectiveFrom: stamp,
  effectiveUntil: null,
  createdAt: stamp,
});

const policySemantic = {
  provenance: { origin: "EXPLICIT_POLICY_DECLARATION" as const, actorId: "POLICY_DAINT", authorityEvidenceRef: "evidence://policy/daint" },
  rules: [
    { evolutionInputClass: "INCREASE_DEMONSTRATED_LEVEL_INPUT" as const, action: "PROPOSE" as const, recommendationKind: "DEMONSTRATED_LEVEL_RECOMMENDATION" as const },
    { evolutionInputClass: "RESOLVE_SEMANTIC_UNCERTAINTY_INPUT" as const, action: "PROPOSE" as const, recommendationKind: "SEMANTIC_UNCERTAINTY_RESOLUTION_RECOMMENDATION" as const },
    { evolutionInputClass: "RESOLVE_TARGET_UNCERTAINTY_INPUT" as const, action: "PROPOSE" as const, recommendationKind: "TARGET_UNCERTAINTY_RESOLUTION_RECOMMENDATION" as const },
    { evolutionInputClass: "STRENGTHEN_EVIDENCE_INPUT" as const, action: "PROPOSE" as const, recommendationKind: "EVIDENCE_STRENGTHENING_RECOMMENDATION" as const },
  ],
  recommendationPolicyImplementationVersion: "recommendation-v1",
  schemaVersion: "RECOMMENDATION_POLICY_REVISION_V1" as const,
};
const policy = { recommendationPolicyRevisionId: deriveRecommendationPolicyRevisionId(policySemantic), ...policySemantic, createdAt: stamp };

function proposal(code = "LEVEL_BELOW_RELATION", inputClass: any = "INCREASE_DEMONSTRATED_LEVEL_INPUT", derivationDisposition: any = "DERIVABLE") {
  const family = code === "LEVEL_BELOW_RELATION" ? "STRUCTURAL_DIFFERENCE" : "EPISTEMIC_UNCERTAINTY";
  const dimension = code === "LEVEL_BELOW_RELATION" ? "LEVEL" : code === "EVIDENCE_INSUFFICIENT" ? "EVIDENCE" : "SEMANTIC";
  const semantic = {
    tensionStateId: `TSN_DAINT_${code}`, roleRelationId: "RRL_DAINT", verifiedCapabilitySnapshotId: "SNAP_DAINT", targetRoleProfileRevisionId: "TRP_DAINT", targetRoleRequirementInventoryId: "INV_DAINT",
    items: [{ evolutionInputClass: inputClass, derivationDisposition, tensionClassificationFamily: family as any, tensionClassificationCode: code, subjectKind: "REQUIREMENT" as const, dimension: dimension as any, targetRequirementEntityId: null, targetRequirementRevisionIds: [], requirementRelationAggregateId: null, candidateCapabilityOperandId: null, capabilityRequirementRelationId: null, capabilityRequirementRelationEvaluationResultId: null, necessityStates: [] }],
    derivationPolicyLineage: { evolutionInputDerivationPolicyVersion: "evolution-v1" }, proposalState: "PROPOSAL_ONLY" as const, authorityState: "NONE" as const, schemaVersion: "EVOLUTION_INPUT_STATE_V1" as const,
  };
  return deriveRecommendationProposal({ evolutionInputStateId: deriveEvolutionInputStateId(semantic), ...semantic, createdAt: stamp }, policy, { version: "recommendation-v1" }, stamp);
}

function record(declarationClass: any, value = proposal()) {
  const context = createCareerDecisionContextRevision(authority, value, {
    decisionAuthorityGrantRevisionId: authority.decisionAuthorityGrantRevisionId,
    recommendationProposalId: value.recommendationProposalId,
    decisionSubjects: [{ recommendationProposalId: value.recommendationProposalId, sourceEvolutionInputItemOrdinal: 0 }],
    contextEvidenceRefs: ["evidence://context/daint"],
    createdAt: stamp,
  });
  return createHumanDecisionRecord(context, authority, value, {
    careerDecisionContextRevisionId: context.careerDecisionContextRevisionId,
    declarantActorId: "DECIDER_DAINT",
    declarationClass,
    declaredAt: stamp,
    declarationEvidenceRefs: ["evidence://declaration/daint"],
    createdAt: stamp,
  });
}

function multiSubjectRecord() {
  const semantic = {
    tensionStateId: "TSN_DAINT_MULTI", roleRelationId: "RRL_DAINT_MULTI", verifiedCapabilitySnapshotId: "SNAP_DAINT_MULTI", targetRoleProfileRevisionId: "TRP_DAINT_MULTI", targetRoleRequirementInventoryId: "INV_DAINT_MULTI",
    items: ["A", "B"].map(targetRequirementEntityId => ({ evolutionInputClass: "INCREASE_DEMONSTRATED_LEVEL_INPUT" as const, derivationDisposition: "DERIVABLE" as const, tensionClassificationFamily: "STRUCTURAL_DIFFERENCE" as const, tensionClassificationCode: "LEVEL_BELOW_RELATION", subjectKind: "REQUIREMENT" as const, dimension: "LEVEL" as const, targetRequirementEntityId, targetRequirementRevisionIds: [`TRR_DAINT_${targetRequirementEntityId}`], requirementRelationAggregateId: null, candidateCapabilityOperandId: null, capabilityRequirementRelationId: null, capabilityRequirementRelationEvaluationResultId: null, necessityStates: [] })),
    derivationPolicyLineage: { evolutionInputDerivationPolicyVersion: "evolution-v1" }, proposalState: "PROPOSAL_ONLY" as const, authorityState: "NONE" as const, schemaVersion: "EVOLUTION_INPUT_STATE_V1" as const,
  };
  const value = deriveRecommendationProposal({ evolutionInputStateId: deriveEvolutionInputStateId(semantic), ...semantic, createdAt: stamp }, policy, { version: "recommendation-v1" }, stamp);
  const context = createCareerDecisionContextRevision(authority, value, { decisionAuthorityGrantRevisionId: authority.decisionAuthorityGrantRevisionId, recommendationProposalId: value.recommendationProposalId, decisionSubjects: [{ recommendationProposalId: value.recommendationProposalId, sourceEvolutionInputItemOrdinal: 1 }, { recommendationProposalId: value.recommendationProposalId, sourceEvolutionInputItemOrdinal: 0 }], contextEvidenceRefs: ["evidence://context/daint/multi"], createdAt: stamp });
  return createHumanDecisionRecord(context, authority, value, { careerDecisionContextRevisionId: context.careerDecisionContextRevisionId, declarantActorId: "DECIDER_DAINT", declarationClass: "ACCEPT_RECOMMENDATION", declaredAt: stamp, declarationEvidenceRefs: ["evidence://declaration/daint/multi"], createdAt: stamp });
}

function input(value: ReturnType<typeof record>, actionIntentClass: string, more: Record<string, unknown> = {}) {
  return {
    humanDecisionRecordId: value.humanDecisionRecordId,
    declaredByActorId: value.declarantActorId,
    actionIntentClass,
    operationDescription: "  Explicit intended operation  ",
    declaredAt: later,
    actionIntentEvidenceRefs: ["evidence://intent/b", "evidence://intent/a"],
    createdAt: later,
    ...more,
  };
}

describe("T12A CareerDecisionActionIntent RED contract", () => {
  it("maps the three admissible HumanDecisionRecord declaration classes exactly", async () => {
    const api = await domain();
    const accepted = record("ACCEPT_RECOMMENDATION");
    const evidence = record("REQUEST_FURTHER_EVIDENCE", proposal("EVIDENCE_INSUFFICIENT", "STRENGTHEN_EVIDENCE_INPUT"));
    const clarification = record("REQUEST_TARGET_CLARIFICATION", proposal("REQUIREMENT_RELATION_AGGREGATE_SET_UNRESOLVED", "RESOLVE_TARGET_UNCERTAINTY_INPUT"));
    expect(api.createCareerDecisionActionIntent(accepted, input(accepted, "RECOMMENDATION_OPERATIONALIZATION")).actionIntentClass).toBe("RECOMMENDATION_OPERATIONALIZATION");
    expect(api.createCareerDecisionActionIntent(evidence, input(evidence, "FURTHER_EVIDENCE_REQUEST_OPERATIONALIZATION")).actionIntentClass).toBe("FURTHER_EVIDENCE_REQUEST_OPERATIONALIZATION");
    expect(api.createCareerDecisionActionIntent(clarification, input(clarification, "TARGET_CLARIFICATION_REQUEST_OPERATIONALIZATION")).actionIntentClass).toBe("TARGET_CLARIFICATION_REQUEST_OPERATIONALIZATION");
  });

  it("fails closed for every cross-class mapping, reject/defer, and unknown action-intent classes", async () => {
    const api = await domain();
    const accepted = record("ACCEPT_RECOMMENDATION");
    const evidence = record("REQUEST_FURTHER_EVIDENCE", proposal("EVIDENCE_INSUFFICIENT", "STRENGTHEN_EVIDENCE_INPUT"));
    const clarification = record("REQUEST_TARGET_CLARIFICATION", proposal("REQUIREMENT_RELATION_AGGREGATE_SET_UNRESOLVED", "RESOLVE_TARGET_UNCERTAINTY_INPUT"));
    const rejected = record("REJECT_RECOMMENDATION");
    const deferred = record("DEFER_DECISION");
    const classes = ["RECOMMENDATION_OPERATIONALIZATION", "FURTHER_EVIDENCE_REQUEST_OPERATIONALIZATION", "TARGET_CLARIFICATION_REQUEST_OPERATIONALIZATION"];
    const allowed = new Map([[accepted, "RECOMMENDATION_OPERATIONALIZATION"], [evidence, "FURTHER_EVIDENCE_REQUEST_OPERATIONALIZATION"], [clarification, "TARGET_CLARIFICATION_REQUEST_OPERATIONALIZATION"]]);
    for (const [value, permitted] of allowed) for (const actionIntentClass of classes) if (actionIntentClass !== permitted) expect(() => api.createCareerDecisionActionIntent(value, input(value, actionIntentClass))).toThrow("ERR_CAREER_DECISION_ACTION_INTENT_INVALID");
    for (const value of [rejected, deferred]) for (const actionIntentClass of classes) expect(() => api.createCareerDecisionActionIntent(value, input(value, actionIntentClass))).toThrow("ERR_CAREER_DECISION_ACTION_INTENT_INVALID");
    expect(() => api.createCareerDecisionActionIntent(accepted, input(accepted, "UNKNOWN"))).toThrow("ERR_CAREER_DECISION_ACTION_INTENT_INVALID");
  });

  it("inherits complete exact DCR subjects and lineage without caller selection", async () => {
    const api = await domain();
    const value = record("ACCEPT_RECOMMENDATION");
    const artifact = api.createCareerDecisionActionIntent(value, input(value, "RECOMMENDATION_OPERATIONALIZATION"));
    expect(artifact.decisionSubjects).toEqual(value.decisionSubjects);
    expect(artifact.careerDecisionContextRevisionId).toBe(value.careerDecisionContextRevisionId);
    expect(artifact.decisionAuthorityGrantRevisionId).toBe(value.decisionAuthorityGrantRevisionId);
    expect(artifact.recommendationProposalId).toBe(value.recommendationProposalId);
    expect(Object.keys(input(value, "RECOMMENDATION_OPERATIONALIZATION"))).not.toContain("decisionSubjects");
    expect(Object.keys(input(value, "RECOMMENDATION_OPERATIONALIZATION"))).not.toContain("operationalizedOptionItemIds");
  });

  it("requires the exact human declarant and canonical operation declaration", async () => {
    const api = await domain();
    const value = record("ACCEPT_RECOMMENDATION");
    expect(() => api.createCareerDecisionActionIntent(value, input(value, "RECOMMENDATION_OPERATIONALIZATION", { declaredByActorId: "OTHER" }))).toThrow("ERR_CAREER_DECISION_ACTION_INTENT_INVALID");
    expect(() => api.createCareerDecisionActionIntent(value, input(value, "RECOMMENDATION_OPERATIONALIZATION", { operationDescription: "   " }))).toThrow("ERR_CAREER_DECISION_ACTION_INTENT_INVALID");
    const padded = api.createCareerDecisionActionIntent(value, input(value, "RECOMMENDATION_OPERATIONALIZATION"));
    const canonical = api.createCareerDecisionActionIntent(value, input(value, "RECOMMENDATION_OPERATIONALIZATION", { operationDescription: "Explicit intended operation" }));
    expect(padded.operationDescription).toBe("Explicit intended operation");
    expect(padded.operationDescription).toBe(canonical.operationDescription);
    expect(padded.careerDecisionActionIntentId).toBe(canonical.careerDecisionActionIntentId);
  });

  it("requires sorted unique nonblank opaque action-intent evidence", async () => {
    const api = await domain();
    const value = record("ACCEPT_RECOMMENDATION");
    const first = api.createCareerDecisionActionIntent(value, input(value, "RECOMMENDATION_OPERATIONALIZATION"));
    const reordered = api.createCareerDecisionActionIntent(value, input(value, "RECOMMENDATION_OPERATIONALIZATION", { actionIntentEvidenceRefs: ["evidence://intent/a", "evidence://intent/b"] }));
    expect(first.actionIntentEvidenceRefs).toEqual(["evidence://intent/a", "evidence://intent/b"]);
    expect(first.careerDecisionActionIntentId).toBe(reordered.careerDecisionActionIntentId);
    expect(() => api.createCareerDecisionActionIntent(value, input(value, "RECOMMENDATION_OPERATIONALIZATION", { actionIntentEvidenceRefs: ["evidence://intent/a", "evidence://intent/a"] }))).toThrow("ERR_CAREER_DECISION_ACTION_INTENT_INVALID");
    expect(() => api.createCareerDecisionActionIntent(value, input(value, "RECOMMENDATION_OPERATIONALIZATION", { actionIntentEvidenceRefs: ["evidence://intent/a", " evidence://intent/a "] }))).toThrow("ERR_CAREER_DECISION_ACTION_INTENT_INVALID");
    expect(() => api.createCareerDecisionActionIntent(value, input(value, "RECOMMENDATION_OPERATIONALIZATION", { actionIntentEvidenceRefs: [" "] }))).toThrow("ERR_CAREER_DECISION_ACTION_INTENT_INVALID");
  });

  it("enforces canonical declaration time and excludes createdAt from identity", async () => {
    const api = await domain();
    const value = record("ACCEPT_RECOMMENDATION");
    const first = api.createCareerDecisionActionIntent(value, input(value, "RECOMMENDATION_OPERATIONALIZATION"));
    const createdLater = api.createCareerDecisionActionIntent(value, input(value, "RECOMMENDATION_OPERATIONALIZATION", { createdAt: "2028-02-01T00:00:00.000Z" }));
    expect(first.careerDecisionActionIntentId).toBe(createdLater.careerDecisionActionIntentId);
    expect(() => api.createCareerDecisionActionIntent(value, input(value, "RECOMMENDATION_OPERATIONALIZATION", { declaredAt: "2026-01-01T00:00:00.000Z" }))).toThrow("ERR_CAREER_DECISION_ACTION_INTENT_INVALID");
    expect(() => api.createCareerDecisionActionIntent(value, input(value, "RECOMMENDATION_OPERATIONALIZATION", { declaredAt: "not-iso" }))).toThrow("ERR_CAREER_DECISION_ACTION_INTENT_INVALID");
  });

  it("derives DAINT identity from every independently caller-changeable semantic input", async () => {
    const api = await domain();
    const value = record("ACCEPT_RECOMMENDATION");
    const first = api.createCareerDecisionActionIntent(value, input(value, "RECOMMENDATION_OPERATIONALIZATION"));
    expect(first.careerDecisionActionIntentId).toMatch(/^DAINT_[0-9A-F]{32}$/);
    expect(first.careerDecisionActionIntentId).toBe(api.createCareerDecisionActionIntent(value, input(value, "RECOMMENDATION_OPERATIONALIZATION")).careerDecisionActionIntentId);
    expect(first.careerDecisionActionIntentId).not.toBe(api.createCareerDecisionActionIntent(value, input(value, "RECOMMENDATION_OPERATIONALIZATION", { operationDescription: "Other operation" })).careerDecisionActionIntentId);
    expect(first.careerDecisionActionIntentId).not.toBe(api.createCareerDecisionActionIntent(value, input(value, "RECOMMENDATION_OPERATIONALIZATION", { declaredAt: "2027-02-03T00:00:00.000Z" })).careerDecisionActionIntentId);
    expect(first.careerDecisionActionIntentId).not.toBe(api.createCareerDecisionActionIntent(value, input(value, "RECOMMENDATION_OPERATIONALIZATION", { actionIntentEvidenceRefs: ["evidence://intent/c"] })).careerDecisionActionIntentId);
  });

  it("rejects tampered IDs, noncanonical durable fields, and historical lineage mutation", async () => {
    const api = await domain();
    const value = record("ACCEPT_RECOMMENDATION");
    const artifact = api.createCareerDecisionActionIntent(value, input(value, "RECOMMENDATION_OPERATIONALIZATION"));
    for (const mutation of [
      { careerDecisionActionIntentId: "DAINT_00000000000000000000000000000000" },
      { actionIntentEvidenceRefs: [...artifact.actionIntentEvidenceRefs].reverse() },
      { recommendationProposalId: "RCP_FOREIGN" },
      { declaredByActorId: "FOREIGN" },
      { sourceDeclarationClass: "REJECT_RECOMMENDATION" },
    ]) expect(() => api.assertCareerDecisionActionIntent({ ...artifact, ...mutation })).toThrow("ERR_CAREER_DECISION_ACTION_INTENT_INVALID");
  });

  it("preserves the complete canonical multi-subject DCR boundary without first-item, subset, or duplicate behavior", async () => {
    const api = await domain();
    const value = multiSubjectRecord();
    const artifact = api.createCareerDecisionActionIntent(value, input(value, "RECOMMENDATION_OPERATIONALIZATION"));
    expect(value.decisionSubjects).toHaveLength(2);
    expect(artifact.decisionSubjects).toEqual(value.decisionSubjects);
    expect(artifact.decisionSubjects.map((subject: any) => subject.sourceEvolutionInputItemOrdinal)).toEqual([0, 1]);
    for (const mutation of [
      { decisionSubjects: [...artifact.decisionSubjects].reverse() },
      { decisionSubjects: artifact.decisionSubjects.slice(0, 1) },
      { decisionSubjects: [...artifact.decisionSubjects, { recommendationProposalId: "RCP_FOREIGN", sourceEvolutionInputItemOrdinal: 0 }] },
      { decisionSubjects: [...artifact.decisionSubjects, artifact.decisionSubjects[0]] },
    ]) expect(() => api.assertCareerDecisionActionIntent({ ...artifact, ...mutation })).toThrow("ERR_CAREER_DECISION_ACTION_INTENT_INVALID");
  });

  it("accepts exactly the frozen caller input fields and rejects every caller lineage or later-layer override", async () => {
    const api = await domain();
    const value = record("ACCEPT_RECOMMENDATION");
    const frozenFields = ["humanDecisionRecordId", "declaredByActorId", "actionIntentClass", "operationDescription", "declaredAt", "actionIntentEvidenceRefs", "createdAt"];
    expect(Object.keys(input(value, "RECOMMENDATION_OPERATIONALIZATION")).sort()).toEqual(frozenFields.sort());
    for (const forbidden of ["careerDecisionContextRevisionId", "decisionAuthorityGrantRevisionId", "recommendationProposalId", "decisionSubjects", "sourceDeclarationClass", "rationale", "operationalizedOptionItemIds", "commitment", "executionAuthority", "executionContext", "actionOccurrence", "outcome"]) expect(() => api.createCareerDecisionActionIntent(value, input(value, "RECOMMENDATION_OPERATIONALIZATION", { [forbidden]: "caller-override" }))).toThrow("ERR_CAREER_DECISION_ACTION_INTENT_INVALID");
  });

  it("stores exactly the frozen canonical artifact shape and no extra field", async () => {
    const api = await domain();
    const value = record("ACCEPT_RECOMMENDATION");
    const artifact = api.createCareerDecisionActionIntent(value, input(value, "RECOMMENDATION_OPERATIONALIZATION"));
    expect(Object.keys(artifact).sort()).toEqual(["careerDecisionActionIntentId", "humanDecisionRecordId", "careerDecisionContextRevisionId", "decisionAuthorityGrantRevisionId", "recommendationProposalId", "declaredByActorId", "decisionSubjects", "sourceDeclarationClass", "actionIntentClass", "operationDescription", "declaredAt", "actionIntentEvidenceRefs", "schemaVersion", "createdAt"].sort());
  });

  it("rejects empty, non-array, and non-string evidence and validates canonical createdAt", async () => {
    const api = await domain();
    const value = record("ACCEPT_RECOMMENDATION");
    for (const actionIntentEvidenceRefs of [[], "evidence://intent/a", [42]]) expect(() => api.createCareerDecisionActionIntent(value, input(value, "RECOMMENDATION_OPERATIONALIZATION", { actionIntentEvidenceRefs }))).toThrow("ERR_CAREER_DECISION_ACTION_INTENT_INVALID");
    expect(() => api.createCareerDecisionActionIntent(value, input(value, "RECOMMENDATION_OPERATIONALIZATION", { createdAt: "not-iso" }))).toThrow("ERR_CAREER_DECISION_ACTION_INTENT_INVALID");
    expect(api.createCareerDecisionActionIntent(value, input(value, "RECOMMENDATION_OPERATIONALIZATION", { declaredAt: stamp })).declaredAt).toBe(stamp);
  });

  it("rejects every stale identity-bearing lineage, schema, and durable inventory mutation", async () => {
    const api = await domain();
    const value = multiSubjectRecord();
    const artifact = api.createCareerDecisionActionIntent(value, input(value, "RECOMMENDATION_OPERATIONALIZATION"));
    for (const mutation of [
      { humanDecisionRecordId: "DCR_FOREIGN" }, { careerDecisionContextRevisionId: "DCTXREV_FOREIGN" }, { decisionAuthorityGrantRevisionId: "DAR_FOREIGN" }, { recommendationProposalId: "RCP_FOREIGN" }, { declaredByActorId: "FOREIGN" }, { sourceDeclarationClass: "REJECT_RECOMMENDATION" }, { actionIntentClass: "FURTHER_EVIDENCE_REQUEST_OPERATIONALIZATION" }, { operationDescription: "  noncanonical  " }, { declaredAt: "not-iso" }, { createdAt: "not-iso" }, { actionIntentEvidenceRefs: [] }, { actionIntentEvidenceRefs: ["evidence://intent/a", "evidence://intent/a"] }, { schemaVersion: "OTHER" }, { unknown: "field" },
    ]) expect(() => api.assertCareerDecisionActionIntent({ ...artifact, ...mutation })).toThrow("ERR_CAREER_DECISION_ACTION_INTENT_INVALID");
  });

  it("contains no rationale, commitment, execution, occurrence, outcome, causality, success, fit, or qualification state", async () => {
    const api = await domain();
    const value = record("ACCEPT_RECOMMENDATION");
    const artifact = api.createCareerDecisionActionIntent(value, input(value, "RECOMMENDATION_OPERATIONALIZATION"));
    for (const forbidden of ["rationale", "commitment", "executionAuthority", "executionContext", "actionOccurrence", "outcome", "causality", "success", "fit", "qualification"]) expect(artifact).not.toHaveProperty(forbidden);
  });

  it("exposes only the Career T12A contract and rejects hidden legacy or selection semantics in source", async () => {
    const api = await domain();
    expect(Object.keys(api).sort()).toEqual(["assertCareerDecisionActionIntent", "createCareerDecisionActionIntent", "deriveCareerDecisionActionIntentId", "stableCareerDecisionActionIntent"]);
    expect(existsSync(sourcePath)).toBe(true);
    const source = readFileSync(sourcePath, "utf8");
    expect(source).not.toMatch(/Date\.now|Math\.random|uuid|current|latest|head|provider|model|commitment|execution authority|action occurrence|outcome authority|score|rank|priority|select(?:ed|ion)?/i);
  });
});
