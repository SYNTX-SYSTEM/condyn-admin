import { UniversalEntity } from "../schema";
import { CapabilityProofChain, buildCapabilityProofChain, ProofChainSourceManifestEntry } from "../evidence/proof-chain";
import { Analysis } from "../schema";

export type AlignmentState = 
  | "SUPPORTED"
  | "PARTIALLY_SUPPORTED"
  | "NOT_SUPPORTED"
  | "UNRESOLVED";

export interface RequirementProofChain {
  requirement: UniversalEntity;
  role: UniversalEntity;
  organization: UniversalEntity | null;
  evidence: any[];
  documents: UniversalEntity[];
  sources: ProofChainSourceManifestEntry[];
}

export interface AlignmentResult {
  requirementId: string;
  capabilityId: string | null;
  state: AlignmentState;
  // Dual Provenance
  requirementProof: RequirementProofChain;
  capabilityProof: CapabilityProofChain | null;
}

/**
 * Deterministically evaluates alignment between a Candidate Capability and a Target Requirement.
 * Similarity alone may not produce SUPPORTED. No LLM unilateral match authority.
 */
export function evaluateAlignment(
  capability: UniversalEntity | null,
  requirement: UniversalEntity,
  analysis: Analysis,
  sourceManifest: ProofChainSourceManifestEntry[]
): AlignmentResult {
  // 1. Build Requirement Proof Chain
  const reqEvidence = requirement.evidence;
  const reqDocs = reqEvidence.map(e => analysis.documents.find(d => d.entity_id === e.doc_id)).filter(Boolean) as UniversalEntity[];
  const reqSources = reqDocs.map(d => sourceManifest.find(s => s.canonicalDocumentId === d.entity_id)).filter(Boolean) as ProofChainSourceManifestEntry[];
  
  // Enforce Role Ownership
  const roleRelation = requirement.relationships.find(r => r.relation_type === "REQUIRES" || r.relation_type === "DERIVED_FROM"); // Reverse or forward relation
  // Wait, typically Role -> REQUIRES -> Requirement. So we check if any role has REQUIRES this requirement.
  const role = analysis.roles.find(r => r.relationships.some(rel => rel.target_id === requirement.entity_id && rel.relation_type === "REQUIRES"));
  
  if (!role) {
    throw new Error(`ERR_ORPHAN_REQUIREMENT: Requirement ${requirement.entity_id} does not belong to any ROLE.`);
  }

  const orgRelation = role.relationships.find(r => r.relation_type === "ROLE_IN_ORGANIZATION");
  const organization = orgRelation ? analysis.organizations.find(o => o.entity_id === orgRelation.target_id) || null : null;

  const reqProof: RequirementProofChain = {
    requirement,
    role,
    organization,
    evidence: reqEvidence,
    documents: reqDocs,
    sources: reqSources
  };

  // 2. Build Capability Proof Chain if provided
  let capProof: CapabilityProofChain | null = null;
  if (capability) {
    capProof = buildCapabilityProofChain(capability.entity_id, analysis, sourceManifest);
    
    // EPISTEMIC DOMAIN INVARIANT CHECK
    // Target evidence (reqDocs) may NEVER prove a candidate CAPABILITY (capDocs)
    // Candidate evidence (capDocs) may NEVER define a target REQUIREMENT (reqDocs)
    // We enforce this by ensuring there is NO intersection in document IDs.
    const capDocIds = new Set(capProof.documents.map(d => d.entity_id));
    const reqDocIds = new Set(reqProof.documents.map(d => d.entity_id));
    
    for (const id of capDocIds) {
      if (reqDocIds.has(id)) {
        throw new Error(`ERR_EPISTEMIC_VIOLATION: Document ${id} cannot be used to prove both Candidate Capability and Target Requirement.`);
      }
    }
  }

  // 3. Determine Alignment State
  let state: AlignmentState = "UNRESOLVED";
  if (!capability) {
    state = "NOT_SUPPORTED";
  } else {
    // String similarity is evidence of relation, not satisfaction.
    // Without explicit deterministic derivation (e.g. LLM assertion verified), it remains UNRESOLVED.
    state = "UNRESOLVED";
  }

  return {
    requirementId: requirement.entity_id,
    capabilityId: capability ? capability.entity_id : null,
    state,
    requirementProof: reqProof,
    capabilityProof: capProof
  };
}
