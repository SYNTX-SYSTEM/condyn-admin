import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import {
  createBoundAuthoritativeStateReader,
  type AuthoritativeStateReference,
  type AuthoritativeStateResolver
} from "../../../lib/decision-core";

type ReferenceCannotCarryPayload = "payload" extends keyof AuthoritativeStateReference ? false : true;
type ReferenceCannotCarryRepository = "repository" extends keyof AuthoritativeStateReference ? false : true;
type ReferenceCannotCarryResolver = "resolver" extends keyof AuthoritativeStateReference ? false : true;
const referenceCannotCarryPayload: ReferenceCannotCarryPayload = true;
const referenceCannotCarryRepository: ReferenceCannotCarryRepository = true;
const referenceCannotCarryResolver: ReferenceCannotCarryResolver = true;

const reference = (producerId = "PRODUCER_A", authorityContractId = "CONTRACT_V1"): AuthoritativeStateReference => ({
  producerId,
  authorityContractId,
  artifactId: "ARTIFACT_1",
  locator: "opaque-locator"
});

const resolver = <TPayload>(producerId: string, authorityContractId: string, payload: TPayload): AuthoritativeStateResolver<TPayload> => ({
  producerId,
  authorityContractId,
  async resolve() {
    return structuredClone(payload);
  }
});

const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
  entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []
);

interface ModuleCoupling {
  modulePaths: string[];
  importedSymbols: string[];
}

const inspectModuleCoupling = (source: string): ModuleCoupling => {
  const modulePaths: string[] = [];
  const importedSymbols: string[] = [];
  const sourceFile = ts.createSourceFile("module.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const addModuleSpecifier = (specifier: ts.Expression | undefined) => {
    if (specifier !== undefined && ts.isStringLiteralLike(specifier)) modulePaths.push(specifier.text);
  };
  const addNamedSymbols = (clause: ts.NamedImportBindings | ts.NamedExportBindings | undefined) => {
    if (clause !== undefined && (ts.isNamedImports(clause) || ts.isNamedExports(clause))) {
      clause.elements.forEach((element) => importedSymbols.push((element.propertyName ?? element.name).text));
    }
  };
  const addImportClauseSymbols = (clause: ts.ImportClause | undefined) => {
    if (clause === undefined) return;
    if (clause.name !== undefined) importedSymbols.push(clause.name.text);
    if (clause.namedBindings !== undefined && ts.isNamespaceImport(clause.namedBindings)) {
      importedSymbols.push(clause.namedBindings.name.text);
      return;
    }
    addNamedSymbols(clause.namedBindings);
  };
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node)) {
      addModuleSpecifier(node.moduleSpecifier);
      addImportClauseSymbols(node.importClause);
    } else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) {
      addModuleSpecifier(node.moduleReference.expression);
      importedSymbols.push(node.name.text);
    } else if (ts.isExportDeclaration(node)) {
      addModuleSpecifier(node.moduleSpecifier);
      addNamedSymbols(node.exportClause);
    } else if (ts.isCallExpression(node)) {
      const isDynamicImport = node.expression.kind === ts.SyntaxKind.ImportKeyword;
      const isRequire = ts.isIdentifier(node.expression) && node.expression.text === "require";
      if ((isDynamicImport || isRequire) && node.arguments.length === 1) addModuleSpecifier(node.arguments[0]);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return { modulePaths, importedSymbols };
};

const inspectDecisionCoreModuleCoupling = () => sourceFiles(resolve(process.cwd(), "lib/decision-core"))
  .flatMap((file) => {
    const coupling = inspectModuleCoupling(readFileSync(file, "utf8"));
    return coupling.modulePaths.map((modulePath) => ({ file, modulePath, importedSymbols: coupling.importedSymbols }));
  });

describe("Decision Core authoritative state reader contract", () => {
  it("resolves unrelated opaque producer payloads without knowing their semantics", async () => {
    const reader = createBoundAuthoritativeStateReader([
      resolver("PRODUCER_A", "CONTRACT_V1", { arbitrary: ["opaque", 7] }),
      resolver("PRODUCER_B", "CONTRACT_V2", { other: { enabled: true } })
    ]);

    await expect(reader.resolve(reference("PRODUCER_A", "CONTRACT_V1"))).resolves.toMatchObject({ payload: { arbitrary: ["opaque", 7] } });
    await expect(reader.resolve(reference("PRODUCER_B", "CONTRACT_V2"))).resolves.toMatchObject({ payload: { other: { enabled: true } } });
  });

  it("accepts only a strict reference contract and no caller-held authority objects", async () => {
    const reader = createBoundAuthoritativeStateReader([resolver("PRODUCER_A", "CONTRACT_V1", { value: 1 })]);
    const malformed = reference();
    Reflect.set(malformed, "payload", { forged: true });
    Reflect.set(malformed, "repository", { forged: true });
    Reflect.set(malformed, "resolver", { forged: true });

    expect(referenceCannotCarryPayload).toBe(true);
    expect(referenceCannotCarryRepository).toBe(true);
    expect(referenceCannotCarryResolver).toBe(true);
    await expect(reader.resolve(malformed)).rejects.toThrow("ERR_DECISION_AUTHORITY_REFERENCE_INVALID");
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["primitive", "not-a-reference"],
    ["array", []],
    ["function", () => undefined],
    ["empty object", {}],
    ["missing required field", (() => { const value = reference(); Reflect.deleteProperty(value, "locator"); return value; })()],
    ["whitespace producer ID", { ...reference(), producerId: "  " }],
    ["whitespace authority-contract ID", { ...reference(), authorityContractId: "  " }],
    ["whitespace artifact ID", { ...reference(), artifactId: "  " }],
    ["whitespace locator", { ...reference(), locator: "  " }],
    ["enumerable extra field", { ...reference(), extra: true }],
    ["non-enumerable extra field", (() => { const value = reference(); Object.defineProperty(value, "hidden", { value: true }); return value; })()],
    ["symbol extra field", (() => { const value = reference(); Reflect.set(value, Symbol("hidden"), true); return value; })()]
  ])("rejects malformed runtime references deterministically: %s", async (_caseName, malformed) => {
    const reader = createBoundAuthoritativeStateReader([resolver("PRODUCER_A", "CONTRACT_V1", { value: 1 })]);
    await expect(Reflect.apply(reader.resolve, reader, [malformed])).rejects.toThrow("ERR_DECISION_AUTHORITY_REFERENCE_INVALID");
  });

  it("keeps an asynchronous resolution trace-consistent when the caller mutates its reference", async () => {
    let beginResolution: (() => void) | undefined;
    let completeResolution: (() => void) | undefined;
    const resolverStarted = new Promise<void>((resolve) => { beginResolution = resolve; });
    const resolverCompleted = new Promise<void>((resolve) => { completeResolution = resolve; });
    let resolverReference: AuthoritativeStateReference | undefined;
    const delayedResolver: AuthoritativeStateResolver<{ artifactId: string }> = {
      producerId: "PRODUCER_A",
      authorityContractId: "CONTRACT_V1",
      async resolve(input) {
        resolverReference = { ...input };
        if (beginResolution === undefined) throw new Error("test resolver start was not initialized");
        beginResolution();
        await resolverCompleted;
        return { artifactId: input.artifactId };
      }
    };
    const reader = createBoundAuthoritativeStateReader([delayedResolver]);
    const callerReference = reference();
    const pending = reader.resolve(callerReference);
    await resolverStarted;
    callerReference.producerId = "PRODUCER_B";
    callerReference.authorityContractId = "CONTRACT_V2";
    callerReference.artifactId = "ARTIFACT_B";
    callerReference.locator = "locator-b";
    if (completeResolution === undefined) throw new Error("test resolver completion was not initialized");
    completeResolution();

    await expect(pending).resolves.toEqual({
      reference: reference(),
      payload: { artifactId: "ARTIFACT_1" }
    });
    expect(resolverReference).toEqual(reference());
  });

  it("consumes descriptor-validated proxy values rather than divergent get-trap values", async () => {
    const reader = createBoundAuthoritativeStateReader([{
      producerId: "PRODUCER_A",
      authorityContractId: "CONTRACT_V1",
      async resolve(input) {
        return { artifactId: input.artifactId };
      }
    }]);
    const hostileReference = new Proxy(reference(), {
      get(target, property, receiver) {
        if (property === "artifactId") return "ARTIFACT_B";
        return Reflect.get(target, property, receiver);
      }
    });

    await expect(reader.resolve(hostileReference)).resolves.toEqual({
      reference: reference(),
      payload: { artifactId: "ARTIFACT_1" }
    });
  });

  it.each([
    ["ownKeys", new Proxy(reference(), { ownKeys() { throw new Error("hostile ownKeys"); } })],
    ["getOwnPropertyDescriptor", new Proxy(reference(), { getOwnPropertyDescriptor() { throw new Error("hostile descriptor"); } })]
  ])("normalizes hostile Proxy %s failures", async (_trap, hostileReference) => {
    const reader = createBoundAuthoritativeStateReader([resolver("PRODUCER_A", "CONTRACT_V1", { value: 1 })]);
    await expect(reader.resolve(hostileReference)).rejects.toThrow("ERR_DECISION_AUTHORITY_REFERENCE_INVALID");
  });

  it("prevents a resolver from mutating returned trace metadata", async () => {
    const reader = createBoundAuthoritativeStateReader([{
      producerId: "PRODUCER_A",
      authorityContractId: "CONTRACT_V1",
      async resolve(input) {
        input.artifactId = "resolver-mutated";
        return { resolverObserved: input.artifactId };
      }
    }]);

    await expect(reader.resolve(reference())).resolves.toEqual({
      reference: reference(),
      payload: { resolverObserved: "resolver-mutated" }
    });
  });

  it("binds resolvers during construction and exposes resolve(reference) only", async () => {
    const reader = createBoundAuthoritativeStateReader([resolver("PRODUCER_A", "CONTRACT_V1", { resolver: "A" })]);
    type ResolveParameters = Parameters<typeof reader.resolve>;
    const exactOneReferenceArgument: ResolveParameters extends [AuthoritativeStateReference] ? true : false = true;

    expect(exactOneReferenceArgument).toBe(true);
    await expect(reader.resolve(reference())).resolves.toMatchObject({ payload: { resolver: "A" } });
  });

  it("captures the resolver invocation at construction while preserving resolver this-binding", async () => {
    let originalCalls = 0;
    let replacementCalls = 0;
    const mutableResolver: AuthoritativeStateResolver & { label: string } = {
      producerId: "PRODUCER_A",
      authorityContractId: "CONTRACT_V1",
      label: "original",
      async resolve(this: AuthoritativeStateResolver & { label: string }, input) {
        originalCalls += 1;
        return { implementation: this.label, artifactId: input.artifactId };
      }
    };
    const reader = createBoundAuthoritativeStateReader([mutableResolver]);
    mutableResolver.resolve = async () => {
      replacementCalls += 1;
      return { implementation: "replacement" };
    };

    await expect(reader.resolve(reference())).resolves.toMatchObject({ payload: { implementation: "original", artifactId: "ARTIFACT_1" } });
    expect(originalCalls).toBe(1);
    expect(replacementCalls).toBe(0);
  });

  it("rejects an unknown producer/authority-contract binding deterministically", async () => {
    const reader = createBoundAuthoritativeStateReader([resolver("PRODUCER_A", "CONTRACT_V1", { value: 1 })]);
    await expect(reader.resolve(reference("PRODUCER_A", "UNKNOWN_CONTRACT"))).rejects.toThrow("ERR_DECISION_AUTHORITY_RESOLVER_NOT_FOUND");
  });

  it("rejects duplicate resolver registrations deterministically", () => {
    expect(() => createBoundAuthoritativeStateReader([
      resolver("PRODUCER_A", "CONTRACT_V1", { first: true }),
      resolver("PRODUCER_A", "CONTRACT_V1", { second: true })
    ])).toThrow("ERR_DECISION_AUTHORITY_RESOLVER_CONFLICT");
  });

  it("keeps the generic kernel free of Career, Capability, matching, and recommendation imports", () => {
    const imports = inspectDecisionCoreModuleCoupling().map(({ modulePath }) => modulePath);

    expect(imports).not.toContainEqual(expect.stringMatching(/(?:career|capability-core|matching|recommendations)/));
  });

  it("does not import the legacy Career decision-loop surface", () => {
    const imports = inspectDecisionCoreModuleCoupling();

    expect(imports.map(({ modulePath }) => modulePath)).not.toContainEqual(expect.stringContaining("lib/career/decisions"));
    expect(imports.flatMap(({ importedSymbols }) => importedSymbols)).not.toContain("RecommendationProofChain");
    expect(imports.flatMap(({ importedSymbols }) => importedSymbols)).not.toContain("DirectedEvidenceGraph");
  });

  it("detects static, export-from, dynamic, and require coupling without scanning comments or ordinary strings", () => {
    const coupling = inspectModuleCoupling(`
      // import "../career/comment-only";
      const commentOnly = "require('../matching/string-only')";
      import { RecommendationProofChain as Proof } from "../opaque";
      export { DirectedEvidenceGraph } from "../opaque-export";
      import("../career/dynamic");
      require("../matching/required");
      import RecommendationProofChain = require(\`../career/import-equals\`);
      import(\`../capability-core/template-literal\`);
      require(\`../recommendations/template-literal\`);
    `);

    expect(coupling.modulePaths).toEqual(expect.arrayContaining(["../opaque", "../opaque-export", "../career/dynamic", "../matching/required", "../career/import-equals", "../capability-core/template-literal", "../recommendations/template-literal"]));
    expect(coupling.modulePaths).not.toEqual(expect.arrayContaining(["../career/comment-only", "../matching/string-only"]));
    expect(coupling.importedSymbols).toEqual(expect.arrayContaining(["RecommendationProofChain", "DirectedEvidenceGraph"]));
  });

  it.each([
    ["default import", "import RecommendationProofChain from '../opaque-default';", "RecommendationProofChain"],
    ["namespace import", "import * as DirectedEvidenceGraph from '../opaque-namespace';", "DirectedEvidenceGraph"],
    ["aliased named import", "import { RecommendationProofChain as Proof } from '../opaque-named';", "RecommendationProofChain"],
    ["aliased named re-export", "export { DirectedEvidenceGraph as Graph } from '../opaque-export';", "DirectedEvidenceGraph"],
    ["ImportEqualsDeclaration", "import RecommendationProofChain = require('../opaque-import-equals');", "RecommendationProofChain"]
  ])("captures forbidden legacy symbol identity through %s", (_form, source, symbol) => {
    expect(inspectModuleCoupling(source).importedSymbols).toContain(symbol);
  });
});
