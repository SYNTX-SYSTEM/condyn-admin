/**
 * GRÜN · PHASE-G · the lane's colour arithmetic, WITH NO DEPENDENCIES AT ALL.
 *
 * §62 DEFECT 10, second half. These are pure functions over sRGB triples — WCAG relative luminance and
 * CIELAB — and nothing in them needs a browser or a raster decoder. They lived in `gruen-instrument.mjs`,
 * which loads Playwright and `sharp` at module load, so any derivation wanting to check a colour figure by
 * arithmetic had to be able to start a browser first. `gruen-instrument.mjs` re-exports every name below
 * unchanged, so no probe needed an edit and no reading changes.
 *
 * Moved rather than copied, on purpose: a second implementation of the same colour math is how two lanes end
 * up quoting two different C* for one triple.
 */

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

/* ── CIELAB ───────────────────────────────────────────────────────────────────────────────────────── */
const LAB_D65 = Object.freeze({ xn: 0.95047, yn: 1.0, zn: 1.08883 });
const labF = t => (t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29);
/** One sRGB triple (0…255) → {L*, a*, b*, C*}. */
export function labOf(r, g, b) {
  const lin = v => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const R = lin(r), G = lin(g), B = lin(b);
  const X = (0.4124564 * R + 0.3575761 * G + 0.1804375 * B) / LAB_D65.xn;
  const Y = (0.2126729 * R + 0.7151522 * G + 0.0721750 * B) / LAB_D65.yn;
  const Z = (0.0193339 * R + 0.1191920 * G + 0.9503041 * B) / LAB_D65.zn;
  const fx = labF(X), fy = labF(Y), fz = labF(Z);
  const a = 500 * (fx - fy), bb = 200 * (fy - fz);
  return { L: 116 * fy - 16, a, b: bb, C: Math.hypot(a, bb) };
}
/** The C* a ±1 code step produces at a triple — the raster's own chroma resolution there. */
export function chromaQuantumFloor(r, g, b) {
  const base = labOf(r, g, b);
  const steps = [];
  for (const [dr, dg, db] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    const p = labOf(Math.max(0, Math.min(255, r + dr)), Math.max(0, Math.min(255, g + dg)), Math.max(0, Math.min(255, b + db)));
    steps.push(Math.abs(p.C - base.C));
  }
  return { atTriple: [r, g, b], baseC: +base.C.toFixed(4), maxOneCodeDeltaC: +Math.max(...steps).toFixed(4), meanOneCodeDeltaC: +(steps.reduce((x, y) => x + y, 0) / steps.length).toFixed(4) };
}

/**
 * §62 A-G258 — THE ONE ALPHA A LEAK CAN ACTUALLY HAVE.
 *
 * An alpha swept continuously is not an alpha the renderer can apply. A-G81 fixes 8-bit alpha quantisation
 * BEFORE compositing, so the achievable alphas are k/255 and a figure read off a continuous sweep is void at
 * the levels where it would be measured. `achievableAlphas` is that ladder, so a derivation cannot sweep
 * past it by accident, which is exactly how α 0.00210 entered the record as a raster floor.
 */
export const achievableAlphas = (max = 1) => {
  const out = [];
  for (let k = 0; k / 255 <= max; k += 1) out.push({ k, alpha: k / 255 });
  return out;
};
/** Composite `src` over `dst` at an 8-bit alpha code, the way the renderer does it. */
export const compositeAtCode = (dst, src, k, mode = "round") => {
  const a = k / 255, f = mode === "truncate" ? Math.trunc : Math.round;
  return dst.map((v, i) => Math.max(0, Math.min(255, f(v + a * (src[i] - v)))));
};
