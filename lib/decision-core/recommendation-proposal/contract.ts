import { createHash } from "node:crypto";
import { assertDecisionAssessmentProposal, type DecisionAssessmentProposal } from "../assessment-proposal";
import {
  DECISION_RECOMMENDATION_PROPOSAL_SCHEMA_VERSION,
  type BoundDecisionRecommendationProposer,
  type DecisionRecommendation,
  type DecisionRecommendationGenerator,
  type DecisionRecommendationProposal,
  type DecisionRecommendationProposalProvenance
} from "./types";

const fail = (code: string): never => { throw new Error(code); };
const proposalKeys = ["artifactKind", "schemaVersion", "recommendationProposalId", "assessmentProposal", "proposedBy", "recommendations"] as const;
const provenanceKeys = ["origin", "proposalRef"] as const;
const recommendationKeys = ["optionItemId", "rationale"] as const;
const idPattern = /^DRECP_[0-9A-F]{24}$/;
const itemPattern = /^DCI_[0-9A-F]{24}$/;
type Captured = null | boolean | number | string | Captured[] | { [key: string]: Captured };

function capture(value: unknown, code: string, ancestors: WeakSet<object> = new WeakSet<object>()): Captured {
  try {
    if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
    if (typeof value !== "object" || ancestors.has(value)) return fail(code);
    ancestors.add(value);
    try {
      if (Array.isArray(value)) {
        const keys = Reflect.ownKeys(value); const length = Reflect.getOwnPropertyDescriptor(value, "length")?.value;
        if (typeof length !== "number" || !Number.isSafeInteger(length) || length < 0 || keys.length !== length + 1 || !keys.includes("length") || keys.some((key) => typeof key === "symbol" || (key !== "length" && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= length)))) return fail(code);
        const result: Captured[] = [];
        for (let index = 0; index < length; index += 1) { const descriptor = Reflect.getOwnPropertyDescriptor(value, String(index)); if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail(code); result.push(capture(descriptor.value, code, ancestors)); }
        return result;
      }
      const result: { [key: string]: Captured } = {};
      for (const key of Reflect.ownKeys(value)) { if (typeof key !== "string") return fail(code); const descriptor = Reflect.getOwnPropertyDescriptor(value, key); if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail(code); Object.defineProperty(result, key, { value: capture(descriptor.value, code, ancestors), enumerable: true, writable: true, configurable: true }); }
      return result;
    } finally { ancestors.delete(value); }
  } catch { return fail(code); }
}

function exact(value: unknown, keys: readonly string[], code: string): Record<string, Captured> {
  const captured = capture(value, code); if (captured === null || Array.isArray(captured) || typeof captured !== "object") return fail(code);
  const actual = Object.keys(captured); if (actual.length !== keys.length || keys.some((key) => !Object.prototype.hasOwnProperty.call(captured, key))) return fail(code); return captured;
}
function canonical(value: Captured): Captured { if (Array.isArray(value)) return value.map(canonical); if (value === null || typeof value !== "object") return value; const result: { [key: string]: Captured } = {}; for (const key of Object.keys(value).sort((left, right) => left < right ? -1 : left > right ? 1 : 0)) result[key] = canonical(value[key]); return result; }
function canonicalRecommendations(value: readonly DecisionRecommendation[]): DecisionRecommendation[] { return [...value].sort((left, right) => left.optionItemId < right.optionItemId ? -1 : left.optionItemId > right.optionItemId ? 1 : 0); }
function proposalId(assessmentProposal: DecisionAssessmentProposal, proposedBy: DecisionRecommendationProposalProvenance, recommendations: readonly DecisionRecommendation[]): string {
  const digest = createHash("sha256").update(JSON.stringify([DECISION_RECOMMENDATION_PROPOSAL_SCHEMA_VERSION, canonical(assessmentProposal as unknown as Captured), ["MODEL_PROPOSAL", proposedBy.proposalRef], recommendations]), "utf8").digest("hex").slice(0, 24).toUpperCase();
  return `DRECP_${digest}`;
}
function captureAssessmentProposal(value: unknown, code: string): DecisionAssessmentProposal { try { const proposal = capture(value, code) as unknown as DecisionAssessmentProposal; assertDecisionAssessmentProposal(proposal); return proposal; } catch { return fail(code); } }
function provenance(value: unknown, trim: boolean, code: string): DecisionRecommendationProposalProvenance { const captured = exact(value, provenanceKeys, code); if (captured.origin !== "MODEL_PROPOSAL" || typeof captured.proposalRef !== "string") return fail(code); const proposalRef = trim ? captured.proposalRef.trim() : captured.proposalRef; if (proposalRef.length === 0 || (!trim && proposalRef !== captured.proposalRef.trim())) return fail(code); return { origin: "MODEL_PROPOSAL", proposalRef }; }
function recommendation(value: unknown, trim: boolean, code: string): DecisionRecommendation { const captured = exact(value, recommendationKeys, code); if (typeof captured.optionItemId !== "string" || !itemPattern.test(captured.optionItemId) || typeof captured.rationale !== "string") return fail(code); const rationale = trim ? captured.rationale.trim() : captured.rationale; if (rationale.length === 0 || (!trim && rationale !== captured.rationale.trim())) return fail(code); return { optionItemId: captured.optionItemId, rationale }; }
function recommendations(value: unknown, trim: boolean, code: string): DecisionRecommendation[] { const captured = capture(value, code); if (!Array.isArray(captured)) return fail(code); return captured.map((item) => recommendation(item, trim, code)); }
function validateTargets(assessmentProposal: DecisionAssessmentProposal, values: readonly DecisionRecommendation[], code: { selected: string; assessed: string; duplicate: string }): void {
  const selected = new Set(assessmentProposal.assessmentBasis.assessmentRequest.selectedOptionItemIds); const assessed = new Set(assessmentProposal.assessments.map((item) => item.optionItemId)); const seen = new Set<string>();
  for (const value of values) { if (!selected.has(value.optionItemId)) fail(code.selected); if (!assessed.has(value.optionItemId)) fail(code.assessed); if (seen.has(value.optionItemId)) fail(code.duplicate); seen.add(value.optionItemId); }
}
function captureGenerator(value: unknown): (input: { assessmentProposal: DecisionAssessmentProposal }) => Promise<readonly DecisionRecommendation[]> {
  try { if (value === null || typeof value !== "object" || Array.isArray(value)) return fail("ERR_DECISION_RECOMMENDATION_PROPOSAL_GENERATOR_INVALID"); const keys = Reflect.ownKeys(value); if (keys.length !== 1 || keys[0] !== "recommend") return fail("ERR_DECISION_RECOMMENDATION_PROPOSAL_GENERATOR_INVALID"); const descriptor = Reflect.getOwnPropertyDescriptor(value, "recommend"); if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor) || typeof descriptor.value !== "function") return fail("ERR_DECISION_RECOMMENDATION_PROPOSAL_GENERATOR_INVALID"); return descriptor.value.bind(value) as (input: { assessmentProposal: DecisionAssessmentProposal }) => Promise<readonly DecisionRecommendation[]>; } catch { return fail("ERR_DECISION_RECOMMENDATION_PROPOSAL_GENERATOR_INVALID"); }
}
function construct(assessmentProposal: DecisionAssessmentProposal, proposedBy: DecisionRecommendationProposalProvenance, values: readonly DecisionRecommendation[]): DecisionRecommendationProposal { const ordered = canonicalRecommendations(values); return { artifactKind: "DECISION_RECOMMENDATION_PROPOSAL", schemaVersion: DECISION_RECOMMENDATION_PROPOSAL_SCHEMA_VERSION, recommendationProposalId: proposalId(assessmentProposal, proposedBy, ordered), assessmentProposal, proposedBy, recommendations: ordered }; }

export function createBoundDecisionRecommendationProposer(generator: DecisionRecommendationGenerator): BoundDecisionRecommendationProposer {
  const recommend = captureGenerator(generator);
  return { async propose(assessmentProposal: DecisionAssessmentProposal, proposedBy: DecisionRecommendationProposalProvenance): Promise<DecisionRecommendationProposal> {
    const assessment = captureAssessmentProposal(assessmentProposal, "ERR_DECISION_RECOMMENDATION_PROPOSAL_ASSESSMENT_PROPOSAL_INVALID"); const owner = provenance(proposedBy, true, "ERR_DECISION_RECOMMENDATION_PROPOSAL_PROVENANCE_INVALID"); const output = await recommend({ assessmentProposal: structuredClone(assessment) }); const values = recommendations(output, true, "ERR_DECISION_RECOMMENDATION_PROPOSAL_RECOMMENDATION_INVALID");
    validateTargets(assessment, values, { selected: "ERR_DECISION_RECOMMENDATION_PROPOSAL_OPTION_NOT_SELECTED", assessed: "ERR_DECISION_RECOMMENDATION_PROPOSAL_OPTION_NOT_ASSESSED", duplicate: "ERR_DECISION_RECOMMENDATION_PROPOSAL_DUPLICATE" }); const proposal = construct(assessment, owner, values); assertDecisionRecommendationProposal(proposal); return structuredClone(proposal);
  } };
}

export function assertDecisionRecommendationProposal(value: unknown): asserts value is DecisionRecommendationProposal {
  const invalid = "ERR_DECISION_RECOMMENDATION_PROPOSAL_INVALID";
  try { const proposal = exact(value, proposalKeys, invalid); if (proposal.artifactKind !== "DECISION_RECOMMENDATION_PROPOSAL" || proposal.schemaVersion !== DECISION_RECOMMENDATION_PROPOSAL_SCHEMA_VERSION || typeof proposal.recommendationProposalId !== "string" || !idPattern.test(proposal.recommendationProposalId)) fail(invalid); const assessment = captureAssessmentProposal(proposal.assessmentProposal, invalid); const owner = provenance(proposal.proposedBy, false, invalid); const values = recommendations(proposal.recommendations, false, invalid); validateTargets(assessment, values, { selected: invalid, assessed: invalid, duplicate: invalid }); const ordered = canonicalRecommendations(values); if (JSON.stringify(values) !== JSON.stringify(ordered)) fail(invalid); if (proposal.recommendationProposalId !== proposalId(assessment, owner, values)) fail("ERR_DECISION_RECOMMENDATION_PROPOSAL_ID_MISMATCH"); } catch (error) { if (error instanceof Error && error.message === "ERR_DECISION_RECOMMENDATION_PROPOSAL_ID_MISMATCH") throw error; return fail(invalid); }
}
