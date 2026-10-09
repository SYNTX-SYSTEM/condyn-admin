import { describe, expect, it } from "vitest";
import {
  createCareerOutcomeValenceFeedbackContextContent,
} from "../../../lib/career/relation/outcome-valence-feedback-context-content";
import {
  createCareerOutcomeValenceFeedbackContextRevision,
} from "../../../lib/career/relation/outcome-valence-feedback-context-revision";
import {
  createBoundCareerOutcomeValenceFeedbackContextRevisionPersister,
} from "../../../lib/career/relation/outcome-valence-feedback-context-revision-persistence";
import {
  byteReplayCareerOutcomeValenceFeedbackContextRevision,
  derivationReplayCareerOutcomeValenceFeedbackContextRevision,
  semanticReplayCareerOutcomeValenceFeedbackContextRevision,
} from "../../../lib/career/relation/outcome-valence-feedback-context-revision-replay";
import {
  createCareerOutcomeValenceFeedbackContextTransition,
} from "../../../lib/career/relation/outcome-valence-feedback-context-transition";
import { createT13EHistoricalFixture } from "../relation/outcome-valence-feedback-context-content/t13e-historical-fixture";
import { createT13HHistoricalFixture } from "../relation/outcome-valence-feedback-context-revision-persistence/t13h-historical-fixture";
import { T13HInMemoryRepositories } from "../relation/outcome-valence-feedback-context-revision-persistence/t13h-in-memory-repositories";

describe("T49 COVFCR deterministic lifecycle integration", () => {
  // This deterministic integration fixture reconstructs the complete sealed
  // lineage repeatedly.  Its local budget prevents parallel-suite scheduling
  // from turning a proven replay contract into a false timeout.
  it("preserves first and subsequent typed lineage through immutable persistence, exact reread, and all sealed replay modes", async () => {
    const value = await createT13HHistoricalFixture();
    const repositories = new T13HInMemoryRepositories();
    repositories.seedDecisionContext(value.base);
    const persister = createBoundCareerOutcomeValenceFeedbackContextRevisionPersister(repositories.dependencies());

    const first = await persister.persistCareerOutcomeValenceFeedbackContextRevision(value.firstRevision);
    const subsequent = await persister.persistCareerOutcomeValenceFeedbackContextRevision(value.subsequentRevision);
    const branch = await persister.persistCareerOutcomeValenceFeedbackContextRevision(value.branchRevision);

    expect(first).toEqual(value.firstRevision);
    expect(subsequent).toEqual(value.subsequentRevision);
    expect(branch).toEqual(value.branchRevision);
    expect(subsequent.parent).toEqual(value.subsequentParent);
    expect(subsequent.careerOutcomeValenceFeedbackContextTransition.resultingFeedbackContextContent)
      .toEqual(value.contentXY);
    expect(branch.careerOutcomeValenceFeedbackContextRevisionId)
      .not.toBe(first.careerOutcomeValenceFeedbackContextRevisionId);
    expect(repositories.feedbackRevisions.size).toBe(3);

    const readers = repositories.dependencies();
    await expect(byteReplayCareerOutcomeValenceFeedbackContextRevision(
      first.careerOutcomeValenceFeedbackContextRevisionId, readers,
    )).resolves.toEqual(first);
    await expect(semanticReplayCareerOutcomeValenceFeedbackContextRevision(
      first.careerOutcomeValenceFeedbackContextRevisionId, readers,
    )).resolves.toEqual(first);
    await expect(derivationReplayCareerOutcomeValenceFeedbackContextRevision(
      first.careerOutcomeValenceFeedbackContextRevisionId, readers,
    )).resolves.toEqual(first);
    await expect(byteReplayCareerOutcomeValenceFeedbackContextRevision(
      subsequent.careerOutcomeValenceFeedbackContextRevisionId, readers,
    )).resolves.toEqual(subsequent);
    await expect(semanticReplayCareerOutcomeValenceFeedbackContextRevision(
      subsequent.careerOutcomeValenceFeedbackContextRevisionId, readers,
    )).resolves.toEqual(subsequent);
    await expect(derivationReplayCareerOutcomeValenceFeedbackContextRevision(
      subsequent.careerOutcomeValenceFeedbackContextRevisionId, readers,
    )).resolves.toEqual(subsequent);
  }, 15_000);

  it("preserves every valence through first-revision persistence and derivation replay without creating a current or authority claim", async () => {
    for (const valence of ["DESIRABLE", "UNDESIRABLE", "NEUTRAL", "UNRESOLVED"] as const) {
      const value = await createT13EHistoricalFixture(valence);
      const content = createCareerOutcomeValenceFeedbackContextContent(
        value.baseCareerDecisionContextRevision,
        [value.firstFeedbackReturnItem],
        { createdAt: "2027-02-17T01:00:00.000Z" },
      );
      const transition = createCareerOutcomeValenceFeedbackContextTransition(
        value.baseCareerDecisionContextRevision,
        null,
        value.firstFeedbackReturnItem,
        content,
        { createdAt: "2027-02-17T01:00:01.000Z" },
      );
      const revision = createCareerOutcomeValenceFeedbackContextRevision(
        {
          parentRevisionKind: "CAREER_DECISION_CONTEXT_REVISION",
          parentRevisionId: value.baseCareerDecisionContextRevision.careerDecisionContextRevisionId,
        },
        transition,
        { createdAt: "2027-02-17T01:00:02.000Z" },
      );
      const repositories = new T13HInMemoryRepositories();
      repositories.seedDecisionContext(value.baseCareerDecisionContextRevision);
      const persisted = await createBoundCareerOutcomeValenceFeedbackContextRevisionPersister(repositories.dependencies())
        .persistCareerOutcomeValenceFeedbackContextRevision(revision);
      const replayed = await derivationReplayCareerOutcomeValenceFeedbackContextRevision(
        revision.careerOutcomeValenceFeedbackContextRevisionId,
        repositories.dependencies(),
      );
      expect(persisted).toEqual(revision);
      expect(replayed).toEqual(revision);
      expect(replayed.careerOutcomeValenceFeedbackContextTransition.addedFeedbackReturnItem
        .careerOutcomeValenceFeedbackReturnRepresentation.representedFeedback.valence).toBe(valence);
      expect(replayed).not.toHaveProperty("current");
      expect(replayed).not.toHaveProperty("accepted");
      expect(replayed).not.toHaveProperty("authority");
    }
  });
});
