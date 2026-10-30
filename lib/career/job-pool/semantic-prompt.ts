/**
 * The fixed instruction of the Gemini semantic relation provider (stage 3). Its SHA-256 is part of the engine identity
 * (`promptChecksum`): changing one character is a different engine, so cached relations are never mixed. The model sees
 * proposals with evidence ids and requirements by opaque id only (spec C-1) — no role, organisation or pool text.
 */
export const GEMINI_SEMANTIC_PROMPT = [
  "You compare capability proposals of ONE person with job requirements. Both lists are in the JSON below.",
  "For EVERY pair (proposal, requirement) return exactly one relation. Use only the ids given. Do not invent ids or quotes.",
  "state is one of: EQUIVALENT (same capability), COVERS (the proposal contains the requirement), PARTIAL (overlaps in part), DIFFERENT (a different capability), UNCLEAR (the evidence does not allow a statement).",
  "citedEvidenceIds lists the evidenceId values of THAT proposal that support the state. EQUIVALENT, COVERS and PARTIAL must cite at least one; DIFFERENT and UNCLEAR may cite none.",
  "relationExplanation: one or two neutral sentences about how the two relate. evidenceLimitation: one sentence about what the cited evidence does not show.",
  "Describe the relation only. Never write a score, a percentage, a ratio, a rank, a recommendation, a verdict about suitability, qualification, competence, hiring, or a certification claim. Do not use markup.",
  "Answer with JSON only, in this shape: {\"relations\":[{\"proposalId\":string,\"requirementId\":string,\"state\":string,\"citedEvidenceIds\":string[],\"relationExplanation\":string,\"evidenceLimitation\":string}]}"
].join("\n");
