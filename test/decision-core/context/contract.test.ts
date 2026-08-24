import { dirname, resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import * as context from "../../../lib/decision-core/context";
import * as decisionCore from "../../../lib/decision-core";
import type {
  AuthoritativeStateReference,
  DecisionContextDraft,
  DecisionContextDraftInput,
  DecisionContextItem,
  DecisionContextItemInput
} from "../../../lib/decision-core";

type DraftCannotCarryPayload = "payload" extends keyof DecisionContextDraft ? false : true;
type DraftCannotCarryResolution = "resolution" extends keyof DecisionContextDraft ? false : true;
type DraftCannotCarryRepository = "repository" extends keyof DecisionContextDraft ? false : true;
type DraftCannotCarryResolver = "resolver" extends keyof DecisionContextDraft ? false : true;
type DraftCannotCarryRecommendation = "recommendation" extends keyof DecisionContextDraft ? false : true;
type DraftCannotCarryScore = "score" extends keyof DecisionContextDraft ? false : true;
type DraftCannotCarryRanking = "ranking" extends keyof DecisionContextDraft ? false : true;
type DraftCannotCarrySelectedOption = "selectedOption" extends keyof DecisionContextDraft ? false : true;
type DraftCannotCarryDecisionState = "decisionState" extends keyof DecisionContextDraft ? false : true;
type DraftCannotCarryAction = "action" extends keyof DecisionContextDraft ? false : true;
type DraftCannotCarryOutcome = "outcome" extends keyof DecisionContextDraft ? false : true;
type DraftCannotCarryFeedback = "feedback" extends keyof DecisionContextDraft ? false : true;
type ItemCannotCarryRecommendation = "recommendation" extends keyof DecisionContextItem ? false : true;
type ItemCannotCarryRecommendationState = "recommendationState" extends keyof DecisionContextItem ? false : true;
type ItemCannotCarryScore = "score" extends keyof DecisionContextItem ? false : true;
type ItemCannotCarryRanking = "ranking" extends keyof DecisionContextItem ? false : true;
type ItemCannotCarrySelectedOption = "selectedOption" extends keyof DecisionContextItem ? false : true;
type ItemCannotCarryDecisionState = "decisionState" extends keyof DecisionContextItem ? false : true;
type ItemCannotCarryDecisionActor = "decisionActor" extends keyof DecisionContextItem ? false : true;
type ItemCannotCarryAction = "action" extends keyof DecisionContextItem ? false : true;
type ItemCannotCarryOutcome = "outcome" extends keyof DecisionContextItem ? false : true;
type ItemCannotCarryFeedback = "feedback" extends keyof DecisionContextItem ? false : true;

const draftCannotCarryPayload: DraftCannotCarryPayload = true;
const draftCannotCarryResolution: DraftCannotCarryResolution = true;
const draftCannotCarryRepository: DraftCannotCarryRepository = true;
const draftCannotCarryResolver: DraftCannotCarryResolver = true;
const draftCannotCarryRecommendation: DraftCannotCarryRecommendation = true;
const draftCannotCarryScore: DraftCannotCarryScore = true;
const draftCannotCarryRanking: DraftCannotCarryRanking = true;
const draftCannotCarrySelectedOption: DraftCannotCarrySelectedOption = true;
const draftCannotCarryDecisionState: DraftCannotCarryDecisionState = true;
const draftCannotCarryAction: DraftCannotCarryAction = true;
const draftCannotCarryOutcome: DraftCannotCarryOutcome = true;
const draftCannotCarryFeedback: DraftCannotCarryFeedback = true;
const itemCannotCarryRecommendation: ItemCannotCarryRecommendation = true;
const itemCannotCarryRecommendationState: ItemCannotCarryRecommendationState = true;
const itemCannotCarryScore: ItemCannotCarryScore = true;
const itemCannotCarryRanking: ItemCannotCarryRanking = true;
const itemCannotCarrySelectedOption: ItemCannotCarrySelectedOption = true;
const itemCannotCarryDecisionState: ItemCannotCarryDecisionState = true;
const itemCannotCarryDecisionActor: ItemCannotCarryDecisionActor = true;
const itemCannotCarryAction: ItemCannotCarryAction = true;
const itemCannotCarryOutcome: ItemCannotCarryOutcome = true;
const itemCannotCarryFeedback: ItemCannotCarryFeedback = true;

const stateReference = (suffix = "A"): AuthoritativeStateReference => ({
  producerId: `PRODUCER_${suffix}`,
  authorityContractId: `CONTRACT_${suffix}`,
  artifactId: `ARTIFACT_${suffix}`,
  locator: `locator-${suffix}`
});

const question = (statement = "Should system X proceed?"): DecisionContextItemInput => ({
  role: "DECISION_QUESTION",
  statement,
  provenance: { origin: "HUMAN_INPUT", actorId: "human-1" }
});

const option = (statement = "Proceed with system X"): DecisionContextItemInput => ({
  role: "OPTION",
  statement,
  provenance: { origin: "MODEL_PROPOSAL", proposalRef: "proposal-1" }
});

const authoritativeObservation = (reference = stateReference()): DecisionContextItemInput => ({
  role: "OBSERVATION",
  statement: "Persisted state reports a condition.",
  provenance: { origin: "AUTHORITATIVE_STATE", stateReference: reference }
});

const input = (overrides: Partial<DecisionContextDraftInput> = {}): DecisionContextDraftInput => ({
  sourceStateReferences: [],
  items: [question()],
  ...overrides
});

const futurePhaseConcepts = ["Gap", "Contradiction", "Dependency", "Consequence", "Recommendation", "HumanDecision"];

const publicExportNamesByEntry = (entryFileNames: readonly string[], virtualFiles: Readonly<Record<string, string>> = {}): ReadonlyMap<string, string[]> => {
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Node10,
    noEmit: true,
    skipLibCheck: true
  };
  const normalizedVirtualFiles = new Map(Object.entries(virtualFiles).map(([fileName, source]) => [resolve(fileName), source]));
  const baseHost = ts.createCompilerHost(options, true);
  const host: ts.CompilerHost = {
    ...baseHost,
    fileExists(fileName) {
      return normalizedVirtualFiles.has(resolve(fileName)) || baseHost.fileExists(fileName);
    },
    readFile(fileName) {
      return normalizedVirtualFiles.get(resolve(fileName)) ?? baseHost.readFile(fileName);
    },
    getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile) {
      const source = normalizedVirtualFiles.get(resolve(fileName));
      if (source !== undefined) return ts.createSourceFile(fileName, source, languageVersion, true, ts.ScriptKind.TS);
      return baseHost.getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
    },
    resolveModuleNames(moduleNames, containingFile) {
      return moduleNames.map((moduleName) => {
        if (moduleName.startsWith(".")) {
          const candidate = resolve(dirname(containingFile), `${moduleName}.ts`);
          if (normalizedVirtualFiles.has(candidate)) {
            return { resolvedFileName: candidate, extension: ts.Extension.Ts, isExternalLibraryImport: false };
          }
        }
        return ts.resolveModuleName(moduleName, containingFile, options, baseHost).resolvedModule;
      });
    }
  };
  const program = ts.createProgram({ rootNames: [...entryFileNames], options, host });
  const checker = program.getTypeChecker();
  const namesByEntry = new Map<string, string[]>();
  for (const entryFileName of entryFileNames) {
    const sourceFile = program.getSourceFile(entryFileName);
    if (sourceFile === undefined) throw new Error(`missing export-gate source: ${entryFileName}`);
    const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
    if (moduleSymbol === undefined) throw new Error(`missing export-gate module symbol: ${entryFileName}`);

    const names = new Set<string>();
    for (const exportedSymbol of checker.getExportsOfModule(moduleSymbol)) {
      names.add(exportedSymbol.getName());
      if ((exportedSymbol.flags & ts.SymbolFlags.Alias) !== 0) {
        names.add(checker.getAliasedSymbol(exportedSymbol).getName());
      }
    }
    namesByEntry.set(entryFileName, [...names]);
  }
  return namesByEntry;
};

const publicExportNames = (entryFileName: string, virtualFiles: Readonly<Record<string, string>> = {}): string[] => {
  const exports = publicExportNamesByEntry([entryFileName], virtualFiles).get(entryFileName);
  if (exports === undefined) throw new Error(`missing export-gate result: ${entryFileName}`);
  return exports;
};

const virtualContextExportNames = (files: Readonly<Record<string, string>>, entryNames: readonly string[]): ReadonlyMap<string, string[]> => {
  const root = "/decision-core-export-gate/context";
  const virtualFiles = Object.fromEntries(Object.entries(files).map(([fileName, source]) => [resolve(root, fileName), source]));
  const entries = entryNames.map((entryName) => resolve(root, entryName));
  return publicExportNamesByEntry(entries, virtualFiles);
};

describe("Decision Context Draft structural contract", () => {
  it("builds a minimal context with only one decision question", () => {
    const draft = context.createDecisionContextDraft(input());

    expect(draft).toMatchObject({
      artifactKind: "DECISION_CONTEXT_DRAFT",
      schemaVersion: context.DECISION_CONTEXT_DRAFT_SCHEMA_VERSION,
      validationStatus: "NOT_RUN",
      decisionQuestionId: draft.items[0].itemId,
      sourceStateReferences: []
    });
    expect(draft.items).toHaveLength(1);
    expect(draft.items[0].role).toBe("DECISION_QUESTION");
  });

  it("allows zero options, objectives, and constraints", () => {
    const draft = context.createDecisionContextDraft(input());
    expect(draft.items.filter((item) => ["OPTION", "OBJECTIVE", "CONSTRAINT"].includes(item.role))).toEqual([]);
  });

  it("derives stable item and context IDs for identical semantic input", () => {
    const first = context.createDecisionContextDraft(input({ items: [question(), option()] }));
    const second = context.createDecisionContextDraft(input({ items: [question(), option()] }));

    expect(second).toEqual(first);
    expect(second.items.map((item) => item.itemId)).toEqual(first.items.map((item) => item.itemId));
  });

  it("canonicalizes item ordering into one ID and payload", () => {
    const first = context.createDecisionContextDraft(input({ items: [question(), option()] }));
    const second = context.createDecisionContextDraft(input({ items: [option(), question()] }));
    expect(second).toEqual(first);
  });

  it("canonicalizes source-state-reference ordering into one ID and payload", () => {
    const first = context.createDecisionContextDraft(input({ sourceStateReferences: [stateReference("A"), stateReference("B")] }));
    const second = context.createDecisionContextDraft(input({ sourceStateReferences: [stateReference("B"), stateReference("A")] }));
    expect(second).toEqual(first);
  });

  it("changes the question item and context identity when question text changes", () => {
    const first = context.createDecisionContextDraft(input({ items: [question("Should system X proceed?")] }));
    const second = context.createDecisionContextDraft(input({ items: [question("Should system X stop?")] }));
    expect(second.decisionQuestionId).not.toBe(first.decisionQuestionId);
    expect(second.contextId).not.toBe(first.contextId);
  });

  it("changes item identity when provenance changes", () => {
    const human = context.createDecisionContextDraft(input({ items: [question(), { role: "OBJECTIVE", statement: "Maintain availability", provenance: { origin: "HUMAN_INPUT", actorId: "human-1" } }] }));
    const model = context.createDecisionContextDraft(input({ items: [question(), { role: "OBJECTIVE", statement: "Maintain availability", provenance: { origin: "MODEL_PROPOSAL", proposalRef: "proposal-1" } }] }));
    const humanObjective = human.items.find((item) => item.role === "OBJECTIVE");
    const modelObjective = model.items.find((item) => item.role === "OBJECTIVE");
    expect(humanObjective?.itemId).not.toBe(modelObjective?.itemId);
  });

  it("keeps semantic role and provenance as independent axes", () => {
    const human = context.createDecisionContextDraft(input({ items: [question(), { role: "OBJECTIVE", statement: "Maintain availability", provenance: { origin: "HUMAN_INPUT", actorId: "human-1" } }] }));
    const model = context.createDecisionContextDraft(input({ items: [question(), { role: "OBJECTIVE", statement: "Maintain availability", provenance: { origin: "MODEL_PROPOSAL", proposalRef: "proposal-1" } }] }));
    expect(human.items.find((item) => item.role === "OBJECTIVE")?.provenance).toEqual({ origin: "HUMAN_INPUT", actorId: "human-1" });
    expect(model.items.find((item) => item.role === "OBJECTIVE")?.provenance).toEqual({ origin: "MODEL_PROPOSAL", proposalRef: "proposal-1" });
    expect(human).not.toEqual(model);
  });

  it("rejects zero or multiple decision questions", () => {
    expect(() => context.createDecisionContextDraft(input({ items: [option()] }))).toThrow("ERR_DECISION_CONTEXT_DECISION_QUESTION_COUNT");
    expect(() => context.createDecisionContextDraft(input({ items: [question(), question("A second question")] }))).toThrow("ERR_DECISION_CONTEXT_DECISION_QUESTION_COUNT");
  });

  it("rejects duplicate items and duplicate source-state references", () => {
    expect(() => context.createDecisionContextDraft(input({ items: [question(), question()] }))).toThrow("ERR_DECISION_CONTEXT_DUPLICATE_ITEM");
    expect(() => context.createDecisionContextDraft(input({ sourceStateReferences: [stateReference(), stateReference()] }))).toThrow("ERR_DECISION_CONTEXT_DUPLICATE_SOURCE_STATE_REFERENCE");
  });

  it("requires authoritative-state item provenance to reference an included source state", () => {
    expect(() => context.createDecisionContextDraft(input({ items: [question(), authoritativeObservation()] }))).toThrow("ERR_DECISION_CONTEXT_AUTHORITATIVE_REFERENCE_MISSING");
    expect(() => context.createDecisionContextDraft(input({ sourceStateReferences: [stateReference()], items: [question(), authoritativeObservation()] }))).not.toThrow();
  });

  it("stores only authoritative references, never resolved payloads or authority dependencies", () => {
    const draft = context.createDecisionContextDraft(input({ sourceStateReferences: [stateReference()], items: [question(), authoritativeObservation()] }));
    expect(draftCannotCarryPayload).toBe(true);
    expect(draftCannotCarryResolution).toBe(true);
    expect(draftCannotCarryRepository).toBe(true);
    expect(draftCannotCarryResolver).toBe(true);
    expect(draft).not.toHaveProperty("payload");
    expect(draft).not.toHaveProperty("resolution");
    expect(draft).not.toHaveProperty("repository");
    expect(draft).not.toHaveProperty("resolver");
    expect(draft.sourceStateReferences[0]).toEqual(stateReference());
  });

  it("captures descriptor values once and rejects accessor-backed context input", () => {
    const getterBackedQuestion: Record<string, unknown> = {
      role: "DECISION_QUESTION",
      provenance: { origin: "HUMAN_INPUT", actorId: "human-1" }
    };
    let statementReads = 0;
    Object.defineProperty(getterBackedQuestion, "statement", {
      enumerable: true,
      get() {
        statementReads += 1;
        return statementReads === 1 ? "Question A" : "Question B";
      }
    });

    expect(() => Reflect.apply(context.createDecisionContextDraft, undefined, [{ sourceStateReferences: [], items: [getterBackedQuestion] }])).toThrow("ERR_DECISION_CONTEXT_ITEM_INVALID");
  });

  it("rejects provenance accessors before they can alter item identity", () => {
    const provenance: Record<string, unknown> = { origin: "HUMAN_INPUT" };
    Object.defineProperty(provenance, "actorId", {
      enumerable: true,
      get() {
        return "actor-that-must-not-be-read";
      }
    });
    const item = { role: "DECISION_QUESTION", statement: "Question", provenance };

    expect(() => Reflect.apply(context.createDecisionContextDraft, undefined, [{ sourceStateReferences: [], items: [item] }])).toThrow("ERR_DECISION_CONTEXT_ITEM_INVALID");
  });

  it("uses descriptor-captured authoritative references rather than divergent Proxy reads", () => {
    const canonicalReference = stateReference();
    const divergentReference = new Proxy(canonicalReference, {
      get(target, property, receiver) {
        if (property === "artifactId") return "ARTIFACT_DIFFERENT";
        return Reflect.get(target, property, receiver);
      }
    });
    const draft = Reflect.apply(context.createDecisionContextDraft, undefined, [{
      sourceStateReferences: [divergentReference],
      items: [{
        role: "DECISION_QUESTION",
        statement: "Question",
        provenance: { origin: "AUTHORITATIVE_STATE", stateReference: divergentReference }
      }]
    }]) as DecisionContextDraft;

    expect(draft.sourceStateReferences).toEqual([canonicalReference]);
    expect(draft.items[0].provenance).toEqual({ origin: "AUTHORITATIVE_STATE", stateReference: canonicalReference });
  });

  it.each([
    ["source reference ownKeys", new Proxy(stateReference(), { ownKeys() { throw new Error("hostile ownKeys"); } }), "ERR_DECISION_CONTEXT_REFERENCE_INVALID"],
    ["item descriptor", new Proxy(question(), { getOwnPropertyDescriptor() { throw new Error("hostile descriptor"); } }), "ERR_DECISION_CONTEXT_ITEM_INVALID"]
  ])("normalizes hostile reflection failures: %s", (_name, hostileValue, errorCode) => {
    const payload = errorCode === "ERR_DECISION_CONTEXT_REFERENCE_INVALID"
      ? { sourceStateReferences: [hostileValue], items: [question()] }
      : { sourceStateReferences: [], items: [hostileValue] };
    expect(() => Reflect.apply(context.createDecisionContextDraft, undefined, [payload])).toThrow(errorCode);
  });

  it("rejects accessor-backed structural draft fields", () => {
    const draft = context.createDecisionContextDraft(input());
    Object.defineProperty(draft, "contextId", {
      enumerable: true,
      get() {
        return "DCTX_ACCESSOR";
      }
    });

    expect(() => context.assertDecisionContextDraft(draft)).toThrow("ERR_DECISION_CONTEXT_INVALID");
  });

  it("detaches source references, provenance, and statement from caller mutation", () => {
    const callerReference = stateReference();
    const callerItem: DecisionContextItemInput = {
      role: "DECISION_QUESTION",
      statement: "Original question",
      provenance: { origin: "AUTHORITATIVE_STATE", stateReference: callerReference }
    };
    const draft = context.createDecisionContextDraft({ sourceStateReferences: [callerReference], items: [callerItem] });
    callerReference.artifactId = "MUTATED_ARTIFACT";
    callerItem.statement = "Mutated question";
    if (callerItem.provenance.origin === "AUTHORITATIVE_STATE") callerItem.provenance.stateReference.locator = "mutated-locator";

    expect(draft.sourceStateReferences[0]).toEqual(stateReference());
    expect(draft.items[0].statement).toBe("Original question");
    expect(draft.items[0].provenance).toEqual({ origin: "AUTHORITATIVE_STATE", stateReference: stateReference() });
  });

  it("rejects empty statements and invalid provenance-specific identifiers", () => {
    expect(() => context.createDecisionContextDraft(input({ items: [question("  ")] }))).toThrow("ERR_DECISION_CONTEXT_ITEM_INVALID");
    expect(() => context.createDecisionContextDraft(input({ items: [question(), { role: "OBJECTIVE", statement: "Maintain availability", provenance: { origin: "HUMAN_INPUT", actorId: "  " } }] }))).toThrow("ERR_DECISION_CONTEXT_ITEM_INVALID");
    expect(() => context.createDecisionContextDraft(input({ items: [question(), { role: "ASSUMPTION", statement: "A condition holds", provenance: { origin: "MODEL_PROPOSAL", proposalRef: "  " } }] }))).toThrow("ERR_DECISION_CONTEXT_ITEM_INVALID");
    expect(() => context.createDecisionContextDraft(input({ items: [question(), { role: "ASSUMPTION", statement: "A condition holds", provenance: { origin: "DETERMINISTIC_DERIVATION", ruleId: "  " } }] }))).toThrow("ERR_DECISION_CONTEXT_ITEM_INVALID");
  });

  it("rejects tampered item IDs, context IDs, and identity-relevant content", () => {
    const draft = context.createDecisionContextDraft(input({ items: [question(), option()] }));
    const itemTampered = structuredClone(draft);
    Reflect.set(itemTampered.items[0], "itemId", "DCI_TAMPERED");
    expect(() => context.assertDecisionContextDraft(itemTampered)).toThrow("ERR_DECISION_CONTEXT_ITEM_ID_MISMATCH");
    const contextTampered = structuredClone(draft);
    Reflect.set(contextTampered, "contextId", "DCTX_TAMPERED");
    expect(() => context.assertDecisionContextDraft(contextTampered)).toThrow("ERR_DECISION_CONTEXT_ID_MISMATCH");
    const contentTampered = structuredClone(draft);
    contentTampered.items[0].statement = "Changed statement";
    expect(() => context.assertDecisionContextDraft(contentTampered)).toThrow("ERR_DECISION_CONTEXT_ITEM_ID_MISMATCH");
  });

  it("contains no recommendation, decision, action, outcome, or feedback semantics", () => {
    const draft = context.createDecisionContextDraft(input());
    expect(draftCannotCarryRecommendation).toBe(true);
    expect(draftCannotCarryScore).toBe(true);
    expect(draftCannotCarryRanking).toBe(true);
    expect(draftCannotCarrySelectedOption).toBe(true);
    expect(draftCannotCarryDecisionState).toBe(true);
    expect(draftCannotCarryAction).toBe(true);
    expect(draftCannotCarryOutcome).toBe(true);
    expect(draftCannotCarryFeedback).toBe(true);
    expect(itemCannotCarryRecommendation).toBe(true);
    expect(itemCannotCarryRecommendationState).toBe(true);
    expect(itemCannotCarryScore).toBe(true);
    expect(itemCannotCarryRanking).toBe(true);
    expect(itemCannotCarrySelectedOption).toBe(true);
    expect(itemCannotCarryDecisionState).toBe(true);
    expect(itemCannotCarryDecisionActor).toBe(true);
    expect(itemCannotCarryAction).toBe(true);
    expect(itemCannotCarryOutcome).toBe(true);
    expect(itemCannotCarryFeedback).toBe(true);
    for (const field of ["recommendation", "recommendationState", "score", "ranking", "selectedOption", "decisionState", "decisionActor", "action", "outcome", "feedback"]) {
      expect(draft).not.toHaveProperty(field);
    }
  });

  it("uses the same generic contract for cybersecurity and manufacturing contexts", () => {
    const cybersecurity = context.createDecisionContextDraft(input({ items: [question("Should service X be isolated?"), { role: "OPTION", statement: "Isolate service X", provenance: { origin: "HUMAN_INPUT", actorId: "operator-1" } }] }));
    const manufacturing = context.createDecisionContextDraft(input({ items: [question("Should line Y continue operating?"), { role: "OPTION", statement: "Continue production", provenance: { origin: "HUMAN_INPUT", actorId: "operator-2" } }] }));
    expect(cybersecurity.artifactKind).toBe(manufacturing.artifactKind);
    expect(cybersecurity.schemaVersion).toBe(manufacturing.schemaVersion);
    expect(cybersecurity.contextId).not.toBe(manufacturing.contextId);
  });

  it("does not export later-phase analysis or decision artifacts", () => {
    for (const futureArtifact of futurePhaseConcepts) {
      expect(context).not.toHaveProperty(futureArtifact);
    }
  });

  it("resolves direct, type-only, wildcard, and namespace exports through the public context barrel", () => {
    const namesByEntry = virtualContextExportNames({
      "direct.ts": "export interface Gap {}",
      "type.ts": "export type Contradiction = string;",
      "type-reexport.ts": "export type { Dependency } from './dependency';",
      "dependency.ts": "export interface Dependency {}",
      "named-reexport.ts": "export { type Consequence } from './consequence';",
      "consequence.ts": "export interface Consequence {}",
      "namespace.ts": "export * as Recommendation from './detail';",
      "detail.ts": "export interface Detail {}",
      "wildcard.ts": "export * from './human-decision';",
      "human-decision.ts": "export interface HumanDecision {}",
      "comments.ts": "// Gap Recommendation\nconst text = 'Contradiction Consequence'; export interface DecisionContextDraft {}"
    }, ["direct.ts", "type.ts", "type-reexport.ts", "named-reexport.ts", "namespace.ts", "wildcard.ts", "comments.ts"]);
    const exportsFor = (entryName: string): string[] => namesByEntry.get(resolve("/decision-core-export-gate/context", entryName)) ?? [];

    expect(exportsFor("direct.ts")).toContain("Gap");
    expect(exportsFor("type.ts")).toContain("Contradiction");
    expect(exportsFor("type-reexport.ts")).toContain("Dependency");
    expect(exportsFor("named-reexport.ts")).toContain("Consequence");
    expect(exportsFor("namespace.ts")).toContain("Recommendation");
    expect(exportsFor("wildcard.ts")).toContain("HumanDecision");
    expect(exportsFor("comments.ts").filter((name) => futurePhaseConcepts.includes(name))).toEqual([]);

    const publicContextExports = publicExportNames(resolve(process.cwd(), "lib/decision-core/context/index.ts"));
    expect(publicContextExports.filter((name) => futurePhaseConcepts.includes(name))).toEqual([]);
  });

  it("does not expose precondition-sensitive identity helpers through the public barrels", () => {
    for (const name of ["buildDecisionContextId", "buildDecisionContextItemId", "sourceStateReferenceKey", "canonicalDecisionContextProvenance"]) {
      expect(context).not.toHaveProperty(name);
      expect(decisionCore).not.toHaveProperty(name);
    }
  });
});
