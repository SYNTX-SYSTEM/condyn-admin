import { RecommendationProofChain } from "../matching/derivation";

export type DecisionState = "ACCEPT" | "REJECT" | "DEFER";

export interface DecisionRecord {
  decisionId: string;
  subjectId: string;
  recommendationId: string;
  recommendationSnapshot: RecommendationProofChain;
  decisionState: DecisionState;
  actor: string;
  timestamp: string;
  rationale: string;
}

export function createDecision(
  subjectId: string,
  recommendation: RecommendationProofChain,
  decisionState: DecisionState,
  actor: string,
  rationale: string
): DecisionRecord {
  if (!recommendation) {
    throw new Error("ERR_DECISION_MISSING_RECOMMENDATION: A decision must reference a valid recommendation.");
  }

  if (!actor || actor.trim() === "") {
    throw new Error("ERR_DECISION_MISSING_ACTOR: A decision requires an explicit, identifiable actor.");
  }

  if (decisionState !== "ACCEPT" && decisionState !== "REJECT" && decisionState !== "DEFER") {
    throw new Error(`ERR_DECISION_INVALID_STATE: State '${decisionState}' is not a valid human decision state.`);
  }

  // Deep clone to ensure historical integrity
  const recommendationSnapshot = JSON.parse(JSON.stringify(recommendation));

  return {
    decisionId: `DEC_${Date.now()}_${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    subjectId,
    recommendationId: recommendation.recommendationId || "UNKNOWN_REC",
    recommendationSnapshot,
    decisionState,
    actor,
    timestamp: new Date().toISOString(),
    rationale
  };
}

export function deepFreeze<T extends object>(obj: T): Readonly<T> {
  const propNames = Object.getOwnPropertyNames(obj);
  for (const name of propNames) {
    const value = (obj as any)[name];
    if (value && typeof value === "object") {
      deepFreeze(value);
    }
  }
  return Object.freeze(obj);
}

export function sealDecision(decision: DecisionRecord): Readonly<DecisionRecord> {
  return deepFreeze(decision);
}
