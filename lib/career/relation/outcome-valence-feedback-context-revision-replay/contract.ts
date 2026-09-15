import {
  assertCareerDecisionContextRevision,
  stableCareerDecisionContext,
  type CareerDecisionContextRevision,
} from "../decision-context";
import {
  assertCareerOutcomeValenceFeedbackContextRevision,
  createCareerOutcomeValenceFeedbackContextRevision,
  stableCareerOutcomeValenceFeedbackContextRevision,
  type CareerOutcomeValenceFeedbackContextRevision,
} from "../outcome-valence-feedback-context-revision";
import type { CareerOutcomeValenceFeedbackContextRevisionReplayDependencies } from "./types";

const notFound = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_NOT_FOUND";
const mismatch = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_REPLAY_MISMATCH";

type Captured = Record<string, unknown>;

const fail = (): never => { throw new Error(mismatch); };

/*
 * Constructed is not persisted, persisted is not replayed, and readback is not
 * replay. BYTE, SEMANTIC, and DERIVATION replay establish distinct bounded
 * checks; none establishes currentness, acceptance, truth, or a sole child.
 */

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === "object") return Object.fromEntries(
    Object.keys(value as Captured).sort().map(key => [key, canonical((value as Captured)[key])]),
  );
  return value;
}

function stable(value: unknown): string {
  return JSON.stringify(canonical(value));
}

/** COVFCC semantic equality retains its ID but excludes only sealed audit and artifact-own IDs. */
function contentSemanticBody(value: unknown): unknown {
  const strip = (current: unknown): unknown => {
    if (Array.isArray(current)) return current.map(strip);
    if (current !== null && typeof current === "object") {
      const result: Captured = {};
      for (const key of Object.keys(current as Captured)) {
        if ([
          "createdAt",
          "careerDecisionContextRevisionId",
          "careerOutcomeValenceFeedbackContextContentId",
          "careerOutcomeValenceFeedbackReturnItemId",
          "careerOutcomeValenceFeedbackReturnRepresentationId",
          "careerOutcomeValenceFeedbackTargetRevisionBindingId",
          "careerOutcomeValenceFeedbackTargetDeclarationId",
        ].includes(key)) continue;
        result[key] = strip((current as Captured)[key]);
      }
      return result;
    }
    return current;
  };
  const content = value as Captured;
  const members = content.feedbackReturnItems as unknown[];
  return canonical({
    baseCareerDecisionContextRevision: strip(content.baseCareerDecisionContextRevision),
    feedbackReturnItems: [...members]
      .sort((left, right) => ((left as Captured).careerOutcomeValenceFeedbackReturnItemId as string)
        .localeCompare((right as Captured).careerOutcomeValenceFeedbackReturnItemId as string))
      .map(strip),
    schemaVersion: content.schemaVersion,
  });
}

function sameCommittedContent(left: unknown, right: unknown): boolean {
  const leftContent = left as Captured;
  const rightContent = right as Captured;
  return leftContent.careerOutcomeValenceFeedbackContextContentId ===
    rightContent.careerOutcomeValenceFeedbackContextContentId &&
    stable(contentSemanticBody(left)) === stable(contentSemanticBody(right));
}

/** Exact child absence remains distinct from any invalid representation or failed read. */
async function stored(
  revisionId: string,
  dependencies: CareerOutcomeValenceFeedbackContextRevisionReplayDependencies,
): Promise<CareerOutcomeValenceFeedbackContextRevision> {
  try {
    const value = await dependencies.getCareerOutcomeValenceFeedbackContextRevisionById(revisionId);
    if (value === null) throw new Error(notFound);
    assertCareerOutcomeValenceFeedbackContextRevision(value);
    if (value.careerOutcomeValenceFeedbackContextRevisionId !== revisionId) return fail();
    return structuredClone(value);
  } catch (error) {
    if (error instanceof Error && error.message === notFound) throw error;
    return fail();
  }
}

function exactDecisionContextParent(value: unknown, expectedId: string): CareerDecisionContextRevision {
  try {
    assertCareerDecisionContextRevision(value);
    if ((value as CareerDecisionContextRevision).careerDecisionContextRevisionId !== expectedId) return fail();
    return structuredClone(value as CareerDecisionContextRevision);
  } catch {
    return fail();
  }
}

function exactFeedbackRevisionParent(
  value: unknown,
  expectedId: string,
): CareerOutcomeValenceFeedbackContextRevision {
  try {
    assertCareerOutcomeValenceFeedbackContextRevision(value);
    if ((value as CareerOutcomeValenceFeedbackContextRevision)
      .careerOutcomeValenceFeedbackContextRevisionId !== expectedId) return fail();
    return structuredClone(value as CareerOutcomeValenceFeedbackContextRevision);
  } catch {
    return fail();
  }
}

/** BYTE replay is an independent validated durable read, not physical-byte inspection. */
export async function byteReplayCareerOutcomeValenceFeedbackContextRevision(
  revisionId: string,
  dependencies: CareerOutcomeValenceFeedbackContextRevisionReplayDependencies,
): Promise<CareerOutcomeValenceFeedbackContextRevision> {
  return structuredClone(await stored(revisionId, dependencies));
}

/**
 * Semantic replay verifies exactly one persisted immediate parent. It is not
 * deep ancestry replay, branch selection, acceptance, outcome truth, or currentness.
 */
export async function semanticReplayCareerOutcomeValenceFeedbackContextRevision(
  revisionId: string,
  dependencies: CareerOutcomeValenceFeedbackContextRevisionReplayDependencies,
): Promise<CareerOutcomeValenceFeedbackContextRevision> {
  const child = await stored(revisionId, dependencies);
  try {
    const parent = child.parent;
    if (parent.parentRevisionKind === "CAREER_DECISION_CONTEXT_REVISION") {
      let returned: CareerDecisionContextRevision | null;
      try { returned = await dependencies.getCareerDecisionContextRevisionById(parent.parentRevisionId); } catch { return fail(); }
      if (returned === null) return fail();
      const persistedParent = exactDecisionContextParent(returned, parent.parentRevisionId);
      if (stableCareerDecisionContext(persistedParent) !== stableCareerDecisionContext(
        child.careerOutcomeValenceFeedbackContextTransition.baseCareerDecisionContextRevision,
      )) return fail();
    } else {
      let returned: CareerOutcomeValenceFeedbackContextRevision | null;
      try { returned = await dependencies.getCareerOutcomeValenceFeedbackContextRevisionById(parent.parentRevisionId); } catch { return fail(); }
      if (returned === null) return fail();
      const persistedParent = exactFeedbackRevisionParent(returned, parent.parentRevisionId);
      if (!sameCommittedContent(
        persistedParent.careerOutcomeValenceFeedbackContextTransition.resultingFeedbackContextContent,
        parent.parentFeedbackContextContent,
      )) return fail();
    }
    return structuredClone(child);
  } catch {
    return fail();
  }
}

/**
 * Derivation replay reconstructs locally from retained operands and retained
 * audit time. It performs no parent read and writes no persisted revision.
 */
export async function derivationReplayCareerOutcomeValenceFeedbackContextRevision(
  revisionId: string,
  dependencies: CareerOutcomeValenceFeedbackContextRevisionReplayDependencies,
): Promise<CareerOutcomeValenceFeedbackContextRevision> {
  const child = await stored(revisionId, dependencies);
  try {
    const reconstructed = createCareerOutcomeValenceFeedbackContextRevision(
      structuredClone(child.parent),
      structuredClone(child.careerOutcomeValenceFeedbackContextTransition),
      { createdAt: child.createdAt },
    );
    if (reconstructed.careerOutcomeValenceFeedbackContextRevisionId !==
      child.careerOutcomeValenceFeedbackContextRevisionId ||
      stableCareerOutcomeValenceFeedbackContextRevision(reconstructed) !==
      stableCareerOutcomeValenceFeedbackContextRevision(child)) return fail();
    return structuredClone(reconstructed);
  } catch {
    return fail();
  }
}
