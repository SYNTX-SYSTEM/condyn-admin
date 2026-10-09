import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createApplication: vi.fn(), handleRead: vi.fn(), handleDeclare: vi.fn(), handleReadRecord: vi.fn() }));

vi.mock("../../../lib/career/hr-decision-loop/local-composition", () => ({ createLocalHrDecisionLoopHttpApplication: mocks.createApplication }));
vi.mock("../../../lib/career/hr-decision-loop/http", () => ({
  handleReadHrDecisionLoopRequest: mocks.handleRead,
  handleDeclareHumanDecisionRequest: mocks.handleDeclare,
  handleReadHumanDecisionRecordRequest: mocks.handleReadRecord
}));

import * as contextRoute from "../../../app/api/career/hr-decision-loop/contexts/[careerDecisionContextRevisionId]/route";
import * as declareRoute from "../../../app/api/career/hr-decision-loop/decisions/route";
import * as recordRoute from "../../../app/api/career/hr-decision-loop/decisions/[humanDecisionRecordId]/route";

const routeFiles = [
  "app/api/career/hr-decision-loop/contexts/[careerDecisionContextRevisionId]/route.ts",
  "app/api/career/hr-decision-loop/decisions/route.ts",
  "app/api/career/hr-decision-loop/decisions/[humanDecisionRecordId]/route.ts"
];

describe("HR Decision Loop HTTP routes", () => {
  it("passes the exact DCTXREV id unchanged to the transport", async () => {
    const expected = new Response("ok");
    mocks.handleRead.mockResolvedValue(expected);
    const id = "  DCTXREV_opaque  ";
    await expect(contextRoute.GET(new Request("http://local/x"), { params: Promise.resolve({ careerDecisionContextRevisionId: id }) })).resolves.toBe(expected);
    expect(mocks.handleRead).toHaveBeenCalledWith(id, mocks.createApplication);
    expect(contextRoute.runtime).toBe("nodejs");
    expect(contextRoute.dynamic).toBe("force-dynamic");
    expect(Object.keys(contextRoute).sort()).toEqual(["GET", "dynamic", "runtime"]);
  });

  it("delegates the declaration POST with the untouched request", async () => {
    const expected = new Response("created", { status: 201 });
    mocks.handleDeclare.mockResolvedValue(expected);
    const request = new Request("http://local/x", { method: "POST", body: "{}" });
    await expect(declareRoute.POST(request)).resolves.toBe(expected);
    expect(mocks.handleDeclare).toHaveBeenCalledWith(request, mocks.createApplication);
    expect(Object.keys(declareRoute).sort()).toEqual(["POST", "dynamic", "runtime"]);
  });

  it("passes the exact DCR id unchanged to the transport", async () => {
    const expected = new Response("ok");
    mocks.handleReadRecord.mockResolvedValue(expected);
    await expect(recordRoute.GET(new Request("http://local/x"), { params: Promise.resolve({ humanDecisionRecordId: "DCR_opaque" }) })).resolves.toBe(expected);
    expect(mocks.handleReadRecord).toHaveBeenCalledWith("DCR_opaque", mocks.createApplication);
    expect(Object.keys(recordRoute).sort()).toEqual(["GET", "dynamic", "runtime"]);
  });

  it("keeps the routes transport-only", () => {
    const source = routeFiles.map(file => readFileSync(resolve(process.cwd(), file), "utf8")).join("\n");
    expect(source).not.toMatch(/createHumanDecisionRecord|produceAndPersist|from .*decision-core|career\/decisions|postgres|drizzle|\.execute\(|ERR_|current|head|latest|status: ?4|status: ?5/i);
  });
});
