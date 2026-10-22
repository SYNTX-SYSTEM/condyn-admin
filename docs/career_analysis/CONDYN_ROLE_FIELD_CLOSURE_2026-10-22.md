# Rollensetzung → Capability Field: Zustandsgraph, Übergänge, Befunde (2026-10-22)

Owner-Auftrag „SYNTX::SFE::RECURSIVE_ROLE_FIELD_CLOSURE“. Basis `49e2bc6`, G1-Kandidat `a9ff0ca` (`frontend/pxj-first-screen-g1`). Integration und Deployment sind verboten.

GELB-Teil (§07 des Auftrags): Zustandsgraph und Invarianten, Prüfung von Backend und Persistenz, Einordnung der Befunde, Abhängigkeiten, Koordination.

**Stand dieses Dokuments:** Alles hier ist aus dem Code von `a9ff0ca` rekonstruiert (Evidenzklasse CODE_INSPECTION). Kein Befund gilt als reproduziert, bevor GRÜN ihn mit einem deterministischen Test oder PINK ihn im Browser nachweist (§5). Zeilenangaben beziehen sich auf `a9ff0ca`.

Abkürzungen:
- SCIF = `app/components/career/demo/SemanticCareerIntelligenceField.tsx`
- SF = `app/components/career/demo/SyntxField.tsx`
- FS = `lib/career/view-model/pxj-first-screen.ts`
- PFS = `app/components/career/demo/PxjFirstScreen.tsx`

## 1 — Zustandsträger (wo der Zustand tatsächlich lebt)

| Träger | Speicher | URL-Parameter | Server-Persistenz | Wiederherstellung nach Reload |
|---|---|---|---|---|
| Untersuchungsmodus | `useState` (SCIF:281), Default `PERSON_X_JOB` | `investigationMode` (wird bei Wahl geschrieben) | keine | aus URL, sonst Default |
| Betrachteter Pool | `useJobPoolWorkflow` (`lib/career/ui/useJobPool.ts:153`) | `jobPoolUploadId` | Pool-Upload (DB) | aus URL |
| Beobachtungspunkt (Organisation / Rolle / Anforderung) | `observation` (SCIF:320) | `jobOrganizationId`, `jobRoleId`, `jobRequirementId` | keine | aus URL |
| **Gewählter Job** (Rolle als Job) | `jobScope` (SCIF:292) | `jobScopePoolUploadId`, `jobScopeRoleId` | keine (nur Auswahl), geprüft gegen den Upload | aus URL, dann `CHECKING` → `VALID`/`INVALID` |
| Feld | `fieldFocus` (SCIF:302), wirksam nur mit offenem Gate (SCIF:305) | `focus` | keine | aus URL, Default `FIELD` |
| Quellen vor ANALYZE | SourceDock, nur im Speicher | keine | keine | **nicht** (B-SRC) |
| Laufende Analyse | `CareerJobController` (`activeJobId`) | keine | Job (DB) | **nicht** (B-RUN) |
| Analyse auf dem Schirm | Ergebnis des Jobs, sonst `analysisId` **beim Mount** (SCIF:290) | `analysisId`, geschrieben bei SUCCEEDED (SCIF:398-402) | Ergebnis, Boundary, Projektion (DB) | aus URL |
| B2-Abdeckung | `useSelectedRoleCoverage` | keine | berechnet aus persistierten Daten | wird neu gelesen |

Autorität:
- Die Grenze einer Analyse (Modus und Job) ist die persistierte Boundary, `GET …/investigation`. Sie wird nie aus dem Interface-Zustand geschlossen.
- B2 prüft serverseitig, dass der angefragte Job der eigene der Analyse ist. Das geschieht über `resolveAnalysisJobScope` mit dem Scope-Hash des Discovery-Laufs (`app/api/career/analyses/[analysisId]/job-comparison/route.ts:27-37`). Bei Abweichung kommt ein 409 SCOPE_MISMATCH oder SCOPE_DRIFT; fehlt die Projektion, kommt LINEAGE_INVALID.
- Ein Ersatz durch den Client ist nicht möglich.

## 2 — Zustandsgraph (tatsächlich, aus dem Code)

Die Knoten des Owner-Graphen, ergänzt um die Zustände, die der Code wirklich unterscheidet.

| Knoten | Eintritt | Autoritative Quelle | URL | Sichtbar | Rückweg |
|---|---|---|---|---|---|
| **NO_POOL** | kein `jobPoolUploadId` | — | — | Job Field mit Pool-Auswahl | — |
| **POOL_SELECTED** | `selectJobPool(id)` (SCIF:350): setzt Pool, Beobachtung auf FIELD | Pool-Upload | `jobPoolUploadId` | Organisationskosmos | anderer Pool; Gewählter Job bleibt (gewollt, „pool change keeps it“) |
| **ORGANIZATION_OPENED** | Klick auf Organisation | — | `jobOrganizationId` | Organisation im Fokus | Exit oder Esc auf FIELD |
| **ROLE_OPENED** | Klick auf Rolle: `observation.kind = ROLE` | — | `jobRoleId` | Rolle im Fokus, Knopf „als Job wählen“ (SF:2181-2185) | Exit; **wählt nichts** |
| **ROLE_SELECTED (CHECKING)** | `selectJobScope(roleId)` (SCIF:351-358) oder Reload mit `jobScope*` | Upload-Lesung (`useJobScope.ts`) | `jobScopePoolUploadId`, `jobScopeRoleId` | Shell „wird geprüft“, Gate zu | — |
| **ROLE_SELECTED (VALID)** | Upload ACTIVE, MAPPED, Rolle im Mapping (`job-scope.ts` `validateJobScope`) | Upload | wie oben | Shell nennt Rolle, Organisation und Pool; Knopf „gewählt“ (`aria-pressed`), dazu „entfernen“ | `clearJobScope` (SCIF:361-366); eine andere Rolle ersetzt |
| **ROLE_SELECTED (INVALID)** | Upload fehlt, ist nicht ACTIVE oder nicht MAPPED, Rolle nicht im Pool, Lesefehler | Upload | wie oben | Shell „ungültig“ mit Rollen-ID; ANALYZE gesperrt | andere Rolle oder entfernen |
| **SOURCE_AVAILABLE** | Quellen im SourceDock | nur Speicher | — | Dock | **nicht rekonstruierbar** (B-SRC) |
| **ANALYSIS_STARTED** | `handleAnalyze` (SCIF:536): `declareAnalysis` verlangt PERSON oder PERSON × JOB mit VALID; Controller prüft erneut | Job (DB) | — | Fortschritt | **nicht rekonstruierbar** (B-RUN) |
| **ANALYSIS_PERSISTED** | SUCCEEDED | Ergebnis + Boundary | `analysisId`, `investigationMode` | — | — |
| **Zustände des ersten Schirms** (FS:269-307) | Kette analysisId → Ergebnis → Boundary → Modus → Job → Projektion → B2 → L-1..L-4 | jeweils eine Route | — | genau ein Zustand | — |
| → **CAPABILITY_PROJECTION** | Zustände mit `result`: PERSON_RESULT, NO_PROJECTION (seit `a9ff0ca` ohne Legacy), COVERAGE_*, LINEAGE_MISMATCH, AVAILABLE | Projektion | — | Orbit 01/02 | — |
| → **B2_RELATIONS_VISIBLE** | nur AVAILABLE | B2 | — | Abdeckungstafel | — |

Unterscheidungen, nach denen der Owner fragt:
- **ROLE_OPENED ≠ ROLE_SELECTED** ist im Code getrennt:
  - eigene URL-Parameter (`jobRoleId` gegenüber `jobScopeRoleId`);
  - eigener Speicher (`observation` gegenüber `jobScope`);
  - „gewählt“ gilt nur, wenn Upload **und** Rollen-ID gleich sind (SF:2182).
  - B2 im Job Field erscheint nur, wenn die geöffnete Rolle die gewählte ist (SF:1990).
- **ROLE_SELECTED ≠ ANALYSIS_AVAILABLE:** Eine Auswahl öffnet nur das Gate. Den ersten Schirm gibt es erst mit einer `analysisId`.
- **Eine Ausnahme ist Kandidat F-RF-3:** Während CHECKING und INVALID behandelt der erste Schirm einen gewählten Job wie „kein Job gewählt“.

## 3 — Übergangs- und Invariantenmatrix

Evidenz: **C** = Code (GELB), **T** = deterministischer Test (GRÜN), **B** = Browser-Walk mit Stand-in (PINK), **P** = persistierte echte Daten aus :41862 (nur GET). „offen“ heißt, dass noch kein Beleg dieser Klasse vorliegt. Bisherige Belege aus G1 sind PA/T-Nummern.

| # | Übergang | Erwartet (Invariante) | Code | Belege |
|---|---|---|---|---|
| X-01 | ROLE_OPENED → (nichts) | keine Auswahl, Gate unverändert | C ok | B offen |
| X-02 | ROLE_OPENED → „als Job wählen“ | CHECKING → VALID, URL `jobScope*`, Gate auf | C ok | B (PINK G1) |
| X-03 | dieselbe Rolle erneut wählen | Knopf ist deaktiviert, kein Zustandswechsel | C ok (SF:2185 `disabled`) | B offen |
| X-04 | Rolle entfernen | `jobScope` null, URL ohne `jobScope*`, Feld FIELD, ANALYZE gesperrt, Analysen unberührt | C ok | B offen |
| X-05 | andere Rolle, selber Pool | ersetzt; laufende oder sichtbare PxJ-Analyse → ROLE_MISMATCH | C ok | B (PA-06) |
| X-06 | Rolle in anderer Organisation | wie X-05 | C ok | B offen |
| X-07 | anderer Pool bei gewählter Rolle | Auswahl bleibt (anderer Upload); „gewählt“ erscheint im neuen Pool nicht, auch nicht bei gleicher Rollen-ID | C ok (SF:2182) | B offen, **Pool mit gleicher Rollen-ID nötig** |
| X-08 | Rolle in anderem Pool wählen | ersetzt; Analyse des alten Jobs → ROLE_MISMATCH | C ok | B offen |
| X-09 | Rolle ohne Anforderungen | VALID nur, wenn der Server sie im Mapping führt; B2 mit 0 Anforderungen ohne Zahl außer 0 | C teils (Server-Regel prüfen) | B offen |
| X-10 | Rolle mit gleichem Titel, anderer ID | Auswahl über ID. Die Shell nennt Titel, Organisation und Pool; in derselben Organisation ist das **nicht unterscheidbar** (F-RF-5) | C | B offen |
| X-11 | Modus PxJ → PERSON bei gewählter Rolle | Auswahl bleibt, wird ungenutzt genannt; PxJ-Analyse → MODE_MISMATCH | C ok | B (PA-06) |
| X-12 | Modus → JOB | Gate zu, kein ANALYZE, keine Analyse gelesen | C ok | B offen |
| X-13 | **Modus wechseln während einer laufenden Analyse** | Sitzung = Reload | **C: verletzt (F-RF-1)** | T, B offen |
| X-14 | **zweite Analyse starten, während eine erste im Bild ist** | Sitzung = URL = Reload, während des Laufs und nach FAILED | **C: verletzt (F-RF-2)** | T, B offen |
| X-15 | Rolle wechseln während einer laufenden Analyse | Ergebnis → ROLE_MISMATCH, in der Sitzung wie beim Reload | C ok | B offen |
| X-16 | Reload in jedem Zustand mit Analyse | gleicher erster Schirm | C ok außer X-13/X-14 | B (PA-02) |
| X-17 | **Reload mit gewähltem Job und Analyse (CHECKING-Phase)** | kein Zustand „kein Job gewählt“ | **C: verletzt (F-RF-3)** | B offen |
| X-18 | gewählter Job wird INVALID (Upload weg, Pool inaktiv, Rolle entfernt) | Shell „ungültig“, ANALYZE gesperrt, erster Schirm ohne Vorschläge, eindeutige Benennung | C: Benennung falsch (F-RF-3) | B offen |
| X-19 | Deep Link mit fremder oder unbekannter `analysisId` | RESULT_NOT_FOUND bzw. BOUNDARY_*, keine Daten | C ok | B (PA-03) |
| X-20 | Deep Link mit widersprüchlichen Parametern (`jobScopePoolUploadId` ohne `jobScopeRoleId`, falsches Format, unbekannter Modus) | Auswahl `NONE` bzw. Default-Modus, nichts geraten | C ok (`parseJobScope`, `investigationModeFromParam`) | T, B offen |
| X-21 | Deep Link mit `jobRoleId`, aber ohne `jobScope*` | Rolle geöffnet, **nicht** gewählt | C ok | B offen |
| X-22 | Browser Zurück / Vor | siehe B-NAV: Zurück verlässt die Seite; Vor = Reload bzw. bfcache | C | B offen |
| X-23 | ANALYZE ohne VALID (PxJ) | blockiert mit Owner-Satz, kein POST | C ok | B (G1) |
| X-24 | B2 für fremde Rolle direkt angefragt | 409, kein Ersatz | C ok (Server) | P/B offen |

## 4 — Inverse Abhängigkeiten

- **Sichtbare Fähigkeit** (Orbit 02) ← `capabilityProposalProjection` des Ergebnisses ← `GET /api/career/analyses/{id}` ← `analysisId` (Job-Ergebnis oder URL beim Mount).
  - Seit `a9ff0ca` erreicht unter PxJ keine Fähigkeit ohne Projektion Orbit 02.
  - Offen ist die **Herkunft der `analysisId`** selbst: Nach dem Mount ist die URL nicht mehr die Lesequelle (F-RF-2).
- **Sichtbare Anforderungsabdeckung** ← B2 ← (`analysisId`, gewählter Job) ← persistierte Boundary (Scope-Hash) ← Pool-Upload. Geprüft wird das im Client mit L-1..L-4 (FS) und auf dem Server über den Scope-Hash.
- **Quelle eines Zitats** ← `documents[].entity_id` des persistierten Ergebnisses. Ohne Treffer steht „source not resolved“.
- **Rollenname in der Shell** ← `canonicalMapping.roles[].title` des Uploads der Auswahl. Er kommt nicht aus dem betrachteten Pool, ist also unabhängig vom Pool im Bild.

## 5 — Befundkandidaten (CODE_INSPECTION, Reproduktion steht aus)

**F-RF-1 · Moduswechsel während einer laufenden Analyse schreibt den alten Modus in die URL.**
- Ursache:
  - `declaredModeRef` wird bei ANALYZE gesetzt (SCIF:541).
  - Der Effekt SCIF:398-402 schreibt ihn bei SUCCEEDED in die URL.
  - Der Modusselektor ist während des Laufs nicht gesperrt.
- Folge:
  - In der Sitzung ist der Modus PERSON, die URL sagt PERSON_X_JOB.
  - Die Sitzung zeigt MODE_MISMATCH, ein Reload zeigt AVAILABLE. Sitzung ≠ Reload; ebenso bei Vor ohne bfcache.
- Sequenz: PxJ + VALID → ANALYZE → während RUNNING Modus PERSON → SUCCEEDED → Reload.
- Erwartet: Die URL trägt den Modus des Interfaces. Der Modus schaltet nie selbst um.
- Lane: GRÜN, Datei SCIF (§08).
- Latent dazu: `declaredModeRef` wird auch gesetzt, wenn `submitAnalysis` ein Doppel-Submit verwirft. Über die UI ist das nicht erreichbar, weil das Dock während des Laufs gesperrt ist.

**F-RF-2 · Die Analyse auf dem Schirm folgt nach dem Mount nicht mehr der URL.**
- Ursache: `describeAnalysisSource(jobResult, analysisId)` (SCIF:290) nimmt als Rückfall die `analysisId` des **Mounts**, nicht die zuletzt geschriebene. `submitAnalysis` setzt `resultAnalysisId` auf null.
- Sequenz a:
  - Seite ohne `analysisId` öffnen → A1 SUCCEEDED (URL A1) → A2 starten.
  - Während A2 läuft, ist der Schirm leer (NO_ANALYSIS), die URL nennt A1.
  - Scheitert A2: Die Sitzung bleibt leer, ein Reload zeigt A1.
  - Das verletzt Q2: „kein leerer Zustand, wenn rekonstruierbar“, und Sitzung ≠ Reload.
- Sequenz b:
  - Seite mit `?analysisId=A0` öffnen → A1 SUCCEEDED (URL A1) → A2 starten.
  - Während A2 läuft, zeigt der Schirm **A0**, eine Analyse, die weder die aktuelle noch die der URL ist.
  - Scheitert A2: Die Sitzung zeigt A0, ein Reload zeigt A1. Das ist eine **fremde Analyse auf dem ersten Schirm**.
- Erwartet: Die Analyse im Bild ist das Job-Ergebnis, sonst die **aktuelle** URL-Analyse. Sitzung = URL = Reload, auch während eines Laufs und nach FAILED.
- Lane: GRÜN, SCIF.

**F-RF-3 · Ein gewählter Job, der noch geprüft wird oder ungültig ist, erscheint als „kein Job gewählt“.**
- Ursache: Der erste Schirm bekommt `selection = VALID ? scope : null` (SCIF:416). CHECKING und INVALID werden damit zu ROLE_MISMATCH mit `selection: null`.
- Das Angebot `pxj-analysis-job-offer` (PFS:175-187) zeigt dann ROLE_NONE („kein Job gewählt“) und „diese Rolle wählen“.
- Sequenz:
  - Reload mit `jobScope*` = Job der Analyse, `analysisId` und `investigationMode=PERSON_X_JOB`.
  - Wenn Ergebnis und Boundary vor der Upload-Prüfung ankommen, steht im Job Field kurz das falsche Angebot.
  - Bei INVALID (Upload entfernt, Pool inaktiv) bleibt es dauerhaft falsch benannt.
- Das ist der Fall „ROLE_SELECTED erscheint als nicht gewählt“.
- Erwartet:
  - Bei CHECKING kein Mismatch-Angebot, sondern ein eigener Prüfzustand.
  - Bei INVALID die Benennung „gewählter Job ungültig“ mit Grund, kein „kein Job gewählt“.
- Lane: GRÜN, FS, PFS und `sil-language.ts` (§08).

**F-RF-4 · Kommentar veraltet.** `app/career/demo/page.tsx` sagt zu `analysisId` „loads nothing into the planetarium“; seit G1 stimmt das nicht mehr. Nur Kommentar, Datei außerhalb von §08 → Owner-Entscheidung, ob sie mitkorrigiert wird. Niedrig.

**F-RF-5 · Gleicher Rollentitel in derselben Organisation ist in der Shell nicht unterscheidbar.**
- Die Shell zeigt Titel · Organisation · Pool (SCIF `validJobPresentation`), die Rollen-ID nur bei INVALID.
- Die Auswahl selbst ist eindeutig (ID). Ob zwei solche Rollen im Pool zulässig sind, entscheidet das Pool-Schema; das ist zu prüfen.
- Lane: GRÜN, wenn bestätigt (Anzeige der Rollen-ID). Niedrig.

## 6 — Architekturgrenzen (kein Fix ohne Owner-Entscheidung)

- **B-NAV · Keine Verlaufseinträge.**
  - Alle Zustandswechsel schreiben mit `history.replaceState`. Im ganzen Frontend gibt es kein `pushState` und kein `popstate`.
  - Browser-Zurück verlässt daher `/career/demo` und führt nicht in den vorigen Zustand. Vor lädt neu oder stellt den bfcache-Zustand her.
  - Die Konsistenz von „S → Zurück → Vor → S“ hängt daher an Reload = Sitzung (X-13, X-14).
  - Verlaufseinträge pro Wechsel wären eine Architekturentscheidung.
- **B-SRC · Quellen vor ANALYZE sind nicht persistent.** Ein Reload vor ANALYZE verliert die bereitgestellten Quellen, SOURCE_AVAILABLE lässt sich nicht rekonstruieren. Gewollt oder nicht: Owner.
- **B-RUN · Eine laufende Analyse überlebt keinen Reload.**
  - `activeJobId` steht nur im Speicher.
  - Nach einem Reload während RUNNING läuft der Job im Worker weiter, und das Ergebnis wird persistiert. Die Oberfläche kennt seine `analysisId` aber nicht.
  - Ein Wiederanschluss über `GET /api/career/jobs/{jobId}` mit `jobId` in der URL wäre nur Frontend. Er erweitert aber die Reload-Kette von Q2 um ANALYSIS_STARTED: Owner.

## 7 — Ablauf der Schließung

1. **GRÜN** (Frontend, §08):
   - Für F-RF-1, F-RF-2 und F-RF-3 zuerst je ein deterministischer Test, der auf `a9ff0ca` fehlschlägt (REPRODUCE), dann der Fix.
   - Dazu der inverse Test: Der Zustand, der gleich bleiben soll, bleibt gleich.
   - Danach laufen alle G1-Tests und T-07 erneut.
   - F-RF-5 nur, wenn PINK den Fall bestätigt.
2. **PINK:**
   - unabhängiger Sweep der Matrix aus §3 im Browser mit Stand-in auf einem eigenen frischen Labor, mit Pools für X-07, X-09 und X-10;
   - Reproduktion von F-RF-1 bis F-RF-3 auf `a9ff0ca`;
   - nach dem Fix vollständige Nachprüfung aller betroffenen Übergänge (X-11..X-18, X-16) und der G1-Kriterien PA-01..PA-14.
3. **GELB:** Einordnung neuer Befunde, Prüfung jedes Fix-Commits (Dateien, tsc, isolierte Tests, Lecks). Danach ein erneuter Sweep, bis keine neuen Befunde im Umfang mehr auftauchen. Sich wiederholende Befunde gehen an den Owner.
4. **Owner:** B-NAV, B-SRC, B-RUN, F-RF-4; danach Sichtabnahme und Integration.
