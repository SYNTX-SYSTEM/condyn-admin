import { setDefaultProviderCallRecorder } from "../../../lib/career/provider-calls/guard";

/**
 * Tests drive the Gemini providers with scripted SDK stand-ins and no job context. Without a recorder the seam refuses every call,
 * so the test setup installs a recorder that only hands out ids. Production code never does this (architecture test).
 */
setDefaultProviderCallRecorder({
  begin: async () => "PCALL_TEST", markSent: async () => undefined, complete: async () => undefined,
  failAfterSend: async () => undefined, failBeforeSend: async () => undefined
});
