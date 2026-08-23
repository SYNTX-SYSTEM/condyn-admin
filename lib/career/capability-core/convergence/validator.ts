import { CapabilityConvergenceOutputSchema, type CapabilityConvergenceOutput } from "./schema";
import type { CapabilityCandidate } from "../schema";
import { compareCapabilityConvergenceStrings } from "./ordering";

export function validateCapabilityConvergenceOutput(value: unknown, candidates: CapabilityCandidate[]): CapabilityConvergenceOutput {
  let output: CapabilityConvergenceOutput; try { output = CapabilityConvergenceOutputSchema.parse(value); } catch { throw new Error("ERR_CAPABILITY_CONVERGENCE_SCHEMA_INVALID"); }
  const all = new Map(candidates.map((candidate) => [candidate.candidateId, candidate]));
  const eligible = candidates.filter((candidate) => candidate.status === "EVIDENCE_PASSED");
  const eligibleIds = new Set(eligible.map((candidate) => candidate.candidateId));
  const groupKeys = new Set<string>(); const memberships = new Set<string>();
  for (const group of output.groups) {
    if (groupKeys.has(group.group_key)) throw new Error("ERR_CAPABILITY_CONVERGENCE_DUPLICATE_GROUP_KEY"); groupKeys.add(group.group_key);
    for (const candidateId of group.member_candidate_ids) {
      const candidate = all.get(candidateId); if (!candidate) throw new Error("ERR_CAPABILITY_CONVERGENCE_UNKNOWN_CANDIDATE");
      if (candidate.status === "EVIDENCE_REJECTED") throw new Error("ERR_CAPABILITY_CONVERGENCE_REJECTED_CANDIDATE");
      if (!eligibleIds.has(candidateId)) throw new Error("ERR_CAPABILITY_CONVERGENCE_UNKNOWN_CANDIDATE");
      if (memberships.has(candidateId)) throw new Error("ERR_CAPABILITY_CONVERGENCE_DUPLICATE_MEMBERSHIP"); memberships.add(candidateId);
    }
  }
  for (const candidateId of eligibleIds) if (!memberships.has(candidateId)) throw new Error("ERR_CAPABILITY_CONVERGENCE_MISSING_CANDIDATE");
  const relationPairs = new Set<string>();
  for (const relation of output.relations) {
    if (!groupKeys.has(relation.source_group_key) || !groupKeys.has(relation.target_group_key)) throw new Error("ERR_CAPABILITY_CONVERGENCE_RELATION_ENDPOINT");
    if (relation.source_group_key === relation.target_group_key) throw new Error("ERR_CAPABILITY_CONVERGENCE_SELF_RELATION");
    const pair = [relation.source_group_key, relation.target_group_key].sort(compareCapabilityConvergenceStrings).join("\u0000");
    if (relationPairs.has(pair)) throw new Error("ERR_CAPABILITY_CONVERGENCE_RELATION_CONFLICT");
    relationPairs.add(pair);
  }
  const audit = output.reconciliation_audit; const mergeCount = output.groups.reduce((count, group) => count + group.member_candidate_ids.length - 1, 0); const unresolved = output.relations.filter((relation) => relation.relation_type === "UNRESOLVED").length;
  if (!audit.reconciliation_pass_completed || audit.input_candidate_count !== eligible.length || audit.grouped_candidate_count !== memberships.size || audit.group_count !== output.groups.length || audit.same_capability_merge_count !== mergeCount || audit.unresolved_relation_count !== unresolved) throw new Error("ERR_CAPABILITY_CONVERGENCE_AUDIT_MISMATCH");
  return output;
}
