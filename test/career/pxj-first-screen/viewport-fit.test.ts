import { describe, expect, it } from "vitest";
import { FIT_LEFT, FIT_TOP, STAGE_EXTENT, hudHeight, careerDemoLayoutTier, careerDemoStackZoom, careerDemoStageFit, fitPanelWidth } from "../../../app/components/career/demo/career-demo-layout";

/** O-PXJ-720: the tiers of the five acceptance viewports (+ 200 % of 1280×720) and the planetarium's fit. New module: on 421e382 this file fails at its import. */
const VIEWPORTS: Array<[string, number, number, string]> = [["1920x1080", 1920, 1080, "full"], ["1600x900", 1600, 900, "fit"], ["1440x900", 1440, 900, "fit"], ["1280x720", 1280, 720, "fit"], ["200% of 1920x1080", 960, 540, "stack"], ["200% of 1280x720", 640, 360, "stack"]];

describe("O-PXJ-720 · tiers and the planetarium's fit", () => {
  it.each(VIEWPORTS)("guard: %s is %s", (_name, width, height, tier) => { expect(careerDemoLayoutTier(width, height)).toBe(tier); });

  it("guard: in the fit tier the scaled planetarium stays inside the free area — below the shell, right of the dock, left of the B2 panel", () => {
    for (const [name, width, height, tier] of VIEWPORTS) {
      if (tier !== "fit") continue;
      for (const panel of [false, true]) {
        const { scale, dx, dy } = careerDemoStageFit(width, height, 61, panel);
        const half = (STAGE_EXTENT * scale) / 2, cx = width / 2 + dx, cy = 61 + (height - 61) / 2 + dy;
        const right = panel ? width - 24 - fitPanelWidth(width) - 16 : width - 24;
        expect(scale, name).toBeLessThanOrEqual(1);
        expect(cx - half, `${name} left${panel ? " panel" : ""}`).toBeGreaterThanOrEqual(FIT_LEFT - 0.5);
        expect(cx + half, `${name} right${panel ? " panel" : ""}`).toBeLessThanOrEqual(right + 0.5);
        // Below the shell and below the zoom telemetry over the free area (V-16).
        expect(cy - half, `${name} top`).toBeGreaterThanOrEqual(FIT_TOP + hudHeight(right - FIT_LEFT) + 10 - 0.5);
        expect(cy + half, `${name} bottom`).toBeLessThanOrEqual(height - 16 + 0.5);
      }
    }
  });

  it("guard: in the stack tier the planetarium fits the column and one screen height", () => {
    for (const [name, width, height] of [["960x540", 960, 540], ["640x360", 640, 360]] as const) {
      const zoom = careerDemoStackZoom(width, height);
      expect(STAGE_EXTENT * zoom, name).toBeLessThanOrEqual(Math.max(width - 32, STAGE_EXTENT * 0.3) + 0.5);
      expect(STAGE_EXTENT * zoom, name).toBeLessThanOrEqual(Math.max(height - 24, STAGE_EXTENT * 0.3) + 0.5);
    }
  });
});
