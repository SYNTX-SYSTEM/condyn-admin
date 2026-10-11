"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { SIL_TOKENS } from "./SILTokens";
import { SIL_COPY, type SilLocale } from "../../../../lib/career/view-model/sil-language";
import { describeRanking, describeSelection, type JobPoolAnalysisSource } from "../../../../lib/career/job-pool/frontend-presentation";
import { useJobPoolWorkflow } from "../../../../lib/career/ui/useJobPool";
import { useAnalysisSources } from "../../../../lib/career/ui/useJobPoolSources";
import {
  deriveSyntxField,
  inspectSign,
  observeOrganization,
  observeRequirement,
  observeRole,
  resolveObservation,
  returnFrom,
  summarySentence,
  SYNTX_FIELD_GRAMMAR,
  SYNTX_LAYOUT,
  type SyntxAperture,
  type SyntxField as SyntxFieldModel,
  type SyntxObservation,
  type SyntxRequirement,
  type SyntxSupport,
  type SyntxTrace,
  type VisualSign
} from "../../../../lib/career/job-pool/syntx-field-view-model";

/**
 * SYNTX semiontic field (owner mandate "SFE — SYNTX SEMIONTIC FIELD RECONSTRUCTION", 2026-10-11).
 *
 * The field is the interface: the selected Job Pool is the total field, organizations are named regions, roles are
 * readable carriers inside them, a selected role becomes the centre of its constraint ecology with requirement anchors,
 * evidence traces to source carriers, one suspended boundary (pending canonical evaluation) and open boundaries where
 * no support was delivered. Text appears only in a temporary aperture while a trace or boundary is inspected.
 *
 * Everything rendered is a visual sign of the pure view model (syntx-field-view-model.ts) and carries its sign and
 * proof attributes (JOB_FIELD_FRONTEND.md §13, BR-1 … BR-5). Nothing here scores, evaluates, recommends or decides.
 *
 *   FIELD → ORGANIZATION → ROLE → REQUIREMENT → (aperture) → RETURN
 */
export type JobPoolWorkflow = ReturnType<typeof useJobPoolWorkflow>;
type SyntxCopy = (typeof SIL_COPY)[SilLocale]["syntx"];
type PoolCopy = (typeof SIL_COPY)[SilLocale]["jobPool"];
export type SyntxMotionMode = "LIVE" | "REDUCED";

export type SyntxFieldState = "NO_POOL" | "NO_ANALYSIS" | "LOADING" | "AVAILABLE" | "NOT_FOUND" | "INACTIVE_POOL" | "NOT_PROVISIONED" | "FAILED";

export interface SyntxFieldProps {
  workflow: JobPoolWorkflow;
  analysisSource: JobPoolAnalysisSource;
  observation: SyntxObservation;
  onObserve(next: SyntxObservation): void;
  onSelectPool(jobPoolUploadId: string): void;
  onExit(): void;
  locale?: SilLocale;
}

const CYAN = SIL_TOKENS.colors.cyanActive;
const AMBER = SIL_TOKENS.colors.tensionAmber;
const MONO = SIL_TOKENS.typography.mono;
const SANS = SIL_TOKENS.typography.sans;
const INK = SIL_TOKENS.colors.textPrimary;
const INK_SOFT = "rgba(230, 241, 248, 0.78)";
const MUTED = SIL_TOKENS.colors.textMuted;
const NEUTRAL = "rgba(230, 241, 248, 0.42)";

const micro: React.CSSProperties = { fontFamily: MONO, fontSize: "9px", color: MUTED, letterSpacing: "0.3px", lineHeight: 1.55, wordBreak: "break-word" };
const label: React.CSSProperties = { fontFamily: MONO, fontSize: "9px", fontWeight: 600, letterSpacing: "1.8px", textTransform: "uppercase", color: MUTED, margin: 0 };
const prose: React.CSSProperties = { fontFamily: SANS, fontSize: "12.5px", lineHeight: 1.65, color: INK_SOFT, margin: 0 };
const titleStyle: React.CSSProperties = { fontFamily: SANS, fontSize: "17px", fontWeight: 600, letterSpacing: "-0.2px", lineHeight: 1.25, color: INK, margin: 0 };
const stack = (gap = 8): React.CSSProperties => ({ display: "flex", flexDirection: "column", gap: `${gap}px` });
const row = (gap = 8): React.CSSProperties => ({ display: "flex", alignItems: "center", gap: `${gap}px`, flexWrap: "wrap" });
const word = (color: string): React.CSSProperties => ({ fontFamily: MONO, fontSize: "8px", fontWeight: 600, letterSpacing: "1.2px", textTransform: "uppercase", color, whiteSpace: "nowrap" });
const action = (tone: "cyan" | "muted" = "cyan", enabled = true): React.CSSProperties => ({ background: "transparent", border: "none", padding: "4px 0", fontFamily: MONO, fontSize: "9px", fontWeight: 600, letterSpacing: "1.4px", textTransform: "uppercase", color: !enabled ? "rgba(99, 120, 138, 0.6)" : tone === "cyan" ? CYAN : MUTED, cursor: enabled ? "pointer" : "not-allowed", textShadow: enabled && tone === "cyan" ? `0 0 10px ${SIL_TOKENS.colors.cyanGlow}` : undefined, transition: "color .25s ease" });
const ghost: React.CSSProperties = { ...action("muted"), fontSize: "8px", letterSpacing: "1px" };
/** An aperture or edge lens: a faint void behind text, no border, no card chrome. */
const lens: React.CSSProperties = { background: "radial-gradient(ellipse at 20% 0%, rgba(3, 5, 8, 0.94) 0%, rgba(3, 5, 8, 0.84) 60%, rgba(3, 5, 8, 0.64) 100%)", backdropFilter: "blur(6px)", borderRadius: "14px", padding: "14px 16px" };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: "transparent", border: "none", borderBottom: "1px solid rgba(99, 120, 138, 0.4)", color: INK, fontFamily: MONO, fontSize: "10px", padding: "5px 0", outline: "none" };
const percent = (value: number): string => `${Math.round(value * 1000) / 10}%`;
const visuallyHidden: React.CSSProperties = { position: "absolute", width: "1px", height: "1px", margin: "-1px", padding: 0, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0 };

/** Readable labels: wrap at word boundaries, never truncate as the primary display (spec §9.3). */
export function wrapLines(text: string, maxChars: number, maxLines = 3): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const wordText of words) {
    const candidate = current.length === 0 ? wordText : `${current} ${wordText}`;
    if (candidate.length <= maxChars || current.length === 0) current = candidate;
    else { lines.push(current); current = wordText; }
  }
  if (current.length > 0) lines.push(current);
  if (lines.length <= maxLines) return lines;
  return [...lines.slice(0, maxLines - 1), lines.slice(maxLines - 1).join(" ")];
}

const SYNTX_CSS = `
@keyframes sxEnter { from { opacity: 0; } to { opacity: 1; } }
@keyframes sxRise { from { opacity: 0; } to { opacity: 1; } }
@keyframes sxSuspend { to { stroke-dashoffset: -120; } }
[data-testid="syntx-field"] [data-sx-reveal] { animation: sxRise .32s ease-out backwards; }
[data-testid="syntx-field"] button:hover:not(:disabled) { color: #e6f1f8; }
[data-testid="syntx-field"] button:focus-visible, [data-testid="syntx-field"] input:focus-visible, [data-testid="syntx-field"] [tabindex="0"]:focus-visible { outline: 1px solid rgba(56, 229, 255, 0.75); outline-offset: 3px; border-radius: 2px; }
[data-testid="syntx-field"] [data-sx-camera] { transition: transform .78s cubic-bezier(.16,1,.3,1); }
[data-testid="syntx-canvas"] [tabindex]:focus { outline: none; }
[data-testid="syntx-canvas"] [tabindex]:focus-visible > :not([data-sx-hit]) { filter: drop-shadow(0 0 4px rgba(56, 229, 255, 0.9)); }
[data-testid="syntx-field"] [data-sign-id] { transition: opacity .45s ease; }
[data-testid="syntx-field"] [data-sx-surface] { scrollbar-width: thin; scrollbar-color: rgba(56, 229, 255, 0.18) transparent; }
@media (prefers-reduced-motion: reduce) {
  [data-testid="syntx-field"], [data-testid="syntx-field"] * { animation: none !important; transition: none !important; }
}
`;

function useMotionMode(): SyntxMotionMode {
  const [mode, setMode] = useState<SyntxMotionMode>("LIVE");
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setMode(query.matches ? "REDUCED" : "LIVE");
    apply();
    query.addEventListener?.("change", apply);
    return () => query.removeEventListener?.("change", apply);
  }, []);
  return mode;
}

export function describeSyntxFieldState(workflow: JobPoolWorkflow, analysisSource: JobPoolAnalysisSource): SyntxFieldState {
  if (workflow.selectedJobPoolUploadId === null) return "NO_POOL";
  if (workflow.view.state === "LOADING" || workflow.view.state === "IDLE") return "LOADING";
  if (workflow.view.state === "NOT_FOUND") return "NOT_FOUND";
  if (workflow.view.state === "NOT_PROVISIONED") return "NOT_PROVISIONED";
  if (workflow.view.state === "FAILED") return "FAILED";
  if (analysisSource.kind === "NONE") return "NO_ANALYSIS";
  switch (workflow.matches.state) {
    case "IDLE":
    case "LOADING": return "LOADING";
    case "AVAILABLE": return "AVAILABLE";
    case "NOT_FOUND": return "NOT_FOUND";
    case "INACTIVE_POOL": return "INACTIVE_POOL";
    case "NOT_PROVISIONED": return "NOT_PROVISIONED";
    case "FAILED": return "FAILED";
  }
}

/** BR-2: the sign and proof attributes of one visual sign; proof ids are attributes only, never default-state text. */
function signAttributes(sign: VisualSign): Record<string, string> {
  const attributes: Record<string, string> = {
    "data-sign-id": sign.id,
    "data-sign-source": sign.source,
    "data-sign-relation": sign.relation,
    "data-sign-state": sign.state,
    "data-sign-manifestation": sign.manifestation,
    "data-sign-interaction": sign.interaction,
    "data-sign-transition": sign.transition
  };
  const proof = sign.proof;
  if (proof.uploadId) attributes["data-proof-upload-id"] = proof.uploadId;
  if (proof.organizationId) attributes["data-proof-organization-id"] = proof.organizationId;
  if (proof.roleId) attributes["data-proof-role-id"] = proof.roleId;
  if (proof.requirementId) attributes["data-proof-requirement-id"] = proof.requirementId;
  if (proof.targetId) attributes["data-proof-target-id"] = proof.targetId;
  if (proof.trqrevId) attributes["data-proof-trqrev-id"] = proof.trqrevId;
  if (proof.analysisId) attributes["data-proof-analysis-id"] = proof.analysisId;
  if (proof.capabilityId) attributes["data-proof-capability-id"] = proof.capabilityId;
  if (proof.docId) attributes["data-proof-doc-id"] = proof.docId;
  if (proof.evidenceId) attributes["data-proof-evidence-id"] = proof.evidenceId;
  return attributes;
}

const receded = (sign: VisualSign): boolean => sign.state === "receded";
const recedeOpacity = (sign: VisualSign, deep = 0.22): number => (receded(sign) ? deep : 1);

function SvgLabel({ lines, x, y, size, fill, weight = 600, anchor = "middle", family = SANS, spacing }: { lines: string[]; x: number; y: number; size: number; fill: string; weight?: number; anchor?: "middle" | "start" | "end"; family?: string; spacing?: number }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fill={fill} fontFamily={family} fontSize={size} fontWeight={weight} letterSpacing={spacing} style={{ pointerEvents: "none" }}>
      {lines.map((line, index) => <tspan key={index} x={x} dy={index === 0 ? 0 : size * 1.18}>{line}</tspan>)}
    </text>
  );
}

/** The open boundary of a requirement without delivered support: an arc around the anchor whose gap faces outward (away from the role). */
function openArc(cx: number, cy: number, radius: number, outwardAngle: number): string {
  const start = outwardAngle + 38;
  const end = outwardAngle + 322;
  const point = (angle: number) => { const radians = ((angle - 90) * Math.PI) / 180; return [cx + radius * Math.cos(radians), cy + radius * Math.sin(radians)] as const; };
  const [x1, y1] = point(start);
  const [x2, y2] = point(end);
  return `M ${x1} ${y1} A ${radius} ${radius} 0 1 1 ${x2} ${y2}`;
}

const SUPPORT_SHAPE: Record<SyntxSupport, { fill: string; stroke: string; strokeWidth: number; dash?: string; r: number }> = {
  SUPPORTED: { fill: CYAN, stroke: CYAN, strokeWidth: 0, r: 6 },
  WEAK: { fill: "rgba(56, 229, 255, 0.18)", stroke: "rgba(56, 229, 255, 0.75)", strokeWidth: 0.9, r: 5.2 },
  SWEEP_ONLY: { fill: "none", stroke: "rgba(56, 229, 255, 0.7)", strokeWidth: 1.1, dash: "1.6 2.2", r: 5.6 },
  OPEN: { fill: "none", stroke: NEUTRAL, strokeWidth: 0, r: 5.2 },
  UNREAD: { fill: "none", stroke: "rgba(230, 241, 248, 0.5)", strokeWidth: 0.8, r: 4.8 }
};

const TRACE_STROKE: Record<SyntxTrace["kind"], { color: string; dash?: string }> = {
  supports: { color: "rgba(56, 229, 255, 0.85)" },
  weakly_supports: { color: "rgba(56, 229, 255, 0.55)" },
  covers_unscored: { color: "rgba(56, 229, 255, 0.6)", dash: "2 3" }
};

interface CanvasProps {
  field: SyntxFieldModel;
  mode: SyntxMotionMode;
  t: SyntxCopy;
  onObserve(next: SyntxObservation): void;
}

function FieldCanvas({ field, mode, t, onObserve }: CanvasProps) {
  const { size, center } = SYNTX_LAYOUT;
  const { camera, observation } = field;
  const tx = Math.round((center - camera.scale * camera.x) * 100) / 100;
  const ty = Math.round((center - camera.scale * camera.y) * 100) / 100;
  const observedRole = observation.roleId === null ? null : field.roles.find(role => role.id === observation.roleId) ?? null;
  const key = (handler: () => void) => (event: React.KeyboardEvent) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); handler(); } };
  const inspectTrace = (trace: SyntxTrace) => onObserve({ kind: "REQUIREMENT", organizationId: observation.organizationId, roleId: trace.roleId, requirementId: trace.requirementId, apertureSignId: trace.sign.id });
  const inspectOpen = (requirement: SyntxRequirement) => requirement.openBoundary !== null && onObserve({ kind: "REQUIREMENT", organizationId: observation.organizationId, roleId: requirement.roleId, requirementId: requirement.id, apertureSignId: requirement.openBoundary.id });
  const labelScale = 1 / Math.max(1, camera.scale * 0.72);
  return (
    <svg data-testid="syntx-canvas" data-motion-mode={mode} data-camera-scale={camera.scale} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }} onClick={() => onObserve(returnFrom(observation))}>
      <defs>
        <radialGradient id="sxField"><stop offset="0%" stopColor="rgba(56, 229, 255, 0.05)" /><stop offset="72%" stopColor="rgba(56, 229, 255, 0.012)" /><stop offset="100%" stopColor="rgba(3, 5, 8, 0)" /></radialGradient>
      </defs>
      <g data-sx-camera style={{ transform: `translate(${tx}px, ${ty}px) scale(${camera.scale})`, transformOrigin: "0 0" }}>
        {/* The pool: the total field, a faint boundary that contains every organization. */}
        <g data-testid="syntx-pool" {...signAttributes(field.pool.sign)} style={{ opacity: recedeOpacity(field.pool.sign, 0.5), pointerEvents: "none" }}>
          <circle cx={center} cy={center} r={480} fill="url(#sxField)" />
          <circle cx={center} cy={center} r={476} fill="none" stroke="rgba(56, 229, 255, 0.14)" strokeDasharray="2 7" />
        </g>

        {/* Organizations: named regions; roles are visibly contained. */}
        {field.organizations.map(organization => {
          const selected = organization.sign.state === "organization_selected";
          const lines = wrapLines(organization.name, 22, 2);
          return (
            <g
              key={organization.id}
              data-testid={`syntx-organization-${organization.id}`}
              data-role-count={organization.roleIds.length}
              {...signAttributes(organization.sign)}
              role="button"
              tabIndex={observation.kind === "FIELD" || observation.kind === "ORGANIZATION" ? 0 : -1}
              aria-label={organization.name}
              aria-pressed={selected}
              onClick={event => { event.stopPropagation(); onObserve(observeOrganization(observation, organization.id)); }}
              onKeyDown={key(() => onObserve(observeOrganization(observation, organization.id)))}
              style={{ cursor: "pointer", opacity: observedRole !== null && organization.sign.state === "field" ? 0.38 : recedeOpacity(organization.sign, observation.kind === "ORGANIZATION" ? 0.28 : 0.18) }}
            >
              <circle cx={organization.x} cy={organization.y} r={organization.radius} fill={selected ? "rgba(56, 229, 255, 0.06)" : "rgba(56, 229, 255, 0.035)"} stroke={selected ? "rgba(56, 229, 255, 0.7)" : "rgba(56, 229, 255, 0.26)"} strokeWidth={selected ? 1.4 : 1} style={{ transition: "stroke .4s ease, fill .4s ease" }} />
              {!(observedRole !== null && organization.sign.state === "field") && <SvgLabel lines={lines} x={organization.x} y={organization.y - organization.radius - 10 - (lines.length - 1) * 15} size={13} fill={selected ? INK : INK_SOFT} weight={600} family={MONO} spacing={1.4} />}
            </g>
          );
        })}

        {/* Roles: readable carriers with their requirement density; a selected role becomes the centre of its constraint ecology. */}
        {field.roles.map(role => {
          const selected = role.sign.state === "role_selected";
          const inEcology = observedRole !== null && observedRole.id === role.id;
          const lines = wrapLines(role.title, 17, 3);
          const ticks = Math.min(14, role.requirementCount);
          const region = field.organizations.find(organization => organization.id === role.organizationId)!;
          const siblings = region.roleIds.length;
          // The label sits outward from the region centre (readable, never colliding with a sibling's label); a single role reads below its body.
          const ox = siblings > 1 ? role.x - region.x : 0;
          const oy = siblings > 1 ? role.y - region.y : 1;
          const norm = Math.hypot(ox, oy) || 1;
          const ux = ox / norm;
          const uy = oy / norm;
          const labelAnchor: "middle" | "start" | "end" = Math.abs(ux) < 0.35 ? "middle" : ux > 0 ? "start" : "end";
          const labelX = role.x + ux * (role.radius + 12);
          const labelY = role.y + uy * (role.radius + 12) + (Math.abs(ux) < 0.35 ? (uy > 0 ? 12 : -(lines.length - 1) * 14.75 - 4) : -(lines.length - 1) * 7.4 + 4);
          const labelHidden = observedRole !== null && !inEcology;
          return (
            <g
              key={role.id}
              data-testid={`syntx-role-${role.id}`}
              data-requirement-count={role.requirementCount}
              data-matching-read={role.matching === null ? "false" : "true"}
              {...signAttributes(role.sign)}
              role="button"
              tabIndex={role.sign.state === "receded" ? -1 : 0}
              aria-label={`${role.title} · ${role.organizationName}`}
              aria-pressed={selected}
              onClick={event => { event.stopPropagation(); onObserve(observeRole(observation, role.organizationId, role.id)); }}
              onKeyDown={key(() => onObserve(observeRole(observation, role.organizationId, role.id)))}
              style={{ cursor: "pointer", opacity: recedeOpacity(role.sign, inEcology ? 1 : 0.2) }}
            >
              {(() => {
                // The hit area covers body and label together, so the carrier's bounding-box centre is always a hit (keyboard, pointer, automation alike).
                const labelWidth = labelHidden || inEcology ? 0 : Math.max(...lines.map(line => line.length)) * 6.9;
                const labelLeft = labelAnchor === "start" ? labelX : labelAnchor === "end" ? labelX - labelWidth : labelX - labelWidth / 2;
                const labelTop = labelY - 12.5;
                const labelBottom = labelY + (lines.length - 1) * 14.75 + 4;
                const left = Math.min(role.x - role.radius - 6, labelWidth > 0 ? labelLeft : Infinity);
                const right = Math.max(role.x + role.radius + 6, labelWidth > 0 ? labelLeft + labelWidth : -Infinity);
                const top = Math.min(role.y - role.radius - 6, labelWidth > 0 ? labelTop : Infinity);
                const bottom = Math.max(role.y + role.radius + 6, labelWidth > 0 ? labelBottom : -Infinity);
                return <rect data-sx-hit x={left} y={top} width={right - left} height={bottom - top} fill="transparent" />;
              })()}
              <circle cx={role.x} cy={role.y} r={role.radius} fill={selected || inEcology ? "rgba(56, 229, 255, 0.12)" : "rgba(56, 229, 255, 0.06)"} stroke={selected || inEcology ? CYAN : "rgba(56, 229, 255, 0.55)"} strokeWidth={selected || inEcology ? 1.3 : 1} style={{ transition: "stroke .4s ease, fill .4s ease" }} />
              {Array.from({ length: ticks }, (_, index) => {
                const angle = (index / ticks) * 360;
                const radians = ((angle - 90) * Math.PI) / 180;
                return <line key={index} x1={role.x + (role.radius + 3) * Math.cos(radians)} y1={role.y + (role.radius + 3) * Math.sin(radians)} x2={role.x + (role.radius + 7) * Math.cos(radians)} y2={role.y + (role.radius + 7) * Math.sin(radians)} stroke="rgba(56, 229, 255, 0.5)" strokeWidth={1} />;
              })}
              {!inEcology && !labelHidden && <SvgLabel lines={lines} x={labelX} y={labelY} size={12.5} fill={INK} weight={600} anchor={labelAnchor} />}
              {inEcology && <SvgLabel lines={wrapLines(role.title, 15, 3)} x={role.x} y={role.y - 4 - (wrapLines(role.title, 15, 3).length - 1) * 5.5} size={8.5} fill={INK} weight={700} />}
            </g>
          );
        })}

        {/* The role ecology: suspended boundary, source carriers, traces, anchors and open boundaries. */}
        {observedRole !== null && (
          <g data-testid="syntx-ecology" data-role-id={observedRole.id}>
            {field.pendingBoundary !== null && (
              <g
                data-testid={`syntx-pending-${observedRole.id}`}
                {...signAttributes(field.pendingBoundary.sign)}
                role="button"
                tabIndex={0}
                aria-label={t.relation.pending_evaluation}
                onClick={event => { event.stopPropagation(); onObserve(inspectSign(observation, field.pendingBoundary!.sign.id)); }}
                onKeyDown={key(() => onObserve(inspectSign(observation, field.pendingBoundary!.sign.id)))}
                style={{ cursor: "pointer", opacity: recedeOpacity(field.pendingBoundary.sign, 0.45) }}
              >
                <circle data-sx-hit cx={observedRole.x} cy={observedRole.y} r={field.pendingBoundary.radius} fill="none" stroke="transparent" strokeWidth={14} style={{ pointerEvents: "stroke" }} />
                <circle cx={observedRole.x} cy={observedRole.y} r={field.pendingBoundary.radius} fill="none" stroke="rgba(230, 241, 248, 0.32)" strokeWidth={0.9} strokeDasharray="5 7" style={{ pointerEvents: "none", animation: mode === "LIVE" ? "sxSuspend 48s linear infinite" : undefined }} />
              </g>
            )}
            {field.sources.map(source => {
              const lines = source.title !== null ? wrapLines(source.title, 20, 2) : [t.source];
              return (
                <g key={source.docId} data-testid={`syntx-source-${source.docId}`} data-source-title-state={source.titleState} data-trace-count={source.traceCount} {...signAttributes(source.sign)} style={{ opacity: recedeOpacity(source.sign, 0.18) }}>
                  <rect x={source.x - 9} y={source.y - 9} width={18} height={18} rx={3} fill="rgba(3, 5, 8, 0.9)" stroke={source.sign.relation === "covers_unscored" ? "rgba(56, 229, 255, 0.55)" : "rgba(56, 229, 255, 0.8)"} strokeWidth={0.9} strokeDasharray={source.sign.relation === "covers_unscored" ? "2 2" : undefined} />
                  <SvgLabel lines={lines} x={source.x} y={source.y + 22} size={7.5 * (1 + labelScale) / 2 + 3} fill={source.title !== null ? INK_SOFT : MUTED} weight={500} family={MONO} />
                </g>
              );
            })}
            {field.requirements.map(requirement => requirement.traces.map(trace => {
              const source = field.sources[trace.sourceDocIndex];
              const stroke = TRACE_STROKE[trace.kind];
              const inspectable = trace.sign.state === "inspectable";
              const x2 = source?.x ?? requirement.x;
              const y2 = source?.y ?? requirement.y;
              return (
                <g
                  key={trace.sign.id}
                  data-testid={`syntx-trace-${trace.sign.id}`}
                  {...signAttributes(trace.sign)}
                  role="button"
                  tabIndex={receded(trace.sign) ? -1 : 0}
                  aria-label={`${t.relation[trace.kind]} · ${requirement.name}`}
                  onClick={event => { event.stopPropagation(); inspectTrace(trace); }}
                  onKeyDown={key(() => inspectTrace(trace))}
                  style={{ cursor: "pointer", opacity: recedeOpacity(trace.sign, 0.12) }}
                >
                  <line data-sx-hit x1={requirement.x} y1={requirement.y} x2={x2} y2={y2} stroke="transparent" strokeWidth={10} />
                  <line x1={requirement.x} y1={requirement.y} x2={x2} y2={y2} stroke={stroke.color} strokeWidth={trace.weight * (inspectable ? 1.4 : 1)} strokeDasharray={stroke.dash} strokeLinecap="round" style={{ pointerEvents: "none" }} />
                </g>
              );
            }))}
            {field.requirements.map(requirement => {
              const shape = SUPPORT_SHAPE[requirement.support];
              const selected = requirement.sign.state === "requirement_selected";
              const lines = wrapLines(requirement.name, 16, 3);
              const radians = ((requirement.angle - 90) * Math.PI) / 180;
              const outward = Math.cos(radians);
              const anchorText = Math.abs(outward) < 0.3 ? "middle" : outward > 0 ? "start" : "end";
              const labelX = requirement.x + Math.cos(radians) * 12;
              const labelY = requirement.y + Math.sin(radians) * 12 + (Math.abs(outward) < 0.3 ? (Math.sin(radians) > 0 ? 10 : -(lines.length - 1) * 10 - 2) : 3);
              return (
                <g key={requirement.id} data-testid={`syntx-requirement-${requirement.id}`} data-support={requirement.support} data-evaluation-state={requirement.evaluationState ?? ""} data-trace-count={requirement.traces.length} data-role-id={requirement.roleId}>
                  <g
                    {...signAttributes(requirement.sign)}
                    role="button"
                    tabIndex={receded(requirement.sign) ? -1 : 0}
                    aria-label={`${requirement.name} · ${t.support[requirement.support]}`}
                    aria-pressed={selected}
                    onClick={event => { event.stopPropagation(); onObserve(observeRequirement(observation, requirement.id)); }}
                    onKeyDown={key(() => onObserve(observeRequirement(observation, requirement.id)))}
                    style={{ cursor: "pointer", opacity: recedeOpacity(requirement.sign, 0.22) }}
                  >
                    <rect data-sx-hit x={Math.min(requirement.x - shape.r - 3, anchorText === "end" ? labelX - Math.max(...lines.map(line => line.length)) * 4.4 : anchorText === "middle" ? labelX - Math.max(...lines.map(line => line.length)) * 2.2 : requirement.x - shape.r - 3)} y={Math.min(requirement.y - shape.r - 3, labelY - 8)} width={Math.max(...lines.map(line => line.length)) * 4.4 + shape.r * 2 + 18} height={Math.max(shape.r * 2 + 6, Math.abs(labelY - requirement.y) + lines.length * 9.5 + 10)} fill="transparent" />
                    <circle cx={requirement.x} cy={requirement.y} r={selected ? shape.r + 1.5 : shape.r} fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeWidth} strokeDasharray={shape.dash} style={{ transition: "r .25s ease" }} />
                    {selected && <circle cx={requirement.x} cy={requirement.y} r={shape.r + 7} fill="none" stroke="rgba(56, 229, 255, 0.45)" strokeWidth={0.6} />}
                    <SvgLabel lines={lines} x={labelX} y={labelY} size={7.8} fill={selected ? INK : INK_SOFT} weight={600} anchor={anchorText} />
                  </g>
                  {requirement.openBoundary !== null && (
                    <g
                      data-testid={`syntx-open-${requirement.id}`}
                      {...signAttributes(requirement.openBoundary)}
                      role="button"
                      tabIndex={receded(requirement.openBoundary) ? -1 : 0}
                      aria-label={`${t.relation.missing_support} · ${requirement.name}`}
                      onClick={event => { event.stopPropagation(); inspectOpen(requirement); }}
                      onKeyDown={key(() => inspectOpen(requirement))}
                      style={{ cursor: "pointer", opacity: recedeOpacity(requirement.openBoundary, 0.2) }}
                    >
                      <circle data-sx-hit cx={requirement.x} cy={requirement.y} r={shape.r + 4} fill="none" stroke="transparent" strokeWidth={9} style={{ pointerEvents: "stroke" }} />
                      <path d={openArc(requirement.x, requirement.y, shape.r + 4, requirement.angle)} fill="none" stroke={NEUTRAL} strokeWidth={1} strokeLinecap="round" style={{ pointerEvents: "none" }} />
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        )}
      </g>
    </svg>
  );
}

function Aperture({ aperture, field, t, onClose }: { aperture: SyntxAperture; field: SyntxFieldModel; t: SyntxCopy; onClose(): void }) {
  const { camera } = field;
  const inspected = aperture.inspects;
  const anchor = inspected.kind === "pending" ? field.roles.find(role => role.id === inspected.boundary.roleId) ?? null : null;
  const target = aperture.requirement ?? anchor;
  const observedRole = field.roles.find(role => role.id === field.observation.roleId) ?? null;
  const x = target?.x ?? observedRole?.x ?? SYNTX_LAYOUT.center;
  const y = target?.y ?? observedRole?.y ?? SYNTX_LAYOUT.center;
  const stageX = ((camera.scale * (x - camera.x) + SYNTX_LAYOUT.center) / SYNTX_LAYOUT.size) * 100;
  const stageY = ((camera.scale * (y - camera.y) + SYNTX_LAYOUT.center) / SYNTX_LAYOUT.size) * 100;
  const side = stageX > 50 ? "left" : "right";
  const content = aperture.inspects;
  return (
    <aside
      data-testid="syntx-aperture"
      data-aperture-for={aperture.sign.id.replace(/^aperture:/, "")}
      data-aperture-kind={content.kind}
      data-source-title-state={content.kind === "trace" ? content.trace.sourceTitleState : ""}
      {...signAttributes(aperture.sign)}
      data-sx-reveal="true"
      role="dialog"
      aria-label={t.inspect}
      style={{ ...lens, position: "absolute", left: side === "right" ? `calc(${stageX}% + 36px)` : `calc(${stageX}% - 36px)`, top: `${Math.min(88, Math.max(12, stageY))}%`, transform: side === "right" ? "translateY(-50%)" : "translate(-100%, -50%)", width: "min(360px, 46%)", maxHeight: "80%", overflowY: "auto", zIndex: 5, ...stack(8) }}
      onClick={event => event.stopPropagation()}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "10px" }}>
        <span style={label}>{aperture.requirement !== null ? aperture.requirement.name : observedRole?.title ?? ""}</span>
        <button data-testid="syntx-aperture-close" onClick={onClose} style={action("muted")}>{t.close}</button>
      </div>
      {content.kind === "trace" && (
        <div style={stack(8)}>
          <span style={{ ...word(CYAN), whiteSpace: "normal" }}>{t.relation[content.trace.kind]}</span>
          <p data-testid="syntx-aperture-quote" style={{ ...prose, fontStyle: "italic", color: INK, paddingLeft: "10px", borderLeft: `1px ${content.trace.kind === "covers_unscored" ? "dashed" : "solid"} rgba(56, 229, 255, 0.5)` }}>“{content.trace.quote}”</p>
          <span data-testid="syntx-aperture-source" data-source-title-state={content.trace.sourceTitleState} style={micro}>
            {t.source}: <span style={{ color: INK }}>{content.trace.sourceTitle ?? (content.trace.sourceTitleState === "NOT_READ" ? t.sourceNotRead : t.sourceUnresolved)}</span>
            {content.trace.location !== null && <> · {t.location} <span style={{ color: INK }}>{content.trace.location}</span></>}
          </span>
          <span style={micro}>{t.capabilityReference}: <span style={{ color: INK }}>{content.trace.capabilityName}</span>{content.trace.matchedConstituent !== null ? ` · ${t.constituent} ${content.trace.matchedConstituent}` : ""} · {t.basis} {content.trace.basis}</span>
          {content.trace.contribution !== null && content.trace.confidence !== null && (
            <span data-testid="syntx-aperture-contribution" style={micro}>{t.contribution} <span style={{ color: INK }}>{content.trace.contribution}</span> · {t.confidence} <span style={{ color: INK }}>{content.trace.confidence}</span>{aperture.requirement?.weight !== null && aperture.requirement?.weight !== undefined ? ` · ${t.weight} ${aperture.requirement.weight}` : ""}</span>
          )}
          {content.trace.kind === "covers_unscored" && <span data-testid="syntx-aperture-sweep-status" data-scored="false" style={{ ...micro, color: "rgba(56, 229, 255, 0.8)" }}>{t.sweepStatus}</span>}
          <p style={{ ...prose, fontSize: "11.5px" }}>{content.trace.kind === "supports" ? t.texts.scored : content.trace.kind === "weakly_supports" ? t.texts.weak : t.texts.sweep}</p>
          {content.trace.weakReason !== null && <span style={{ ...micro, color: AMBER }}>{content.trace.weakReason}</span>}
        </div>
      )}
      {content.kind === "open" && (
        <div style={stack(6)}>
          <span style={{ ...word(NEUTRAL), whiteSpace: "normal" }}>{t.relation.missing_support}</span>
          <p data-testid="syntx-aperture-open-text" style={prose}>{t.texts.missing}</p>
          {content.requirement.evidenceHint !== null && <span style={micro}>{t.hint}: {content.requirement.evidenceHint}</span>}
          <span style={micro}>{content.requirement.necessity ?? ""}{content.requirement.weight !== null ? ` · ${t.weight} ${content.requirement.weight}` : ""}{content.requirement.requiredLevel !== null ? ` · ${t.level} ${content.requirement.requiredLevel}` : ""}</span>
        </div>
      )}
      {content.kind === "pending" && (
        <div style={stack(6)}>
          <span style={{ ...word(NEUTRAL), whiteSpace: "normal" }}>{t.relation.pending_evaluation}</span>
          <p data-testid="syntx-aperture-pending-text" style={prose}>{t.texts.pending}</p>
          <span style={micro}>{content.boundary.targetRoleProfileRevisionId} · {content.boundary.targetRequirementRevisionIds.length} TRQREV</span>
          {observedRole?.matching && <span data-testid="syntx-aperture-resonance" data-resonance-score={observedRole.matching.resonanceScore} style={micro}>{t.resonance} <span style={{ color: INK }}>{percent(observedRole.matching.resonanceScore)}</span> · {t.rank} #{observedRole.matching.deliveredRank}</span>}
        </div>
      )}
      <span data-testid="syntx-aperture-authority" style={{ ...micro, color: AMBER, fontSize: "10.5px", lineHeight: 1.5 }}>{t.authority}</span>
    </aside>
  );
}

export function SyntxField({ workflow, analysisSource, observation: requested, onObserve, onSelectPool, onExit, locale = SIL_COPY.defaultLocale }: SyntxFieldProps) {
  const t = SIL_COPY[locale].syntx;
  const tp: PoolCopy = SIL_COPY[locale].jobPool;
  const mode = useMotionMode();
  const rootRef = useRef<HTMLElement | null>(null);
  const state = describeSyntxFieldState(workflow, analysisSource);
  const view = workflow.view.state === "AVAILABLE" ? workflow.view.upload : null;
  const matching = workflow.matches.state === "AVAILABLE" ? workflow.matches.matches : null;
  const analysisId = matching?.analysisId ?? null;
  const sourcesState = useAnalysisSources(analysisId);
  const sources = sourcesState.state === "AVAILABLE" ? sourcesState.sources : null;
  const field = useMemo(() => deriveSyntxField(view, matching, sources, requested), [view, matching, sources, requested]);
  const resolution = useMemo(() => resolveObservation(view, requested), [view, requested]);
  const observation = field?.observation ?? resolution.observation;
  const listed = workflow.pools.state === "AVAILABLE" ? workflow.pools.jobPools : [];
  const selection = describeSelection(workflow.selectedJobPoolUploadId, listed);
  const [poolsOpen, setPoolsOpen] = useState(false);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [boundaryOpen, setBoundaryOpen] = useState(false);
  const [actorId, setActorId] = useState("JOB_POOL_UPLOADER_LOCAL");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileText, setFileText] = useState<string | null>(null);
  const canUpload = fileText !== null && workflow.upload.state !== "SUBMITTING";
  const poolsVisible = selection.kind === "NONE" || poolsOpen;
  const intakeVisible = intakeOpen;
  const summary = field === null ? null : summarySentence(field.summary, t.summary);
  const observationId = observation.kind === "FIELD" ? (field?.pool.jobPoolUploadId ?? workflow.selectedJobPoolUploadId ?? "") : observation.kind === "ORGANIZATION" ? observation.organizationId ?? "" : observation.kind === "ROLE" ? observation.roleId ?? "" : observation.requirementId ?? "";

  const onFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) { setFileName(null); setFileText(null); return; }
    setFileName(file.name);
    setFileText(await file.text());
  };

  /** Escape returns one level (R8); with an edge lens open it closes that first. */
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    if (intakeOpen) { setIntakeOpen(false); return; }
    if (boundaryOpen) { setBoundaryOpen(false); return; }
    if (poolsOpen && selection.kind !== "NONE") { setPoolsOpen(false); return; }
    if (observation.kind !== "FIELD") onObserve(returnFrom(observation));
  };

  const path: Array<{ kind: SyntxObservation["kind"]; name: string; target: SyntxObservation }> = [];
  if (field !== null) {
    path.push({ kind: "FIELD", name: field.pool.poolName, target: { kind: "FIELD", organizationId: null, roleId: null, requirementId: null, apertureSignId: null } });
    const organization = observation.organizationId === null ? null : field.organizations.find(item => item.id === observation.organizationId) ?? null;
    const role = observation.roleId === null ? null : field.roles.find(item => item.id === observation.roleId) ?? null;
    const requirement = observation.kind === "REQUIREMENT" ? field.requirements.find(item => item.id === observation.requirementId) ?? null : null;
    if (observation.kind !== "FIELD" && organization !== null) path.push({ kind: "ORGANIZATION", name: organization.name, target: { kind: "ORGANIZATION", organizationId: organization.id, roleId: null, requirementId: null, apertureSignId: null } });
    if ((observation.kind === "ROLE" || observation.kind === "REQUIREMENT") && role !== null) path.push({ kind: "ROLE", name: role.title, target: { kind: "ROLE", organizationId: role.organizationId, roleId: role.id, requirementId: null, apertureSignId: null } });
    if (observation.kind === "REQUIREMENT" && requirement !== null && role !== null) path.push({ kind: "REQUIREMENT", name: requirement.name, target: { kind: "REQUIREMENT", organizationId: role.organizationId, roleId: role.id, requirementId: requirement.id, apertureSignId: null } });
  }

  return (
    <section
      ref={rootRef}
      data-testid="syntx-field"
      data-field-grammar={SYNTX_FIELD_GRAMMAR}
      data-observation-kind={observation.kind}
      data-observation-id={observationId}
      data-aperture-open={field?.aperture ? "true" : "false"}
      data-motion-mode={mode}
      data-field-state={state}
      data-pool-id={workflow.selectedJobPoolUploadId ?? ""}
      data-analysis-id={analysisSource.kind === "NONE" ? "" : analysisSource.analysisId}
      data-analysis-source={analysisSource.kind}
      data-pools-state={workflow.pools.state}
      data-upload-state={workflow.upload.state}
      data-selection-kind={selection.kind}
      data-selected-pool={workflow.selectedJobPoolUploadId ?? ""}
      data-view-state={workflow.view.state}
      data-matches-state={workflow.matches.state}
      data-sources-state={sourcesState.state}
      data-matching-delivered={field?.matchingDelivered ? "true" : "false"}
      data-sign-count={field?.signs.length ?? 0}
      data-organization-count={field?.organizations.length ?? 0}
      data-role-count={field?.roles.length ?? 0}
      data-requirement-count={field?.requirements.length ?? 0}
      data-pools-visible={poolsVisible ? "true" : "false"}
      data-intake-visible={intakeVisible ? "true" : "false"}
      data-boundary-visible={boundaryOpen ? "true" : "false"}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      style={{ position: "absolute", inset: 0, zIndex: 45, backgroundColor: "rgba(3, 5, 8, 0.9)", backdropFilter: "blur(8px)", fontFamily: MONO, color: INK, outline: "none", animation: mode === "LIVE" ? "sxEnter 620ms ease-out both" : undefined }}
    >
      <style>{SYNTX_CSS}</style>

      {/* BR-4: the screen-reader summary of the observation point, generated from the same view model as the signs. */}
      <p data-testid="syntx-summary" data-summary-for={observationId} aria-live="polite" style={visuallyHidden}>{summary ?? ""}</p>

      {/* The stage: field and apertures share one coordinate space. */}
      <div data-testid="syntx-stage" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "min(90vh, 62vw, 820px)", height: "min(90vh, 62vw, 820px)" }}>
        {field !== null && <FieldCanvas field={field} mode={mode} t={t} onObserve={onObserve} />}
        {field !== null && field.aperture !== null && <Aperture aperture={field.aperture} field={field} t={t} onClose={() => onObserve(returnFrom(observation))} />}
        {resolution.stale !== null && <span data-testid="syntx-stale" data-stale-kind={resolution.stale.kind} data-stale-id={resolution.stale.id} data-sx-reveal="true" style={{ ...lens, ...prose, color: AMBER, position: "absolute", left: "50%", top: "calc(50% + 120px)", transform: "translateX(-50%)", width: "min(320px, 40%)", textAlign: "center", zIndex: 3 }}>{t.stale[resolution.stale.kind]}</span>}
        {state === "NO_POOL" && <span data-testid="syntx-no-pool" data-sx-reveal="true" style={{ ...prose, position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: "min(360px, 60%)", textAlign: "center", zIndex: 3 }}>{t.noPool}</span>}
        {state === "NO_ANALYSIS" && field !== null && <span data-testid="syntx-no-analysis" style={{ ...micro, color: AMBER, position: "absolute", left: "50%", bottom: "-6px", transform: "translateX(-50%)", width: "min(520px, 80%)", textAlign: "center", zIndex: 3 }}>{tp.analysisNone}</span>}
      </div>

      {/* Orientation line: title, exit, the observation path (each step a return), the read state. Never a panel. */}
      <div data-sx-surface="header" style={{ position: "absolute", left: "28px", top: "136px", ...stack(6), zIndex: 46, maxWidth: "min(340px, 28vw)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "14px", flexWrap: "wrap" }}>
          <h3 style={{ ...label, color: CYAN, fontSize: "10px", letterSpacing: "2.4px", textShadow: `0 0 14px ${SIL_TOKENS.colors.cyanGlowStrong}` }}>{t.title}</h3>
          <button data-testid="syntx-exit-btn" onClick={onExit} style={action("muted")}>{t.exit}</button>
        </div>
        <nav data-testid="syntx-path" aria-label={t.observation[observation.kind]} style={{ ...row(6), rowGap: "2px" }}>
          {path.map((step, index) => (
            <React.Fragment key={step.kind}>
              {index > 0 && <span aria-hidden="true" style={{ ...micro, opacity: 0.5 }}>›</span>}
              <button data-testid={`syntx-path-${step.kind}`} data-current={index === path.length - 1 ? "true" : "false"} disabled={index === path.length - 1} onClick={() => onObserve(step.target)} style={{ ...ghost, fontSize: "8.5px", color: index === path.length - 1 ? INK : MUTED, cursor: index === path.length - 1 ? "default" : "pointer", textTransform: "none", letterSpacing: "0.4px", padding: "2px 0", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{step.name}</button>
            </React.Fragment>
          ))}
          {observation.kind !== "FIELD" && <button data-testid="syntx-return-btn" onClick={() => onObserve(returnFrom(observation))} style={{ ...action("cyan"), fontSize: "8.5px" }}>← {t.returnLabel}</button>}
        </nav>
        <span data-testid="syntx-state" data-state={state} style={{ ...micro, display: "inline-flex", alignItems: "center", gap: "8px", color: state === "AVAILABLE" ? MUTED : AMBER }}>
          <span aria-hidden="true" style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: state === "AVAILABLE" ? CYAN : AMBER, flexShrink: 0 }} />
          {state === "AVAILABLE" ? t.matching : state === "NO_POOL" ? tp.selectionNone : state === "NO_ANALYSIS" ? tp.analysisNone : state === "LOADING" ? tp.matchesLoading : state === "NOT_FOUND" ? tp.matchesNotFound : state === "INACTIVE_POOL" ? tp.matchesInactive : state === "NOT_PROVISIONED" ? tp.notProvisioned : tp.matchesFailed}
        </span>
        <span style={{ ...micro, opacity: 0.7 }}>{t.keys}</span>
        <div style={row(14)}>
          <button data-testid="syntx-pools-toggle" aria-expanded={poolsVisible} onClick={() => setPoolsOpen(value => !value)} style={{ ...ghost, fontSize: "9px" }}>{poolsVisible ? t.poolsHide : `⬡ ${t.pools}${listed.length > 0 ? ` · ${listed.length}` : ""}`}</button>
          <button data-testid="job-pool-intake-toggle" aria-expanded={intakeVisible} onClick={() => setIntakeOpen(value => !value)} style={{ ...ghost, fontSize: "9px" }}>{intakeVisible ? tp.intakeHide : tp.intakeOpen}</button>
          {field !== null && field.boundary !== null && <button data-testid="syntx-boundary-toggle" aria-expanded={boundaryOpen} onClick={() => setBoundaryOpen(value => !value)} style={{ ...ghost, fontSize: "9px" }}>{boundaryOpen ? t.boundaryHide : t.boundary}</button>}
        </div>
      </div>

      {/* Edge aperture: the persisted uploads (explicit selection only); the contextual action while nothing is at the field. */}
      <div data-testid="job-pool-list" data-pool-count={listed.length} data-list-state={workflow.pools.state} hidden={!poolsVisible} data-sx-reveal={poolsVisible ? "true" : undefined} data-sx-surface="pools" style={{ ...lens, display: poolsVisible ? "flex" : "none", flexDirection: "column", gap: "8px", position: "absolute", left: "28px", top: "300px", width: "min(300px, 26vw)", maxHeight: "calc(100vh - 420px)", overflowY: "auto", zIndex: 46 }}>
        <span style={label}>{tp.pools}</span>
        {(workflow.pools.state === "IDLE" || workflow.pools.state === "LOADING") && <span data-testid="job-pool-list-loading" style={{ ...micro, color: AMBER }}>{tp.poolsLoading}</span>}
        {workflow.pools.state === "EMPTY" && <span data-testid="job-pool-list-empty" style={micro}>{tp.poolsEmpty}</span>}
        {workflow.pools.state === "NOT_PROVISIONED" && <span data-testid="job-pool-list-not-provisioned" style={{ ...micro, color: AMBER }}>{tp.notProvisioned}</span>}
        {workflow.pools.state === "FAILED" && <span data-testid="job-pool-list-failed" style={{ ...micro, color: AMBER }}>{tp.poolsFailed}{workflow.pools.code ? ` · ${workflow.pools.code}` : ""}</span>}
        {selection.kind === "NOT_LISTED" && <span data-testid="job-pool-selection-not-listed" style={{ ...micro, color: AMBER }}>{tp.selectionNotListed} · {selection.jobPoolUploadId}</span>}
        <ul style={{ margin: 0, padding: 0, listStyle: "none", ...stack(6) }}>
          {listed.map((pool, index) => {
            const selected = pool.jobPoolUploadId === workflow.selectedJobPoolUploadId;
            return (
              <li key={pool.jobPoolUploadId} data-testid={`job-pool-item-${pool.jobPoolUploadId}`} data-selected={selected ? "true" : "false"} data-pool-status={pool.poolStatus} data-delivered-index={index + 1} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "10px", paddingBottom: "6px", borderBottom: "1px solid rgba(99, 120, 138, 0.2)" }}>
                <span style={stack(2)}>
                  <span style={{ fontFamily: SANS, fontSize: "12.5px", fontWeight: 500, color: INK }}>{pool.poolName}</span>
                  <span style={{ ...micro, color: pool.poolStatus === "ACTIVE" ? MUTED : AMBER }}>v{pool.poolVersion} · {pool.poolStatus} · {pool.organizationCount} org · {pool.roleCount} roles · {pool.requirementCount} req</span>
                </span>
                <button data-testid={`job-pool-select-${pool.jobPoolUploadId}`} disabled={selected} aria-pressed={selected} onClick={() => { onSelectPool(pool.jobPoolUploadId); setPoolsOpen(false); }} style={action("cyan", !selected)}>{selected ? tp.selected : tp.select}</button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Edge aperture: intake (the one client write), opened only on explicit action. */}
      <section data-testid="job-pool-upload" hidden={!intakeVisible} data-sx-reveal={intakeVisible ? "true" : undefined} style={{ ...lens, display: intakeVisible ? "flex" : "none", flexDirection: "column", gap: "8px", position: "absolute", right: "28px", top: "136px", width: "min(300px, 26vw)", zIndex: 46 }}>
        <span style={label}>{tp.intake} · {tp.upload}</span>
        <label style={{ ...micro, ...stack(2) }}>{tp.uploader}
          <input data-testid="job-pool-actor-input" value={actorId} onChange={event => setActorId(event.target.value)} style={input} />
        </label>
        <label style={{ ...micro, ...stack(2) }}>{tp.chooseFile}
          <input data-testid="job-pool-file-input" type="file" accept="application/json,.json" onChange={event => { void onFile(event); }} style={{ ...input, fontSize: "9px", color: MUTED }} />
        </label>
        <span data-testid="job-pool-file-name" style={micro}>{fileName ?? tp.noFile}</span>
        <button data-testid="job-pool-upload-btn" disabled={!canUpload} onClick={() => { if (fileText !== null) void workflow.submitUpload(fileText, actorId); }} style={{ ...action("cyan", canUpload), alignSelf: "flex-start" }}>
          {workflow.upload.state === "SUBMITTING" ? tp.submitting : `${tp.submit} →`}
        </button>
        {(workflow.upload.state === "CREATED" || workflow.upload.state === "IDENTICAL_EXISTS") && (
          <div data-testid="job-pool-upload-result" data-upload-outcome={workflow.upload.state} data-upload-id={workflow.upload.upload.jobPoolUploadId} data-sx-reveal="true" style={stack(3)}>
            <span style={{ ...word(SIL_TOKENS.colors.evolutionGreen), whiteSpace: "normal" }}>{workflow.upload.state === "CREATED" ? tp.uploadCreated : tp.uploadIdentical}</span>
            <span style={{ ...micro, color: INK }}>{workflow.upload.upload.jobPoolUploadId}</span>
            <span style={micro}>{workflow.upload.upload.poolName} v{workflow.upload.upload.poolVersion} · {workflow.upload.upload.poolStatus}</span>
            {workflow.selectedJobPoolUploadId !== workflow.upload.upload.jobPoolUploadId && <span style={{ ...micro, color: AMBER }}>{tp.uploadNotSelected}</span>}
          </div>
        )}
        {workflow.upload.state === "REJECTED" && (
          <div data-testid="job-pool-upload-rejected" data-rejection-code={workflow.upload.code} data-rejection-status={workflow.upload.status} data-sx-reveal="true" style={stack(3)}>
            <span style={{ ...micro, color: AMBER }}>{tp.uploadRejected} · HTTP {workflow.upload.status} · {workflow.upload.code}</span>
            <span style={micro}>{workflow.upload.message}</span>
            {workflow.upload.issues.map((issue, index) => <span key={`${issue.path}:${index}`} data-testid="job-pool-upload-issue" style={micro}>{issue.path || "(root)"}: {issue.message}</span>)}
          </div>
        )}
        {workflow.upload.state === "NOT_PROVISIONED" && <span data-testid="job-pool-upload-not-provisioned" style={{ ...micro, color: AMBER }}>{tp.notProvisioned}</span>}
        {workflow.upload.state === "FAILED" && <span data-testid="job-pool-upload-failed" style={{ ...micro, color: AMBER }}>{tp.uploadFailed}{workflow.upload.code ? ` · ${workflow.upload.code}` : ""}</span>}
      </section>

      {/* Edge aperture: the authority boundary of what was read (labels, canonical mapping state, sweep state), opened on demand. */}
      {field !== null && field.boundary !== null && matching !== null && view !== null && (
        <section data-testid="job-pool-matches" data-matches-state={workflow.matches.state} data-ranking={describeRanking(matching.roleMatches)} hidden={!boundaryOpen} data-sx-reveal={boundaryOpen ? "true" : undefined} data-sx-surface="boundary" style={{ ...lens, display: boundaryOpen ? "flex" : "none", flexDirection: "column", gap: "8px", position: "absolute", right: "28px", bottom: "calc(var(--condyn-page-header-height, 60px) + 52px)", width: "min(340px, 28vw)", maxHeight: "50vh", overflowY: "auto", zIndex: 46 }}>
          <span style={label}>{t.boundary}</span>
          <div data-testid="job-pool-presentation-labels" data-policy-version={field.boundary.policyVersion} data-authority-state={field.boundary.authorityState} style={row(10)}>
            {field.boundary.labels.map(item => <span key={item} data-testid={`job-pool-label-${item}`} style={{ ...word(AMBER), whiteSpace: "normal" }}>{tp.labels[item]}</span>)}
          </div>
          <span data-testid="job-pool-ranking" data-ranking={describeRanking(matching.roleMatches)} style={micro}>{tp.ranking[describeRanking(matching.roleMatches)]}</span>
          <div data-testid="job-pool-canonical-mapping" data-mapping-state={view.canonicalMapping.mappingState} data-proposal-state={view.canonicalMapping.proposalState} data-authority-state={view.canonicalMapping.authorityState} style={row(10)}>
            <span style={word(SIL_TOKENS.colors.evolutionGreen)}>{view.canonicalMapping.mappingState}</span><span style={word(AMBER)}>{view.canonicalMapping.proposalState}</span><span style={word(AMBER)}>authority {view.canonicalMapping.authorityState}</span>
          </div>
          <span style={{ ...prose, fontSize: "11px" }}>{tp.canonicalMappingBoundary}</span>
          <div data-testid="job-pool-capability-sweep" data-sweep-state={field.boundary.capabilitySweep.state} data-proposal-count={field.boundary.capabilitySweep.proposalCount} data-scored="false" style={stack(3)}>
            <span style={{ ...micro, color: field.boundary.capabilitySweep.state === "AVAILABLE" ? MUTED : AMBER }}>{tp.sweepStates[field.boundary.capabilitySweep.state]} · {tp.sweepProposals} {field.boundary.capabilitySweep.proposalCount} · <span style={word(AMBER)}>{tp.unscored}</span></span>
            <span style={{ ...prose, fontSize: "11px" }}>{tp.sweepBoundary}</span>
          </div>
          <span style={micro}>{tp.candidateCapabilities} {field.boundary.candidateCapabilityCount} · {tp.weakThreshold} {field.boundary.weakEvidenceThreshold}</span>
          <span style={{ ...prose, fontSize: "11px" }}>{tp.missingBoundary}</span>
        </section>
      )}

      {/* Field-edge semantic line: the laws of the field, always visible, never in the way. */}
      <span data-testid="job-pool-non-claims" style={{ position: "absolute", left: "50%", bottom: "calc(var(--condyn-page-header-height, 60px) + 22px)", transform: "translateX(-50%)", maxWidth: "min(960px, 84vw)", textAlign: "center", ...micro, fontSize: "8.5px", letterSpacing: "1.4px", color: "rgba(230, 241, 248, 0.55)", zIndex: 46 }}>{t.nonClaims}</span>
    </section>
  );
}
