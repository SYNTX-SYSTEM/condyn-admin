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

export const DEMO_CAREER_INTELLIGENCE_DATA: DemoCareerIntelligenceData = {
  analysisId: "DEMO-ANL-2026-X1",
  generatedAt: "2026-07-08T19:30:00Z",
  sources: [
    {
      sourceKind: "GITHUB_REPOSITORY",
      sourceTitle: "github.com/codi/distributed-edge-core",
      sourceUri: "https://github.com/codi/distributed-edge-core",
      contentHash: "sha256-8f3a1d9e2b4c6a8e"
    },
    {
      sourceKind: "PDF",
      sourceTitle: "Senior_Systems_Architect_CV.pdf",
      contentHash: "sha256-4a1b2c3d4e5f6a7b"
    },
    {
      sourceKind: "WEBSITE",
      sourceTitle: "Personal Engineering Portfolio",
      sourceUri: "https://codi.dev/architecture",
      contentHash: "sha256-9a8b7c6d5e4f3a2b"
    }
  ],
  capabilities: [
    {
      id: "CAP-01",
      name: "Distributed Real-Time Sensor Processing",
      domain: "EDGE_COMPUTING",
      evidenceConfidence: 0.94,
      evidenceSummary: "Architected real-time sensor ingestion pipeline verified in GitHub repository."
    },
    {
      id: "CAP-02",
      name: "Low-Latency Defense AI Inference",
      domain: "AI_SYSTEMS",
      evidenceConfidence: 0.89,
      evidenceSummary: "Implemented embedded C++/Rust inference runtime verified across portfolio & CV."
    },
    {
      id: "CAP-03",
      name: "Cloud Native Mesh Orchestration",
      domain: "CLOUD_INFRASTRUCTURE",
      evidenceConfidence: 0.91,
      evidenceSummary: "Designed high-throughput distributed mesh architecture."
    }
  ],
  companyMatches: [
    {
      organizationId: "ORG-HELSING",
      organizationName: "Helsing",
      fitScore: 0.92,
      matchedCapabilities: ["Distributed Real-Time Sensor Processing", "Low-Latency Defense AI Inference"],
      rationale: "Exceptional semantic overlap with Helsing's real-time defense AI platform infrastructure."
    },
    {
      organizationId: "ORG-ANDURIL",
      organizationName: "Anduril Industries",
      fitScore: 0.88,
      matchedCapabilities: ["Distributed Real-Time Sensor Processing", "Cloud Native Mesh Orchestration"],
      rationale: "Strong alignment with autonomous systems sensor integration and low-latency edge compute."
    }
  ],
  roleMatches: [
    {
      roleId: "ROLE-HELS-01",
      roleTitle: "Senior Defense AI Systems Engineer",
      organizationName: "Helsing",
      fitScore: 0.94,
      matchedCapabilities: ["Distributed Real-Time Sensor Processing", "Low-Latency Defense AI Inference"],
      missingCapabilities: ["DO-178C Safety Critical Avionics Certification"],
      rationale: "Matches core technical competencies in distributed real-time AI inference at the tactical edge."
    },
    {
      roleId: "ROLE-AND-01",
      roleTitle: "Edge Platform Infrastructure Lead",
      organizationName: "Anduril Industries",
      fitScore: 0.87,
      matchedCapabilities: ["Cloud Native Mesh Orchestration", "Distributed Real-Time Sensor Processing"],
      missingCapabilities: ["MIL-STD-810H Hardware Integration"],
      rationale: "Highly suited for distributed infrastructure orchestration across tactical sensor nodes."
    }
  ],
  capabilityGaps: [
    {
      capabilityName: "DO-178C Safety Critical Avionics Certification",
      domain: "SAFETY_AVIONICS",
      requiredByRoleTitle: "Senior Defense AI Systems Engineer",
      organizationName: "Helsing",
      severity: "MEDIUM",
      reason: "Role requires familiarity with safety-critical certification standards for flight-level systems."
    },
    {
      capabilityName: "MIL-STD-810H Hardware Integration",
      domain: "EMBEDDED_HARDWARE",
      requiredByRoleTitle: "Edge Platform Infrastructure Lead",
      organizationName: "Anduril Industries",
      severity: "LOW",
      reason: "Role involves direct interface with ruggedized edge processing chassis."
    }
  ],
  nextActions: [
    {
      actionId: "ACT-01",
      title: "Document Safety-Critical Software Engineering Practices",
      description: "Provide open-source documentation or whitepapers detailing deterministic testing and fault-tolerant architectures.",
      expectedImpact: "Closes the DO-178C Capability Gap and increases Helsing Role Fit Score to 0.97."
    },
    {
      actionId: "ACT-02",
      title: "Showcase Embedded Hardware-in-the-Loop Benchmarks",
      description: "Publish latency & thermal resilience benchmarks for embedded real-time sensor processing pipelines.",
      expectedImpact: "Strengthens evidence for hardware-level deployment across Anduril edge platforms."
    }
  ],
  reactFlowGraph: {
    nodes: [
      {
        id: "CENTER",
        type: "condynCore",
        position: { x: 0, y: 0 },
        data: { label: "Candidate Intelligence Profile", tier: "PRIMARY" }
      },
      {
        id: "CAP-01",
        type: "capabilityNode",
        position: { x: -220, y: -120 },
        data: { label: "Real-Time Sensor Processing", confidence: 0.94 }
      },
      {
        id: "CAP-02",
        type: "capabilityNode",
        position: { x: 220, y: -120 },
        data: { label: "Defense AI Inference", confidence: 0.89 }
      },
      {
        id: "ORG-HELSING",
        type: "organizationNode",
        position: { x: 0, y: 240 },
        data: { label: "Helsing", fitScore: 0.92 }
      }
    ],
    edges: [
      { id: "e1", source: "CENTER", target: "CAP-01", label: "0.94" },
      { id: "e2", source: "CENTER", target: "CAP-02", label: "0.89" },
      { id: "e3", source: "CAP-01", target: "ORG-HELSING", label: "fit" },
      { id: "e4", source: "CAP-02", target: "ORG-HELSING", label: "fit" }
    ]
  }
};
