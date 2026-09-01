import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SemanticCareerIntelligenceField } from "../app/components/career/demo/SemanticCareerIntelligenceField";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../app/career/demo/demo-data";

vi.mock("../lib/career/ui/useCareerAnalysisJob", () => ({
  useCareerAnalysisJob: () => ({
    state: {
      state: "SUCCEEDED",
      canonicalAnalysis: null,
      currentOperation: null,
      attemptCount: 1,
      errorCode: null,
      errorSummary: null
    },
    submitAnalysis: vi.fn()
  })
}));

const allStages = [
  ["01", 0, -330],
  ["02", 285.79, -165],
  ["03", 285.79, 165],
  ["04", 0, 330],
  ["05", -285.79, 165],
  ["06", -285.79, -165]
] as const;

const asymmetricStages = allStages.filter(([stageId]) =>
  ["03", "04", "05"].includes(stageId)
);

function renderFocusedEmptyStage(stageId: string) {
  return renderToStaticMarkup(
    <SemanticCareerIntelligenceField
      data={EMPTY_CAREER_INTELLIGENCE_DATA}
      initialFocus={{ stageId: stageId as any, zoomLevel: 1 }}
    />
  );
}

/** Parses the actual server-rendered div subtree; it is not a synthetic
 * geometry model. The test assertions below operate on the real field DOM. */
function getRenderedDivByTestId(html: string, testId: string) {
  const attribute = `data-testid="${testId}"`;
  const attributeIndex = html.indexOf(attribute);
  expect(attributeIndex).toBeGreaterThanOrEqual(0);

  const start = html.lastIndexOf("<div", attributeIndex);
  const divTag = /<\/?div(?:\s[^>]*)?>/g;
  divTag.lastIndex = start;
  let depth = 0;
  let end = -1;
  let match: RegExpExecArray | null;

  while ((match = divTag.exec(html))) {
    if (match[0].startsWith("</")) {
      depth -= 1;
      if (depth === 0) {
        end = divTag.lastIndex;
        break;
      }
    } else {
      depth += 1;
    }
  }

  expect(end).toBeGreaterThan(start);
  return {
    opening: html.slice(start, html.indexOf(">", start) + 1),
    html: html.slice(start, end)
  };
}

describe("F12 actual empty-projection focus-shell DOM ownership", () => {
  it.each(allStages)(
    "renders active empty Stage %s bubble and empty projection beneath one shared shell",
    (stageId) => {
      const html = renderFocusedEmptyStage(stageId);
      const shell = getRenderedDivByTestId(
        html,
        `focus-transition-stage-shell-${stageId}`
      );
      const bubble = getRenderedDivByTestId(
        html,
        `focused-stage-bubble-${stageId}`
      );
      const underlay = getRenderedDivByTestId(
        html,
        `empty-visual-underlay-${stageId}`
      );
      const copy = getRenderedDivByTestId(
        html,
        `empty-copy-foreground-${stageId}`
      );

      expect(shell.html).toContain(bubble.opening);
      expect(shell.html).toContain(underlay.opening);
      expect(shell.html).toContain(copy.opening);
      expect(shell.html).toContain(
        `data-testid="focus-transition-pulse-${stageId}"`
      );
      expect(underlay.html).toContain(`data-testid="sil-orbit-empty-state-${stageId}"`);
      expect(underlay.opening).toContain("z-index:0");
      expect(bubble.opening).toContain("z-index:1");
      expect(copy.opening).toContain("z-index:3");
      expect(copy.opening).toContain("left:50%");
      expect(copy.opening).toContain("translateX(-50%)");
      expect(html).not.toContain("NO ACTUAL ITEMS PROJECTED");
    }
  );

  it.each(asymmetricStages)(
    "uses the Stage %s shell—not bubble or empty projection—for asymmetric orbit translation",
    (stageId, x, y) => {
      const html = renderFocusedEmptyStage(stageId);
      const shell = getRenderedDivByTestId(
        html,
        `focus-transition-stage-shell-${stageId}`
      );
      const bubble = getRenderedDivByTestId(
        html,
        `focused-stage-bubble-${stageId}`
      );
      const copy = getRenderedDivByTestId(
        html,
        `empty-copy-foreground-${stageId}`
      );

      expect(shell.opening).toContain(
        `transform:translate(${-x}px, ${-y}px)`
      );
      expect(bubble.opening).not.toContain("left:");
      expect(bubble.opening).not.toContain("top:");
      expect(copy.opening).not.toContain(`${400 + x}px`);
      expect(copy.opening).not.toContain(`${400 + y}px`);
    }
  );

  it("locates the real Stage 05 empty-projection copy beneath its focus shell", () => {
    const html = renderFocusedEmptyStage("05");
    const copy = getRenderedDivByTestId(
      html,
      "empty-copy-foreground-05"
    );

    expect(copy.html).toContain("EMPTY FIELD // EXPLAINED");
    expect(copy.html).toContain("NO GAP PROJECTION AVAILABLE");
  });
});
