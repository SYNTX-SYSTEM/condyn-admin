import { describe, expect, it } from "vitest";
import { createT13HHistoricalFixture } from "./t13h-historical-fixture";
import { stableT13H, T13HInMemoryRepositories } from "./t13h-in-memory-repositories";

const loadCareerOutcomeValenceFeedbackContextRevisionPersistence = () =>
  import("../../../../lib/career/relation/outcome-valence-feedback-context-revision-persistence") as Promise<any>;

const childInvalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PERSISTENCE_CHILD_INVALID";
const parentNotFound = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PERSISTENCE_PARENT_NOT_FOUND";
const parentInvalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PERSISTENCE_PARENT_INVALID";
const parentBaseMismatch = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PERSISTENCE_PARENT_BASE_MISMATCH";
const immutableConflict = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PERSISTENCE_IMMUTABLE_CONFLICT";
const failed = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PERSISTENCE_FAILED";

const apiKeys = ["createBoundCareerOutcomeValenceFeedbackContextRevisionPersister"] as const;

function persister(api: any, repositories: T13HInMemoryRepositories) {
  return api.createBoundCareerOutcomeValenceFeedbackContextRevisionPersister(repositories.dependencies());
}

describe("CareerOutcomeValenceFeedbackContextRevision persistence frozen Domain contract", () => {
  it("constructs sealed COVFCR histories and observable test-only heterogeneous repository doubles without persistence", async () => {
    const value = await createT13HHistoricalFixture();
    const repositories = new T13HInMemoryRepositories();
    repositories.seedDecisionContext(value.base);
    repositories.seedFeedbackRevision(value.firstRevision);
    expect(value.firstRevision.parent.parentRevisionKind).toBe("CAREER_DECISION_CONTEXT_REVISION");
    expect(value.subsequentRevision.parent.parentRevisionKind)
      .toBe("CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION");
    expect(value.subsequentRevision.parent.parentFeedbackContextContent).toEqual(value.contentX);
    expect(repositories.decisionContextReads).toEqual([]);
    expect(repositories.feedbackRevisionWrites).toEqual([]);
  });

  it("exposes only the bound persistence operation and validates a child before any parent read or write", async () => {
    const api = await loadCareerOutcomeValenceFeedbackContextRevisionPersistence();
    const repositories = new T13HInMemoryRepositories();
    const bound = persister(api, repositories);
    await expect(bound.persistCareerOutcomeValenceFeedbackContextRevision({})).rejects.toThrow(childInvalid);
    expect(repositories.decisionContextReads).toEqual([]);
    expect(repositories.feedbackRevisionReads).toEqual([]);
    expect(repositories.feedbackRevisionWrites).toEqual([]);
    expect(Object.keys(api).sort()).toEqual([...apiKeys]);
    expect(api).not.toHaveProperty("CareerOutcomeValenceFeedbackContextRevisionPersistenceReceipt");
    expect(api).not.toHaveProperty("replayCareerOutcomeValenceFeedbackContextRevision");
    expect(api).not.toHaveProperty("createGenericParentResolver");
  });

  it("returns only a validated reread COVFCR and introduces neither a persistence state field nor a lineage receipt", async () => {
    const api = await loadCareerOutcomeValenceFeedbackContextRevisionPersistence();
    const value = await createT13HHistoricalFixture();
    const repositories = new T13HInMemoryRepositories();
    repositories.seedDecisionContext(value.base);
    const returned = await persister(api, repositories)
      .persistCareerOutcomeValenceFeedbackContextRevision(value.firstRevision);
    expect(returned).toEqual(value.firstRevision);
    expect(returned).not.toHaveProperty("persistenceState");
    expect(returned).not.toHaveProperty("current");
    expect(returned).not.toHaveProperty("latest");
    expect(returned).not.toHaveProperty("head");
    expect(api).not.toHaveProperty("createParentLineageVerification");
    expect(api).not.toHaveProperty("persistedRevisionReceipt");
  });

  it("persists a first revision only after complete DCTXREV parent resolution, including its audit-time historical witness", async () => {
    const api = await loadCareerOutcomeValenceFeedbackContextRevisionPersistence();
    const value = await createT13HHistoricalFixture();
    const repositories = new T13HInMemoryRepositories();
    repositories.seedDecisionContext(value.base);
    const result = await persister(api, repositories)
      .persistCareerOutcomeValenceFeedbackContextRevision(value.firstRevision);
    expect(result).toEqual(value.firstRevision);
    expect(result).not.toBe(value.firstRevision);
    expect(repositories.decisionContextReads).toEqual([value.base.careerDecisionContextRevisionId]);
    expect(repositories.feedbackRevisionWrites).toHaveLength(1);
    expect(repositories.feedbackRevisionReads).toEqual([
      value.firstRevision.careerOutcomeValenceFeedbackContextRevisionId,
    ]);

    const missing = new T13HInMemoryRepositories();
    await expect(persister(api, missing).persistCareerOutcomeValenceFeedbackContextRevision(value.firstRevision))
      .rejects.toThrow(parentNotFound);
    const malformed = new T13HInMemoryRepositories();
    malformed.scriptDecisionContextRead(value.base.careerDecisionContextRevisionId, {});
    await expect(persister(api, malformed).persistCareerOutcomeValenceFeedbackContextRevision(value.firstRevision))
      .rejects.toThrow(parentInvalid);
    const wrong = new T13HInMemoryRepositories();
    wrong.seedDecisionContext(value.alternateBase);
    wrong.scriptDecisionContextRead(value.base.careerDecisionContextRevisionId, value.alternateBase);
    await expect(persister(api, wrong).persistCareerOutcomeValenceFeedbackContextRevision(value.firstRevision))
      .rejects.toThrow(parentInvalid);
    const auditDifferent = new T13HInMemoryRepositories();
    auditDifferent.scriptDecisionContextRead(value.base.careerDecisionContextRevisionId, value.baseLaterAudit);
    await expect(persister(api, auditDifferent).persistCareerOutcomeValenceFeedbackContextRevision(value.firstRevision))
      .rejects.toThrow(parentBaseMismatch);
  });

  it("resolves a subsequent named COVFCR parent, preserves branch freedom, and keeps semantic COVFCC comparison audit-time-insensitive", async () => {
    const api = await loadCareerOutcomeValenceFeedbackContextRevisionPersistence();
    const value = await createT13HHistoricalFixture();
    const repositories = new T13HInMemoryRepositories();
    repositories.seedDecisionContext(value.base);
    repositories.seedFeedbackRevision(value.firstRevision);
    const bound = persister(api, repositories);
    await expect(bound.persistCareerOutcomeValenceFeedbackContextRevision(value.subsequentRevision))
      .resolves.toEqual(value.subsequentRevision);
    expect(repositories.feedbackRevisionReads[0])
      .toBe(value.firstRevision.careerOutcomeValenceFeedbackContextRevisionId);

    const auditEquivalentParent = structuredClone(value.firstRevision);
    auditEquivalentParent.careerOutcomeValenceFeedbackContextTransition.resultingFeedbackContextContent.createdAt =
      value.contentLaterAudit.createdAt;
    const auditEquivalent = new T13HInMemoryRepositories();
    auditEquivalent.seedDecisionContext(value.base);
    auditEquivalent.scriptFeedbackRevisionRead(
      value.firstRevision.careerOutcomeValenceFeedbackContextRevisionId,
      auditEquivalentParent,
    );
    await expect(persister(api, auditEquivalent).persistCareerOutcomeValenceFeedbackContextRevision(value.subsequentRevision))
      .resolves.toEqual(value.subsequentRevision);

    const missing = new T13HInMemoryRepositories();
    await expect(persister(api, missing).persistCareerOutcomeValenceFeedbackContextRevision(value.subsequentRevision))
      .rejects.toThrow(parentNotFound);
    const malformed = new T13HInMemoryRepositories();
    malformed.scriptFeedbackRevisionRead(value.firstRevision.careerOutcomeValenceFeedbackContextRevisionId, {});
    await expect(persister(api, malformed).persistCareerOutcomeValenceFeedbackContextRevision(value.subsequentRevision))
      .rejects.toThrow(parentInvalid);
    const wrong = new T13HInMemoryRepositories();
    wrong.scriptFeedbackRevisionRead(
      value.firstRevision.careerOutcomeValenceFeedbackContextRevisionId,
      value.branchRevision,
    );
    await expect(persister(api, wrong).persistCareerOutcomeValenceFeedbackContextRevision(value.subsequentRevision))
      .rejects.toThrow(parentInvalid);
    const lookupFailure = new T13HInMemoryRepositories();
    lookupFailure.scriptFeedbackRevisionRead(
      value.firstRevision.careerOutcomeValenceFeedbackContextRevisionId,
      new Error("repository outage"),
    );
    await expect(persister(api, lookupFailure).persistCareerOutcomeValenceFeedbackContextRevision(value.subsequentRevision))
      .rejects.toThrow(failed);

    const branches = new T13HInMemoryRepositories();
    branches.seedDecisionContext(value.base);
    await expect(persister(api, branches).persistCareerOutcomeValenceFeedbackContextRevision(value.firstRevision))
      .resolves.toEqual(value.firstRevision);
    await expect(persister(api, branches).persistCareerOutcomeValenceFeedbackContextRevision(value.branchRevision))
      .resolves.toEqual(value.branchRevision);
    expect(branches.feedbackRevisionWrites).toHaveLength(2);
    expect(Object.keys(branches.dependencies())).not.toContain("currentRevisionId");
    expect(Object.keys(branches.dependencies())).not.toContain("getAncestorRevisionById");
  });

  it("enforces immutable write and exact reread semantics without a receipt, replay, PostgreSQL, or ancestor traversal", async () => {
    const api = await loadCareerOutcomeValenceFeedbackContextRevisionPersistence();
    const value = await createT13HHistoricalFixture();
    const exact = new T13HInMemoryRepositories();
    exact.seedDecisionContext(value.base);
    exact.seedFeedbackRevision(value.firstRevision);
    await expect(persister(api, exact).persistCareerOutcomeValenceFeedbackContextRevision(value.firstRevision))
      .resolves.toEqual(value.firstRevision);

    const conflict = new T13HInMemoryRepositories();
    conflict.seedDecisionContext(value.base);
    conflict.seedFeedbackRevision(value.firstRevisionLaterAudit);
    await expect(persister(api, conflict).persistCareerOutcomeValenceFeedbackContextRevision(value.firstRevision))
      .rejects.toThrow(immutableConflict);

    const writeFailure = new T13HInMemoryRepositories();
    writeFailure.seedDecisionContext(value.base);
    writeFailure.writeFailure = new Error("write outage");
    await expect(persister(api, writeFailure).persistCareerOutcomeValenceFeedbackContextRevision(value.firstRevision))
      .rejects.toThrow(failed);

    const missingReread = new T13HInMemoryRepositories();
    missingReread.seedDecisionContext(value.base);
    missingReread.scriptFeedbackRevisionRead(
      value.firstRevision.careerOutcomeValenceFeedbackContextRevisionId,
      null,
    );
    await expect(persister(api, missingReread).persistCareerOutcomeValenceFeedbackContextRevision(value.firstRevision))
      .rejects.toThrow(failed);
    const malformedReread = new T13HInMemoryRepositories();
    malformedReread.seedDecisionContext(value.base);
    malformedReread.scriptFeedbackRevisionRead(
      value.firstRevision.careerOutcomeValenceFeedbackContextRevisionId,
      {},
    );
    await expect(persister(api, malformedReread).persistCareerOutcomeValenceFeedbackContextRevision(value.firstRevision))
      .rejects.toThrow(failed);
    const differentReread = new T13HInMemoryRepositories();
    differentReread.seedDecisionContext(value.base);
    differentReread.scriptFeedbackRevisionRead(
      value.firstRevision.careerOutcomeValenceFeedbackContextRevisionId,
      null,
      value.firstRevisionLaterAudit,
    );
    await expect(persister(api, differentReread).persistCareerOutcomeValenceFeedbackContextRevision(value.firstRevision))
      .rejects.toThrow(failed);

    const pristine = structuredClone(value.firstRevision);
    const noMutation = new T13HInMemoryRepositories();
    noMutation.seedDecisionContext(value.base);
    await persister(api, noMutation).persistCareerOutcomeValenceFeedbackContextRevision(value.firstRevision);
    expect(stableT13H(value.firstRevision)).toBe(stableT13H(pristine));
    // ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PERSISTENCE_PARENT_CONTENT_MISMATCH
    // remains defensive: a valid named-parent content mismatch is unreachable because deterministic
    // predecessor identities bind both the COVFCR parent ID and bounded COVFCC body before persistence.
    // A valid same-ID semantic COVFCR collision is likewise unreachable without corrupting a predecessor.
    expect(api).not.toHaveProperty("createCareerOutcomeValenceFeedbackContextRevisionPersistenceReceipt");
    expect(api).not.toHaveProperty("PostgresCareerOutcomeValenceFeedbackContextRevisionRepository");
    expect(api).not.toHaveProperty("parentLineageReplay");
  });
});
