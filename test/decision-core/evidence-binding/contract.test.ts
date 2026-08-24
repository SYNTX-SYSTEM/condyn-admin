import { readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import {
  createBoundSemanticEvidenceBinder,
  createDecisionContextDraft,
  type AuthoritativeStateReference,
  type BoundAuthoritativeStateReader,
  type DecisionContextDraft,
  type SemanticEvidenceBindingEvaluator,
  type SemanticEvidenceBindingProposal
} from "../../../lib/decision-core";

const reference = (suffix: string): AuthoritativeStateReference => ({
  producerId: `PRODUCER_${suffix}`,
  authorityContractId: `CONTRACT_${suffix}`,
  artifactId: `ARTIFACT_${suffix}`,
  locator: `locator-${suffix}`
});

const contextWith = (references: AuthoritativeStateReference[] = [reference("A")]): DecisionContextDraft => createDecisionContextDraft({
  sourceStateReferences: references,
  items: [
    {
      role: "DECISION_QUESTION",
      statement: "Should the system proceed?",
      provenance: { origin: "HUMAN_INPUT", actorId: "human-1" }
    },
    {
      role: "OBSERVATION",
      statement: "Service X remains reachable.",
      provenance: { origin: "MODEL_PROPOSAL", proposalRef: "proposal-1" }
    },
    {
      role: "OBSERVATION",
      statement: "The producer reported Service X reachable.",
      provenance: { origin: "AUTHORITATIVE_STATE", stateReference: reference("A") }
    }
  ]
});

const matchingReader = (
  onResolve: (requested: AuthoritativeStateReference) => unknown = (requested) => ({ opaque: requested.artifactId })
): BoundAuthoritativeStateReader => ({
  async resolve(requested) {
    return { reference: structuredClone(requested), payload: onResolve(requested) };
  }
});

const noBindingsEvaluator = (): SemanticEvidenceBindingEvaluator => ({
  async evaluate() {
    return [];
  }
});

const evaluationFor = (
  itemId: string,
  stateReference: AuthoritativeStateReference,
  disposition: "SUPPORTED" | "PARTIALLY_SUPPORTED" | "NOT_SUPPORTED" | "CONTRADICTED",
  rationale = "The evaluated state has the stated semantic relationship."
) => ({ itemId, stateReference, disposition, rationale });

const forbiddenBindingExports = ["Gap", "Contradiction", "Dependency", "Consequence", "Recommendation", "Score", "Ranking", "HumanDecision", "Action", "Outcome", "Feedback"];

const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
  entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []
);

const moduleSpecifiers = (source: string): string[] => {
  const sourceFile = ts.createSourceFile("evidence-binding.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const specifiers: string[] = [];
  const add = (value: ts.Expression | undefined) => {
    if (value !== undefined && ts.isStringLiteralLike(value)) specifiers.push(value.text);
  };
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) add(node.moduleSpecifier);
    else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) add(node.moduleReference.expression);
    else if (ts.isCallExpression(node)) {
      const isDynamicImport = node.expression.kind === ts.SyntaxKind.ImportKeyword;
      const isRequire = ts.isIdentifier(node.expression) && node.expression.text === "require";
      if ((isDynamicImport || isRequire) && node.arguments.length === 1) add(node.arguments[0]);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return specifiers;
};

const isForbiddenImport = (specifier: string): boolean => ["career", "capability-core", "matching", "recommendation", "recommendations", "career/decisions", "decision-looper"].some((term) => specifier.toLowerCase().includes(term));

const publicExportNames = (entryFileName: string): string[] => {
  const program = ts.createProgram({
    rootNames: [entryFileName],
    options: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Node10, noEmit: true, skipLibCheck: true }
  });
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(entryFileName);
  if (source === undefined) throw new Error("missing evidence-binding public entry");
  const symbol = checker.getSymbolAtLocation(source);
  if (symbol === undefined) throw new Error("missing evidence-binding module symbol");
  const names = new Set<string>();
  for (const exported of checker.getExportsOfModule(symbol)) {
    names.add(exported.getName());
    if ((exported.flags & ts.SymbolFlags.Alias) !== 0) names.add(checker.getAliasedSymbol(exported).getName());
  }
  return [...names];
};

describe("Semantic Evidence Binding", () => {
  it("allows human input to receive a SUPPORTED binding", async () => {
    const context = contextWith();
    const humanItem = context.items.find((item) => item.provenance.origin === "HUMAN_INPUT");
    if (humanItem === undefined) throw new Error("missing human item fixture");
    const binder = createBoundSemanticEvidenceBinder(matchingReader(), {
      async evaluate(input) {
        return [evaluationFor(humanItem.itemId, input.stateReference, "SUPPORTED")];
      }
    });

    await expect(binder.bind(context)).resolves.toEqual([expect.objectContaining({
      contextId: context.contextId,
      itemId: humanItem.itemId,
      stateReference: context.sourceStateReferences[0],
      disposition: "SUPPORTED"
    })]);
  });

  it("allows model proposals to receive CONTRADICTED bindings", async () => {
    const context = contextWith();
    const modelItem = context.items.find((item) => item.provenance.origin === "MODEL_PROPOSAL");
    if (modelItem === undefined) throw new Error("missing model item fixture");
    const binder = createBoundSemanticEvidenceBinder(matchingReader(), {
      async evaluate(input) {
        return [evaluationFor(modelItem.itemId, input.stateReference, "CONTRADICTED")];
      }
    });

    await expect(binder.bind(context)).resolves.toEqual([expect.objectContaining({ itemId: modelItem.itemId, disposition: "CONTRADICTED" })]);
  });

  it("does not automatically support AUTHORITATIVE_STATE provenance", async () => {
    const context = contextWith();
    const authoritativeItem = context.items.find((item) => item.provenance.origin === "AUTHORITATIVE_STATE");
    if (authoritativeItem === undefined) throw new Error("missing authoritative item fixture");
    const binder = createBoundSemanticEvidenceBinder(matchingReader(), noBindingsEvaluator());

    await expect(binder.bind(context)).resolves.toEqual([]);
  });

  it("re-resolves authority for this operation and accepts no prior 5C1 result", async () => {
    let resolveCalls = 0;
    const reader = matchingReader(() => {
      resolveCalls += 1;
      return { opaque: true };
    });
    const binder = createBoundSemanticEvidenceBinder(reader, noBindingsEvaluator());
    type BindParameters = Parameters<typeof binder.bind>;
    const acceptsOnlyContext: BindParameters extends [DecisionContextDraft] ? true : false = true;

    expect(acceptsOnlyContext).toBe(true);
    await binder.bind(contextWith());
    expect(resolveCalls).toBe(1);
  });

  it("captures evaluator invocation at construction and preserves this binding", async () => {
    const context = contextWith();
    let originalCalls = 0;
    let replacementCalls = 0;
    const evaluator: SemanticEvidenceBindingEvaluator & { label: string } = {
      label: "bound",
      async evaluate(this: SemanticEvidenceBindingEvaluator & { label: string }) {
        originalCalls += 1;
        expect(this.label).toBe("bound");
        return [];
      }
    };
    const binder = createBoundSemanticEvidenceBinder(matchingReader(), evaluator);
    evaluator.evaluate = async () => {
      replacementCalls += 1;
      return [];
    };

    await binder.bind(context);
    expect(originalCalls).toBe(1);
    expect(replacementCalls).toBe(0);
  });

  it("captures the reader capability at construction and fails closed on a mismatched returned reference", async () => {
    let originalCalls = 0;
    let replacementCalls = 0;
    const reader: BoundAuthoritativeStateReader = {
      async resolve(requested) {
        originalCalls += 1;
        return { reference: structuredClone(requested), payload: { opaque: true } };
      }
    };
    const binder = createBoundSemanticEvidenceBinder(reader, noBindingsEvaluator());
    reader.resolve = async (requested) => {
      replacementCalls += 1;
      return { reference: { ...requested, artifactId: "ARTIFACT_OTHER" }, payload: { opaque: true } };
    };

    await expect(binder.bind(contextWith())).resolves.toEqual([]);
    expect(originalCalls).toBe(1);
    expect(replacementCalls).toBe(0);

    const mismatchedBinder = createBoundSemanticEvidenceBinder({
      async resolve(requested) {
        return { reference: { ...requested, artifactId: "ARTIFACT_OTHER" }, payload: { opaque: true } };
      }
    }, noBindingsEvaluator());
    await expect(mismatchedBinder.bind(contextWith())).rejects.toThrow("ERR_DECISION_EVIDENCE_BINDING_AUTHORITY_REFERENCE_MISMATCH");
  });

  it("resolves authority before invoking the evaluator and blocks evaluation on resolution failure", async () => {
    const calls: string[] = [];
    const binder = createBoundSemanticEvidenceBinder({
      async resolve() {
        calls.push("resolve");
        throw new Error("ERR_DECISION_AUTHORITY_STATE_NOT_FOUND");
      }
    }, {
      async evaluate() {
        calls.push("evaluate");
        return [];
      }
    });

    await expect(binder.bind(contextWith())).rejects.toThrow("ERR_DECISION_AUTHORITY_STATE_NOT_FOUND");
    expect(calls).toEqual(["resolve"]);
  });

  it("passes an operation-local detached payload to the evaluator", async () => {
    const payload = { unrelated: { source: "producer", value: 7 } };
    let evaluatorPayload: unknown;
    const binder = createBoundSemanticEvidenceBinder(matchingReader(() => payload), {
      async evaluate(input) {
        evaluatorPayload = input.payload;
        if (typeof input.payload !== "object" || input.payload === null) throw new Error("expected object payload");
        const unrelated = Reflect.get(input.payload, "unrelated");
        if (typeof unrelated !== "object" || unrelated === null) throw new Error("expected nested payload");
        Reflect.set(unrelated, "value", 99);
        return [];
      }
    });

    await binder.bind(contextWith());
    expect(evaluatorPayload).toEqual({ unrelated: { source: "producer", value: 99 } });
    expect(evaluatorPayload).not.toBe(payload);
    expect(payload).toEqual({ unrelated: { source: "producer", value: 7 } });
  });

  it("fails closed before evaluation when a resolver payload cannot be detached", async () => {
    let evaluatorCalls = 0;
    const binder = createBoundSemanticEvidenceBinder(matchingReader(() => () => undefined), {
      async evaluate() {
        evaluatorCalls += 1;
        return [];
      }
    });

    await expect(binder.bind(contextWith())).rejects.toThrow("ERR_DECISION_EVIDENCE_BINDING_PAYLOAD_NOT_DETACHABLE");
    expect(evaluatorCalls).toBe(0);
  });

  it.each([
    ["a direct SharedArrayBuffer", () => new SharedArrayBuffer(8)],
    ["a nested SharedArrayBuffer", () => ({ nested: { buffer: new SharedArrayBuffer(8) } })],
    ["a SharedArrayBuffer-backed Uint8Array", () => new Uint8Array(new SharedArrayBuffer(8))],
    ["a SharedArrayBuffer-backed DataView", () => new DataView(new SharedArrayBuffer(8))],
    ["SharedArrayBuffer values nested in Map and Set", () => {
      const buffer = new SharedArrayBuffer(8);
      return new Map([[{ key: "shared" }, new Set([buffer, new Uint8Array(buffer)])]]);
    }]
  ])("rejects %s before evaluator invocation", async (_caseName, payloadFactory) => {
    let evaluatorCalls = 0;
    const binder = createBoundSemanticEvidenceBinder(matchingReader(() => payloadFactory()), {
      async evaluate() {
        evaluatorCalls += 1;
        return [];
      }
    });

    await expect(binder.bind(contextWith())).rejects.toThrow("ERR_DECISION_EVIDENCE_BINDING_PAYLOAD_NOT_DETACHABLE");
    expect(evaluatorCalls).toBe(0);
  });

  it("accepts cloneable cyclic payloads that contain no shared memory", async () => {
    const payload: { label: string; self?: unknown } = { label: "ordinary" };
    payload.self = payload;
    let evaluatorPayload: unknown;
    const binder = createBoundSemanticEvidenceBinder(matchingReader(() => payload), {
      async evaluate(input) {
        evaluatorPayload = input.payload;
        return [];
      }
    });

    await expect(binder.bind(contextWith())).resolves.toEqual([]);
    expect(evaluatorPayload).not.toBe(payload);
    if (typeof evaluatorPayload !== "object" || evaluatorPayload === null) throw new Error("missing cyclic evaluator payload");
    expect(Reflect.get(evaluatorPayload, "self")).toBe(evaluatorPayload);
  });

  it("establishes every authority reference before the first semantic evaluation", async () => {
    const context = contextWith([reference("B"), reference("A")]);
    const calls: string[] = [];
    const binder = createBoundSemanticEvidenceBinder({
      async resolve(requested) {
        calls.push(`resolve:${requested.artifactId}`);
        return { reference: structuredClone(requested), payload: { artifact: requested.artifactId } };
      }
    }, {
      async evaluate(input) {
        calls.push(`evaluate:${input.stateReference.artifactId}`);
        return [];
      }
    });

    await binder.bind(context);
    expect(calls).toEqual([
      ...context.sourceStateReferences.map((item) => `resolve:${item.artifactId}`),
      ...context.sourceStateReferences.map((item) => `evaluate:${item.artifactId}`)
    ]);
  });

  it("invokes no evaluator when later authority establishment fails", async () => {
    const context = contextWith([reference("A"), reference("B")]);
    const calls: string[] = [];
    const binder = createBoundSemanticEvidenceBinder({
      async resolve(requested) {
        calls.push(`resolve:${requested.artifactId}`);
        if (requested.artifactId === "ARTIFACT_B") throw new Error("ERR_DECISION_AUTHORITY_STATE_NOT_FOUND");
        return { reference: structuredClone(requested), payload: { artifact: requested.artifactId } };
      }
    }, {
      async evaluate() {
        calls.push("evaluate");
        return [];
      }
    });

    await expect(binder.bind(context)).rejects.toThrow("ERR_DECISION_AUTHORITY_STATE_NOT_FOUND");
    expect(calls).toEqual(context.sourceStateReferences.map((item) => `resolve:${item.artifactId}`));
  });

  it("rejects unknown items, absent references, invalid dispositions, empty rationales, and duplicate bindings", async () => {
    const context = contextWith();
    const itemId = context.items[0].itemId;
    const invalidCases: Array<[string, unknown]> = [
      ["unknown item", [evaluationFor("DCI_UNKNOWN", context.sourceStateReferences[0], "SUPPORTED")]],
      ["absent reference", [evaluationFor(itemId, reference("ABSENT"), "SUPPORTED")]],
      ["invalid disposition", [{ ...evaluationFor(itemId, context.sourceStateReferences[0], "SUPPORTED"), disposition: "UNKNOWN" }]],
      ["empty rationale", [evaluationFor(itemId, context.sourceStateReferences[0], "SUPPORTED", "  ")]],
      ["duplicate target", [evaluationFor(itemId, context.sourceStateReferences[0], "SUPPORTED"), evaluationFor(itemId, context.sourceStateReferences[0], "CONTRADICTED", "A conflicting duplicate")]]
    ];

    for (const [_name, output] of invalidCases) {
      const binder = createBoundSemanticEvidenceBinder(matchingReader(), { async evaluate() { return output as never; } });
      await expect(binder.bind(context)).rejects.toThrow(/^ERR_DECISION_EVIDENCE_BINDING_/);
    }
  });

  it("is canonically ordered and deterministically identified", async () => {
    const context = contextWith([reference("B"), reference("A")]);
    const items = [...context.items].reverse();
    const binder = createBoundSemanticEvidenceBinder(matchingReader(), {
      async evaluate(input) {
        return items.slice(0, 2).map((item) => evaluationFor(item.itemId, input.stateReference, "PARTIALLY_SUPPORTED", `Rationale for ${item.itemId}`));
      }
    });

    const first = await binder.bind(context);
    const second = await binder.bind(context);
    expect(first).toEqual(second);
    expect(first.map((binding) => binding.bindingId)).toEqual([...first.map((binding) => binding.bindingId)].sort());
    expect(first.every((binding) => binding.bindingId.startsWith("EBIND_"))).toBe(true);
  });

  it("uses the exact EBIND identity tuple while excluding rationale wording", async () => {
    const context = contextWith();
    const item = context.items[0];
    const stateReference = context.sourceStateReferences[0];
    const bindingWith = async (disposition: "SUPPORTED" | "CONTRADICTED", rationale: string) => {
      const bindings = await createBoundSemanticEvidenceBinder(matchingReader(), {
        async evaluate(input) {
          return [evaluationFor(item.itemId, input.stateReference, disposition, rationale)];
        }
      }).bind(context);
      return bindings[0];
    };
    const supportedOne = await bindingWith("SUPPORTED", " First wording. ");
    const supportedTwo = await bindingWith("SUPPORTED", "Second wording.");
    const contradicted = await bindingWith("CONTRADICTED", "First wording.");
    const expected = `EBIND_${createHash("sha256").update(JSON.stringify([
      "SEMANTIC_EVIDENCE_BINDING_V1",
      context.contextId,
      item.itemId,
      [stateReference.producerId, stateReference.authorityContractId, stateReference.artifactId, stateReference.locator],
      "SUPPORTED"
    ]), "utf8").digest("hex").slice(0, 24).toUpperCase()}`;

    expect(supportedOne.bindingId).toBe(expected);
    expect(supportedTwo.bindingId).toBe(expected);
    expect(supportedOne.rationale).toBe("First wording.");
    expect(supportedTwo.rationale).toBe("Second wording.");
    expect(contradicted.bindingId).not.toBe(expected);
  });

  it("captures context targets before awaits so caller mutation cannot redirect later binding", async () => {
    let begin: (() => void) | undefined;
    let release: (() => void) | undefined;
    const started = new Promise<void>((resolveStarted) => { begin = resolveStarted; });
    const released = new Promise<void>((resolveReleased) => { release = resolveReleased; });
    const calls: AuthoritativeStateReference[] = [];
    const reader: BoundAuthoritativeStateReader = {
      async resolve(requested) {
        calls.push(structuredClone(requested));
        if (calls.length === 1) {
          if (begin === undefined) throw new Error("test start unavailable");
          begin();
          await released;
        }
        return { reference: structuredClone(requested), payload: { opaque: true } };
      }
    };
    const context = contextWith([reference("A"), reference("B")]);
    const expected = structuredClone(context.sourceStateReferences);
    const evaluatorItems: DecisionContextDraft["items"][] = [];
    const binder = createBoundSemanticEvidenceBinder(reader, {
      async evaluate(input) {
        evaluatorItems.push(structuredClone([...input.items]));
        return [];
      }
    });
    const pending = binder.bind(context);
    await started;
    context.sourceStateReferences[0].artifactId = "MUTATED";
    context.sourceStateReferences[1].locator = "mutated";
    const humanItem = context.items.find((item) => item.provenance.origin === "HUMAN_INPUT");
    if (humanItem === undefined || humanItem.provenance.origin !== "HUMAN_INPUT") throw new Error("missing human item fixture");
    humanItem.statement = "MUTATED statement";
    humanItem.provenance.actorId = "MUTATED actor";
    if (release === undefined) throw new Error("test release unavailable");
    release();

    await expect(pending).resolves.toEqual([]);
    expect(calls).toEqual(expected);
    expect(evaluatorItems).toEqual([structuredClone(contextWith([reference("A"), reference("B")]).items), structuredClone(contextWith([reference("A"), reference("B")]).items)]);
  });

  it("allows zero semantic binding proposals without synthesizing NOT_SUPPORTED", async () => {
    const bindings = await createBoundSemanticEvidenceBinder(matchingReader(), noBindingsEvaluator()).bind(contextWith());

    expect(bindings).toEqual([]);
    expect(bindings).not.toContainEqual(expect.objectContaining({ disposition: "NOT_SUPPORTED" }));
  });

  it("exports no score/confidence or Phase-5C3+ concepts", () => {
    type NoScore = "score" extends keyof SemanticEvidenceBindingProposal ? false : true;
    type NoConfidence = "confidence" extends keyof SemanticEvidenceBindingProposal ? false : true;
    const noScore: NoScore = true;
    const noConfidence: NoConfidence = true;
    expect(noScore).toBe(true);
    expect(noConfidence).toBe(true);
    const entry = resolve(process.cwd(), "lib/decision-core/evidence-binding/index.ts");
    const names = publicExportNames(entry);
    expect(names.filter((name) => forbiddenBindingExports.includes(name))).toEqual([]);
  });

  it("keeps evidence-binding production generic and its AST import detector ignores comments and strings", () => {
    expect(moduleSpecifiers("import { x } from '../../career/capability-core';").filter(isForbiddenImport)).toEqual(["../../career/capability-core"]);
    expect(moduleSpecifiers("// ../../career/capability-core\nconst note = '../../career/capability-core';").filter(isForbiddenImport)).toEqual([]);
    const productionFiles = sourceFiles(resolve(process.cwd(), "lib/decision-core/evidence-binding"));
    const forbidden = productionFiles.flatMap((file) => moduleSpecifiers(readFileSync(file, "utf8")).filter(isForbiddenImport).map((specifier) => ({ file, specifier })));
    expect(forbidden).toEqual([]);
  });
});
