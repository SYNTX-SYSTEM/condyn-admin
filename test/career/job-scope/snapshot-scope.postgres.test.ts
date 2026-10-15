import { beforeAll, describe, expect, it } from "vitest";
import { db, initDbSchema } from "../../../lib/career/db/client";
import { PostgresCapabilityCoreRepository, computeSnapshotKey } from "../../../lib/career/capability-core";
import { SCOPE_X, SCOPE_Y, persistChain, scopedChain } from "./snapshot-scope.fixture";

/** SFE 2026-10-15 (PINK O-SNAPSHOT-SCOPE) on PostgreSQL: two scopes over the same sources keep two confirmed states. */
describe("scope identity in the confirmed capability state (PostgreSQL)", () => {
  beforeAll(async () => { await initDbSchema(); });

  it("stores one Phase-4 snapshot per scope under its own key and returns it unchanged", async () => {
    const repository = new PostgresCapabilityCoreRepository(db);
    const chains = [scopedChain(SCOPE_X), scopedChain(SCOPE_Y)];
    for (const chain of chains) await persistChain(repository, chain);
    const publisher = repository.createVerifiedCapabilitySnapshotPublisher();
    const x = await publisher.publish(chains[0]);
    const y = await publisher.publish(chains[1]);
    expect(x.snapshotId).not.toBe(y.snapshotId);
    expect(await repository.getSnapshotByKey(computeSnapshotKey(x))).toEqual(x);
    expect(await repository.getSnapshotByKey(computeSnapshotKey(y))).toEqual(y);
    expect([x.investigationScope?.scopeHash, y.investigationScope?.scopeHash]).toEqual([SCOPE_X, SCOPE_Y]);
    // Re-publishing the same scope is idempotent; it never overwrites the other scope's state.
    expect(await publisher.publish(chains[0])).toEqual(x);
  });
});
