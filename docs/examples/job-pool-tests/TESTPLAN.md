# Testplan: DLL-Jobpools für den manuellen End-to-End-Durchlauf

Drei fiktive, hochladbare Jobpools für Decision Loop Labs, gebaut gegen das implementierte `CompanyPoolDataSchema`
(`lib/career/matching/pool.ts`) und geprüft mit dem echten Parser `parseJobPoolUpload` (`lib/career/job-pool/upload.ts`).
Alle Organisationen, Rollen und Anforderungen sind erfunden; es sind keine realen Bewerber- oder Unternehmensdaten enthalten.

| Datei | Pool-ID | Upload-ID (aus dem Inhalt abgeleitet) | Organisationen | Rollen | Anforderungen |
|---|---|---|---|---|---|
| `DLL_JOBPOOL_ENGINEERING.json` | `pool_dll_engineering_v1` | `JPOOL_B94850C439974E27496FE3B1A9A076B5` | 3 | 9 | 79 |
| `DLL_JOBPOOL_AI_DATA.json` | `pool_dll_ai_data_v1` | `JPOOL_0DCDB34AE9F8FF8A3D335BA26C9F16C2` | 5 | 16 | 130 |
| `DLL_JOBPOOL_ENTERPRISE_SCALE.json` | `pool_dll_enterprise_scale_v1` | `JPOOL_D39ADA99F34A60B982ADE5F929276294` | 16 | 48 | 290 |

Die Upload-ID ist ein Hash des kanonischen Inhalts. Jede Änderung an einer Datei ergibt eine neue Upload-ID.

## Aufbau der Anforderungen

- **`necessity`**: Jede Anforderung hat REQUIRED, PREFERRED oder OPTIONAL. In allen Pools sind alle drei Werte gemischt.
- **`required_level`**:
  - Bei `CAPABILITY`, `TOOL_TECHNOLOGY` und `KNOWLEDGE` beginnt es mit `L1` bis `L6` (z. B. `L4 - Advanced`). Die Anwendung bildet es auf ein Capability-Level ab.
  - Bei `EXPERIENCE` (z. B. `5+ years`), `LANGUAGE` (z. B. `C1`) und `CREDENTIAL` ist es Freitext.
  - Die übrigen Typen (`DOMAIN_CONTEXT`, `RESPONSIBILITY`, `BEHAVIORAL_EXPECTATION`, `LOCATION`) haben laut Abbildungstabelle der Anwendung kein Level; ihr Level erscheint als UNKNOWN.
- **`weight`**: zwischen 0,2 und 1,0, nach fachlicher Bedeutung innerhalb der Rolle abgestuft.
- **`aliases`**: Alternativnamen für das Präsentations-Matching (z. B. `Kubernetes` → `K8s`, `EKS`).
- **`evidence_hint`**: Nennt konkret, welcher Nachweis im Lebenslauf eine Anforderung belegen würde.

## Voraussetzungen

- Eine **isolierte** Umgebung mit Wegwerf-Datenbank, z. B. `npm run job-pool:local` (Server mit Gemini-Worker). Nicht auf :3017 testen, solange GELB das nicht freigibt.
- Ein PDF-Lebenslauf; synthetisches Beispiel: `docs/examples/cv.synthetic.pdf`.

## Ablauf

Erwartete Matches nennt dieser Plan bewusst nicht: Sie hängen ausschließlich vom tatsächlich analysierten Lebenslauf ab. Geprüft werden Struktur, Zustände, Herkunft und Grenzen.

### 1. JSON hochladen und validieren
- Im Job Field „+ INTAKE“ öffnen, Actor-ID setzen, Datei wählen, UPLOAD.
- **Erwartung:** „UPLOAD PERSISTED (NEW)“ mit der Upload-ID aus der Tabelle. Ein zweiter Upload derselben Datei meldet „IDENTICAL UPLOAD ALREADY PERSISTED“.
- **Negativtests** an einer Kopie:
  - `weight` auf 1.5 setzen → abgelehnt mit HTTP 422 `ERR_JOB_POOL_SCHEMA_INVALID` und Pfadangabe.
  - Bei einer Rolle `organization_id` auf eine unbekannte ID setzen → HTTP 422 `ERR_JOB_POOL_REFERENCE_INVALID`.
  - Eine Datei über 1 MiB → HTTP 413.

### 2. Pool ausdrücklich auswählen
- Ein Upload ist nicht automatisch ausgewählt („UPLOADED != SELECTED“). In „⬡ POOLS“ den Pool mit SELECT wählen.
- **Erwartung:** Der Kern zeigt den Poolnamen und die Organisationszahl. Die URL enthält `jobPoolUploadId`.

### 3. Organisations- und Rollenstruktur prüfen
- **Erwartung:** Die Zahl der Organisationen im Planetarium entspricht der Tabelle. Jede Organisation nennt Branche, Region und Rollenzahl (Engineering und Enterprise je 3 Rollen pro Organisation, AI & Data 2–4).
- „BOUNDARY“ öffnen: Der Mapping-Zustand ist `MAPPED · PROPOSAL_ONLY · AUTHORITY NONE`.

### 4. Rollen und Anforderungen öffnen
- Organisation anklicken → Organisations-Kosmos; Rolle anklicken → Rollen-Kosmos; Anforderung anklicken → Anforderungsebene.
- **Erwartung:** Rollentitel und Anforderungsnamen sind vollständig lesbar. Die Zahl der Anforderungen je Rolle entspricht der Datei (Engineering 8–10, AI & Data 8–9, Enterprise 6–7).

### 5. Analyse eines PDF-Lebenslaufs zuordnen
- Im Capability Field den PDF-Lebenslauf als Quelle hinzufügen und die Analyse starten. Nach Abschluss ins Job Field wechseln, oder die Seite mit `analysisId=<id>` öffnen.
- **Erwartung:** Die Zustandszeile zeigt PRESENTATION MATCHING; ohne Analyse erscheint der Hinweis „NO ANALYSIS …“.

### 6. Unterstützt, schwach unterstützt, fehlend
- In einer Rolle die Anforderungen nach Unterstützung prüfen.
- **Erwartung:** Unterstützte Anforderungen tragen Belege. Schwach unterstützte liegen unter der Schwelle für schwache Evidenz (Wert in BOUNDARY). Fehlende sind neutral dargestellt und kein Urteil („MISSING != GAP DECISION“).
- **Plausibilität:** Die Anforderung muss fachlich zum Lebenslauf passen. Ihr `evidence_hint` nennt, welcher Nachweis passen würde.

### 7. Bewertete Evidenz vs. unbewertete Gemini-Sweep-Vorschläge
- **Erwartung:** Bewertete Belege tragen zum resonanceScore bei. Sweep-Vorschläge sind als UNSCORED gekennzeichnet und ändern keinen Score.
- Die Grenze nennt den Sweep-Zustand („NO SWEEP PROPOSALS RECORDED …“ oder die Zahl der Vorschläge).

### 8. Evidenzquellen und Zitate bis zum Dokument verfolgen
- In der Anforderungsebene einen Beleg öffnen (Evidenz-Apertur).
- **Erwartung:** Die Apertur zeigt Quelle (Dokument), Zitat, Relation und Autoritätsgrenze. Das Zitat stammt wörtlich aus dem analysierten Dokument.

### 9. Navigation, Rückwege und Zustandserhaltung
- Rückwege prüfen: RETURN, Pfadschritte in der Orientierungsfläche, Esc auf jeder Ebene sowie der Wechsel CAPABILITY ↔ JOB FIELD über den Selektor.
- Deep Link prüfen: `focus=FIELD&jobPoolUploadId=…&jobOrganizationId=…&jobRoleId=…&jobRequirementId=…` öffnet direkt die Anforderung.
- **Erwartung:** IDs bleiben in der URL. Der Feldwechsel verliert keine gestagten Quellen. Ein Neuladen stellt die Ebene aus der URL wieder her.

### 10. Großen Jobpool auf Darstellung und Interaktion prüfen (`DLL_JOBPOOL_ENTERPRISE_SCALE.json`)
- **Planetarium mit 16 Organisationen:** keine überlappenden Körper; Namen, Branche und Rollenzahl lesbar; Hover-HUD vollständig.
- **Organisations-Kosmos:** Rollenkarten bleiben über die ganze Umlaufbahn über der Fußzeile; Klick auf eine kreisende Karte trifft die Karte.
- **Bei 1600 × 1000 und 1280 × 720:**
  - Bekannte Beobachtung O-JF-PANEL: Bei 1280 px laufen Rollenkarten zeitweise über die linke Orientierungsfläche.
  - Neu zu beobachten: Lange Branchenbezeichnungen (z. B. „Healthcare Technology (Digital Therapeutics)“) brechen im Organisationskörper mehrzeilig und klein um.
- **Reduced Motion** (Betriebssystem-Einstellung): Nichts bewegt sich, alle Zeichen und Zustände bleiben gleich.

## Validierung (lokal reproduzierbar)

```bash
node_modules/.bin/tsx -e 'import { readFileSync } from "node:fs"; import { parseJobPoolUpload } from "./lib/career/job-pool/upload";
for (const f of ["DLL_JOBPOOL_ENGINEERING", "DLL_JOBPOOL_AI_DATA", "DLL_JOBPOOL_ENTERPRISE_SCALE"]) {
  const p = parseJobPoolUpload(readFileSync(`docs/examples/job-pool-tests/${f}.json`, "utf8"));
  console.log(f, p.jobPoolUploadId, p.pool.organizations.length, p.pool.roles.length, p.pool.requirements.length); }'
```

Bei der Erstellung geprüft (2026-10-13):
- **Parser und Referenzen:**
  - Parser und Referenzprüfung grün; IDs eindeutig; jede Rolle verweist auf eine vorhandene Organisation und jede Anforderung auf eine vorhandene Rolle.
  - Keine Organisation ohne Rollen, keine Rolle ohne Anforderungen; Rollentitel je Pool eindeutig.
- **Felder:** Gewichte in [0, 1]; `created_at` im ISO-Format; Enums gültig; alle Level der Typen CAPABILITY, TOOL_TECHNOLOGY und KNOWLEDGE werden auf L1–L6 abgebildet.
- **Dubletten:** Größte Überschneidung der Anforderungsprofile zweier Rollen (Jaccard): 0,12 (Engineering), 0,14 (AI & Data) und 0,20 (Enterprise). Keine Dubletten.
- **Größe:** alle Dateien unter dem Upload-Limit von 1 MiB (50 KB, 79 KB, 179 KB).
- **Echter Upload-Pfad:** Zusätzlich in einer isolierten Laborumgebung über die echte Upload-Schnittstelle hochgeladen:
  - alle drei mit HTTP 201 und kanonischem Mapping `MAPPED`;
  - Matching gegen eine Labor-Analyse lesbar (HTTP 200);
  - Darstellung im Job Field ohne Seitenfehler.
