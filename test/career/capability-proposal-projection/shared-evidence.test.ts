import { describe, expect, it } from "vitest";
/** Kept outside test/career/capability-core: that suite is sealed and pinned by the P8 preservation proof. */
import { createCapabilityProposalProjectionReader, createInMemoryCapabilityProposalProjectionReferenceRepository } from "../../../lib/career/capability-core";

/**
 * D-JP-4: EVD identity is SHA256([source document, location, exact quote]). Two Discovery candidates that cite
 * the same CV sentence therefore carry the same evidence id. Observed live: a real Gemini run produced CI/CD and
 * Docker candidates citing one line, and GET /api/career/analyses/[id] failed with
 * ERR_CAPABILITY_PROPOSAL_PROJECTION_LINEAGE_INVALID.
 */
const quote = "Set up CI/CD pipelines with GitHub Actions and Docker images for every service.";
const claim = (evidenceId: string, exactQuote = quote, matchedDocId = "DOC_001") => ({
  evidenceId, sourceDocumentRef: "DOC_001", declaredLocation: "experience", exactQuote, verification: { status: "VERIFIED", matchedDocId }
});
const draft = (id: string, candidateId: string) => ({
  provisionalCapabilityId: id, canonicalName: id, scope: "ATOMIC", structuralDefinition: `${id} definition`, primaryDomain: "Engineering",
  evidenceIds: ["EVD_SHARED"], provenance: { sourceCandidateIds: [candidateId], sourceDocumentIds: ["DOC_001"] }, semanticDefinitionStatus: "NOT_RUN"
});

async function readWith(candidates: unknown[], drafts: unknown[]) {
  const references = createInMemoryCapabilityProposalProjectionReferenceRepository();
  await references.save({ analysisId: "ANL_D_JP_4", jobId: "JOB_D_JP_4", discoveryRunId: "RUN_X", convergenceRunId: "CONV_X", sourceBundleHash: "SOURCE_X", createdAt: "2026-10-10T18:00:00.000Z" });
  const reader = createCapabilityProposalProjectionReader({
    references,
    capabilityRepository: {
      getRunById: async () => ({ runId: "RUN_X", sourceBundleHash: "SOURCE_X", status: "COMPLETED", payload: { candidates } }) as never,
      getConvergenceRunById: async () => ({ convergenceRunId: "CONV_X", discoveryRunId: "RUN_X", sourceBundleHash: "SOURCE_X", status: "COMPLETED", payload: { canonicalDrafts: drafts, proposedRelations: [], reconciliation: { status: "PASSED" } } }) as never
    }
  });
  return reader.read("ANL_D_JP_4");
}

describe("proposal projection with shared content-addressed evidence (D-JP-4, D-JP-5)", () => {
  it("projects two capabilities that cite the same sentence, each with that evidence", async () => {
    const projection = await readWith(
      [{ candidateId: "CAND_CICD", status: "EVIDENCE_PASSED", evidenceClaims: [claim("EVD_SHARED")] }, { candidateId: "CAND_DOCKER", status: "EVIDENCE_PASSED", evidenceClaims: [claim("EVD_SHARED")] }],
      [draft("PCAP_CICD", "CAND_CICD"), draft("PCAP_DOCKER", "CAND_DOCKER")]
    );
    expect(projection?.capabilities.map(item => [item.id, item.evidence.map(e => e.exactQuote)])).toEqual([["PCAP_CICD", [quote]], ["PCAP_DOCKER", [quote]]]);
  });

  it("accepts several evidence quotes from one document and still rejects undeclared or missing documents (D-JP-5)", async () => {
    const candidates = [{ candidateId: "CAND_TS", status: "EVIDENCE_PASSED", evidenceClaims: [claim("EVD_1", "Built the billing platform in TypeScript."), claim("EVD_2", "Migrated 40 services to strict TypeScript.")] }];
    const twoQuotes = (sourceDocumentIds: string[]) => [{ ...draft("PCAP_TS", "CAND_TS"), evidenceIds: ["EVD_1", "EVD_2"], provenance: { sourceCandidateIds: ["CAND_TS"], sourceDocumentIds } }];
    const projection = await readWith(candidates, twoQuotes(["DOC_001"]));
    expect(projection?.capabilities[0].evidence.map(e => e.sourceDocumentId)).toEqual(["DOC_001", "DOC_001"]);
    await expect(readWith(candidates, twoQuotes(["DOC_001", "DOC_002"]))).rejects.toThrow("ERR_CAPABILITY_PROPOSAL_PROJECTION_LINEAGE_INVALID");
    await expect(readWith(candidates, twoQuotes(["DOC_001", "DOC_001"]))).rejects.toThrow("ERR_CAPABILITY_PROPOSAL_PROJECTION_LINEAGE_INVALID");
  });

  it("still fails closed when one evidence id carries divergent claims or belongs to none of the draft's candidates", async () => {
    await expect(readWith(
      [{ candidateId: "CAND_A", status: "EVIDENCE_PASSED", evidenceClaims: [claim("EVD_SHARED")] }, { candidateId: "CAND_B", status: "EVIDENCE_PASSED", evidenceClaims: [claim("EVD_SHARED", "A different sentence entirely.")] }],
      [draft("PCAP_A", "CAND_A")]
    )).rejects.toThrow("ERR_CAPABILITY_PROPOSAL_PROJECTION_LINEAGE_INVALID");
    await expect(readWith(
      [{ candidateId: "CAND_A", status: "EVIDENCE_PASSED", evidenceClaims: [claim("EVD_SHARED")] }, { candidateId: "CAND_C", status: "EVIDENCE_PASSED", evidenceClaims: [] }],
      [draft("PCAP_C", "CAND_C")]
    )).rejects.toThrow("ERR_CAPABILITY_PROPOSAL_PROJECTION_LINEAGE_INVALID");
  });
});
