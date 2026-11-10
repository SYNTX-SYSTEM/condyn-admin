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

const PW_MODULE = process.env.CONDYN_PLAYWRIGHT_MODULE ?? "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs";
const SHARP_MODULE = process.env.CONDYN_SHARP_MODULE ?? new URL("../../../../../node_modules/sharp/lib/index.js", import.meta.url).pathname;

const pwNamespace = await import(pathToFileURL(PW_MODULE).href);
export const chromium = (pwNamespace.chromium ?? pwNamespace.default?.chromium);
if (chromium === undefined) throw new Error(`ERR_INSTRUMENT_NO_PLAYWRIGHT:${PW_MODULE}`);
const sharpNamespace = await import(pathToFileURL(SHARP_MODULE).href);
export const sharp = sharpNamespace.default ?? sharpNamespace;

export const BASE = process.env.GRUEN_BASE ?? "http://127.0.0.1:3220";
export const ANALYSIS = "CAN_00000000000000000000000000000002";
export const FIELD_URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${ANALYSIS}`;
export const PROVENANCE = Object.freeze({
  playwrightModule: PW_MODULE, sharpModule: SHARP_MODULE, base: BASE,
  instrument: "GRÜN phase-G development instrument", verdict: "NONE — development reading only (A-G36 point 2)"
});

/* ── WCAG relative luminance ──────────────────────────────────────────────────────────────────────── */
const LUT = new Float64Array(256);
for (let i = 0; i < 256; i += 1) { const c = i / 255; LUT[i] = c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
export const luminance = (raw, n, channels) => {
  const L = new Float32Array(n);
  for (let p = 0, q = 0; p < n; p += 1, q += channels) L[p] = 0.2126 * LUT[raw[q]] + 0.7152 * LUT[raw[q + 1]] + 0.0722 * LUT[raw[q + 2]];
  return L;
};
/** The luminance of one sRGB triple — for recomputing a constant's own contribution (A-G27's method). */
export const luminanceOfRgb = (r, g, b) => 0.2126 * LUT[r] + 0.7152 * LUT[g] + 0.0722 * LUT[b];

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
  /** OCCLUDERS — these REMOVE light. Suppressing one raises the field's luminance, so a share computed as
   *  (full − suppressed)/full books them negative (A-G55). The body's opaque black seat and its deliberately
   *  dark core (G-1: dark core, luminous rim). Both are classNames today; A-G49 applies to them too. */
  bodySeat: ".mf-seat",
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
export const EMITTING_CLASSES = Object.freeze(["glowsAll", "bodyOutlines", "bodyNames", "arcs", "beams", "nodes", "sectorText"]);
export const OCCLUDING_CLASSES = Object.freeze(["bodySeat", "bodyCore"]);
/** Kept as the name the earlier readings used, now meaning the emitting set (A-G55). */
export const SEMANTIC_CLASSES = EMITTING_CLASSES;
/** G-3's relations: the coupling beams, by their own testid — see the `beams` note above. */
export const RELATION_CLASSES = Object.freeze(["beams"]);

const clearStyles = async page => {
  await page.evaluate(() => { for (const st of document.querySelectorAll("style")) if (st.textContent.includes("visibility:hidden")) st.remove(); });
  await page.waitForTimeout(260);
};
export async function hide(page, selector) { await page.addStyleTag({ content: `${selector}{visibility:hidden !important}` }); await page.waitForTimeout(340); }
export async function unhideAll(page) { await clearStyles(page); }

/**
 * One mask per class by DIFFERENTIAL suppression: the pixels a class's own light reaches. Built with the page
 * under reducedMotion:reduce so the breath does not enter the mask (PINK's "eleventh defect" guard).
 * `threshold` 0.001 is PINK's. Returns index arrays, clip-local.
 */
export async function classMasks(page, cdp, clip, N, classes, { threshold = 0.001 } = {}) {
  const base = await captureLuminance(cdp, clip, N);
  const masks = {};
  for (const cls of classes) {
    await hide(page, CLASS_SELECTOR[cls]);
    const hidden = await captureLuminance(cdp, clip, N);
    const ix = [];
    for (let i = 0; i < N; i += 1) if (base[i] - hidden[i] > threshold) ix.push(i);
    masks[cls] = ix;
    await unhideAll(page);
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
    dirtyOutsideProduct: (git("status --porcelain=v1") || "").split("\n").filter(Boolean).map(l => l.slice(3)).filter(f => !f.startsWith("docs/career_analysis/evidence/mapping-phase-g/")),
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
