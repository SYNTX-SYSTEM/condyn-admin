import { createHash } from "node:crypto";
import { assertDecisionAssessmentBasis, type DecisionAssessmentBasis } from "../assessment-basis";
import {
  DECISION_ASSESSMENT_DISPOSITIONS,
  DECISION_ASSESSMENT_PROPOSAL_SCHEMA_VERSION,
  type BoundDecisionAssessmentProposer,
  type DecisionAssessmentDisposition,
  type DecisionAssessmentEvaluation,
  type DecisionAssessmentEvaluator,
  type DecisionAssessmentProposal,
  type DecisionAssessmentProposalProvenance
} from "./types";

const fail = (code: string): never => { throw new Error(code); };
const proposalKeys = ["artifactKind", "schemaVersion", "assessmentProposalId", "assessmentBasis", "proposedBy", "assessments"] as const;
const provenanceKeys = ["origin", "proposalRef"] as const;
const evaluationKeys = ["optionItemId", "criterionItemId", "disposition", "rationale"] as const;
const idPattern = /^DASPR_[0-9A-F]{24}$/;
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

function assessmentKey(value: DecisionAssessmentEvaluation): string { return JSON.stringify([value.optionItemId, value.criterionItemId]); }
function canonicalAssessments(value: readonly DecisionAssessmentEvaluation[]): DecisionAssessmentEvaluation[] { return [...value].sort((left, right) => assessmentKey(left) < assessmentKey(right) ? -1 : assessmentKey(left) > assessmentKey(right) ? 1 : 0); }

function proposalId(basis: DecisionAssessmentBasis, provenance: DecisionAssessmentProposalProvenance, assessments: readonly DecisionAssessmentEvaluation[]): string {
  const digest = createHash("sha256").update(JSON.stringify([
    DECISION_ASSESSMENT_PROPOSAL_SCHEMA_VERSION,
    canonical(basis as unknown as Captured),
    ["MODEL_PROPOSAL", provenance.proposalRef],
    assessments
  ]), "utf8").digest("hex").slice(0, 24).toUpperCase();
  return `DASPR_${digest}`;
}

function captureBasis(value: unknown, code: string): DecisionAssessmentBasis {
  try { const basis = capture(value, code) as unknown as DecisionAssessmentBasis; assertDecisionAssessmentBasis(basis); return basis; } catch { return fail(code); }
}

function provenance(value: unknown, trim: boolean, code: string): DecisionAssessmentProposalProvenance {
  const captured = exact(value, provenanceKeys, code);
  if (captured.origin !== "MODEL_PROPOSAL" || typeof captured.proposalRef !== "string") return fail(code);
  const proposalRef = trim ? captured.proposalRef.trim() : captured.proposalRef;
  if (proposalRef.length === 0 || (!trim && proposalRef !== captured.proposalRef.trim())) return fail(code);
  return { origin: "MODEL_PROPOSAL", proposalRef };
}

function evaluation(value: unknown, trim: boolean, code: string): DecisionAssessmentEvaluation {
  const captured = exact(value, evaluationKeys, code);
  if (typeof captured.optionItemId !== "string" || !itemPattern.test(captured.optionItemId) || typeof captured.criterionItemId !== "string" || !itemPattern.test(captured.criterionItemId) || typeof captured.disposition !== "string" || !DECISION_ASSESSMENT_DISPOSITIONS.includes(captured.disposition as DecisionAssessmentDisposition) || typeof captured.rationale !== "string") return fail(code);
  const rationale = trim ? captured.rationale.trim() : captured.rationale;
  if (rationale.length === 0 || (!trim && rationale !== captured.rationale.trim())) return fail(code);
  return { optionItemId: captured.optionItemId, criterionItemId: captured.criterionItemId, disposition: captured.disposition as DecisionAssessmentDisposition, rationale };
}

function evaluations(value: unknown, trim: boolean, code: string): DecisionAssessmentEvaluation[] {
  const captured = capture(value, code);
  if (!Array.isArray(captured)) return fail(code);
  return captured.map((item) => evaluation(item, trim, code));
}

function validateTargets(basis: DecisionAssessmentBasis, values: readonly DecisionAssessmentEvaluation[], code: { option: string; criterion: string; duplicate: string }): void {
  const options = new Set(basis.assessmentRequest.selectedOptionItemIds);
  const criteria = new Set([...basis.assessmentRequest.selectedObjectiveItemIds, ...basis.assessmentRequest.selectedConstraintItemIds]);
  const targets = new Set<string>();
  for (const value of values) {
    if (!options.has(value.optionItemId)) fail(code.option);
    if (!criteria.has(value.criterionItemId)) fail(code.criterion);
    const target = assessmentKey(value); if (targets.has(target)) fail(code.duplicate); targets.add(target);
  }
}

function captureEvaluator(value: unknown): (input: { assessmentBasis: DecisionAssessmentBasis }) => Promise<readonly DecisionAssessmentEvaluation[]> {
  try {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return fail("ERR_DECISION_ASSESSMENT_PROPOSAL_EVALUATOR_INVALID");
    const keys = Reflect.ownKeys(value);
    if (keys.length !== 1 || keys[0] !== "evaluate") return fail("ERR_DECISION_ASSESSMENT_PROPOSAL_EVALUATOR_INVALID");
    const descriptor = Reflect.getOwnPropertyDescriptor(value, "evaluate");
    if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor) || typeof descriptor.value !== "function") return fail("ERR_DECISION_ASSESSMENT_PROPOSAL_EVALUATOR_INVALID");
    return descriptor.value.bind(value) as (input: { assessmentBasis: DecisionAssessmentBasis }) => Promise<readonly DecisionAssessmentEvaluation[]>;
  } catch { return fail("ERR_DECISION_ASSESSMENT_PROPOSAL_EVALUATOR_INVALID"); }
}

function construct(basis: DecisionAssessmentBasis, proposedBy: DecisionAssessmentProposalProvenance, assessments: readonly DecisionAssessmentEvaluation[]): DecisionAssessmentProposal {
  const canonicalValues = canonicalAssessments(assessments);
  return { artifactKind: "DECISION_ASSESSMENT_PROPOSAL", schemaVersion: DECISION_ASSESSMENT_PROPOSAL_SCHEMA_VERSION, assessmentProposalId: proposalId(basis, proposedBy, canonicalValues), assessmentBasis: basis, proposedBy, assessments: canonicalValues };
}

export function createBoundDecisionAssessmentProposer(evaluator: DecisionAssessmentEvaluator): BoundDecisionAssessmentProposer {
  const evaluate = captureEvaluator(evaluator);
  return {
    async propose(assessmentBasis: DecisionAssessmentBasis, proposedBy: DecisionAssessmentProposalProvenance): Promise<DecisionAssessmentProposal> {
      const basis = captureBasis(assessmentBasis, "ERR_DECISION_ASSESSMENT_PROPOSAL_BASIS_INVALID");
      const owner = provenance(proposedBy, true, "ERR_DECISION_ASSESSMENT_PROPOSAL_PROVENANCE_INVALID");
      const output = await evaluate({ assessmentBasis: structuredClone(basis) });
      const values = evaluations(output, true, "ERR_DECISION_ASSESSMENT_PROPOSAL_EVALUATION_INVALID");
      validateTargets(basis, values, { option: "ERR_DECISION_ASSESSMENT_PROPOSAL_OPTION_NOT_SELECTED", criterion: "ERR_DECISION_ASSESSMENT_PROPOSAL_CRITERION_NOT_SELECTED", duplicate: "ERR_DECISION_ASSESSMENT_PROPOSAL_DUPLICATE" });
      const proposal = construct(basis, owner, values);
      assertDecisionAssessmentProposal(proposal);
      return structuredClone(proposal);
    }
  };
}

export function assertDecisionAssessmentProposal(value: unknown): asserts value is DecisionAssessmentProposal {
  const invalid = "ERR_DECISION_ASSESSMENT_PROPOSAL_INVALID";
  try {
    const proposal = exact(value, proposalKeys, invalid);
    if (proposal.artifactKind !== "DECISION_ASSESSMENT_PROPOSAL" || proposal.schemaVersion !== DECISION_ASSESSMENT_PROPOSAL_SCHEMA_VERSION || typeof proposal.assessmentProposalId !== "string" || !idPattern.test(proposal.assessmentProposalId)) fail(invalid);
    const basis = captureBasis(proposal.assessmentBasis, invalid);
    const owner = provenance(proposal.proposedBy, false, invalid);
    const values = evaluations(proposal.assessments, false, invalid);
    validateTargets(basis, values, { option: invalid, criterion: invalid, duplicate: invalid });
    const ordered = canonicalAssessments(values);
    if (JSON.stringify(values) !== JSON.stringify(ordered)) fail(invalid);
    if (proposal.assessmentProposalId !== proposalId(basis, owner, values)) fail("ERR_DECISION_ASSESSMENT_PROPOSAL_ID_MISMATCH");
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_DECISION_ASSESSMENT_PROPOSAL_ID_MISMATCH") throw error;
    return fail(invalid);
  }
}
