# Planetarium-Demo-Wiederherstellung

Datum: 2026-10-26
Feld: `condyn-admin-role-discovery`
Scope: ausschließlich die bestehende Planetarium-Oberfläche; keine Produkt- oder Role-Discovery-Neuentwicklung.

## Ursache

Commit `12e01f6` (RD-5) erweiterte `legacyHidden` von `PERSON_X_JOB` auf `PERSON_X_JOB || PERSON` und entfernte dadurch im PERSON-Feld die Legacy-Orbits 03–06, ihre Rays, die Kopplung, HUD-Aktionen und die zugehörigen Daten. Zusätzlich änderte `17cc828` den unscoped Demo-Einstieg auf PERSON/Capability. Damit wich die sichtbare Demo von der zuvor funktionierenden Planetarium-Oberfläche ab.

## Wiederherstellung

Die Darstellung folgt wieder dem nachweislich funktionierenden Stand vor `12e01f6` (`1d3ccf7`):

- `PERSON_X_JOB` blendet 03–06 weiterhin aus.
- `PERSON` zeigt wieder alle sechs Orbits, Energy-Rays, Inter-Orbital-Coupling, Inspector-Daten und `VIEW MATCHES`.
- Ein angeforderter Legacy-Fokus 03–06 bleibt unter PERSON sichtbar und interaktiv.
- Der ursprüngliche Default bleibt `PERSON_X_JOB` mit Feldfokus `FIELD`; es gibt keine neue Entry-Mode-Interpretation.
- Die Role-Discovery-Backend-Implementierung und ihre Commits bleiben unverändert erhalten; entfernt wurde nur ihre zusätzliche Planetarium-Überlagerung.

## Nachweis

- TypeScript: `./node_modules/.bin/tsc --noEmit --pretty false` — PASS.
- Fokussierte SSR-/UI-/Mode-Regressionen (temporäre DB-freie Vitest-Konfiguration, danach entfernt): **59/59 Tests PASS**.
- Die Regressionen prüfen explizit sechs PERSON-Orbits, Rays, Kopplung, Interaktion/Fokus und die unveränderte PERSON×JOB-Ausblendung.

## Grenzen

Der laufende Host-Browser unter `127.0.0.1:3017` war aus dieser Codex-Ausführung nicht erreichbar; deshalb wurde kein zusätzlicher Browser-Klicknachweis behauptet. Die SSR- und Komponentenprüfungen decken den sichtbaren und interaktiven Rendervertrag ab.
