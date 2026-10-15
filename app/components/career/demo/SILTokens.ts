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

/**
 * One typography for every red EMPTY_PROJECTION_ATTENTION state of the Capability Field (owner mandate 2026-10-13):
 * the status line, the heading, the explanation and the orbit mark of the focused copy, and the identity labels of a red
 * body (OrbitalResonanceBubble). Hues stay as they were (red status, white heading, orbit accent); only lightness, weight,
 * tracking and leading change, so an explained empty projection reads clearly and stays distinct from an error.
 */
export const SIL_RED_FIELD_TYPE = Object.freeze({
  status: { fontSize: "10px", lineHeight: "14px", fontWeight: 700, letterSpacing: "2.4px", color: "rgba(255, 128, 136, 1)", textShadow: "0 0 8px rgba(255, 56, 68, 0.55)" },
  heading: { fontSize: "16px", lineHeight: 1.25, fontWeight: 800, letterSpacing: "1.2px", color: "#f4fafd" },
  body: { fontSize: "12px", lineHeight: 1.6, fontWeight: 400, letterSpacing: "0.2px", color: "rgba(214, 230, 240, 0.92)" },
  mark: { fontSize: "9px", lineHeight: "12px", fontWeight: 600, letterSpacing: "1.6px", opacity: 0.92 },
  bodyStage: { color: "rgba(214, 230, 240, 0.9)" },
  bodyCaption: { color: "rgba(200, 220, 232, 0.9)", fontWeight: 500 },
  bodyState: { color: "rgba(190, 212, 226, 0.86)", fontWeight: 600 }
} as const);
