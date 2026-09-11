import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createT12AHistoricalFixture } from "../action-intent/t12a-historical-fixture";

const loadCommitment = () => import("../../../../lib/career/relation/human-commitment") as Promise<any>;
const sourcePath = resolve(process.cwd(), "lib/career/relation/human-commitment/contract.ts");

function fixture() {
  return createT12AHistoricalFixture();
}

function input(value: ReturnType<typeof fixture>, more: Record<string, unknown> = {}) {
  return {
    careerDecisionActionIntentId: value.actionIntent.careerDecisionActionIntentId,
    committedByActorId: value.actionIntent.declaredByActorId,
    committedAt: value.actionIntent.declaredAt,
    commitmentEvidenceRefs: ["evidence://commitment/b", "evidence://commitment/a"],
    createdAt: "2027-02-03T00:00:00.000Z",
    ...more,
  };
}

function create(api: any, value = fixture(), more: Record<string, unknown> = {}) {
  return api.createCareerHumanCommitment(value.actionIntent, input(value, more));
}

describe("T12B CareerHumanCommitment domain RED contract", () => {
  it("starts from an exact canonical two-subject T12A DAINT fixture", () => {
    const value = fixture();
    expect(value.actionIntent.decisionSubjects).toEqual(value.decisionRecord.decisionSubjects);
    expect(value.actionIntent.decisionSubjects).toHaveLength(2);
    expect(value.actionIntent.declaredAt >= value.decisionRecord.declaredAt).toBe(true);
  });

  it("creates one exact immutable human commitment from an exact DAINT", async () => {
    const api = await loadCommitment();
    const value = fixture();
    const commitment = create(api, value);

    expect(commitment).toMatchObject({
      careerDecisionActionIntentId: value.actionIntent.careerDecisionActionIntentId,
      humanDecisionRecordId: value.actionIntent.humanDecisionRecordId,
      careerDecisionContextRevisionId: value.actionIntent.careerDecisionContextRevisionId,
      decisionAuthorityGrantRevisionId: value.actionIntent.decisionAuthorityGrantRevisionId,
      recommendationProposalId: value.actionIntent.recommendationProposalId,
      committedByActorId: value.actionIntent.declaredByActorId,
      decisionSubjects: value.actionIntent.decisionSubjects,
      sourceDeclarationClass: value.actionIntent.sourceDeclarationClass,
      sourceActionIntentClass: value.actionIntent.actionIntentClass,
      operationDescription: value.actionIntent.operationDescription,
      committedAt: value.actionIntent.declaredAt,
      commitmentEvidenceRefs: ["evidence://commitment/a", "evidence://commitment/b"],
      schemaVersion: "CAREER_HUMAN_COMMITMENT_V1",
    });
    expect(commitment.careerHumanCommitmentId).toMatch(/^HCOM_[0-9A-F]{32}$/);
  });

  it("has deterministic HCOM identity, excludes createdAt, and includes committedAt, evidence, and every copied semantic witness", async () => {
    const api = await loadCommitment();
    const value = fixture();
    const first = create(api, value);
    const changed = [
      { createdAt: "2027-02-04T00:00:00.000Z" },
      { committedAt: "2027-02-02T00:00:01.000Z" },
      { commitmentEvidenceRefs: ["evidence://commitment/c"] },
    ];

    expect(create(api, value)).toEqual(first);
    expect(create(api, value, changed[0]).careerHumanCommitmentId).toBe(first.careerHumanCommitmentId);
    for (const change of changed.slice(1)) expect(create(api, value, change).careerHumanCommitmentId).not.toBe(first.careerHumanCommitmentId);

    const semantic = { ...first };
    delete (semantic as any).careerHumanCommitmentId;
    delete (semantic as any).createdAt;
    expect(api.deriveCareerHumanCommitmentId(semantic)).toBe(first.careerHumanCommitmentId);
    for (const field of ["careerDecisionActionIntentId", "humanDecisionRecordId", "careerDecisionContextRevisionId", "decisionAuthorityGrantRevisionId", "recommendationProposalId", "decisionSubjects", "sourceDeclarationClass", "sourceActionIntentClass", "schemaVersion"] as const) {
      const tampered = structuredClone(semantic) as any;
      tampered[field] = field === "decisionSubjects" ? [...tampered[field]].reverse() : "BROKEN";
      expect(() => api.deriveCareerHumanCommitmentId(tampered)).toThrow("ERR_CAREER_HUMAN_COMMITMENT_INVALID");
    }
    for (const [field, changed] of [["committedByActorId", "OTHER_ACTOR"], ["operationDescription", "A different explicit operation"]] as const) {
      const changedPayload = { ...semantic, [field]: changed };
      const changedId = api.deriveCareerHumanCommitmentId(changedPayload);
      expect(changedId).toMatch(/^HCOM_[0-9A-F]{32}$/);
      expect(changedId).not.toBe(first.careerHumanCommitmentId);
      expect(() => api.assertCareerHumanCommitment({ ...first, ...changedPayload })).toThrow("ERR_CAREER_HUMAN_COMMITMENT_INVALID");
    }
  });

  it("requires canonical nonempty commitment evidence and canonicalizes valid caller ordering", async () => {
    const api = await loadCommitment();
    const value = fixture();
    const first = create(api, value);
    expect(create(api, value, { commitmentEvidenceRefs: ["evidence://commitment/a", "evidence://commitment/b"] })).toMatchObject({
      commitmentEvidenceRefs: ["evidence://commitment/a", "evidence://commitment/b"],
      careerHumanCommitmentId: first.careerHumanCommitmentId,
    });
    for (const commitmentEvidenceRefs of [[], "evidence://commitment/a", [42], [" "], ["evidence://commitment/a", "evidence://commitment/a"], ["evidence://commitment/a", " evidence://commitment/a "]]) {
      expect(() => create(api, value, { commitmentEvidenceRefs })).toThrow("ERR_CAREER_HUMAN_COMMITMENT_INVALID");
    }
  });

  it("requires the exact DAINT declarant and a canonical commitment time no earlier than the DAINT", async () => {
    const api = await loadCommitment();
    const value = fixture();
    expect(create(api, value, { committedAt: value.actionIntent.declaredAt }).committedAt).toBe(value.actionIntent.declaredAt);
    expect(create(api, value, { committedAt: "2027-02-02T00:00:01.000Z" }).committedAt).toBe("2027-02-02T00:00:01.000Z");
    for (const more of [
      { committedByActorId: "OTHER_ACTOR" },
      { committedAt: "2027-02-01T23:59:59.999Z" },
      { committedAt: "not-iso" },
      { createdAt: "not-iso" },
    ]) expect(() => create(api, value, more)).toThrow("ERR_CAREER_HUMAN_COMMITMENT_INVALID");
  });

  it("accepts exactly the five frozen caller fields and rejects lineage, selection, rationale, delegation, and execution overrides", async () => {
    const api = await loadCommitment();
    const value = fixture();
    expect(Object.keys(input(value)).sort()).toEqual(["careerDecisionActionIntentId", "committedByActorId", "committedAt", "commitmentEvidenceRefs", "createdAt"].sort());
    for (const forbidden of [
      "humanDecisionRecordId", "careerDecisionContextRevisionId", "decisionAuthorityGrantRevisionId", "recommendationProposalId", "decisionSubjects", "sourceDeclarationClass", "sourceActionIntentClass", "operationDescription", "actionType", "rationale", "assignment", "delegate", "delegation", "executionAuthority", "executionContext", "actionOccurrence", "outcome",
    ]) expect(() => create(api, value, { [forbidden]: "caller-override" })).toThrow("ERR_CAREER_HUMAN_COMMITMENT_INVALID");
  });

  it("inherits the complete exact DAINT subject, lineage, source-class, and operation-description boundary without reselection", async () => {
    const api = await loadCommitment();
    const value = fixture();
    const commitment = create(api, value);
    expect(commitment.decisionSubjects).toEqual(value.actionIntent.decisionSubjects);
    expect(commitment.decisionSubjects).toHaveLength(2);
    expect(commitment.decisionSubjects).toEqual([
      { recommendationProposalId: value.actionIntent.recommendationProposalId, sourceEvolutionInputItemOrdinal: 0 },
      { recommendationProposalId: value.actionIntent.recommendationProposalId, sourceEvolutionInputItemOrdinal: 1 },
    ]);
    expect(commitment.sourceDeclarationClass).toBe(value.actionIntent.sourceDeclarationClass);
    expect(commitment.sourceActionIntentClass).toBe(value.actionIntent.actionIntentClass);
    expect(commitment.operationDescription).toBe(value.actionIntent.operationDescription);
  });

  it("rejects stale IDs, noncanonical durable state, altered lineage, altered source witnesses, and altered subject inventories", async () => {
    const api = await loadCommitment();
    const value = fixture();
    const commitment = create(api, value);
    for (const mutation of [
      { careerHumanCommitmentId: "HCOM_00000000000000000000000000000000" },
      { careerDecisionActionIntentId: "DAINT_00000000000000000000000000000000" },
      { humanDecisionRecordId: "DCR_00000000000000000000000000000000" },
      { careerDecisionContextRevisionId: "DCTXREV_00000000000000000000000000000000" },
      { decisionAuthorityGrantRevisionId: "DAR_00000000000000000000000000000000" },
      { recommendationProposalId: "RCP_00000000000000000000000000000000" },
      { committedByActorId: "OTHER_ACTOR" },
      { sourceDeclarationClass: "REJECT_RECOMMENDATION" },
      { sourceActionIntentClass: "FURTHER_EVIDENCE_REQUEST_OPERATIONALIZATION" },
      { operationDescription: "  noncanonical  " },
      { committedAt: "not-iso" },
      { createdAt: "not-iso" },
      { decisionSubjects: [...commitment.decisionSubjects].reverse() },
      { decisionSubjects: commitment.decisionSubjects.slice(0, 1) },
      { decisionSubjects: [...commitment.decisionSubjects, commitment.decisionSubjects[0]] },
      { commitmentEvidenceRefs: [...commitment.commitmentEvidenceRefs].reverse() },
      { commitmentEvidenceRefs: [] },
      { commitmentEvidenceRefs: ["evidence://commitment/a", "evidence://commitment/a"] },
      { schemaVersion: "CAREER_HUMAN_COMMITMENT_V0" },
      { unknown: "field" },
    ]) expect(() => api.assertCareerHumanCommitment({ ...commitment, ...mutation })).toThrow("ERR_CAREER_HUMAN_COMMITMENT_INVALID");
  });

  it("fails closed when the source DAINT is stale or tampered and never accepts caller-supplied substitute lineage", async () => {
    const api = await loadCommitment();
    const value = fixture();
    for (const actionIntent of [
      { ...value.actionIntent, careerDecisionActionIntentId: "DAINT_00000000000000000000000000000000" },
      { ...value.actionIntent, operationDescription: "tampered" },
      { ...value.actionIntent, decisionSubjects: value.actionIntent.decisionSubjects.slice(0, 1) },
    ]) expect(() => api.createCareerHumanCommitment(actionIntent, input(value))).toThrow("ERR_CAREER_HUMAN_COMMITMENT_INVALID");
  });

  it("has the exact commitment artifact shape and no execution, permission, assignment, occurrence, outcome, or causality shortcut", async () => {
    const api = await loadCommitment();
    const commitment = create(api);
    expect(Object.keys(commitment).sort()).toEqual([
      "careerHumanCommitmentId", "careerDecisionActionIntentId", "humanDecisionRecordId", "careerDecisionContextRevisionId", "decisionAuthorityGrantRevisionId", "recommendationProposalId", "committedByActorId", "decisionSubjects", "sourceDeclarationClass", "sourceActionIntentClass", "operationDescription", "committedAt", "commitmentEvidenceRefs", "schemaVersion", "createdAt",
    ].sort());
    for (const forbidden of ["rationale", "actionType", "permission", "assignment", "delegate", "executionAuthority", "executionContext", "actionOccurrence", "completion", "success", "failure", "outcome", "causality", "fit", "qualification", "approved", "authorized"]) expect(commitment).not.toHaveProperty(forbidden);
  });

  it("exposes only the frozen T12B domain surface and does not treat DAINT existence as commitment", async () => {
    const api = await loadCommitment();
    expect(Object.keys(api).sort()).toEqual([
      "assertCareerHumanCommitment", "createCareerHumanCommitment", "deriveCareerHumanCommitmentId", "stableCareerHumanCommitment",
    ].sort());
    expect(Object.keys(api)).not.toEqual(expect.arrayContaining([
      "createExecutionAuthority", "createActionOccurrence", "commitFromActionIntent", "getCareerCommitment", "legacyCareerCommitments", "legacyLifecycleRepository",
    ]));
    expect(existsSync(sourcePath)).toBe(true);
    const source = readFileSync(sourcePath, "utf8");
    expect(source).not.toMatch(/Date\.now|Math\.random|uuid|current|latest|head|provider|model|matcher|score|rank|priority|career\/decisions\/action\.ts|careerCommitments|legacyLifecycleRepository/i);
  });
});
