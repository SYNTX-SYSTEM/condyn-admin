import { 
  DemoCareerIntelligenceData, 
  DemoCapabilityItem, 
  DemoOrganizationMatch, 
  DemoRoleMatch, 
  DemoCapabilityGap, 
  DemoNextAction, 
  DemoSourceItem 
} from "../../app/career/demo/demo-data";

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

  // 1. SOURCES
  // Deterministic correlation via sourceManifest
  const sources: DemoSourceItem[] = (analysis.documents || []).map((doc: any, index: number) => {
    
    // Find the transport correlation mapping
    const manifestEntry = (sourceManifest || []).find(m => m.canonicalDocumentId === doc.entity_id);
    
    // Locate the authoritative staged document using the mapped sourceRef
    let stagedDoc: any = null;
    if (manifestEntry) {
      stagedDoc = stagedDocs.find(d => d.id === manifestEntry.sourceRef);
    }
    
    // Fallback logic ONLY for legacy or fallback scenarios (index matching explicitly rejected for deterministic provenance)
    // We enforce the SOURCE CORRELATION INVARIANT: If there's no deterministic match, it's UNKNOWN.
    const finalStagedDoc = stagedDoc || {};
    
    const sourceKind = String(finalStagedDoc.type || "DOCUMENT").toUpperCase();

    // Enforce title precedence:
    // 1. Correlated staged title
    // 2. Correlated staged name
    // 3. Canonical semantic name
    // 4. "Unknown Document"
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
      contentHash: doc.properties?.hash_sha256 || `HASH-${doc.entity_id}`
    };
  });

  // 2. CAPABILITIES
  const capabilities: DemoCapabilityItem[] = (analysis.capabilities || []).map((cap: any) => {
    // Extract evidence summary
    const evidenceObj = cap.evidence && cap.evidence.length > 0 ? cap.evidence[0] : null;
    const evidenceSummary = evidenceObj?.context_quote || "Derived from analysis context.";

    return {
      id: cap.entity_id,
      name: cap.identity.name,
      domain: cap.properties.category || "UNKNOWN_DOMAIN",
      evidenceConfidence: cap.confidence || 0.5,
      evidenceSummary
    };
  });

  // 3. COMPANY MATCHES (Organizations)
  const companyMatches: DemoOrganizationMatch[] = (analysis.organizations || []).map((org: any) => {
    return {
      organizationId: org.entity_id,
      organizationName: org.identity.name,
      fitScore: org.properties.resonance_score || org.confidence || 0.5,
      matchedCapabilities: [], // Future extension: lookup relationships
      rationale: org.evidence?.[0]?.context_quote || "Identified in text."
    };
  });

  // 4. ROLE MATCHES
  const roleMatches: DemoRoleMatch[] = (analysis.roles || []).map((role: any) => {
    // Attempt to find the linked organization name
    const orgRel = role.relationships?.find((r: any) => r.relation_type === "ROLE_IN_ORGANIZATION");
    let orgName = "Unknown Organization";
    if (orgRel && orgRel.target_id) {
      const org = analysis.organizations?.find((o: any) => o.entity_id === orgRel.target_id);
      if (org) orgName = org.identity.name;
    }

    return {
      roleId: role.entity_id,
      roleTitle: role.identity.name,
      organizationName: orgName,
      fitScore: role.confidence || 0.5,
      matchedCapabilities: [],
      missingCapabilities: [],
      rationale: role.evidence?.[0]?.context_quote || "Role identified in text."
    };
  });

  // 5. NEXT ACTIONS (Strategies)
  const nextActions: DemoNextAction[] = (analysis.strategies || []).map((strat: any) => {
    return {
      actionId: strat.entity_id,
      title: strat.identity.name,
      description: strat.properties.purpose || "Strategic Action",
      expectedImpact: strat.properties.target || "Strategic Improvement"
    };
  });

  // UNMAPPED SIL DOMAINS: capabilityGaps (opportunities/gaps mapping not 1:1 yet)
  const capabilityGaps: DemoCapabilityGap[] = [];

  return {
    analysisId: analysis.metadata.analysis_id,
    generatedAt: analysis.metadata.analysis_timestamp || new Date().toISOString(),
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
