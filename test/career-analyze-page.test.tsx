import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import * as fs from "fs";
import * as path from "path";
import LiveCareerAnalysisPage from "../app/career/analyze/page";

// Mock child components that require DOM / Canvas / ResizeObserver in Node SSR environment
vi.mock("../app/components/career/ReactFlowCareerGraph", () => ({
  ReactFlowCareerGraph: ({ graph }: any) => (
    <div data-testid="mock-reactflow-career-graph" data-nodes={graph?.nodes?.length || 0} />
  )
}));

vi.mock("../app/components/career/Sidebar", () => ({
  Sidebar: () => <div data-testid="mock-sidebar" />
}));

vi.mock("../app/components/career/Inspector", () => ({
  Inspector: () => <div data-testid="mock-inspector" />
}));

describe("CONDYN Career Analysis Protocol v1.0 - Step 7.1: Client Live Analysis UI Page", () => {
  it("should render input textarea, title field, document preview list, and submit button", () => {
    const html = renderToString(<LiveCareerAnalysisPage />);

    expect(html).toContain("CONDYN Live Career Analysis");
    expect(html).toContain('data-testid="doc-title-input"');
    expect(html).toContain('data-testid="doc-content-textarea"');
    expect(html).toContain('data-testid="add-doc-button"');
    expect(html).toContain('data-testid="start-analysis-button"');
  });

  it("should render submit button disabled by default when no document is staged or textarea is empty", () => {
    const html = renderToString(<LiveCareerAnalysisPage />);

    expect(html).toMatch(/disabled(=""|)?/);
  });

  it("blocks the start without a VALID selected job and names the absence (SFE job-scope invariant)", () => {
    const html = renderToString(<LiveCareerAnalysisPage />);

    expect(html).toMatch(/data-testid="analyze-job-scope" data-job-scope-state="NONE"/);
    expect(html).toContain("Kein Job gewählt");
    expect(html).toContain('data-testid="analyze-job-scope-required"');
    expect(html).toContain("Bitte wählen Sie einen Job aus.");
    expect(html).toMatch(/data-testid="start-analysis-button" disabled=""/);
  });

  it("sends the job scope with every analysis request and only after a VALID check", () => {
    const content = fs.readFileSync(path.join(__dirname, "../app/career/analyze/page.tsx"), "utf-8");
    expect(content).toContain('if (jobScopeValidation.state !== "VALID") return;');
    expect(content).toContain("JSON.stringify({ documents: docsToSubmit, jobScope: { jobPoolUploadId: scope.jobPoolUploadId, poolRoleId: scope.poolRoleId } })");
    expect(content.match(/fetch\(/g)).toHaveLength(1);
  });

  it("should strictly enforce Dumb Consumer principle: zero imports or calls to Zod, Validator, Repository, or LLM SDKs in Client Page", () => {
    const filePath = path.join(__dirname, "../app/career/analyze/page.tsx");
    if (!fs.existsSync(filePath)) {
      // If file doesn't exist yet during TDD Red phase, let the test fail cleanly
      expect(fs.existsSync(filePath)).toBe(true);
      return;
    }
    const content = fs.readFileSync(filePath, "utf-8");

    // Must not import server domain/backend modules or Zod/LLM SDKs
    expect(content).not.toMatch(/from\s+["'].*zod.*["']/i);
    expect(content).not.toMatch(/from\s+["'].*validator.*["']/i);
    expect(content).not.toMatch(/from\s+["'].*repository.*["']/i);
    expect(content).not.toMatch(/from\s+["'].*CanonicalCareerAnalysis.*["']/i);
    expect(content).not.toMatch(/from\s+["'].*@google\/genai.*["']/i);
    expect(content).not.toMatch(/from\s+["'].*openai.*["']/i);

    // Must strictly communicate via fetch / Request / Response
    expect(content).toContain("fetch");
    expect(content).toContain("/api/career/analyze");
  });
});
