import { describe, expect, it, vi } from "vitest";
import { createNoticeForwarder, isSuppressedNotice } from "../../../lib/career/db/notice-filter";

describe("application client notice filter", () => {
  it("suppresses identifier truncation and idempotent-DDL skip notices only", () => {
    expect(isSuppressedNotice({ code: "42622", message: 'identifier "x" will be truncated to "y"' })).toBe(true);
    expect(isSuppressedNotice({ code: "42P07", message: 'relation "decision_context_revisions" already exists, skipping' })).toBe(true);
    expect(isSuppressedNotice({ code: "42P06", message: 'schema "s" already exists, skipping' })).toBe(true);
    expect(isSuppressedNotice({ code: "42710", message: 'constraint "c" for relation "r" already exists, skipping' })).toBe(true);
    expect(isSuppressedNotice({ code: "42P07", message: "relation exists" })).toBe(false);
    expect(isSuppressedNotice({ code: "01000", message: "warning" })).toBe(false);
    expect(isSuppressedNotice({ message: "no code" })).toBe(false);
  });

  it("forwards every other notice unchanged", () => {
    const forward = vi.fn();
    const onnotice = createNoticeForwarder(forward);
    const kept = { code: "00000", message: "drop cascades to 2 other objects" };
    onnotice({ code: "42622", message: "truncated" });
    onnotice(kept);
    expect(forward).toHaveBeenCalledTimes(1);
    expect(forward).toHaveBeenCalledWith(kept);
  });
});
