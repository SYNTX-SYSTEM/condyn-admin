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
      // Radially distribute clusters around the L1 zoom origin
      const angle = (idx * (360 / Math.max(items.length, 1))) * (Math.PI / 180);
      const radius = 130;
      const dx = Math.round(Math.cos(angle) * radius);
      const dy = Math.round(Math.sin(angle) * radius);

      let confStr = undefined;
      if (confKey && item[confKey] != null) {
        confStr = `${Math.round(item[confKey] * 100)}%`;
      }

      // Generate localized evidence nodes for this cluster
      const snippet = item.evidenceSummary || item.rationale || item.description || "Inferred from document context.";
      
      return {
        id: `cl-${activeStageId}-${idx}`,
        title: item[titleKey] || "Unknown Node",
        confidence: confStr,
        evidenceCount: 1,
        dx,
        dy,
        evidences: [
          {
            id: `ev-${activeStageId}-${idx}-1`,
            title: "Canonical Evidence",
            sourceType: "SRC",
            snippet
          }
        ]
      };
    });

  } else {
    // Zero-State: Return purely empty until real inference data populates it.
    subClusters = [];
  }

  // Bind authoritative source telemetry to evidence presentation
  subClusters.forEach((cl) => {
    cl.evidences.forEach((ev, i) => {
      ev.sourceType = sourcePresentation.labels[i % sourcePresentation.labels.length] || "SRC";
      ev.title = sourcePresentation.titles[i % sourcePresentation.titles.length] || "Verified Object";
    });
  });

  return subClusters;
}
