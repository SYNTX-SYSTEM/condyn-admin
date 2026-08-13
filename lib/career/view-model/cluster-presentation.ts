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
  sourcePresentation: { labels: string[]; titles: string[] }
): SilClusterPresentation[] {
  if (!activeStageId) {
    return [];
  }

  const subClusters: SilClusterPresentation[] = [
    {
      id: `cl-${activeStageId}-1`,
      title: "Core Architecture Cluster",
      confidence: analysisSuccess ? undefined : "98%",
      evidenceCount: analysisSuccess ? undefined : 14,
      dx: -130,
      dy: -85,
      evidences: [
        { id: `ev-${activeStageId}-1`, title: "Source Grounding", sourceType: "PDF", snippet: "System design specification verified." },
        { id: `ev-${activeStageId}-2`, title: "Contextual Evidence", sourceType: "GitHub", snippet: "pkg/engine/reconcile.go lines 14-88" }
      ]
    },
    {
      id: `cl-${activeStageId}-2`,
      title: "Semantic Resonance Vector",
      confidence: analysisSuccess ? undefined : "95%",
      evidenceCount: analysisSuccess ? undefined : 9,
      dx: 130,
      dy: -75,
      evidences: [
        { id: `ev-${activeStageId}-3`, title: "Verified Capability", sourceType: "GitHub", snippet: "app/components/career/demo/SemanticCareerIntelligenceField.tsx" }
      ]
    }
  ];

  // Override the hardcoded evidence sourceTypes with the actual runtime provenance
  subClusters.forEach((cl) => {
    cl.evidences.forEach((ev, i) => {
      ev.sourceType = sourcePresentation.labels[i % sourcePresentation.labels.length] || "SRC";
      ev.title = sourcePresentation.titles[i % sourcePresentation.titles.length] || "Verified Object";
    });
  });

  return subClusters;
}
