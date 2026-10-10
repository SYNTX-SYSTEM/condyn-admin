import { describe, expect, it, vi } from "vitest";
import { createDecision } from "../../lib/career/decisions/decision";
import { buildRoleRecommendation } from "../../lib/career/matching/derivation";
import { generatePayloadHash } from "../../lib/career/utils/hash";

/**
 * Incident DB-1 recovery CANDIDATE (not applied, no database access).
 *
 * The seven legacy rows deleted from the shared `condyn` database were residue of the last test
 * of test/career-lifecycle-postgres-persistence.test.ts, run on 2026-09-22 13:52. Their ids,
 * column values and payload_hash were recorded read-only on 2026-10-09 during the field
 * reconstruction. This test rebuilds every payload offline and proves each against its recorded
 * SHA-256 payload_hash. Applying it to the shared database requires the owner's authorization.
 */
const recorded = {
  recommendation: { id: "REC_1790085122039_982", hash: "ad6b40e96e0fbaaddbdd57bcbfcbdcff3cf1d5633ae23c42d63b1f9323958408" },
  decision: { id: "DEC_1790085122042_366", recommendationId: "REC_1790085122039_982", timestamp: "2026-09-22T13:52:02.042Z", actor: "actor1", hash: "43109caedfd455912c6c08ba3d769bce2e18f8ecc6477972225173c92af6cc0b" },
  commitment: { id: "COM_1790085122046_051", decisionId: "DEC_1790085122042_366", timestamp: "2026-09-22T13:52:02.046Z", hash: "f8ac412a4b3aaf3b1c4d7090c646d29cd022c7e85e444cc21804edfc2a7155d5" },
  action: { id: "ACT_1790085122049_327", commitmentId: "COM_1790085122046_051", timestamp: "2026-09-22T13:52:02.049Z", hash: "6a3131882a01b7871611ccef7fb5d3304b4eb8a17dabdeb78a449c8df8f24be4" },
  outcome: { id: "OUT_1790085122051_103", actionId: "ACT_1790085122049_327", timestamp: "2026-09-22T13:52:02.051Z", hash: "addc1f903a29c9a46794e3c1ec022c9579913d2108e2b92ee65006e891874d4b" },
  feedback: { id: "FDB_1790085122054_627", outcomeId: "OUT_1790085122051_103", timestamp: "2026-09-22T13:52:02.054Z", actor: "actor2", hash: "66e10594805bfcebf4e46020a1711e680da7fe7b54638df752d9e895291c6236" },
  attribution: { id: "ATTR_1790085122057_501", feedbackId: "FDB_1790085122054_627", timestamp: "2026-09-22T13:52:02.057Z", hash: "d7d071e538a2ffa4d2319b656a0c4c02209ad79943c0757009e72d50edaecd5d" },
};

describe("incident DB-1: hash-verified recovery candidate for the seven deleted legacy rows (offline)", () => {
  it("rebuilds the recommendation and the decision with the recorded clock and randomness", () => {
    vi.useFakeTimers();
    const random = vi.spyOn(Math, "random");
    try {
      vi.setSystemTime(new Date(1790085122039));
      random.mockReturnValue(0.9825);
      const recommendation = buildRoleRecommendation("ROL_TEST", []);
      expect(recommendation.recommendationId).toBe(recorded.recommendation.id);
      expect(generatePayloadHash(recommendation)).toBe(recorded.recommendation.hash);
      vi.setSystemTime(new Date(1790085122042));
      random.mockReturnValue(0.3665);
      const decision = createDecision("SUBJ_1", recommendation, "ACCEPT", "actor1", "Looks good");
      expect([decision.decisionId, decision.timestamp, decision.actor]).toEqual([recorded.decision.id, recorded.decision.timestamp, recorded.decision.actor]);
      expect(generatePayloadHash(decision)).toBe(recorded.decision.hash);
    } finally {
      vi.useRealTimers();
      random.mockRestore();
    }
  });

  it("rebuilds the five downstream payloads recorded in full", () => {
    const payloads = {
      commitment: { actor: "actor1", createdAt: recorded.commitment.timestamp, actionType: "COMMITTED", decisionId: recorded.decision.id, commitmentId: recorded.commitment.id },
      action: { actor: "actor1", actionId: recorded.action.id, actionType: "SEND_EMAIL", occurredAt: recorded.action.timestamp, commitmentId: recorded.commitment.id },
      outcome: { actor: "actor1", actionId: recorded.action.id, outcomeId: recorded.outcome.id, occurredAt: recorded.outcome.timestamp, outcomeState: "REPLIED" },
      feedback: { actor: "actor2", outcomeId: recorded.outcome.id, evaluation: "UNDESIRABLE", feedbackId: recorded.feedback.id, observedAt: recorded.feedback.timestamp },
      attribution: { actor: "actor2", targetId: recorded.recommendation.id, feedbackId: recorded.feedback.id, targetType: "RECOMMENDATION", attributionId: recorded.attribution.id, attributionType: "ASSOCIATED_WITH" },
    } as const;
    for (const [name, payload] of Object.entries(payloads) as Array<[keyof typeof payloads, Record<string, unknown>]>) {
      expect(generatePayloadHash(payload), name).toBe(recorded[name].hash);
    }
  });
});
