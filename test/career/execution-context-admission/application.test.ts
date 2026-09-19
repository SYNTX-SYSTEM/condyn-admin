import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createT12DHistoricalFixture } from "../relation/execution-context-revision/t12d-historical-fixture";
import type { CareerExecutionAuthorityGrantRevision } from "../../../lib/career/relation/execution-authority-grant";

const modulePath = "../../../lib/career/execution-context-admission/application.ts";
const sourcePath = resolve(process.cwd(), "lib/career/execution-context-admission/application.ts");

async function load() {
  return await import(/* @vite-ignore */ new URL(modulePath, import.meta.url).href) as typeof import("../../../lib/career/execution-context-admission/application");
}

function declaration(overrides: Record<string, unknown> = {}) {
  const fixture = createT12DHistoricalFixture();
  return {
    careerExecutionAuthorityGrantRevisionId: fixture.grant.careerExecutionAuthorityGrantRevisionId,
    declaredByActorId: fixture.grant.authorizedExecutionActorId,
    executionTarget: { targetKind: "PERSON" as const, targetRef: " target://person/t35/1 " },
    executionChannel: { channelKind: "EMAIL" as const, channelRef: " channel://email/t35/1 " },
    declaredAt: fixture.grant.effectiveFrom,
    contextEvidenceRefs: [" evidence://context/t35/b ", "evidence://context/t35/a"],
    createdAt: "2027-02-03T00:00:00.000Z",
    ...overrides,
  };
}

function dependencies(overrides: { grant?: unknown; getError?: Error; persistError?: Error; persisted?: unknown } = {}) {
  const fixture = createT12DHistoricalFixture();
  const grant = overrides.grant === undefined ? fixture.grant : overrides.grant;
  const grants = {
    getCareerExecutionAuthorityGrantRevisionById: vi.fn(async (id: string) => {
      if (overrides.getError) throw overrides.getError;
      return grant && (grant as CareerExecutionAuthorityGrantRevision).careerExecutionAuthorityGrantRevisionId === id
        ? structuredClone(grant as CareerExecutionAuthorityGrantRevision)
        : null;
    }),
  };
  const contexts = {
    persistCareerExecutionContextRevision: vi.fn(async (value) => {
      if (overrides.persistError) throw overrides.persistError;
      return structuredClone(overrides.persisted ?? value);
    }),
  };
  return { fixture, grants, contexts };
}

describe("T35 explicit CareerExecutionContextRevision application admission", () => {
  it("exact-reads one EAGR, requires its authorized execution actor, preserves explicit context content, and persists one ECTXREV", async () => {
    const api = await load();
    const values = dependencies();
    const input = declaration();

    const result = await api.admitAndPersistCareerExecutionContextRevision(
      input,
      input.declaredByActorId,
      { grants: values.grants, contexts: values.contexts },
    );

    expect(values.grants.getCareerExecutionAuthorityGrantRevisionById).toHaveBeenCalledTimes(1);
    expect(values.grants.getCareerExecutionAuthorityGrantRevisionById).toHaveBeenCalledWith(input.careerExecutionAuthorityGrantRevisionId);
    expect(values.contexts.persistCareerExecutionContextRevision).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      careerExecutionAuthorityGrantRevisionId: input.careerExecutionAuthorityGrantRevisionId,
      declaredByActorId: input.declaredByActorId,
      executionTarget: { targetKind: "PERSON", targetRef: "target://person/t35/1" },
      executionChannel: { channelKind: "EMAIL", channelRef: "channel://email/t35/1" },
      declaredAt: input.declaredAt,
      contextEvidenceRefs: ["evidence://context/t35/a", "evidence://context/t35/b"],
      createdAt: input.createdAt,
      careerHumanCommitmentId: values.fixture.grant.careerHumanCommitmentId,
      careerDecisionActionIntentId: values.fixture.grant.careerDecisionActionIntentId,
      humanDecisionRecordId: values.fixture.grant.humanDecisionRecordId,
      careerDecisionContextRevisionId: values.fixture.grant.careerDecisionContextRevisionId,
      decisionAuthorityGrantRevisionId: values.fixture.grant.decisionAuthorityGrantRevisionId,
      recommendationProposalId: values.fixture.grant.recommendationProposalId,
      decisionSubjects: values.fixture.grant.decisionSubjects,
      sourceDeclarationClass: values.fixture.grant.sourceDeclarationClass,
      sourceActionIntentClass: values.fixture.grant.sourceActionIntentClass,
      operationDescription: values.fixture.grant.operationDescription,
      executionAuthorityScope: values.fixture.grant.executionAuthorityScope,
    });
    expect(result).not.toHaveProperty("actionOccurrence");
    expect(result).not.toHaveProperty("stateChange");
  });

  it("rejects an absent exact EAGR without discovery, fallback, or persistence", async () => {
    const api = await load();
    const values = dependencies({ grant: null });
    const input = declaration();

    await expect(api.admitAndPersistCareerExecutionContextRevision(input, input.declaredByActorId, { grants: values.grants, contexts: values.contexts }))
      .rejects.toThrow("ERR_CAREER_EXECUTION_CONTEXT_REVISION_AUTHORITY_NOT_FOUND");
    expect(values.grants.getCareerExecutionAuthorityGrantRevisionById).toHaveBeenCalledWith(input.careerExecutionAuthorityGrantRevisionId);
    expect(values.contexts.persistCareerExecutionContextRevision).not.toHaveBeenCalled();
  });

  it("rejects corrupt exact EAGR persistence without substituting another authority", async () => {
    const api = await load();
    const baseline = dependencies();
    const values = dependencies({
      grant: { ...baseline.fixture.grant, operationDescription: "tampered" },
    });
    const input = declaration();

    await expect(api.admitAndPersistCareerExecutionContextRevision(input, input.declaredByActorId, { grants: values.grants, contexts: values.contexts }))
      .rejects.toThrow("ERR_CAREER_EXECUTION_CONTEXT_REVISION_AUTHORITY_INVALID");
    expect(values.contexts.persistCareerExecutionContextRevision).not.toHaveBeenCalled();
  });

  it("requires exact equality among established actor, explicit declarant, and EAGR authorized execution actor", async () => {
    const api = await load();
    const values = dependencies();
    const input = declaration();
    await expect(api.admitAndPersistCareerExecutionContextRevision(input, "OTHER_ACTOR", { grants: values.grants, contexts: values.contexts }))
      .rejects.toThrow("ERR_CAREER_EXECUTION_CONTEXT_REVISION_DECLARANT_MISMATCH");
    expect(values.contexts.persistCareerExecutionContextRevision).not.toHaveBeenCalled();

    const foreign = declaration({ declaredByActorId: "OTHER_ACTOR" });
    await expect(api.admitAndPersistCareerExecutionContextRevision(foreign, "OTHER_ACTOR", { grants: values.grants, contexts: values.contexts }))
      .rejects.toThrow("ERR_CAREER_EXECUTION_CONTEXT_REVISION_DECLARANT_MISMATCH");
    expect(values.contexts.persistCareerExecutionContextRevision).not.toHaveBeenCalled();
  });

  it("leaves sealed explicit context and authority-scope validation intact while rejecting caller lineage overrides", async () => {
    const api = await load();
    const values = dependencies();
    for (const input of [
      declaration({ executionTarget: { targetKind: "DOCUMENT", targetRef: "target://document/t35" } }),
      declaration({ executionChannel: { channelKind: "API", channelRef: "channel://api/t35" } }),
      declaration({ contextEvidenceRefs: [] }),
      declaration({ declaredAt: "2027-02-04T00:00:00.000Z" }),
    ]) {
      await expect(api.admitAndPersistCareerExecutionContextRevision(input as ReturnType<typeof declaration>, values.fixture.grant.authorizedExecutionActorId, { grants: values.grants, contexts: values.contexts }))
        .rejects.toThrow("ERR_CAREER_EXECUTION_CONTEXT_REVISION_INVALID");
    }
    await expect(api.admitAndPersistCareerExecutionContextRevision(
      declaration({ inheritedLineage: "caller-override" }) as ReturnType<typeof declaration>,
      values.fixture.grant.authorizedExecutionActorId,
      { grants: values.grants, contexts: values.contexts },
    )).rejects.toThrow("ERR_CAREER_EXECUTION_CONTEXT_REVISION_ADMISSION_INVALID");
    expect(values.contexts.persistCareerExecutionContextRevision).not.toHaveBeenCalled();
  });

  it("preserves repository and immutable-conflict failures and rejects non-identical persisted context history", async () => {
    const api = await load();
    const input = declaration();
    const readFailure = dependencies({ getError: new Error("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_PERSISTENCE_FAILED") });
    await expect(api.admitAndPersistCareerExecutionContextRevision(input, input.declaredByActorId, { grants: readFailure.grants, contexts: readFailure.contexts }))
      .rejects.toThrow("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_PERSISTENCE_FAILED");
    const conflict = dependencies({ persistError: new Error("ERR_CAREER_EXECUTION_CONTEXT_REVISION_IMMUTABLE_CONFLICT") });
    await expect(api.admitAndPersistCareerExecutionContextRevision(input, input.declaredByActorId, { grants: conflict.grants, contexts: conflict.contexts }))
      .rejects.toThrow("ERR_CAREER_EXECUTION_CONTEXT_REVISION_IMMUTABLE_CONFLICT");
    const base = dependencies();
    const forged = dependencies({ persisted: { ...base.fixture.executionContext, contextEvidenceRefs: ["evidence://substituted"] } });
    await expect(api.admitAndPersistCareerExecutionContextRevision(input, input.declaredByActorId, { grants: forged.grants, contexts: forged.contexts }))
      .rejects.toThrow("ERR_CAREER_EXECUTION_CONTEXT_REVISION_PERSISTENCE_FAILED");
  });

  it("remains an application admission boundary with no transport/authentication, provider, currentness, or occurrence construction", async () => {
    await load();
    const source = readFileSync(sourcePath, "utf8");
    expect(source).toMatch(/export async function admitAndPersistCareerExecutionContextRevision/);
    expect(source).not.toMatch(/\.json\(|headers\.|cookies\(|Authorization|JWT|jose|issuer|subject|Date\.now|new Date|current|latest|head|provider|fetch\(|NextResponse|app\/api|ActionOccurrence|StateChange|Association|Outcome|Feedback/i);
    expect(source).not.toMatch(/\.toLowerCase\(|declaredByActorId\s*=/);
  });
});
