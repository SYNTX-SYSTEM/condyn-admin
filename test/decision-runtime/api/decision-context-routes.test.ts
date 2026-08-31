import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createApplication: vi.fn(),
  handleCreate: vi.fn(),
  handleRead: vi.fn()
}));

vi.mock("../../../lib/decision-runtime/local/decision-context-api", () => ({
  createLocalDecisionContextHttpApplication: mocks.createApplication
}));
vi.mock("../../../lib/decision-runtime/http/decision-contexts", () => ({
  handleCreateDecisionContextRequest: mocks.handleCreate,
  handleReadDecisionContextRequest: mocks.handleRead
}));

import * as postRoute from "../../../app/api/decision-contexts/route";
import * as getRoute from "../../../app/api/decision-contexts/[revisionId]/route";

const r4RouteFiles = [
  "app/api/decision-contexts/route.ts",
  "app/api/decision-contexts/[revisionId]/route.ts"
];

describe("Decision Context HTTP routes", () => {
  it("exports exactly nodejs, force-dynamic POST routing and delegates only to the pure transport", async () => {
    mocks.handleCreate.mockReset();
    const expected = new Response("post", { status: 201 });
    mocks.handleCreate.mockResolvedValue(expected);
    const request = new Request("http://local/api/decision-contexts", { method: "POST", body: "{}" });
    await expect(postRoute.POST(request)).resolves.toBe(expected);
    expect(postRoute.runtime).toBe("nodejs");
    expect(postRoute.dynamic).toBe("force-dynamic");
    expect(Object.keys(postRoute).sort()).toEqual(["POST", "dynamic", "runtime"]);
    expect(mocks.handleCreate).toHaveBeenCalledTimes(1);
    expect(mocks.handleCreate).toHaveBeenCalledWith(request, mocks.createApplication);
  });

  it("resolves async params once and passes the supplied revisionId unchanged to the pure GET transport", async () => {
    mocks.handleRead.mockReset();
    const expected = new Response("get", { status: 200 });
    mocks.handleRead.mockResolvedValue(expected);
    const request = new Request("http://local/api/decision-contexts/%20opaque%20");
    const revisionId = "  opaque revision id  ";
    const params = Promise.resolve({ revisionId });
    await expect(getRoute.GET(request, { params })).resolves.toBe(expected);
    expect(getRoute.runtime).toBe("nodejs");
    expect(getRoute.dynamic).toBe("force-dynamic");
    expect(Object.keys(getRoute).sort()).toEqual(["GET", "dynamic", "runtime"]);
    expect(mocks.handleRead).toHaveBeenCalledTimes(1);
    expect(mocks.handleRead).toHaveBeenCalledWith(revisionId, mocks.createApplication);
  });

  it("keeps routes transport-only and audits exactly the two R4 route files rather than future descendants", () => {
    const source = r4RouteFiles.map((file) => readFileSync(resolve(process.cwd(), file), "utf8")).join("\n");
    expect(source).not.toMatch(/createDecisionContextDraft|createDecisionContextRevision|assembleDecisionContextValidation|from .*decision-core|career\/decisions|career\/orchestration|career\/repositories\/lifecycle|postgres|drizzle|\.execute\(|ERR_DECISION_|current|head|latest|status.*422|status.*409|status.*500/i);
    const post = readFileSync(resolve(process.cwd(), r4RouteFiles[0]), "utf8");
    const get = readFileSync(resolve(process.cwd(), r4RouteFiles[1]), "utf8");
    expect(post).toMatch(/handleCreateDecisionContextRequest/);
    expect(get).toMatch(/await context\.params/);
    expect(get).toMatch(/handleReadDecisionContextRequest\(revisionId/);
  });
});
