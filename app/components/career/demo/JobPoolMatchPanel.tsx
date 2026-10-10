"use client";

import React, { useState } from "react";
import { SIL_TOKENS } from "./SILTokens";
import { SIL_COPY, type SilLocale } from "../../../../lib/career/view-model/sil-language";
import {
  describeAnalysisSource,
  describeRanking,
  describeSelection,
  presentationLabels,
  requirementCounts
} from "../../../../lib/career/job-pool/frontend-presentation";
import { useJobPoolWorkflow } from "../../../../lib/career/ui/useJobPool";
import type { JobPoolMatchedRequirement, JobPoolMissingRequirement, JobPoolRoleMatch, JobPoolSweepProposalCoverage, JobPoolUploadSummary, JobPoolUploadView, JobPoolWeakRequirement } from "../../../../lib/career/job-pool/types";

type JobPoolCopy = (typeof SIL_COPY)[SilLocale]["jobPool"];

export interface JobPoolMatchPanelProps {
  /** Analysis id of this session's succeeded capability sweep (CareerJobController), if any. */
  jobResultAnalysisId?: string | null;
  /** Exact analysis id given by the product workflow (URL). Feeds only this panel; it loads nothing into the planetarium. */
  analysisId?: string | null;
  /** Exact upload selected by the product workflow (URL); never inferred. */
  jobPoolUploadId?: string | null;
  locale?: SilLocale;
  initialOpen?: boolean;
}

const RED = "rgba(255, 91, 101, 0.96)";

const sectionTitle: React.CSSProperties = { margin: 0, fontSize: "9px", fontWeight: 700, letterSpacing: "1px", color: SIL_TOKENS.colors.cyanActive };
const mono: React.CSSProperties = { fontFamily: SIL_TOKENS.typography.mono, fontSize: "10px", color: SIL_TOKENS.colors.textPrimary, wordBreak: "break-all" };
const muted: React.CSSProperties = { ...mono, color: SIL_TOKENS.colors.textMuted };
const amber: React.CSSProperties = { ...mono, color: SIL_TOKENS.colors.tensionAmber };
const red: React.CSSProperties = { ...mono, color: RED };
const green: React.CSSProperties = { ...mono, color: SIL_TOKENS.colors.evolutionGreen };
const panelSurface: React.CSSProperties = { backgroundColor: "rgba(6, 11, 18, 0.94)", border: `1px solid ${SIL_TOKENS.colors.fieldBorder}`, borderRadius: "8px", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "6px" };
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", backgroundColor: SIL_TOKENS.colors.field, border: `1px solid ${SIL_TOKENS.colors.fieldBorder}`, borderRadius: "4px", color: SIL_TOKENS.colors.textPrimary, fontFamily: SIL_TOKENS.typography.mono, fontSize: "10px", padding: "5px 7px" };
const buttonStyle = (active: boolean): React.CSSProperties => ({
  backgroundColor: active ? "rgba(56, 229, 255, 0.15)" : "transparent",
  border: `1px solid ${active ? SIL_TOKENS.colors.cyanActive : "rgba(56, 229, 255, 0.35)"}`,
  color: active ? SIL_TOKENS.colors.cyanActive : "rgba(56, 229, 255, 0.5)",
  fontFamily: SIL_TOKENS.typography.mono,
  fontSize: "9px",
  fontWeight: 700,
  letterSpacing: "0.5px",
  padding: "5px 8px",
  borderRadius: "4px",
  cursor: active ? "pointer" : "not-allowed"
});
const chip = (color: string): React.CSSProperties => ({ ...mono, color, border: `1px solid ${color}`, borderRadius: "3px", padding: "1px 5px", fontSize: "9px", fontWeight: 700, letterSpacing: "0.5px" });

const percent = (value: number): string => `${Math.round(value * 1000) / 10}%`;

function Evidence({ quotes, t }: { quotes: JobPoolMatchedRequirement["evidence"]; t: JobPoolCopy }) {
  if (quotes.length === 0) return <span style={amber}>{t.noEvidence}</span>;
  return (
    <ul style={{ margin: 0, paddingLeft: "12px", display: "flex", flexDirection: "column", gap: "2px" }}>
      {quotes.map((quote, index) => (
        <li key={`${quote.docId}:${index}`} data-testid="job-pool-evidence-quote" data-doc-id={quote.docId} style={muted}>
          <span style={{ ...mono, fontStyle: "italic" }}>“{quote.quote}”</span> · {quote.docId}
        </li>
      ))}
    </ul>
  );
}

/** Unscored coverage by a capability sweep proposal: shown with its verified quote, never as a score. */
function SweepCoverage({ testId, coverage, t }: { testId: string; coverage: JobPoolSweepProposalCoverage | null; t: JobPoolCopy }) {
  if (coverage === null) return null;
  return (
    <div data-testid={testId} data-sweep-basis={coverage.matchBasis} data-proposal-id={coverage.capabilityProposalId} data-scored="false" style={{ display: "flex", flexDirection: "column", gap: "2px", paddingLeft: "8px", borderLeft: `2px solid ${SIL_TOKENS.colors.cyanActive}` }}>
      <span style={{ ...muted, color: SIL_TOKENS.colors.cyanActive }}>
        {t.sweepCovered}: <span style={mono}>{coverage.name}</span> ({coverage.matchBasis}{coverage.matchedConstituent !== null ? ` · ${t.constituent} ${coverage.matchedConstituent}` : ""}) · {coverage.capabilityProposalId} · <span style={chip(SIL_TOKENS.colors.tensionAmber)}>{t.unscored}</span>
      </span>
      <Evidence quotes={coverage.evidence} t={t} />
    </div>
  );
}

function MatchedRow({ roleId, item, kind, t }: { roleId: string; item: JobPoolMatchedRequirement | JobPoolWeakRequirement; kind: "matched" | "weak"; t: JobPoolCopy }) {
  return (
    <li
      data-testid={`job-pool-role-${roleId}-${kind}-${item.poolRequirementId}`}
      data-match-basis={item.matchBasis}
      data-necessity={item.necessity}
      style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "4px 0", borderBottom: `1px dashed ${SIL_TOKENS.colors.fieldBorder}` }}
    >
      <span style={{ ...mono, fontWeight: 700 }}>
        {item.capabilityName} <span style={muted}>· {t.level} {item.requiredLevel || "—"} · {t.weight} {item.weight} · {item.necessity}</span>
      </span>
      <span style={muted}>
        {t.basis} <span style={chip(kind === "matched" ? SIL_TOKENS.colors.evolutionGreen : SIL_TOKENS.colors.tensionAmber)}>{item.matchBasis}</span> {t.via} <span style={mono}>{item.matchedCapabilityName}</span>{item.matchedConstituent !== null && <> · {t.constituent} <span data-testid="job-pool-matched-constituent" style={mono}>{item.matchedConstituent}</span></>} ({item.matchedCapabilityEntityId}) · confidence {item.confidence} · contribution {item.contribution}
      </span>
      {"reason" in item && <span style={amber}>{item.reason}</span>}
      <span style={muted}>{t.evidence}</span>
      <Evidence quotes={item.evidence} t={t} />
      <SweepCoverage testId={`job-pool-role-${roleId}-${kind}-${item.poolRequirementId}-sweep`} coverage={item.sweepProposal} t={t} />
    </li>
  );
}

function MissingRow({ roleId, item, t }: { roleId: string; item: JobPoolMissingRequirement; t: JobPoolCopy }) {
  return (
    <li data-testid={`job-pool-role-${roleId}-missing-${item.poolRequirementId}`} data-necessity={item.necessity} style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "4px 0", borderBottom: `1px dashed ${SIL_TOKENS.colors.fieldBorder}` }}>
      <span style={{ ...mono, fontWeight: 700, color: SIL_TOKENS.colors.tensionAmber }}>
        {item.capabilityName} <span style={muted}>· {t.level} {item.requiredLevel || "—"} · {t.weight} {item.weight} · {item.necessity}</span>
      </span>
      {item.evidenceHint !== null && <span style={muted}>{t.hint}: {item.evidenceHint}</span>}
      <SweepCoverage testId={`job-pool-role-${roleId}-missing-${item.poolRequirementId}-sweep`} coverage={item.sweepProposal} t={t} />
    </li>
  );
}

function RoleCard({ role, rank, t }: { role: JobPoolRoleMatch; rank: number; t: JobPoolCopy }) {
  const counts = requirementCounts(role);
  return (
    <article
      data-testid={`job-pool-role-${role.poolRoleId}`}
      data-rank={rank}
      data-resonance-score={role.resonanceScore}
      data-matched-count={counts.matched}
      data-weak-count={counts.weakEvidence}
      data-missing-count={counts.missing}
      data-sweep-covered={counts.sweepCovered}
      data-sweep-only-coverage={counts.sweepOnlyCoverage}
      data-relation-state={role.canonical.capabilityRequirementRelationState}
      style={{ ...panelSurface, border: `1px solid ${rank === 1 ? "rgba(56, 229, 255, 0.4)" : SIL_TOKENS.colors.fieldBorder}` }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px" }}>
        <span style={{ ...mono, fontWeight: 700, fontSize: "11px" }}>#{rank} {role.title}</span>
        <span style={{ ...mono, color: SIL_TOKENS.colors.cyanActive, fontWeight: 700 }}>{t.resonance} {percent(role.resonanceScore)}</span>
      </div>
      <span style={muted}>{role.organizationName} ({role.poolOrganizationId}) · {role.seniority || "—"} · {role.domainFocus || "—"} · {role.poolRoleId}</span>

      <span style={sectionTitle}>{t.matched} ({counts.matched})</span>
      {role.matched.length === 0 ? <span style={muted}>{t.none}</span> : <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>{role.matched.map(item => <MatchedRow key={item.poolRequirementId} roleId={role.poolRoleId} item={item} kind="matched" t={t} />)}</ul>}

      <span style={sectionTitle}>{t.weakEvidence} ({counts.weakEvidence})</span>
      {role.weakEvidence.length === 0 ? <span style={muted}>{t.none}</span> : <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>{role.weakEvidence.map(item => <MatchedRow key={item.poolRequirementId} roleId={role.poolRoleId} item={item} kind="weak" t={t} />)}</ul>}

      <span style={sectionTitle}>{t.missing} ({counts.missing})</span>
      {role.missing.length === 0 ? <span style={muted}>{t.none}</span> : <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>{role.missing.map(item => <MissingRow key={item.poolRequirementId} roleId={role.poolRoleId} item={item} t={t} />)}</ul>}
      <span data-testid={`job-pool-role-${role.poolRoleId}-sweep-only`} data-count={counts.sweepOnlyCoverage} style={counts.sweepOnlyCoverage > 0 ? { ...muted, color: SIL_TOKENS.colors.cyanActive } : muted}>{t.sweepOnlyCoverage}: {counts.sweepOnlyCoverage}</span>

      <div data-testid={`job-pool-role-${role.poolRoleId}-canonical`} data-relation-state={role.canonical.capabilityRequirementRelationState} data-relation-reason={role.canonical.reason} style={{ display: "flex", flexDirection: "column", gap: "2px", paddingTop: "4px", borderTop: `1px solid ${SIL_TOKENS.colors.fieldBorder}` }}>
        <span style={sectionTitle}>{t.canonicalState}</span>
        <span style={muted}>{t.roleProfile}: <span style={mono}>{role.canonical.targetRoleProfileRevisionId}</span></span>
        <span style={muted}>{t.requirementRevisions} ({counts.canonicalRequirementRevisions}):</span>
        {role.canonical.targetRequirementRevisionIds.map(id => <span key={id} data-testid={`job-pool-trqrev-${id}`} style={mono}>{id}</span>)}
        <span style={amber}>{t.relation}: {role.canonical.capabilityRequirementRelationState} · {role.canonical.reason}</span>
      </div>
    </article>
  );
}

function PoolRow({ pool, selected, onSelect, t }: { pool: JobPoolUploadSummary; selected: boolean; onSelect: () => void; t: JobPoolCopy }) {
  return (
    <li data-testid={`job-pool-item-${pool.jobPoolUploadId}`} data-selected={selected ? "true" : "false"} data-pool-status={pool.poolStatus} style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "6px 0", borderBottom: `1px dashed ${SIL_TOKENS.colors.fieldBorder}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
        <span style={{ ...mono, fontWeight: 700 }}>{pool.poolName} <span style={muted}>v{pool.poolVersion} · {pool.poolStatus}</span></span>
        <button data-testid={`job-pool-select-${pool.jobPoolUploadId}`} onClick={onSelect} disabled={selected} style={buttonStyle(!selected)}>{selected ? t.selected : t.select}</button>
      </div>
      <span style={mono}>{pool.jobPoolUploadId}</span>
      <span style={muted}>{pool.poolId} · {pool.organizationCount} org · {pool.roleCount} roles · {pool.requirementCount} req · {pool.uploadedByActorRef} · {pool.uploadedAt}</span>
    </li>
  );
}

function CanonicalMappingSummary({ upload, t }: { upload: JobPoolUploadView; t: JobPoolCopy }) {
  const mapping = upload.canonicalMapping;
  return (
    <div data-testid="job-pool-canonical-mapping" data-mapping-state={mapping.mappingState} data-proposal-state={mapping.proposalState} data-authority-state={mapping.authorityState} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <span style={sectionTitle}>{t.canonicalMapping}</span>
      <span style={muted}>
        <span style={chip(SIL_TOKENS.colors.evolutionGreen)}>{mapping.mappingState}</span> <span style={chip(SIL_TOKENS.colors.tensionAmber)}>{mapping.proposalState}</span> <span style={chip(SIL_TOKENS.colors.tensionAmber)}>authority {mapping.authorityState}</span> · {mapping.provider}
      </span>
      <span style={muted}>{mapping.organizations.length} TOREV · {mapping.roles.length} TRPREV · {mapping.roles.reduce((sum, role) => sum + role.requirements.length, 0)} TRQREV · raw sha256 {upload.rawSha256.slice(0, 16)}… · canonical sha256 {upload.canonicalSha256.slice(0, 16)}…</span>
      <span style={muted}>{t.canonicalMappingBoundary}</span>
    </div>
  );
}

export function JobPoolMatchPanel({ jobResultAnalysisId = null, analysisId = null, jobPoolUploadId = null, locale = SIL_COPY.defaultLocale, initialOpen }: JobPoolMatchPanelProps) {
  const t = SIL_COPY[locale].jobPool;
  const analysisSource = describeAnalysisSource(jobResultAnalysisId, analysisId);
  const effectiveAnalysisId = analysisSource.kind === "NONE" ? null : analysisSource.analysisId;
  const workflow = useJobPoolWorkflow({ analysisId: effectiveAnalysisId, initialJobPoolUploadId: jobPoolUploadId });
  const [isOpen, setIsOpen] = useState<boolean>(initialOpen ?? (jobPoolUploadId !== null && jobPoolUploadId.length > 0));
  const [actorId, setActorId] = useState("JOB_POOL_UPLOADER_LOCAL");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileText, setFileText] = useState<string | null>(null);

  const selectPool = (id: string) => {
    workflow.select(id);
    if (typeof window !== "undefined" && typeof window.history?.replaceState === "function") {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("jobPoolUploadId", id);
        window.history.replaceState(window.history.state, "", url.toString());
      } catch { /* navigation state is a convenience, never a requirement */ }
    }
  };

  const onFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) { setFileName(null); setFileText(null); return; }
    setFileName(file.name);
    setFileText(await file.text());
  };

  const listed = workflow.pools.state === "AVAILABLE" ? workflow.pools.jobPools : [];
  const selection = describeSelection(workflow.selectedJobPoolUploadId, listed);
  const canUpload = fileText !== null && workflow.upload.state !== "SUBMITTING";

  if (!isOpen) {
    return (
      <button
        data-testid="job-pool-panel-toggle"
        onClick={() => setIsOpen(true)}
        style={{ position: "fixed", left: "24px", top: "132px", zIndex: 50, backgroundColor: "rgba(10, 14, 20, 0.85)", border: `1px solid ${SIL_TOKENS.colors.cyanActive}`, borderRadius: "8px", padding: "8px 14px", color: SIL_TOKENS.colors.cyanActive, fontFamily: SIL_TOKENS.typography.mono, fontSize: "11px", cursor: "pointer", boxShadow: `0 0 12px ${SIL_TOKENS.colors.cyanGlow}` }}
      >
        {t.toggleOpen}
      </button>
    );
  }

  return (
    <aside
      data-testid="job-pool-panel"
      data-pools-state={workflow.pools.state}
      data-upload-state={workflow.upload.state}
      data-selection-kind={selection.kind}
      data-selected-pool={workflow.selectedJobPoolUploadId ?? ""}
      data-view-state={workflow.view.state}
      data-analysis-source={analysisSource.kind}
      data-analysis-id={effectiveAnalysisId ?? ""}
      data-matches-state={workflow.matches.state}
      style={{ position: "fixed", left: "24px", top: "132px", width: "440px", maxHeight: "calc(100vh - 180px)", overflowY: "auto", zIndex: 50, backgroundColor: "rgba(10, 14, 20, 0.94)", border: `1px solid ${SIL_TOKENS.colors.cyanActive}`, borderRadius: "12px", padding: "14px", fontFamily: SIL_TOKENS.typography.mono, color: SIL_TOKENS.colors.textPrimary, boxShadow: `0 0 24px ${SIL_TOKENS.colors.cyanGlow}`, backdropFilter: "blur(12px)", display: "flex", flexDirection: "column", gap: "12px" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: "12px", color: SIL_TOKENS.colors.cyanActive, letterSpacing: "1px" }}>{t.title}</h3>
        <button data-testid="job-pool-panel-collapse" onClick={() => setIsOpen(false)} style={buttonStyle(true)}>{t.collapse}</button>
      </div>

      <section data-testid="job-pool-upload" style={panelSurface}>
        <h4 style={sectionTitle}>{t.upload}</h4>
        <label style={muted}>{t.uploader}
          <input data-testid="job-pool-actor-input" value={actorId} onChange={event => setActorId(event.target.value)} style={inputStyle} />
        </label>
        <label style={muted}>{t.chooseFile}
          <input data-testid="job-pool-file-input" type="file" accept="application/json,.json" onChange={event => { void onFile(event); }} style={{ ...inputStyle, padding: "4px" }} />
        </label>
        <span data-testid="job-pool-file-name" style={muted}>{fileName ?? t.noFile}</span>
        <button data-testid="job-pool-upload-btn" disabled={!canUpload} onClick={() => { if (fileText !== null) void workflow.submitUpload(fileText, actorId); }} style={buttonStyle(canUpload)}>
          {workflow.upload.state === "SUBMITTING" ? t.submitting : t.submit}
        </button>
        {(workflow.upload.state === "CREATED" || workflow.upload.state === "IDENTICAL_EXISTS") && (
          <div data-testid="job-pool-upload-result" data-upload-outcome={workflow.upload.state} data-upload-id={workflow.upload.upload.jobPoolUploadId} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={green}>{workflow.upload.state === "CREATED" ? t.uploadCreated : t.uploadIdentical}</span>
            <span style={mono}>{workflow.upload.upload.jobPoolUploadId}</span>
            <span style={muted}>{workflow.upload.upload.poolName} v{workflow.upload.upload.poolVersion} · {workflow.upload.upload.poolStatus} · raw sha256 {workflow.upload.upload.rawSha256.slice(0, 16)}…</span>
            {workflow.selectedJobPoolUploadId !== workflow.upload.upload.jobPoolUploadId && <span style={amber}>{t.uploadNotSelected}</span>}
          </div>
        )}
        {workflow.upload.state === "REJECTED" && (
          <div data-testid="job-pool-upload-rejected" data-rejection-code={workflow.upload.code} data-rejection-status={workflow.upload.status} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={red}>{t.uploadRejected} · HTTP {workflow.upload.status} · {workflow.upload.code}</span>
            <span style={muted}>{workflow.upload.message}</span>
            {workflow.upload.issues.map((issue, index) => <span key={`${issue.path}:${index}`} data-testid="job-pool-upload-issue" style={muted}>{issue.path || "(root)"}: {issue.message}</span>)}
          </div>
        )}
        {workflow.upload.state === "NOT_PROVISIONED" && <span data-testid="job-pool-upload-not-provisioned" style={amber}>{t.notProvisioned}</span>}
        {workflow.upload.state === "FAILED" && <span data-testid="job-pool-upload-failed" style={red}>{t.uploadFailed}{workflow.upload.code ? ` · ${workflow.upload.code}` : ""}</span>}
      </section>

      <section data-testid="job-pool-list" data-pool-count={listed.length} style={panelSurface}>
        <h4 style={sectionTitle}>{t.pools}</h4>
        {(workflow.pools.state === "IDLE" || workflow.pools.state === "LOADING") && <span data-testid="job-pool-list-loading" style={muted}>{t.poolsLoading}</span>}
        {workflow.pools.state === "EMPTY" && <span data-testid="job-pool-list-empty" style={muted}>{t.poolsEmpty}</span>}
        {workflow.pools.state === "NOT_PROVISIONED" && <span data-testid="job-pool-list-not-provisioned" style={amber}>{t.notProvisioned}</span>}
        {workflow.pools.state === "FAILED" && <span data-testid="job-pool-list-failed" style={red}>{t.poolsFailed}{workflow.pools.code ? ` · ${workflow.pools.code}` : ""}</span>}
        {workflow.pools.state === "AVAILABLE" && (
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {workflow.pools.jobPools.map(pool => <PoolRow key={pool.jobPoolUploadId} pool={pool} selected={pool.jobPoolUploadId === workflow.selectedJobPoolUploadId} onSelect={() => selectPool(pool.jobPoolUploadId)} t={t} />)}
          </ul>
        )}
      </section>

      <section data-testid="job-pool-selected" data-selection-kind={selection.kind} style={panelSurface}>
        <h4 style={sectionTitle}>{t.selectedPool}</h4>
        {selection.kind === "NONE" && <span data-testid="job-pool-selection-none" style={muted}>{t.selectionNone}</span>}
        {selection.kind === "NOT_LISTED" && <span data-testid="job-pool-selection-not-listed" style={amber}>{t.selectionNotListed} · {selection.jobPoolUploadId}</span>}
        {selection.kind !== "NONE" && (
          <>
            {workflow.view.state === "LOADING" && <span style={muted}>{t.viewLoading}</span>}
            {workflow.view.state === "NOT_FOUND" && <span data-testid="job-pool-view-not-found" style={red}>{t.viewNotFound} · {workflow.view.jobPoolUploadId}</span>}
            {workflow.view.state === "NOT_PROVISIONED" && <span style={amber}>{t.notProvisioned}</span>}
            {workflow.view.state === "FAILED" && <span data-testid="job-pool-view-failed" style={red}>{t.viewFailed}{workflow.view.code ? ` · ${workflow.view.code}` : ""}</span>}
            {workflow.view.state === "AVAILABLE" && (
              <>
                <span style={{ ...mono, fontWeight: 700 }}>{workflow.view.upload.poolName} <span style={muted}>v{workflow.view.upload.poolVersion} · {workflow.view.upload.poolStatus}</span></span>
                <span style={mono}>{workflow.view.upload.jobPoolUploadId}</span>
                <CanonicalMappingSummary upload={workflow.view.upload} t={t} />
              </>
            )}
          </>
        )}
      </section>

      <section data-testid="job-pool-analysis" data-analysis-source={analysisSource.kind} style={panelSurface}>
        <h4 style={sectionTitle}>{t.analysis}</h4>
        {analysisSource.kind === "NONE" && <span data-testid="job-pool-analysis-none" style={muted}>{t.analysisNone}</span>}
        {analysisSource.kind !== "NONE" && (
          <>
            <span style={mono}>{analysisSource.analysisId}</span>
            <span style={muted}>{analysisSource.kind === "JOB_RESULT" ? t.analysisFromJob : t.analysisFromUrl}</span>
          </>
        )}
      </section>

      <section data-testid="job-pool-matches" data-matches-state={workflow.matches.state} data-ranking={workflow.matches.state === "AVAILABLE" ? describeRanking(workflow.matches.matches.roleMatches) : ""} style={panelSurface}>
        <h4 style={sectionTitle}>{t.matches}</h4>
        {workflow.matches.state === "IDLE" && <span data-testid="job-pool-matches-idle" style={muted}>{t.matchesIdle}</span>}
        {workflow.matches.state === "LOADING" && <span style={muted}>{t.matchesLoading}</span>}
        {workflow.matches.state === "NOT_FOUND" && <span data-testid="job-pool-matches-not-found" style={red}>{t.matchesNotFound}{workflow.matches.code ? ` · ${workflow.matches.code}` : ""}{workflow.matches.message ? ` · ${workflow.matches.message}` : ""}</span>}
        {workflow.matches.state === "INACTIVE_POOL" && <span data-testid="job-pool-matches-inactive" style={amber}>{t.matchesInactive}{workflow.matches.message ? ` · ${workflow.matches.message}` : ""}</span>}
        {workflow.matches.state === "NOT_PROVISIONED" && <span data-testid="job-pool-matches-not-provisioned" style={amber}>{t.notProvisioned}</span>}
        {workflow.matches.state === "FAILED" && <span data-testid="job-pool-matches-failed" style={red}>{t.matchesFailed}{workflow.matches.code ? ` · ${workflow.matches.code}` : ""}</span>}
        {workflow.matches.state === "AVAILABLE" && (() => {
          const presentation = workflow.matches.matches;
          const ranking = describeRanking(presentation.roleMatches);
          return (
            <>
              <div data-testid="job-pool-presentation-labels" data-policy-version={presentation.presentation.policyVersion} data-authority-state={presentation.presentation.authorityState} style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {presentationLabels(presentation.presentation).map(label => <span key={label} data-testid={`job-pool-label-${label}`} style={chip(SIL_TOKENS.colors.tensionAmber)}>{t.labels[label]}</span>)}
              </div>
              <span style={muted}>{presentation.presentation.kind} · {presentation.presentation.policyVersion} · authority {presentation.presentation.authorityState} · canonicalEvaluation {String(presentation.presentation.canonicalEvaluation)} · decision {String(presentation.presentation.decision)}</span>
              <span style={muted}>{t.candidateCapabilities} {presentation.candidateCapabilityCount} · {t.weakThreshold} {presentation.presentation.weakEvidenceThreshold} · {presentation.poolId} v{presentation.poolVersion}</span>
              <span data-testid="job-pool-ranking" data-ranking={ranking} style={ranking === "DELIVERED_ORDER_NOT_MONOTONE" ? amber : muted}>{t.ranking[ranking]}</span>
              <div data-testid="job-pool-capability-sweep" data-sweep-state={presentation.capabilitySweep.state} data-proposal-count={presentation.capabilitySweep.proposalCount} data-scored="false" style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "6px 0", borderTop: `1px dashed ${SIL_TOKENS.colors.fieldBorder}`, borderBottom: `1px dashed ${SIL_TOKENS.colors.fieldBorder}` }}>
                <span style={sectionTitle}>{t.sweep}</span>
                <span style={presentation.capabilitySweep.state === "FAILED" ? red : presentation.capabilitySweep.state === "NOT_PRODUCED" ? amber : muted}>{t.sweepStates[presentation.capabilitySweep.state]} · {t.sweepProposals} {presentation.capabilitySweep.proposalCount} · <span style={chip(SIL_TOKENS.colors.tensionAmber)}>{t.unscored}</span></span>
                <span style={muted}>{t.sweepBoundary}</span>
              </div>
              <div data-testid="job-pool-role-list" data-role-count={presentation.roleMatches.length} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {presentation.roleMatches.map((role, index) => <RoleCard key={role.poolRoleId} role={role} rank={index + 1} t={t} />)}
              </div>
              <span style={muted}>{t.missingBoundary}</span>
              <div data-testid="job-pool-organizations" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={sectionTitle}>{t.organizations}</span>
                {presentation.organizationMatches.map(organization => (
                  <span key={organization.poolOrganizationId} data-testid={`job-pool-organization-${organization.poolOrganizationId}`} style={muted}>
                    {organization.name} · {organization.industry || "—"} · {percent(organization.aggregateScore)} · {organization.roleCount} roles · top: {organization.topRoleTitle ?? "—"}
                  </span>
                ))}
              </div>
            </>
          );
        })()}
      </section>

      <span data-testid="job-pool-non-claims" style={{ ...muted, fontSize: "9px", letterSpacing: "0.5px" }}>{t.nonClaims}</span>
    </aside>
  );
}
