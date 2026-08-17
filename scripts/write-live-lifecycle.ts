import { initDbSchema, db } from "../lib/career/db/client";
import { LifecycleRepository } from "../lib/career/repositories/lifecycle";
import { createPolicyVersion } from "../lib/career/decisions/policy";
import { buildRoleRecommendation } from "../lib/career/matching/derivation";
import { createDecision } from "../lib/career/decisions/decision";
import { createCommitment, createActionEvent } from "../lib/career/decisions/action";
import { createOutcome } from "../lib/career/decisions/outcome";
import { createFeedback, createAttribution } from "../lib/career/decisions/feedback";

async function main() {
  await initDbSchema();
  const repo = new LifecycleRepository(db);

  const policy = createPolicyVersion("POL_LIVE_1", "FAM_1", 1.0, { minimumFit: 0.5, minimumExplainability: 0.5, partialSupportContribution: 0.5 }, "script");
  await repo.savePolicyVersion(policy);

  const rec = buildRoleRecommendation("ROLE_LIVE", []);
  const mockRec = {
    ...rec,
    recommendationId: `REC_LIVE_${Date.now()}`,
    policyVersionId: policy.policyId,
    fitScore: { value: 0.8, metadata: { derivations: [] } },
    explainabilityScore: { value: 0.8, metadata: { derivations: [] } },
    alignments: [{
      requirementId: "REQ_1", capabilityId: "CAP_1", state: "SUPPORTED",
      requirementProof: { requirement: { entity_id: "REQ_1", entity_type: "REQUIREMENT", relationships: [] }, role: { entity_id: "ROLE_LIVE", entity_type: "ROLE", relationships: [] }, organization: null, evidence: [{ doc_id: "DOC_1", text: "req text", source_id: "SRC_1" }], documents: [{ entity_id: "DOC_1", entity_type: "DOCUMENT", metadata: {}, relationships: [] }], sources: [{ canonicalDocumentId: "DOC_1", originalSourceUri: "https://example.com/source" }] },
      capabilityProof: { capability: { entity_id: "CAP_1", entity_type: "CAPABILITY", relationships: [] }, evidence: [{ doc_id: "DOC_2", text: "cap text", source_id: "SRC_2" }], documents: [{ entity_id: "DOC_2", entity_type: "DOCUMENT", metadata: {}, relationships: [] }], sources: [{ canonicalDocumentId: "DOC_2", originalSourceUri: "https://example.com/source2" }] }
    }]
  } as any;
  await repo.saveRecommendation(mockRec);

  const decision = createDecision("", mockRec, "ACCEPT", "human1", "Looks good");
  await repo.saveDecision(decision);

  const commitment = createCommitment(decision, "human1", "COMMITTED");
  await repo.saveCommitment(commitment);

  const action = createActionEvent("", commitment, "system", "SEND_EMAIL");
  await repo.saveAction(action);

  const outcome = createOutcome(action, "system", "RECEIVED_REPLY");
  await repo.saveOutcome(outcome);

  const feedback = createFeedback("", outcome, "DESIRABLE", "human2");
  await repo.saveFeedback(feedback);

  const attribution = createAttribution("", feedback, "RECOMMENDATION", mockRec.recommendationId, "CAUSAL", "human2");
  await repo.saveAttribution(attribution);

  console.log(`LIFECYCLE WRITTEN. TERMINAL ARTIFACT ID: ${attribution.attributionId}`);
  process.exit(0);
}

main().catch(console.error);
