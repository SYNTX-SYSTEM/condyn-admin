import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import * as validation from "../../../lib/decision-core/validation";
import {
  createDecisionContextDraft,
  type AuthoritativeStateReference,
  type BoundAuthoritativeStateReader,
  type DecisionContextDraft
} from "../../../lib/decision-core";

const reference = (suffix: string): AuthoritativeStateReference => ({
  producerId: `PRODUCER_${suffix}`,
  authorityContractId: `CONTRACT_${suffix}`,
  artifactId: `ARTIFACT_${suffix}`,
  locator: `locator-${suffix}`
});

const contextWith = (sourceStateReferences: AuthoritativeStateReference[]): DecisionContextDraft => createDecisionContextDraft({
  sourceStateReferences,
  items: [{
    role: "DECISION_QUESTION",
    statement: "Should the system proceed?",
    provenance: { origin: "HUMAN_INPUT", actorId: "human-1" }
  }]
});

const matchingReader = (onResolve: (requested: AuthoritativeStateReference) => unknown = () => ({ opaque: true })): BoundAuthoritativeStateReader => ({
  async resolve(requested) {
    return { reference: structuredClone(requested), payload: onResolve(requested) };
  }
});

const forbiddenValidationExports = ["EvidenceBinding", "SUPPORTED", "PARTIALLY_SUPPORTED", "NOT_SUPPORTED", "CONTRADICTED", "Gap", "Contradiction", "Dependency", "Consequence", "Recommendation", "Score", "Ranking", "HumanDecision", "Action", "Outcome", "Feedback"];

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
          if (normalizedVirtualFiles.has(candidate)) return { resolvedFileName: candidate, extension: ts.Extension.Ts, isExternalLibraryImport: false };
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
    if (sourceFile === undefined) throw new Error(`missing validation export source: ${entryFileName}`);
    const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
    if (moduleSymbol === undefined) throw new Error(`missing validation export module: ${entryFileName}`);
    const names = new Set<string>();
    for (const exportedSymbol of checker.getExportsOfModule(moduleSymbol)) {
      names.add(exportedSymbol.getName());
      if ((exportedSymbol.flags & ts.SymbolFlags.Alias) !== 0) names.add(checker.getAliasedSymbol(exportedSymbol).getName());
    }
    namesByEntry.set(entryFileName, [...names]);
  }
  return namesByEntry;
};

const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
  entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []
);

const moduleSpecifiers = (source: string): string[] => {
  const sourceFile = ts.createSourceFile("validation.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const specifiers: string[] = [];
  const add = (value: ts.Expression | undefined) => {
    if (value !== undefined && ts.isStringLiteralLike(value)) specifiers.push(value.text);
  };
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      add(node.moduleSpecifier);
    } else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) {
      add(node.moduleReference.expression);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return specifiers;
};

const isForbiddenValidationImport = (moduleSpecifier: string): boolean => {
  const normalized = moduleSpecifier.toLowerCase();
  return ["career", "capability-core", "matching", "recommendation", "recommendations", "career/decisions", "decision-looper"].some((forbidden) => normalized.includes(forbidden));
};

describe("Decision Context authority gate", () => {
  it("validates an empty authority inventory without resolving anything", async () => {
    let calls = 0;
    const validator = validation.createBoundDecisionContextAuthorityValidator(matchingReader(() => {
      calls += 1;
      return { ignored: true };
    }));
    type ValidateParameters = Parameters<typeof validator.validate>;
    const acceptsOnlyContext: ValidateParameters extends [DecisionContextDraft] ? true : false = true;

    expect(acceptsOnlyContext).toBe(true);
    await expect(validator.validate(contextWith([]))).resolves.toBeUndefined();
    expect(calls).toBe(0);
  });

  it("resolves one source-state reference exactly once", async () => {
    const calls: AuthoritativeStateReference[] = [];
    const validator = validation.createBoundDecisionContextAuthorityValidator(matchingReader((requested) => {
      calls.push(structuredClone(requested));
      return { unrelated: "payload" };
    }));
    const context = contextWith([reference("A")]);

    await expect(validator.validate(context)).resolves.toBeUndefined();
    expect(calls).toEqual(context.sourceStateReferences);
  });

  it("resolves each reference once in the canonical context order", async () => {
    const calls: AuthoritativeStateReference[] = [];
    const validator = validation.createBoundDecisionContextAuthorityValidator(matchingReader((requested) => {
      calls.push(structuredClone(requested));
      return { opaque: requested.artifactId };
    }));
    const context = contextWith([reference("B"), reference("A"), reference("C")]);

    await validator.validate(context);
    expect(calls).toEqual(context.sourceStateReferences);
  });

  it("passes a detached requested reference to the reader", async () => {
    let readerReference: AuthoritativeStateReference | undefined;
    const validator = validation.createBoundDecisionContextAuthorityValidator(matchingReader((requested) => {
      readerReference = requested;
      return { payload: "ignored" };
    }));
    const context = contextWith([reference("A")]);

    await validator.validate(context);
    expect(readerReference).toEqual(context.sourceStateReferences[0]);
    expect(readerReference).not.toBe(context.sourceStateReferences[0]);
  });

  it("captures the reader resolve capability at construction", async () => {
    let originalCalls = 0;
    let replacementCalls = 0;
    const reader: BoundAuthoritativeStateReader = {
      async resolve(requested) {
        originalCalls += 1;
        return { reference: structuredClone(requested), payload: { implementation: "original" } };
      }
    };
    const validator = validation.createBoundDecisionContextAuthorityValidator(reader);
    reader.resolve = async (requested) => {
      replacementCalls += 1;
      return { reference: structuredClone(requested), payload: { implementation: "replacement" } };
    };

    await validator.validate(contextWith([reference("A")]));
    expect(originalCalls).toBe(1);
    expect(replacementCalls).toBe(0);
  });

  it("preserves reader this-binding while resolving", async () => {
    let observedLabel: string | undefined;
    const reader: BoundAuthoritativeStateReader & { label: string } = {
      label: "bound-reader",
      async resolve(this: BoundAuthoritativeStateReader & { label: string }, requested) {
        observedLabel = this.label;
        return { reference: structuredClone(requested), payload: { label: this.label } };
      }
    };
    const validator = validation.createBoundDecisionContextAuthorityValidator(reader);

    await expect(validator.validate(contextWith([reference("A")]))).resolves.toBeUndefined();
    expect(observedLabel).toBe("bound-reader");
  });

  it("captures context references before an asynchronous resolution allows caller mutation", async () => {
    let beginResolution: (() => void) | undefined;
    let completeResolution: (() => void) | undefined;
    const begun = new Promise<void>((resolve) => { beginResolution = resolve; });
    const completed = new Promise<void>((resolve) => { completeResolution = resolve; });
    const calls: AuthoritativeStateReference[] = [];
    const reader: BoundAuthoritativeStateReader = {
      async resolve(requested) {
        calls.push(structuredClone(requested));
        if (calls.length === 1) {
          if (beginResolution === undefined) throw new Error("test start is not initialized");
          beginResolution();
          await completed;
        }
        return { reference: structuredClone(requested), payload: { opaque: true } };
      }
    };
    const validator = validation.createBoundDecisionContextAuthorityValidator(reader);
    const context = contextWith([reference("A"), reference("B")]);
    const expected = structuredClone(context.sourceStateReferences);
    const pending = validator.validate(context);
    await begun;
    context.sourceStateReferences[0].artifactId = "MUTATED";
    context.sourceStateReferences[1].locator = "mutated-locator";
    if (completeResolution === undefined) throw new Error("test completion is not initialized");
    completeResolution();

    await expect(pending).resolves.toBeUndefined();
    expect(calls).toEqual(expected);
  });

  it.each([
    ["accessor", (() => {
      const context = contextWith([reference("A")]);
      Object.defineProperty(context, "contextId", { enumerable: true, get: () => "DCTX_FORGED" });
      return context;
    })()],
    ["hostile Proxy", new Proxy(contextWith([reference("A")]), { ownKeys() { throw new Error("hostile ownKeys"); } })]
  ])("normalizes hostile context boundaries: %s", async (_caseName, malformedContext) => {
    let calls = 0;
    const validator = validation.createBoundDecisionContextAuthorityValidator(matchingReader(() => {
      calls += 1;
      return { ignored: true };
    }));

    await expect(Reflect.apply(validator.validate, validator, [malformedContext])).rejects.toThrow("ERR_DECISION_CONTEXT_AUTHORITY_CONTEXT_INVALID");
    expect(calls).toBe(0);
  });

  it("rejects malformed contexts before reader invocation", async () => {
    const context = contextWith([reference("A")]);
    context.contextId = "DCTX_TAMPERED";
    let calls = 0;
    const validator = validation.createBoundDecisionContextAuthorityValidator(matchingReader(() => {
      calls += 1;
      return { ignored: true };
    }));

    await expect(validator.validate(context)).rejects.toThrow("ERR_DECISION_CONTEXT_AUTHORITY_CONTEXT_INVALID");
    expect(calls).toBe(0);
  });

  it("fails closed when a reader returns a different reference", async () => {
    const validator = validation.createBoundDecisionContextAuthorityValidator({
      async resolve(requested) {
        return { reference: { ...requested, artifactId: "ARTIFACT_OTHER" }, payload: { opaque: true } };
      }
    });

    await expect(validator.validate(contextWith([reference("A")]))).rejects.toThrow("ERR_DECISION_CONTEXT_AUTHORITY_REFERENCE_MISMATCH");
  });

  it("ignores successful payloads and returns no reusable authority artifact", async () => {
    const payload = new Proxy({ meaning: "must-not-be-read" }, {
      get() { throw new Error("payload was inspected"); }
    });
    const validator = validation.createBoundDecisionContextAuthorityValidator(matchingReader(() => payload));
    type ValidationResult = ReturnType<typeof validator.validate>;
    const returnsOnlyVoid: ValidationResult extends Promise<void> ? true : false = true;

    expect(returnsOnlyVoid).toBe(true);
    await expect(validator.validate(contextWith([reference("A")]))).resolves.toBeUndefined();
  });

  it("accepts unrelated opaque payload shapes without interpreting them", async () => {
    const payloads = [
      { security: { isolation: ["service-x"], severity: 7 } },
      { manufacturing: ["line-y", { continue: true }] }
    ];
    let index = 0;
    const validator = validation.createBoundDecisionContextAuthorityValidator(matchingReader(() => payloads[index++]));

    await expect(validator.validate(contextWith([reference("A"), reference("B")]))).resolves.toBeUndefined();
    expect(index).toBe(2);
  });

  it("exports no later-phase semantic analysis or decision concepts", () => {
    for (const name of forbiddenValidationExports) {
      expect(validation).not.toHaveProperty(name);
    }
  });

  it("resolves forbidden direct, type-only, aliased, wildcard, and namespace exports through the validation barrel", () => {
    const root = "/decision-core-validation-export-gate";
    const namesByEntry = publicExportNamesByEntry([
      resolve(root, "direct-value.ts"),
      resolve(root, "direct-interface.ts"),
      resolve(root, "direct-type.ts"),
      resolve(root, "type-reexport.ts"),
      resolve(root, "named-type-reexport.ts"),
      resolve(root, "aliased-reexport.ts"),
      resolve(root, "wildcard.ts"),
      resolve(root, "namespace.ts"),
      resolve(root, "comments.ts")
    ], {
      [resolve(root, "direct-value.ts")]: "export const EvidenceBinding = 1;",
      [resolve(root, "direct-interface.ts")]: "export interface Gap {}",
      [resolve(root, "direct-type.ts")]: "export type Contradiction = string;",
      [resolve(root, "type-reexport.ts")]: "export type { Dependency } from './dependency';",
      [resolve(root, "dependency.ts")]: "export interface Dependency {}",
      [resolve(root, "named-type-reexport.ts")]: "export { type Consequence } from './consequence';",
      [resolve(root, "consequence.ts")]: "export interface Consequence {}",
      [resolve(root, "aliased-reexport.ts")]: "export { Recommendation as PublicName } from './recommendation';",
      [resolve(root, "recommendation.ts")]: "export interface Recommendation {}",
      [resolve(root, "wildcard.ts")]: "export * from './human-decision';",
      [resolve(root, "human-decision.ts")]: "export interface HumanDecision {}",
      [resolve(root, "namespace.ts")]: "export * as Recommendation from './detail';",
      [resolve(root, "detail.ts")]: "export interface Detail {}",
      [resolve(root, "comments.ts")]: "// Gap Recommendation\nconst note = 'Contradiction Consequence'; export interface Validator {}"
    });
    const exportsFor = (fileName: string): string[] => namesByEntry.get(resolve(root, fileName)) ?? [];

    expect(exportsFor("direct-value.ts")).toContain("EvidenceBinding");
    expect(exportsFor("direct-interface.ts")).toContain("Gap");
    expect(exportsFor("direct-type.ts")).toContain("Contradiction");
    expect(exportsFor("type-reexport.ts")).toContain("Dependency");
    expect(exportsFor("named-type-reexport.ts")).toContain("Consequence");
    expect(exportsFor("aliased-reexport.ts")).toContain("Recommendation");
    expect(exportsFor("wildcard.ts")).toContain("HumanDecision");
    expect(exportsFor("namespace.ts")).toContain("Recommendation");
    expect(exportsFor("comments.ts").filter((name) => forbiddenValidationExports.includes(name))).toEqual([]);

    const productionEntry = resolve(process.cwd(), "lib/decision-core/validation/index.ts");
    const productionExports = publicExportNamesByEntry([productionEntry]).get(productionEntry) ?? [];
    expect(productionExports.filter((name) => forbiddenValidationExports.includes(name))).toEqual([]);
  });

  it("detects forbidden validation module imports while ignoring comments and ordinary strings", () => {
    expect(moduleSpecifiers("import { x } from '../../career/capability-core';").filter(isForbiddenValidationImport)).toEqual(["../../career/capability-core"]);
    expect(moduleSpecifiers("// ../../career/capability-core\nconst note = '../../career/capability-core';").filter(isForbiddenValidationImport)).toEqual([]);

    const productionFiles = sourceFiles(resolve(process.cwd(), "lib/decision-core/validation"));
    const forbiddenProductionImports = productionFiles.flatMap((file) => moduleSpecifiers(readFileSync(file, "utf8"))
      .filter(isForbiddenValidationImport)
      .map((moduleSpecifier) => ({ file, moduleSpecifier })));
    expect(forbiddenProductionImports).toEqual([]);
  });
});
