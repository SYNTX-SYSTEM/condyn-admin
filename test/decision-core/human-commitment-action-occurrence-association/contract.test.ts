import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as association from "../../../lib/decision-core/human-commitment-action-occurrence-association";
import type {
  HumanCommitmentActionOccurrenceAssociationProposal,
  HumanCommitmentActionOccurrenceAssociationProposalInput,
  HumanCommitmentActionOccurrenceAssociationProvenance
} from "../../../lib/decision-core/human-commitment-action-occurrence-association";
import * as decisionCore from "../../../lib/decision-core";
import {
  assembleDecisionContextValidation,
  assertHumanCommitmentActionOccurrenceAssociationProposal,
  createActionOccurrenceClaim,
  createBoundDecisionAssessmentBasisBinder,
  createBoundDecisionAssessmentProposer,
  createBoundDecisionRecommendationProposer,
  createDecisionActionIntent,
  createDecisionAssessmentRequest,
  createDecisionContextDraft,
  createDecisionContextRevision,
  createHumanCommitment,
  createHumanCommitmentActionOccurrenceAssociationProposal,
  createHumanDecisionDeclaration,
  validateDecisionProposalCoherence,
  type DecisionActionIntent,
  type DecisionContextRevision,
  type HumanCommitment
} from "../../../lib/decision-core";

const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []);
const reorder = (value: unknown): unknown => Array.isArray(value) ? value.map(reorder) : value !== null && typeof value === "object" ? Object.fromEntries(Object.keys(value as Record<string, unknown>).reverse().map((key) => [key, reorder((value as Record<string, unknown>)[key])])) : value;

function revision(): DecisionContextRevision {
  const context = createDecisionContextDraft({ sourceStateReferences: [], items: [
    { role: "DECISION_QUESTION", statement: "Proceed?", provenance: { origin: "HUMAN_INPUT", actorId: "requester" } },
    { role: "OPTION", statement: "A", provenance: { origin: "HUMAN_INPUT", actorId: "requester" } },
    { role: "OBJECTIVE", statement: "Objective", provenance: { origin: "HUMAN_INPUT", actorId: "requester" } }
  ] });
  const validationInput = { expectationValidations: [], consequenceValidations: [] };
  return createDecisionContextRevision({ previousRevisionId: null, context, validationInput, validationAssembly: assembleDecisionContextValidation(context, validationInput) });
}

async function commitment(operationDescription = "intended operation", actorId = "committer"): Promise<HumanCommitment> {
  const value = revision();
  const itemId = (role: string): string => {
    const result = value.context.items.find((item) => item.role === role)?.itemId;
    if (result === undefined) throw new Error(`missing ${role}`);
    return result;
  };
  const optionId = itemId("OPTION");
  const request = createDecisionAssessmentRequest({ revisionId: value.revisionId, requestedBy: { origin: "HUMAN_INPUT", actorId: "requester" }, decisionQuestionItemId: itemId("DECISION_QUESTION"), selectedOptionItemIds: [optionId], selectedObjectiveItemIds: [itemId("OBJECTIVE")], selectedConstraintItemIds: [] });
  const basis = await createBoundDecisionAssessmentBasisBinder({ getRevisionById: async () => value }).bind(request);
  const assessment = await createBoundDecisionAssessmentProposer({ evaluate: async () => [{ optionItemId: optionId, criterionItemId: itemId("OBJECTIVE"), disposition: "ALIGNED" as const, rationale: "assessment" }] }).propose(basis, { origin: "MODEL_PROPOSAL", proposalRef: "assessment" });
  const recommendation = await createBoundDecisionRecommendationProposer({ recommend: async () => [{ optionItemId: optionId, rationale: "recommendation" }] }).propose(assessment, { origin: "MODEL_PROPOSAL", proposalRef: "recommendation" });
  const declaration = createHumanDecisionDeclaration(validateDecisionProposalCoherence(recommendation), { decidedBy: { origin: "HUMAN_INPUT", actorId: "decider" }, chosenOptionItemIds: [optionId], rationale: null });
  const intent: DecisionActionIntent = createDecisionActionIntent(declaration, { declaredBy: { origin: "HUMAN_INPUT", actorId: "intent-declarer" }, operationalizedOptionItemIds: [optionId], operationDescription, rationale: null });
  return createHumanCommitment(intent, { committedBy: { origin: "HUMAN_INPUT", actorId }, rationale: null });
}

const occurrence = (actorId = "occurrence-reporter", operationDescription = "observed different operation") => createActionOccurrenceClaim({ source: { origin: "HUMAN_INPUT", actorId }, operationDescription });
const humanProvenance = (actorId = "association-reporter"): HumanCommitmentActionOccurrenceAssociationProvenance => ({ origin: "HUMAN_INPUT", actorId });
const modelProvenance = (proposalRef = "association-proposal"): HumanCommitmentActionOccurrenceAssociationProvenance => ({ origin: "MODEL_PROPOSAL", proposalRef });
const stateProvenance = (): HumanCommitmentActionOccurrenceAssociationProvenance => ({ origin: "AUTHORITATIVE_STATE", stateReference: { producerId: " producer ", authorityContractId: " contract ", artifactId: " artifact ", locator: " locator " } });
const input = async (overrides: Partial<HumanCommitmentActionOccurrenceAssociationProposalInput> = {}): Promise<HumanCommitmentActionOccurrenceAssociationProposalInput> => ({ humanCommitment: await commitment(), actionOccurrenceClaim: occurrence(), provenance: humanProvenance(), ...overrides });

describe("Human-Commitment Action-Occurrence Association Proposal", () => {
  it("creates an explicit HUMAN_INPUT bridge with complete independently valid endpoints and detached state", async () => {
    const supplied = await input();
    const result = createHumanCommitmentActionOccurrenceAssociationProposal(supplied);
    expect(Object.keys(result).sort()).toEqual(["actionOccurrenceClaim", "artifactKind", "humanCommitment", "humanCommitmentActionOccurrenceAssociationProposalId", "provenance", "schemaVersion"]);
    expect(result).toMatchObject({ artifactKind: "HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_PROPOSAL", schemaVersion: "HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_PROPOSAL_V1", provenance: { origin: "HUMAN_INPUT", actorId: "association-reporter" }, humanCommitment: supplied.humanCommitment, actionOccurrenceClaim: supplied.actionOccurrenceClaim });
    expect(result.humanCommitmentActionOccurrenceAssociationProposalId).toMatch(/^DHCAOA_[0-9A-F]{24}$/);
    expect(result.humanCommitment.actionIntent.humanDecisionDeclaration).toBeDefined();
    const baseline = structuredClone(result);
    supplied.humanCommitment.committedBy.actorId = "changed";
    supplied.actionOccurrenceClaim.operationDescription = "changed";
    (supplied.provenance as { actorId: string }).actorId = "changed";
    expect(result).toEqual(baseline);
    for (const field of ["relationKind", "executionStatus", "fulfilled", "completed", "success", "performedBy", "executor", "current", "head", "latest", "outcome", "effect", "causation", "confidence", "score", "timestamp", "persistence", "loopClosed"]) expect(result).not.toHaveProperty(field);
  });

  it("accepts explicit MODEL_PROPOSAL and AUTHORITATIVE_STATE provenance only, retaining exact authoritative strings", async () => {
    const model = createHumanCommitmentActionOccurrenceAssociationProposal(await input({ provenance: modelProvenance(" model ref ") }));
    expect(model.provenance).toEqual({ origin: "MODEL_PROPOSAL", proposalRef: "model ref" });
    const authoritativeInput = await input({ provenance: stateProvenance() });
    const authoritative = createHumanCommitmentActionOccurrenceAssociationProposal(authoritativeInput);
    expect(authoritative.provenance).toEqual(stateProvenance());
    const invalidOrigin = { ...(await input()), provenance: { origin: "DETERMINISTIC_DERIVATION" } as never };
    const invalidReference = { ...(await input()), provenance: { origin: "AUTHORITATIVE_STATE" as const, stateReference: { producerId: "", authorityContractId: "contract", artifactId: "artifact", locator: "locator" } } };
    expect(() => createHumanCommitmentActionOccurrenceAssociationProposal(invalidOrigin)).toThrow("ERR_DECISION_HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_PROVENANCE_INVALID");
    expect(() => createHumanCommitmentActionOccurrenceAssociationProposal(invalidReference)).toThrow("ERR_DECISION_HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_REFERENCE_INVALID");
  });

  it("permits explicit association despite divergent operation descriptions and never infers one from equal text, actor, or source", async () => {
    const humanCommitment = await commitment("commitment description", "same actor");
    const actionOccurrenceClaim = occurrence("same actor", "occurrence description");
    const divergent = createHumanCommitmentActionOccurrenceAssociationProposal(await input({ humanCommitment, actionOccurrenceClaim }));
    expect(divergent.humanCommitment.actionIntent.operationDescription).toBe("commitment description");
    expect(divergent.actionOccurrenceClaim.operationDescription).toBe("occurrence description");
    const equal = createHumanCommitmentActionOccurrenceAssociationProposal(await input({ humanCommitment: await commitment("same text", "same actor"), actionOccurrenceClaim: occurrence("same actor", "same text") }));
    expect(equal).toMatchObject({ provenance: humanProvenance() });
    expect(equal.humanCommitmentActionOccurrenceAssociationProposalId).not.toBe(divergent.humanCommitmentActionOccurrenceAssociationProposalId);
  });

  it("allows multiple independent explicit proposals and commits complete endpoints plus provenance to DHCAOA identity", async () => {
    const sharedCommitment = await commitment();
    const sharedOccurrence = occurrence();
    const first = createHumanCommitmentActionOccurrenceAssociationProposal(await input({ humanCommitment: sharedCommitment, actionOccurrenceClaim: sharedOccurrence, provenance: humanProvenance("one") }));
    const second = createHumanCommitmentActionOccurrenceAssociationProposal(await input({ humanCommitment: sharedCommitment, actionOccurrenceClaim: sharedOccurrence, provenance: humanProvenance("two") }));
    expect(first.humanCommitmentActionOccurrenceAssociationProposalId).not.toBe(second.humanCommitmentActionOccurrenceAssociationProposalId);
    const changedCommitment = createHumanCommitmentActionOccurrenceAssociationProposal(await input({ humanCommitment: await commitment("different"), actionOccurrenceClaim: sharedOccurrence, provenance: humanProvenance("one") }));
    const changedClaim = createHumanCommitmentActionOccurrenceAssociationProposal(await input({ humanCommitment: sharedCommitment, actionOccurrenceClaim: occurrence("actor", "different"), provenance: humanProvenance("one") }));
    expect(changedCommitment.humanCommitmentActionOccurrenceAssociationProposalId).not.toBe(first.humanCommitmentActionOccurrenceAssociationProposalId);
    expect(changedClaim.humanCommitmentActionOccurrenceAssociationProposalId).not.toBe(first.humanCommitmentActionOccurrenceAssociationProposalId);
    expect(createHumanCommitmentActionOccurrenceAssociationProposal(reorder(await input({ humanCommitment: sharedCommitment, actionOccurrenceClaim: sharedOccurrence, provenance: humanProvenance("one") })) as HumanCommitmentActionOccurrenceAssociationProposalInput).humanCommitmentActionOccurrenceAssociationProposalId).toBe(first.humanCommitmentActionOccurrenceAssociationProposalId);
  });

  it("rejects hostile wrappers, endpoint lineage, claim/source, provenance, references, symbols, hidden state, and extras without getters", async () => {
    let getterCalls = 0;
    const valid = await input();
    const accessorTop = structuredClone(valid) as unknown as Record<string, unknown>; Object.defineProperty(accessorTop, "provenance", { enumerable: true, get: () => { getterCalls += 1; return humanProvenance(); } });
    const symbolTop = structuredClone(valid) as unknown as Record<PropertyKey, unknown>; Object.defineProperty(symbolTop, Symbol("hostile"), { enumerable: true, value: true });
    const hiddenTop = structuredClone(valid) as unknown as Record<string, unknown>; Object.defineProperty(hiddenTop, "hidden", { enumerable: false, value: true });
    const extraTop = { ...valid, extra: true };
    const hostileCommitment = structuredClone(valid); Object.defineProperty(hostileCommitment.humanCommitment.actionIntent.humanDecisionDeclaration, "humanDecisionId", { enumerable: true, get: () => { getterCalls += 1; return "DHDEC_x"; } });
    const hostileClaim = structuredClone(valid); Object.defineProperty(hostileClaim.actionOccurrenceClaim, "operationDescription", { enumerable: true, get: () => { getterCalls += 1; return "x"; } });
    const hostileProvenance = structuredClone(valid); Object.defineProperty(hostileProvenance.provenance, "actorId", { enumerable: true, get: () => { getterCalls += 1; return "x"; } });
    const authoritative = structuredClone(await input({ provenance: stateProvenance() })); Object.defineProperty((authoritative.provenance as unknown as { stateReference: Record<string, unknown> }).stateReference, "locator", { enumerable: true, get: () => { getterCalls += 1; return "x"; } });
    for (const value of [accessorTop, symbolTop, hiddenTop, extraTop]) expect(() => createHumanCommitmentActionOccurrenceAssociationProposal(value as never)).toThrow("ERR_DECISION_HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_INPUT_INVALID");
    expect(() => createHumanCommitmentActionOccurrenceAssociationProposal(hostileCommitment)).toThrow("ERR_DECISION_HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_HUMAN_COMMITMENT_INVALID");
    expect(() => createHumanCommitmentActionOccurrenceAssociationProposal(hostileClaim)).toThrow("ERR_DECISION_HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_ACTION_OCCURRENCE_CLAIM_INVALID");
    expect(() => createHumanCommitmentActionOccurrenceAssociationProposal(hostileProvenance)).toThrow("ERR_DECISION_HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_PROVENANCE_INVALID");
    expect(() => createHumanCommitmentActionOccurrenceAssociationProposal(authoritative)).toThrow("ERR_DECISION_HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_REFERENCE_INVALID");
    expect(getterCalls).toBe(0);
  });

  it("self-contained stored assertion maps all body invalidity before outer identity mismatch and repairs nothing", async () => {
    const value = createHumanCommitmentActionOccurrenceAssociationProposal(await input());
    assertHumanCommitmentActionOccurrenceAssociationProposal(value);
    const stale = structuredClone(value); stale.humanCommitmentActionOccurrenceAssociationProposalId = "DHCAOA_000000000000000000000000";
    expect(() => assertHumanCommitmentActionOccurrenceAssociationProposal(stale)).toThrow("ERR_DECISION_HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_ID_MISMATCH");
    const invalidCommitment = structuredClone(stale); invalidCommitment.humanCommitment.humanCommitmentId = "DHCOM_000000000000000000000000";
    const invalidClaim = structuredClone(stale); invalidClaim.actionOccurrenceClaim.actionOccurrenceClaimId = "DAOC_000000000000000000000000";
    const invalidProvenance = structuredClone(stale); invalidProvenance.provenance = { origin: "MODEL_PROPOSAL", proposalRef: " uncanonical " };
    for (const body of [invalidCommitment, invalidClaim, invalidProvenance]) expect(() => assertHumanCommitmentActionOccurrenceAssociationProposal(body)).toThrow("ERR_DECISION_HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_INVALID");
  });

  it("exports exactly the narrow 8E1 surface, owns exactly seven errors, and contains no forbidden topology, persistence, inference, execution, time, or legacy semantics", () => {
    expect(Object.keys(association).sort()).toEqual(["HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_PROPOSAL_SCHEMA_VERSION", "assertHumanCommitmentActionOccurrenceAssociationProposal", "createHumanCommitmentActionOccurrenceAssociationProposal"]);
    expect(Object.keys(decisionCore).filter((key) => Object.keys(association).includes(key)).sort()).toEqual(Object.keys(association).sort());
    const source = sourceFiles(resolve(process.cwd(), "lib/decision-core/human-commitment-action-occurrence-association")).map((file) => readFileSync(file, "utf8")).join("\n");
    expect(source).not.toMatch(/from\s+["'][^"']*(revision-persistence|revision-lineage|repository|context-observation|action-state-change|outcome-attribution|career|capability-core|provider|model|evaluator)[^"']*["']/i);
    expect(source).not.toMatch(/\b(getRevisionById|writeRevision|createDecisionContextRevision|createDecisionActionIntent|createHumanDecisionDeclaration|similarity|matching|causation|executionStatus|fulfilled|completed|timestamp|createdAt|Date\.now|new Date|Math\.random|UUID)\b/i);
    expect([...new Set(source.match(/ERR_DECISION_HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_[A-Z_]+/g) ?? [])].sort()).toEqual([
      "ERR_DECISION_HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_ACTION_OCCURRENCE_CLAIM_INVALID",
      "ERR_DECISION_HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_HUMAN_COMMITMENT_INVALID",
      "ERR_DECISION_HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_ID_MISMATCH",
      "ERR_DECISION_HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_INPUT_INVALID",
      "ERR_DECISION_HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_INVALID",
      "ERR_DECISION_HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_PROVENANCE_INVALID",
      "ERR_DECISION_HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_REFERENCE_INVALID"
    ]);
    const provenance: HumanCommitmentActionOccurrenceAssociationProvenance = humanProvenance(); const proposal: HumanCommitmentActionOccurrenceAssociationProposal | null = null;
    expect([provenance.origin, proposal]).toEqual(["HUMAN_INPUT", null]);
  });
});
