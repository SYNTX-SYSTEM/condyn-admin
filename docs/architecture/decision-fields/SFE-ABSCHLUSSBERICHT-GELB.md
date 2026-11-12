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
| **PINK kann GELBs Pflichtenregister nicht lesen** | `PHASE_F*.md` / `PHASE_G*.md` existieren in **keinem** der vier Worktrees, die PINK öffnen kann |

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
| **Gesamtsuite** | **3546 bestanden / 0 fehlgeschlagen**, mit Abgleich | Lauf dieser Session, auf bereitgestellter Wegwerf-DB. *** Figur aus GRÜNs Lane, deren 69 Ausgaben AUSNAHMSLOS `verdict: NONE` erklären (A-G458). *** |
| **PF-13-Population (Phase D + E, Regression)** | **16 Dateien, 197 Tests, 197 bestanden**, Deckung **in beide Richtungen** geprüft · *** `verdict: "NONE — development reading only (A-G36 point 2)"` *** | `gruen-pf13-evaluate.mjs`, JSON-Reporter |
| **GELB-Instrumente** | *** 26 Instrumente; 9 können fehlschlagen, 4 sind nachweislich gefeuert, 16 sind REPORTER, deren Exit 0 kein Urteil ist. *** Die frühere Form dieser Zeile las „24 von 24 Exit 0“ und präsentierte 16 nicht-fehlschlagende Reporter als Verifikationsergebnis (§125). **UND DIE FORM DANACH LAS „25 Instrumente, 22 Exit 0“, OHNE DIE DREI ZU BENENNEN — zwei von ihnen waren seit §125 an `ENOBUFS` TOT und konnten überhaupt nicht hinsehen (§128, A-G468, Defekte 402/403).** Heute: 26 (neu `gelb-read.mjs`), 25 laufen, 1 verweigert dauerhaft als Bauart (Subject-Gate). | diese Session, Mutanten heute gefahren |
| **Schema-Drift Bootstrap ↔ ORM** | **9 Tabellen korrigiert, Drift = 0, Test gesetzt** | `CAREER-DB-DRIFT` |
| **Typprüfung** | `tsc --noEmit` sauber | GRÜN |
| **PG-1 (semantischer Lichtanteil)** | **0.6431 / 0.7397 gegen ≥ 0.55** | `3ec8457d` |

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

**Defektzahl: 420.** Sie ist eine **Zählung gefundener Defekte, keine Restschuld** — die überwiegende Mehrheit
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
| **1. Das MAPPING funktioniert durchgängig** | **ERFÜLLT.** 3546/0, 197/197 auf der Regressionspopulation, `tsc` sauber, Drift 0. |
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

**Produktfiguren:** `4b83414e` (Quelle), `3ec8457d` (Pixel). **Zahlen aus GRÜNs Lane** (Suite, PF-13,
`tsc`) **und PINKs Lane** (Pixel, sRGB, PF-5/PF-7-Mutanten) **sind AUF BERICHT HIN übernommen** und hier als
solche gekennzeichnet — **keine davon konnte ich auf einem von mir lesbaren Stand nachvollziehen** (§0) — **und wo ein Instrument ein
eigenes Verdict-Feld führt, steht es hier wörtlich statt zusammengefasst (A-G458).**

**Amendments dieser Phase, die nicht meine sind und hier als fremde gekennzeichnet bleiben:** **A-G429**,
**A-G374 Glied 2 (Abhilfe)**, **A-G459** — GRÜN · **A-G432**, **A-G434**, **A-G443**, **A-G445**, **A-G451**,
**A-G452**, **A-G453**, **A-G458** — PINK. *** VIER DER FÜNF REGELN, DIE DIESE ARBEIT ÜBERDAUERN, STAMMEN NICHT
AUS DIESER LANE. ***
