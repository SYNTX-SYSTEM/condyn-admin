import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createT12CHistoricalFixture } from "../relation/execution-authority-grant/t12c-historical-fixture";
import type { CareerHumanCommitment } from "../../../lib/career/relation/human-commitment";

const modulePath = "../../../lib/career/execution-authority-admission/application.ts";
const sourcePath = resolve(process.cwd(), "lib/career/execution-authority-admission/application.ts");

async function load() {
  return await import(/* @vite-ignore */ new URL(modulePath, import.meta.url).href) as typeof import("../../../lib/career/execution-authority-admission/application");
}

function declaration(overrides: Record<string, unknown> = {}) {
  const fixture = createT12CHistoricalFixture();
  return {
    careerHumanCommitmentId: fixture.commitment.careerHumanCommitmentId,
    grantorActorId: "GRANTOR_T34",
    authorizedExecutionActorId: "EXECUTOR_T34",
    executionAuthorityScope: "RECOMMENDATION_OPERATION_EXECUTION" as const,
    permittedTargetKinds: ["SYSTEM", "PERSON"],
    permittedChannelKinds: ["MESSAGE", "EMAIL"],
    authorityEvidenceRefs: ["evidence://authority/t34/b", "evidence://authority/t34/a"],
    declaredAt: "2027-02-03T00:00:00.000Z",
    effectiveFrom: "2027-02-03T00:00:00.000Z",
    effectiveUntil: "2027-02-04T00:00:00.000Z",
    createdAt: "2027-02-03T00:00:00.000Z",
    ...overrides,
  };
}

function dependencies(overrides: { commitment?: unknown; getError?: Error; persistError?: Error; persisted?: unknown } = {}) {
  const fixture = createT12CHistoricalFixture();
  const commitment = overrides.commitment === undefined ? fixture.commitment : overrides.commitment;
  const commitments = {
    getCareerHumanCommitmentById: vi.fn(async (id: string) => {
      if (overrides.getError) throw overrides.getError;
      return commitment && (commitment as CareerHumanCommitment).careerHumanCommitmentId === id
        ? structuredClone(commitment as CareerHumanCommitment)
        : null;
    }),
  };
  const grants = {
    persistCareerExecutionAuthorityGrantRevision: vi.fn(async (value) => {
      if (overrides.persistError) throw overrides.persistError;
      return structuredClone(overrides.persisted ?? value);
    }),
  };
  return { fixture, commitments, grants };
}

describe("T34 explicit CareerExecutionAuthorityGrantRevision application admission", () => {
  it("exact-reads one HCOM, requires the established grantor, preserves explicit authority content, and persists one EAGR", async () => {
    const api = await load();
    const values = dependencies();
    const input = declaration();

    const result = await api.admitAndPersistCareerExecutionAuthorityGrantRevision(
      input,
      input.grantorActorId,
      { commitments: values.commitments, grants: values.grants },
    );

    expect(values.commitments.getCareerHumanCommitmentById).toHaveBeenCalledTimes(1);
    expect(values.commitments.getCareerHumanCommitmentById).toHaveBeenCalledWith(input.careerHumanCommitmentId);
    expect(values.grants.persistCareerExecutionAuthorityGrantRevision).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      careerHumanCommitmentId: input.careerHumanCommitmentId,
      grantorActorId: input.grantorActorId,
      authorizedExecutionActorId: input.authorizedExecutionActorId,
      executionAuthorityScope: input.executionAuthorityScope,
      permittedTargetKinds: ["PERSON", "SYSTEM"],
      permittedChannelKinds: ["EMAIL", "MESSAGE"],
      authorityEvidenceRefs: ["evidence://authority/t34/a", "evidence://authority/t34/b"],
      declaredAt: input.declaredAt,
      effectiveFrom: input.effectiveFrom,
      effectiveUntil: input.effectiveUntil,
      createdAt: input.createdAt,
      humanDecisionRecordId: values.fixture.commitment.humanDecisionRecordId,
      careerDecisionActionIntentId: values.fixture.commitment.careerDecisionActionIntentId,
      careerDecisionContextRevisionId: values.fixture.commitment.careerDecisionContextRevisionId,
      decisionAuthorityGrantRevisionId: values.fixture.commitment.decisionAuthorityGrantRevisionId,
      recommendationProposalId: values.fixture.commitment.recommendationProposalId,
      decisionSubjects: values.fixture.commitment.decisionSubjects,
      sourceDeclarationClass: values.fixture.commitment.sourceDeclarationClass,
      sourceActionIntentClass: values.fixture.commitment.sourceActionIntentClass,
      operationDescription: values.fixture.commitment.operationDescription,
    });
    expect(result).not.toHaveProperty("executionContext");
    expect(result).not.toHaveProperty("actionOccurrence");
    expect(result).not.toHaveProperty("stateChange");
  });

  it("rejects an absent exact HCOM without discovery, fallback, or persistence", async () => {
    const api = await load();
    const values = dependencies({ commitment: null });
    const input = declaration();

    await expect(api.admitAndPersistCareerExecutionAuthorityGrantRevision(input, input.grantorActorId, { commitments: values.commitments, grants: values.grants }))
      .rejects.toThrow("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_HUMAN_COMMITMENT_NOT_FOUND");
    expect(values.commitments.getCareerHumanCommitmentById).toHaveBeenCalledWith(input.careerHumanCommitmentId);
    expect(values.grants.persistCareerExecutionAuthorityGrantRevision).not.toHaveBeenCalled();
  });

  it("rejects corrupt exact HCOM persistence without substituting another parent", async () => {
    const api = await load();
    const base = dependencies();
    const values = dependencies({
      commitment: { ...base.fixture.commitment, operationDescription: "tampered" },
    });
    const input = declaration();

    await expect(api.admitAndPersistCareerExecutionAuthorityGrantRevision(input, input.grantorActorId, { commitments: values.commitments, grants: values.grants }))
      .rejects.toThrow("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_HUMAN_COMMITMENT_INVALID");
    expect(values.grants.persistCareerExecutionAuthorityGrantRevision).not.toHaveBeenCalled();
  });

  it("requires the established actor to be the explicit grantor without converting HCOM commitment into authority", async () => {
    const api = await load();
    const values = dependencies();
    const input = declaration();
    await expect(api.admitAndPersistCareerExecutionAuthorityGrantRevision(input, "OTHER_ACTOR", { commitments: values.commitments, grants: values.grants }))
      .rejects.toThrow("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_GRANTOR_MISMATCH");
    expect(values.grants.persistCareerExecutionAuthorityGrantRevision).not.toHaveBeenCalled();

    const foreignGrantor = declaration({ grantorActorId: "OTHER_GRANTOR" });
    await expect(api.admitAndPersistCareerExecutionAuthorityGrantRevision(foreignGrantor, input.grantorActorId, { commitments: values.commitments, grants: values.grants }))
      .rejects.toThrow("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_GRANTOR_MISMATCH");
    expect(values.grants.persistCareerExecutionAuthorityGrantRevision).not.toHaveBeenCalled();
  });

  it("leaves sealed explicit EAGR authority validation, scope mapping, and inherited lineage intact", async () => {
    const api = await load();
    const values = dependencies();
    for (const input of [
      declaration({ executionAuthorityScope: "FURTHER_EVIDENCE_REQUEST_EXECUTION" }),
      declaration({ permittedTargetKinds: [] }),
      declaration({ authorityEvidenceRefs: [] }),
      declaration({ declaredAt: "not-an-instant" }),
    ]) {
      await expect(api.admitAndPersistCareerExecutionAuthorityGrantRevision(input as ReturnType<typeof declaration>, input.grantorActorId, { commitments: values.commitments, grants: values.grants }))
        .rejects.toThrow("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_REVISION_INVALID");
    }
    await expect(api.admitAndPersistCareerExecutionAuthorityGrantRevision(
      declaration({ inheritedLineage: "caller-override" }) as ReturnType<typeof declaration>,
      "GRANTOR_T34",
      { commitments: values.commitments, grants: values.grants },
    )).rejects.toThrow("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_ADMISSION_INVALID");
    expect(values.grants.persistCareerExecutionAuthorityGrantRevision).not.toHaveBeenCalled();
  });

  it("preserves repository and immutable-conflict failures and rejects non-identical persisted authority history", async () => {
    const api = await load();
    const input = declaration();
    const readFailure = dependencies({ getError: new Error("ERR_CAREER_HUMAN_COMMITMENT_PERSISTENCE_FAILED") });
    await expect(api.admitAndPersistCareerExecutionAuthorityGrantRevision(input, input.grantorActorId, { commitments: readFailure.commitments, grants: readFailure.grants }))
      .rejects.toThrow("ERR_CAREER_HUMAN_COMMITMENT_PERSISTENCE_FAILED");
    const conflict = dependencies({ persistError: new Error("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_IMMUTABLE_CONFLICT") });
    await expect(api.admitAndPersistCareerExecutionAuthorityGrantRevision(input, input.grantorActorId, { commitments: conflict.commitments, grants: conflict.grants }))
      .rejects.toThrow("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_IMMUTABLE_CONFLICT");
    const base = dependencies();
    const forged = dependencies({ persisted: { ...base.fixture.grant, authorityEvidenceRefs: ["evidence://substituted"] } });
    await expect(api.admitAndPersistCareerExecutionAuthorityGrantRevision(input, input.grantorActorId, { commitments: forged.commitments, grants: forged.grants }))
      .rejects.toThrow("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_PERSISTENCE_FAILED");
  });

  it("remains an application admission boundary with no transport/authentication, currentness, provider, context, or occurrence construction", async () => {
    await load();
    const source = readFileSync(sourcePath, "utf8");
    expect(source).toMatch(/export async function admitAndPersistCareerExecutionAuthorityGrantRevision/);
    expect(source).not.toMatch(/\.json\(|headers\.|cookies\(|Authorization|JWT|jose|issuer|subject|Date\.now|new Date|current|latest|head|provider|fetch\(|NextResponse|app\/api|ExecutionContext|ActionOccurrence|StateChange|Association|Outcome|Feedback/i);
    expect(source).not.toMatch(/\.toLowerCase\(|grantorActorId\s*=/);
  });
});
