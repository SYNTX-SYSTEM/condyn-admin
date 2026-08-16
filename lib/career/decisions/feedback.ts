import { OutcomeRecord } from "./outcome";
import { deepFreeze } from "./decision";

export type EvaluationState = "DESIRABLE" | "UNDESIRABLE" | "NEUTRAL" | "UNRESOLVED";

export interface FeedbackRecord {
  feedbackId: string;
  outcomeId: string;
  evaluation: EvaluationState;
  actor: string;
  observedAt: string;
  rationale?: string;
  sourceRef?: string;
}

export type AttributionTargetType = "RECOMMENDATION" | "DECISION" | "COMMITMENT" | "ACTION" | "POLICY";
export type AttributionType = "ASSOCIATED_WITH" | "SUPPORTS" | "CONTRADICTS" | "CAUSAL_CLAIM";

export interface AttributionRecord {
  attributionId: string;
  feedbackId: string;
  targetType: AttributionTargetType;
  targetId: string;
  attributionType: AttributionType;
  actor: string;
  rationale?: string;
}

const feedbackCache = new Map<string, FeedbackRecord>();
const attributionCache = new Map<string, AttributionRecord>();

export function clearFeedbackCache() {
  feedbackCache.clear();
  attributionCache.clear();
}

export function createFeedback(
  feedbackId: string,
  outcome: Readonly<OutcomeRecord>,
  evaluation: EvaluationState,
  actor: string,
  observedAt: string = new Date().toISOString(),
  rationale?: string,
  sourceRef?: string
): Readonly<FeedbackRecord> {
  if (!outcome || !outcome.outcomeId) {
    throw new Error("ERR_FEEDBACK_MISSING_OUTCOME: Feedback must reference a valid Outcome.");
  }
  if (!actor || actor.trim() === "") {
    throw new Error("ERR_FEEDBACK_MISSING_ACTOR: Feedback requires an explicit actor.");
  }
  if (!["DESIRABLE", "UNDESIRABLE", "NEUTRAL", "UNRESOLVED"].includes(evaluation)) {
    throw new Error(`ERR_FEEDBACK_INVALID_EVALUATION: Evaluation '${evaluation}' is not allowed.`);
  }

  const actualFeedbackId = feedbackId || `FDB_${Date.now()}_${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

  if (feedbackCache.has(actualFeedbackId)) {
    const existing = feedbackCache.get(actualFeedbackId)!;
    if (existing.outcomeId !== outcome.outcomeId || existing.evaluation !== evaluation || existing.actor !== actor) {
      throw new Error(`ERR_FEEDBACK_CONFLICT: Feedback ${actualFeedbackId} already exists with a different payload.`);
    }
    return deepFreeze(existing);
  }

  // Temporal invariant: Feedback observation cannot predate the outcome itself
  if (new Date(observedAt) < new Date(outcome.occurredAt)) {
    throw new Error("ERR_TEMPORAL_INVARIANT: Feedback cannot predate its outcome.");
  }

  const feedback: FeedbackRecord = {
    feedbackId: actualFeedbackId,
    outcomeId: outcome.outcomeId,
    evaluation,
    actor,
    observedAt,
    rationale,
    sourceRef
  };

  const sealed = deepFreeze(feedback);
  feedbackCache.set(sealed.feedbackId, sealed);
  return sealed;
}

export function createAttribution(
  attributionId: string,
  feedback: Readonly<FeedbackRecord>,
  targetType: AttributionTargetType,
  targetId: string,
  attributionType: AttributionType,
  actor: string,
  rationale?: string
): Readonly<AttributionRecord> {
  if (!feedback || !feedback.feedbackId) {
    throw new Error("ERR_ATTRIBUTION_MISSING_FEEDBACK: Attribution must reference a valid FeedbackRecord.");
  }
  if (!actor || actor.trim() === "") {
    throw new Error("ERR_ATTRIBUTION_MISSING_ACTOR: Attribution requires an explicit actor.");
  }
  if (!targetId || targetId.trim() === "") {
    throw new Error("ERR_ATTRIBUTION_MISSING_TARGET: Attribution requires a target ID.");
  }
  if (attributionType === "CAUSAL_CLAIM") {
    throw new Error("ERR_ATTRIBUTION_PROHIBITED_CAUSALITY: CAUSAL_CLAIM is unsupported and strictly prohibited in v1. Feedback cannot automatically establish causality.");
  }

  const actualAttributionId = attributionId || `ATTR_${Date.now()}_${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

  if (attributionCache.has(actualAttributionId)) {
    const existing = attributionCache.get(actualAttributionId)!;
    if (existing.feedbackId !== feedback.feedbackId || existing.targetType !== targetType || existing.targetId !== targetId || existing.attributionType !== attributionType || existing.actor !== actor) {
      throw new Error(`ERR_ATTRIBUTION_CONFLICT: Attribution ${actualAttributionId} already exists with a different payload.`);
    }
    return deepFreeze(existing);
  }

  const attribution: AttributionRecord = {
    attributionId: actualAttributionId,
    feedbackId: feedback.feedbackId,
    targetType,
    targetId,
    attributionType,
    actor,
    rationale
  };

  const sealed = deepFreeze(attribution);
  attributionCache.set(sealed.attributionId, sealed);
  return sealed;
}
