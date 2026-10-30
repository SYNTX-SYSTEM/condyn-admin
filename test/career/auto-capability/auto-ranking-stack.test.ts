import { describe, expect, it } from "vitest";
import { CAREER_DEMO_LAYOUT_CSS } from "../../../app/components/career/demo/career-demo-layout";

/**
 * PINK §3.85 F-AC-1 (stack tier, 960 × 540 @2 and 640 × 360 @2): the stack rule `[data-pxj-panel] { max-height: none; overflow:
 * visible }` let the automatic ranking stand as a full list (73 ranks, ~9–11k px) above the six orbits — orbit 01 out of reach. In the
 * stack tier the automatic panel now keeps at most half the viewport and scrolls in itself; the full and fit tiers, the manual
 * discovery panel and the B2 panel keep their rules. The browser measurement is the walk's (evidence/auto-capability-path).
 */
const STACK = "@media (max-width: 1099px), (max-height: 599px)";
const block = (head: string) => { const all = CAREER_DEMO_LAYOUT_CSS; const at = all.indexOf(head); if (at < 0) return ""; let depth = 0, i = all.indexOf("{", at); const start = i; for (; i < all.length; i += 1) { if (all[i] === "{") depth += 1; if (all[i] === "}" && --depth === 0) break; } return all.slice(start, i); };
const RULE = '[data-testid="auto-ranking-panel"] { max-height: 50vh !important; overflow-y: auto !important; overscroll-behavior: contain; }';
const GENERIC = /\[data-pxj-panel\] \{ position: relative !important;[^}]*max-height: none !important; overflow: visible !important; \}/;

describe("F-AC-1 · the automatic ranking in the stack tier", () => {
  it("REPRODUCE: the stack tier bounds the automatic panel to half the viewport, scrolling in itself — after the generic panel rule", () => {
    const stack = block(STACK);
    expect(stack).toContain(RULE);
    const generic = GENERIC.exec(stack);
    expect(generic).not.toBeNull();
    // Same specificity, both !important: the later rule wins, so it must stand after the generic one.
    expect(stack.indexOf(RULE)).toBeGreaterThan(generic!.index);
  });

  it("inverse: only the stack tier, only the automatic panel — the generic panel rule (manual discovery, B2) is unchanged", () => {
    expect(CAREER_DEMO_LAYOUT_CSS.split('[data-testid="auto-ranking-panel"]').length - 1).toBe(1);
    expect(block(STACK)).toMatch(GENERIC);
    expect(block(STACK)).not.toMatch(/\[data-rd-panel\] \{[^}]*max-height/);
  });
});
