import { describe, expect, it } from "vitest";
import { InMemoryDecisionAuthorityGrantRevisionRepository } from "../../../lib/career/relation/decision-authority";
import { InMemoryCareerDecisionContextRevisionRepository } from "../../../lib/career/relation/decision-context";
import { InMemoryHumanDecisionRecordRepository } from "../../../lib/career/relation/decision-record";
import { InMemoryRecommendationProposalRepository } from "../../../lib/career/relation/recommendation-proposal";
import {
  captureHrDecisionDeclarationRequest,
  createHrDecisionDeclarationApplication,
  createLocalSelfDeclaredTransportIdentity,
  LOCAL_SELF_DECLARED_PRINCIPAL_ISSUER,
  PRINCIPAL_ISSUER_HEADER,
  PRINCIPAL_SUBJECT_HEADER
} from "../../../lib/career/hr-decision-loop/declaration-application";
import { createT12AHistoricalFixture } from "../relation/action-intent/t12a-historical-fixture";

const stamp = "2027-02-01T01:00:00.000Z";

async function application(now = () => "2027-02-01T02:00:00.000Z") {
  const fixture = createT12AHistoricalFixture();
  const authorities = new InMemoryDecisionAuthorityGrantRevisionRepository();
  const proposals = new InMemoryRecommendationProposalRepository();
  const contexts = new InMemoryCareerDecisionContextRevisionRepository();
  const records = new InMemoryHumanDecisionRecordRepository();
  await authorities.persistDecisionAuthorityGrantRevision(fixture.authority);
  await proposals.persistRecommendationProposal(fixture.proposal);
  await contexts.persistCareerDecisionContextRevision(fixture.context);
  const producer = { authorities, proposals, contexts, records };
  return { fixture, producer, records, app: createHrDecisionDeclarationApplication({ producer, identity: createLocalSelfDeclaredTransportIdentity(), now }) };
}

const request = (subject: string | null, issuer: string | null = LOCAL_SELF_DECLARED_PRINCIPAL_ISSUER) => {
  const headers = new Headers({ "content-type": "application/json" });
  if (issuer !== null) headers.set(PRINCIPAL_ISSUER_HEADER, issuer);
  if (subject !== null) headers.set(PRINCIPAL_SUBJECT_HEADER, subject);
  return new Request("http://local/api/career/hr-decision-loop/decisions", { method: "POST", headers, body: "{}" });
};

const body = (contextId: string, more: Record<string, unknown> = {}) => ({
  careerDecisionContextRevisionId: contextId,
  declarantActorId: "DECIDER_T12A",
  declarationClass: "ACCEPT_RECOMMENDATION",
  declaredAt: stamp,
  declarationEvidenceRefs: ["evidence://frontend/declaration"],
  ...more
});

describe("HR Decision Loop declaration application", () => {
  it("captures exactly the five declaration fields and rejects everything else", () => {
    const valid = body("DCTXREV_X");
    expect(captureHrDecisionDeclarationRequest(valid)).toEqual(valid);
    expect(() => captureHrDecisionDeclarationRequest({ ...valid, createdAt: stamp })).toThrow("ERR_HR_DECISION_LOOP_DECLARATION_INVALID");
    expect(() => captureHrDecisionDeclarationRequest({ ...valid, declarationClass: "APPROVE" })).toThrow("ERR_HR_DECISION_LOOP_DECLARATION_INVALID");
    expect(() => captureHrDecisionDeclarationRequest({ ...valid, declarantActorId: " DECIDER " })).toThrow("ERR_HR_DECISION_LOOP_DECLARATION_INVALID");
    expect(() => captureHrDecisionDeclarationRequest({ ...valid, declarationEvidenceRefs: [""] })).toThrow("ERR_HR_DECISION_LOOP_DECLARATION_INVALID");
    expect(() => captureHrDecisionDeclarationRequest([])).toThrow("ERR_HR_DECISION_LOOP_DECLARATION_INVALID");
  });

  it("admits a self-declared local principal and persists the DCR through the sealed T11C producer", async () => {
    const { fixture, app, records } = await application();
    const record = await app.declare(request("DECIDER_T12A"), body(fixture.context.careerDecisionContextRevisionId));
    expect(record.humanDecisionRecordId).toMatch(/^DCR_[0-9A-F]{32}$/);
    expect(record.careerDecisionContextRevisionId).toBe(fixture.context.careerDecisionContextRevisionId);
    expect(record.decisionSubjects).toEqual(fixture.context.decisionSubjects);
    expect(record.declaredAt).toBe(stamp);
    expect(record.createdAt).toBe("2027-02-01T02:00:00.000Z");
    expect(record.declarationEvidenceRefs).toEqual(["evidence://frontend/declaration"]);
    await expect(records.getHumanDecisionRecordById(record.humanDecisionRecordId)).resolves.toEqual(record);
    expect(record).not.toHaveProperty("current");
    expect(record).not.toHaveProperty("accepted");
  });

  it("is idempotent for the identical declaration and fails with the immutable conflict when only createdAt differs", async () => {
    const { fixture, app } = await application();
    const first = await app.declare(request("DECIDER_T12A"), body(fixture.context.careerDecisionContextRevisionId));
    await expect(app.declare(request("DECIDER_T12A"), body(fixture.context.careerDecisionContextRevisionId))).resolves.toEqual(first);
    const later = await application(() => "2027-02-01T03:00:00.000Z");
    const same = await later.app.declare(request("DECIDER_T12A"), body(later.fixture.context.careerDecisionContextRevisionId));
    expect(same.humanDecisionRecordId).toBe(first.humanDecisionRecordId);
    await later.producer.records.persistHumanDecisionRecord(same);
    const divergent = createHrDecisionDeclarationApplication({ producer: later.producer, identity: createLocalSelfDeclaredTransportIdentity(), now: () => "2027-02-01T04:00:00.000Z" });
    await expect(divergent.declare(request("DECIDER_T12A"), body(later.fixture.context.careerDecisionContextRevisionId))).rejects.toThrow("ERR_HUMAN_DECISION_IMMUTABLE_CONFLICT");
  });

  it("keeps the transport identity gate in front of the producer", async () => {
    const { fixture, app, records } = await application();
    const contextId = fixture.context.careerDecisionContextRevisionId;
    await expect(app.declare(request(null), body(contextId))).rejects.toThrow("ERR_HUMAN_DECISION_TRANSPORT_UNAUTHENTICATED");
    await expect(app.declare(request("DECIDER_T12A", "SOME_IDP"), body(contextId))).rejects.toThrow("ERR_HUMAN_DECISION_TRANSPORT_PRINCIPAL_UNMAPPED");
    await expect(app.declare(request("SOMEBODY_ELSE"), body(contextId))).rejects.toThrow("ERR_HUMAN_DECISION_TRANSPORT_DECLARANT_PRINCIPAL_MISMATCH");
    await expect(app.declare(request("DECIDER_T12A"), body(contextId, { declarationClass: "NOT_A_CLASS" }))).rejects.toThrow("ERR_HR_DECISION_LOOP_DECLARATION_INVALID");
    expect(await records.getHumanDecisionRecordById("DCR_" + "0".repeat(32))).toBeNull();
  });

  it("lets the sealed DAR gate reject what the transport identity alone would admit", async () => {
    const { fixture, app } = await application();
    const contextId = fixture.context.careerDecisionContextRevisionId;
    await expect(app.declare(request("INTRUDER"), body(contextId, { declarantActorId: "INTRUDER" }))).rejects.toThrow("ERR_HUMAN_DECISION_DECLARANT_MISMATCH");
    await expect(app.declare(request("DECIDER_T12A"), body(contextId, { declaredAt: "2027-02-01T13:00:00.000Z" }))).rejects.toThrow("ERR_HUMAN_DECISION_AUTHORITY_NOT_APPLICABLE");
    await expect(app.declare(request("DECIDER_T12A"), body(contextId, { declarationClass: "REQUEST_FURTHER_EVIDENCE" }))).rejects.toThrow("ERR_HUMAN_DECISION_SUBJECT_NOT_ADMISSIBLE");
    await expect(app.declare(request("DECIDER_T12A"), body("DCTXREV_" + "0".repeat(32)))).rejects.toThrow("ERR_HUMAN_DECISION_CONTEXT_NOT_FOUND");
  });
});
