import { db } from "../db/client";
import { openRelationCache } from "../job-pool/relation-cache-registration";
import { ProviderCallBlocked, runWithProviderCallRecorder, type ProviderCallRecorder } from "./guard";
import { PostgresProviderCallRegister, readJobCallLimit } from "./register";

/** A register that cannot be opened: every call is refused before it is sent (never an unrecorded call on a database that should have a register). */
const unavailableRecorder: ProviderCallRecorder = {
  begin: async () => { throw new ProviderCallBlocked("ERR_PROVIDER_CALL_REGISTER_FAILED"); },
  markSent: async () => undefined, complete: async () => undefined, failAfterSend: async () => undefined, failBeforeSend: async () => undefined
};

/**
 * Runs the work of ONE job (the extraction) inside the call register of that job: budget `GEMINI_JOB_CALL_LIMIT` for extraction and
 * matching together, every model call written before it is sent. On a database that is not a verified disposable one the register
 * cannot be provisioned (same gate as the relation cache); the job then runs as it always did, unrecorded. A register that is
 * provisioned but fails to open refuses every call.
 */
export async function withJobCallRegister<T>(jobId: string, work: () => Promise<T>, env: Record<string, string | undefined> = process.env): Promise<T> {
  const cache = await openRelationCache();
  if (cache.state === "NOT_PROVISIONED") return work();
  const recorder = cache.state === "AVAILABLE" ? new PostgresProviderCallRegister(db.$client, { jobId, limit: readJobCallLimit(env) }) : unavailableRecorder;
  return runWithProviderCallRecorder(recorder, work);
}
