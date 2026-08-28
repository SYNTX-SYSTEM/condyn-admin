import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as stateChangeClaim from "../../../lib/decision-core/state-change-claim";
import type { StateChangeClaim, StateChangeClaimInput, StateChangeClaimSource } from "../../../lib/decision-core/state-change-claim";
import * as decisionCore from "../../../lib/decision-core";
import { assertStateChangeClaim, createStateChangeClaim } from "../../../lib/decision-core";

const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []);

const humanSource = (actorId = " reporter "): StateChangeClaimSource => ({ origin: "HUMAN_INPUT", actorId });
const referenceSource = (overrides: Partial<{ producerId: string; authorityContractId: string; artifactId: string; locator: string }> = {}): StateChangeClaimSource => ({ origin: "AUTHORITATIVE_STATE", stateReference: { producerId: " producer ", authorityContractId: " contract ", artifactId: " artifact ", locator: " locator ", ...overrides } });
const input = (overrides: Partial<StateChangeClaimInput> = {}): StateChangeClaimInput => ({ source: humanSource(), stateChangeDescription: " state changed ", ...overrides });
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

describe("State Change Claim", () => {
  it("creates exact canonical HUMAN_INPUT claim state", () => {
    const supplied = input();
    const claim = createStateChangeClaim(supplied);
    expect(Object.keys(supplied).sort()).toEqual(["source", "stateChangeDescription"]);
    expect(claim).toMatchObject({ artifactKind: "STATE_CHANGE_CLAIM", schemaVersion: "STATE_CHANGE_CLAIM_V1", source: { origin: "HUMAN_INPUT", actorId: "reporter" }, stateChangeDescription: "state changed" });
    expect(claim.stateChangeClaimId).toMatch(/^DSCC_[0-9A-F]{24}$/);
    expect(Object.keys(claim).sort()).toEqual(["artifactKind", "schemaVersion", "source", "stateChangeClaimId", "stateChangeDescription"]);
    for (const field of ["beforeState", "afterState", "delta", "metric", "unit", "direction", "magnitude", "actionOccurrenceClaimId", "actionIntentId", "humanCommitmentId", "humanDecisionId", "actor", "performer", "executor", "assignee", "affectedActor", "target", "effect", "outcome", "status", "rationale", "evidence", "timestamp", "changedAt", "occurredAt", "observedAt", "recordedAt", "effectiveAt"]) expect(claim).not.toHaveProperty(field);
    supplied.stateChangeDescription = "changed later";
    (supplied.source as { actorId: string }).actorId = "changed later";
    expect(claim.stateChangeDescription).toBe("state changed");
    expect((claim.source as { actorId: string }).actorId).toBe("reporter");
  });

  it("creates exact AUTHORITATIVE_STATE claims, preserves opaque references, and detaches caller state", () => {
    const source = referenceSource();
    const supplied = input({ source });
    const claim = createStateChangeClaim(supplied);
    expect(claim.source).toEqual(source);
    expect(claim.source).toEqual({ origin: "AUTHORITATIVE_STATE", stateReference: { producerId: " producer ", authorityContractId: " contract ", artifactId: " artifact ", locator: " locator " } });
    const suppliedReference = (supplied.source as { stateReference: Record<string, string> }).stateReference;
    for (const key of ["producerId", "authorityContractId", "artifactId", "locator"] as const) suppliedReference[key] = `changed-${key}`;
    expect(claim.source).toEqual(referenceSource());
  });

  it("enforces the closed source union and exact constructor error ownership", () => {
    expect(() => createStateChangeClaim(input({ source: { origin: "MODEL_PROPOSAL", proposalRef: "model" } as never }))).toThrow("ERR_DECISION_STATE_CHANGE_CLAIM_SOURCE_INVALID");
    expect(() => createStateChangeClaim(input({ source: { origin: "DETERMINISTIC_DERIVATION", derivationRef: "derived" } as never }))).toThrow("ERR_DECISION_STATE_CHANGE_CLAIM_SOURCE_INVALID");
    expect(() => createStateChangeClaim({ source: humanSource(), stateChangeDescription: "changed", extra: true } as never)).toThrow("ERR_DECISION_STATE_CHANGE_CLAIM_INPUT_INVALID");
    expect(() => createStateChangeClaim(input({ source: humanSource(" ") }))).toThrow("ERR_DECISION_STATE_CHANGE_CLAIM_SOURCE_INVALID");
    expect(() => createStateChangeClaim(input({ source: { origin: "AUTHORITATIVE_STATE", stateReference: { producerId: "producer", authorityContractId: "contract", artifactId: "", locator: "locator" } } }))).toThrow("ERR_DECISION_STATE_CHANGE_CLAIM_REFERENCE_INVALID");
    expect(() => createStateChangeClaim(input({ stateChangeDescription: " " }))).toThrow("ERR_DECISION_STATE_CHANGE_CLAIM_DESCRIPTION_INVALID");
  });

  it("derives DSCC identity from the complete explicit canonical source tuple and opaque description", () => {
    const human = createStateChangeClaim(input());
    const humanAgain = createStateChangeClaim(input({ source: humanSource("reporter"), stateChangeDescription: "state changed" }));
    expect(humanAgain.stateChangeClaimId).toBe(human.stateChangeClaimId);
    expect(createStateChangeClaim(reorder(input()) as StateChangeClaimInput).stateChangeClaimId).toBe(human.stateChangeClaimId);
    expect(createStateChangeClaim(input({ source: humanSource("other") })).stateChangeClaimId).not.toBe(human.stateChangeClaimId);
    expect(createStateChangeClaim(input({ source: referenceSource({ producerId: "reporter", authorityContractId: "reporter", artifactId: "reporter", locator: "reporter" }) })).stateChangeClaimId).not.toBe(human.stateChangeClaimId);
    const authoritative = createStateChangeClaim(input({ source: referenceSource() }));
    const reorderedAuthoritativeInput = {
      stateChangeDescription: " state changed ",
      source: {
        stateReference: { locator: " locator ", artifactId: " artifact ", authorityContractId: " contract ", producerId: " producer " },
        origin: "AUTHORITATIVE_STATE" as const
      }
    };
    expect(createStateChangeClaim(reorderedAuthoritativeInput).stateChangeClaimId).toBe(authoritative.stateChangeClaimId);
    for (const axis of ["producerId", "authorityContractId", "artifactId", "locator"] as const) {
      expect(createStateChangeClaim(input({ source: referenceSource({ [axis]: `changed-${axis}` }) })).stateChangeClaimId).not.toBe(authoritative.stateChangeClaimId);
    }
    expect(createStateChangeClaim(input({ source: referenceSource({ locator: "locator" }) })).stateChangeClaimId).not.toBe(authoritative.stateChangeClaimId);
    expect(createStateChangeClaim(input({ source: referenceSource(), stateChangeDescription: "different state change" })).stateChangeClaimId).not.toBe(authoritative.stateChangeClaimId);
  });

  it("asserts exact canonical stored state without repair and separates stale identity", () => {
    const human = createStateChangeClaim(input());
    const authoritative = createStateChangeClaim(input({ source: referenceSource() }));
    assertStateChangeClaim(human);
    assertStateChangeClaim(authoritative);
    const stale = structuredClone(human); stale.stateChangeClaimId = "DSCC_000000000000000000000000";
    expect(() => assertStateChangeClaim(stale)).toThrow("ERR_DECISION_STATE_CHANGE_CLAIM_ID_MISMATCH");
    const untrimmedActor = structuredClone(human); (untrimmedActor.source as { actorId: string }).actorId = " reporter ";
    const untrimmedDescription = structuredClone(human); untrimmedDescription.stateChangeDescription = " state changed ";
    const malformedSource = structuredClone(human); malformedSource.source = { origin: "MODEL_PROPOSAL" } as never;
    const malformedReference = structuredClone(authoritative); (malformedReference.source as { stateReference: { locator: string } }).stateReference.locator = "";
    for (const value of [untrimmedActor, untrimmedDescription, malformedSource, malformedReference]) expect(() => assertStateChangeClaim(value)).toThrow("ERR_DECISION_STATE_CHANGE_CLAIM_INVALID");
  });

  it("assigns hostile constructor and stored representation errors to their owning boundary without executing getters", () => {
    let getterCalls = 0;
    const accessorTop = input() as unknown as Record<string, unknown>; Object.defineProperty(accessorTop, "stateChangeDescription", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "changed"; } });
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
    for (const value of [accessorTop, symbolTop, hiddenTop, extraTop, cyclicTop]) expect(() => createStateChangeClaim(value as never)).toThrow("ERR_DECISION_STATE_CHANGE_CLAIM_INPUT_INVALID");
    for (const value of [accessorSource, symbolSource, hiddenSource, extraSource]) expect(() => createStateChangeClaim(value as never)).toThrow("ERR_DECISION_STATE_CHANGE_CLAIM_SOURCE_INVALID");
    for (const value of [accessorReference, symbolReference, hiddenReference, extraReference, cyclicReference, malformedReference]) expect(() => createStateChangeClaim(value as never)).toThrow("ERR_DECISION_STATE_CHANGE_CLAIM_REFERENCE_INVALID");
    expect(() => createStateChangeClaim(input({ source: referenceSource({ locator: " " }) }))).toThrow("ERR_DECISION_STATE_CHANGE_CLAIM_REFERENCE_INVALID");
    const claim = createStateChangeClaim(input());
    const storedTopAccessor = structuredClone(claim); Object.defineProperty(storedTopAccessor, "stateChangeDescription", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "state changed"; } });
    const storedTopSymbol = structuredClone(claim) as unknown as Record<PropertyKey, unknown>; Object.defineProperty(storedTopSymbol, Symbol("hostile"), { enumerable: true, value: true });
    const storedTopHidden = structuredClone(claim) as unknown as Record<string, unknown>; Object.defineProperty(storedTopHidden, "hidden", { enumerable: false, value: true });
    const storedTopExtra = structuredClone(claim) as unknown as Record<string, unknown>; storedTopExtra.extra = true;
    const storedTopCycle = structuredClone(claim) as unknown as Record<string, unknown>; storedTopCycle.self = storedTopCycle;
    const storedSourceAccessor = structuredClone(claim); Object.defineProperty(storedSourceAccessor.source, "actorId", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "reporter"; } });
    const storedSourceSymbol = structuredClone(claim) as unknown as { source: Record<PropertyKey, unknown> }; Object.defineProperty(storedSourceSymbol.source, Symbol("hostile"), { enumerable: true, value: true });
    const storedSourceHidden = structuredClone(claim) as unknown as { source: Record<string, unknown> }; Object.defineProperty(storedSourceHidden.source, "hidden", { enumerable: false, value: true });
    const storedSourceExtra = structuredClone(claim) as unknown as { source: Record<string, unknown> }; storedSourceExtra.source.extra = true;
    const storedReferenceBase = createStateChangeClaim(input({ source: referenceSource() }));
    const storedReferenceAccessor = structuredClone(storedReferenceBase); Object.defineProperty((storedReferenceAccessor.source as unknown as { stateReference: Record<string, unknown> }).stateReference, "locator", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "locator"; } });
    const storedReferenceSymbol = structuredClone(storedReferenceBase) as unknown as { source: { stateReference: Record<PropertyKey, unknown> } }; Object.defineProperty(storedReferenceSymbol.source.stateReference, Symbol("hostile"), { enumerable: true, value: true });
    const storedReferenceHidden = structuredClone(storedReferenceBase) as unknown as { source: { stateReference: Record<string, unknown> } }; Object.defineProperty(storedReferenceHidden.source.stateReference, "hidden", { enumerable: false, value: true });
    const storedReferenceExtra = structuredClone(storedReferenceBase) as unknown as { source: { stateReference: Record<string, unknown> } }; storedReferenceExtra.source.stateReference.extra = true;
    const storedReferenceCycle = structuredClone(storedReferenceBase) as unknown as { source: { stateReference: Record<string, unknown> } }; storedReferenceCycle.source.stateReference.self = storedReferenceCycle.source.stateReference;
    for (const value of [storedTopAccessor, storedTopSymbol, storedTopHidden, storedTopExtra, storedTopCycle, storedSourceAccessor, storedSourceSymbol, storedSourceHidden, storedSourceExtra, storedReferenceAccessor, storedReferenceSymbol, storedReferenceHidden, storedReferenceExtra, storedReferenceCycle]) expect(() => assertStateChangeClaim(value)).toThrow("ERR_DECISION_STATE_CHANGE_CLAIM_INVALID");
    expect(getterCalls).toBe(0);
  });

  it("exports exactly the standalone 8C1 contract and hashes the actual complete source identity tuple", () => {
    expect(Object.keys(stateChangeClaim).sort()).toEqual(["STATE_CHANGE_CLAIM_SCHEMA_VERSION", "assertStateChangeClaim", "createStateChangeClaim"]);
    expect(Object.keys(decisionCore).filter((name) => Object.keys(stateChangeClaim).includes(name)).sort()).toEqual(Object.keys(stateChangeClaim).sort());
    const source = sourceFiles(resolve(process.cwd(), "lib/decision-core/state-change-claim")).map((file) => readFileSync(file, "utf8")).join("\n");
    const typesSource = readFileSync(resolve(process.cwd(), "lib/decision-core/state-change-claim/types.ts"), "utf8");
    expect(typesSource).toMatch(/^import type \{ AuthoritativeStateReference \} from "\.\.\/authority";$/m);
    const identity = source.match(/function claimId[\s\S]*?\n}\n\nfunction construct/)?.[0];
    if (identity === undefined) throw new Error("missing claim identity");
    const payload = stringifyArrayPayload(identity).replace(/\s+/g, "");
    expect(payload).toBe("STATE_CHANGE_CLAIM_SCHEMA_VERSION,canonicalSource(source),stateChangeDescription");
    expect(payload).not.toMatch(/(artifactId|producerId|authorityContractId|locator|sourceId|referenceId)(?!\))/);
    const canonical = source.match(/function canonicalSource[\s\S]*?\n}\n\nfunction claimId/)?.[0];
    if (canonical === undefined) throw new Error("missing canonical source identity");
    expect(canonical.replace(/\s+/g, "")).toBe('functioncanonicalSource(source:StateChangeClaimSource):readonly["HUMAN_INPUT",string]|readonly["AUTHORITATIVE_STATE",readonly[string,string,string,string]]{if(source.origin==="HUMAN_INPUT")return["HUMAN_INPUT",source.actorId];return["AUTHORITATIVE_STATE",[source.stateReference.producerId,source.stateReference.authorityContractId,source.stateReference.artifactId,source.stateReference.locator]];}functionclaimId');
    expect(source).not.toMatch(/from\s+["'][^"']*(action-occurrence-claim|human-decision|action-intent|human-commitment|proposal-coherence|recommendation-proposal|assessment-proposal|assessment-basis|assessment-request|revisions|context|persistence|lineage|validation|evidence-binding|career|matching)/i);
    expect(source).not.toMatch(/\b(actionOccurrenceClaim|humanDecision|actionIntent|humanCommitment|performedBy|actor|executor|assignee|affectedActor|target|beforeState|afterState|delta|metric|effect|outcome|consequence|causal|status|rationale|evidence|timestamp|changedAt|occurredAt|observedAt|recordedAt|effectiveAt|repository|resolver|evaluator|model|career|recruit|matching|date\.now|new date|math\.random|uuid)\b/i);
    expect([...new Set(source.match(/ERR_DECISION_STATE_CHANGE_CLAIM_[A-Z_]+/g) ?? [])].sort()).toEqual(["ERR_DECISION_STATE_CHANGE_CLAIM_DESCRIPTION_INVALID", "ERR_DECISION_STATE_CHANGE_CLAIM_ID_MISMATCH", "ERR_DECISION_STATE_CHANGE_CLAIM_INPUT_INVALID", "ERR_DECISION_STATE_CHANGE_CLAIM_INVALID", "ERR_DECISION_STATE_CHANGE_CLAIM_REFERENCE_INVALID", "ERR_DECISION_STATE_CHANGE_CLAIM_SOURCE_INVALID"]);
    const typeExports = [...source.matchAll(/export\s+(?:interface|type|class|enum)\s+([A-Za-z0-9_]+)/g)].map((match) => match[1]).sort();
    expect(typeExports).toEqual(["StateChangeClaim", "StateChangeClaimInput", "StateChangeClaimSource"]);
    const sourceValue: StateChangeClaimSource = humanSource("actor"); const inputValue: StateChangeClaimInput = { source: sourceValue, stateChangeDescription: "changed" }; const claim: StateChangeClaim | null = null;
    expect([sourceValue.origin, inputValue.stateChangeDescription, claim]).toEqual(["HUMAN_INPUT", "changed", null]);
  });
});
