import { 
  DemoCareerIntelligenceData, 
  DemoCapabilityItem, 
  DemoOrganizationMatch, 
  DemoRoleMatch, 
  DemoCapabilityGap, 
  DemoNextAction, 
  DemoSourceItem 
} from "../../app/career/demo/demo-data";
import { evaluateAlignment } from "./matching/alignment";
import { buildRoleRecommendation } from "./matching/derivation";

/**
 * Pure deterministic adapter bridging the validated CanonicalCareerAnalysis
 * and the frontend SIL v3.0 DemoCareerIntelligenceData shape.
 */
export function adaptCanonicalToDemoState(
  canonicalData: any,
  stagedDocs: any[],
  sourceManifest?: Array<{ canonicalDocumentId: string, sourceRef: string }>
): DemoCareerIntelligenceData {
  const analysis = canonicalData.structured_data.analysis;
  const manifest = sourceManifest || [];

  // 1. SOURCES
  const sources: DemoSourceItem[] = (analysis.documents || []).map((doc: any, index: number) => {
    const manifestEntry = manifest.find(m => m.canonicalDocumentId === doc.entity_id);
    let stagedDoc: any = null;
    if (manifestEntry) {
      stagedDoc = stagedDocs.find(d => d.id === manifestEntry.sourceRef);
    }
    const finalStagedDoc = stagedDoc || {};
    const sourceKind = String(finalStagedDoc.type || "DOCUMENT").toUpperCase();

    let sourceTitle = "Unknown Document";
    if (finalStagedDoc.title) {
      sourceTitle = finalStagedDoc.title;
    } else if (finalStagedDoc.name) {
      sourceTitle = finalStagedDoc.name;
    } else if (doc.identity?.name) {
      sourceTitle = doc.identity.name;
    } else if (doc.properties?.title) {
      sourceTitle = doc.properties.title;
    }

    return {
      sourceKind,
      sourceTitle,
      sourceUri: finalStagedDoc.url || undefined,
      contentHash: doc.properties?.hash_sha256 || `HASH-${doc.entity_id}`,
      // F11 can match proposal evidence only by this canonical document id;
      // legacy presentation keeps its existing fallback behavior.
      sourceDocumentId: finalStagedDoc.docId || finalStagedDoc.id || doc.entity_id
    };
  });

  // 2. CAPABILITIES
  const capabilities: DemoCapabilityItem[] = (analysis.capabilities || []).map((cap: any) => {
    const evidenceObj = cap.evidence && cap.evidence.length > 0 ? cap.evidence[0] : null;
    const evidenceSummary = evidenceObj?.context_quote || "Derived from analysis context.";
    const confMetric = cap.confidence != null ? cap.confidence : undefined;

    return {
      id: cap.entity_id,
      name: cap.identity.name,
      domain: cap.properties.category || "UNKNOWN_DOMAIN",
      evidenceConfidence: confMetric,
      evidenceSummary
    };
  });

  // 3. COMPANY MATCHES
  const companyMatches: DemoOrganizationMatch[] = (analysis.organizations || []).map((org: any) => {
    return {
      organizationId: org.entity_id,
      organizationName: org.identity.name,
      fitScore: undefined, 
      matchedCapabilities: [],
      rationale: org.evidence?.[0]?.context_quote || "Identified in text."
    };
  });

  // 4. ROLE MATCHES + DETERMINISTIC FIT SCORE (TEST002E)
  const roleMatches: DemoRoleMatch[] = (analysis.roles || []).map((role: any) => {
    const orgRel = role.relationships?.find((r: any) => r.relation_type === "ROLE_IN_ORGANIZATION");
    let orgName = "Unknown Organization";
    if (orgRel && orgRel.target_id) {
      const org = analysis.organizations?.find((o: any) => o.entity_id === orgRel.target_id);
      if (org) orgName = org.identity.name;
    }

    // Identify requirements linked to this role
    const linkedReqIds = role.relationships
      ?.filter((r: any) => r.relation_type === "REQUIRES")
      .map((r: any) => r.target_id) || [];
      
    const roleReqs = (analysis.requirements || []).filter((req: any) => linkedReqIds.includes(req.entity_id));
    
    // Evaluate alignment for each requirement against ALL candidate capabilities
    const alignments = roleReqs.map((req: any) => {
      // Find a matching capability if any
      const cap = analysis.capabilities?.find((c: any) => 
        c.identity.name.trim().toLowerCase() === req.identity.name.trim().toLowerCase()
      );
      return evaluateAlignment(cap || null, req, analysis, manifest);
    });

    const recommendation = buildRoleRecommendation(role.entity_id, alignments);
    const fitScoreValue = recommendation.fitScore.value;

    return {
      roleId: role.entity_id,
      roleTitle: role.identity.name,
      organizationName: orgName,
      fitScore: fitScoreValue !== null ? fitScoreValue : undefined,
      matchedCapabilities: alignments.filter((a: any) => a.state === "SUPPORTED").map((a: any) => a.requirementId),
      missingCapabilities: alignments.filter((a: any) => a.state === "NOT_SUPPORTED").map((a: any) => a.requirementId),
      rationale: role.evidence?.[0]?.context_quote || `Recommendation State: ${recommendation.recommendationState}`
    };
  });

  // 5. NEXT ACTIONS
  const nextActions: DemoNextAction[] = (analysis.strategies || []).map((strat: any) => {
    return {
      actionId: strat.entity_id,
      title: strat.identity.name,
      description: strat.properties.purpose || "Strategic Action",
      expectedImpact: strat.properties.target || "Strategic Improvement"
    };
  });

  const capabilityGaps: DemoCapabilityGap[] = [];

  return {
    analysisId: analysis.metadata?.analysis_id || "ANL_UNKNOWN",
    generatedAt: analysis.metadata?.analysis_timestamp || new Date().toISOString(),
    sources,
    capabilities,
    companyMatches,
    roleMatches,
    capabilityGaps,
    nextActions,
    reactFlowGraph: {
      nodes: [],
      edges: []
    }
  };
}
