import {
  assertCareerDecisionContextRevision,
  stableCareerDecisionContext,
  type CareerDecisionContextRevision,
} from "../decision-context";
import {
  assertCareerOutcomeValenceFeedbackContextRevision,
  stableCareerOutcomeValenceFeedbackContextRevision,
  type CareerOutcomeValenceFeedbackContextRevision,
} from "../outcome-valence-feedback-context-revision";
import type {
  BoundCareerOutcomeValenceFeedbackContextRevisionPersister,
  CareerOutcomeValenceFeedbackContextRevisionPersistenceDependencies,
} from "./types";

const childInvalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PERSISTENCE_CHILD_INVALID";
const parentNotFound = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PERSISTENCE_PARENT_NOT_FOUND";
const parentInvalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PERSISTENCE_PARENT_INVALID";
const parentBaseMismatch = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PERSISTENCE_PARENT_BASE_MISMATCH";
const parentContentMismatch = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PERSISTENCE_PARENT_CONTENT_MISMATCH";
const immutableConflict = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PERSISTENCE_IMMUTABLE_CONFLICT";
const failed = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PERSISTENCE_FAILED";

type Captured = Record<string, unknown>;

const fail = (code: string): never => { throw new Error(code); };

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

function completeChild(value: unknown): CareerOutcomeValenceFeedbackContextRevision {
  try {
    assertCareerOutcomeValenceFeedbackContextRevision(value);
    const detached = structuredClone(value) as CareerOutcomeValenceFeedbackContextRevision;
    assertCareerOutcomeValenceFeedbackContextRevision(detached);
    return detached;
  } catch {
    return fail(childInvalid);
  }
}

function completeDecisionContextParent(value: unknown, expectedId: string): CareerDecisionContextRevision {
  try {
    assertCareerDecisionContextRevision(value);
    if ((value as CareerDecisionContextRevision).careerDecisionContextRevisionId !== expectedId) return fail(parentInvalid);
    return structuredClone(value as CareerDecisionContextRevision);
  } catch (error) {
    if (error instanceof Error && error.message === parentInvalid) throw error;
    return fail(parentInvalid);
  }
}

function completeFeedbackRevisionParent(
  value: unknown,
  expectedId: string,
): CareerOutcomeValenceFeedbackContextRevision {
  try {
    assertCareerOutcomeValenceFeedbackContextRevision(value);
    if ((value as CareerOutcomeValenceFeedbackContextRevision)
      .careerOutcomeValenceFeedbackContextRevisionId !== expectedId) return fail(parentInvalid);
    return structuredClone(value as CareerOutcomeValenceFeedbackContextRevision);
  } catch (error) {
    if (error instanceof Error && error.message === parentInvalid) throw error;
    return fail(parentInvalid);
  }
}

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
  const items = content.feedbackReturnItems as unknown[];
  return canonical({
    baseCareerDecisionContextRevision: strip(content.baseCareerDecisionContextRevision),
    feedbackReturnItems: [...items]
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

function captureDependencies(
  value: CareerOutcomeValenceFeedbackContextRevisionPersistenceDependencies,
): CareerOutcomeValenceFeedbackContextRevisionPersistenceDependencies {
  try {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return fail(failed);
    const keys = Reflect.ownKeys(value);
    const required = [
      "getCareerDecisionContextRevisionById",
      "getCareerOutcomeValenceFeedbackContextRevisionById",
      "writeCareerOutcomeValenceFeedbackContextRevision",
    ];
    if (keys.length !== required.length || keys.some(key => typeof key !== "string") ||
      required.some(key => !keys.includes(key))) return fail(failed);
    for (const key of required) {
      const descriptor = Reflect.getOwnPropertyDescriptor(value, key);
      if (descriptor === undefined || !("value" in descriptor) || typeof descriptor.value !== "function") return fail(failed);
    }
    return value;
  } catch {
    return fail(failed);
  }
}

/**
 * Binds immutable storage only. Revision construction remains distinct from persistence;
 * a parent-content witness is not persisted parent content until this immediate read verifies it.
 * A named parent reference is resolved here, but neither currentness nor sole-child status exists.
 */
export function createBoundCareerOutcomeValenceFeedbackContextRevisionPersister(
  dependencies: CareerOutcomeValenceFeedbackContextRevisionPersistenceDependencies,
): BoundCareerOutcomeValenceFeedbackContextRevisionPersister {
  const captured = captureDependencies(dependencies);
  const readDecisionContext = captured.getCareerDecisionContextRevisionById.bind(captured);
  const readFeedbackRevision = captured.getCareerOutcomeValenceFeedbackContextRevisionById.bind(captured);
  const writeFeedbackRevision = captured.writeCareerOutcomeValenceFeedbackContextRevision.bind(captured);

  return {
    async persistCareerOutcomeValenceFeedbackContextRevision(
      value: CareerOutcomeValenceFeedbackContextRevision,
    ): Promise<CareerOutcomeValenceFeedbackContextRevision> {
      const child = completeChild(value);
      const parent = child.parent;

      if (parent.parentRevisionKind === "CAREER_DECISION_CONTEXT_REVISION") {
        let returned: CareerDecisionContextRevision | null;
        try { returned = await readDecisionContext(parent.parentRevisionId); } catch { return fail(failed); }
        if (returned === null) return fail(parentNotFound);
        const persistedParent = completeDecisionContextParent(returned, parent.parentRevisionId);
        if (stableCareerDecisionContext(persistedParent) !== stableCareerDecisionContext(
          child.careerOutcomeValenceFeedbackContextTransition.baseCareerDecisionContextRevision,
        )) return fail(parentBaseMismatch);
      } else {
        let returned: CareerOutcomeValenceFeedbackContextRevision | null;
        try { returned = await readFeedbackRevision(parent.parentRevisionId); } catch { return fail(failed); }
        if (returned === null) return fail(parentNotFound);
        const persistedParent = completeFeedbackRevisionParent(returned, parent.parentRevisionId);
        if (!sameCommittedContent(
          persistedParent.careerOutcomeValenceFeedbackContextTransition.resultingFeedbackContextContent,
          parent.parentFeedbackContextContent,
        )) return fail(parentContentMismatch);
      }

      try {
        await writeFeedbackRevision(structuredClone(child));
      } catch (error) {
        if (error instanceof Error && error.message === immutableConflict) throw error;
        return fail(failed);
      }

      let reread: CareerOutcomeValenceFeedbackContextRevision | null;
      try { reread = await readFeedbackRevision(child.careerOutcomeValenceFeedbackContextRevisionId); } catch { return fail(failed); }
      if (reread === null) return fail(failed);
      try {
        assertCareerOutcomeValenceFeedbackContextRevision(reread);
        if (reread.careerOutcomeValenceFeedbackContextRevisionId !==
          child.careerOutcomeValenceFeedbackContextRevisionId ||
          stableCareerOutcomeValenceFeedbackContextRevision(reread) !==
          stableCareerOutcomeValenceFeedbackContextRevision(child)) return fail(failed);
        return structuredClone(reread);
      } catch (error) {
        if (error instanceof Error && error.message === failed) throw error;
        return fail(failed);
      }
    },
  };
}
