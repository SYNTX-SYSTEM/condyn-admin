/**
 * GRÜN · PERSON × JOB MAPPING · PHASE-G **DEVELOPMENT** INSTRUMENT · shared library.
 *
 * ┌─ THIS INSTRUMENT RETURNS NO VERDICT ─────────────────────────────────────────────────────────────┐
 * │ PERSON_X_JOB_MAPPING_PHASE_G.md §17 A-G36 point 2: GRÜN's instrument produces DEVELOPMENT        │
 * │ READINGS only. They may enter an engineering record as GRÜN's own measurement with script and    │
 * │ raw output committed (A-G35), and they may NEVER constitute a pass, a GO, or grounds for closing │
 * │ a pin. Self-certification stays invalid. The verdict is PINK's, in mapping-phase-g-contract.     │
 * │ Every emitted field is a number or a named reading — never "pass", "green" or "ok".              │
 * └──────────────────────────────────────────────────────────────────────────────────────────────────┘
 *
 * Methods inherited from PINK's committed phase-F instrument (evidence/mapping-phase-f-contract/scripts,
 * manifest 43/43), per A-G36 point 1: per-class masks built UNDER reduced motion, differential measurement,
 * sign masks, deterministic seek, bracketed dof-matched null, joint LSQ, the window rule, the adequacy guard.
 * Divergence from PINK's readings is a FINDING to report, not to reconcile (A-G36 point 4) — so every
 * definitional choice this file makes is named in its own output under `definitions`.
 *
 * Taxonomy note (A-G36 point 3): phase G moved the glow OUT of the medium into `mapping-glows` (A-G10 pin 7).
 * PINK's phase-F masks have no glow class; this library adds `glows` as a first-class mask.
 *
 * Read-only: no fetch the façade did not script, no write to the product tree, no model call.
 */
import { pathToFileURL } from "node:url";

/**
 * §62: the lane's identity and verdict stamp live in `gruen-provenance.mjs`, which imports NOTHING, so a
 * derivation that renders nothing no longer has to load Playwright to learn its own verdict string. They are
 * re-exported here unchanged, so every probe that imports them from this module keeps working untouched.
 */
import { PW_MODULE, SHARP_MODULE, BASE, ANALYSIS, FIELD_URL, PROVENANCE } from "./gruen-provenance.mjs";
export { BASE, ANALYSIS, FIELD_URL, PROVENANCE };

const pwNamespace = await import(pathToFileURL(PW_MODULE).href);
export const chromium = (pwNamespace.chromium ?? pwNamespace.default?.chromium);
if (chromium === undefined) throw new Error(`ERR_INSTRUMENT_NO_PLAYWRIGHT:${PW_MODULE}`);
const sharpNamespace = await import(pathToFileURL(SHARP_MODULE).href);
export const sharp = sharpNamespace.default ?? sharpNamespace;

/**
 * §62: the pure colour arithmetic lives in `gruen-colour.mjs`, which imports NOTHING, so a derivation can
 * check a colour figure without being able to start a browser. Re-exported here unchanged.
 */
export { luminance, luminanceOfRgb, labOf, chromaQuantumFloor, achievableAlphas, compositeAtCode } from "./gruen-colour.mjs";
import { labOf } from "./gruen-colour.mjs";

/* ── statistics ───────────────────────────────────────────────────────────────────────────────────── */
export const pct = (sortedAsc, f) => sortedAsc[Math.min(sortedAsc.length - 1, Math.max(0, Math.floor(f * (sortedAsc.length - 1))))];
const e4 = v => (Number.isFinite(v) ? +v.toExponential(4) : null);
export function stats(values) {
  const a = Float64Array.from(values); a.sort();
  const n = a.length;
  if (n === 0) return { n: 0 };
  let s = 0; for (let i = 0; i < n; i += 1) s += a[i];
  return { n, mean: e4(s / n), p50: e4(pct(a, 0.5)), p90: e4(pct(a, 0.9)), p99: e4(pct(a, 0.99)), p999: e4(pct(a, 0.999)), p9999: e4(pct(a, 0.9999)), max: e4(a[n - 1]), min: e4(a[0]) };
}
export const median = values => { const a = Float64Array.from(values); a.sort(); return a.length === 0 ? 0 : pct(a, 0.5); };

/* ── the page, with the overlay / scrim abort guard (PINK's, kept verbatim in intent) ─────────────── */
export async function openField(browser, { reduce = false, vw = 1920, vh = 1080 } = {}) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1, reducedMotion: reduce ? "reduce" : "no-preference" });
  const page = await ctx.newPage();
  const api = [];
  page.on("response", r => { try { const p = new URL(r.url()).pathname; if (p.startsWith("/api")) api.push(`${r.status()} ${p.replace(/CAN_[0-9A-Z]+/, "CAN_…")}`); } catch { /* ignore */ } });
  const pageErrors = [];
  page.on("pageerror", e => pageErrors.push(String(e.message ?? e)));
  await page.goto(FIELD_URL, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
  await page.waitForTimeout(1800);
  let attempts = 0;
  const overlay = () => page.locator('[data-testid="guided-onboarding-overlay"]').count();
  const overlayInitial = await overlay();
  while ((await overlay()) > 0 && attempts < 4) {
    attempts += 1;
    for (const sel of ['[data-testid="onboarding-close-btn"]', '[data-testid="guided-onboarding-overlay"] button', '[aria-label="Close"]']) {
      if (await page.locator(sel).count() > 0) { await page.locator(sel).first().click().catch(() => {}); await page.waitForTimeout(400); break; }
    }
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(300);
  }
  const overlayFinal = await overlay();
  const centre = await page.evaluate(() => {
    const svg = document.querySelector('[data-testid="mapping-field-svg"]');
    if (svg === null) return { insideSvg: false, overlayAbove: "NO_SVG", topTag: null };
    const r = svg.getBoundingClientRect();
    const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    let node = el, insideSvg = false, overlayAbove = null;
    while (node) {
      if (node.tagName && node.tagName.toLowerCase() === "svg") insideSvg = true;
      const id = (node.getAttribute && node.getAttribute("data-testid")) || node.className?.toString?.() || "";
      if (/overlay|onboarding|scrim|backdrop/i.test(id)) overlayAbove = id;
      node = node.parentElement;
    }
    return { topTag: el?.tagName ?? null, insideSvg, overlayAbove };
  });
  const guard = { overlayInitial, overlayFinal, dismissAttempts: attempts, centre, pageErrors, api };
  if (overlayFinal > 0 || !centre.insideSvg || centre.overlayAbove) {
    await ctx.close();
    throw Object.assign(new Error("ERR_INSTRUMENT_OVERLAY_AT_MEASURE_TIME"), { guard });
  }
  return { ctx, page, guard };
}

/* ── geometry: the clip, the field disc, every drawn body with its DRAWN radius ────────────────────── */
export async function probeGeometry(page) {
  return page.evaluate(() => {
    const box = el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
    const svg = document.querySelector('[data-testid="mapping-field-svg"]');
    const field = document.querySelector('[data-testid="mapping-ring-field"]');
    const vb = String(svg.getAttribute("viewBox")).split(/\s+/).map(Number);
    const fr = field.getBoundingClientRect();
    const bodies = [...document.querySelectorAll("[data-mapping-body]")].map(e => {
      const r = e.getBoundingClientRect();
      const t = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(String(e.style.transform));
      return {
        id: String(e.getAttribute("data-testid")).replace(/^mapping-body-/, ""),
        rank: Number(e.getAttribute("data-rank")), tier: e.getAttribute("data-tier"), shelf: e.getAttribute("data-shelf") === "true",
        inPool: e.getAttribute("data-in-pool") === "true", sizeFloor: e.getAttribute("data-size-floor") === "true",
        drawnRadiusUnits: Number(e.getAttribute("data-drawn-radius")), requiredGaps: Number(e.getAttribute("data-required-gaps")),
        unitsX: t ? Number(t[1]) : null, unitsY: t ? Number(t[2]) : null,
        clientBox: box(e), cx: r.x + r.width / 2, cy: r.y + r.height / 2
      };
    });
    const shape = [...document.querySelectorAll("[data-mapping-body-shape]")].map(e => { const r = e.getBoundingClientRect(); return { w: r.width, h: r.height, cx: r.x + r.width / 2, cy: r.y + r.height / 2 }; });
    const ringBox = {};
    for (const key of ["best", "field", "horizon", "shelf"]) {
      const el = document.querySelector(`[data-testid="mapping-ring-${key}"]`);
      ringBox[key] = el === null ? null : box(el);
    }
    return {
      svg: box(svg), viewBox: { x: vb[0], y: vb[1], w: vb[2], h: vb[3] },
      /** k = field units → screen px. */
      unitsToPx: svg.getBoundingClientRect().width / vb[2],
      fieldCentre: { x: fr.x + fr.width / 2, y: fr.y + fr.height / 2 }, fieldRadiusPx: fr.width / 2,
      bodies, shape, ringBox,
      level: document.querySelector('[data-testid="mapping-field"]')?.getAttribute("data-level") ?? null,
      breath: document.querySelector('[data-testid="mapping-field"]')?.getAttribute("data-breath") ?? null
    };
  });
}

export function clipOf(geo, vw, vh) {
  const clip = { x: Math.round(geo.svg.x), y: Math.round(geo.svg.y), width: Math.round(geo.svg.w), height: Math.round(geo.svg.h) };
  clip.x = Math.max(0, clip.x); clip.y = Math.max(0, clip.y);
  clip.width = Math.min(clip.width, vw - clip.x); clip.height = Math.min(clip.height, vh - clip.y);
  return clip;
}

/** The field disc as a clip-local mask (the medium's own boundary — the field ring). */
export function discMask(clip, geo) {
  const W = clip.width, H = clip.height, N = W * H;
  const cx = geo.fieldCentre.x - clip.x, cy = geo.fieldCentre.y - clip.y, R = geo.fieldRadiusPx;
  const disc = new Uint8Array(N);
  let n = 0;
  for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) { const dx = x - cx, dy = y - cy; if (dx * dx + dy * dy <= R * R) { disc[y * W + x] = 1; n += 1; } }
  return { disc, discPixels: n, cx, cy, R, W, H, N };
}

/* ── capture ──────────────────────────────────────────────────────────────────────────────────────── */
export async function cdpSession(page) { return page.context().newCDPSession(page); }
/** One frame as raw base64 PNG — DECODE IS DEFERRED (PINK's cadence lesson: decoding in the loop under-samples). */
export async function captureRaw(cdp, clip) {
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png", clip: { ...clip, scale: 1 }, optimizeForSpeed: true });
  return data;
}
export async function decodeLuminance(base64, N) {
  const s = await sharp(Buffer.from(base64, "base64")).raw().toBuffer({ resolveWithObject: true });
  return luminance(s.data, N, s.info.channels);
}
export async function captureLuminance(cdp, clip, N) { return decodeLuminance(await captureRaw(cdp, clip), N); }

/**
 * A deterministic capture window. Captures ONLY (decode deferred), records each frame's timestamp, then
 * decodes. Returns the frames, the cadence and the ADEQUACY GUARD: the highest fitted frequency must stay
 * below 0.9 × Nyquist or the run is inadequate and says so (PINK's A-F20 guard, which caught a false red).
 */
export async function captureWindow(cdp, clip, N, { seconds, maxFreqHz }) {
  const shots = [], ts = [], t0 = Date.now();
  while (Date.now() - t0 < seconds * 1000) { shots.push(await captureRaw(cdp, clip)); ts.push((Date.now() - t0) / 1000); }
  const frames = [];
  for (const s of shots) frames.push(await decodeLuminance(s, N));
  const spanS = ts[ts.length - 1] - ts[0];
  const cadenceMs = (spanS * 1000) / Math.max(1, ts.length - 1);
  const nyquistHz = 1000 / (2 * cadenceMs);
  return {
    frames, ts, spanS: +spanS.toFixed(2), cadenceMs: +cadenceMs.toFixed(0), nyquistHz: +nyquistHz.toFixed(3),
    adequacy: { maxFreqHz, nyquistHz: +nyquistHz.toFixed(3), limit: +(0.9 * nyquistHz).toFixed(3), adequate: maxFreqHz < 0.9 * nyquistHz }
  };
}

/* ── per-class masks, built UNDER REDUCED MOTION, differentially ──────────────────────────────────── */
/** Phase-G taxonomy. `glows` is new here: A-G10 pin 7 moved the glow out of the medium, and no PF-8 mask had it. */
export const CLASS_SELECTOR = Object.freeze({
  /** All five glows. NOTE (A-G49): keyed on the CLASSNAME, which is the channel A-G49 deprecates — and it is
   *  nonetheless the only complete hook today. `[data-testid="mapping-glows"]` holds `fieldHalos` ONLY (:923);
   *  `shelfHalos` render in an anonymous <g> at :884. Measured live at L0: `.mf-halo` 5, inside the container 2,
   *  outside it 3 — so a container-keyed probe reaches 2 of 5. Replace with the data-* hook A-G49 requires. */
  glowsAll: ".mf-halo",
  glowsField: '[data-testid="mapping-glows"] .mf-halo',
  /** The glows that BREATHE: only non-shelf halo circles carry mf-wave-halo (:670) — the shelf is a still ring
   *  (A-F8), so its glow cannot swing by design. This, not `glowsAll`, is PG-10's carrier. */
  glowsBreathing: ".mf-wave-halo",
  bodyOutlines: "[data-mapping-body-shape]",
  bodyNames: '[data-testid^="mapping-name-"],[data-testid^="mapping-measure-"]',
  arcs: "[data-mapping-arc]",
  /** TRUE drawn beams. `[data-beam]` is NOT a beam count: every ARC carries the sign table's `beam` word as an
   *  attribute (arcSign emits data-beam={s.beam}), so `[data-beam]` matches arcs too. Measured live: L0 22
   *  `[data-beam]` of which 3 are drawn beams, L1 19 of which 0 are drawn beams. */
  beams: '[data-testid^="mapping-beam-"]',
  nodes: "[data-mapping-node]",
  sectorText: "[data-mapping-sector]",
  /**
   * A-G61: two relation carriers that a `reduce` read CANNOT see. `.mf-travel` is `visibility: hidden` unless
   * the field breathes (MAPPING_FIELD_CSS keys it on data-breath="LIVE"), so a reduce-read PG-1 omits a
   * semantic channel by construction and is a statement about the RESTING field. Both are G-3's relation
   * light (PG-6) and belong in the emitting set.
   */
  travel: ".mf-travel",
  beamGlow: ".mf-beam-glow",
  /**
   * THE occluder — it REMOVES light. Suppressing it raises the field's luminance, so a share computed as
   * (full − suppressed)/full books it negative (A-G55): the firewall's opaque BLACK seat under every sign
   * (F-6 / A-F5), measured at −0.515 of the field's light at 1920 on `.mf-seat` alone.
   *
   * `.mf-seat` IS NOT THE WHOLE FIREWALL. Seven seat elements carry no class and no `data-*` at all — the four
   * RING seats (`:898` shelf, `:926` best, `:928` horizon, `:930` field), the person's seat (`:944`), the
   * capability-node seats (`:960`) and the L2 ring seat (`:1022`) — so a `.mf-seat` mask leaves every one of
   * them counted nowhere, and the emitting/occluding bookkeeping A-G55 asks for was never closed.
   *
   * Stopgap until A-G49's hooks exist: match the seat's exact paint, `SEAT = "rgba(0, 0, 0, 1)"`, on stroke or
   * fill. It is value-coupled and will break the day the constant is reformatted — which is the argument for
   * the `data-*` hook, not a substitute for it.
   */
  bodySeat: '.mf-seat,[stroke="rgba(0, 0, 0, 1)"],[fill="rgba(0, 0, 0, 1)"]',
  /**
   * EMITTING, against this instrument's own first declaration. G-1's prose — "a dark core, a luminous rim" —
   * reads as light-removing, and it is not: `mf-core` is `rgb(205, 240, 255)` (INK, near-white) at
   * `VOLUME.coreAlpha` 0.16 falling to 0.067 (`:857`). It is DARK RELATIVE TO THE RIM and ADDITIVE over the
   * black seat beneath it. The declaration/measurement check caught the misdeclaration on its first run
   * (+0.0429 at 1920, +0.0280 at 1280 against a declared OCCLUDING) — which is the check doing its job, and
   * the reason A-G55 asks for a declaration rather than a sign test alone.
   */
  bodyCore: ".mf-core",
  ringBest: '[data-testid="mapping-ring-best"]',
  ringField: '[data-testid="mapping-ring-field"]',
  ringHorizon: '[data-testid="mapping-ring-horizon"]',
  ringShelf: '[data-testid="mapping-ring-shelf"]'
});
export const RING_CLASSES = Object.freeze(["ringShelf", "ringBest", "ringField", "ringHorizon"]);
/**
 * A-G55: PG-1's ≥ 55 % is defined over the field's EMITTING classes. Each class is declared, and an occluder is
 * excluded from numerator and denominator with the exclusion recorded per run.
 *
 * `[data-mapping-body-content]` is NOT in either list and is no longer used as a class: it is a MIXED group
 * (:689) wrapping the opaque black seat and the dark core TOGETHER WITH the body shape, the collar and the
 * text. It cannot be declared emitting or occluding, which is why its measured share was −0.084 at 1920 and
 * +0.119 at 1280 — the sign flipped with which pixels the core happened to cover. It is decomposed here into
 * `bodyOutlines` + `bodyNames` + `arcs` (emitting) and `bodySeat` + `bodyCore` (occluding).
 */
export const EMITTING_CLASSES = Object.freeze(["glowsAll", "bodyCore", "bodyOutlines", "bodyNames", "arcs", "beams", "beamGlow", "travel", "nodes", "sectorText"]);
export const OCCLUDING_CLASSES = Object.freeze(["bodySeat"]);
/** Kept as the name the earlier readings used, now meaning the emitting set (A-G55). */
export const SEMANTIC_CLASSES = EMITTING_CLASSES;
/** G-3's relations: the coupling beams, by their own testid — see the `beams` note above. */
/** G-3's relations: the beam, its glow and its travelling light — all three are relation light (PG-6). */
export const RELATION_CLASSES = Object.freeze(["beams", "beamGlow", "travel"]);

const clearStyles = async page => {
  await page.evaluate(() => { for (const st of document.querySelectorAll("style")) if (st.textContent.includes("visibility:hidden")) st.remove(); });
  await page.waitForTimeout(260);
};
export async function hide(page, selector) { await page.addStyleTag({ content: `${selector}{visibility:hidden !important}` }); await page.waitForTimeout(340); }
/**
 * `keep` re-applies a PERSISTENT suppression after clearing, because `clearStyles` removes EVERY style tag
 * containing "visibility:hidden" — including a condition a caller set up and expects to survive.
 *
 * Found by the zero-by-construction channel on its first run (§30): a costing probe that suppressed the shelf
 * ring and then built a per-class mask lost the condition at the mask's first `unhideAll`, so all three render
 * conditions silently measured the SAME field. The share figures were unaffected (they re-applied the
 * condition themselves) and the per-body occupancies were worthless, which is the hardest kind of defect to
 * notice: a subset of one run's numbers invalidated while the rest stayed right.
 */
export async function unhideAll(page, keep = null) { await clearStyles(page); if (keep !== null) await hide(page, keep); }

/**
 * One mask per class by DIFFERENTIAL suppression: the pixels a class's own light reaches. Built with the page
 * under reducedMotion:reduce so the breath does not enter the mask (PINK's "eleventh defect" guard).
 * `threshold` 0.001 is PINK's. Returns index arrays, clip-local.
 */
export async function classMasks(page, cdp, clip, N, classes, { threshold = 0.001, keepHidden = null } = {}) {
  const base = await captureLuminance(cdp, clip, N);
  const masks = {};
  for (const cls of classes) {
    await hide(page, CLASS_SELECTOR[cls]);
    const hidden = await captureLuminance(cdp, clip, N);
    const ix = [];
    for (let i = 0; i < N; i += 1) if (base[i] - hidden[i] > threshold) ix.push(i);
    masks[cls] = ix;
    await unhideAll(page, keepHidden);
  }
  return { base, masks, threshold };
}

/** Light removed by suppressing a selector, summed over a mask (the share denominator / numerator unit). */
export async function suppressedSum(page, cdp, clip, N, mask, selector) {
  const before = await captureLuminance(cdp, clip, N);
  await hide(page, selector);
  const after = await captureLuminance(cdp, clip, N);
  await unhideAll(page);
  let full = 0, hidden = 0;
  for (let i = 0; i < N; i += 1) if (mask[i]) { full += before[i]; hidden += after[i]; }
  return { full, hidden, removed: full - hidden };
}

/* ── joint LSQ lock-in with a bracketed, dof-matched null (PINK A-F17/A-F20/§27) ───────────────────── */
export const HARMONICS = Object.freeze([0.1, 0.2, 0.3]);
export const NULL_FREQS = Object.freeze([0.05, 0.15, 0.25, 0.35]);
export const BRACKETS = Object.freeze([[0.05, 0.15], [0.15, 0.25], [0.25, 0.35]]);
export const FIT_FREQS = Object.freeze([...HARMONICS, ...NULL_FREQS]);
/** The window rule: ≥ 2/(0.7·Δf) with Δf = 0.05 Hz — PINK's refinement of A-F21, so the 70% self-check is itself resolved. */
export const WINDOW_SECONDS = Number(process.env.GRUEN_WINDOW_S ?? 58);

function invert(matrix) {
  const n = matrix.length;
  const A = matrix.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let c = 0; c < n; c += 1) {
    let p = c;
    for (let r = c + 1; r < n; r += 1) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    const d = A[c][c];
    if (!Number.isFinite(d) || d === 0) throw new Error("ERR_INSTRUMENT_SINGULAR_DESIGN_MATRIX");
    for (let j = 0; j < 2 * n; j += 1) A[c][j] /= d;
    for (let r = 0; r < n; r += 1) { if (r === c) continue; const f = A[r][c]; for (let j = 0; j < 2 * n; j += 1) A[r][j] -= f * A[c][j]; }
  }
  return A.map(r => r.slice(n));
}

/** Build the projector once for a timestamp vector; reuse it for every pixel and every pooled series. */
export function lockIn(ts) {
  const F = ts.length, P = 1 + 2 * FIT_FREQS.length;
  const A = ts.map(t => { const row = [1]; for (const f of FIT_FREQS) { const w = 2 * Math.PI * f * t; row.push(Math.cos(w), Math.sin(w)); } return row; });
  const AtA = Array.from({ length: P }, (_, i) => Array.from({ length: P }, (_, j) => { let s = 0; for (let r = 0; r < F; r += 1) s += A[r][i] * A[r][j]; return s; }));
  const inv = invert(AtA);
  const proj = Array.from({ length: P }, (_, i) => Array.from({ length: F }, (_, r) => { let s = 0; for (let j = 0; j < P; j += 1) s += inv[i][j] * A[r][j]; return s; }));
  const amp = (beta, f) => { const k = FIT_FREQS.indexOf(f); return Math.hypot(beta[1 + 2 * k], beta[2 + 2 * k]); };
  return {
    frames: F,
    /** y: a mean-removed series of length F → {signal, null} with the null spectrally CENTRED and dof-matched. */
    fit(y) {
      const beta = new Float64Array(P);
      for (let i = 0; i < P; i += 1) { let s = 0; for (let r = 0; r < F; r += 1) s += proj[i][r] * y[r]; beta[i] = s; }
      const signal = Math.hypot(...HARMONICS.map(f => amp(beta, f)));
      const components = BRACKETS.map(([lo, hi]) => Math.sqrt((amp(beta, lo) ** 2 + amp(beta, hi) ** 2) / 2));
      return { signal, null: Math.hypot(...components) };
    }
  };
}

/** The coherent motion energy of a mask: pooled (systematic) and per-pixel (localised), each against its own null. */
export function coherentEnergy(frames, ts, mask) {
  const F = frames.length, m = mask.length;
  if (m === 0) return { px: 0 };
  const lock = lockIn(ts);
  const y = new Float64Array(F), pooled = new Float64Array(F);
  const sig = new Float64Array(m), nul = new Float64Array(m);
  for (let k = 0; k < m; k += 1) {
    const i = mask[k];
    let mean = 0;
    for (let r = 0; r < F; r += 1) { y[r] = frames[r][i]; mean += y[r]; pooled[r] += frames[r][i]; }
    mean /= F;
    for (let r = 0; r < F; r += 1) y[r] -= mean;
    const f = lock.fit(y);
    sig[k] = f.signal; nul[k] = f.null;
  }
  let pm = 0;
  for (let r = 0; r < F; r += 1) { pooled[r] /= m; pm += pooled[r]; }
  pm /= F;
  const pooledFit = lock.fit(Float64Array.from(pooled, v => v - pm));
  const sS = Float64Array.from(sig); sS.sort();
  const nS = Float64Array.from(nul); nS.sort();
  return {
    px: m,
    pooled: { signal: e4(pooledFit.signal), null: e4(pooledFit.null), ratio: +(pooledFit.signal / pooledFit.null).toFixed(2) },
    perPixel: { p50: e4(pct(sS, 0.5)), p99: e4(pct(sS, 0.99)), max: e4(sS[m - 1]), nullP50: e4(pct(nS, 0.5)), nullP99: e4(pct(nS, 0.99)), ratioP99: +(pct(sS, 0.99) / pct(nS, 0.99)).toFixed(2) }
  };
}

/** Per-pixel temporal swing (max − min) over a frame stack, plus the Weber fraction against each pixel's own mean. */
export function swingAndWeber(frames, mask) {
  const F = frames.length, m = mask.length;
  const swing = new Float64Array(m), weberMean = new Float64Array(m), weberMin = new Float64Array(m);
  for (let k = 0; k < m; k += 1) {
    const i = mask[k];
    let lo = Infinity, hi = -Infinity, sum = 0;
    for (let r = 0; r < F; r += 1) { const v = frames[r][i]; if (v < lo) lo = v; if (v > hi) hi = v; sum += v; }
    const mean = sum / F;
    swing[k] = hi - lo;
    weberMean[k] = mean > 0 ? (hi - lo) / mean : 0;
    weberMin[k] = lo > 0 ? (hi - lo) / lo : 0;
  }
  return { swing, weberMean, weberMin };
}

export const fracAbove = (values, t) => { let c = 0; for (let i = 0; i < values.length; i += 1) if (values[i] >= t) c += 1; return +(c / Math.max(1, values.length)).toFixed(5); };
export const round = (v, d = 4) => (Number.isFinite(v) ? +v.toFixed(d) : null);
export { e4 };

/* ── A-G42: the travel and the breath share a period, so the two modes are mutually exclusive ──────── */
/**
 * PHASE_G §18 A-G42: A-G13 made the travel's period exactly the breath's, so the travel's coherent energy
 * lands on the SAME harmonics {0.1, 0.2, 0.3} the firewall uses to attribute energy. The two obligations
 * therefore need mutually exclusive render configurations, and a run must declare which it is:
 *   "travel-masked" — PF-8's form (A-G32): the travel is DRAWN and its pixels are excluded BY ITS OWN MASK,
 *                     so the harmonics inside the remaining mask are the medium's alone. Never hidden:
 *                     defect nineteen — suppression does not isolate the medium, because the medium is
 *                     partly underneath, and G-3 puts the arc's own glow under the travel.
 *   "travel-drawn"  — PG-11's form: relation pixels only, the travel drawn, compared against the medium at
 *                     the same harmonics, and the run states its attribution rule explicitly.
 * Neither mode may reuse the other's frames (A-G42 point 3).
 */
export const TRAVEL_SELECTOR = ".mf-travel";
export const RENDER_MODES = Object.freeze({ PF8: "travel-masked", PG11: "travel-drawn" });

/** The travel's own mask, differentially — the set a "travel-masked" run must subtract. */
export async function travelMask(page, cdp, clip, N, { threshold = 0.001 } = {}) {
  const base = await captureLuminance(cdp, clip, N);
  await hide(page, TRAVEL_SELECTOR);
  const hidden = await captureLuminance(cdp, clip, N);
  await unhideAll(page);
  const ix = [];
  for (let i = 0; i < N; i += 1) if (Math.abs(base[i] - hidden[i]) > threshold) ix.push(i);
  return ix;
}
export const subtractMask = (mask, remove) => { const drop = new Set(remove); return mask.filter(i => !drop.has(i)); };

/* ── A-G45: the engraved-minima statistic for a ring band (min over angles of the per-angle peak) ──── */
/**
 * PHASE_G §29 as restated by A-G45: PF-15's red is instrument-suspect because a MAX over a ring band catches
 * a BODY crossing it (PINK's shelf once read 0.58 that way). The ring's own rendered luminance is therefore:
 *   per angle θ — the PEAK across the band's width (the stroke's own centre pixel, PINK's 720-angle method);
 *   across angles — the MINIMUM of those peaks (the "engraved minimum"), which no crossing body can inflate.
 * Reported with p05/p25/p50 beside the min, because a single degenerate angle can depress a bare minimum.
 */
export function ringBandLuminance(L, geom, innerPx, outerPx, { angles = 720 } = {}) {
  const { cx, cy, W, H } = geom;
  const peaks = [];
  for (let a = 0; a < angles; a += 1) {
    const th = (2 * Math.PI * a) / angles, ct = Math.cos(th), st = Math.sin(th);
    let peak = -Infinity, samples = 0;
    for (let r = innerPx; r <= outerPx; r += 0.25) {
      const x = Math.round(cx + r * ct), y = Math.round(cy + r * st);
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const v = L[y * W + x];
      if (v > peak) peak = v;
      samples += 1;
    }
    if (samples > 0 && Number.isFinite(peak)) peaks.push(peak);
  }
  const a = Float64Array.from(peaks); a.sort();
  return {
    angles: a.length,
    statistic: "min over angles of the per-angle radial peak (engraved minimum, A-G45)",
    engravedMin: e4(a[0]), p05: e4(pct(a, 0.05)), p25: e4(pct(a, 0.25)), p50: e4(pct(a, 0.5)), p95: e4(pct(a, 0.95)), max: e4(a[a.length - 1])
  };
}

/* ── provenance PINK must be able to check (A-G47 point 3) ────────────────────────────────────────── */
/** The paths a production build is a deterministic function of — the product, not this evidence directory. */
const PRODUCT_PATHS = "app lib test docs/architecture package.json package-lock.json next.config.ts tsconfig.json";
export async function servedProvenance(page, worktree) {
  const { execSync } = await import("node:child_process");
  const git = args => { try { return execSync(`git -C ${worktree} ${args}`, { encoding: "utf8" }).trim(); } catch { return null; } };
  /**
   * §62 DEFECT 9 — `git()` trims the WHOLE output, which strips the leading status space of the FIRST porcelain
   * line. `git status --porcelain=v1` writes two status columns then a space, so a modified tracked file is
   * " M path"; after .trim() that first line is "M path" and the old `l.slice(3)` ate one character of the
   * path. The truncated path then failed the evidence-directory exclusion below, so a dirty EVIDENCE file was
   * reported as dirty OUTSIDE the product. Found in the committed SEALED-pg17-L0-1920x1080.json, which records
   *   "dirtyOutsideProduct": ["ocs/career_analysis/evidence/mapping-phase-g/outputs/facade.log"]
   * — one character short of "docs/…". It never touched `productTreeClean`, which is computed from its own
   * pathspec, so no READING is affected; the provenance block PINK is told to check was simply wrong, and wrong
   * in the over-reporting direction. `gitStatusPaths` parses the UNTRIMMED output so the columns stay aligned.
   */
  const gitStatusPaths = () => {
    try {
      const raw = execSync(`git -C ${worktree} status --porcelain=v1`, { encoding: "utf8" });
      return raw.split("\n").filter(l => l.length > 3).map(l => {
        const path = l.slice(3);
        /* git quotes paths with unusual bytes; unquote so the exclusion filter below can match them */
        return path.startsWith('"') && path.endsWith('"') ? JSON.parse(path) : path;
      });
    } catch { return []; }
  };
  let buildId = null;
  try { const { readFileSync } = await import("node:fs"); buildId = readFileSync(`${worktree}/.next/BUILD_ID`, "utf8").trim(); } catch { /* absent */ }
  return {
    worktree, head: git("rev-parse HEAD"), headShort: git("rev-parse --short=8 HEAD"),
    branch: git("rev-parse --abbrev-ref HEAD"),
    /**
     * The WHOLE tree is normally dirty during a run, and benignly so: the probes write their own readings into
     * `outputs/`, which is a tracked directory since the instrument was committed. The field that carries
     * A-G47 point 3's meaning is `productTreeClean` — nothing uncommitted under the paths a build is compiled
     * from. `treeClean` is kept beside it so the difference is visible rather than argued.
     */
    treeClean: git("status --porcelain=v1") === "",
    productTreeClean: git(`status --porcelain=v1 -- ${PRODUCT_PATHS}`) === "",
    dirtyOutsideProduct: gitStatusPaths().filter(f => !f.startsWith("docs/career_analysis/evidence/mapping-phase-g/")),
    /**
     * A-G47 point 3 wants HEAD == 3ec8457d. This lane must commit its instrument (A-G35) and must re-key the
     * splay (A-G43), so the tip necessarily moves: the assertion PINK can make instead is the exact PRODUCT
     * distance from 3ec8457d.
     *
     * NOTE, found by this instrument reading its own first output: the comparison is against the WORKING TREE,
     * not against HEAD. `git diff 3ec8457d HEAD -- …` reports empty whenever HEAD is still 3ec8457d however
     * dirty the tree is, which is exactly what the shakedown pass printed (`clean:false` beside
     * `productEqual:true`). A provenance field that cannot see uncommitted product changes is worse than none.
     */
    productDeltaFrom3ec8457d: (git(`diff --stat 3ec8457d -- ${PRODUCT_PATHS}`) === "" && git(`diff --cached --stat 3ec8457d -- ${PRODUCT_PATHS}`) === "") ? "NONE" : (git(`diff --name-only 3ec8457d -- ${PRODUCT_PATHS}`) || "").split("\n").filter(Boolean),
    untrackedProductFiles: (git(`ls-files --others --exclude-standard -- ${PRODUCT_PATHS}`) || "").split("\n").filter(Boolean),
    buildId, measuredAt: new Date().toISOString()
  };
}

/* ── A-G65: PF-15's statistic is neither min nor max — mask-based, over band pixels no mark covers ──── */
/**
 * PHASE_G §23 A-G65. The history matters, because the statistic has now failed twice in mirror image:
 *   max() over a ring band was contaminated by a crossing BODY  — PINK's shelf once read 0.58;
 *   min() over a ring band is contaminated by a crossing SEAT   — PINK measured pure rgb(0,0,0) at the
 *                                                                 darkest angle, over ~1 % of all angles,
 *                                                                 from the opaque SEAT of any mark crossing
 *                                                                 the band (shelf bodies, sector edges, beams).
 * §29's replacement inherited, inverted, the defect of the thing it replaced. An extremum over a band is a
 * one-pixel statistic and both lanes have been misled by one.
 *
 * The remedy is defect nineteen's own: keep every sign DRAWN, exclude sign and seat pixels BY MASK, and take a
 * robust central statistic over the band pixels no mark covers. Per-angle medians are reported as a
 * DISTRIBUTION, never as an extremum alone (GRÜN's request, adopted as a rule in §23).
 */
export function ringBandMasked(L, geom, innerPx, outerPx, covered, { angles = 720 } = {}) {
  const { cx, cy, W, H } = geom;
  const perAngle = [], pooled = [];
  let bandPx = 0, coveredPx = 0, emptyAngles = 0;
  for (let a = 0; a < angles; a += 1) {
    const th = (2 * Math.PI * a) / angles, ct = Math.cos(th), st = Math.sin(th);
    const clear = [];
    for (let r = innerPx; r <= outerPx; r += 0.25) {
      const x = Math.round(cx + r * ct), y = Math.round(cy + r * st);
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const i = y * W + x;
      bandPx += 1;
      if (covered[i]) { coveredPx += 1; continue; }
      clear.push(L[i]);
      pooled.push(L[i]);
    }
    if (clear.length === 0) { emptyAngles += 1; continue; }
    clear.sort((p, q) => p - q);
    perAngle.push(clear[Math.floor(clear.length / 2)]);
  }
  const ang = Float64Array.from(perAngle); ang.sort();
  const all = Float64Array.from(pooled); all.sort();
  return {
    statistic: "A-G65: per-angle MEDIAN over band pixels no sign or seat covers; the ring's figure is the pooled median. Distribution published, never an extremum alone.",
    anglesMeasured: ang.length, anglesFullyCovered: emptyAngles,
    bandPixels: bandPx, coveredPixels: coveredPx, coveredFraction: +(coveredPx / Math.max(1, bandPx)).toFixed(4),
    /** The ring's figure. */
    pooledMedian: e4(all.length ? pct(all, 0.5) : NaN),
    perAngleMedian: ang.length ? { min: e4(ang[0]), p05: e4(pct(ang, 0.05)), p25: e4(pct(ang, 0.25)), p50: e4(pct(ang, 0.5)), p75: e4(pct(ang, 0.75)), p95: e4(pct(ang, 0.95)), max: e4(ang[ang.length - 1]) } : null,
    /** Spread of the per-angle medians, so a ring that is uneven cannot read as a clean figure. */
    perAngleSpread: ang.length ? +((pct(ang, 0.95) - pct(ang, 0.05)) / Math.max(1e-12, pct(ang, 0.5))).toFixed(3) : null
  };
}

/** The union mask of every sign AND every seat — what A-G65 excludes. Seats are found by |Δ|, since suppressing
 *  an opaque black seat RAISES the luminance beneath it (it is the field's one occluder, at −0.515). */
export async function signAndSeatMask(page, cdp, clip, N, { threshold = 0.001, exclude = [], keepHidden = null } = {}) {
  const base = await captureLuminance(cdp, clip, N);
  const covered = new Uint8Array(N);
  const classes = [...EMITTING_CLASSES, ...OCCLUDING_CLASSES].filter(c => !exclude.includes(c));
  const per = {};
  for (const cls of classes) {
    await hide(page, CLASS_SELECTOR[cls]);
    const hidden = await captureLuminance(cdp, clip, N);
    let n = 0;
    for (let i = 0; i < N; i += 1) if (Math.abs(base[i] - hidden[i]) > threshold) { covered[i] = 1; n += 1; }
    per[cls] = n;
    await unhideAll(page, keepHidden);
  }
  return { covered, perClassPixels: per, note: "sign AND seat pixels, by |Δ| so the opaque black seat is caught too" };
}

/* ── A-G81: the alpha is quantised to 8 bits BEFORE compositing ────────────────────────────────────── */
/**
 * PHASE_G §28 A-G81, GELB's mechanism, which reproduces this instrument's swept threshold to five figures:
 * the browser rounds the ALPHA to a byte first, then composites — it does not round the per-channel products.
 *   α 0.0215 → byte 5 → effective 0.0196078 → rgb(4,5,5) → 1.4531051e-03  (0.9992 × the plate: clears nothing)
 *   α 0.0216 → byte 6 → effective 0.0235294 → rgb(5,6,6) → 1.7566321e-03  (1.2079 ×)
 * against this lane's measured 1.7566e-03 at 1.208 ×, and the swept threshold of 0.0216.
 *
 * The corollary is larger than the fix: the quantum is 1/255 ≈ 0.00392, so 0.022 and 0.025 RENDER
 * IDENTICALLY (both byte 6), and there are ~64 distinguishable alphas in [0, 0.25], not 2500. A constant
 * written to four decimals where the medium resolves ~0.0039 carries three significant figures of fiction.
 * The rule is: quantise α, then compute, then SWEEP to confirm — a swept threshold with no mechanism cannot
 * be checked, and a computed one with no sweep was wrong twice this phase.
 */
export const ALPHA_QUANTUM = 1 / 255;
export const alphaByte = alpha => Math.round(alpha * 255);
export const effectiveAlpha = alpha => Math.round(alpha * 255) / 255;
export const alphaRendersAs = alpha => ({ requested: alpha, byte: alphaByte(alpha), effective: +effectiveAlpha(alpha).toFixed(7), quantum: +ALPHA_QUANTUM.toFixed(7) });

/* ── §30: every run carries a channel whose value is ZERO BY CONSTRUCTION, and reports it ───────────── */
/**
 * From this lane's bbox-centre catch, made general by GELB: a quantity that must be zero is the cheapest
 * self-check there is, and it would have caught the padded band, the self-occluding glow and the bbox centre.
 *
 * The channel must be measured on a domain where the claim actually holds. Under `reducedMotion:reduce` the
 * FIELD is static — this instrument measures in-disc swing 0.000000 — but the HOST outside the disc keeps
 * animating, so a whole-region repeat-capture difference is NOT zero and reads ~0.002. Restricting it to disc
 * pixels is the difference between a self-check and a false alarm; the first version of this channel read
 * 0.0020223 and declared a valid run invalid.
 */
export async function zeroByConstruction(cdp, clip, N, disc) {
  const a = await captureLuminance(cdp, clip, N);
  const b = await captureLuminance(cdp, clip, N);
  let maxAbs = 0, n = 0;
  for (let i = 0; i < N; i += 1) if (disc[i]) { n += 1; const d = Math.abs(a[i] - b[i]); if (d > maxAbs) maxAbs = d; }
  return {
    name: "repeat-capture difference over DISC pixels on a static field (reducedMotion:reduce)",
    domain: "disc only — the host animates outside it, so a whole-region form is not zero and would false-alarm",
    pixels: n, mustBe: 0, measured: e4(maxAbs), valid: maxAbs === 0
  };
}

/* ── A chroma channel, because no lane had one (A-G119 on PG-12) ───────────────────────────────────── */
/**
 * PG-12: "on medium pixels, chroma ≤ 2 % of the chroma on the hue-carrying class." GELB (§35 A-G119) records
 * that it wrote that bound before anyone asked what a chroma instrument would RESOLVE — which is a
 * measurability question, and A-G111 makes it publishable.
 *
 * CIELAB C* = hypot(a*, b*), D65, from linearised sRGB. C* is the right quantity for the word "chroma": it is
 * perceptual and it is zero on any neutral grey, so the field's own ink (a near-neutral cyan at low alpha over
 * near-black) and the gap hue are separated by it rather than by a hue angle that is undefined at zero chroma.
 *
 * THE POINT OF THE FLOOR: near black the sRGB quantum dominates. At rgb(3, 5, 8) a one-code change in a single
 * channel moves C* by an amount comparable to the whole chroma being measured, so a 2 % bound on medium pixels
 * may be asking for a distinction the raster cannot express. `chromaQuantumFloor` reports exactly that — the
 * C* produced by ±1 code at a given triple — so a PG-12 reading can be compared against what is resolvable
 * instead of being believed.
 */
/* §62: LAB_D65, labF, labOf and chromaQuantumFloor moved to gruen-colour.mjs and are re-exported above. */
/** Per-pixel C* over a region, from the raw RGBA rather than the luminance array. */
export async function captureChroma(cdp, clip, N) {
  const s = await sharp(Buffer.from(await captureRaw(cdp, clip), "base64")).raw().toBuffer({ resolveWithObject: true });
  const ch = s.info.channels, d = s.data;
  const C = new Float32Array(N), rgb = new Uint8Array(N * 3);
  for (let p = 0, q = 0; p < N; p += 1, q += ch) {
    rgb[p * 3] = d[q]; rgb[p * 3 + 1] = d[q + 1]; rgb[p * 3 + 2] = d[q + 2];
    C[p] = labOf(d[q], d[q + 1], d[q + 2]).C;
  }
  return { C, rgb };
}

/* ── A-G140: a bound carries its ORIGIN, or the instrument launders it ─────────────────────────────── */
/**
 * §40 A-G140, from this lane's own observation: A-G2's "asserted" class is a PROVENANCE problem, not a
 * confidence one, and the laundering is MECHANICAL — the pin states 1.45 with no origin, this instrument
 * implements 1.45 as a literal, the output reports a comparison against 1.45, and nothing downstream can tell
 * that number from a measured one. A-G35 made numbers in RECORDS carry their scripts; this makes numbers in
 * BOUNDS carry their derivations, one layer earlier.
 *
 * The remedy is mechanical too, which is the point: a bound is looked up rather than written, and a bound whose
 * origin is UNDERIVED is reported as such beside every comparison that uses it. The instrument can then not
 * silently launder one, because the laundering required the literal.
 *
 * `origin` is the adjudication or source that FIXES the value — not the one that merely restates it.
 *
 * §41 A-G143 adds a THIRD STATUS at GELB's request, because conflating two things lost a distinction:
 *   DERIVED  — a quantity was taken from a stated source or computed from the spec.
 *   CITED    — a MECHANISM is named and no quantity is taken from it. "Motivated, not derived." PG-10's
 *              corridor rests on "R17's ceiling is what keeps this calm" while the record never states R17's
 *              own numbers; PG-17's 1.5 r cites R21's critical band the same way. The difference from
 *              UNDERIVED is "we had a reason and no number" against "we had neither", and it matters because
 *              a CITED bound has somewhere to go for a number and an UNDERIVED one does not.
 *   UNDERIVED — neither.
 *
 * A-G143 also forbids the repair this registry tempts: **no bound gets a derivation it did not have**, because
 * a post-hoc derivation makes an arbitrary number look principled — A-G138's "it looks derived" hazard turned
 * on the repair impulse. GELB proved the rule on itself with PG-6: the charitable reconstruction is an equal
 * share among the emitting classes, and eight gives 1/8 = 0.125 while seven gives 1/7 = 0.143. Neither is
 * 0.15, so even the most generous reconstruction fails to produce the number.
 */
export const BOUNDS = Object.freeze({
  "PG-1.semanticShare":      { value: 0.55,   parents: [{ node: "G-1", quote: "G-1 · The space is dark and the bodies carry the light (inverts F-1)" }], origin: "PARTLY DERIVED — A-G143: G-1's own title, 'The space is dark and the bodies carry the light', yields >= 0.50 directly (if the bodies CARRY the light they carry most of it). The remaining 0.05 appears nowhere in the record. The only costless repair in the registry, and the derivation was in the obligation's own title all along." },
  "PG-3.drawnDiameterPx":    { value: [56, 92], origin: "DERIVED — layout-spec-v1.1.json body.drawn 34.2…54.6 units at L0 1920x1080, A-G1/A-G24",
                                                  parents: [{ node: "layout-spec-v1.1.json", quote: "rho_drawn = drawn.min + (rho - body.min) / (body.max - body.min) * (drawn.max - drawn.min) … 34.2 … 54.6 field units: ≥ 56 … ≤ 92 px diameter at L0, 1920 × 1080, with the frame widened to hold every drawn body whole (PG-14)." }] },
  /**
   * §57: A-G156 point 2's retirement is REVERTED with A-G226. **The build is CROWDING = 0.3** and both
   * retirements ruled from the 0.5 column.
   *
   * At the BUILT value, from outputs/pg16-crowding-at-0.5.json's own 0.3 figures:
   *   0.3 → the budget BINDS on 8 of the 10 layouts that can exercise it, cutting a spacing capacity of up
   *         to 15 (LV08, LV10) down to 7 — not merely load-bearing but DOMINANT
   *   0.5 → it binds on LV10 alone and ties there, which is A-G156's "never binds alone"
   *
   * **And the superseded text below said so.** "The two constants also swap which pin does the work: at 0.3
   * PG-5 is load-bearing and PG-16 mostly is not; at 0.5 it reverses." I wrote that in this entry and
   * retired the bound anyway. Fourth instance in this phase of one shape: the correct fact recorded one line
   * above the wrong conclusion drawn from it — and the first where both lines are mine.
   *
   * **The deeper reason the retirement could not stand, beyond the column.** The parent edge's own words are
   * DIRECTIONAL: "if the budget and the spacing ever disagree, the spacing wins and the budget shrinks."
   * That describes only the case where the spacing is TIGHTER than the budget. At the built 0.3 the spacing
   * is LOOSER on 8 of 10 layouts — it permits up to 15 where the budget allows 7 — so the claimed
   * derivation is silent in exactly the regime where the constant does its work. **A derivation that does
   * not reach the case in which a constant binds cannot retire that constant**, whichever column is read.
   */
  "PG-5.bodiesAtL0":         { value: 7,     conditionalOn: "CROWDING", liveAt: 0.3, inertAt: 0.5,
                                                  origin: "ARGUED — §57, and LIVE at the built CROWDING = 0.3. PHASE_G §2 G-2 offers only 'the existing CAPABILITY FIELD draws six', a comparison, so the seven has no derivation. It is DOMINANT at the built value: the budget binds on 8 of 10 exercising layouts (outputs/pg16-crowding-at-0.5.json), cutting up to 15 bodies to 7. It is near-inert at the RECORDED bound of 0.5, binding on LV10 alone and tying there — which is what A-G156 point 2 ruled from and why that ruling is withdrawn. Per A-G233 this entry says which artifact each clause is about: the first is the build, the second is the record. BODY_BUDGET.L0 = 7 remains in the code; the constant is GELB's.",
                                                  parents: [{ node: "PG-16.crowding", quote: "This *derives* PG-5's budget; if the budget and the spacing ever disagree, the spacing wins and the budget shrinks." }] },
  "PG-6.relationShare":      { value: 0.15,   origin: "UNDERIVED — PHASE_G §2 G-3 states >= 15 % with no derivation recorded" },
  "PG-10.swingFraction":     { value: 0.25,   origin: "CITED — A-G22 rests it on 'R17's ceiling is what keeps this calm' while the record never states R17's own numbers; it also restates a measurement of a tree A-G41 later voided. A mechanism is named and no quantity is taken from it." },
  "PG-10.weberCorridor":     { value: [0.10, 0.35], origin: "CITED — A-G22, same: R17's corridor is invoked, R17's numbers are not in the record" },
  "PG-10.maxSwing":          { value: null,   origin: "WITHDRAWN — A-G26; the ceiling sat inside PINK's static jitter floor" },
  "PG-11.guard":             { value: null,   origin: "WITHDRAWN — A-G115 replaced the absolute 0.0002 with resolution against the run's own null; the FACTOR is PINK's to set (A-G115)" },
  "PG-12.chromaRatio":       { value: null,   origin: "RE-FORMED — A-G123/A-G126 projection along the hue direction; the FACTOR is PINK's, floored at 0.329 q_proj by the raster (A-G131)" },
  "PG-13.coreOverSurround":  { value: null,   origin: "RETIRED — A-G29, non-discriminating at 12-50x looser than the rejected stage" },
  /**
   * DERIVED, with one question this lane cannot settle: Bouma's law is canonically b ~ 0.5, and R23 is the
   * REVISED law, which reports a range across conditions and observers. 0.3 is inside that literature but the
   * record does not say WHERE in it, or why 0.3 rather than 0.5. So a quantity was taken from the source — it
   * is not CITED — but the value's position within the source's range is unrecorded. Flagged rather than
   * reclassified, because reclassifying on a guess about a paper this lane has not read would be the mirror of
   * the post-hoc derivation A-G143 forbids.
   */
  /**
   * §57 A-G226 WITHDRAWN, and the retirement I made in §56 is reverted. **The build is CROWDING = 0.3**
   * (PersonJobMappingField.tsx, `export const CROWDING = 0.3`), and A-G226 ruled from the 0.5 column.
   *
   * At the BUILT value, from this lane's own outputs/pg16-crowding-L1.json:
   *   0.3 → the budget BINDS on 2 of 9 pools (LV08, LV10, both wanting 15 against 12) — LOAD-BEARING
   *   0.5 → it binds on 0 of 9 and the spacing's maximum is 7 against 12 — inert
   * I stated the first clause plainly in §56 and then let it be read as corroboration of the second. My own
   * falsifiability condition fired on it: "if a layout is ever found where the spacing permits more than the
   * budget at any level, the subsumption breaks and both caps come back." LV08 and LV10 are those layouts,
   * at the built value, in the file.
   */
  "PG-5.bodiesAtL1":         { value: 12,     conditionalOn: "CROWDING", liveAt: 0.3, inertAt: 0.5,
                                                  origin: "UNDERIVED — §57, and LIVE at the built CROWDING = 0.3. A-G50 records no derivation for the 12. It is load-bearing at the built value: the budget binds on 2 of 9 pools (outputs/pg16-crowding-L1.json), cutting a spacing capacity of 15 down to 12 on LV08 and LV10. It is inert at the RECORDED bound of 0.5, where it binds on 0 of 9 — which is what A-G226 ruled from and why that ruling is withdrawn. Per A-G233 this entry says which artifact each clause is about: the first is the build, the second is the record.",
                                                  parents: [{ node: "PG-16.crowding", quote: "This *derives* PG-5's budget; if the budget and the spacing ever disagree, the spacing wins and the budget shrinks." }] },
  "PG-5.overflowStatement":  { value: null,  origin: "ARGUED — A-G156 point 3: PG-5's overflow-statement limb stands on A-G3, which made it its own statement. A copy obligation, not a count bound, so no numeric provenance applies." },
  "PG-16.crowding":          { value: 0.5,    recordedInCodeAs: 0.3, origin: "DERIVED — A-G156 point 1: PG-16 bounds at 0.5, the figure the record states AND applies (R23's arrow, 'free space between bodies at the rim'). The contradiction A-G145 found is RESOLVED rather than recorded. NOTE: CROWDING in PersonJobMappingField.tsx is still 0.3 — the product constant is GELB's and this registry records the bound, not the code. Superseded reasoning kept: A-G145: a quantity IS taken from R23 and it is not the quantity the record states R23 gives. §10 says 'Critical spacing is roughly half the target\'s eccentricity (as free space, in Bouma\'s original form)'; §11 bounds at 0.3. A 40 % relaxation of the cited law, written eight minutes apart in one document. No reading of the paper was required — and A-G153 records that this lane missed it by going to the literature instead of to the record's own statement.",
                                                  parents: [{ node: "R23", quote: "Critical spacing is roughly **half the target's eccentricity** (as free space, in Bouma's original form), it is far stronger in the periphery, and the revised law puts critical spacing **across parts, not objects** — so a body *and its collar of ticks* crowd each other internally." }] },
  /**
   * §45 A-G165/A-G159: both PG-17 limbs are WITHDRAWN. R21 generated `GLOW_RAMP` and the record took no
   * quantity from it, so the finding motivates the form and can certify no bound — CITED was already the
   * right status and the rule now says what CITED cannot do.
   *
   * NOT ADDED HERE, deliberately: this lane derived the ramp's real geometry while checking §45 (rim
   * 1.6 … 2.0 r, measurable 1.536 … 1.950 r at r_px ≥ 28, measured 1.55 … 1.95 r) and it is a DERIVED
   * quantity. It is still not a registry entry, because the registry records bounds the RECORD states and
   * nobody has adopted these as obligations. Writing a figure of my own here would be the laundering the
   * registry exists to stop, one step earlier than A-G140 — the laundering only needs the literal written
   * down somewhere authoritative. It lives in the code comment at GLOW_RAMP and in the released evidence.
   */
  "PG-17.coreOverGround":    { value: null,   origin: "WITHDRAWN — §45 A-G165, with PG-17. Superseded local status was UNDERIVED, AND IT COLLIDES — A-G138: PHASE_G §11 states 1.45 x local ground with no derivation, and VOLUME.depthRatio is also 1.45 in an unrelated role. GELB does not claim the bound was taken from the constant and cannot establish it was not. A reader will assume a relation that may not exist." },
  "PG-17.monotoneExtentInR":  { value: null,  origin: "WITHDRAWN — §45 A-G165: a pin may be derived from a finding only where the record took a quantity from that finding, and R21 gave none. Superseded local status was CITED — PHASE_G §11 names R21's critical band of luminance gradients as the mechanism and takes no quantity from it. ALSO MALFORMED INDEPENDENTLY, and this lane should have said so in §41: the 1.5 was compared against the RIM-to-edge annulus (1.6 … 2.0 r) while only 1.536 … 1.950 r is observable, so the pin's own subject was never the thing measurable. A-G167 is right that provenance and satisfiability are independent axes — PG-17 happened to fail on both." },
  "PG-19.markAboveGround":   { value: null,   origin: "WITHDRAWN UN-BEGUN — A-G141: the disjunction is not the negation of its conjunction, the contrast statistic is unnamed, and the connective makes the weakest escape decide" },
  "PG-22.occupancy":         { value: 0.20,   origin: "UNDERIVED — flat per body, A-G93 made it flat per body after this lane falsified A-G44's 1/r three ways; the 20 % itself has no recorded derivation" },
  "PF-15.ringBudget":        { value: 0.08,   origin: "UNDERIVED — A-G5" },
  "PF-15.ladderStep":        { value: 1.6,    origin: "ASSERTED — A-G2 called 1.64 asserted; the ladder's 1.6 inherits that status" }
});
/* ── A-G151: the dependency graph, so a status is INHERITED rather than recorded locally ───────────── */
/**
 * §43 A-G151, built to its six points. A-G140 stopped an INSTRUMENT laundering a bound; this stops a
 * DOCUMENT laundering one through a chain, which is the same defect one level up.
 *
 * Ordering, strongest to weakest, and point 4 is the choice that needs its reason:
 * DERIVED > CITED > ARGUED > ASSERTED > UNDERIVED > DERIVED-AND-CONTRADICTED.
 * **DERIVED-AND-CONTRADICTED sits BELOW UNDERIVED** because "no origin" is better than "an origin that
 * disagrees": the second carries a warrant it does not have. That is A-G138's ruling and the ordering agrees
 * with it.
 *
 * An edge requires a VERBATIM quote of the sentence that creates the dependency (point 2) — an inherited
 * status with no quoted claim is asserted, not inherited. Only CLAIMED derivations are edges: R17 and R21 are
 * cited by PG-10 and PG-17 as mechanisms with no quantity taken, which is what CITED already encodes, so they
 * are motivations rather than parents. Modelling them as parents would double-count the same fact.
 */
/**
 * A-G151 point 3 gives six statuses; the registry uses two more and both needed placing, which this lane's
 * first implementation did not do — and the failure mode was silent, which is the part worth recording.
 *   PARTLY DERIVED sits between DERIVED and CITED: part of the value has a derivation and the rest has none,
 *   which is stronger than a mechanism with no quantity and weaker than a full derivation.
 *   INACTIVE is for a bound that is withdrawn, retired or re-formed: it has no value, so it has no provenance
 *   to inherit and takes no part in the ordering.
 * Unknown statuses are NOT silently ranked: the first version returned STATUS_ORDER.length for anything it did
 * not recognise, which ranked PARTLY DERIVED and "FLAT, UNDERIVED SCALE" as WEAKER THAN EVERYTHING — a
 * fail-weak default that looked like a conservative choice and was actually an unnoticed misclassification.
 */
export const STATUS_ORDER = Object.freeze(["DERIVED", "PARTLY DERIVED", "CITED", "ARGUED", "ASSERTED", "UNDERIVED", "DERIVED-AND-CONTRADICTED"]);
export const INACTIVE_STATUSES = Object.freeze(["WITHDRAWN", "WITHDRAWN UN-BEGUN", "RETIRED", "RE-FORMED"]);
/** Source nodes: whether the record states a quantity for them at all. */
export const SOURCE_NODES = Object.freeze({
  /**
   * A-G155 withdrew A-G150 and settled this from the record alone — the decisive sentence is R23's own arrow,
   * which neither lane had quoted: "Bouma then asks for several degrees of free space BETWEEN BODIES at the
   * rim. This derives PG-5's budget instead of asserting it." The record APPLIES R23 between bodies, i.e.
   * objects, and derives PG-5 from that application — so "across parts, not objects" is an additional
   * observation used for the collar, not a replacement of the quantity then applied. Nothing terminates
   * outside the repository and there was never an R23 question.
   */
  "R23": { status: "DERIVED", quantityInRecord: 0.5, note: "0.5 — free space between bodies at the rim, by the record's own statement AND its own application (R23's arrow). A-G155." },
  "G-1": { status: "DERIVED", quantityInRecord: 0.50, note: "the obligation's own title yields >= 0.50; the remaining 0.05 of PG-1's 0.55 appears nowhere" },
  "layout-spec-v1.1.json": { status: "DERIVED", quantityInRecord: [56, 92], note: "the spec states the px range directly" }
});
/** Unrecognised statuses are reported, never silently ranked. */
export const UNRECOGNISED_STATUSES = [];
const statusRank = st => {
  if (INACTIVE_STATUSES.includes(st)) return -1;                  // takes no part in the ordering
  const i = STATUS_ORDER.indexOf(st);
  if (i === -1 && !UNRECOGNISED_STATUSES.includes(st)) UNRECOGNISED_STATUSES.push(st);
  return i === -1 ? STATUS_ORDER.length : i;
};
const localStatusOf = key => {
  const raw = BOUNDS[key]?.origin ?? SOURCE_NODES[key]?.status;
  if (raw === undefined) throw new Error(`ERR_INSTRUMENT_UNKNOWN_NODE:${key}`);
  const head = raw.split(" — ")[0].trim();
  const inactive = INACTIVE_STATUSES.find(x => head.startsWith(x));
  return inactive ?? head.split(",")[0].trim();
};
/** Effective status = the weakest of the bound's own and ALL its ancestors' (point 5). */
export function effectiveStatus(key, seen = new Set()) {
  if (seen.has(key)) return { status: localStatusOf(key), chain: [key], cycle: true };
  seen.add(key);
  const own = localStatusOf(key);
  const parents = BOUNDS[key]?.parents ?? [];
  if (INACTIVE_STATUSES.includes(own)) return { status: own, chain: [key], inactive: true };
  let worst = own, chain = [key];
  for (const p of parents) {
    const up = effectiveStatus(p.node, seen);
    if (statusRank(up.status) > statusRank(worst)) { worst = up.status; chain = [key, ...up.chain]; }
  }
  return { status: worst, chain, cycle: false };
}
/**
 * Point 6, the laundering check: a bound whose LOCAL status is stronger than its EFFECTIVE status must emit
 * BOTH — or the graph has moved the laundering out of the document and into the instrument, which is where
 * A-G140 started.
 */
export function statusOf(key) {
  const local = localStatusOf(key), eff = effectiveStatus(key);
  const laundered = statusRank(local) < statusRank(eff.status);
  return {
    bound: key, localStatus: local, effectiveStatus: eff.status, derivationChain: eff.chain,
    parents: (BOUNDS[key]?.parents ?? []).map(p => ({ node: p.node, quotedClaim: p.quote })),
    launderingDetected: laundered,
    launderingNote: laundered
      ? `LOCAL status ${local} is STRONGER than EFFECTIVE ${eff.status}, inherited through ${eff.chain.join(" <- ")}. Both are emitted (A-G151 point 6): reporting only the local one would move the document's laundering into this instrument.`
      : null
  };
}
/** The registry's own summary — the number A-G143 calls the hardest finding of the phase. */
export function boundProvenanceSummary() {
  const byStatus = {};
  for (const [key, b] of Object.entries(BOUNDS)) {
    const status = b.origin.split(" — ")[0];
    (byStatus[status] ??= []).push(key);
  }
  const total = Object.keys(BOUNDS).length;
  const derived = Object.keys(BOUNDS).filter(k => localStatusOf(k) === "DERIVED").length;
  const contradicted = Object.keys(BOUNDS).filter(k => localStatusOf(k) === "DERIVED-AND-CONTRADICTED").length;
  const laundered = Object.keys(BOUNDS).filter(k => statusOf(k).launderingDetected).map(k => ({ bound: k, local: statusOf(k).localStatus, effective: statusOf(k).effectiveStatus, chain: statusOf(k).derivationChain }));
  if (UNRECOGNISED_STATUSES.length > 0) throw new Error(`ERR_INSTRUMENT_UNRECOGNISED_STATUS:${UNRECOGNISED_STATUSES.join("|")}`);
  return { total, derived, contradicted, cited: Object.keys(BOUNDS).filter(k => BOUNDS[k].origin.startsWith("CITED")).length, byStatus, launderedThroughAChain: laundered };
}
/** Look a bound up and carry its origin into the output. A missing key throws rather than defaulting. */
export function boundOf(key) {
  const b = BOUNDS[key];
  if (b === undefined) throw new Error(`ERR_INSTRUMENT_UNKNOWN_BOUND:${key}`);
  return Object.freeze({
    bound: b.value, origin: b.origin,
    /**
     * EXACT status equality, not a prefix. `origin.startsWith("DERIVED")` also matches
     * "DERIVED-AND-CONTRADICTED" — so while PG-16 carried that status it was reported as `derived: true` and
     * emitted NO provenanceWarning. A contradicted bound passed as a derived one, which is precisely the
     * laundering A-G140 added this registry to prevent, committed inside the registry itself. The counts this
     * lane published as "2 derived" while PG-16 was contradicted were therefore 1 derived and 1 contradicted.
     */
    derived: localStatusOf(key) === "DERIVED",
    /** CITED is not DERIVED: a mechanism was named and no quantity taken from it (A-G143). */
    cited: b.origin.startsWith("CITED"),
    /** A-G140: a comparison against an underived bound is reported AS one, every time it is made. */
    provenanceWarning: localStatusOf(key) === "DERIVED" ? null
      : `the bound for ${key} is not derived (${b.origin.split(" — ")[0]}). Any comparison against it inherits that status, and this instrument reports it rather than laundering the literal into a measurement.` +
        (localStatusOf(key) === "CITED" ? " CITED means a mechanism was named and no quantity taken from it — motivated, not derived, and it has somewhere to go for a number." : "")
  });
}
