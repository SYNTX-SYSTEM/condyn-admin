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
| **Drei Lanes, drei Branches, keine gemeinsame Lesbarkeit** — ***DIESE ZEILE IST SEIT 2026-11-16 ABGELAUFEN (§13.3): alle drei Branches liegen auf `origin`; die gemeinsame Lesbarkeit besteht.*** | GELB `architecture/mapping-phase-f`, GRÜN `Frontend`, PINK `Implementation` |
| **GELB kann PINKs Validierungsbericht nicht lesen** | `PINK-SYSTEM-VALIDATION.md`, **124 Commits ungepusht** — von außen bestätigt: der Pfad existiert auf keinem lesbaren Branch — ***ABGELAUFEN SEIT 2026-11-16 (§13.3/§13.5): der Branch liegt als `b6490e86` auf `origin`, der Pfad ist lesbar, und die 124 ist eine von VIER korrekten Zahlen in verschiedenen Rahmen — siehe §13.5.*** |
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

**8. Die unabhängige Rekonstruktion trägt heute 10 von 28 Instrumenten** *(⚠ KORRIGIERT 2026-11-16, §13.3 F-R4: hier und an fünf weiteren Stellen stand „von 27“; §11.14s eigene Tabelle und eine Nachzählung geben 28. ⚠ UND DER NENNER IST GELBS EIGENE POPULATION — über alle drei Spuren sind es **77 von 164**, §13.6.)* *(§129, A-G469)*. Aus einem echten
`origin`-Clone, ohne Pfadumschreibung: **10 laufen, 16 erreichen ihre Quelle nicht, 1 verweigert als Bauart.**
**Mit GRÜNs 90 und PINKs 105 veröffentlicht: 26 von 28, 0 unerreichbar** — gemessen, nicht geschätzt (beide
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
> ⚠ ***DIESER NACHTRAG BESCHREIBT DIE WELT VOR DER VERÖFFENTLICHUNG UND IST IN ZWEI PUNKTEN ABGELAUFEN (§13.3):*** sein Abgleichsdefekt „105 gegen 119“ ist in **§11.13** aufgelöst (und dort als „zu hart“ zurückgenommen), vollständig ausgezählt in **§13.5**; seine Veröffentlichungszahlen sind in **§11.14** über `origin` neu gemessen. **Er bleibt als historischer Stand stehen; für den aktuellen Stand gilt §13.**
>
> **Der Eigentümer hat PINKs Branch-Push ausdrücklich autorisiert.** A-G250 ist damit **durch den Eigentümer
> entschieden**, nicht durch eine Lane. Die Autorisierung ist PINK **wörtlich mit Provenienz** zugestellt.
>
> *** UND DIE PRÜFUNG, DIE DIESE AUTORISIERUNG ERST MÖGLICH MACHTE, HAT BEDINGUNG 4 GRÖSSER GEMACHT, NICHT
> KLEINER. *** Aus einem echten Clone von `origin` gemessen: **10 von 28 Instrumenten laufen, 16 erreichen
> ihre Quelle nicht.** **PINKs Push ist NOTWENDIG UND NICHT HINREICHEND.** PINKs *eigene Messungen* ruhen auf
> einem **veröffentlichten** Build und PINKs eigenen Instrumenten — sie reisen, sobald der Branch reist. Was
> **nicht** reist, ist die **lane-übergreifende Nachrechnung**: dieses Register pinnt 9 Instrumente auf
> `4b83414e` und zitiert **20 `gruen-*`-Dateien**, von denen am veröffentlichten Stand **0 von 20** auflösen.
>
> **Gemessen, was die Entscheidung kauft** (beide lokalen Branches über einen Dateipfad in den Prüf-Clone
> geholt, **nichts gepusht**): **mit GRÜNs 90 und PINKs 105 veröffentlicht laufen 26 von 28, 0 unerreichbar.**
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
   > ⚠ ***ABGELAUFEN (§11.14, §13.3).*** Der Branch liegt als `b6490e86` auf `origin`. **Der GRUND, den dieser
   > Punkt für Bedingung 4 angibt, ist entfallen** — PINKs eigene Spur hat das 2026-11-16 unabhängig
   > festgestellt (L-1). **Bedingung 4 bleibt dennoch nicht als erfüllt ausgewiesen, jetzt aber aus einem
   > anderen Grund: §13.7.**
2. **Die lane-übergreifende Nachrechnung reist nicht.** *(⚠ ABGELAUFEN für GELBs 28 — §11.14 misst 26/28, 0 unerreichbar. **ÜBER ALLE DREI LANES GEMESSEN IST DER BEFUND ABER VIEL SCHLECHTER: §13.6.**)* **10 von 28** Instrumenten laufen aus einem echten
   `origin`-Clone; **26 von 28** mit GRÜNs 99 und PINKs 105 veröffentlicht — **gemessen**, nichts gepusht.
   Die verbleibenden **16 sind allein durch Veröffentlichung blockiert.**
3. **PF-13 GUARDED** (Urteil PINKs) · **PG-14 NEU FORMULIERT / UNVERIFIZIERT** · **PG-11 CURRENCY LAPSED** ·
   **acht Siegel byteidentisch, Digests prüfen, auf einen Build datiert, der auf nichts auflöst.**
   > ⚠ ***TEILWEISE ABGELAUFEN (§13.3):*** PG-11s Währungsaussage ist in §89 datiert; `4b83414e` liegt auf
   > einem `origin`-Ref und löst auf. **PF-13 und PG-14 stehen unverändert offen.**
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

> *** §4 PUNKT 8s VORHERSAGE — „mit GRÜNs und PINKs Commits veröffentlicht laufen 26 von 28, 0 unerreichbar“ —
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

---

## §13 MANDAT „SFE AUTONOMOUS SYSTEM RECOVERY" — DER ABGEGLICHENE DREI-SPUREN-ZUSTAND

**Rahmen des Mandats:** Rekonstruktion und Abgleich, **keine Features, keine Produktänderungen.** Eingehalten:
die einzigen Schreibvorgänge dieses Mandats sind dieser Abschnitt, die Währungsmarker in §0/§7/§10 und die
Nennerkorrektur. **Kein Produktpfad (`lib`, `app`, `scripts`) berührt, kein Merge nach `main`, kein Deployment,
Gemini aus, kein Siegel verändert, kein Worktree eines Peers beschrieben.**

### §13.1 DIE DREI SPUREN — HERGESTELLT, UND WAS SIE WIRKLICH SIND

**GELB** (diese Session) · **GRÜN** und **PINK** als zwei beauftragte Spuren mit eigenem Kontext, eigenen
Messungen, eigenem Bericht. ***Und wie in §12.3: strukturell unabhängig, nicht provenienz-unabhängig — von der
Lane instruiert, die sie prüfen. Ich weise das nicht als gleichwertig aus.***

**Beide haben zuerst ihr eigenes Briefing widerlegt, und zwar an derselben Stelle:** ich habe beiden einen
Worktree zugewiesen, in dem sie nicht liefen. *(`/proc/$$/cwd` → beide in `condyn-admin-hr-integration`, GELBs
Registerbranch.)* **GRÜNs Checkout trug 9 von 19 seiner eigenen Mapping-Testdateien; PINKs Artefakte lagen
nicht dort, wo PINK sie laut Briefing lesen sollte.** Beide haben die Zuweisung verworfen und über `ref`
gelesen. ***Hätten beide dem Briefing gehorcht, hätte diese Rekonstruktion zwei falsche Messungen produziert —
genau die, vor der mein eigener Briefing-Absatz warnt.*** Das ist A-G486 ein zweites Mal, und diesmal habe ich
den Fehler gemacht, nicht geerbt.

### §13.2 DER PRODUKTZUSTAND — DREIFACH UNABHÄNGIG BESTÄTIGT

| | GELB | GRÜN | PINK |
|---|---|---|---|
| Produktdateien `origin/main` ↔ `7ffaeb40` | **12** | **12** | — |
| ≡ GRÜN | **9** | **9** | 9 |
| ≡ GELB `eb75fd02` | **3** | **3** | 3 |
| ***≡ keinem Elternteil*** | ***0*** | ***0*** | ***0*** |
| `7ffaeb40` Vorfahre von `origin/main`? | **nein** | **nein** | **nein (exit 1)** |
| Eltern von `4f4534c5` | `eb75fd02`+`a0475f13` | bestätigt | bestätigt |

**Drei Spuren, drei Methoden** (ich per `sha256sum` je Datei, GRÜN zusätzlich in der *Spiegelrichtung* — nichts
fiel weg —, PINK über Blob-Identität und Zeilenzahl). ***Die reine Vereinigung hält am aktuellen Tip.***
**MAP-INT-ARCH 7/7, exit 0, Wegwerf-DB verifiziert und gelöscht, B-ENTRY nicht umgangen.**

**Der Mapping-Kern, gemessen:** `PersonJobMappingField.tsx` 244 → **1243**, `view-model/mapping-field.ts` 198 →
**471**, `mapping/layout.ts` 143 → **164**. **Nur 2 von 20 `lib/`-Modulen haben sich in Phase G bewegt** — genau
was `architecture.test.ts:390` pinnt. *(Anmerkung zum Rahmen: „das Hauptfeldmodul" bezeichnet in GRÜNs Bericht
das View-Model, in PINKs die Komponente. Beide Zahlen sind richtig; es sind zwei Dateien.)*

### §13.3 SECHS BEFUNDE GEGEN DIESE LANE, ZWEI DAVON GEGEN IHRE EIGENEN PRÜFSTÄNDE

**F-R1 · MAP-INT-ARCHs Nachher-Glied ist blind für Merge-Commits.** Es prüft mit
`git show --name-only --format= <commit> -- lib app scripts` und überspringt bei leerer Ausgabe. ***Git gibt für
einen Merge standardmäßig keinen Diff aus.*** Bewiesen: `6bdf2628` hat `phase-base.ts` nachweislich geändert —
`git diff 1472ccf1 6bdf2628 --` nennt die Datei, `git show --name-only --format= 6bdf2628 --` gibt **leer**
zurück. **Der Integrationsbranch enthält genau so einen Merge.** Das Urteil ist heute richtig, weil dieser
Merge **0 Produktpfade** trägt — ***richtig durch Inhalt, nicht durch die Prüfung.*** Reparatur benannt und
verifiziert: `--diff-merges=first-parent`. ~~**NICHT ANGEWENDET**, Grund in §13.8.~~ ***ANGEWENDET AM 2026-11-16 UNTER DEM REPARATURMANDAT (§14.2): das Mandat autorisiert ausdrücklich Test- und Integrationsarbeit, und derselbe Lauf, der den Tip verschiebt, nimmt die Suite neu ab — womit §13.8s Aufschubgrund entfällt, statt übergangen zu werden.*** Dieselbe Klasse wie A-G492s
F-C3: eine Prüfung, die fragt *„was ist aufgeführt?"* statt *„was kann diese Aufzählung nie erreichen?"*

**F-R2 · `lens-owner-bfe0d27` ist kein gebrochenes Siegel, sondern ein falsches Basisverzeichnis.** Ich hatte
„ein Siegel, das nie verifiziert hat, nicht reparierbar ohne Fälschung" berichtet. Genau gemessen: das Manifest
präfixt 13 seiner 14 Einträge mit `owner-bfe0d27/`, **ein Verzeichnis dieses Namens existiert nirgends**; **5
der benannten Artefakte liegen im Verzeichnis selbst und alle 5 hashen byteidentisch**; 9 fehlen wirklich; eine
vorhandene Datei steht in keinem Manifest. **PINK hat unabhängig denselben Befund und zwei Dinge ergänzt, die
ich nicht hatte:** es ist **PINK-authored, §3.15 Lens-Field-Ära**, und der Verzeichnisbaum ist **auf
`origin/main` byteidentisch** (gleiches Tree-Objekt `9f7a2106`) — ***das Manifest war schon falsch, als es
geschrieben wurde, und ist auf `main` seit jeher falsch. Keine Regression, nicht vom Mapping verursacht.***
**Und:** mein „28 scheiternde Einträge" war mein eigener Doppelzähler (`sha256sum` gibt zwei Zeilen je
unlesbarer Datei). **Richtig: 14 Einträge, 0 verifiziert.**

**F-R3 · Kopf und Abschluss dieses Berichts beschrieben die Welt VOR der Veröffentlichung.** §0 Zeilen 1–2, §7s
Nachtrag und §10 Punkte 1–3 standen ohne Vorwärtsmarker, während §11/§12 den veröffentlichten Zustand
beschreiben. ***Ein Leser in Leserichtung bekam den überholten Stand zweimal, bevor er die Korrektur erreichte.***
Alle vier Stellen sind jetzt datiert markiert; **keine Originalaussage gelöscht.** §0 Zeile 3 trug ihren
Widerruf bereits — dort hat die Disziplin funktioniert.

**F-R4 · Die Veröffentlichungszahl stand gegen zwei Nenner, und einer war falsch.** Sechs Stellen lasen
„von 27", zwei „von 28". ***§11.14s eigene Tabelle entscheidet: 10+16+2 = 28 und 26+0+2 = 28, derselbe Lauf.***
Unabhängig nachgezählt: **28 Instrumente existieren.** Sechs Stellen korrigiert.

**F-R5 · Mein Briefing hat die Evidenzwurzel falsch benannt — und das versteckt jedes Siegel.** Ich habe
GRÜN und PINK auf `docs/architecture/decision-fields/evidence/` eingegrenzt. **GRÜNs Evidenz liegt unter
`docs/career_analysis/evidence/` — 1240 Dateien am Integrationstip, und dort liegen ALLE 8 `SEALED-*.json`.**
PINK sagt es unverblümt: ***„Hätte ich den Scope des Briefings wörtlich befolgt, hätte ich dem Eigentümer
berichtet, es existieren keine Siegel."*** Mein eigener Siegelsweep hat denselben Fehler in anderer Form: mein
Muster suchte `SEALED-*.sha256`, nicht `SEALED-*.json`, **und er lief in meinem Arbeitsbaum, wo `mapping-phase-g`
gar nicht existiert** — `SEALED-*.json` am eigenen Ref: **0**, an `7ffaeb40`: **8**. ***Meine „69 Manifeste /
1308 Einträge" sind korrekt für meinen Ref und als Aussage über das Vorhaben unvollständig.*** PINK misst an
seinem Ref **99 Manifeste, 1652 Zeilen, 1638 OK, 98 von 99 verifizieren** — und: ***alle Siegel von
`mapping-phase-{a,b,c,d,e,f,g}` verifizieren, 0 Fehler.***

**F-R6 · §17(a) ist stale, nicht der Code** *(GRÜNs Befund, von mir nachgelesen)*. Mein Register verlangt von
GRÜN, eine Leiter zu korrigieren, die **A-G39(a) längst durch gemessene Werte ersetzt hat**;
`PersonJobMappingField.tsx:103` liest `shelf: 0.022`. **Die Anweisung in meinem Register ist der abgelaufene
Teil.**

### §13.4 WAS DIE ANDEREN BEIDEN AN SICH SELBST GEFUNDEN HABEN

**PINK gegen PINK (zwei tragende Aussagen, beide abgelaufen):** *(L-1)* `PINK-SYSTEM-VALIDATION.md` Zeile 4
liest **„119 commits, UNPUSHED"** — ***der Branch ist veröffentlicht.*** PINK stellt ausdrücklich fest, dass
damit **der Grund entfällt, mit dem §11 Bedingung 4 für unerfüllt erklärt hat**, und überlässt die Bedingung
selbst dem Eigentümer. *(L-2)* PINKs Aussage, `PHASE_G*.md` existiere in keinem lesbaren Worktree, war
***eine Verwechslung von Dateisystem-Reichweite mit Objekt-Reichweite*** — PINK hat das Dokument in dieser
Session gelesen. ***Das heißt: PINKs ganze „auf Bericht hin"-Stufe war selbst auferlegt und ist jetzt
einlösbar.*** PINK hat sie nicht eingelöst, weil Registeredition keine Rekonstruktion ist. **Richtig.**

**GRÜN gegen GRÜN:** sein erster Lauf ergab `28 failed / 170 passed`. **Alle 28 waren
`fatal: not a git repository` / `ERR_PHASE_G_BASE_MISSING`** — `git archive` liefert kein `.git`. GRÜN hat den
Lauf **als Artefakt protokolliert statt ihn zu verwerfen** und benennt den Nenner 198 in beiden Läufen als die
Gegenprobe, dass die Population sich nicht bewegte. ***Ein falsches Rot, das als falsches Rot berichtet wird.***
GRÜN nennt außerdem eine Population, die mein Briefing **und sein eigenes Instrument** übersehen:
`test/career/mapping/layout-v1_1.test.ts` — eine Datei, die seine Lane hinzugefügt hat, außerhalb von
`PHASE_DIRS`. Separat gemessen: **7 Dateien, 64/64, exit 0.**

### §13.5 VIER ZAHLEN FÜR EINEN BRANCH — UND ALLE VIER SIND RICHTIG

An `origin/validation/hr-decision-loop-pink` = `b6490e86` jetzt gemessen:

| Zahl | was sie zählt |
|---|---|
| **105** | `1f9117db..b6490e86` — die **Push-Spanne** |
| **119** | PINKs eigene Commits ab `a94593d8` **im Augenblick des Schreibens** (sein eigener Commit machte 120, §11.13) |
| **124** | was GELB beim Schreiben von §0/§7 gemessen hat |
| **128** | `a94593d8..b6490e86` **heute**, identisch mit „nicht von `origin/main` erreichbar" |

***Keine der vier ist falsch. Keine trug in §0/§7 ihren Rahmen.*** A-G417/A-G430 in Reinform — und damit ist die
„unerklärte 124" als **Rahmenauslassung** erledigt, nicht als Fehler. **GRÜNs Zahl ebenso: 115 linear, 0 Merges
— und der nackte Ref `main` ist hier 8 Commits alt und liefert 123.**

### §13.6 ***DIE REKONSTRUKTION AUS `origin` IST VIEL SCHLECHTER, ALS DIESER BERICHT SAGTE — UND DER GRUND IST EIN FREMDES REPOSITORY***

Meine „26 von 28" waren **GELBs 28**. PINK hat die Frage über **alle drei Spuren** gestellt und aus einem
frischen `origin`-Clone gemessen:

| Spur | rekonstruierbar |
|---|---|
| GELB | ~~26 / 28~~ → ***28 / 28*** *(§14.1: zwei waren Fehlalarme des statischen Pfadtests — beide laufen mit exit 0 und lesen die Fremdspur an einem BENANNTEN Ref)* |
| GRÜN | **49 / 53** |
| ***PINK*** | ***2 / 83*** → *siehe §14.1; die Wurzel ist beseitigt, die Neumessung ist PINKs* |
| **gesamt** | ***77 / 164*** — ⚠ ***DIESE ZAHL IST SEIT 2026-11-16 ÜBERHOLT (§14.1): `playwright` und `sharp` sind jetzt deklariert, und GRÜN misst 4 von 53 → 0 von 53 absolute Pfade in Auflösungsposition*** |

> ⚠ **KORREKTUR 2026-11-16, §15.3 — DIE NENNER SELBST SIND NACHGEMESSEN, UND ZWEI STIMMEN NICHT.** Population
> ausdrücklich definiert, weil sie vorher nirgends stand: verfolgte `.mjs`/`.mts`/`.py`/`.js` der drei
> Spurenverzeichnisse, je am Ref der Spur, Kriterium A = kein maschinenlokaler Pfad.
>
> | Spur | Ref | Population | Kriterium A |
> |---|---|---|---|
> | PINK | `d85df734` | **83** | **3 / 83** (die drei `.py`) |
> | GRÜN | `7ad75af8` | ***52, nicht 53*** | **50 / 52** |
> | GELB | `9cf29f09` | **28** | ***28 / 28*** |
> | **gesamt** | | ***163, nicht 164*** | ***81 / 163*** |
>
> [WITHDRAWN A-G502 2026-11-16] "GRÜN 49 / 53" — *der Nenner ist 52 an GRÜNs eigenem Ref; die 53 ist nicht
> reproduzierbar und wird nicht weitergetragen.* **Und PINKs 3/83 ist PINKs Zahl, von mir unabhängig
> bestätigt — die „2 / 83" dieses Berichts ist zurückgezogen: PINK hat sie nie erzeugt und korrekt
> abgelehnt, sie zu übernehmen.** *** DAMIT IST AUCH DIE ZAHL DES AUFTRAGS SELBST KORRIGIERT: ES SIND 163
> PRÜFWERKZEUGE, NICHT 164, UND DAS IST DIE FÜNFTE WEITERGEGEBENE ZAHL DIESER RUNDE, DIE BEIM NACHMESSEN
> NICHT HIELT. *** Die vier davor hat PINK an mir gefunden; diese habe ich selbst gefunden, was der erste
> Fall dieser Art in diesem Bericht ist.
>
> **Kriterium A in der Integration statt am Spuren-Ref** — und der Unterschied ist die Naht (§15.5): GRÜN
> misst dort **48 / 51**, weil `gruen-paths.mjs`, das Modul, das GRÜNs reparierte Instrumente importieren,
> **im integrierten Stand überhaupt nicht liegt.**

***Der Grund, und ich habe ihn selbst nachgemessen: 75 der 83 PINK-Instrumente importieren Playwright aus
`/home/codi/Entwicklung/nquiry/node_modules/` — und `nquiry` ist ein ANDERES REPOSITORY
(`SYNTX-SYSTEM/NQUIRY.git`), das `origin` nicht enthält.*** **Und es ist nicht eine Spur:** **47 von GRÜNs
Ausgabedateien** nennen denselben Pfad; `pf13-evaluated.json` trägt ihn in seinem `instrument`-Feld. **Die
Instrumentenschranke ist also nicht „eine Maschine", sondern eine Maschine PLUS ein Schwesterrepository.**

> ***UND DIE FALLE IST GENAU DIE AUS A-G469, EINE EBENE TIEFER: alle diese Pfade EXISTIEREN auf dieser Maschine.
> Die 84 Instrumente LAUFEN aus einem frischen Clone HIER DURCH und scheitern überall sonst. Ein
> Frischcheckout auf derselben Maschine kann das prinzipiell nicht entdecken.*** PINK hat außerdem ein
> GRÜN-Instrument benannt, das **in den Worktree einer Peer-Lane schreibt** (`gruen-pg16-crowding-L1.mjs`,
> Schreibziel mtime 2026-11-16 04:20). **Gemeldet, nicht adjudiziert.**

**Das ist die schlechteste Zahl dieses Mandats, sie stammt von der prüfenden Spur, und sie richtet sich gegen
die prüfende Spur selbst.**

### §13.7 DIE 197 GEGEN DIE 198 — UND WARUM DIESE AUFLÖSUNG DIE BESTE DES MANDATS IST

PINKs Pin-Tabelle führt PF-13 mit **„16 Dateien, 197 Tests, 197 passed"**. GRÜN hat **198/198** gemessen,
zweimal. ***Ich habe es im Artefakt nachgelesen, statt eine Spur zu glauben:*** `pf13-evaluated.json` liest
`"passed": 198`, und `AG485-CLOSURE.md:67` sagt es selbst —

> *„The figure moved from **197** (`bce62ea1`) to **198** because one test was added: §115 A-G468
> (`3231f52c`)."*

**Beide Zahlen sind in ihrem Build-Rahmen richtig.** Und die 197-Fassung ist in GRÜNs eigenem
`currency-lapse.json` **als abgelaufene Zeile erfasst** (`kind: "test-population"`). ***Also: die unabhängige
Prüfspur hat eine abgelaufene Zahl als aktuelle zitiert — und der Detektor der geprüften Spur hatte sie längst
markiert.*** Dieselbe Zahl steht als historischer Anker im Mandat des Eigentümers; sie war zu ihrer Zeit richtig.

> *** DAS IST DIE REGEL DIESES MANDATS, DRITTES MAL BESTÄTIGT UND DIESMAL GEGEN DEN VALIDATOR:
> WER EINE ZAHL WEITERGIBT, HAT SIE IM ARTEFAKT GELESEN — ODER ER GIBT EIN GERÜCHT WEITER. ***

### §13.8 ZWEI ADJUDIKATIONEN, DIE MIR ZUSTEHEN

**1 · PINKs Befund (d) — „die Integration enthält den Bericht nicht, der sie zertifiziert" — ist richtig
beobachtet und KEIN DEFEKT. Er ist erzwungen.** 9 Commits von `4f551f89`, reine Docs, liegen außerhalb von
`7ffaeb40`, darunter §12.12, das die Suite **dieses Tips** behauptet. ***Läge §12.12 in `7ffaeb40`, wäre
`7ffaeb40` ein anderer Commit, und die Aussage beschriebe ihren eigenen Vorfahren.*** Ein Zertifikat über
Commit X kann nicht in Commit X liegen. **Die Konsistenz, die das Mandat verlangt, ist deshalb nicht
„alles in einen Commit", sondern „alle drei Aufzeichnungen von `origin` erreichbar" — und das ist gemessen
wahr.** Deshalb: **kein Merge der Registerbranches in die Integration.**

**2 · F-R1 wird BENANNT UND NICHT ANGEWENDET, und der Grund ist derselbe.** ⚠ ***DIESE ADJUDIKATION IST AM 2026-11-16 VOM EIGENTÜMER ÜBERHOLT WORDEN (§14.2) — das Reparaturmandat verlangt die Ausführung und autorisiert den Volllauf, der den Rahmen mitzieht. Der Aufschubgrund war richtig und ist entfallen.*** Jeder weitere Commit auf den
Integrationsbranch verschiebt den Tip — und **§12.12s 3688/0 beschriebe dann einen Vorfahren statt den Tip**,
also genau die Rahmenlücke (A-G430), gegen die diese Phase ihre Methode gebaut hat. ***Die Reparatur ist
richtig und gehört mit einem neuen Volllauf zusammen, nicht allein.*** Sie liegt fertig vor.

### §13.9 DER ABGEGLICHENE ZUSTAND, EINMAL KANONISCH

| | |
|---|---|
| `origin/main` | **`e360caf9`**, unverändert · **die Integration ist KEIN Vorfahre** (dreifach geprüft) |
| Integration | **`7ffaeb40`**, reine und **vollständige** Vereinigung, MAP-INT-ARCH **7/7** |
| GRÜN | **`9b57319d`**, veröffentlicht, sauber, **115 linear**, **16 Dateien / 198 Tests / 198 passed**, zweimal · `architecture.test.ts` **32/32** · **+64/64** in der übersehenen Population |
| PINK | **`b6490e86`**, veröffentlicht, sauber, **128** gegen `origin/main` · Siegel **98/99**, Mapping-Siegel **0 Fehler** |
| GELB | **`4f551f89`**, veröffentlicht, sauber · Siegel am eigenen Ref **1308 OK / 69** |
| Worktrees | **17**, 16 HEADs von `origin` erreichbar; der eine nicht: `condyn-admin` @ `59076c0d`, Vor-Mapping-Ära |
| Prüfstände | **8 erhalten und bedienend**; fünf konservierte BUILD_IDs unverändert — `xCD8LBxdjnP97-2Gjs5yr` @ `3ec8457d` **bestätigt PINKs eigene Rahmenangabe** |
| Auflösbarkeit | **alle 19 zitierten `gruen-*.mjs` und alle 9 gepinnten Commits liegen auf einem `origin`-Ref** |
| ***Instrumenten-Rekonstruktion*** | ~~77 / 164 über alle drei Spuren — PINK 2/83~~ → ***die Ursache ist beseitigt, §14.1*** |

**Offen und keiner Lane zuzuordnen:** **F-A2** · **PG-20s Schranke** *(PINK hat sie erneut verweigert, und das
ist das Ergebnis, nicht die Lücke)* · **PF-13s Closure** · **PG-14** · **PF-6 Zeile 1 / PF-11 / PF-2** ·
**A-G48/A-G51/A-G206** *(aufgeschoben)* · **die Naht** · **`sudo iptables -S DOCKER | grep 5432`** · **der
Merge nach `main`** · **die Instrumenten-Provenienz aus §13.6, die jetzt eine benannte Größe hat statt einer
Vermutung.**

---

## §14 MANDAT „FULL SYSTEM REPAIR & CLEANUP" — WAS TATSÄCHLICH REPARIERT IST

**Rahmen:** Reparatur statt Dokumentation, keine Features, kein Produktumfang. Eingehalten: **kein Merge nach
`main`** (`e360caf9` unverändert), **kein Deployment**, **Gemini aus**, **kein Siegel verändert**, kein
Prüfstand neu gebaut. Produktberührung: **zwei Dateien**, `lib/database-isolation/{policy,verification}.ts`,
unter einer **deklarierten und verbrauchten** `AUTHORISED_CROSSINGS`-Querung.

### §14.1 DIE WURZEL DER INSTRUMENTEN-PROVENIENZ — BESEITIGT, UND DIE ZAHL DAVOR WAR NICHT VERGLEICHBAR

***Das Repository deklarierte `playwright` nie, an keinem Ref.*** Die gesamte visuelle Prüfapparatur beider
Fremdspuren importierte es per absolutem Pfad aus `/home/codi/Entwicklung/nquiry` — einem **anderen
Repository** (`SYNTX-SYSTEM/NQUIRY.git`), das `origin` nicht enthält. Jetzt **exakt gepinnt**, `1.63.0` und
`0.34.5`, keine Caret-Range: *eine Range nennt keinen Build.* **Nachgewiesen statt behauptet:** echter
Chromium-Start mit SwiftShader und eine `sharp`-Lesung des Screenshots, beide über blanke Imports aus dem
`node_modules` des Repositorys.

> ⚠ **PINKS KORREKTUR, NACHGEMESSEN UND ANGENOMMEN:** `sharp@0.34.5` war **schon vorher blank auflösbar** —
> transitiv unter `next@16.2.4`, von npm nach oben gehoben (`npm ls` zeigt beides). **Für `sharp` ist meine
> Deklaration eine Versionsfixierung, keine Auflösungsreparatur.** Nur für `playwright` ist sie beides.

**Und die Zahlen, die drei Spuren getrennt gemessen haben, sind nicht vergleichbar — das ist der Befund, nicht
die Zahl:**

| Spur | Kriterium | Population | Zahl |
|---|---|---|---|
| GELB | *Modul per absolutem Pfad aufgelöst* | 28 GELB-Instrumente | **0 von 28** — PINK bestätigt **28/28 rekonstruierbar**, selbst gemessen |
| GRÜN | *absoluter Pfad in AUFLÖSUNGSPOSITION* | 54 Dateien, Mapping-Ära | **4 → 0** |
| PINK | *Modul per absolutem Pfad aufgelöst* | 115 Dateien, **ganze** `career_analysis`-Wurzel | **12** — *keine davon in der Mapping-Ära* |
| GELB, Gegenprobe | *irgendeine Nennung, Kommentare eingeschlossen* | dieselben zwei Wurzeln | **3** bzw. **19** |

> *** ALLE VIER SIND UNTER IHREM EIGENEN KRITERIUM RICHTIG UND KEINE IST MIT EINER ANDEREN VERGLEICHBAR. ***
> Ich habe GRÜNs „4 von 53 → 0 von 54" weitergegeben, als sei es eine Aussage über GRÜNs Prüfwerkzeug
> überhaupt. **PINK hat nachgemessen: alle zwölf ihrer Treffer liegen in älteren `job-pool`-Ären, keiner unter
> `mapping-phase-g`.** Also beantwortet eine 54-Datei-Population eine andere Frage als die 115-Datei-Wurzel.
> ***Das ist genau die Falle „ältere Ären in der zweiten Evidenzwurzel", vor der dieser Bericht in §13.3 F-R5
> selbst gewarnt hat — gestellt von der Lane, die die Warnung geschrieben hat, drei Abschnitte später.***
> **Vierter weitergegebener Zahlenfehler dieses Vorhabens, und wieder dieselbe Ursache: die Population nicht
> mitgelesen.**

### §14.2 F-R1 ANGEWENDET — UND DER AUFSCHUBGRUND IST ENTFALLEN, NICHT ÜBERGANGEN

§13.8 hatte die Reparatur *benannt und zurückgehalten*, weil jeder weitere Commit den Tip verschiebt und
§12.12s Suitezahl dann einen Vorfahren beschreibt. **Das Reparaturmandat autorisiert Test-, Build- und
Integrationsarbeit ausdrücklich — also zieht derselbe Lauf, der den Tip verschiebt, die Suite neu ab, und der
Grund entfällt, statt übergangen zu werden.**

Repariert mit `--diff-merges=first-parent`, und das neue Glied pinnt **Gits Verhalten in beide Richtungen**
(die blanke Form MUSS leer sein, die reparierte MUSS etwas zeigen) plus die **Vollständigkeit** der
Pro-Commit-Begehung gegen den Zweipunkt-Diff — die Prüfung, die F-R1 am Tag seiner Entstehung gefunden hätte.
**Mutant getötet, und er nennt `6bdf2628`.** Die Vollständigkeitsprüfung ist heute leer von Entwurf; das steht
im Docstring statt versteckt.

### §14.3 F-A2 GESCHLOSSEN — ***UND ES WAR KEINE EIGENTÜMERENTSCHEIDUNG***

Der Befund war seit Wochen als Eigentümerpunkt verbucht, weil beide bekannten Reparaturen eine Grenze
verletzen. ***Ich habe die Prämisse geprüft statt sie zu erben, und sie hielt nicht:***

> **Das „intakte Siegel" ist kein Manifest-Siegel.** Keines der 69 `manifest.sha256` nennt einen Pfad unter
> `test/decision-runtime`. **P8 ist eine lebende Regressions-Assertion** — `git diff --quiet 435a112 -- …` in
> `test/decision-integration/g2-g3-vertical-proof.test.ts`. Das Mandat friert **Siegel und historische
> Prüfartefakte** ein; ein Test ist keins von beiden.

Damit wurde eine **dritte Lesung** sichtbar: das Glied fragt, ob der Server *„nichts anderes"* hält. Eine
`condyn_r5_`-Datenbank ist **nichts anderes** — die Suite dieses Repositorys erzeugt sie, zufällig benannt, und
löscht sie. ***Das Glied war nie zu schwach; es hat den eigenen Payload als den eines Fremden klassifiziert.***

**Die Trennung ist die Reparatur.** `isSuiteOwnedDatabase` wird **ausschließlich** vom `FOREIGN_PAYLOAD`-Glied
gelesen; `DISPOSABLE_TEST_DATABASE_PATTERN` entscheidet weiter allein, welche URL als **Basis** zugelassen
wird. **Rot zuerst** (genau `ERR_TEST_DATABASE_ISOLATION_FOREIGN_PAYLOAD`), dann **91/91**, `tsc` 0, **P8 63/63
und seine gefrorene Menge unberührt**. Zwei Mutanten getötet — und der zweite ist der wichtige: ***wer den
Begriff in die Basis-Prüfung einbaut, bringt einen Test zum Fallen.*** Damit ist die Umgehung nicht nur
vermieden, sondern **bewacht**.

**Offen und benannt:** der r5-Pfad geht weiter nicht durch den sanktionierten create/drop-Engpass und kann bei
einem Abbruch lecken. **Die gemessenen Kosten sind beseitigt** — zwei parallele Läufe zerstörten sich, vier
Tests wurden still „skipped", und *ein Sololauf konnte das nie finden, weil diese Lanes immer allein gemessen
haben.*

### §14.4 F-R8 — ***ZWÖLF VON ZWANZIG ÜBERSPRUNGENEN WAREN EINE NIE DEKLARIERTE ABHÄNGIGKEIT***

Fünf Browser-Suiten sperren sich mit `describe.skipIf(playwrightModule === null)`. Die 20 Übersprungenen des
zertifizierten `3688/0`-Laufs, **aus dem Logbuch ausgezählt und arithmetisch aufgegangen:**

| | |
|---|---|
| **8** | Gemini, per Mandat deaktiviert — korrekt |
| **5** | ganze Dateien, weil `playwright` nicht auflöste |
| ***7*** | ***innerhalb zweier Dateien, die die Summenzeile `✓ passed` nennt*** |
| **= 20** | 8 + 5 + 7 ✓ |

***Wer übersprungene DATEIEN zählte, fand 11 und erfuhr nie von zwei halb übersprungenen Bestandenen.***

> ⚠ **PINKS VERFEINERUNG, DIE MEINE AUSSAGE ZURECHTRÜCKT:** das Tor honoriert `CONDYN_PLAYWRIGHT_MODULE`
> **vor** der Paketauflösung. Diese Suiten **liefen** für einen Operator, der die Variable exportierte — so hat
> §3.43 `syntx-walk` zweimal mit 3/3 verbucht. ***Der Defekt ist also BEDINGT: ausgeführt, wenn exportiert;
> still übersprungen, wenn nicht.*** Mein Batch ist der zweite Fall. **Q-12 ist „gemessen, dann gealtert",
> nicht „ungemessen"** — und das ist die präzisere und unbequemere Aussage, weil eine Zahl, die einmal stimmte,
> schwerer zu misstrauen ist als eine, die es nie gab. **Dieselbe Annahme sitzt an 12 Stellen in 6 Dateien;
> zwei waren PINKs und sind repariert, zehn sind meine zu triagieren.**

**Ausgeführt, ruhige Maschine, Exit ohne Pipe: `2 fehlgeschlagen / 19 bestanden / 1 übersprungen (22)`,
RUNNER_EXIT=1, 8m23s.** Beide Fehlschläge sind **echte Assertions, keine Timeouts** — geprüft, weil sechs
meiner eigenen Befunde dieser Arbeit mein Messaufbau waren.

### §14.5 DIE ZWEI VERALTETEN ASSERTIONS — UND MEINE ERSTE URSACHENZUSCHREIBUNG WAR FALSCH

**(a) Die Copy.** `"UPLOADED != SELECTED"` gegen das Produkt-`"UPLOADED ≠ OPENED · open it in the list
below"`, bewusst geändert in `44f9eede` *(„one word, one meaning", UX-07)* am **2026-10-23 — 23 Tage**. Jetzt
gegen `SIL_COPY.en.jobPool.uploadNotSelected` geprüft statt gegen ein Literal.

**(b) Die sechs festen Stufenschalen.** Gemessen statt vermutet:
`[shell-01, shell-02, shell-syntx-org_nordlicht, shell-syntx-org_rheinwerk, shell-syntx-org_alpendata]`.

> *** PINKS VERDIKT, NACHGEPRÜFT UND ANGENOMMEN: MEINE ZUSCHREIBUNG AN `ca117947` WAR FALSCH. *** Die Ursache
> ist `legacyHidden = investigationMode === "PERSON_X_JOB"` (`:612`) mit `legacyStage` (`:613`), das genau
> `["03","04","05","06"]` herausfiltert — Regel angekommen mit **`afcf89f6`**, 2026-10-22. **Und das
> Gegenbeweis-Stück ist meine eigene Datei:** sie nennt **keinen** Investigation-Mode und hat 03–06 doch als
> null gemessen — weil `DEFAULT_INVESTIGATION_MODE = "PERSON_X_JOB"` (`investigation-mode.ts:17`). **Eine
> Ursache über beide Suiten, und ich hatte zwei verschiedene vermutet.** `ca117947` erklärt die *Ersetzung*,
> nicht die *Ausblendung*. **Für PINKs Lauf ist die Assertion sieben Tage veraltet, nicht 23.**

Repariert, aus der Fixture **abgeleitet** statt hartkodiert, und 03–06 ausdrücklich als **abwesend** geprüft,
damit eine stille Rückkehr zum alten Modell auch fällt: **10/10**, `tsc` 0. PINK hat ihre Hälfte selbst
repariert — und **meine Vorlage verbessert**, indem sie die zwei Mechanismen *getrennt* prüft statt in einer
Summe, die bei beiden Ausfällen fällt, ohne zu sagen welcher.

### §14.6 DIE KLASSE GEWÄCHTERT, NICHT DIE ZEILE — UND WARUM DER VERGLEICH EXAKT SEIN MUSS

Neu, **ohne Browser**, `test/integration-boundary/ui-copy-currency.test.ts`: jedes copy-förmige Literal der
Browser-Suiten muss noch in `SIL_COPY` existieren, Fragmentliste deklariert und **vollständig verbraucht**.
4/4; der Mutant mit dem alten Literal wird in **9 ms** rot.

> *** UND DER ENTWURFSPUNKT IST DER BEFUND: `"UPLOADED != SELECTED"` EXISTIERT HEUTE NOCH IN `SIL_COPY` *** —
> als Fragment von `en.jobPool.nonClaims` und `en.syntx.nonClaims`, zwei Sätzen ohne jeden Bezug zur
> Upload-Statuszeile. **Eine Teilstring-Regel hätte die Veraltung durchgelassen.**
>
> **A-G495:** ***EIN STRING, DER IRGENDWO NOCH EXISTIERT, IST KEIN BELEG DAFÜR, DASS ER DORT NOCH EXISTIERT,
> WO ER BEHAUPTET WIRD.*** Dieselbe Verwechslung von Art und Identität wie A-G494s `.git`-Prüfung — und der
> Grund, warum dieses Glied eine Deklaration ausgibt statt seinen Vergleich zu lockern.

### §14.7 ZWEI BEFUNDE GEGEN MICH VON GRÜN — BEIDE NACHGEPRÜFT, BEIDE ANGENOMMEN

**F-R9.** `gelb-paths.mjs` prüfte `.git` plus zwei Dateien auf der Platte. ***Das besteht in einem völlig
fremden Repository.*** Reproduziert: ein `git init` mit zwei `touch`-Dateien genügte, damit mein Modul seine
Wurzeln ausgab und *„all three verified present"* schrieb — es refusierte erst in `peerRef()`, und nur weil
dort kein Branch des Peer-Namens lag. **Jedes Instrument, das `REPO_ROOT` oder `PHASE_G` ohne `peerRef`
importiert, hätte eine Messung aus einem fremden Baum berichtet.** Identität ist jetzt **drei Bedingungen**:
`.git`, ein **Identitäts-Commit**, und die Records **git-verfolgt** statt bloß vorhanden.

> **A-G494:** ***EIN WÄCHTER, DER FRAGT „IST DAS EIN REPOSITORY?" STATT „IST DAS *DAS* REPOSITORY?", HAT
> DENSELBEN DEFEKT WIE EINE ZAHL OHNE IHREN BUILD.*** Beide nennen eine **Art**, wo der Record eine
> **Identität** brauchte.

**Und der Edit, den ich vorgeschlagen habe, war selbst falsch.** Ich hieß GRÜN einen Kommentar „korrigieren",
der sagt, die Leiter sei *„stale from the moment the shelf moved to 0.02"*. **GRÜN hat es verweigert und
begründet:** die zitierte Leiter galt für Alpha **0.05**, also datiert der Satz den *Beginn* der Veraltung
korrekt; auf `0.022` geändert wäre er **falsch** geworden. ***Eine Lane, die eine Anweisung ihrer
Koordinationslane ausführt, hätte hier einen Fehler eingebaut, den die Koordinationslane als Korrektur
ausgegeben hat.***

### §14.8 ***DER SCHÄRFSTE BEFUND DES MANDATS, UND ER IST PINKS BEFUND ÜBER MICH***

PINK sollte 123 hartkodierte Importe umschreiben. PINK hat gemessen, was das kostet, und **verweigert**:

| Manifest | Einträge | davon `scripts/` |
|---|---|---|
| `mapping-phase-e-contract` | 33 | 15 |
| `mapping-phase-f-contract` | 43 | 25 |
| `mapping-phase-g-contract` | 91 | 43 |
| **Summe** | **167** | ***83 — jedes einzelne Instrument*** |

**Von mir an PINKs eigenem Ref nachgezählt: exakt 167 und 83.** Die Umschreibung bricht **80 von 167**
Einträgen — von PINK in einem Wegwerf-Clone **demonstriert, nicht argumentiert**. Dazu sind
`PINK-SYSTEM-VALIDATION.md` und `prep.txt` selbst Siegeleinträge: **das Register, das ich „an Ort und Stelle
korrigieren" ließ, ist mitversiegelt.**

> *** UND PINKS SATZ DAZU IST DER BEFUND: „Du hast das nicht gesehen, weil `mapping-phase-g-gelb/` kein
> Manifest hat — deine Instrumente sind unversiegelte Flachdateien, deine eigene Reparatur hat dich also
> nichts gekostet." *** Nachgeprüft: **an `4f551f89` existiert dort kein Manifest.** Also habe ich einer
> versiegelten Spur eine Reparatur verordnet, **deren Preis ich nie bezahlt habe, weil meine Lane nicht
> versiegelt ist** — und zwei Anweisungen desselben Mandats („stelle Rekonstruierbarkeit her" und „Siegel
> bleiben unverändert") kollidieren genau dort und nur dort.
>
> **A-G496:** ***EINE LANE, DIE EINER ANDEREN EINE REPARATUR VERORDNET, MUSS ZUERST PRÜFEN, WAS DIESE
> REPARATUR DORT KOSTET — DIE EIGENEN KOSTEN SIND KEIN MASS, WENN DIE EIGENE LANE DIE GRENZE NICHT HAT.***

**PINKs Ausgang ist der richtige:** die Reparatur ist gebaut und bewiesen (`3/83 → 83/83`, 137 Stellen → 0,
vier Auflösungswege mit echter Ausgabe durchgespielt, plus der Wurzel-Refusal), aber `--in-place` **verweigert
jede versiegelte Datei namentlich und beendet mit 3**; ein Override-Schalter hebt es. ***Das Anwenden ist eine
Eigentümerentscheidung, weil sie ein gefrorenes Siegel gegen Rekonstruierbarkeit tauscht und beide über dieser
Lane gesetzt wurden.***

### §14.9 WAS DIE FREMDSPUREN SONST AN SICH SELBST GEFUNDEN HABEN

**GRÜN:** **F-G1** — PF-13s Prüforte waren `existsSync(dir) ? readdir : []`; ein umbenannter `PHASE_DIR` hätte
**null Dateien still beigetragen**, und jeder Wächter darunter hätte sich selbst bestätigt:
`coverageMatchesPopulation` liest TRUE über eine Population, die es nie hatte — **unter dem Nenner, den dieses
Register zitiert.** Repariert. **F-G3** — `run-all.sh`s Kopf behauptet, jeder Fehlschlag werde benannt; *es
galt für 11 von ~41 Aufrufstellen*, Rasterprobe und Kompositionsproben druckten eine `!!`-Zeile und ließen
`FAILED` leer, sodass der Durchlauf weiter *„ALL DERIVATIONS AND PROBES RETURNED 0"* schloss. Aufrufstellen
2 → 12. **F-G6** — die Wrap-Gefahr des eigenen Detektors wurde **nur in der untercountenden Richtung
auditiert** und nie in der überzählenden. **F-G5** — siehe unten.

**PINK:** drei Widerrufe, jeder gegen die eigene Spur. **W-1** „119 commits, UNPUSHED" — falsch, aus `origin`
geklont. **W-2** `PHASE_G*.md` unlesbar — eigener Worktree-gegen-Ref-Fehler. **W-3** „197/197" — ***das
Artefakt sagt 198, und es ist der schlimmste der drei, weil GRÜNs Detektor die Veraltung längst markiert
hatte.*** Dazu **neu**: vier Stilllegungen von *auf Bericht* auf *am Ref verifiziert* gehoben — **und dabei
der Fund, dass PF-5 und PF-7 stillgelegt wurden, WÄHREND SIE ROT WAREN.** PG-19s Beerdigungen **bleiben auf
Bericht**: kein Grep-Treffer, und *das Fehlen eines Treffers ist nicht das Fehlen einer Entscheidung.* **Und
meine Zeigerangaben `:725`/`:998` für A-G20 sind beide falsch — A-G20 steht bei `:773`. Der Anspruch hielt,
der Zeiger versagte.**

**F-G5, GRÜNs Befund, hier gepinnt.** Die Fixture-Glieder von MAP-E/F/G-ARCH wächtern eine **Pfadliste**, nicht
die Kategorie *„eine Fixture"*. GRÜN hat es **experimentell** gemessen: eine Fixture in `support.ts` reißt
**drei** Glieder ohne jeden Commit — ***dieselbe Fixture in einer neuen Datei daneben besteht 32/32.*** **Die
Grenze blockiert die ehrliche Platzierung und lässt die ausweichende durch.** Als Invariantenschatten in
MAP-INT-ARCH gepinnt (A-G492s Teilung), Arbeitsbaum eingeschlossen, denn die Umgehung brauchte keinen Commit.

### §14.10 EIN HARNESS-FEHLER DIESER RUNDE, UND ER IST DER SIEBTE

Unescapte Backticks in einem **nicht gequoteten Heredoc** haben `git init` **gegen den echten Worktree**
ausgeführt und die Ausgabe in einen Docstring injiziert. **Integrität geprüft, nicht gehofft:** `fsck` exit 0,
HEAD korrekt, 63 lokale und 61 Remote-Refs, Config vollständig, `origin/main` unverändert — und `git init` ist
auf einem bestehenden Repository idempotent. **Kein Schaden.** Der Kommentar wurde anschließend ohne Shell
geschrieben.

> **A-G497:** ***EIN NICHT GEQUOTETES HEREDOC IST EINE SHELL, UND PROSA MIT BACKTICKS IST DARIN CODE.*** Die
> sechs Harness-Fehler davor betrafen Messung; dieser betraf **Ausführung** — und er landete im selben
> Dokument, das die Regel gegen sie sammelt.

### §14.11 BEREINIGT, MIT NACHGEWIESENEN KOSTEN

Der lokale `main`-Ref lag **8 Commits zurück** und hat GRÜN heute eine falsche Zahl geliefert: `main..lane`
gab **123**, `origin/main..lane` gibt **115**. Nachgezogen; `origin/main` selbst unverändert bei `e360caf9`.
**Nicht gelöscht:** `integration/mapping-trial-20261116` — sein Produktdelta gegen den kanonischen Stand ist
**0 Dateien**, es trägt also nichts, was verloren gehen könnte, und eine unumkehrbare Löschung eines
Engineering-Artefakts ist unter einem Mandat, das historische Prüfartefakte einfriert, der falsche Tausch.

### §14.12 OFFEN — JEDES MIT SEINER TATSÄCHLICHEN GRENZE

**Eigentümerentscheidungen, beide neu geschärft:**
1. ***PINKs Portabilitätsreparatur gegen 167 Siegeleinträge.*** Gebaut, bewiesen, hinter einem Schalter. Der
   Tausch ist Rekonstruierbarkeit gegen ein gefrorenes Siegel.
2. ***Der Vorwärtszeiger auf PINKs Errata.*** Das versiegelte Register trägt **keinen** Hinweis darauf, dass
   drei seiner Sätze widerrufen sind — ein Leser trifft sie unverändert an. **Eine Zeile behebt es und bricht
   dasselbe Siegel.**

**Bei PINK, mit Grenze statt Vermutung:** **PG-20** offen, **einmal begründet verweigert** — *nichts in dieser
Schranke misst Wahrnehmung*, und eine Zahl zu setzen würde PF-5s Nennerfehler wiederholen; Magnitude
verifiziert (**3.053 px**, Verhältnis 0.5604). **PF-2** offen, Grenze schärfer als §23: **0 von 19** Gruppen
selbstmessbar, und *die eine Rote dreht an dem Schritt, dessen Träger sich nicht identifizieren lässt* —
braucht einen Produkt-Hook. **PF-11** klärt **0 von 8** Sprossen; *eine Sprosse, die nichts gemessen hat, ist
kein Pass.* **PF-6** Zeile 1 rot bestätigt (**0.5074 gegen ≤0.03, 16.9×**), **1280×800 weiter ungemessen**.
**PF-13** alle drei Gründe halten, nur die Zahl bewegte sich auf **198/198**. **D-PP-3** Pfadhälfte repariert
und unangewendet, **Provenienzhälfte offen und nicht derselbe Fix: 60 von 80 Instrumenten hartkodieren ein
Commit-Literal**, eines berichtete `"commit": "9cc06f84"`, während es `3ec8457d` maß.

**Bei mir, benannt:** die **10 verbleibenden** `CONDYN_PLAYWRIGHT_MODULE`-Annahmestellen aus PINKs Zensus.
**PG-14**, **A-G48/A-G51/A-G206** (GRÜN hat gemessen, dass sie **drei** Glieder reißen, nicht eines, und dass
E's und F's Glieder *nicht Phase Gs zu ändern* sind). **Die Naht** — eine Abwägung zwischen einer sichtbaren
Kante und einer Leitersprosse, **keine technische Frage**. **`sudo iptables -S DOCKER | grep 5432`.** **Der
Merge nach `main`.**

### §14.13 ***F-R10 — ICH HABE ZWEI VERSIEGELTE EVIDENZORTE ÜBERSCHRIEBEN UND MITCOMMITTET***

**Der schwerste eigene Fehler dieses Mandats, und er traf genau die Grenze, die das Mandat einfriert.** Die
Deklaration von `playwright` hob fünf Browser-Suiten aus dem Skip (§14.4). **Zwei davon schreiben Screenshots,
Reports und ein NEU ERZEUGTES `manifest.sha256` in ihr Evidenzverzeichnis.** Ich habe sie gefahren und mit
`git add -A` committet: **67 Evidenzpfade und zwei versiegelte Manifeste** landeten in `e4d792ae`.

**Zurückgenommen und geprüft:** `docs/` ist über HEAD **byteidentisch zu `7ffaeb40`** (0 abweichende Pfade),
beide Manifeste byteidentisch zu ihren Originalen und verifizierend (**14/14** und **37/37**).

> *** UND DAS SCHLIMMSTE DARAN IST NICHT, DASS EIN SIEGEL BRACH — SONDERN DASS KEINES BRACH. *** Die neu
> erzeugten Manifeste **verifizierten ebenfalls**, gegen ihren eigenen neuen Inhalt. Ein Siegel, das sich
> selbst neu schreibt, ist schlimmer als eines, das bricht: **das gebrochene meldet sich, das neu geschriebene
> bestätigt sich.**

**Die Ursache ist schärfer als der Unfall, und sie ist ein Entwurf, an den dieses Register ohnehin glaubt.**
Beide Orte sind **nach dem Build benannt**, den sie beschreiben — `syntx-walk-${SYNTX_WALK_TIP}`,
`job-scope-gate-${JOB_SCOPE_TIP}` — und der Kommentar sagt es wörtlich: *„the tip under test names the evidence
directory."* Ohne gesetzte Variable fallen sie auf den **historischen** Tip zurück.

> **A-G498:** ***EIN LAUF, DER SEINEN BUILD NICHT NENNT, ÜBERSCHREIBT DIE EVIDENZ EINES ANDEREN BUILDS MIT DEN
> EIGENEN MESSUNGEN.*** A-G430s Regel war hier schon **in einem Verzeichnisnamen implementiert** — und ich habe
> sie ausgehebelt, indem ich eine Variable nicht gesetzt habe. **Die Grenze war gebaut; was fehlte, war das
> Runbook, das sie nennt.**

**Gewächtert statt dokumentiert:** `test/integration-boundary/seal-integrity.test.ts` — kein verfolgtes File in
einem versiegelten Verzeichnis darf im Arbeitsbaum verändert oder gelöscht sein, und **kein `manifest.sha256`
darf neu geschrieben sein.** Browserfrei, git-Ebene, **3/3**; der Mutant (eine versiegelte Datei berührt) macht
es rot **und nennt sie**. Es ist zugleich das Glied, das meinen eigenen Fehler gefunden hätte, bevor er in die
Historie kam.

**Und die Zuständigkeit, exakt:** *meine* Suite schreibt nach `docs/career_analysis/evidence/job-pool`, das
**unversiegelt** ist. **Die Siegelverletzung kam ausschließlich aus PINKs zwei Suiten, die ich gefahren habe.**
Der Befund ist PINKs Territorium, die Verletzung war meine Hand. **Der finale Volllauf setzt beide
Tip-Variablen auf den Integrationsstand** — damit schreiben sie in nach ihrem Build benannte Orte, und kein
Siegel wird berührt.

### §14.14 EIN ACHTER HARNESS-FEHLER, UND ER IST EINE POINTE

Mein Siegel-Zähler meldete **„15 FAILED"** gegen vorher 14. Nachgesehen statt gemeldet: das Manifest von
`ux-presweep-421e382` enthält eine Datei, die wörtlich **`STANDIN-ST-FAILED-md-as-pdf-1920.jpg`** heißt. Mein
`grep -c 'FAILED'` hat ihren **Namen** als **Urteil** gezählt.

> *** EIN SIEGELPRÜFER, DEN EIN DATEINAME NAMENS „FAILED" TÄUSCHT. *** Dieselbe Klasse wie die ersten Fehler
> dieser Arbeit: **ein Muster gezählt statt ein Ergebnis gelesen.** Richtig gezählt, gegen das Urteil am
> Zeilenende: **69 Manifeste, 1308 Einträge OK, 14 echte Fehlschläge — alle in `lens-owner-bfe0d27`**,
> vorbestehend, außerhalb des Mapping-Scopes, und unter diesem Mandat ausdrücklich nicht angetastet.

### §14.15 BEREINIGT

`condyn-admin-pink-struct` entfernt — leer laufend, sauber, HEAD `4f4534c5` von `origin` erreichbar, **1,5 G
frei**, und wiederherstellbar mit einem Befehl. **16 Worktrees statt 17.** Alle acht Prüfstände antworten
weiter (`:3122 :3123 :3220 :3221 :3230 :3231` HTTP 200, `:5432` und `:5433` lauschen), kein `.next` neu
gebaut. Der lokale `main`-Ref nachgezogen, nachdem er GRÜN eine um 8 Commits falsche Zahl geliefert hatte.

### §14.16 ***PINKS BEFUND ÜBER DAS INSTRUMENT, AUF DAS SICH DIESES GANZE MANDAT STÜTZT***

PINK hat F-R10 unabhängig nachgeprüft — `git diff --name-only e7b60061 <ref>` über beide Orte, **0
abweichende Pfade** an drei Refs — und daraus eine Folgerung gezogen, die größer ist als der Vorfall:

> *** EIN NEU ERZEUGTES MANIFEST VERIFIZIERT TADELLOS GEGEN SEINEN EIGENEN NEUEN INHALT. ALSO BEWEIST
> `sha256sum -c` INNERE KONSISTENZ, NICHT PROVENIENZ. *** Es kann einen Ort, der in einem Zug **neu gemessen
> und neu versiegelt** wurde, prinzipiell nicht entdecken.

**PINK hat das als Schranke über die eigenen Zahlen geschrieben** — über jedes „167/167 OK", das es gemeldet
hat, dieses Mandat eingeschlossen. **Und es gilt genauso für jedes „1308 OK" in diesem Bericht.**

> **A-G499:** ***EINE PRÜFSUMME BEANTWORTET „IST DIESER ORT IN SICH STIMMIG?" UND NIE „BESCHREIBT ER DEN BUILD,
> DEN ER ZU BESCHREIBEN BEHAUPTET?". EIN SIEGEL IST EIN INTEGRITÄTSMASS UND KEIN PROVENIENZMASS.***
>
> Dieselbe Verwechslung wie A-G494 (*Art statt Identität*) und A-G495 (*irgendwo statt dort*), jetzt im
> stärksten Werkzeug dieser Arbeit. **Was den Vorfall tatsächlich gefangen hat, war nicht das Siegel, sondern
> die Build-Benennung des Verzeichnisses plus ein Blick auf 67 Evidenzpfade in einem `git add -A`.**

### §14.17 DER DRITTE VERALTETE PUNKT — ***DER WALK BEHAUPTETE DIE ABWESENHEIT DES MAPPINGS***

PINKs Q-12-Reparatur trug bis `:966`. Dort prüfte der Walk `field-focus-strip` auf **zwei** Knöpfe. Die
Vertragszeile des Produkts selbst, `SyntxFieldSelector.tsx:16-18`:

> *„`field-focus-strip` (`data-field-focus` ∈ CAPABILITY | MAPPING | FIELD) holding **exactly three buttons**,
> `field-focus-capability-btn`, `field-focus-mapping-btn` and `job-pool-panel-toggle`"* — und sie zitiert
> dafür **`PERSON_X_JOB_MAPPING_PHASE_D.md §5.1`**.

Nennungen von `MAPPING` im Selektor, von beiden Spuren getrennt gezählt: **`origin/main` 0 · Integration 25**.

> *** ALSO IST DER DRITTE KNOPF DAS PERSON × JOB MAPPING SELBST. DIE UNABHÄNGIGE PRÜFSPUR BEHAUPTETE IN IHREM
> EIGENEN WALK DIE ABWESENHEIT DES ZENTRALEN NEUEN OBJEKTS, DAS SIE VALIDIERT *** — und `field-focus-mapping-btn`
> kam in ihrer Datei **nirgends** vor. PINKs eigene Formulierung dazu: *„die Lane, deren Aufgabe es ist zu
> finden, was das Produkt verloren hat, behauptete die Abwesenheit seines zentralen neuen Objekts — so lange,
> wie niemand eine Umgebungsvariable exportierte."*

**PINK hat es selbst repariert und dabei meine Vorlage übertroffen, mit einem Grund, den ich nicht hatte:**
`job-scope-indicator` ist selbst ein `<button>`, den der Vertrag **bewusst außerhalb** des Strips hält — *eine
Nachkommenzählung ist also genau das, was still driftet, wenn er je hineinwandert.* Gepinnt sind jetzt die drei
Testids je einmal, die Gesamtzahl, **die DOM-Reihenfolge** und `data-field-focus-active` **und** `aria-pressed`
an jedem. **Und PINK hat meine offene Frage beantwortet, statt sie zu übergehen:** `options` ist ein
Literal-Array aus drei ohne Filter, `isGated` *deaktiviert* nur — **der Strip ist in jedem Fokus dieselben
drei**, also war nichts zu verallgemeinern.

### §14.18 DREI ERGEBNISSE, DIE NUR DIE DREI-SPUREN-ANORDNUNG ERREICHT HAT

**Nicht die Defektzahl ist das Maß, sondern wer welchen Defekt gefunden hat:**

1. ***GRÜN fand den Defekt in GELBS Pfadmodul*** — und verweigerte gleichzeitig eine Anweisung GELBS, die
   falsch war. **Eine Lane, die gehorcht hätte, hätte einen Fehler eingebaut, den die Koordinationslane als
   Korrektur ausgegeben hat.**
2. ***PINK fand, dass GELBS Reparaturvorschrift an GELBS eigener Lane nichts kostet*** — weil GELBS Instrumente
   unversiegelt sind — **und verweigerte sie an 167 Siegeleinträgen, mit demonstriertem statt behauptetem
   Preis.**
3. ***PINK fand die Grenze von `sha256sum -c` selbst*** (§14.16), nachdem GELB dieselbe Prüfung dreimal als
   Beweis geführt hatte.

> **Und der ehrliche Gegenstand dazu, der zur Aussage gehört:** *** ALLE DREI BEFUNDE TRATEN AUF, WÄHREND EINE
> SPUR DIE REGEL EINER ANDEREN ANWANDTE — KEINER WURDE VON DER EIGENEN REGEL DER EIGENEN LANE GEFUNDEN. *** Das
> ist dasselbe Methodenergebnis wie in §10, zum zweiten Mal, und es sagt weiterhin **nichts** über die Defekte,
> auf die noch keine geborgte Regel gezeigt hat.

### §14.19 ***DER INTEGRIERTE STAND IST GRÜN, UND ERSTMALS LÄUFT DIE GANZE PRÜFEBENE MIT***

Integrationsstand **`5dacec16`**, auf `origin` veröffentlicht. **Ruhige Maschine (Last 0.42), Wegwerf-DB,
B-ENTRY unverändert und unumgangen, alle vier Evidenzorte nach dem Build benannt, Exit-Code ohne Pipe:**

```
Test Files  525 passed |  9 skipped (534)        0 fehlgeschlagen
     Tests  3713 passed |  9 skipped (3722)      0 fehlgeschlagen
exit 0 · 17m00s
```

**Arithmetische Kohärenz geprüft, nicht unterstellt:** voriger Lauf 3711 bestanden + 1 fehlgeschlagen + 9
übersprungen = 3721; jetzt **3711 + 1** (der Fehlschlag besteht) **+ 1** (PINKs Assertion in einen Test mehr
geteilt) **= 3713** ✓, und 3713 + 9 = **3722** ✓.

**Und was diese Zahl von allen vorherigen unterscheidet — es ist nicht ihre Höhe:**

| | vor diesem Mandat | jetzt |
|---|---|---|
| übersprungene Tests | **20** | **9** |
| davon per Mandat (Gemini aus) | 8 | ***9 — also alle*** |
| davon durch eine **nicht deklarierte Abhängigkeit** | ***12*** | ***0*** |
| Browser-Suiten, die tatsächlich liefen | 0 von 4 | ***4 von 4*** |
| versiegelte Orte vom Lauf berührt | ungemessen | ***0, gewächtert*** |

> *** ERSTMALS IST JEDER ÜBERSPRUNGENE TEST EINE RICHTLINIENENTSCHEIDUNG UND KEIN FEHLENDES WERKZEUG. *** Die
> vier Browser-Suiten liefen durch: `syntx-walk` **3/3** (122,7 s), `job-scope-gate` **1/1** (261,2 s),
> `job-pool-workflow` **10/10** (84,6 s), `hr-decision-loop-frontend` **7/7** (42,2 s). **PINKs eigene
> Bemerkung dazu gehört in diesen Abschnitt:** *„wenn die Suite jetzt bei `syntx-walk` grün wird, ist das das
> erste Mal, dass Q-12 in einem Batch tatsächlich ausgeübt wurde und nicht nur unter einem exportierten
> `CONDYN_PLAYWRIGHT_MODULE`."* **Sie ist grün geworden.**

**Was die Zahl weiterhin NICHT ist**, und das gehört genauso dazu wie 2026-11-16 früher am Tag: sie ist **nicht
in `main`** (`e360caf9`, unverändert, und die Integration ist nachweislich kein Vorfahre), sie ist **nicht die
Pixelschicht** (PF-2/PF-6/PF-11/PG-20 stehen offen mit ihren Grenzen), und **PINKs 83 Instrumente bleiben an
einem gefrorenen Siegel gebunden** — die Reparatur liegt gebaut und bewiesen daneben, hinter einer
Eigentümerentscheidung.

---

## §15 MANDAT „AUTONOMOUS COMPLETION" — DIE ZWEI FREIGEGEBENEN ENTSCHEIDUNGEN UND DER REST

Der Owner hat die beiden Entscheidungen freigegeben, die §14.12 als eigentümerreserviert ausgewiesen hatte:
PINKs Portabilitätsreparatur **über eine neue, separat versionierte Evidenzebene** zu integrieren, alle 167
historischen Siegeleinträge unverändert; und PINKs drei Widerrufe durch **nachvollziehbare Vorwärtsverweise**
mit ihren gültigen Errata zu verbinden, ohne historische Evidenz umzuschreiben. Danach: alle weiteren
technisch lösbaren Defekte autonom bearbeiten.

### §15.1 DIE KOSTENPRÜFUNG VOR DER ANWEISUNG — A-G496 EINGEHALTEN

PINK hat mir in §14.8 nachgewiesen, dass ich eine Reparatur für eine **versiegelte** Spur verordnet hatte,
deren Preis ich nie bezahlt habe, weil `mapping-phase-g-gelb/` kein Manifest hat. Diesmal zuerst gemessen,
**vor** dem Schreiben des Auftrags: in einer Wegwerfkopie von `mapping-phase-e-contract` ist die Basis
`33 OK`; nach `printf > ERRATA-FORWARD.md` weiterhin **`33 OK`, Exit 0**. `sha256sum -c` prüft die
gelisteten Zeilen und schweigt über alles andere im Verzeichnis.

*** DAMIT IST DIE ZWEITE ENTSCHEIDUNG ÜBERHAUPT ERST AUSFÜHRBAR: DER VORWÄRTSVERWEIS KANN NEBEN DEM
VERSIEGELTEN REGISTER LIEGEN, OHNE DAS SIEGEL ZU BERÜHREN. *** Die Baseline der drei Manifeste, aus den
Manifesten selbst gelesen und nicht übernommen: **33 + 43 + 91 = 167 Einträge, 167 OK, 0 FAILED.**

### §15.2 F-R11 — ZWEI PRÜFDATEIEN BEHAUPTETEN, PLAYWRIGHT SEI KEINE ABHÄNGIGKEIT

Beide Browser-Suiten trugen im Docstring: *„Playwright is not a dependency of this repository. Point
CONDYN_PLAYWRIGHT_MODULE at a `playwright` package directory to run the browser section."* Der Satz war bei
Niederschrift richtig. **Das Deklarieren von `playwright@1.63.0` — genau die Reparatur, mit der F-R8
geschlossen wurde — hat ihn falsch gemacht.** Das Paket löst bar auf, die Variable ist nur noch ein
Override.

*** F-R8s EIGENE KLASSE, ANGEWANDT AUF DIE SPUR, DIE F-R8 GESCHLOSSEN HAT. *** F-R8 war „gemessen, dann
veraltet"; hier veraltet eine **Behauptung über den Build**, in derselben Richtung, innerhalb der Reparatur,
die die erste behoben hat. Ein Satz über den Build ist eine Messung, und eine Messung, die niemand neu
liest, verrottet.

Die Reparatur ist nicht die Prosakorrektur — die ist einen Commit von erneut veraltet entfernt. Strukturell:
`dependency-claim-currency` prüft jede überprüfbare Abhängigkeitsbehauptung **in beiden Richtungen** gegen
`package.json`, nach Behauptungsform statt nach Dateiliste, browserfrei, in Millisekunden. Deshalb wird es
nach der Reparatur nicht vakuant: die Dateien behaupten jetzt das Positive, und **das Entfernen der
Abhängigkeit färbt die Docstrings rot.** Mutanten: `playwright` entfernt → rot, beide Dateien namentlich;
`1.62.0` statt `1.63.0` → rot mit beiden Versionen.

**Und was der Wächter an sich selbst gefunden hat, im ersten Lauf:** die erste Fassung verlangte Backticks
um den Paketnamen, fand **null** Behauptungen und meldete **zwei grüne Glieder über der leeren Menge** —
die veraltete Prosa schreibt ein blankes, großgeschriebenes „Playwright". Das **Vakuitätsglied** hat es
gefangen, gegen den eigenen Autor. Genau dafür ist es da.

### §15.3 F-R12 — SIEBEN INSTRUMENTE LASEN AUS EINEM WORKTREE, DER NICHT MEHR EXISTIERT

Population **vor** dem Zählen definiert: verfolgte `.mjs`/`.mts`/`.js`/`.py` unter `docs/`, ohne PINKs vier
Contract-Verzeichnisse — **152 Instrumente, 21 mit maschinenlokalem Pfad, 0 davon versiegelt** (gegen alle
**360** Siegeleinträge jedes verfolgten Manifests geprüft, nicht angenommen).

| Klasse | Stellen | Gestalt |
|---|---|---|
| **T** Werkzeug | 13 + 3 | `playwright` aus `nquiry`, dem **nicht dokumentierten Schwesterrepository**; `sharp` aus einem anderen Worktree |
| **I** Eingabe | **7** | Fixtures durch einen Worktree, ***der auf dieser Maschine nicht mehr existiert*** |
| **S** Scratch | 7 | ein **totes** Session-Scratchpad, auf Platte geprüft: `GONE` |

*** KLASSE I IST DIE SCHLIMMSTE, UND ZWAR WEIL DIE REPARATUR KEIN WORKAROUND IST: JEDE DIESER DATEIEN IST
IN DIESEM REPOSITORY UNTER DEMSELBEN RELATIVEN PFAD VERFOLGT. *** Sie lösten **nirgends** auf — auch nicht
hier — während die Bytes, die sie wollen, im Repository liegen, das das Instrument hält. PINK hat dieselbe
Klasse unabhängig in seiner eigenen Population gefunden (12 tote Session-Pfade) und zuerst benannt: ein
toter Pfad löst nirgends auf statt falsch.

Repariert durch einen **wiederholbaren Mechanismus** statt 18 Handgriffe — PINKs Standard und der bessere —
mit zwei Verifikationen nach dem Schreiben (kein absoluter Pfad überlebt; alles parst weiter) und
nachgewiesen **idempotent**: ein zweiter `--apply` ändert **0 Dateien**. Der Resolver hat **bewusst keinen
maschinenlokalen Fallback**: ein anderes Chromium oder eine andere `sharp`-ABI liefert weiter Zahlen, und
die würden als Messungen **dieses** Builds abgelegt (A-G430). Alle vier Pfade belegt, inklusive Verweigerung
mit vollständiger Kandidatenliste in einem Klon ohne `node_modules`.

Der Wächter prüft **nach Form, nicht nach Dateiliste** — GRÜNs F-G5 gegen mich war genau der andere Fehler.
Deklarierte Durchlässe werden **vollständig verbraucht**: eine Deklaration, deren Datei keinen solchen Pfad
mehr nennt, wird **rot als veraltet**. GRÜNs drei Dateien sind als Übergabe deklariert und **räumen sich
damit selbst auf**, sobald GRÜN sie repariert.

### §15.4 F-R13 — ***MEIN F-R9-WÄCHTER WEIST EINEN ECHTEN CHECKOUT DIESES REPOSITORYS AB***

F-R9 ließ `gelb-paths.mjs` ein **fremdes** Repository abweisen, indem es ein Identitäts-Commit verlangt;
A-G494: ein Wächter, der fragt *„ist das ein Repository?"* statt *„ist das DAS Repository?"*, hat denselben
Defekt wie eine Zahl ohne ihren Build. Gewählt wurde PHASE_Gs Basis-Commit.

Gemessen: dieses Objekt liegt in **7 von 124 Refs** und ist **kein Vorfahre von `main`**. In einem
`git clone --no-local --single-branch --branch main` ist es **ABWESEND**.

*** F-R9 HAT EINE FALSCHE ANNAHME BEHOBEN UND EINE FALSCHE ABWEISUNG EINGEFÜHRT — A-G494 MIT UMGEKEHRTER
POLARITÄT, IN DER REPARATUR FÜR A-G494. ***

**Der erste Beweisversuch war das falsche Instrument.** Ein `--local`-Klon kopiert den ganzen
Objektspeicher; das Commit reiste mit, und der Test bewies nichts. Notiert, weil das falsche Instrument
beinahe der Beweis geworden wäre — dieselbe Klasse wie die vier weitergegebenen Zahlen, die PINK an mir
gefunden hat, nur diesmal von mir selbst gefangen.

Anker ist jetzt der **Wurzel-Commit `29266f9c`**: das eine Objekt, das jeder Klon auf jedem Branch hält, in
allen 124 Refs, von `git init` + `touch` nicht fälschbar. Nachgewiesen: löst im echten Checkout auf, weist
ein fremdes Repository **weiter mit Exit 1** ab. Ein flacher Klon wird mit dem Mittel benannt, das dieses
Repository schon kennt (`git fetch --unshallow`, wie `ERR_PHASE_C_BASE_MISSING`). Als Invariante über **alle**
Instrumente gewächtert, den Wurzel-Commit aus dem Repository abgeleitet statt hartkodiert.

> ⚠ **KORREKTUR 2026-11-16 · F-G11 (GRÜN), von mir nachgeprüft — DIESER ABSCHNITT HAT DEN RICHTIGEN SCHLUSS
> MIT DEM FALSCHEN GRUND GEZOGEN.** Der Satz bleibt oben stehen:
>
> [WITHDRAWN F-G11 2026-11-16] "In einem `git clone --no-local --single-branch --branch main` ist es ABWESEND."
>
> Das stimmt — und ***das Szenario kann den Defekt nicht zeigen***: `main` trägt **null** Pfade unter
> `evidence/mapping-phase-g-gelb`, das Modul liegt in jenem Klon also gar nicht und der Wächter läuft nie.
> **Der erreichbare Fall ist ein FLACHER Klon eines Branches, der das Modul trägt — und dort fehlt der
> Wurzel-Commit EBENFALLS.** Gemessen: `--depth 1 --single-branch`, `rev-list --count HEAD` = 1, beide
> Objekte abwesend. *** DAS UMANKERN ALLEIN HAT ALSO EIN FALSCHES „IST NICHT DIESES REPOSITORY" DURCH EIN
> ANDERES MIT ANDERER SHA ERSETZT. *** Die Reparatur ist ein **Vorzeichen**, kein Anker (A-G468): Flachheit
> wird zuerst erkannt und getrennt als *„kann nicht festgestellt werden"* benannt. Der Wurzel-Commit bleibt
> der bessere Anker — er ist von `main` erreichbar, der Phase-G-Anker nicht —, aber er war nicht die
> Reparatur. **Ich habe eine falsche Begründung beim Korrigieren einer falschen Begründung erzeugt.**

### §15.5 DIE INTEGRATIONSNAHT, ZUM ERSTEN MAL ALS MESSBARE TATSACHE

§14.12 hat die Naht als Abwägung ausgewiesen, nicht als technische Frage. **Das war unvollständig.** Gemessen:

- **15 Commits** auf `architecture/mapping-phase-f` fehlten in der Integration, darunter ***zwei
  Instrumentenreparaturen, die das Register als erledigt führt — F-R9 in `gelb-paths.mjs` und F-R7 in
  `gelb-pin-assertion-scan.mjs`.*** Der integrierte Stand trug weiter die unreparierte Fassung.
- ***PINKs ganze Validierungsebene — 254 Dateien, vier Manifeste, die 167 gefrorenen Einträge — ist in der
  Integration überhaupt nicht vorhanden.*** Der „integrierte Systemzustand" enthielt die Evidenz der
  unabhängigen Spur nicht.

Die erste Hälfte ist geschlossen: zwei Merges (`db2a9a38`, dann F-R13), kein Merge nach `main`. **Und der
Merge hat sich selbst geprüft** — er brachte F-R9 herein, und das F-R13-Glied wurde an echter Historie
sofort rot, bevor ich den Anker korrigierte. Eine Reparatur, die als angewendet verbucht ist, ist nicht
angewendet, solange sie nicht in dem Zustand liegt, der ausgeführt wird.

### §15.6 VIERMAL DASSELBE: ***EIN WÄCHTER, DER TEXT PRÜFT, LIEGT IN SEINER EIGENEN POPULATION***

Diese Aufzeichnung korrigiert an Ort und Stelle und löscht den ursprünglichen Satz nie. Damit ist **das
Zitat eines Defekts nicht vom Defekt zu unterscheiden**. Viermal in einer Sitzung:

1. `dependency-claim-currency` rügte die beiden Docstrings, die ihren widerrufenen Satz korrekt zitieren;
2. **und danach seinen eigenen Docstring**, weil er den Defekt zitiert, zu dessen Fang er geschrieben wurde;
3. ein Python-Kommentar hielt einen toten Pfad **allein durch dessen Nennung** am Leben und machte die
   reparierte Datei von einer unreparierten ununterscheidbar;
4. das F-R13-Glied rügte `gelb-paths.mjs` für den widerrufenen Anker, zitiert in genau dem Kommentar, der
   seine Korrektur festhält.

`test/integration-boundary/withdrawn.ts` hält die Konvention jetzt **einmal**: Befund-ID und ISO-Datum auf
der Zeile der Behauptung. ***Ein blosses `[WITHDRAWN]` schweigt nicht*** — es fällt auf „lebende
Behauptung" zurück und stirbt am lebenden Glied. Als Mutant belegt, nach dem Refactoring erneut. Das ist
die `AUTHORISED_CROSSINGS`-Gestalt auf Prosa angewandt: eine Ausnahme nennt, wer sie erteilt hat und wann,
oder sie ist keine.

**Und das ist dieselbe Frage, die PINKs Vorwärtsverweise lösen müssen** — ein widerrufener Satz muss lesbar
bleiben, ohne als lebend gelesen zu werden. Die Antwort ist in beiden Fällen die gleiche.

### §15.7 DREI NEUE NOVELLEN

- **A-G500** — ***Ein Wächter, der Text prüft, liegt in seiner eigenen Population; das Zitat eines Defekts
  ist vom Defekt nicht zu unterscheiden.*** Deshalb muss ein Widerruf attributierbar und datiert sein, und
  eine blosse Marke darf nichts zum Schweigen bringen.
- **A-G501** — ***Ein Identitätsanspruch muss benennen, was jeder Klon auf jedem Branch hält.*** Ein
  Wächter, dessen Anker nur von manchen Refs erreichbar ist, weist berechtigte Checkouts ab. A-G494 fragte
  nach dem *ob*; dies fragt, ob die Antwort überall verfügbar ist.
- **A-G502** — ***Eine Reparatur, die als angewendet verbucht ist, ist nicht angewendet, solange sie nicht
  in dem Zustand liegt, der ausgeführt wird.*** Register und Integration sind zwei Zustände, und nur einer
  wird gemessen.

**Stand nach diesem Abschnitt:** Integration `9cf29f09`, Register `7f10c45f`, `test/integration-boundary`
**27/27**, fünf Mutanten getötet, jeder vom vorgesehenen Glied. `origin/main` unverändert.

### §15.8 ENTSCHEIDUNG 1 ERLEDIGT — DIE NEUE EBENE, UND KEIN VERSIEGELTES BYTE HAT SICH BEWEGT

PINK hat `mapping-phase-pink-portable-v1/` erzeugt: **83 Dateien, eigenes Manifest mit 82 Einträgen, 80
regenerierte Instrumente** (die drei `.py` brauchen nichts), **251 Änderungsstellen**, von
`pink-layer-build.mjs` erzeugt und nie von Hand — ein zweiter Checkout reproduziert 80/251/82 exakt.

**Die Bedingung des Owners, zweimal gemessen statt behauptet:** vorher `33+43+91 = 167 OK / 0 FAILED`,
nachher `33+43+91 = 167 OK / 0 FAILED`, Exit 0 je Verzeichnis; `git diff` auf den drei versiegelten
Verzeichnissen leer; kein historisches Manifest neu geschrieben; `--in-place` ungenutzt,
`PINK_SEAL_OVERRIDE` ungehoben. **Von mir im integrierten Stand unabhängig nachgemessen: 33 OK / 43 OK /
91 OK.**

***UND DIE EBENE IST AN DAS SIEGEL GEBUNDEN, NICHT NUR IN SICH KONSISTENT.*** `GENERATION.json` trägt je
Instrument den Quelldigest **wie aus der historischen Manifestzeile gelesen**, den **von Platte neu
berechneten** und den Ausgabedigest. Ein Byte an ein versiegeltes Instrument angefügt → **Exit 4, 0 Dateien
geschrieben**, Datei mit beiden Digests benannt. **Das ist die erste Konstruktion in dieser Aufzeichnung,
die A-G499 beantwortet statt sie einzuräumen:** das Manifest der Ebene beweist innere Konsistenz, der
Generationsnachweis beweist Herkunft aus den gefrorenen Bytes.

**Und PINK hat meine Auftragsprämisse widerlegt, mit Messung.** Ich hatte geschrieben, die Resolver-Kopie
mache den Import *innerhalb* der Ebene auflösbar — abgeschrieben aus dem Docstring von
`pink-portable-rewrite.mjs`, ohne es zu prüfen. **Falsch für jede Ebene unterhalb von `evidence/`:**
`pink-tools.mjs` leitet `REPO_ROOT` fünf Ebenen hoch ab, eine Kopie liegt eine Ebene zu tief, leitet
`REPO_ROOT=<repo>/docs` ab, findet kein `.git` und **wirft beim Import durch die eigene Wache**. Der
Spezifizierer löst auf und das Modul verweigert — jedes Instrument einer solchen Ebene ist bei Ankunft tot.
PINK hat eine kanonische Resolver-Instanz über `../../../` gewählt und die Tiefe im `--verify` nachgeprüft.

### §15.9 ENTSCHEIDUNG 2 ERLEDIGT — DIE VORWÄRTSVERWEISE, UND SIE SCHEITERN, WENN SIE VERALTEN

`mapping-phase-g-contract/ERRATA-FORWARD.json`, Schema `pink.errata-forward/1`, menschlicher Zwilling als
`.md`, **in keinem Manifest gelistet** — in situ nachgewiesen: **91 OK / Exit 0** mit beiden Dateien
vorhanden, **1 FAILED / Exit 1**, sobald eine *gelistete* Datei ein Byte bekommt. 3 Verweise, 8 versiegelte
Vorkommen, 4 abhängige Passagen; W-1 trägt alle vier, weil PINK sich geweigert hat, eine Prämisse
zurückzuziehen und ihre Schlüsse stehen zu lassen.

`test/integration-boundary/errata-forward.test.ts` wächtert das **dort, wo gelaufen wird** — PINKs eigene
Suiten laufen im integrierten Stand nicht. Es **schaltet auf PINKs Prüfer durch** statt die
Zitat-an-Zeile-Logik zu verdoppeln (zwei Implementierungen derselben Regel driften, und die nicht gelaufene
ist die falsche) und ergänzt die zwei Richtungen, die PINKs Prüfer von innen nicht abdecken kann: **die 167,
hier gemessen und mit gepinnter Eintragszahl** (ein neu erzeugtes Manifest verifiziert gegen seinen eigenen
neuen Inhalt — A-G499), und **die Errata-Richtung aus der Prosa der Errata gelesen** statt aus PINKs
abgeleitetem JSON, sonst stimmt das Dokument nur mit sich selbst überein.

**Vier Mutanten getötet:** ein Byte an eine gelistete versiegelte Datei; eine **vierte** Widerrufung ohne
Verweis (rot an meinem Glied **und** an PINKs Prüfer); W-1s vier abhängige Passagen entfernt; die
Verweisdatei im gefrorenen Manifest gelistet.

### §15.10 PINKS FÜNF BEFUNDE GEGEN MICH — UND EINER IST DIE SECHSTE WEITERGEGEBENE ZAHL

1. ***MEIN LAUFDESIGN BEWEIST NICHT, WAS ES BEHAUPTET.*** Ich hatte vier Umgebungsvariablen leeren lassen,
   damit bare Auflösung „beweisbar feuert". **PINK hat gemessen: in einem Klon ohne `node_modules` und mit
   allen vier ungesetzt lösten beide Werkzeuge weiter auf — über die maschinenlokalen Fallbacks.** Leeren
   beweist nichts, solange Fallbacks leben. PINK hat es per **Modul-Identität** entschieden. *** ICH HABE
   DIESELBE METHODE FÜR MEINE EIGENE DEKLARATION ÜBERNOMMEN: `pink-tools.playwright()` liefert ein Objekt
   `===` dem baren Import des deklarierten `playwright@1.63.0`, dito `sharp` — die sechs Fallbacks werden
   im integrierten Stand nicht erreicht. ***
2. **Die Resolver-Kopie-Prämisse war falsch** (§15.8).
3. ***„60 von 80 hartkodieren ein Commit-Literal GEGEN 27, die `buildId` vom laufenden Stand lesen" — die
   60 stimmt, der Rest nicht.*** Alle 27 tragen **ebenfalls** ein Commit-Literal (Teilmenge, nicht
   Gegenteil), und **alle 27 hartkodieren `buildId` als dasselbe String-Literal**. ***0 VON 83 LESEN EINE
   BUILD-IDENTITÄT DURCH IRGENDEINEN MECHANISMUS VON EINEM STAND.*** Mein Satz „27 Instrumente führen die
   Gestalt schon vor" war falsch: **es gab keine Gestalt zu verallgemeinern, PINK hat eine gebaut.** Das ist
   die **sechste** weitergegebene Zahl dieser Runde, die beim Nachmessen nicht hielt.
4. **Mein Auftrag wiederholte PINKs eigenen „§8-Asymmetrie"-Fehler.** Die Stelle ist §5 `:161–:169`, und es
   sind vier Abhängige über **drei** Sektionen. Ich hatte die Fehlstelle aus der Errata übernommen, ohne sie
   nachzulesen — **die Klasse, die ich in §14.1 selbst benannt habe, auf die Errata angewandt, die sie
   benennt.**
5. ***A-G502 ÜBERTRÄGT NICHT GANZ.*** Meine fehlenden Commits bedeuteten, dass der integrierte Stand
   **unrepariertes Codeausführte**. **Nichts im integrierten Stand führt PINKs 83 Instrumente aus** — sie
   sind Evidenzartefakte. Die Lücke dort ist **Lesbarkeit und Wächterabdeckung**, nicht „eine Reparatur, die
   als angewendet verbucht und nicht angewendet ist". Der Merge bleibt richtig, aus dem **schwächeren wahren
   Grund**. A-G502 gilt nur, wo der Zustand den Gegenstand *ausführt*.

### §15.11 GRÜNS DREI BEFUNDE GEGEN MICH

**F-G11** — §15.4s Grund war unerreichbar, und der erreichbare Fall schlägt meinen Anker. Oben als dated
correction eingetragen, der widerrufene Satz steht markiert.

**F-G12** — ***meine Deklaration maß den integrierten Stand und schrieb ihn GRÜNS SPUR ZU.*** An GRÜNs Tip
haben `gruen-pg16-crowding-L1.mjs` und `gruen-rank5-check.mjs` **null** Treffer; die 2/1/2, die ich
gemessen hatte, sind die des **älteren Refs** und der Integration. **Von meinem eigenen Glied an echter
Historie bestätigt:** nach GRÜNs Merge wurden zwei der drei Deklarationen **rot als veraltet** und mussten
entfernt werden. *** DIE SELBSTAUFRÄUMENDE DEKLARATION HAT GENAU DEN FEHLER GEFANGEN, DEN SIE EINGEHÜLLT
HAT, UND ZWAR GEGEN IHREN AUTOR. ***

**F-G10** — A-G373 nennt die falsche Größe: die Emit-Bedingung ist `collar.hidden > 0` bei `:884`, nicht
`floored > 0` bei `:784`. **Von mir im Produkt selbst gelesen, nicht übernommen.** `floored` zählt Körper am
12-px-Größenboden, `collar.hidden` kommt aus `collarSplit`; unverwandt. **Der Nullbefund beider Spuren hält,
die Begründung nicht.** Beide Zitatstellen in PHASE_G korrigiert, Wortlaut markiert erhalten.

### §15.12 PINKS SCHÄRFSTER BEFUND IST ÜBER PINK — UND ER TRAF MEINEN CODE GENAUSO

*** PINKS REPARATUR FÜR F-R13 HATTE F-R13. *** Sie verwechselte *„git hat nein gesagt"* mit *„git konnte
nicht gefragt werden"*: ohne `git` auf `PATH` **verweigerte sie einen echten Checkout und behauptete dabei,
er sei „ein Checkout von ETWAS ANDEREM"** — schlimmer als der Defekt, den sie ersetzte, weil ein falsches
Verdikt mit Diagnose mehr Schaden anrichtet als ein verfehltes. PINK hat es eine Sektion nach der Kritik
derselben Gestalt in meiner Spur geschrieben und nur deshalb nicht ausgeliefert, weil es eine Umgebung
getestet hat, für die es nicht entworfen war.

> **A-G503 (PINKs Regel):** ***Eine Wache darf auf eine negative Antwort verweigern und niemals auf eine
> fehlende. Eine unbeantwortbare Frage ist kein fehlgeschlagener Test.***

**Und genau das stand in meinem Code**, in `gelb-paths.mjs`, `evidence-tools.mjs` und `evidence_tools.py`:
jedes `try { git … } catch { refuse }`. Alle drei sind jetzt dreiwertig — ein Nicht-Null-Exit ist eine
Antwort, ein Spawn-Fehler nicht. **Wo ich von PINK abweiche, mit Grund und von PINK überstimmbar:**
`UNVERIFIABLE` verweigert bei mir weiter, weil Fortfahren bei unerstellter Identität genau A-G494
wiederherstellt; richtig ist PINK beim **Verdikt**, nicht bei der Verweigerung. Vier Zustände belegt:
echter Checkout läuft (Exit 0) · git fehlt → *„unanswerable, not answered no"* (Exit 1) · fremdes
Repository → weiter *„NOT of this repository"* (Exit 1) · flacher Klon → *„CANNOT ESTABLISH … SHALLOW"*
(Exit 1).

> **A-G504 (GRÜNs Vorzeichenregel, A-G468 auf Identität angewandt):** ***Flachheit ist „kann nicht
> festgestellt werden", nicht „ist falsch".*** Drei Verweigerungen, drei Ursachen, keine zwei in den Worten
> der anderen.

### §15.13 EIN NEGATIVES ERGEBNIS, GEMESSEN STATT VERSCHWIEGEN

Ich habe die Vakuitätsklasse jagen wollen, nachdem sie meinen eigenen Wächter im ersten Lauf erwischt hatte
(null Behauptungen, zwei grüne Glieder über der leeren Menge). Ein Scan zählte **38 Testdateien**, die eine
Population aus dem Repository ableiten und dann „keine Verstöße" behaupten, davon viele „ohne
Vakuitätsglied".

***DAS WAR MEIN DETEKTOR, NICHT DER BEFUND.*** Er zählte nur `toBeGreaterThan`, während dieses Repository
`toContain("<benanntes Mitglied>")` benutzt — **das stärkere Mittel**. Entschieden durch Injektion statt
durch grep: ein barer Gemini-SDK-Aufruf in einer **neuen** Datei und eine Shared-Server-URL in einer
**neuen** Datei wurden beide gefangen, namentlich. **Die Klasse ist hier nicht vorhanden**, und ein per
grep gemeldeter Verdacht wäre der siebte weitergegebene Befund gewesen.

### §15.14 DIE NAHT GESCHLOSSEN, UND EIN RISIKO, DAS GRÜN AN SICH SELBST GEMELDET HAT

Vier Merges in die Integration, kein Merge nach `main`: der Register-Branch (zweimal, inklusive F-G11),
GRÜNs Tip `3a1d3c0f` (bringt `gruen-paths.mjs`, das im integrierten Stand **fehlte**) und PINKs Tip
`65fd25ed`. **PINKs Ebene als GANZER Tip genommen, auf PINKs eigene Messung hin:** die Ebene ohne
`mapping-phase-pink-tools/` scheitert mit `ERR_MODULE_NOT_FOUND` am ersten Instrument, und ohne die
versiegelte Generation kann `--verify` gar nicht laufen (Exit 2) — **also genau der gut versiegelte
Waisenzustand, gegen den der Generationsnachweis existiert.**

**GRÜN hat ein Risiko gemeldet, das es selbst erzeugt hat, und das ist das richtige Verhalten:** es hat
seine Klon-Experimente im **geteilten** Session-Scratchpad unter dem generischen Namen `shallow` laufen
lassen und mit `rm -rf` begonnen; später verschwand der Arbeitsbaum seines eigenen Klons zwischen zwei
Befehlen. **Spuren dürfen keinen Scratchpad-Namensraum ohne Spur-Präfix teilen.** Ich habe meine
Experimente danach konsequent als `gelb-*` benannt. Diese Aufzeichnung hat acht Harness-Fehler gezählt;
dies ist der erste, den eine **Fremdspur an sich selbst** gemeldet hat, bevor er jemandem geschadet hat.

### §15.15 A-G505 — DIE NOVELLE, DIE GRÜN AN MICH ROUTIERTE, UND DER MUTANT, DER MICH WIDERLEGT HÄTTE

GRÜN hat `B-7` und `B-F7` als **grün über zwei Support-Modulen** gemessen, die ihre eigenen Sätze verbieten,
und zwei Formulierungen angeboten: die Glieder auf ihren Bereich schließen (wie §8(6)) oder
`test/support/mapping/**` aus der Kategorie ausnehmen. **Ich habe keine von beiden genommen.**

Schließen widerspricht einer schon getroffenen Entscheidung — A-G485s eigener Kommentar sagt, diese Glieder
seien bewusst offen gelassen *„als laufende Schutzmaßnahmen statt als Messungen der Phase"*. Ausnehmen
blendet die Kategorie dauerhaft für ein Verzeichnis, das echte Mapping-Fixtures hält — ein schlimmeres Loch
als F-G9.

**Die dritte Antwort kommt aus §95, das GRÜN einen Absatz vorher für den umgekehrten Zweck zitiert hatte:**

> **A-G505:** ***Eine laufende Schutzmaßnahme darf eine Änderung verbieten, die kein späteres Phase-Entry-Set
> autorisiert. Sie darf keine Änderung verbieten, die ein späteres Entry-Set autorisiert — das ist keine
> Grenze, das ist ein Einfrieren.***

Also: alle drei Glieder wächtern die Kategorie, `B-7` subtrahiert `F_ENTRY ∪ G_ENTRY`, `B-F7` subtrahiert
`G_ENTRY`. **GRÜN hat angewendet statt abgelehnt und fünf Mutanten gefahren, darunter den, um den ich
ausdrücklich gebeten hatte — den, der mich widerlegt hätte:** eine weitere Änderung an der durch `G_ENTRY`
autorisierten `vectors.ts` bleibt **32/32 grün**. Eine unautorisierte Fixture in einer **neuen** Datei macht
**drei Glieder rot**, wo dieselbe Datei vorher 32/32 passierte. `vectors.ts` aus `G_ENTRY` entzogen → **vier
Glieder rot**: die Subtraktion arbeitet.

**Und GRÜN hat präzisiert, was ich lose gesagt hatte.** `G_ENTRY` ist **selbstgewährend** — das
Änderungssatz-Glied prüft Teilmenge, nicht Minimalität. ***A-G505 kauft also OFFENLEGUNG, NICHT VERBOT:***
mehr als die drei Literale kauften (Unsichtbarkeit), weniger als ein Verbot. GRÜN hat das in die Datei und
in beide Dokumente geschrieben, **damit die stärkere Lesart nicht durch Auslassung stehen bleibt**, und ein
`AUTHORISED_FIXTURE_CHANGES`-Verzeichnis daneben gestellt, in beide Richtungen geprüft — eine neue
Autorisierung kostet jetzt zwei bewusste Edits, und der zweite muss den Grund tragen.

**Und GRÜNs eigener Satz darüber ist der schärfste des Austauschs:** es hatte §95 in der Hand und hat es
**einmal** benutzt.

### §15.16 F-R14 UND F-R15 — ***EIN SIEGEL, DAS NIE EIN BYTE GEPRÜFT HAT, UND MEIN ZÄHLER WAR FÜR 62% BLIND***

**F-R14.** `lens-owner-bfe0d27`s Manifest listet **14 Einträge, und keiner existiert**: es benennt sie unter
`owner-bfe0d27/`, während die **sieben** verfolgten Dateien der Venue in deren Wurzel liegen. *** SHA256SUM
-C HAT DORT NIE EIN BYTE GEPRÜFT, UND SEIN EXIT-CODE SIEHT AUS WIE BEI EINER MANIPULIERTEN DATEI. ***

Gefunden, weil ich meinem **eigenen** Zähler misstraut habe: `sha256sum` schreibt `": FAILED"` bei
Byte-Abweichung und `": FAILED open or read"` bei einer Datei, die es nicht findet. **Ich habe das zweite
zweimal in diesem Mandat als das erste gemeldet** — „14 genuinely failed". Richtig gemessen: ***null
Inhaltsabweichungen im ganzen Repository***, und alle 14 Einträge unauflösbar.

**Das ist A-G499s Dual.** A-G499 sagt, eine Prüfsumme beantworte *„ist diese Venue in sich konsistent?"* und
niemals *„beschreibt sie den Build, den sie behauptet?"*. F-R14 ist die Stufe davor: **eine Prüfsumme, die
ihre Dateien nicht findet, beantwortet gar nichts und verweigert trotzdem wie ein Verdikt.** Und der Grund
meines Fehlers ist genau die Regel, die GRÜN und PINK mir in dieser Runde gegeben haben: *„FAILED open or
read"* ist **kann nicht festgestellt werden**, nicht **ist falsch** (A-G503/A-G504). *** ICH HABE IHRE REGEL
AUF IHREN CODE ANGEWANDT UND NICHT AUF MEINEN EIGENEN ZÄHLER. ***

Reparatur ist außer Scope — sie heißt: ein gefrorenes Manifest editieren. Also ist die Venue eine
**deklarierte, datierte Ausnahme mit ihren gemessenen Fakten**, vollständig verbraucht: wird sie je
repariert, wird die Deklaration **rot**.

**F-R15, und das ist der schwerere Befund.** Das neue Glied war rot — *aus dem richtigen Grund auf dem
falschen Weg*: mein Parser verlangte das `./`-Präfix, der Parse ergab für diese Venue **null** Einträge, und
**`[].every(...)` ist vakuant wahr**, weshalb das Veraltungsglied eine kaputte Venue für **repariert**
erklärte.

Dem Rot nachzugehen fand denselben Regex in `portable-rewrite.mjs` — ***wo er die VERWEIGERUNGSMENGE FÜR
VERSIEGELTE DATEIEN baut.*** Gemessen: **1082 von 1746 Einträgen in 63 von 101 Manifesten stehen ohne
`./`**. Die Menge enthielt **665**. *** MEIN REWRITER WAR FÜR 62% JEDES SIEGELS IM REPOSITORY BLIND, ZWEI
INSTRUMENTE IN SEINER EIGENEN POPULATION EINGESCHLOSSEN. *** Der `--apply`-Lauf hat kein versiegeltes
Instrument angefasst — aber nur, weil keines der beiden einen maschinenlokalen Pfad in einer Form trägt, die
der Rewriter matcht. **Glück, keine Wache.**

**Es ist GRÜNs F-G5 noch einmal, in meinem eigenen Code:** der Mechanismus wächterte eine **Form**, wo sein
Satz eine **Kategorie** nannte. Beide Formen werden jetzt akzeptiert, der Parse wird **gegen die Zahl der
Digest-Zeilen** geprüft, und ein Manifest mit Digests, das zu nichts parst, ist eine **Verweigerung** statt
einer leeren Menge — denn genau so sah dieser Defekt von innen aus: **Stille, die sich als „hier ist nichts
versiegelt" liest.** Nach der Reparatur: Zensus **1746**, und meine eigene Shell-Schätzung von 1747 war die
ungenaue.
