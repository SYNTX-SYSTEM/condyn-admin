import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initDbSchema, db } from "../lib/career/db/client";
import { LifecycleRepository } from "../lib/career/repositories/lifecycle";
import { createPolicyVersion, createPromotionRecord } from "../lib/career/decisions/policy";
import { generatePayloadHash } from "../lib/career/utils/hash";
import { sql } from "drizzle-orm";

describe("CONDYN Career Analysis Protocol v4.0 - PHASE 4: ATOMIC POLICY ACTIVATION (TEST004D)", () => {
  let repo: LifecycleRepository;

  beforeEach(async () => {
    await initDbSchema();
    repo = new LifecycleRepository(db);
    
    // Clear tables
    await db.execute(sql`DELETE FROM career_policy_promotions`);
    await db.execute(sql`DELETE FROM career_policy_families`);
    await db.execute(sql`DELETE FROM career_policy_versions`);
  });

  afterEach(async () => {
    await db.execute(sql`DELETE FROM career_policy_promotions`);
    await db.execute(sql`DELETE FROM career_policy_families`);
    await db.execute(sql`DELETE FROM career_policy_versions`);
  });

  const generatePolicy = (id: string, fam: string, version: number) => {
    return createPolicyVersion(id, fam, version, { minimumFit: 0.5, minimumExplainability: 0.5, partialSupportContribution: 0.5 }, "actor1");
  };

  it("A. V1 active -> promote V2 -> head = V2 -> promotion record exists", async () => {
    const v1 = generatePolicy("P1", "FAM1", 1);
    await repo.savePolicyVersion(v1);
    await repo.promotePolicy("PROM1", "FAM1", "P1", 0, "admin");

    const v2 = generatePolicy("P2", "FAM1", 2);
    await repo.savePolicyVersion(v2);
    
    const promotion = await repo.promotePolicy("PROM2", "FAM1", "P2", 1, "admin");
    expect(promotion.toPolicyVersionId).toBe("P2");
    expect(promotion.fromPolicyVersionId).toBe("P1");
    expect(promotion.resultingRevision).toBe(2);

    const head = await db.execute(sql`SELECT * FROM career_policy_families WHERE id = 'FAM1'`);
    expect(head[0].active_policy_version_id).toBe("P2");
    expect(head[0].revision).toBe(2);
  });

  it("B. V1 historical PolicyVersion unchanged", async () => {
    const v1 = generatePolicy("P1", "FAM1", 1);
    await repo.savePolicyVersion(v1);
    await repo.promotePolicy("PROM1", "FAM1", "P1", 0, "admin");

    const v2 = generatePolicy("P2", "FAM1", 2);
    await repo.savePolicyVersion(v2);
    await repo.promotePolicy("PROM2", "FAM1", "P2", 1, "admin");

    const p1Loaded = await repo.loadPolicyVersion("P1");
    expect(p1Loaded?.version).toBe(1);
    expect(p1Loaded?.policyFamilyId).toBe("FAM1");
  });

  it("E. promotion without actor -> FAIL", async () => {
    const v1 = generatePolicy("P1", "FAM1", 1);
    await repo.savePolicyVersion(v1);
    await expect(repo.promotePolicy("PROM1", "FAM1", "P1", 0, "")).rejects.toThrow("ERR_POLICY_PROMOTION_MISSING_ACTOR");
  });

  it("F. unknown candidate policy -> FAIL", async () => {
    await expect(repo.promotePolicy("PROM1", "FAM1", "NONEXISTENT", 0, "admin")).rejects.toThrow("ERR_POLICY_NOT_FOUND");
  });

  it("G. policy from wrong family -> FAIL", async () => {
    const v1 = generatePolicy("P1", "FAM2", 1);
    await repo.savePolicyVersion(v1);
    await expect(repo.promotePolicy("PROM1", "FAM1", "P1", 0, "admin")).rejects.toThrow("ERR_POLICY_ACTIVATION_FAMILY_MISMATCH");
  });

  it("H. expected active = V1 but head already = V2 -> ERR_POLICY_ACTIVATION_CONFLICT", async () => {
    const v1 = generatePolicy("P1", "FAM1", 1);
    await repo.savePolicyVersion(v1);
    await repo.promotePolicy("PROM1", "FAM1", "P1", 0, "admin"); // Revision 1

    const v2 = generatePolicy("P2", "FAM1", 2);
    await repo.savePolicyVersion(v2);
    await repo.promotePolicy("PROM2", "FAM1", "P2", 1, "admin"); // Revision 2

    // Now try to promote V3 expecting revision 1
    const v3 = generatePolicy("P3", "FAM1", 3);
    await repo.savePolicyVersion(v3);
    
    await expect(repo.promotePolicy("PROM3", "FAM1", "P3", 1, "admin")).rejects.toThrow("ERR_POLICY_ACTIVATION_CONFLICT");
  });

  it("I. two concurrent promotions from same revision -> exactly one succeeds", async () => {
    const v1 = generatePolicy("P1", "FAM1", 1);
    await repo.savePolicyVersion(v1);
    await repo.promotePolicy("PROM1", "FAM1", "P1", 0, "admin"); // Revision 1

    const v2 = generatePolicy("P2", "FAM1", 2);
    await repo.savePolicyVersion(v2);
    const v3 = generatePolicy("P3", "FAM1", 3);
    await repo.savePolicyVersion(v3);

    const results = await Promise.allSettled([
      repo.promotePolicy("PROM2", "FAM1", "P2", 1, "admin"),
      repo.promotePolicy("PROM3", "FAM1", "P3", 1, "admin")
    ]);

    const successes = results.filter(r => r.status === "fulfilled");
    const failures = results.filter(r => r.status === "rejected");

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);
    expect((failures[0] as PromiseRejectedResult).reason.message).toContain("ERR_POLICY_ACTIVATION_CONFLICT");

    const head = await db.execute(sql`SELECT * FROM career_policy_families WHERE id = 'FAM1'`);
    expect(head[0].revision).toBe(2);
  });

  it("M. same promotion request retry -> idempotent", async () => {
    const v1 = generatePolicy("P1", "FAM1", 1);
    await repo.savePolicyVersion(v1);
    
    const p1 = await repo.promotePolicy("PROM1", "FAM1", "P1", 0, "admin");
    const p2 = await repo.promotePolicy("PROM1", "FAM1", "P1", 0, "admin");
    
    expect(p1.promotionId).toBe(p2.promotionId);
  });

  it("N. same promotion ID conflicting payload -> FAIL", async () => {
    const v1 = generatePolicy("P1", "FAM1", 1);
    await repo.savePolicyVersion(v1);
    await repo.promotePolicy("PROM1", "FAM1", "P1", 0, "admin");

    const v2 = generatePolicy("P2", "FAM1", 2);
    await repo.savePolicyVersion(v2);

    await expect(repo.promotePolicy("PROM1", "FAM1", "P2", 1, "admin")).rejects.toThrow("ERR_IMMUTABLE_RECORD_CONFLICT");
  });

  it("O. promotion in family A -> family B unchanged", async () => {
    const vA = generatePolicy("P_A", "FAM_A", 1);
    await repo.savePolicyVersion(vA);
    await repo.promotePolicy("PROM_A", "FAM_A", "P_A", 0, "admin");

    const vB = generatePolicy("P_B", "FAM_B", 1);
    await repo.savePolicyVersion(vB);
    await repo.promotePolicy("PROM_B", "FAM_B", "P_B", 0, "admin");

    const vA2 = generatePolicy("P_A2", "FAM_A", 2);
    await repo.savePolicyVersion(vA2);
    await repo.promotePolicy("PROM_A2", "FAM_A", "P_A2", 1, "admin");

    const headB = await db.execute(sql`SELECT * FROM career_policy_families WHERE id = 'FAM_B'`);
    expect(headB[0].active_policy_version_id).toBe("P_B");
    expect(headB[0].revision).toBe(1);
  });

});
