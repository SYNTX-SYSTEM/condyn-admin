import { createHash } from "node:crypto";
import type { PoolCapabilityRequirement } from "../matching/pool";
import {
  SEMANTIC_RELATION_STATES, assertCachedRelation, engineVersionHash, proposalContentHash, relationKey, requirementContentHash,
  type CachedRelation, type RelationEngineIdentity, type SemanticRelationState
} from "./relation-cache";

/**
 * Semantic relation engine core (stage 3; spec CONDYN_SEMANTIC_RELATION_ENGINE_SPEC_2026-10-24.md). No database and no network in
 * this module: a provider is injected, the budget is a ledger interface, the store is a writer interface. A model statement is a
 * classification with its explanation and its limits — never verified competence, never a decision.
 *
 * - one call per role, only for the pairs not already cached; exactly one attempt, no silent retry
 * - the call is reserved against a ledger BEFORE it is sent; no reservation, no call
 * - the model cites evidence ids; the server resolves them to the stored quotes (the model never writes a quote)
 * - strict admission: every requested pair exactly once, known ids only, known state, cited ids of that proposal, a cited
 *   evidence for EQUIVALENT / COVERS / PARTIAL, an explanation free of competence, suitability and score claims
 * - a refused pair is never stored and never repaired; the role is FAILED with the refusals
 */
export interface EngineProposal {
  id: string; name: string; scope: "ATOMIC" | "COMPOSITE"; structuralDefinition: string;
  evidence: Array<{ evidenceId: string; sourceDocumentId: string; exactQuote: string }>;
}
export interface EngineRequirement {
  key: { jobPoolUploadId: string; poolRoleId: string; poolRequirementId: string };
  capability_name: string; aliases?: string[]; required_level: string; requirement_type?: PoolCapabilityRequirement["requirement_type"]; domain: string; necessity?: PoolCapabilityRequirement["necessity"];
}
/** What the provider sees: proposals with evidence ids, requirements by an opaque id. No role, organisation or pool text (spec C-1). */
export interface ProviderRequest {
  engine: RelationEngineIdentity;
  proposals: Array<{ id: string; name: string; scope: string; structuralDefinition: string; evidence: Array<{ evidenceId: string; exactQuote: string }> }>;
  requirements: Array<{ requirementId: string; text: string; aliases: string[]; requiredLevel: string; requirementType: string }>;
}
/** A provider declares who it is; the engine serves only the engine identity it declares (PINK D-ENG-2). */
export interface SemanticProvider { readonly identity: { provider: string; model: string }; evaluate(request: ProviderRequest): Promise<{ rawText: string }> }
export interface CallLedger { reserve(): Promise<boolean>; consume(meta: { requestBytes: number; responseBytes: number }): Promise<void>; release(): Promise<void> }
export interface RelationWriter { saveIfAbsent(records: CachedRelation[]): Promise<{ inserted: number; duplicates: number; divergent: string[] }> }

/**
 * Claim guard (PINK D-ENG-1, D-ENG-3). A blocklist can never be complete, so the guard is defence in depth and the real protection is
 * structural: a model statement is stored and shown only as an unverified model statement with authority NONE, and never feeds a
 * ranking or a decision. To stay usable it is word-based and operand-aware:
 *  - the operands' own names (proposal names, requirement texts and aliases) are removed before the check — „Security Certification“
 *    or „Neo4j“ are data, not claims;
 *  - text is normalised (NFKC, case, zero-width characters, Cyrillic/Greek look-alikes) and split into WORDS; runs of single letters
 *    („s c o r e“) are joined; a claim stem must START a word (so „improve“, „approved“, „provenance“, „Yorkshire“, „competition“
 *    pass, „scored“, „Qualification“, „recommends“ do not), and nothing is matched across word boundaries;
 *  - numbers are refused where scores hide: a percent sign or percent word, a ratio („9/10“, „8 out of 10“, „acht von zehn“), a
 *    leading-zero decimal („0.87“); other digits („OAuth 2.0“, „L3“, „ISO 26262“) are data.
 */
const LOOKALIKE: Record<string, string> = { "а": "a", "в": "b", "е": "e", "к": "k", "м": "m", "н": "h", "о": "o", "р": "p", "с": "c", "т": "t", "у": "y", "х": "x", "і": "i", "ѕ": "s", "ο": "o", "α": "a", "ε": "e", "ρ": "p", "ν": "v", "ι": "i", "κ": "k" };
const CLAIM_PREFIXES = ["scor", "rank", "recomm", "hire", "hiring", "qualif", "suitab", "competen", "verifi", "certifi", "percent", "prozent", "empfehl", "eignung", "geeignet", "einstell", "kompetenz", "nachgewiesen", "bewert", "verifiz"];
const CLAIM_WORDS = new Set(["proof", "proofs", "prove", "proves", "proved", "proven", "pct", "idealer", "ideal"]);
const CLAIM_PHRASES = [/\b(good|best|perfect|great|strong) (fit|match)\b/, /\bwell suited\b/, /\bpasst gut\b/];
const NUMBER_WORDS = "zero one two three four five six seven eight nine ten eleven twelve twenty thirty forty fifty sixty seventy eighty ninety hundred null eins zwei drei vier fuenf sechs sieben acht neun zehn zwanzig dreissig hundert";
const NUM = `(?:\\d+(?:[.,]\\d+)?|(?:${NUMBER_WORDS.split(" ").join("|")})(?:[ -](?:${NUMBER_WORDS.split(" ").join("|")}))?)`;
const RATIO = new RegExp(`\\b${NUM}\\s*(?:/|out of|von|of)\\s*${NUM}\\b`);
const norm = (text: string) => [...text.normalize("NFKC").toLowerCase().replace(/[\u200b-\u200f\u2060\ufeff\u00ad]/g, "")].map(ch => LOOKALIKE[ch] ?? ch).join("");
export function containsClaim(text: string, operandTexts: string[] = []): boolean {
  let t = norm(text);
  for (const operand of operandTexts.map(norm).filter(o => o.length > 1).sort((x, y) => y.length - x.length)) t = t.split(operand).join(" ");
  if (/%|％/.test(t) || /\b0[.,]\d+/.test(t) || /\d\s?(?:percent|prozent|pct)/.test(t) || RATIO.test(t.replace(/[-–]/g, " "))) return true;
  const raw = t.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const words: string[] = [];
  for (let i = 0; i < raw.length; i += 1) {
    if (raw[i].length === 1 && /\p{L}/u.test(raw[i])) { let j = i, joined = ""; while (j < raw.length && raw[j].length === 1 && /\p{L}/u.test(raw[j])) { joined += raw[j]; j += 1; } words.push(joined); i = j - 1; } else words.push(raw[i]);
  }
  if (CLAIM_PHRASES.some(re => re.test(words.join(" ")))) return true;
  return words.some(w => CLAIM_WORDS.has(w) || CLAIM_PREFIXES.some(prefix => w.startsWith(prefix)));
}
/** Upper bound for the model's free text fields (PINK O-ENG-2). */
export const MAX_TEXT_LENGTH = 1000;
const sha256 = (value: string) => createHash("sha256").update(value, "utf8").digest("hex");
/** The proposal as the cache hashes it (its evidence is source-verified by construction). */
const forHash = (p: EngineProposal) => ({ name: p.name, scope: p.scope, structuralDefinition: p.structuralDefinition, evidence: p.evidence.map(e => ({ ...e, verificationState: "SOURCE_MATCH_VERIFIED" as const })) });
const nonEmpty = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

export interface Refusal { proposalId: string | null; requirementId: string | null; reason: string }

export function buildProviderRequest(engine: RelationEngineIdentity, proposals: EngineProposal[], requirements: EngineRequirement[]): { request: ProviderRequest; idOf: Map<string, EngineRequirement> } {
  const idOf = new Map<string, EngineRequirement>();
  const request: ProviderRequest = {
    engine,
    proposals: proposals.map(p => ({ id: p.id, name: p.name, scope: p.scope, structuralDefinition: p.structuralDefinition, evidence: p.evidence.map(e => ({ evidenceId: e.evidenceId, exactQuote: e.exactQuote })) })),
    requirements: requirements.map((r, i) => { const requirementId = `R${i + 1}`; idOf.set(requirementId, r); return { requirementId, text: r.capability_name, aliases: [...(r.aliases ?? [])], requiredLevel: r.required_level, requirementType: r.requirement_type ?? "CAPABILITY" }; })
  };
  return { request, idOf };
}

/** Strict admission of one provider output against its request. Returns the records of the admitted pairs and every refusal. */
export function admitProviderOutput(input: { rawText: string; engine: RelationEngineIdentity; proposals: EngineProposal[]; requirements: EngineRequirement[]; idOf: Map<string, EngineRequirement>; now: string }): { records: CachedRelation[]; refusals: Refusal[] } {
  const refusals: Refusal[] = [];
  let parsed: unknown;
  try { parsed = JSON.parse(input.rawText); } catch { return { records: [], refusals: [{ proposalId: null, requirementId: null, reason: "OUTPUT_NOT_JSON" }] }; }
  const items = parsed && typeof parsed === "object" && Array.isArray((parsed as { relations?: unknown }).relations) ? (parsed as { relations: unknown[] }).relations : null;
  if (items === null) return { records: [], refusals: [{ proposalId: null, requirementId: null, reason: "OUTPUT_SHAPE_INVALID" }] };
  const proposals = new Map(input.proposals.map(p => [p.id, p]));
  const seen = new Map<string, Record<string, unknown>>();
  for (const item of items) {
    if (!item || typeof item !== "object") { refusals.push({ proposalId: null, requirementId: null, reason: "ITEM_NOT_OBJECT" }); continue; }
    const v = item as Record<string, unknown>;
    const pid = typeof v.proposalId === "string" ? v.proposalId : null, rid = typeof v.requirementId === "string" ? v.requirementId : null;
    if (pid === null || rid === null || !proposals.has(pid) || !input.idOf.has(rid)) { refusals.push({ proposalId: pid, requirementId: rid, reason: "UNKNOWN_ID" }); continue; }
    const pair = `${pid}\u0000${rid}`;
    if (seen.has(pair)) { refusals.push({ proposalId: pid, requirementId: rid, reason: "DUPLICATE_PAIR" }); continue; }
    seen.set(pair, v);
  }
  const engineHash = engineVersionHash(input.engine);
  const records: CachedRelation[] = [];
  for (const proposal of input.proposals) for (const [rid, requirement] of input.idOf) {
    const v = seen.get(`${proposal.id}\u0000${rid}`);
    if (v === undefined) { refusals.push({ proposalId: proposal.id, requirementId: rid, reason: "PAIR_MISSING" }); continue; }
    const fail = (reason: string) => { refusals.push({ proposalId: proposal.id, requirementId: rid, reason }); };
    if (!SEMANTIC_RELATION_STATES.includes(v.state as SemanticRelationState)) { fail("STATE_UNKNOWN"); continue; }
    const state = v.state as SemanticRelationState;
    if (!nonEmpty(v.relationExplanation) || !nonEmpty(v.evidenceLimitation)) { fail("EXPLANATION_OR_LIMITATION_MISSING"); continue; }
    if (v.relationExplanation.length > MAX_TEXT_LENGTH || v.evidenceLimitation.length > MAX_TEXT_LENGTH) { fail("TEXT_TOO_LONG"); continue; }
    const operandTexts = [proposal.name, requirement.capability_name, ...(requirement.aliases ?? [])];
    if (containsClaim(v.relationExplanation, operandTexts) || containsClaim(v.evidenceLimitation, operandTexts)) { fail("CLAIM_IN_TEXT"); continue; }
    const cited = Array.isArray(v.citedEvidenceIds) ? v.citedEvidenceIds : null;
    if (cited === null || cited.some(id => typeof id !== "string") || new Set(cited).size !== cited.length) { fail("CITATION_INVALID"); continue; }
    const byId = new Map(proposal.evidence.map(e => [e.evidenceId, e]));
    if (cited.some(id => !byId.has(id as string))) { fail("CITED_EVIDENCE_NOT_OF_PROPOSAL"); continue; }
    if (cited.length === 0 && (state === "EQUIVALENT" || state === "COVERS" || state === "PARTIAL")) { fail("POSITIVE_STATE_WITHOUT_EVIDENCE"); continue; }
    const sourceEvidence = cited.map(id => { const e = byId.get(id as string)!; return { sourceDocumentId: e.sourceDocumentId, exactQuote: e.exactQuote }; });
    const record: CachedRelation = {
      relationKey: relationKey(proposalContentHash(forHash(proposal)), requirementContentHash(requirement), engineHash),
      proposalContentHash: proposalContentHash(forHash(proposal)), requirementContentHash: requirementContentHash(requirement), engineVersionHash: engineHash, engine: input.engine,
      state, capabilityName: proposal.name, requirementText: requirement.capability_name, sourceEvidence,
      relationExplanation: v.relationExplanation.trim(), evidenceLimitation: v.evidenceLimitation.trim(), rawOutputSha256: sha256(input.rawText), authorityState: "NONE", createdAt: input.now
    };
    try { assertCachedRelation(record); records.push(record); } catch { fail("RECORD_INVALID"); }
  }
  return { records, refusals };
}

export type RoleOutcome =
  | { status: "SUCCEEDED"; stored: number; duplicates: number; divergent: string[] }
  | { status: "BUDGET_EXHAUSTED" }
  | { status: "FAILED"; code: string; refusals: Refusal[] };

const codeOf = (error: unknown, fallback: string) => error instanceof Error && /^ERR_[A-Z_]+/.test(error.message) ? error.message.split(":")[0] : fallback;

/**
 * One role, one attempt; never throws (PINK O-ENG-3). The reservation happens before the provider is called. Outcomes:
 * provider failure → released; ledger consume failure → FAILED ERR_LEDGER_CONSUME_FAILED (the call happened, nothing stored);
 * refused output → FAILED, nothing stored; store failure → FAILED ERR_RELATION_WRITE_FAILED (the call is consumed, nothing stored).
 * An engine identity the provider does not declare is refused before anything is reserved.
 */
export async function evaluateRole(input: {
  engine: RelationEngineIdentity; provider: SemanticProvider; ledger: CallLedger; writer: RelationWriter;
  proposals: EngineProposal[]; pendingRequirements: EngineRequirement[]; now: () => string;
}): Promise<RoleOutcome> {
  if (input.provider.identity.provider !== input.engine.provider || input.provider.identity.model !== input.engine.model) return { status: "FAILED", code: "ERR_ENGINE_IDENTITY_MISMATCH", refusals: [] };
  if (input.pendingRequirements.length === 0 || input.proposals.length === 0) return { status: "SUCCEEDED", stored: 0, duplicates: 0, divergent: [] };
  let reserved: boolean;
  try { reserved = await input.ledger.reserve(); } catch (error) { return { status: "FAILED", code: codeOf(error, "ERR_LEDGER_RESERVE_FAILED"), refusals: [] }; }
  if (!reserved) return { status: "BUDGET_EXHAUSTED" };
  const { request, idOf } = buildProviderRequest(input.engine, input.proposals, input.pendingRequirements);
  let raw: { rawText: string };
  try { raw = await input.provider.evaluate(request); } catch (error) {
    try { await input.ledger.release(); } catch { /* the failure below is the outcome */ }
    return { status: "FAILED", code: codeOf(error, "ERR_SEMANTIC_PROVIDER_FAILED"), refusals: [] };
  }
  try { await input.ledger.consume({ requestBytes: Buffer.byteLength(JSON.stringify(request)), responseBytes: Buffer.byteLength(raw.rawText) }); } catch { return { status: "FAILED", code: "ERR_LEDGER_CONSUME_FAILED", refusals: [] }; }
  const { records, refusals } = admitProviderOutput({ rawText: raw.rawText, engine: input.engine, proposals: input.proposals, requirements: input.pendingRequirements, idOf, now: input.now() });
  if (refusals.length > 0) return { status: "FAILED", code: "ERR_SEMANTIC_OUTPUT_REFUSED", refusals };
  try { const saved = await input.writer.saveIfAbsent(records); return { status: "SUCCEEDED", stored: saved.inserted, duplicates: saved.duplicates, divergent: saved.divergent }; }
  catch (error) { return { status: "FAILED", code: codeOf(error, "ERR_RELATION_WRITE_FAILED") === "ERR_RELATION_CACHE_RECORD_CORRUPT" ? "ERR_RELATION_CACHE_RECORD_CORRUPT" : "ERR_RELATION_WRITE_FAILED", refusals: [] }; }
}

/** Deterministic stand-in (provider "stand-in"): a labelled test double, never presented as a model. Requirement name fully inside the
 *  proposal name → COVERS citing that proposal's first evidence; some shared token → PARTIAL; otherwise UNCLEAR without a citation. */
export class StandInSemanticProvider implements SemanticProvider {
  readonly identity = { provider: "stand-in", model: "stand-in" } as const;
  calls = 0;
  async evaluate(request: ProviderRequest): Promise<{ rawText: string }> {
    this.calls += 1;
    const tokens = (s: string) => s.toLowerCase().split(/[^\p{L}\p{N}+#]+/u).filter(Boolean);
    const relations = request.proposals.flatMap(p => request.requirements.map(r => {
      const pt = new Set(tokens(p.name)), rt = tokens(r.text);
      const full = rt.length > 0 && rt.every(t => pt.has(t)), some = rt.some(t => pt.has(t));
      const state = full ? "COVERS" : some ? "PARTIAL" : "UNCLEAR";
      return { proposalId: p.id, requirementId: r.requirementId, state, citedEvidenceIds: state === "UNCLEAR" ? [] : p.evidence.slice(0, 1).map(e => e.evidenceId),
        relationExplanation: `STAND-IN rule: ${state === "COVERS" ? "all words of the requirement occur in the proposal name" : state === "PARTIAL" ? "some words of the requirement occur in the proposal name" : "no shared words"}.`,
        evidenceLimitation: "Stand-in classification by word overlap; no model read the quote." };
    }));
    return { rawText: JSON.stringify({ relations }) };
  }
}
