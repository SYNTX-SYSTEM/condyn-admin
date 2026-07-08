/**
 * CONDYN / SYNTX — Semantic Interface Language (SIL) Tokens v1.0
 * (`app/components/career/demo/SILTokens.ts`)
 *
 * 100% Client-Safe design tokens derived from the official SYNTX Emblem.
 */

export const SIL_TOKENS = {
  colors: {
    void: "#030508",         // Das ruhende Fundament des Raumes
    field: "#0a0e14",        // Subtile Orientierungslinien und Ruhezustände
    fieldBorder: "#141c26",  // Feine, semantisch ruhende Abgrenzungen im Feld
    cyanActive: "#38e5ff",   // Aktive Resonanz / SYNTX Kernenergie
    cyanGlow: "rgba(56, 229, 255, 0.18)", // Aura um verifizierte Knoten
    cyanGlowStrong: "rgba(56, 229, 255, 0.35)", // Starke Resonanzaura
    textPrimary: "#e6f1f8",  // Identitäts- und Rollennamen
    textMuted: "#63788a",    // Hashes, Metadaten und Kontext
    tensionAmber: "#f5a623", // Semantische Spannung (Capability Gap)
    tensionGlow: "rgba(245, 166, 35, 0.15)", // Spannungsfeld
    evolutionGreen: "#3fb950", // Wachstum und Resonanzanhebung
    evolutionGlow: "rgba(63, 185, 80, 0.15)" // Wachstumsaura
  },
  typography: {
    mono: "var(--font-mono, 'JetBrains Mono', monospace)",
    sans: "var(--font-sans, system-ui, -apple-system, sans-serif)"
  }
};
