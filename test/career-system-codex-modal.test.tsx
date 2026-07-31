import React from "react";
import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { SystemCodexModal } from "../app/components/career/demo/SystemCodexModal";

describe("SystemCodexModal — Bilingual Complete Operating Manual (DE/EN)", () => {
  it("1. Modal renders nothing when isOpen is false", () => {
    const html = renderToString(
      <SystemCodexModal isOpen={false} onClose={() => {}} />
    );
    expect(html).toBe("");
  });

  it("2. Modal renders German manual with all 8 chapters by default", () => {
    const html = renderToString(
      <SystemCodexModal isOpen={true} onClose={() => {}} initialLang="de" />
    );
    expect(html).toContain("SYSTEM CODEX &amp; BEDIENHANDBUCH");
    expect(html).toContain("1. WAS IST CONDYN?");
    expect(html).toContain("2. DIE 2 GRUNDGESETZE &amp; 8 INVARIANTS");
    expect(html).toContain("5. DECISION GRAPH: SUPPORTED &amp; BLOCKED");
  });

  it("3. Modal renders English manual when initialLang is 'en'", () => {
    const html = renderToString(
      <SystemCodexModal isOpen={true} onClose={() => {}} initialLang="en" />
    );
    expect(html).toContain("SYSTEM CODEX &amp; OPERATING MANUAL");
    expect(html).toContain("1. WHAT IS CONDYN?");
    expect(html).toContain("7. THE 5 TRUST QUESTIONS");
  });

  it("4. Contains the 5 Trust Questions and 2 Core Laws references in chapters", () => {
    const html = renderToString(
      <SystemCodexModal isOpen={true} onClose={() => {}} initialLang="de" />
    );
    expect(html).toContain("7. DIE 5 TRUST-FRAGEN");
    expect(html).toContain("2. DIE 2 GRUNDGESETZE &amp; 8 INVARIANTS");
  });
});
