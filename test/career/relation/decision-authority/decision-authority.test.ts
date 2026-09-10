import { describe, expect, it } from "vitest";
import {
  assertDecisionAuthorityGrantRevision,
  byteReplayDecisionAuthorityGrantRevision,
  createDecisionAuthorityGrantRevision,
  derivationReplayDecisionAuthorityGrantRevision,
  InMemoryDecisionAuthorityGrantRevisionRepository,
  semanticReplayDecisionAuthorityGrantRevision
} from "../../../../lib/career/relation/decision-authority";

const input = {
  grantorActorId: "ACTOR_GRANTOR",
  authorizedActorId: "ACTOR_DECIDER",
  authorityScope: "CAREER_RECOMMENDATION_DECISION" as const,
  permittedDecisionClasses: ["REQUEST_TARGET_CLARIFICATION", "ACCEPT_RECOMMENDATION", "DEFER_DECISION"] as const,
  permittedSubjectKinds: ["RCP_ITEM"] as const,
  authorityEvidenceRefs: ["evidence://grant/b", "evidence://grant/a"] as const,
  declaredAt: "2027-01-10T00:00:00.000Z",
  effectiveFrom: "2027-01-11T00:00:00.000Z",
  effectiveUntil: "2027-12-31T00:00:00.000Z",
  createdAt: "2027-01-10T00:01:00.000Z"
};
const grant = (override: Record<string, unknown> = {}) => createDecisionAuthorityGrantRevision({ ...input, ...override } as typeof input);

describe("T11A DecisionAuthorityGrantRevision", () => {
  it("creates a deterministic, canonical explicit historical grant declaration", () => {
    const value = grant();
    assertDecisionAuthorityGrantRevision(value);
    expect(value).toMatchObject({
      decisionAuthorityGrantRevisionId: expect.stringMatching(/^DAR_[0-9A-F]{32}$/),
      authorityScope: "CAREER_RECOMMENDATION_DECISION",
      permittedDecisionClasses: ["ACCEPT_RECOMMENDATION", "DEFER_DECISION", "REQUEST_TARGET_CLARIFICATION"],
      permittedSubjectKinds: ["RCP_ITEM"],
      authorityEvidenceRefs: ["evidence://grant/a", "evidence://grant/b"]
    });
  });

  it("binds every semantic grant fact but excludes audit createdAt from identity", () => {
    const original = grant();
    expect(grant({ createdAt: "2028-01-10T00:01:00.000Z" }).decisionAuthorityGrantRevisionId).toBe(original.decisionAuthorityGrantRevisionId);
    for (const [key, value] of Object.entries({
      declaredAt: "2027-01-09T00:00:00.000Z",
      effectiveFrom: "2027-01-12T00:00:00.000Z",
      effectiveUntil: null,
      grantorActorId: "ACTOR_OTHER_GRANTOR",
      authorizedActorId: "ACTOR_OTHER_DECIDER",
      authorityEvidenceRefs: ["evidence://grant/c"],
      permittedDecisionClasses: ["REJECT_RECOMMENDATION"]
    })) expect(grant({ [key]: value }).decisionAuthorityGrantRevisionId).not.toBe(original.decisionAuthorityGrantRevisionId);
  });

  it("canonicalizes caller inventory order without accepting duplicates", () => {
    const canonical = grant();
    expect(grant({ permittedDecisionClasses: ["DEFER_DECISION", "ACCEPT_RECOMMENDATION", "REQUEST_TARGET_CLARIFICATION"], authorityEvidenceRefs: ["evidence://grant/a", "evidence://grant/b"] }).decisionAuthorityGrantRevisionId).toBe(canonical.decisionAuthorityGrantRevisionId);
    expect(() => grant({ permittedDecisionClasses: ["ACCEPT_RECOMMENDATION", "ACCEPT_RECOMMENDATION"] })).toThrow("ERR_DECISION_AUTHORITY_GRANT_INVALID");
    expect(() => grant({ permittedSubjectKinds: [] })).toThrow("ERR_DECISION_AUTHORITY_GRANT_INVALID");
    expect(() => grant({ authorityEvidenceRefs: [] })).toThrow("ERR_DECISION_AUTHORITY_GRANT_INVALID");
  });

  it("fails closed for free scope, unknown vocabulary, self-grant, malformed times, and tampered identity", () => {
    expect(() => grant({ authorityScope: "GLOBAL" })).toThrow("ERR_DECISION_AUTHORITY_GRANT_INVALID");
    expect(() => grant({ permittedDecisionClasses: ["AUTHORIZED_ACTION"] })).toThrow("ERR_DECISION_AUTHORITY_GRANT_INVALID");
    expect(() => grant({ permittedSubjectKinds: ["WHOLE_PROPOSAL"] })).toThrow("ERR_DECISION_AUTHORITY_GRANT_INVALID");
    expect(() => grant({ grantorActorId: "ACTOR_DECIDER" })).toThrow("ERR_DECISION_AUTHORITY_GRANT_INVALID");
    expect(() => grant({ declaredAt: "not-a-time" })).toThrow("ERR_DECISION_AUTHORITY_GRANT_INVALID");
    expect(() => grant({ effectiveUntil: "2027-01-11T00:00:00.000Z" })).toThrow("ERR_DECISION_AUTHORITY_GRANT_INVALID");
    expect(() => assertDecisionAuthorityGrantRevision({ ...grant(), decisionAuthorityGrantRevisionId: "DAR_00000000000000000000000000000000" })).toThrow("ERR_DECISION_AUTHORITY_GRANT_INVALID");
    expect(() => assertDecisionAuthorityGrantRevision({ ...grant(), active: true })).toThrow("ERR_DECISION_AUTHORITY_GRANT_INVALID");
  });

  it("has immutable detached memory persistence and exact historical replay only", async () => {
    const repository = new InMemoryDecisionAuthorityGrantRevisionRepository();
    const value = grant();
    await expect(repository.persistDecisionAuthorityGrantRevision(value)).resolves.toEqual(value);
    await expect(repository.persistDecisionAuthorityGrantRevision(value)).resolves.toEqual(value);
    await expect(repository.persistDecisionAuthorityGrantRevision({ ...value, createdAt: "2028-01-10T00:01:00.000Z" })).rejects.toThrow("ERR_DECISION_AUTHORITY_GRANT_IMMUTABLE_CONFLICT");
    const read = (await repository.getDecisionAuthorityGrantRevisionById(value.decisionAuthorityGrantRevisionId))!;
    (read.authorityEvidenceRefs as string[]).push("evidence://mutated");
    await expect(repository.getDecisionAuthorityGrantRevisionById(value.decisionAuthorityGrantRevisionId)).resolves.toEqual(value);
    await expect(byteReplayDecisionAuthorityGrantRevision(value.decisionAuthorityGrantRevisionId, repository)).resolves.toEqual(value);
    await expect(semanticReplayDecisionAuthorityGrantRevision(value.decisionAuthorityGrantRevisionId, repository)).resolves.toEqual(value);
    await expect(derivationReplayDecisionAuthorityGrantRevision(value.decisionAuthorityGrantRevisionId, repository)).resolves.toEqual(value);
    await expect(byteReplayDecisionAuthorityGrantRevision("DAR_00000000000000000000000000000000", repository)).rejects.toThrow("ERR_DECISION_AUTHORITY_GRANT_NOT_FOUND");
  });
});
