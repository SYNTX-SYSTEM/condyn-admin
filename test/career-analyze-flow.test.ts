import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "../app/api/career/analyze/route";
import * as providers from "../lib/career/providers";
import { MockInferenceProvider } from "../lib/career/adapter";

describe("CONDYN Career Analysis Protocol v1.0 - Step 7.2: Server Boundary API Route", () => {
  beforeEach(() => {
    vi.spyOn(providers, "getCareerInferenceProvider").mockReturnValue(new MockInferenceProvider());
  });
  it("should reject empty document array with HTTP 400 Bad Request", async () => {
    const req = new Request("http://localhost:3000/api/career/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documents: [] })
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.status).toBe("FAILED");
    expect(body.issues).toBeDefined();
    expect(body.issues[0].message).toContain("No documents provided");
  });

  it("should reject document with empty content string with HTTP 400 Bad Request", async () => {
    const req = new Request("http://localhost:3000/api/career/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documents: [{ title: "Empty Resume", content: "   " }]
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.status).toBe("FAILED");
    expect(body.issues[0].message).toContain("Document content cannot be empty");
  });

  it("should execute pipeline via MockInferenceProvider, verify schema, save to demo persistence, and return pre-computed reactFlowGraph", async () => {
    const sampleText = `
    Senior Cloud Systems Architect with 10 years of experience in distributed systems and Kubernetes.
    Led engineering teams at Siemens AG and BMW Group.
    Specialized in high-throughput event-driven microservices.
    `;

    const req = new Request("http://localhost:3000/api/career/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documents: [{ title: "Cloud Architect CV", content: sampleText }]
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.status).toBe("VERIFIED");
    expect(body.analysisId).toMatch(/^ANL_/);
    expect(body.metadata).toBeDefined();
    expect(body.metadata.document_count || body.metadata.source_document_count).toBeGreaterThanOrEqual(1);

    // Verify pre-computed ReactFlow graph
    expect(body.reactFlowGraph).toBeDefined();
    expect(Array.isArray(body.reactFlowGraph.nodes)).toBe(true);
    expect(Array.isArray(body.reactFlowGraph.edges)).toBe(true);
  });
});
