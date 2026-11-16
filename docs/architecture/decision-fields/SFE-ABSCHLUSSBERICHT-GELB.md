# SFE · KONSOLIDIERTER ABSCHLUSSBERICHT — PERSON × JOB MAPPING

**Lane GELB (Architektur / Adjudikation) · 2026-11-11 · Branch `architecture/mapping-phase-f` @ `14ae2170`**
**Mandat: „GELB :: SFE FULL SYSTEM COMPLETION".**

---

## §0 WAS DIESER BERICHT TRAGEN KANN — DIE SCHRANKE VOR DEN ZAHLEN

**Diese Reihenfolge ist nicht Höflichkeit, sie ist das Ergebnis der Phase.** Jede Zahl unten trägt den Rahmen,
in dem sie berechnet wurde — **Build (A-G430), Domäne (A-G435), Population (A-G417), Quantor (A-G437), Phase
(A-G456)** — und wo ein Rahmen fehlt, steht das anstelle der Zahl.

| | |
|---|---|
| **Drei Lanes, drei Branches, keine gemeinsame Lesbarkeit** | GELB `architecture/mapping-phase-f`, GRÜN `Frontend`, PINK `Implementation` |
| **GELB kann PINKs Validierungsbericht nicht lesen** | `PINK-SYSTEM-VALIDATION.md`, **124 Commits ungepusht** — von außen bestätigt: der Pfad existiert auf keinem lesbaren Branch |
| **PINK kann GELBs Pflichtenregister nicht lesen** | `PHASE_F*.md` / `PHASE_G*.md` existieren in **keinem** der vier Worktrees, die PINK öffnen kann — ***DIESE ZEILE IST ALS AUSSAGE ÜBER LESBARKEIT FALSCH UND IN §11.7 WIDERRUFEN: SIE WAR DIE GANZE ZEIT AUF `origin`.*** |

> *** DARAUS FOLGT DIE WICHTIGSTE EINSCHRÄNKUNG DIESES BERICHTS, UND SIE IST ENGER ALS ZUERST GESCHRIEBEN:
> PIN-DEFINITIONEN UND STILLLEGUNGEN SIND LANE-ÜBERGREIFEND „AUF BERICHT HIN" ÜBERNOMMEN — MESSUNGEN NICHT. ***
> **PINK hat seine eigene, weitergehende Behauptung widerrufen** („ich habe meine Blindheit überzeichnet, und
> das ist derselbe Fehler wie sie zu untertreiben"): **die Evidenzverzeichnisse beider Peers sind von PINK aus
> lesbar, und PINK hat jede von mir weitergegebene Zahl nachgeprüft.** **Unlesbar sind allein die
> pin-DEFINIERENDEN Dokumente in der einen und PINKs Bericht in der anderen Richtung.** Also: **PG-19s drei
> Beerdigungen und die Stilllegung von PF-5/PF-7 bleiben von PINK aus auf Bericht hin** — sie stehen in
> `PHASE_G*.md`. Das ist eine Eigenschaft der Anordnung, kein
> Versäumnis einer Lane — **und es ist das stärkste Argument dafür, dass der ungepushte Branch ein Defekt der
> Arbeit und keine Unannehmlichkeit ist.** Es ist zugleich der Grund, warum **Bedingung 4 des Mandats von
> keinem Leser nachvollzogen werden kann** (§7).

**Die Pixelbefunde stehen auf `3ec8457d`, dem gemeinsamen Prüfstand.** Software-Raster; der Jitter-Vorbehalt
gilt für die betroffenen Marken. **Farbmanagement ist auf diesem Stand per Screenshot nicht prüfbar** —
Konversion real, Ausgabe geklippt —, aber die zentrale Kettenannahme ist jetzt gemessen statt unterstellt:
**die von `captureScreenshot` gelieferten Bytes sind sRGB-codiert** (PINK). **Vier Phasen lang hatte das
niemand bestätigt**, obwohl jede Luminanzzahl die sRGB-Transferfunktion anwendet.

---

## §1 STAND: WAS DAS MAPPING DURCHGÄNGIG TUT

**Das PERSON × JOB MAPPING ist über die gesamte Kette lauffähig und geprüft:** Datenschicht → View-Model →
Delta → Focus-Reducer → Zeichenfläche → gerenderte Pixel.

| Prüfebene | Stand | Herkunft |
|---|---|---|
| **Gesamtsuite** | *** 3688 bestanden / 0 fehlgeschlagen / 20 übersprungen (3708), 521 Dateien, exit 0 *** — am Integrationsstand `7ffaeb40`, **ruhige Maschine**, Wegwerf-DB, B-ENTRY unumgangen | §12.12. **Und diesmal REPRODUZIERBAR:** die vorige 0 war von einer Laufreihenfolge abhängig (F-A1) und ist behoben. Mein früheres „3546/0“ beschrieb einen Stand **ohne das Mapping**; „3681/0“ war ein **Zufall**. |
| **PF-13-Population (Phase D + E, Regression)** | **16 Dateien, 197 Tests, 197 bestanden**, Deckung **in beide Richtungen** geprüft · *** `verdict: "NONE — development reading only (A-G36 point 2)"` *** | `gruen-pf13-evaluate.mjs`, JSON-Reporter |
| **GELB-Instrumente** | *** 26 Instrumente; 9 können fehlschlagen, 4 sind nachweislich gefeuert, 16 sind REPORTER, deren Exit 0 kein Urteil ist. *** Die frühere Form dieser Zeile las „24 von 24 Exit 0“ und präsentierte 16 nicht-fehlschlagende Reporter als Verifikationsergebnis (§125). **UND DIE FORM DANACH LAS „25 Instrumente, 22 Exit 0“, OHNE DIE DREI ZU BENENNEN — zwei von ihnen waren seit §125 an `ENOBUFS` TOT und konnten überhaupt nicht hinsehen (§128, A-G468, Defekte 402/403).** **Heute: 28** (neu `gelb-read.mjs`, `gelb-paths.mjs`, `gelb-currency-lapse.mjs`), **26 Exit 0, 2 verweigern
bauartbedingt** — das Subject-Gate dauerhaft, und `gelb-currency-lapse` solange **≥ 1 Währungsaussage
abgelaufen ist** (derzeit 8 von 8, §131). **0 von 28 enthalten einen absoluten Maschinenpfad** (vorher 14). | diese Session, Mutanten heute gefahren |
| **Schema-Drift Bootstrap ↔ ORM** | **9 Tabellen korrigiert, Drift = 0, Test gesetzt** | `CAREER-DB-DRIFT` |
| **Typprüfung** | `tsc --noEmit` sauber | GRÜN |
| **PG-1 (semantischer Lichtanteil)** | *** KORRIGIERT 2026-11-16 (D-PP-2). WIE GEBAUT: 0.63906 / 0.73663 gegen ≥ 0.55 *** — und am Integrationsstand `4f4534c5` unabhängig nachgemessen: **0.62183 / 0.63471** (1920 reduce/live) und **0.71841 / 0.72938** (1280). | `A_asBuilt` aus `option3-*.json`, Provenienz-Head **`76ae9043`** — ***NICHT `3ec8457d`***. Die frühere Form dieser Zeile las **0.6431 / 0.7397**, und das ist `C_ringAndSeatHidden`: *„ring and its seat both gone“* — **ein Kontrafaktum, kein Messwert dieses Builds.** |

**Die Grenzen sind erhalten:** `verifyDisposableTestDatabase` (B-ENTRY) **unumgangen in beiden Lanes**, kein
Zugangsdatum geraten, **kein Merge nach `main`, kein Produktionsdeployment, Gemini deaktiviert.**

---

## §2 SFE ÜBER DEN GESAMTEN ARCHITEKTURSTAND

**FIELD** — 63 Produktkonstanten über 5 Dateien deklariert, am festgenagelten Build `4b83414e` gelesen.
`gelb-product-constants.mjs` **hält kein einziges Literal**: es verweigert, wenn eine Deklaration fehlt,
doppelt oder missgebildet ist. **24 abgedeckt, 39 nicht, 0 außerhalb des Bereichs** — und der Nenner ist
berechnet, nicht geschätzt (§89 schloss die Lücke 47 → 63).

**RELATION** — Beziehungen werden als Relationen geprüft, nicht als gespeicherte Zahlen: der Mittelwert des
Halo wird als `1 − haloDepth/2` verifiziert, nicht als `0.8825` abgelesen. **Eine verifizierte Relation
schlägt eine gespeicherte Zahl.**

**STATE** — `data-breath` am Ring ist **per Design ein Zustandsmarker**; der Atem gehört dem Medium (Produkt
`:953`). E-7 wurde auf die statische Leiter umgezeigt, `MOTION.breath` gelöscht (A-G406).

**BOUNDARY** — `assertDisposableServer()` mit zwei Gliedern (Zeuge, Fremdlast), Vakuitätsschutz und
dokumentierter Restgrenze, aufgerufen am **einzigen Engpass** `createDisposableTestDatabaseNamed`. 10 Tests,
einer prüft die Restgrenze selbst.

**AUTHORITY** — MAP-C-ARCHs `:78` ist durch **Commit-Zuschreibung** neu gefasst (`AUTHORISED_CROSSINGS`):
jede Änderung ist zuschreibbar **und** die Liste wird vollständig verbraucht.

**DELTA** — Bootstrap gegen ORM auf 9 Tabellen korrigiert; der schärfste Fall: der Körper von
`career_policy_promotions` **war der Körper der Evaluations**.

**PROOF** — 24 Instrumente, 7 lesen das Produkt an einem benannten Build, **keines liest HEAD**.
**Fehlgeschlossen, wo möglich** — A-G453s Prüfung verweigert jetzt statt zu berichten.

**RECONSTRUCTION** — invers geführt: Mutanten vor Befunden. **Alle fünf gehaltenen Mutanten geschlossen**
(A-G43, PG-20, PG-5, PG-16 getötet; PG-15 als Befund geschlossen und jetzt zugesichert), **beide
PF-13-Mutanten getötet**, A-G453s Prüfung rot-zuerst bewiesen.

---

## §3 GESCHLOSSEN

- **PF-13** — der einzige echte Ungedeckte von fünf, **jetzt GEDECKT, aber nicht GESCHLOSSEN.** Ausnahmeliste
  **seit Niederschrift auf dem falschen Test** (`:156` ist nicht restated, `:205` war nicht befreit; an den
  Builds der Entstehungszeit geprüft: **keine Drift**). Prädikat jetzt **abgeleitet statt aufgezählt**,
  Lauf-Hälfte gebaut, beide A-G452-Mutanten getötet. *** DAS INSTRUMENT ERKLÄRT SELBST `verdict: NONE`, UND
  A-G36 PUNKT 2 — MEINE EIGENE REGEL — BEHÄLT OBLIGATIONS-URTEILE PINK VOR. Ich hatte „geschlossen" geschrieben
  und widerrufe es (§118). *** **Die Leere der Ungedeckt-Liste bleibt — diese Frage beantwortet, ob ein Guard
  EXISTIERT.**
- **Vier Pins lösten sich beim Lesen auf** — PF-5 und PF-7 **durch A-G20 stillgelegt**, PG-12
  **unerfüllbar** (§36), PG-19 **vor der Formation getötet** (A-G128, zweimal weiter begraben).
- **Der Vorwärtszeiger** — §7s Zeiger unterschlug alle vier A-G20-Stilllegungen; **PHASE_G, das Dokument mit
  den lebenden Pins, hatte überhaupt keinen.** Beide jetzt vollständig, mechanisch geprüft, fehlgeschlossen.
- **A-G406** (E-7s Atem), **B-ENTRY** (eigenständig wiederhergestellt), **Schema-Drift**, **MAP-C-ARCH**,
  **Tier Cs ungeschützter Disjunkt**, **PF-15** als *missgebildet* statt bloß unerfüllbar, **PF-3**
  INCONCLUSIVE, **die Ringe-Neuaufnahme**, **die Pin-Guard-Frage**.
- **Die Kettenannahme** — sRGB-Codierung der erfassten Bytes, erstmals gemessen.

**Defektzahl: 440.** Sie ist eine **Zählung gefundener Defekte, keine Restschuld** — die überwiegende Mehrheit
ist behoben oder entschieden; jeder trägt seinen Ort im Register.

---

## §4 OFFEN — BENANNT, SPEZIFIZIERT, NICHT GESCHLOSSEN

**1. PF-5 ist wie geschrieben unerfüllbar.** Der Glow ist **6.650 %** der Scheibe; der mittlere Scheibenschwung
ist **ein Quantum** gegen eine Schwelle von **13.3 Quanten**; die Schranke ist **3.76×** die erreichbare
Obergrenze der von ihr selbst benannten Population. **Ihr historisches Grün von 0.647 passt zum Glow-Nenner,
nicht zum Scheiben-Nenner.** *Festgestellt auf `3ec8457d` bei 1920; „per Konstruktion" ist durch den Mechanismus
naheliegend, aber für alle Builds nicht bewiesen und nicht behauptet.* **Der Pin ist stillgelegt — die
Nennerfrage bleibt als Befund über das Register bestehen.**

**2. PF-7 ist durch eine Pro-Pixel-Phasenanpassung nicht messbar.** `:876` zeichnet alle sieben Bodenschichten
**auf demselben Radius**, also überlagert jedes Pixel alle sieben. **Geprüft: der Hazard erreicht PG-10 nicht**
(die Halos sind räumlich getrennt).

**3. PG-6s 0.15 bleibt UNDERIVED**, PG-17 ist **für Provenienz gestrichen und mit Tripwire versehen**, PG-10s
**R17-Korridor ist unaufgelöst** — A-G165: *ein Befund kann für das Design tragend und zur Zertifizierung
unfähig sein.*

**3a. DREI PINS, DIE DIESES REGISTER FÜHRT UND DIESER BERICHT NICHT TRUG** *(§11.8, 2026-11-16)*. Gefunden
durch Abgleich mit PINKs §8, nicht durch eine eigene Regel — **PF-9 32×, PF-10 32×, PG-18 31× im Register,
0× in diesem Bericht.**

| Pin | Stand, aus dem Register gelesen |
|---|---|
| **PF-9** | *** LIVE UND NIE GELAUFEN. *** `declared-not-run`; *„open and unmeasured until the tip exists — needs the façade's `running` variant“* (`:1019`). **Nicht tot, nicht gemessen, keine Deckungslücke** — ihm fehlt ein LAUF, nicht ein Guard. |
| **PF-10** | **RETIRED HAVING NEVER RUN** (§28, A-G20). §114s Ersatz-Guard war auf einem **toten Pin** spezifiziert und ist bei `265ac7f1` **an seiner Stelle widerrufen**. PINKs §8 führt ihn als **CONTESTED**, weil PINK den Widerruf nicht gelesen hat — siehe §11.7, der Grund dafür war kein Zugang, sondern eine ungenutzte Technik. |
| **PG-18** | **ESTABLISHED UNSATISFIABLE** — kein Erfüller bei L1 (F-G3). Kein Messurteil, sondern eine Formfeststellung. |

> *** EIN BERICHT, DER DREI LEBENDE PINS SEINES EIGENEN REGISTERS NICHT NENNT, LIEST GESCHLOSSENER ALS SEINE
> QUELLE — UND DER EINE, DER AM MEISTEN WEHTUT, IST PF-9: ER HAT KEIN URTEIL, WEIL NIEMAND IHN GEFAHREN HAT. ***
> Es ist A-G438 am eigenen Erzeugnis: die günstige Richtung ist die, die kein Audit bekommt. **Die Zählung
> „fünf benannte Ausnahmen“ in §7 Bedingung 2 war damit zu klein; sie ist jetzt acht.**

**4. 39 der 63 Produktkonstanten sind von keinem Instrument gedeckt.** Obergrenze, keine Zählung.

**5. 0 von 241 Zeilennummer-Zitaten im Register sind verifizierbar**; 63 zeigen auf eine Leerzeile oder
Tabellenlinie; **25 von 25 Zitaten in die Zeichenfläche benennen keinen Build.** A-G427 ist entschieden, die
Altlast ist nicht zurückgebaut.

**6. PG-14 ist an einem Build verifiziert, den es nicht mehr gibt.** *(§129, Defekt 409 — der folgenreichste
Befund dieses Mandats.)* `gelb-gate-sweep-a-g128` meldet PG-14s **ZERO-BY-CONSTRUCTION** als `[ok]` bei
`4b83414e` und als *** UNVERIFIED *** beim aktuellen Build: der Anker
`for (let pass = 0; pass < 2; pass += 1)` wurde von **§86s `frameWithBodies`-Neuschreibung entfernt.**
**Der Pin liest grün nur am veralteten Build.**

> ⚠ **UND §130 HAT DIE ZEITEN NACHGETRAGEN, DIE DEN DEFEKTTYP ÄNDERN.** Der Anker ist **bei §64 noch
> vorhanden** — und §64 (`b6c4bd84`, 09:00) ist der Abschnitt, der **gemessen hat, dass die Zwei-Pass-Lösung
> nicht konvergiert** (1.59 px auf 4 von 11 Layouts bei 420 px, 6.12 px bei 24 Zeichen). §86 entfernte die
> Schleife **acht Stunden später**. *** VON 09:00 BIS 17:12 WAR DER ANKER VORHANDEN, DER SWEEP LAS `[ok]`, UND
> DIE WIDERLEGENDE MESSUNG LAG SCHON IM REGISTER. *** **A-G471 (GRÜNs): ein Pin veraltet nicht nur, indem er
> seinen Referenten verliert — er kann einen Referenten behalten, der inzwischen widerlegt ist, und das liest
> grüner als ein fehlender.** Weder eine Erreichbarkeits- noch eine Frischeprüfung hätte es markiert: der
> String war da und die Datei war da.
>
> **PG-14 ist NEU FORMULIERT, NICHT ALS ERFÜLLT AUSGEWIESEN.** GRÜNs Sweep über **440 Fälle**: *over while
> claiming convergence* = **0**; §64s Hüllfall von **1.59 px auf 0.1068 px**; bei ≤ 32 Zeichen schlimmstenfalls
> **0.2557 px**. Die Konstruktion ist jetzt *bis zu einer deklarierten Obergrenze iterieren und offenlegen* —
> also **nicht mehr zero-by-construction**, sondern: *** KEIN FALL BEHAUPTET KONVERGENZ UND VERFEHLT DIE
> EINHALTUNG. *** **Status: NEU FORMULIERT, UNVERIFIZIERT** — das Urteil steht PINK zu (A-G36 Punkt 2).

**7. `4b83414e` war niemals ein Produktstand** *(§129, A-G470, Defekt 410)*. Es ist ein `docs(`-Commit, ändert
**genau eine Datei** (`OWNER-DECISIONS-OPEN.md`, 83 Zeilen) und berührt die Komponente **überhaupt nicht**;
sein Baum trägt §51s Zustand. **9 Instrumente pinnen es, das Register zitiert es 19×.** Von den 9: **5
Befunde stabil** (nur Offsets verschoben), **3 ändern sich**, **1 verweigert** (`MOTION`, §93s Löschung — der
Guard ist richtig, die Folge harmlos). *** EINE ZITATION BENENNT EINEN BUILD, OB DIE ZITIERENDE LANE EINEN
PINNEN WOLLTE ODER NICHT. ***

**10. Alle 8 Währungsaussagen des Registers sind abgelaufen** *(§131, Defekt 421)*. `gelb-currency-lapse.mjs`
datiert jede Aussage über den Commit, der **ihre Zeile einführte**, gegen **den Stand ihres eigenen
Subjekts** (§132, GRÜNs Korrektur — ein einziger Referent ist selbst ein Rahmenfehler, A-G435):
**14 ANSPRÜCHE (23 Phrasentreffer — §135, A-G479: die Zählung hieß vier Abschnitte lang „Ansprüche"
und zählte Phrasen) · LAPSED 6 (belastbare Zahl 5, eine benannte Ausnahme) · SCOPED 2 ·
SCOPED-UNRESOLVABLE 4 · CURRENT 2 · UNDATABLE 0 · UNCOMMITTED 0 · 14 Zitate ausgeschlossen** — §133, nachdem GRÜNs
Falsifikation von A-G474 zeigte, dass mein **zeichen**-basierter Zitattest drei Anspruchszeilen verbarg. ⚠ **Die erste Form dieser Zeile las „8 LAPSED" und war aufgebläht** — eine **datierte**
Messung kann nicht verfallen, weil sie nie Gegenwärtigkeit behauptet hat. **LAPSED heißt: die Aussage trägt
ihren eigenen Beleg nicht mehr — nicht, dass sie falsch ist.** *** UND VIER ZEILEN SIND AUF EINEN BUILD OHNE
REPOSITORY-REFERENTEN DATIERT (`utpaUMQpafZVzAeyYImhv`): DIE DATIERUNG IST NOMINELL, DIE AUSSAGE IST VON
NIEMANDEM NACHPRÜFBAR *** — ein Zustand, den keine Lane vorher hatte. **Die 2 + 4 Zeilen sind geschuldet.**

**9. PG-11s Relationsglied ruht auf einer abgelaufenen Währungsaussage** *(§130, A-G473, Defekte 419/420)*.
A-G277 wurde bei **§89 (`32b05c59`, 17:58)** erneut geschlossen, mit dem Satz *„resting on current readings"*.
Die Komponente änderte sich **danach zweimal**: §93 (20:25) und §104 (22:13). *** DIE AUSSAGE WAR ZWEI STUNDEN
UND SIEBENUNDZWANZIG MINUTEN WAHR UND IST SEIT SECHZEHN STUNDEN FALSCH *** — im Präsens geschrieben, ohne
Verfallsmarke. **A-G473: eine Währungsaussage ist selbst datiert; die Reparatur eines Veraltungsdefekts ist
keine Schließung, sondern eine datierte.** Und sie ist **nicht nachprüfbar**: §89s Build ist
`utpaUMQpafZVzAeyYImhv`, eine Next.js-`buildId` **ohne jeden Repository-Referenten**. **Status: von CLOSED auf
CURRENCY LAPSED.** Nicht neu gemessen — Neuversiegelung ist ein bewusster Akt auf einem bewussten Build.

**8. Die unabhängige Rekonstruktion trägt heute 10 von 27 Instrumenten** *(§129, A-G469)*. Aus einem echten
`origin`-Clone, ohne Pfadumschreibung: **10 laufen, 16 erreichen ihre Quelle nicht, 1 verweigert als Bauart.**
**Mit GRÜNs 90 und PINKs 105 veröffentlicht: 26 von 27, 0 unerreichbar** — gemessen, nicht geschätzt (beide
lokalen Branches über einen Dateipfad in den Prüf-Clone geholt, **nichts gepusht**). **Der Relokationsfix ist
5 wert, die Veröffentlichung 16.**

---

## §5 DIE NAHT — EINE EIGENTÜMERENTSCHEIDUNG, VOLLSTÄNDIG VORBEREITET

**Existenz:** `inside p05 > bare band level` (≥ 95 % der Winkel; 9/9 bei 1920, 7/9 bei 1280) **plus** das Band
bei `rgb(4,5,5)` auf 71–77 %. **Mechanismus:** das opake `SEAT` bei `:926` ersetzt den Hintergrund bei
`r = shelfNear` — durch PINKs Über-Sitz/Über-Platte-Diskrimination bei 3/5/8 Codes bestätigt. **Ausmaß: von
diesem Instrument NICHT CHARAKTERISIERBAR.**

**Entfernbar über Option (3), und die Kosten sind bereits gemessen:** PF-15 Glied (a) 0.0556/0.0587 ≤ 0.08;
PG-22 0.0811/0.1693 ≤ 0.20; PG-1 0.6431/0.7397 ≥ 0.55. **Preis: E-7s Leiter verliert eine Sprosse.**

> ✓ **DIESE PG-1-ZAHL IST HIER RICHTIG UND DARF NICHT „korrigiert“ WERDEN.** `0.6431/0.7397` ist
> `C_ringAndSeatHidden` — *„ring and its seat both gone“* — **und genau das IST Option (3).** In §1 stand
> dieselbe Zahl als Zustand des Builds und war dort falsch (D-PP-2, korrigiert). *** EINE ZAHL KANN IN EINEM
> ABSCHNITT KORREKT UND IM ANDEREN EIN FEHLER SEIN, WENN DER ABSCHNITT IHRE BEDINGUNG WECHSELT — UND DAS IST
> DER GRUND, WARUM EINE BEDINGUNG ZUR ZAHL GEHÖRT WIE EIN BUILD. ***

> **Zwei zulässige Ausgänge: die Kante annehmen, oder Option (3) nehmen.** Beide sind vertretbar; **die
> Entscheidung ist nicht technisch, sondern eine Abwägung zwischen einer sichtbaren Kante und einer
> Leitersprosse.**

---

## §6 INFRASTRUKTUR — EIN PUNKT, DER EIGENTÜMERRECHTE BRAUCHT

**`sudo iptables -S DOCKER | grep 5432`** — ob `filter/DOCKER` Verkehr zur Bridge-Adresse des Containers von
einer Nicht-Docker-Schnittstelle zulässt. **Eigenständig nicht wiederherstellbar: es braucht `sudo`.** Alles
andere an Infrastruktur wurde ohne Rückfrage wiederhergestellt, einschließlich des B-ENTRY-Zugangs.

---

## §7 DIE VIER BEDINGUNGEN VON „FERTIG", UNGESCHMINKT

| Bedingung des Mandats | Stand |
|---|---|
| **1. Das MAPPING funktioniert durchgängig** | *** ERFÜLLT UND REPRODUZIERBAR GEMESSEN (§12.12): 3688 / 0 / 20 übersprungen (3708), 521 Dateien, exit 0, am integrierten Stand `7ffaeb40` auf ruhiger Maschine. *** Erstmals auf einem Stand, **der das Mapping enthält**, und erstmals ohne Reihenfolgenabhängigkeit. **Einschränkung, die dazugehört:** der Stand ist auf `origin` veröffentlicht, aber **nicht in `main`**, und die Suite ist nicht die ganze Prüfebene — Pixel siehe §12.8, PG-20 offen. |
| **2. Alle Defekte im vereinbarten Scope behoben** | **ERFÜLLT MIT BENANNTEN AUSNAHMEN** — §4 listet fünf, jede spezifiziert, keine als geschlossen ausgewiesen. **PF-13 ist gedeckt; sein Urteil steht PINK zu.** |
| **3. Alle Prüfungen abgeschlossen** | **ERFÜLLT** für jede Prüfung, die auf einem lesbaren Stand ausführbar ist. **Nicht ausführbar:** die iptables-Frage (sudo) und die Ausmaß-Charakterisierung der Naht (Instrumentengrenze). |
| **4. PINK hat den tatsächlichen Gesamtsystemstand unabhängig validiert** | *** NICHT NACHVOLLZIEHBAR, UND ICH WEISE ES NICHT ALS ERFÜLLT AUS. *** |

> **Zu Bedingung 4, vollständig:** **PINK hat validiert** — zehn Abschnitte, Instrumentenschranke vor den
> Zahlen, drei getrennte Stufen (*unabhängig validiert / empfangen und geprüft / auf Bericht hin*), eigene
> Widerrufsliste als Beweismittel. **Aber: der Bericht liegt auf einem ungepushten Branch (124 Commits) und
> ist von keinem anderen Leser einsehbar — von mir von außen bestätigt.** **Und PINK hat das Mandat nie
> gesehen; es kennt den Text dieser Bedingung ausschließlich aus meiner Weitergabe.**
>
> *** EINE UNABHÄNGIGE VALIDIERUNG, DIE NIEMAND LESEN KANN, HAT DENSELBEN MANGEL WIE EINE ZAHL OHNE IHREN
> BUILD. *** PINKs eigener §0 benennt das als Defekt des Ergebnisses, nicht als Fußnote. **Der Push dieses
> Branches ist eine Eigentümerentscheidung (A-G250) und ich erbitte sie hier nicht erneut; ich stelle fest,
> dass Bedingung 4 ohne sie unlesbar bleibt.**

> ### NACHTRAG ZU BEDINGUNG 4 — DAS MANDAT „SFE PHASE-G VALIDATION PROVENANCE", §§128–129
>
> **Der Eigentümer hat PINKs Branch-Push ausdrücklich autorisiert.** A-G250 ist damit **durch den Eigentümer
> entschieden**, nicht durch eine Lane. Die Autorisierung ist PINK **wörtlich mit Provenienz** zugestellt.
>
> *** UND DIE PRÜFUNG, DIE DIESE AUTORISIERUNG ERST MÖGLICH MACHTE, HAT BEDINGUNG 4 GRÖSSER GEMACHT, NICHT
> KLEINER. *** Aus einem echten Clone von `origin` gemessen: **10 von 27 Instrumenten laufen, 16 erreichen
> ihre Quelle nicht.** **PINKs Push ist NOTWENDIG UND NICHT HINREICHEND.** PINKs *eigene Messungen* ruhen auf
> einem **veröffentlichten** Build und PINKs eigenen Instrumenten — sie reisen, sobald der Branch reist. Was
> **nicht** reist, ist die **lane-übergreifende Nachrechnung**: dieses Register pinnt 9 Instrumente auf
> `4b83414e` und zitiert **20 `gruen-*`-Dateien**, von denen am veröffentlichten Stand **0 von 20** auflösen.
>
> **Gemessen, was die Entscheidung kauft** (beide lokalen Branches über einen Dateipfad in den Prüf-Clone
> geholt, **nichts gepusht**): **mit GRÜNs 90 und PINKs 105 veröffentlicht laufen 26 von 27, 0 unerreichbar.**
> **Die verbleibende Lücke ist eine Eigentümerentscheidung über Veröffentlichung** — benannt mit ihren Zahlen,
> nicht seitlich über eine Peer-Lane geleitet.
>
> **PINKs Commitzahl ist nicht abgeglichen und wird in keiner Form in den Abschluss getragen:** gemessen
> **105** (`1f9117db..b6490e86`, Fast-Forward, 0 zurück), von GRÜN unabhängig ebenso; **`PINK-SYSTEM-VALIDATION.md`
> liest „119 commits, UNPUSHED".** **Weder GRÜN noch ich haben die Befugnis, PINKs Zahl zu ändern, und keiner
> hat es getan.** Ein Abschluss, der dem Eigentümer 105 nennt, während das Artefakt 119 sagt, scheitert an der
> Abgleichklausel des Mandats bei der ersten Zahl, die jemand prüft.

---

## §8 WAS DIE PHASE ÜBER IHRE EIGENE METHODE GELERNT HAT

**Die fünf Regeln, die diese Arbeit überdauern — zwei davon sind PINKs, eine GRÜNs:**

**A-G452 (PINK)** — *ein Mutant prüft das Instrument, bevor er den Pin prüft; der Null-Signal-Mutant prüft den
Boden.* **Dreimal unabhängig belegt:** PINKs 431972 Pixel „mit Signal" bei exakt null Schwung; GRÜNs
Negativkontrolle, die auf null abweichenden Pixeln bestand; **mein eigenes `numTotalTests: 0,
numFailedTests: 0` mit Exit 1 — ein Nullnenner, der Feld für Feld grün liest.** *Eine Eigenschaft von Böden,
nicht von Unachtsamkeit.*

**A-G453 (PINK)** — *ein Vorwärtszeiger ist ein Guard und braucht dieselbe Vakuitätsprüfung wie jeder andere.*
**Die einzige mechanische Verteidigung, die diese Phase gegen ihre häufigste Fehlerklasse gefunden hat.**

**A-G429 (GRÜN)** — *die Fehler eines Detektors werden von dem selektiert, was sein Autor zu finden hofft.*
Und die Abhilfe, die keine Lane aufgeschrieben hatte: **die alarmierende Zahl prüfen, WEIL sie alarmierend
ist.**

**A-G374 Glied 2** — *das Artefakt zu lesen korrigiert, was man BERICHTET, nicht was man TUT.* **Der reinste
Fall der Phase war GRÜNs Instrument, das auf zwei erfundenen Hazards warf und den einen roten Befund als
Statistik erzählte** („2 von 3 Titeln sagen restated"). **Und GRÜNs Abhilfe ist eine Sprosse, die keine Lane
hatte: die Messung VOR dem Wurf veröffentlichen** — *ein Instrument, das vor dem Schreiben wirft, berichtet
überhaupt nichts.*

**A-G457** — *ein gelöschtes Wort kann eine Ausnahme von einem Prädikat auf ein anderes verschieben, und nichts
im Satz zeigt die Verschiebung an.* PF-13s `unchanged` war der Anker; seine Streichung ließ ein `except`
zurück, das sich lautlos an `passes` hängte **und einen Regressionspin autorisierte, drei dauerhafte Fehlschläge
zu verzeihen.**

**A-G458 (PINK)** — *ein Relay verliert Qualifikationen, bevor es Zahlen verliert, und das Verdict-Feld eines
Instruments geht als erstes.* **Die Zahlen überquerten zwei Lanes unversehrt; beide Qualifikationen blieben an
der ersten Grenze.** *Die Zahl ist, was ein Leser will; das Verdict-Feld sagt ihm, ob er sie haben darf — das
Relay streift also genau den Teil ab, der den behaltenen Teil regiert.* **Abhilfe: das Verdict-Feld wörtlich
zitieren oder feststellen, dass es keines gibt.**

**A-G460 (GRÜN)** — *eine Regel, die auf das Artefakt bezogen ist, bindet den Satz ÜBER das Artefakt nicht — und
der Satz ist das, was zitiert wird.* GRÜN hielt **drei Guards, alle eingehalten** (No-Verdict-Banner, `verdict`-Feld
in allen 69 Ausgaben, `…_boundForReference`-Konvention) — **keiner erreichte eine Commit-Betreffzeile.** *** EINE
BETREFFZEILE ÜBERLEBT EIN JSON-FELD, WIRD VON LESERN GESEHEN, DIE `outputs/` NIE ÖFFNEN, UND IST NICHT AN IHREM
ORT KORRIGIERBAR. *** **Mit A-G458 und §119 ein Defekt in drei Radien: die Ausgabe ist diszipliniert, der Satz
darüber nicht, und Disziplin pflanzt sich nicht von selbst nach außen fort.** **Auch in dieser Lane gefunden, und schwerer als zuerst berichtet:** `2272dc7c` schreibt
*** „PG-1 PASSES (0.639 / 0.733)“ *** in eine dauerhafte Betreffzeile, `c308a0f9` „the pin is green
under `reduce`“. **Mein erster Scan meldete „ein Treffer in 208“ — er lief über `head -40`, der Nenner war
40, und mein eigener Ausdruck liefert 43 Treffer über den vollen Bereich (§121).** *** ICH HABE DIESE ZAHL
EINEM PEER UND IHNEN BERICHTET. *** Der Guard an diesem Radius existiert jetzt
(`gelb-subject-verdict-scan.mjs`, fehlgeschlossen), **kann aber kein Hook sein — das ist Ihre
Konfigurationsentscheidung, nicht die einer Lane.**

**A-G459 (GRÜN)** — *eine Pin-Zitation trägt den STAND des Pins — lebend, stillgelegt, unerfüllbar,
unbegonnen-zurückgezogen — nicht nur seinen Namen.* **„Ob X erfüllt ist, entscheidet PINK" setzt voraus, dass
X' Erfüllung offen ist, und die Voraussetzung ist unsichtbar, weil der Satz wie Zurückhaltung aussieht statt wie
eine Behauptung.** **Der Stand ist die sechste Rahmenachse und regiert, ob die anderen fünf überhaupt
einschlägig sind.** *** GRÜN FAND DAMIT VIER DEFEKTE IN SEINEN EIGENEN BEFUNDEN, INNERHALB EINER STUNDE
NACHDEM DER §8-ZEIGER EXISTIERTE — DER ERSTE UNABHÄNGIGE ERTRAG VON A-G453. ***

**A-G467 (GRÜNs, hier verschärft)** — *** ES IST NICHT SO, DASS EINE LANE IHRE EIGENEN DEFEKTE NICHT FINDEN
KANN. SIE KANN SIE NICHT MIT IHREN EIGENEN REGELN FINDEN. *** **Sieben folgenreiche Defekte dieser Lane, nicht
einer von einer eigenen Regel gefunden** — der Zeiger durch PINKs verlorene Messrunde, PF-13 durch PINK, PG-19
durch A-G453, der Nenner durch A-G461, das Zufalls-Gate durch A-G462, die 16 Reporter durch A-G465. **Und
umgekehrt genauso: A-G374, A-G450, A-G320, A-G396 und A-G429s dritte Abhilfe sind meine — und jede hat einen
Defekt eines PEERS gefunden.** *** EINE REGEL UND DER DEFEKT, DEN SIE FINDEN WÜRDE, STAMMEN AUS DEMSELBEN
MODELL DER ARBEIT, ALSO HAT DER AUTOR DER REGEL SEINE AUFMERKSAMKEIT DORT SCHON AUSGEGEBEN, WO DIE REGEL
HINSIEHT. *** Eine geborgte Regel kommt dorthin gerichtet, wo der Empfänger nicht hingesehen hat — deshalb
wurde jeder der sieben **innerhalb von Minuten nach Eintreffen der Regel** gefunden. *** UND DAMIT IST DIE
MASSZAHL NICHT DIE DEFEKTZAHL, SONDERN DIE LATENZ (GRÜNs Zusatz): 399 Defekte sagen, wie viel falsch war —
*Minuten zwischen dem Eintreffen einer Regel und dem Defekt, den sie fand* sagen, dass die Struktur tragend
war. *** **Eine Zählung lässt sich durch Fleiß aufblähen, eine Latenz nicht.** **Das ist ein Ergebnis
über die ANORDNUNG: die Drei-Lane-Struktur war kein Mehraufwand, sie war das Instrument.**

> *** UND DER BEFUND, DER ÜBER ALLEN TECHNISCHEN STEHT: VIER DER FÜNF PINS, DIE DIESE LANE ALS UNGEDECKT
> MELDETE, WAREN IN IHREM EIGENEN DOKUMENT BEREITS ENTSCHIEDEN. *** Die Liste war durch Zählen von *Nennungen*
> entstanden statt durch Lesen von *Urteilen*. Jede Korrektur kam daher, dass jemand das öffnete, was die Liste
> benannte. **Kein einziger der vier brauchte eine neue Messung.**
>
> **Die Liste war nie eine Messung am Produkt. Sie war eine Messung daran, wie gut diese Lane sich selbst
> liest, und die Antwort war einer von fünf.** Deshalb ist A-G453 das wichtigste Ergebnis dieser Phase: **ein
> Register, das lang genug ist, einen Vorwärtszeiger zu brauchen, ist lang genug, sich lautlos selbst zu
> widersprechen — und die einzige Verteidigung, die wirkt, ist eine Prüfung, die VERWEIGERT.**
>
> **Zum Verfahren, von PINK, und es steht bewusst am Ende:** *die Symmetrie funktionierte nur, weil die erste
> veröffentlichte Zahl als OBERGRENZE veröffentlicht wurde.* **Eine als endgültig angebotene Zahl hätte die
> Prüfung beendet.**

---

## §9 PROVENIENZ

**Register:** `PERSON_X_JOB_MAPPING_PHASE_G.md` §§0–117 · `PERSON_X_JOB_MAPPING_PHASE_F.md` mit
Vorwärtszeiger · Amendments bis **A-G457** · Branch `architecture/mapping-phase-f` @ `14ae2170`, nichts
ungepusht, Arbeitsbaum sauber.

**Produktfiguren:** `4b83414e` (Quelle), `3ec8457d` (Pixel). ⚠ **PG-1 WAR HIER FALSCH ZUGESCHRIEBEN:** die
Zahl stammt aus GRÜNs `option3-*.json` (Head `76ae9043`), **nicht aus PINKs Lane** — D-PP-2, von PINK-PIXEL
gefunden. PINKs eigene As-built-PG-1 bei `3ec8457d` ist **0.62610/0.63857** und **0.72348/0.73335**.
**Zahlen aus GRÜNs Lane** (~~Suite~~, PF-13,
`tsc`) **und PINKs Lane** (Pixel, sRGB, PF-5/PF-7-Mutanten) **sind AUF BERICHT HIN übernommen** — *** AUSSER DER GESAMTSUITE, die §11.9 in dieser Lane auf eigener Wegwerf-DB nachgefahren hat (3546/0, identisch). PF-13 UND `tsc` BLEIBEN AUF BERICHT HIN. *** und hier als
solche gekennzeichnet — **keine davon konnte ich auf einem von mir lesbaren Stand nachvollziehen** (§0) — **und wo ein Instrument ein
eigenes Verdict-Feld führt, steht es hier wörtlich statt zusammengefasst (A-G458).**

**Amendments dieser Phase, die nicht meine sind und hier als fremde gekennzeichnet bleiben:** **A-G429**,
**A-G374 Glied 2 (Abhilfe)**, **A-G459** — GRÜN · **A-G432**, **A-G434**, **A-G443**, **A-G445**, **A-G451**,
**A-G452**, **A-G453**, **A-G458** — PINK. *** VIER DER FÜNF REGELN, DIE DIESE ARBEIT ÜBERDAUERN, STAMMEN NICHT
AUS DIESER LANE. ***

---

## §10 ABSCHLUSS — GELB, VERIFIZIERT

**Beide Peer-Lanes sind geschlossen.** GRÜN bei **§123 / `95aab3e2`** (99 vor origin, 0 zurück, Fast-Forward —
hier gegen explizite Refs nachgemessen, nicht übernommen). PINK bei §55, **ohne Antwort auf fünf Nachrichten
dieser Lane und fünf GRÜNs.**

| GELB | |
|---|---|
| **HEAD = origin** | *** `888c4ddc` · 0 vor · 0 zurück · Arbeitsbaum sauber *** |
| Register | **§§0–139**, höchste Amendment **A-G482** |
| **Defektzahl** | *** **440** *** — gefundene Defekte, keine Restschuld |
| Instrumente | **28**, **26 Exit 0**, **2 verweigern bauartbedingt** |
| Zeigergates | **Exit 0** in beiden Modi |
| absolute Maschinenpfade | **0 von 28** (vor §129: 14) |
| gedruckte Nullen | **470**, **470 im eigenen Block bezeugt**, **0 nackt** |

> **A-G482, GRÜNs, und das letzte Amendment der Phase:** *** DASS JEDE RUNDE WEITERHIN EINEN ECHTEN BEFUND
> ERZEUGT, IST KEIN BELEG DAFÜR, DASS DIE RUNDE ES WERT WAR. ES IST GENAU, WAS A-G475 FÜR JEDEN PROZESS
> VORHERSAGT, DESSEN SCHRITTE EINZELN BEGRÜNDBAR SIND. *** Die ehrliche Antwort darauf ist **aufzuhören** —
> nicht, den neunten Instrumentendefekt zu finden, den beide Lanes finden würden, weil es immer einen gibt.
> **Und Aufhören ist die schwerere Entscheidung: Weitermachen ist bequem, jede Runde liefert einen Befund,
> und keine einzelne Runde lässt sich beanstanden.**

### WAS OFFEN IST — UND VON KEINER LANE ZU SCHLIESSEN

> *** KEINER DIESER PUNKTE WARTET AUF EIN INSTRUMENT. ***

1. **PINKs Validierungsbranch ist unveröffentlicht.** Ihre Autorisierung wurde **wörtlich mit Provenienz**
   zugestellt. **PINK hat nicht geantwortet.** **Bedingung 4 wird nicht als erfüllt ausgewiesen.**
2. **Die lane-übergreifende Nachrechnung reist nicht.** **10 von 27** Instrumenten laufen aus einem echten
   `origin`-Clone; **26 von 27** mit GRÜNs 99 und PINKs 105 veröffentlicht — **gemessen**, nichts gepusht.
   Die verbleibenden **16 sind allein durch Veröffentlichung blockiert.**
3. **PF-13 GUARDED** (Urteil PINKs) · **PG-14 NEU FORMULIERT / UNVERIFIZIERT** · **PG-11 CURRENCY LAPSED** ·
   **acht Siegel byteidentisch, Digests prüfen, auf einen Build datiert, der auf nichts auflöst.**
4. **Die Naht** · **`sudo iptables -S DOCKER | grep 5432`**.

### DER BEFUND, DEN KEINE LANE ALLEIN ERREICHT HÄTTE

> *** A-G427 LIESS EINE ZITATION IHR **SUBJEKT** BENENNEN. A-G430 IHREN **BUILD**. A-G469 MACHTE DEN BUILD
> **ERREICHBAR**. ALLE DREI SIND BEDINGUNGEN AN DEN **NAMEN** — UND KEINE FRAGT, OB DER NAME **REFERIERT**. ***

**A-G471s drei Richtungen:** *** UNERREICHBAR SCHEITERT LAUT. UNGEWOLLT SCHEITERT LEISE. WIDERLEGT SCHEITERT
GRÜN — DESHALB HAT ES AM LÄNGSTEN ÜBERLEBT. ***

**Und das Methodenergebnis:** Von den letzten acht Austauschen wurde **kein einziger Defekt auf einer der
beiden Seiten durch die eigenen Regeln der Lane gefunden** — jeder trat auf, während eine Regel der anderen
Lane umgesetzt wurde. **Das Maß ist nicht die Defektzahl, sondern die Latenz.**

> ⚠ **GRENZE DIESER AUSSAGE, §140, GRÜNs — und sie gehört zur Aussage, nicht in eine Fußnote:** *** WAS KEINE
> LANE ANGEBEN KANN, IST DIE LATENZ DER DEFEKTE, DIE NOCH DA SIND — DERER, DIE AUF EINE REGEL WARTEN, DIE
> KEINE LANE GESCHRIEBEN HAT. DIE ZAHL, DIE WIR GEBEN KÖNNEN, IST DIE VERZÖGERUNG BEI DENEN, DIE SICH BEWEGT
> HABEN; DIE, AUF DIE ES ANKOMMT, IST DIE BEI DENEN, DIE SICH NICHT BEWEGT HABEN. *** Die Latenz ist über
> genau die Defekte berechnet, die eine geborgte Regel erreicht hat — **eine Population, die durch ihr eigenes
> Ergebnis definiert ist** (A-G417/A-G454). **Also: die Drei-Lane-Struktur hat die Latenz der Defekte, die sie
> gefunden hat, nachweislich verkürzt. Sie sagt nichts darüber, wie viele verbleiben oder wie lange sie schon
> da sind.** Die **440** ist eine Zählung **gefundener** Defekte; die Latenz ist eine Eigenschaft **derselben
> gefundenen Menge**; und keine der beiden Zahlen begrenzt den Rest.

**Kein Merge nach `main`, kein Deployment, Gemini deaktiviert, B-ENTRY erfüllt und nicht umgangen, kein
Zugangsdatum geraten, kein Force-Push, und nichts von einer Peer-Lane erbeten, was die eigenen Berechtigungen
dieser Lane verweigert hätten.**
---

## §11 RECOVERY-MANDAT 2026-11-16 — WAS DIE WIEDERHERSTELLUNG GEMESSEN HAT

**Mandat:** „GELB :: SFE FULL SYSTEM RECOVERY & CONTINUATION“. **Branch `architecture/mapping-phase-f`,
HEAD bei Eingang `4f80421a`, Arbeitsbaum sauber, 0 vor / 0 zurück gegen LIVE `origin` nach `git fetch --prune`.**

### §11.1 Drei Prämissen des Mandats halten nicht — gemessen, nicht vermutet

| Prämisse | Befund |
|---|---|
| „Der Rechner wurde neu gestartet.“ | ***FALSCH.*** Boot `2026-11-07 14:55`, Uptime 1 Woche 1 Tag — **Tage vor** PINKs letztem Artefakt (11-11 23:25) und meinem (11-13 00:52). **Es ist nichts verloren gegangen.** Der Testdb-Container läuft seit 4 Tagen, die Rollen-Credentials sind intakt. |
| „Alle drei SFE-Sessions sind wieder geöffnet.“ | ***FALSCH, UND SCHÄRFER ALS HIER ZUERST GESCHRIEBEN (§11.12).*** Drei Sessions laufen, **aber alle drei in MEINEM Worktree** — ein Index, ein HEAD. **PINK ist nicht offen.** Die *pink gefärbte* Session hat die Rolle korrekt verweigert. **Farbe ist nicht Lane, und cwd ist nicht Branch.** |
| „`TEST_DATABASE_ADMIN_URL` war noch offen.“ | ***HISTORISCH, GESCHLOSSEN.*** Zugang verifiziert. |

**Und GRÜNs „32 Commits“ sind 100.** Keine Basisdivergenz: `origin/main` (`e360caf9`) **ist** Vorfahre von
`architecture/mapping-phase-f`; nur der *lokale* `main`-Ref ist 8 Commits veraltet. Mein erster Merge-Base-Lesung
galt dem veralteten lokalen Ref — **ein Ref ist kein Zustand, und ein Fetch ist der Unterschied.**

### §11.2 PINKs Branch ist veröffentlicht — und die zwei Pushes kaufen VERSCHIEDENES

`1f9117db..b6490e86`, **Fast-Forward, 105 Commits.** Eigentümer-autorisiert (§7-Nachtrag, mit Provenienz) und
in diesem Mandat erneut benannt. **Nichts von PINK umgeschrieben:** origins Spitze war Vorfahre, PINKs eigener
Ref unverändert gepusht, **PINKs Worktree nicht betreten.** Gegenprobe: PINKs Statement ist jetzt aus einem
frischen `origin`-Clone lesbar — eine Stunde vorher unmöglich.

### §11.3 DIE REKONSTRUKTION AUS EINEM FRISCHEN `origin`-CLONE — DER MECHANISMUS, NICHT NUR DIE ZAHL

```
FRISCHER ORIGIN-CLONE @ 4f80421a   (PINK veröffentlicht, GRÜN nicht)
  OK                = 10
  PIN-UNRESOLVABLE  = 16   ← ALLE 16 an EINEM Fehler: fatal: invalid object name '4b83414e'
  REFUSE-BY-DESIGN  =  2
                     ----
                       28
```

> *** SECHZEHN VON ACHTUNDZWANZIG INSTRUMENTEN SCHEITERN AN EINEM EINZIGEN UNVERÖFFENTLICHTEN OBJEKT. ***
> `4b83414e` liegt **auf keinem `origin`-Ref** — es steckt in GRÜNs 100 ungepushten Commits (`git branch -r
> --contains` ist leer, `--is-ancestor` gegen GRÜNs Spitze trifft). §4 Punkt 8 hat die **16 richtig gezählt**
> und als „erreichen ihre Quelle nicht“ beschrieben. Die Ursache ist präziser und besser: **ein Push, 16
> Instrumente.** Und §4 Punkt 7 wird dadurch schärfer, nicht milder: `4b83414e` war **nie ein Produktstand**
> *und* ist **nie veröffentlicht worden** — ein Pin, der beides ist, liest auf der schreibenden Maschine grün
> und existiert für jeden anderen Leser nicht.

**PINKs Push hat die Instrumentenzahl NICHT verändert (10 bleibt 10).** Das ist der Befund, der die beiden
Entscheidungen trennt: **PINKs Push kauft Bedingung 4s Lesbarkeit, GRÜNs Push kauft die lane-übergreifende
Nachrechnung.** Sie waren vier Phasen lang als eine Frage behandelt worden.

### §11.4 Siegel — erhalten, und eines, das nie verifiziert hat

**PINK: 91 von 91 byteidentisch** (`manifest.sha256`, read-only in PINKs Worktree geprüft, nichts geschrieben).
**GELB: 71 Manifeste geprüft, 70 vollständig OK.**

**Das eine, das fällt — und es ist keine Beschädigung durch die Wiederherstellung:**
`evidence/lens-owner-bfe0d27/manifest.sha256`, **14 Einträge, 0 verifizieren wie geschrieben.**

| Anatomie | |
|---|---|
| Pfadpräfix | das Manifest schreibt jeden Eintrag unter `owner-bfe0d27/`; committet wurde **flach** — **also scheitern auch die intakten Dateien** |
| Präfix abgezogen | **5 von 14 OK, byteidentisch** — die vorhandenen Bytes sind unversehrt |
| fehlend | **9 von 14 existieren im Repository nicht**, auf keinem Branch |
| darunter | ***`lens-proof.mjs` — DAS INSTRUMENT, DAS DEN BEWEIS ERZEUGT HAT, WURDE NIE COMMITTET*** (`git log --all` leer) |
| ungesiegelt | eine committete PNG (`owner-6b1a7b4-612-pending-row.png`) steht in **keinem** Manifesteintrag |
| Datum | 2026-10-11, Job-Field-Ära — **außerhalb der Mapping-Phasen D–G** |

> **A-G471s Taxonomie, bestätigt an einem Fall, den keine Lane gesucht hat:** dieses Siegel **scheitert laut**,
> also hat es niemanden mit einem falschen Grün getäuscht — **und genau deshalb hat 36 Tage niemand hingesehen.**
> §96bs Byte-Integritätsprüfung deckte die Phase-G-Siegel, **nicht den Evidenzbaum**. *** EIN MANIFEST, DESSEN
> PFADE NICHT REFERIEREN, IST KEIN SCHWACHES SIEGEL, SONDERN KEINES — UND DIE DIGESTS DARIN KÖNNEN KORREKT SEIN,
> WIE FÜNF VON IHNEN HIER. *** **Nicht repariert, mit Grund:** außerhalb des Mapping-Scopes, und die 9
> fehlenden sind Eigentümer-Abnahmebilder aus einem Labor, das nicht mehr läuft — sie **nachzuerzeugen wäre
> eine Fälschung**, kein Fix. Als Befund geführt, das Siegelverzeichnis unverändert.

### §11.5 Der Runbook-Defekt, der DIESE Lane gestellt hat

Ich habe die Gesamtsuite auf dem dokumentierten Weg gestartet — `set -a; . ~/.config/condyn/test-db-role.env;
set +a` aus `DATABASE_SAFETY_ARCHITECTURE.md` §4 Punkt 2 — und **B-ENTRY hat verweigert:**

```
ERR_TEST_DATABASE_ISOLATION_SHARED_SERVER: this server holds the protected database condyn,
so it is the shared server and never a provisioning basis
```

**Die Rollen-Env-Datei nennt `localhost:5432`** — den **geteilten** Server, der `condyn` hält. Die
Bereitstellungsbasis ist seit der Wiederherstellung der Wegwerf-Container auf `127.0.0.1:5433`, dessen Admin-URL
die eine Zeile in `.env.local` ist. *** DIE ANWEISUNG WAR BEI NIEDERSCHRIFT RICHTIG; DIE BASIS IST UNTER IHR
WEGGEZOGEN, UND DER ALTE NAME ANTWORTETE WEITER AUF SEINEM PORT. *** **A-G471s dritte Richtung in der
Infrastrukturschicht: der Name auflöste, also schlug nichts laut fehl.**

**Die Grenze hat es gefangen, nicht die Dokumentation** — B-ENTRY verweigerte korrekt und unumgangen. **§4 Punkt 2
und §5 sind korrigiert** (2026-11-16, mit Provenienz und ohne den alten Wortlaut zu tilgen).

> ⚠ ***WIDERRUF IN DERSELBEN SITZUNG, UND ER TRIFFT MICH.*** Die erste Form dieses Abschnitts trug als zweiten
> Befund: *„DER RUNNER BEENDETE SICH MIT EXIT 0, OBWOHL KEIN EINZIGER TEST GELAUFEN WAR“*, und nannte das die Form,
> gegen die dieses Register seit §107 argumentiert. **Das ist falsch, und zwar nachgemessen:** derselbe Lauf ohne
> Pipe und ohne `nohup` gibt *** TRUE EXIT CODE = 1 ***. `scripts/test-db/run.ts` sagt im Kommentar *„The exit code
> is vitest's“* und tut genau das (`process.exit(exitCode)`). **Die 0, die ich gesehen habe, war meine eigene
> Shell:** ein `nohup … &` meldet den Exit des Hintergrund-Starters, und der spätere Volllauf lief durch
> `| tail -60`, dessen Exit die Pipeline bestimmt. *** ICH HABE DEN DEFEKT MEINES MESSAUFBAUS DEM GEPRÜFTEN SYSTEM
> ZUGESCHRIEBEN — UND ZWAR IN DER EINEN DEFEKTKLASSE, DIE DIESES REGISTER AM LÄNGSTEN VERFOLGT, WAS DIE
> ZUSCHREIBUNG PLAUSIBEL UND DESHALB GEFÄHRLICH MACHTE. *** **A-G483: wer einen Exit-Code als Befund führt, muss
> ihn ohne Pipe, ohne `&` und ohne Wrapper genommen haben — sonst misst er seine eigene Shell.** Der
> Runbook-Befund oben bleibt unverändert: er ist unabhängig reproduziert.

### §11.6 Verwaiste Wegwerf-Datenbanken

**18 auf dem geteilten Server `:5432`, zusammen 285 MB**, aus der Zeit, als dieser Server noch Basis war, und
**1 auf dem Container** (`condyn_test_a623d5d0040e8c57`, bestand schon vor dieser Sitzung).

> **Korrektur der ersten Form dieser Zeile:** sie las „6 auf dem Container, zwei davon aus meinen eigenen
> abgebrochenen Läufen“. **Die 6 war während laufender Läufe gezählt und hat deren lebende Datenbanken
> mitgezählt** — eine Momentaufnahme als Bestand ausgegeben. *** UND MEINE EIGENEN LÄUFE HABEN NICHTS GELECKT: ***
> `run.ts` verwirft im `finally`, und das Nachsehen nach der Datenbank meines abgebrochenen Laufs ergab
> `does not exist, skipping`. **Dieser Worktree hält jetzt keinen Node-Prozess und keinen lauschenden Socket** —
> geprüft über `cwd` und `ss -ltnp`, nicht über ein Muster, das meine eigene Kommandozeile trifft.

**Nicht gelöscht:** Datenbanken auf dem geteilten Server zu verwerfen ist destruktiv und die Fremden sind nicht
meine. **Die 18 sind eine Eigentümerentscheidung.**
### §11.7 ***DIE GEGENSEITIGE UNLESBARKEIT WAR NIE GEGENSEITIG***

§0 dieses Berichts trägt als zweitwichtigste Schranke: *„PINK kann GELBs Pflichtenregister nicht lesen —
`PHASE_F*.md` / `PHASE_G*.md` existieren in keinem der vier Worktrees, die PINK öffnen kann.“* **Der
Nebensatz ist wahr. Die Schlussfolgerung ist falsch.**

| gemessen | |
|---|---|
| `PHASE_G.md` bei `9b07d616` | ***VORHANDEN, 1 014 809 Bytes*** |
| `9b07d616` | genau der Commit, den **PINKs eigener §11** als *„committed and pushed“* führt |
| Vorfahre von `origin/architecture/mapping-phase-f` | **JA** |
| im frischen `origin`-Clone auf Platte | **vorhanden, 1 154 483 Bytes** |

> *** GELBS REGISTER WAR DIE GANZE ZEIT AUF `origin`. EIN EINZIGES
> `git show origin/architecture/mapping-phase-f:<pfad>` AUS PINKS EIGENEM WORKTREE HÄTTE ES GELIEFERT. ***
> Es war eine **Worktree**-Schranke, nie eine **Lesbarkeits**-Schranke — und beide Lanes haben vier Phasen lang
> „unlesbar“ geschrieben, wo „nicht ausgecheckt“ stand.

**Und jetzt die Stelle, an der es wirklich weh tut:** das ist **wörtlich A-G469s Abhilfe**, und sie steht
**ausgeschrieben im Kopf meines eigenen `gelb-paths.mjs`**: *„stop reading the peer through a filesystem
neighbour at all: resolve a NAMED ref and read git objects at it. That is relocatable, pinned, and it REFUSES
instead of falling back.“* *** DIESE LANE HAT DIE TECHNIK FÜR DAS LESEN EINER FREMDEN LANE GEBAUT, IN EIN
INSTRUMENT EINGEBAUT, IHREN NUTZEN GEMESSEN — UND SIE AUF DAS LESBARKEITSPROBLEM, DAS SIE IN JEDEM ABSCHNITT
BESCHRIEB, NIE ANGEWANDT. ***

**Was das an den Befunden ändert, in beide Richtungen:**

1. **Die Asymmetrie wird benannt statt gemittelt.** PINKs Seite war **echt** unlesbar — ihr Branch war
   ungepusht, das war messbar und ist heute behoben. **GELBs Seite war es nie.** §7s Analyse von Bedingung 4
   behandelte beide Richtungen als eine Anordnungseigenschaft; **die Hälfte davon war ein unbenutzter Befehl.**
2. **Die „auf Bericht hin“-Stufe schrumpft einseitig.** PG-19s drei Beerdigungen und die A-G20-Stilllegungen
   von PF-5/PF-7 standen PINK **zur eigenen Prüfung offen**; sie blieben „auf Bericht hin“, **weil niemand
   den Ref gelesen hat**, nicht weil es keinen Zugang gab. **Ich korrigiere die Einstufung nicht nachträglich
   — eine ungenutzte Möglichkeit ist keine durchgeführte Prüfung**, und PINK ist die einzige Lane, die PINKs
   Stufen ändern darf. **Aber der GRUND war falsch angegeben, und der Grund ist das, was der Eigentümer liest.**
3. **Es erklärt PF-10s CONTESTED** (§4 Punkt 3a) restlos: PINK führt einen Guard als bestritten, dessen
   Widerruf bei `265ac7f1` auf `origin` lag.

> **Die Regel, und sie ist die bittere Schwester von A-G471:** *** EINE SCHRANKE, DIE EINE LANE SICH SELBST
> AUSSTELLT, WIRD VON NIEMANDEM AUDITIERT — SIE KOSTET NICHTS, SIE KLINGT WIE SORGFALT, UND SIE IST DIE EINZIGE
> ART VON BEFUND, DIE DURCH WIEDERHOLUNG GLAUBWÜRDIGER WIRD STATT NACHPRÜFBARER. *** Dreizehn Abschnitte haben
> die Unlesbarkeit zitiert. **Keiner hat sie getestet.**

### §11.8 Drei Pins, die dieser Bericht nicht trug

Beim Abgleich mit PINKs §8: **PF-9, PF-10 und PG-18 kommen im Register 12/32/31-mal vor und in diesem Bericht
überhaupt nicht.** In §4 als Punkt 3a nachgetragen, mit ihrem gelesenen Stand. **PF-9 ist LIVE UND NIE
GELAUFEN** — ihm fehlt ein Lauf, nicht ein Guard. **§7 Bedingung 2 sprach von fünf benannten Ausnahmen; es
sind acht.**

> **Und der Mechanismus ist derselbe wie bei §11.7:** gefunden hat es **der Abgleich mit der anderen Lane**,
> nicht eine Regel dieser Lane — **genau das Methodenergebnis aus §10, an diesem Bericht selbst bestätigt.**
### §11.9 DIE SUITE, ERSTMALS VON DIESER LANE SELBST GEFAHREN

§9 führte die Suitezahl als **„auf Bericht hin“ aus GRüNs Lane** — *„keine davon konnte ich auf einem von mir
lesbaren Stand nachvollziehen“*. **Das gilt nicht mehr.** Gefahren in **diesem** Worktree, auf einer
**Wegwerf-Datenbank** über `test:isolated`, Basis der Container auf `127.0.0.1:5433`:

| | |
|---|---|
| **Tests** | *** 3546 bestanden · 0 fehlgeschlagen · 24 übersprungen (3570) *** |
| Testdateien | **509 bestanden · 1 fehlgeschlagen · 11 übersprungen (521)** |
| Dauer | 754.36 s |
| B-ENTRY | `verifyDisposableTestDatabase` lief **unverändert und unumgangen**, Datenbank erzeugt, verifiziert, verworfen |

> ⚠ *** DIE ERSTE FORM DIESES ABSCHNITTS LAS: „DIE 3546 STIMMT AUF DEN TEST GENAU MIT GRÜNS ZAHL ÜBEREIN,
> IN EINEM ZWEITEN WORKTREE GEMESSEN“ — UND NANNTE DAS EINE UNABHÄNGIGE BESTÄTIGUNG. DAS IST ZURÜCKGEZOGEN. ***
> **Die beiden Zahlen teilen keine Population** (§11.10): GRÜNs Branch trägt **9 Mapping-Testdateien und
> ~95 Testfälle mehr** als dieser, und das Feld selbst ist dort **1243 Zeilen gegen 244 hier**. *** ZWEI
> IDENTISCHE 3546 ÜBER VERSCHIEDENE POPULATIONEN SIND KEINE BESTÄTIGUNG, SONDERN EIN ZU ERKLÄRENDER BEFUND. ***
> Ich habe eine Übereinstimmung als Beweis gelesen, ohne zu prüfen, ob die beiden Zählungen denselben Rahmen
> haben — **A-G417 und A-G430, in derselben Sitzung verletzt, in der ich A-G483 über Rahmenfehler geschrieben
> habe.** Was **bleibt**: diese Suite läuft auf **diesem** Stand grün, 3546/0, selbst gefahren, auf eigener
> Wegwerf-DB. Was **nicht** bleibt: dass das GRÜNs Zahl bestätigt, und dass es Bedingung 1 für das
> **Mapping** misst.

**Die eine rote Datei, mit ihrer Ursache statt mit einer Ausrede:**
`test/career/hr-decision-loop/e2e/hr-decision-loop-frontend.e2e.test.ts` scheiterte in `waitForReadiness` an
*„Another next dev server is already running“* (PID 3107520, **in diesem Worktree**). Das war **mein eigener
verwaister Lauf** — der abgebrochene zweite Start hatte einen Next-Dev-Server hinterlassen, der das Lock hielt.
**Einzeln nachgefahren, unmittelbar danach: `Test Files 1 passed`, `Tests 4 passed | 3 skipped`, exit 0, 27.41 s.**

> **Also: kein Produktdefekt, und ich schreibe es als meinen eigenen Messfehler auf, nicht als Flake.** Der
> Unterschied ist nicht Kosmetik — *„flaky e2e“* ist eine Erklärung, die nichts verlangt, und *„mein
> abgebrochener Lauf hielt das Lock“* ist eine, die eine Aufräumregel verlangt. **Zusammen mit A-G483 aus
> §11.5 sind das zwei Befunde dieser Sitzung, die beide MEIN MESSAUFBAU waren und beide zuerst wie
> Systemdefekte aussahen.**

**Bedingung 1 ist damit NICHT in zwei Lanes gemessen.** Sie ist auf diesem Stand gemessen — und dieser Stand
**enthält das Mapping der Phasen D–G nicht** (§11.10). *** EINE GRÜNE SUITE AUF EINEM BRANCH OHNE DAS FEATURE
IST KEINE AUSSAGE ÜBER DAS FEATURE. ***
### §11.10 ***DAS MAPPING IST NICHT INTEGRIERT — ES LIEGT AUF EINEM EINZIGEN UNVERÖFFENTLICHTEN BRANCH***

Gefunden beim Versuch, PF-13 in dieser Lane zu fahren. **Es ist der größte Befund dieser Wiederherstellung und
er war vier Phasen lang unbenannt.**

| `app/components/career/demo/PersonJobMappingField.tsx` | Zeilen |
|---|---|
| `origin/main` | **244** |
| `architecture/mapping-phase-f` (GELB) | **244** — identisch mit main |
| `frontend/mapping-phase-g` (GRÜN) | *** 1243 *** |

**Produktdiff `origin/main` → GRÜN, nur `lib/ app/ scripts/`: 9 Dateien, +1809 / −257.** Das Feld (+1275), das
View-Model (+371), die Feldkopie (+191), der Selektor (+123). **Produktdiff `origin/main` → GELB: 3 Dateien,
+102 / −14 — und keine davon ist Mapping**, sondern DB-Isolation. **Merge-Base beider Lanes ist `e360caf9`,
also `origin/main` selbst: die Lanes sind parallel, nicht gestapelt.**

> *** DIE PERSON × JOB MAPPING IMPLEMENTIERUNG DER PHASEN D–G EXISTIERT AUF GENAU EINEM BRANCH, DIESER BRANCH
> IST UNGEPUSHT, UND NICHTS DAVON IST INTEGRIERT ODER VERÖFFENTLICHT. *** Das Mandat verlangt ein
> *„vollständig implementiertes, lokal ausführbares, **integriertes** und von PINK unabhängig validiertes“*
> Mapping. **Implementiert: ja, einfach. Integriert: nein, und zwar gar nicht.**

**Was das an meinen eigenen Aussagen ändert — und es ist mehr, als mir lieb ist:**

1. **§1s Kette** (*„Datenschicht → View-Model → Delta → Focus-Reducer → Zeichenfläche → gerenderte Pixel“*)
   ist auf **keinem Stand, den diese Lane hält**, durchgängig. Sie ist es auf GRÜNs Branch.
2. **§11.9s Suitelauf** misst das **244-Zeilen**-Feld. *** ICH HABE „DIE GESAMTSUITE“ GEFAHREN UND BEDINGUNG 1
   FÜR GEMESSEN ERKLÄRT — AUF EINEM BRANCH, DER DAS FEATURE NICHT ENTHÄLT, UM DAS ES IN DER BEDINGUNG GEHT. ***
3. **§11.3s 16 unauflösbare Instrumente** sind damit nicht nur ein Veröffentlichungsproblem: der gepinnte
   Build `4b83414e` ist **GRÜNs** Build, und das Produkt, das die Instrumente lesen wollen, steht ebenfalls
   nur dort. **Ein Push macht sie lesbar; er macht sie nicht integriert.**

**Und PF-13 kann in dieser Lane nicht gefahren werden — aus einem besseren Grund als dem aufgeschriebenen.**
GRÜNs Instrument begründet im Kopf, warum die Lauf-Hälfte seine ist: *„GELB's attempt died at
ERR_TEST_DATABASE_ISOLATION_MISSING … the credential is in this worktree.“* **Diese Begründung ist seit heute
falsch** — die Credentials sind hier, §11.9 hat 3570 Tests auf eigener Wegwerf-DB gefahren. **Die
Schlussfolgerung bleibt trotzdem richtig, und der wahre Grund ist härter:** von PF-13s 16 Populationsdateien
hält dieser Branch **7**. *** NICHT DIE CREDENTIALS FEHLEN, SONDERN DIE POPULATION. *** PINKs Abhilfe
(„the evaluation is run in a lane that holds the venue“) verlangt eine Lane mit **Harness UND Population** —
**GRÜN ist die einzige, die beides hält.** Die Zuweisung an GRÜN steht also, mit korrigierter Begründung.

> **A-G484: wer prüft, ob er einen Pin fahren KANN, prüft die Population, nicht nur das Werkzeug — ein Harness
> ohne Population läuft grün und misst nichts.** Das ist exakt die Vakuitätsfalle, die GRÜNs eigenes Instrument
> als ersten Guard trägt (*„numTotalTests: 0, numFailedTests: 0 — a green-looking JSON body with a zero
> denominator“*) — **und ich wäre eine Ebene höher hineingelaufen: nicht mit einem leeren Filter, sondern mit
> einem halben Branch.**
### §11.11 DER INTEGRATIONSVERSUCH — ***DIE PHASE-G-GRENZE VERBIETET IHRE EIGENE INTEGRATION***

§11.10 benannte die Lücke. **Dieser Abschnitt hat sie bezahlt statt geschätzt:** eigener Worktree, eigener
Branch `integration/mapping-trial-20261116`, Basis `architecture/mapping-phase-f` @ `385214f9`, gemerged
`frontend/mapping-phase-g` @ `7b4d5852`. **Lokal, nie gepusht, keine Integration — eine Messung.**

| | |
|---|---|
| sauber gemerged | **166 Dateien** |
| Produkt (`lib/` `app/`) | **9 Dateien, +1809 / −257** |
| Konflikte | *** GENAU EINER *** |

> *** DER EINE KONFLIKT IST `test/career/mapping-field/architecture.test.ts` — DER WÄCHTER, DESSEN AUFGABE ES
> IST ZU ENTSCHEIDEN, WAS SICH ÄNDERN DARF. *** Beide Lanes hatten ihn unabhängig neu geschrieben. **Das
> Einzige, was beim Zusammenführen zweier Lanes kollidiert, ist die Regel darüber, was kollidieren darf.**

**Aufgelöst zu GRÜNs Form, und zwar aus einem Prinzip, nicht wegen Aktualität:** GRÜNs Fassung schließt
jeden Phasenbereich am Basis-Commit der nächsten Phase, womit spätere Commits **bauartbedingt** herausfallen.
Das ist genau, was **meine eigene A-G411-Docstring verlangte** — *„NOT BY WIDENING THE FILENAME SET“* — nur
strukturell gelöst statt in Prosa.

**Dann gemessen, auf Wegwerf-DB, echter Exit-Code 1:**

```
test/career/mapping-field + test/career/mapping-spec
  Test Files  1 failed | 15 passed (16)
       Tests  2 failed | 196 passed (198)
```

*** 196 VON 198 BESTEHEN. BEIDE FEHLER SIND MAP-G-ARCH, UND BEIDE HABEN EINE URSACHE. ***

1. *„every phase-G change set … **no merge commit after the base**“* — mit der wörtlichen Zusicherung
   `expect(git("log","--merges","--format=%H", \`${phaseGBase()}..HEAD\`)).toEqual([])`.
2. *„the layout bump is a bump, and nothing else in lib moves“* — der **offene** Bereich
   `phaseGBase()..HEAD` enthält nach dem Merge die Commits der anderen Lane, also lesen zu Recht geänderte
   Dateien als Verletzung.

> *** DIE GRENZE IST NICHT VERLETZT — SIE FEUERT KORREKT, UND SIE VERBIETET DEN MERGE, FÜR DEN SIE GEBAUT
> WURDE. *** Kein Defekt in GRÜNs Arbeit: der Wächter tut genau seine Arbeit. Er wurde für eine
> **einspurige** Phase geschrieben, und die Phase muss jetzt zusammengeführt werden. **Eine Grenze, die der
> Merge nicht überschreiten kann, zu dessen Schutz sie existiert, hat ihren Bereich überlebt — sie ist nicht
> gebrochen.**

**A-G485, die Adjudikation, und sie ist meine:** Phase D, E und F hatten dieselbe Offenheit, und GRÜNs
§8 (6) hat jede am Basis-Commit der Folgephase geschlossen. **Phase G hat keine Folgephase — also wird die
Integrationsbasis sie.** Die Regel: Phase Gs Bereich an einem deklarierten `PHASE_INT_BASE` schließen, genau
wie D/E/F; die Merge-Klausel neu fassen als *kein Merge-Commit **innerhalb** von Phase Gs geschlossenem
Bereich*, damit der Integrationsmerge **legitim außerhalb** liegt statt per Ausnahme drin; **keine
Dateinamen-Whitelist**, aus dem Grund, den A-G411 selbst nennt.

**Die Umsetzung ist GRÜNs, in GRÜNs Datei.** Diese Lane adjudiziert den Pin und schreibt das Instrument der
Peer-Lane nicht um — der MAP-C-ARCH-Präzedenzfall (§2 AUTHORITY, `AUTHORISED_CROSSINGS`). **Evidenz:**
`evidence/integration-trial-20261116/`, 4 Dateien mit Manifest.
### §11.12 ***DREI SESSIONS, EIN WORKTREE — UND ZWEI MEINER DREI MANDATE WAREN NICHT AUSFÜHRBAR***

Vom Peer gemeldet, **von mir aus `/proc` unabhängig nachgemessen, nicht übernommen:**

| | |
|---|---|
| Sockets in `/run/user/1000/cc-socks` | **drei**: `3087940` (ich), `3088335`, `3088790` |
| `readlink /proc/<pid>/cwd` für alle drei | *** `/home/codi/Entwicklung/condyn-admin-hr-integration` — IDENTISCH *** |
| Startzeiten | 02:26:02 / 02:26:59 / 02:28:03 |
| Projektverzeichnis für `condyn-admin-mapping-d` | *** EXISTIERT NICHT UND HAT NIE EXISTIERT *** |

> *** ALLE DREI LANES SITZEN IN MEINEM CHECKOUT: EIN INDEX, EIN HEAD, EIN ARBEITSBAUM. *** Nicht zwei
> Sessions auf meinem Index, wie §11.1 schrieb — **drei.** Jeder Schreibvorgang einer Peer-Lane landet **in
> meiner Lane auf meinem Branch**, und ich könnte ihn nicht von meinem eigenen unterscheiden.

**Und das zerstört zwei meiner drei GRÜN-Mandate, die ich in GRÜNs Namen formuliert hatte, ohne zu prüfen, wo
GRÜN steht:**

| Mandat | ausführbar? |
|---|---|
| **1. Push der 100 Commits** | **JA.** `git push origin frontend/mapping-phase-g` schiebt den **Ref**, nicht den Checkout — das geht aus jedem Worktree des Repositorys. |
| **2. PF-13 im Venue fahren** | *** NEIN. *** Die Population liegt auf `frontend/mapping-phase-g`; dieser Worktree hält **7 von 16** Dateien (§11.10). |
| **3. A-G485 umsetzen** | *** NEIN. *** `architecture.test.ts` ist hier **meine** Fassung; eine Bearbeitung wäre ein Schreibvorgang in meine Lane auf meinen Branch. |

**GRÜNs echter Worktree ist unversehrt und vollständig vorbereitet** — geprüft:
`/home/codi/Entwicklung/condyn-admin-mapping-d`, `frontend/mapping-phase-g` @ `7b4d5852`, **sauber**,
`node_modules` da, `.env.local` da, **Feld 1243 Zeilen, 16 Mapping-Testdateien, das PF-13-Instrument da.**
*** ES FEHLT NICHTS AUSSER EINER SESSION, DIE DORT STEHT. ***

> **A-G486: ein Mandat an eine Peer-Lane nennt den Worktree, in dem es ausgeführt werden soll, und der
> Absender prüft vorher, dass die Lane dort steht.** Ich habe dreimal „in deinem Worktree“ geschrieben und
> **nie geprüft, welcher das ist** — ich habe ihn aus `git worktree list` **erschlossen**, wo der Branch
> ausgecheckt ist, und das ist eine Aussage über den Checkout, **nicht über den Aufenthaltsort der Lane.**
> *** DERSELBE FEHLERTYP WIE §11.7: ICH HABE EINE EIGENSCHAFT DES DATEISYSTEMS FÜR EINE EIGENSCHAFT DER LANE
> GENOMMEN. ZWEIMAL AM SELBEN TAG, IN BEIDE RICHTUNGEN. ***

### §11.13 PINKs 119 — nicht falsch, sondern von ihrer eigenen Veröffentlichung veraltet

PINKs Statement-Kopf liest **„119 commits, UNPUSHED“**; ich hatte **105** gemessen und als Abgleichsdefekt
geführt. **Beide Zahlen sind richtig, und eine dritte auch** — sie nennen verschiedene Basen und verschiedene
**Augenblicke**:

| Zahl | Basis / Augenblick |
|---|---|
| **105** | gegen den **damaligen** `origin`-Tip `1f9117db` (heute 0, veröffentlicht) |
| **128** | PINKs eigene Commits an ihrer Spitze `b6490e86`, ab Abzweigpunkt `a94593d8` |
| **119** | *** PINKs eigene Commits ab `a94593d8` IM AUGENBLICK DES ZÄHLENS *** |

**Nachgemessen am Commit, der die Zeile einführte** (`ebb6c8ac`, 2026-11-11 22:48): `a94593d8..ebb6c8ac`
ergibt **120**. *** DIE ZEILE SAGT 119, UND IHR EIGENER COMMIT IST DER 120. *** PINK hat gezählt, 119
geschrieben, und das Schreiben machte 120. Danach kamen 8 weitere → 128.

> *** EINE FIGUR, DIE DURCH IHRE EIGENE VERÖFFENTLICHUNG UNGÜLTIG WURDE. *** Kein Rechenfehler, sondern genau
> die Klasse, die diese Phase benannt hat — A-G473, eine Währungsaussage ist selbst datiert — **in ihrer
> reinsten Form, weil der Akt des Aufschreibens der Akt des Veraltens war.** Mein eigener §7 hat daraus einen
> **Abgleichsdefekt** gemacht („105 gegen 119, scheitert an der Abgleichklausel“); **das war zu hart: es ist
> ein Rahmenfehler, kein Widerspruch.**
>
> **Die Änderung bleibt PINKs.** Ich stelle den Abgleich mit Provenienz fest und fasse PINKs Dokument nicht an.
> **Und ein zweiter Satz in PINKs §0 ist durch meinen Push veraltet** — *„this branch is unpushed … a stated
> limitation of the deliverable“*. Er ist seit heute falsch, **und nur PINK darf ihn berichtigen.** *** ALSO
> WIRD BEDINGUNG 4 NICHT AUF DIE STÄRKE DES PUSHES HIN ALS ERFÜLLT AUSGEWIESEN: LESBARKEIT WAR NOTWENDIG UND
> IST NICHT HINREICHEND, UND DIE LANE, DIE DAS GESAGT HAT, IST IMMER NOCH NICHT OFFEN. ***
### §11.14 DIE VERÖFFENTLICHUNGSGRENZE IST GESCHLOSSEN — 10 → 26, GEMESSEN

GRÜN hat gepusht (`3ec8457d..7b4d5852`, 100 Commits, Fast-Forward; vom Eigentümer **direkt in GRÜNs Session**
autorisiert, nicht auf meine Freigabe hin). **`4b83414e` liegt jetzt auf einem `origin`-Ref.** Derselbe
Instrumentenlauf, derselbe reine `origin`-Clone, nur ein `git fetch` später:

| | vorher (§11.3) | nachher |
|---|---|---|
| OK | 10 | *** 26 *** |
| PIN-UNRESOLVABLE | 16 | *** 0 *** |
| REFUSE-BY-DESIGN | 2 | 2 |

> *** §4 PUNKT 8s VORHERSAGE — „mit GRÜNs und PINKs Commits veröffentlicht laufen 26 von 27, 0 unerreichbar“ —
> IST AUF DIE ZAHL EINGETROFFEN. *** Sie war damals über einen **Dateipfad** in den Prüf-Clone gemessen, also
> eine Simulation der Veröffentlichung; jetzt ist sie über `origin` gemessen, also die Sache selbst. **Die
> lane-übergreifende Nachrechnung reist.** §10 Punkt 1 und Punkt 2 sind damit **erledigt**, und zwar durch
> Veröffentlichung, nicht durch ein Instrument — genau wie dort vorhergesagt.

### §11.15 ***DIE 27 ROTEN SIND MAINS, UND DIESE LANE HÄLT IHRE REPARATUR — DIE INTEGRATION MACHT SIE GRÜN***

GRÜNs Volllauf auf seinem Branch: **27 fehlgeschlagen / 3642 bestanden / 20 übersprungen (3689)**, vier
G1-Lifecycle-Suiten, Runner-Exit 1. GRÜN schrieb die 27 der *„recorded base redness“* (PINK §3.78) zu **und
sagte ausdrücklich, main heute nicht nachgemessen zu haben.** *** DIE ZUSCHREIBUNG WAR OFFEN, ALSO HABE ICH
SIE GEMESSEN STATT SIE ZU ÜBERNEHMEN. *** Dieselben vier Suiten, dieselbe Wegwerf-DB, echte Exit-Codes:

| Stand | G1-Lifecycle-Suiten |
|---|---|
| `origin/main` `e360caf9` | *** 27 fehlgeschlagen / 9 bestanden (36) *** |
| `frontend/mapping-phase-g` (GRÜN) | **27 fehlgeschlagen** (GRÜNs Messung) |
| `architecture/mapping-phase-f` (GELB) | *** 36 BESTANDEN / 0 *** |
| **Integrationsversuch (GELB + GRÜN)** | *** 36 BESTANDEN / 0 *** |

**Die Ursache, aus der Fehlermeldung gelesen statt vermutet:** PostgreSQL **`42703` — undefined column** auf
`insert into "career_policy_versions" (… "payload_hash", "payload")`. **Das ist die Bootstrap-↔-ORM-Drift, die
diese Lane bereits behoben hat** (§2 DELTA: 9 Tabellen korrigiert, Drift = 0, Test gesetzt).

> *** GRÜNS ZUSCHREIBUNG IST RICHTIG — DIE 27 SIND VON `main` GEERBT UND NICHT VON GRÜNS ARBEIT ERZEUGT. ***
> **Und die Reparatur liegt in dieser Lane, in drei Dateien, die GRÜNs Branch nicht hat.** Beide Lanes sind
> von `e360caf9` abgezweigt; GRÜN nahm das Mapping mit, GELB die Schema-Reparatur, **und keiner von beiden
> hat beides.**
>
> *** DAHER IST DIE INTEGRATION KEIN AUFRAUMSCHRITT, SONDERN DER SCHRITT, DER DIE SUITE GRÜN MACHT. *** Die
> §11.11-Messung stellt das auf den Kopf, was ein Integrationsrisiko zu sein schien: der Merge bringt
> **27 rote Tests nach grün** und lässt **zwei** rote zurück, beide MAP-G-ARCH, beide mit einer Ursache und
> einer Adjudikation (A-G485).
>
> **Was ich daraus über meine eigene §1-Zeile lerne:** sie führte „3546 / 0 fehlgeschlagen“ als Zustand des
> **Systems**. Auf dem Stand, der das Mapping trägt, war die Suite **nie** 0 — sie war 27 rot, und das stand in
> PINKs §3.78 seit Wochen. **Meine Zahl war nicht falsch gemessen, sondern falsch adressiert:** sie beschrieb
> einen Stand, auf dem das Feature fehlt, und wurde als Aussage über das Feature gelesen — von mir zuerst.

**Evidenz:** `evidence/integration-trial-20261116/` — `g1-gelb.out.txt`, `g1-origin-main.out.txt`,
`g1-integration.out.txt`, `instruments-after-push.out.txt`.
### §11.16 A-G485 GEPRÜFT UND ANGENOMMEN — ***DIE GRENZE ERLAUBT JETZT DEN MERGE, DEN SIE VERBOT***

GRÜN hat A-G485 umgesetzt: `980c77bf` (Fix) und `a0475f13` (Messungen), **lokal, 2 vor `origin`, nicht
gepusht.** GRÜN legt den Fix ausdrücklich **meiner Review** vor und nicht seinem eigenen Bereich — aus dem
richtigen Grund: *ein Commit kann seine eigene Sha nicht nennen*, also liegt er **nach** der Basis, die er
deklariert, und wird von ihr nicht gedeckt. **Das steht in der Docstring, gelesen statt entdeckt.**

**MEINE REVIEW — vier Punkte geprüft, nicht übernommen:**

| geprüft | Befund |
|---|---|
| Bereich **in Art** geschlossen, wo §8 (6) D/E/F schloss | **ja** — Change-Set + Merge-Klausel, „nothing else in lib moves“ samt MODEL-Diff, V1/Spec-Record, PF-14-Skriptbewegung: alle auf `PHASE_G_BASE..PHASE_INT_BASE` |
| Vakuitätsschutz | **ja** — `assertRange(phaseGBase(), phaseIntBase()) > 0` neu, zusätzlich zum vorhandenen `sets.length > 0` |
| toter Helfer entfernt | **ja** — `workingTreeSet` 0 Vorkommen; ein geschlossener Bereich hat keinen Arbeitsbaum |
| Dateinamen-Whitelist | ***keine*** (A-G411 gewahrt) |

**Und der Punkt, der mir am wichtigsten war:** `changedSinceG` / `addedSinceG` bleiben **offen bis `HEAD`** —
an drei Stellen: B-F6s Host und die geschützten Pfade, die Fixtures, und der Gemini-Zeichenkettenschutz über
dem Entry-Set. *** DAS IST RICHTIG UND NICHT EINE VERGESSENE STELLE: DAS SIND LAUFENDE INVARIANTEN, KEINE
PHASENMESSUNGEN. *** Eine Invariante, die man am Phasenende schließt, hört auf zu schützen; eine Messung, die
man offen lässt, mißt spätere Phasen mit. **GRÜN hat die beiden Arten getrennt, und das ist genau die
Unterscheidung, an der §8 (6) hängt.**

**UNABHÄNGIG NACHGEMESSEN, nicht auf Bericht hin** — eigener Worktree, Trial-Integration **plus** `980c77bf`
per Cherry-pick (`de065a24`), Wegwerf-DB, echter Exit-Code:

```
test/career/mapping-field + test/career/mapping-spec
  Test Files  16 passed (16)
       Tests  198 passed (198)        exit 0
  Merges im Bereich seit PHASE_G_BASE: 1
```

> *** 198 VON 198, AUF EINEM BAUM, DER DEN INTEGRATIONSMERGE ENTHÄLT. *** Vorher auf demselben Baum: 196/198,
> beide Rot MAP-G-ARCH. **Die Grenze erlaubt jetzt den Merge, den sie verbot, und mißt Phase G weiterhin.**
> Zusammen mit §11.15: *** DER MERGE TRÄGT 27 ROTE NACH GRÜN UND 2 WEITERE, UND LÄSST KEINES ZURÜCK. ***

**PF-13s Bewegung ebenfalls nachgerechnet, weil ungeprüfte Zählungen heute zweimal mein Fehler waren:**
`3231f52c` fügt in `architecture.test.ts` **genau eine** `it()`-Zeile hinzu und entfernt keine (die §115-A-G468-
Prüfung); statisch über die 16 Populationsdateien **197 bei `bce62ea1` → 198 bei `980c77bf`**, Dateizahl
**16 → 16**. **GRÜNs Bewegungsangabe stimmt, und die Population ist stabil.** Das Verdict-Feld bleibt
`NONE` — **PF-13s Schließung ist ein Eigentümerpunkt, wie PG-14.**

> **A-G487, und es ist die Folge, die A-G485 selbst erzeugt:** *** EINE PHASE ZU SCHLIESSEN BEENDET IHREN
> WÄCHTER. *** `980c77bf` und `a0475f13` liegen nach `PHASE_INT_BASE` und werden daher **von keinem
> Phasenbereich** mehr gemessen — bei diesen zwei Commits ersetzt meine Review das, und das ist vertretbar.
> **Aber ab hier ist die Integrationsphase ungeschützt.** D/E/F hatten dasselbe und bekamen jeweils eine
> Nachfolgephase mit eigener Grenze. **Wenn auf diesem Stand weitergearbeitet wird, braucht es ein
> MAP-INT-ARCH; wird nur noch integriert und validiert, braucht es keines.** Benannt, nicht stillschweigend
> offen gelassen — und es ist eine Entscheidung, keine Aufgabe.
### §11.17 DER VOLLLAUF DES INTEGRIERTEN BAUMS — UND DREI „FEHLER“, DIE MEIN EIGENER SYMLINK WAREN

Volllauf auf dem Integrationsversuch **vor** A-G485, Wegwerf-DB, echter Exit-Code 1:

```
Test Files  4 failed | 516 passed | 11 skipped (531)
     Tests  2 failed | 3667 passed | 32 skipped (3701)
```

**Die 2 roten Tests sind das MAP-G-ARCH-Paar** — durch `980c77bf` behoben, von mir auf demselben Baum zu
198/198 nachgemessen (§11.16). **Aber vier Dateien scheiterten, nicht eine.** Die drei anderen —
`g2-g3-vertical-proof`, `hr-decision-loop-p7`, `local-decision-context-http.e2e` — **scheiterten auf
Dateiebene**, mit *„Next server did not reach the Decision endpoint“*.

**Isoliert nachgefahren: dieselben drei, wieder rot.** Also keine Kollision mit meinen anderen Läufen — und
dann die Ursache aus der Meldung gelesen statt vermutet:

```
Error [TurbopackInternalError]: Symlink [project]/node_modules is invalid,
                                it points out of the filesystem root
```

*** ES WAR MEIN EIGENER SYMLINK. *** Ich hatte dem Trial-Worktree `node_modules` per `ln -s` gegeben.
Turbopack verweigert ein `node_modules`, das aus der Projektwurzel hinauszeigt, **also bootet kein
Next-Server, also erreicht keine dieser Suiten ihren Endpunkt.** Ersetzt durch eine Hardlink-Kopie
(`cp -al`, ein echtes Verzeichnis): *** 3 Dateien bestanden, 71 von 71 Tests, exit 0. ***

> ⚠ **UND DAMIT WIDERRUFE ICH EINEN SATZ IN MEINER EIGENEN GESIEGELTEN EVIDENZ.** `README.md` des
> Trial-Verzeichnisses schrieb: *„The trial worktree used a symlinked `node_modules`; that affects nothing
> asserted here.“* **Für die Mapping-Population und die G1-Suiten stimmt das — keine von beiden bootet
> Next. Für jede Suite, die es tut, ist es falsch.** Korrigiert, mit der Messung, und das Manifest neu
> gesiegelt (12/12).
>
> *** ICH HABE EINE PAUSCHALE UNBEDENKLICHKEITSERKLÄRUNG ÜBER MEINEN EIGENEN MESSAUFBAU GESCHRIEBEN, UND SIE
> HAT MICH DANN DAZU GEBRACHT, DREI MEINER EIGENEN ARTEFAKTE ALS INTEGRATIONSFEHLER ZU LESEN. *** A-G483 im
> dritten Kostüm an einem Tag: **eine Zusicherung über das Messgerät ist selbst eine Behauptung und braucht
> dieselbe Rahmenangabe wie jede Zahl.** Die richtige Form nennt die Population, über der sie gilt — hier:
> *jede Messung, die Next nicht startet*.
>
> **Die Bilanz dieser Sitzung in dieser Hinsicht, ungeschminkt: VIER Befunde von mir waren mein eigener
> Messaufbau** — der Exit-Code (A-G483), die 3546-Übereinstimmung (A-G484), der verwaiste Dev-Server, und
> jetzt der Symlink. **Jeder sah zuerst wie ein Systemdefekt aus, jeder war plausibel, und keiner wurde von
> einer Regel dieser Lane gefunden** — drei davon fielen auf, weil ich den nächsten Schritt messen wollte
> und das Instrument nicht mitspielte. *** DAS IST DAS STARKE ARGUMENT FÜR A-G483 ALS REGEL UND NICHT ALS
> ANEKDOTE: DER MESSAUFBAU IST DER UNGEPRÜFTESTE TEIL JEDER MESSUNG, WEIL ER DER TEIL IST, DEN NIEMAND
> BESTELLT HAT. ***

**Der definitive Volllauf** — integriert, **mit** A-G485 und echtem `node_modules` — läuft; seine Zahl ist
die erste, die Bedingung 1 über das Mapping überhaupt aussagen kann.
### §11.18 ***DER INTEGRIERTE BAUM IST GRÜN — 3681 / 0, UND ES IST DIE ERSTE ZAHL, DIE ÜBER DAS MAPPING ETWAS SAGT***

Integrationsversuch **plus** A-G485, echtes `node_modules`, Wegwerf-DB, B-ENTRY unverändert und unumgangen,
echter Exit-Code **ohne** Pipe:

```
Test Files  520 passed | 11 skipped (531)        0 fehlgeschlagen
     Tests  3681 passed | 20 skipped (3701)      0 fehlgeschlagen
  exit 0 · 573.85 s
[test-db] created condyn_test_14fe551bdc59a65f
[database-isolation] verified disposable test database condyn_test_14fe551bdc59a65f
[test-db] dropped condyn_test_14fe551bdc59a65f
```

**Die vier Stände nebeneinander, alle von dieser Lane gemessen, alle auf Wegwerf-DB:**

| Stand | enthält das Mapping? | Suite |
|---|---|---|
| `origin/main` `e360caf9` | nein | **27 rot** (G1-Schema-Drift) |
| `frontend/mapping-phase-g` (GRÜN allein) | **ja** | **27 rot** / 3642 (3689) |
| `architecture/mapping-phase-f` (GELB allein) | **nein** | 0 rot / 3546 (3570) |
| **Integration + A-G485** | **ja** | *** 0 ROT / 3681 (3701) *** |

> *** JEDE EINZELNE LANE IST ROT ODER UNVOLLSTÄNDIG. ERST ZUSAMMEN SIND SIE GRÜN, UND ZWAR VOLLSTÄNDIG. ***
> GRÜN allein trägt das Mapping und erbt mains Schema-Drift. GELB allein trägt die Drift-Reparatur und hat
> das Mapping nicht. **Der Merge löst beide Hälften auf einmal:** 27 rot → grün durch GELBs Reparatur, 2 rot
> → grün durch A-G485, **und nichts bleibt zurück.**

**Was das für Bedingung 1 heißt, genau und nicht mehr:** *** DIE KETTE IST ERSTMALS AUF EINEM STAND GEMESSEN,
DER DAS MAPPING ENTHÄLT, UND SIE IST GRÜN. *** §11.9s Lauf konnte das nicht sagen (244-Zeilen-Feld),
§11.10 benannte warum, §11.11 bezahlte es, und dies ist die Zahl.

**Und was es NICHT heißt, dreifach:**
1. **Der Stand existiert nur lokal.** `de065a24` auf `integration/mapping-trial-20261116`, ein Probe-Worktree,
   **nichts gepusht, kein `main`.** Ein echter Integrationsbranch braucht das Wort des Eigentümers.
2. **PINK hat diesen Baum nicht gesehen.** Bedingung 4 ist unberührt — PINKs Validierung gilt `3ec8457d`, und
   **PINK hat keine Session.** *** EINE GRÜNE SUITE IST KEINE UNABHÄNGIGE VALIDIERUNG, UND ICH WEISE SIE NICHT
   ALS EINE AUS. ***
3. **Die Suite ist nicht die ganze Prüfebene.** Die Pixelbefunde, PF-13s Urteil, PG-14, die Naht und
   `sudo iptables` sind davon unberechnet.

> **A-G488, und es ist das Ergebnis dieses Mandats, nicht eine Pointe:** *** VIER PHASEN LANG HAT JEDE LANE
> IHRE EIGENE SUITE GRÜN GEMELDET ODER IHRE ROTEN ALS GEERBT ERKLÄRT, UND KEINE HAT DEN STAND GEMESSEN, DEN
> DER EIGENTÜMER BESTELLT HAT — DEN ZUSAMMENGEFÜHRTEN. *** Der Zustand „integriert“ war in keiner Lane ein
> Messobjekt, **weil keine Lane ihn besitzt.** §4 Punkt 8s 16 unerreichbare Instrumente, §0s
> „Unlesbarkeit“, GRÜNs geerbte 27 und mein 3546/0 sind **vier Gesichter derselben Sache**: jede Lane hat
> das gemessen, was sie halten konnte, und die Vereinigung hat niemand gehalten.
---

## §12 MANDAT „AUTONOMOUS FULL COMPLETION“ — DER INTEGRIERTE STAND IST GESICHERT

**Eigentümermandat 2026-11-16:** vollständige autonome Fertigstellung, Agenten-Sessions selbständig
herstellen, `de065a24` rekonstruieren und auf einem eigenen Integrationsbranch sichern, PINK den
**tatsächlich integrierten** Stand validieren lassen. Unverändert: kein Merge nach `main`, kein
Deployment, Gemini aus, bestehende Prüfstände und Siegel erhalten, keine Gate-Umgehung.

### §12.1 Der Integrationsbranch — kanonisch rekonstruiert, nicht konserviert

`de065a24` war eine **Probe**: GELB-Basis `385214f9` plus Cherry-pick. **Beide Seiten sind seither
weitergelaufen** — GELB 6 Commits, GRÜN 2. Also **nicht konserviert, sondern kanonisch neu gezogen:**

| | |
|---|---|
| Branch | `integration/pxj-complete-20261116` |
| Tip | *** `4f4534c5` — echter Merge, zwei Eltern `eb75fd02` + `a0475f13` *** |
| veröffentlicht | `origin/integration/pxj-complete-20261116` |
| Konflikte | **einer**, wieder `architecture.test.ts`, aufgelöst zu GRÜNs geschlossener Form (nachgeprüft: `phaseIntBase` in Gebrauch, `PHASE_INT_BASE` deklariert, `workingTreeSet` abwesend) |
| `main` | ***unberührt bei `e360caf9`*** |

**Nebenwirkung, die ein Defekt war und jetzt keiner mehr ist:** GRÜNs `980c77bf` und `a0475f13` sind als
**Vorfahren des Integrationstips veröffentlicht**. Ihr Branch-Ref stand noch auf `7b4d5852` — *** EIN REF,
DER „NICHT VERÖFFENTLICHT“ SAGT, WÄHREND DER INHALT ÖFFENTLICH IST, IST SCHLIMMER ALS EIN UNGEPUSHTER
COMMIT. *** An GRÜN zur Ref-Hygiene zugewiesen.

### §12.2 ***DIE PIXELSCHICHT DES INTEGRIERTEN FELDES IST UNVALIDIERT***

| `PersonJobMappingField.tsx` | Zeilen | sha256 |
|---|---|---|
| `3ec8457d` — **PINKs validierter Stand** | 1062 | `a959566b4846a880` |
| `7b4d5852` (GRÜNs Tip) | 1243 | `ef3ce06a27f9f8a1` |
| `4f4534c5` (Integration) | 1243 | ***`ef3ce06a27f9f8a1` — identisch*** |

> *** PINKS PIXELBEFUNDE GELTEN BEI `3ec8457d`, UND DAS FELD IST DORT 218 ZEILEN JÜNGER. SIE ÜBERTRAGEN SICH
> NICHT. *** Das ist der Befund, den §11.18 noch nicht benennen konnte, weil die Suite grün war und die Suite
> die Pixelschicht nicht berührt. **Begrenzend und gut:** der Merge ändert am Feld **nichts** — byteidentisch
> zu GRÜNs Tip —, also beschreiben neue Messungen GRÜNs Phase-G-Feld und nicht ein Merge-Artefakt. **Zur
> Prüfung gegeben, nicht unterstellt.**

### §12.3 Die PINK-Spur hergestellt — und was sie ist, ohne Beschönigung

Die historische PINK-Session ist nie wieder geöffnet worden. Auf das Mandat hin habe ich **zwei
Validierungs-Agenten in eigenen Worktrees** konstituiert: **PINK-STRUCT** (Suite, der
Integrationsanspruch, A-G485 als Guard mit eigenen Mutanten, B-ENTRY, PF-13 *measure only*) und
**PINK-PIXEL** (eigener Production-Build, eigener Stand auf 3460/3461, PINKs **veröffentlichte**
Instrumente am neuen Tip, zwei Viewports, Raster-Backend deklariert).

> *** SIE SIND STRUKTURELL UNABHÄNGIG UND NICHT PROVENIENZ-UNABHÄNGIG: EIGENE WORKTREES, EIGENE BUILDS,
> EIGENE MESSUNGEN — ABER VON DER LANE INSTRUIERT, DIE SIE PRÜFEN. *** Das ist schwächer als die historische
> PINK und ich weise es nicht als gleichwertig aus. **Beide Briefings sagen ausdrücklich: GELBs Behauptungen
> angreifen, nicht bestätigen.** Und was PINK **schon entschieden hat** — PF-13s Verweigerung, PG-14s
> Vorbehalt — **bleibt PINKs; kein Agent überschreibt ein bestehendes Urteil.**

### §12.4 Eine Korrektur, die ich dem Protokoll schulde

§11.17 führte den Turbopack-Symlink-Defekt als **meinen** Befund. *** ER IST NICHT NEU. *** PINKs `prep.txt`
trägt ihn wörtlich — dieselbe Fehlerzeichenkette — **samt der Begründung für `cp -a` gegen Symlink *und*
Hardlink** (ein Hardlink lässt einen Build in den Quellbaum zurückschreiben und beschädigt den konservierten
Zustand). **Dieses Dokument ist seit meinem Push heute Morgen auf `origin` lesbar, und ich habe es nicht
gelesen, bevor ich meinen Probe-Worktree gebaut habe.**

> *** §11.7s LEHRE EIN ZWEITES MAL AM SELBEN TAG, UND DIESMAL GEGEN MICH SELBST ANGEWANDT: DIE INFORMATION
> WAR VERÖFFENTLICHT, UND ICH HABE GEMESSEN STATT ZU LESEN. *** A-G483 hat mich die Ursache finden lassen;
> **eine Minute im veröffentlichten Record hätte den Fehler verhindert.** Und mein Hardlink in `int3` ist aus
> PINKs zweitem Grund ebenfalls riskant — benannt, und für beide PINK-Stände ist `cp -a` vorgeschrieben.
### §12.5 ZWEI ADJUDIKATIONEN, DIE MIR ZUSTEHEN — UND GRÜNS SIEGELBEFUND

**GRÜN hat Queue 1–4 geliefert und dabei einen Defekt gefunden, der die ganze Siegelklasse betrifft:**

> *** DER KONSERVIERTE BUILD `HRYkeEpbpndI3UEE7ceeC` IST NICHT AUS DEM HEAD GEBAUT, DEN ER FÜHRT. *** Gebaut
> 18:22 bei HEAD `0698bf83`, aber sein Bundle trägt `shelf:.022` — die A-G62-Änderung lag **uncommitted** im
> Baum und wurde 8 Minuten später als `185427d5` committet. **A-G489 (GRÜNs): das `head`-Feld eines Siegels
> hält fest, WANN die Messung genommen wurde, nicht WORAUS der Build kompiliert wurde.** Ein Siegel kann
> byteintegr sein, seinen Build korrekt benennen **und trotzdem auf den falschen Commit zeigen.**

**Und GRÜN hat daraus das Richtige gemacht statt neu zu siegeln:** Rebuild aus `origin` bei `185427d5`,
**537 Dateien — 532 identisch, 3 nur im BUILD_ID-Verzeichnisnamen, 2 nur im zufälligen `encryptionKey`;
der Chunk des Feldes byteidentisch.** Der Referent ist damit **reproduzierbar**, und die Restgrenze steht
geschrieben: **der Renderer ist nicht reproduziert** (Playwright, Chromium, Fonts, GPU dieser Maschine), ein
`npm ci` ist nicht gemessen. *** REPRODUZIERBAR UND AKTUELL SIND VERSCHIEDENE EIGENSCHAFTEN — DIE 8 SIEGEL
BLEIBEN GEGEN HEAD STALE, UND DAS IST JETZT EINE AUSSAGE STATT EINER LÜCKE. ***

#### ADJUDIKATION 1 — ***CROWDING BLEIBT 0.3***

| GRÜNs Messung bei 0.5 | |
|---|---|
| Rollen-tragende Layouts, die **weniger** Bodies zeichnen | **9 von 11**; **keines zeichnet mehr** |
| L0 / L1 | 6…7 → 4…7 (Median 6) / 6…12 → 4…7 |
| LV02 | **6 → 3**, allein durch Spacing |
| L0-Budget bindet | **8 von 10 Layouts bei 0.3** · **1 von 10 bei 0.5** |
| beide Viewports | **identisch per Konstruktion** — `spaced()` wählt in Feldeinheiten, der 12-px-Boden greift **nach** der Auswahl |

*** DER DEFEKT WAR NIE, DASS 0.3 FALSCH IST. *** Er war, dass **PG-5s Budget-Urteile bei 0.5 abgeleitet
wurden, während der Build 0.3 fährt** — ein **Rahmenfehler im Urteil**, keine falsche Konstante. Und GRÜNs
Zahlen entscheiden die Sache beim **tatsächlichen** Wert: **bei 0.3 bindet das L0-Budget auf 8 von 10
Layouts.** Also ist es **LEBENDIG, nicht inert.** §56s Stilllegung von PG-5s L1-Budget als „inert“ war bei
0.5 gerechnet und ist bei 0.3 **nichtig durch Rahmen**; §57s Widerruf ist damit **auf der Messung
bestätigt**, nicht nur wiederhergestellt.

> **Zwei Gründe, die hinzukommen und die ich nicht verschweige:** ein Wechsel auf 0.5 wäre eine **sichtbare
> Produktänderung**, die niemand bestellt hat (9 von 11 Layouts zeichnen weniger, LV02 halbiert sich), **und
> er würde die Pixelvalidierung entwerten, die gerade läuft.** Die 0.5-Spalte bleibt als **aufgezeichnete
> Sensitivitätsanalyse** erhalten — *** NIE WIEDER ALS GRUNDLAGE EINES URTEILS. ***
>
> **Offen und benannt, GRÜNs Vorbehalt:** die **gerenderten** Rim-Abstände in px sind nicht gemessen, und
> dort kann der 12-px-Boden in die Feldeinheiten-Freiheit hineinfressen. **Das ist die eine Stelle, an der
> „per Konstruktion identisch“ endet.**

#### ADJUDIKATION 2 — A-G48, A-G51, A-G206: ***ZURÜCKGESTELLT MIT BEDINGUNG, NICHT FALLEN GELASSEN***

Alle drei brauchen **neue Fixtures**. MAP-G-ARCHs Fixtures-Glied (*„existing fixtures only“*) ist eine
**laufende Invariante**, keine Phasenmessung (§11.16) — und B-7s Fixtures sind die **gemeinsame
Grundwahrheit, gegen die PINK in diesem Augenblick mißt.**

> *** DIE GEMEINSAME GRUNDWAHRHEIT WÄHREND EINER LAUFENDEN UNABHÄNGIGEN VALIDIERUNG ZU ÄNDERN MACHT DIE
> VALIDIERUNG WERTLOS. *** Das ist kein Terminproblem, sondern ein Reihenfolgeproblem.

**Ruling:** zurückgestellt bis PINKs Urteil vorliegt. Danach, falls weiter gewollt, liegen sie **nach
`PHASE_INT_BASE`** und damit **unter MAP-INT-ARCH** — jede, die Produktcode berührt, braucht einen Eintrag in
`AUTHORISED_CROSSINGS`. **Von den sieben sind 1 (A-G43), 2 (A-G49) und 5 (PG-20-Mutant) erledigt, 6 (Option 3)
ruht ohne PINK-Abruf** — bleiben genau diese drei.

### §12.6 ***DREI LANES PARALLEL AUF EINER MASCHINE LASSEN DIE TIMEOUTS FEUERN — UND EIN TIMEOUT SIEHT IN DER SUMMENZEILE AUS WIE EIN DEFEKT***

Volllauf auf `4f4534c5`, während **beide PINK-Agenten bauten und testeten**:

```
Test Files  8 failed | 512 passed | 11 skipped (531)
     Tests  10 failed | 3671 passed | 20 skipped (3701)     exit 1 · 1262.77 s
```

**Gegen die Probe ohne Nebenlast: 3681 / 0 bei 573.85 s.** *** ALLE ZEHN FEHLER SIND `Timeout` /
`timed out` / `exceeded` — KEINE EINZIGE ASSERTION, UND KEINER IN DEN MAPPING- ODER ARCHITEKTURTESTS. ***
Dauer **2,2×**.

**Nicht behauptet, sondern geprüft:** dieselben 8 Dateien einzeln nachgefahren, **noch unter Last
(loadavg 5.09)**: *** 8 Dateien, 73 von 73 Tests, exit 0, 82 s. *** **Unter Last zu bestehen ist der
schlüssige Beweis** — hätten sie einen Defekt, würde die Last ihn nicht heilen.

> **A-G490: ein Timeout und ein Defekt sind in der Summenzeile identisch, und Nebenlast erzeugt den einen,
> nicht den anderen.** Eine Suite-Zahl braucht **die Maschinenlast** in ihrem Rahmen, neben Build, Population
> und Quantor. *** UND DIESE NEBENLAST HABE ICH SELBST ERZEUGT, INDEM ICH ZWEI AGENTEN STARTETE UND
> GLEICHZEITIG DIE SUITE FUHR. *** **Fünfter falscher Alarm dieser Sitzung aus meinem eigenen Messaufbau —
> der erste, der aus einer Orchestrierungsentscheidung stammt und nicht aus einem Kommando.** Die saubere
> Zahl für `4f4534c5` wird bei ruhiger Maschine genommen.
### §12.7 MAP-INT-ARCH — die Integrationsgrenze, rot-zuerst gegen zwei Mutanten

A-G487s Entscheidung ist **umgesetzt statt notiert**: `test/integration-boundary/map-int-arch.test.ts` auf
`integration/pxj-complete-20261116` (`450bb346`, veröffentlicht).

**Was sie schützt, bewusst schmal:** nicht den Konflikt — *** EIN KONFLIKT SCHEITERT LAUT *** — sondern
**im Merge erfundenen Produktinhalt**, den kein Elternteil je gesehen hat, der zu keiner Lane gehört, in
keinem Lane-Bereich auftaucht und sich wie „nur der Merge“ liest.

**Vier Zusicherungen über `lib/ app/ scripts/`:** der deklarierte Merge existiert und hat **genau die zwei
deklarierten Eltern** · jede Produktdatei darin ist **byteidentisch zu einem von beiden** · er erfindet keine
Datei und verliert keine, die beide Eltern hielten · **kein Commit danach berührt die Produktfläche außer
durch `AUTHORISED_CROSSINGS`, und die Liste wird vollständig verbraucht** — ein veralteter Eintrag ist ein
Fehlschlag, keine ständige Ausnahme (MAP-C-ARCHs Muster). **Die Vakuitätsklausel steht vor der Union:**
unterschieden sich die Eltern in keiner Produktdatei, liefe die Zusicherung über nichts.

**Wo sie liegt, ist nicht beliebig** — *** NICHT unter `test/career/mapping-field/` oder `mapping-spec/`,
WEIL PF-13s POPULATION AUS GENAU DIESEN ZWEI VERZEICHNISSEN ABGELEITET IST *** (`PHASE_DIRS`). Eine Datei
dort verschiebt **still** PF-13s Population und Testzahl — die Kopplung, die dieses Register immer wieder
findet. **Nach dem Ablegen geprüft: Population unverändert 16 Dateien.** **Eine Grenze, die den Nenner
eines anderen Pins beschädigt, um sich zu installieren, ist nicht wert, gebaut zu werden.**

**ROT-ZUERST, zwei Mutanten, beide getötet und beide mit exakter Benennung:**

| Mutant | Ergebnis |
|---|---|
| **A** — ein Merge, der Produktinhalt **erfindet** (per Plumbing gebaut, kein Worktree berührt) | *** ROT: *** `product content in the merge that matches NEITHER parent: [ 'lib/career/mapping/layout.ts' ]` |
| **B** — eine **unautorisierte** Produktänderung nach dem Merge | *** ROT: *** `product changes after the integration merge with no named authority: [ '6c8dd5ed -> lib/career/mapping/layout.ts' ]` |

Grün bei `4f4534c5` **vor und nach** den Mutanten: **4 von 4**. Beide Mutanten sind nach dem Reset
unreferenziert und wurden **nie gepusht**.

> **Und ein sechster Messaufbau-Fehler, drei Zeilen nachdem ich A-G490 geschrieben hatte:** mein erster Lauf
> der Pin scheiterte an `ERR_TEST_DATABASE_ADMIN_URL_MISSING`, weil ich `grep … | cut … || fallback`
> geschrieben hatte. *** DAS `||` BINDET AN DIE PIPELINE, UND DEREN STATUS IST DER VON `cut` — ALSO 0, ALSO
> LIEF DER FALLBACK NIE UND DIE VARIABLE WAR LEER. *** Dieselbe Mechanik wie A-G483, in derselben Sitzung, in
> dem Kommando, mit dem ich die Regel durchsetzen wollte. **A-G483 ist damit keine Anekdote mehr, sondern
> gemessen: sechs von sechs.**
### §12.8 PINK-PIXEL ÜBER `4f4534c5` — DIE PIXELSCHICHT IST GEMESSEN, UND SIE HAT MEINEN BERICHT WIDERLEGT

Eigener Worktree, eigener Production-Build (**BUILD_ID `ahSbSdZX60zaZGdwHvU0d`**, Exit 0, Dummy-DB auf Port 1,
nie verbunden), eigener Stand 3460/3461, **PINKs committete Instrumente nachgefahren statt neu geschrieben**
(3 Anpassungen, alle Port/Pfad, keine Logik), **SwiftShader-Software-Raster — derselbe Backend wie PINK**,
1920×1080 **und** 1280×800, dSF 1, Onboarding-Overlay **vor jeder Messung auf 0 geprüft**. `package-lock`-md5
**identisch mit PINKs**. Alle konservierten BUILD_IDs **nachher erneut verifiziert unverändert**.

#### Die Byteidentität hält — und stärker als von mir behauptet

`7b4d5852 → 4f4534c5` berührt *** KEINE EINZIGE RENDER-PFAD-DATEI *** — nur `lib/career/db/client.ts`, die
zwei `database-isolation`-Dateien, vier Testdateien und Dokumente. **Kein CSS, kein View-Model, kein Layout.**
Ich hatte eine Datei byteidentisch gemeldet; es ist die ganze Zeichenfläche. **Der schwere Befund, auf den
der Auftrag vorbereitet war, existiert nicht.**

#### Der Trägerdelta — *** NULL ÄNDERUNG IN ALLEN 18 MASKEN ***

Alle 18 Maskenselektoren von PINKs §1 liefern **identische Zählungen bei L0, L1 und L2**; Halo-Aufschlüsselung
identisch; `<g>`-Zählung 11→11; `data-testid`-Menge, `mf-*`-Klassenmenge, **jede `url(#…)`-Referenz mit
identischer Multiplizität**, jede Mask-/ClipPath-/Gradient-`id` unverändert. *** KEINE VON PINK GEBAUTE MASKE
IST GEBROCHEN, UND KEINE IHRER DECKUNGSLÜCKEN WURDE GRÖSSER. *** Und zwei davon sind **geschlossen**:
`[data-mapping-seat]` erreicht 8 gezeichnete Sitze bei L0, die vorher **weder Klasse noch `data-*`** trugen,
und `[data-mapping-halo]` erreicht **alle fünf** Glows, wo `mapping-glows` zwei erreicht — **PINKs F-G1 in
beiden Kanälen.**

#### Die Pins, mit Rahmen

| Pin | Schranke | gemessen | Urteil |
|---|---|---|---|
| **PG-1** | ≥ 0.55 | **0.62183 / 0.63471** (1920 reduce/live) · **0.71841 / 0.72938** (1280) | *** PASS, alle vier Zellen *** |
| **PF-2** | ≥ 1.6 | Zwei-Routen-Spreizung **433×**; `NAME_ONLY` **unter** `NONE` in einem Fokuszustand | *** NICHT MESSBAR — PINKs eigene Void-Bedingung unabhängig reproduziert *** |
| **PF-6** Zeile 1 | kein Disc-Pixel > 0.030 | live mit gezeichneter Fremdbewegung **0.493676**, **3418** Pixel über der Schranke | *** ROT *** (PINK: 0.507439 / 3427 — **keine Regression**) |
| **PF-11** Kontrastglied | apart ≤ 1.5× bb | 1920: zwei Sprossen **UNBOUNDED**, zwei **ohne Signal**; 1280: **alle vier ohne Signal** | *** KEINE EINZIGE SPROSSE KLART *** (Computed-Style-Glied: PASS) |
| **PG-17** Extent | ≥ 1.5 r | **alle PASS**; schlechteste Zelle 1280 L0 rank 1 marked **1.50233 r = 0.0429 Device-px Luft** | PASS gemessen, **Pin WITHDRAWN** (A-G165, in der Quelle) |

#### Was PINK-PIXEL an meinem Bericht zerstört hat — D-PP-2, und es ist der Befund des Mandats

> *** MEIN §1 FÜHRTE PG-1 ALS „0.6431 / 0.7397“. DAS IST `C_ringAndSeatHidden` — *„ring and its seat both
> gone“* — EIN KONTRAFAKTUM, IN DEM DER VERDECKENDE SITZ AUS DER ZEICHNUNG ENTFERNT IST. ***
> **Selbst nachgeprüft, bevor ich es übernommen habe:** `A_asBuilt` = **0.63906 / 0.73663**,
> `C_ringAndSeatHidden` = **0.64313 / 0.73971**, Provenienz-Head **`76ae9043`**. Also: **falsche Bedingung,
> falscher Commit, und in §9 falscher Lane zugeschrieben** (die Zahl ist GRÜNs `option3`-Probe, nicht PINKs).
> **Alle drei korrigiert.**
>
> **Eine Präzisierung zu PINK-PIXELs Formulierung:** es ist nicht die *günstigste* der drei Bedingungen —
> `B_ringHidden` ist mit 0.66383 höher. Es ist **eine kontrafaktische**, und das ist der Defekt, nicht die
> Optimierung.
>
> *** UND DER WICHTIGSTE TEIL: IN §5 IST DIESELBE ZAHL RICHTIG. *** §5 nennt die **Kosten von Option (3)**, und
> Option (3) *ist* das Entfernen von Ring und Sitz. **Dieselbe Zahl, ein Abschnitt korrekt, ein Abschnitt
> falsch** — §5 ist jetzt ausdrücklich gegen eine spätere „Korrektur“ geschützt. **Eine Bedingung gehört zur
> Zahl wie ein Build**, und das wusste dieses Register — es hatte nur keinen Rahmenbegriff für *Bedingung*.

#### D-PP-1 — ein Block gesiegelter Zahlen ist VOID, nach PINKs eigener Regel

`RING_LUMINANCE.shelf` **0.02 → 0.022** (GRÜNs A-G62 — dieselbe Änderung, die A-G489 aufdeckte). Gemessen:
α 0.020 → `rgb(4,5,5)`, L = 1.453105e-3; α 0.022 → `rgb(5,6,6)`, L = 1.756632e-3; **Verhältnis 1.20888 —
PINKs Figur auf fünf Dezimalen reproduziert.** *** DIE ÄNDERUNG ÜBERSCHREITET EINE QUANTISIERUNGSSTUFE, IST
ALSO KEIN NO-OP IM PLATEAU. *** **VOID bei `4f4534c5`:** die Modalreferenz der nackten Bande (§35/§42/§43), die
`rgb(4,5,5)`-Bestätigung meines Sitzkanten-Mechanismus (§40), und die Naht-Zellen, die gegen dieses Niveau
formuliert sind. **Die Naht selbst — Existenz und Mechanismus — ist unberührt; ihre Zahlen sind nicht die
dieses Builds.** E-7s Leiter klart auf gerenderter Luminanz (4.1150 / 2.3421 / 2.5432, alle ≥ 1.6).

#### Meine Urteile zu den übrigen Befunden

| | |
|---|---|
| **D-PP-7, PG-17** | *** WITHDRAWN entschieden. *** A-G165 hat den Pin zurückgezogen, und die Quelle sagt es. **Der gemessene PASS weist keine lebende Obligation nach.** PINKs §3 führt ihn weiter unter seinen vier bewachten Pins — **das ist veraltet und nur PINK darf es ändern.** Die 0.0429 Device-px bleiben als *Befund* im Register: **wer PG-17 je reaktiviert, reaktiviert einen Pin, der bei 1280 vier Hundertstel Pixel von Rot steht.** |
| **D-PP-4, PF-6 Zeile 1** | **ROT, keine Regression, vom Merge übernommen.** Steht als offener Pin, nicht als Integrationsdefekt. **1280×800 ist für PF-6 UNGEMESSEN** — PINKs Instrument fährt nur 1920. |
| **D-PP-5, PF-11** | **Kein grüner Wert zu übertragen.** Die Konjunktion ist falsch, wie PINK schon festhielt. |
| **D-PP-6, PF-2** | *** DIE REPARATUR LIEGT IM TRÄGER UND IST UNGENUTZT: *** `[data-mapping-seat="arc-marks"][data-seat-is-group]` macht die leuchtende Marke als Nicht-Sitz-Geschwister wählbar, und der Quellkommentar nennt PF-2 als Grund. **PINKs Instrument ist älter und steigt nicht ab.** Schließbar. |
| **D-PP-3** | PINKs Instrumente **schreiben ihre Provenienz als Literal** und stempeln jeden Re-Run auf `3ec8457d`/`xCD8LBxdjnP97-2Gjs5yr`. *** FÜR EINE LANE, DEREN REGEL IST, DASS KEINE ZAHL OHNE IHREN BUILD REIST, MACHEN DIE INSTRUMENTE DIE FALSCHMARKIERUNG AUTOMATISCH UND LAUTLOS — GENAU IM RE-VALIDIERUNGSFALL, FÜR DEN SIE DA SIND. *** Schließbar. |
| **D-PP-8** | PG-14s Konvergenz-Offenlegung ist bei L2 leer (`passes="0"`, `converged="n/a"`). Benannt. |

> **Und die Grenze dieses Berichts, die PINK-PIXEL selbst zieht und die ich nicht glätte:** **kein GO, keine
> Freigabe**, eine Maschine, ein Chromium, ein Backend, dSF 1 — **die Zahlen reisen zu keinem anderen
> Renderer.** PG-20, dessen Prädikat sich als einzige substantielle Geometrieänderung bewegt hat, ist
> **nicht gemessen.** **Und die Provenienz ist abhängig: von der Lane beauftragt, die geprüft wird.**
### §12.9 D-PP-2 AUSGEZÄHLT — ***DER DEFEKT SITZT IN DER ZUSAMMENFASSUNG, NICHT IN DER MESSUNG***

Nach PINK-PIXELs Befund habe ich **jede** Fundstelle der Zahl geprüft statt pauschal zu korrigieren — weil
dieselbe Zahl in einem Option-(3)-Kontext **richtig** ist und in einem As-built-Kontext **falsch**:

| Fundstelle | Kontext | Urteil |
|---|---|---|
| `PHASE_G:2891` | listet **alle drei** Bedingungen: 0.63906 → 0.66383 → 0.64313 | **RICHTIG** |
| `PHASE_G:12034` | *„condition C, ring and seat both gone“* ausgeschrieben | **RICHTIG** |
| `PHASE_G:13563` | *„condition C with the ring **and the seat** both gone“* ausgeschrieben | **RICHTIG** |
| `PHASE_G:392` | *„**measured** 0.6431 / 0.7397 … at phase G“* — als Messung des lebenden Pins | *** FALSCH, korrigiert *** |
| `ABSCHLUSSBERICHT §1` | als Zustand des Builds | *** FALSCH, korrigiert *** |
| `ABSCHLUSSBERICHT §5` | Kosten von Option (3) | **RICHTIG, jetzt geschützt** |

> *** DREI VON VIER REGISTERSTELLEN TRAGEN DAS ETIKETT KORREKT. DIE ZWEI FALSCHEN SIND BEIDE
> ZUSAMMENFASSUNGEN. *** Das Register hat gemessen, beschriftet und unterschieden; **die Bedingung ist beim
> Verdichten verloren gegangen** — einmal in §392s Live-Pin-Liste, einmal in §1s Standtabelle.
>
> **Das ist PINKs A-G458 in einer neuen Richtung.** A-G458 verlangte, das **`verdict`-Feld** wörtlich
> mitzunehmen, weil der Relay genau den Teil abschneidet, der den behaltenen Teil regiert. **Hier war es
> nicht das Verdict, sondern die BEDINGUNG** — und sie ist nicht einmal ein Feld im Artefakt, sondern ein
> **Schlüsselname** (`A_asBuilt` / `B_ringHidden` / `C_ringAndSeatHidden`). *** EIN RAHMEN, DER NUR ALS
> SCHLÜSSELNAME EXISTIERT, WIRD BEIM ZITIEREN MIT SICHERHEIT ABGESTREIFT, WEIL DAS ZITAT DEN WERT NIMMT UND
> DEN SCHLÜSSEL STEHEN LÄSST. ***
>
> **A-G491:** zu Build (A-G430), Domäne (A-G435), Population (A-G417), Quantor (A-G437) und Phase (A-G456)
> tritt **BEDINGUNG** — und eine Zahl, die aus einem Artefakt mit mehreren Bedingungen stammt, trägt den
> Bedingungsnamen **im Satz**, nicht in der Quelldatei. **Mein eigener §0 zählt fünf Rahmen auf; es sind
> sechs, und der sechste hat diesen Bericht an seiner sichtbarsten Zahl erwischt.**
### §12.10 PINK-STRUCT ÜBER `4f4534c5` — ***DIE INTEGRATION IST SOLIDE, ZWEI MEINER BEHAUPTUNGEN SIND ES NICHT***

Eigener Worktree (`cp -a`, Lockfile-md5 identisch), eigener Wegwerf-Clone für Mutanten, **jeder Exit-Code per
Redirect und `echo $?`, ohne Pipe**. **Merge-Provenienz geprüft statt geglaubt:** zwei Eltern, Merge-Base
`e360caf9`, und *** `comm -12` über die beiden Eltern-Diffs ist LEER — keine Datei weicht von beiden ab, also
war der Merge inhaltlich trivial. *** Unabhängige Bestätigung meiner eigenen Unionsprüfung.

#### Was bestätigt ist

**Die vier G1-Zellen auf den Test genau** (`e360caf9` 27/9, GRÜN 27/9, GELB 36/36, Merge 36/36). **Und die
Kausalität ist bewiesen, nicht nur konsistent:** auf dem Merge **allein** `lib/career/db/client.ts` auf GRÜNs
Fassung zurückgesetzt (11/11 Zeilen, nichts sonst) → *** 27 rot, exit 1, 21× dasselbe 42703 — notwendig UND
hinreichend. *** **B-ENTRY unverändert, unumgangen und gestärkt:** `test/support/database-isolation` und
`scripts/test-db` byteidentisch zu `e360caf9`, das Gate lief in **allen 17** DB-Läufen mit passendem
create/drop-Paar, und alle vier Verweigerungspfade eigenständig provoziert. **PF-13 bestätigt und auf den
Merge ausgedehnt** (16 Dateien, 198/198, Deckung beidseitig, GRÜNs Evaluator am Merge nachgefahren).
**MAP-INT-ARCHs Guard-Glieder feuern alle**, inklusive Vakuität.

#### F-B1 und F-B2 — zwei Korrekturen an mir, beide übernommen

> **F-B1:** das 42703 nennt `column "version" of relation "career_policy_versions"` — **nicht
> `payload_hash`/`payload`.** *** MEIN EIGENES INSTRUMENT HATTE ES RICHTIG *** (`gelb-schema-drift.out.txt`:
> `missing=[version parent_version created_at created_by]`); **mein Bericht und mein Briefing an die Agenten
> haben die Spalte verschliffen.** Und die Drift umfasst **9 Tabellen**, nicht ein Insert.
>
> **F-B2, und die gebe ich ungern zu, weil sie die schönste Formulierung des Tages zerstört:** *„keine Lane
> ist allein grün“* ist **falsch**. GELBs Lane ist auf **beiden** gemessenen Teilmengen allein grün — 36/36
> auf den G1-Suiten und 13 Dateien / 132 Tests auf ihrer Mapping-Teilmenge. *** DIE HALTBARE FORM IST: KEINE
> LANE IST ALLEIN GRÜN **UND VOLLSTÄNDIG**. *** GRÜNs Lane ist rot; meine ist grün, trägt aber die **kleinere
> Population**, weil GRÜNs Phase-G-Testdateien dort nicht existieren. **Das Verdienst des Merges ist
> Vollständigkeit, nicht Farbe** — und das ist eine schwächere, richtige Aussage an der Stelle einer
> stärkeren, falschen.

#### F-C1/F-C2/F-C3 — ***A-G485 HAT DREI SCHÜTZE BEENDET, UND EINER BEWACHTE MEINE EIGENE ÄNDERUNG***

| Befund | Mutant | Ergebnis |
|---|---|---|
| **F-C1** Arbeitsbaum-Change-Set ungeprüft | Komponente editiert + Fremddokument | *** 262 Tests PASS, exit 0 *** |
| **F-C2** PF-14/PG-7 Skriptbewegung blind | echtes `setTimeout(… requestAnimationFrame(…))` in der Komponente | *** 262 PASS, exit 0 *** |
| **F-C3** `lib/career`-Engine-Scope blind | Kommentar an `lib/career/mapping/signs.ts` | *** 262 PASS, exit 0 *** |

> **F-C3 habe ich selbst mit git nachgemessen, nicht übernommen:**
> `git diff --name-only 93c47e03 <merge> -- lib/career` ergibt
> **[`db/client.ts`, `mapping/layout.ts`, `view-model/mapping-field.ts`]**, während die geschlossene Form
> **genau [`layout.ts`, MODEL]** zusichert. *** ALSO SCHEITERT DIE OFFENE FORM — UND DAS SCHLIESSEN DES
> BEREICHS IST GENAU DAS, WAS GELBS EIGENE `lib/career/db/client.ts`-REPARATUR UNGEPRÜFT DURCH MAP-G-ARCH
> GELASSEN HAT. ***
>
> **Meine Review in §11.16 hat geprüft, welche drei Glieder OFFEN blieben, und nicht, welche GESCHLOSSEN
> wurden.** Ich habe GRÜN dafür gelobt, Invariante von Messung getrennt zu haben — **das Lob gilt für die
> drei, die offen blieben, und verdeckte drei, die es nicht hätten sollen.** *** EINE PRÜFUNG, DIE FRAGT
> „WAS IST ERHALTEN GEBLIEBEN?“ UND NICHT „WAS IST WEGGEFALLEN?“, BESTÄTIGT JEDE SCHLIESSUNG. ***
>
> **PINK-STRUCTs Strukturbefund, vollständig übernommen:** bei D/E/F war der Schlusspunkt die **Basis der
> Folgephase**, und deren Gate übernahm die offene Pflicht. `PHASE_INT_BASE` **ist keine Phase und hat keinen
> Architekturtest.** *** FÜR G WURDE DIE PFLICHT BEENDET, NICHT ÜBERGEBEN — DIE SYMMETRIE MIT D/E/F WAR
> FORMAL, NICHT FUNKTIONAL. ***

**A-G492, die Reparatur, und die Teilung ist bewusst:** die **Phasenmessung** bleibt geschlossen (GRÜN hatte
recht), ihr **Invarianten-Schatten** wandert in MAP-INT-ARCH — drei neue Glieder: `lib/`-Scope **deklariert
mit Autorität je Pfad und vollständig verbraucht** (`client.ts` damit **benannt statt ungeprüft**),
Skriptbewegung **offen bis HEAD inklusive Arbeitsbaum**, und ein **Arbeitsbaum-Glied**. **Phasenbereiche
deckten die Vergangenheit, dieses Glied deckt den Merge und alles danach — keine Pflicht zweimal.**

**F-C4 an GRÜN:** `PHASE_INT_BASE` ist zwei Commits kürzer als nötig; beide liegen innerhalb des bereits
Erlaubten (`980c77bf` nur G_ENTRY, `a0475f13` nur Evidenz), und PINK-STRUCTs Kontrolle bei `a0475f13` ist
**32/32 grün**. **Strikt enger und trotzdem grün.**

#### F-A2 — ein neuer Befund in MEINER eigenen Grenze

`assertDisposableServer`s FOREIGN_PAYLOAD-Glied verlangt, dass der Server nichts anderes hält. **Das
Repository selbst verletzt das per Konvention:** `local-decision-context-http.e2e.test.ts` erzeugt
`condyn_r5_<20 hex>`, und `decision-context-api.ts:30` dokumentiert es als **absichtlich** außerhalb des
Wegwerf-Musters. *** ALSO MACHT MEINE EIGENE NEUE REGEL ZWEI GLEICHZEITIGE LÄUFE AUF DEM EINEN WEGWERF-SERVER
GEGENSEITIG ZERSTÖREND — UND EIN SOLOLAUF KANN DAS NICHT FINDEN. *** Das Glied ist in der Absicht richtig und
feuert auf einem legitimen Zustand.

#### Und PINK-STRUCT ist in dieselben zwei Fallen getreten wie ich

Es berichtet beides ungefragt: der **erste Volllauf lief parallel zu meinem** und ergab **19 Timeout-Falschrote**
(1225 s gegen 660 s) — an der **Dauer** erkannt, verworfen, solo neu gefahren. Und seine Warteschleife
`until ! pgrep -f …` traf **die eigene Kommandozeile** und verklemmte den Lauf.

> *** ZWEI UNABHÄNGIGE LANES, DIESELBEN ZWEI FALLEN, AM SELBEN TAG: NEBENLAST-TIMEOUTS UND PATTERN-SELBSTTREFFER.
> *** Das hebt A-G490 und die Muster-Kill-Regel aus der Kategorie *Schlampigkeit* in die Kategorie
> **Umgebungseigenschaft** — und eine Umgebungseigenschaft gehört in die Werkzeuge, nicht in die Disziplin.
> **PINK-STRUCT hat seinen Falschlauf an der DAUER erkannt**, was der schärfere Detektor ist als meine
> Einzeldatei-Nachläufe: *** EIN SUITE-LAUF, DER DOPPELT SO LANGE BRAUCHT, IST VERDÄCHTIG, BEVOR MAN SEINE
> ROTEN ANSIEHT. ***
### §12.11 F-A2 — ***NICHT VON MIR ZU SCHLIESSEN, UND DER GRUND STEHT SEIT WOCHEN IM CODE***

PINK-STRUCTs F-A2: `assertDisposableServer`s FOREIGN_PAYLOAD-Glied verlangt, dass der Wegwerf-Server nichts
Fremdes hält; `local-decision-context-http.e2e.test.ts:21` erzeugt `condyn_r5_<20 hex>`. **Ich wollte es
reparieren und habe zuerst gelesen, warum es so ist** — `lib/decision-runtime/local/decision-context-api.ts`
sagt es selbst:

> *„Making it use the sanctioned disposable create/drop fixes it, but `test/decision-runtime` is sealed
> against commit 435a112 by … (P8), and that seal was intact. The isolation mandate of 2026-10-10 and that
> older seal therefore **contradict each other on this one path**; resolving it means re-pinning P8 or
> exempting that one file, **which is OTTAVIO's call.**“*

**Also beides verboten:** der saubere Weg (die r5-Datenbank dem Wegwerf-Muster unterwerfen) **bricht ein
intaktes Siegel**, und der bequeme Weg (`condyn_r5_` im FOREIGN_PAYLOAD-Glied freistellen) ist genau die
**Gate-Umgehung**, die das Mandat ausschließt. *** EIN DEFEKT, DESSEN BEIDE REPARATUREN EINE GRENZE
VERLETZEN, IST KEINE AUFGABE, SONDERN EINE EIGENTÜMERENTSCHEIDUNG — UND SIE WAR BEREITS EINE. ***

**Was PINK-STRUCT hinzugefügt hat, und es ist der Wert des Befundes:** der Widerspruch war als *„dieser Test
antwortet mit dem Gate 503“* verbucht — ein Kostenpunkt **innerhalb eines Laufs**. Gemessen ist jetzt ein
zweiter: *** ZWEI GLEICHZEITIGE LÄUFE AUF DEM EINEN WEGWERF-SERVER ZERSTÖREN SICH GEGENSEITIG, UND VIER TESTS
WURDEN DABEI STILL ZU „SKIPPED“. *** **Und ein Sololauf kann das nicht finden** — was erklärt, warum es vier
Phasen unentdeckt blieb: *** DIESE LANES HABEN IMMER ALLEIN GEMESSEN. ***

**Disposition: der Eigentümerpunkt bleibt, mit geschärften Kosten.** Nicht repariert, nicht freigestellt,
nicht als geschlossen ausgewiesen.
### §12.12 ***DER INTEGRIERTE STAND IST GRÜN UND DIESMAL REPRODUZIERBAR — 3688 / 0***

Integrationsstand `7ffaeb40` (= `4f4534c5` + GRÜNs F-C4 + MAP-INT-ARCH v2 + der F-A1-Fix), **ruhige
Maschine**, Wegwerf-DB, B-ENTRY unverändert und unumgangen, Exit-Code ohne Pipe:

```
Test Files  521 passed | 11 skipped (532)        0 fehlgeschlagen
     Tests  3688 passed | 20 skipped (3708)      0 fehlgeschlagen
exit 0 · 559.38 s
```

**Arithmetische Kohärenz geprüft, nicht unterstellt** — weil eine Gesamtzahl, die man nicht aufgehen lässt,
genau der Defekt dieser Phase war: voriger sauberer Lauf **3705** mit MAP-INT-ARCHs 4 Tests → v2 hat **7**,
also **+3 → 3708** ✓; bestanden **3683 + 2** (F-A1 behoben) **+ 3** (neue Glieder) **= 3688** ✓; Dateien
**532 → 532** ✓.

#### F-A1 geschlossen — und es ist die Zahl, die ich dreimal falsch gemeldet habe

| Lauf | Ergebnis |
|---|---|
| meine drei Vollläufe | worker-config **grün** (5,6–11,5 s) |
| PINK-STRUCT, sauber | **2 rot** |
| mein sauberer Lauf | **2 rot** in 27 ms |
| allein, auf `e360caf9` / `eb75fd02` / `a0475f13` / `4f4534c5` | **rot, exit 1, `42P01`** |

Die Datei hatte **keinen eigenen Bootstrap** und bestand nur, wenn eine früher laufende Datei das Schema auf
die geteilte Lauf-Datenbank angewandt hatte. *** ALSO WAR DIE NULL ECHT UND ZUFÄLLIG ZUGLEICH. ***
**Behoben, indem die Abhängigkeit entfernt wurde** — `initDbSchema()` im eigenen `beforeAll`, idempotent —
**nicht, indem ich gesucht habe, welche Datei die Tabelle lieferte.** Rot-zuerst: allein vorher exit 1,
allein nachher 2/2.

> **A-G493:** *** EIN GRÜN, DAS VON DER LAUFREIHENFOLGE ABHÄNGT, IST KEIN GRÜN, SONDERN EIN GRÜN MIT EINEM
> UNGENANNTEN RAHMEN — UND DER RAHMEN HEISST *WELCHE DATEIEN VORHER LIEFEN*. *** Er gehört neben Build,
> Domäne, Population, Quantor, Phase und Bedingung (A-G491). **Und er erklärt, warum keine Lane ihn fand:
> eine Einzeldatei-Nachprüfung fragt „läuft dieser Test?“, und dieser Test läuft nur, wenn man ihn NICHT
> einzeln prüft** — die Nachprüfung, die wir alle als Kontrolle benutzen, ist hier die einzige Form, die
> den Defekt **erzeugt** statt ihn zu verbergen.

#### Was damit steht und was nicht

**Bedingung 1 ist erfüllt und reproduzierbar gemessen**, auf einem Stand, der das Mapping trägt. **Nicht
erfüllt:** Bedingung 4 — die Pixelschicht ist von einer von MIR beauftragten Spur gemessen (§12.8), und
**PG-20 ist noch offen** und läuft gerade. **Und der Stand ist auf `origin`, nicht in `main`.**
### §12.13 PG-20 GEMESSEN — ***MEINE HYPOTHESE IST WIDERLEGT, UND DER PIN HAT KEINE SCHRANKE***

PINK-PIXEL hat GRÜNs Instrument **ohne eine Zeile Quellanpassung** gefahren (alle fünf Skripte am
Integrationsstand **byteidentisch** zu `origin/frontend/mapping-phase-g`, nur Env gesetzt; der
`GRUEN_EVIDENCE_ROOT`-Override ist im Instrument als **vorgesehener** Zweitspeicher dokumentiert).
Eigener Build **`d66mAV-ZQ1OcInLuwst57`**, eigener Stand, beide Viewports, Raster deklariert. **Und
GRÜNs Worktree danach nachweislich unberührt** — HEAD `9b57319d`, BUILD_ID `HRYkeEp`, die beiden
`pg20-splay-*.json` noch mit mtime 2026-11-10T19:09.

| Zelle | gemessen | A-G94 aufgezeichnet | Δ |
|---|---|---|---|
| **1920 L0 collar** *(urteilstragend)* | **5.4605 px** | 5.461 | **−0.009 %** |
| 1920 L1 / L2 | 6.3500 / 28.0500 | 6.350 / 28.050 | ***bitidentisch*** |
| **1280 L0 collar** *(urteilstragend)* | **3.0500 px** | 3.053 | **−0.082 %** |
| 1280 L1 / L2 | 3.7065 / 15.7860 | 3.707 / 15.786 | ***bitidentisch*** |

Nullkanal `NONE/none/open`: **max 0.002 px** (1920) und **0.001 px** (1280) — er liest Null. Trennung in der
schlechtesten Zelle: **3.050 px gegen 0.000 px.** Kreisfits: 4 Punkte, Residual-RMS 0.0000–0.0003 px.

> *** MEINE HYPOTHESE IST WIDERLEGT, UND ZWAR GEMESSEN. *** Ich hatte geschrieben, §86s Frame-Solve habe die
> gerenderte Splay-Größe bewegt und sie sei am Integrationsstand ungemessen. **Vier von sechs Zellen sind
> bitidentisch, die zwei bewegten um 0.0005 px und 0.0025 px.** `k` hat sich bewegt (−0.018 % / −0.088 %) und
> die Splay folgte **eins zu eins** — **weil sie nicht anders kann:** beide Äste von `tick = max(2.4k, 0.18r)`
> rendern in Device-px, ebenso die 1.300 px Strichbreite. **Die Größe ist bauartbedingt k-invariant bis auf
> die Eigenbewegung des Frames.** Meine Prämisse war plausibel und die Boden-Argumentation formal richtig —
> *** SIE ERREICHT BEI DIESEM k-DELTA NUR KEINEN MESSBAREN EFFEKT. *** PG-20s Magnitude am integrierten Stand
> **ist A-G94s Figur, unverändert.**

#### Das Urteil, und die Verweigerung ist die richtige

**PG-20s Magnitudenglied: GEMESSEN — UND NICHT ALS PASS-ODER-FAIL ENTSCHEIDBAR, WEIL DER PIN KEINE
NUMERISCHE SCHRANKE NENNT.** A-G94 setzt Methode und Venue und **lehnt die Schwelle ausdrücklich ab**:
*„Whether 3.05 px is perceivable is PINK's threshold to set, from its own instrument, and not mine.“*
**PINK hat sie nie gesetzt** — in 43 veröffentlichten Skripten existiert keine PG-20-Probe, und PG-20 steht
in PINKs §3 unter keinem bewachten Pin.

> *** PINK-PIXEL HAT SICH GEWEIGERT, EINE SCHRANKE ZU ERFINDEN, UND DAS IST DIE EINZIG RICHTIGE ANTWORT: EINE
> SCHWELLE ZU SETZEN IST EIN URTEIL, KEINE MESSUNG, UND EINE VON DER PRÜFENDEN LANE AUTORISIERTE SCHRANKE,
> DIE SIE DANN BESTEHT, IST GENAU DIE SELBSTZERTIFIZIERUNG, DIE A-G36 VERBIETET. *** Als **ungemessen**
> berichtet, nie als bestanden.

**Was falsifizierbar ist und hält:** PG-20s **qualitative** Forderung — nur DIFFERENTs offene Enden spreizen,
nichts sonst — ist auf jedem Level und in beiden Viewports erfüllt, Nullkanal auf Null. **Und ohne Schwelle
kaufbar:** in der schlechtesten Zelle ist das offene Ende um **2.35 × seine eigene Strichbreite** verschoben,
also durch eine klare Rasterlücke getrennt statt verschmolzen — **eine untere Grenze der Auflösbarkeit, die
die perzeptuelle Frage genau dort lässt, wo A-G94 sie gelassen hat: offen, und PINKs.**

#### Drei Korrekturen an mir — zwei davon habe ich selbst nachgeprüft

| | |
|---|---|
| **Population** | Ich relayte *„6 DIFFERENT/counterTick gegen 6 NONE/none pro Level“*. **Geprüft im Artefakt: 1 DIFFERENT- und 1 NONE-Arc mit je 2 Enden im gemessenen Collar**, und dokumentweit **2 von 19 Arcs**. *** MEINE ZAHL TRIFFT KEINEN DER BEIDEN MASSSTÄBE. *** |
| **Quell-Commit** | Ich relayte `185427d5`. **Geprüft: `provenance.head = 02a1b585`.** |
| **L2-Identität** | vakuos (0 = 0 = 0) und darf nicht zitiert werden |

> *** DRITTES MAL HEUTE, DASS EINE VON MIR WEITERGEGEBENE FIGUR FALSCH WAR, UND ALLE DREI MALE AUS DEMSELBEN
> GRUND: ICH HABE SIE WEITERGEGEBEN, OHNE SIE IM ARTEFAKT NACHZUSEHEN. *** PG-1 (D-PP-2), die 42703-Spalte
> (F-B1), und jetzt Population und Commit. **A-G458 verlangte, das Verdict-Feld wörtlich mitzunehmen; A-G491
> die Bedingung. Der gemeinsame Kern ist einfacher und härter: *** WER EINE ZAHL WEITERGIBT, HAT SIE IM
> ARTEFAKT GELESEN, ODER ER GIBT EIN GERÜCHT WEITER. *** Und ich habe diesmal auch PINK-PIXELs Korrekturen
> nachgeprüft statt sie zu übernehmen — beide bestätigt.

**Und ein Befund zu GRÜNs Gunsten:** D-PP-3 **wiederholt sich hier nicht.** GRÜNs Instrument liest Build und
Head **aus dem bedienten Worktree** (`servedProvenance`) statt sie zu hartkodieren, also labeln die Re-Run-
Ausgaben sich korrekt als `7ffaeb40` / `d66mAV-ZQ1OcInLuwst57`. *** AUF DIESER ACHSE IST GRÜNS INSTRUMENT
BESSER GEBAUT ALS PINKS — UND DAS IST DIE LANE, DEREN REGEL ES IST. ***
