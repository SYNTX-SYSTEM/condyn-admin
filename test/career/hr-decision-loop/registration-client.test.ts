import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ postgres: vi.fn() }));
vi.mock("postgres", () => ({ default: mocks.postgres }));

/** The registration client is bound to the verified URL only, single connection, notices silenced. */
describe("HR Decision Loop registration client", () => {
  it("binds the verified URL with one connection and a notice handler that swallows DDL notices", async () => {
    const sentinel = { sentinel: true };
    mocks.postgres.mockReturnValue(sentinel);
    const { createRegistrationClient } = await import("../../../lib/career/hr-decision-loop/registration-client");
    const url = "postgresql://x/condyn_test_0123456789abcdef";
    expect(createRegistrationClient(url)).toBe(sentinel);
    expect(mocks.postgres).toHaveBeenCalledTimes(1);
    const [calledUrl, options] = mocks.postgres.mock.calls[0];
    expect(calledUrl).toBe(url);
    expect(options).toMatchObject({ max: 1 });
    expect(typeof options.onnotice).toBe("function");
    expect(options.onnotice({ severity: "NOTICE", message: 'relation "x" already exists, skipping' })).toBeUndefined();
  });
});
