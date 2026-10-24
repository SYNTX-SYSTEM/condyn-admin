import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SemanticCareerIntelligenceField, resolveSilFocusedOrbitPresentation } from "../app/components/career/demo/SemanticCareerIntelligenceField";
import { FocusTransitionStageShell } from "../app/components/career/demo/manifestation/SyntxFocusShell";
import { SilOrbitEmptyState, SilOrbitEmptyStateCopy } from "../app/components/career/demo/SilOrbitEmptyState";
import { OrbitalResonanceBubble } from "../app/components/career/demo/OrbitalResonanceBubble";
import { SIL_COPY, type SilLocale } from "../lib/career/view-model/sil-language";
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

// Owner G1 Q1: the default PERSON × JOB hides orbits 03–06. RD-5 (owner D-RD-5 = B): under PERSON as well — the field renders the
// shells of 01 and 02; the 03–06 shells are checked as components below, composed exactly as the field composes a focused stage
// (SemanticCareerIntelligenceField, FocusTransitionStageShell + SilOrbitEmptyState + SilOrbitEmptyStateCopy).
const fieldStages = allStages.filter(([stageId]) => ["01", "02"].includes(stageId));
const legacyStages = allStages.filter(([stageId]) => ["03", "04", "05", "06"].includes(stageId));
function renderFocusedEmptyStage(stageId: string) {
  return renderToStaticMarkup(
    <SemanticCareerIntelligenceField
      data={EMPTY_CAREER_INTELLIGENCE_DATA}
      investigationMode="PERSON"
      initialFocus={{ stageId: stageId as any, zoomLevel: 1 }}
    />
  );
}

const GLYPHS: Record<string, string> = { "03": "◎", "04": "⎔", "05": "⟁", "06": "∿" };
/** A focused empty stage as components: the field's composition for a cosmos anchor with an EMPTY_PROJECTION presentation. */
function renderFocusedEmptyStageComponents(stageId: string, locale: SilLocale = "en") {
  const [, x, y] = allStages.find(([id]) => id === stageId)!;
  const presentation = resolveSilFocusedOrbitPresentation(stageId, 1, EMPTY_CAREER_INTELLIGENCE_DATA, locale);
  expect(presentation?.kind).toBe("EMPTY_PROJECTION");
  const emptyState = presentation!.emptyState!;
  const copy = SIL_COPY[locale].orbits[stageId as "03"];
  return renderToStaticMarkup(
    <FocusTransitionStageShell stageId={stageId} x={x} y={y} isCosmosAnchor isCosmosBackground={false} showFocusPulse copyAboveAnchorOpacity
      emptyVisualUnderlay={<SilOrbitEmptyState stageId={stageId} state={emptyState} showCopy={false} towardCore={{ x: 0, y: 0 }} />}
      emptyCopyForeground={<SilOrbitEmptyStateCopy stageId={stageId} state={emptyState} />}>
      <OrbitalResonanceBubble stageId={stageId} stageName={`${GLYPHS[stageId]} ${copy.name}`} subtitle={copy.subtitle} itemCount={0} previewItems={[]} locale={locale} />
    </FocusTransitionStageShell>
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
  it.each([...fieldStages.map(([stageId]) => ["field", stageId] as const), ...legacyStages.map(([stageId]) => ["components", stageId] as const)])(
    "renders active empty Stage bubble and empty projection beneath one shared shell (%s, Stage %s)",
    (via, stageId) => {
      const html = via === "field" ? renderFocusedEmptyStage(stageId) : renderFocusedEmptyStageComponents(stageId);
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
    "uses the Stage %s shell—not bubble or empty projection—for asymmetric orbit translation (components)",
    (stageId, x, y) => {
      const html = renderFocusedEmptyStageComponents(stageId);
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

  it("locates the real Stage 05 empty-projection copy beneath its focus shell (components)", () => {
    const html = renderFocusedEmptyStageComponents("05");
    const copy = getRenderedDivByTestId(
      html,
      "empty-copy-foreground-05"
    );

    expect(copy.html).toContain("EMPTY FIELD // EXPLAINED");
    expect(copy.html).toContain("NO GAP PROJECTION AVAILABLE");
  });

  it.each(legacyStages)("RD-5 · under PERSON the field renders no Stage %s shell, also when a focus requests it", (stageId) => {
    const html = renderFocusedEmptyStage(stageId);
    for (const [legacy] of legacyStages) {
      expect(html).not.toContain(`data-testid="focus-transition-stage-shell-${legacy}"`);
      expect(html).not.toContain(`data-testid="empty-copy-foreground-${legacy}"`);
    }
    for (const [stage] of fieldStages) expect(html).toContain(`data-testid="focus-transition-stage-shell-${stage}"`);
    expect(html).toContain('data-focused-stage-id=""');
  });

  it.each(legacyStages)("each Stage %s component labels its empty projection in English and German", (stageId) => {
    for (const locale of ["en", "de"] as const) {
      const html = renderFocusedEmptyStageComponents(stageId, locale);
      const copy = getRenderedDivByTestId(html, `empty-copy-foreground-${stageId}`);
      const state = resolveSilFocusedOrbitPresentation(stageId, 1, EMPTY_CAREER_INTELLIGENCE_DATA, locale)!.emptyState!;
      expect(copy.html).toContain(SIL_COPY[locale].emptyFieldLabel);
      expect(copy.html).toContain(state.title);
      expect(html).toContain(SIL_COPY[locale].orbits[stageId as "03"].name);
    }
    expect(renderFocusedEmptyStageComponents(stageId, "de")).not.toContain(SIL_COPY.en.orbits[stageId as "03"].name);
  });
});
