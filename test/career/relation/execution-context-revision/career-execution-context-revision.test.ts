import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createCareerExecutionAuthorityGrantRevision,
} from "../../../../lib/career/relation/execution-authority-grant";
import { createT12CHistoricalFixture } from "../execution-authority-grant/t12c-historical-fixture";

const loadContextRevision = () =>
  import("../../../../lib/career/relation/execution-context-revision") as Promise<any>;
const sourcePath = resolve(
  process.cwd(),
  "lib/career/relation/execution-context-revision/contract.ts",
);
const invalid = "ERR_CAREER_EXECUTION_CONTEXT_REVISION_INVALID";

function fixture() {
  return createT12CHistoricalFixture();
}

function grant(
  value = fixture(),
  more: Record<string, unknown> = {},
) {
  return createCareerExecutionAuthorityGrantRevision(value.commitment, {
    careerHumanCommitmentId: value.commitment.careerHumanCommitmentId,
    grantorActorId: "GRANTOR_T12D",
    authorizedExecutionActorId: "EXECUTOR_T12D",
    executionAuthorityScope: "RECOMMENDATION_OPERATION_EXECUTION",
    permittedTargetKinds: [
      "PERSON", "ORGANIZATION", "SYSTEM", "DOCUMENT", "COMMUNICATION_ENDPOINT",
    ],
    permittedChannelKinds: ["EMAIL", "MESSAGE", "API", "DOCUMENT", "HUMAN_HANDOFF"],
    authorityEvidenceRefs: ["evidence://authority/t12d/a"],
    declaredAt: "2027-02-03T00:00:00.000Z",
    effectiveFrom: "2027-02-03T00:00:00.000Z",
    effectiveUntil: "2027-02-04T00:00:00.000Z",
    createdAt: "2027-02-03T00:00:00.000Z",
    ...more,
  });
}

function input(
  authority = grant(),
  more: Record<string, unknown> = {},
) {
  return {
    careerExecutionAuthorityGrantRevisionId:
      authority.careerExecutionAuthorityGrantRevisionId,
    declaredByActorId: authority.authorizedExecutionActorId,
    executionTarget: { targetKind: "PERSON" as const, targetRef: " target://person/1 " },
    executionChannel: { channelKind: "EMAIL" as const, channelRef: " channel://email/1 " },
    declaredAt: "2027-02-03T00:00:00.000Z",
    contextEvidenceRefs: [" evidence://context/t12d/b ", "evidence://context/t12d/a"],
    createdAt: "2027-02-03T00:00:00.000Z",
    ...more,
  };
}

function create(api: any, authority = grant(), more: Record<string, unknown> = {}) {
  return api.createCareerExecutionContextRevision(authority, input(authority, more));
}

describe("T12D CareerExecutionContextRevision domain RED contract", () => {
  it("starts from an exact canonical two-subject T12C EAGR fixture", () => {
    const value = fixture();
    expect(value.grant.careerHumanCommitmentId).toBe(value.commitment.careerHumanCommitmentId);
    expect(value.grant.decisionSubjects).toEqual(value.commitment.decisionSubjects);
    expect(value.grant.decisionSubjects).toHaveLength(2);
    expect(value.grant.effectiveFrom <= value.grant.declaredAt).toBe(true);
    expect(value.grant.declaredAt < value.grant.effectiveUntil!).toBe(true);
  });

  it("creates exactly the frozen ECTXREV shape by copying all EAGR witnesses", async () => {
    const api = await loadContextRevision();
    const authority = grant();
    const context = create(api, authority);
    expect(Object.keys(context).sort()).toEqual([
      "careerExecutionContextRevisionId", "careerExecutionAuthorityGrantRevisionId",
      "careerHumanCommitmentId", "careerDecisionActionIntentId", "humanDecisionRecordId",
      "careerDecisionContextRevisionId", "decisionAuthorityGrantRevisionId",
      "recommendationProposalId", "declaredByActorId", "decisionSubjects",
      "sourceDeclarationClass", "sourceActionIntentClass", "operationDescription",
      "executionAuthorityScope", "executionTarget", "executionChannel", "declaredAt",
      "contextEvidenceRefs", "schemaVersion", "createdAt",
    ].sort());
    expect(context).toMatchObject({
      careerExecutionAuthorityGrantRevisionId: authority.careerExecutionAuthorityGrantRevisionId,
      careerHumanCommitmentId: authority.careerHumanCommitmentId,
      careerDecisionActionIntentId: authority.careerDecisionActionIntentId,
      humanDecisionRecordId: authority.humanDecisionRecordId,
      careerDecisionContextRevisionId: authority.careerDecisionContextRevisionId,
      decisionAuthorityGrantRevisionId: authority.decisionAuthorityGrantRevisionId,
      recommendationProposalId: authority.recommendationProposalId,
      decisionSubjects: authority.decisionSubjects,
      sourceDeclarationClass: authority.sourceDeclarationClass,
      sourceActionIntentClass: authority.sourceActionIntentClass,
      operationDescription: authority.operationDescription,
      executionAuthorityScope: authority.executionAuthorityScope,
      declaredByActorId: authority.authorizedExecutionActorId,
      executionTarget: { targetKind: "PERSON", targetRef: "target://person/1" },
      executionChannel: { channelKind: "EMAIL", channelRef: "channel://email/1" },
      contextEvidenceRefs: ["evidence://context/t12d/a", "evidence://context/t12d/b"],
      schemaVersion: "CAREER_EXECUTION_CONTEXT_REVISION_V1",
    });
    expect(context.careerExecutionContextRevisionId).toMatch(/^ECTXREV_[0-9A-F]{32}$/);
    expect(context).not.toHaveProperty("permittedTargetKinds");
    expect(context).not.toHaveProperty("permittedChannelKinds");
    expect(Object.keys(input(authority)).sort()).toEqual([
      "careerExecutionAuthorityGrantRevisionId", "declaredByActorId", "executionTarget",
      "executionChannel", "declaredAt", "contextEvidenceRefs", "createdAt",
    ].sort());
    for (const forbidden of [
      "careerHumanCommitmentId", "careerDecisionActionIntentId", "humanDecisionRecordId",
      "careerDecisionContextRevisionId", "decisionAuthorityGrantRevisionId", "recommendationProposalId",
      "decisionSubjects", "sourceDeclarationClass", "sourceActionIntentClass", "operationDescription",
      "executionAuthorityScope", "schemaVersion", "grantorActorId", "authorizedExecutionActorId",
      "occurredAt", "executedAt", "occurrenceActorId", "externalActionRef", "stateChange",
      "outcome", "rationale", "assignment",
    ]) expect(() => create(api, authority, { [forbidden]: "caller-override" })).toThrow(invalid);
  });

  it("derives pure deterministic ECTXREV identity from all semantic fields except createdAt", async () => {
    const api = await loadContextRevision();
    const context = create(api);
    const semantic = { ...context } as any;
    delete semantic.careerExecutionContextRevisionId;
    delete semantic.createdAt;
    expect(api.deriveCareerExecutionContextRevisionId(semantic))
      .toBe(context.careerExecutionContextRevisionId);
    expect(create(api, grant(), { createdAt: "2027-02-05T00:00:00.000Z" })
      .careerExecutionContextRevisionId).toBe(context.careerExecutionContextRevisionId);
    for (const [field, changed] of [
      ["careerExecutionAuthorityGrantRevisionId", "EAGR_00000000000000000000000000000000"],
      ["careerHumanCommitmentId", "HCOM_00000000000000000000000000000000"],
      ["careerDecisionActionIntentId", "DAINT_00000000000000000000000000000000"],
      ["humanDecisionRecordId", "DCR_00000000000000000000000000000000"],
      ["careerDecisionContextRevisionId", "DCTXREV_00000000000000000000000000000000"],
      ["decisionAuthorityGrantRevisionId", "DAR_00000000000000000000000000000000"],
      ["recommendationProposalId", "RCP_00000000000000000000000000000000"],
      ["declaredByActorId", "OTHER_EXECUTOR"],
      ["decisionSubjects", [...context.decisionSubjects].reverse()],
      ["sourceDeclarationClass", "REQUEST_FURTHER_EVIDENCE"],
      ["sourceActionIntentClass", "FURTHER_EVIDENCE_REQUEST_OPERATIONALIZATION"],
      ["operationDescription", "Different canonical operation"],
      ["executionAuthorityScope", "FURTHER_EVIDENCE_REQUEST_EXECUTION"],
      ["executionTarget", { targetKind: "ORGANIZATION", targetRef: "target://organization/1" }],
      ["executionChannel", { channelKind: "API", channelRef: "channel://api/1" }],
      ["declaredAt", "2027-02-03T00:00:01.000Z"],
      ["contextEvidenceRefs", ["evidence://context/t12d/c"]],
    ] as const) {
      const payload = { ...semantic, [field]: changed };
      const changedId = api.deriveCareerExecutionContextRevisionId(payload);
      expect(changedId).toMatch(/^ECTXREV_[0-9A-F]{32}$/);
      expect(changedId).not.toBe(context.careerExecutionContextRevisionId);
      expect(() => api.assertCareerExecutionContextRevision({ ...context, ...payload }))
        .toThrow(invalid);
    }
    // Pure derivation has no EAGR operand: closed standalone values remain derivable.
    expect(api.deriveCareerExecutionContextRevisionId({
      ...semantic,
      declaredByActorId: "UNRELATED_ACTOR",
      executionTarget: { targetKind: "ORGANIZATION", targetRef: "target://opaque/1" },
      executionChannel: { channelKind: "API", channelRef: "channel://opaque/1" },
      declaredAt: "2027-02-04T00:00:00.000Z",
    })).toMatch(/^ECTXREV_[0-9A-F]{32}$/);
  });

  it("enforces the exact EAGR authorized actor and preserves no implicit delegation", async () => {
    const api = await loadContextRevision();
    const authority = grant();
    expect(create(api, authority, { declaredByActorId: "  EXECUTOR_T12D  " })
      .declaredByActorId).toBe("EXECUTOR_T12D");
    for (const actor of ["", " ", authority.grantorActorId, authority.careerHumanCommitmentId]) {
      expect(() => create(api, authority, { declaredByActorId: actor })).toThrow(invalid);
    }
    const durable = create(api, authority);
    expect(() => api.assertCareerExecutionContextRevision({
      ...durable, declaredByActorId: "  EXECUTOR_T12D  ",
    })).toThrow(invalid);
  });

  it("permits one opaque target only when its closed kind is granted", async () => {
    const api = await loadContextRevision();
    const authority = grant();
    for (const targetKind of [
      "PERSON", "ORGANIZATION", "SYSTEM", "DOCUMENT", "COMMUNICATION_ENDPOINT",
    ]) {
      expect(create(api, authority, {
        executionTarget: { targetKind, targetRef: ` opaque://${targetKind.toLowerCase()}/1 ` },
      }).executionTarget).toEqual({ targetKind, targetRef: `opaque://${targetKind.toLowerCase()}/1` });
    }
    const limited = grant(fixture(), { permittedTargetKinds: ["PERSON"] });
    expect(() => create(api, limited, {
      executionTarget: { targetKind: "SYSTEM", targetRef: "target://system/1" },
    })).toThrow(invalid);
    for (const target of [
      { targetKind: "UNKNOWN", targetRef: "target://x" },
      { targetKind: "PERSON", targetRef: "" },
      { targetKind: "PERSON", targetRef: " " },
      { targetKind: "PERSON", targetRef: "target://x", extra: true },
      [{ targetKind: "PERSON", targetRef: "target://x" }],
    ]) expect(() => create(api, authority, { executionTarget: target })).toThrow(invalid);
    const context = create(api, authority);
    expect(() => api.assertCareerExecutionContextRevision({
      ...context, executionTarget: { targetKind: "PERSON", targetRef: " target://person/1 " },
    })).toThrow(invalid);
  });

  it("permits one opaque channel only when its closed kind is granted", async () => {
    const api = await loadContextRevision();
    const authority = grant();
    for (const channelKind of ["EMAIL", "MESSAGE", "API", "DOCUMENT", "HUMAN_HANDOFF"]) {
      expect(create(api, authority, {
        executionChannel: { channelKind, channelRef: ` opaque://${channelKind.toLowerCase()}/1 ` },
      }).executionChannel).toEqual({ channelKind, channelRef: `opaque://${channelKind.toLowerCase()}/1` });
    }
    const limited = grant(fixture(), { permittedChannelKinds: ["EMAIL"] });
    expect(() => create(api, limited, {
      executionChannel: { channelKind: "API", channelRef: "channel://api/1" },
    })).toThrow(invalid);
    for (const channel of [
      { channelKind: "UNKNOWN", channelRef: "channel://x" },
      { channelKind: "EMAIL", channelRef: "" },
      { channelKind: "EMAIL", channelRef: " " },
      { channelKind: "EMAIL", channelRef: "channel://x", extra: true },
      [{ channelKind: "EMAIL", channelRef: "channel://x" }],
    ]) expect(() => create(api, authority, { executionChannel: channel })).toThrow(invalid);
    const context = create(api, authority);
    expect(() => api.assertCareerExecutionContextRevision({
      ...context, executionChannel: { channelKind: "EMAIL", channelRef: " channel://email/1 " },
    })).toThrow(invalid);
  });

  it("inherits all EAGR subjects and canonical context evidence without mutable selection", async () => {
    const api = await loadContextRevision();
    const authority = grant();
    const context = create(api, authority);
    expect(context.decisionSubjects).toEqual(authority.decisionSubjects);
    expect(context.decisionSubjects).toHaveLength(2);
    expect(context.contextEvidenceRefs).toEqual([
      "evidence://context/t12d/a", "evidence://context/t12d/b",
    ]);
    for (const more of [
      { decisionSubjects: authority.decisionSubjects.slice(0, 1) },
      { contextEvidenceRefs: [] }, { contextEvidenceRefs: [" "] },
      { contextEvidenceRefs: ["evidence://context/t12d/a", "evidence://context/t12d/a"] },
      { contextEvidenceRefs: ["evidence://context/t12d/a", " evidence://context/t12d/a "] },
    ]) expect(() => create(api, authority, more)).toThrow(invalid);
    for (const mutation of [
      { decisionSubjects: [...context.decisionSubjects].reverse() },
      { decisionSubjects: context.decisionSubjects.slice(0, 1) },
      { decisionSubjects: [...context.decisionSubjects, context.decisionSubjects[0]] },
      { contextEvidenceRefs: [...context.contextEvidenceRefs].reverse() },
      { contextEvidenceRefs: ["evidence://context/t12d/a", "evidence://context/t12d/a"] },
    ]) expect(() => api.assertCareerExecutionContextRevision({ ...context, ...mutation })).toThrow(invalid);
    (context.decisionSubjects as any[]).pop();
    (context.contextEvidenceRefs as any[]).pop();
    expect(authority.decisionSubjects).toHaveLength(2);
    expect(create(api, authority).contextEvidenceRefs).toHaveLength(2);
    const supplied = input(authority);
    const detached = api.createCareerExecutionContextRevision(authority, supplied);
    supplied.executionTarget.targetRef = "target://changed-input";
    supplied.executionChannel.channelRef = "channel://changed-input";
    expect(detached.executionTarget.targetRef).toBe("target://person/1");
    expect(detached.executionChannel.channelRef).toBe("channel://email/1");
    (detached.executionTarget as any).targetRef = "target://changed-return";
    (detached.executionChannel as any).channelRef = "channel://changed-return";
    expect(create(api, authority).executionTarget.targetRef).toBe("target://person/1");
    expect(create(api, authority).executionChannel.channelRef).toBe("channel://email/1");
  });

  it("requires an explicit declaration inside the half-open EAGR interval, not DAR or occurrence time", async () => {
    const api = await loadContextRevision();
    const authority = grant();
    expect(create(api, authority, { declaredAt: authority.effectiveFrom }).declaredAt)
      .toBe(authority.effectiveFrom);
    expect(create(api, authority, { declaredAt: "2027-02-03T12:00:00.000Z" }).declaredAt)
      .toBe("2027-02-03T12:00:00.000Z");
    expect(create(api, grant(fixture(), { effectiveUntil: null }), {
      declaredAt: "2030-01-01T00:00:00.000Z",
    }).declaredAt).toBe("2030-01-01T00:00:00.000Z");
    for (const more of [
      { declaredAt: "not-iso" }, { createdAt: "not-iso" },
      { declaredAt: "2027-02-02T23:59:59.999Z" },
      { declaredAt: "2027-02-04T00:00:00.000Z" },
      { declaredAt: "2027-02-04T00:00:00.001Z" },
      { occurredAt: "2027-02-03T12:00:00.000Z" },
      { executedAt: "2027-02-03T12:00:00.000Z" },
    ]) expect(() => create(api, authority, more)).toThrow(invalid);
  });

  it("rejects stale or noncanonical durable state and exposes no occurrence or mutable-authority surface", async () => {
    const api = await loadContextRevision();
    const context = create(api);
    for (const mutation of [
      { careerExecutionContextRevisionId: "ECTXREV_00000000000000000000000000000000" },
      { schemaVersion: "CAREER_EXECUTION_CONTEXT_REVISION_V0" },
      { declaredAt: "not-iso" }, { createdAt: "not-iso" },
      { declaredByActorId: " EXECUTOR_T12D " },
      { executionTarget: { targetKind: "PERSON", targetRef: " target://person/1 " } },
      { executionChannel: { channelKind: "EMAIL", channelRef: " channel://email/1 " } },
      { unknown: "field" },
    ]) expect(() => api.assertCareerExecutionContextRevision({ ...context, ...mutation })).toThrow(invalid);
    for (const forbidden of [
      "occurrenceActorId", "performedBy", "occurredAt", "executedAt", "externalActionRef",
      "externalResult", "deliveryReceipt", "response", "completion", "success", "failure",
      "stateChange", "outcome", "causality", "current", "latest", "head", "active",
      "expired", "executing", "executed", "status", "executionAuthority",
    ]) expect(context).not.toHaveProperty(forbidden);
    expect(Object.keys(api).sort()).toEqual([
      "assertCareerExecutionContextRevision",
      "createCareerExecutionContextRevision",
      "deriveCareerExecutionContextRevisionId",
      "stableCareerExecutionContextRevision",
    ].sort());
    expect(existsSync(sourcePath)).toBe(true);
    const source = readFileSync(sourcePath, "utf8");
    expect(source).not.toMatch(/Date\.now|Math\.random|uuid|current|latest|head|provider|model|matcher|score|rank|priority|execution-context\/|execution-authority\/|action-occurrence-claim|career\/decisions\/action\.ts|legacyLifecycleRepository/i);
  });
});
