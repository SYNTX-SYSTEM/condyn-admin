export interface SilClusterEvidence {
  id: string;
  title: string;
  sourceType: string;
  snippet: string;
}

export interface SilClusterPresentation {
  id: string;
  title: string;
  confidence?: string;
  evidenceCount?: number;
  dx: number;
  dy: number;
  evidences: SilClusterEvidence[];
  projectionState?: "PROPOSED";
  evidenceState?: "EVIDENCE_PASSED";
  semanticDefinitionState?: "NOT_RUN";
}

export function buildSilClusterPresentation(
  activeStageId: string | null,
  analysisSuccess: boolean,
  sourcePresentation: { labels: string[]; titles: string[] },
  activeData?: any
): SilClusterPresentation[] {
  if (!activeStageId) {
    return [];
  }

  let subClusters: SilClusterPresentation[] = [];

  if (analysisSuccess && activeData) {
    // Dynamically project real LLM inference data to L1 Clusters
    let items: any[] = [];
    let titleKey = "title";
    let confKey = "confidence";

    if (activeStageId === "01") {
      items = activeData.sources || [];
      titleKey = "sourceTitle";
      confKey = ""; // sources don't have confidence
    } else if (activeStageId === "02") {
      items = activeData.capabilities || [];
      titleKey = "name";
      confKey = "evidenceConfidence";
    } else if (activeStageId === "03") {
      items = activeData.companyMatches || [];
      titleKey = "organizationName";
      confKey = "fitScore";
    } else if (activeStageId === "04") {
      items = activeData.roleMatches || [];
      titleKey = "roleTitle";
      confKey = "fitScore";
    } else if (activeStageId === "05") {
      items = activeData.capabilityGaps || [];
      titleKey = "capabilityName";
      confKey = "";
    } else if (activeStageId === "06") {
      items = activeData.nextActions || [];
      titleKey = "title";
      confKey = "";
    }

    subClusters = items.map((item, idx) => {
      // Collision-free layout strategy (1-ring or 2-ring)
      let radius = 150; // Tighter radius for smaller cards
      let angleDeg = 0;
      
      if (items.length <= 5) {
        // 1-ring layout, offset by 45deg to avoid landing on incoming energy rays (multiples of 90)
        angleDeg = (idx * (360 / items.length)) + 45;
      } else {
        // 2-ring layout for 6+ items to prevent overlap
        const isInner = idx % 2 === 0;
        radius = isInner ? 130 : 220;
        
        // Distribute evenly but slightly staggered, offset to avoid rays
        const halfCount = Math.ceil(items.length / 2);
        const segmentId = Math.floor(idx / 2);
        const baseAngle = segmentId * (360 / halfCount) + 30; // Offset by 30deg
        
        angleDeg = baseAngle + (isInner ? 0 : (360 / halfCount) / 2);
      }
      
      const angle = angleDeg * (Math.PI / 180);
      const dx = Math.round(Math.cos(angle) * radius);
      const dy = Math.round(Math.sin(angle) * radius);

      let confStr: string | undefined;
      if (confStr === undefined && confKey && item[confKey] != null) {
        confStr = `${Math.round(item[confKey] * 100)}%`;
      }

      // Generate localized evidence nodes for this cluster
      const proposalEvidence = item.projectionState === "PROPOSED" ? item.evidence || [] : [];
      const snippet = proposalEvidence[0]?.exactQuote || item.evidenceSummary || item.rationale || item.description;
      const nodeId =
        item.id ||
        item.capabilityId ||
        item.organizationId ||
        item.roleId ||
        item.actionId ||
        item.jobId ||
        item.requirementId ||
        item.companyId ||
        `cl-${activeStageId}-${idx}`;
      
      const evidences: SilClusterEvidence[] = proposalEvidence.length > 0
        ? proposalEvidence.map((evidence: any) => {
            const source = (activeData.sources || []).find((item: any) => item.sourceDocumentId === evidence.sourceDocumentId);
            return { id: evidence.evidenceId, title: source?.sourceTitle || evidence.sourceDocumentId, sourceType: source?.sourceKind || "SRC", snippet: evidence.exactQuote };
          })
        : snippet ? [
        {
          id: `ev-${activeStageId}-${idx}-1`,
          title: "Primary Evidence",
          sourceType: "SRC",
          snippet
        }
      ] : [];

      return {
        id: nodeId,
        title: item[titleKey] || "Unknown Node",
        confidence: confStr,
        evidenceCount: evidences.length > 0 ? evidences.length : undefined,
        ...(item.projectionState === "PROPOSED" ? {
          projectionState: "PROPOSED" as const,
          evidenceState: "EVIDENCE_PASSED" as const,
          semanticDefinitionState: "NOT_RUN" as const
        } : {}),
        dx,
        dy,
        evidences
      };
    });

  } else {
    // Zero-State: Return purely empty until real inference data populates it.
    subClusters = [];
  }

  // Legacy evidence has no canonical source id; proposal evidence was mapped above.
  subClusters.forEach((cl) => {
    if (activeData?.capabilities?.some((item: any) => item.projectionState === "PROPOSED" && item.evidence?.some((evidence: any) => evidence.evidenceId === cl.evidences[0]?.id))) return;
    cl.evidences.forEach((ev, i) => {
      ev.sourceType = sourcePresentation.labels[i % sourcePresentation.labels.length] || "SRC";
      ev.title = sourcePresentation.titles[i % sourcePresentation.titles.length] || "Source Document";
    });
  });

  return subClusters;
}
