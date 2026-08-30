import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as runtimeModule from "../../lib/decision-runtime";
import type {
  AuthoritativeStateReference,
  AuthoritativeStateResolution,
  BoundAuthoritativeStateReader,
  BoundDecisionContextRevisionPersister,
  DecisionContextRevision
} from "../../lib/decision-core";

type Hostile = Record<PropertyKey, unknown>;
type RuntimeDependencies = {
  authoritativeStateReader: BoundAuthoritativeStateReader;
  getRevisionById: (revisionId: string) => Promise<DecisionContextRevision | null>;
  revisionPersister: BoundDecisionContextRevisionPersister;
};

const reference = (): AuthoritativeStateReference => ({
  producerId: " producer / opaque ",
  authorityContractId: " contract / opaque ",
  artifactId: " artifact / opaque ",
  locator: " locator / opaque "
});
const revision = (): DecisionContextRevision => ({ opaque: "revision" } as unknown as DecisionContextRevision);
const r1ProductionFiles = [
  "lib/decision-runtime/types.ts",
  "lib/decision-runtime/runtime.ts",
  "lib/decision-runtime/index.ts"
];

function dependencies(overrides: Partial<RuntimeDependencies> = {}) {
  const authorityCalls: AuthoritativeStateReference[] = [];
  const revisionCalls: string[] = [];
  const persistenceCalls: DecisionContextRevision[] = [];
  const resolved: AuthoritativeStateResolution = { reference: reference(), payload: { opaque: "authority result" } };
  const storedRevision = revision();
  const persistedRevision = revision();
  const authoritativeStateReader = {
    async resolve(this: unknown, input: AuthoritativeStateReference) {
      expect(this).toBe(authoritativeStateReader);
      authorityCalls.push(input);
      return resolved;
    }
  };
  const revisionPersister = {
    async persist(this: unknown, input: DecisionContextRevision) {
      expect(this).toBe(revisionPersister);
      persistenceCalls.push(input);
      return persistedRevision;
    }
  };
  return {
    dependencies: {
      authoritativeStateReader: authoritativeStateReader as BoundAuthoritativeStateReader,
      getRevisionById: async (revisionId: string) => { revisionCalls.push(revisionId); return storedRevision; },
      revisionPersister: revisionPersister as BoundDecisionContextRevisionPersister,
      ...overrides
    } satisfies RuntimeDependencies,
    authorityCalls,
    revisionCalls,
    persistenceCalls,
    resolved,
    storedRevision,
    persistedRevision,
    authoritativeStateReader,
    revisionPersister
  };
}

describe("Decision Application Runtime R1", () => {
  it("creates from exactly three bound capabilities and delegates opaque authority, revision-read, and persistence values exactly once", async () => {
    const fixture = dependencies();
    const runtime = runtimeModule.createDecisionApplicationRuntime(fixture.dependencies as never);
    const opaqueReference = reference();
    const opaqueRevisionId = " revision id / no runtime normalization ";
    const submitted = revision();

    await expect(runtime.resolveAuthoritativeState(opaqueReference)).resolves.toBe(fixture.resolved);
    await expect(runtime.readDecisionContextRevision(opaqueRevisionId)).resolves.toBe(fixture.storedRevision);
    await expect(runtime.persistDecisionContextRevision(submitted)).resolves.toBe(fixture.persistedRevision);

    expect(fixture.authorityCalls).toEqual([opaqueReference]);
    expect(fixture.authorityCalls[0]).toBe(opaqueReference);
    expect(fixture.revisionCalls).toEqual([opaqueRevisionId]);
    expect(fixture.persistenceCalls).toEqual([submitted]);
    expect(fixture.resolved.payload).toEqual({ opaque: "authority result" });
  });

  it("passes absence and the exact captured error objects through without fallback, repair, or error remapping", async () => {
    const authorityError = new Error("sealed authority failure");
    const persistenceError = new Error("sealed persistence failure");
    let revisionCalls = 0;
    const runtime = runtimeModule.createDecisionApplicationRuntime({
      authoritativeStateReader: { resolve: async () => { throw authorityError; } } as BoundAuthoritativeStateReader,
      getRevisionById: async () => { revisionCalls += 1; return null; },
      revisionPersister: { persist: async () => { throw persistenceError; } } as BoundDecisionContextRevisionPersister
    });

    await expect(runtime.resolveAuthoritativeState(reference())).rejects.toBe(authorityError);
    await expect(runtime.readDecisionContextRevision(" absent / opaque ")).resolves.toBeNull();
    await expect(runtime.persistDecisionContextRevision(revision())).rejects.toBe(persistenceError);
    expect(revisionCalls).toBe(1);
  });

  it("captures all three dependency methods at construction and does not follow later replacement of a method or container field", async () => {
    const fixture = dependencies();
    const container = fixture.dependencies;
    const runtime = runtimeModule.createDecisionApplicationRuntime(container as never);
    const replacementError = new Error("replacement must not run");
    fixture.authoritativeStateReader.resolve = async () => { throw replacementError; };
    container.getRevisionById = async () => { throw replacementError; };
    fixture.revisionPersister.persist = async () => { throw replacementError; };
    container.authoritativeStateReader = { resolve: async () => { throw replacementError; } } as BoundAuthoritativeStateReader;
    container.revisionPersister = { persist: async () => { throw replacementError; } } as BoundDecisionContextRevisionPersister;

    await expect(runtime.resolveAuthoritativeState(reference())).resolves.toBe(fixture.resolved);
    await expect(runtime.readDecisionContextRevision("opaque revision")).resolves.toBe(fixture.storedRevision);
    await expect(runtime.persistDecisionContextRevision(revision())).resolves.toBe(fixture.persistedRevision);
    expect(fixture.authorityCalls).toHaveLength(1);
    expect(fixture.revisionCalls).toEqual(["opaque revision"]);
    expect(fixture.persistenceCalls).toHaveLength(1);
  });

  it("rejects hostile dependency representation without executing getters", () => {
    let getterCalls = 0;
    const valid = dependencies().dependencies;
    const accessorTopLevel = {} as Hostile;
    Object.defineProperty(accessorTopLevel, "authoritativeStateReader", { enumerable: true, get: () => { getterCalls += 1; return valid.authoritativeStateReader; } });
    Object.defineProperty(accessorTopLevel, "getRevisionById", { enumerable: true, value: valid.getRevisionById });
    Object.defineProperty(accessorTopLevel, "revisionPersister", { enumerable: true, value: valid.revisionPersister });
    expect(() => runtimeModule.createDecisionApplicationRuntime(accessorTopLevel as never)).toThrow("ERR_DECISION_RUNTIME_DEPENDENCIES_INVALID");

    const readerAccessor = {} as Hostile;
    Object.defineProperty(readerAccessor, "resolve", { enumerable: true, get: () => { getterCalls += 1; return valid.authoritativeStateReader.resolve; } });
    expect(() => runtimeModule.createDecisionApplicationRuntime({ ...valid, authoritativeStateReader: readerAccessor as never })).toThrow("ERR_DECISION_RUNTIME_DEPENDENCIES_INVALID");

    const persisterAccessor = {} as Hostile;
    Object.defineProperty(persisterAccessor, "persist", { enumerable: true, get: () => { getterCalls += 1; return valid.revisionPersister.persist; } });
    expect(() => runtimeModule.createDecisionApplicationRuntime({ ...valid, revisionPersister: persisterAccessor as never })).toThrow("ERR_DECISION_RUNTIME_DEPENDENCIES_INVALID");
    expect(getterCalls).toBe(0);
  });

  it("rejects symbols, hidden or extra fields, missing fields, and malformed dependency functions with the sole runtime-owned error", () => {
    const valid = dependencies().dependencies;
    const symbol = { ...valid } as Hostile; Object.defineProperty(symbol, Symbol("hidden symbol"), { enumerable: true, value: true });
    const hidden = { ...valid } as Hostile; Object.defineProperty(hidden, "hidden", { enumerable: false, value: true });
    const extra = { ...valid, extra: true };
    const missing = { authoritativeStateReader: valid.authoritativeStateReader, getRevisionById: valid.getRevisionById };
    const badRead = { ...valid, getRevisionById: "not a function" };
    const badReader = { ...valid, authoritativeStateReader: { resolve: "not a function" } };
    const badPersister = { ...valid, revisionPersister: { persist: "not a function" } };
    for (const value of [null, [], symbol, hidden, extra, missing, badRead, badReader, badPersister]) {
      expect(() => runtimeModule.createDecisionApplicationRuntime(value as never)).toThrow("ERR_DECISION_RUNTIME_DEPENDENCIES_INVALID");
    }
  });

  it("exposes exactly the narrow R1 runtime surface and one owned error while containing no transport, infrastructure, governance, domain-construction, temporal, model, or application-state semantics", () => {
    const runtime = runtimeModule.createDecisionApplicationRuntime(dependencies().dependencies as never);
    expect(Object.keys(runtime).sort()).toEqual(["persistDecisionContextRevision", "readDecisionContextRevision", "resolveAuthoritativeState"]);
    expect(Object.keys(runtimeModule).sort()).toEqual(["createDecisionApplicationRuntime"]);
    const source = r1ProductionFiles.map((file) => readFileSync(resolve(process.cwd(), file), "utf8")).join("\n");
    expect([...new Set(source.match(/ERR_DECISION_RUNTIME_[A-Z_]+/g) ?? [])]).toEqual(["ERR_DECISION_RUNTIME_DEPENDENCIES_INVALID"]);
    expect(source).not.toMatch(/lib\/career|career_decisions|career_commitments|career_actions|career_outcomes|career_feedback|career_learning|JobRepository|lib\/decision-adapters|postgres|drizzle|next|app\/api|process\.env|node:fs|http|OpenAI|Anthropic|Gemini|Mistral|provider|evaluator|model|LLM|Date\.now|new Date|Math\.random|randomUUID|setTimeout|cron|scheduler|current|head|latest|active|DecisionCase|DecisionSession|DecisionJob|Workflow|StateMachine|Command log|Event log|Correlation|Idempotency|createDecisionContext|createHuman|createAction|createObservation|createDecisionLoop|assembleDecision|buildDecision/i);
  });
});
