import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as observation from "../../../lib/decision-core/context-observation-proposal";
import type {
  DecisionContextObservationProposal,
  DecisionContextObservationProposalInput,
  DecisionContextObservationProposalProvenance
} from "../../../lib/decision-core/context-observation-proposal";
import * as decisionCore from "../../../lib/decision-core";
import {
  assertDecisionContextObservationProposal,
  createActionOccurrenceClaim,
  createActionStateChangeAssociationProposal,
  createDecisionContextObservationProposal,
  createOutcomeAttributionProposal,
  createStateChangeClaim
} from "../../../lib/decision-core";

const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []);
const occurrence = (actorId = " action reporter ") => createActionOccurrenceClaim({ source: { origin: "HUMAN_INPUT", actorId }, operationDescription: " operation " });
const stateChange = (actorId = " state reporter ") => createStateChangeClaim({ source: { origin: "HUMAN_INPUT", actorId }, stateChangeDescription: " change " });
const association = () => createActionStateChangeAssociationProposal({ actionOccurrenceClaim: occurrence(), stateChangeClaim: stateChange(), provenance: { origin: "HUMAN_INPUT", actorId: " association reporter " } });
const attribution = () => createOutcomeAttributionProposal({ associationProposal: association(), provenance: { origin: "HUMAN_INPUT", actorId: " attribution reporter " } });
const humanProvenance = (actorId = " observation reporter "): DecisionContextObservationProposalProvenance => ({ origin: "HUMAN_INPUT", actorId });
const modelProvenance = (proposalRef = " observation proposal "): DecisionContextObservationProposalProvenance => ({ origin: "MODEL_PROPOSAL", proposalRef });
const authoritativeProvenance = (overrides: Partial<{ producerId: string; authorityContractId: string; artifactId: string; locator: string }> = {}): DecisionContextObservationProposalProvenance => ({ origin: "AUTHORITATIVE_STATE", stateReference: { producerId: " producer ", authorityContractId: " contract ", artifactId: " artifact ", locator: " locator ", ...overrides } });
const input = (overrides: Partial<DecisionContextObservationProposalInput> = {}): DecisionContextObservationProposalInput => ({ outcomeAttributionProposal: attribution(), statement: " observation statement ", provenance: humanProvenance(), ...overrides });
const reorder = (value: unknown): unknown => Array.isArray(value) ? value.map(reorder) : value !== null && typeof value === "object" ? Object.fromEntries(Object.keys(value as Record<string, unknown>).reverse().map((key) => [key, reorder((value as Record<string, unknown>)[key])])) : value;

function stringifyArrayPayload(source: string): string {
  const marker = "JSON.stringify([";
  const start = source.indexOf(marker);
  if (start < 0) throw new Error("missing identity payload");
  let depth = 0;
  for (let index = start + marker.length - 1; index < source.length; index += 1) {
    if (source[index] === "[") depth += 1;
    if (source[index] === "]") depth -= 1;
    if (depth === 0) return source.slice(start + marker.length, index);
  }
  throw new Error("unterminated identity payload");
}

describe("Decision Context Observation Proposal", () => {
  it("creates exact canonical HUMAN_INPUT observation-candidate state and returns detached state", () => {
    const supplied = input();
    const proposal = createDecisionContextObservationProposal(supplied);
    expect(Object.keys(supplied).sort()).toEqual(["outcomeAttributionProposal", "provenance", "statement"]);
    expect(proposal).toMatchObject({ artifactKind: "DECISION_CONTEXT_OBSERVATION_PROPOSAL", schemaVersion: "DECISION_CONTEXT_OBSERVATION_PROPOSAL_V1", statement: "observation statement", provenance: { origin: "HUMAN_INPUT", actorId: "observation reporter" } });
    expect(proposal.decisionContextObservationProposalId).toMatch(/^DCOP_[0-9A-F]{24}$/);
    expect(Object.keys(proposal).sort()).toEqual(["artifactKind", "decisionContextObservationProposalId", "outcomeAttributionProposal", "provenance", "schemaVersion", "statement"]);
    for (const field of ["role", "itemId", "contextId", "revisionId", "previousRevisionId", "feedback", "evaluation", "support", "status", "confidence", "score", "priority", "truth", "timestamp", "repository"]) expect(proposal).not.toHaveProperty(field);
    supplied.statement = "changed";
    (supplied.provenance as { actorId: string }).actorId = "changed";
    supplied.outcomeAttributionProposal.provenance = { origin: "MODEL_PROPOSAL", proposalRef: "changed" };
    expect(proposal.statement).toBe("observation statement");
    expect((proposal.provenance as { actorId: string }).actorId).toBe("observation reporter");
    expect(proposal.outcomeAttributionProposal.provenance).toEqual({ origin: "HUMAN_INPUT", actorId: "attribution reporter" });
  });

  it("admits MODEL_PROPOSAL and AUTHORITATIVE_STATE provenance while preserving exact references", () => {
    const model = createDecisionContextObservationProposal(input({ provenance: modelProvenance() }));
    expect(model.provenance).toEqual({ origin: "MODEL_PROPOSAL", proposalRef: "observation proposal" });
    const authoritativeInput = input({ provenance: authoritativeProvenance() });
    const authoritative = createDecisionContextObservationProposal(authoritativeInput);
    expect(authoritative.provenance).toEqual(authoritativeInput.provenance);
    const reference = (authoritativeInput.provenance as unknown as { stateReference: Record<string, string> }).stateReference;
    for (const axis of ["producerId", "authorityContractId", "artifactId", "locator"] as const) reference[axis] = "changed-" + axis;
    expect(authoritative.provenance).toEqual(authoritativeProvenance());
  });

  it("enforces closed provenance, statement validation, and sealed predecessor constructor ownership", () => {
    expect(() => createDecisionContextObservationProposal(input({ provenance: { origin: "DETERMINISTIC_DERIVATION", derivationRef: "derived" } as never }))).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_PROVENANCE_INVALID");
    expect(() => createDecisionContextObservationProposal(input({ statement: " " }))).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_STATEMENT_INVALID");
    expect(() => createDecisionContextObservationProposal(input({ provenance: humanProvenance(" ") }))).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_PROVENANCE_INVALID");
    expect(() => createDecisionContextObservationProposal(input({ provenance: modelProvenance(" ") }))).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_PROVENANCE_INVALID");
    expect(() => createDecisionContextObservationProposal(input({ provenance: { origin: "AUTHORITATIVE_STATE", stateReference: { producerId: "producer", authorityContractId: "contract", artifactId: "", locator: "locator" } } }))).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_REFERENCE_INVALID");
    expect(() => createDecisionContextObservationProposal({ ...input(), extra: true } as never)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_INPUT_INVALID");
    const stale = attribution(); stale.outcomeAttributionProposalId = "DOATP_000000000000000000000000";
    expect(() => createDecisionContextObservationProposal(input({ outcomeAttributionProposal: stale }))).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_OUTCOME_ATTRIBUTION_INVALID");
  });

  it("derives deterministic DCOP identity from predecessor, opaque statement, and complete canonical provenance", () => {
    const first = input();
    const proposal = createDecisionContextObservationProposal(first);
    const same = createDecisionContextObservationProposal(reorder(first) as DecisionContextObservationProposalInput);
    expect(same.decisionContextObservationProposalId).toBe(proposal.decisionContextObservationProposalId);
    expect(createDecisionContextObservationProposal(input({ statement: "different statement" })).decisionContextObservationProposalId).not.toBe(proposal.decisionContextObservationProposalId);
    const changedPredecessor = createDecisionContextObservationProposal(input({ outcomeAttributionProposal: createOutcomeAttributionProposal({ associationProposal: association(), provenance: { origin: "MODEL_PROPOSAL", proposalRef: "other" } }) }));
    expect(changedPredecessor.decisionContextObservationProposalId).not.toBe(proposal.decisionContextObservationProposalId);
    expect(createDecisionContextObservationProposal(input({ provenance: humanProvenance("other") })).decisionContextObservationProposalId).not.toBe(proposal.decisionContextObservationProposalId);
    expect(createDecisionContextObservationProposal(input({ provenance: modelProvenance() })).decisionContextObservationProposalId).not.toBe(proposal.decisionContextObservationProposalId);
    const authoritative = createDecisionContextObservationProposal(input({ provenance: authoritativeProvenance() }));
    const reorderedAuthoritative = { provenance: { stateReference: { locator: " locator ", artifactId: " artifact ", authorityContractId: " contract ", producerId: " producer " }, origin: "AUTHORITATIVE_STATE" as const }, statement: " observation statement ", outcomeAttributionProposal: attribution() };
    expect(createDecisionContextObservationProposal(reorderedAuthoritative).decisionContextObservationProposalId).toBe(authoritative.decisionContextObservationProposalId);
    for (const axis of ["producerId", "authorityContractId", "artifactId", "locator"] as const) expect(createDecisionContextObservationProposal(input({ provenance: authoritativeProvenance({ [axis]: "changed-" + axis }) })).decisionContextObservationProposalId).not.toBe(authoritative.decisionContextObservationProposalId);
    expect(createDecisionContextObservationProposal(input({ provenance: authoritativeProvenance({ locator: "locator" }) })).decisionContextObservationProposalId).not.toBe(authoritative.decisionContextObservationProposalId);
  });

  it("asserts exact canonical stored state without repair and separates stale outer identity", () => {
    const proposal = createDecisionContextObservationProposal(input());
    assertDecisionContextObservationProposal(proposal);
    const stale = structuredClone(proposal); stale.decisionContextObservationProposalId = "DCOP_000000000000000000000000";
    expect(() => assertDecisionContextObservationProposal(stale)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_ID_MISMATCH");
    const untrimmedStatement = structuredClone(proposal); untrimmedStatement.statement = " observation statement ";
    const untrimmedHuman = structuredClone(proposal); (untrimmedHuman.provenance as { actorId: string }).actorId = " observation reporter ";
    const model = createDecisionContextObservationProposal(input({ provenance: modelProvenance() }));
    const untrimmedModel = structuredClone(model); (untrimmedModel.provenance as { proposalRef: string }).proposalRef = " observation proposal ";
    const malformedProvenance = structuredClone(proposal); malformedProvenance.provenance = { origin: "DETERMINISTIC_DERIVATION" } as never;
    const malformedReference = structuredClone(createDecisionContextObservationProposal(input({ provenance: authoritativeProvenance() }))); ((malformedReference.provenance as { stateReference: { locator: string } }).stateReference.locator) = "";
    const staleNestedAttribution = structuredClone(proposal); staleNestedAttribution.outcomeAttributionProposal.outcomeAttributionProposalId = "DOATP_000000000000000000000000";
    for (const value of [untrimmedStatement, untrimmedHuman, untrimmedModel, malformedProvenance, malformedReference, staleNestedAttribution]) expect(() => assertDecisionContextObservationProposal(value)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_INVALID");
  });

  it("rejects hostile top-level, provenance, reference, and predecessor state without getter execution", () => {
    let getterCalls = 0;
    const accessorTop = input() as unknown as Record<string, unknown>; Object.defineProperty(accessorTop, "provenance", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return humanProvenance(); } });
    const symbolTop = input() as unknown as Record<PropertyKey, unknown>; Object.defineProperty(symbolTop, Symbol("hostile"), { enumerable: true, value: true });
    const hiddenTop = input() as unknown as Record<string, unknown>; Object.defineProperty(hiddenTop, "hidden", { enumerable: false, value: true });
    const extraTop = input() as unknown as Record<string, unknown>; extraTop.extra = true;
    const accessorProvenance = input() as unknown as { provenance: Record<string, unknown> }; Object.defineProperty(accessorProvenance.provenance, "actorId", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "reporter"; } });
    const symbolProvenance = input() as unknown as { provenance: Record<PropertyKey, unknown> }; Object.defineProperty(symbolProvenance.provenance, Symbol("hostile"), { enumerable: true, value: true });
    const hiddenProvenance = input() as unknown as { provenance: Record<string, unknown> }; Object.defineProperty(hiddenProvenance.provenance, "hidden", { enumerable: false, value: true });
    const extraProvenance = input() as unknown as { provenance: Record<string, unknown> }; extraProvenance.provenance.extra = true;
    const accessorReference = input({ provenance: authoritativeProvenance() }) as unknown as { provenance: { stateReference: Record<string, unknown> } }; Object.defineProperty(accessorReference.provenance.stateReference, "locator", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "locator"; } });
    const symbolReference = input({ provenance: authoritativeProvenance() }) as unknown as { provenance: { stateReference: Record<PropertyKey, unknown> } }; Object.defineProperty(symbolReference.provenance.stateReference, Symbol("hostile"), { enumerable: true, value: true });
    const hiddenReference = input({ provenance: authoritativeProvenance() }) as unknown as { provenance: { stateReference: Record<string, unknown> } }; Object.defineProperty(hiddenReference.provenance.stateReference, "hidden", { enumerable: false, value: true });
    const extraReference = input({ provenance: authoritativeProvenance() }) as unknown as { provenance: { stateReference: Record<string, unknown> } }; extraReference.provenance.stateReference.extra = true;
    const hostileAttribution = input(); Object.defineProperty(hostileAttribution.outcomeAttributionProposal, "provenance", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return humanProvenance(); } });
    const symbolAttribution = input() as unknown as { outcomeAttributionProposal: Record<PropertyKey, unknown> }; Object.defineProperty(symbolAttribution.outcomeAttributionProposal, Symbol("hostile"), { enumerable: true, value: true });
    const hiddenAttribution = input() as unknown as { outcomeAttributionProposal: Record<string, unknown> }; Object.defineProperty(hiddenAttribution.outcomeAttributionProposal, "hidden", { enumerable: false, value: true });
    const extraAttribution = input() as unknown as { outcomeAttributionProposal: Record<string, unknown> }; extraAttribution.outcomeAttributionProposal.extra = true;
    const hostileAssociation = input(); Object.defineProperty(hostileAssociation.outcomeAttributionProposal.associationProposal, "provenance", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return humanProvenance(); } });
    const hostileActionOccurrence = input(); Object.defineProperty(hostileActionOccurrence.outcomeAttributionProposal.associationProposal.actionOccurrenceClaim, "operationDescription", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "operation"; } });
    const hostileStateChange = input(); Object.defineProperty(hostileStateChange.outcomeAttributionProposal.associationProposal.stateChangeClaim, "stateChangeDescription", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "change"; } });
    for (const value of [accessorTop, symbolTop, hiddenTop, extraTop]) expect(() => createDecisionContextObservationProposal(value as never)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_INPUT_INVALID");
    for (const value of [accessorProvenance, symbolProvenance, hiddenProvenance, extraProvenance]) expect(() => createDecisionContextObservationProposal(value as never)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_PROVENANCE_INVALID");
    for (const value of [accessorReference, symbolReference, hiddenReference, extraReference]) expect(() => createDecisionContextObservationProposal(value as never)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_REFERENCE_INVALID");
    for (const value of [hostileAttribution, symbolAttribution, hiddenAttribution, extraAttribution, hostileAssociation, hostileActionOccurrence, hostileStateChange]) expect(() => createDecisionContextObservationProposal(value as never)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_OUTCOME_ATTRIBUTION_INVALID");
    const proposal = createDecisionContextObservationProposal(input());
    const storedTopAccessor = structuredClone(proposal); Object.defineProperty(storedTopAccessor, "provenance", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return humanProvenance(); } });
    const storedProvenanceAccessor = structuredClone(proposal); Object.defineProperty(storedProvenanceAccessor.provenance, "actorId", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "reporter"; } });
    const storedReference = structuredClone(createDecisionContextObservationProposal(input({ provenance: authoritativeProvenance() }))); Object.defineProperty((storedReference.provenance as unknown as { stateReference: Record<string, unknown> }).stateReference, "locator", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "locator"; } });
    const storedAttribution = structuredClone(proposal); Object.defineProperty(storedAttribution.outcomeAttributionProposal, "provenance", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return humanProvenance(); } });
    const storedAttributionSymbol = structuredClone(proposal) as unknown as { outcomeAttributionProposal: Record<PropertyKey, unknown> }; Object.defineProperty(storedAttributionSymbol.outcomeAttributionProposal, Symbol("hostile"), { enumerable: true, value: true });
    const storedAttributionHidden = structuredClone(proposal) as unknown as { outcomeAttributionProposal: Record<string, unknown> }; Object.defineProperty(storedAttributionHidden.outcomeAttributionProposal, "hidden", { enumerable: false, value: true });
    const storedAttributionExtra = structuredClone(proposal) as unknown as { outcomeAttributionProposal: Record<string, unknown> }; storedAttributionExtra.outcomeAttributionProposal.extra = true;
    const storedAssociation = structuredClone(proposal); Object.defineProperty(storedAssociation.outcomeAttributionProposal.associationProposal, "provenance", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return humanProvenance(); } });
    const storedActionOccurrence = structuredClone(proposal); Object.defineProperty(storedActionOccurrence.outcomeAttributionProposal.associationProposal.actionOccurrenceClaim, "operationDescription", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "operation"; } });
    const storedStateChange = structuredClone(proposal); Object.defineProperty(storedStateChange.outcomeAttributionProposal.associationProposal.stateChangeClaim, "stateChangeDescription", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "change"; } });
    for (const value of [storedTopAccessor, storedProvenanceAccessor, storedReference, storedAttribution, storedAttributionSymbol, storedAttributionHidden, storedAttributionExtra, storedAssociation, storedActionOccurrence, storedStateChange]) expect(() => assertDecisionContextObservationProposal(value)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_INVALID");
    expect(getterCalls).toBe(0);
  });

  it("exports exactly the standalone 8D1 surface and hashes the actual complete canonical provenance tuple", () => {
    expect(Object.keys(observation).sort()).toEqual(["DECISION_CONTEXT_OBSERVATION_PROPOSAL_SCHEMA_VERSION", "assertDecisionContextObservationProposal", "createDecisionContextObservationProposal"]);
    expect(Object.keys(decisionCore).filter((name) => Object.keys(observation).includes(name)).sort()).toEqual(Object.keys(observation).sort());
    const source = sourceFiles(resolve(process.cwd(), "lib/decision-core/context-observation-proposal")).map((file) => readFileSync(file, "utf8")).join("\n");
    const typesSource = readFileSync(resolve(process.cwd(), "lib/decision-core/context-observation-proposal/types.ts"), "utf8");
    expect(typesSource).toMatch(/^import type \{ AuthoritativeStateReference \} from "\.\.\/authority";$/m);
    const identity = source.match(/function observationId[\s\S]*?\n}\n\nfunction construct/)?.[0];
    if (identity === undefined) throw new Error("missing observation identity");
    expect(stringifyArrayPayload(identity).replace(/\s+/g, "")).toBe("DECISION_CONTEXT_OBSERVATION_PROPOSAL_SCHEMA_VERSION,outcomeAttributionProposal.outcomeAttributionProposalId,statement,canonicalProvenance(provenance)");
    const canonical = source.match(/function canonicalProvenance[\s\S]*?\n}\n\nfunction observationId/)?.[0];
    if (canonical === undefined) throw new Error("missing provenance identity");
    expect(canonical.replace(/\s+/g, "")).toBe('functioncanonicalProvenance(provenance:DecisionContextObservationProposalProvenance):readonly["HUMAN_INPUT",string]|readonly["MODEL_PROPOSAL",string]|readonly["AUTHORITATIVE_STATE",readonly[string,string,string,string]]{if(provenance.origin==="HUMAN_INPUT")return["HUMAN_INPUT",provenance.actorId];if(provenance.origin==="MODEL_PROPOSAL")return["MODEL_PROPOSAL",provenance.proposalRef];return["AUTHORITATIVE_STATE",[provenance.stateReference.producerId,provenance.stateReference.authorityContractId,provenance.stateReference.artifactId,provenance.stateReference.locator]];}functionobservationId');
    expect(source).not.toMatch(/from\s+["'][^"']*(context|revisions|revision-|career|feedback|learning|persistence|repository|matching)/i);
    expect(source).not.toMatch(/\b(DecisionContextItem|DecisionContextDraft|DecisionContextRevision|createDecisionContextDraft|assertDecisionContextDraft|createDecisionContextRevision|assembleDecisionContextValidation|FeedbackRecord|FeedbackClaim|FeedbackProposal|EvaluationState|DESIRABLE|UNDESIRABLE|NEUTRAL|UNRESOLVED|AttributionRecord|AttributionType|LearningProposal|ASSOCIATED_WITH|SUPPORTS|CONTRADICTS|CAUSAL_CLAIM|role|itemId|contextId|revisionId|previousRevisionId|feedback|evaluation|support|status|confidence|score|priority|truth|timestamp|createdAt|occurredAt|observedAt|effectiveAt|resolver|evaluator|repository|persistence|date\.now|new date|math\.random|uuid|causation|causalClaim|causalSupport)\b/i);
    expect([...new Set(source.match(/ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_[A-Z_]+/g) ?? [])].sort()).toEqual(["ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_ID_MISMATCH", "ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_INPUT_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_OUTCOME_ATTRIBUTION_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_PROVENANCE_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_REFERENCE_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_STATEMENT_INVALID"]);
    const typeExports = [...source.matchAll(/export\s+(?:interface|type|class|enum)\s+([A-Za-z0-9_]+)/g)].map((match) => match[1]).sort();
    expect(typeExports).toEqual(["DecisionContextObservationProposal", "DecisionContextObservationProposalInput", "DecisionContextObservationProposalProvenance"]);
    const provenance: DecisionContextObservationProposalProvenance = humanProvenance("actor"); const observationInput: DecisionContextObservationProposalInput = input({ provenance }); const proposal: DecisionContextObservationProposal | null = null;
    expect([provenance.origin, observationInput.provenance, proposal]).toEqual(["HUMAN_INPUT", provenance, null]);
  });
});
