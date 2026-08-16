/**
 * CONDYN CAREER ANALYSIS PROTOCOL v1.0
 * CAREER INTELLIGENCE DEMO DATA (`app/career/demo/demo-data.ts`)
 *
 * 100% Pure JSON-compatible client-safe demo data.
 * Zero backend, validator, schema, or loader imports.
 */

export interface DemoSourceItem {
  sourceKind: string;
  sourceTitle: string;
  sourceUri?: string;
  contentHash: string;
}

export interface DemoCapabilityItem {
  id: string;
  name: string;
  domain: string;
  evidenceConfidence: number;
  evidenceSummary: string;
}

export interface DemoOrganizationMatch {
  organizationId: string;
  organizationName: string;
  fitScore: number;
  matchedCapabilities: string[];
  rationale: string;
}

export interface DemoRoleMatch {
  roleId: string;
  roleTitle: string;
  organizationName: string;
  fitScore: number;
  matchedCapabilities: string[];
  missingCapabilities: string[];
  rationale: string;
}

export interface DemoCapabilityGap {
  capabilityName: string;
  domain: string;
  requiredByRoleTitle: string;
  organizationName: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  reason: string;
}

export interface DemoNextAction {
  actionId: string;
  title: string;
  description: string;
  expectedImpact: string;
}

export interface DemoCareerIntelligenceData {
  analysisId: string;
  generatedAt: string;
  sources: DemoSourceItem[];
  capabilities: DemoCapabilityItem[];
  companyMatches: DemoOrganizationMatch[];
  roleMatches: DemoRoleMatch[];
  capabilityGaps: DemoCapabilityGap[];
  nextActions: DemoNextAction[];
  reactFlowGraph: {
    nodes: Array<{ id: string; type: string; position: { x: number; y: number }; data: any }>;
    edges: Array<{ id: string; source: string; target: string; type?: string; label?: string }>;
  };
}

export const EMPTY_CAREER_INTELLIGENCE_DATA: DemoCareerIntelligenceData = {
  analysisId: "",
  generatedAt: "",
  sources: [],
  capabilities: [],
  companyMatches: [],
  roleMatches: [],
  capabilityGaps: [],
  nextActions: [],
  reactFlowGraph: {
    nodes: [],
    edges: []
  }
};
