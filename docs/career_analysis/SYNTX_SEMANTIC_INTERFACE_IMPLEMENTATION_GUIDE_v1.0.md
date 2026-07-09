# CONDYN / SYNTX — Semantic Interface Language (SIL) Implementation Guide v1.0

Dieses Leitfadendokument übersetzt die in `SYNTX_SEMANTIC_INTERFACE_LANGUAGE_v1.0.md` definierte visuelle Grammatik in konkrete React-Komponenten und semantische Räume für `/career/demo`.

---

## 1. Komponenten-Mapping (Alt $\rightarrow$ Neu)

| Bisherige Panel-Box (Alt) | Neue Organische SIL-Komponente (Neu) | Semantische Funktion im Raum |
| :--- | :--- | :--- |
| `SourceSummaryPanel.tsx` | **`IdentityCoreNode.tsx`** | Das Zentrum des Feldes: Die verifizierten Ursprungsquellen und die kryptografische Signatur der Person. |
| `CapabilityEvidencePanel.tsx` | **`CapabilityField.tsx`** | Strahlende Ausdehnung des Kerns: Erkannte Fähigkeiten als aktives semantisches Kraftfeld. |
| `CompanyMatchPanel.tsx` | **`ResonanceOrbits.tsx`** | Konzentrische Resonanzbahnen: Organisationen schwingen auf bestimmten Radien synchron zum Kern. |
| `RoleMatchPanel.tsx` | **`RoleManifestation.tsx`** | Manifestierte Knoten auf den Resonanzbahnen: Konkrete Rollen und prozentualer Alignment-Grad. |
| `RecommendationPanel.tsx` (Gaps) | **`TensionLayer.tsx`** | Semantische Spannungen / Distanzen: Fehlen von Nachweisen als bernsteinfarbene Potenzialfelder. |
| `RecommendationPanel.tsx` (Actions) | **`EvolutionLayer.tsx`** | Aufstrebende Symmetriepfade: Konkrete Transformationsschritte zur Anhebung der Resonanz. |
| `CareerIntelligenceDashboard.tsx` | **`CareerIntelligenceDashboard.tsx` (SIL v1.0)** | Orchestrator des gesamten fließenden Bedeutungsraums (`#030508`). |

---

## 2. Raumaufbau & Informationsfluss

Der Raum wird nicht mehr in ein Grid aus Kästen zerlegt, sondern folgt einer vertikalen semantischen Hauptachse:

```text
===================================================================================
 [ IDENTITY CORE ]        Verifizierte Ursprungsquellen (GitHub, PDF, Website)
        │
        ▼  (Ausstrahlung)
 [ CAPABILITY FIELD ]     Aktives Feld der erkannten Fähigkeiten & Domänen
        │
        ▼  (Synchronisation)
 [ RESONANCE ORBITS ]     Organisationen auf synchronen Bahnen (92% / 88% Fit)
        │
        ▼  (Manifestation)
 [ ROLE MANIFESTATION ]   Rollen-Alignment auf den Orbits (94% / 87% Fit)
        │
        ▼  (Spannungsfeld)
 [ TENSION & EVOLUTION ]  Lücken (DO-178C, MIL-STD) & auflösendes Wachstum
===================================================================================
```

---

## 3. Farb- und Designtokens

```ts
export const SIL_TOKENS = {
  colors: {
    void: "#030508",         // Das ruhende Fundament des Raumes
    field: "#0a0e14",        // Subtile Orientierungslinien und Ruhezustände
    borderQuiet: "#182230",  // Feine Abgrenzungslinien im Feld
    cyanActive: "#38e5ff",   // Aktive Resonanz / SYNTX Kernenergie
    cyanGlow: "rgba(56, 229, 255, 0.18)", // Aura um verifizierte Knoten
    textPrimary: "#e6f1f8",  // Identitäts- und Rollennamen
    textMuted: "#63788a",    // Hashes, Metadaten und Kontext
    tensionAmber: "#f5a623", // Semantische Spannung (Capability Gap)
    evolutionGreen: "#3fb950"// Wachstum und Resonanzanhebung
  },
  typography: {
    mono: "var(--font-mono, 'JetBrains Mono', monospace)",
    sans: "var(--font-sans, system-ui, -apple-system, sans-serif)"
  }
};
```

---

## 4. Bewegungsregeln (Kinetic Rules)

1. **Kein dekoratives Gezappel**: Keine ablenkenden Bouncing- oder Spinning-Animationen.
2. **Resonanz-Glow**: Knoten mit Fit $\ge 90\%$ tragen einen leuchtenden Cyan-Glow (`SIL_TOKENS.colors.cyanGlow`).
3. **Flussachsen**: Sanfte vertikale Verbindungslinien („Energy Conduits“) verbinden die 6 Schichten visuell miteinander.

---

## 5. Responsiveness & Zugänglichkeit

- Der semantische Fluss passt sich nahtlos an Desktop- (zentrierte Energieachse, breite Orbits) und mobile Viewports an.
- Alle Farbkontraste erfüllen WCAG-AA Kriterien auf tiefem `#030508` Hintergrund.

---

## 6. Teststrategie & Strikte Grenzen

- 100% Client-Safe: Keinerlei Backend-Imports (`schema`, `validator`, `repository`, etc.).
- Verifikation über `test/career-demo-ui.test.tsx` und Vollregression aller 34 Suiten via `npm test`.
