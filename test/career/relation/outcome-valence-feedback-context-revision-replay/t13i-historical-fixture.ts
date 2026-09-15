import { createT13HHistoricalFixture } from "../outcome-valence-feedback-context-revision-persistence/t13h-historical-fixture";
import { createT13FHistoricalFixture } from "../outcome-valence-feedback-context-transition/t13f-historical-fixture";

/** Sealed COVFCR history only; replay is intentionally not constructed here. */
export async function createT13IHistoricalFixture() {
  const [predecessor, transitionHistory] = await Promise.all([
    createT13HHistoricalFixture(),
    createT13FHistoricalFixture(),
  ]);
  return {
    ...predecessor,
    alternateBase: structuredClone(transitionHistory.alternateBaseCareerDecisionContextRevision),
    firstReplayTarget: structuredClone(predecessor.firstRevision),
    subsequentReplayTarget: structuredClone(predecessor.subsequentRevision),
    branchReplayTarget: structuredClone(predecessor.branchRevision),
  };
}
