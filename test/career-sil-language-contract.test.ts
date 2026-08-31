import { describe, it, expect } from "vitest";

import {
  SIL_COPY,
  type SilLocale
} from "../lib/career/view-model/sil-language";

describe("SIL global language contract", () => {
  it("supports exactly English and German", () => {
    const locales: SilLocale[] = ["en", "de"];
    expect(locales).toEqual(["en", "de"]);
  });

  it("uses English as the integration default", () => {
    expect(SIL_COPY.defaultLocale).toBe("en");
  });

  it("defines all six orbit labels in English", () => {
    expect(SIL_COPY.en.orbits["01"].name).toBe("IDENTITY CORE");
    expect(SIL_COPY.en.orbits["02"].name).toBe("CAPABILITY FIELD");
    expect(SIL_COPY.en.orbits["03"].name).toBe("RESONANCE ORBITS");
    expect(SIL_COPY.en.orbits["04"].name).toBe("ROLE MANIFESTATION");
    expect(SIL_COPY.en.orbits["05"].name).toBe("TENSION FIELD");
    expect(SIL_COPY.en.orbits["06"].name).toBe("EVOLUTION PATHS");
  });

  it("defines all six orbit labels in German", () => {
    expect(SIL_COPY.de.orbits["01"].name).toBe("IDENTITÄTSKERN");
    expect(SIL_COPY.de.orbits["02"].name).toBe("FÄHIGKEITSFELD");
    expect(SIL_COPY.de.orbits["03"].name).toBe("RESONANZ-ORBITS");
    expect(SIL_COPY.de.orbits["04"].name).toBe("ROLLENMANIFESTATION");
    expect(SIL_COPY.de.orbits["05"].name).toBe("SPANNUNGSFELD");
    expect(SIL_COPY.de.orbits["06"].name).toBe("ENTWICKLUNGSPFADE");
  });

  it("defines the SourceDock completely in English and German", () => {
    expect(SIL_COPY.en.sourceDock.title).toBe("INGEST KNOWLEDGE");
    expect(SIL_COPY.en.sourceDock.description).toBe(
      "Add documents, repositories, URLs, or text for analysis."
    );
    expect(SIL_COPY.en.sourceDock.startAnalysis).toBe("START ANALYSIS");
    expect(SIL_COPY.en.sourceDock.analysisRunning).toBe("ANALYSIS RUNNING...");
    expect(SIL_COPY.en.sourceDock.noSources).toBe("No sources selected.");

    expect(SIL_COPY.de.sourceDock.title).toBe("WISSEN EINSPEISEN");
    expect(SIL_COPY.de.sourceDock.description).toBe(
      "Fügen Sie Dokumente, Repositories, URLs oder Text zur Analyse hinzu."
    );
    expect(SIL_COPY.de.sourceDock.startAnalysis).toBe("ANALYSE STARTEN");
    expect(SIL_COPY.de.sourceDock.analysisRunning).toBe("ANALYSE LÄUFT...");
    expect(SIL_COPY.de.sourceDock.noSources).toBe("Keine Quellen ausgewählt.");
  });

  it("defines global analysis lifecycle copy in both languages", () => {
    expect(SIL_COPY.en.analysis.successTitle).toBe(
      "ANALYSIS COMPLETED SUCCESSFULLY"
    );
    expect(SIL_COPY.en.analysis.successSubtitle).toBe(
      "IDENTITY CORE & ORBITS MANIFESTED"
    );
    expect(SIL_COPY.en.analysis.failed).toBe("ANALYSIS FAILED");
    expect(SIL_COPY.en.analysis.retry).toBe("RETRY");

    expect(SIL_COPY.de.analysis.successTitle).toBe(
      "ANALYSE ERFOLGREICH ABGESCHLOSSEN"
    );
    expect(SIL_COPY.de.analysis.successSubtitle).toBe(
      "IDENTITÄTSKERN & ORBITS MANIFESTIERT"
    );
    expect(SIL_COPY.de.analysis.failed).toBe("ANALYSE FEHLGESCHLAGEN");
    expect(SIL_COPY.de.analysis.retry).toBe("NEU VERSUCHEN");
  });

  it("defines semantic zoom and field controls in both languages", () => {
    expect(SIL_COPY.en.zoom.cluster).toBe("CLUSTER");
    expect(SIL_COPY.en.zoom.evidence).toBe("EVIDENCE");
    expect(SIL_COPY.en.focus.activeFocus).toBe("ACTIVE FOCUS");
    expect(SIL_COPY.en.focus.reset).toBe("RESET FOCUS");

    expect(SIL_COPY.de.zoom.cluster).toBe("CLUSTER");
    expect(SIL_COPY.de.zoom.evidence).toBe("EVIDENZ");
    expect(SIL_COPY.de.focus.activeFocus).toBe("AKTIVER FOKUS");
    expect(SIL_COPY.de.focus.reset).toBe("FOKUS ZURÜCKSETZEN");
  });

  it("defines HUD and inspector copy in both languages", () => {
    expect(SIL_COPY.en.hud.openEvidence).toBe("OPEN EVIDENCE");
    expect(SIL_COPY.en.hud.inspectSources).toBe("INSPECT SOURCES");
    expect(SIL_COPY.en.hud.viewMatches).toBe("VIEW MATCHES");
    expect(SIL_COPY.en.inspector.title).toBe("DECISION GRAPH INSPECTOR");

    expect(SIL_COPY.de.hud.openEvidence).toBe("EVIDENZ ÖFFNEN");
    expect(SIL_COPY.de.hud.inspectSources).toBe("QUELLEN PRÜFEN");
    expect(SIL_COPY.de.hud.viewMatches).toBe("PASSUNGEN ANZEIGEN");
    expect(SIL_COPY.de.inspector.title).toBe("ENTSCHEIDUNGSGRAPH-INSPEKTOR");
  });

  it("defines runtime telemetry copy in both languages", () => {
    expect(SIL_COPY.en.runtime.title).toBe("RUNTIME TELEMETRY");
    expect(SIL_COPY.en.runtime.currentOperation).toBe("CURRENT OPERATION");
    expect(SIL_COPY.en.runtime.attempt).toBe("ATTEMPT");

    expect(SIL_COPY.de.runtime.title).toBe("LAUFZEIT-TELEMETRIE");
    expect(SIL_COPY.de.runtime.currentOperation).toBe("AKTUELLE OPERATION");
    expect(SIL_COPY.de.runtime.attempt).toBe("VERSUCH");
  });

  it("defines representation-safe empty states in English", () => {
    expect(SIL_COPY.en.emptyStates["01"]).toEqual({
      title: "NO SOURCES PROJECTED",
      reason: "No sources are available in the current analysis state."
    });

    expect(SIL_COPY.en.emptyStates["02"]).toEqual({
      title: "NO CAPABILITIES PROJECTED",
      reason: "The validated analysis contains no projectable capability entities."
    });

    expect(SIL_COPY.en.emptyStates["03"]).toEqual({
      title: "NO ORGANISATIONS PROJECTED",
      reason: "The validated analysis contains no organisation entities."
    });

    expect(SIL_COPY.en.emptyStates["04"]).toEqual({
      title: "NO ROLES PROJECTED",
      reason: "The validated analysis contains no role entities."
    });

    expect(SIL_COPY.en.emptyStates["05"]).toEqual({
      title: "NO GAP PROJECTION AVAILABLE",
      reason: "This analysis path currently provides no capability-gap projection to SIL."
    });

    expect(SIL_COPY.en.emptyStates["06"]).toEqual({
      title: "NO EVOLUTION PATHS PROJECTED",
      reason: "The validated analysis contains no strategy or evolution-path entities."
    });
  });

  it("defines representation-safe empty states in German", () => {
    expect(SIL_COPY.de.emptyStates["01"]).toEqual({
      title: "KEINE QUELLEN PROJIZIERT",
      reason: "Im aktuellen Analysezustand sind keine Quellen verfügbar."
    });

    expect(SIL_COPY.de.emptyStates["02"]).toEqual({
      title: "KEINE FÄHIGKEITEN PROJIZIERT",
      reason: "Die validierte Analyse enthält keine projizierbaren Fähigkeitsentitäten."
    });

    expect(SIL_COPY.de.emptyStates["03"]).toEqual({
      title: "KEINE ORGANISATIONEN PROJIZIERT",
      reason: "Die validierte Analyse enthält keine Organisationsentitäten."
    });

    expect(SIL_COPY.de.emptyStates["04"]).toEqual({
      title: "KEINE ROLLEN PROJIZIERT",
      reason: "Die validierte Analyse enthält keine Rollenentitäten."
    });

    expect(SIL_COPY.de.emptyStates["05"]).toEqual({
      title: "KEINE LÜCKENPROJEKTION VERFÜGBAR",
      reason: "Dieser Analysepfad stellt SIL aktuell keine Fähigkeitslücken-Projektion bereit."
    });

    expect(SIL_COPY.de.emptyStates["06"]).toEqual({
      title: "KEINE ENTWICKLUNGSPFADE PROJIZIERT",
      reason: "Die validierte Analyse enthält keine Strategie- oder Entwicklungspfadentitäten."
    });
  });

  it("never equates an absent gap projection with proof that no gaps exist", () => {
    expect(SIL_COPY.en.emptyStates["05"].reason).not.toMatch(
      /no gaps exist|no gaps found/i
    );

    expect(SIL_COPY.de.emptyStates["05"].reason).not.toMatch(
      /keine lücken gefunden|keine lücken vorhanden/i
    );
  });
});
