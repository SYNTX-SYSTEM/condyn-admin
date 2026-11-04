"use client";

import React, { useMemo, useState } from "react";
import { SIL_TOKENS } from "./SILTokens";
import type { SilLocale } from "../../../../lib/career/view-model/sil-language";
import type { CapabilityProposalProjection } from "../../../../lib/career/capability-core/projection";
import type { AutoMatchWatch, JobRankingState } from "../../../../lib/career/ui/auto-match";
import { FOCUS_INITIAL, type FocusState } from "../../../../lib/career/mapping/focus";
import type { CouplingClass } from "../../../../lib/career/mapping/signs";
import {
  CLASS_LINE, bodyMovements, fieldFocusReduce, fieldLevel, fieldViewBox, mappingFieldModel, markedBody, sectorViewBox,
  type BodyMovement, type FieldAction, type FieldBody, type FieldSector, type FieldSnapshot, type ViewBox
} from "../../../../lib/career/view-model/mapping-field";
import { MAPPING_FIELD_COPY } from "./mapping-field-copy";

/**
 * PERSON × JOB mapping field, phase C (GELB "SFE::PHASE_C", GRÜN): the automatic ranking drawn as a field, L0 (all pools around the
 * person) and L1 (one pool). It stands in the automatic ranking's panel above the ranked list (AutoJobRankingPanel `field`), so the
 * six PERSON orbits, the Job Field and B2 stay as they are, and the field selector keeps its two fields.
 *
 * Read only (B-7): no fetch, no POST, no URL write, no model call — it draws what the panel's hooks already read. Opening a pool is a
 * look, not a choice (B-3): nothing here touches the job scope; there is no "select this job" (B-4 stays the Job Field's). L2/L3
 * (a role or a requirement opened) are a later phase: a body is marked on hover or focus, never opened.
 *
 * The signs: angle = pool, distance = rank (the layout), line = class (the sign table: solid checked, dotted name relation only, open
 * no relation); colour carries no state. The run's time sign at field level: only RUNNING breathes (and only while roles are
 * pending), only STALLED stands still with a still sentence, one quiet pulse at the edge while a continuation is due; under
 * prefers-reduced-motion nothing breathes, pulses or travels, and pending is a static dashed outline.
 */
const MONO = SIL_TOKENS.typography.mono;
const SANS = SIL_TOKENS.typography.sans;
const CYAN = "92, 200, 255";
const INK = "205, 240, 255";
const kicker: React.CSSProperties = { fontFamily: MONO, fontSize: "11px", fontWeight: 700, letterSpacing: "1.8px", textTransform: "uppercase", color: "rgba(160, 232, 250, 0.92)" };
const meta: React.CSSProperties = { fontFamily: MONO, fontSize: "10.5px", lineHeight: 1.5, letterSpacing: "0.3px", color: "rgba(176, 200, 216, 0.88)", wordBreak: "break-word" };
const statement: React.CSSProperties = { fontFamily: SANS, fontSize: "12px", lineHeight: 1.45, color: "#e6f1f8" };
const badge: React.CSSProperties = { fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "1.1px", padding: "1px 8px", borderRadius: "999px", border: `1px solid rgba(${CYAN}, 0.32)`, color: "rgba(176, 226, 244, 0.95)", whiteSpace: "nowrap" };
const chip: React.CSSProperties = { padding: "2px 9px", borderRadius: "999px", border: `1px solid rgba(${CYAN}, 0.36)`, background: `rgba(${CYAN}, 0.06)`, color: "#cdf6ff", fontFamily: MONO, fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.8px", cursor: "pointer", whiteSpace: "nowrap" };

/** The drawn width of the field in the panel (px), to keep strokes about one pixel at every level. */
const DRAWN_PX = 360;
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

export const MAPPING_FIELD_CSS = `
@keyframes mappingFieldBreath { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
@keyframes mappingFieldTrail { from { opacity: 0.55; } to { opacity: 0; } }
@keyframes mappingFieldPulse { 0% { opacity: 0; } 6% { opacity: 0.55; } 26% { opacity: 0; } 100% { opacity: 0; } }
[data-testid="mapping-field"] [data-mapping-sector] { cursor: pointer; }
[data-testid="mapping-field"] [data-mapping-body]:focus { outline: none; }
[data-testid="mapping-field"] [data-mapping-body]:focus-visible > circle[data-mapping-body-shape] { stroke-width: 2.4px; }
[data-testid="mapping-field"] button:focus-visible { outline: 1px solid rgba(${CYAN}, 0.85); outline-offset: 2px; }
[data-testid="mapping-field"][data-frozen="true"] *, [data-testid="mapping-field"][data-frozen="true"] { animation: none !important; transition: none !important; }
[data-testid="mapping-pending-outline"] { display: none; }
@media (prefers-reduced-motion: reduce) {
  [data-testid="mapping-field"], [data-testid="mapping-field"] * { animation: none !important; transition: none !important; }
  [data-testid="mapping-field"] [data-mapping-trail] { opacity: 0.35 !important; }
  [data-testid="mapping-field"][data-pending-breath="true"] [data-testid="mapping-pending-outline"] { display: inline; }
}`;

const toRad = (degrees: number) => (degrees * Math.PI) / 180;
const point = (r: number, degrees: number) => [r * Math.cos(toRad(degrees)), r * Math.sin(toRad(degrees))] as const;
const fixed = (v: number) => Math.round(v * 1000) / 1000;
/** An annular wedge from the inner to the outer radius over [start, start + span] (clockwise, +y down). */
function wedge(inner: number, outer: number, start: number, span: number): string {
  const end = start + span, large = span > 180 ? 1 : 0;
  const [ax, ay] = point(outer, start), [bx, by] = point(outer, end), [cx, cy] = point(inner, end), [dx, dy] = point(inner, start);
  return `M ${fixed(ax)} ${fixed(ay)} A ${outer} ${outer} 0 ${large} 1 ${fixed(bx)} ${fixed(by)} L ${fixed(cx)} ${fixed(cy)} A ${inner} ${inner} 0 ${large} 0 ${fixed(dx)} ${fixed(dy)} Z`;
}
const testKey = (b: Pick<FieldBody, "id">) => `${b.id.jobPoolUploadId}:${b.id.poolRoleId}`;
const NO_MOVES: ReadonlyMap<string, BodyMovement> = new Map();

export interface PersonJobMappingFieldProps {
  locale: SilLocale;
  /** The PERSON analysis's capability proposals (the constellation); null when the result names none. */
  projection: CapabilityProposalProjection | null;
  /** The ranking and the run as the automatic panel already read them (useJobRanking / useAutoMatch) — nothing is read again here. */
  ranking: JobRankingState;
  watch: AutoMatchWatch;
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
  if (model === null || model.view.empty !== null) return null;

  const { level, pool } = fieldLevel(focus, model);
  const openSector = level === "L1" ? model.sectors.find(s => s.poolId === pool) ?? null : null;
  const box: ViewBox = openSector === null ? fieldViewBox() : sectorViewBox(openSector);
  const k = box.width / DRAWN_PX;
  const marked = markedBody(focus, model);
  const g = model.geometry;
  const drawn = model.bodies.length;
  const run = model.run;
  const evidence = model.evidenceClass ?? "NONE";
  const classWord = (cls: CouplingClass) => c.legend[cls];
  const inPool = (poolId: string) => openSector === null || openSector.poolId === poolId;
  const overflowShown = openSector === null ? model.overflowCount : openSector.overflow;

  return (
    <section
      data-testid="mapping-field" data-level={level} data-pool={pool ?? ""}
      data-run-state={run.state} data-field-motion={run.sign.fieldMotion} data-frozen={String(run.sign.frozen)} data-pending-breath={String(run.pendingBreath)}
      data-resume-pulse={String(run.sign.resumePulse)} data-evidence-class={evidence} data-authority-state={model.authority.authorityState} data-decision={String(model.authority.decision)}
      data-bodies={drawn} data-overflow={model.overflowCount}
      onKeyDown={event => { if (event.key === "Escape" && level !== "L0") { event.stopPropagation(); act({ type: "UP" }); } }}
      style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "10px 10px 12px", borderRadius: "10px", border: `1px solid rgba(${CYAN}, 0.18)`, background: "rgba(3, 9, 17, 0.72)" }}
    >
      <style>{MAPPING_FIELD_CSS}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
        <span style={kicker}>{c.title}</span>
        <span data-testid="mapping-field-evidence" data-evidence-class={evidence} style={badge}>{c.evidence[evidence]}</span>
      </div>
      <span data-testid="mapping-field-authority" data-authority-state={model.authority.authorityState} data-decision={String(model.authority.decision)} style={meta}>{c.authority}</span>

      {openSector !== null && (
        <div data-testid="mapping-l1" data-pool={openSector.poolId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <span data-testid="mapping-l1-title" style={{ ...statement, fontWeight: 600 }}>{c.levelL1(openSector.poolName, openSector.roles)}</span>
          <button type="button" data-testid="mapping-up" onClick={() => act({ type: "UP" })} style={chip}>{c.up}</button>
        </div>
      )}

      <svg
        data-testid="mapping-field-svg" role="img" aria-label={c.label(model.sectors.length, drawn, model.overflowCount)}
        viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`} preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", height: "auto", aspectRatio: "1 / 1", display: "block", transition: "none" }}
      >
        {/* The rings: the shelf band beyond the horizon (name relations only), the horizon, the best-fit ring, the field's edge. */}
        <circle data-testid="mapping-ring-shelf" r={(g.shelfNear + g.fieldRadius) / 2} fill="none" stroke={`rgba(${CYAN}, 0.05)`} strokeWidth={g.fieldRadius - g.shelfNear} />
        <circle data-testid="mapping-ring-best" r={g.bestFit} fill="none" stroke={`rgba(${CYAN}, 0.16)`} strokeWidth={k} strokeDasharray={`${2 * k} ${4 * k}`} />
        <circle data-testid="mapping-ring-horizon" r={g.horizon} fill="none" stroke={`rgba(${CYAN}, 0.38)`} strokeWidth={k} />
        <circle data-testid="mapping-ring-field" r={g.fieldRadius} fill="none" stroke={`rgba(${CYAN}, 0.22)`} strokeWidth={k} />
        <circle data-testid="mapping-pending-outline" r={g.fieldRadius + 6 * k} fill="none" stroke={`rgba(${CYAN}, 0.5)`} strokeWidth={k} strokeDasharray={`${4 * k} ${4 * k}`} />
        {run.sign.resumePulse && <circle data-testid="mapping-resume-pulse" r={g.fieldRadius} fill="none" stroke={`rgba(${INK}, 0.7)`} strokeWidth={2 * k} style={{ opacity: 0, animation: "mappingFieldPulse 6s ease-out infinite" }} />}

        {model.sectors.map((s: FieldSector) => (
          <path
            key={s.poolId} data-testid={`mapping-sector-${s.poolId}`} data-mapping-sector data-pool={s.poolId} data-open={String(openSector?.poolId === s.poolId)}
            d={wedge(g.personRadius, g.fieldRadius, s.startDegrees, s.spanDegrees)}
            fill={openSector?.poolId === s.poolId ? `rgba(${CYAN}, 0.05)` : "rgba(0, 0, 0, 0)"} stroke={`rgba(${CYAN}, 0.1)`} strokeWidth={k}
            onClick={() => act({ type: "OPEN_POOL", jobPoolUploadId: s.poolId })}
          >
            <title>{c.openPool(s.poolName)}</title>
          </path>
        ))}

        {/* The person: its capability proposals in the centre (constellation); a count for those beyond its rings. */}
        <g data-testid="mapping-person" data-capabilities={model.view.constellation.length} data-overflow={model.constellation.overflowCount}>
          <circle r={g.personRadius} fill={`rgba(${CYAN}, 0.04)`} stroke={`rgba(${CYAN}, 0.28)`} strokeWidth={k}><title>{c.person}</title></circle>
          {model.constellation.nodes.map(n => (
            <circle key={n.key} data-testid={`mapping-capability-${n.key}`} cx={n.x} cy={n.y} r={g.nodeRadius} fill={`rgba(${INK}, 0.55)`} stroke="none"><title>{n.name}</title></circle>
          ))}
        </g>

        {model.bodies.map(b => {
          const move = movements.get(b.key);
          const breath = run.pendingBreath && b.class !== "SEMANTIC";
          const isMarked = marked?.key === b.key;
          const circumference = 2 * Math.PI * b.radius;
          return (
            <React.Fragment key={b.key}>
              {move?.moved && move.from !== null && (
                <line data-testid={`mapping-trail-${testKey(b)}`} data-mapping-trail x1={move.from.x} y1={move.from.y} x2={b.x} y2={b.y}
                  stroke={`rgba(${INK}, 0.55)`} strokeWidth={k} strokeDasharray={`${2 * k} ${2 * k}`} style={{ opacity: 0, animation: "mappingFieldTrail 0.9s ease-out" }} />
              )}
              <g
                data-testid={`mapping-body-${testKey(b)}`} data-mapping-body data-rank={b.rank} data-tier={b.tier} data-class={b.class} data-line={b.line} data-shelf={String(b.shelf)}
                data-displaced={String(b.displaced)} data-moved={String(move?.moved === true)} data-marked={String(isMarked)} data-breath={String(breath)}
                tabIndex={inPool(b.id.jobPoolUploadId) ? 0 : -1} aria-label={c.bodyLabel(b.rank, b.title, b.organizationName, classWord(b.class))}
                opacity={inPool(b.id.jobPoolUploadId) ? 1 : 0.18}
                onMouseEnter={() => act({ type: "MARK_ROLE", role: b.id })} onFocus={() => act({ type: "MARK_ROLE", role: b.id })}
                onMouseLeave={() => act({ type: "CLEAR_SELECTION" })} onBlur={() => act({ type: "CLEAR_SELECTION" })}
                onClick={() => { if (level === "L0") act({ type: "OPEN_POOL", jobPoolUploadId: b.id.jobPoolUploadId }); }}
                style={{ transform: `translate(${b.x}px, ${b.y}px)`, transition: move?.moved ? "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)" : "none", cursor: level === "L0" ? "pointer" : "default" }}
              >
                <title>{c.bodyLabel(b.rank, b.title, b.organizationName, classWord(b.class))}</title>
                <circle
                  data-mapping-body-shape r={b.radius} fill={`rgba(${CYAN}, ${isMarked ? 0.32 : 0.14})`} stroke={`rgba(${INK}, ${isMarked ? 1 : 0.82})`}
                  strokeWidth={(isMarked ? 2 : 1.2) * k} strokeDasharray={dashOf(b.line, k, circumference)} strokeLinecap={b.line === "dotted" ? "round" : "butt"}
                  style={breath ? { animation: "mappingFieldBreath 4.8s ease-in-out infinite" } : undefined}
                />
              </g>
            </React.Fragment>
          );
        })}
      </svg>

      {run.sign.frozen && <span data-testid="mapping-still" role="status" aria-live="polite" style={statement}>{run.resumePending ? c.stillResume : c.still}</span>}
      {!run.sign.frozen && run.sign.resumePulse && <span data-testid="mapping-resume-pending" style={meta}>{c.resumePending}</span>}
      {run.pendingBreath && <span data-testid="mapping-pending" style={meta}>{c.pending}</span>}
      {overflowShown > 0 && <span data-testid="mapping-overflow" data-count={overflowShown} style={meta}>{c.notDrawn(overflowShown)}</span>}
      {model.constellation.overflowCount > 0 && <span data-testid="mapping-person-overflow" data-count={model.constellation.overflowCount} style={meta}>{c.personMore(model.constellation.overflowCount)}</span>}

      <div data-testid="mapping-marked" aria-live="polite" style={{ ...meta, minHeight: "1.5em", color: "rgba(214, 240, 252, 0.95)" }}>
        {marked !== null ? c.marked(marked.rank, marked.title, marked.organizationName, marked.poolName) : ""}
      </div>

      {openSector === null && (
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
        <li data-testid="mapping-horizon" style={meta}>{c.horizon}</li>
      </ul>
      <span data-testid="mapping-position" style={meta}>{c.position}</span>
    </section>
  );
}
