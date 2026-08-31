import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";

import {
  SilOrbitEmptyState
} from "../app/components/career/demo/SilOrbitEmptyState";

import {
  resolveSilFocusedOrbitPresentation
} from "../app/components/career/demo/SemanticCareerIntelligenceField";

const emptyState = {
  stageId: "06" as const,
  label: "EMPTY FIELD // EXPLAINED",
  title: "NO EVOLUTION PATHS PROJECTED",
  reason: "The validated analysis contains no projected next actions."
};

const emptyData: any = {
  analysisId: "ANL_GHOST",
  generatedAt: "2026-08-31T00:00:00.000Z",
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

describe("SIL focused empty-orbit ghost manifestation", () => {
  it("renders the empty state as a ghost manifestation rather than a generic card", () => {
    const html = renderToString(
      <SilOrbitEmptyState
        stageId="06"
        state={emptyState}
        towardCore={{ x: 210, y: 0 }}
      />
    );

    expect(html).toContain(
      'data-testid="sil-ghost-manifestation-06"'
    );

    expect(html).toContain(
      'data-testid="sil-ghost-membrane-06"'
    );

    expect(html).toContain(
      'data-testid="sil-ghost-tether-06"'
    );

    expect(html).toContain(
      'data-testid="sil-ghost-stage-glyph-06"'
    );
  });

  it("preserves the exact explained-empty-state semantics", () => {
    const html = renderToString(
      <SilOrbitEmptyState
        stageId="06"
        state={emptyState}
        towardCore={{ x: 210, y: 0 }}
      />
    );

    expect(html).toContain("EMPTY FIELD // EXPLAINED");
    expect(html).toContain("NO EVOLUTION PATHS PROJECTED");
    expect(html).toContain(
      "The validated analysis contains no projected next actions."
    );
  });

  it("uses coupled red and orbit-accent energy instead of an error card", () => {
    const html = renderToString(
      <SilOrbitEmptyState
        stageId="06"
        state={emptyState}
        towardCore={{ x: 210, y: 0 }}
      />
    );

    expect(html).toContain("ghostMembraneBreathe");
    expect(html).toContain("ghostTetherPulse");

    expect(html).toMatch(
      /rgba\(255,\s*56,\s*68,/
    );

    expect(html).not.toContain(">ERROR<");
    expect(html).not.toContain(">BLOCKED<");
  });

  it("exposes a bounded focused-empty presentation for L1", () => {
    const presentation =
      resolveSilFocusedOrbitPresentation(
        "06",
        1,
        emptyData,
        "en"
      );

    expect(presentation?.kind).toBe(
      "EMPTY_PROJECTION"
    );

    expect(presentation?.stateLabel).toBe(
      "EMPTY PROJECTION"
    );

    expect(presentation?.evidenceLabel).toBe(
      "NONE PROJECTED"
    );

    expect(presentation?.emptyState?.stageId).toBe(
      "06"
    );
  });

  it("does not expose empty focus semantics in L0", () => {
    expect(
      resolveSilFocusedOrbitPresentation(
        "06",
        0,
        emptyData,
        "en"
      )
    ).toBeNull();
  });

  it("does not call a projected empty field resonant or verified", () => {
    const presentation =
      resolveSilFocusedOrbitPresentation(
        "06",
        1,
        emptyData,
        "en"
      );

    expect(presentation?.stateLabel).not.toBe(
      "RESONANT"
    );

    expect(presentation?.evidenceLabel).not.toBe(
      "VERIFIED"
    );
  });

  it("does not invent ghost semantics for a populated orbit", () => {
    const populated = {
      ...emptyData,
      nextActions: [
        {
          actionId: "ACT_001",
          title: "Validate next step",
          description: "Projected action"
        }
      ]
    };

    const presentation =
      resolveSilFocusedOrbitPresentation(
        "06",
        1,
        populated,
        "en"
      );

    expect(presentation?.kind).not.toBe(
      "EMPTY_PROJECTION"
    );

    expect(presentation?.emptyState).toBeNull();
  });
});
