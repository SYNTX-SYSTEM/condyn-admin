import { createHash } from "node:crypto";
import { assertDecisionRecommendationProposal, type DecisionRecommendationProposal } from "../recommendation-proposal";
import {
  DECISION_PROPOSAL_COHERENCE_VALIDATION_SCHEMA_VERSION,
  type DecisionProposalCoherenceValidation,
  type DecisionRecommendationCoherenceTrace
} from "./types";

const fail = (code: string): never => { throw new Error(code); };
const validationKeys = ["artifactKind", "schemaVersion", "proposalCoherenceValidationId", "recommendationProposal", "traces"] as const;
const traceKeys = ["optionItemId", "representedCriterionItemIds"] as const;
const idPattern = /^DPCV_[0-9A-F]{24}$/;
type Captured = null | boolean | number | string | Captured[] | { [key: string]: Captured };

function capture(value: unknown, code: string, ancestors: WeakSet<object> = new WeakSet<object>()): Captured {
  try {
    if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
    if (typeof value !== "object" || ancestors.has(value)) return fail(code);
    ancestors.add(value);
    try {
      if (Array.isArray(value)) {
        const keys = Reflect.ownKeys(value);
        const length = Reflect.getOwnPropertyDescriptor(value, "length")?.value;
        if (typeof length !== "number" || !Number.isSafeInteger(length) || length < 0 || keys.length !== length + 1 || !keys.includes("length") || keys.some((key) => typeof key === "symbol" || (key !== "length" && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= length)))) return fail(code);
        const result: Captured[] = [];
        for (let index = 0; index < length; index += 1) {
          const descriptor = Reflect.getOwnPropertyDescriptor(value, String(index));
          if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail(code);
          result.push(capture(descriptor.value, code, ancestors));
        }
        return result;
      }
      const result: { [key: string]: Captured } = {};
      for (const key of Reflect.ownKeys(value)) {
        if (typeof key !== "string") return fail(code);
        const descriptor = Reflect.getOwnPropertyDescriptor(value, key);
        if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail(code);
        Object.defineProperty(result, key, { value: capture(descriptor.value, code, ancestors), enumerable: true, writable: true, configurable: true });
      }
      return result;
    } finally { ancestors.delete(value); }
  } catch { return fail(code); }
}

function exact(value: unknown, keys: readonly string[], code: string): Record<string, Captured> {
  const captured = capture(value, code);
  if (captured === null || Array.isArray(captured) || typeof captured !== "object") return fail(code);
  const actual = Object.keys(captured);
  if (actual.length !== keys.length || keys.some((key) => !Object.prototype.hasOwnProperty.call(captured, key))) return fail(code);
  return captured;
}

function canonical(value: Captured): Captured {
  if (Array.isArray(value)) return value.map(canonical);
  if (value === null || typeof value !== "object") return value;
  const result: { [key: string]: Captured } = {};
  for (const key of Object.keys(value).sort((left, right) => left < right ? -1 : left > right ? 1 : 0)) result[key] = canonical(value[key]);
  return result;
}

function compare(left: string, right: string): number { return left < right ? -1 : left > right ? 1 : 0; }

function captureRecommendationProposal(value: unknown, code: string): DecisionRecommendationProposal {
  try {
    const proposal = capture(value, code) as unknown as DecisionRecommendationProposal;
    assertDecisionRecommendationProposal(proposal);
    return proposal;
  } catch { return fail(code); }
}

function deriveTraces(proposal: DecisionRecommendationProposal): DecisionRecommendationCoherenceTrace[] {
  return proposal.recommendations.map((recommendation) => ({
    optionItemId: recommendation.optionItemId,
    representedCriterionItemIds: proposal.assessmentProposal.assessments
      .filter((assessment) => assessment.optionItemId === recommendation.optionItemId)
      .map((assessment) => assessment.criterionItemId)
      .sort(compare)
  })).sort((left, right) => compare(left.optionItemId, right.optionItemId));
}

function validationId(recommendationProposal: DecisionRecommendationProposal, traces: readonly DecisionRecommendationCoherenceTrace[]): string {
  const digest = createHash("sha256")
    .update(JSON.stringify([
      DECISION_PROPOSAL_COHERENCE_VALIDATION_SCHEMA_VERSION,
      canonical(recommendationProposal as unknown as Captured),
      traces
    ]), "utf8")
    .digest("hex")
    .slice(0, 24)
    .toUpperCase();
  return `DPCV_${digest}`;
}

function trace(value: unknown, code: string): DecisionRecommendationCoherenceTrace {
  const captured = exact(value, traceKeys, code);
  if (typeof captured.optionItemId !== "string" || !Array.isArray(captured.representedCriterionItemIds) || captured.representedCriterionItemIds.some((item) => typeof item !== "string")) return fail(code);
  return { optionItemId: captured.optionItemId, representedCriterionItemIds: captured.representedCriterionItemIds as string[] };
}

function traces(value: unknown, code: string): DecisionRecommendationCoherenceTrace[] {
  const captured = capture(value, code);
  if (!Array.isArray(captured)) return fail(code);
  return captured.map((item) => trace(item, code));
}

function same(left: unknown, right: unknown): boolean { return JSON.stringify(left) === JSON.stringify(right); }

function construct(recommendationProposal: DecisionRecommendationProposal): DecisionProposalCoherenceValidation {
  const derived = deriveTraces(recommendationProposal);
  return {
    artifactKind: "DECISION_PROPOSAL_COHERENCE_VALIDATION",
    schemaVersion: DECISION_PROPOSAL_COHERENCE_VALIDATION_SCHEMA_VERSION,
    proposalCoherenceValidationId: validationId(recommendationProposal, derived),
    recommendationProposal,
    traces: derived
  };
}

export function validateDecisionProposalCoherence(recommendationProposal: DecisionRecommendationProposal): DecisionProposalCoherenceValidation {
  const proposal = captureRecommendationProposal(recommendationProposal, "ERR_DECISION_PROPOSAL_COHERENCE_RECOMMENDATION_PROPOSAL_INVALID");
  const validation = construct(proposal);
  assertDecisionProposalCoherenceValidation(validation);
  return structuredClone(validation);
}

export function assertDecisionProposalCoherenceValidation(value: unknown): asserts value is DecisionProposalCoherenceValidation {
  const invalid = "ERR_DECISION_PROPOSAL_COHERENCE_INVALID";
  try {
    const validation = exact(value, validationKeys, invalid);
    if (validation.artifactKind !== "DECISION_PROPOSAL_COHERENCE_VALIDATION" || validation.schemaVersion !== DECISION_PROPOSAL_COHERENCE_VALIDATION_SCHEMA_VERSION || typeof validation.proposalCoherenceValidationId !== "string" || !idPattern.test(validation.proposalCoherenceValidationId)) fail(invalid);
    const proposal = captureRecommendationProposal(validation.recommendationProposal, invalid);
    const storedTraces = traces(validation.traces, invalid);
    const expectedTraces = deriveTraces(proposal);
    if (!same(storedTraces, expectedTraces)) fail(invalid);
    if (validation.proposalCoherenceValidationId !== validationId(proposal, storedTraces)) fail("ERR_DECISION_PROPOSAL_COHERENCE_ID_MISMATCH");
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_DECISION_PROPOSAL_COHERENCE_ID_MISMATCH") throw error;
    return fail(invalid);
  }
}
