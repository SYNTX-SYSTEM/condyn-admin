# PINK-Lesetor für den Inspector — Sicherheitsprüfung vor dem Start (2026-10-22)

Owner-Auftrag „SYNTX::SFE::OWNER_DECISION_G1“, Q5:
- PINK_READ_GATE = CONDITIONAL_ARCHITECTURAL_APPROVAL_ONLY
- REPORT_SECURITY_VERIFICATION_BEFORE_START

Grundlage ist §06 der Spezifikation `CONDYN_PXJ_G1_FIRST_SCREEN_SPECIFICATION_2026-10-22.md`, E-1 bis E-8.

**Stand: gestartet auf Owner-GO vom 2026-10-22 („SYNTX::SFE::EXPLICIT_OWNER_GO“, Q2), Smoke-Test 26/26, PINK hat Port und Pfade (§5).**

## 1 — Was geprüft wurde

- **Tor:** `evidence/pxj-e2e-49e2bc6/gate/inspector-read-gate.mjs.txt`. Ein Node-Prozess ohne Abhängigkeiten, etwa 100 Zeilen. Er läuft außerhalb des Repositorys unter GELBs PID.
- **Stopp:** `stop-gate.sh.txt` stoppt über die PID, die das Tor selbst notiert hat, nie über ein Muster.
- **Prüfung:** `verify-gate.mjs.txt` gegen das Double `mock-inspector.mjs.txt`.
  - Das Double antwortet nur bei korrektem Token, setzt absichtlich `set-cookie`, CORS und einen Zusatz-Header und protokolliert jede Anfrage, die bei ihm ankommt.
  - Die Prüfung nutzt einen zufälligen Dummy-Token mit 48 Zeichen, nie den des Labors.
  - Weder das Labor :41862 noch sein Token waren beteiligt.
- **Ergebnis:** `gate-verification.json`, **67 von 67 PASS**, mit verschärften Kriterien zweimal gelaufen. Alle Ablehnungen sind exakt 403 bzw. 405. Danach waren beide Ports frei und keine Prozesse übrig.

## 2 — Die sieben Bedingungen des Owners

| Bedingung | Umsetzung im Tor | Geprüft (Fall-IDs) |
|---|---|---|
| **Nur Loopback** | `listen(port, "127.0.0.1")`. Jede andere `listenHost` beendet den Start (Exit 2). Der Upstream muss `http://127.0.0.1:<port>/` sein, ohne Pfad, Query und Zugangsdaten. | S1.1: `ss` zeigt nur `127.0.0.1:<port>`. S1.2: über 192.168.2.124, 172.17.0.1 und 192.168.123.1 kommt ECONNREFUSED. S8: `0.0.0.0`, LAN-IP, LAN-Upstream, https, der Gemini-Host und ein Upstream mit Pfad werden abgelehnt. |
| **Minimale Allowlist, nur lesend** | Der rohe Request-Target muss exakt einem der vier Pfade aus §06 E-3 entsprechen. Es gibt keine Decodierung, keine Normalisierung, keine Query und keine absolute Form. Die Allowlist ist schon beim Start auf das Muster `gemini-result` / `gemini-exchanges` begrenzt, mit höchstens 8 Einträgen. | S2.1 bis S2.4: genau 4 Weiterleitungen. 19 Varianten werden abgelehnt und erreichen den Upstream nicht: Analyze, Ergebnis, B2, Investigation, fremde Analyse- und Job-IDs, `?`, `/` am Ende, `//`, `#`, `../`, `%2F`, `%00`, Großschreibung, absolute URL (eigene und fremde), `*`, 6-KB-Pfad, `/`. S8: Analyze und B2 in der Allowlist werden beim Start abgelehnt. |
| **Kein Token, keine Zugangsdaten** | Der Token stammt aus einer Datei mit Modus 0600; bei offenerem Modus bricht der Start ab. Er kommt nie aus argv oder der Umgebung. Für den Upstream baut das Tor einen neuen Header-Satz aus `accept` und dem Token-Header; vom Client wird nichts übernommen. Zurück gehen nur `content-type` und `cache-control`. | S4.1: Ein vom Client gesendeter Token, Cookie, `authorization`, `x-forwarded-for` und `origin` kommen nicht an. Der Upstream sieht genau `accept, connection, host, x-condyn-result-inspector-token`. S4.2 bis S4.4: Der Token fehlt in allen Antworten, im Log, in stdout/stderr, in `/proc/<pid>/cmdline` und in `/proc/<pid>/environ`. S6.1: kein `set-cookie`, kein CORS, kein Upstream-Zusatz-Header. |
| **Kein Zugriff auf fremde Sitzungen** | Die Allowlist enthält nur die IDs aus GELBs Labor :41862, der Upstream ist fest. Ein `Host` oder eine absolute URL kann ihn nicht umlenken. | S2.3: eine fremde ANL- oder JOB-ID wird mit 403 abgelehnt. S5.1: `Host 127.0.0.1:41862` gibt 403. S2.3: `http://evil.example/…` gibt 403. |
| **Keine schreibenden Methoden** | Nur GET. POST, PUT, PATCH, DELETE, OPTIONS, HEAD und TRACE beantwortet das Tor lokal mit 405; CONNECT und Upgrade ebenfalls mit 405. | S3.1 bis S3.4: 0 davon beim Upstream. |
| **Keine unbeabsichtigte Exposition** | Bindung nur an Loopback. Der `Host`-Wächter verlangt exakt `127.0.0.1:<port>` und schützt so gegen DNS-Rebinding aus einem Browser. Es gibt keine CORS-Header, also kann eine fremde Seite keine Antwort lesen. Antworten sind auf 32 MiB begrenzt, Header-Timeout 10 s. | S5.1: `evil.example`, `localhost:<port>` und eine Anfrage ohne Host werden abgelehnt. S6.1. S10.1: Ist der Upstream weg, antwortet das Tor lokal mit 502, ohne Inhalt vom Upstream. |
| **Ausdrückliches Stoppen und Aufräumen** | SIGTERM oder SIGINT schließen den Server und löschen die PID-Datei. Eine Laufzeitgrenze (TTL, 1 s bis 24 h) ist Pflicht und stoppt das Tor selbst. `stop-gate.sh` prüft danach, dass der Port geschlossen ist. | S9.1: Port geschlossen, PID-Datei weg, Exit 0. S9.2: Die TTL von 2 s stoppt das Tor von selbst. S8: Port belegt, gleicher Port wie der Upstream oder keine TTL führen zu Exit 2, und es wird nichts gebunden. |

Zusätzlich gilt: Das Log enthält nur Metadaten, nämlich Zeit, Methode, gekürzten Pfad, Status, Bytes und Code (S4.5).

## 3 — Restrisiken (offen benannt)

- **RR-1 · Lokaler Zugriff:** Jeder Prozess auf diesem Rechner kann den Loopback-Port während der Laufzeit erreichen, auch ein anderer lokaler Benutzer. Das Tor prüft den Aufrufer nicht, denn dafür müsste PINK eine Zugangsdatei bekommen, und das schließt E-1 aus.
  - Erreichbar sind dann genau die vier Lesepfade mit synthetischen Testdaten und keine Schreibmethode.
  - Begrenzt wird das durch TTL und die Laufzeit, die der Owner festlegt.
- **RR-2 · Inhalt:** Die Antworten enthalten Rohtext von Gemini und Zitate aus dem synthetischen Lebenslauf. Für PINK gilt §06 E-6: nichts davon einchecken, nur IDs, Hashes, Zählungen und Urteile.
- **RR-3 · Prüfung am Double:** Geprüft wurde gegen ein Double, nicht gegen das Labor. Gegen den echten Upstream läuft das Tor erst nach der Freigabe, mit dem Smoke-Test aus §4.
- **RR-4 · Upstream vertraut:** Das Tor reicht die Antwort des Labors weiter. Dass der Inspector keinen Token zurückgibt, ist im Code belegt: `gemini-result/route.ts` antwortet nur mit `inspection`. Zusätzlich habe ich alle privaten Lesekopien von :41862 auf die Token-Bytes durchsucht: 0 Treffer. Darunter sind vier echte Inspector-Antworten, je zweimal `gemini-result` und `gemini-exchanges`.

## 4 — Ablauf beim Start (erst nach Owner-Wort)

1. GELB startet das Tor auf `127.0.0.1:41864` mit Upstream `http://127.0.0.1:41862/`.
   - Token-Datei ist `state.json` des Labors (0600, Schlüssel `token`).
   - Die TTL legt der Owner fest; Vorschlag 8 h.
2. **Smoke-Test durch GELB, bevor PINK den Port bekommt:**
   - je ein GET auf die vier Pfade: Status 200, Body-SHA-256 gleich meinen privaten Kopien; eine Abweichung muss erklärt sein, bevor es weitergeht;
   - ein abgelehnter Pfad und ein POST: 403 / 405;
   - `ss` zeigt nur Loopback.
3. GELB nennt PINK nur den Port und die vier Pfade, keinen Pfad zu einer Datei.
4. Ende auf Owner-Wort, nach Ablauf der TTL oder spätestens beim Stopp des Labors:
   - `stop-gate.sh`;
   - PINK erhält eine Kopie des Metadaten-Logs;
   - danach löscht GELB Konfiguration, Log und PID-Datei aus dem Scratch-Verzeichnis.

Das Labor :41862, sein Code und seine Konfiguration bleiben dabei unverändert.

## 5 — Start und Smoke-Test (2026-10-22, Owner-GO Q2)

Owner-Vorgaben: PORT = 41864, MAX_RUNTIME = 8 HOURS, BINDING = LOOPBACK_ONLY, METHODS = APPROVED_GET_ONLY, SCOPE = EXISTING_SYNTHETIC_LAB_DATA.

- **Gestartet:** 2026-10-22T14:39:59Z auf `127.0.0.1:41864`. Upstream ist `http://127.0.0.1:41862/`, die Allowlist enthält genau die vier Pfade aus §06 E-3.
- **Automatisches Ende, doppelt gesichert:**
  - Die TTL des Tors beträgt 28 800 s; damit endet es spätestens um 2026-10-22T22:39:59Z.
  - Unabhängig davon läuft der Prozess unter `timeout` mit 28 860 s. Nach weiteren 30 s folgt SIGKILL.
- **Prozessumgebung:** Der Prozess läuft mit leerer Umgebung (`env -i`, nur `PATH` und `HOME`).
- **Smoke-Test gegen :41862:** `gate/gate-smoke-41862.json` und `gate/gate-smoke.py.txt`, **26 von 26 PASS**.
  - Die vier Pfade geben 200. Jeder Body ist inhaltlich gleich der privaten Lesekopie von 02:32 Z (kanonisches JSON).
  - Fünf fremde Pfade (B2, Ergebnis, Query, `../`, fremde ID) geben 403.
  - POST und DELETE geben 405.
  - Die Host-Header `evil.example`, `localhost` und `127.0.0.1:41862` geben 403.
  - Ein Token und ein Cookie vom Client werden ignoriert. Ohne Tor bleibt der Upstream bei 404.
  - Auf allen acht Nicht-Loopback-Adressen kommt ECONNREFUSED; `ss` zeigt nur Loopback.
  - Der Token fehlt in Antworten, Log, stdout/stderr, cmdline und environ. Die Token-Datei hat Modus 0600.
  - Die TTL und das Elternteil `timeout` sind belegt.
- **Log nach dem Smoke-Test:** 5 Weiterleitungen (200), 5 abgelehnte Pfade (403), 3 abgelehnte Methoden (405) und 3 abgelehnte Hosts (403).
- **PINK erhalten:** nur Port, die vier Pfade, die Endzeit und die Body-SHA-256. Keine Datei, kein Token.
- **PINK blockiert:** Die Rechteprüfung in PINKs eigener Session hat schon den ersten GET abgelehnt („Credential Exploration“). PINK hat 0 Anfragen an das Tor gesendet und legt die Freigabe seinem Menschen vor. GELB ruft die Antworten nicht für PINK ab, denn das würde PINKs Rechteentscheidung umgehen. Die Punkte 2, 5 und 8 bleiben INCONCLUSIVE, bis PINK in der eigenen Session zugreifen darf.

**Befund B-GATE-1 (Lesepfad mit Löschanweisung):** Jeder Lesezugriff auf das Exchange-Archiv führt zuerst `purgeExpired()` aus (`lib/career/result-inspector/postgres-exchange-store.ts`, `completedForRun` / `forJob`), also `DELETE … WHERE expires_at <= now()`.
- Alle Exchanges des Labors laufen am 2026-10-29 ab (Aufbewahrung 7 Tage). Innerhalb der Laufzeit des Tors trifft die Anweisung daher 0 Zeilen.
- Die Bodies vor und nach dem Smoke-Test sind gleich.
- Das ist bestehendes Verhalten, eine Löschung abgelaufener Daten nach Owner-Regel vom 2026-10-15. Es wurde nicht geändert. Festgehalten wird es, weil „nur lesend“ für diese Route nicht wörtlich gilt.
