"use client";

import React from "react";
import { SIL_TOKENS } from "./SILTokens";
import { SIL_COPY, type SilLocale } from "../../../../lib/career/view-model/sil-language";
import type { AnalysisPickerState } from "../../../../lib/career/ui/analysis-picker";

/**
 * D-PICK (UX-05): the existing investigations of the selected role in PERSON × JOB, read only when opened (GET, newest 25) and
 * offered only when their own persisted boundary is this mode and exactly this job. Each shows what the reads deliver — id, time,
 * validation, mode, the bound job (titles of the selected job, identities from the candidate's own boundary) — and nothing else:
 * no model claim, no rating, no order but time. Only the explicit OPEN chooses; nothing is chosen by itself, also not one alone.
 */
const MONO = SIL_TOKENS.typography.mono;
const SANS = SIL_TOKENS.typography.sans;
const CYAN_RGB = "56, 229, 255";
const AMBER_RGB = "245, 196, 107";

const meta: React.CSSProperties = { fontFamily: MONO, fontSize: "11px", lineHeight: 1.55, letterSpacing: "0.3px", color: "rgba(176, 200, 216, 0.9)", wordBreak: "break-word" };
const action = (on: boolean): React.CSSProperties => ({ alignSelf: "flex-start", padding: "5px 12px", borderRadius: "999px", border: `1px solid rgba(${CYAN_RGB}, ${on ? 0.6 : 0.45})`, background: `rgba(${CYAN_RGB}, ${on ? 0.12 : 0.06})`, color: SIL_TOKENS.colors.cyanActive, fontFamily: MONO, fontSize: "11px", fontWeight: 700, letterSpacing: "1.2px", cursor: "pointer", textAlign: "left" });

/** createdAt as delivered, written in UTC to the minute (no locale-dependent reformatting). */
export function pickerTime(createdAt: string, utc: string): string {
  const at = new Date(createdAt);
  return Number.isNaN(at.getTime()) ? createdAt : `${at.toISOString().slice(0, 16).replace("T", " ")} ${utc}`;
}

export interface AnalysisPickerProps {
  state: AnalysisPickerState;
  open: boolean;
  onToggle: () => void;
  onPick: (analysisId: string) => void;
  locale: SilLocale;
  /** The selected job's titles (from its validation): the job every offered candidate is bound to. */
  job: { poolName: string | null; roleTitle: string } | null;
  /** The analysis already on view, if any: listed, not chosen again. */
  onViewAnalysisId?: string | null;
  /** Where it stands (first screen or the Job Field's role view): only a test id prefix and the list's height differ. */
  place: "first-screen" | "role-view";
}

export function AnalysisPicker({ state, open, onToggle, onPick, locale, job, onViewAnalysisId = null, place }: AnalysisPickerProps) {
  const copy = SIL_COPY[locale];
  const c = copy.pxjFirst.picker;
  const modes = copy.syntx.investigation.modes;
  return (
    <div data-testid="analysis-picker" data-picker-place={place} data-picker-open={open ? "true" : "false"} data-picker-state={open ? state.state : "CLOSED"} style={{ display: "flex", flexDirection: "column", gap: "8px", alignSelf: "stretch", minWidth: 0 }}>
      <button type="button" data-testid="analysis-picker-toggle" aria-expanded={open} onClick={onToggle} style={action(open)}>{open ? c.close : c.open}</button>
      {open && (
        <section aria-label={c.title} style={{ display: "flex", flexDirection: "column", gap: "7px", padding: "9px 10px", borderRadius: "10px", border: `1px solid rgba(${CYAN_RGB}, 0.18)`, background: "rgba(4, 12, 21, 0.62)", maxHeight: place === "role-view" ? "min(320px, 40vh)" : "none", overflowY: place === "role-view" ? "auto" : "visible" }}>
          <span style={{ fontFamily: MONO, fontSize: "11px", fontWeight: 700, letterSpacing: "1.6px", color: "rgba(160, 232, 250, 0.92)" }}>{c.title}</span>
          {(state.state === "IDLE" || state.state === "LOADING") && <span data-testid="analysis-picker-loading" role="status" style={{ ...meta, color: `rgb(${CYAN_RGB})` }}>{c.loading}</span>}
          {state.state === "FAILED" && <span data-testid="analysis-picker-failed" role="status" style={{ ...meta, color: `rgb(${AMBER_RGB})` }}>{c.failed}{state.code ? ` · ${state.code}` : ""}</span>}
          {state.state === "AVAILABLE" && (
            <>
              <span data-testid="analysis-picker-scope" style={meta}>{c.scope(state.considered, state.listed, state.unreadable)}</span>
              {state.candidates.length === 0 && <span data-testid="analysis-picker-empty" role="status" style={{ ...meta, color: "#e6f1f8" }}>{c.empty}</span>}
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
                {state.candidates.map(candidate => {
                  const onView = candidate.analysisId === onViewAnalysisId;
                  return (
                    <li key={candidate.analysisId} data-testid={`analysis-pick-item-${candidate.analysisId}`} data-analysis-id={candidate.analysisId} data-mode={candidate.mode} data-binding-upload={candidate.jobScopeSelection?.jobPoolUploadId ?? ""} data-binding-role={candidate.jobScopeSelection?.poolRoleId ?? ""} data-on-view={onView ? "true" : "false"} style={{ display: "flex", flexDirection: "column", gap: "3px", padding: "8px 10px", borderRadius: "8px", border: `1px solid rgba(${CYAN_RGB}, ${onView ? 0.4 : 0.12})`, background: onView ? `rgba(${CYAN_RGB}, 0.05)` : "transparent", minWidth: 0 }}>
                      <span style={{ fontFamily: MONO, fontSize: "11px", fontWeight: 700, color: "#eef9ff", wordBreak: "break-all" }}>{c.id} {candidate.analysisId}</span>
                      <span style={meta}>{c.time} {pickerTime(candidate.createdAt, c.utc)} · {c.validation} {candidate.validationState} · {c.mode} {modes[candidate.mode]}</span>
                      {job !== null && <span style={{ ...meta, fontFamily: SANS, fontSize: "11.5px", color: "#e6f1f8" }}>{c.job}: {[job.poolName, job.roleTitle].filter(Boolean).join(" · ")}</span>}
                      {candidate.jobScopeSelection !== null && <span style={{ ...meta, wordBreak: "break-all" }}>{c.binding}: {candidate.jobScopeSelection.jobPoolUploadId} · {candidate.jobScopeSelection.poolRoleId}</span>}
                      <button type="button" data-testid={`analysis-pick-${candidate.analysisId}`} disabled={onView} aria-pressed={onView} onClick={() => onPick(candidate.analysisId)} style={{ ...action(onView), marginTop: "3px", cursor: onView ? "default" : "pointer" }}>{onView ? c.onView : c.choose}</button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
      )}
    </div>
  );
}
