import { db } from "../db/client";
import { ProviderCallBlocked, runWithProviderCallRecorder, type ProviderCallRecorder } from "./guard";
import { PostgresProviderCallRegister, readJobCallLimit } from "./register";
import { ensureProviderCallRegister } from "./register-schema";

/** A register that cannot be opened: every call is refused before it is sent. */
const unavailableRecorder: ProviderCallRecorder = {
  begin: async () => { throw new ProviderCallBlocked("ERR_PROVIDER_CALL_REGISTER_FAILED"); },
  markSent: async () => undefined, complete: async () => undefined, failAfterSend: async () => undefined, failBeforeSend: async () => undefined
};

/**
 * Runs the work of ONE job (the extraction) inside the call register of that job: budget `GEMINI_JOB_CALL_LIMIT` for extraction and
 * matching together, every model call written before it is sent. The register is provisioned on whatever database the job runs on
 * (additive, idempotent); when it cannot be provisioned or opened, every call of the job is refused — never an unrecorded call.
 */
export async function withJobCallRegister<T>(jobId: string, work: () => Promise<T>, env: Record<string, string | undefined> = process.env): Promise<T> {
  const recorder = await ensureProviderCallRegister().then(
    () => new PostgresProviderCallRegister(db.$client, { jobId, limit: readJobCallLimit(env) }) as ProviderCallRecorder,
    () => unavailableRecorder
  );
  return runWithProviderCallRecorder(recorder, work);
}
