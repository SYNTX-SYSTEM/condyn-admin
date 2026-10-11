import { describe, expect, it } from "vitest";
import { deriveJobField } from "../../../lib/career/job-pool/job-field-presentation";
import { fieldMotion, JOB_FIELD_MOTION_GRAMMAR, pendingRings, requirementMotionKind, roleMotion, segmentMotion } from "../../../lib/career/job-pool/job-field-motion";
import { matches } from "./fixtures/match-bodies";

/**
 * P-JF-M: every effect of the Job Field carries exactly one delivered meaning (SFE — SEMIONTIC FRONTEND RECONSTRUCTION).
 * Light grows with pool resonance and only with it; a role without a scored match is still and unlit, never dead or absent;
 * requirement states map to one motion each; pending kinds orbit only when present; reduced motion keeps light, zeroes time.
 */
describe("Job Field motion grammar (pure)", () => {
  const field = deriveJobField(matches);
  const roleA = field.roles.find(role => role.poolRoleId === "ROLE_A")!;
  const roleB = field.roles.find(role => role.poolRoleId === "ROLE_B")!;

  it("names one meaning per effect and nothing outside the delivered vocabulary", () => {
    expect(JOB_FIELD_MOTION_GRAMMAR.map(entry => entry.kind)).toEqual(["BREATH", "STILL", "STEADY", "WAVER", "CIRCULATE", "VOID", "FLOW", "ORBIT", "EMERGE"]);
    expect(JOB_FIELD_MOTION_GRAMMAR.map(entry => entry.carries)).toEqual(["POOL_RESONANCE_PRESENTATION", "NO_SCORED_MATCH", "MATCHED_SCORED", "UNRESOLVED_WEAK_EVIDENCE", "COVERED_UNSCORED", "NO_EVIDENCE_DELIVERED", "NEAREST_PRESENTED_ROLE", "PENDING_KIND", "DELIVERED_ORDER"]);
    expect(JSON.stringify(JOB_FIELD_MOTION_GRAMMAR)).not.toMatch(/recommend|chosen|decision|verified|gap|rank/i);
  });

  it("lets light and breath grow monotonically with delivered pool resonance, and only for roles with a scored match", () => {
    const scored = roleMotion(roleA);
    expect(scored.kind).toBe("BREATH");
    expect(scored.glowRadius).toBeGreaterThan(0);
    expect(scored.periodMs).toBeGreaterThan(0);
    const steps = [0.1, 0.3, 0.5, 0.75, 1].map(resonanceScore => roleMotion({ resonanceScore, hasScoredMatch: true, deliveredRank: 1 }));
    for (let index = 1; index < steps.length; index += 1) {
      expect(steps[index].glowRadius).toBeGreaterThan(steps[index - 1].glowRadius);
      expect(steps[index].glowOpacity).toBeGreaterThan(steps[index - 1].glowOpacity);
      expect(steps[index].bodyOpacity).toBeGreaterThan(steps[index - 1].bodyOpacity);
      expect(steps[index].amplitude).toBeGreaterThan(steps[index - 1].amplitude);
      expect(steps[index].periodMs).toBeLessThan(steps[index - 1].periodMs);
    }
    expect(steps[steps.length - 1].glowOpacity).toBeLessThanOrEqual(1);
  });

  it("keeps a role without a scored match still and unlit, visible, never collapsed to zero", () => {
    const unlit = roleMotion(roleB);
    expect(roleB.hasScoredMatch).toBe(false);
    expect(unlit).toMatchObject({ kind: "STILL", periodMs: 0, amplitude: 0, glowRadius: 0, glowOpacity: 0 });
    expect(unlit.bodyOpacity).toBeGreaterThan(0);
    // A positive delivered score without a scored match stays unlit too: light follows evidence, not the number alone.
    expect(roleMotion({ resonanceScore: 0.3, hasScoredMatch: false, deliveredRank: 2 }).kind).toBe("STILL");
  });

  it("emerges in delivered order: later ranks later, bounded, independent of resonance", () => {
    const first = roleMotion({ resonanceScore: 0.1, hasScoredMatch: true, deliveredRank: 1 });
    const second = roleMotion({ resonanceScore: 0.9, hasScoredMatch: true, deliveredRank: 2 });
    const far = roleMotion({ resonanceScore: 0, hasScoredMatch: false, deliveredRank: 40 });
    expect(first.emergeDelayMs).toBe(0);
    expect(second.emergeDelayMs).toBeGreaterThan(first.emergeDelayMs);
    expect(far.emergeDelayMs).toBe(1800);
  });

  it("maps each requirement state to exactly one motion: steady, waver, circulate, void", () => {
    expect(segmentMotion("MATCHED")).toMatchObject({ kind: "STEADY", durationMs: 0, dasharray: null });
    expect(segmentMotion("UNRESOLVED")).toMatchObject({ kind: "WAVER" });
    expect(segmentMotion("UNRESOLVED").durationMs).toBeGreaterThan(0);
    expect(segmentMotion("COVERED_UNSCORED")).toMatchObject({ kind: "CIRCULATE", dasharray: "3 3" });
    expect(segmentMotion("COVERED_UNSCORED").durationMs).toBeGreaterThan(0);
    expect(segmentMotion("NO_EVIDENCE_DELIVERED")).toMatchObject({ kind: "VOID", durationMs: 0 });
    expect(segmentMotion("NO_EVIDENCE_DELIVERED").opacity).toBeGreaterThan(0);
    expect(["MATCHED", "UNRESOLVED", "COVERED_UNSCORED", "NO_EVIDENCE_DELIVERED"].map(state => requirementMotionKind(state as never))).toEqual(["STEADY", "WAVER", "CIRCULATE", "VOID"]);
  });

  it("orbits one ring per pending kind that has ids, in the fixed pending order, and none for empty kinds", () => {
    const rings = pendingRings(roleA.pending);
    expect(rings.map(ring => ring.kind)).toEqual(["UNPROVEN_CANONICAL", "UNSCORED_COVERAGE"]);
    expect(rings.map(ring => ring.count)).toEqual([2, 1]);
    expect(rings[1].radiusOffset).toBeGreaterThan(rings[0].radiusOffset);
    expect(rings[1].durationMs).not.toBe(rings[0].durationMs);
    expect(pendingRings([{ kind: "UNRESOLVED_EVIDENCE", ids: [] }])).toEqual([]);
  });

  it("reduced motion zeroes every duration and keeps every light value", () => {
    const live = roleMotion(roleA, "LIVE");
    const reduced = roleMotion(roleA, "REDUCED");
    expect(reduced).toMatchObject({ kind: "BREATH", periodMs: 0, amplitude: 0, emergeDelayMs: 0, emergeDurationMs: 0, glowRadius: live.glowRadius, glowOpacity: live.glowOpacity, bodyOpacity: live.bodyOpacity });
    expect(segmentMotion("UNRESOLVED", "REDUCED").durationMs).toBe(0);
    expect(segmentMotion("COVERED_UNSCORED", "REDUCED")).toMatchObject({ durationMs: 0, dasharray: "3 3" });
    expect(pendingRings(roleA.pending, "REDUCED").every(ring => ring.durationMs === 0)).toBe(true);
    expect(fieldMotion("REDUCED")).toMatchObject({ mode: "REDUCED", enterMs: 0, core: { periodMs: 0, amplitudeScale: 1 }, sweepHalo: { durationMs: 0 }, nearestFlow: { durationMs: 0 } });
    expect(fieldMotion("LIVE").nearestFlow.durationMs).toBeGreaterThan(0);
    expect(fieldMotion("LIVE").version).toBe("SEMIONTIC_V1");
  });
});
