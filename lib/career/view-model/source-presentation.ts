import { DemoCareerIntelligenceData } from "../../../app/career/demo/demo-data";

export interface SilSourcePresentation {
  count: number;
  labels: string[];
  titles: string[];
}

export function buildSilSourcePresentation(activeData: DemoCareerIntelligenceData): SilSourcePresentation {
  const sources = activeData.sources || [];
  
  const labels = sources.map(s => {
    const title = (s.sourceTitle || "").toUpperCase();
    if (title.includes("PDF")) return "PDF";
    if (title.includes("GITHUB")) return "GIT";
    if (title.includes("WEBSITE") || title.includes("WEB")) return "WEB";
    
    const anySource = s as any;
    const typeStr = (anySource.sourceKind || anySource.type || anySource.kind || anySource.sourceType || "TXT").toUpperCase();
    if (typeStr === "PDF") return "PDF";
    if (typeStr === "GITHUB") return "GIT";
    if (typeStr === "WEBSITE" || typeStr === "WEB") return "WEB";
    if (typeStr === "TEXT") return "TXT";
    
    return typeStr.length > 3 ? typeStr.slice(0, 3) : typeStr;
  });

  const titles = sources.map(s => s.sourceTitle || (s as any).name || "Unknown Source");

  return {
    count: sources.length,
    labels: Array.from(new Set(labels)),
    titles
  };
}
