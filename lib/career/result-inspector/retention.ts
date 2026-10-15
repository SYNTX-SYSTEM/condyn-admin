import { randomUUID } from "node:crypto";
import type { CapabilityProviderExchangeArchive, CapabilityProviderExchangeRecord } from "../capability-core";
import { currentExchangeAttempt, type ExchangeAttempt } from "./attempt";

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

/** One archived exchange: the record plus its own id, the job attempt it ran in and its retention window. */
export interface RetainedProviderExchange extends CapabilityProviderExchangeRecord { exchangeId: string; attempt: ExchangeAttempt | null; retainedAt: string; expiresAt: string; }

/**
 * Write side for Discovery (retain), read side for the inspector, deletion side for expiry and erasure. Exactly one
 * COMPLETED exchange per RUN_ id (the response the run was persisted from); FAILED exchanges are kept per attempt.
 */
export interface ProviderExchangeStore extends CapabilityProviderExchangeArchive {
  completedForRun(runId: string): Promise<RetainedProviderExchange[]>;
  forJob(jobId: string): Promise<RetainedProviderExchange[]>;
  delete(exchangeId: string): Promise<boolean>;
  purgeExpired(): Promise<number>;
}

export interface ProviderExchangeStoreOptions { retentionMs?: number; now?: () => Date; }

export const newExchangeId = () => `EXC_${randomUUID().replaceAll("-", "").slice(0, 24).toUpperCase()}`;

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
    if (record.outcome === "COMPLETED" && [...this.exchanges.values()].some(item => item.runId === record.runId && item.outcome === "COMPLETED")) return;
    const retainedAt = this.now();
    const exchange: RetainedProviderExchange = { ...structuredClone(record), exchangeId: newExchangeId(), attempt: currentExchangeAttempt(), retainedAt: retainedAt.toISOString(), expiresAt: new Date(retainedAt.getTime() + this.retentionMs).toISOString() };
    this.exchanges.set(exchange.exchangeId, exchange);
  }
  async completedForRun(runId: string): Promise<RetainedProviderExchange[]> {
    await this.purgeExpired();
    return [...this.exchanges.values()].filter(item => item.runId === runId && item.outcome === "COMPLETED").map(item => structuredClone(item));
  }
  async forJob(jobId: string): Promise<RetainedProviderExchange[]> {
    await this.purgeExpired();
    return [...this.exchanges.values()].filter(item => item.attempt?.jobId === jobId).sort((a, b) => a.retainedAt.localeCompare(b.retainedAt)).map(item => structuredClone(item));
  }
  async delete(exchangeId: string): Promise<boolean> { return this.exchanges.delete(exchangeId); }
  async purgeExpired(): Promise<number> {
    const now = this.now().getTime();
    let purged = 0;
    for (const [exchangeId, exchange] of this.exchanges) if (Date.parse(exchange.expiresAt) <= now) { this.exchanges.delete(exchangeId); purged++; }
    return purged;
  }
}
