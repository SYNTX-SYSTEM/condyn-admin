import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as admission from "../../../lib/decision-core/context-observation-admission";
import type {
  DecisionContextObservationAdmissionActor,
  DecisionContextObservationAdmissionDeclaration,
  DecisionContextObservationAdmissionDeclarationInput
} from "../../../lib/decision-core/context-observation-admission";
import * as decisionCore from "../../../lib/decision-core";
import {
  assertDecisionContextObservationAdmissionDeclaration,
  createActionOccurrenceClaim,
  createActionStateChangeAssociationProposal,
  createDecisionContextObservationAdmissionDeclaration,
  createDecisionContextObservationProposal,
  createOutcomeAttributionProposal,
  createStateChangeClaim
} from "../../../lib/decision-core";

const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []);
const occurrence = (actorId = " action reporter ") => createActionOccurrenceClaim({ source: { origin: "HUMAN_INPUT", actorId }, operationDescription: " operation " });
const stateChange = (actorId = " state reporter ") => createStateChangeClaim({ source: { origin: "HUMAN_INPUT", actorId }, stateChangeDescription: " change " });
const association = () => createActionStateChangeAssociationProposal({ actionOccurrenceClaim: occurrence(), stateChangeClaim: stateChange(), provenance: { origin: "HUMAN_INPUT", actorId: " association reporter " } });
const attribution = () => createOutcomeAttributionProposal({ associationProposal: association(), provenance: { origin: "HUMAN_INPUT", actorId: " attribution reporter " } });
const observation = (overrides: Partial<Parameters<typeof createDecisionContextObservationProposal>[0]> = {}) => createDecisionContextObservationProposal({ outcomeAttributionProposal: attribution(), statement: " observation statement ", provenance: { origin: "HUMAN_INPUT", actorId: " observation reporter " }, ...overrides });
const actor = (actorId = " admission actor "): DecisionContextObservationAdmissionActor => ({ origin: "HUMAN_INPUT", actorId });
const input = (overrides: Partial<DecisionContextObservationAdmissionDeclarationInput> = {}): DecisionContextObservationAdmissionDeclarationInput => ({ decisionContextObservationProposal: observation(), admittedBy: actor(), rationale: " admission rationale ", ...overrides });
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

describe("Decision Context Observation Admission Declaration", () => {
  it("creates exact canonical positive admission state, admits null rationale, and returns detached state", () => {
    const supplied = input();
    const declaration = createDecisionContextObservationAdmissionDeclaration(supplied);
    expect(Object.keys(supplied).sort()).toEqual(["admittedBy", "decisionContextObservationProposal", "rationale"]);
    expect(declaration).toMatchObject({ artifactKind: "DECISION_CONTEXT_OBSERVATION_ADMISSION_DECLARATION", schemaVersion: "DECISION_CONTEXT_OBSERVATION_ADMISSION_DECLARATION_V1", admittedBy: { origin: "HUMAN_INPUT", actorId: "admission actor" }, rationale: "admission rationale" });
    expect(declaration.decisionContextObservationAdmissionId).toMatch(/^DCOAD_[0-9A-F]{24}$/);
    expect(Object.keys(declaration).sort()).toEqual(["admittedBy", "artifactKind", "decisionContextObservationAdmissionId", "decisionContextObservationProposal", "rationale", "schemaVersion"]);
    for (const field of ["role", "itemId", "contextId", "revisionId", "previousRevisionId", "decisionQuestionId", "sourceStateReferences", "status", "accepted", "rejected", "decision", "support", "truth", "confidence", "score", "priority", "timestamp", "reject", "defer", "ignore", "abstain", "block"]) expect(declaration).not.toHaveProperty(field);
    expect(createDecisionContextObservationAdmissionDeclaration(input({ rationale: null })).rationale).toBeNull();
    (supplied.admittedBy as { actorId: string }).actorId = "changed";
    supplied.rationale = "changed";
    supplied.decisionContextObservationProposal.statement = "changed";
    expect((declaration.admittedBy as { actorId: string }).actorId).toBe("admission actor");
    expect(declaration.rationale).toBe("admission rationale");
    expect(declaration.decisionContextObservationProposal.statement).toBe("observation statement");
  });

  it("keeps admission actor declarative and independent of predecessor actors", () => {
    const same = createDecisionContextObservationAdmissionDeclaration(input({ admittedBy: actor("observation reporter") }));
    const different = createDecisionContextObservationAdmissionDeclaration(input({ admittedBy: actor("different admission actor") }));
    expect((same.admittedBy as { actorId: string }).actorId).toBe("observation reporter");
    expect((different.admittedBy as { actorId: string }).actorId).toBe("different admission actor");
    expect(same.decisionContextObservationProposal).toBeDefined();
    expect(different.decisionContextObservationProposal).toBeDefined();
  });

  it("enforces positive-only actor, rationale, and sealed proposal constructor ownership", () => {
    expect(() => createDecisionContextObservationAdmissionDeclaration(input({ admittedBy: { origin: "MODEL_PROPOSAL", actorId: "actor" } as never }))).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_ACTOR_INVALID");
    expect(() => createDecisionContextObservationAdmissionDeclaration(input({ admittedBy: actor(" ") }))).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_ACTOR_INVALID");
    expect(() => createDecisionContextObservationAdmissionDeclaration(input({ rationale: " " }))).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_RATIONALE_INVALID");
    expect(() => createDecisionContextObservationAdmissionDeclaration({ ...input(), extra: true } as never)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_INPUT_INVALID");
    const stale = observation(); stale.decisionContextObservationProposalId = "DCOP_000000000000000000000000";
    expect(() => createDecisionContextObservationAdmissionDeclaration(input({ decisionContextObservationProposal: stale }))).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_PROPOSAL_INVALID");
  });

  it("derives deterministic DCOAD identity from sealed DCOP, declared actor, and rationale", () => {
    const first = input();
    const declaration = createDecisionContextObservationAdmissionDeclaration(first);
    const same = createDecisionContextObservationAdmissionDeclaration(reorder(first) as DecisionContextObservationAdmissionDeclarationInput);
    expect(same.decisionContextObservationAdmissionId).toBe(declaration.decisionContextObservationAdmissionId);
    expect(createDecisionContextObservationAdmissionDeclaration(input({ decisionContextObservationProposal: observation({ statement: "different observation" }) })).decisionContextObservationAdmissionId).not.toBe(declaration.decisionContextObservationAdmissionId);
    expect(createDecisionContextObservationAdmissionDeclaration(input({ admittedBy: actor("other") })).decisionContextObservationAdmissionId).not.toBe(declaration.decisionContextObservationAdmissionId);
    expect(createDecisionContextObservationAdmissionDeclaration(input({ rationale: null })).decisionContextObservationAdmissionId).not.toBe(declaration.decisionContextObservationAdmissionId);
    expect(createDecisionContextObservationAdmissionDeclaration(input({ rationale: "other rationale" })).decisionContextObservationAdmissionId).not.toBe(declaration.decisionContextObservationAdmissionId);
  });

  it("asserts exact canonical stored state without repair and separates stale outer identity", () => {
    const declaration = createDecisionContextObservationAdmissionDeclaration(input());
    assertDecisionContextObservationAdmissionDeclaration(declaration);
    const stale = structuredClone(declaration); stale.decisionContextObservationAdmissionId = "DCOAD_000000000000000000000000";
    expect(() => assertDecisionContextObservationAdmissionDeclaration(stale)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_ID_MISMATCH");
    const untrimmedActor = structuredClone(declaration); (untrimmedActor.admittedBy as { actorId: string }).actorId = " admission actor ";
    const untrimmedRationale = structuredClone(declaration); untrimmedRationale.rationale = " admission rationale ";
    const malformedActor = structuredClone(declaration); malformedActor.admittedBy = { origin: "MODEL_PROPOSAL", actorId: "actor" } as never;
    const staleNestedProposal = structuredClone(declaration); staleNestedProposal.decisionContextObservationProposal.decisionContextObservationProposalId = "DCOP_000000000000000000000000";
    for (const value of [untrimmedActor, untrimmedRationale, malformedActor, staleNestedProposal]) expect(() => assertDecisionContextObservationAdmissionDeclaration(value)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_INVALID");
  });

  it("rejects hostile top-level, actor, sealed proposal, and nested predecessor state without getter execution", () => {
    let getterCalls = 0;
    const accessorTop = input() as unknown as Record<string, unknown>; Object.defineProperty(accessorTop, "admittedBy", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return actor(); } });
    const symbolTop = input() as unknown as Record<PropertyKey, unknown>; Object.defineProperty(symbolTop, Symbol("hostile"), { enumerable: true, value: true });
    const hiddenTop = input() as unknown as Record<string, unknown>; Object.defineProperty(hiddenTop, "hidden", { enumerable: false, value: true });
    const extraTop = input() as unknown as Record<string, unknown>; extraTop.extra = true;
    const accessorActor = input() as unknown as { admittedBy: Record<string, unknown> }; Object.defineProperty(accessorActor.admittedBy, "actorId", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "actor"; } });
    const symbolActor = input() as unknown as { admittedBy: Record<PropertyKey, unknown> }; Object.defineProperty(symbolActor.admittedBy, Symbol("hostile"), { enumerable: true, value: true });
    const hiddenActor = input() as unknown as { admittedBy: Record<string, unknown> }; Object.defineProperty(hiddenActor.admittedBy, "hidden", { enumerable: false, value: true });
    const extraActor = input() as unknown as { admittedBy: Record<string, unknown> }; extraActor.admittedBy.extra = true;
    const accessorProposal = input(); Object.defineProperty(accessorProposal.decisionContextObservationProposal, "provenance", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return { origin: "HUMAN_INPUT", actorId: "reporter" }; } });
    const symbolProposal = input() as unknown as { decisionContextObservationProposal: Record<PropertyKey, unknown> }; Object.defineProperty(symbolProposal.decisionContextObservationProposal, Symbol("hostile"), { enumerable: true, value: true });
    const hiddenProposal = input() as unknown as { decisionContextObservationProposal: Record<string, unknown> }; Object.defineProperty(hiddenProposal.decisionContextObservationProposal, "hidden", { enumerable: false, value: true });
    const extraProposal = input() as unknown as { decisionContextObservationProposal: Record<string, unknown> }; extraProposal.decisionContextObservationProposal.extra = true;
    const hostileAttribution = input(); Object.defineProperty(hostileAttribution.decisionContextObservationProposal.outcomeAttributionProposal, "provenance", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return { origin: "HUMAN_INPUT", actorId: "reporter" }; } });
    const hostileAssociation = input(); Object.defineProperty(hostileAssociation.decisionContextObservationProposal.outcomeAttributionProposal.associationProposal, "provenance", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return { origin: "HUMAN_INPUT", actorId: "reporter" }; } });
    const hostileActionOccurrence = input(); Object.defineProperty(hostileActionOccurrence.decisionContextObservationProposal.outcomeAttributionProposal.associationProposal.actionOccurrenceClaim, "operationDescription", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "operation"; } });
    const hostileStateChange = input(); Object.defineProperty(hostileStateChange.decisionContextObservationProposal.outcomeAttributionProposal.associationProposal.stateChangeClaim, "stateChangeDescription", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "change"; } });
    for (const value of [accessorTop, symbolTop, hiddenTop, extraTop]) expect(() => createDecisionContextObservationAdmissionDeclaration(value as never)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_INPUT_INVALID");
    for (const value of [accessorActor, symbolActor, hiddenActor, extraActor]) expect(() => createDecisionContextObservationAdmissionDeclaration(value as never)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_ACTOR_INVALID");
    for (const value of [accessorProposal, symbolProposal, hiddenProposal, extraProposal, hostileAttribution, hostileAssociation, hostileActionOccurrence, hostileStateChange]) expect(() => createDecisionContextObservationAdmissionDeclaration(value as never)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_PROPOSAL_INVALID");
    const declaration = createDecisionContextObservationAdmissionDeclaration(input());
    const storedTopAccessor = structuredClone(declaration); Object.defineProperty(storedTopAccessor, "admittedBy", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return actor(); } });
    const storedTopSymbol = structuredClone(declaration) as unknown as Record<PropertyKey, unknown>; Object.defineProperty(storedTopSymbol, Symbol("hostile"), { enumerable: true, value: true });
    const storedTopHidden = structuredClone(declaration) as unknown as Record<string, unknown>; Object.defineProperty(storedTopHidden, "hidden", { enumerable: false, value: true });
    const storedTopExtra = structuredClone(declaration) as unknown as Record<string, unknown>; storedTopExtra.extra = true;
    const storedActorAccessor = structuredClone(declaration); Object.defineProperty(storedActorAccessor.admittedBy, "actorId", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "actor"; } });
    const storedActorSymbol = structuredClone(declaration) as unknown as { admittedBy: Record<PropertyKey, unknown> }; Object.defineProperty(storedActorSymbol.admittedBy, Symbol("hostile"), { enumerable: true, value: true });
    const storedActorHidden = structuredClone(declaration) as unknown as { admittedBy: Record<string, unknown> }; Object.defineProperty(storedActorHidden.admittedBy, "hidden", { enumerable: false, value: true });
    const storedActorExtra = structuredClone(declaration) as unknown as { admittedBy: Record<string, unknown> }; storedActorExtra.admittedBy.extra = true;
    const storedProposal = structuredClone(declaration); Object.defineProperty(storedProposal.decisionContextObservationProposal, "provenance", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return { origin: "HUMAN_INPUT", actorId: "reporter" }; } });
    const storedProposalSymbol = structuredClone(declaration) as unknown as { decisionContextObservationProposal: Record<PropertyKey, unknown> }; Object.defineProperty(storedProposalSymbol.decisionContextObservationProposal, Symbol("hostile"), { enumerable: true, value: true });
    const storedProposalHidden = structuredClone(declaration) as unknown as { decisionContextObservationProposal: Record<string, unknown> }; Object.defineProperty(storedProposalHidden.decisionContextObservationProposal, "hidden", { enumerable: false, value: true });
    const storedProposalExtra = structuredClone(declaration) as unknown as { decisionContextObservationProposal: Record<string, unknown> }; storedProposalExtra.decisionContextObservationProposal.extra = true;
    const storedAttribution = structuredClone(declaration); Object.defineProperty(storedAttribution.decisionContextObservationProposal.outcomeAttributionProposal, "provenance", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return { origin: "HUMAN_INPUT", actorId: "reporter" }; } });
    const storedAssociation = structuredClone(declaration); Object.defineProperty(storedAssociation.decisionContextObservationProposal.outcomeAttributionProposal.associationProposal, "provenance", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return { origin: "HUMAN_INPUT", actorId: "reporter" }; } });
    const storedActionOccurrence = structuredClone(declaration); Object.defineProperty(storedActionOccurrence.decisionContextObservationProposal.outcomeAttributionProposal.associationProposal.actionOccurrenceClaim, "operationDescription", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "operation"; } });
    const storedStateChange = structuredClone(declaration); Object.defineProperty(storedStateChange.decisionContextObservationProposal.outcomeAttributionProposal.associationProposal.stateChangeClaim, "stateChangeDescription", { enumerable: true, configurable: true, get: () => { getterCalls += 1; return "change"; } });
    for (const value of [storedTopAccessor, storedTopSymbol, storedTopHidden, storedTopExtra, storedActorAccessor, storedActorSymbol, storedActorHidden, storedActorExtra, storedProposal, storedProposalSymbol, storedProposalHidden, storedProposalExtra, storedAttribution, storedAssociation, storedActionOccurrence, storedStateChange]) expect(() => assertDecisionContextObservationAdmissionDeclaration(value as never)).toThrow("ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_INVALID");
    expect(getterCalls).toBe(0);
  });

  it("exports only the standalone 8D2 surface and hashes the actual sealed-proposal identity tuple", () => {
    expect(Object.keys(admission).sort()).toEqual(["DECISION_CONTEXT_OBSERVATION_ADMISSION_DECLARATION_SCHEMA_VERSION", "assertDecisionContextObservationAdmissionDeclaration", "createDecisionContextObservationAdmissionDeclaration"]);
    expect(Object.keys(decisionCore).filter((name) => Object.keys(admission).includes(name)).sort()).toEqual(Object.keys(admission).sort());
    const source = sourceFiles(resolve(process.cwd(), "lib/decision-core/context-observation-admission")).map((file) => readFileSync(file, "utf8")).join("\n");
    const identity = source.match(/function admissionId[\s\S]*?\n}\n\nfunction construct/)?.[0];
    if (identity === undefined) throw new Error("missing admission identity");
    expect(stringifyArrayPayload(identity).replace(/\s+/g, "")).toBe('DECISION_CONTEXT_OBSERVATION_ADMISSION_DECLARATION_SCHEMA_VERSION,decisionContextObservationProposal.decisionContextObservationProposalId,["HUMAN_INPUT",admittedBy.actorId],rationale');
    expect(source).not.toMatch(/from\s+["'][^"']*(context\/|revisions|revision-|career|feedback|learning|persistence|repository|matching)/i);
    expect(source).not.toMatch(/\b(DecisionContextItem|DecisionContextDraft|DecisionContextRevision|createDecisionContextDraft|assertDecisionContextDraft|buildDecisionContextItemId|createDecisionContextRevision|assertDecisionContextRevision|assembleDecisionContextValidation|sourceStateReferences|FeedbackRecord|FeedbackClaim|FeedbackProposal|LearningProposal|EvaluationState|AttributionRecord|OutcomeRecord|support|truth|causation|timestamp|createdAt|occurredAt|observedAt|effectiveAt|resolver|repository|persister|date\.now|new date|math\.random|uuid)\b/i);
    expect([...new Set(source.match(/ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_[A-Z_]+/g) ?? [])].sort()).toEqual(["ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_ACTOR_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_ID_MISMATCH", "ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_INPUT_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_PROPOSAL_INVALID", "ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_RATIONALE_INVALID"]);
    const typeExports = [...source.matchAll(/export\s+(?:interface|type|class|enum)\s+([A-Za-z0-9_]+)/g)].map((match) => match[1]).sort();
    expect(typeExports).toEqual(["DecisionContextObservationAdmissionActor", "DecisionContextObservationAdmissionDeclaration", "DecisionContextObservationAdmissionDeclarationInput"]);
    const admittedBy: DecisionContextObservationAdmissionActor = actor("actor"); const admissionInput: DecisionContextObservationAdmissionDeclarationInput = input({ admittedBy }); const declaration: DecisionContextObservationAdmissionDeclaration | null = null;
    expect([admittedBy.origin, admissionInput.admittedBy, declaration]).toEqual(["HUMAN_INPUT", admittedBy, null]);
  });
});
