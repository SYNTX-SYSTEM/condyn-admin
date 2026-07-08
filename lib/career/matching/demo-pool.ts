import { CompanyPoolData } from "./pool";

/**
 * Curated active standard Company Pool for CONDYN Career Analysis Protocol v1.0.
 * Serves as the controlled knowledge base for deterministic career matching.
 */
export const DEMO_COMPANY_POOL: CompanyPoolData = {
  pool: {
    id: "pool_demo_master_v1",
    name: "CONDYN Master Deep Tech & Industrial Pool",
    description: "Controlled pool of leading deep-tech, AI, and industrial enterprise organizations.",
    version: 1,
    status: "ACTIVE",
    created_at: "2026-07-08T00:00:00.000Z"
  },
  organizations: [
    {
      id: "org_siemens",
      pool_id: "pool_demo_master_v1",
      org_id: "siemens_ag",
      name: "Siemens AG",
      country_iso: "DE",
      region: "Munich / EMEA",
      industry: "Industrial Edge & Automation Systems",
      scale: "Enterprise (100k+)",
      description: "Global technology powerhouse focused on industry automation, edge computing, and smart infrastructure."
    },
    {
      id: "org_helsing",
      pool_id: "pool_demo_master_v1",
      org_id: "helsing_ai",
      name: "Helsing GmbH",
      country_iso: "DE",
      region: "Munich / London",
      industry: "Defense AI & Sensor Fusion",
      scale: "Scaleup (500+)",
      description: "AI software company developing real-time sensor fusion and software-defined mission systems."
    },
    {
      id: "org_sap",
      pool_id: "pool_demo_master_v1",
      org_id: "sap_se",
      name: "SAP SE",
      country_iso: "DE",
      region: "Walldorf / Global",
      industry: "Enterprise Cloud Platforms",
      scale: "Enterprise (100k+)",
      description: "Market leader in enterprise application software and distributed cloud mesh architectures."
    }
  ],
  roles: [
    {
      id: "role_siemens_arch",
      pool_id: "pool_demo_master_v1",
      organization_id: "org_siemens",
      title: "Principal Edge Systems Architect",
      seniority: "Principal / L6",
      domain_focus: "Industrial Edge Systems",
      description: "Lead architect for distributed real-time industrial edge orchestration."
    },
    {
      id: "role_helsing_ai",
      pool_id: "pool_demo_master_v1",
      organization_id: "org_helsing",
      title: "Senior Autonomous Defense Systems Engineer",
      seniority: "Senior / L5",
      domain_focus: "Sensor Fusion & Embedded Systems",
      description: "Staff engineer building low-latency sensor processing systems."
    },
    {
      id: "role_sap_cloud",
      pool_id: "pool_demo_master_v1",
      organization_id: "org_sap",
      title: "Chief Enterprise Platform Architect",
      seniority: "Fellow / L7",
      domain_focus: "Cloud Mesh Infrastructure",
      description: "Architect driving next-generation distributed enterprise platforms."
    }
  ],
  requirements: [
    // Siemens requirements
    {
      id: "req_siemens_1",
      role_id: "role_siemens_arch",
      capability_name: "Distributed Systems",
      domain: "Systems Engineering",
      weight: 0.40,
      required_level: "L5 - Expert",
      evidence_hint: "Demonstrated production leadership in distributed clustering or consensus protocols."
    },
    {
      id: "req_siemens_2",
      role_id: "role_siemens_arch",
      capability_name: "Edge Computing Architecture",
      domain: "Edge Systems",
      weight: 0.35,
      required_level: "L5 - Expert",
      evidence_hint: "Experience architecting edge gateways and real-time processing pipelines."
    },
    {
      id: "req_siemens_3",
      role_id: "role_siemens_arch",
      capability_name: "Industrial IoT Protocol Design",
      domain: "Industrial IoT",
      weight: 0.25,
      required_level: "L4 - Advanced",
      evidence_hint: "Hands-on experience with industrial messaging and deterministic networking."
    },
    // Helsing requirements
    {
      id: "req_helsing_1",
      role_id: "role_helsing_ai",
      capability_name: "Real-Time Sensor Fusion",
      domain: "Sensor Systems",
      weight: 0.45,
      required_level: "L5 - Expert"
    },
    {
      id: "req_helsing_2",
      role_id: "role_helsing_ai",
      capability_name: "High-Performance Rust & C++",
      domain: "Systems Programming",
      weight: 0.35,
      required_level: "L4 - Advanced"
    },
    {
      id: "req_helsing_3",
      role_id: "role_helsing_ai",
      capability_name: "Embedded ML Inference",
      domain: "Edge AI",
      weight: 0.20,
      required_level: "L4 - Advanced"
    }
  ],
  search_queries: [
    {
      id: "sq_siemens_1",
      pool_id: "pool_demo_master_v1",
      query: "Siemens Principal Edge Systems Architect Industrial IoT",
      target: "org_siemens",
      priority: 1
    }
  ]
};
