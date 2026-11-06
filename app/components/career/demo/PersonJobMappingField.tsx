"use client";

import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { SIL_TOKENS } from "./SILTokens";
import type { SilLocale } from "../../../../lib/career/view-model/sil-language";
import type { CapabilityProposalProjection } from "../../../../lib/career/capability-core/projection";
import type { AutoMatchWatch, JobRankingState } from "../../../../lib/career/ui/auto-match";
import { FOCUS_INITIAL, type FocusState } from "../../../../lib/career/mapping/focus";
import type { CouplingClass } from "../../../../lib/career/mapping/signs";
import {
  CLASS_LINE, PRIMARY_BEAM_LUMINANCE, arcChanges, bodyMovements, collarSplit, fieldFocusReduce, fieldLevel, fieldViewBox, levelBeams, luminanceOf, mappingFieldModel, markedArc, markedBody,
  motionKind, primaryBeams, ringRadius, roleViewBox, sectorViewBox, selectedCapability, sizeFloor, EVIDENCE_STEP,
  type BodyMovement, type FieldAction, type FieldArc, type FieldBeam, type FieldBody, type FieldSector, type FieldSnapshot, type MappingFieldModel, type ViewBox
} from "../../../../lib/career/view-model/mapping-field";
import { MAPPING_FIELD_COPY, type MappingEmptyReason } from "./mapping-field-copy";

/**
 * PERSON × JOB mapping field, phase D (docs/architecture/decision-fields/PERSON_X_JOB_MAPPING_PHASE_D.md, GRÜN): the MAPPING field
 * on its own stage, L0 to L3. L0 shows the whole field, L1 one pool, L2 one role with its full requirement ring and every coupling as
 * a beam, L3 one arc with its evidence. The collar at L0/L1 and the ring at L2 are one output drawn at two radii (D-Q3); going
 * deeper magnifies and never changes what a mark means.
 *
 * Read only (B-7, D-7): no fetch, no POST, no URL or history write, no storage, no model call. Nothing here touches a job scope:
 * opening is a look, not a choice (B-3); "select this job" stays the Job Field's (B-4).
 *
 * Signs (sign table, through the model): every arc carries its state's arcLine, arcFill and mark; a beam its state's beam; colour
 * carries no state at any level.
 *
 * Phase E (PERSON_X_JOB_MAPPING_PHASE_E.md, "the quiet planetarium") changes how the same semantics reach the eye:
 *  E-1/A-3 evidence rides ONE channel: an arc's luminance is its class's band, the table's per-state luminance its place in it;
 *  E-2     at L0 each body draws its own strongest coupling as one faint beam (data-beam-rank="PRIMARY");
 *  E-3     selecting a capability sets its coupled bodies into one shared-phase oscillation (data-motion="QUERY");
 *  E-4/A-2 own evidence: the place is cut and the body lights once (data-change="EVIDENCE"); displaced by others: it eases to its
 *          new place with no luminance change (data-change="LAYOUT");
 *  E-5     a level change re-frames the geometry first (420 ms), then brings the evidence (from 420 ms);
 *  E-6/A-5 the outer ring breathes at 0.1 Hz while the field is live and nothing is pending; pending and a due continuation are
 *          still — static outlines, never motion;
 *  E-7     strokes ≥ 1.2 px (beams scaled by one common gain to ≥ 1.0 px, A-7), text ≥ 11 px, bodies ≥ 12 px (data-size-floor);
 *  E-8/A-1 the stage is sized against its section and clamped, once, to the part of it inside the window (data-stage-clamp).
 * Under prefers-reduced-motion nothing moves: no animation, no transition, the geometry cuts; the query becomes a static highlight.
 */
const MONO = SIL_TOKENS.typography.mono;
const SANS = SIL_TOKENS.typography.sans;
const CYAN = "92, 200, 255";
const INK = "205, 240, 255";
const kicker: React.CSSProperties = { fontFamily: MONO, fontSize: "11px", fontWeight: 700, letterSpacing: "1.8px", textTransform: "uppercase", color: "rgba(160, 232, 250, 0.92)" };
const meta: React.CSSProperties = { fontFamily: MONO, fontSize: "11px", lineHeight: 1.5, letterSpacing: "0.3px", color: "rgba(176, 200, 216, 0.88)", wordBreak: "break-word" };
const statement: React.CSSProperties = { fontFamily: SANS, fontSize: "12.5px", lineHeight: 1.45, color: "#e6f1f8" };
const badge: React.CSSProperties = { fontFamily: MONO, fontSize: "11px", fontWeight: 700, letterSpacing: "1.1px", padding: "1px 8px", borderRadius: "999px", border: `1px solid rgba(${CYAN}, 0.32)`, color: "rgba(176, 226, 244, 0.95)", whiteSpace: "nowrap" };
const chip: React.CSSProperties = { padding: "2px 9px", borderRadius: "999px", border: `1px solid rgba(${CYAN}, 0.36)`, background: `rgba(${CYAN}, 0.06)`, color: "#cdf6ff", fontFamily: MONO, fontSize: "11px", fontWeight: 700, letterSpacing: "0.8px", cursor: "pointer", whiteSpace: "nowrap" };
const panel: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "7px", padding: "12px 14px", borderRadius: "12px", border: `1px solid rgba(${CYAN}, 0.18)`, background: "rgba(3, 9, 17, 0.82)", boxSizing: "border-box" };

/** The drawn width of the field before the stage has measured itself (server render, first frame); then the measured width (A-7). */
const DRAWN_PX = 960;

/** OTTAVIO's two questions (§5), each reversible by this one constant: body names at L0 always (true) or on mark/selection (false). */
export const BODY_NAMES_AT_L0 = false;
/** …and how much of the host's six orbits shows through the stage: 0.92 as in phase D; 1 damps them fully. */
export const STAGE_GROUND_ALPHA = 0.92;
/** E-7: the legibility floors, in screen pixels. */
export const STROKE_MIN_PX = 1.2;
export const BEAM_MIN_PX = 1.0;
export const TEXT_MIN_PX = 11;
const FLOOR_HEADROOM = 1.002;
/**
 * E-8 / A-1 / E-8c: the stage's top inside its section and the bottom gutter it keeps. The top is MEASURED: STAGE_STRIP_GAP_PX below
 * the field-focus strip's bottom edge (the first shell element above the stage), so the stage follows the strip if it ever grows
 * instead of overlapping it. STAGE_TOP_PX is the fallback before the stage has measured itself, or where no strip stands — it is
 * phase D's top. The one constant that reverses E-8c: a gap of 67 px reproduces phase D's 142 at today's strip.
 */
export const STAGE_STRIP_GAP_PX = 8;
export const STAGE_TOP_PX = 142;
export const STAGE_GUTTER_PX = 28;
/** §3, the three motion kinds, the staging and the breath — every number of the phase in one place (P-3 … P-6 read these). */
export const MOTION = Object.freeze({
  query: Object.freeze({ periodMs: 1400, amplitudePx: 1.5 }),
  transient: Object.freeze({ riseMs: 180, decayMs: 600, peak: 1.8 }),
  layout: Object.freeze({ durationMs: 900, easing: "cubic-bezier(0.42, 0, 0.58, 1)" }),
  stage: Object.freeze({ geometryMs: 420, evidenceFromMs: 420, evidenceMs: 280 }),
  breath: Object.freeze({ periodMs: 10000, radiusAmplitude: 0.015, opacityMean: 0.96, opacityAmplitude: 0.04 })
});
/**
 * E-7: the four rings, told apart by luminance alone (one ink, no hue), each step ≥ 1.6× — also at the breath's trough, where the
 * field ring is at opacityMean − opacityAmplitude of its value.
 */
export const RING_LUMINANCE = Object.freeze({ shelf: 0.05, best: 0.085, field: 0.15, horizon: 0.25 });
/**
 * PF-15 / M-F7: the rings' rendered luminance is width × dash × alpha, not alpha. On their black seats each ring is drawn solid and
 * wide enough that its centre pixel is fully covered at every angle, so it renders at its alpha's own luminance (0.0036 · 0.0069 ·
 * 0.0169 · 0.0431 at 0.05 · 0.085 · 0.15 · 0.25 ink). Screen px; the shelf is a band and keeps its width.
 */
export const RING_WIDTH_PX = Object.freeze({ best: 2.4, field: 2.0, horizon: 2.0 });
/**
 * PHASE F (PERSON_X_JOB_MAPPING_PHASE_F.md, "the living organism"): the medium. Everything that means something is still; only the
 * medium breathes (A-F8). Every number of the medium in one place; none of them carries state.
 *
 * DISC_GROUND_OPAQUE (A-F4): the field disc is painted opaque, so every pixel inside it is the field's own — the host's motion does not
 * shine through it. Reversible by this one constant (false: the disc lets STAGE_GROUND_ALPHA's host ghost through again). OTTAVIO's.
 */
export const DISC_GROUND_OPAQUE = true;
/** The stage's own dark, the colour the opaque disc is painted in (the section's ground at alpha 1). */
const DISC_BASE = "rgb(3, 5, 8)";
/** F-6 / A-F5 / A-F9: the backing under every sign and structure — opaque black, the same geometry. */
export const SEAT = "rgba(0, 0, 0, 1)";
/**
 * A seat's extra width over its mark, in screen px (0.8 px each side): the antialiasing fringe of a 1.2–1.3 px mark at an oblique
 * angle is only partly covered by a seat of its own width, and the medium breathes through by (1 − coverage). Measured per sign class
 * (PF-8 tier A at 0.1 Hz, arcs/ticks): 0.5 px → 0.00065, 1.0 → 0.00028, 1.6 → 0.00008. 0 = exactly the mark's geometry.
 */
export const SEAT_PAD_PX = 1.6;
/** Text's seat: the black outline painted under the fill (paint-order), in screen px — the same measurement (text p99 0.0025 → 0.0004). */
export const TEXT_SEAT_PX = 1.6;
/**
 * F-1: the ground — CYAN at these alphas over the opaque disc, radially from the person (u = r / shelfNear) to the shelf, where the
 * ground ends: the shelf is a ring (E-7), static and backed (A-F8), so the living field is the disc inside it.
 */
export const GROUND = Object.freeze({ stops: Object.freeze([[0, 0.29], [0.25, 0.275], [0.5, 0.25], [0.72, 0.22], [0.86, 0.18], [1, 0.155]] as const) });
/**
 * F-6: the breath — a radial wave in the ground and the halos, from the person outward. `layers` raised-cosine bands over the ground
 * (a partition of unity, so the swing is even across the disc), each at its own phase lag ∝ radius (`edgeLagMs` at the field edge);
 * 4 s rise : 6 s fall; `peakAlpha` the band's CYAN at full swing (A-F1's quarter-nominal). The halo breathes `haloDepth` about its
 * mean. While a capability is selected the amplitude is `selectedGain` of itself (F-7).
 */
export const WAVE = Object.freeze({ periodMs: 10000, riseMs: 4000, edgeLagMs: 1200, layers: 7, peakAlpha: 0.06, haloDepth: 0.3, selectedGain: 0.35 });
/**
 * F-2 / F-3: a body is a volume — an INK core (radial falloff) under its unchanged outline, and a CYAN halo to `haloNear`…`haloFar`
 * times its radius. Depth by rank: one gain, from 1 at rank 1 down to 1 / depthRatio at the last rank, on core and halo ONLY.
 */
export const VOLUME = Object.freeze({ coreAlpha: 0.5, haloAlpha: 0.14, haloNear: 2.2, haloFar: 2.8, depthRatio: 1.45 });
/** F-4: every second pool's wedge darkens the ground by this black alpha (two levels, ±8 % about their mean: 1 − 0.852 = 0.148). */
export const WEDGE_SHADE = 0.148;
/** F-5: a beam's luminance along its length, a mask: `from` at the capability end, `to` at the requirement end (multiplies). */
export const BEAM_GRADIENT = Object.freeze({ from: 0.45, to: 1 });
/** The depth gain of a rank (F-3): monotone non-increasing, 1 at rank 1, 1 / depthRatio at the last rank. */
export function depthGain(rank: number, lastRank: number): number {
  const t = lastRank <= 1 ? 0 : Math.min(1, Math.max(0, (rank - 1) / (lastRank - 1)));
  return Math.round(VOLUME.depthRatio ** -t * 1e6) / 1e6;
}
/** F-6: the 4 : 6 waveform in [-1, 1] at phase f ∈ [0, 1]: a half-cosine rise over riseMs, a half-cosine fall over the rest. */
export function waveAt(f: number): number {
  const rise = WAVE.riseMs / WAVE.periodMs;
  return f <= rise ? -Math.cos((Math.PI * f) / rise) : Math.cos((Math.PI * (f - rise)) / (1 - rise));
}
const WAVE_STEPS = 40;
const waveKeyframes = () => Array.from({ length: WAVE_STEPS + 1 }, (_, i) => {
  const w = Math.round(waveAt(i / WAVE_STEPS) * 1e6) / 1e6;
  return `${Math.round((i / WAVE_STEPS) * 100000) / 1000}% { opacity: calc(var(--mf-wave-mean) + var(--mf-wave-depth) * var(--mf-wave-gain, 1) * ${w}); }`;
}).join(" ");
/**
 * F-6: the phase lag of a point at distance d from the person (ms), as a negative animation delay (the wave is already running). The
 * wave reaches the edge of the living field — the shelf, where the medium ends (A-F8) — edgeLagMs after the centre.
 */
const waveDelay = (d: number, edge: number) => `${Math.round(-(WAVE.periodMs - (WAVE.edgeLagMs * Math.min(1, d / edge))))}ms`;
/** F-1 / F-6: the ground's gradient stops, and the raised-cosine band of layer i (offsets on the ground's radius). */
const groundStops = () => GROUND.stops.map(([u, a]) => ({ offset: u, opacity: a }));
function waveBand(i: number): Array<{ offset: number; opacity: number }> {
  const n = WAVE.layers - 1, c = i / n, h = 1 / n, out: Array<{ offset: number; opacity: number }> = [];
  if (c - h > 0) out.push({ offset: 0, opacity: 0 });
  for (let j = 0; j <= 8; j++) {
    const x = c - h + (2 * h * j) / 8;
    if (x < 0 || x > 1) continue;
    out.push({ offset: Math.round(x * 1e6) / 1e6, opacity: Math.round(WAVE.peakAlpha * (0.5 + 0.5 * Math.cos((Math.PI * (x - c)) / h)) * 1e6) / 1e6 });
  }
  if (c + h < 1) out.push({ offset: 1, opacity: 0 });
  return out;
}
/**
 * The person is the still source the wave leaves from (A-F8: a structure): its disc rests on the ground's resting composite — the
 * ground plus the wave at its mean, opaque — so at the mean phase it is the ground, and while the medium breathes around it, it does not.
 * Returned as opaque sRGB stops along u = r / shelfNear (the ground's own parameter).
 */
const DISC_BASE_RGB = [3, 5, 8] as const;
const groundAlphaAt = (u: number) => {
  const st = GROUND.stops; let a = st[st.length - 1][1];
  for (let i = 1; i < st.length; i++) if (u <= st[i][0]) { const [u0, a0] = st[i - 1], [u1, a1] = st[i]; a = a0 + ((a1 - a0) * (u - u0)) / (u1 - u0); break; }
  return a;
};
/** The medium at rest at u (ground + the wave at its mean), times `shade` (a dark wedge), as opaque sRGB; beyond the ground, black. */
function restingColor(u: number, shade = 1): string {
  if (u > 1) return SEAT;
  const cyan = CYAN.split(",").map(Number);
  const alpha = 1 - (1 - groundAlphaAt(u)) * (1 - WAVE.peakAlpha / 2);
  return `rgb(${DISC_BASE_RGB.map((b, c) => Math.round((b + (cyan[c] - b) * alpha) * shade)).join(", ")})`;
}
function restingStops(uMax: number): Array<{ offset: number; color: string }> {
  return Array.from({ length: 5 }, (_, i) => ({ offset: i / 4, color: restingColor((uMax * i) / 4) }));
}
/** Text keeps its glyphs on a black seat (the firewall for text): the outline is painted first, black, under the fill. */
const textSeat = (k: number) => ({ paintOrder: "stroke", stroke: SEAT, strokeWidth: fixed(TEXT_SEAT_PX * k), strokeLinejoin: "round" as const });

/** The sign table's line words, drawn (in multiples of one screen pixel `k`; `c` the circumference of a body for an open line). */
export const LINE_DASH: Readonly<Record<string, (k: number, c: number) => string | undefined>> = Object.freeze({
  solid: () => undefined,
  dotted: (k: number) => `${1.2 * k} ${2.6 * k}`,
  open: (_k: number, c: number) => `${0.76 * c} ${0.24 * c}`,
  broken: (k: number) => `${5 * k} ${3 * k}`
});
const dashOf = (line: string, k: number, c: number) => {
  const dash = LINE_DASH[line];
  if (dash === undefined) throw new Error(`ERR_MAPPING_FIELD_UNKNOWN_LINE:${line}`);
  return dash(k, c);
};
/** The sign table's beam words, drawn: stroke width and dash in screen pixels `k`, and how strongly. */
export const BEAM_STROKE: Readonly<Record<string, (k: number) => { width: number; dash: string | undefined; opacity: number }>> = Object.freeze({
  solid: (k: number) => ({ width: 1.5 * k, dash: undefined, opacity: 0.85 }),
  thin: (k: number) => ({ width: 0.7 * k, dash: undefined, opacity: 0.75 }),
  dotted: (k: number) => ({ width: 1.1 * k, dash: `${1.2 * k} ${3.2 * k}`, opacity: 0.7 }),
  "faint-dotted": (k: number) => ({ width: 0.8 * k, dash: `${1 * k} ${5 * k}`, opacity: 0.4 }),
  broken: (k: number) => ({ width: 1.1 * k, dash: `${6 * k} ${4 * k}`, opacity: 0.65 })
});
const beamStroke = (beam: string, k: number) => {
  const stroke = BEAM_STROKE[beam];
  if (stroke === undefined) throw new Error(`ERR_MAPPING_FIELD_UNKNOWN_BEAM:${beam}`);
  return stroke(k);
};
const MARKS = ["none", "double", "counterTick", "alias", "constituent"] as const;
/** A-7: one common gain on every beam width, so the thinnest reaches BEAM_MIN_PX on screen; the table's ratios are kept. */
export const BEAM_WIDTH_GAIN = BEAM_MIN_PX / Math.min(...Object.values(BEAM_STROKE).map(stroke => stroke(1).width));

/** A sinusoid as keyframes (linear between dense steps): one full period, starting and ending at the rest value. */
const SINE_STEPS = 24;
const sineKeyframes = (frame: (s: number) => string) => Array.from({ length: SINE_STEPS + 1 }, (_, i) =>
  `${Math.round((i / SINE_STEPS) * 100000) / 1000}% { ${frame(Math.round(Math.sin((2 * Math.PI * i) / SINE_STEPS) * 1e6) / 1e6)} }`).join(" ");
const transientTotal = MOTION.transient.riseMs + MOTION.transient.decayMs;
const transientPeakAt = Math.round((MOTION.transient.riseMs / transientTotal) * 100000) / 1000;

export const MAPPING_FIELD_CSS = `
@keyframes mappingFieldWave { ${waveKeyframes()} }
@keyframes mappingFieldQuery { ${sineKeyframes(v => `transform: translate(calc(var(--mf-query-amp, 1.5px) * ${v}), 0px);`)} }
@keyframes mappingFieldTransient { 0% { filter: brightness(1); } ${transientPeakAt}% { filter: brightness(${MOTION.transient.peak}); } 100% { filter: brightness(1); } }
@keyframes mappingFieldEvidence { from { opacity: 0; } to { opacity: 1; } }
[data-testid="mapping-field"] [data-mapping-sector] { cursor: pointer; }
[data-testid="mapping-field"] [data-mapping-body]:focus, [data-testid="mapping-field"] [data-mapping-arc]:focus, [data-testid="mapping-field"] [data-mapping-node]:focus { outline: none; }
[data-testid="mapping-field"] [data-mapping-body]:focus-visible circle[data-mapping-body-shape] { stroke-width: 2.4px; }
[data-testid="mapping-field"] [data-mapping-arc]:focus-visible, [data-testid="mapping-field"] [data-mapping-node]:focus-visible { filter: drop-shadow(0 0 3px rgba(${CYAN}, 0.95)); }
[data-testid="mapping-field"] button:focus-visible { outline: 1px solid rgba(${CYAN}, 0.85); outline-offset: 2px; }
[data-testid="mapping-field"] .mf-wave { opacity: var(--mf-wave-mean); }
[data-testid="mapping-field"] .mf-wave-ground { --mf-wave-mean: 0.5; --mf-wave-depth: 0.5; }
[data-testid="mapping-field"] .mf-wave-halo { --mf-wave-mean: ${1 - WAVE.haloDepth / 2}; --mf-wave-depth: ${WAVE.haloDepth / 2}; }
[data-testid="mapping-field"][data-selection="CAPABILITY"] { --mf-wave-gain: ${WAVE.selectedGain}; }
[data-testid="mapping-field"][data-breath="LIVE"] .mf-wave { animation: mappingFieldWave ${WAVE.periodMs}ms linear infinite; }
[data-testid="mapping-field"] .mf-layout { transition: transform ${MOTION.layout.durationMs}ms ${MOTION.layout.easing}; }
[data-testid="mapping-field"] [data-motion="QUERY"] { animation: mappingFieldQuery ${MOTION.query.periodMs}ms linear infinite; }
[data-testid="mapping-field"] [data-mapping-body][data-change="EVIDENCE"] { animation: mappingFieldTransient ${transientTotal}ms linear 1; }
[data-testid="mapping-field"] [data-mapping-arc][data-change="EVIDENCE"] { animation: mappingFieldTransient ${transientTotal}ms linear 1; }
[data-testid="mapping-field"] [data-mapping-body][data-change="LAYOUT"] { transition: transform ${MOTION.layout.durationMs}ms ${MOTION.layout.easing}; }
[data-testid="mapping-field"] [data-stage-part="EVIDENCE"] { animation: mappingFieldEvidence ${MOTION.stage.evidenceMs}ms linear ${MOTION.stage.evidenceFromMs}ms both; }
[data-testid="mapping-field"][data-frozen="true"] *, [data-testid="mapping-field"][data-frozen="true"] { animation: none !important; transition: none !important; }
[data-testid="mapping-pending-outline"] { display: none; }
[data-testid="mapping-field"][data-pending-breath="true"] [data-testid="mapping-pending-outline"] { display: inline; }
@media (prefers-reduced-motion: reduce) {
  [data-testid="mapping-field"], [data-testid="mapping-field"] * { animation: none !important; transition: none !important; }
  [data-testid="mapping-field"] [data-mapping-body][data-lit="false"][data-in-pool="true"] { opacity: 0.32; }
}`;
/** P-6: the geometry stage is a script tween, not a CSS animation — it asks the same media query and cuts under it. */
const reducedMotion = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const toRad = (degrees: number) => (degrees * Math.PI) / 180;
const fixed = (v: number) => Math.round(v * 1000) / 1000;
const at = (cx: number, cy: number, r: number, degrees: number) => [fixed(cx + r * Math.cos(toRad(degrees))), fixed(cy + r * Math.sin(toRad(degrees)))] as const;
/** An annular wedge from the inner to the outer radius over [start, start + span] (clockwise, +y down). */
function wedge(inner: number, outer: number, start: number, span: number): string {
  const end = start + span, large = span > 180 ? 1 : 0;
  const [ax, ay] = at(0, 0, outer, start), [bx, by] = at(0, 0, outer, end), [cx, cy] = at(0, 0, inner, end), [dx, dy] = at(0, 0, inner, start);
  return `M ${ax} ${ay} A ${outer} ${outer} 0 ${large} 1 ${bx} ${by} L ${cx} ${cy} A ${inner} ${inner} 0 ${large} 0 ${dx} ${dy} Z`;
}
/** A circular arc around (cx, cy) from start to end degrees (clockwise). */
function arcPath(cx: number, cy: number, r: number, start: number, end: number): string {
  const [ax, ay] = at(cx, cy, r, start), [bx, by] = at(cx, cy, r, end);
  return `M ${ax} ${ay} A ${r} ${r} 0 ${end - start > 180 ? 1 : 0} 1 ${bx} ${by}`;
}
const testKey = (b: Pick<FieldBody, "id">) => `${b.id.jobPoolUploadId}:${b.id.poolRoleId}`;
const NO_MOVES: ReadonlyMap<string, BodyMovement> = new Map();
const NO_ARC_CHANGES: ReadonlySet<string> = new Set();

/**
 * One requirement arc, drawn from its sign only: the line (solid · dotted · broken · open = its two ends and nothing between), the
 * filled fraction as an inner band, the mark, the luminance. The same function draws a collar tick at L0/L1 and a ring arc at L2/L3.
 */
function arcSign({ arc, cx, cy, r, k, testId, emphasis = false, change = null, interactive }: {
  arc: FieldArc; cx: number; cy: number; r: number; k: number; testId: string; emphasis?: boolean;
  /** E-4b: the reading in which this requirement's own evidence changed (its arc lights once; a new reading replays it), or null. */
  change?: number | null;
  interactive?: { onOpen(): void; onMark(): void; onClear(): void; label: string; open: boolean; marked: boolean };
}): React.ReactElement {
  const s = arc.sign;
  if (!(MARKS as readonly string[]).includes(s.mark)) throw new Error(`ERR_MAPPING_FIELD_UNKNOWN_MARK:${s.mark}`);
  // A-6: emphasis (the open, the marked, the queried arc) rides the stroke width; the luminance stays the evidence band's.
  const width = (interactive?.open || interactive?.marked || emphasis ? 2 : 1.3) * k;
  const mark = STROKE_MIN_PX * k * FLOOR_HEADROOM;
  const tick = Math.max(2.4 * k, r * 0.18);
  const ends = s.arcLine === "open";
  const fillEnd = arc.startDegrees + arc.spanDegrees * s.arcFill;
  const key = change === null ? arc.poolRequirementId : `${arc.poolRequirementId}#${change}`;
  /** The arc's drawn parts. As the seat (F-6 firewall): the same geometry in opaque black, a seat-pad wider, no data, no hit. */
  const parts = (seat: boolean) => {
    const ink = (alpha: number) => (seat ? SEAT : `rgba(${INK}, ${alpha})`);
    const w = (width: number) => (seat ? width + SEAT_PAD_PX * k : width);
    const tag = (attr: string, value: string | true = true) => (seat ? {} : { [attr]: value });
    return (
      <>
        {!ends && (
          <path {...tag("data-arc-line")} d={arcPath(cx, cy, r, arc.startDegrees, arc.endDegrees)} fill="none" stroke={ink(0.9)} strokeWidth={w(width)}
            strokeDasharray={dashOf(s.arcLine, k, 0)} strokeLinecap={s.arcLine === "dotted" ? "round" : "butt"} />
        )}
        {ends && [arc.startDegrees, arc.endDegrees].map((d, i) => {
          const [ax, ay] = at(cx, cy, r - tick / 2, d), [bx, by] = at(cx, cy, r + tick / 2, d);
          return <line key={i} {...tag("data-arc-end")} x1={ax} y1={ay} x2={bx} y2={by} stroke={ink(0.9)} strokeWidth={w(width)} />;
        })}
        {s.arcFill > 0 && <path {...tag("data-arc-fill")} d={arcPath(cx, cy, r - 2.2 * k, arc.startDegrees, fillEnd)} fill="none" stroke={ink(0.7)} strokeWidth={w(2.2 * k)} />}
        {s.mark === "double" && <path {...tag("data-arc-mark", "double")} d={arcPath(cx, cy, r + 2.4 * k, arc.startDegrees, arc.endDegrees)} fill="none" stroke={ink(0.9)} strokeWidth={w(mark)} />}
        {s.mark === "counterTick" && (() => { const [ax, ay] = at(cx, cy, r - tick, arc.midDegrees), [bx, by] = at(cx, cy, r + tick, arc.midDegrees); return <line {...tag("data-arc-mark", "counterTick")} x1={ax} y1={ay} x2={bx} y2={by} stroke={ink(0.95)} strokeWidth={w(1.4 * k)} />; })()}
        {s.mark === "alias" && (() => { const [mx, my] = at(cx, cy, r + 3.6 * k, arc.midDegrees); return <circle {...tag("data-arc-mark", "alias")} cx={mx} cy={my} r={1.6 * k} fill="none" stroke={ink(0.9)} strokeWidth={w(mark)} />; })()}
        {s.mark === "constituent" && (() => { const [ax, ay] = at(cx, cy, r + 0.6 * k, arc.midDegrees), [bx, by] = at(cx, cy, r + 3.6 * k, arc.midDegrees); return <line {...tag("data-arc-mark", "constituent")} x1={ax} y1={ay} x2={bx} y2={by} stroke={ink(0.9)} strokeWidth={w(mark)} />; })()}
      </>
    );
  };
  return (
    <React.Fragment key={key}>
    <g className="mf-seat" aria-hidden="true" pointerEvents="none">{parts(true)}</g>
    <g
      key={key} data-testid={testId} data-mapping-arc data-change={change === null ? undefined : "EVIDENCE"} data-requirement={arc.poolRequirementId} data-state={arc.state} data-class={arc.class} data-line={s.arcLine} data-fill={s.arcFill}
      data-beam={s.beam} data-phase-locked={String(s.phaseLocked)} data-mark={s.mark} data-luminance={s.luminance} data-evidence-step={EVIDENCE_STEP[s.class]} data-evidence-luminance={luminanceOf(s)}
      data-open={String(interactive?.open === true)} data-marked={String(interactive?.marked === true)} data-emphasis={String(emphasis)}
      opacity={luminanceOf(s)}
      tabIndex={interactive ? 0 : undefined} role={interactive ? "button" : undefined} aria-label={interactive?.label}
      onClick={interactive ? event => { event.stopPropagation(); interactive.onOpen(); } : undefined}
      onKeyDown={interactive ? event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); interactive.onOpen(); } } : undefined}
      onMouseEnter={interactive?.onMark} onFocus={interactive?.onMark} onMouseLeave={interactive?.onClear} onBlur={interactive?.onClear}
      style={interactive ? { cursor: "pointer" } : undefined}
    >
      {interactive && <path d={arcPath(cx, cy, r, arc.startDegrees, arc.endDegrees)} fill="none" stroke="rgba(0, 0, 0, 0)" strokeWidth={10 * k} data-mapping-hit />}
      {parts(false)}
    </g>
    </React.Fragment>
  );
}

export interface PersonJobMappingFieldProps {
  locale: SilLocale;
  /** The PERSON analysis's capability proposals (the constellation); null when the result names none. */
  projection: CapabilityProposalProjection | null;
  /** The ranking and the run as the automatic path already read them (useJobRanking / useAutoMatch) — nothing is read again here. */
  ranking: JobRankingState;
  watch: AutoMatchWatch;
}

/** Why nothing is drawn (§3): each empty or error reading in its own sentence, never an empty field. */
export function mappingEmptyReason(ranking: JobRankingState, model: MappingFieldModel | null): MappingEmptyReason | null {
  if (model !== null) return model.view.empty;
  switch (ranking.state) {
    case "NOT_PERSON": case "PROJECTION_ABSENT": case "BOUNDARY_UNRESOLVED": case "NOT_PROVISIONED": case "ANALYSIS_NOT_FOUND": return ranking.state;
    default: return "NO_RANKING";
  }
}

/**
 * E-8 / P-7 · the sector names stay inside the stage box: each runs along the field's rim on its own sector's arc (a text path), so
 * it never reaches sideways out of the drawing; the L0 frame keeps exactly the band they need. A name longer than its arc is
 * shortened with an ellipsis (the full name stands in the pool chips and in the sector's title).
 */
const LABEL_GAP = 12;
const LABEL_BAND_PX = TEXT_MIN_PX + 4;
const CHAR_EM = 0.62;
/** The L0 margin m that holds the label band: m = gap + band·k, k = 2(R + m)/drawnPx — solved for m. */
function l0Margin(drawnPx: number, fieldRadius: number): number {
  const c = (2 * LABEL_BAND_PX) / drawnPx;
  return Math.ceil(((LABEL_GAP + c * fieldRadius) / (1 - c)) * 1000) / 1000;
}
function sectorLabel(name: string, spanDegrees: number, radius: number, fontSize: number): string {
  const fits = Math.max(1, Math.floor((toRad(Math.max(0, spanDegrees - 4)) * radius) / (CHAR_EM * fontSize)));
  return name.length <= fits ? name : `${name.slice(0, Math.max(1, fits - 1))}…`;
}
/** The rim arc a sector's name runs on: clockwise over the top half, counter-clockwise under it (so it never reads upside down). */
function labelPath(radius: number, start: number, span: number, fontSize: number): string {
  const mid = start + span / 2, norm = ((mid % 360) + 360) % 360, below = norm > 0 && norm < 180;
  const r = below ? radius + 0.78 * fontSize : radius;
  const [ax, ay] = at(0, 0, r, start), [bx, by] = at(0, 0, r, start + span), large = span > 180 ? 1 : 0;
  return below ? `M ${bx} ${by} A ${r} ${r} 0 ${large} 0 ${ax} ${ay}` : `M ${ax} ${ay} A ${r} ${r} 0 ${large} 1 ${bx} ${by}`;
}

/** Whether an element or one of its ancestors is position: fixed — its viewport rectangle then does not move with the page's scroll. */
function fixedInViewport(element: Element): boolean {
  for (let e: Element | null = element; e !== null; e = e.parentElement) if (getComputedStyle(e).position === "fixed") return true;
  return false;
}

export function PersonJobMappingField({ locale, projection, ranking, watch }: PersonJobMappingFieldProps) {
  const c = MAPPING_FIELD_COPY[locale];
  const model = useMemo(() => mappingFieldModel({ projection, ranking, watch }), [projection, ranking, watch]);
  const [focus, setFocus] = useState<FocusState>(FOCUS_INITIAL);
  const act = (action: FieldAction) => setFocus(previous => fieldFocusReduce(previous, action));
  // The time sign: the reading on view and the one before it, advanced once per new ranking (state adjusted while rendering, the
  // React pattern for "previous props"); movements are computed once per reading, not per render. `seq` counts readings, so a body
  // whose own evidence changed again is a new element and its transient plays again (E-4).
  const [readings, setReadings] = useState<{ now: FieldSnapshot | null; before: FieldSnapshot | null; seq: number }>({ now: null, before: null, seq: 0 });
  let pair = readings;
  if ((model?.ranking ?? null) !== (pair.now?.ranking ?? null)) {
    pair = { before: pair.now, now: model === null ? null : { analysisId: model.analysisId, ranking: model.ranking, bodies: model.bodies }, seq: pair.seq + 1 };
    setReadings(pair);
  }
  const movements = useMemo(() => (pair.now === null ? NO_MOVES : bodyMovements(pair.before, pair.now)), [pair]);
  const changedArcs = useMemo(() => (pair.now === null ? NO_ARC_CHANGES : arcChanges(pair.before, pair.now)), [pair]);

  // E-8 / A-1 / E-8b / E-8c · the stage measures itself once per size: its section's box, the part of it inside the first window
  // height, the focus strip's bottom edge, and its own drawn width (k, A-7). The clamp and the top read only the section, the strip
  // and the window — never the stage they size — so one pass converges. All three are read in document coordinates (the viewport
  // rectangle plus the scroll offset), so a scrolled host (E-8a) does not change them: the same clamp at scroll 0, scrolled, and
  // after a reload that restores the scroll.
  const sectionRef = useRef<HTMLElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [drawnPx, setDrawnPx] = useState(DRAWN_PX);
  const [clamp, setClamp] = useState<number | null>(null);
  const [stageTop, setStageTop] = useState(STAGE_TOP_PX);
  const empty = mappingEmptyReason(ranking, model);
  const drawable = model !== null && empty === null;
  useLayoutEffect(() => {
    const section = sectionRef.current, svg = svgRef.current;
    if (!drawable || section === null || svg === null || typeof window === "undefined") return;
    const measure = () => {
      const r = section.getBoundingClientRect(), top = r.top + window.scrollY, bottom = r.bottom + window.scrollY;
      const visible = Math.min(bottom, window.innerHeight) - top;
      const strip = document.querySelector<HTMLElement>('[data-testid="field-focus-strip"]');
      // The strip is shell: where it is fixed (today it is), its place at scroll 0 IS its viewport place; in flow it scrolls with the page.
      const stripBottom = strip === null ? null : strip.getBoundingClientRect().bottom + (fixedInViewport(strip) ? 0 : window.scrollY);
      const nextTop = stripBottom === null ? STAGE_TOP_PX : Math.max(0, Math.ceil(stripBottom - top + STAGE_STRIP_GAP_PX));
      setStageTop(previous => (previous === nextTop ? previous : nextTop));
      const next = Math.max(0, Math.floor(visible - nextTop - STAGE_GUTTER_PX));
      setClamp(previous => (previous === next ? previous : next));
      const width = svg.getBoundingClientRect().width;
      if (width > 0) setDrawnPx(previous => (Math.abs(previous - width) < 0.01 ? previous : width));
    };
    measure();
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    observer?.observe(section); observer?.observe(svg);
    const strip = document.querySelector<HTMLElement>('[data-testid="field-focus-strip"]');
    if (strip !== null) observer?.observe(strip);
    window.addEventListener("resize", measure);
    return () => { observer?.disconnect(); window.removeEventListener("resize", measure); };
  }, [drawable]);

  const view = fieldLevel(focus, model);
  const { level, pool } = view;
  const openSector = pool === null || model === null ? null : model.sectors.find(s => s.poolId === pool) ?? null;
  const openBody = view.body;
  const box: ViewBox = openBody !== null ? roleViewBox(openBody) : openSector !== null ? sectorViewBox(openSector) : fieldViewBox(l0Margin(drawnPx, model?.geometry.fieldRadius ?? 500));
  const boxKey = `${box.x} ${box.y} ${box.width} ${box.height}`;
  const stageKey = `${level}|${pool ?? ""}|${openBody?.key ?? ""}|${view.arc?.poolRequirementId ?? ""}`;
  // E-5 · staged recursion: the geometry re-frames first (a script tween of the viewBox, MOTION.stage.geometryMs); the evidence of
  // the new level enters from MOTION.stage.evidenceFromMs (CSS, data-stage-part). Under reduced motion the frame cuts.
  const shownBox = useRef<string | null>(null);
  useLayoutEffect(() => {
    const svg = svgRef.current, section = sectionRef.current;
    if (svg === null || section === null) return;
    const from = shownBox.current;
    shownBox.current = boxKey;
    if (from === null || from === boxKey || reducedMotion() || typeof requestAnimationFrame !== "function") { section.setAttribute("data-stage", "SETTLED"); return; }
    const a = from.split(" ").map(Number), b = boxKey.split(" ").map(Number);
    svg.setAttribute("viewBox", from);
    section.setAttribute("data-stage", "GEOMETRY");
    const t0 = performance.now();
    let frame = requestAnimationFrame(function step(now: number) {
      const t = Math.min(1, (now - t0) / MOTION.stage.geometryMs), e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      svg.setAttribute("viewBox", a.map((v, i) => fixed(v + (b[i] - v) * e)).join(" "));
      if (t < 1) frame = requestAnimationFrame(step); else section.setAttribute("data-stage", "EVIDENCE");
    });
    return () => { cancelAnimationFrame(frame); svg.setAttribute("viewBox", boxKey); };
  }, [boxKey]);

  if (model === null || empty !== null) {
    return (
      <section data-testid="mapping-field" data-empty={empty ?? "NO_RANKING"} style={{ position: "absolute", inset: 0, zIndex: 45, backgroundColor: `rgba(3, 5, 8, ${STAGE_GROUND_ALPHA})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ ...panel, maxWidth: "460px" }}>
          <span style={kicker}>{c.title}</span>
          <span data-testid="mapping-empty" data-reason={empty ?? "NO_RANKING"} role="status" style={statement}>{c.empty[empty ?? "NO_RANKING"]}</span>
        </div>
      </section>
    );
  }

  const ringR = openBody === null ? 0 : ringRadius(openBody);
  const k = box.width / drawnPx;
  // The floors are held with a 0.2 % headroom, so a sub-pixel rounding of the measured width never lands a floor just under itself.
  const fontSize = TEXT_MIN_PX * k * FLOOR_HEADROOM;
  const structure = STROKE_MIN_PX * k * FLOOR_HEADROOM;
  const marked = markedBody(focus, model);
  const markedReq = markedArc(focus, model);
  const selected = selectedCapability(focus, model);
  // E-2: at L0 every body's own strongest coupling (PRIMARY, faint); everything beyond it only on selection (SELECTION).
  const selectionBeams = levelBeams(focus, model);
  const selectionIds = new Set(selectionBeams.map(b => b.id));
  const beams: Array<{ beam: FieldBeam; rank: "PRIMARY" | "SELECTION" }> = [
    ...(level === "L0" ? primaryBeams(model) : []).filter(b => !selectionIds.has(b.id)).map(beam => ({ beam, rank: "PRIMARY" as const })),
    ...selectionBeams.map(beam => ({ beam, rank: "SELECTION" as const }))
  ];
  const drawnBeams = beams.filter(b => b.beam.from !== null);
  const missing = { CONSTELLATION_OVERFLOW: 0, NOT_IN_PERSON: 0, KEY_ABSENT: 0 };
  for (const { beam } of beams) if (beam.missing !== null) missing[beam.missing] += 1;
  const primaryUndrawn = beams.filter(b => b.rank === "PRIMARY" && (b.beam.missing === "NOT_IN_PERSON" || b.beam.missing === "KEY_ABSENT")).length;
  const g = model.geometry;
  const run = model.run;
  // E-6 / A-5: the breath means exactly "live and nothing pending"; pending, a due continuation and a resting run are still.
  const breathLive = !run.pendingBreath && !run.sign.frozen && !run.sign.resumePulse && !run.resumePending;
  const evidence = model.evidenceClass ?? "NONE";
  const classWord = (cls: CouplingClass) => c.legend[cls];
  const inPool = (poolId: string) => openSector === null || openSector.poolId === poolId;
  const overflowShown = openSector === null ? model.overflowCount : openSector.overflow;
  const shown = openBody !== null ? [openBody] : model.bodies;
  const drawnRadius = new Map(shown.map(b => [b.key, sizeFloor(b.radius, k)] as const));
  const radiusOf = (b: FieldBody) => drawnRadius.get(b.key)?.radius ?? b.radius;
  const collarR = (b: FieldBody) => radiusOf(b) + 2.6 * k;
  const layoutShifts = [...movements.values()].filter(m => m.kind === "LAYOUT").length;
  const evidenceChanges = [...movements.values()].filter(m => m.kind === "EVIDENCE").length;
  // E-4b: a requirement whose own evidence changed lights on its own arc, moved or not; the reading's count is stated (E-9).
  const requirementChanges = changedArcs.size;
  const arcChange = (b: Pick<FieldBody, "key">, arc: FieldArc) => (changedArcs.has(`${b.key}\u0000${arc.poolRequirementId}`) ? pair.seq : null);
  const displacedDrawn = shown.some(b => b.displaced);
  const floored = shown.filter(b => drawnRadius.get(b.key)?.floor === true).length;
  /** D-Q3: each small body's collar, in ring order; what it cannot carry is counted (L0/L1 only — L2/L3 draw the full ring). */
  const collars = new Map(shown.map(b => [b.key, openBody === null ? collarSplit(b.arcs, collarR(b) / k) : null] as const));
  const collarHidden = [...collars.values()].reduce((sum, collar) => sum + (collar?.hidden ?? 0), 0);
  const drawnArcs = openBody !== null ? openBody.arcs : [...collars.values()].flatMap(collar => collar?.drawn ?? []);
  const phaseLockOnView = drawnArcs.some(a => a.sign.phaseLocked) || drawnBeams.some(b => b.beam.phaseLocked);
  const lockedNodes = new Set(drawnBeams.filter(b => b.beam.phaseLocked).map(b => b.beam.arc.coupling!.capabilityKey));
  const target = (beam: FieldBeam) => openBody !== null && beam.body.key === openBody.key ? at(openBody.x, openBody.y, ringR, beam.arc.midDegrees) : at(beam.body.x, beam.body.y, collarR(beam.body), beam.arc.midDegrees);
  const toggleCapability = (key: string) => act(selected?.key === key ? { type: "CLEAR_SELECTION" } : { type: "SELECT_CAPABILITY", capabilityKey: key });
  const markRole = (b: FieldBody) => { if (selected === null) act({ type: "MARK_ROLE", role: b.id }); };
  const clearMark = () => { if (focus.selection !== null && focus.selection.kind !== "CAPABILITY") act({ type: "CLEAR_SELECTION" }); };
  const openFromBody = (b: FieldBody) => {
    if (level === "L0") act({ type: "OPEN_POOL", jobPoolUploadId: b.id.jobPoolUploadId });
    else if (level === "L1" && inPool(b.id.jobPoolUploadId)) act({ type: "OPEN_ROLE", role: b.id });
  };

  const lastRank = Math.max(1, ...model.bodies.map(b => b.rank));
  const fieldHalos: React.ReactElement[] = [], shelfHalos: React.ReactElement[] = [];
  const bodyElements = shown.map(b => {
    const move = movements.get(b.key);
    const queried = selected !== null && selected.roles.has(b.key) && (level === "L0" || level === "L1");
    const motion = motionKind(move, queried);
    const evidenceMove = motion.change === "EVIDENCE";
    // E-4b: a changed requirement this body cannot draw at this level (beyond its collar) lights the body itself, in place.
    const collarNow = collars.get(b.key) ?? null;
    const drawnHere = new Set((collarNow === null ? b.arcs : collarNow.drawn).map(a => a.poolRequirementId));
    const hiddenChange = !evidenceMove && b.arcs.some(a => arcChange(b, a) !== null && !drawnHere.has(a.poolRequirementId));
    const change = motion.change ?? (hiddenChange ? "EVIDENCE" : null);
    const layoutShift = motion.change === "LAYOUT";
    const isMarked = marked?.key === b.key;
    const lit = selected === null || selected.roles.has(b.key);
    const inPoolNow = inPool(b.id.jobPoolUploadId);
    // A-6: the focused group is never dimmed; the other pools are context at one common gain (their ladder kept). The reverse view's
    // static dim exists only under reduced motion (CSS, data-lit), where it replaces the query motion.
    const opacity = inPoolNow ? 1 : 0.18;
    const floor = drawnRadius.get(b.key) ?? { radius: b.radius, floor: false };
    const r = floor.radius;
    const circumference = 2 * Math.PI * r;
    const collar = collars.get(b.key) ?? null;
    const focusable = openBody === null && inPoolNow;
    const named = level === "L0" ? BODY_NAMES_AT_L0 || isMarked || (selected !== null && selected.roles.has(b.key)) : inPoolNow;
    // F-2 / F-3 / F-6: the halo — medium, not sign: the same form on every body, its depth gain and radius only; it breathes with the
    // ground at the body's own phase lag, except on the shelf, which is a still ring (A-F8): there it rests.
    const t = lastRank <= 1 ? 0 : (b.rank - 1) / (lastRank - 1);
    (b.shelf ? shelfHalos : fieldHalos).push(
      <g key={change === "EVIDENCE" ? `halo|${b.key}#${pair.seq}` : `halo|${b.key}`} className={layoutShift ? "mf-halo mf-layout" : "mf-halo"}
        opacity={fixed(opacity * depthGain(b.rank, lastRank))} style={{ transform: `translate(${b.x}px, ${b.y}px)` }}>
        <circle className={b.shelf ? undefined : "mf-wave mf-wave-halo"} r={fixed(r * (VOLUME.haloNear + (VOLUME.haloFar - VOLUME.haloNear) * t))} fill="url(#mf-halo)"
          style={b.shelf ? undefined : { animationDelay: waveDelay(Math.hypot(b.x, b.y), g.shelfNear) }} />
      </g>
    );
    return (
      <g
        key={change === "EVIDENCE" ? `${b.key}#${pair.seq}` : b.key}
        data-testid={`mapping-body-${testKey(b)}`} data-mapping-body data-rank={b.rank} data-tier={b.tier} data-class={b.class} data-line={b.line} data-shelf={String(b.shelf)}
        data-displaced={String(b.displaced)} data-moved={String(evidenceMove)} data-movement={move?.kind ?? "NONE"} data-layout-shift={String(layoutShift)} data-change={change ?? undefined}
        data-marked={String(isMarked)} data-lit={String(lit)} data-in-pool={String(inPoolNow)} data-requirements={b.arcs.length} data-collar-hidden={collar?.hidden ?? 0}
        data-size-floor={String(floor.floor)} data-drawn-radius={fixed(r)} data-named={String(named)}
        tabIndex={focusable ? 0 : -1} role="button" aria-label={c.bodyLabel(b.rank, b.title, b.organizationName, classWord(b.class), b.arcs.length)}
        opacity={opacity}
        onMouseEnter={() => { if (focusable) markRole(b); }} onFocus={() => { if (focusable) markRole(b); }} onMouseLeave={clearMark} onBlur={clearMark}
        onClick={() => openFromBody(b)}
        onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openFromBody(b); } }}
        style={{ transform: `translate(${b.x}px, ${b.y}px)`, cursor: focusable ? "pointer" : "default" }}
      >
        <title>{c.bodyLabel(b.rank, b.title, b.organizationName, classWord(b.class), b.arcs.length)}</title>
        <g data-mapping-body-content data-motion={motion.query ? "QUERY" : undefined}>
          {/* E-9: where a body whose own evidence changed stood before — stated on the changed element, still. */}
          {evidenceMove && move !== undefined && (
            <line data-testid={`mapping-trail-${testKey(b)}`} data-mapping-trail x1={fixed(move.from.x - b.x)} y1={fixed(move.from.y - b.y)} x2={0} y2={0}
              stroke={`rgba(${INK}, 0.45)`} strokeWidth={structure} strokeDasharray={`${2 * k} ${2 * k}`} />
          )}
          {/* F-2 / F-3: the volume's core — the same form on every body, its depth gain only; no state. */}
          <circle className="mf-seat" aria-hidden="true" pointerEvents="none" r={r} fill={SEAT} />
          <circle className="mf-core" aria-hidden="true" pointerEvents="none" r={r} fill="url(#mf-core)" opacity={depthGain(b.rank, lastRank)} />
          <circle className="mf-seat" aria-hidden="true" pointerEvents="none" r={r} fill="none" stroke={SEAT} strokeWidth={(isMarked ? 2 * k : structure) + SEAT_PAD_PX * k} strokeDasharray={dashOf(b.line, k, circumference)} strokeLinecap={b.line === "dotted" ? "round" : "butt"} />
          <circle
            data-mapping-body-shape r={r} fill={`rgba(${CYAN}, ${isMarked ? 0.32 : 0.14})`} stroke={`rgba(${INK}, ${isMarked ? 1 : 0.82})`}
            strokeWidth={isMarked ? 2 * k : structure} strokeDasharray={dashOf(b.line, k, circumference)} strokeLinecap={b.line === "dotted" ? "round" : "butt"}
          />
          {floor.floor && <circle data-testid={`mapping-floor-mark-${testKey(b)}`} r={1.8 * k} fill="none" stroke={`rgba(${INK}, 0.7)`} strokeWidth={structure} />}
          {collar !== null && (
            <g key={`collar|${stageKey}`} data-testid={`mapping-collar-${testKey(b)}`} data-stage-part="EVIDENCE" data-drawn={collar.drawn.length} data-hidden={collar.hidden}>
              {collar.drawn.map(arc => arcSign({ arc, cx: 0, cy: 0, r: collarR(b), k, testId: `mapping-tick-${testKey(b)}:${arc.poolRequirementId}`, change: arcChange(b, arc) }))}
            </g>
          )}
          {layoutShift && <rect data-testid={`mapping-layout-shift-${testKey(b)}`} x={-r - 5 * k} y={-r - 5 * k} width={2.6 * k} height={2.6 * k} fill="none" stroke={`rgba(${INK}, 0.8)`} strokeWidth={structure} />}
          {b.displaced && <path data-testid={`mapping-displaced-${testKey(b)}`} d={`M ${fixed(r + 3 * k)} ${fixed(-r - 3 * k)} l ${fixed(1.6 * k)} ${fixed(-1.6 * k)} l ${fixed(1.6 * k)} ${fixed(1.6 * k)} l ${fixed(-1.6 * k)} ${fixed(1.6 * k)} Z`} fill="none" stroke={`rgba(${INK}, 0.7)`} strokeWidth={structure} />}
          {level === "L1" && collar !== null && collar.hidden > 0 && inPoolNow && (
            <text data-testid={`mapping-collar-more-${testKey(b)}`} x={collarR(b) + 3 * k} y={collarR(b) + 3 * k + fontSize / 2} fontSize={fontSize} {...textSeat(k)} fill={`rgba(${INK}, 0.8)`} fontFamily={MONO}>{c.more(collar.hidden)}</text>
          )}
          {named && (
            <text data-testid={`mapping-name-${testKey(b)}`} x={0} y={-(collar !== null ? collarR(b) : r) - 4 * k} textAnchor="middle" fontSize={fontSize} {...textSeat(k)} fill={`rgba(${INK}, 0.88)`} fontFamily={SANS}>{b.title}</text>
          )}
        </g>
      </g>
    );
  });

  return (
    <section
      ref={sectionRef}
      data-testid="mapping-field" data-level={level} data-pool={pool ?? ""} data-role={openBody === null ? "" : testKey(openBody)} data-requirement={view.arc?.poolRequirementId ?? ""}
      data-selection={focus.selection?.kind ?? ""} data-capability={selected?.key ?? ""}
      data-run-state={run.state} data-field-motion={run.sign.fieldMotion} data-frozen={String(run.sign.frozen)} data-pending-breath={String(run.pendingBreath)}
      data-resume-pulse={String(run.sign.resumePulse)} data-evidence-class={evidence} data-authority-state={model.authority.authorityState} data-decision={String(model.authority.decision)}
      data-names-only={String(model.namesOnly)} data-bodies={model.bodies.length} data-overflow={model.overflowCount} data-beams={drawnBeams.length} data-layout-shifts={layoutShifts}
      data-evidence-changes={evidenceChanges} data-requirement-changes={requirementChanges} data-breath={breathLive ? "LIVE" : "STILL"} data-stage="SETTLED" data-size-floors={floored}
      onKeyDown={event => {
        if (event.key !== "Escape") return;
        if (level !== "L0") { event.stopPropagation(); act({ type: "UP" }); } else if (focus.selection !== null) { event.stopPropagation(); act({ type: "CLEAR_SELECTION" }); }
      }}
      style={{
        position: "absolute", inset: 0, zIndex: 45, backgroundColor: `rgba(3, 5, 8, ${STAGE_GROUND_ALPHA})`, fontFamily: MONO, color: INK, overflow: "hidden", containerType: "size",
        ["--mf-query-amp" as string]: `${fixed(MOTION.query.amplitudePx * k)}px`
      }}
    >
      <style>{MAPPING_FIELD_CSS}</style>

      {/* The reading's frame (left column): what the field is, its provenance, the level's header, the lines that state the field. */}
      <div data-sx-panel="mapping-reading" style={{ ...panel, position: "absolute", left: "28px", top: "150px", width: "min(320px, 24vw)", maxHeight: clamp !== null ? `${Math.max(0, clamp - 8)}px` : "calc(100cqh - 178px)", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
          <span style={kicker}>{c.title}</span>
          <span data-testid="mapping-field-evidence" data-evidence-class={evidence} style={badge}>{c.evidence[evidence]}</span>
        </div>
        <span data-testid="mapping-field-authority" data-authority-state={model.authority.authorityState} data-decision={String(model.authority.decision)} style={meta}>{c.authority}</span>
        {model.namesOnly && <span data-testid="mapping-provenance" style={{ ...statement, fontSize: "12px", color: "rgba(214, 236, 248, 0.94)" }}>{c.namesOnly}</span>}
        {evidenceChanges > 0 && <span data-testid="mapping-delta-evidence" data-count={evidenceChanges} style={{ ...meta, color: "rgba(214, 240, 252, 0.95)" }}>{c.evidenceChanged(evidenceChanges)}</span>}
        {requirementChanges > 0 && <span data-testid="mapping-delta-requirements" data-count={requirementChanges} style={{ ...meta, color: "rgba(214, 240, 252, 0.95)" }}>{c.requirementsChanged(requirementChanges)}</span>}
        {layoutShifts > 0 && <span data-testid="mapping-layout-shifts" data-count={layoutShifts} style={meta}>{c.layoutShifts(layoutShifts)}</span>}
        {phaseLockOnView && <span data-testid="mapping-phase-lock-still" style={meta}>{c.phaseLockStill}</span>}

        {level === "L1" && openSector !== null && (
          <div data-testid="mapping-l1" data-pool={openSector.poolId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <span data-testid="mapping-l1-title" style={{ ...statement, fontWeight: 600 }}>{c.levelL1(openSector.poolName, openSector.roles)}</span>
            <button type="button" data-testid="mapping-up" onClick={() => act({ type: "UP" })} style={chip}>{c.up}</button>
          </div>
        )}
        {openBody !== null && (
          <div data-testid="mapping-l2" data-role={testKey(openBody)} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
              <span data-testid="mapping-l2-title" style={{ ...statement, fontWeight: 600 }}>{openBody.title}</span>
              <button type="button" data-testid="mapping-up" onClick={() => act({ type: "UP" })} style={chip}>{level === "L3" ? c.upToRole : c.upToPool}</button>
            </div>
            <span data-testid="mapping-l2-meta" style={meta}>{c.roleMeta(openBody.rank, openBody.organizationName, openBody.poolName, openBody.arcs.length)}</span>
          </div>
        )}

        {run.sign.frozen && <span data-testid="mapping-still" role="status" aria-live="polite" style={statement}>{run.resumePending ? c.stillResume : c.still}</span>}
        {!run.sign.frozen && run.sign.resumePulse && <span data-testid="mapping-resume-pending" style={meta}>{c.resumePending}</span>}
        {run.pendingBreath && <span data-testid="mapping-pending" style={meta}>{c.pending}</span>}
        {openBody === null && overflowShown > 0 && <span data-testid="mapping-overflow" data-count={overflowShown} style={meta}>{c.notDrawn(overflowShown)}</span>}
        {model.constellation.overflowCount > 0 && <span data-testid="mapping-person-overflow" data-count={model.constellation.overflowCount} style={meta}>{c.personMore(model.constellation.overflowCount)}</span>}
        {collarHidden > 0 && <span data-testid="mapping-collar-hidden" data-count={collarHidden} style={meta}>{c.collarHidden(collarHidden)}</span>}
        {floored > 0 && <span data-testid="mapping-size-floor" data-count={floored} style={meta}>{c.sizeFloor(floored)}</span>}
        {displacedDrawn && <span data-testid="mapping-displaced-line" style={meta}>{c.displaced}</span>}
        {missing.CONSTELLATION_OVERFLOW > 0 && <span data-testid="mapping-beams-undrawn" data-count={missing.CONSTELLATION_OVERFLOW} style={meta}>{c.beamsUndrawn(missing.CONSTELLATION_OVERFLOW)}</span>}
        {primaryUndrawn > 0 && <span data-testid="mapping-primary-undrawn" data-count={primaryUndrawn} style={meta}>{c.primaryUndrawn(primaryUndrawn)}</span>}
        {selected !== null && (
          <div data-testid="mapping-reverse" data-capability={selected.key} data-roles={selected.reverse.roles.length} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            <span style={statement}>{c.reverse(selected.name, selected.reverse.roles.length)}</span>
            <button type="button" data-testid="mapping-reverse-clear" onClick={() => act({ type: "CLEAR_SELECTION" })} style={chip}>{c.clear}</button>
          </div>
        )}
        <div data-testid="mapping-marked" aria-live="polite" style={{ ...meta, minHeight: "1.5em", color: "rgba(214, 240, 252, 0.95)" }}>
          {marked !== null ? c.marked(marked.rank, marked.title, marked.organizationName, marked.poolName) : markedReq !== null ? c.markedRequirement(markedReq.requirementText, c.state[markedReq.state]) : ""}
        </div>

        {level === "L0" && (
          <nav data-testid="mapping-pools" aria-label={c.pools} style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {model.sectors.map(s => (
              <button key={s.poolId} type="button" data-testid={`mapping-pool-${s.poolId}`} data-pool={s.poolId} aria-label={c.openPool(s.poolName)} onClick={() => act({ type: "OPEN_POOL", jobPoolUploadId: s.poolId })} style={chip}>
                {c.pool(s.poolName, s.roles)}
              </button>
            ))}
          </nav>
        )}

        <ul data-testid="mapping-legend" style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "2px" }}>
          {(["SEMANTIC", "LEXICAL", "NONE"] as const).map(cls => {
            const line = CLASS_LINE[cls];
            return (
              <li key={cls} data-testid={`mapping-legend-${cls}`} style={{ ...meta, display: "flex", alignItems: "center", gap: "6px" }}>
                <svg aria-hidden="true" width="14" height="14" viewBox="-7 -7 14 14"><circle r="5" fill="none" stroke={`rgba(${INK}, 0.85)`} strokeWidth="1.2" strokeDasharray={dashOf(line, 1, 2 * Math.PI * 5)} strokeLinecap={line === "dotted" ? "round" : "butt"} /></svg>
                {c.legend[cls]}
              </li>
            );
          })}
          <li data-testid="mapping-legend-arcs" style={meta}>{c.legendArcs}</li>
          <li data-testid="mapping-horizon" style={meta}>{c.horizon}</li>
          <li data-testid="mapping-breath-legend" style={meta}>{c.breath}</li>
        </ul>
        <span data-testid="mapping-position" style={meta}>{c.position}</span>
      </div>

      <svg
        ref={svgRef}
        data-testid="mapping-field-svg" role="img" aria-label={c.label(model.sectors.length, model.bodies.length, model.overflowCount)}
        data-stage-clamp={clamp ?? ""} data-stage-top={stageTop} data-drawn-px={drawnPx}
        viewBox={boxKey} preserveAspectRatio="xMidYMid meet"
        style={{
          position: "absolute", left: "50%", top: `${stageTop}px`, transform: "translateX(-50%)",
          width: `min(${clamp !== null ? `${clamp}px, ` : ""}calc(100cqh - ${stageTop + STAGE_GUTTER_PX}px), calc(100cqw - 760px), 1100px)`,
          minWidth: "420px", height: "auto", aspectRatio: "1 / 1", display: "block", transition: "none"
        }}
      >
        {/* PHASE F · the medium (F-1 … F-6): the disc's own light, under everything. Nothing in it is a sign; nothing in it is interactive. */}
        <defs aria-hidden="true">
          <radialGradient id="mf-ground" gradientUnits="userSpaceOnUse" cx={0} cy={0} r={g.shelfNear}>
            {groundStops().map(st => <stop key={st.offset} offset={st.offset} stopColor={`rgb(${CYAN})`} stopOpacity={st.opacity} />)}
          </radialGradient>
          {Array.from({ length: WAVE.layers }, (_, i) => (
            <radialGradient key={i} id={`mf-wave-${i}`} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={g.shelfNear}>
              {waveBand(i).map(st => <stop key={st.offset} offset={st.offset} stopColor={`rgb(${CYAN})`} stopOpacity={st.opacity} />)}
            </radialGradient>
          ))}
          <radialGradient id="mf-person-seat" gradientUnits="userSpaceOnUse" cx={0} cy={0} r={g.personRadius}>
            {restingStops(g.personRadius / g.shelfNear).map(st => <stop key={st.offset} offset={st.offset} stopColor={st.color} stopOpacity={1} />)}
          </radialGradient>
          <radialGradient id="mf-core">
            <stop offset={0} stopColor={`rgb(${INK})`} stopOpacity={VOLUME.coreAlpha} />
            <stop offset={0.4} stopColor={`rgb(${INK})`} stopOpacity={fixed(VOLUME.coreAlpha * 0.78)} />
            <stop offset={0.75} stopColor={`rgb(${INK})`} stopOpacity={fixed(VOLUME.coreAlpha * 0.55)} />
            <stop offset={1} stopColor={`rgb(${INK})`} stopOpacity={fixed(VOLUME.coreAlpha * 0.42)} />
          </radialGradient>
          <radialGradient id="mf-halo">
            <stop offset={0} stopColor={`rgb(${CYAN})`} stopOpacity={VOLUME.haloAlpha} />
            <stop offset={0.3} stopColor={`rgb(${CYAN})`} stopOpacity={fixed(VOLUME.haloAlpha * 0.7)} />
            <stop offset={0.6} stopColor={`rgb(${CYAN})`} stopOpacity={fixed(VOLUME.haloAlpha * 0.3)} />
            <stop offset={0.85} stopColor={`rgb(${CYAN})`} stopOpacity={fixed(VOLUME.haloAlpha * 0.08)} />
            <stop offset={1} stopColor={`rgb(${CYAN})`} stopOpacity={0} />
          </radialGradient>
        </defs>
        <g data-testid="mapping-medium" aria-hidden="true" pointerEvents="none">
          {DISC_GROUND_OPAQUE && <circle r={g.fieldRadius} fill={DISC_BASE} />}
          <circle r={g.shelfNear} fill="url(#mf-ground)" />
          {Array.from({ length: WAVE.layers }, (_, i) => (
            <circle key={i} className="mf-wave mf-wave-ground" r={g.shelfNear} fill={`url(#mf-wave-${i})`} style={{ animationDelay: waveDelay((i / (WAVE.layers - 1)) * g.shelfNear, g.shelfNear) }} />
          ))}
          {model.sectors.map((sec, i) => i % 2 === 1 && <path key={sec.poolId} d={wedge(g.personRadius, g.shelfNear, sec.startDegrees, sec.spanDegrees)} fill={`rgba(0, 0, 0, ${WEDGE_SHADE})`} />)}
          {fieldHalos}
        </g>

        {/* E-7 shelf band, on its black seat: a still ring (A-F8) under the sectors, so the sectors stay its hit targets. */}
        <circle aria-hidden="true" pointerEvents="none" r={(g.shelfNear + g.fieldRadius) / 2} fill="none" stroke={SEAT} strokeWidth={g.fieldRadius - g.shelfNear} />
        <circle data-testid="mapping-ring-shelf" pointerEvents="none" data-ring-luminance={RING_LUMINANCE.shelf} r={(g.shelfNear + g.fieldRadius) / 2} fill="none" stroke={`rgba(${INK}, ${RING_LUMINANCE.shelf})`} strokeWidth={g.fieldRadius - g.shelfNear} />
        <g aria-hidden="true" pointerEvents="none">{shelfHalos}</g>
        {openBody === null && model.sectors.map((s: FieldSector) => {
          const pathR = g.fieldRadius + LABEL_GAP;
          return (
            <g key={s.poolId}>
              <path aria-hidden="true" pointerEvents="none" d={wedge(g.personRadius, g.fieldRadius, s.startDegrees, s.spanDegrees)} fill="none" stroke={SEAT} strokeWidth={structure + SEAT_PAD_PX * k} />
              <path
                data-testid={`mapping-sector-${s.poolId}`} data-mapping-sector data-pool={s.poolId} data-open={String(openSector?.poolId === s.poolId)}
                d={wedge(g.personRadius, g.fieldRadius, s.startDegrees, s.spanDegrees)}
                fill={openSector?.poolId === s.poolId ? `rgba(${CYAN}, 0.05)` : "rgba(0, 0, 0, 0)"} stroke={`rgba(${INK}, 0.1)`} strokeWidth={structure}
                onClick={() => act({ type: "OPEN_POOL", jobPoolUploadId: s.poolId })}
              >
                <title>{c.openPool(s.poolName)}</title>
              </path>
              <path id={`mapping-sector-path-${s.poolId}`} d={labelPath(pathR, s.startDegrees, s.spanDegrees, fontSize)} fill="none" stroke="none" />
              <text data-testid={`mapping-sector-name-${s.poolId}`} fontSize={fontSize} {...textSeat(k)} fill={`rgba(${INK}, 0.78)`} fontFamily={MONO}>
                <textPath href={`#mapping-sector-path-${s.poolId}`} startOffset="50%" textAnchor="middle">{sectorLabel(s.poolName, s.spanDegrees, pathR, fontSize)}</textPath>
                <title>{s.poolName}</title>
              </text>
            </g>
          );
        })}

        {/* The rings (E-7: one ink, told apart by luminance), each on its black seat (A-F6/A-F8: structure is still), drawn over the
            sectors so no sector edge lies on a ring (PF-15): the shelf band, the
            best-fit ring, the horizon, the field's edge. The edge carries E-6's state (data-breath); the breath itself is the medium's. */}
        <circle aria-hidden="true" pointerEvents="none" r={g.bestFit} fill="none" stroke={SEAT} strokeWidth={fixed((RING_WIDTH_PX.best + SEAT_PAD_PX) * k)} />
        <circle data-testid="mapping-ring-best" pointerEvents="none" data-ring-luminance={RING_LUMINANCE.best} r={g.bestFit} fill="none" stroke={`rgba(${INK}, ${RING_LUMINANCE.best})`} strokeWidth={fixed(RING_WIDTH_PX.best * k)} />
        <circle aria-hidden="true" pointerEvents="none" r={g.horizon} fill="none" stroke={SEAT} strokeWidth={fixed((RING_WIDTH_PX.horizon + SEAT_PAD_PX) * k)} />
        <circle data-testid="mapping-ring-horizon" pointerEvents="none" data-ring-luminance={RING_LUMINANCE.horizon} r={g.horizon} fill="none" stroke={`rgba(${INK}, ${RING_LUMINANCE.horizon})`} strokeWidth={fixed(RING_WIDTH_PX.horizon * k)} />
        <circle aria-hidden="true" pointerEvents="none" r={g.fieldRadius} fill="none" stroke={SEAT} strokeWidth={fixed((RING_WIDTH_PX.field + SEAT_PAD_PX) * k)} />
        <circle data-testid="mapping-ring-field" pointerEvents="none" data-ring-luminance={RING_LUMINANCE.field} data-breath={breathLive ? "LIVE" : "STILL"} r={g.fieldRadius} fill="none" stroke={`rgba(${INK}, ${RING_LUMINANCE.field})`} strokeWidth={fixed(RING_WIDTH_PX.field * k)} />
        <circle data-testid="mapping-pending-outline" r={g.fieldRadius + 6 * k} fill="none" stroke={`rgba(${CYAN}, 0.5)`} strokeWidth={structure} strokeDasharray={`${4 * k} ${4 * k}`} />
        {/* A-5: a due continuation keeps its sign as a still outline — dotted, outside the pending one, never a pulse. */}
        {run.sign.resumePulse && <circle data-testid="mapping-resume-outline" r={g.fieldRadius + 10 * k} fill="none" stroke={`rgba(${INK}, 0.6)`} strokeWidth={structure} strokeDasharray={`${0.01 * k} ${3.4 * k}`} strokeLinecap="round" />}

        {/* The person: its capability proposals in the centre (constellation), each named at every level (E-7). Selecting one shows
            every role it couples (reverse view) and sets them into the query motion (E-3). */}
        <g data-testid="mapping-person" data-capabilities={model.view.constellation.length} data-overflow={model.constellation.overflowCount}>
          <circle aria-hidden="true" pointerEvents="none" r={g.personRadius} fill="url(#mf-person-seat)" />
          <circle aria-hidden="true" pointerEvents="none" r={g.personRadius} fill="none" stroke={SEAT} strokeWidth={structure + SEAT_PAD_PX * k} />
          <circle r={g.personRadius} fill={`rgba(${CYAN}, 0.04)`} stroke={`rgba(${INK}, 0.28)`} strokeWidth={structure}><title>{c.person}</title></circle>
          {model.constellation.nodes.map(n => {
            const isSelected = selected?.key === n.key;
            const radial = Math.hypot(n.x, n.y) > 0.5 ? Math.atan2(n.y, n.x) : -Math.PI / 2;
            const lx = n.x + Math.cos(radial) * (g.nodeRadius + 3 * k), ly = n.y + Math.sin(radial) * (g.nodeRadius + 3 * k);
            const anchor = Math.cos(radial) > 0.35 ? "start" : Math.cos(radial) < -0.35 ? "end" : "middle";
            return (
              <g
                key={n.key} data-testid={`mapping-capability-${n.key}`} data-mapping-node data-selected={String(isSelected)} data-phase-locked={String(lockedNodes.has(n.key))}
                role="button" tabIndex={0} aria-pressed={isSelected} aria-label={c.capabilityLabel(n.name)}
                onClick={event => { event.stopPropagation(); toggleCapability(n.key); }}
                onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleCapability(n.key); } }}
                style={{ cursor: "pointer" }}
              >
                <circle cx={n.x} cy={n.y} r={g.nodeRadius + 3} fill="rgba(0, 0, 0, 0)" />
                <circle aria-hidden="true" pointerEvents="none" cx={n.x} cy={n.y} r={fixed(g.nodeRadius + (isSelected ? structure / 2 : 0) + SEAT_PAD_PX * k / 2)} fill={SEAT} />
                <circle cx={n.x} cy={n.y} r={g.nodeRadius} fill={`rgba(${INK}, ${isSelected ? 0.95 : 0.55})`} stroke={isSelected ? `rgba(${INK}, 1)` : "none"} strokeWidth={isSelected ? structure : 0} />
                <text data-testid={`mapping-capability-name-${n.key}`} x={fixed(lx)} y={fixed(ly)} textAnchor={anchor} dominantBaseline={Math.sin(radial) > 0.35 ? "hanging" : Math.sin(radial) < -0.35 ? "auto" : "middle"}
                  fontSize={fontSize} fill={`rgba(${INK}, ${isSelected ? 1 : 0.85})`} fontFamily={SANS} {...textSeat(k)}>{n.name}</text>
                <title>{n.name}</title>
              </g>
            );
          })}
        </g>

        {/* Beams (§2.1): from a drawn capability node to its requirement's arc, in the coupling state's beam (widths at one common gain,
            A-7); at L0 each body's primary beam faint (E-2). Evidence of the level: it enters after the geometry (E-5). */}
        <g key={`beams|${stageKey}`} data-testid="mapping-beams" data-stage-part="EVIDENCE">
          {drawnBeams.map(({ beam: b, rank }) => {
            const stroke = beamStroke(b.beam, k);
            const [tx, ty] = target(b);
            const width = Math.ceil(stroke.width * BEAM_WIDTH_GAIN * FLOOR_HEADROOM * 1000) / 1000;
            const id = `mf-beam-${b.id.replace(/[^A-Za-z0-9_-]/g, "_")}`;
            const [fx, fy] = [b.from!.x, b.from!.y];
            return (
              <React.Fragment key={b.id}>
              {/* F-5: the beam's light runs toward its requirement (a mask: the stroke and its alpha stay the sign's) on a black seat. */}
              <defs aria-hidden="true">
                <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1={fx} y1={fy} x2={tx} y2={ty}>
                  <stop offset={0} stopColor="#fff" stopOpacity={BEAM_GRADIENT.from} />
                  <stop offset={1} stopColor="#fff" stopOpacity={BEAM_GRADIENT.to} />
                </linearGradient>
                <linearGradient id={`${id}-s`} gradientUnits="userSpaceOnUse" x1={fx} y1={fy} x2={tx} y2={ty}>
                  {Array.from({ length: 11 }, (_, i) => {
                    const x = fx + ((tx - fx) * i) / 10, y = fy + ((ty - fy) * i) / 10, rr = Math.hypot(x, y);
                    const deg = ((((Math.atan2(y, x) * 180) / Math.PI) % 360) + 360) % 360;
                    const sector = rr > g.personRadius ? model.sectors.findIndex(sec => ((((deg - sec.startDegrees) % 360) + 360) % 360) <= sec.spanDegrees) : -1;
                    return <stop key={i} offset={i / 10} stopColor={restingColor(rr / g.shelfNear, sector >= 0 && sector % 2 === 1 ? 1 - WEDGE_SHADE : 1)} />;
                  })}
                </linearGradient>
                <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={-2 * g.fieldRadius} y={-2 * g.fieldRadius} width={4 * g.fieldRadius} height={4 * g.fieldRadius}>
                  <line x1={fx} y1={fy} x2={tx} y2={ty} stroke={`url(#${id}-g)`} strokeWidth={fixed(width + 4 * k)} />
                </mask>
              </defs>
              <line aria-hidden="true" pointerEvents="none" x1={fx} y1={fy} x2={tx} y2={ty} stroke={`url(#${id}-s)`} strokeWidth={fixed(Math.max(width, STROKE_MIN_PX * k * FLOOR_HEADROOM) + SEAT_PAD_PX * k)} strokeDasharray={stroke.dash}
                strokeLinecap={b.beam === "dotted" || b.beam === "faint-dotted" ? "round" : "butt"} />
              <line mask={`url(#${id}-m)`} data-testid={`mapping-beam-${testKey(b.body)}:${b.arc.poolRequirementId}`} data-beam={b.beam} data-beam-rank={rank} data-phase-locked={String(b.phaseLocked)} data-state={b.arc.state}
                data-capability={b.arc.coupling?.capabilityKey ?? ""} x1={b.from!.x} y1={b.from!.y} x2={tx} y2={ty}
                stroke={`rgba(${INK}, ${rank === "PRIMARY" ? PRIMARY_BEAM_LUMINANCE : stroke.opacity})`} strokeWidth={width} strokeDasharray={stroke.dash}
                strokeLinecap={b.beam === "dotted" || b.beam === "faint-dotted" ? "round" : "butt"} />
              </React.Fragment>
            );
          })}
        </g>

        {bodyElements}

        {/* L2/L3: the open role's ring — the very arcs of its collar, at the ring's radius. */}
        {openBody !== null && (
          <g key={`ring|${stageKey}`} data-testid="mapping-ring" data-role={testKey(openBody)} data-arcs={openBody.arcs.length} data-radius={ringR} data-stage-part="EVIDENCE">
            <circle aria-hidden="true" pointerEvents="none" cx={openBody.x} cy={openBody.y} r={ringR} fill="none" stroke={SEAT} strokeWidth={structure + SEAT_PAD_PX * k} />
            <circle cx={openBody.x} cy={openBody.y} r={ringR} fill="none" stroke={`rgba(${INK}, 0.14)`} strokeWidth={structure} />
            {openBody.arcs.map(arc => {
              const isOpen = view.arc?.poolRequirementId === arc.poolRequirementId;
              const isMarkedArc = markedReq?.poolRequirementId === arc.poolRequirementId;
              return arcSign({
                arc, cx: openBody.x, cy: openBody.y, r: ringR, k, testId: `mapping-arc-${arc.poolRequirementId}`,
                emphasis: selected !== null && arc.coupling?.capabilityKey === selected.key, change: arcChange(openBody, arc),
                interactive: {
                  open: isOpen, marked: isMarkedArc, label: c.arcLabel(arc.requirementText, c.state[arc.state], arc.coupling?.capabilityName ?? null),
                  onOpen: () => act({ type: "OPEN_REQUIREMENT", poolRequirementId: arc.poolRequirementId }),
                  onMark: () => act({ type: "MARK_REQUIREMENT", role: openBody.id, poolRequirementId: arc.poolRequirementId }),
                  onClear: () => { if (focus.selection?.kind === "REQUIREMENT") act({ type: "CLEAR_SELECTION" }); }
                }
              });
            })}
            {openBody.arcs.map(arc => {
              if (arc.coupling === null || (arc.coupling.keyStatus !== "NOT_IN_PERSON" && !(level === "L3" && arc.coupling.keyStatus === "ABSENT" && view.arc?.poolRequirementId === arc.poolRequirementId))) return null;
              const [lx, ly] = at(openBody.x, openBody.y, ringR + 9 * k, arc.midDegrees);
              return (
                <text key={`label-${arc.poolRequirementId}`} data-testid={`mapping-arc-key-${arc.poolRequirementId}`} data-key-status={arc.coupling.keyStatus} x={lx} y={ly}
                  textAnchor={lx < openBody.x ? "end" : "start"} dominantBaseline="middle" fontSize={fontSize} fill={`rgba(${INK}, 0.8)`} fontFamily={SANS} {...textSeat(k)}>
                  {arc.coupling.keyStatus === "NOT_IN_PERSON" ? c.notInPerson(arc.coupling.capabilityName) : c.keyAbsent}
                </text>
              );
            })}
          </g>
        )}
      </svg>

      {/* L3: the open arc's evidence, verbatim (right column) — evidence, so it enters after the geometry (E-5). */}
      {level === "L3" && view.arc !== null && openBody !== null && (
        <aside key={`l3|${stageKey}`} data-testid="mapping-l3" data-requirement={view.arc.poolRequirementId} data-state={view.arc.state} data-key-status={view.arc.coupling?.keyStatus ?? "NONE"} data-stage-part="EVIDENCE"
          style={{ ...panel, position: "absolute", right: "28px", top: "232px", width: "min(340px, 25vw)", maxHeight: clamp !== null ? `${Math.max(0, clamp - 90)}px` : "calc(100cqh - 260px)", overflowY: "auto" }}>
          <span style={kicker}>{c.requirement}</span>
          <span data-testid="mapping-l3-text" style={{ ...statement, fontWeight: 600 }}>{view.arc.requirementText}</span>
          <span data-testid="mapping-l3-meta" style={meta}>{c.requirementMeta(c.necessity[view.arc.necessity], view.arc.weight)}</span>
          <span data-testid="mapping-l3-state" data-state={view.arc.state} style={statement}>{c.state[view.arc.state]} · {c.source[view.arc.source]}</span>
          {view.arc.coupling !== null && (
            <span data-testid="mapping-l3-capability" data-key-status={view.arc.coupling.keyStatus} style={meta}>
              {view.arc.coupling.keyStatus === "ABSENT" ? c.keyAbsent : view.arc.coupling.keyStatus === "NOT_IN_PERSON" ? c.notInPerson(view.arc.coupling.capabilityName) : c.capability(view.arc.coupling.capabilityName)}
            </span>
          )}
          {view.arc.coupling?.explanation && <span data-testid="mapping-l3-explanation" style={statement}>{view.arc.coupling.explanation}</span>}
          {view.arc.coupling?.evidenceLimitation && <span data-testid="mapping-l3-limitation" style={meta}>{c.limitation}: {view.arc.coupling.evidenceLimitation}</span>}
          {(view.arc.coupling?.quotes ?? []).map((q, i) => (
            <blockquote key={i} data-testid="mapping-l3-quote" data-source-document={q.sourceDocumentId} style={{ margin: 0, padding: "6px 10px", borderLeft: `2px solid rgba(${CYAN}, 0.45)`, ...statement, fontStyle: "italic" }}>
              {q.exactQuote}
              <span style={{ ...meta, display: "block", fontStyle: "normal" }}>{c.quoteSource(q.sourceDocumentId)}</span>
            </blockquote>
          ))}
          {(view.arc.coupling === null || view.arc.coupling.quotes.length === 0) && <span data-testid="mapping-l3-no-quote" style={meta}>{c.noQuote}</span>}
        </aside>
      )}
    </section>
  );
}
