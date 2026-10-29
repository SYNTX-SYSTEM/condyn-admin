import { relationKey, proposalContentHash, requirementContentHash, engineVersionHash, type CachedRelation, type RelationEngineIdentity, type RelationCacheReader } from "./relation-cache";
import { evaluateRole, type CallLedger, type EngineProposal, type EngineRequirement, type RelationWriter, type SemanticProvider } from "./semantic-relation-engine";
import type { InvestigationStatus, TaskStatus } from "./semantic-investigation-store";

/**
 * Runs one explicit investigation role by role (stage 3, spec §2/§3): a role whose pairs are all cached costs nothing (CACHED); a
 * role with pending pairs gets exactly one call; when the budget is exhausted the remaining roles are CANCELLED without a call;
 * nothing resumes by itself. Roles complete independently — a later failure never loses an earlier role's relations.
 */
export interface InvestigationStoreLike {
  moveTask(input: { investigationId: string; jobPoolUploadId: string; poolRoleId: string; from: TaskStatus; to: TaskStatus; errorCode?: string | null; refusals?: unknown; stored?: number; now: string }): Promise<void>;
  setStatus(investigationId: string, status: InvestigationStatus, now: string): Promise<void>;
}
export interface RunRole { key: { jobPoolUploadId: string; poolRoleId: string }; requirements: EngineRequirement[] }

export async function runInvestigation(input: {
  investigationId: string; store: InvestigationStoreLike; engine: RelationEngineIdentity; provider: SemanticProvider; ledger: CallLedger;
  cache: RelationCacheReader & RelationWriter; proposals: EngineProposal[]; roles: RunRole[]; now: () => string;
}): Promise<{ status: InvestigationStatus; roles: Array<{ key: RunRole["key"]; status: TaskStatus; code?: string }> }> {
  const { store, investigationId } = input;
  await store.setStatus(investigationId, "RUNNING", input.now());
  const engineHash = engineVersionHash(input.engine);
  const hashes = input.proposals.map(p => proposalContentHash({ name: p.name, scope: p.scope, structuralDefinition: p.structuralDefinition, evidence: p.evidence.map(e => ({ ...e, verificationState: "SOURCE_MATCH_VERIFIED" as const })) }));
  const results: Array<{ key: RunRole["key"]; status: TaskStatus; code?: string }> = [];
  let stop = false;
  for (const role of input.roles) {
    const t = { investigationId, jobPoolUploadId: role.key.jobPoolUploadId, poolRoleId: role.key.poolRoleId };
    if (stop) { await store.moveTask({ ...t, from: "PENDING", to: "CANCELLED", now: input.now() }); results.push({ key: role.key, status: "CANCELLED" }); continue; }
    let cached: Set<string>;
    try {
      const keysOf = (r: EngineRequirement) => hashes.map(h => relationKey(h, requirementContentHash(r), engineHash));
      cached = new Set((await input.cache.getByKeys(role.requirements.flatMap(keysOf))).map(c => c.relationKey));
      const pending = role.requirements.filter(r => keysOf(r).some(k => !cached.has(k)));
      if (pending.length === 0) { await store.moveTask({ ...t, from: "PENDING", to: "CACHED", now: input.now() }); results.push({ key: role.key, status: "CACHED" }); continue; }
      await store.moveTask({ ...t, from: "PENDING", to: "RUNNING", now: input.now() });
      const outcome = await evaluateRole({ engine: input.engine, provider: input.provider, ledger: input.ledger, writer: input.cache, proposals: input.proposals, pendingRequirements: pending, now: input.now });
      if (outcome.status === "SUCCEEDED") { await store.moveTask({ ...t, from: "RUNNING", to: "SUCCEEDED", stored: outcome.stored, now: input.now() }); results.push({ key: role.key, status: "SUCCEEDED" }); }
      else if (outcome.status === "BUDGET_EXHAUSTED") { await store.moveTask({ ...t, from: "RUNNING", to: "BUDGET_EXHAUSTED", errorCode: "ERR_BUDGET_EXHAUSTED", now: input.now() }); results.push({ key: role.key, status: "BUDGET_EXHAUSTED" }); stop = true; }
      else { await store.moveTask({ ...t, from: "RUNNING", to: "FAILED", errorCode: outcome.code, refusals: outcome.refusals, now: input.now() }); results.push({ key: role.key, status: "FAILED", code: outcome.code }); }
    } catch (error) {
      // A store or cache failure of this role: the task cannot be moved reliably; the investigation is INTERRUPTED and nothing continues.
      await store.setStatus(investigationId, "INTERRUPTED", input.now()).catch(() => undefined);
      return { status: "INTERRUPTED", roles: [...results, { key: role.key, status: "INTERRUPTED", code: error instanceof Error ? error.message.split(":")[0] : "ERR_INVESTIGATION_STEP_FAILED" }] };
    }
  }
  const done = results.filter(r => r.status === "SUCCEEDED" || r.status === "CACHED").length;
  const status: InvestigationStatus = done === results.length ? "COMPLETED" : done > 0 ? "PARTIAL" : "FAILED";
  await store.setStatus(investigationId, status, input.now());
  return { status, roles: results };
}
