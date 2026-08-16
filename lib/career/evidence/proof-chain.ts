import { Analysis, UniversalEntity, EvidenceItem } from "../schema";

export interface ProofChainSourceManifestEntry {
  canonicalDocumentId: string;
  sourceRef: string;
}

export interface CapabilityProofChain {
  capability: UniversalEntity;
  evidence: EvidenceItem[];
  documents: UniversalEntity[];
  sources: ProofChainSourceManifestEntry[];
}

/**
 * Deterministic API to traverse the evidence graph for a given capability.
 * This function does NOT perform inference. It strictly traverses the validated
 * Canonical Assembly state and extracts the uncompromised proof chain:
 * Capability -> Evidence Items -> Canonical Documents -> Original Source Manifest
 */
export function buildCapabilityProofChain(
  capabilityId: string,
  analysis: Analysis,
  sourceManifest: ProofChainSourceManifestEntry[]
): CapabilityProofChain {
  // 1. Locate Capability
  const capability = analysis.capabilities.find(c => c.entity_id === capabilityId);
  if (!capability) {
    throw new Error(`ERR_PROOF_CHAIN_BROKEN: Capability ${capabilityId} not found in canonical analysis.`);
  }

  // 2. Validate Minimum Evidence Hard Invariant
  if (!capability.evidence || capability.evidence.length === 0) {
    throw new Error(`ERR_PROOF_CHAIN_BROKEN: Capability ${capabilityId} lacks grounded evidence.`);
  }

  const evidence: EvidenceItem[] = [];
  const documents: UniversalEntity[] = [];
  const sources: ProofChainSourceManifestEntry[] = [];
  const seenDocIds = new Set<string>();

  // 3. Traverse and resolve evidence -> document -> source manifest
  for (const ev of capability.evidence) {
    evidence.push(ev);

    if (!seenDocIds.has(ev.doc_id)) {
      seenDocIds.add(ev.doc_id);

      // Resolve Runtime Document
      const doc = analysis.documents.find(d => d.entity_id === ev.doc_id);
      if (!doc) {
        throw new Error(`ERR_PROOF_CHAIN_BROKEN: Document ${ev.doc_id} referenced by evidence but not found in canonical state.`);
      }
      documents.push(doc);

      // Resolve Original Source
      const source = sourceManifest.find(s => s.canonicalDocumentId === ev.doc_id);
      if (!source) {
        throw new Error(`ERR_PROOF_CHAIN_BROKEN: Document ${ev.doc_id} exists but missing from origin source manifest.`);
      }
      sources.push(source);
    }
  }

  return {
    capability,
    evidence,
    documents,
    sources
  };
}
