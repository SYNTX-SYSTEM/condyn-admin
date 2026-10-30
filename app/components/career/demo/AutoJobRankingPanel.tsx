"use client";

import React, { useState } from "react";
import { SIL_TOKENS } from "./SILTokens";
import type { SilLocale } from "../../../../lib/career/view-model/sil-language";
import type { AutoMatchWatch, JobRankingState, RankedRole, RankedRequirement } from "../../../../lib/career/ui/auto-match";
import { AUTO_MATCH_COPY, type AutoMatchCopy } from "./auto-match-copy";
import { RD_PANEL_BOX, RD_PANEL_TIER_CSS } from "./RoleDiscoveryPanel";

/**
 * The automatic job ranking (owner "SFE::AUTOMATED_CAPABILITY_TO_JOB_EXECUTE", GRÜN): after the analysis of a PERSON source the field
 * goes on without further input — the run the worker starts by itself (its state line, read by GET), then the ranked jobs with their
 * reasons. It stands in the role discovery's slot (RD_PANEL_BOX, the shared panel attributes, so the dashboard's tier rules place it
 * exactly like that panel) while no manual discovery is open; the manual discovery's entry is its last row (`children`), unchanged.
 *
 * Nothing here chooses, confirms or starts: no pool picker, no role picker, no confirmation. The state line speaks the entry line's
 * language (a path, one sentence, one transition, role="status" polite, cool) — never an alarm. The evidence class and the authority
 * (none: a ranking, not a decision) stand above the ranking whenever it is shown.
 */
const MONO = SIL_TOKENS.typography.mono;
const SANS = SIL_TOKENS.typography.sans;
const CYAN_RGB = "92, 200, 255";
const kicker: React.CSSProperties = { fontFamily: MONO, fontSize: "11px", fontWeight: 700, letterSpacing: "1.8px", textTransform: "uppercase", color: "rgba(160, 232, 250, 0.92)" };
const meta: React.CSSProperties = { fontFamily: MONO, fontSize: "11px", lineHeight: 1.55, letterSpacing: "0.3px", color: "rgba(176, 200, 216, 0.88)", wordBreak: "break-word" };
const statement: React.CSSProperties = { fontFamily: SANS, fontSize: "12.5px", lineHeight: 1.5, color: "#e6f1f8" };
const action: React.CSSProperties = { alignSelf: "flex-start", padding: "3px 10px", borderRadius: "999px", border: `1px solid rgba(${CYAN_RGB}, 0.42)`, background: `rgba(${CYAN_RGB}, 0.08)`, color: "#cdf6ff", fontFamily: MONO, fontSize: "10.5px", fontWeight: 700, letterSpacing: "1.2px", cursor: "pointer", whiteSpace: "nowrap" };
const layer: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "6px", padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(120, 214, 255, 0.14)", background: "rgba(4, 12, 21, 0.6)" };
const badge: React.CSSProperties = { fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "1.1px", padding: "1px 8px", borderRadius: "999px", border: `1px solid rgba(${CYAN_RGB}, 0.32)`, color: "rgba(176, 226, 244, 0.95)", whiteSpace: "nowrap" };

export type AutoLineKey = "READING" | "READ_FAILED" | "ANALYSIS_NOT_FOUND" | "NOT_STARTED" | "WAITED_OUT" | "RUNNING" | "COMPLETED" | "PARTIAL" | "DISABLED" | "SKIPPED" | "FAILED";
export interface AutoLine { key: AutoLineKey; cause: string; way: string; detail: string[]; action: "GO_TO_JOB_FIELD" | null }

/** The state line of the run: which line stands, its one sentence, its one transition, its facts (reason, budget, pools). */
export function autoMatchLine(watch: AutoMatchWatch, c: AutoMatchCopy): AutoLine {
  const read = watch.read;
  if (read.state === "IDLE" || read.state === "LOADING") return { key: "READING", ...c.reading, detail: [], action: null };
  if (read.state === "ANALYSIS_NOT_FOUND") return { key: "ANALYSIS_NOT_FOUND", ...c.analysisNotFound, detail: [], action: null };
  if (read.state === "FAILED") return { key: "READ_FAILED", ...c.readFailed, detail: read.code === null ? [] : [c.code(read.code)], action: null };
  const run = read.autoMatch;
  const pools = run.pools.length > 0 ? [c.pools(run.pools.map(pool => pool.poolName).join(" · "))] : [];
  const budget = run.budget === null ? [] : [c.budget(run.budget.rolesEvaluated, run.budget.rolesPlanned, run.budget.callsLimit)];
  switch (run.state) {
    case "NOT_STARTED": return watch.waitedOut ? { key: "WAITED_OUT", ...c.waitedOut, detail: [], action: null } : { key: "NOT_STARTED", ...c.notStarted, detail: [], action: null };
    case "RUNNING": return { key: "RUNNING", ...c.running(run.budget?.rolesEvaluated ?? 0, run.budget?.rolesPlanned ?? 0), detail: pools, action: null };
    case "COMPLETED": return { key: "COMPLETED", ...c.completed(run.pools.length), detail: [...budget, ...pools], action: null };
    case "PARTIAL": return { key: "PARTIAL", ...c.partial[run.reason as keyof AutoMatchCopy["partial"]], detail: [...budget, ...pools], action: null };
    case "DISABLED": return { key: "DISABLED", ...c.disabled, detail: [c.disabledReason[run.reason as keyof AutoMatchCopy["disabledReason"]]], action: null };
    case "SKIPPED": return { key: "SKIPPED", ...c.skipped[run.reason as keyof AutoMatchCopy["skipped"]], detail: [], action: run.reason === "NO_ACTIVE_POOLS" ? "GO_TO_JOB_FIELD" : null };
    case "FAILED": return { key: "FAILED", ...c.failed, detail: [c.code(run.reason ?? "—"), ...budget, ...pools], action: null };
  }
}

export interface AutoJobRankingPanelProps {
  locale: SilLocale;
  watch: AutoMatchWatch;
  ranking: JobRankingState;
  /** The existing field switch to the Job Field (as the discovery panel's own), offered only where no active pool was in the field. */
  onGoToJobField?(): void;
  /** The manual discovery's entry (RoleDiscoveryEntry, inline) — the existing action, unchanged. */
  children?: React.ReactNode;
}

export function AutoJobRankingPanel({ locale, watch, ranking, onGoToJobField, children }: AutoJobRankingPanelProps) {
  const c = AUTO_MATCH_COPY[locale];
  const line = autoMatchLine(watch, c);
  const [open, setOpen] = useState<string | null>(null);
  const shown = ranking.state === "AVAILABLE" ? ranking.ranking : null;
  return (
    <>
      <style>{RD_PANEL_TIER_CSS}</style>
      <aside data-testid="auto-ranking-panel" data-pxj-panel data-rd-panel data-auto-line={line.key} data-ranking-state={ranking.state} aria-label={c.title} onClick={event => event.stopPropagation()} style={RD_PANEL_BOX}>
        <span style={kicker}>{c.title}</span>
        <div data-testid="auto-line" data-line={line.key} role="status" aria-live="polite" style={{ ...layer, gap: "3px", border: `1px solid rgba(${CYAN_RGB}, 0.24)` }}>
          <span data-auto-path style={{ fontFamily: MONO, fontSize: "9.5px", fontWeight: 700, letterSpacing: "1.6px", color: "rgba(150, 214, 236, 0.78)" }}>{c.path}</span>
          <span data-testid="auto-line-cause" style={statement}>{line.cause}</span>
          <span data-testid="auto-line-way" style={{ fontFamily: SANS, fontSize: "11.5px", lineHeight: 1.4, color: "rgba(150, 214, 236, 0.9)" }}>{line.way}</span>
          {line.detail.map(text => <span key={text} data-testid="auto-line-detail" style={meta}>{text}</span>)}
          {line.action === "GO_TO_JOB_FIELD" && onGoToJobField && <button type="button" data-testid="auto-go-to-job-field" onClick={onGoToJobField} style={action}>{c.goToJobField}</button>}
        </div>
        {ranking.state !== "IDLE" && (
          <section data-testid="auto-ranking" data-state={ranking.state} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
              <span style={kicker}>{c.ranking.title}</span>
              {shown && <span data-testid="auto-evidence" data-evidence-class={shown.evidenceClass ?? "NONE"} style={badge}>{c.evidence[shown.evidenceClass ?? "NONE"]}</span>}
            </div>
            {shown === null ? (
              <span data-testid="auto-ranking-state" style={meta}>{ranking.state === "BOUNDARY_UNRESOLVED" ? c.ranking.states.BOUNDARY_UNRESOLVED(ranking.reason ?? "—") : c.ranking.states[ranking.state as Exclude<JobRankingState["state"], "IDLE" | "AVAILABLE" | "BOUNDARY_UNRESOLVED">]}{ranking.state === "FAILED" && ranking.code !== null ? ` · ${c.code(ranking.code)}` : ""}</span>
            ) : (
              <>
                <span data-testid="auto-authority" data-authority-state={shown.authority.authorityState} data-decision={String(shown.authority.decision)} style={meta}>{c.authority}</span>
                {shown.poolsDropped.length > 0 && <span data-testid="auto-pools-dropped" style={meta}>{c.ranking.poolsDropped(shown.poolsDropped.join(" · "))}</span>}
                {shown.ranks.length === 0 ? <span data-testid="auto-ranking-empty" style={statement}>{c.ranking.empty}</span> : (
                  <ol data-testid="auto-ranks" style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {shown.ranks.map(rank => {
                      const key = `${rank.role.jobPoolUploadId}:${rank.role.poolRoleId}`;
                      return <RankRow key={key} id={key} rank={rank} c={c} locale={locale} open={open === key} onToggle={() => setOpen(previous => previous === key ? null : key)} />;
                    })}
                  </ol>
                )}
              </>
            )}
          </section>
        )}
        {children && (
          <div data-testid="auto-manual" style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "auto" }}>
            <span style={meta}>{c.manualHint}</span>
            {children}
          </div>
        )}
      </aside>
    </>
  );
}

const percent = (fit: number) => Math.round(fit * 100);

export function RankRow({ id, rank, c, locale, open, onToggle }: { id: string; rank: RankedRole; c: AutoMatchCopy; locale: SilLocale; open: boolean; onToggle(): void }) {
  const r = c.ranking;
  return (
    <li data-testid={`auto-rank-${id}`} data-rank={rank.rank} data-tier={rank.tier} data-fit={rank.fit ?? ""} style={layer}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
        <span style={{ fontFamily: MONO, fontSize: "12px", fontWeight: 700, color: "rgba(160, 232, 250, 0.92)" }}>{rank.rank}</span>
        <span style={{ display: "flex", flexDirection: "column", gap: "1px", minWidth: 0, flex: 1 }}>
          <span style={{ ...statement, fontWeight: 600 }}>{rank.role.title}</span>
          <span style={meta}>{rank.role.organizationName} · {rank.role.poolName}</span>
        </span>
        <span data-testid="auto-rank-tier" style={badge}>{r.tier[rank.tier]}</span>
      </div>
      <span data-testid="auto-rank-facts" style={meta}>
        {rank.fit === null ? r.noRequirements : r.fit(percent(rank.fit))} · {r.coverage(rank.semanticCoverage.evaluated, rank.semanticCoverage.total)}{rank.requiredGaps > 0 ? ` · ${r.gaps(rank.requiredGaps)}` : ""}
      </span>
      {rank.requirements.length > 0 && (
        <button type="button" data-testid="auto-rank-why" aria-expanded={open} aria-controls={`auto-why-${id}`} onClick={onToggle} style={action}>{open ? r.whyHide : r.why}</button>
      )}
      {open && (
        <div id={`auto-why-${id}`} data-testid="auto-rank-reasons" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={meta}>{r.formula}</span>
          {rank.requirements.map(requirement => <RequirementRow key={requirement.poolRequirementId} requirement={requirement} c={c} locale={locale} />)}
        </div>
      )}
    </li>
  );
}

export function RequirementRow({ requirement, c }: { requirement: RankedRequirement; c: AutoMatchCopy; locale: SilLocale }) {
  const r = c.ranking;
  return (
    <div data-testid={`auto-req-${requirement.poolRequirementId}`} data-source={requirement.source} data-state={requirement.state} style={{ display: "flex", flexDirection: "column", gap: "2px", paddingLeft: "8px", borderLeft: `1px solid rgba(${CYAN_RGB}, 0.22)` }}>
      <span style={statement}>{requirement.requirementText}</span>
      <span style={meta}>{r.necessity[requirement.necessity]} · {r.source[requirement.source]} · {r.state[requirement.state]} · {r.contribution(requirement.weight, requirement.value, requirement.contribution)}</span>
      {requirement.capabilityName !== null && <span style={meta}>{r.proposal(requirement.capabilityName)}</span>}
      {requirement.explanation !== null && <span data-testid="auto-req-explanation" style={{ ...statement, fontSize: "12px" }}>{r.explanation}: {requirement.explanation}</span>}
      {requirement.evidenceLimitation !== null && <span data-testid="auto-req-limitation" style={meta}>{r.limitation}: {requirement.evidenceLimitation}</span>}
      {requirement.quotes.map((quote, at) => <span key={at} data-testid="auto-req-quote" style={{ ...meta, fontStyle: "italic" }}>{r.quote} {quote.sourceDocumentId}: “{quote.exactQuote}”</span>)}
    </div>
  );
}
