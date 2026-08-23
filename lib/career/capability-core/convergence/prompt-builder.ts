import type { CapabilityCandidate } from "../schema";
import type { CapabilityConvergencePrompt, ResolvedCapabilityConvergenceKernel } from "./types";
import { compareCapabilityConvergenceStrings } from "./ordering";

const compare = compareCapabilityConvergenceStrings;
export function buildCapabilityConvergencePrompt(candidates: CapabilityCandidate[], kernel: ResolvedCapabilityConvergenceKernel): CapabilityConvergencePrompt {
  const transport = candidates.slice().sort((a, b) => compare(a.candidateId, b.candidateId)).map((candidate) => ({ candidate_id: candidate.candidateId, canonical_name: candidate.proposedCanonicalName, capability_scope: candidate.proposedScope, structural_definition: candidate.structuralDefinition, primary_domain: candidate.proposedPrimaryDomain, verified_evidence: candidate.evidenceClaims.filter((claim) => claim.verification.status === "VERIFIED").slice().sort((a, b) => compare(a.evidenceId, b.evidenceId)).map((claim) => ({ evidence_id: claim.evidenceId, source_document_id: claim.verification.matchedDocId, location: claim.declaredLocation, exact_quote: claim.exactQuote })) }));
  return { systemPrompt: kernel.plainTextContent, userPrompt: `CONDYN CAPABILITY CONVERGENCE INPUT\nELIGIBLE_CANDIDATE_COUNT: ${transport.length}\n\n${JSON.stringify(transport)}` };
}
