import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as actionOccurrenceClaim from "../../../lib/decision-core/action-occurrence-claim";
import type { ActionOccurrenceClaim, ActionOccurrenceClaimInput, ActionOccurrenceClaimSource } from "../../../lib/decision-core/action-occurrence-claim";
import * as decisionCore from "../../../lib/decision-core";
import { assertActionOccurrenceClaim, createActionOccurrenceClaim } from "../../../lib/decision-core";

const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []);

const humanSource = (actorId = " reporter "): ActionOccurrenceClaimSource => ({ origin: "HUMAN_INPUT", actorId });
const referenceSource = (overrides: Partial<{ producerId: string; authorityContractId: string; artifactId: string; locator: string }> = {}): ActionOccurrenceClaimSource => ({ origin: "AUTHORITATIVE_STATE", stateReference: { producerId: " producer ", authorityContractId: " contract ", artifactId: " artifact ", locator: " locator ", ...overrides } });
const input = (overrides: Partial<ActionOccurrenceClaimInput> = {}): ActionOccurrenceClaimInput => ({ source: humanSource(), operationDescription: " performed operation ", ...overrides });
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

describe("Action Occurrence Claim", () => {
  it("creates exact canonical HUMAN_INPUT claim state", () => {
    const supplied = input();
    const claim = createActionOccurrenceClaim(supplied);
    expect(Object.keys(supplied).sort()).toEqual(["operationDescription", "source"]);
    expect(claim).toMatchObject({ artifactKind: "ACTION_OCCURRENCE_CLAIM", schemaVersion: "ACTION_OCCURRENCE_CLAIM_V1", source: { origin: "HUMAN_INPUT", actorId: "reporter" }, operationDescription: "performed operation" });
    expect(claim.actionOccurrenceClaimId).toMatch(/^DAOC_[0-9A-F]{24}$/);
    expect(Object.keys(claim).sort()).toEqual(["actionOccurrenceClaimId", "artifactKind", "operationDescription", "schemaVersion", "source"]);
    for (const field of ["humanDecisionDeclaration", "humanDecisionId", "actionIntent", "actionIntentId", "humanCommitment", "humanCommitmentId", "performedBy", "actor", "actionType", "targetRef", "externalRef", "status", "occurredAt", "outcome", "rationale"]) expect(claim).not.toHaveProperty(field);
  });

  it("creates AUTHORITATIVE_STATE claims with exact opaque reference values and no authority operation", () => {
    const source = referenceSource();
    const claim = createActionOccurrenceClaim(input({ source }));
    expect(claim.source).toEqual(source);
    expect(claim.source).toEqual({ origin: "AUTHORITATIVE_STATE", stateReference: { producerId: " producer ", authorityContractId: " contract ", artifactId: " artifact ", locator: " locator " } });
  });

  it("enforces the closed source union and local constructor error ownership", () => {
    expect(() => createActionOccurrenceClaim(input({ source: { origin: "MODEL_PROPOSAL", proposalRef: "model" } as never }))).toThrow("ERR_DECISION_ACTION_OCCURRENCE_CLAIM_SOURCE_INVALID");
    expect(() => createActionOccurrenceClaim(input({ source: { origin: "DETERMINISTIC_DERIVATION", derivationRef: "derived" } as never }))).toThrow("ERR_DECISION_ACTION_OCCURRENCE_CLAIM_SOURCE_INVALID");
    expect(() => createActionOccurrenceClaim(input({ source: humanSource(" ") }))).toThrow("ERR_DECISION_ACTION_OCCURRENCE_CLAIM_SOURCE_INVALID");
    expect(() => createActionOccurrenceClaim(input({ source: { origin: "AUTHORITATIVE_STATE", stateReference: { producerId: "producer", authorityContractId: "contract", artifactId: "", locator: "locator" } } }))).toThrow("ERR_DECISION_ACTION_OCCURRENCE_CLAIM_REFERENCE_INVALID");
    expect(() => createActionOccurrenceClaim(input({ operationDescription: " " }))).toThrow("ERR_DECISION_ACTION_OCCURRENCE_CLAIM_OPERATION_INVALID");
    expect(() => createActionOccurrenceClaim({ source: humanSource(), operationDescription: "operation", extra: true } as never)).toThrow("ERR_DECISION_ACTION_OCCURRENCE_CLAIM_INPUT_INVALID");
  });

  it("derives DAOC identity from the complete explicit canonical source tuple and opaque operation text", () => {
    const human = createActionOccurrenceClaim(input());
    const humanAgain = createActionOccurrenceClaim(input({ source: humanSource("reporter"), operationDescription: "performed operation" }));
    expect(humanAgain.actionOccurrenceClaimId).toBe(human.actionOccurrenceClaimId);
    expect(createActionOccurrenceClaim(reorder(input()) as ActionOccurrenceClaimInput).actionOccurrenceClaimId).toBe(human.actionOccurrenceClaimId);
    expect(createActionOccurrenceClaim(input({ source: humanSource("other") })).actionOccurrenceClaimId).not.toBe(human.actionOccurrenceClaimId);
    expect(createActionOccurrenceClaim(input({ source: referenceSource({ producerId: "reporter", authorityContractId: "reporter", artifactId: "reporter", locator: "reporter" }) })).actionOccurrenceClaimId).not.toBe(human.actionOccurrenceClaimId);
    const authoritative = createActionOccurrenceClaim(input({ source: referenceSource() }));
    const reorderedAuthoritativeInput = {
      operationDescription: " performed operation ",
      source: {
        stateReference: { locator: " locator ", artifactId: " artifact ", authorityContractId: " contract ", producerId: " producer " },
        origin: "AUTHORITATIVE_STATE" as const
      }
    };
    expect(createActionOccurrenceClaim(reorderedAuthoritativeInput).actionOccurrenceClaimId).toBe(authoritative.actionOccurrenceClaimId);
    for (const axis of ["producerId", "authorityContractId", "artifactId", "locator"] as const) {
      expect(createActionOccurrenceClaim(input({ source: referenceSource({ [axis]: `changed-${axis}` }) })).actionOccurrenceClaimId).not.toBe(authoritative.actionOccurrenceClaimId);
    }
    expect(createActionOccurrenceClaim(input({ source: referenceSource(), operationDescription: "different operation" })).actionOccurrenceClaimId).not.toBe(authoritative.actionOccurrenceClaimId);
  });

  it("asserts exact canonical stored state without repair and separates stale identity", () => {
    const human = createActionOccurrenceClaim(input());
    const authoritative = createActionOccurrenceClaim(input({ source: referenceSource() }));
    assertActionOccurrenceClaim(human);
    assertActionOccurrenceClaim(authoritative);
    const stale = structuredClone(human); stale.actionOccurrenceClaimId = "DAOC_000000000000000000000000";
    expect(() => assertActionOccurrenceClaim(stale)).toThrow("ERR_DECISION_ACTION_OCCURRENCE_CLAIM_ID_MISMATCH");
    const untrimmedActor = structuredClone(human); (untrimmedActor.source as { actorId: string }).actorId = " reporter ";
    const untrimmedOperation = structuredClone(human); untrimmedOperation.operationDescription = " performed operation ";
    const malformedSource = structuredClone(human); malformedSource.source = { origin: "MODEL_PROPOSAL" } as never;
    const malformedReference = structuredClone(authoritative); (malformedReference.source as { stateReference: { locator: string } }).stateReference.locator = "";
    for (const value of [untrimmedActor, untrimmedOperation, malformedSource, malformedReference]) expect(() => assertActionOccurrenceClaim(value)).toThrow("ERR_DECISION_ACTION_OCCURRENCE_CLAIM_INVALID");
  });

  it("assigns hostile constructor and stored representation errors to their owning boundary without executing getters", () => {
    let getterCalls = 0;
    const accessorTop = input() as unknown as Record<string, unknown>; Object.defineProperty(accessorTop, "operationDescription", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "operation"; } });
    const symbolTop = input() as unknown as Record<PropertyKey, unknown>; Object.defineProperty(symbolTop, Symbol("hostile"), { enumerable: true, value: true });
    const hiddenTop = input() as unknown as Record<string, unknown>; Object.defineProperty(hiddenTop, "hidden", { enumerable: false, value: true });
    const extraTop = input() as unknown as Record<string, unknown>; extraTop.extra = true;
    const cyclicTop = input() as unknown as Record<string, unknown>; cyclicTop.self = cyclicTop;
    const accessorSource = input() as unknown as { source: Record<string, unknown> }; Object.defineProperty(accessorSource.source, "actorId", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "reporter"; } });
    const symbolSource = input() as unknown as { source: Record<PropertyKey, unknown> }; Object.defineProperty(symbolSource.source, Symbol("hostile"), { enumerable: true, value: true });
    const hiddenSource = input() as unknown as { source: Record<string, unknown> }; Object.defineProperty(hiddenSource.source, "hidden", { enumerable: false, value: true });
    const extraSource = input() as unknown as { source: Record<string, unknown> }; extraSource.source.extra = true;
    const accessorReference = input({ source: referenceSource() }) as unknown as { source: { stateReference: Record<string, unknown> } }; Object.defineProperty(accessorReference.source.stateReference, "locator", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "locator"; } });
    const symbolReference = input({ source: referenceSource() }) as unknown as { source: { stateReference: Record<PropertyKey, unknown> } }; Object.defineProperty(symbolReference.source.stateReference, Symbol("hostile"), { enumerable: true, value: true });
    const hiddenReference = input({ source: referenceSource() }) as unknown as { source: { stateReference: Record<string, unknown> } }; Object.defineProperty(hiddenReference.source.stateReference, "hidden", { enumerable: false, value: true });
    const extraReference = input({ source: referenceSource() }) as unknown as { source: { stateReference: Record<string, unknown> } }; extraReference.source.stateReference.extra = true;
    const cyclicReference = input({ source: referenceSource() }) as unknown as { source: { stateReference: Record<string, unknown> } }; cyclicReference.source.stateReference.self = cyclicReference.source.stateReference;
    const malformedReference = input({ source: { origin: "AUTHORITATIVE_STATE", stateReference: "reference" } as never });
    for (const value of [accessorTop, symbolTop, hiddenTop, extraTop, cyclicTop]) expect(() => createActionOccurrenceClaim(value as never)).toThrow("ERR_DECISION_ACTION_OCCURRENCE_CLAIM_INPUT_INVALID");
    for (const value of [accessorSource, symbolSource, hiddenSource, extraSource]) expect(() => createActionOccurrenceClaim(value as never)).toThrow("ERR_DECISION_ACTION_OCCURRENCE_CLAIM_SOURCE_INVALID");
    for (const value of [accessorReference, symbolReference, hiddenReference, extraReference, cyclicReference, malformedReference]) expect(() => createActionOccurrenceClaim(value as never)).toThrow("ERR_DECISION_ACTION_OCCURRENCE_CLAIM_REFERENCE_INVALID");
    expect(() => createActionOccurrenceClaim(input({ source: referenceSource({ locator: " " }) }))).toThrow("ERR_DECISION_ACTION_OCCURRENCE_CLAIM_REFERENCE_INVALID");
    const supplied = input();
    const claim = createActionOccurrenceClaim(supplied);
    supplied.operationDescription = "changed";
    (supplied.source as { actorId: string }).actorId = "changed";
    expect(claim.operationDescription).toBe("performed operation");
    expect((claim.source as { actorId: string }).actorId).toBe("reporter");
    const suppliedAuthoritative = input({ source: referenceSource() });
    const authoritativeClaim = createActionOccurrenceClaim(suppliedAuthoritative);
    const suppliedReference = (suppliedAuthoritative.source as unknown as { stateReference: Record<string, string> }).stateReference;
    for (const key of ["producerId", "authorityContractId", "artifactId", "locator"] as const) suppliedReference[key] = `changed-${key}`;
    expect(authoritativeClaim.source).toEqual(referenceSource());
    const storedTopSymbol = structuredClone(claim) as unknown as Record<PropertyKey, unknown>; Object.defineProperty(storedTopSymbol, Symbol("hostile"), { enumerable: true, value: true });
    const storedTopHidden = structuredClone(claim) as unknown as Record<string, unknown>; Object.defineProperty(storedTopHidden, "hidden", { enumerable: false, value: true });
    const storedTopExtra = structuredClone(claim) as unknown as Record<string, unknown>; storedTopExtra.extra = true;
    const storedTopCycle = structuredClone(claim) as unknown as Record<string, unknown>; storedTopCycle.self = storedTopCycle;
    const storedSourceAccessor = structuredClone(claim); Object.defineProperty(storedSourceAccessor.source, "actorId", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "reporter"; } });
    const storedSourceSymbol = structuredClone(claim) as unknown as { source: Record<PropertyKey, unknown> }; Object.defineProperty(storedSourceSymbol.source, Symbol("hostile"), { enumerable: true, value: true });
    const storedSourceHidden = structuredClone(claim) as unknown as { source: Record<string, unknown> }; Object.defineProperty(storedSourceHidden.source, "hidden", { enumerable: false, value: true });
    const storedSourceExtra = structuredClone(claim) as unknown as { source: Record<string, unknown> }; storedSourceExtra.source.extra = true;
    const storedReferenceBase = createActionOccurrenceClaim(input({ source: referenceSource() }));
    const storedReferenceAccessor = structuredClone(storedReferenceBase); Object.defineProperty((storedReferenceAccessor.source as unknown as { stateReference: Record<string, unknown> }).stateReference, "locator", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "locator"; } });
    const storedReferenceSymbol = structuredClone(storedReferenceBase) as unknown as { source: { stateReference: Record<PropertyKey, unknown> } }; Object.defineProperty(storedReferenceSymbol.source.stateReference, Symbol("hostile"), { enumerable: true, value: true });
    const storedReferenceHidden = structuredClone(storedReferenceBase) as unknown as { source: { stateReference: Record<string, unknown> } }; Object.defineProperty(storedReferenceHidden.source.stateReference, "hidden", { enumerable: false, value: true });
    const storedReferenceExtra = structuredClone(storedReferenceBase) as unknown as { source: { stateReference: Record<string, unknown> } }; storedReferenceExtra.source.stateReference.extra = true;
    const storedReferenceCycle = structuredClone(storedReferenceBase) as unknown as { source: { stateReference: Record<string, unknown> } }; storedReferenceCycle.source.stateReference.self = storedReferenceCycle.source.stateReference;
    for (const value of [storedTopSymbol, storedTopHidden, storedTopExtra, storedTopCycle, storedSourceAccessor, storedSourceSymbol, storedSourceHidden, storedSourceExtra, storedReferenceAccessor, storedReferenceSymbol, storedReferenceHidden, storedReferenceExtra, storedReferenceCycle]) expect(() => assertActionOccurrenceClaim(value)).toThrow("ERR_DECISION_ACTION_OCCURRENCE_CLAIM_INVALID");
    expect(getterCalls).toBe(0);
  });

  it("exports exactly the standalone 8B contract and hashes the actual complete source identity tuple", () => {
    expect(Object.keys(actionOccurrenceClaim).sort()).toEqual(["ACTION_OCCURRENCE_CLAIM_SCHEMA_VERSION", "assertActionOccurrenceClaim", "createActionOccurrenceClaim"]);
    expect(Object.keys(decisionCore).filter((name) => Object.keys(actionOccurrenceClaim).includes(name)).sort()).toEqual(Object.keys(actionOccurrenceClaim).sort());
    const source = sourceFiles(resolve(process.cwd(), "lib/decision-core/action-occurrence-claim")).map((file) => readFileSync(file, "utf8")).join("\n");
    const typesSource = readFileSync(resolve(process.cwd(), "lib/decision-core/action-occurrence-claim/types.ts"), "utf8");
    expect(typesSource).toMatch(/^import type \{ AuthoritativeStateReference \} from "\.\.\/authority";$/m);
    const identity = source.match(/function claimId[\s\S]*?\n}\n\nfunction construct/)?.[0];
    if (identity === undefined) throw new Error("missing claim identity");
    const payload = stringifyArrayPayload(identity).replace(/\s+/g, "");
    expect(payload).toBe("ACTION_OCCURRENCE_CLAIM_SCHEMA_VERSION,canonicalSource(source),operationDescription");
    expect(payload).not.toMatch(/(artifactId|producerId|authorityContractId|locator|sourceId|referenceId)(?!\))/);
    const canonical = source.match(/function canonicalSource[\s\S]*?\n}\n\nfunction claimId/)?.[0];
    if (canonical === undefined) throw new Error("missing canonical source identity");
    expect(canonical.replace(/\s+/g, "")).toBe('functioncanonicalSource(source:ActionOccurrenceClaimSource):readonly["HUMAN_INPUT",string]|readonly["AUTHORITATIVE_STATE",readonly[string,string,string,string]]{if(source.origin==="HUMAN_INPUT")return["HUMAN_INPUT",source.actorId];return["AUTHORITATIVE_STATE",[source.stateReference.producerId,source.stateReference.authorityContractId,source.stateReference.artifactId,source.stateReference.locator]];}functionclaimId');
    expect(source).not.toMatch(/from\s+["'][^"']*(human-decision|action-intent|human-commitment|proposal-coherence|recommendation-proposal|assessment-proposal|assessment-basis|assessment-request|revisions|context|persistence|lineage|validation|evidence-binding|career|matching)/i);
    expect(source).not.toMatch(/\b(humanDecision|actionIntent|humanCommitment|performedBy|actionType|targetRef|externalRef|status|timestamp|occurredAt|execution|completion|outcome|feedback|learning|authorization|assignment|repository|resolver|evaluator|model|career|recruit|matching|date\.now|new date|math\.random|uuid)\b/i);
    expect([...new Set(source.match(/ERR_DECISION_ACTION_OCCURRENCE_CLAIM_[A-Z_]+/g) ?? [])].sort()).toEqual(["ERR_DECISION_ACTION_OCCURRENCE_CLAIM_ID_MISMATCH", "ERR_DECISION_ACTION_OCCURRENCE_CLAIM_INPUT_INVALID", "ERR_DECISION_ACTION_OCCURRENCE_CLAIM_INVALID", "ERR_DECISION_ACTION_OCCURRENCE_CLAIM_OPERATION_INVALID", "ERR_DECISION_ACTION_OCCURRENCE_CLAIM_REFERENCE_INVALID", "ERR_DECISION_ACTION_OCCURRENCE_CLAIM_SOURCE_INVALID"]);
    const typeExports = [...source.matchAll(/export\s+(?:interface|type|class|enum)\s+([A-Za-z0-9_]+)/g)].map((match) => match[1]).sort();
    expect(typeExports).toEqual(["ActionOccurrenceClaim", "ActionOccurrenceClaimInput", "ActionOccurrenceClaimSource"]);
    const sourceValue: ActionOccurrenceClaimSource = humanSource("actor"); const inputValue: ActionOccurrenceClaimInput = { source: sourceValue, operationDescription: "operation" }; const claim: ActionOccurrenceClaim | null = null;
    expect([sourceValue.origin, inputValue.operationDescription, claim]).toEqual(["HUMAN_INPUT", "operation", null]);
  });
});
