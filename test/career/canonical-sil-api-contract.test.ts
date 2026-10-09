import { describe, expect, it } from "vitest";
import { GET } from "../../app/api/career/canonical-sil/[associationId]/route";

describe("canonical SIL product API", () => {
  it("requires an explicit association identity before any repository composition", async () => {
    const response = await GET(new Request("http://localhost/api/career/canonical-sil/"), { params: Promise.resolve({ associationId: "" }) });
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ success: false, issues: [{ code: "ERR_CANONICAL_SIL_RUNTIME_ASSOCIATION_NOT_FOUND" }] });
  });
});
