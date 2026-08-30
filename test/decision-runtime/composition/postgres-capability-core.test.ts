import { createHash, randomBytes } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as compositionModule from "../../../lib/decision-runtime/composition";
import * as r1Module from "../../../lib/decision-runtime";
import {
  CAPABILITY_CORE_AUTHORITY_CONTRACT_ID,
  CAPABILITY_CORE_PRODUCER_ID
} from "../../../lib/decision-adapters/capability-core";
import {
  assembleDecisionContextValidation,
  createDecisionContextDraft,
  createDecisionContextRevision,
  createStructuralExpectation,
  reconstructStructuralGap,
  type DecisionContextDraft,
  type DecisionContextRevision,
  type DecisionContextValidationAssemblyInput
} from "../../../lib/decision-core";
import {
  buildSnapshotId,
  computeSnapshotKey,
  createVerifiedCapabilitySnapshot,
  type VerifiedCapabilitySnapshot
} from "../../../lib/career/capability-core";

const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/condyn";
const schemaName = `decision_runtime_r2_${randomBytes(10).toString("hex")}`;
const clients = new Set<Sql>();
let admin: Sql;
let sequence = 0;

const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : entry.name.endsWith(".ts") ? [join(directory, entry.name)] : []);
const next = () => `R2_${sequence += 1}`;
const emptyInput = (): DecisionContextValidationAssemblyInput => ({ expectationValidations: [], consequenceValidations: [] });
const draft = (seed = next()): DecisionContextDraft => createDecisionContextDraft({
  sourceStateReferences: [],
  items: [{ role: "DECISION_QUESTION", statement: `Proceed ${seed}?`, provenance: { origin: "HUMAN_INPUT", actorId: "runtime" } }]
});
const revision = (context: DecisionContextDraft, previousRevisionId: string | null = null, input = emptyInput()) => createDecisionContextRevision({ previousRevisionId, context, validationInput: input, validationAssembly: assembleDecisionContextValidation(context, input) });
const evidenceRevision = (rationale: string): DecisionContextRevision => {
  const stateReference = { producerId: "R2_PRODUCER", authorityContractId: "R2_CONTRACT", artifactId: "R2_ARTIFACT", locator: "R2_LOCATOR" };
  const context = createDecisionContextDraft({ sourceStateReferences: [stateReference], items: [
    { role: "DECISION_QUESTION", statement: "Proceed evidence?", provenance: { origin: "HUMAN_INPUT", actorId: "runtime" } },
    { role: "OBJECTIVE", statement: "Protect evidence.", provenance: { origin: "HUMAN_INPUT", actorId: "runtime" } }
  ] });
  const objective = context.items.find((item) => item.role === "OBJECTIVE"); if (objective === undefined) throw new Error("objective missing");
  const bindingId = `EBIND_${createHash("sha256").update(JSON.stringify(["SEMANTIC_EVIDENCE_BINDING_V1", context.contextId, objective.itemId, [stateReference.producerId, stateReference.authorityContractId, stateReference.artifactId, stateReference.locator], "NOT_SUPPORTED"]), "utf8").digest("hex").slice(0, 24).toUpperCase()}`;
  const expectation = createStructuralExpectation(context, { kind: "EVIDENCE_BINDING", subjectItemId: objective.itemId, acceptedDispositions: ["SUPPORTED"], provenance: { origin: "HUMAN_INPUT", actorId: "expectation" } });
  const basis = { kind: "EVIDENCE_BINDING" as const, bindings: [{ bindingId, contextId: context.contextId, itemId: objective.itemId, stateReference, disposition: "NOT_SUPPORTED" as const, rationale }] };
  const gap = reconstructStructuralGap(context, expectation, basis); if (gap === null) throw new Error("gap missing");
  const input = { expectationValidations: [{ expectation, basis, result: gap }], consequenceValidations: [] };
  return revision(context, null, input);
};

const phase4Snapshot = (): VerifiedCapabilitySnapshot => {
  const generic = createVerifiedCapabilitySnapshot({ sourceBundleHash: "source", kernelVersion: "kernel", prompt: { checksum: "prompt" }, inference: { provider: "test", model: "test" }, schemaVersion: "snapshot", candidateCount: 0, rejectedCandidateCount: 0, createdAt: "2026-01-01T00:00:00.000Z", status: "VERIFIED" }, [], []);
  const publication = { mode: "PHASE4_VERIFIED" as const, verificationRunId: "VFY_0123456789ABCDEF01234567", verificationRawOutputHash: "a".repeat(64) };
  return { ...generic, publication, snapshotId: buildSnapshotId({ ...generic, publication }) };
};
const referenceFor = (snapshot: VerifiedCapabilitySnapshot) => ({ producerId: CAPABILITY_CORE_PRODUCER_ID, authorityContractId: CAPABILITY_CORE_AUTHORITY_CONTRACT_ID, artifactId: snapshot.snapshotId, locator: computeSnapshotKey(snapshot) });
const capabilityRepository = (snapshot: VerifiedCapabilitySnapshot | null) => ({ getSnapshotByKey: async (key: string) => snapshot !== null && key === computeSnapshotKey(snapshot) ? structuredClone(snapshot) : null });
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

describe("PostgreSQL + Capability Authority Decision Runtime composition", () => {
  it("provisions exactly the sealed revision table idempotently without Career tables or extra columns", async () => {
    const { client, database } = await createClient();
    await client.unsafe("DROP TABLE IF EXISTS decision_context_revisions");
    await compositionModule.ensureDecisionRuntimePostgresSchema(database);
    await compositionModule.ensureDecisionRuntimePostgresSchema(database);
    const columns = await client.unsafe("SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'decision_context_revisions' ORDER BY column_name");
    expect(columns).toEqual([
      { column_name: "payload", is_nullable: "NO", data_type: "jsonb" },
      { column_name: "previous_revision_id", is_nullable: "YES", data_type: "text" },
      { column_name: "revision_id", is_nullable: "NO", data_type: "text" }
    ]);
    const constraints = await client.unsafe("SELECT contype, confdeltype FROM pg_constraint WHERE conrelid = 'decision_context_revisions'::regclass ORDER BY contype");
    expect(constraints.some((row) => row.contype === "p")).toBe(true);
    expect(constraints.some((row) => row.contype === "f" && row.confdeltype !== "c")).toBe(true);
    const careerTables = await client.unsafe("SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema() AND table_name LIKE 'career%'");
    expect(careerTables).toEqual([]);
    await client.end({ timeout: 5 }); clients.delete(client);
  });

  it("composes the sealed capability authority adapter and real PostgreSQL 5D2A persistence through exactly the R1 runtime surface", async () => {
    const { client, database } = await createClient();
    await compositionModule.ensureDecisionRuntimePostgresSchema(database);
    const snapshot = phase4Snapshot();
    const dependencies = { database, capabilityRepository: capabilityRepository(snapshot) };
    const runtime = compositionModule.createPostgresCapabilityDecisionApplicationRuntime(dependencies);
    expect(Object.keys(runtime).sort()).toEqual(["persistDecisionContextRevision", "readDecisionContextRevision", "resolveAuthoritativeState"]);
    await expect(runtime.resolveAuthoritativeState(referenceFor(snapshot))).resolves.toMatchObject({ reference: referenceFor(snapshot), payload: snapshot });
    await expect(compositionModule.createPostgresCapabilityDecisionApplicationRuntime({ database, capabilityRepository: capabilityRepository(null) }).resolveAuthoritativeState(referenceFor(snapshot))).rejects.toThrow("ERR_DECISION_AUTHORITY_STATE_NOT_FOUND");

    const absent = revision(draft());
    await expect(runtime.readDecisionContextRevision(absent.revisionId)).resolves.toBeNull();
    const orphanParent = revision(draft()); const orphan = revision(orphanParent.context, orphanParent.revisionId);
    await expect(runtime.persistDecisionContextRevision(orphan)).rejects.toThrow("ERR_DECISION_CONTEXT_REVISION_PARENT_NOT_FOUND");
    const root = revision(draft()); await expect(runtime.persistDecisionContextRevision(root)).resolves.toEqual(root);
    await expect(runtime.readDecisionContextRevision(root.revisionId)).resolves.toEqual(root);
    const child = revision(root.context, root.revisionId); await expect(runtime.persistDecisionContextRevision(child)).resolves.toEqual(child);
    const first = evidenceRevision("first rationale"); const second = evidenceRevision("second rationale");
    expect(first.revisionId).toBe(second.revisionId);
    await expect(runtime.persistDecisionContextRevision(first)).resolves.toEqual(first);
    await expect(runtime.persistDecisionContextRevision(second)).rejects.toThrow("ERR_DECISION_CONTEXT_REVISION_IMMUTABLE_CONFLICT");

    dependencies.capabilityRepository = capabilityRepository(null);
    dependencies.database = {} as typeof database;
    await expect(runtime.resolveAuthoritativeState(referenceFor(snapshot))).resolves.toMatchObject({ payload: snapshot });
    await expect(runtime.readDecisionContextRevision(root.revisionId)).resolves.toEqual(root);
    await client.end({ timeout: 5 }); clients.delete(client);
  });

  it("rejects hostile R2 dependency containers without getter execution and owns only construction-shape errors", () => {
    let getterCalls = 0;
    const topAccessor = {} as Record<PropertyKey, unknown>;
    Object.defineProperty(topAccessor, "database", { enumerable: true, get: () => { getterCalls += 1; return {}; } });
    Object.defineProperty(topAccessor, "capabilityRepository", { enumerable: true, value: {} });
    expect(() => compositionModule.createPostgresCapabilityDecisionApplicationRuntime(topAccessor as never)).toThrow("ERR_DECISION_RUNTIME_COMPOSITION_DEPENDENCIES_INVALID");
    const validShape = { database: {}, capabilityRepository: {} };
    const symbol = { ...validShape } as Record<PropertyKey, unknown>; Object.defineProperty(symbol, Symbol("symbol"), { enumerable: true, value: true });
    const hidden = { ...validShape } as Record<PropertyKey, unknown>; Object.defineProperty(hidden, "hidden", { enumerable: false, value: true });
    const extra = { ...validShape, extra: true };
    const missing = { database: {} };
    for (const value of [null, [], symbol, hidden, extra, missing]) expect(() => compositionModule.createPostgresCapabilityDecisionApplicationRuntime(value as never)).toThrow("ERR_DECISION_RUNTIME_COMPOSITION_DEPENDENCIES_INVALID");
    expect(getterCalls).toBe(0);
  });

  it("exports only the two R2 values, keeps sealed R1 byte-identical, and contains no Career, transport, environment, connection, semantic-construction, model, or application-state behavior", () => {
    expect(Object.keys(compositionModule).sort()).toEqual(["createPostgresCapabilityDecisionApplicationRuntime", "ensureDecisionRuntimePostgresSchema"]);
    expect(Object.keys(r1Module).sort()).toEqual(["createDecisionApplicationRuntime"]);
    expect(createHash("sha256").update(readFileSync(resolve(process.cwd(), "lib/decision-runtime/types.ts"))).digest("hex")).toBe("f2501ded25126f10dc054a18554be091e57dd70f5b7c301648f6e1965a9ae92f");
    expect(createHash("sha256").update(readFileSync(resolve(process.cwd(), "lib/decision-runtime/runtime.ts"))).digest("hex")).toBe("c08023aa60de3de8b4d5c8be08038e618eb9541451c48935701507f021a72593");
    expect(createHash("sha256").update(readFileSync(resolve(process.cwd(), "lib/decision-runtime/index.ts"))).digest("hex")).toBe("768c8b40b468db7c328d2a7a868d2e49acc527ad7acc2d8a45ac6d3e7afee082");
    expect(createHash("sha256").update(readFileSync(resolve(process.cwd(), "test/decision-runtime/runtime.test.ts"))).digest("hex")).toBe("e3721ac4a844e3a615a7b648771c16f1fe762242b1c97271ab56879cb433460b");
    const source = sourceFiles(resolve(process.cwd(), "lib/decision-runtime/composition")).map((file) => readFileSync(file, "utf8")).join("\n");
    expect([...new Set(source.match(/ERR_DECISION_RUNTIME_COMPOSITION_[A-Z_]+/g) ?? [])]).toEqual(["ERR_DECISION_RUNTIME_COMPOSITION_DEPENDENCIES_INVALID"]);
    expect(source).not.toMatch(/(?:from\s+["'][^"']*(?:lib\/career|\.\.\/career)[^"']*["']|career db|initDbSchema|JobRepository|from\s+["'][^"']*(?:next|app\/api|worker|queue)[^"']*["']|process\.env|postgres\(|\.end\(|createDecisionContextDraft|createDecisionContextRevision\(|createHumanDecision|createDecisionAction|createHumanCommitment|createActionOccurrence|createObservation|createDecisionLoop|\bprovider\b|\bmodel\b|\bevaluator\b|\bLLM\b|\bcurrent\s*(?:Revision|=)|\bhead\s*(?:Revision|=)|\blatest\s*(?:Revision|=)|\bactive\s*(?:Revision|=)|DecisionCase|DecisionSession|DecisionJob|Workflow|StateMachine|Command log|Event log|Correlation|Idempotency)/i);
  });
});
