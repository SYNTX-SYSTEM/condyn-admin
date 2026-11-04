/**
 * PERSON × JOB phase C test support: the run as the automatic path reads it (decoded by the client's strict decoder), the PERSON
 * projection with the phase-B fixture capabilities, and a crowded ranking for the field's overflow. Built on the phase-B fixtures
 * (test/career/mapping/fixtures.ts), so every ranking here is one the decoder accepts. Every builder returns a fresh object.
 */
import type { CapabilityProposalProjection } from "../../../lib/career/capability-core/projection";
import { decodeAutoMatch, type AutoMatchRunState, type AutoMatchWatch, type JobRankingState, type RoleRanking } from "../../../lib/career/ui/auto-match";
import { autoMatch } from "../auto-capability/fixtures";
import { CAPS, POOL_A, POOL_B, lex, sem, type RoleSpec } from "../mapping/fixtures";

export { ANALYSIS, CAPS, POOL_A, POOL_B, lex, rankingOf, sem, standardRanking, standardRoles } from "../mapping/fixtures";

export function watchOf(state: AutoMatchRunState, patch: Record<string, unknown> = {}): AutoMatchWatch {
  const decoded = decodeAutoMatch(autoMatch(state, patch));
  if (decoded === null) throw new Error("fixture refused by decodeAutoMatch");
  return { read: { state: "AVAILABLE", autoMatch: decoded }, waitedOut: false };
}
export const available = (ranking: RoleRanking): JobRankingState => ({ state: "AVAILABLE", ranking });

export function projectionOf(caps: ReadonlyArray<{ key: string; name: string }> = CAPS): CapabilityProposalProjection {
  return {
    projectionKind: "CAPABILITY_PROPOSAL", projectionState: "PROPOSED", evidenceState: "EVIDENCE_PASSED", semanticDefinitionState: "NOT_RUN", authorityState: "NONE",
    capabilities: caps.map(c => ({ id: c.key, name: c.name, domain: null, scope: "ATOMIC" as const, structuralDefinition: `Definition of ${c.name}`, evidenceState: "EVIDENCE_PASSED" as const,
      semanticDefinitionState: "NOT_RUN" as const, authorityState: "NONE" as const, sourceCandidateIds: [], sourceDocumentIds: ["DOC_1"],
      evidence: [{ evidenceId: `EVD_${c.key}`, sourceDocumentId: "DOC_1", exactQuote: `placeholder quote ${c.key}`, verificationState: "SOURCE_MATCH_VERIFIED" as const }] })),
    relations: []
  };
}

/** `n` checked roles of one pool, all at the same fit and of medium mass (six required requirements, Σweight 18) — at n = 320 more
 *  than the field can hold, so some are overflow. */
export function crowdedRoles(n: number, pool = POOL_A): RoleSpec[] {
  return Array.from({ length: n }, (_, i) => {
    const id = String(i).padStart(3, "0");
    return { pool, roleId: `role_${id}`, title: `Role ${id}`, requirements: Array.from({ length: 6 }, (_, q) => sem(`q_${id}_${q}`, "REQUIRED", "COVERS", "PCAP_TS", "TypeScript")) };
  });
}

/** One role of each L0 class: checked, name relation only, no relation (all NONE), and one without requirements. */
export const classRoles = (): RoleSpec[] => [
  { pool: POOL_A, roleId: "role_checked", title: "Checked", requirements: [sem("q_c", "REQUIRED", "COVERS", "PCAP_TS", "TypeScript")] },
  { pool: POOL_B, roleId: "role_named", title: "Named", requirements: [lex("q_n", "REQUIRED", "NAME_EXACT", "PCAP_K8", "Kubernetes")] },
  { pool: POOL_B, roleId: "role_none", title: "Unrelated", requirements: [lex("q_x", "REQUIRED", "NONE", null)] },
  { pool: POOL_A, roleId: "role_bare", title: "Bare", requirements: [] }
];
