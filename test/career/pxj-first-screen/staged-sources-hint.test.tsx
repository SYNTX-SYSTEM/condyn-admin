import React from "react";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { SourceDock, type StagedDocumentItem } from "../../../app/components/career/demo/SourceDock";

/**
 * Owner "OWNER_GO_FULL_PXJ_CLOSURE" §05, N-5 B-SRC, the minimal boundary only (GELB): staged sources stay unpersisted as before;
 * with STAGED SOURCES the dock shows one fixed, honest sentence (EN / DE) that they do not survive a reload (nor Back / Forward,
 * which remount the field: N-1). No file is stored anywhere — the dock touches no browser storage. Server-rendered.
 */
const staged: StagedDocumentItem[] = [{ id: "src_1", type: "text", title: "Synthetic profile", content: "c" } as StagedDocumentItem];
const render = (props: Record<string, unknown>) => renderToString(<SourceDock onAnalyze={() => undefined} {...props} />);
const hint = (html: string) => /data-testid="staged-sources-not-kept"[^>]*>([^<]*)</.exec(html)?.[1] ?? null;

describe("N-5 · staged sources say they are not kept", () => {
  it("REPRODUCE: with staged sources the dock names it, EN and DE", () => {
    expect(hint(render({ initialStagedDocs: staged, locale: "en" }))).toBe("Staged sources live in this page only: reloading, Back or Forward discards them. Nothing is stored.");
    expect(hint(render({ initialStagedDocs: staged, locale: "de" }))).toBe("Vorbereitete Quellen gibt es nur auf dieser Seite: Neuladen, Zurück oder Vor verwirft sie. Gespeichert wird nichts.");
  });

  it("inverse: without staged sources there is no hint; the staged list and ANALYZE stay as they were", () => {
    const empty = render({ locale: "en" });
    expect(hint(empty)).toBeNull();
    expect(empty).toContain("No sources selected.");
    const full = render({ initialStagedDocs: staged, locale: "en" });
    expect(full).toContain("Synthetic profile");
    expect(full).toContain("STAGED SOURCES");
  });

  it("negative: the dock stores nothing in the browser (no localStorage, sessionStorage or IndexedDB)", () => {
    const source = readFileSync("app/components/career/demo/SourceDock.tsx", "utf8");
    expect(source).not.toMatch(/localStorage|sessionStorage|indexedDB|IndexedDB/);
  });
});
