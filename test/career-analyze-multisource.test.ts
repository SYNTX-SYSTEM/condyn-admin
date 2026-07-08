import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { POST } from "../app/api/career/analyze/route";

describe("CONDYN Career Analysis Protocol v1.0 — Step 19d: Multi-Source API Route (`test/career-analyze-multisource.test.ts`)", () => {
  beforeEach(() => {
    process.env.USE_GEMINI_PROVIDER = "false";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should accept website source item and invoke loadWebsiteDocument server-side", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async (url: any) => {
      if (String(url) === "https://condyn.eu/architect") {
        return {
          ok: true,
          status: 200,
          text: async () => "<html><body><h1>Cloud Systems Architect</h1><p>10 years building high-availability distributed systems.</p></body></html>"
        } as any;
      }
      return { ok: false, status: 404 } as any;
    });

    const req = new Request("http://localhost:3000/api/career/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documents: [
          { type: "website", url: "https://condyn.eu/architect", title: "Architect Profile" }
        ]
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.status).toBe("VERIFIED");
    expect(body.analysisId).toMatch(/^ANL_/);
    expect(body.reactFlowGraph).toBeDefined();
    expect(Array.isArray(body.reactFlowGraph.nodes)).toBe(true);
  });

  it("should accept github source item and invoke loadGitHubRepositoryDocuments server-side", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.endsWith("/readme")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            name: "README.md",
            path: "README.md",
            content: Buffer.from("# CONDYN Platform\nSemantic Analysis Platform for Enterprise Architecture.").toString("base64")
          })
        } as any;
      }
      return { ok: false, status: 404 } as any;
    });

    const req = new Request("http://localhost:3000/api/career/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documents: [
          { type: "github", url: "https://github.com/condyn/career-engine" }
        ]
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.status).toBe("VERIFIED");
    expect(body.analysisId).toMatch(/^ANL_/);
  });

  it("should accept mixed batch (text + website + github) and combine into unified DocumentInput[]", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async (url: any) => {
      const urlStr = String(url);
      if (urlStr === "https://condyn.eu/bio") {
        return {
          ok: true,
          status: 200,
          text: async () => "<p>Principal Systems Engineer</p>"
        } as any;
      }
      if (urlStr.endsWith("/readme")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            name: "README.md",
            path: "README.md",
            content: Buffer.from("# Distributed Kernel Project").toString("base64")
          })
        } as any;
      }
      return { ok: false, status: 404 } as any;
    });

    const req = new Request("http://localhost:3000/api/career/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documents: [
          { type: "text", title: "Notes", content: "Expert in distributed consensus algorithms." },
          { type: "website", url: "https://condyn.eu/bio" },
          { type: "github", url: "https://github.com/condyn/kernel" }
        ]
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.status).toBe("VERIFIED");
  });

  it("should return HTTP 400 when url property is missing for website or github source", async () => {
    const reqWeb = new Request("http://localhost:3000/api/career/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documents: [{ type: "website", title: "Missing URL" }]
      })
    });

    const resWeb = await POST(reqWeb);
    expect(resWeb.status).toBe(400);
    const bodyWeb = await resWeb.json();
    expect(bodyWeb.success).toBe(false);
    expect(bodyWeb.issues[0].code).toBe("ERR_MISSING_SOURCE_URL");

    const reqGh = new Request("http://localhost:3000/api/career/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documents: [{ type: "github" }]
      })
    });

    const resGh = await POST(reqGh);
    expect(resGh.status).toBe(400);
    const bodyGh = await resGh.json();
    expect(bodyGh.issues[0].code).toBe("ERR_MISSING_SOURCE_URL");
  });

  it("should return HTTP 400 structured loader error when website URL is invalid", async () => {
    const req = new Request("http://localhost:3000/api/career/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documents: [{ type: "website", url: "ftp://invalid-scheme.example.com" }]
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.issues[0].code).toBe("ERR_INVALID_WEBSITE_URL");
  });

  it("should return HTTP 400 structured loader error when github URL is invalid", async () => {
    const req = new Request("http://localhost:3000/api/career/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documents: [{ type: "github", url: "https://gitlab.com/invalid/repo" }]
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.issues[0].code).toBe("ERR_INVALID_GITHUB_URL");
  });

  it("should preserve exact response structure compatibility (success, status, analysisId, metadata, reactFlowGraph)", async () => {
    const req = new Request("http://localhost:3000/api/career/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documents: [{ type: "text", title: "CV", content: "Senior Cloud Architect at Siemens." }]
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("success", true);
    expect(body).toHaveProperty("status", "VERIFIED");
    expect(body).toHaveProperty("analysisId");
    expect(body).toHaveProperty("metadata");
    expect(body).toHaveProperty("reactFlowGraph");
    expect(body.reactFlowGraph).toHaveProperty("nodes");
    expect(body.reactFlowGraph).toHaveProperty("edges");
  });
});
