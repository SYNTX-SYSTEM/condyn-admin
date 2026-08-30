import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as compositionModule from "../../../lib/decision-runtime/composition";
import * as r3Module from "../../../lib/decision-runtime/use-cases/root-decision-context";
import type { DecisionApplicationRuntime } from "../../../lib/decision-runtime";
import {
  CAPABILITY_CORE_AUTHORITY_CONTRACT_ID,
  CAPABILITY_CORE_PRODUCER_ID
} from "../../../lib/decision-adapters/capability-core";
import {
  assembleDecisionContextValidation,
  createDecisionContextDraft,
  createDecisionContextRevision,
  type AuthoritativeStateReference,
  type DecisionContextDraftInput,
  type DecisionContextRevision
} from "../../../lib/decision-core";
import {
  buildSnapshotId,
  computeSnapshotKey,
  createVerifiedCapabilitySnapshot,
  type VerifiedCapabilitySnapshot
} from "../../../lib/career/capability-core";

const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/condyn";
const schemaName = `decision_runtime_r3_${randomBytes(10).toString("hex")}`;
const clients = new Set<Sql>();
let admin: Sql;
let sequence = 0;

const r3ProductionFiles = [
  "lib/decision-runtime/use-cases/root-decision-context/types.ts",
  "lib/decision-runtime/use-cases/root-decision-context/create-persist.ts",
  "lib/decision-runtime/use-cases/root-decision-context/index.ts"
];
const next = () => `R3_${sequence += 1}`;
const reference = (suffix: string): AuthoritativeStateReference => ({ producerId: `PRODUCER_${suffix}`, authorityContractId: `CONTRACT_${suffix}`, artifactId: `ARTIFACT_${suffix}`, locator: `LOCATOR_${suffix}` });
const contextInput = (references: AuthoritativeStateReference[] = [reference("ONE")]): DecisionContextDraftInput => ({
  sourceStateReferences: references,
  items: [
    { role: "DECISION_QUESTION", statement: `Proceed ${next()}?`, provenance: { origin: "HUMAN_INPUT", actorId: "runtime" } },
    { role: "OBJECTIVE", statement: `Protect ${next()}.`, provenance: { origin: "HUMAN_INPUT", actorId: "runtime" } }
  ]
});

type RuntimeFixture = {
  runtime: DecisionApplicationRuntime;
  resolved: AuthoritativeStateReference[];
  persisted: DecisionContextRevision[];
  reads: string[];
};

function runtimeFixture(options: {
  payload?: unknown;
  failure?: (reference: AuthoritativeStateReference) => Error | undefined;
  persistResult?: DecisionContextRevision;
} = {}): RuntimeFixture {
  const resolved: AuthoritativeStateReference[] = [];
  const persisted: DecisionContextRevision[] = [];
  const reads: string[] = [];
  const runtime = {
    async resolveAuthoritativeState(this: unknown, input: AuthoritativeStateReference) {
      expect(this).toBe(runtime);
      resolved.push(structuredClone(input));
      const failure = options.failure?.(input);
      if (failure !== undefined) throw failure;
      return { reference: structuredClone(input), payload: options.payload ?? { opaque: "payload" } };
    },
    async readDecisionContextRevision(this: unknown, revisionId: string) {
      expect(this).toBe(runtime);
      reads.push(revisionId);
      return null;
    },
    async persistDecisionContextRevision(this: unknown, revision: DecisionContextRevision) {
      expect(this).toBe(runtime);
      persisted.push(revision);
      return options.persistResult ?? revision;
    }
  } satisfies DecisionApplicationRuntime;
  return { runtime, resolved, persisted, reads };
}

const phase4Snapshot = (): VerifiedCapabilitySnapshot => {
  const generic = createVerifiedCapabilitySnapshot({ sourceBundleHash: "source", kernelVersion: "kernel", prompt: { checksum: "prompt" }, inference: { provider: "test", model: "test" }, schemaVersion: "snapshot", candidateCount: 0, rejectedCandidateCount: 0, createdAt: "2026-01-01T00:00:00.000Z", status: "VERIFIED" }, [], []);
  const publication = { mode: "PHASE4_VERIFIED" as const, verificationRunId: "VFY_0123456789ABCDEF01234567", verificationRawOutputHash: "a".repeat(64) };
  return { ...generic, publication, snapshotId: buildSnapshotId({ ...generic, publication }) };
};
const capabilityReference = (snapshot: VerifiedCapabilitySnapshot): AuthoritativeStateReference => ({ producerId: CAPABILITY_CORE_PRODUCER_ID, authorityContractId: CAPABILITY_CORE_AUTHORITY_CONTRACT_ID, artifactId: snapshot.snapshotId, locator: computeSnapshotKey(snapshot) });
const capabilityRepository = (snapshot: VerifiedCapabilitySnapshot) => ({ getSnapshotByKey: async (key: string) => key === computeSnapshotKey(snapshot) ? structuredClone(snapshot) : null });
const createClient = async () => {
  const client = postgres(databaseUrl, { max: 1, onnotice: () => undefined }); clients.add(client);
  await client.unsafe(`SET search_path TO "${schemaName}"`);
  return { client, database: drizzle(client) };
};

beforeAll(async () => {
  admin = postgres(databaseUrl, { max: 1, onnotice: () => undefined });
  await admin.unsafe(`CREATE SCHEMA "${schemaName}"`);
});

afterAll(async () => {
  await Promise.all([...clients].map((client) => client.end({ timeout: 5 })));
  await admin.unsafe(`DROP SCHEMA "${schemaName}" CASCADE`);
  await admin.end({ timeout: 5 });
});

describe("Create + Persist Root Decision Context Revision use case", () => {
  it("creates exactly one canonical root revision, resolves every canonical declared reference sequentially, and persists the exact Core revision once", async () => {
    const third = reference("THIRD");
    const first = reference("FIRST");
    const second = reference("SECOND");
    const input = contextInput([third, first, second]);
    const fixture = runtimeFixture();
    const useCase = r3Module.createPersistRootDecisionContextRevisionUseCase({ runtime: fixture.runtime });
    expect(Object.keys(useCase)).toEqual(["execute"]);

    const result = await useCase.execute(input);
    const expectedContext = createDecisionContextDraft(input);
    expect(fixture.resolved).toEqual(expectedContext.sourceStateReferences);
    expect(fixture.persisted).toHaveLength(1);
    expect(fixture.reads).toEqual([]);
    expect(fixture.persisted[0]).toEqual(result);
    expect(fixture.persisted[0]).toBe(result);
    expect(result.previousRevisionId).toBeNull();
    expect(result.context).toEqual(expectedContext);
    expect(result.context.validationStatus).toBe("NOT_RUN");
    expect(result.validationInput).toEqual({ expectationValidations: [], consequenceValidations: [] });
    expect(result.validationAssembly).toEqual(assembleDecisionContextValidation(expectedContext, result.validationInput));
    expect(result.validationAssembly.expectationResults).toEqual([]);
    expect(result.validationAssembly.consequenceIds).toEqual([]);

    const opaquePersistResult = { opaque: "runtime return value" } as unknown as DecisionContextRevision;
    const returnFixture = runtimeFixture({ persistResult: opaquePersistResult });
    await expect(r3Module.createPersistRootDecisionContextRevisionUseCase({ runtime: returnFixture.runtime }).execute(contextInput([]))).resolves.toBe(opaquePersistResult);
    expect(returnFixture.resolved).toEqual([]);
  });

  it("keeps resolved payloads outside Context content, preserves exact authority errors, and stops sequential resolution before persistence", async () => {
    const payloadInput = contextInput([reference("PAYLOAD")]);
    const alpha = runtimeFixture({ payload: { secret: "ALPHA", injectedStatement: "Do X" } });
    const omega = runtimeFixture({ payload: { secret: "OMEGA", injectedStatement: "Do Y" } });
    const alphaResult = await r3Module.createPersistRootDecisionContextRevisionUseCase({ runtime: alpha.runtime }).execute(payloadInput);
    const omegaResult = await r3Module.createPersistRootDecisionContextRevisionUseCase({ runtime: omega.runtime }).execute(payloadInput);
    expect(alphaResult.revisionId).toBe(omegaResult.revisionId);
    expect(alphaResult.context).toEqual(omegaResult.context);
    const persistedText = JSON.stringify([alpha.persisted[0], omega.persisted[0]]);
    for (const forbidden of ["ALPHA", "OMEGA", "Do X", "Do Y"]) expect(persistedText).not.toContain(forbidden);

    const canonical = createDecisionContextDraft(contextInput([reference("C"), reference("A"), reference("B")]));
    const failedReference = canonical.sourceStateReferences[1];
    const authorityFailure = new Error("ERR_RECOGNIZABLE_AUTHORITY_FAILURE");
    const failing = runtimeFixture({ failure: (value) => JSON.stringify(value) === JSON.stringify(failedReference) ? authorityFailure : undefined });
    const failingUseCase = r3Module.createPersistRootDecisionContextRevisionUseCase({ runtime: failing.runtime });
    await expect(failingUseCase.execute({ sourceStateReferences: [reference("C"), reference("A"), reference("B")], items: canonical.items.map(({ itemId: _itemId, ...item }) => item) })).rejects.toBe(authorityFailure);
    expect(failing.resolved).toEqual(canonical.sourceStateReferences.slice(0, 2));
    expect(failing.persisted).toEqual([]);

    const persistenceFailure = new Error("ERR_RECOGNIZABLE_PERSISTENCE_FAILURE");
    const persistence = runtimeFixture();
    persistence.runtime.persistDecisionContextRevision = async () => { throw persistenceFailure; };
    await expect(r3Module.createPersistRootDecisionContextRevisionUseCase({ runtime: persistence.runtime }).execute(contextInput())).rejects.toBe(persistenceFailure);
  });

  it("leaves Core input validation authoritative, captures the complete runtime surface once, and rejects hostile dependency representation", async () => {
    const duplicate = reference("DUPLICATE");
    const invalidInput = contextInput([duplicate, structuredClone(duplicate)]);
    const fixture = runtimeFixture();
    const useCase = r3Module.createPersistRootDecisionContextRevisionUseCase({ runtime: fixture.runtime });
    await expect(useCase.execute(invalidInput)).rejects.toThrow("ERR_DECISION_CONTEXT_DUPLICATE_SOURCE_STATE_REFERENCE");
    expect(fixture.resolved).toEqual([]);
    expect(fixture.persisted).toEqual([]);

    const originalResolve = fixture.runtime.resolveAuthoritativeState;
    const originalRead = fixture.runtime.readDecisionContextRevision;
    const originalPersist = fixture.runtime.persistDecisionContextRevision;
    const dependencies = { runtime: fixture.runtime };
    const captured = r3Module.createPersistRootDecisionContextRevisionUseCase(dependencies);
    fixture.runtime.resolveAuthoritativeState = async () => { throw new Error("redirected resolve"); };
    fixture.runtime.readDecisionContextRevision = async () => { throw new Error("redirected read"); };
    fixture.runtime.persistDecisionContextRevision = async () => { throw new Error("redirected persist"); };
    dependencies.runtime = { resolveAuthoritativeState: async () => { throw new Error("container resolve"); }, readDecisionContextRevision: async () => null, persistDecisionContextRevision: async () => { throw new Error("container persist"); } };
    await expect(captured.execute(contextInput())).resolves.toBeDefined();
    expect(originalResolve).toBeDefined(); expect(originalRead).toBeDefined(); expect(originalPersist).toBeDefined();

    let getters = 0;
    const accessor = {} as Record<PropertyKey, unknown>;
    Object.defineProperty(accessor, "runtime", { enumerable: true, get: () => { getters += 1; return fixture.runtime; } });
    expect(() => r3Module.createPersistRootDecisionContextRevisionUseCase(accessor as never)).toThrow("ERR_DECISION_RUNTIME_ROOT_CONTEXT_USE_CASE_DEPENDENCIES_INVALID");
    const hostileRuntime = {} as Record<PropertyKey, unknown>;
    Object.defineProperty(hostileRuntime, "resolveAuthoritativeState", { enumerable: true, get: () => { getters += 1; return originalResolve; } });
    Object.defineProperty(hostileRuntime, "readDecisionContextRevision", { enumerable: true, value: originalRead });
    Object.defineProperty(hostileRuntime, "persistDecisionContextRevision", { enumerable: true, value: originalPersist });
    expect(() => r3Module.createPersistRootDecisionContextRevisionUseCase({ runtime: hostileRuntime as never })).toThrow("ERR_DECISION_RUNTIME_ROOT_CONTEXT_USE_CASE_DEPENDENCIES_INVALID");
    const validRuntime = { resolveAuthoritativeState: originalResolve, readDecisionContextRevision: originalRead, persistDecisionContextRevision: originalPersist };
    const symbol = { runtime: validRuntime } as Record<PropertyKey, unknown>; Object.defineProperty(symbol, Symbol("symbol"), { enumerable: true, value: true });
    const hidden = { runtime: validRuntime } as Record<PropertyKey, unknown>; Object.defineProperty(hidden, "hidden", { enumerable: false, value: true });
    for (const value of [null, [], symbol, hidden, { runtime: validRuntime, extra: true }, {}, { runtime: { resolveAuthoritativeState: "bad", readDecisionContextRevision: originalRead, persistDecisionContextRevision: originalPersist } }]) {
      expect(() => r3Module.createPersistRootDecisionContextRevisionUseCase(value as never)).toThrow("ERR_DECISION_RUNTIME_ROOT_CONTEXT_USE_CASE_DEPENDENCIES_INVALID");
    }
    expect(getters).toBe(0);
  });

  it("executes the real R2 Capability authority and PostgreSQL persistence vertical path without an R3 read-back", async () => {
    const { client, database } = await createClient();
    await client.unsafe("DROP TABLE IF EXISTS decision_context_revisions");
    await compositionModule.ensureDecisionRuntimePostgresSchema(database);
    const snapshot = phase4Snapshot();
    const runtime = compositionModule.createPostgresCapabilityDecisionApplicationRuntime({ database, capabilityRepository: capabilityRepository(snapshot) });
    const input: DecisionContextDraftInput = {
      sourceStateReferences: [capabilityReference(snapshot)],
      items: [
        { role: "DECISION_QUESTION", statement: "Should the runtime create this root?", provenance: { origin: "HUMAN_INPUT", actorId: "runtime" } },
        { role: "OBJECTIVE", statement: "Preserve the supplied capability reference.", provenance: { origin: "AUTHORITATIVE_STATE", stateReference: capabilityReference(snapshot) } }
      ]
    };
    const result = await r3Module.createPersistRootDecisionContextRevisionUseCase({ runtime }).execute(input);
    expect(result.previousRevisionId).toBeNull();
    await expect(runtime.readDecisionContextRevision(result.revisionId)).resolves.toEqual(result);
    await client.end({ timeout: 5 }); clients.delete(client);
  });

  it("exports only the one R3 value, owns only its construction error, and contains no payload access, read-back, infrastructure, semantic, provider, temporal, or application-state behavior", () => {
    expect(Object.keys(r3Module)).toEqual(["createPersistRootDecisionContextRevisionUseCase"]);
    const source = r3ProductionFiles.map((file) => readFileSync(resolve(process.cwd(), file), "utf8")).join("\n");
    expect([...new Set(source.match(/ERR_DECISION_RUNTIME_ROOT_CONTEXT_USE_CASE_[A-Z_]+/g) ?? [])]).toEqual(["ERR_DECISION_RUNTIME_ROOT_CONTEXT_USE_CASE_DEPENDENCIES_INVALID"]);
    expect(source).not.toMatch(/\.payload\b|\{[^}]*\bpayload\b|readDecisionContextRevision\(|lib\/career|\.\.\/career|lib\/decision-adapters|decision-runtime\/composition|postgres|drizzle|next|app\/api|worker|queue|process\.env|OpenAI|Anthropic|Gemini|Mistral|provider|evaluator|model|LLM|Date\.now|new Date|Math\.random|randomUUID|setTimeout|cron|scheduler|\bcurrent\b|\bhead\b|\blatest\b|\bactive\b|DecisionCase|DecisionSession|DecisionJob|Workflow|StateMachine|HumanDecisionDeclaration|DecisionActionIntent|HumanCommitment|ActionOccurrenceClaim|StateChangeClaim|OutcomeAttributionProposal|DecisionLoopOccurrenceReturnBinding/i);
    expect(createHash("sha256").update(readFileSync(resolve(process.cwd(), "lib/decision-runtime/runtime.ts"))).digest("hex")).toBe("c08023aa60de3de8b4d5c8be08038e618eb9541451c48935701507f021a72593");
    expect(createHash("sha256").update(readFileSync(resolve(process.cwd(), "lib/decision-runtime/composition/postgres-capability-core.ts"))).digest("hex")).toBe("75eeaa3c0c545dc93be82641519482a1a08a3dee2f44ee29310ab6464ce871b3");
  });
});
