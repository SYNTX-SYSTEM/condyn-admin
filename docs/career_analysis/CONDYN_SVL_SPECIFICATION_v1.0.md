# CONDYN SVL: Semantic Visualization Language v1.0 — Architecture Specification

**Version:** 1.0.0  
**Status:** Official Protocol Standard  
**Domain:** CONDYN Career Analysis Framework  

Die visuelle Grammatik von CONDYN ist kein dekoratives UI-Thema, sondern eine formale, überprüfbare **visuelle Sprache (Semantic Visualization Language)** im Bedeutungsraum.

---

## 🛑 Architektonischer Leitsatz: Das Semantic Consistency Principle

> [!IMPORTANT]
> **Semantic Consistency Principle (CONDYN Protocol v1.0, SVL-0):**
> Die visuelle Grammatik ist Bestandteil des CONDYN-Protokolls. Änderungen an Form, Farbe, Größe, Bewegung oder räumlicher Kodierung gelten als **Architekturänderungen** und unterliegen denselben TDD-, Code-Review- und Verifikationsanforderungen wie Änderungen an der Ontologie, den Validierungs-Pipelines oder der Repository-Schicht.

---

## 🏛️ Formale Design-Invarianten (SVL-I)

| Invariante | Formale Definition | Verifikationsregel |
| :--- | :--- | :--- |
| **SVL-I1** | **Singuläre Primitiv-Semantik:** Jedes visuelle Primitiv besitzt genau eine primäre semantische Bedeutung. | Form = Ontologie, Farbe = Kategorie. Niemals Form für Status verwenden! |
| **SVL-I2** | **Nicht-Redundante Kodierung:** Eine semantische Eigenschaft wird niemals ausschließlich über zwei verschiedene visuelle Primitive codiert. | Gewicht ist `size/border`, nicht noch Farbe. |
| **SVL-I3** | **Anti-Täuschung:** Dekorative Elemente dürfen keine semantische Information vortäuschen. | Kein Glow, Schatten oder Rahmen ohne ontologische Ursache. |
| **SVL-I4** | **Zustands-Exklusivität von Bewegung:** Animation repräsentiert ausschließlich Zustandsänderungen oder aktive Simulationen. | Statische Knoten bewegen oder blinken im Ruhezustand niemals. |
| **SVL-I5** | **Primat des Bedeutungsraums:** Der semantische Bedeutungsraum besitzt immer höhere Priorität als dekorative Ästhetik. | Lesbarkeit, Dichte und Distanz gehen vor optischen Effekten. |

---

## 🔗 SVL-1: Ontology vs. State Separation & State Grammar

Ontologische Eigenschaften (unveränderlich) und dynamische Zustände werden streng getrennt und nutzen niemals dieselben visuellen Primitive:

### 1.1 Ontologische Eigenschaften (Immutable)
* **Form (Silhouette):**
  * 🟦 **Capability:** Geometrisches Hexagon
  * 🟨 **Role:** Horizontale Kapsel / Pill (`borderRadius: "9999px"`)
  * 🟩 **Organization:** Monolithischer Server-Blade (vertikaler Smaragd-Akzent links, `borderRadius: "4px"`)
  * ⚪ **Opportunity:** Kreis / Zylinder
  * 🔶 **Strategy:** Raute / Diamant
  * 📄 **Evidence:** Papierkarte mit Marker
* **Farbe (Domäne/Kategorie):** `#58a6ff` (Capability), `#3fb950` (Org), `#d29922` (Role).
* **Grundgröße & Masse:** Skaliert durch `data.weight` (Multi-dimensionale Skalierung auf Größe, Border-Stärke 1->3px und Z-Index).

### 1.2 Dynamische State Grammar (SVL-2)

| Zustand | Visuelles Regelwerk (Exklusiv für States) |
| :--- | :--- |
| **Normal** | Ruhestellung; opake Grundfarbe, matter Obsidian-Hintergrund, kein Glow. |
| **Focused / Hover** | Subtiler farblicher Fokus-Halo (`box-shadow: 0 0 12px <colorToken>66`), Cursor `pointer`. |
| **Selected** | Kontraststarker weißer Outer-Ring (`border: 2px solid #ffffff`), Z-Index `1000`, Inspector aktiv. |
| **Compared** | Split-Border oder vergleichendes Opazitäts-Fading der Nicht-Ziele. |
| **Diff Added** | Smaragdgrünes Pulsieren (`#238636`), Plus-Badge oben rechts. |
| **Diff Removed** | Rubinrotes Fading (`#da3633`), gestrichelte Außenkontur, Durchstreichung. |
| **Similarity Match** | Cyanfarbener Resonanz-Ring (`#39c5bb`), proportionaler Ähnlichkeits-Score-Badge. |
| **Disabled / Muted** | Opazität auf `0.25` reduziert, Grayscale-Filter, keine Interaktivität. |

---

## 📐 SVL-3: Typografie-Hierarchie & Lesbarkeit

Der Mensch erfasst Identität vor Ontologie:

```text
PRINCIPAL EDGE SYSTEMS ARCHITECT          ← 1. Identität (Huge, 20-22px, Bold, #f0f6fc)
ROLE  •  ID: ROL_001                      ← 2. Ontologie & ID (Badge 10px Monospace, Accent)
Ring: Target Roles  |  Weight: 92%        ← 3. Technische Metadaten (11px Monospace, #8b949e)
Verified structural member of canonical...  ← 4. Semantische Beschreibung (12-13px, Line-Height 1.6)
```

---

## ⚡ SVL-4: Motion & Edge Semantics

### 4.1 Linienqualität der Relationen (Kanten als Informationsträger)
Kanten bezeichnen ihre semantische Natur nicht nur per Label (Strict Priority: `relationType` ➔ `label` ➔ `CONNECTED_TO`), sondern direkt durch die Linienqualität:

| Kanten-Stil | Semantischer Relationstyp | Linien-Spezifikation |
| :--- | :--- | :--- |
| `solid` | **Structural / Canonical** (`PART_OF`, `OWNS`, `HAS_ROLE`) | Volllinie, opak, `strokeWidth` proportional zu Kraft |
| `dashed` | **Derived / Implemented** (`IMPLEMENTS`, `REQUIRES`) | Gestrichelt (`strokeDasharray: "5 5"`) |
| `dotted` | **Weak Evidence / Inferred** (`SUGGESTED_BY`, `RELATED_TO`) | Gepunktet (`strokeDasharray: "2 2"`), Opazität 0.6 |
| `double` | **Bidirectional / Synergistic** (`SYNERGIZES`, `MUTUAL`) | Doppelstrang-Kontur oder parallele Linien |
| `animated` | **Live Transition / Active Flow** (`GENERATES`, `EXECUTES`) | Fließende Dash-Animation (`animated: true`) |

---

## 🌌 SVL-5: Spatial Grammar, LOD Zoom & Semantic Layers

### 5.1 Level-of-Detail (LOD) Zoom-Stufen
Um visuelles Rauschen bei 100 bis 500 Knoten zu eliminieren, reagiert das Rendering dynamisch auf die Zoomstufe:
* **Zoom 10 % (Macro Space):** Ausschließlich Silhouetten, Grundfarben und Cluster-Halos. Zero Text!
* **Zoom 30 % (Topology):** Dominante Identitäts-Labels centraler Knoten erscheinen.
* **Zoom 60 % (Structure):** Typ-Badges, Kantenbezeichnungen und Ring-Umrisse werden sichtbar.
* **Zoom 100 % (Standard):** Vollständige Metadaten, Gewichte und Standard-Tooltips.
* **Zoom 200 % (Micro Evidence):** Krypto-Stempel, vollständige Beweis-Snippets und Integritäts-Hashes an der Entität.

### 5.2 Die 7 Semantic Layers (Z-Stacking ohne Konflikte)
1. **Layer 1: Space** — Radialer Hintergrund, Dot-Grid, Domänenräume & Resonanzfelder.
2. **Layer 2: Edges** — Kanten, Linien, Graphenverbindungen.
3. **Layer 3: Nodes** — Entitäts-Silhouetten, Server-Blades, Kapseln.
4. **Layer 4: Labels** — Entitätsnamen und Kantenbeschriftungen im Blueprint-Stil.
5. **Layer 5: Badges** — Typ-Badges, Ähnlichkeits-Scores, Status-Icons.
6. **Layer 6: Selection** — Aktiver Fokus-Ring, Hover-Halos, Verbindungslinien zum Inspector.
7. **Layer 7: Telemetry** — Linke Pipeline-Timeline, rechter Semantic Object Inspector, schwerelose Minimap.

### 5.3 Räumliche Grammatik (Bedeutungsraum - Vorbereitung Step 14)
Die Topologie gliedert sich strikt hierarchisch:
`Semantic Space ➔ Domains ➔ Clusters ➔ Entities ➔ Relations ➔ Evidence`

---

## ♿ SVL-6: Accessibility & Robuste Semantik
Semantik muss auch ohne Farbempfinden zu 100 % dekodierbar sein:
* **Form-Trennung:** Die Silhouetten (Hexagon vs. Kapsel vs. Blade) garantieren ontologische Unterscheidung in Grayscale.
* **Linienstärke & Textur:** Das Strichelungs-Muster (`solid`, `dashed`, `dotted`) sichert die Relationserfassung ohne Farbangabe.
* **Kontrast:** Alle Identitäts-Labels erfüllen mindestens WCAG AAA Kontrast (`#f0f6fc` auf Obsidian `#0a0d14`).
