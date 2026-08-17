import { LifecycleRecoveryService } from "../lib/career/repositories/recovery";

async function main() {
  const terminalId = process.argv[2];
  if (!terminalId) {
    console.error("Usage: npx tsx scripts/recover-live-lifecycle.ts <terminalId>");
    process.exit(1);
  }

  console.log(`Starting recovery from process without cached memory for ID: ${terminalId}`);
  const recoveryService = new LifecycleRecoveryService();
  
  try {
    const recovered = await recoveryService.recoverFromTerminal(terminalId, "ATTRIBUTION");
    
    console.log("RECOVERY SUCCESSFUL!");
    console.log("Trace:");
    console.log(`[ATTRIBUTION] ${recovered.attribution.attributionId}`);
    console.log(`        ↓`);
    console.log(`[FEEDBACK] ${recovered.feedback.feedbackId}`);
    console.log(`        ↓`);
    console.log(`[OUTCOME] ${recovered.outcome.outcomeId}`);
    console.log(`        ↓`);
    console.log(`[ACTION] ${recovered.action.actionId}`);
    console.log(`        ↓`);
    console.log(`[COMMITMENT] ${recovered.commitment.commitmentId}`);
    console.log(`        ↓`);
    console.log(`[DECISION] ${recovered.decision.decisionId}`);
    console.log(`        ↓`);
    console.log(`[RECOMMENDATION] ${recovered.recommendation.recommendationId}`);
    
    if (recovered.recommendation.alignments && recovered.recommendation.alignments.length > 0) {
      const align = recovered.recommendation.alignments[0];
      console.log(`        ↓`);
      console.log(`[REQUIREMENT] ${align.requirementProof?.requirement?.entity_id}`);
      console.log(`        ↓`);
      console.log(`[CAPABILITY] ${align.capabilityProof?.capability?.entity_id}`);
      console.log(`        ↓`);
      console.log(`[EVIDENCE] ${align.requirementProof?.evidence[0]?.doc_id}`);
      console.log(`        ↓`);
      console.log(`[DOCUMENT] ${align.requirementProof?.documents[0]?.entity_id}`);
      console.log(`        ↓`);
      console.log(`[SOURCE] ${align.requirementProof?.sources[0]?.originalSourceUri}`);
    }

    process.exit(0);
  } catch (error) {
    console.error("RECOVERY FAILED:", error);
    process.exit(1);
  }
}

main();
