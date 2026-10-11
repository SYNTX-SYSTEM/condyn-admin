/**
 * Job Field requirement states and pending kinds (owner mandate "SFE — JOB FIELD RECONSTRUCTION", 2026-10-11;
 * geometry retired by "SFE — SYNTX SEMIONTIC FIELD RECONSTRUCTION", rulings R13/R14: no 1 − resonance distance,
 * no nearest presented role; the SYNTX view model (syntx-field-view-model.ts) carries the field).
 *
 * Everything here is a pure, client-safe derivation from one delivered JobPoolMatchPresentation. It re-scores
 * nothing. The four pending kinds are dimensions, not a partition (F-LF-1). Absent evidence is represented as
 * NO_EVIDENCE_DELIVERED, never as an absent capability. Nothing here is a decision or leads to one.
 *
 * NEAREST != CHOSEN · PENDING != MISSING CAPABILITY · COVERED != SCORED · DISTANCE != TRUTH · POOL ROLE != INFERRED ROLE
 */
import type {
  JobPoolMatchBasis,
  JobPoolMissingRequirement,
  JobPoolRoleMatch,
  JobPoolSweepProposalCoverage,
  JobPoolWeakRequirement,
  JobPoolMatchedRequirement
} from "./types";

export type JobFieldRequirementState = "MATCHED" | "UNRESOLVED" | "COVERED_UNSCORED" | "NO_EVIDENCE_DELIVERED";

export interface JobFieldRequirement {
  poolRequirementId: string;
  capabilityName: string;
  necessity: JobPoolMissingRequirement["necessity"];
  weight: number;
  requiredLevel: string;
  state: JobFieldRequirementState;
  /** Scored match facts (MATCHED, UNRESOLVED); null otherwise. */
  match: { basis: JobPoolMatchBasis; matchedCapabilityName: string; matchedConstituent: string | null; confidence: number; contribution: number; evidence: JobPoolMatchedRequirement["evidence"] } | null;
  /** Delivered weak-evidence reason (UNRESOLVED only). */
  weakReason: string | null;
  /** Unscored sweep coverage, on any state. */
  sweep: JobPoolSweepProposalCoverage | null;
  evidenceHint: string | null;
}

export type JobFieldPendingKind = "UNPROVEN_CANONICAL" | "UNRESOLVED_EVIDENCE" | "UNSCORED_COVERAGE" | "NO_EVIDENCE_DELIVERED";

export interface JobFieldPending {
  kind: JobFieldPendingKind;
  /** Requirement ids (or TRQREV ids for UNPROVEN_CANONICAL) exactly as delivered. */
  ids: string[];
}

export interface JobFieldCounts {
  matched: number;
  unresolved: number;
  coveredUnscored: number;
  noEvidence: number;
  total: number;
}

function matchFacts(item: JobPoolMatchedRequirement): JobFieldRequirement["match"] {
  return { basis: item.matchBasis, matchedCapabilityName: item.matchedCapabilityName, matchedConstituent: item.matchedConstituent, confidence: item.confidence, contribution: item.contribution, evidence: item.evidence };
}

export function deriveRequirements(role: JobPoolRoleMatch): JobFieldRequirement[] {
  const matched: JobFieldRequirement[] = role.matched.map(item => ({ poolRequirementId: item.poolRequirementId, capabilityName: item.capabilityName, necessity: item.necessity, weight: item.weight, requiredLevel: item.requiredLevel, state: "MATCHED", match: matchFacts(item), weakReason: null, sweep: item.sweepProposal, evidenceHint: null }));
  const unresolved: JobFieldRequirement[] = role.weakEvidence.map((item: JobPoolWeakRequirement) => ({ poolRequirementId: item.poolRequirementId, capabilityName: item.capabilityName, necessity: item.necessity, weight: item.weight, requiredLevel: item.requiredLevel, state: "UNRESOLVED", match: matchFacts(item), weakReason: item.reason, sweep: item.sweepProposal, evidenceHint: null }));
  const missing: JobFieldRequirement[] = role.missing.map(item => ({ poolRequirementId: item.poolRequirementId, capabilityName: item.capabilityName, necessity: item.necessity, weight: item.weight, requiredLevel: item.requiredLevel, state: item.sweepProposal === null ? "NO_EVIDENCE_DELIVERED" : "COVERED_UNSCORED", match: null, weakReason: null, sweep: item.sweepProposal, evidenceHint: item.evidenceHint }));
  return [...matched, ...unresolved, ...missing];
}

export function countRequirements(requirements: readonly JobFieldRequirement[]): JobFieldCounts {
  const count = (state: JobFieldRequirementState) => requirements.filter(item => item.state === state).length;
  return { matched: count("MATCHED"), unresolved: count("UNRESOLVED"), coveredUnscored: count("COVERED_UNSCORED"), noEvidence: count("NO_EVIDENCE_DELIVERED"), total: requirements.length };
}

/** What remains pending toward a role: four distinct kinds, never merged, never counted as absent capability. */
export function derivePending(role: JobPoolRoleMatch, requirements: readonly JobFieldRequirement[]): JobFieldPending[] {
  return [
    { kind: "UNPROVEN_CANONICAL", ids: [...role.canonical.targetRequirementRevisionIds] },
    { kind: "UNRESOLVED_EVIDENCE", ids: requirements.filter(item => item.state === "UNRESOLVED").map(item => item.poolRequirementId) },
    { kind: "UNSCORED_COVERAGE", ids: requirements.filter(item => item.sweep !== null && item.state !== "MATCHED").map(item => item.poolRequirementId) },
    { kind: "NO_EVIDENCE_DELIVERED", ids: requirements.filter(item => item.state === "NO_EVIDENCE_DELIVERED").map(item => item.poolRequirementId) }
  ];
}

export function hasScoredMatch(role: JobPoolRoleMatch): boolean {
  return role.resonanceScore > 0 && role.matched.length > 0;
}

/** Provenance of what stands behind a requirement line; never "verified capability" (no PHASE4 snapshot exists). */
export type JobFieldProvenance = "ANALYSIS_CAPABILITY" | "SWEEP_PROPOSAL" | "NONE";

export function provenanceOf(requirement: JobFieldRequirement): JobFieldProvenance {
  if (requirement.match !== null) return "ANALYSIS_CAPABILITY";
  if (requirement.sweep !== null) return "SWEEP_PROPOSAL";
  return "NONE";
}
