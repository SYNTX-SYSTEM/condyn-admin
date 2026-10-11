/**
 * Job Field motion grammar (owner mandate "SFE — SEMIONTIC FRONTEND RECONSTRUCTION", 2026-10-11).
 *
 * Every visual effect in the Job Field is derived here from delivered facts, so that motion, light and rhythm
 * carry exactly one meaning each and nothing else:
 *
 *   BREATH     a role with a scored match breathes; amplitude, glow and tempo grow with POOL RESONANCE (PRESENTATION)
 *   STILL      a role without a scored match is unlit and still: no light was delivered, which is not absent capability
 *   STEADY     MATCHED (scored) evidence stands still: it is settled as delivered
 *   WAVER      UNRESOLVED (weak evidence) wavers: uncertainty is shown as instability, never as a verdict
 *   CIRCULATE  COVERED_UNSCORED circulates: a sweep proposal covers the requirement but nothing scores it (COVERED != SCORED)
 *   VOID       NO_EVIDENCE_DELIVERED is a faint, static gap: absence of evidence, not absence of capability
 *   FLOW       the ray to the NEAREST PRESENTED ROLE flows from the core outward: a presentation direction (NEAREST != CHOSEN)
 *   ORBIT      the PENDING kinds of a focused role orbit it as distinct dashed rings: what remains unproven, unresolved or uncovered
 *   EMERGE     roles emerge in delivered order: the pool becomes the field; the order is the delivered order
 *
 * Nothing here scores, ranks or decides. Pure functions over the presentation model; REDUCED mode keeps every
 * light value and sets every duration to zero (prefers-reduced-motion).
 */
import type { JobFieldPending, JobFieldPendingKind, JobFieldRequirementState, JobFieldRoleNode } from "./job-field-presentation";

export type JobFieldMotionMode = "LIVE" | "REDUCED";

export type JobFieldMotionKind = "BREATH" | "STILL" | "STEADY" | "WAVER" | "CIRCULATE" | "VOID" | "FLOW" | "ORBIT" | "EMERGE";

/** The grammar as a table: one meaning per effect; rendered in the legend, asserted in tests. */
export const JOB_FIELD_MOTION_GRAMMAR: ReadonlyArray<{ kind: JobFieldMotionKind; carries: string }> = Object.freeze([
  { kind: "BREATH", carries: "POOL_RESONANCE_PRESENTATION" },
  { kind: "STILL", carries: "NO_SCORED_MATCH" },
  { kind: "STEADY", carries: "MATCHED_SCORED" },
  { kind: "WAVER", carries: "UNRESOLVED_WEAK_EVIDENCE" },
  { kind: "CIRCULATE", carries: "COVERED_UNSCORED" },
  { kind: "VOID", carries: "NO_EVIDENCE_DELIVERED" },
  { kind: "FLOW", carries: "NEAREST_PRESENTED_ROLE" },
  { kind: "ORBIT", carries: "PENDING_KIND" },
  { kind: "EMERGE", carries: "DELIVERED_ORDER" }
]);

export const JOB_FIELD_MOTION_VERSION = "SEMIONTIC_V1";

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
const round = (value: number): number => Math.round(value * 1000) / 1000;

export interface JobFieldRoleMotion {
  kind: "BREATH" | "STILL";
  /** Breath period; 0 when still or reduced. Higher resonance breathes livelier (shorter period). */
  periodMs: number;
  /** Swing of the light between exhale and inhale, as a fraction of glowOpacity (0 = none). Breath is light, never geometry: node bounds stay still. */
  amplitude: number;
  /** Radius of the light around the node body, in viewBox units; 0 when unlit. */
  glowRadius: number;
  /** Peak opacity of that light. */
  glowOpacity: number;
  /** Fill opacity of the node body: how much light the role holds. */
  bodyOpacity: number;
  /** Entrance delay in delivered order. */
  emergeDelayMs: number;
  emergeDurationMs: number;
}

export function roleMotion(role: Pick<JobFieldRoleNode, "resonanceScore" | "hasScoredMatch" | "deliveredRank">, mode: JobFieldMotionMode = "LIVE"): JobFieldRoleMotion {
  const live = mode === "LIVE";
  const emergeDelayMs = live ? Math.min(1800, 110 * Math.max(0, role.deliveredRank - 1)) : 0;
  const emergeDurationMs = live ? 760 : 0;
  if (!role.hasScoredMatch) {
    return { kind: "STILL", periodMs: 0, amplitude: 0, glowRadius: 0, glowOpacity: 0, bodyOpacity: 0.07, emergeDelayMs, emergeDurationMs };
  }
  const score = clamp01(role.resonanceScore);
  return {
    kind: "BREATH",
    periodMs: live ? Math.round(9000 - 4000 * score) : 0,
    amplitude: live ? round(0.35 + 0.35 * score) : 0,
    glowRadius: round(6 + 20 * score),
    glowOpacity: round(0.22 + 0.58 * score),
    bodyOpacity: round(0.1 + 0.5 * score),
    emergeDelayMs,
    emergeDurationMs
  };
}

export interface JobFieldSegmentMotion {
  kind: "STEADY" | "WAVER" | "CIRCULATE" | "VOID";
  durationMs: number;
  dasharray: string | null;
  opacity: number;
}

export function segmentMotion(state: JobFieldRequirementState, mode: JobFieldMotionMode = "LIVE"): JobFieldSegmentMotion {
  const live = mode === "LIVE";
  switch (state) {
    case "MATCHED": return { kind: "STEADY", durationMs: 0, dasharray: null, opacity: 1 };
    case "UNRESOLVED": return { kind: "WAVER", durationMs: live ? 2600 : 0, dasharray: null, opacity: 0.85 };
    case "COVERED_UNSCORED": return { kind: "CIRCULATE", durationMs: live ? 7000 : 0, dasharray: "3 3", opacity: 0.7 };
    case "NO_EVIDENCE_DELIVERED": return { kind: "VOID", durationMs: 0, dasharray: "1 3", opacity: 0.45 };
  }
}

export interface JobFieldPendingRing {
  kind: JobFieldPendingKind;
  count: number;
  /** Ring index among the kinds that are present, in the fixed pending order. */
  index: number;
  radiusOffset: number;
  dasharray: string;
  durationMs: number;
  opacity: number;
}

/** One orbiting ring per pending kind that has ids; kinds without ids draw nothing (nothing pending of that kind). */
export function pendingRings(pending: readonly JobFieldPending[], mode: JobFieldMotionMode = "LIVE"): JobFieldPendingRing[] {
  const live = mode === "LIVE";
  return pending.filter(item => item.ids.length > 0).map((item, index) => ({
    kind: item.kind,
    count: item.ids.length,
    index,
    radiusOffset: 12 + index * 6,
    dasharray: `${2 + Math.min(10, item.ids.length)} 9`,
    durationMs: live ? 14000 + index * 4000 : 0,
    opacity: round(0.75 - index * 0.12)
  }));
}

export interface JobFieldFieldMotion {
  version: typeof JOB_FIELD_MOTION_VERSION;
  mode: JobFieldMotionMode;
  enterMs: number;
  core: { periodMs: number; amplitudeScale: number };
  sweepHalo: { durationMs: number; dasharray: string };
  nearestFlow: { durationMs: number; dasharray: string };
}

export function fieldMotion(mode: JobFieldMotionMode = "LIVE"): JobFieldFieldMotion {
  const live = mode === "LIVE";
  return {
    version: JOB_FIELD_MOTION_VERSION,
    mode,
    enterMs: live ? 620 : 0,
    core: { periodMs: live ? 7000 : 0, amplitudeScale: live ? 1.035 : 1 },
    sweepHalo: { durationMs: live ? 26000 : 0, dasharray: "3 5" },
    nearestFlow: { durationMs: live ? 2400 : 0, dasharray: "6 7" }
  };
}

/** The motion kind a requirement state carries, for DOM attributes and the legend. */
export function requirementMotionKind(state: JobFieldRequirementState): JobFieldSegmentMotion["kind"] {
  return segmentMotion(state, "REDUCED").kind;
}
