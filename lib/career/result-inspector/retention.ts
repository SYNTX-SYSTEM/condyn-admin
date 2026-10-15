import type { CapabilityProviderExchangeArchive, CapabilityProviderExchangeRecord } from "../capability-core";

/**
 * Retention of Result Inspector artifacts (SFE 2026-10-15). The received Gemini text quotes the candidate's CV, so it
 * is never kept without an end: every exchange gets an expiry when it is retained, nothing is returned after it, and
 * expired exchanges are deleted on every write and read (no scheduler needed). The window is
 * CONDYN_GEMINI_EXCHANGE_RETENTION_DAYS (whole days, default 7, at most 30); any other value falls back to the default.
 */
export const EXCHANGE_RETENTION_DAYS = "CONDYN_GEMINI_EXCHANGE_RETENTION_DAYS";
export const DEFAULT_EXCHANGE_RETENTION_DAYS = 7;
export const MAX_EXCHANGE_RETENTION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export function exchangeRetentionMs(environment: Record<string, string | undefined> = process.env): number {
  const raw = environment[EXCHANGE_RETENTION_DAYS];
  const days = raw !== undefined && /^[1-9][0-9]*$/.test(raw) && Number(raw) <= MAX_EXCHANGE_RETENTION_DAYS ? Number(raw) : DEFAULT_EXCHANGE_RETENTION_DAYS;
  return days * DAY_MS;
}

export interface RetainedProviderExchange extends CapabilityProviderExchangeRecord { retainedAt: string; expiresAt: string; }

/** Write side for Discovery (retain), read and deletion side for the inspector and for an erasure request. */
export interface ProviderExchangeStore extends CapabilityProviderExchangeArchive {
  get(runId: string): Promise<RetainedProviderExchange | null>;
  delete(runId: string): Promise<boolean>;
  purgeExpired(): Promise<number>;
}

export interface ProviderExchangeStoreOptions { retentionMs?: number; now?: () => Date; }

/** First write wins: a RUN_ id has exactly one provider exchange, a later write never replaces it. */
export class InMemoryProviderExchangeStore implements ProviderExchangeStore {
  private readonly exchanges = new Map<string, RetainedProviderExchange>();
  private readonly retentionMs: number;
  private readonly now: () => Date;
  constructor(options: ProviderExchangeStoreOptions = {}) {
    this.retentionMs = options.retentionMs ?? exchangeRetentionMs();
    this.now = options.now ?? (() => new Date());
  }
  async retain(record: CapabilityProviderExchangeRecord): Promise<void> {
    await this.purgeExpired();
    if (this.exchanges.has(record.runId)) return;
    const retainedAt = this.now();
    this.exchanges.set(record.runId, structuredClone({ ...record, retainedAt: retainedAt.toISOString(), expiresAt: new Date(retainedAt.getTime() + this.retentionMs).toISOString() }));
  }
  async get(runId: string): Promise<RetainedProviderExchange | null> {
    await this.purgeExpired();
    const exchange = this.exchanges.get(runId);
    return exchange ? structuredClone(exchange) : null;
  }
  async delete(runId: string): Promise<boolean> { return this.exchanges.delete(runId); }
  async purgeExpired(): Promise<number> {
    const now = this.now().getTime();
    let purged = 0;
    for (const [runId, exchange] of this.exchanges) if (Date.parse(exchange.expiresAt) <= now) { this.exchanges.delete(runId); purged++; }
    return purged;
  }
}
