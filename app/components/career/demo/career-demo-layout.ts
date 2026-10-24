/**
 * Viewport layout of the career demo (owner "RECURSIVE UX/UI & SYSTEM CLOSURE" §05; O-PXJ-720, PINK V-01 … V-03).
 *
 * The field was laid out for one viewport: a planetarium of 800 px in a field of at least 960 px height under the 61 px header,
 * the source dock at mid-height, the inspector fixed at the lower left, the B2 panel at the right. Below that size the page
 * scrolled under the fixed shell, the inspector covered the source dock, the B2 panel moved below the fold and the shell ran off
 * the viewport. Three tiers, chosen by the viewport alone; nothing of the field's markup changes (the PERSON first screen stays
 * byte-identical), the rules below only re-place what is there:
 *
 *   full   ≥ 1600 × 1000 CSS px: unchanged.
 *   fit    from 1100 × 600 CSS px: the page is the viewport (no page scroll); the source dock starts below the shell and ends above
 *          the inspector; the B2 panel spans from below the shell to the bottom edge (its own scroll for the rows; `align-self:
 *          stretch`, since its inline `flex-start` would size an absolute box to its content); the planetarium
 *          is scaled into the free area between them (`--sx-stage-*`, set by `applyCareerDemoStageFit`).
 *   stack  narrower or lower (200 % browser zoom): one column that scrolls as a page — the shell wraps in rows and scrolls away
 *          with the page (nothing fixed lies over the content), then the B2 panel, the planetarium (zoomed to the column), the
 *          source dock and the inspector. No horizontal page scroll.
 *
 * The orbits, their motion and the neon grammar are untouched; only position and scale adapt.
 */
export type CareerDemoLayoutTier = "full" | "fit" | "stack";

export const LAYOUT_FULL = { width: 1600, height: 1000 } as const;
export const LAYOUT_FIT = { width: 1100, height: 600 } as const;
/** The planetarium's visible extent (orbit 02 and its satellites reach the 800 px box's edge). */
export const STAGE_EXTENT = 810;
/** Below the shell row (selector capsule ends at 120 px). */
export const FIT_TOP = 132;
/** Right of the source dock (40 … 380 px) with air. */
export const FIT_LEFT = 400;
/**
 * V-16: the zoom telemetry (L0 PLANETARIUM … L4 ORIGINAL) stood at top −46 px of the field, which clips it: invisible and out of
 * reach at every viewport. It now stands below the shell row (page y 128 in full, FIT_TOP in fit), centred over the free area;
 * one row of 36 px, two rows when the free area is narrower than it (560 px). The planetarium starts below it.
 */
export const HUD_TOP_FULL = 128;
export const hudHeight = (freeWidth: number) => (freeWidth < 580 ? 70 : 36);

export function careerDemoLayoutTier(width: number, height: number): CareerDemoLayoutTier {
  if (width >= LAYOUT_FULL.width && height >= LAYOUT_FULL.height) return "full";
  if (width >= LAYOUT_FIT.width && height >= LAYOUT_FIT.height) return "fit";
  return "stack";
}

/** The B2 panel's width in the fit tier (the CSS below uses the same). */
export const fitPanelWidth = (width: number) => Math.min(400, Math.round(width * 0.3));

export interface StageFit { scale: number; dx: number; dy: number; /** The free area's centre (the telemetry stands over it) and width. */ hudX: number; hudWidth: number }

/**
 * The planetarium in the fit tier: the largest scale (≤ 1) that keeps its extent inside the free area — below the shell, above
 * the bottom edge, right of the source dock and left of the right column (the B2 panel when it is shown) — centred in the viewport
 * when that costs little, else in the free area. `dx`/`dy` move it from its own centre (the field's centre) in CSS px.
 */
export function careerDemoStageFit(width: number, height: number, header: number, panel: boolean): StageFit {
  const left = FIT_LEFT, bottom = height - 16;
  const right = panel ? width - 24 - fitPanelWidth(width) - 16 : width - 24;
  const top = FIT_TOP + hudHeight(right - left) + 10;
  const vertical = (bottom - top) / STAGE_EXTENT;
  const centred = Math.min(1, vertical, (2 * Math.min(width / 2 - left, right - width / 2)) / STAGE_EXTENT);
  const shifted = Math.min(1, vertical, (right - left) / STAGE_EXTENT);
  const useCentre = centred >= 0.85 * shifted;
  const scale = Math.max(0.2, useCentre ? centred : shifted);
  const dx = useCentre ? 0 : (left + right) / 2 - width / 2;
  const dy = (top + bottom) / 2 - (header + (height - header) / 2);
  return { scale: Math.floor(scale * 1000) / 1000, dx: Math.round(dx), dy: Math.round(dy), hudX: Math.round((left + right) / 2), hudWidth: Math.round(right - left) };
}

/** The planetarium in the stack tier: zoomed to the column and to one screen height. */
export const careerDemoStackZoom = (width: number, height: number) => Math.round(Math.max(0.3, Math.min(1, (width - 32) / STAGE_EXTENT, (height - 24) / STAGE_EXTENT)) * 1000) / 1000;

/**
 * V-20: the runtime telemetry box (fixed at the lower right, its height following the run's state) lay over B2's lower rows — on
 * 70d1cb4 too. Its height is written on the root, and while it is shown the B2 panel ends above it (stylesheet).
 */
export function applyCareerDemoHudClearance(root: HTMLElement) {
  const hud = root.querySelector<HTMLElement>('[data-testid="inference-telemetry-hud"]');
  root.style.setProperty("--sx-hud-h", `${hud === null ? 0 : Math.ceil(hud.getBoundingClientRect().height)}px`);
}

/** Writes the tier's variables on the dashboard root (no re-render; the field's markup is not touched). */
export function applyCareerDemoStageFit(root: HTMLElement, width: number, height: number, header: number) {
  const free = careerDemoStageFit(width, height, header, false), panel = careerDemoStageFit(width, height, header, true);
  root.dataset.sxLayout = careerDemoLayoutTier(width, height);
  root.style.setProperty("--sx-stage-scale", String(free.scale));
  root.style.setProperty("--sx-stage-dx", `${free.dx}px`);
  root.style.setProperty("--sx-stage-scale-panel", String(panel.scale));
  root.style.setProperty("--sx-stage-dx-panel", `${panel.dx}px`);
  root.style.setProperty("--sx-stage-dy", `${free.dy}px`);
  root.style.setProperty("--sx-stage-dy-panel", `${panel.dy}px`);
  root.style.setProperty("--sx-hud-x", `${free.hudX}px`);
  root.style.setProperty("--sx-hud-w", `${free.hudWidth}px`);
  root.style.setProperty("--sx-hud-x-panel", `${panel.hudX}px`);
  root.style.setProperty("--sx-hud-w-panel", `${panel.hudWidth}px`);
  root.style.setProperty("--sx-stage-zoom", String(careerDemoStackZoom(width, height)));
}

const FIELD = '[data-testid="career-intelligence-dashboard"] [data-testid="semantic-career-intelligence-field"]';
const STAGE = `${FIELD} > div:has(> svg[data-testid="resonance-energy-paths"])`;
const DOCK = `${FIELD} > div:has([data-testid="source-dock"])`;
const PANEL_WRAP = `${FIELD} > div:has(> [data-pxj-panel])`;
const JOB = '[data-sx-field="job"]';
const HUD = `${FIELD} > [data-testid="semantic-zoom-telemetry"]`;
const INSPECTOR = '[data-testid="decision-graph-inspector-idle"], [data-testid="decision-graph-inspector"]';
const HUD_BOX = '[data-testid="inference-telemetry-hud"]';
const FIT = `(min-width: ${LAYOUT_FIT.width}px) and (min-height: ${LAYOUT_FIT.height}px) and (max-width: ${LAYOUT_FULL.width - 1}px), (min-width: ${LAYOUT_FIT.width}px) and (min-height: ${LAYOUT_FIT.height}px) and (max-height: ${LAYOUT_FULL.height - 1}px)`;
const STACK = `(max-width: ${LAYOUT_FIT.width - 1}px), (max-height: ${LAYOUT_FIT.height - 1}px)`;

export const CAREER_DEMO_LAYOUT_CSS = `
${HUD} { top: ${HUD_TOP_FULL - 61}px !important; max-width: none !important; }
/* P3 on shared shell elements (GELB: visual only — size and contrast; no text, element, order or state changes, in PERSON too).
   V-09: the job indicator's smallest type (10 px detail, 10.5 px label) reads at 11 px. V-10: the telemetry's inactive levels
   (2.44:1) and its separators (2.09:1) reach AA on the bar's dark glass; active levels keep their cyan. */
[data-testid="job-scope-indicator"] [data-testid="job-scope-detail"] { font-size: 11px !important; }
[data-testid="job-scope-indicator"] > span:nth-child(2) { font-size: 11px !important; }
${HUD} button { font-size: 11px !important; }
${HUD} button:disabled { color: rgba(156, 186, 204, 0.95) !important; }
${HUD} > span { color: rgba(130, 200, 224, 0.85) !important; }
@media (min-width: ${LAYOUT_FULL.width}px) and (min-height: ${LAYOUT_FULL.height}px) {
  ${FIELD}:has(${HUD_BOX}) [data-pxj-panel] { bottom: calc(97px + var(--sx-hud-h, 110px)) !important; max-height: calc(100% - 132px - 97px - var(--sx-hud-h, 110px)) !important; }
}
@media ${FIT} {
  ${FIELD}:has(${HUD_BOX}) [data-pxj-panel] { bottom: calc(36px + var(--sx-hud-h, 110px)) !important; }
  ${HUD} { top: ${FIT_TOP - 61}px !important; left: var(--sx-hud-x, 50%) !important; max-width: var(--sx-hud-w, 560px) !important; flex-wrap: wrap; justify-content: center; row-gap: 2px; }
  ${FIELD}:has([data-pxj-panel]) > [data-testid="semantic-zoom-telemetry"] { left: var(--sx-hud-x-panel, 50%) !important; max-width: var(--sx-hud-w-panel, 560px) !important; }
  /* V-18 / V-19: only the Capability Field becomes the viewport. The Job Field keeps 70d1cb4's size (≥ 960 px, the page scrolls):
     its role orbits are laid out on the stage's size — on a viewport-high stage they packed (no domain line) and moved under the
     panel. */
  [data-testid="career-intelligence-dashboard"]:has(> [data-testid="semantic-career-intelligence-field"][data-field-focus="CAPABILITY"]) { height: 100vh; overflow: hidden; display: flex; flex-direction: column; }
  ${FIELD}[data-field-focus="CAPABILITY"] { min-height: 0 !important; height: auto !important; flex: 1 1 auto; }
  ${STAGE} { transform-origin: 0 0; scale: var(--sx-stage-scale, 1); translate: var(--sx-stage-dx, 0px) var(--sx-stage-dy, 0px); }
  ${FIELD}:has([data-pxj-panel]) > div:has(> svg[data-testid="resonance-energy-paths"]) { scale: var(--sx-stage-scale-panel, 1); translate: var(--sx-stage-dx-panel, 0px) var(--sx-stage-dy-panel, 0px); }
  ${DOCK} { top: ${FIT_TOP - 61}px !important; transform: none !important; max-height: calc(100vh - ${FIT_TOP}px - 172px); overflow-y: auto; }
  /* The Job Field's panel ends above the bottom edge and scrolls in itself (its edge actions stay reachable at 720 px). */
  ${JOB} > [data-sx-orient] { max-height: calc(100vh - 161px); overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain; }
  /* … so the uploaded pools open beside it, not below it (out of the viewport). */
  ${JOB} > [data-testid="job-pool-list"] { top: 84px !important; left: calc(40px + min(340px, 28vw)) !important; max-height: calc(100vh - 161px) !important; }
  ${FIELD} [data-pxj-panel] { top: ${FIT_TOP - 61}px !important; bottom: 16px !important; right: 24px !important; max-height: none !important; width: min(400px, 30vw) !important; align-self: stretch !important; }
}
@media ${STACK} {
  [data-testid="career-intelligence-dashboard"] { min-height: 100vh; overflow-x: clip; }
  [data-testid="career-intelligence-dashboard"] > div:first-of-type { flex-wrap: wrap; row-gap: 8px; padding: 8px 16px !important; }
  [data-testid="career-intelligence-dashboard"] > div:first-of-type span { white-space: normal; overflow-wrap: anywhere; }
  ${FIELD} { height: auto !important; min-height: calc(100vh - 61px) !important; overflow: visible !important; display: grid !important; grid-template-columns: minmax(0, 1fr) auto; grid-auto-rows: auto; align-items: start; justify-items: stretch; gap: 6px 12px; padding: 8px 16px 28px; box-sizing: border-box; }
  ${FIELD} > * { grid-column: 1 / -1; }
  ${FIELD} > [data-sx-shell="controls"] { position: relative !important; top: auto !important; right: auto !important; order: 1; justify-self: end; flex-wrap: wrap; justify-content: flex-end; }
  ${FIELD} > [data-sx-shell="guide"] { order: 1; justify-self: start; align-self: center; }
  ${FIELD} > [data-sx-shell="guide"] > [data-testid="semantic-guide-drawer-toggle"] { position: relative !important; top: auto !important; right: auto !important; }
  ${FIELD} > [data-sx-shell="controls"], ${FIELD} > [data-sx-shell="guide"] { grid-row: 1; }
  ${FIELD} > [data-sx-shell="guide"] { grid-column: 1; }
  ${FIELD} > [data-sx-shell="controls"] { grid-column: 2; }
  ${FIELD} > [data-sx-shell="selector"] { position: relative !important; left: auto !important; top: auto !important; transform: none !important; order: 2; justify-self: center; max-width: 100%; }
  ${FIELD} > [data-sx-shell="selector"] button { width: auto !important; min-width: 0; padding-left: 14px !important; padding-right: 14px !important; }
  ${FIELD} > [data-sx-shell="job-scope"] { position: relative !important; left: auto !important; top: auto !important; transform: none !important; order: 3; grid-column: 1 !important; max-width: 100% !important; justify-self: stretch; }
  ${FIELD} > [data-sx-shell="investigation"] { position: relative !important; left: auto !important; top: auto !important; transform: none !important; order: 3; grid-column: 2 !important; justify-self: end; align-self: center; }
  ${FIELD} > [data-sx-shell="gate-reason"] { position: relative !important; left: auto !important; top: auto !important; transform: none !important; order: 4; max-width: 100% !important; width: auto !important; justify-self: stretch; }
  ${FIELD} > [data-testid="intake-telemetry-banner"], ${FIELD} > [data-testid="intake-error-banner"], ${FIELD} > [data-testid="intake-success-banner"] { position: relative !important; left: auto !important; top: auto !important; bottom: auto !important; transform: none !important; order: 5; max-width: 100% !important; width: auto !important; }
  ${PANEL_WRAP} { order: 6; }
  ${FIELD} > div:has(> ${HUD_BOX}) { order: 5; }
  ${HUD_BOX} { position: relative !important; right: auto !important; bottom: auto !important; width: auto !important; max-width: 100%; box-sizing: border-box; }
  /* 640 × 360 (GELB): the binding with its counts first, the boundary statement right after it (P-07), then the state, the
     proposals and the rows — the same elements, no duplicate; the coverage section lends its children to the panel's column. */
  ${FIELD} [data-pxj-panel] [data-testid=pxj-first-coverage] { display: contents !important; }
  ${FIELD} [data-pxj-panel] [data-pxj-section=binding] { order: 1; }
  ${FIELD} [data-pxj-panel] [data-testid=pxj-first-coverage-boundary] { order: 2; }
  ${FIELD} [data-pxj-panel] [data-testid=pxj-first-state] { order: 3; }
  ${FIELD} [data-pxj-panel] [data-pxj-section=proposals] { order: 4; }
  ${FIELD} [data-pxj-panel] [data-pxj-section=requirements] { order: 5; }
  ${FIELD} [data-pxj-panel] { position: relative !important; top: auto !important; right: auto !important; bottom: auto !important; width: 100% !important; max-height: none !important; overflow: visible !important; }
  ${STAGE} { position: relative !important; left: auto !important; top: auto !important; transform: none !important; zoom: var(--sx-stage-zoom, 0.6); order: 7; justify-self: center; }
  ${FIELD} > [data-testid="semantic-zoom-telemetry"] { position: relative !important; left: auto !important; top: auto !important; transform: none !important; order: 8; justify-self: center; max-width: 100%; }
  ${DOCK} { position: relative !important; left: auto !important; top: auto !important; transform: none !important; order: 9; justify-self: stretch; }
  ${FIELD} > div:has(${INSPECTOR.split(", ")[0]}), ${FIELD} > div:has(${INSPECTOR.split(", ")[1]}) { order: 10; }
  ${INSPECTOR} { position: relative !important; left: auto !important; bottom: auto !important; width: 100% !important; max-width: 420px; box-sizing: border-box; }
  ${FIELD} > [data-sx-shell="pxj-offer"] { position: relative !important; left: auto !important; bottom: auto !important; transform: none !important; order: 5; max-width: 100% !important; justify-self: stretch; border-radius: 16px !important; flex-wrap: wrap; }
  /* The Job Field: the Capability Field's layers leave the column (still mounted), the Job Field follows the shell as one column. */
  ${FIELD}[data-field-focus="FIELD"] > :not([data-sx-shell]):not([data-sx-field="job"]):not([data-testid="guided-onboarding-overlay"]):not([data-testid="system-codex-modal-backdrop"]):not(style) { display: none !important; }
  ${FIELD} > ${JOB} { position: relative !important; inset: auto !important; order: 6; display: flex !important; flex-direction: column; gap: 12px; padding: 4px 0 12px; min-height: 0; }
  ${JOB} > [data-sx-orient] { position: relative !important; left: auto !important; top: auto !important; width: auto !important; order: 1; }
  ${JOB} > [data-testid="job-pool-list"], ${JOB} > [data-testid="job-pool-upload"], ${JOB} > [data-testid="job-pool-matches"] { position: relative !important; left: auto !important; right: auto !important; top: auto !important; width: auto !important; max-height: none !important; order: 2; }
  ${JOB} > [data-testid="syntx-stage"] { position: relative !important; inset: auto !important; height: 960px; order: 3; }
  ${JOB} > [data-testid="job-pool-non-claims"] { position: relative !important; left: auto !important; bottom: auto !important; transform: none !important; width: auto !important; order: 4; }
}
`;
