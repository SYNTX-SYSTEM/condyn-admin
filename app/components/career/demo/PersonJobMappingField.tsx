"use client";

import React, { useMemo, useState } from "react";
import { SIL_TOKENS } from "./SILTokens";
import type { SilLocale } from "../../../../lib/career/view-model/sil-language";
import type { CapabilityProposalProjection } from "../../../../lib/career/capability-core/projection";
import type { AutoMatchWatch, JobRankingState } from "../../../../lib/career/ui/auto-match";
import { FOCUS_INITIAL, type FocusState } from "../../../../lib/career/mapping/focus";
import type { CouplingClass } from "../../../../lib/career/mapping/signs";
import {
  CLASS_LINE, bodyMovements, collarSplit, fieldFocusReduce, fieldLevel, fieldViewBox, levelBeams, mappingFieldModel, markedArc, markedBody, ringRadius, roleViewBox,
  sectorViewBox, selectedCapability,
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
 * Signs (sign table, through the model): every arc carries its state's arcLine, arcFill, mark and luminance; a beam its state's beam
 * and phase lock; colour carries no state at any level. Time (A3): only a body whose own evidence changed moves (≤ 0.8 s, with a
 * trail); one that took a new place because the picture rearranged takes it with no transition and is stated (data-layout-shift).
 * Under prefers-reduced-motion nothing breathes, pulses or travels; pending is a static dashed outline.
 */
const MONO = SIL_TOKENS.typography.mono;
const SANS = SIL_TOKENS.typography.sans;
const CYAN = "92, 200, 255";
const INK = "205, 240, 255";
const kicker: React.CSSProperties = { fontFamily: MONO, fontSize: "11px", fontWeight: 700, letterSpacing: "1.8px", textTransform: "uppercase", color: "rgba(160, 232, 250, 0.92)" };
const meta: React.CSSProperties = { fontFamily: MONO, fontSize: "10.5px", lineHeight: 1.5, letterSpacing: "0.3px", color: "rgba(176, 200, 216, 0.88)", wordBreak: "break-word" };
const statement: React.CSSProperties = { fontFamily: SANS, fontSize: "12.5px", lineHeight: 1.45, color: "#e6f1f8" };
const badge: React.CSSProperties = { fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "1.1px", padding: "1px 8px", borderRadius: "999px", border: `1px solid rgba(${CYAN}, 0.32)`, color: "rgba(176, 226, 244, 0.95)", whiteSpace: "nowrap" };
const chip: React.CSSProperties = { padding: "2px 9px", borderRadius: "999px", border: `1px solid rgba(${CYAN}, 0.36)`, background: `rgba(${CYAN}, 0.06)`, color: "#cdf6ff", fontFamily: MONO, fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.8px", cursor: "pointer", whiteSpace: "nowrap" };
const panel: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "7px", padding: "12px 14px", borderRadius: "12px", border: `1px solid rgba(${CYAN}, 0.18)`, background: "rgba(3, 9, 17, 0.82)", boxSizing: "border-box" };

/** The drawn width of the field on the stage (px, approximately), to keep strokes about one pixel at every level. */
const DRAWN_PX = 960;
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

export const MAPPING_FIELD_CSS = `
@keyframes mappingFieldBreath { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
@keyframes mappingFieldTrail { from { opacity: 0.55; } to { opacity: 0; } }
@keyframes mappingFieldPulse { 0% { opacity: 0; } 6% { opacity: 0.55; } 26% { opacity: 0; } 100% { opacity: 0; } }
@keyframes mappingFieldPhase { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }
[data-testid="mapping-field"] [data-mapping-sector] { cursor: pointer; }
[data-testid="mapping-field"] [data-mapping-body]:focus, [data-testid="mapping-field"] [data-mapping-arc]:focus, [data-testid="mapping-field"] [data-mapping-node]:focus { outline: none; }
[data-testid="mapping-field"] [data-mapping-body]:focus-visible > circle[data-mapping-body-shape] { stroke-width: 2.4px; }
[data-testid="mapping-field"] [data-mapping-arc]:focus-visible, [data-testid="mapping-field"] [data-mapping-node]:focus-visible { filter: drop-shadow(0 0 3px rgba(${CYAN}, 0.95)); }
[data-testid="mapping-field"] button:focus-visible { outline: 1px solid rgba(${CYAN}, 0.85); outline-offset: 2px; }
[data-testid="mapping-field"] [data-phase-locked="true"] { animation: mappingFieldPhase 3.2s ease-in-out infinite; }
[data-testid="mapping-field"][data-frozen="true"] *, [data-testid="mapping-field"][data-frozen="true"] { animation: none !important; transition: none !important; }
[data-testid="mapping-pending-outline"] { display: none; }
@media (prefers-reduced-motion: reduce) {
  [data-testid="mapping-field"], [data-testid="mapping-field"] * { animation: none !important; transition: none !important; }
  [data-testid="mapping-field"] [data-mapping-trail] { opacity: 0.35 !important; }
  [data-testid="mapping-field"][data-pending-breath="true"] [data-testid="mapping-pending-outline"] { display: inline; }
}`;

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

/**
 * One requirement arc, drawn from its sign only: the line (solid · dotted · broken · open = its two ends and nothing between), the
 * filled fraction as an inner band, the mark, the luminance. The same function draws a collar tick at L0/L1 and a ring arc at L2/L3.
 */
function arcSign({ arc, cx, cy, r, k, testId, emphasis = 1, interactive }: {
  arc: FieldArc; cx: number; cy: number; r: number; k: number; testId: string; emphasis?: number;
  interactive?: { onOpen(): void; onMark(): void; onClear(): void; label: string; open: boolean; marked: boolean };
}): React.ReactElement {
  const s = arc.sign;
  if (!(MARKS as readonly string[]).includes(s.mark)) throw new Error(`ERR_MAPPING_FIELD_UNKNOWN_MARK:${s.mark}`);
  const width = (interactive?.open || interactive?.marked ? 2 : 1.3) * k;
  const tick = Math.max(2.4 * k, r * 0.18);
  const ends = s.arcLine === "open";
  const fillEnd = arc.startDegrees + arc.spanDegrees * s.arcFill;
  return (
    <g
      key={arc.poolRequirementId} data-testid={testId} data-mapping-arc data-requirement={arc.poolRequirementId} data-state={arc.state} data-class={arc.class} data-line={s.arcLine} data-fill={s.arcFill}
      data-beam={s.beam} data-phase-locked={String(s.phaseLocked)} data-mark={s.mark} data-luminance={s.luminance} data-open={String(interactive?.open === true)} data-marked={String(interactive?.marked === true)}
      opacity={fixed(s.luminance * emphasis)}
      tabIndex={interactive ? 0 : undefined} role={interactive ? "button" : undefined} aria-label={interactive?.label}
      onClick={interactive ? event => { event.stopPropagation(); interactive.onOpen(); } : undefined}
      onKeyDown={interactive ? event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); interactive.onOpen(); } } : undefined}
      onMouseEnter={interactive?.onMark} onFocus={interactive?.onMark} onMouseLeave={interactive?.onClear} onBlur={interactive?.onClear}
      style={interactive ? { cursor: "pointer" } : undefined}
    >
      {interactive && <path d={arcPath(cx, cy, r, arc.startDegrees, arc.endDegrees)} fill="none" stroke="rgba(0, 0, 0, 0)" strokeWidth={10 * k} data-mapping-hit />}
      {!ends && (
        <path data-arc-line d={arcPath(cx, cy, r, arc.startDegrees, arc.endDegrees)} fill="none" stroke={`rgba(${INK}, 0.9)`} strokeWidth={width}
          strokeDasharray={dashOf(s.arcLine, k, 0)} strokeLinecap={s.arcLine === "dotted" ? "round" : "butt"} />
      )}
      {ends && [arc.startDegrees, arc.endDegrees].map((d, i) => {
        const [ax, ay] = at(cx, cy, r - tick / 2, d), [bx, by] = at(cx, cy, r + tick / 2, d);
        return <line key={i} data-arc-end x1={ax} y1={ay} x2={bx} y2={by} stroke={`rgba(${INK}, 0.9)`} strokeWidth={width} />;
      })}
      {s.arcFill > 0 && <path data-arc-fill d={arcPath(cx, cy, r - 2.2 * k, arc.startDegrees, fillEnd)} fill="none" stroke={`rgba(${INK}, 0.7)`} strokeWidth={2.2 * k} />}
      {s.mark === "double" && <path data-arc-mark="double" d={arcPath(cx, cy, r + 2.4 * k, arc.startDegrees, arc.endDegrees)} fill="none" stroke={`rgba(${INK}, 0.9)`} strokeWidth={0.9 * k} />}
      {s.mark === "counterTick" && (() => { const [ax, ay] = at(cx, cy, r - tick, arc.midDegrees), [bx, by] = at(cx, cy, r + tick, arc.midDegrees); return <line data-arc-mark="counterTick" x1={ax} y1={ay} x2={bx} y2={by} stroke={`rgba(${INK}, 0.95)`} strokeWidth={1.4 * k} />; })()}
      {s.mark === "alias" && (() => { const [mx, my] = at(cx, cy, r + 3.6 * k, arc.midDegrees); return <circle data-arc-mark="alias" cx={mx} cy={my} r={1.6 * k} fill="none" stroke={`rgba(${INK}, 0.9)`} strokeWidth={0.9 * k} />; })()}
      {s.mark === "constituent" && (() => { const [ax, ay] = at(cx, cy, r + 0.6 * k, arc.midDegrees), [bx, by] = at(cx, cy, r + 3.6 * k, arc.midDegrees); return <line data-arc-mark="constituent" x1={ax} y1={ay} x2={bx} y2={by} stroke={`rgba(${INK}, 0.9)`} strokeWidth={0.9 * k} />; })()}
    </g>
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

export function PersonJobMappingField({ locale, projection, ranking, watch }: PersonJobMappingFieldProps) {
  const c = MAPPING_FIELD_COPY[locale];
  const model = useMemo(() => mappingFieldModel({ projection, ranking, watch }), [projection, ranking, watch]);
  const [focus, setFocus] = useState<FocusState>(FOCUS_INITIAL);
  const act = (action: FieldAction) => setFocus(previous => fieldFocusReduce(previous, action));
  // The time sign: the reading on view and the one before it, advanced once per new ranking (state adjusted while rendering, the
  // React pattern for "previous props"); movements are computed once per reading, not per render.
  const [readings, setReadings] = useState<{ now: FieldSnapshot | null; before: FieldSnapshot | null }>({ now: null, before: null });
  let pair = readings;
  if ((model?.ranking ?? null) !== (pair.now?.ranking ?? null)) {
    pair = { before: pair.now, now: model === null ? null : { analysisId: model.analysisId, ranking: model.ranking, bodies: model.bodies } };
    setReadings(pair);
  }
  const movements = useMemo(() => (pair.now === null ? NO_MOVES : bodyMovements(pair.before, pair.now)), [pair]);

  const empty = mappingEmptyReason(ranking, model);
  if (model === null || empty !== null) {
    return (
      <section data-testid="mapping-field" data-empty={empty ?? "NO_RANKING"} style={{ position: "absolute", inset: 0, zIndex: 45, backgroundColor: "rgba(3, 5, 8, 0.92)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ ...panel, maxWidth: "460px" }}>
          <span style={kicker}>{c.title}</span>
          <span data-testid="mapping-empty" data-reason={empty ?? "NO_RANKING"} role="status" style={statement}>{c.empty[empty ?? "NO_RANKING"]}</span>
        </div>
      </section>
    );
  }

  const view = fieldLevel(focus, model);
  const { level, pool } = view;
  const openSector = pool === null ? null : model.sectors.find(s => s.poolId === pool) ?? null;
  const openBody = view.body;
  const ringR = openBody === null ? 0 : ringRadius(openBody);
  const box: ViewBox = openBody !== null ? roleViewBox(openBody) : openSector !== null ? sectorViewBox(openSector) : fieldViewBox();
  const k = box.width / DRAWN_PX;
  const marked = markedBody(focus, model);
  const markedReq = markedArc(focus, model);
  const selected = selectedCapability(focus, model);
  const beams = levelBeams(focus, model);
  const drawnBeams = beams.filter(b => b.from !== null);
  const missing = { CONSTELLATION_OVERFLOW: 0, NOT_IN_PERSON: 0, KEY_ABSENT: 0 };
  for (const b of beams) if (b.missing !== null) missing[b.missing] += 1;
  const lockedNodes = new Set(drawnBeams.filter(b => b.phaseLocked).map(b => b.arc.coupling!.capabilityKey));
  const g = model.geometry;
  const run = model.run;
  const evidence = model.evidenceClass ?? "NONE";
  const classWord = (cls: CouplingClass) => c.legend[cls];
  const inPool = (poolId: string) => openSector === null || openSector.poolId === poolId;
  const overflowShown = openSector === null ? model.overflowCount : openSector.overflow;
  const shown = openBody !== null ? [openBody] : model.bodies;
  const collarR = (b: FieldBody) => b.radius + 2.6 * k;
  const layoutShifts = [...movements.values()].filter(m => m.kind === "LAYOUT").length;
  const displacedDrawn = shown.some(b => b.displaced);
  /** D-Q3: each small body's collar, in ring order; what it cannot carry is counted (L0/L1 only — L2/L3 draw the full ring). */
  const collars = new Map(shown.map(b => [b.key, openBody === null ? collarSplit(b.arcs, collarR(b) / k) : null] as const));
  const collarHidden = [...collars.values()].reduce((sum, collar) => sum + (collar?.hidden ?? 0), 0);
  const target = (beam: FieldBeam) => openBody !== null && beam.body.key === openBody.key ? at(openBody.x, openBody.y, ringR, beam.arc.midDegrees) : at(beam.body.x, beam.body.y, collarR(beam.body), beam.arc.midDegrees);
  const toggleCapability = (key: string) => act(selected?.key === key ? { type: "CLEAR_SELECTION" } : { type: "SELECT_CAPABILITY", capabilityKey: key });
  const markRole = (b: FieldBody) => { if (selected === null) act({ type: "MARK_ROLE", role: b.id }); };
  const clearMark = () => { if (focus.selection !== null && focus.selection.kind !== "CAPABILITY") act({ type: "CLEAR_SELECTION" }); };
  const openFromBody = (b: FieldBody) => {
    if (level === "L0") act({ type: "OPEN_POOL", jobPoolUploadId: b.id.jobPoolUploadId });
    else if (level === "L1" && inPool(b.id.jobPoolUploadId)) act({ type: "OPEN_ROLE", role: b.id });
  };

  const bodyElements = shown.map(b => {
    const move = movements.get(b.key);
    const evidenceMove = move?.kind === "EVIDENCE";
    const layoutShift = move?.kind === "LAYOUT";
    const breath = run.pendingBreath && b.class !== "SEMANTIC";
    const isMarked = marked?.key === b.key;
    const lit = selected === null || selected.roles.has(b.key);
    const opacity = !inPool(b.id.jobPoolUploadId) ? 0.18 : lit ? 1 : 0.32;
    const circumference = 2 * Math.PI * b.radius;
    const collar = collars.get(b.key) ?? null;
    const focusable = openBody === null && inPool(b.id.jobPoolUploadId);
    return (
      <React.Fragment key={b.key}>
        {evidenceMove && (
          <line data-testid={`mapping-trail-${testKey(b)}`} data-mapping-trail x1={move.from.x} y1={move.from.y} x2={b.x} y2={b.y}
            stroke={`rgba(${INK}, 0.55)`} strokeWidth={k} strokeDasharray={`${2 * k} ${2 * k}`} style={{ opacity: 0, animation: "mappingFieldTrail 0.9s ease-out" }} />
        )}
        <g
          data-testid={`mapping-body-${testKey(b)}`} data-mapping-body data-rank={b.rank} data-tier={b.tier} data-class={b.class} data-line={b.line} data-shelf={String(b.shelf)}
          data-displaced={String(b.displaced)} data-moved={String(evidenceMove)} data-movement={move?.kind ?? "NONE"} data-layout-shift={String(layoutShift)}
          data-marked={String(isMarked)} data-lit={String(lit)} data-breath={String(breath)} data-requirements={b.arcs.length} data-collar-hidden={collar?.hidden ?? 0}
          tabIndex={focusable ? 0 : -1} role="button" aria-label={c.bodyLabel(b.rank, b.title, b.organizationName, classWord(b.class), b.arcs.length)}
          opacity={opacity}
          onMouseEnter={() => { if (focusable) markRole(b); }} onFocus={() => { if (focusable) markRole(b); }} onMouseLeave={clearMark} onBlur={clearMark}
          onClick={() => openFromBody(b)}
          onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openFromBody(b); } }}
          style={{ transform: `translate(${b.x}px, ${b.y}px)`, transition: evidenceMove ? "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)" : "none", cursor: focusable ? "pointer" : "default" }}
        >
          <title>{c.bodyLabel(b.rank, b.title, b.organizationName, classWord(b.class), b.arcs.length)}</title>
          <circle
            data-mapping-body-shape r={b.radius} fill={`rgba(${CYAN}, ${isMarked ? 0.32 : 0.14})`} stroke={`rgba(${INK}, ${isMarked ? 1 : 0.82})`}
            strokeWidth={(isMarked ? 2 : 1.2) * k} strokeDasharray={dashOf(b.line, k, circumference)} strokeLinecap={b.line === "dotted" ? "round" : "butt"}
            style={breath ? { animation: "mappingFieldBreath 4.8s ease-in-out infinite" } : undefined}
          />
          {collar !== null && (
            <g data-testid={`mapping-collar-${testKey(b)}`} data-drawn={collar.drawn.length} data-hidden={collar.hidden}>
              {collar.drawn.map(arc => arcSign({ arc, cx: 0, cy: 0, r: collarR(b), k, testId: `mapping-tick-${testKey(b)}:${arc.poolRequirementId}` }))}
            </g>
          )}
          {layoutShift && <rect data-testid={`mapping-layout-shift-${testKey(b)}`} x={-b.radius - 5 * k} y={-b.radius - 5 * k} width={2.6 * k} height={2.6 * k} fill="none" stroke={`rgba(${INK}, 0.8)`} strokeWidth={0.8 * k} />}
          {b.displaced && <path data-testid={`mapping-displaced-${testKey(b)}`} d={`M ${fixed(b.radius + 3 * k)} ${fixed(-b.radius - 3 * k)} l ${fixed(1.6 * k)} ${fixed(-1.6 * k)} l ${fixed(1.6 * k)} ${fixed(1.6 * k)} l ${fixed(-1.6 * k)} ${fixed(1.6 * k)} Z`} fill="none" stroke={`rgba(${INK}, 0.7)`} strokeWidth={0.8 * k} />}
          {level === "L1" && collar !== null && collar.hidden > 0 && inPool(b.id.jobPoolUploadId) && (
            <text data-testid={`mapping-collar-more-${testKey(b)}`} x={collarR(b) + 3 * k} y={collarR(b) + 3 * k} fontSize={9 * k} fill={`rgba(${INK}, 0.8)`} fontFamily={MONO}>{c.more(collar.hidden)}</text>
          )}
          {level === "L1" && inPool(b.id.jobPoolUploadId) && (
            <text x={0} y={-collarR(b) - 4 * k} textAnchor="middle" fontSize={10 * k} fill={`rgba(${INK}, 0.85)`} fontFamily={SANS}>{b.title}</text>
          )}
        </g>
      </React.Fragment>
    );
  });

  return (
    <section
      data-testid="mapping-field" data-level={level} data-pool={pool ?? ""} data-role={openBody === null ? "" : testKey(openBody)} data-requirement={view.arc?.poolRequirementId ?? ""}
      data-selection={focus.selection?.kind ?? ""} data-capability={selected?.key ?? ""}
      data-run-state={run.state} data-field-motion={run.sign.fieldMotion} data-frozen={String(run.sign.frozen)} data-pending-breath={String(run.pendingBreath)}
      data-resume-pulse={String(run.sign.resumePulse)} data-evidence-class={evidence} data-authority-state={model.authority.authorityState} data-decision={String(model.authority.decision)}
      data-names-only={String(model.namesOnly)} data-bodies={model.bodies.length} data-overflow={model.overflowCount} data-beams={drawnBeams.length} data-layout-shifts={layoutShifts}
      onKeyDown={event => {
        if (event.key !== "Escape") return;
        if (level !== "L0") { event.stopPropagation(); act({ type: "UP" }); } else if (focus.selection !== null) { event.stopPropagation(); act({ type: "CLEAR_SELECTION" }); }
      }}
      style={{ position: "absolute", inset: 0, zIndex: 45, backgroundColor: "rgba(3, 5, 8, 0.92)", fontFamily: MONO, color: INK, overflow: "hidden" }}
    >
      <style>{MAPPING_FIELD_CSS}</style>

      {/* The reading's frame (left column): what the field is, its provenance, the level's header, the lines that state the field. */}
      <div data-sx-panel="mapping-reading" style={{ ...panel, position: "absolute", left: "28px", top: "150px", width: "min(320px, 24vw)", maxHeight: "calc(100vh - 190px)", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
          <span style={kicker}>{c.title}</span>
          <span data-testid="mapping-field-evidence" data-evidence-class={evidence} style={badge}>{c.evidence[evidence]}</span>
        </div>
        <span data-testid="mapping-field-authority" data-authority-state={model.authority.authorityState} data-decision={String(model.authority.decision)} style={meta}>{c.authority}</span>
        {model.namesOnly && <span data-testid="mapping-provenance" style={{ ...statement, fontSize: "12px", color: "rgba(214, 236, 248, 0.94)" }}>{c.namesOnly}</span>}

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
        {layoutShifts > 0 && <span data-testid="mapping-layout-shifts" data-count={layoutShifts} style={meta}>{c.layoutShifts(layoutShifts)}</span>}
        {displacedDrawn && <span data-testid="mapping-displaced-line" style={meta}>{c.displaced}</span>}
        {missing.CONSTELLATION_OVERFLOW > 0 && <span data-testid="mapping-beams-undrawn" data-count={missing.CONSTELLATION_OVERFLOW} style={meta}>{c.beamsUndrawn(missing.CONSTELLATION_OVERFLOW)}</span>}
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
        </ul>
        <span data-testid="mapping-position" style={meta}>{c.position}</span>
      </div>

      <svg
        data-testid="mapping-field-svg" role="img" aria-label={c.label(model.sectors.length, model.bodies.length, model.overflowCount)}
        viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`} preserveAspectRatio="xMidYMid meet"
        style={{ position: "absolute", left: "50%", top: "142px", transform: "translateX(-50%)", width: "min(calc(100vh - 170px), calc(100vw - 760px), 1100px)", minWidth: "420px", height: "auto", aspectRatio: "1 / 1", display: "block", transition: "none" }}
      >
        {/* The rings: the shelf band beyond the horizon (name relations only), the horizon, the best-fit ring, the field's edge. */}
        <circle data-testid="mapping-ring-shelf" r={(g.shelfNear + g.fieldRadius) / 2} fill="none" stroke={`rgba(${CYAN}, 0.05)`} strokeWidth={g.fieldRadius - g.shelfNear} />
        <circle data-testid="mapping-ring-best" r={g.bestFit} fill="none" stroke={`rgba(${CYAN}, 0.16)`} strokeWidth={k} strokeDasharray={`${2 * k} ${4 * k}`} />
        <circle data-testid="mapping-ring-horizon" r={g.horizon} fill="none" stroke={`rgba(${CYAN}, 0.38)`} strokeWidth={k} />
        <circle data-testid="mapping-ring-field" r={g.fieldRadius} fill="none" stroke={`rgba(${CYAN}, 0.22)`} strokeWidth={k} />
        <circle data-testid="mapping-pending-outline" r={g.fieldRadius + 6 * k} fill="none" stroke={`rgba(${CYAN}, 0.5)`} strokeWidth={k} strokeDasharray={`${4 * k} ${4 * k}`} />
        {run.sign.resumePulse && <circle data-testid="mapping-resume-pulse" r={g.fieldRadius} fill="none" stroke={`rgba(${INK}, 0.7)`} strokeWidth={2 * k} style={{ opacity: 0, animation: "mappingFieldPulse 6s ease-out infinite" }} />}

        {openBody === null && model.sectors.map((s: FieldSector) => {
          const [lx, ly] = at(0, 0, g.fieldRadius + 12, s.startDegrees + s.spanDegrees / 2);
          return (
            <g key={s.poolId}>
              <path
                data-testid={`mapping-sector-${s.poolId}`} data-mapping-sector data-pool={s.poolId} data-open={String(openSector?.poolId === s.poolId)}
                d={wedge(g.personRadius, g.fieldRadius, s.startDegrees, s.spanDegrees)}
                fill={openSector?.poolId === s.poolId ? `rgba(${CYAN}, 0.05)` : "rgba(0, 0, 0, 0)"} stroke={`rgba(${CYAN}, 0.1)`} strokeWidth={k}
                onClick={() => act({ type: "OPEN_POOL", jobPoolUploadId: s.poolId })}
              >
                <title>{c.openPool(s.poolName)}</title>
              </path>
              <text data-testid={`mapping-sector-name-${s.poolId}`} x={lx} y={ly} textAnchor={lx < -1 ? "end" : lx > 1 ? "start" : "middle"} dominantBaseline="middle" fontSize={11 * k} fill={`rgba(${INK}, 0.7)`} fontFamily={MONO}>{s.poolName}</text>
            </g>
          );
        })}

        {/* The person: its capability proposals in the centre (constellation). Selecting one shows every role it couples (reverse view). */}
        <g data-testid="mapping-person" data-capabilities={model.view.constellation.length} data-overflow={model.constellation.overflowCount}>
          <circle r={g.personRadius} fill={`rgba(${CYAN}, 0.04)`} stroke={`rgba(${CYAN}, 0.28)`} strokeWidth={k}><title>{c.person}</title></circle>
          {model.constellation.nodes.map(n => {
            const isSelected = selected?.key === n.key;
            return (
              <g
                key={n.key} data-testid={`mapping-capability-${n.key}`} data-mapping-node data-selected={String(isSelected)} data-phase-locked={String(lockedNodes.has(n.key))}
                role="button" tabIndex={0} aria-pressed={isSelected} aria-label={c.capabilityLabel(n.name)}
                onClick={event => { event.stopPropagation(); toggleCapability(n.key); }}
                onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleCapability(n.key); } }}
                style={{ cursor: "pointer" }}
              >
                <circle cx={n.x} cy={n.y} r={g.nodeRadius + 3} fill="rgba(0, 0, 0, 0)" />
                <circle cx={n.x} cy={n.y} r={g.nodeRadius} fill={`rgba(${INK}, ${isSelected ? 0.95 : 0.55})`} stroke={isSelected ? `rgba(${INK}, 1)` : "none"} strokeWidth={isSelected ? 1.2 * k : 0} />
                {(level !== "L0" || isSelected) && <text x={n.x} y={n.y - g.nodeRadius - 2.5} textAnchor="middle" fontSize={Math.max(5, 9 * k)} fill={`rgba(${INK}, 0.85)`} fontFamily={SANS}>{n.name}</text>}
                <title>{n.name}</title>
              </g>
            );
          })}
        </g>

        {/* Beams (§2.1): from a drawn capability node to its requirement's arc, in the coupling state's beam. */}
        <g data-testid="mapping-beams">
          {drawnBeams.map(b => {
            const stroke = beamStroke(b.beam, k);
            const [tx, ty] = target(b);
            return (
              <line key={b.id} data-testid={`mapping-beam-${testKey(b.body)}:${b.arc.poolRequirementId}`} data-beam={b.beam} data-phase-locked={String(b.phaseLocked)} data-state={b.arc.state}
                data-capability={b.arc.coupling?.capabilityKey ?? ""} x1={b.from!.x} y1={b.from!.y} x2={tx} y2={ty}
                stroke={`rgba(${INK}, ${stroke.opacity})`} strokeWidth={stroke.width} strokeDasharray={stroke.dash} strokeLinecap={b.beam === "dotted" || b.beam === "faint-dotted" ? "round" : "butt"} />
            );
          })}
        </g>

        {bodyElements}

        {/* L2/L3: the open role's ring — the very arcs of its collar, at the ring's radius. */}
        {openBody !== null && (
          <g data-testid="mapping-ring" data-role={testKey(openBody)} data-arcs={openBody.arcs.length} data-radius={ringR}>
            <circle cx={openBody.x} cy={openBody.y} r={ringR} fill="none" stroke={`rgba(${CYAN}, 0.12)`} strokeWidth={k} />
            {openBody.arcs.map(arc => {
              const isOpen = view.arc?.poolRequirementId === arc.poolRequirementId;
              const isMarkedArc = markedReq?.poolRequirementId === arc.poolRequirementId;
              const reverseLit = selected === null || arc.coupling?.capabilityKey === selected.key;
              return arcSign({
                arc, cx: openBody.x, cy: openBody.y, r: ringR, k, testId: `mapping-arc-${arc.poolRequirementId}`,
                emphasis: level === "L3" && !isOpen ? 0.45 : reverseLit ? 1 : 0.4,
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
                  textAnchor={lx < openBody.x ? "end" : "start"} dominantBaseline="middle" fontSize={9 * k} fill={`rgba(${INK}, 0.8)`} fontFamily={SANS}>
                  {arc.coupling.keyStatus === "NOT_IN_PERSON" ? c.notInPerson(arc.coupling.capabilityName) : c.keyAbsent}
                </text>
              );
            })}
          </g>
        )}
      </svg>

      {/* L3: the open arc's evidence, verbatim (right column). */}
      {level === "L3" && view.arc !== null && openBody !== null && (
        <aside data-testid="mapping-l3" data-requirement={view.arc.poolRequirementId} data-state={view.arc.state} data-key-status={view.arc.coupling?.keyStatus ?? "NONE"}
          style={{ ...panel, position: "absolute", right: "28px", top: "232px", width: "min(340px, 25vw)", maxHeight: "calc(100vh - 270px)", overflowY: "auto" }}>
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
