import { buildProvisionalCapabilityId } from "../identity";
import { createCapabilityRelation, type CapabilityCandidate } from "../schema";
import type { CapabilityConvergenceOutput } from "./schema";
import type { CanonicalCapabilityDraft } from "./types";
import { compareCapabilityConvergenceStrings } from "./ordering";

const compare = compareCapabilityConvergenceStrings;
export function canonicalizeCapabilityConvergence(output: CapabilityConvergenceOutput, candidates: CapabilityCandidate[], createdAt: string): { canonicalDrafts: CanonicalCapabilityDraft[]; proposedRelations: ReturnType<typeof createCapabilityRelation>[] } {
  const candidatesById = new Map(candidates.map((candidate) => [candidate.candidateId, candidate])); const draftByGroup = new Map<string, CanonicalCapabilityDraft>(); const identifiers = new Set<string>();
  const canonicalDrafts = output.groups.map((group) => {
    const members = group.member_candidate_ids.map((candidateId) => candidatesById.get(candidateId)!); const sourceCandidateIds = members.map((member) => member.candidateId).sort(compare);
    const verifiedClaims = members.flatMap((member) => member.evidenceClaims).filter((claim) => claim.verification.status === "VERIFIED");
    const evidenceIds = [...new Set(verifiedClaims.map((claim) => claim.evidenceId))].sort(compare); const sourceDocumentIds = [...new Set(verifiedClaims.map((claim) => claim.verification.matchedDocId).filter((id): id is string => Boolean(id)))].sort(compare);
    const provisionalCapabilityId = buildProvisionalCapabilityId(group.canonical_name, group.capability_scope); if (identifiers.has(provisionalCapabilityId)) throw new Error("ERR_CAPABILITY_CONVERGENCE_ID_COLLISION"); identifiers.add(provisionalCapabilityId);
    const draft: CanonicalCapabilityDraft = { provisionalCapabilityId, canonicalName: group.canonical_name, scope: group.capability_scope, structuralDefinition: group.structural_definition, primaryDomain: group.primary_domain, evidenceIds, provenance: { sourceCandidateIds, sourceDocumentIds }, semanticDefinitionStatus: "NOT_RUN" };
    draftByGroup.set(group.group_key, draft); return draft;
  });
  const proposedRelations = output.relations.map((relation) => createCapabilityRelation({ sourceCapabilityRef: draftByGroup.get(relation.source_group_key)!.provisionalCapabilityId, targetCapabilityRef: draftByGroup.get(relation.target_group_key)!.provisionalCapabilityId, relationType: relation.relation_type, status: "PROPOSED", reason: relation.reason, createdBy: "SEMANTIC_RESOLVER", createdAt }));
  if (new Set(proposedRelations.map((relation) => relation.relationId)).size !== proposedRelations.length) throw new Error("ERR_CAPABILITY_CONVERGENCE_RELATION_CONFLICT");
  return { canonicalDrafts, proposedRelations };
}
