import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDecisionContextDraft, type AuthoritativeStateReference, type DecisionContextDraftInput } from "../../../lib/decision-core";
import {
  CAPABILITY_CORE_AUTHORITY_CONTRACT_ID,
  CAPABILITY_CORE_PRODUCER_ID
} from "../../../lib/decision-adapters/capability-core";
import {
  buildSnapshotId,
  computeSnapshotKey,
  createVerifiedCapabilitySnapshot,
  type VerifiedCapabilitySnapshot
} from "../../../lib/career/capability-core";

const databaseBasis = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/condyn";
const databaseName = `condyn_r5_${randomBytes(10).toString("hex")}`;
const AUTHORITY_PAYLOAD_ONLY_MARKER = "R5_AUTHORITY_PAYLOAD_ONLY_MARKER_7F3A";
const databaseUrl = new URL(databaseBasis);
databaseUrl.pathname = `/${databaseName}`;
const administrativeUrl = new URL(databaseBasis);
administrativeUrl.pathname = "/postgres";

const legacyLifecycleTables = [
  "career_decisions",
  "career_commitments",
  "career_actions",
  "career_outcomes",
  "career_feedback",
  "career_attributions",
  "career_learning_proposals",
  "career_policy_versions",
  "career_policy_families",
  "career_policy_promotions",
  "career_analysis_jobs"
];

let administrativeClient: Sql;
let databaseClient: Sql;
let server: ChildProcess;
let port: number;
let serverOutput = "";
let readinessResponse: { status: number; body: unknown };
let seededSnapshot: VerifiedCapabilitySnapshot;

const appendOutput = (chunk: Buffer) => {
  serverOutput = `${serverOutput}${chunk.toString("utf8")}`.slice(-16_000);
};

const delay = (milliseconds: number) => new Promise<void>((resolveDelay) => setTimeout(resolveDelay, milliseconds));

async function availablePort(): Promise<number> {
  const listener = createServer();
  await new Promise<void>((resolveListen, rejectListen) => {
    listener.once("error", rejectListen);
    listener.listen(0, "127.0.0.1", () => resolveListen());
  });
  const address = listener.address();
  if (address === null || typeof address === "string") throw new Error("R5 did not receive a TCP port.");
  await new Promise<void>((resolveClose, rejectClose) => listener.close((error) => error === undefined ? resolveClose() : rejectClose(error)));
  return address.port;
}

function phase4Snapshot(): VerifiedCapabilitySnapshot {
  const generic = createVerifiedCapabilitySnapshot(
    {
      sourceBundleHash: "source",
      kernelVersion: "kernel",
      prompt: { checksum: "prompt" },
      inference: { provider: "test", model: AUTHORITY_PAYLOAD_ONLY_MARKER },
      schemaVersion: "snapshot",
      candidateCount: 0,
      rejectedCandidateCount: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
      status: "VERIFIED"
    },
    [],
    []
  );
  const publication = {
    mode: "PHASE4_VERIFIED" as const,
    verificationRunId: "VFY_0123456789ABCDEF01234567",
    verificationRawOutputHash: "a".repeat(64)
  };
  return { ...generic, publication, snapshotId: buildSnapshotId({ ...generic, publication }) };
}

async function tableExists(name: string): Promise<boolean> {
  const rows = await databaseClient.unsafe(
    "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = $1) AS exists",
    [name]
  );
  return rows[0]?.exists === true;
}

async function revisionCount(): Promise<number> {
  const rows = await databaseClient.unsafe("SELECT COUNT(*)::int AS count FROM decision_context_revisions");
  return rows[0]?.count ?? 0;
}

async function waitForDecisionEndpoint(): Promise<{ status: number; body: unknown }> {
  const url = `http://127.0.0.1:${port}/api/decision-contexts/DREV_R5_READINESS_ABSENT`;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(url);
      const body = await response.json();
      if (response.status === 404) return { status: response.status, body };
    } catch {
      // The server is not ready until the actual endpoint returns its 404 envelope.
    }
    await delay(250);
  }
  throw new Error(`R5 Next server did not reach the Decision endpoint. Output:\n${serverOutput}`);
}

async function stopServer(): Promise<void> {
  if (server.exitCode !== null || server.signalCode !== null) return;
  server.kill("SIGTERM");
  await Promise.race([once(server, "exit"), delay(10_000)]);
  if (server.exitCode === null && server.signalCode === null) {
    server.kill("SIGKILL");
    await once(server, "exit");
  }
}

beforeAll(async () => {
  administrativeClient = postgres(administrativeUrl.toString(), { max: 1, onnotice: () => undefined });
  await administrativeClient.unsafe(`CREATE DATABASE "${databaseName}"`);
  databaseClient = postgres(databaseUrl.toString(), { max: 1, onnotice: () => undefined });
  await databaseClient.unsafe(`
    CREATE TABLE career_capability_snapshots (
      snapshot_id TEXT PRIMARY KEY,
      snapshot_key TEXT UNIQUE NOT NULL,
      source_bundle_hash TEXT NOT NULL,
      kernel_version TEXT NOT NULL,
      prompt_checksum TEXT NOT NULL,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      schema_version TEXT NOT NULL,
      status TEXT NOT NULL,
      payload JSONB NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
  seededSnapshot = phase4Snapshot();
  const snapshotKey = computeSnapshotKey(seededSnapshot);
  expect(JSON.stringify(seededSnapshot)).toContain(AUTHORITY_PAYLOAD_ONLY_MARKER);
  await databaseClient.unsafe(
    `INSERT INTO career_capability_snapshots (
      snapshot_id, snapshot_key, source_bundle_hash, kernel_version, prompt_checksum,
      provider, model, schema_version, status, payload, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      seededSnapshot.snapshotId,
      snapshotKey,
      seededSnapshot.sourceBundleHash,
      seededSnapshot.kernelVersion,
      seededSnapshot.prompt.checksum,
      seededSnapshot.inference.provider,
      seededSnapshot.inference.model,
      seededSnapshot.schemaVersion,
      seededSnapshot.status,
      JSON.stringify(seededSnapshot),
      seededSnapshot.createdAt
    ]
  );
  expect(await tableExists("decision_context_revisions")).toBe(false);
  port = await availablePort();
  server = spawn(
    process.execPath,
    [resolve(process.cwd(), "node_modules/next/dist/bin/next"), "dev", "-p", String(port), "-H", "127.0.0.1"],
    {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: databaseUrl.toString(), NEXT_TELEMETRY_DISABLED: "1" },
      stdio: ["ignore", "pipe", "pipe"]
    }
  );
  server.stdout?.on("data", appendOutput);
  server.stderr?.on("data", appendOutput);
  readinessResponse = await waitForDecisionEndpoint();
}, 90_000);

afterAll(async () => {
  if (server !== undefined) await stopServer();
  if (databaseClient !== undefined) await databaseClient.end({ timeout: 5 });
  if (administrativeClient !== undefined) {
    await administrativeClient.unsafe("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()", [databaseName]);
    await administrativeClient.unsafe(`DROP DATABASE IF EXISTS "${databaseName}"`);
    await administrativeClient.end({ timeout: 5 });
  }
}, 30_000);

describe("R5 Local HTTP -> Authority -> Decision Core -> PostgreSQL -> HTTP", () => {
  it("proves the real local vertical path, authority rejection, malformed JSON handling, exact persistence equality, and no legacy lifecycle provisioning", async () => {
    const snapshot = seededSnapshot;
    expect(JSON.stringify(snapshot)).toContain(AUTHORITY_PAYLOAD_ONLY_MARKER);
    const reference: AuthoritativeStateReference = {
      producerId: CAPABILITY_CORE_PRODUCER_ID,
      authorityContractId: CAPABILITY_CORE_AUTHORITY_CONTRACT_ID,
      artifactId: snapshot.snapshotId,
      locator: computeSnapshotKey(snapshot)
    };
    const input: DecisionContextDraftInput = {
      sourceStateReferences: [reference],
      items: [
        { role: "DECISION_QUESTION", statement: "Should R5 preserve this exact caller question?", provenance: { origin: "HUMAN_INPUT", actorId: "r5" } },
        { role: "OBJECTIVE", statement: "Keep this explicit R5 objective.", provenance: { origin: "HUMAN_INPUT", actorId: "r5" } }
      ]
    };

    expect(readinessResponse).toEqual({
      status: 404,
      body: { success: false, error: { code: "ERR_DECISION_API_NOT_FOUND", message: "Decision Context revision was not found." } }
    });
    expect(await tableExists("decision_context_revisions")).toBe(true);
    expect(await revisionCount()).toBe(0);

    const postResponse = await fetch(`http://127.0.0.1:${port}/api/decision-contexts`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    });
    expect(postResponse.status).toBe(201);
    const postBody = await postResponse.json() as { success: boolean; revision: Record<string, unknown> };
    expect(Object.keys(postBody)).toEqual(["success", "revision"]);
    expect(postBody.success).toBe(true);
    expect(postBody.revision.previousRevisionId).toBeNull();
    expect(postBody.revision.revisionId).toMatch(/^DREV_[0-9A-F]{24}$/);
    const revisionId = postBody.revision.revisionId as string;
    const expectedContext = createDecisionContextDraft(input);
    expect(postBody.revision.context).toEqual(expectedContext);
    expect(JSON.stringify(postBody.revision)).not.toContain(AUTHORITY_PAYLOAD_ONLY_MARKER);

    const storedRows = await databaseClient.unsafe("SELECT revision_id, payload FROM decision_context_revisions WHERE revision_id = $1", [revisionId]);
    expect(storedRows).toHaveLength(1);
    expect(storedRows[0]?.revision_id).toBe(revisionId);
    expect(storedRows[0]?.payload).toEqual(postBody.revision);
    expect(JSON.stringify(storedRows[0]?.payload)).not.toContain(AUTHORITY_PAYLOAD_ONLY_MARKER);

    const getResponse = await fetch(`http://127.0.0.1:${port}/api/decision-contexts/${encodeURIComponent(revisionId)}`);
    expect(getResponse.status).toBe(200);
    const getBody = await getResponse.json() as { success: boolean; revision: Record<string, unknown> };
    expect(Object.keys(getBody)).toEqual(["success", "revision"]);
    expect(getBody).toEqual(postBody);
    expect(getBody.revision).toEqual(storedRows[0]?.payload);
    expect(JSON.stringify(getBody.revision)).not.toContain(AUTHORITY_PAYLOAD_ONLY_MARKER);

    const countAfterSuccess = await revisionCount();
    const missingAuthorityInput: DecisionContextDraftInput = {
      ...input,
      sourceStateReferences: [{
        producerId: CAPABILITY_CORE_PRODUCER_ID,
        authorityContractId: CAPABILITY_CORE_AUTHORITY_CONTRACT_ID,
        artifactId: "CAPABILITY_SNAPSHOT_R5_MISSING",
        locator: "R5_MISSING_SNAPSHOT_KEY"
      }]
    };
    const authorityFailure = await fetch(`http://127.0.0.1:${port}/api/decision-contexts`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(missingAuthorityInput)
    });
    expect(authorityFailure.status).toBe(422);
    const authorityBody = await authorityFailure.json();
    expect(authorityBody).toEqual({ success: false, error: { code: "ERR_DECISION_API_REQUEST_REJECTED", message: "Decision Context request was rejected." } });
    expect(JSON.stringify(authorityBody)).not.toContain("ERR_DECISION_AUTHORITY_STATE_NOT_FOUND");
    expect(await revisionCount()).toBe(countAfterSuccess);

    const malformed = await fetch(`http://127.0.0.1:${port}/api/decision-contexts`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{invalid-json"
    });
    expect(malformed.status).toBe(400);
    expect(await malformed.json()).toEqual({ success: false, error: { code: "ERR_DECISION_API_INVALID_JSON", message: "Request body must be valid JSON." } });
    expect(await revisionCount()).toBe(countAfterSuccess);

    const lifecycleRows = await databaseClient.unsafe(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = current_schema()
       AND table_name IN (${legacyLifecycleTables.map((_, index) => `$${index + 1}`).join(", ")})
       ORDER BY table_name`,
      legacyLifecycleTables as never
    );
    expect(lifecycleRows).toEqual([]);
    console.info(`[R5 E2E] FINAL HARDENED R5 RUN: GREEN database=${databaseName} port=${port} readiness=${readinessResponse.status} markerSeeded=PASS markerAbsentPost=PASS stored=exact markerAbsentGet=PASS GET=${getResponse.status} authority=${authorityFailure.status} malformed=${malformed.status} legacyLifecycleTables=absent`);
  }, 90_000);
});
