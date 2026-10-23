"use client";

import React, { useState } from "react";
import { SIL_TOKENS } from "./SILTokens";
import type { InvestigationMode } from "../../../../lib/career/job-pool/investigation-mode";
import type { JobScope } from "../../../../lib/career/job-pool/job-scope";
import type { PxjFirstScreen as PxjFirstScreenModel, FirstScreenRequirement } from "../../../../lib/career/view-model/pxj-first-screen";
import { SIL_COPY, type SilLocale } from "../../../../lib/career/view-model/sil-language";

/**
 * PERSON × JOB · the first screen beside the planetarium (owner G1, 2026-10-22): the closed state of the chain as one statement
 * (`pxj-first-state`), and in AVAILABLE the B2 coverage of the selected role. B2 is the only relation source; the boundary
 * statement stands permanently beside every visible coverage (P-07). Counts only as delivered whole numbers, pool order, no
 * colour or size by number (P-10); weak stays weak, not covered is no judgement (P-11). Focus only highlights (P-12).
 */
type Copy = (typeof SIL_COPY)[SilLocale]["pxjFirst"];

const MONO = SIL_TOKENS.typography.mono;
const SANS = SIL_TOKENS.typography.sans;
const CYAN_RGB = "56, 229, 255";
const AMBER_RGB = "245, 196, 107";
const NEUTRAL_RGB = "214, 228, 238";

const kicker: React.CSSProperties = { fontFamily: MONO, fontSize: "10.5px", fontWeight: 700, letterSpacing: "1.8px", textTransform: "uppercase", color: "rgba(160, 232, 250, 0.92)" };
const meta: React.CSSProperties = { fontFamily: MONO, fontSize: "10.5px", lineHeight: 1.55, letterSpacing: "0.3px", color: "rgba(176, 200, 216, 0.88)", wordBreak: "break-word" };
const statement: React.CSSProperties = { fontFamily: SANS, fontSize: "12.5px", lineHeight: 1.5, color: "#e6f1f8" };
const chip = (rgb: string): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", flexShrink: 0, padding: "2px 8px", borderRadius: "999px", border: `1px solid rgba(${rgb}, 0.5)`, background: `rgba(${rgb}, 0.08)`, color: `rgb(${rgb})`, fontFamily: MONO, fontSize: "9.5px", fontWeight: 700, letterSpacing: "1.1px", whiteSpace: "nowrap" });
const action: React.CSSProperties = { alignSelf: "flex-start", marginTop: "4px", padding: "5px 12px", borderRadius: "999px", border: `1px solid rgba(${CYAN_RGB}, 0.55)`, background: `rgba(${CYAN_RGB}, 0.08)`, color: SIL_TOKENS.colors.cyanActive, fontFamily: MONO, fontSize: "10.5px", fontWeight: 700, letterSpacing: "1.2px", cursor: "pointer" };
const layer: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "6px", padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(120, 214, 255, 0.14)", background: "rgba(4, 12, 21, 0.6)" };

const LOADING_STATES = new Set(["RESULT_LOADING", "BOUNDARY_RESOLVING", "COVERAGE_LOADING", "JOB_CHECKING"]);

export interface PxjFirstScreenProps {
  screen: PxjFirstScreenModel;
  /** The interface's mode: PERSON × JOB shows every state; PERSON only those that are not today's screen. */
  mode: InvestigationMode;
  locale: SilLocale;
  onSwitchMode: (mode: InvestigationMode) => void;
  onSelectRole: (scope: JobScope) => void;
  /** NO_ANALYSIS and RESULT_NOT_FOUND (UX-03 / D-PICK / V-06): the way to an existing investigation of the selected role (the caller's element). */
  noAnalysis?: React.ReactNode;
}

/** Whether the surface is shown at all: under PERSON today's first screen stays unchanged (NO_ANALYSIS and a PERSON result). */
export function pxjFirstScreenVisible(screen: PxjFirstScreenModel, mode: InvestigationMode): boolean {
  if (mode === "PERSON_X_JOB") return true;
  return mode === "PERSON" && screen.state !== "NO_ANALYSIS" && screen.state !== "PERSON_RESULT";
}

function stateDetail(screen: PxjFirstScreenModel, c: Copy, modes: Record<InvestigationMode, string>): string | null {
  switch (screen.state) {
    case "RESULT_NOT_FOUND": case "RESULT_LOADING": case "BOUNDARY_RESOLVING": case "BOUNDARY_NOT_FOUND": case "BOUNDARY_FAILED": case "NO_PROJECTION":
      return `${c.analysis} ${screen.analysisId}`;
    case "RESULT_FAILED": return `${c.analysis} ${screen.analysisId}${screen.code ? ` · ${screen.code}` : ""}`;
    case "BOUNDARY_UNRESOLVED": return `${c.analysis} ${screen.analysisId}${screen.reason ? ` · ${screen.reason}` : ""}`;
    case "MODE_MISMATCH": return `${c.analysis} ${screen.analysisId} · ${c.modeAnalysis} ${modes[screen.analysisMode]} · ${c.modeInterface} ${modes[screen.interfaceMode]}`;
    case "JOB_CHECKING": return `${c.selectedJob}: ${screen.selection.poolRoleId} · ${screen.selection.jobPoolUploadId}`;
    case "JOB_INVALID": return `${c.selectedJob}: ${screen.selection.poolRoleId} · ${c.reason} ${screen.reason} · ${c.jobOfAnalysis}: ${screen.analysisSelection.poolRoleId}`;
    case "ROLE_MISMATCH": return `${c.jobOfAnalysis}: ${screen.analysisSelection.poolRoleId} · ${screen.analysisSelection.jobPoolUploadId}${screen.selection === null ? "" : ` · ${c.selectedJob}: ${screen.selection.poolRoleId}`}`;
    case "COVERAGE_FAILED": return `${c.analysis} ${screen.analysisId}${screen.code ? ` · ${screen.code}` : ""}`;
    case "LINEAGE_MISMATCH": return `${screen.check} · ${c.lineage[screen.check]}`;
    default: return null;
  }
}

function Requirement({ requirement, c, focused, onFocus }: { requirement: FirstScreenRequirement; c: Copy; focused: boolean; onFocus: (id: string | null) => void }) {
  const { proposal } = requirement;
  return (
    <li
      data-testid={`pxj-first-req-${requirement.poolRequirementId}`}
      data-coverage={requirement.coverage}
      data-match-basis={requirement.matchBasis ?? ""}
      data-proposal-id={proposal?.id ?? ""}
      data-proposal-in-projection={proposal === null ? "" : String(proposal.inProjection)}
      data-focus={focused ? "true" : "false"}
      tabIndex={0}
      onMouseEnter={() => onFocus(proposal?.id ?? null)}
      onMouseLeave={() => onFocus(null)}
      onFocus={() => onFocus(proposal?.id ?? null)}
      onBlur={() => onFocus(null)}
      style={{ display: "flex", flexDirection: "column", gap: "5px", padding: "9px 10px", borderRadius: "8px", border: `1px solid ${focused ? `rgba(${CYAN_RGB}, 0.55)` : "rgba(120, 214, 255, 0.1)"}`, background: focused ? `rgba(${CYAN_RGB}, 0.06)` : "transparent", outline: "none", transition: "border-color 0.25s ease, background 0.25s ease" }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
        <span data-pxj-declared style={{ fontFamily: SANS, fontSize: "13px", fontWeight: 600, color: "#eef9ff", lineHeight: 1.35 }}>{requirement.capabilityName}</span>
        {requirement.coverage === "COVERED"
          ? <span style={chip(requirement.weak ? AMBER_RGB : CYAN_RGB)}>{requirement.weak ? c.weak : c.covered}</span>
          : <span style={chip(NEUTRAL_RGB)}>{c.notCovered}</span>}
      </div>
      <span data-pxj-declared style={meta}>{requirement.necessityState} · {requirement.requiredLevel || "—"}</span>
      {proposal !== null && (
        <span style={meta}>
          {c.by} <strong data-pxj-declared style={{ color: "#e6f7fd" }}>{proposal.name}</strong>
          {requirement.matchBasis !== null && ` · ${c.basis[requirement.matchBasis]}`}
          {requirement.matchedConstituent ? ` · ${requirement.matchedConstituent}` : ""}
          {!proposal.inProjection && <span data-pxj-proposal-not-in-projection style={{ color: `rgb(${AMBER_RGB})` }}> · {c.proposalNotInProjection}</span>}
        </span>
      )}
      {requirement.quotes.map((quote, index) => (
        <div key={`${quote.docId}:${index}`} data-testid={`pxj-first-quote-${requirement.poolRequirementId}-${index}`} data-doc-id={quote.docId} data-quote-in-projection={String(quote.inProjection)} data-source-resolved={String(quote.sourceResolved)} data-verified={String(quote.verified)} style={{ display: "flex", flexDirection: "column", gap: "3px", paddingLeft: "9px", borderLeft: `2px solid rgba(${quote.verified ? "126, 255, 204" : AMBER_RGB}, 0.45)` }}>
          <p data-pxj-quote style={{ margin: 0, fontFamily: SANS, fontSize: "12px", lineHeight: 1.5, color: "rgba(224, 238, 246, 0.92)" }}>“{quote.quote}”</p>
          <span style={{ ...meta, fontSize: "10px" }}>
            {quote.sourceResolved ? (quote.sourceTitle ?? c.titleNotDelivered) : c.sourceNotResolved} · {quote.docId}
            {quote.verified ? <span data-pxj-quote-verified style={{ color: "rgba(126, 255, 204, 0.9)" }}> · ✓ {c.quoteVerified}</span> : !quote.inProjection ? <span style={{ color: `rgb(${AMBER_RGB})` }}> · {c.quoteNotInProjection}</span> : null}
          </span>
        </div>
      ))}
      {requirement.coverage === "NOT_COVERED" && <span style={{ ...meta, color: "rgba(214, 226, 236, 0.8)" }}>{c.notCoveredStatement}</span>}
    </li>
  );
}

export function PxjFirstScreen({ screen, mode, locale, onSwitchMode, onSelectRole, noAnalysis }: PxjFirstScreenProps) {
  const copy = SIL_COPY[locale];
  const c = copy.pxjFirst;
  const modes = copy.syntx.investigation.modes;
  /** Focus highlights only (P-12): the proposal under the pointer or keyboard and the requirements it covers; nothing is selected. */
  const [focusedProposal, setFocusedProposal] = useState<string | null>(null);
  if (!pxjFirstScreenVisible(screen, mode)) return null;
  const coverage = screen.state === "AVAILABLE" ? screen.coverage : null;
  const covers = coverage === null || focusedProposal === null ? [] : coverage.covers[focusedProposal] ?? [];
  const sentence = screen.state === "ROLE_MISMATCH" && screen.selection === null ? c.states.ROLE_NONE : c.states[screen.state];
  const detail = stateDetail(screen, c, modes);
  const rgb = screen.state === "AVAILABLE" || LOADING_STATES.has(screen.state) ? CYAN_RGB : screen.state === "NO_ANALYSIS" ? NEUTRAL_RGB : AMBER_RGB;
  return (
    <>
    {/* Below ~1600 px the panel would cover orbit 02 (upper right, 371 px right of the centre): it then starts below that orbit. */}
    <style>{`@media (max-width: 1599px) { [data-pxj-panel] { top: calc(50% - 56px) !important; max-height: calc(50% - 40px) !important; } }`}</style>
    <aside
      data-testid="pxj-first-screen"
      data-pxj-panel
      data-state={screen.state}
      onClick={event => event.stopPropagation()}
      style={{ position: "absolute", right: "24px", top: "132px", bottom: "96px", zIndex: 32, width: "min(400px, 29vw)", display: "flex", flexDirection: "column", gap: "10px", boxSizing: "border-box", padding: "14px 14px 16px", overflowY: "auto", borderRadius: "14px", border: "1px solid rgba(120, 214, 255, 0.2)", background: "radial-gradient(120% 70% at 0% 0%, rgba(56, 229, 255, 0.07), transparent 62%), linear-gradient(180deg, rgba(6, 15, 26, 0.94), rgba(3, 8, 15, 0.95))", boxShadow: "0 0 0 1px rgba(3, 8, 16, 0.6), 0 16px 40px rgba(0, 0, 0, 0.5), 0 0 26px rgba(56, 229, 255, 0.08)", backdropFilter: "blur(10px)", color: "#e6f1f8", maxHeight: "calc(100vh - 228px)", alignSelf: "flex-start" }}
    >
      <span style={kicker}>{c.title}</span>
      <div data-testid="pxj-first-state" data-state={screen.state} role="status" style={{ display: "flex", flexDirection: "column", gap: "5px", padding: "9px 11px", borderRadius: "10px", border: `1px solid rgba(${rgb}, 0.4)`, background: `rgba(${rgb}, 0.06)` }}>
        <span style={{ ...statement, color: screen.state === "AVAILABLE" ? "#e6f1f8" : `rgb(${rgb})`, fontWeight: 600 }}>{sentence}</span>
        {detail !== null && <span style={meta}>{detail}</span>}
        {screen.state === "MODE_MISMATCH" && <button type="button" data-testid="pxj-first-switch-mode" data-target-mode={screen.analysisMode} onClick={() => onSwitchMode(screen.analysisMode)} style={action}>{c.switchMode} {modes[screen.analysisMode]}</button>}
        {screen.state === "NO_ANALYSIS" && (
          <div data-testid="pxj-first-ways" style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
            <div data-testid="pxj-first-way-existing" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ ...statement, fontSize: "12px" }}>{c.ways.existing}</span>
              {noAnalysis}
            </div>
            <span data-testid="pxj-first-way-analyze" style={{ ...statement, fontSize: "12px" }}>{c.ways.analyze}</span>
          </div>
        )}
        {screen.state === "RESULT_NOT_FOUND" && noAnalysis !== undefined && (
          <div data-testid="pxj-first-way-existing" style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
            <span style={{ ...statement, fontSize: "12px" }}>{c.ways.existing}</span>
            {noAnalysis}
          </div>
        )}
        {screen.state === "ROLE_MISMATCH" && <button type="button" data-testid="pxj-first-select-role" data-pool-upload={screen.analysisSelection.jobPoolUploadId} data-pool-role={screen.analysisSelection.poolRoleId} onClick={() => onSelectRole(screen.analysisSelection)} style={action}>{c.selectRole}</button>}
      </div>
      {coverage !== null && (
        <section data-testid="pxj-first-coverage" data-coverage-state="AVAILABLE" data-scored="false" data-relation-state={coverage.relationState} data-binding-analysis={coverage.binding.analysisId} data-binding-upload={coverage.binding.jobPoolUploadId} data-binding-role={coverage.binding.poolRoleId} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div data-testid="pxj-first-coverage-boundary" style={{ ...layer, border: `1px solid rgba(${AMBER_RGB}, 0.36)`, background: `rgba(${AMBER_RGB}, 0.05)` }}>
            <span style={{ ...statement, fontSize: "11.5px", color: `rgb(${AMBER_RGB})` }}>{c.boundary.join(" · ")}</span>
          </div>
          <div data-pxj-section="binding" style={layer}>
            <span style={kicker}>{c.binding}</span>
            <span data-pxj-declared style={{ ...statement, fontWeight: 600 }}>{coverage.role.title} · {coverage.role.organizationName}</span>
            <span style={meta}>{c.analysis} {coverage.binding.analysisId} · {coverage.binding.poolRoleId}</span>
            <span data-testid="pxj-first-counts" style={meta}>{coverage.counts.covered} {c.counts.covered} · {coverage.counts.notCovered} {c.counts.notCovered} · {coverage.counts.requirements} {c.counts.requirements} · {coverage.relationState}</span>
          </div>
          {screen.state === "AVAILABLE" && (
            <div data-pxj-section="proposals" style={layer}>
              <span style={kicker}>{c.proposals}</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {screen.proposals.map(proposal => (
                  <button key={proposal.id} type="button" data-pxj-declared data-testid={`pxj-first-proposal-${proposal.id}`} data-focus={focusedProposal === proposal.id ? "true" : "false"} onMouseEnter={() => setFocusedProposal(proposal.id)} onMouseLeave={() => setFocusedProposal(null)} onFocus={() => setFocusedProposal(proposal.id)} onBlur={() => setFocusedProposal(null)} style={{ padding: "3px 9px", borderRadius: "999px", border: `1px solid rgba(0, 255, 213, ${focusedProposal === proposal.id ? 0.75 : 0.3})`, background: focusedProposal === proposal.id ? "rgba(0, 255, 213, 0.1)" : "transparent", color: "#dffcf5", fontFamily: SANS, fontSize: "11.5px", cursor: "default" }}>{proposal.name}</button>
                ))}
              </div>
            </div>
          )}
          <div data-pxj-section="requirements" style={layer}>
            <span style={kicker}>{c.requirements}</span>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
              {coverage.requirements.map(requirement => (
                <Requirement key={requirement.poolRequirementId} requirement={requirement} c={c} focused={covers.includes(requirement.poolRequirementId) || (focusedProposal !== null && requirement.proposal?.id === focusedProposal)} onFocus={setFocusedProposal} />
              ))}
            </ul>
          </div>
        </section>
      )}
    </aside>
    </>
  );
}

/** In the Job Field (§03.4): the job of the analysis on view, offered as an explicit choice when it is not the selected one. */
export function PxjAnalysisJobOffer({ screen, locale, onSelectRole }: { screen: PxjFirstScreenModel; locale: SilLocale; onSelectRole: (scope: JobScope) => void }) {
  // JOB_CHECKING offers nothing (the selected job is still being checked); JOB_INVALID names the invalid job and its reason.
  if (screen.state !== "ROLE_MISMATCH" && screen.state !== "JOB_INVALID") return null;
  const c = SIL_COPY[locale].pxjFirst;
  const invalid = screen.state === "JOB_INVALID";
  const offer = !invalid || screen.selection.jobPoolUploadId !== screen.analysisSelection.jobPoolUploadId || screen.selection.poolRoleId !== screen.analysisSelection.poolRoleId;
  return (
    <div data-testid="pxj-analysis-job-offer" data-sx-shell="pxj-offer" data-state={screen.state} role="status" style={{ position: "fixed", left: "50%", bottom: "28px", transform: "translateX(-50%)", zIndex: 58, display: "flex", alignItems: "center", gap: "12px", maxWidth: "min(720px, calc(100vw - 48px))", boxSizing: "border-box", padding: "8px 10px 8px 16px", borderRadius: "999px", border: `1px solid rgba(${AMBER_RGB}, 0.42)`, background: "linear-gradient(180deg, rgba(8, 21, 34, 0.94), rgba(3, 8, 15, 0.96))", boxShadow: "0 12px 32px rgba(0, 0, 0, 0.55)", backdropFilter: "blur(10px)" }}>
      <span style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
        <span style={{ ...statement, fontSize: "12px", color: `rgb(${AMBER_RGB})` }}>{invalid ? c.states.JOB_INVALID : screen.selection === null ? c.states.ROLE_NONE : c.states.ROLE_MISMATCH}</span>
        {invalid && <span data-testid="pxj-analysis-job-invalid" data-reason={screen.reason} style={meta}>{c.selectedJob}: {screen.selection.poolRoleId} · {c.reason} {screen.reason}</span>}
        <span style={meta}>{c.jobOfAnalysis}: {screen.analysisSelection.poolRoleId} · {screen.analysisSelection.jobPoolUploadId}</span>
      </span>
      {offer && <button type="button" data-testid="pxj-analysis-job-select" onClick={() => onSelectRole(screen.analysisSelection)} style={{ ...action, alignSelf: "center", marginTop: 0, whiteSpace: "nowrap" }}>{c.selectRole}</button>}
    </div>
  );
}
