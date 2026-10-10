import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres, { type Sql } from "postgres";
import { verifyDisposableTestDatabase } from "../../../lib/database-isolation/verification";
import { listRegisteredTables, postDecisionChainTableNames, careerDecisionContextDecisionRevisionBindingTableName } from "../../../lib/persistence/unified-schema-registration";
import { HR_DECISION_LOOP_REGION_NAMES } from "../../../lib/career/hr-decision-loop/read-model";

/**
 * The HR Decision Loop composition root must make a verified empty database operational on
 * its own: after the first application construction every family of the read model has its
 * table, so a server started without the manual script represents EMPTY, never
 * NOT_PROVISIONED. The database is the one the isolation runner verified for this run.
 */
let sql: Sql;
let databaseUrl: string;

beforeAll(async () => {
  const verified = await verifyDisposableTestDatabase(process.env.DATABASE_URL);
  databaseUrl = verified.url;
  sql = postgres(databaseUrl, { max: 1, onnotice: () => undefined });
}, 60_000);

afterAll(async () => { if (sql) await sql.end({ timeout: 5 }); });

describe("HR Decision Loop local composition root", () => {
  it("registers the unified persistence order on construction and reads an absent context as NOT_FOUND, with every family provisioned", async () => {
    const before = await listRegisteredTables(sql);
    expect(before).not.toContain(careerDecisionContextDecisionRevisionBindingTableName);
    const { createLocalHrDecisionLoopHttpApplication } = await import("../../../lib/career/hr-decision-loop/local-composition");
    const application = await createLocalHrDecisionLoopHttpApplication();
    const after = await listRegisteredTables(sql);
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
