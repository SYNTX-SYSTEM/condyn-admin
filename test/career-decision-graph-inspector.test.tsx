import React from "react";
import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { DecisionGraphInspector } from "../app/components/career/demo/DecisionGraphInspector";
import { buildEvidenceGraph } from "../lib/career/evidence/traversal";
import { computeGraphFocus } from "../lib/career/evidence/highlight";
import { JobRoleProfile } from "../lib/career/matching/job-mapping";

describe("CONDYN Career Analysis Protocol v1.0 — Step 24b: Decision Graph Inspector UI", () => {
  const sampleAnalysis: any = {
    structured_data: {
      analysis: {
        documents: [
          {
            entity_id: "DOC_SIEMENS_REF",
            identity: { name: "Siemens_Architecture_Project.pdf", type: "document" },
            evidence: [
              {
                doc_id: "DOC_SIEMENS_REF",
                location: "Page 14, Section 3.2",
                context_quote: "Designed and operated multi-cluster Kubernetes orchestration with 99.99% SLA across 40 nodes.",
                evidence_score: 0.98
              }
            ]
          }
        ],
        capabilities: [
          {
            entity_id: "CAP_K8S",
            identity: { name: "Kubernetes Orchestration" },
            confidence: 0.95,
            properties: { domain: "DevOps" },
            evidence: [
              {
                doc_id: "DOC_SIEMENS_REF",
                location: "Page 14, Section 3.2",
                context_quote: "Designed and operated multi-cluster Kubernetes orchestration with 99.99% SLA across 40 nodes.",
                evidence_score: 0.98
              }
            ]
          }
        ]
      }
    }
  };

  const sampleJobs: JobRoleProfile[] = [
    {
      jobId: "job_siemens_lead",
      title: "Principal Cloud Architect",
      company: "Siemens AG",
      requirements: [
        {
          capability_name: "Kubernetes Orchestration",
          domain: "DevOps",
          weight: 0.6,
          required_level: "L5"
        }
      ]
    }
  ];

  it("1. should render idle state when no focus is selected", () => {
    const graph = buildEvidenceGraph(sampleAnalysis, sampleJobs);
    const html = renderToString(<DecisionGraphInspector graph={graph} focus={null} />);

    expect(html).toContain("data-testid=\"decision-graph-inspector-idle\"");
    expect(html).toContain("Hover or select any node in the Planetarium");
  });

  it("2. should render all 6 sections (FOCUS NODE, DECISION STATE, EVIDENCE QUALITY, TRACEABILITY FLOW, UPSTREAM, DOWNSTREAM) when focus is provided", () => {
    const graph = buildEvidenceGraph(sampleAnalysis, sampleJobs);
    const focus = computeGraphFocus(graph, "CAP_K8S");

    const html = renderToString(<DecisionGraphInspector graph={graph} focus={focus} />);

    expect(html).toContain("data-testid=\"decision-graph-inspector\"");
    expect(html).toContain("Kubernetes Orchestration");
    expect(html).toContain("data-testid=\"decision-state-container\"");
    expect(html).toContain("data-testid=\"evidence-quality-badge\"");
    expect(html).toContain("data-testid=\"traversal-animation\"");
    expect(html).toContain("UPSTREAM");
    expect(html).toContain("DOWNSTREAM");
  });

  it("3. should display SUPPORTED decision state and HIGH CONFIDENCE badge when evidence score > 0.85", () => {
    const graph = buildEvidenceGraph(sampleAnalysis, sampleJobs);
    const focus = computeGraphFocus(graph, "CAP_K8S");

    const html = renderToString(<DecisionGraphInspector graph={graph} focus={focus} />);

    expect(html).toContain("data-testid=\"decision-state-supported\"");
    expect(html).toContain("HIGH CONFIDENCE");
  });

  it("4. should display BLOCKED decision state when evidence score is weak (< 0.70)", () => {
    const weakAnalysis = {
      structured_data: {
        analysis: {
          documents: [],
          capabilities: [
            {
              entity_id: "CAP_K8S",
              identity: { name: "Kubernetes Orchestration" },
              confidence: 0.40,
              evidence: []
            }
          ]
        }
      }
    };
    const graph = buildEvidenceGraph(weakAnalysis, sampleJobs);
    const focus = computeGraphFocus(graph, "CAP_K8S");

    const html = renderToString(<DecisionGraphInspector graph={graph} focus={focus} />);

    expect(html).toContain("data-testid=\"decision-state-blocked\"");
    expect(html).toContain("WEAK EVIDENCE");
  });
});
