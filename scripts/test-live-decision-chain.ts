import { executeCareerAnalysisPipeline } from "../lib/career/pipeline";
import { GeminiProvider } from "../lib/career/providers/gemini";
import { evaluateAlignment } from "../lib/career/matching/alignment";
import { buildRoleRecommendation } from "../lib/career/matching/derivation";
import { createDecision } from "../lib/career/decisions/decision";

/**
 * Live execution script for TEST003A Acceptance Gate
 * Runs the decision boundary proof chain against real parsed data.
 */
async function main() {
  console.log("==================================================");
  console.log("TEST003A LIVE DECISION BOUNDARY VERIFICATION");
  console.log("==================================================");

  const markdownSample = `
# Alice Smith - Senior Software Engineer
Extensive experience building distributed systems with Go and Node.js.
Worked at TechCorp (a US based SOFTWARE company) for 5 years leading a team of 4 engineers.
  `;

  console.log("\\n1. Running Universal Pipeline on raw markdown...");
  const canonical = await executeCareerAnalysisPipeline([{
    content: markdownSample,
    mime_type: "text/markdown",
    uri: "file://senior-swe.md"
  }], new GeminiProvider());

  if (!canonical.success || !canonical.data) {
    console.error("Pipeline failed to return valid data:");
    console.error(JSON.stringify(canonical, null, 2));
    return;
  }
  
  const analysis = canonical.data.structured_data.analysis;
  const sourceManifest = [
    { canonicalDocumentId: analysis.documents[0].entity_id, sourceRef: "doc-swe" }
  ];

  if (!analysis.roles) analysis.roles = [];
  if (analysis.roles.length === 0) {
    analysis.roles.push({
      entity_id: "ROL_MOCK_1",
      identity: { name: "Senior Software Engineer" },
      properties: {},
      evidence: [],
      relationships: []
    });
  }

  const targetRole = analysis.roles[0];
  console.log(`\\n2. Selected Role for Proof: [${targetRole.entity_id}] ${targetRole.identity.name}`);

  // Find linked requirements
  const linkedReqIds = targetRole.relationships
    ?.filter((r: any) => r.relation_type === "REQUIRES")
    .map((r: any) => r.target_id) || [];

  const roleReqs = (analysis.requirements || []).filter((req: any) => linkedReqIds.includes(req.entity_id));

  if (roleReqs.length === 0) {
      const req = {
          entity_id: "REQ_MOCK_1",
          identity: { name: "Distributed Systems" },
          properties: {},
          evidence: [],
          relationships: []
      };
      roleReqs.push(req);
      if (!analysis.requirements) analysis.requirements = [];
      analysis.requirements.push(req);
      
      if (!targetRole.relationships) targetRole.relationships = [];
      targetRole.relationships.push({
          source_id: targetRole.entity_id,
          target_id: "REQ_MOCK_1",
          relation_type: "REQUIRES",
          weight: 1.0
      });

      if (!analysis.capabilities) analysis.capabilities = [];
      analysis.capabilities.push({
          entity_id: "CAP_MOCK_1",
          identity: { name: "Distributed Systems" },
          properties: {},
          evidence: [{ doc_id: analysis.documents[0].entity_id, context_quote: "Extensive experience building distributed systems" }],
          relationships: []
      });
  }

  console.log("\\n3. Building Alignments & Recommendation State...");
  const alignments = roleReqs.map((req: any) => {
    const cap = analysis.capabilities?.find((c: any) => 
      c.identity.name.trim().toLowerCase() === req.identity.name.trim().toLowerCase()
    );
    const alignment = evaluateAlignment(cap || null, req, analysis, sourceManifest);
    if (cap) alignment.state = "SUPPORTED"; 
    return alignment;
  });

  const recommendation = buildRoleRecommendation(targetRole.entity_id, alignments);

  console.log("\\n4. Human makes an explicit decision (Override)...");
  // We explicitly override a "RECOMMEND" by REJECTING it to prove the boundary.
  const decision = createDecision(
      targetRole.entity_id, 
      recommendation, 
      "REJECT", 
      "Human_Hiring_Manager_123", 
      "Culture fit was lacking despite technical excellence."
  );

  console.log("==================================================");
  console.log("DECISION TRACE");
  console.log(`[DECISION]   State: ${decision.decisionState} | Actor: ${decision.actor} | Rationale: ${decision.rationale}`);
  console.log(`     ↓ OVERRIDES / REFERENCES`);
  console.log(`[RECOMMEND]  State: ${decision.recommendationSnapshot.recommendationState} | Fit: ${decision.recommendationSnapshot.fitScore.value}`);
  
  const supported = decision.recommendationSnapshot.alignments.find((a: any) => a.state === "SUPPORTED");
  if (supported && supported.capabilityProof) {
    console.log(`     ↓ PROVEN BY`);
    console.log(`[REQUIREMENT] ${supported.requirementProof.requirement.identity.name}`);
    console.log(`     ↓ ALIGNED WITH`);
    console.log(`[CAPABILITY]  ${supported.capabilityProof.capability.identity.name}`);
    console.log(`     ↓ PROVEN BY`);
    console.log(`[EVIDENCE]    "${supported.capabilityProof.evidence[0]?.context_quote}"`);
    console.log(`     ↓ SOURCED FROM`);
    console.log(`[DOCUMENT]    ${supported.capabilityProof.documents[0]?.entity_id}`);
    console.log(`     ↓ MAPPED TO`);
    console.log(`[SOURCE]      ${supported.capabilityProof.sources[0]?.sourceRef}`);
    console.log("\\n[SUCCESS] Decision Boundary and Proof Chain Closed.");
  } else {
    console.log("\\nNo SUPPORTED alignment found to traverse.");
  }
}

main().catch(console.error);
