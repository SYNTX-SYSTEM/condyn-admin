import { describe, expect, it } from "vitest";
import { ProviderCallBlocked, classifyProviderError, guardedGenerateContent, httpStatusOf, providerCallRecorderActive, runWithProviderCallRecorder, withProviderCallMeta, type ProviderCallRecorder } from "../../../lib/career/provider-calls/guard";

/** The seam of every model call (point 2), DETERMINISTIC_FIXTURE: a recording fake instead of the database; no network, no model. */
function fake(options: { begin?: () => Promise<string>; markSent?: () => Promise<void> } = {}) {
  const log: string[] = []; const begins: unknown[] = []; const ends: unknown[] = [];
  const recorder: ProviderCallRecorder = {
    begin: async input => { begins.push(input); if (options.begin) return options.begin(); log.push("begin"); return "C1"; },
    markSent: async () => { if (options.markSent) return options.markSent(); log.push("sent"); },
    complete: async (_id, bytes) => { log.push("complete"); ends.push(bytes); },
    failAfterSend: async (_id, info) => { log.push("failAfterSend"); ends.push(info); },
    failBeforeSend: async (_id, code) => { log.push(`failBeforeSend:${code}`); }
  };
  return { recorder, log, begins, ends };
}

describe("guardedGenerateContent", () => {
  it("without a bound recorder the call runs exactly as it always did", async () => {
    expect(providerCallRecorderActive()).toBe(false);
    expect(await guardedGenerateContent("SEMANTIC", async () => "ok")).toBe("ok");
    await expect(guardedGenerateContent("SEMANTIC", async () => { throw new Error("boom"); })).rejects.toThrow("boom");
  });

  it("write-ahead: the row exists and is SENT before the request, and the order is begin → sent → request → complete", async () => {
    const f = fake(); const order: string[] = [];
    const out = await runWithProviderCallRecorder(f.recorder, () => guardedGenerateContent("EXTRACTION_LEGACY", async () => { order.push(...f.log, "request"); return { text: "abc" }; }, { requestBytes: 10, responseBytes: r => r.text.length }));
    expect(out).toEqual({ text: "abc" });
    expect(order).toEqual(["begin", "sent", "request"]);
    expect(f.log).toEqual(["begin", "sent", "complete"]);
    expect(f.ends).toEqual([{ requestBytes: 10, responseBytes: 3 }]);
  });

  it("no register row, no call: a refused begin never invokes the request, whatever the reason", async () => {
    for (const make of [() => { throw new ProviderCallBlocked("ERR_PROVIDER_CALL_BUDGET_EXHAUSTED"); }, () => { throw new Error("db down"); }]) {
      let sent = 0; const f = fake({ begin: async () => make() });
      const error = await runWithProviderCallRecorder(f.recorder, () => guardedGenerateContent("SEMANTIC", async () => { sent += 1; return 1; })).catch(e => e);
      expect(sent).toBe(0);
      expect(error).toBeInstanceOf(ProviderCallBlocked);
    }
    const spent = fake({ begin: async () => { throw new ProviderCallBlocked("ERR_PROVIDER_CALL_BUDGET_EXHAUSTED"); } });
    expect((await runWithProviderCallRecorder(spent.recorder, () => guardedGenerateContent("SEMANTIC", async () => 1)).catch(e => e)).code).toBe("ERR_PROVIDER_CALL_BUDGET_EXHAUSTED");
    const broken = fake({ begin: async () => { throw new Error("db down"); } });
    expect((await runWithProviderCallRecorder(broken.recorder, () => guardedGenerateContent("SEMANTIC", async () => 1)).catch(e => e)).code).toBe("ERR_PROVIDER_CALL_REGISTER_FAILED");
  });

  it("when the SENT mark cannot be written the unit comes back and nothing is sent", async () => {
    let sent = 0; const f = fake({ markSent: async () => { throw new Error("db down"); } });
    const error = await runWithProviderCallRecorder(f.recorder, () => guardedGenerateContent("SEMANTIC", async () => { sent += 1; })).catch(e => e);
    expect(sent).toBe(0); expect(error).toBeInstanceOf(ProviderCallBlocked);
    expect(f.log).toEqual(["begin", "failBeforeSend:ERR_PROVIDER_CALL_REGISTER_FAILED"]);
  });

  it("a request that threw stays counted (FAILED_AFTER_SEND, classified) and the original error propagates unchanged", async () => {
    const f = fake(); const original = Object.assign(new Error("overloaded"), { status: 503 });
    const error = await runWithProviderCallRecorder(f.recorder, () => guardedGenerateContent("SEMANTIC", async () => { throw original; }, { requestBytes: 7 })).catch(e => e);
    expect(error).toBe(original);
    expect(f.log).toEqual(["begin", "sent", "failAfterSend"]);
    expect(f.ends).toEqual([{ errorClass: "TRANSIENT", errorCode: "HTTP_503", httpStatus: 503, requestBytes: 7 }]);
  });

  it("a failing end write never changes the outcome of the call (the row stays SENT and is settled as UNKNOWN later)", async () => {
    const f = fake(); f.recorder.complete = async () => { throw new Error("db down"); };
    expect(await runWithProviderCallRecorder(f.recorder, () => guardedGenerateContent("SEMANTIC", async () => "fine"))).toBe("fine");
    const g = fake(); g.recorder.failAfterSend = async () => { throw new Error("db down"); };
    await expect(runWithProviderCallRecorder(g.recorder, () => guardedGenerateContent("SEMANTIC", async () => { throw new Error("x"); }))).rejects.toThrow("x");
  });

  it("the call is named by the nested meta (investigation, role, attempt) and by the stage", async () => {
    const f = fake();
    await runWithProviderCallRecorder(f.recorder, () => withProviderCallMeta({ investigationId: "RINV_1", poolRoleId: "role_a", attempt: 2 }, () => guardedGenerateContent("SEMANTIC", async () => 1)));
    expect(f.begins).toEqual([{ stage: "SEMANTIC", investigationId: "RINV_1", poolRoleId: "role_a", attempt: 2 }]);
  });
});

describe("classifyProviderError", () => {
  it("HTTP statuses: 408/429/5xx are TRANSIENT, other 4xx PERMANENT; the status is read from the usual places", () => {
    for (const status of [408, 429, 500, 502, 503, 504, 599]) expect(classifyProviderError({ status }), String(status)).toMatchObject({ errorClass: "TRANSIENT", httpStatus: status });
    for (const status of [400, 401, 403, 404, 422]) expect(classifyProviderError({ status }), String(status)).toMatchObject({ errorClass: "PERMANENT", httpStatus: status });
    expect(httpStatusOf({ response: { status: 429 } })).toBe(429);
    expect(httpStatusOf({ code: 503 })).toBe(503);
    expect(httpStatusOf({ status: "503" })).toBeNull();
  });
  it("broken or timed-out connections are TRANSIENT; anything else stays UNKNOWN and is never retried", () => {
    for (const message of ["fetch failed", "read ECONNRESET", "The operation was aborted due to timeout", "UNAVAILABLE", "RESOURCE_EXHAUSTED", "model is overloaded"]) expect(classifyProviderError(new Error(message)).errorClass, message).toBe("TRANSIENT");
    expect(classifyProviderError(new Error("something odd"))).toMatchObject({ errorClass: "UNKNOWN", errorCode: "UNCLASSIFIED" });
    expect(classifyProviderError("plain string")).toMatchObject({ errorClass: "UNKNOWN" });
  });
  it("the error text of the SDK never travels: only a class and a short code come back", () => {
    const info = classifyProviderError(Object.assign(new Error("key=AIza-secret in message"), { status: 429 }));
    expect(JSON.stringify(info)).not.toContain("AIza");
  });
});
