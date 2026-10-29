"use client";

import React, { useState } from "react";
import { SIL_TOKENS } from "./SILTokens";
import type { SilLocale } from "../../../../lib/career/view-model/sil-language";
import type { JobPoolListState } from "../../../../lib/career/ui/useJobPool";
import { ROLE_DISCOVERY_STATUSES, type RoleDiscoveryState } from "../../../../lib/career/ui/role-discovery";
import type { DiscoveryRole, PoolRoleDiscovery, RoleLexicalStatus } from "../../../../lib/career/job-pool/pool-role-discovery";
import type { JobScope } from "../../../../lib/career/job-pool/job-scope";
import { DISCOVERY_POOLS_MAX } from "../../../../lib/career/ui/career-demo-url";
import { ROLE_DISCOVERY_COPY, formatCount, type RoleDiscoveryCopy } from "./role-discovery-copy";
import type { InvestigationRoleKey, InvestigationState, InvestigationTask } from "../../../../lib/career/ui/semantic-investigation";

/**
 * Role discovery (GELB stage 2, additive — recovery §8): a panel in the B2 panel grammar beside the six-orbit planetarium of a
 * PERSON analysis. It carries the shared panel attribute (data-pxj-panel), so the dashboard's fit / stack / telemetry rules
 * (career-demo-layout.ts) place it exactly like the B2 panel; the two never stand together (B2 only under PERSON × JOB, this
 * panel only under PERSON). The orbits are not touched.
 *
 * - Pools are released explicitly: the uploaded pools are unticked choices, nothing preselected, no "all"; DISCOVER JOBS releases
 *   the ticked ones (one push of discoveryPoolUploadId, by the field).
 * - Roles stand in the five status groups in their fixed order (D-RD-4 A); the counts are descriptive, nothing is sorted by them;
 *   the groups without a name relation and without requirements are folded but present.
 * - The semantic state is always stated, with the plan's numbers as facts — or "unknown" when the cache cannot be trusted.
 */
const MONO = SIL_TOKENS.typography.mono;
const SANS = SIL_TOKENS.typography.sans;
const CYAN_RGB = "56, 229, 255";
const AMBER_RGB = "245, 196, 107";

const kicker: React.CSSProperties = { fontFamily: MONO, fontSize: "11px", fontWeight: 700, letterSpacing: "1.8px", textTransform: "uppercase", color: "rgba(160, 232, 250, 0.92)" };
const meta: React.CSSProperties = { fontFamily: MONO, fontSize: "11px", lineHeight: 1.55, letterSpacing: "0.3px", color: "rgba(176, 200, 216, 0.88)", wordBreak: "break-word" };
const statement: React.CSSProperties = { fontFamily: SANS, fontSize: "12.5px", lineHeight: 1.5, color: "#e6f1f8" };
const action: React.CSSProperties = { alignSelf: "flex-start", padding: "5px 12px", borderRadius: "999px", border: `1px solid rgba(${CYAN_RGB}, 0.55)`, background: `rgba(${CYAN_RGB}, 0.08)`, color: SIL_TOKENS.colors.cyanActive, fontFamily: MONO, fontSize: "11px", fontWeight: 700, letterSpacing: "1.2px", cursor: "pointer" };
const layer: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "6px", padding: "10px 12px", borderRadius: "10px", border: "1px solid rgba(120, 214, 255, 0.14)", background: "rgba(4, 12, 21, 0.6)" };
/** Folded by default: the groups that carry no name relation (D-RD-4: present, findable, not in the way). */
const FOLDED: readonly RoleLexicalStatus[] = ["NO_LEXICAL_RELATION", "NO_REQUIREMENTS"];

export interface RoleDiscoveryPanelProps {
  locale: SilLocale;
  /** The uploaded pools (GET /api/career/job-pools), offered as choices. */
  pools: JobPoolListState;
  /** The pools released for this analysis (URL discoveryPoolUploadId), in their order; null when none. */
  released: readonly string[] | null;
  discovery: RoleDiscoveryState;
  onRelease(ids: string[]): void;
  onClose(): void;
  /** RD-HANDOVER: the explicit "investigate this role" (the field selects it as the job and switches to PERSON × JOB). */
  onInvestigate?(scope: JobScope): void;
  /** RI-START: the investigation of this release (the field's one POST per click), its explicit start and a fresh read of the plan. */
  investigation?: InvestigationState;
  onStart?(roles: InvestigationRoleKey[], confirmedCalls: number): void;
  onReread?(): void;
}

export function RoleDiscoveryPanel({ locale, pools, released, discovery, onRelease, onClose, onInvestigate, investigation, onStart, onReread }: RoleDiscoveryPanelProps) {
  const c = ROLE_DISCOVERY_COPY[locale];
  const [ticked, setTicked] = useState<string[]>(() => [...(released ?? [])]);
  const [open, setOpen] = useState<RoleLexicalStatus[]>(() => ROLE_DISCOVERY_STATUSES.filter(status => !FOLDED.includes(status)));
  /** RD-DETAIL: the role whose trace is open — a disclosure inside the panel, not a selection (no URL, no history). */
  const [traced, setTraced] = useState<string | null>(null);
  /** RI-START: the roles the user picked for the semantic check — nothing preselected, no "all", in the panel only (no URL). */
  const [picked, setPicked] = useState<string[]>([]);
  const choices = pools.state === "AVAILABLE" ? pools.jobPools : [];
  // The release keeps the list's order (deterministic); a release equal to the one in force is no new step.
  const chosen = choices.map(pool => pool.jobPoolUploadId).filter(id => ticked.includes(id));
  const unchanged = released !== null && chosen.length === released.length && chosen.every((id, at) => id === released[at]);
  const toggle = (id: string) => setTicked(previous => previous.includes(id) ? previous.filter(other => other !== id) : [...previous, id]);
  return (
    <>
      <style>{`@media (max-width: 1599px) { [data-rd-panel] { top: calc(50% - 56px) !important; max-height: calc(50% - 40px) !important; } }`}</style>
      <aside
        data-testid="role-discovery-panel"
        data-pxj-panel
        data-rd-panel
        data-state={discovery.state}
        aria-label={c.title}
        onClick={event => event.stopPropagation()}
        style={{ position: "absolute", right: "24px", top: "132px", bottom: "96px", zIndex: 32, width: "min(400px, 29vw)", display: "flex", flexDirection: "column", gap: "10px", boxSizing: "border-box", padding: "14px 14px 16px", overflowY: "auto", borderRadius: "14px", border: "1px solid rgba(120, 214, 255, 0.2)", background: "radial-gradient(120% 70% at 0% 0%, rgba(56, 229, 255, 0.07), transparent 62%), linear-gradient(180deg, rgba(6, 15, 26, 0.94), rgba(3, 8, 15, 0.95))", boxShadow: "0 0 0 1px rgba(3, 8, 16, 0.6), 0 16px 40px rgba(0, 0, 0, 0.5), 0 0 26px rgba(56, 229, 255, 0.08)", backdropFilter: "blur(10px)", color: "#e6f1f8", maxHeight: "calc(100vh - 228px)", alignSelf: "flex-start" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <span style={kicker}>{c.title}</span>
          <button type="button" data-testid="rd-close" onClick={onClose} style={{ ...action, padding: "3px 10px" }}>{c.close}</button>
        </div>
        <span data-testid="rd-header" style={{ ...meta, color: "rgba(214, 232, 242, 0.92)" }}>{c.header}</span>

        <section data-testid="rd-pools" data-state={pools.state} style={layer}>
          <span style={kicker}>{c.poolsTitle}</span>
          <span style={meta}>{c.poolsHint}</span>
          {pools.state === "IDLE" || pools.state === "LOADING" ? <span style={meta}>{c.poolsLoading}</span>
            : pools.state === "EMPTY" ? <span style={meta}>{c.poolsEmpty}</span>
            : pools.state === "NOT_PROVISIONED" ? <span style={meta}>{c.poolsNotProvisioned}</span>
            : pools.state === "FAILED" ? <span style={meta}>{c.poolsFailed}</span>
            : (
              <>
                {choices.map(pool => {
                  const active = pool.poolStatus === "ACTIVE";
                  const checked = ticked.includes(pool.jobPoolUploadId);
                  const full = !checked && chosen.length >= DISCOVERY_POOLS_MAX;
                  return (
                    <label key={pool.jobPoolUploadId} data-testid={`rd-pool-${pool.jobPoolUploadId}`} data-released={released?.includes(pool.jobPoolUploadId) ? "true" : "false"} style={{ display: "flex", alignItems: "flex-start", gap: "8px", cursor: active && !full ? "pointer" : "default", opacity: active ? 1 : 0.6 }}>
                      <input type="checkbox" checked={checked} disabled={!active || full} onChange={() => toggle(pool.jobPoolUploadId)} style={{ flex: "0 0 auto", width: "14px", height: "14px", margin: "3px 0 0", padding: 0, accentColor: SIL_TOKENS.colors.cyanActive }} />
                      <span style={{ display: "flex", flexDirection: "column", gap: "1px", minWidth: 0 }}>
                        <span style={statement}>{pool.poolName}</span>
                        <span style={meta}>{c.poolRoles(pool.roleCount)} · v{pool.poolVersion} · {active ? pool.jobPoolUploadId : c.poolInactive(pool.poolStatus)}{released?.includes(pool.jobPoolUploadId) ? ` · ${c.released}` : ""}</span>
                      </span>
                    </label>
                  );
                })}
                {chosen.length >= DISCOVERY_POOLS_MAX && <span style={meta}>{c.poolsLimit(DISCOVERY_POOLS_MAX)}</span>}
                <button type="button" data-testid="rd-discover" disabled={chosen.length === 0 || unchanged} onClick={() => onRelease(chosen)} style={{ ...action, opacity: chosen.length === 0 || unchanged ? 0.45 : 1, cursor: chosen.length === 0 || unchanged ? "default" : "pointer" }}>{c.discover}</button>
              </>
            )}
        </section>

        <RoleDiscoveryResults c={c} discovery={discovery} open={open} onToggle={status => setOpen(previous => previous.includes(status) ? previous.filter(s => s !== status) : [...previous, status])} traced={traced} onTrace={key => setTraced(previous => previous === key ? null : key)} onInvestigate={onInvestigate}
          investigation={investigation} picked={picked} onPick={key => setPicked(previous => previous.includes(key) ? previous.filter(other => other !== key) : [...previous, key])} onStart={onStart} onReread={onReread} />
      </aside>
    </>
  );
}

export interface RoleDiscoveryResultsProps {
  c: RoleDiscoveryCopy; discovery: RoleDiscoveryState; open: RoleLexicalStatus[]; onToggle(status: RoleLexicalStatus): void; traced: string | null; onTrace(key: string): void; onInvestigate?(scope: JobScope): void;
  investigation?: InvestigationState; picked?: readonly string[]; onPick?(key: string): void; onStart?(roles: InvestigationRoleKey[], confirmedCalls: number): void; onReread?(): void;
}

/** The read's state or its result: the semantic state, the scope, the five groups with their roles (and the one traced role). */
export function RoleDiscoveryResults({ c, discovery, open, onToggle, traced, onTrace, onInvestigate, investigation = { state: "IDLE" }, picked = [], onPick, onStart, onReread }: RoleDiscoveryResultsProps) {
  if (discovery.state !== "AVAILABLE") {
    const sentence = discovery.state === "BOUNDARY_UNRESOLVED" ? c.boundaryUnresolved(discovery.reason ?? "—")
      : discovery.state === "POOL_NOT_FOUND" ? c.poolNotFound(discovery.jobPoolUploadId ?? "—")
      : discovery.state === "POOL_INACTIVE" ? c.poolInactiveRead(discovery.jobPoolUploadId ?? "—")
      : c.states[discovery.state];
    const warn = discovery.state !== "IDLE" && discovery.state !== "LOADING";
    return (
      <div data-testid="rd-state" data-state={discovery.state} role="status" style={{ ...layer, border: `1px solid rgba(${warn ? AMBER_RGB : CYAN_RGB}, 0.4)` }}>
        <span style={{ ...statement, color: warn ? `rgb(${AMBER_RGB})` : "#e6f1f8" }}>{sentence}</span>
        {discovery.state === "FAILED" && discovery.code !== null && <span style={meta}>{c.failedCode(discovery.code)}</span>}
      </div>
    );
  }
  const d = discovery.discovery;
  const plan = d.semanticPlan;
  const shown = investigation.state !== "IDLE";
  const semantic = shown && plan.state === "PLANNED" ? c.run.planAtRead(formatCount(plan.cachedPairs ?? 0), formatCount(plan.pairs), formatCount(plan.callsNeeded ?? 0))
    : plan.state === "ENGINE_NOT_SPECIFIED" ? c.semantic.ENGINE_NOT_SPECIFIED(formatCount(plan.callsNeeded ?? 0), formatCount(plan.pairs))
    : plan.state === "PLANNED" ? c.semantic.PLANNED(formatCount(plan.cachedPairs ?? 0), formatCount(plan.pairs), formatCount(plan.callsNeeded ?? 0))
    : c.semantic[plan.state](plan.cacheIssue ?? "—");
  // RI-CONTROL: the start is offered only on READY with an executable plan; otherwise the reason stands (two engine states apart).
  const unavailable = d.startControl.engineState !== "READY" ? d.startControl.engineState : plan.executable ? null : "CACHE" as const;
  // RI-START: the roles picked, in the discovery's own order; the calls are the picked roles with open pairs (one call per role).
  const startable = unavailable === null && plan.state === "PLANNED" && plan.executable && d.startControl.maxRoles !== null && onStart !== undefined;
  const max = d.startControl.maxRoles ?? 0;
  const planRole = new Map<string, (typeof plan.roles)[number]>(plan.roles.map(entry => [`${entry.jobPoolUploadId}:${entry.poolRoleId}`, entry]));
  const pickedRoles = d.roles.map(role => role.key).filter(key => picked.includes(`${key.jobPoolUploadId}:${key.poolRoleId}`));
  const calls = pickedRoles.filter(key => (planRole.get(`${key.jobPoolUploadId}:${key.poolRoleId}`)?.pendingPairs ?? 0) > 0).length;
  const pending = pickedRoles.reduce((sum, key) => sum + (planRole.get(`${key.jobPoolUploadId}:${key.poolRoleId}`)?.pendingPairs ?? 0), 0);
  const running = investigation.state === "STARTING";
  const tasks = new Map<string, InvestigationTask>(investigation.state === "STORED" ? investigation.investigation.tasks.map(task => [`${task.jobPoolUploadId}:${task.poolRoleId}`, task]) : []);
  const byKey = new Map(d.roles.map(role => [`${role.key.jobPoolUploadId}\u0000${role.key.poolRoleId}`, role] as const));
  const poolName = new Map(d.pools.map(pool => [pool.jobPoolUploadId, pool.poolName] as const));
  return (
    <>
      <div data-testid="rd-state" data-state="AVAILABLE" role="status" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <span data-testid="rd-semantic" data-plan-state={plan.state} style={{ ...meta, color: `rgb(${AMBER_RGB})` }}>{semantic}</span>
        {unavailable !== null && <span data-testid="rd-start-unavailable" data-engine-state={d.startControl.engineState} data-plan-state={plan.state} style={meta}>{c.startUnavailable[unavailable]}</span>}
        <span data-testid="rd-scope" style={meta}>{c.scope(d.counts.pools, d.counts.roles, d.counts.requirements, d.counts.proposals)}</span>
      </div>
      {startable && (
        <section data-testid="rd-start" data-picked={pickedRoles.length} data-calls={calls} style={layer}>
          <span style={kicker}>{c.run.title}</span>
          <span style={meta}>{c.run.hint(max)}</span>
          <span data-testid="rd-start-selection" style={statement}>{pickedRoles.length === 0 ? c.run.none : c.run.selection(pickedRoles.length, max, formatCount(calls), formatCount(pending))}</span>
          {pickedRoles.length >= max && <span style={meta}>{c.run.limit(max)}</span>}
          <button type="button" data-testid="rd-start-run" data-confirmed-calls={calls} disabled={pickedRoles.length === 0 || running} onClick={() => { if (pickedRoles.length > 0 && !running) onStart!(pickedRoles.map(key => ({ jobPoolUploadId: key.jobPoolUploadId, poolRoleId: key.poolRoleId })), calls); }} style={{ ...action, opacity: pickedRoles.length === 0 || running ? 0.45 : 1, cursor: pickedRoles.length === 0 || running ? "default" : "pointer" }}>{c.run.start}</button>
        </section>
      )}
      {shown && <RoleInvestigationState c={c} investigation={investigation} roles={d.roles} onReread={onReread} />}
      {d.groups.map(group => {
        const expanded = open.includes(group.status);
        return (
          <section key={group.status} data-testid={`rd-group-${group.status}`} data-expanded={expanded ? "true" : "false"} data-count={group.roles.length} style={layer}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
              <span style={{ ...statement, fontWeight: 600 }}>{c.groups[group.status]} · <span style={meta}>{c.groupRoles(group.roles.length)}</span></span>
              <button type="button" data-testid={`rd-group-toggle-${group.status}`} aria-expanded={expanded} onClick={() => onToggle(group.status)} style={{ ...action, padding: "2px 9px" }}>{expanded ? c.hide : c.show}</button>
            </div>
            {expanded && group.roles.map(key => {
              const role = byKey.get(`${key.jobPoolUploadId}\u0000${key.poolRoleId}`)!;
              const roleKey = `${key.jobPoolUploadId}:${key.poolRoleId}`;
              const tracing = traced === roleKey;
              return (
                <div key={roleKey} data-testid="rd-role" data-role-key={roleKey} data-status={role.status} data-traced={tracing ? "true" : "false"} style={{ display: "flex", flexDirection: "column", gap: "1px", paddingTop: "6px", borderTop: "1px solid rgba(120, 214, 255, 0.08)" }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px" }}>
                    {startable && (planRole.get(roleKey)?.pairs ?? 0) > 0 ? (
                      <label data-testid="rd-role-pick" data-role-key={roleKey} style={{ display: "flex", alignItems: "baseline", gap: "8px", minWidth: 0, cursor: "pointer" }}>
                        <input type="checkbox" aria-label={`${role.title} · ${c.run.pick}`} checked={picked.includes(roleKey)} disabled={running || (!picked.includes(roleKey) && pickedRoles.length >= max)} onChange={() => onPick?.(roleKey)} style={{ flex: "0 0 auto", width: "14px", height: "14px", margin: 0, padding: 0, accentColor: SIL_TOKENS.colors.cyanActive }} />
                        <span style={statement}>{role.title}</span>
                      </label>
                    ) : <span style={statement}>{role.title}</span>}
                    {role.counts.requirements > 0 && <button type="button" data-testid="rd-role-trace" aria-expanded={tracing} onClick={() => onTrace(roleKey)} style={{ ...action, padding: "2px 9px", flexShrink: 0 }}>{tracing ? c.detail.shut : c.detail.open}</button>}
                  </div>
                  <span style={meta}>{role.organizationName} · {poolName.get(key.jobPoolUploadId)}</span>
                  {role.counts.requirements > 0 && <span data-testid="rd-role-counts" style={meta}>{c.roleCounts(role.counts.nameRelated, role.counts.requirements, role.counts.weakLexicalOnly, role.counts.withoutLexicalRelation)}</span>}
                  {role.counts.required > 0 && <span style={meta}>{c.roleRequired(role.counts.required, role.counts.requiredWithoutLexicalRelation)}</span>}
                  {tasks.has(roleKey) && <span data-testid="rd-role-task" data-status={tasks.get(roleKey)!.status} style={{ ...meta, color: `rgb(${AMBER_RGB})` }}>{c.run.roleTask(c.run.task[tasks.get(roleKey)!.status])}</span>}
                  {tracing && <RoleDiscoveryTrace c={c} role={role} proposals={d.proposals} onInvestigate={onInvestigate} task={tasks.get(roleKey)} />}
                </div>
              );
            })}
          </section>
        );
      })}
    </>
  );
}

/**
 * RI-START: the state of the explicit semantic check — running while the user's own POST is open, then exactly what is stored (the
 * investigation and its role tasks, in the discovery's role order): the status, the stand-in named as no model, the budget, every
 * task with its pairs and the count of relations stored. A refusal says that nothing ran; no readable answer says that it is unknown.
 * The relations themselves are not shown; nothing is ranked or re-sorted.
 */
export function RoleInvestigationState({ c, investigation, roles, onReread }: { c: RoleDiscoveryCopy; investigation: InvestigationState; roles: readonly DiscoveryRole[]; onReread?: () => void }) {
  const reread = onReread && <button type="button" data-testid="rd-replan" onClick={onReread} style={{ ...action, padding: "2px 9px" }}>{c.run.reread}</button>;
  const box = (state: string, warn: boolean, children: React.ReactNode, extra: Record<string, string | number> = {}) => (
    <section data-testid="rd-investigation" data-state={state} role="status" aria-busy={state === "STARTING" || state === "LOADING"} {...extra} style={{ ...layer, border: `1px solid rgba(${warn ? AMBER_RGB : CYAN_RGB}, 0.4)` }}>{children}</section>
  );
  if (investigation.state === "IDLE") return null;
  if (investigation.state === "STARTING") return box("STARTING", false, <span style={statement}>{c.run.running(investigation.roles.length, investigation.confirmedCalls)}</span>);
  if (investigation.state === "LOADING") return box("LOADING", false, <span style={statement}>{c.run.loading}</span>);
  if (investigation.state === "NOT_FOUND") return box("NOT_FOUND", true, <span style={{ ...statement, color: `rgb(${AMBER_RGB})` }}>{c.run.notFound}</span>);
  if (investigation.state === "FAILED") return box("FAILED", true, <>
    <span style={{ ...statement, color: `rgb(${AMBER_RGB})` }}>{c.run.failed}</span>
    {investigation.code !== null && <span style={meta}>{c.failedCode(investigation.code)}</span>}
  </>);
  if (investigation.state === "REFUSED") {
    const sentence = investigation.code === "ERR_INVESTIGATION_CALLS_NOT_CONFIRMED" && investigation.callsNeeded !== null ? c.run.callsChanged(investigation.callsNeeded, investigation.confirmedCalls)
      : investigation.code === "ERR_INVESTIGATION_TOO_MANY_ROLES" && investigation.max !== null ? c.run.tooMany(investigation.max)
      : c.run.refused[investigation.code] ?? c.run.refusedOther;
    return box("REFUSED", true, <>
      <span style={{ ...statement, color: `rgb(${AMBER_RGB})` }}>{sentence}</span>
      <span style={meta}>{c.failedCode(investigation.code)}</span>
      {investigation.code === "ERR_INVESTIGATION_CALLS_NOT_CONFIRMED" && reread}
    </>, { "data-code": investigation.code });
  }
  const stored = investigation.investigation;
  const order = new Map<string, number>(roles.map((role, at) => [`${role.key.jobPoolUploadId}:${role.key.poolRoleId}`, at]));
  const title = new Map<string, string>(roles.map(role => [`${role.key.jobPoolUploadId}:${role.key.poolRoleId}`, `${role.title} · ${role.organizationName}`]));
  const keyOf = (task: { jobPoolUploadId: string; poolRoleId: string }) => `${task.jobPoolUploadId}:${task.poolRoleId}`;
  // The discovery's role order (tasks of roles outside it, which the route does not create, after them in the store's order).
  const tasks = [...stored.tasks].map((task, at) => ({ task, at: order.get(keyOf(task)) ?? roles.length + at })).sort((a, b) => a.at - b.at).map(entry => entry.task);
  const warn = stored.status !== "COMPLETED";
  return box("STORED", warn, <>
    <span data-testid="rd-investigation-status" data-status={stored.status} style={{ ...statement, fontWeight: 600, color: warn ? `rgb(${AMBER_RGB})` : "#e6f1f8" }}>{c.run.summary(c.run.status[stored.status])}</span>
    <span data-testid="rd-investigation-engine" style={{ ...meta, color: `rgb(${AMBER_RGB})` }}>{c.run.standIn}</span>
    {investigation.created === false && <span data-testid="rd-investigation-replayed" style={meta}>{c.run.replayed}</span>}
    {stored.tasks.some(task => task.status === "BUDGET_EXHAUSTED") && <span data-testid="rd-investigation-budget" style={{ ...meta, color: `rgb(${AMBER_RGB})` }}>{c.run.budget}</span>}
    {tasks.map(task => (
      <div key={keyOf(task)} data-testid="rd-investigation-task" data-role-key={keyOf(task)} data-status={task.status} style={{ display: "flex", flexDirection: "column", gap: "1px", paddingTop: "4px", borderTop: "1px solid rgba(120, 214, 255, 0.08)" }}>
        <span style={statement}>{title.get(keyOf(task)) ?? keyOf(task)}</span>
        <span style={meta}>{c.run.task[task.status]} · {c.run.taskCounts(task.pairs, task.stored)}{task.errorCode !== null ? ` · ${c.failedCode(task.errorCode)}` : ""}</span>
      </div>
    ))}
    <span style={meta}>{c.run.relationsHidden}</span>
    {reread}
  </>, { "data-investigation-id": stored.investigationId, "data-status": stored.status });
}

/**
 * RD-DETAIL: one role's trace in pool order — each requirement with a name relation: its lexical basis (weak named weak), the
 * capability proposal, the proposal's source-verified quotes with their source, and the evidence limitation when a quote does not
 * name the requirement; then the open requirements (no name relation). Nothing is concluded; the semantic state is stated.
 */
export function RoleDiscoveryTrace({ c, role, proposals, onInvestigate, task }: { c: RoleDiscoveryCopy; role: DiscoveryRole; proposals: PoolRoleDiscovery["proposals"]; onInvestigate?: (scope: JobScope) => void; task?: InvestigationTask }) {
  const related = role.requirements.filter(requirement => requirement.lexical.basis !== "NONE");
  const open = role.requirements.filter(requirement => requirement.lexical.basis === "NONE");
  const named = new Map(proposals.map(proposal => [proposal.id, proposal.name] as const));
  return (
    <div data-testid="rd-trace" style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "6px", padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(120, 214, 255, 0.12)", background: "rgba(2, 8, 14, 0.55)" }}>
      <span data-testid="rd-trace-semantic" style={{ ...meta, color: `rgb(${AMBER_RGB})` }}>{task ? c.run.roleTask(c.run.task[task.status]) : c.detail.semantic}</span>
      {related.map(requirement => {
        const lexical = requirement.lexical;
        if (lexical.basis === "NONE") return null;
        return (
          <div key={requirement.key.poolRequirementId} data-testid="rd-trace-requirement" data-requirement-id={requirement.key.poolRequirementId} data-basis={lexical.basis} data-proposal-id={lexical.proposalId} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ ...statement, fontWeight: 600 }}>{requirement.requirementText}</span>
            <span style={meta}>{c.detail.level(requirement.necessity, requirement.requiredLevel)}</span>
            <span data-testid="rd-trace-basis" style={{ ...meta, color: lexical.basis === "WEAK_TOKEN_CONTAINMENT" ? `rgb(${AMBER_RGB})` : "rgba(160, 232, 250, 0.92)" }}>{c.detail.basis[lexical.basis](lexical.matchedConstituent)}</span>
            <span style={meta}>{c.detail.proposal}: {named.get(lexical.proposalId) ?? lexical.proposalName}</span>
            {lexical.evidence.length === 0 ? <span style={meta}>{c.detail.noQuote}</span> : lexical.evidence.map((quote, at) => (
              <blockquote key={at} data-testid="rd-trace-quote" data-source-document-id={quote.sourceDocumentId} style={{ margin: 0, padding: "4px 8px", borderLeft: `2px solid rgba(${CYAN_RGB}, 0.4)`, display: "flex", flexDirection: "column", gap: "1px" }}>
                <span style={{ ...statement, fontStyle: "italic" }}>“{quote.exactQuote}”</span>
                <span style={meta}>{c.detail.source}: {quote.sourceDocumentId}</span>
              </blockquote>
            ))}
            {lexical.quoteNamesRequirement === false && <span data-testid="rd-trace-quote-silent" style={{ ...meta, color: `rgb(${AMBER_RGB})` }}>{c.detail.quoteSilent}</span>}
          </div>
        );
      })}
      <div data-testid="rd-trace-open" data-count={open.length} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <span style={kicker}>{c.detail.openTitle(open.length)}</span>
        {open.length === 0 ? <span style={meta}>{c.detail.openNone}</span> : open.map(requirement => (
          <span key={requirement.key.poolRequirementId} data-testid="rd-trace-open-requirement" data-requirement-id={requirement.key.poolRequirementId} style={meta}>{requirement.requirementText} · {c.detail.level(requirement.necessity, requirement.requiredLevel)}</span>
        ))}
      </div>
      {onInvestigate && (
        <div data-testid="rd-investigate-way" style={{ display: "flex", flexDirection: "column", gap: "4px", paddingTop: "6px", borderTop: "1px solid rgba(120, 214, 255, 0.1)" }}>
          <span style={meta}>{c.detail.investigateHint}</span>
          <button type="button" data-testid="rd-investigate" data-job-pool-upload-id={role.key.jobPoolUploadId} data-pool-role-id={role.key.poolRoleId} onClick={() => onInvestigate({ jobPoolUploadId: role.key.jobPoolUploadId, poolRoleId: role.key.poolRoleId })} style={action}>{c.detail.investigate}</button>
        </div>
      )}
    </div>
  );
}

/** The explicit entry (recovery §8: "DISCOVER JOBS"; the orbit's own HUD actions stay as they are). It stands where the panel will
 *  open — the right column below the telemetry bar: below orbit 04 it covered that orbit at 1600 × 900, 1440 × 900 and 1280 × 720
 *  (measured); in the stack it takes its place in the column (career-demo-layout.ts). */
export function RoleDiscoveryEntry({ locale, onOpen }: { locale: SilLocale; onOpen(): void }) {
  const c = ROLE_DISCOVERY_COPY[locale];
  return (
    <div data-testid="rd-entry" data-sx-shell="rd-entry" style={{ position: "absolute", right: "24px", top: "180px", zIndex: 31, display: "flex", alignItems: "center", gap: "12px", width: "min(400px, 29vw)", boxSizing: "border-box", padding: "8px 8px 8px 14px", borderRadius: "14px", border: `1px solid rgba(${CYAN_RGB}, 0.32)`, background: "linear-gradient(180deg, rgba(8, 21, 34, 0.9), rgba(3, 8, 15, 0.94))", boxShadow: "0 12px 32px rgba(0, 0, 0, 0.5)", backdropFilter: "blur(10px)" }}>
      <span style={{ ...meta, color: "rgba(196, 222, 236, 0.92)" }}>{c.entryHint}</span>
      <button type="button" data-testid="rd-open" onClick={onOpen} style={{ ...action, flexShrink: 0 }}>{c.entry}</button>
    </div>
  );
}
