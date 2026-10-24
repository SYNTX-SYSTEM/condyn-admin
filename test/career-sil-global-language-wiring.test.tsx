import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";

vi.mock("../lib/career/ui/useCareerAnalysisJob", () => ({
  useCareerAnalysisJob: () => ({
    state: {
      state: "IDLE",
      canonicalAnalysis: null,
      currentOperation: null,
      attemptCount: null,
      errorCode: null,
      errorSummary: null
    },
    submitAnalysis: vi.fn()
  })
}));

import { SemanticCareerIntelligenceField } from "../app/components/career/demo/SemanticCareerIntelligenceField";
import { SourceDock } from "../app/components/career/demo/SourceDock";
import { SemanticGuideDrawer } from "../app/components/career/demo/SemanticGuideDrawer";
import { GuidedOnboardingOverlay } from "../app/components/career/demo/GuidedOnboardingOverlay";
import { OrbitalResonanceBubble } from "../app/components/career/demo/OrbitalResonanceBubble";
import { DecisionGraphInspector } from "../app/components/career/demo/DecisionGraphInspector";
import { InferenceTelemetryHUD } from "../app/components/career/demo/InferenceTelemetryHUD";
import { SystemCodexModal } from "../app/components/career/demo/SystemCodexModal";

const emptyData: any = {
  analysisId: "",
  generatedAt: "",
  sources: [],
  capabilities: [],
  companyMatches: [],
  roleMatches: [],
  capabilityGaps: [],
  nextActions: [],
  reactFlowGraph: {
    nodes: [],
    edges: []
  }
};

const emptyGraph: any = {
  sourceNodes: [],
  evidenceNodes: [],
  capabilityNodes: [],
  requirementNodes: [],
  jobNodes: [],
  organisationNodes: [],
  edges: []
};

// Owner G1 Q1: the default PERSON × JOB hides orbits 03–06; the complete root chrome is rendered under PERSON. RD-5 (owner
// D-RD-5 = B): orbits 03–06 are not part of the PERSON field either — their names are checked absent here and per locale on the
// orbit component below.
describe("SIL global locale wiring", () => {
  it("renders the complete active SIL root chrome in English", () => {
    const html = renderToString(
      <SemanticCareerIntelligenceField
        data={emptyData}
        initialLocale="en"
        investigationMode="PERSON"
      />
    );

    expect(html).toContain("INGEST KNOWLEDGE");
    expect(html).toContain("No sources selected.");

    expect(html).toContain("IDENTITY CORE");
    expect(html).toContain("CAPABILITY FIELD");
    for (const name of ["RESONANCE ORBITS", "ROLE MANIFESTATION", "TENSION FIELD", "EVOLUTION PATHS"]) expect(html).not.toContain(name);

    expect(html).toContain("DECISION GRAPH INSPECTOR");
    expect(html).toContain("HOW THIS WORKS");

    expect(html).not.toContain("WISSEN EINSPEISEN");
    expect(html).not.toContain("Keine Quellen ausgewählt.");
    expect(html).not.toContain("IDENTITÄTSKERN");
    expect(html).not.toContain("FÄHIGKEITSFELD");
    expect(html).not.toContain("SPANNUNGSFELD");
    expect(html).not.toContain("SO FUNKTIONIERT ES");
  });

  it("renders the complete active SIL root chrome in German", () => {
    const html = renderToString(
      <SemanticCareerIntelligenceField
        data={emptyData}
        initialLocale="de"
        investigationMode="PERSON"
      />
    );

    expect(html).toContain("WISSEN EINSPEISEN");
    expect(html).toContain("Keine Quellen ausgewählt.");

    expect(html).toContain("IDENTITÄTSKERN");
    expect(html).toContain("FÄHIGKEITSFELD");
    for (const name of ["RESONANZ-ORBITS", "ROLLENMANIFESTATION", "SPANNUNGSFELD", "ENTWICKLUNGSPFADE"]) expect(html).not.toContain(name);

    expect(html).toContain("ENTSCHEIDUNGSGRAPH-INSPEKTOR");
    expect(html).toContain("SO FUNKTIONIERT ES");

    expect(html).not.toContain("INGEST KNOWLEDGE");
    expect(html).not.toContain("No sources selected.");
    expect(html).not.toContain("CAPABILITY FIELD");
    expect(html).not.toContain("TENSION FIELD");
  });

  it("orbits 03–06 (component) carry their names in the selected locale", async () => {
    const { SIL_COPY } = await import("../lib/career/view-model/sil-language");
    const names = { en: ["RESONANCE ORBITS", "ROLE MANIFESTATION", "TENSION FIELD", "EVOLUTION PATHS"], de: ["RESONANZ-ORBITS", "ROLLENMANIFESTATION", "SPANNUNGSFELD", "ENTWICKLUNGSPFADE"] } as const;
    for (const locale of ["en", "de"] as const) {
      ["03", "04", "05", "06"].forEach((stageId, at) => {
        const copy = SIL_COPY[locale].orbits[stageId as "03"];
        expect(copy.name).toBe(names[locale][at]);
        const html = renderToString(<OrbitalResonanceBubble stageId={stageId} stageName={copy.name} subtitle={copy.subtitle} itemCount={0} previewItems={[]} locale={locale} />);
        expect(html).toContain(names[locale][at]);
        expect(html).not.toContain(names[locale === "en" ? "de" : "en"][at]);
      });
    }
  });

  it("SourceDock consumes the selected locale", () => {
    const en = renderToString(<SourceDock locale="en" />);
    const de = renderToString(<SourceDock locale="de" />);

    expect(en).toContain("INGEST KNOWLEDGE");
    expect(en).toContain("UPLOAD PDF DOCUMENT");
    expect(en).toContain("ENTER TEXT / MARKDOWN");
    expect(en).toContain("No sources selected.");

    expect(de).toContain("WISSEN EINSPEISEN");
    expect(de).toContain("PDF-DOKUMENT HOCHLADEN");
    expect(de).toContain("TEXT / MARKDOWN EINGEBEN");
    expect(de).toContain("Keine Quellen ausgewählt.");
  });

  it("Semantic Guide consumes the selected locale", () => {
    const en = renderToString(
      <SemanticGuideDrawer initialOpen={true} locale="en" />
    );

    const de = renderToString(
      <SemanticGuideDrawer initialOpen={true} locale="de" />
    );

    expect(en).toContain("THE 6-STAGE FLOW");
    expect(en).toContain("CAPABILITY FIELD");

    expect(de).toContain("DER 6-STUFIGE FLUSS");
    expect(de).toContain("FÄHIGKEITSFELD");

    expect(en).not.toContain("DER 6-STUFIGE FLUSS");
    expect(de).not.toContain("CAPABILITY FIELD");
  });

  it("Guided Onboarding consumes the selected locale", () => {
    const en = renderToString(
      <GuidedOnboardingOverlay
        isOpen={true}
        onClose={() => {}}
        locale="en"
      />
    );

    const de = renderToString(
      <GuidedOnboardingOverlay
        isOpen={true}
        onClose={() => {}}
        locale="de"
      />
    );

    expect(en).toContain("CONDYN ONBOARDING");
    expect(en).toContain("STEP 1 OF 6");
    expect(en).toContain("IDENTITY CORE");
    expect(en).not.toContain("SCHRITT 1 VON 6");

    expect(de).toContain("CONDYN-EINFÜHRUNG");
    expect(de).toContain("SCHRITT 1 VON 6");
    expect(de).toContain("IDENTITÄTSKERN");
    expect(de).not.toContain("STEP 1 OF 6");
  });

  it("Orbit Hologram HUD consumes the selected locale", () => {
    const en = renderToString(
      <OrbitalResonanceBubble
        stageId="02"
        stageName="⬡ CAPABILITY FIELD"
        subtitle="Semantic capability core"
        itemCount={1}
        previewItems={["Canonical Capability"]}
        isHovered={true}
        locale="en"
      />
    );

    const de = renderToString(
      <OrbitalResonanceBubble
        stageId="02"
        stageName="⬡ FÄHIGKEITSFELD"
        subtitle="Semantischer Fähigkeitskern"
        itemCount={1}
        previewItems={["Canonical Capability"]}
        isHovered={true}
        locale="de"
      />
    );

    expect(en).toContain("OPEN EVIDENCE");
    expect(en).toContain("VIEW MATCHES");
    expect(en).toContain("Click to focus this field");

    expect(de).toContain("EVIDENZ ÖFFNEN");
    expect(de).toContain("PASSUNGEN ANZEIGEN");
    expect(de).toContain("Klicken, um dieses Feld zu fokussieren");

    // Canonical/projected content is not translated by UI locale.
    expect(en).toContain("Canonical Capability");
    expect(de).toContain("Canonical Capability");
  });

  it("Decision Graph Inspector consumes the selected locale", () => {
    const en = renderToString(
      <DecisionGraphInspector
        graph={emptyGraph}
        focus={null}
        locale="en"
      />
    );

    const de = renderToString(
      <DecisionGraphInspector
        graph={emptyGraph}
        focus={null}
        locale="de"
      />
    );

    expect(en).toContain("DECISION GRAPH INSPECTOR");
    expect(en).toContain(
      "Hover or select any node in the Planetarium"
    );

    expect(de).toContain("ENTSCHEIDUNGSGRAPH-INSPEKTOR");
    expect(de).toContain(
      "Bewegen Sie den Zeiger über einen Knoten"
    );
  });

  it("Runtime Telemetry consumes the selected locale", () => {
    const progress: any = {
      lifecycleState: "RUNNING",
      currentOperation: "INFERENCE",
      attemptCount: 1
    };

    const en = renderToString(
      <InferenceTelemetryHUD
        runtimeProgress={progress}
        locale="en"
      />
    );

    const de = renderToString(
      <InferenceTelemetryHUD
        runtimeProgress={progress}
        locale="de"
      />
    );

    expect(en).toContain("RUNTIME TELEMETRY");
    expect(en).toContain("CURRENT OPERATION: INFERENCE");
    expect(en).toContain("ATTEMPT 1");

    expect(de).toContain("LAUFZEIT-TELEMETRIE");
    expect(de).toContain("AKTUELLE OPERATION: INFERENCE");
    expect(de).toContain("VERSUCH 1");

    // Runtime operation identifiers are protocol values, not UI prose.
    expect(de).toContain("INFERENCE");
  });

  it("System Codex is controlled by the global SIL locale", () => {
    const en = renderToString(
      <SystemCodexModal
        isOpen={true}
        onClose={() => {}}
        locale="en"
        onLocaleChange={() => {}}
      />
    );

    const de = renderToString(
      <SystemCodexModal
        isOpen={true}
        onClose={() => {}}
        locale="de"
        onLocaleChange={() => {}}
      />
    );

    expect(en).toContain(
      "CONDYN / SYNTX — SYSTEM CODEX &amp; OPERATING MANUAL"
    );
    expect(en).not.toContain(
      "CONDYN / SYNTX — SYSTEM CODEX &amp; BEDIENHANDBUCH"
    );

    expect(de).toContain(
      "CONDYN / SYNTX — SYSTEM CODEX &amp; BEDIENHANDBUCH"
    );
    expect(de).not.toContain(
      "CONDYN / SYNTX — SYSTEM CODEX &amp; OPERATING MANUAL"
    );
  });
});
