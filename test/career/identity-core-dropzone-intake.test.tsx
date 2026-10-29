import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * GELB decision on the DLL-full path review, point 3: IdentityCoreDropZone's drop handler always reported a hardcoded
 * `{title:"dropped-source.pdf"}` regardless of the real file, and the field never even wired a callback — the drop did
 * nothing, silently, while the drag-over label ("⚡ DROP SOURCE NOW") promised otherwise. Decision taken: forward the
 * real dropped file to the existing SourceDock intake (SourceDock.stageFile, exposed via a ref — the exact validation
 * the file button already uses, nothing new), rather than removing the label, since the wiring fit comfortably under
 * the line budget (33 insertions across the three files) without lifting SourceDock's state or adding any new rule.
 */
vi.mock("react", async (importOriginal) => (await import("./pxj-first-screen/harness")).mockReact(await importOriginal<object>()));
import { instance, find } from "./pxj-first-screen/harness";
import { IdentityCoreDropZone } from "../../app/components/career/demo/IdentityCoreDropZone";
import { SyntxCoreOrganism } from "../../app/components/career/demo/manifestation/SyntxCoreOrganism";
import { SourceDock, type SourceDockHandle } from "../../app/components/career/demo/SourceDock";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../app/career/demo/demo-data";

const dropEvent = (files: File[]) => ({ preventDefault: () => undefined, dataTransfer: { files } }) as unknown as React.DragEvent<HTMLDivElement>;
const textFile = (name: string, content: string) => new File([content], name, { type: "text/plain" });
const organismOf = (tree: unknown) => find(tree, SyntxCoreOrganism);

afterEach(() => { vi.unstubAllGlobals(); });

describe("IdentityCoreDropZone → SourceDock intake (DLL-full path review point 3)", () => {
  it("REPRODUCE: a dropped file reaches onDropFile exactly as given — no hardcoded title, no invented kind", () => {
    const seen: File[] = [];
    const zone = instance<Record<string, unknown>>(IdentityCoreDropZone);
    const tree = zone.settle({ sources: EMPTY_CAREER_INTELLIGENCE_DATA.sources, onDropFile: (file: File) => seen.push(file) });
    const organism = organismOf(tree)!;
    expect(organism).not.toBeNull();
    const file = textFile("my-real-cv.md", "# Real content");
    (organism.props.onDrop as (e: React.DragEvent<HTMLDivElement>) => void)(dropEvent([file]));
    expect(seen).toEqual([file]);
    expect(seen[0].name).toBe("my-real-cv.md");
  });

  it("REPRODUCE (F-INT-4, PINK §3.78 mutation testing): one drop calls onDropFile exactly once — never a double intake", () => {
    const onDropFile = vi.fn();
    const zone = instance<Record<string, unknown>>(IdentityCoreDropZone);
    const tree = zone.settle({ sources: EMPTY_CAREER_INTELLIGENCE_DATA.sources, onDropFile });
    const organism = organismOf(tree)!;
    (organism.props.onDrop as (e: React.DragEvent<HTMLDivElement>) => void)(dropEvent([textFile("once.md", "# once")]));
    expect(onDropFile).toHaveBeenCalledTimes(1);
  });

  it("REPRODUCE: the forwarded file reaches SourceDock's own intake — the same validation the file button uses, staged there", async () => {
    // This suite runs without a DOM; FileReader (unrelated to the fix itself) gets a minimal Node polyfill for this one case.
    class NodeFileReader { onload: ((e: { target: { result: string } }) => void) | null = null; readAsText(file: File) { file.text().then(text => this.onload?.({ target: { result: text } })); } readAsDataURL(file: File) { file.arrayBuffer().then(buf => this.onload?.({ target: { result: `data:${file.type};base64,${Buffer.from(buf).toString("base64")}` } })); } }
    vi.stubGlobal("FileReader", NodeFileReader);
    const ref = React.createRef<SourceDockHandle>();
    const render = (props: Record<string, unknown>) => (SourceDock as unknown as { render(p: unknown, r: unknown): React.ReactElement }).render(props, ref);
    const dock = instance<Record<string, unknown>>(render);
    dock.render({ locale: "en" });
    expect(ref.current).not.toBeNull();
    const file = textFile("evidence.md", "# A capability, in evidence");
    ref.current!.stageFile(file);
    await new Promise(resolve => setTimeout(resolve, 0)); // FileReader.onload (text) resolves on a macrotask
    const tree = dock.settle({ locale: "en" });
    const html = JSON.stringify(tree);
    expect(html).toContain("evidence.md");
    // F-INT-4: one stageFile call stages the file exactly once — a double-intake mutant (stageFile itself calling
    // setStagedDocs twice, or appending the new document twice in one update) would leave it staged twice over.
    expect(html.split("evidence.md").length - 1).toBe(1);
  });

  it("inverse: without onDropFile the drop does nothing (no crash) and the drag-over label never promises acceptance", () => {
    const zone = instance<Record<string, unknown>>(IdentityCoreDropZone);
    let tree = zone.settle({ sources: EMPTY_CAREER_INTELLIGENCE_DATA.sources });
    const organismBefore = organismOf(tree)!;
    expect(() => (organismBefore.props.onDrop as (e: React.DragEvent<HTMLDivElement>) => void)(dropEvent([textFile("x.pdf", "x")]))).not.toThrow();
    // Drag the file over it: the label must not say "DROP SOURCE NOW" when there is nowhere for the drop to go.
    (organismBefore.props.onDragOver as (e: React.DragEvent<HTMLDivElement>) => void)({ preventDefault: () => undefined } as never);
    tree = zone.settle({ sources: EMPTY_CAREER_INTELLIGENCE_DATA.sources });
    expect(JSON.stringify(tree)).not.toContain("DROP SOURCE NOW");
  });
});
