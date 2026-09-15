import { describe, expect, it } from "vitest";
import { createT13IHistoricalFixture } from "./t13i-historical-fixture";
import { T13IInMemoryReaders } from "./t13i-in-memory-repositories";

const loadCareerOutcomeValenceFeedbackContextRevisionReplay = () =>
  import("../../../../lib/career/relation/outcome-valence-feedback-context-revision-replay") as Promise<any>;

const notFound = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_NOT_FOUND";
const mismatch = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_REPLAY_MISMATCH";
const apiKeys = [
  "byteReplayCareerOutcomeValenceFeedbackContextRevision",
  "semanticReplayCareerOutcomeValenceFeedbackContextRevision",
  "derivationReplayCareerOutcomeValenceFeedbackContextRevision",
] as const;

/*
 * Constructed COVFCR is not persisted COVFCR. A typed parent reference is not
 * parent existence, and a bounded parent-content witness is not persisted
 * parent content. Replay verifies only the retained immediate relation: it is
 * neither currentness nor acceptance, and lawful branches have no sole child.
 */

describe("CareerOutcomeValenceFeedbackContextRevision frozen replay contract", () => {
  it("builds sealed first, subsequent, and branch COVFCR history with observable read-only doubles", async () => {
    const value = await createT13IHistoricalFixture();
    const readers = new T13IInMemoryReaders();
    readers.seedDecisionContext(value.base);
    readers.seedFeedbackRevision(value.firstReplayTarget);
    readers.seedFeedbackRevision(value.subsequentReplayTarget);
    expect(value.firstReplayTarget.parent.parentRevisionKind).toBe("CAREER_DECISION_CONTEXT_REVISION");
    expect(value.subsequentReplayTarget.parent.parentRevisionKind)
      .toBe("CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION");
    expect(value.branchReplayTarget.parent).toEqual(value.firstReplayTarget.parent);
    expect(value.branchReplayTarget.careerOutcomeValenceFeedbackContextRevisionId)
      .not.toBe(value.firstReplayTarget.careerOutcomeValenceFeedbackContextRevisionId);
    expect(readers.decisionContextReads).toEqual([]);
    expect(readers.feedbackRevisionReads).toEqual([]);
  });

  it("exposes exactly byte, semantic, and derivation replay, with byte replay retaining requested-child absence", async () => {
    const api = await loadCareerOutcomeValenceFeedbackContextRevisionReplay();
    const value = await createT13IHistoricalFixture();
    const readers = new T13IInMemoryReaders();
    readers.seedFeedbackRevision(value.firstReplayTarget);
    const byte = await api.byteReplayCareerOutcomeValenceFeedbackContextRevision(
      value.firstReplayTarget.careerOutcomeValenceFeedbackContextRevisionId,
      readers.dependencies(),
    );
    expect(byte).toEqual(value.firstReplayTarget);
    expect(byte).not.toBe(value.firstReplayTarget);
    expect(byte.careerOutcomeValenceFeedbackContextTransition)
      .not.toBe(value.firstReplayTarget.careerOutcomeValenceFeedbackContextTransition);
    await expect(api.byteReplayCareerOutcomeValenceFeedbackContextRevision("COVFCR_00000000000000000000000000000000", readers.dependencies()))
      .rejects.toThrow(notFound);
    const failed = new T13IInMemoryReaders();
    failed.scriptFeedbackRevisionRead(value.firstReplayTarget.careerOutcomeValenceFeedbackContextRevisionId, new Error("read outage"));
    await expect(api.byteReplayCareerOutcomeValenceFeedbackContextRevision(
      value.firstReplayTarget.careerOutcomeValenceFeedbackContextRevisionId, failed.dependencies(),
    )).rejects.toThrow(mismatch);
    expect(Object.keys(api).sort()).toEqual([...apiKeys].sort());
    expect(api).not.toHaveProperty("parentLineageReplayCareerOutcomeValenceFeedbackContextRevision");
  });

  it("classifies malformed or wrong requested stored children as replay mismatch without physical-byte, receipt, or writer semantics", async () => {
    const api = await loadCareerOutcomeValenceFeedbackContextRevisionReplay();
    const value = await createT13IHistoricalFixture();
    const malformed = new T13IInMemoryReaders();
    malformed.scriptFeedbackRevisionRead(value.firstReplayTarget.careerOutcomeValenceFeedbackContextRevisionId, {});
    await expect(api.byteReplayCareerOutcomeValenceFeedbackContextRevision(
      value.firstReplayTarget.careerOutcomeValenceFeedbackContextRevisionId, malformed.dependencies(),
    )).rejects.toThrow(mismatch);
    const wrong = new T13IInMemoryReaders();
    wrong.scriptFeedbackRevisionRead(value.firstReplayTarget.careerOutcomeValenceFeedbackContextRevisionId, value.branchReplayTarget);
    await expect(api.byteReplayCareerOutcomeValenceFeedbackContextRevision(
      value.firstReplayTarget.careerOutcomeValenceFeedbackContextRevisionId, wrong.dependencies(),
    )).rejects.toThrow(mismatch);
    expect(api).not.toHaveProperty("createCareerOutcomeValenceFeedbackContextRevisionReplayReceipt");
    expect(api).not.toHaveProperty("PostgresCareerOutcomeValenceFeedbackContextRevisionReplay");
    expect(api).not.toHaveProperty("persistCareerOutcomeValenceFeedbackContextRevision");
  });

  it("semantically replays exactly one first or subsequent persisted parent with the sealed audit-time equality laws", async () => {
    const api = await loadCareerOutcomeValenceFeedbackContextRevisionReplay();
    const value = await createT13IHistoricalFixture();
    const first = new T13IInMemoryReaders();
    first.seedFeedbackRevision(value.firstReplayTarget);
    first.seedDecisionContext(value.base);
    await expect(api.semanticReplayCareerOutcomeValenceFeedbackContextRevision(
      value.firstReplayTarget.careerOutcomeValenceFeedbackContextRevisionId, first.dependencies(),
    )).resolves.toEqual(value.firstReplayTarget);
    expect(first.decisionContextReads).toEqual([value.base.careerDecisionContextRevisionId]);
    const auditMismatch = new T13IInMemoryReaders();
    auditMismatch.seedFeedbackRevision(value.firstReplayTarget);
    auditMismatch.scriptDecisionContextRead(value.base.careerDecisionContextRevisionId, value.baseLaterAudit);
    await expect(api.semanticReplayCareerOutcomeValenceFeedbackContextRevision(
      value.firstReplayTarget.careerOutcomeValenceFeedbackContextRevisionId, auditMismatch.dependencies(),
    )).rejects.toThrow(mismatch);
    const firstUnavailable = new T13IInMemoryReaders();
    firstUnavailable.seedFeedbackRevision(value.firstReplayTarget);
    await expect(api.semanticReplayCareerOutcomeValenceFeedbackContextRevision(
      value.firstReplayTarget.careerOutcomeValenceFeedbackContextRevisionId, firstUnavailable.dependencies(),
    )).rejects.toThrow(mismatch);
    const firstReaderFailure = new T13IInMemoryReaders();
    firstReaderFailure.seedFeedbackRevision(value.firstReplayTarget);
    firstReaderFailure.scriptDecisionContextRead(value.base.careerDecisionContextRevisionId, new Error("parent outage"));
    await expect(api.semanticReplayCareerOutcomeValenceFeedbackContextRevision(
      value.firstReplayTarget.careerOutcomeValenceFeedbackContextRevisionId, firstReaderFailure.dependencies(),
    )).rejects.toThrow(mismatch);
    const firstMalformed = new T13IInMemoryReaders();
    firstMalformed.seedFeedbackRevision(value.firstReplayTarget);
    firstMalformed.scriptDecisionContextRead(value.base.careerDecisionContextRevisionId, {});
    await expect(api.semanticReplayCareerOutcomeValenceFeedbackContextRevision(
      value.firstReplayTarget.careerOutcomeValenceFeedbackContextRevisionId, firstMalformed.dependencies(),
    )).rejects.toThrow(mismatch);
    const firstWrongId = new T13IInMemoryReaders();
    firstWrongId.seedFeedbackRevision(value.firstReplayTarget);
    firstWrongId.scriptDecisionContextRead(value.base.careerDecisionContextRevisionId, value.alternateBase);
    await expect(api.semanticReplayCareerOutcomeValenceFeedbackContextRevision(
      value.firstReplayTarget.careerOutcomeValenceFeedbackContextRevisionId, firstWrongId.dependencies(),
    )).rejects.toThrow(mismatch);

    const subsequent = new T13IInMemoryReaders();
    subsequent.seedFeedbackRevision(value.subsequentReplayTarget);
    subsequent.seedFeedbackRevision(value.firstReplayTarget);
    await expect(api.semanticReplayCareerOutcomeValenceFeedbackContextRevision(
      value.subsequentReplayTarget.careerOutcomeValenceFeedbackContextRevisionId, subsequent.dependencies(),
    )).resolves.toEqual(value.subsequentReplayTarget);
    expect(subsequent.decisionContextReads).toEqual([]);
    expect(subsequent.feedbackRevisionReads).toEqual([
      value.subsequentReplayTarget.careerOutcomeValenceFeedbackContextRevisionId,
      value.firstReplayTarget.careerOutcomeValenceFeedbackContextRevisionId,
    ]);
    const branch = new T13IInMemoryReaders();
    branch.seedFeedbackRevision(value.branchReplayTarget);
    branch.seedDecisionContext(value.base);
    await expect(api.semanticReplayCareerOutcomeValenceFeedbackContextRevision(
      value.branchReplayTarget.careerOutcomeValenceFeedbackContextRevisionId, branch.dependencies(),
    )).resolves.toEqual(value.branchReplayTarget);
    const subsequentAudit = new T13IInMemoryReaders();
    subsequentAudit.seedFeedbackRevision(value.subsequentReplayTarget);
    const parentWithOnlyContentAuditChange = structuredClone(value.firstReplayTarget);
    parentWithOnlyContentAuditChange.careerOutcomeValenceFeedbackContextTransition
      .resultingFeedbackContextContent.createdAt = value.contentLaterAudit.createdAt;
    subsequentAudit.scriptFeedbackRevisionRead(
      value.firstReplayTarget.careerOutcomeValenceFeedbackContextRevisionId,
      parentWithOnlyContentAuditChange,
    );
    await expect(api.semanticReplayCareerOutcomeValenceFeedbackContextRevision(
      value.subsequentReplayTarget.careerOutcomeValenceFeedbackContextRevisionId, subsequentAudit.dependencies(),
    )).resolves.toEqual(value.subsequentReplayTarget);
    const subsequentUnavailable = new T13IInMemoryReaders();
    subsequentUnavailable.seedFeedbackRevision(value.subsequentReplayTarget);
    await expect(api.semanticReplayCareerOutcomeValenceFeedbackContextRevision(
      value.subsequentReplayTarget.careerOutcomeValenceFeedbackContextRevisionId, subsequentUnavailable.dependencies(),
    )).rejects.toThrow(mismatch);
    const subsequentReaderFailure = new T13IInMemoryReaders();
    subsequentReaderFailure.seedFeedbackRevision(value.subsequentReplayTarget);
    subsequentReaderFailure.scriptFeedbackRevisionRead(
      value.firstReplayTarget.careerOutcomeValenceFeedbackContextRevisionId,
      new Error("parent outage"),
    );
    await expect(api.semanticReplayCareerOutcomeValenceFeedbackContextRevision(
      value.subsequentReplayTarget.careerOutcomeValenceFeedbackContextRevisionId, subsequentReaderFailure.dependencies(),
    )).rejects.toThrow(mismatch);
    const subsequentMalformed = new T13IInMemoryReaders();
    subsequentMalformed.seedFeedbackRevision(value.subsequentReplayTarget);
    subsequentMalformed.scriptFeedbackRevisionRead(
      value.firstReplayTarget.careerOutcomeValenceFeedbackContextRevisionId,
      {},
    );
    await expect(api.semanticReplayCareerOutcomeValenceFeedbackContextRevision(
      value.subsequentReplayTarget.careerOutcomeValenceFeedbackContextRevisionId, subsequentMalformed.dependencies(),
    )).rejects.toThrow(mismatch);
  });

  it("preserves semantic replay mismatch for invalid immediate parents while derivation remains parent-reader-free and timestamp-exact", async () => {
    const api = await loadCareerOutcomeValenceFeedbackContextRevisionReplay();
    const value = await createT13IHistoricalFixture();
    const firstNull = new T13IInMemoryReaders();
    firstNull.seedFeedbackRevision(value.firstReplayTarget);
    await expect(api.semanticReplayCareerOutcomeValenceFeedbackContextRevision(
      value.firstReplayTarget.careerOutcomeValenceFeedbackContextRevisionId, firstNull.dependencies(),
    )).rejects.toThrow(mismatch);
    const subsequentWrong = new T13IInMemoryReaders();
    subsequentWrong.seedFeedbackRevision(value.subsequentReplayTarget);
    subsequentWrong.scriptFeedbackRevisionRead(
      value.firstReplayTarget.careerOutcomeValenceFeedbackContextRevisionId,
      value.branchReplayTarget,
    );
    await expect(api.semanticReplayCareerOutcomeValenceFeedbackContextRevision(
      value.subsequentReplayTarget.careerOutcomeValenceFeedbackContextRevisionId, subsequentWrong.dependencies(),
    )).rejects.toThrow(mismatch);

    const derivation = new T13IInMemoryReaders();
    derivation.seedFeedbackRevision(value.firstReplayTarget);
    derivation.seedFeedbackRevision(value.subsequentReplayTarget);
    const rebuiltFirst = await api.derivationReplayCareerOutcomeValenceFeedbackContextRevision(
      value.firstReplayTarget.careerOutcomeValenceFeedbackContextRevisionId, derivation.dependencies(),
    );
    const rebuiltSubsequent = await api.derivationReplayCareerOutcomeValenceFeedbackContextRevision(
      value.subsequentReplayTarget.careerOutcomeValenceFeedbackContextRevisionId, derivation.dependencies(),
    );
    expect(rebuiltFirst).toEqual(value.firstReplayTarget);
    expect(rebuiltSubsequent).toEqual(value.subsequentReplayTarget);
    expect(derivation.decisionContextReads).toEqual([]);
    expect(derivation.feedbackRevisionReads).toEqual([
      value.firstReplayTarget.careerOutcomeValenceFeedbackContextRevisionId,
      value.subsequentReplayTarget.careerOutcomeValenceFeedbackContextRevisionId,
    ]);
    // A lawful same-ID derivation mismatch and a lawful named-parent COVFCC semantic mismatch
    // are unreachable under sealed deterministic predecessor identities; do not corrupt history to manufacture them.
    expect(api).not.toHaveProperty("currentCareerOutcomeValenceFeedbackContextRevision");
    expect(api).not.toHaveProperty("replayAncestorCareerOutcomeValenceFeedbackContextRevision");
  });
});
