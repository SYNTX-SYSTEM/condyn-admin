import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as attribution from "../../../lib/decision-core/outcome-attribution-proposal";
import type {
  OutcomeAttributionProposal,
  OutcomeAttributionProposalInput,
  OutcomeAttributionProvenance
} from "../../../lib/decision-core/outcome-attribution-proposal";
import * as decisionCore from "../../../lib/decision-core";
import {
  assertOutcomeAttributionProposal,
  createActionOccurrenceClaim,
  createActionStateChangeAssociationProposal,
  createOutcomeAttributionProposal,
  createStateChangeClaim
} from "../../../lib/decision-core";

const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []);
const occurrence = (actorId = " action reporter ") => createActionOccurrenceClaim({ source: { origin: "HUMAN_INPUT", actorId }, operationDescription: " operation " });
const stateChange = (actorId = " state reporter ") => createStateChangeClaim({ source: { origin: "HUMAN_INPUT", actorId }, stateChangeDescription: " change " });
const association = (overrides: Partial<Parameters<typeof createActionStateChangeAssociationProposal>[0]> = {}) => createActionStateChangeAssociationProposal({ actionOccurrenceClaim: occurrence(), stateChangeClaim: stateChange(), provenance: { origin: "HUMAN_INPUT", actorId: " association reporter " }, ...overrides });
const humanProvenance = (actorId = " attribution reporter "): OutcomeAttributionProvenance => ({ origin: "HUMAN_INPUT", actorId });
const modelProvenance = (proposalRef = " attribution proposal "): OutcomeAttributionProvenance => ({ origin: "MODEL_PROPOSAL", proposalRef });
const authoritativeProvenance = (overrides: Partial<{ producerId: string; authorityContractId: string; artifactId: string; locator: string }> = {}): OutcomeAttributionProvenance => ({ origin: "AUTHORITATIVE_STATE", stateReference: { producerId: " producer ", authorityContractId: " contract ", artifactId: " artifact ", locator: " locator ", ...overrides } });
const input = (overrides: Partial<OutcomeAttributionProposalInput> = {}): OutcomeAttributionProposalInput => ({ associationProposal: association(), provenance: humanProvenance(), ...overrides });
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

describe("Outcome Attribution Proposal", () => {
  it("creates exact canonical HUMAN_INPUT provenance state and returns detached attribution state", () => {
    const supplied = input();
    const proposal = createOutcomeAttributionProposal(supplied);
    expect(Object.keys(supplied).sort()).toEqual(["associationProposal", "provenance"]);
    expect(proposal).toMatchObject({ artifactKind: "OUTCOME_ATTRIBUTION_PROPOSAL", schemaVersion: "OUTCOME_ATTRIBUTION_PROPOSAL_V1", provenance: { origin: "HUMAN_INPUT", actorId: "attribution reporter" } });
    expect(proposal.outcomeAttributionProposalId).toMatch(/^DOATP_[0-9A-F]{24}$/);
    expect(Object.keys(proposal).sort()).toEqual(["artifactKind", "associationProposal", "outcomeAttributionProposalId", "provenance", "schemaVersion"]);
    for (const field of ["actionOccurrenceClaim", "stateChangeClaim", "outcomeState", "effect", "consequence", "rationale", "status", "confidence", "score", "priority", "evaluation", "evidence", "timestamp", "createdAt", "occurredAt", "observedAt", "attributedAt", "repository"]) expect(proposal).not.toHaveProperty(field);
    (supplied.provenance as { actorId: string }).actorId = "changed";
    supplied.associationProposal.provenance = { origin: "MODEL_PROPOSAL", proposalRef: "changed" };
    expect((proposal.provenance as { actorId: string }).actorId).toBe("attribution reporter");
    expect(proposal.associationProposal.provenance).toEqual({ origin: "HUMAN_INPUT", actorId: "association reporter" });
  });

  it("admits MODEL_PROPOSAL and AUTHORITATIVE_STATE provenance without source equality requirements", () => {
    const model = createOutcomeAttributionProposal(input({ associationProposal: association({ provenance: { origin: "MODEL_PROPOSAL", proposalRef: "association model" } }), provenance: modelProvenance() }));
    expect(model.provenance).toEqual({ origin: "MODEL_PROPOSAL", proposalRef: "attribution proposal" });
    const authoritativeInput = input({ provenance: authoritativeProvenance() });
    const authoritative = createOutcomeAttributionProposal(authoritativeInput);
    expect(authoritative.provenance).toEqual(authoritativeInput.provenance);
    const reference = (authoritativeInput.provenance as unknown as { stateReference: Record<string, string> }).stateReference;
    for (const axis of ["producerId", "authorityContractId", "artifactId", "locator"] as const) reference[axis] = "changed-" + axis;
    expect(authoritative.provenance).toEqual(authoritativeProvenance());
    const sameHuman = createOutcomeAttributionProposal(input({ associationProposal: association({ provenance: { origin: "HUMAN_INPUT", actorId: "same" } }), provenance: humanProvenance("same") }));
    const differentHuman = createOutcomeAttributionProposal(input({ associationProposal: association({ provenance: { origin: "HUMAN_INPUT", actorId: "association source" } }), provenance: humanProvenance("attribution source") }));
    expect(sameHuman.provenance).toEqual({ origin: "HUMAN_INPUT", actorId: "same" });
    expect(differentHuman.provenance).toEqual({ origin: "HUMAN_INPUT", actorId: "attribution source" });
  });

  it("enforces closed provenance and sealed association constructor ownership", () => {
    expect(() => createOutcomeAttributionProposal(input({ provenance: { origin: "DETERMINISTIC_DERIVATION", derivationRef: "derived" } as never }))).toThrow("ERR_DECISION_OUTCOME_ATTRIBUTION_PROVENANCE_INVALID");
    expect(() => createOutcomeAttributionProposal(input({ provenance: humanProvenance(" ") }))).toThrow("ERR_DECISION_OUTCOME_ATTRIBUTION_PROVENANCE_INVALID");
    expect(() => createOutcomeAttributionProposal(input({ provenance: modelProvenance(" ") }))).toThrow("ERR_DECISION_OUTCOME_ATTRIBUTION_PROVENANCE_INVALID");
    expect(() => createOutcomeAttributionProposal(input({ provenance: { origin: "AUTHORITATIVE_STATE", stateReference: { producerId: "producer", authorityContractId: "contract", artifactId: "", locator: "locator" } } }))).toThrow("ERR_DECISION_OUTCOME_ATTRIBUTION_REFERENCE_INVALID");
    expect(() => createOutcomeAttributionProposal({ ...input(), extra: true } as never)).toThrow("ERR_DECISION_OUTCOME_ATTRIBUTION_INPUT_INVALID");
    const staleAssociation = association(); staleAssociation.actionStateChangeAssociationProposalId = "DASCA_000000000000000000000000";
    expect(() => createOutcomeAttributionProposal(input({ associationProposal: staleAssociation }))).toThrow("ERR_DECISION_OUTCOME_ATTRIBUTION_ASSOCIATION_PROPOSAL_INVALID");
  });

  it("derives deterministic DOATP identity from sealed association identity and complete canonical provenance", () => {
    const first = input();
    const proposal = createOutcomeAttributionProposal(first);
    const same = createOutcomeAttributionProposal(reorder(first) as OutcomeAttributionProposalInput);
    expect(same.outcomeAttributionProposalId).toBe(proposal.outcomeAttributionProposalId);
    const changedAssociation = createOutcomeAttributionProposal(input({ associationProposal: association({ actionOccurrenceClaim: occurrence("other") }) }));
    expect(changedAssociation.outcomeAttributionProposalId).not.toBe(proposal.outcomeAttributionProposalId);
    expect(createOutcomeAttributionProposal(input({ provenance: humanProvenance("other") })).outcomeAttributionProposalId).not.toBe(proposal.outcomeAttributionProposalId);
    expect(createOutcomeAttributionProposal(input({ provenance: modelProvenance() })).outcomeAttributionProposalId).not.toBe(proposal.outcomeAttributionProposalId);
    const authoritative = createOutcomeAttributionProposal(input({ provenance: authoritativeProvenance() }));
    const reorderedAuthoritative = { provenance: { stateReference: { locator: " locator ", artifactId: " artifact ", authorityContractId: " contract ", producerId: " producer " }, origin: "AUTHORITATIVE_STATE" as const }, associationProposal: association() };
    expect(createOutcomeAttributionProposal(reorderedAuthoritative).outcomeAttributionProposalId).toBe(authoritative.outcomeAttributionProposalId);
    for (const axis of ["producerId", "authorityContractId", "artifactId", "locator"] as const) expect(createOutcomeAttributionProposal(input({ provenance: authoritativeProvenance({ [axis]: "changed-" + axis }) })).outcomeAttributionProposalId).not.toBe(authoritative.outcomeAttributionProposalId);
    expect(createOutcomeAttributionProposal(input({ provenance: authoritativeProvenance({ locator: "locator" }) })).outcomeAttributionProposalId).not.toBe(authoritative.outcomeAttributionProposalId);
  });

  it("asserts exact canonical stored state without repair and separates stale outer identity", () => {
    const proposal = createOutcomeAttributionProposal(input());
    assertOutcomeAttributionProposal(proposal);
    const stale = structuredClone(proposal); stale.outcomeAttributionProposalId = "DOATP_000000000000000000000000";
    expect(() => assertOutcomeAttributionProposal(stale)).toThrow("ERR_DECISION_OUTCOME_ATTRIBUTION_ID_MISMATCH");
    const untrimmedHuman = structuredClone(proposal); (untrimmedHuman.provenance as { actorId: string }).actorId = " attribution reporter ";
    const model = createOutcomeAttributionProposal(input({ provenance: modelProvenance() }));
    const untrimmedModel = structuredClone(model); (untrimmedModel.provenance as { proposalRef: string }).proposalRef = " attribution proposal ";
    const malformedProvenance = structuredClone(proposal); malformedProvenance.provenance = { origin: "DETERMINISTIC_DERIVATION" } as never;
    const malformedReference = structuredClone(createOutcomeAttributionProposal(input({ provenance: authoritativeProvenance() }))); ((malformedReference.provenance as { stateReference: { locator: string } }).stateReference.locator) = "";
    const staleNestedAssociation = structuredClone(proposal); staleNestedAssociation.associationProposal.actionStateChangeAssociationProposalId = "DASCA_000000000000000000000000";
    for (const value of [untrimmedHuman, untrimmedModel, malformedProvenance, malformedReference, staleNestedAssociation]) expect(() => assertOutcomeAttributionProposal(value)).toThrow("ERR_DECISION_OUTCOME_ATTRIBUTION_INVALID");
  });

  it("rejects hostile top-level, provenance, reference, and association state without getter execution", () => {
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
    const accessorAssociation = input(); Object.defineProperty(accessorAssociation.associationProposal, "provenance", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return humanProvenance(); } });
    const symbolAssociation = input() as unknown as { associationProposal: Record<PropertyKey, unknown> }; Object.defineProperty(symbolAssociation.associationProposal, Symbol("hostile"), { enumerable: true, value: true });
    const hiddenAssociation = input() as unknown as { associationProposal: Record<string, unknown> }; Object.defineProperty(hiddenAssociation.associationProposal, "hidden", { enumerable: false, value: true });
    const extraAssociation = input() as unknown as { associationProposal: Record<string, unknown> }; extraAssociation.associationProposal.extra = true;
    const hostileActionClaim = input(); Object.defineProperty(hostileActionClaim.associationProposal.actionOccurrenceClaim, "operationDescription", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "operation"; } });
    const hostileStateChangeClaim = input(); Object.defineProperty(hostileStateChangeClaim.associationProposal.stateChangeClaim, "stateChangeDescription", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "change"; } });
    for (const value of [accessorTop, symbolTop, hiddenTop, extraTop]) expect(() => createOutcomeAttributionProposal(value as never)).toThrow("ERR_DECISION_OUTCOME_ATTRIBUTION_INPUT_INVALID");
    for (const value of [accessorProvenance, symbolProvenance, hiddenProvenance, extraProvenance]) expect(() => createOutcomeAttributionProposal(value as never)).toThrow("ERR_DECISION_OUTCOME_ATTRIBUTION_PROVENANCE_INVALID");
    for (const value of [accessorReference, symbolReference, hiddenReference, extraReference]) expect(() => createOutcomeAttributionProposal(value as never)).toThrow("ERR_DECISION_OUTCOME_ATTRIBUTION_REFERENCE_INVALID");
    for (const value of [accessorAssociation, symbolAssociation, hiddenAssociation, extraAssociation, hostileActionClaim, hostileStateChangeClaim]) expect(() => createOutcomeAttributionProposal(value as never)).toThrow("ERR_DECISION_OUTCOME_ATTRIBUTION_ASSOCIATION_PROPOSAL_INVALID");
    const proposal = createOutcomeAttributionProposal(input());
    const storedTopAccessor = structuredClone(proposal); Object.defineProperty(storedTopAccessor, "provenance", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return humanProvenance(); } });
    const storedProvenanceAccessor = structuredClone(proposal); Object.defineProperty(storedProvenanceAccessor.provenance, "actorId", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "reporter"; } });
    const storedReference = structuredClone(createOutcomeAttributionProposal(input({ provenance: authoritativeProvenance() }))); Object.defineProperty((storedReference.provenance as unknown as { stateReference: Record<string, unknown> }).stateReference, "locator", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "locator"; } });
    const storedAssociationAccessor = structuredClone(proposal); Object.defineProperty(storedAssociationAccessor.associationProposal, "provenance", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return humanProvenance(); } });
    const storedAssociationSymbol = structuredClone(proposal) as unknown as { associationProposal: Record<PropertyKey, unknown> }; Object.defineProperty(storedAssociationSymbol.associationProposal, Symbol("hostile"), { enumerable: true, value: true });
    const storedAssociationHidden = structuredClone(proposal) as unknown as { associationProposal: Record<string, unknown> }; Object.defineProperty(storedAssociationHidden.associationProposal, "hidden", { enumerable: false, value: true });
    const storedAssociationExtra = structuredClone(proposal) as unknown as { associationProposal: Record<string, unknown> }; storedAssociationExtra.associationProposal.extra = true;
    const storedHostileActionClaim = structuredClone(proposal); Object.defineProperty(storedHostileActionClaim.associationProposal.actionOccurrenceClaim, "operationDescription", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "operation"; } });
    const storedHostileStateChangeClaim = structuredClone(proposal); Object.defineProperty(storedHostileStateChangeClaim.associationProposal.stateChangeClaim, "stateChangeDescription", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "change"; } });
    for (const value of [storedTopAccessor, storedProvenanceAccessor, storedReference, storedAssociationAccessor, storedAssociationSymbol, storedAssociationHidden, storedAssociationExtra, storedHostileActionClaim, storedHostileStateChangeClaim]) expect(() => assertOutcomeAttributionProposal(value)).toThrow("ERR_DECISION_OUTCOME_ATTRIBUTION_INVALID");
    expect(getterCalls).toBe(0);
  });

  it("exports exactly the standalone 8C3 proposal surface and hashes the actual complete canonical provenance tuple", () => {
    expect(Object.keys(attribution).sort()).toEqual(["OUTCOME_ATTRIBUTION_PROPOSAL_SCHEMA_VERSION", "assertOutcomeAttributionProposal", "createOutcomeAttributionProposal"]);
    expect(Object.keys(decisionCore).filter((name) => Object.keys(attribution).includes(name)).sort()).toEqual(Object.keys(attribution).sort());
    const source = sourceFiles(resolve(process.cwd(), "lib/decision-core/outcome-attribution-proposal")).map((file) => readFileSync(file, "utf8")).join("\n");
    const typesSource = readFileSync(resolve(process.cwd(), "lib/decision-core/outcome-attribution-proposal/types.ts"), "utf8");
    expect(typesSource).toMatch(/^import type \{ AuthoritativeStateReference \} from "\.\.\/authority";$/m);
    const identity = source.match(/function attributionId[\s\S]*?\n}\n\nfunction construct/)?.[0];
    if (identity === undefined) throw new Error("missing attribution identity");
    expect(stringifyArrayPayload(identity).replace(/\s+/g, "")).toBe("OUTCOME_ATTRIBUTION_PROPOSAL_SCHEMA_VERSION,associationProposal.actionStateChangeAssociationProposalId,canonicalProvenance(provenance)");
    const canonical = source.match(/function canonicalProvenance[\s\S]*?\n}\n\nfunction attributionId/)?.[0];
    if (canonical === undefined) throw new Error("missing provenance identity");
    expect(canonical.replace(/\s+/g, "")).toBe('functioncanonicalProvenance(provenance:OutcomeAttributionProvenance):readonly["HUMAN_INPUT",string]|readonly["MODEL_PROPOSAL",string]|readonly["AUTHORITATIVE_STATE",readonly[string,string,string,string]]{if(provenance.origin==="HUMAN_INPUT")return["HUMAN_INPUT",provenance.actorId];if(provenance.origin==="MODEL_PROPOSAL")return["MODEL_PROPOSAL",provenance.proposalRef];return["AUTHORITATIVE_STATE",[provenance.stateReference.producerId,provenance.stateReference.authorityContractId,provenance.stateReference.artifactId,provenance.stateReference.locator]];}functionattributionId');
    expect(source).not.toMatch(/from\s+["'][^"']*(structural-findings|context|career|outcome\.ts|feedback|learning|persistence|repository|matching)/i);
    expect(source).not.toMatch(/\b(StructuralRelationProposal|createStructuralRelationProposal|DREL_|OutcomeRecord|OutcomeState|FeedbackRecord|AttributionRecord|AttributionType|ASSOCIATED_WITH|SUPPORTS|CONTRADICTS|CAUSAL_CLAIM|outcomeState|effect|consequence|rationale|status|confidence|score|priority|evaluation|evidence|timestamp|createdAt|occurredAt|observedAt|attributedAt|resolver|evaluator|repository|persistence|date\.now|new date|math\.random|uuid|causation|causalClaim|causalSupport|resultedFrom)\b/i);
    expect([...new Set(source.match(/ERR_DECISION_OUTCOME_ATTRIBUTION_[A-Z_]+/g) ?? [])].sort()).toEqual(["ERR_DECISION_OUTCOME_ATTRIBUTION_ASSOCIATION_PROPOSAL_INVALID", "ERR_DECISION_OUTCOME_ATTRIBUTION_ID_MISMATCH", "ERR_DECISION_OUTCOME_ATTRIBUTION_INPUT_INVALID", "ERR_DECISION_OUTCOME_ATTRIBUTION_INVALID", "ERR_DECISION_OUTCOME_ATTRIBUTION_PROVENANCE_INVALID", "ERR_DECISION_OUTCOME_ATTRIBUTION_REFERENCE_INVALID"]);
    const typeExports = [...source.matchAll(/export\s+(?:interface|type|class|enum)\s+([A-Za-z0-9_]+)/g)].map((match) => match[1]).sort();
    expect(typeExports).toEqual(["OutcomeAttributionProposal", "OutcomeAttributionProposalInput", "OutcomeAttributionProvenance"]);
    const provenance: OutcomeAttributionProvenance = humanProvenance("actor"); const attributionInput: OutcomeAttributionProposalInput = input({ provenance }); const proposal: OutcomeAttributionProposal | null = null;
    expect([provenance.origin, attributionInput.provenance, proposal]).toEqual(["HUMAN_INPUT", provenance, null]);
  });
});
