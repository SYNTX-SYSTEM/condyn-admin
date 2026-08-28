import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as association from "../../../lib/decision-core/action-state-change-association";
import type {
  ActionStateChangeAssociationProposal,
  ActionStateChangeAssociationProposalInput,
  ActionStateChangeAssociationProvenance
} from "../../../lib/decision-core/action-state-change-association";
import * as decisionCore from "../../../lib/decision-core";
import {
  assertActionStateChangeAssociationProposal,
  createActionOccurrenceClaim,
  createActionStateChangeAssociationProposal,
  createStateChangeClaim
} from "../../../lib/decision-core";

const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []);
const occurrence = (actorId = " shared ", operationDescription = " same text ") => createActionOccurrenceClaim({ source: { origin: "HUMAN_INPUT", actorId }, operationDescription });
const stateChange = (actorId = " shared ", stateChangeDescription = " same text ") => createStateChangeClaim({ source: { origin: "HUMAN_INPUT", actorId }, stateChangeDescription });
const humanProvenance = (actorId = " association reporter "): ActionStateChangeAssociationProvenance => ({ origin: "HUMAN_INPUT", actorId });
const modelProvenance = (proposalRef = " proposal ref "): ActionStateChangeAssociationProvenance => ({ origin: "MODEL_PROPOSAL", proposalRef });
const authoritativeProvenance = (overrides: Partial<{ producerId: string; authorityContractId: string; artifactId: string; locator: string }> = {}): ActionStateChangeAssociationProvenance => ({ origin: "AUTHORITATIVE_STATE", stateReference: { producerId: " producer ", authorityContractId: " contract ", artifactId: " artifact ", locator: " locator ", ...overrides } });
const input = (overrides: Partial<ActionStateChangeAssociationProposalInput> = {}): ActionStateChangeAssociationProposalInput => ({ actionOccurrenceClaim: occurrence(), stateChangeClaim: stateChange(), provenance: humanProvenance(), ...overrides });
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

describe("Action-State-Change Association Proposal", () => {
  it("creates exact canonical HUMAN_INPUT provenance state and returns detached association state", () => {
    const supplied = input();
    const proposal = createActionStateChangeAssociationProposal(supplied);
    expect(Object.keys(supplied).sort()).toEqual(["actionOccurrenceClaim", "provenance", "stateChangeClaim"]);
    expect(proposal).toMatchObject({
      artifactKind: "ACTION_STATE_CHANGE_ASSOCIATION_PROPOSAL",
      schemaVersion: "ACTION_STATE_CHANGE_ASSOCIATION_PROPOSAL_V1",
      provenance: { origin: "HUMAN_INPUT", actorId: "association reporter" }
    });
    expect(proposal.actionStateChangeAssociationProposalId).toMatch(/^DASCA_[0-9A-F]{24}$/);
    expect(Object.keys(proposal).sort()).toEqual(["actionOccurrenceClaim", "actionStateChangeAssociationProposalId", "artifactKind", "provenance", "schemaVersion", "stateChangeClaim"]);
    for (const field of ["kind", "relationKind", "outcome", "effect", "consequence", "attribution", "causal", "rationale", "status", "confidence", "score", "priority", "timestamp", "createdAt", "occurredAt", "observedAt", "associatedAt", "repository"]) expect(proposal).not.toHaveProperty(field);
    (supplied.provenance as { actorId: string }).actorId = "changed";
    supplied.actionOccurrenceClaim.operationDescription = "changed";
    supplied.stateChangeClaim.stateChangeDescription = "changed";
    expect((proposal.provenance as { actorId: string }).actorId).toBe("association reporter");
    expect(proposal.actionOccurrenceClaim.operationDescription).toBe("same text");
    expect(proposal.stateChangeClaim.stateChangeDescription).toBe("same text");
  });

  it("admits MODEL_PROPOSAL and AUTHORITATIVE_STATE provenance without imposing endpoint text, actor, or source equality", () => {
    const divergent = input({
      actionOccurrenceClaim: occurrence("action actor", "operation text"),
      stateChangeClaim: stateChange("state actor", "state text"),
      provenance: modelProvenance()
    });
    const model = createActionStateChangeAssociationProposal(divergent);
    expect(model.provenance).toEqual({ origin: "MODEL_PROPOSAL", proposalRef: "proposal ref" });
    const authoritativeInput = input({ provenance: authoritativeProvenance() });
    const authoritative = createActionStateChangeAssociationProposal(authoritativeInput);
    expect(authoritative.provenance).toEqual(authoritativeInput.provenance);
    const reference = (authoritativeInput.provenance as unknown as { stateReference: Record<string, string> }).stateReference;
    for (const axis of ["producerId", "authorityContractId", "artifactId", "locator"] as const) reference[axis] = "changed-" + axis;
    expect(authoritative.provenance).toEqual(authoritativeProvenance());
    const actionHumanStateAuthoritative = createActionStateChangeAssociationProposal(input({
      actionOccurrenceClaim: createActionOccurrenceClaim({ source: { origin: "HUMAN_INPUT", actorId: "action reporter" }, operationDescription: "operation" }),
      stateChangeClaim: createStateChangeClaim({ source: { origin: "AUTHORITATIVE_STATE", stateReference: { producerId: "state producer", authorityContractId: "state contract", artifactId: "state artifact", locator: "state locator" } }, stateChangeDescription: "change" })
    }));
    expect(actionHumanStateAuthoritative.actionOccurrenceClaim.source.origin).toBe("HUMAN_INPUT");
    expect(actionHumanStateAuthoritative.stateChangeClaim.source.origin).toBe("AUTHORITATIVE_STATE");
    const actionAuthoritativeStateHuman = createActionStateChangeAssociationProposal(input({
      actionOccurrenceClaim: createActionOccurrenceClaim({ source: { origin: "AUTHORITATIVE_STATE", stateReference: { producerId: "action producer", authorityContractId: "action contract", artifactId: "action artifact", locator: "action locator" } }, operationDescription: "operation" }),
      stateChangeClaim: createStateChangeClaim({ source: { origin: "HUMAN_INPUT", actorId: "state reporter" }, stateChangeDescription: "change" })
    }));
    expect(actionAuthoritativeStateHuman.actionOccurrenceClaim.source.origin).toBe("AUTHORITATIVE_STATE");
    expect(actionAuthoritativeStateHuman.stateChangeClaim.source.origin).toBe("HUMAN_INPUT");
  });

  it("enforces closed provenance and sealed endpoint constructor ownership", () => {
    expect(() => createActionStateChangeAssociationProposal(input({ provenance: { origin: "DETERMINISTIC_DERIVATION", derivationRef: "derived" } as never }))).toThrow("ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_PROVENANCE_INVALID");
    expect(() => createActionStateChangeAssociationProposal(input({ provenance: humanProvenance(" ") }))).toThrow("ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_PROVENANCE_INVALID");
    expect(() => createActionStateChangeAssociationProposal(input({ provenance: modelProvenance(" ") }))).toThrow("ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_PROVENANCE_INVALID");
    expect(() => createActionStateChangeAssociationProposal(input({ provenance: { origin: "AUTHORITATIVE_STATE", stateReference: { producerId: "producer", authorityContractId: "contract", artifactId: "", locator: "locator" } } }))).toThrow("ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_REFERENCE_INVALID");
    expect(() => createActionStateChangeAssociationProposal({ ...input(), extra: true } as never)).toThrow("ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_INPUT_INVALID");
    const invalidAction = occurrence(); invalidAction.actionOccurrenceClaimId = "DAOC_000000000000000000000000";
    const invalidState = stateChange(); invalidState.stateChangeClaimId = "DSCC_000000000000000000000000";
    expect(() => createActionStateChangeAssociationProposal(input({ actionOccurrenceClaim: invalidAction }))).toThrow("ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_ACTION_CLAIM_INVALID");
    expect(() => createActionStateChangeAssociationProposal(input({ stateChangeClaim: invalidState }))).toThrow("ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_STATE_CHANGE_CLAIM_INVALID");
  });

  it("derives DASCA identity from ordered endpoint roles and complete canonical provenance", () => {
    const first = input();
    const proposal = createActionStateChangeAssociationProposal(first);
    const same = createActionStateChangeAssociationProposal(reorder(first) as ActionStateChangeAssociationProposalInput);
    expect(same.actionStateChangeAssociationProposalId).toBe(proposal.actionStateChangeAssociationProposalId);
    expect(createActionStateChangeAssociationProposal(input({ actionOccurrenceClaim: occurrence("other action") })).actionStateChangeAssociationProposalId).not.toBe(proposal.actionStateChangeAssociationProposalId);
    expect(createActionStateChangeAssociationProposal(input({ stateChangeClaim: stateChange("other state") })).actionStateChangeAssociationProposalId).not.toBe(proposal.actionStateChangeAssociationProposalId);
    expect(createActionStateChangeAssociationProposal(input({ provenance: humanProvenance("other reporter") })).actionStateChangeAssociationProposalId).not.toBe(proposal.actionStateChangeAssociationProposalId);
    expect(createActionStateChangeAssociationProposal(input({ provenance: modelProvenance("proposal") })).actionStateChangeAssociationProposalId).not.toBe(proposal.actionStateChangeAssociationProposalId);
    const authoritative = createActionStateChangeAssociationProposal(input({ provenance: authoritativeProvenance() }));
    const reorderedAuthoritative = {
      provenance: {
        stateReference: { locator: " locator ", artifactId: " artifact ", authorityContractId: " contract ", producerId: " producer " },
        origin: "AUTHORITATIVE_STATE" as const
      },
      stateChangeClaim: stateChange(),
      actionOccurrenceClaim: occurrence()
    };
    expect(createActionStateChangeAssociationProposal(reorderedAuthoritative).actionStateChangeAssociationProposalId).toBe(authoritative.actionStateChangeAssociationProposalId);
    for (const axis of ["producerId", "authorityContractId", "artifactId", "locator"] as const) {
      expect(createActionStateChangeAssociationProposal(input({ provenance: authoritativeProvenance({ [axis]: "changed-" + axis }) })).actionStateChangeAssociationProposalId).not.toBe(authoritative.actionStateChangeAssociationProposalId);
    }
    expect(createActionStateChangeAssociationProposal(input({ provenance: authoritativeProvenance({ locator: "locator" }) })).actionStateChangeAssociationProposalId).not.toBe(authoritative.actionStateChangeAssociationProposalId);
  });

  it("asserts exact canonical stored state without repair and separates stale identity", () => {
    const proposal = createActionStateChangeAssociationProposal(input());
    assertActionStateChangeAssociationProposal(proposal);
    const stale = structuredClone(proposal); stale.actionStateChangeAssociationProposalId = "DASCA_000000000000000000000000";
    expect(() => assertActionStateChangeAssociationProposal(stale)).toThrow("ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_ID_MISMATCH");
    const untrimmedHuman = structuredClone(proposal); (untrimmedHuman.provenance as { actorId: string }).actorId = " association reporter ";
    const model = createActionStateChangeAssociationProposal(input({ provenance: modelProvenance() }));
    const untrimmedModel = structuredClone(model); (untrimmedModel.provenance as { proposalRef: string }).proposalRef = " proposal ref ";
    const malformedProvenance = structuredClone(proposal); malformedProvenance.provenance = { origin: "DETERMINISTIC_DERIVATION" } as never;
    const malformedReference = structuredClone(createActionStateChangeAssociationProposal(input({ provenance: authoritativeProvenance() }))); ((malformedReference.provenance as { stateReference: { locator: string } }).stateReference.locator) = "";
    const staleActionClaim = structuredClone(proposal); staleActionClaim.actionOccurrenceClaim.actionOccurrenceClaimId = "DAOC_000000000000000000000000";
    const staleStateChangeClaim = structuredClone(proposal); staleStateChangeClaim.stateChangeClaim.stateChangeClaimId = "DSCC_000000000000000000000000";
    for (const value of [untrimmedHuman, untrimmedModel, malformedProvenance, malformedReference, staleActionClaim, staleStateChangeClaim]) expect(() => assertActionStateChangeAssociationProposal(value)).toThrow("ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_INVALID");
  });

  it("rejects hostile local, provenance, reference, and nested claim representations without getter execution", () => {
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
    const hostileAction = input(); Object.defineProperty(hostileAction.actionOccurrenceClaim, "operationDescription", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "operation"; } });
    const hostileState = input(); Object.defineProperty(hostileState.stateChangeClaim, "stateChangeDescription", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "state"; } });
    for (const value of [accessorTop, symbolTop, hiddenTop, extraTop]) expect(() => createActionStateChangeAssociationProposal(value as never)).toThrow("ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_INPUT_INVALID");
    for (const value of [accessorProvenance, symbolProvenance, hiddenProvenance, extraProvenance]) expect(() => createActionStateChangeAssociationProposal(value as never)).toThrow("ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_PROVENANCE_INVALID");
    for (const value of [accessorReference, symbolReference, hiddenReference, extraReference]) expect(() => createActionStateChangeAssociationProposal(value as never)).toThrow("ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_REFERENCE_INVALID");
    expect(() => createActionStateChangeAssociationProposal(hostileAction)).toThrow("ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_ACTION_CLAIM_INVALID");
    expect(() => createActionStateChangeAssociationProposal(hostileState)).toThrow("ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_STATE_CHANGE_CLAIM_INVALID");
    const proposal = createActionStateChangeAssociationProposal(input());
    const storedTopAccessor = structuredClone(proposal); Object.defineProperty(storedTopAccessor, "provenance", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return humanProvenance(); } });
    const storedProvenanceAccessor = structuredClone(proposal); Object.defineProperty(storedProvenanceAccessor.provenance, "actorId", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "reporter"; } });
    const storedReference = structuredClone(createActionStateChangeAssociationProposal(input({ provenance: authoritativeProvenance() }))); Object.defineProperty((storedReference.provenance as unknown as { stateReference: Record<string, unknown> }).stateReference, "locator", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "locator"; } });
    const storedAction = structuredClone(proposal); Object.defineProperty(storedAction.actionOccurrenceClaim, "operationDescription", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "operation"; } });
    const storedState = structuredClone(proposal); Object.defineProperty(storedState.stateChangeClaim, "stateChangeDescription", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "state"; } });
    for (const value of [storedTopAccessor, storedProvenanceAccessor, storedReference, storedAction, storedState]) expect(() => assertActionStateChangeAssociationProposal(value)).toThrow("ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_INVALID");
    expect(getterCalls).toBe(0);
  });

  it("exports exactly the standalone 8C2 proposal surface and hashes the actual complete canonical provenance tuple", () => {
    expect(Object.keys(association).sort()).toEqual(["ACTION_STATE_CHANGE_ASSOCIATION_PROPOSAL_SCHEMA_VERSION", "assertActionStateChangeAssociationProposal", "createActionStateChangeAssociationProposal"]);
    expect(Object.keys(decisionCore).filter((name) => Object.keys(association).includes(name)).sort()).toEqual(Object.keys(association).sort());
    const source = sourceFiles(resolve(process.cwd(), "lib/decision-core/action-state-change-association")).map((file) => readFileSync(file, "utf8")).join("\n");
    const typesSource = readFileSync(resolve(process.cwd(), "lib/decision-core/action-state-change-association/types.ts"), "utf8");
    expect(typesSource).toMatch(/^import type \{ AuthoritativeStateReference \} from "\.\.\/authority";$/m);
    const identity = source.match(/function associationId[\s\S]*?\n}\n\nfunction construct/)?.[0];
    if (identity === undefined) throw new Error("missing association identity");
    expect(stringifyArrayPayload(identity).replace(/\s+/g, "")).toBe("ACTION_STATE_CHANGE_ASSOCIATION_PROPOSAL_SCHEMA_VERSION,actionOccurrenceClaim.actionOccurrenceClaimId,stateChangeClaim.stateChangeClaimId,canonicalProvenance(provenance)");
    const canonical = source.match(/function canonicalProvenance[\s\S]*?\n}\n\nfunction associationId/)?.[0];
    if (canonical === undefined) throw new Error("missing provenance identity");
    expect(canonical.replace(/\s+/g, "")).toBe('functioncanonicalProvenance(provenance:ActionStateChangeAssociationProvenance):readonly["HUMAN_INPUT",string]|readonly["MODEL_PROPOSAL",string]|readonly["AUTHORITATIVE_STATE",readonly[string,string,string,string]]{if(provenance.origin==="HUMAN_INPUT")return["HUMAN_INPUT",provenance.actorId];if(provenance.origin==="MODEL_PROPOSAL")return["MODEL_PROPOSAL",provenance.proposalRef];return["AUTHORITATIVE_STATE",[provenance.stateReference.producerId,provenance.stateReference.authorityContractId,provenance.stateReference.artifactId,provenance.stateReference.locator]];}functionassociationId');
    expect(source).not.toMatch(/from\s+["'][^"']*(structural-findings|context|career|outcome|feedback|learning|persistence|repository|matching)/i);
    expect(source).not.toMatch(/\b(StructuralRelationProposal|createStructuralRelationProposal|DREL_|relationKind|outcome|effect|consequence|attribution|causal|rationale|status|confidence|score|priority|timestamp|createdAt|occurredAt|observedAt|associatedAt|resolver|evaluator|repository|persistence|date\.now|new date|math\.random|uuid)\b/i);
    expect([...new Set(source.match(/ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_[A-Z_]+/g) ?? [])].sort()).toEqual(["ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_ACTION_CLAIM_INVALID", "ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_ID_MISMATCH", "ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_INPUT_INVALID", "ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_INVALID", "ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_PROVENANCE_INVALID", "ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_REFERENCE_INVALID", "ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_STATE_CHANGE_CLAIM_INVALID"]);
    const typeExports = [...source.matchAll(/export\s+(?:interface|type|class|enum)\s+([A-Za-z0-9_]+)/g)].map((match) => match[1]).sort();
    expect(typeExports).toEqual(["ActionStateChangeAssociationProposal", "ActionStateChangeAssociationProposalInput", "ActionStateChangeAssociationProvenance"]);
    const provenance: ActionStateChangeAssociationProvenance = humanProvenance("actor"); const associationInput: ActionStateChangeAssociationProposalInput = input({ provenance }); const proposal: ActionStateChangeAssociationProposal | null = null;
    expect([provenance.origin, associationInput.provenance, proposal]).toEqual(["HUMAN_INPUT", provenance, null]);
  });
});
