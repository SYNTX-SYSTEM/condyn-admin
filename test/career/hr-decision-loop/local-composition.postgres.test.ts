import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres, { type Sql } from "postgres";
import { requireTestDatabaseUrl } from "../../../lib/database-isolation/policy";
import { createDisposableTestDatabaseNamed, dropDisposableTestDatabase, newDisposableTestDatabaseName, verifyDisposableTestDatabase } from "../../../lib/database-isolation/verification";
import { HR_DECISION_LOOP_REGION_NAMES } from "../../../lib/career/hr-decision-loop/read-model";

/**
 * The HR Decision Loop composition root must make a verified empty database operational on
 * its own: after the first application construction every family of the read model has its
 * table, so a server started without the manual script represents EMPTY, never
 * NOT_PROVISIONED.
 *
 * The claim needs an EMPTY database. The runner database is shared by every file of a run and
 * other suites (the job pool gate, the T-series persistence suites) leave partial table sets and
 * rows there, so this file provisions its own fresh disposable database (created, verified,
 * marked, dropped) and binds DATABASE_URL to it before the application client is first imported.
 */
let sql: Sql;
let databaseUrl: string;
let runnerUrl: string;
type Registration = typeof import("../../../lib/persistence/unified-schema-registration");
let registration: Registration;

beforeAll(async () => {
  runnerUrl = requireTestDatabaseUrl();
  const created = await createDisposableTestDatabaseNamed(runnerUrl, newDisposableTestDatabaseName());
  const verified = await verifyDisposableTestDatabase(created.url);
  databaseUrl = verified.url;
  process.env.DATABASE_URL = databaseUrl;
  sql = postgres(databaseUrl, { max: 1, onnotice: () => undefined });
  registration = await import("../../../lib/persistence/unified-schema-registration");
}, 60_000);

afterAll(async () => {
  if (sql) await sql.end({ timeout: 5 });
  if (databaseUrl) await dropDisposableTestDatabase(databaseUrl);
  if (runnerUrl) process.env.DATABASE_URL = runnerUrl;
}, 60_000);

describe("HR Decision Loop local composition root", () => {
  it("registers the unified persistence order on construction and reads an absent context as NOT_FOUND, with every family provisioned", async () => {
    const { listRegisteredTables, postDecisionChainTableNames, careerDecisionContextDecisionRevisionBindingTableName } = registration;
    const before = await listRegisteredTables(sql);
    expect(before).toEqual([]);
    const { createLocalHrDecisionLoopHttpApplication } = await import("../../../lib/career/hr-decision-loop/local-composition");
    const application = await createLocalHrDecisionLoopHttpApplication();
    const after = await registration.listRegisteredTables(sql);
    for (const name of postDecisionChainTableNames) expect(after, name).toContain(name.length > 63 ? name.slice(0, 63) : name);
    expect(after).toContain(careerDecisionContextDecisionRevisionBindingTableName);
    expect(after).toContain("decision_context_revisions");
    expect(after).toContain("human_decision_records");
    await expect(application.readLoop("DCTXREV_" + "0".repeat(32))).rejects.toThrow("ERR_HR_DECISION_LOOP_CONTEXT_NOT_FOUND");
    await expect(application.readHumanDecisionRecord("DCR_" + "0".repeat(32))).resolves.toBeNull();
    expect(HR_DECISION_LOOP_REGION_NAMES).toHaveLength(15);
  }, 60_000);

  it("serves the seeded world through the production composition with every family persisted, not merely provisioned", async () => {
    const world = await import("./fixtures/hr-loop-postgres-world");
    const seeded = await world.seedHrLoopWorldInto(sql, databaseUrl, (await verifyDisposableTestDatabase(databaseUrl)).databaseName);
    const { createLocalHrDecisionLoopHttpApplication } = await import("../../../lib/career/hr-decision-loop/local-composition");
    const application = await createLocalHrDecisionLoopHttpApplication();
    const model = await application.readLoop(seeded.contextA);
    for (const name of HR_DECISION_LOOP_REGION_NAMES) expect(model[name].state, name).toBe("AVAILABLE");
    expect(model.decisionRevisionBindings.artifactIds).toEqual([seeded.g2.decisionRevisionBindingId]);
    const empty = await application.readLoop(seeded.contextB);
    for (const name of HR_DECISION_LOOP_REGION_NAMES) expect(empty[name].state, name).toBe("EMPTY");
  }, 120_000);
});
