import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createCareerDecisionActionIntent,
  deriveCareerDecisionActionIntentId,
} from "../../../../lib/career/relation/action-intent";
import { createCareerHumanCommitment } from "../../../../lib/career/relation/human-commitment";
import { createT12BHistoricalFixture } from "../human-commitment/t12b-historical-fixture";

const loadAuthorityGrant = () =>
  import("../../../../lib/career/relation/execution-authority-grant") as Promise<any>;
const sourcePath = resolve(
  process.cwd(),
  "lib/career/relation/execution-authority-grant/contract.ts",
);
const invalid = "ERR_CAREER_EXECUTION_AUTHORITY_GRANT_REVISION_INVALID";

function fixture() {
  return createT12BHistoricalFixture();
}

function input(value = fixture(), more: Record<string, unknown> = {}) {
  return {
    careerHumanCommitmentId: value.commitment.careerHumanCommitmentId,
    grantorActorId: "GRANTOR_T12C",
    authorizedExecutionActorId: "EXECUTOR_T12C",
    executionAuthorityScope: "RECOMMENDATION_OPERATION_EXECUTION",
    permittedTargetKinds: ["SYSTEM", "PERSON"],
    permittedChannelKinds: ["MESSAGE", "EMAIL"],
    authorityEvidenceRefs: ["evidence://authority/t12c/b", "evidence://authority/t12c/a"],
    declaredAt: "2027-02-03T00:00:00.000Z",
    effectiveFrom: "2027-02-03T00:00:00.000Z",
    effectiveUntil: "2027-02-04T00:00:00.000Z",
    createdAt: "2027-02-03T00:00:00.000Z",
    ...more,
  };
}

function create(api: any, value = fixture(), more: Record<string, unknown> = {}) {
  return api.createCareerExecutionAuthorityGrantRevision(value.commitment, input(value, more));
}

function alternateCommitment(
  declarationClass: "REQUEST_FURTHER_EVIDENCE" | "REQUEST_TARGET_CLARIFICATION",
  actionIntentClass:
    | "FURTHER_EVIDENCE_REQUEST_OPERATIONALIZATION"
    | "TARGET_CLARIFICATION_REQUEST_OPERATIONALIZATION",
) {
  const value = fixture();
  const semantic = {
    ...value.actionIntent,
    sourceDeclarationClass: declarationClass,
    actionIntentClass,
  } as any;
  delete semantic.careerDecisionActionIntentId;
  delete semantic.createdAt;
  const actionIntent = {
    ...semantic,
    careerDecisionActionIntentId: deriveCareerDecisionActionIntentId(semantic),
    createdAt: value.actionIntent.createdAt,
  };
  const commitment = createCareerHumanCommitment(actionIntent, {
    careerDecisionActionIntentId: actionIntent.careerDecisionActionIntentId,
    committedByActorId: actionIntent.declaredByActorId,
    committedAt: "2027-02-03T00:00:00.000Z",
    commitmentEvidenceRefs: ["evidence://commitment/t12c/alternate"],
    createdAt: "2027-02-03T00:00:00.000Z",
  });
  return { value, commitment };
}

describe("T12C CareerExecutionAuthorityGrantRevision domain RED contract", () => {
  it("starts from one exact canonical two-subject T12B HCOM fixture", () => {
    const value = fixture();
    expect(value.commitment.decisionSubjects).toEqual(value.actionIntent.decisionSubjects);
    expect(value.commitment.decisionSubjects).toHaveLength(2);
    expect(value.commitment.committedAt >= value.actionIntent.declaredAt).toBe(true);
  });

  it("creates the exact EAGR shape by copying every HCOM historical witness", async () => {
    const api = await loadAuthorityGrant();
    const value = fixture();
    const grant = create(api, value);
    expect(Object.keys(grant).sort()).toEqual([
      "careerExecutionAuthorityGrantRevisionId", "careerHumanCommitmentId",
      "humanDecisionRecordId", "careerDecisionActionIntentId",
      "careerDecisionContextRevisionId", "decisionAuthorityGrantRevisionId",
      "recommendationProposalId", "grantorActorId", "authorizedExecutionActorId",
      "decisionSubjects", "sourceDeclarationClass", "sourceActionIntentClass",
      "operationDescription", "executionAuthorityScope", "permittedTargetKinds",
      "permittedChannelKinds", "authorityEvidenceRefs", "declaredAt", "effectiveFrom",
      "effectiveUntil", "schemaVersion", "createdAt",
    ].sort());
    expect(grant).toMatchObject({
      careerHumanCommitmentId: value.commitment.careerHumanCommitmentId,
      humanDecisionRecordId: value.commitment.humanDecisionRecordId,
      careerDecisionActionIntentId: value.commitment.careerDecisionActionIntentId,
      careerDecisionContextRevisionId: value.commitment.careerDecisionContextRevisionId,
      decisionAuthorityGrantRevisionId: value.commitment.decisionAuthorityGrantRevisionId,
      recommendationProposalId: value.commitment.recommendationProposalId,
      decisionSubjects: value.commitment.decisionSubjects,
      sourceDeclarationClass: value.commitment.sourceDeclarationClass,
      sourceActionIntentClass: value.commitment.sourceActionIntentClass,
      operationDescription: value.commitment.operationDescription,
      executionAuthorityScope: "RECOMMENDATION_OPERATION_EXECUTION",
      permittedTargetKinds: ["PERSON", "SYSTEM"],
      permittedChannelKinds: ["EMAIL", "MESSAGE"],
      authorityEvidenceRefs: ["evidence://authority/t12c/a", "evidence://authority/t12c/b"],
      schemaVersion: "CAREER_EXECUTION_AUTHORITY_GRANT_REVISION_V1",
    });
    expect(grant.careerExecutionAuthorityGrantRevisionId).toMatch(/^EAGR_[0-9A-F]{32}$/);
  });

  it("has pure deterministic EAGR identity over every semantic witness while excluding createdAt", async () => {
    const api = await loadAuthorityGrant();
    const first = create(api);
    const semantic = { ...first } as any;
    delete semantic.careerExecutionAuthorityGrantRevisionId;
    delete semantic.createdAt;
    expect(api.deriveCareerExecutionAuthorityGrantRevisionId(semantic)).toBe(first.careerExecutionAuthorityGrantRevisionId);
    expect(create(api, fixture(), { createdAt: "2027-02-05T00:00:00.000Z" }).careerExecutionAuthorityGrantRevisionId).toBe(first.careerExecutionAuthorityGrantRevisionId);
    for (const [field, changed] of [
      ["careerHumanCommitmentId", "HCOM_00000000000000000000000000000000"],
      ["humanDecisionRecordId", "DCR_00000000000000000000000000000000"],
      ["careerDecisionActionIntentId", "DAINT_00000000000000000000000000000000"],
      ["careerDecisionContextRevisionId", "DCTXREV_00000000000000000000000000000000"],
      ["decisionAuthorityGrantRevisionId", "DAR_00000000000000000000000000000000"],
      ["recommendationProposalId", "RCP_00000000000000000000000000000000"],
      ["grantorActorId", "OTHER_GRANTOR"],
      ["authorizedExecutionActorId", "OTHER_EXECUTOR"],
      ["sourceDeclarationClass", "REQUEST_FURTHER_EVIDENCE"],
      ["sourceActionIntentClass", "FURTHER_EVIDENCE_REQUEST_OPERATIONALIZATION"],
      ["operationDescription", "A different operation"],
      ["executionAuthorityScope", "FURTHER_EVIDENCE_REQUEST_EXECUTION"],
      ["permittedTargetKinds", ["DOCUMENT"]],
      ["permittedChannelKinds", ["API"]],
      ["authorityEvidenceRefs", ["evidence://authority/t12c/c"]],
      ["declaredAt", "2027-02-03T00:00:01.000Z"],
      ["effectiveFrom", "2027-02-03T00:00:01.000Z"],
      ["effectiveUntil", null],
    ] as const) {
      const changedPayload = { ...semantic, [field]: changed };
      const changedId = api.deriveCareerExecutionAuthorityGrantRevisionId(changedPayload);
      expect(changedId).toMatch(/^EAGR_[0-9A-F]{32}$/);
      expect(changedId).not.toBe(first.careerExecutionAuthorityGrantRevisionId);
      expect(() => api.assertCareerExecutionAuthorityGrantRevision({ ...first, ...changedPayload })).toThrow(invalid);
    }
  });

  it("accepts only explicit EAGR input and rejects caller-supplied HCOM witnesses or extra state", async () => {
    const api = await loadAuthorityGrant();
    const value = fixture();
    expect(Object.keys(input(value)).sort()).toEqual([
      "careerHumanCommitmentId", "grantorActorId", "authorizedExecutionActorId",
      "executionAuthorityScope", "permittedTargetKinds", "permittedChannelKinds",
      "authorityEvidenceRefs", "declaredAt", "effectiveFrom", "effectiveUntil", "createdAt",
    ].sort());
    for (const forbidden of [
      "humanDecisionRecordId", "careerDecisionActionIntentId", "careerDecisionContextRevisionId",
      "decisionAuthorityGrantRevisionId", "recommendationProposalId", "decisionSubjects",
      "sourceDeclarationClass", "sourceActionIntentClass", "operationDescription", "schemaVersion",
      "targetRef", "channelRef", "executionContext", "actionOccurrence", "assignment",
      "rationale", "outcome", "current", "status",
    ]) expect(() => create(api, value, { [forbidden]: "caller-override" })).toThrow(invalid);
    expect(() => create(api, value, {
      careerHumanCommitmentId: "HCOM_00000000000000000000000000000000",
    })).toThrow(invalid);
    expect(() => create(api, { ...value, commitment: { ...value.commitment, careerHumanCommitmentId: "HCOM_00000000000000000000000000000000" } })).toThrow(invalid);
  });

  it("inherits complete HCOM subjects without filtering, first-subject behavior, or source transformation", async () => {
    const api = await loadAuthorityGrant();
    const value = fixture();
    const grant = create(api, value);
    expect(grant.decisionSubjects).toEqual(value.commitment.decisionSubjects);
    expect(grant.decisionSubjects).toEqual([
      { recommendationProposalId: value.commitment.recommendationProposalId, sourceEvolutionInputItemOrdinal: 0 },
      { recommendationProposalId: value.commitment.recommendationProposalId, sourceEvolutionInputItemOrdinal: 1 },
    ]);
    (grant.decisionSubjects as any[]).pop();
    expect(value.commitment.decisionSubjects).toHaveLength(2);
    expect(create(api, value).decisionSubjects).toHaveLength(2);
  });

  it("permits only the exact HCOM action-intent to execution-scope mapping, including self and foreign grants", async () => {
    const api = await loadAuthorityGrant();
    expect(create(api, fixture(), {
      grantorActorId: "SELF_EXECUTOR", authorizedExecutionActorId: "SELF_EXECUTOR",
    }).authorizedExecutionActorId).toBe("SELF_EXECUTOR");
    expect(create(api, fixture(), {
      grantorActorId: "FOREIGN_GRANTOR", authorizedExecutionActorId: "FOREIGN_EXECUTOR",
    }).authorizedExecutionActorId).toBe("FOREIGN_EXECUTOR");
    expect(create(api, fixture(), {
      authorizedExecutionActorId: "NOT_THE_HCOM_ACTOR",
    }).authorizedExecutionActorId).toBe("NOT_THE_HCOM_ACTOR");

    const evidence = alternateCommitment(
      "REQUEST_FURTHER_EVIDENCE", "FURTHER_EVIDENCE_REQUEST_OPERATIONALIZATION",
    );
    const clarification = alternateCommitment(
      "REQUEST_TARGET_CLARIFICATION", "TARGET_CLARIFICATION_REQUEST_OPERATIONALIZATION",
    );
    expect(create(api, evidence as any, {
      careerHumanCommitmentId: evidence.commitment.careerHumanCommitmentId,
      executionAuthorityScope: "FURTHER_EVIDENCE_REQUEST_EXECUTION",
    }).executionAuthorityScope).toBe("FURTHER_EVIDENCE_REQUEST_EXECUTION");
    expect(create(api, clarification as any, {
      careerHumanCommitmentId: clarification.commitment.careerHumanCommitmentId,
      executionAuthorityScope: "TARGET_CLARIFICATION_REQUEST_EXECUTION",
    }).executionAuthorityScope).toBe("TARGET_CLARIFICATION_REQUEST_EXECUTION");
    for (const scope of [
      "FURTHER_EVIDENCE_REQUEST_EXECUTION",
      "TARGET_CLARIFICATION_REQUEST_EXECUTION",
    ]) expect(() => create(api, fixture(), { executionAuthorityScope: scope })).toThrow(invalid);
  });

  it("canonicalizes and validates closed target/channel/evidence inventories and canonical actors", async () => {
    const api = await loadAuthorityGrant();
    const value = fixture();
    const grant = create(api, value, {
      grantorActorId: "  GRANTOR_T12C  ",
      authorizedExecutionActorId: "  EXECUTOR_T12C  ",
      permittedTargetKinds: ["DOCUMENT", "PERSON"],
      permittedChannelKinds: ["HUMAN_HANDOFF", "API"],
      authorityEvidenceRefs: [" evidence://authority/t12c/a ", "evidence://authority/t12c/b"],
    });
    expect(grant).toMatchObject({
      grantorActorId: "GRANTOR_T12C", authorizedExecutionActorId: "EXECUTOR_T12C",
      permittedTargetKinds: ["DOCUMENT", "PERSON"], permittedChannelKinds: ["API", "HUMAN_HANDOFF"],
      authorityEvidenceRefs: ["evidence://authority/t12c/a", "evidence://authority/t12c/b"],
    });
    for (const more of [
      { grantorActorId: " " }, { authorizedExecutionActorId: " " },
      { permittedTargetKinds: [] }, { permittedTargetKinds: ["UNKNOWN"] },
      { permittedTargetKinds: ["PERSON", "PERSON"] },
      { permittedChannelKinds: [] }, { permittedChannelKinds: ["UNKNOWN"] },
      { permittedChannelKinds: ["EMAIL", "EMAIL"] },
      { authorityEvidenceRefs: [] }, { authorityEvidenceRefs: [" "] },
      { authorityEvidenceRefs: ["evidence://authority/t12c/a", "evidence://authority/t12c/a"] },
      { authorityEvidenceRefs: ["evidence://authority/t12c/a", " evidence://authority/t12c/a "] },
    ]) expect(() => create(api, value, more)).toThrow(invalid);
  });

  it("requires canonical authority times and a valid declared applicability interval", async () => {
    const api = await loadAuthorityGrant();
    const value = fixture();
    expect(create(api, value, { effectiveUntil: null }).effectiveUntil).toBeNull();
    expect(create(api, value, { declaredAt: value.commitment.committedAt }).declaredAt).toBe(value.commitment.committedAt);
    for (const more of [
      { declaredAt: "not-iso" }, { effectiveFrom: "not-iso" },
      { effectiveUntil: "not-iso" }, { createdAt: "not-iso" },
      { declaredAt: "2027-02-02T23:59:59.999Z" },
      { effectiveFrom: "2027-02-02T23:59:59.999Z" },
      { effectiveUntil: "2027-02-03T00:00:00.000Z" },
      { effectiveUntil: "2027-02-02T23:59:59.999Z" },
    ]) expect(() => create(api, value, more)).toThrow(invalid);
  });

  it("rejects stale IDs and noncanonical durable EAGR representation without repairing it", async () => {
    const api = await loadAuthorityGrant();
    const grant = create(api);
    for (const mutation of [
      { careerExecutionAuthorityGrantRevisionId: "EAGR_00000000000000000000000000000000" },
      { decisionSubjects: [...grant.decisionSubjects].reverse() },
      { decisionSubjects: grant.decisionSubjects.slice(0, 1) },
      { decisionSubjects: [...grant.decisionSubjects, grant.decisionSubjects[0]] },
      { permittedTargetKinds: [...grant.permittedTargetKinds].reverse() },
      { permittedChannelKinds: [...grant.permittedChannelKinds].reverse() },
      { authorityEvidenceRefs: [...grant.authorityEvidenceRefs].reverse() },
      { authorityEvidenceRefs: ["evidence://authority/t12c/a", "evidence://authority/t12c/a"] },
      { grantorActorId: "  noncanonical  " }, { schemaVersion: "CAREER_EXECUTION_AUTHORITY_GRANT_REVISION_V0" },
      { unknown: "field" },
    ]) expect(() => api.assertCareerExecutionAuthorityGrantRevision({ ...grant, ...mutation })).toThrow(invalid);
  });

  it("has no concrete target/channel, execution, outcome, mutable-state, or regeneration surface", async () => {
    const api = await loadAuthorityGrant();
    const grant = create(api);
    for (const forbidden of [
      "targetRef", "channelRef", "executionContext", "actionOccurrence", "outcome", "causality",
      "success", "failure", "rationale", "assignment", "delegation", "current", "latest", "head",
      "status", "active", "executed", "completed",
    ]) expect(grant).not.toHaveProperty(forbidden);
    expect(Object.keys(api).sort()).toEqual([
      "assertCareerExecutionAuthorityGrantRevision",
      "createCareerExecutionAuthorityGrantRevision",
      "deriveCareerExecutionAuthorityGrantRevisionId",
      "stableCareerExecutionAuthorityGrantRevision",
    ].sort());
    expect(existsSync(sourcePath)).toBe(true);
    const source = readFileSync(sourcePath, "utf8");
    expect(source).not.toMatch(/Date\.now|Math\.random|uuid|current|latest|head|provider|model|matcher|score|rank|priority|execution-authority\/|execution-context\/|career\/decisions\/action\.ts|careerCommitments|legacyLifecycleRepository/i);
  });
});
