import { describe, expect, it } from "vitest";
import { InMemoryDecisionAuthorityGrantRevisionRepository } from "../../../lib/career/relation/decision-authority";
import { InMemoryCareerDecisionContextRevisionRepository } from "../../../lib/career/relation/decision-context";
import { InMemoryHumanDecisionRecordRepository } from "../../../lib/career/relation/decision-record";
import { InMemoryRecommendationProposalRepository } from "../../../lib/career/relation/recommendation-proposal";
import {
  createHrDecisionLoopReadService,
  isUndefinedTableError,
  type ExactIndexedReader,
  type HrDecisionLoopReadDependencies
} from "../../../lib/career/hr-decision-loop/server-read-service";
import { HR_DECISION_LOOP_FORBIDDEN_CLAIM_KEYS, HR_DECISION_LOOP_REGION_NAMES } from "../../../lib/career/hr-decision-loop/read-model";
import { createT12AHistoricalFixture } from "../relation/action-intent/t12a-historical-fixture";
import { createT13HHistoricalFixture } from "../relation/outcome-valence-feedback-context-revision-persistence/t13h-historical-fixture";

class UndefinedTable extends Error { code = "42P01"; }

function indexed<T extends Record<string, unknown>>(values: readonly T[], idField: string, lineageField: string, options: { throwOnIndex?: Error; failRead?: boolean } = {}): ExactIndexedReader<T> & { reads: string[]; indexes: string[] } {
  const reads: string[] = [];
  const indexes: string[] = [];
  return {
    reads,
    indexes,
    async indexIds(exact) {
      indexes.push(exact);
      if (options.throwOnIndex) throw options.throwOnIndex;
      return values.filter(value => value[lineageField] === exact).map(value => String(value[idField])).sort().reverse();
    },
    async readById(id) {
      reads.push(id);
      if (options.failRead) throw new Error("ERR_FAMILY_PERSISTENCE_FAILED");
      return structuredClone(values.find(value => value[idField] === id) ?? null);
    }
  };
}

async function dependencies(overrides: Partial<HrDecisionLoopReadDependencies> = {}) {
  const fixture = createT12AHistoricalFixture();
  const authorities = new InMemoryDecisionAuthorityGrantRevisionRepository();
  const proposals = new InMemoryRecommendationProposalRepository();
  const contexts = new InMemoryCareerDecisionContextRevisionRepository();
  const records = new InMemoryHumanDecisionRecordRepository();
  await authorities.persistDecisionAuthorityGrantRevision(fixture.authority);
  await proposals.persistRecommendationProposal(fixture.proposal);
  await contexts.persistCareerDecisionContextRevision(fixture.context);
  await records.persistHumanDecisionRecord(fixture.decisionRecord);
  const empty = () => indexed<Record<string, unknown>>([], "id", "careerDecisionContextRevisionId") as never;
  const base: HrDecisionLoopReadDependencies = {
    authorities, proposals, contexts, records,
    decisionIndex: { indexIds: async exact => exact === fixture.context.careerDecisionContextRevisionId ? [fixture.decisionRecord.humanDecisionRecordId] : [], readById: id => records.getHumanDecisionRecordById(id) },
    actionIntents: indexed([fixture.actionIntent as unknown as Record<string, unknown>], "careerDecisionActionIntentId", "careerDecisionContextRevisionId") as never,
    commitments: empty(), executionAuthorityGrants: empty(), executionContexts: empty(), actionOccurrences: empty(), stateChanges: empty(), associations: empty(), outcomeRoles: empty(), outcomeValences: empty(), feedbackAdmissions: empty(), feedbackTargets: empty(), feedbackTargetBindings: empty(), feedbackContextRevisions: empty(), decisionRevisionBindings: empty(),
    ...overrides
  };
  return { fixture, base };
}

describe("HR Decision Loop read service", () => {
  it("reconstructs one exact context with sealed witnesses and labels each family by its own persisted state", async () => {
    const { fixture, base } = await dependencies();
    const model = await createHrDecisionLoopReadService(base).read(fixture.context.careerDecisionContextRevisionId);
    expect(model.schemaVersion).toBe("HR_DECISION_LOOP_READ_MODEL_V1");
    expect(model.careerDecisionContextRevision).toEqual(fixture.context);
    expect(model.decisionAuthorityGrantRevision).toEqual(fixture.authority);
    expect(model.recommendationProposal).toEqual(fixture.proposal);
    expect(model.decisions).toEqual({ state: "AVAILABLE", artifactIds: [fixture.decisionRecord.humanDecisionRecordId], artifacts: [fixture.decisionRecord] });
    expect(model.actionIntents).toEqual({ state: "AVAILABLE", artifactIds: [fixture.actionIntent.careerDecisionActionIntentId], artifacts: [fixture.actionIntent] });
    for (const name of HR_DECISION_LOOP_REGION_NAMES) if (name !== "decisions" && name !== "actionIntents") expect(model[name]).toEqual({ state: "EMPTY", artifactIds: [], artifacts: [] });
    for (const key of HR_DECISION_LOOP_FORBIDDEN_CLAIM_KEYS) expect(model).not.toHaveProperty(key);
  });

  it("represents an unprovisioned table and a failed-closed reread without repairing either", async () => {
    const { fixture, base } = await dependencies({
      commitments: indexed([], "id", "careerDecisionContextRevisionId", { throwOnIndex: new UndefinedTable("relation does not exist") }) as never,
      outcomeValences: indexed([{ careerOutcomeValenceDeclarationId: "COVD_X", careerDecisionContextRevisionId: fixture0() }], "careerOutcomeValenceDeclarationId", "careerDecisionContextRevisionId", { failRead: true }) as never,
      stateChanges: indexed([], "id", "careerDecisionContextRevisionId", { throwOnIndex: new Error("boom") }) as never
    });
    const model = await createHrDecisionLoopReadService(base).read(fixture.context.careerDecisionContextRevisionId);
    expect(model.commitments).toEqual({ state: "NOT_PROVISIONED", artifactIds: [], artifacts: [] });
    expect(model.outcomeValences).toEqual({ state: "FAILED", artifactIds: ["COVD_X"], artifacts: [], failureCode: "ERR_FAMILY_PERSISTENCE_FAILED" });
    expect(model.stateChanges).toEqual({ state: "FAILED", artifactIds: [], artifacts: [], failureCode: "ERR_HR_DECISION_LOOP_INDEX_FAILED" });
    expect(isUndefinedTableError(new UndefinedTable("x"))).toBe(true);
    expect(isUndefinedTableError({ cause: { code: "42P01" } })).toBe(true);
    expect(isUndefinedTableError(new Error("42P01"))).toBe(false);
  });

  it("walks COVFCR lineage by exact parent ids only and orders artifacts by id, never by time", async () => {
    const feedback = await createT13HHistoricalFixture();
    const { fixture, base } = await dependencies();
    const baseId = feedback.base.careerDecisionContextRevisionId;
    const first = feedback.firstRevision;
    const branch = feedback.branchRevision;
    const subsequent = { ...feedback.subsequentRevision, parent: { ...feedback.subsequentRevision.parent, parentRevisionId: first.careerOutcomeValenceFeedbackContextRevisionId } };
    const revisions = [subsequent, first, branch].map(revision => ({ ...revision, parentRevisionId: revision.parent.parentRevisionId })) as unknown as Record<string, unknown>[];
    const reader = indexed(revisions, "careerOutcomeValenceFeedbackContextRevisionId", "parentRevisionId");
    // The feedback fixtures derive from the same deterministic T12A DAR and RCP; only the base DCTXREV differs.
    await base.contexts.persistCareerDecisionContextRevision(feedback.base);
    expect(feedback.base.decisionAuthorityGrantRevisionId).toBe(fixture.authority.decisionAuthorityGrantRevisionId);
    const model = await createHrDecisionLoopReadService({ ...base, feedbackContextRevisions: reader as never }).read(baseId);
    expect(model.feedbackContextRevisions.state).toBe("AVAILABLE");
    expect(model.feedbackContextRevisions.artifactIds).toEqual([first, branch, subsequent].map(revision => revision.careerOutcomeValenceFeedbackContextRevisionId).sort());
    expect(reader.indexes[0]).toBe(baseId);
    expect(reader.indexes.slice(1).sort()).toEqual([first, branch].map(revision => revision.careerOutcomeValenceFeedbackContextRevisionId).sort().concat([subsequent.careerOutcomeValenceFeedbackContextRevisionId]).sort());
    expect(fixture.context.careerDecisionContextRevisionId).not.toBe(baseId);
  }, 20_000); // the T13H fixture rebuilds the full sealed feedback lineage; a load-sensitive budget, as in T49, keeps a proven walk from a false timeout

  it("fails closed for an absent or malformed context id", async () => {
    const { base } = await dependencies();
    const service = createHrDecisionLoopReadService(base);
    await expect(service.read("DCTXREV_00000000000000000000000000000000")).rejects.toThrow("ERR_HR_DECISION_LOOP_CONTEXT_NOT_FOUND");
    await expect(service.read(" padded ")).rejects.toThrow("ERR_HR_DECISION_LOOP_CONTEXT_INVALID");
    await expect(service.read("")).rejects.toThrow("ERR_HR_DECISION_LOOP_CONTEXT_INVALID");
  });
});

function fixture0(): string { return createT12AHistoricalFixture().context.careerDecisionContextRevisionId; }
