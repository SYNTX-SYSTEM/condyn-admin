"use client";

import React, { useRef } from "react";
import { SIL_TOKENS } from "./SILTokens";
import { INVESTIGATION_MODES, type InvestigationMode } from "../../../../lib/career/job-pool/investigation-mode";

/**
 * The investigation boundary of the application shell (owner GO "DEMO FRONTEND", 2026-10-15): PERSON · PERSON × JOB · JOB as
 * three equal options on one small membrane, right of the field selector on the shell row (mirroring the job scope on the left),
 * so the chosen boundary stays visible in both fields and at every depth. Exactly one mode is chosen; nothing is inferred.
 * Keyboard: Tab reaches the group, ←/→ (Home / End) move the choice, Enter / Space choose. Static; reduced motion: no transition.
 */
const TONE: Record<InvestigationMode, string> = { PERSON: "56, 229, 255", PERSON_X_JOB: "126, 214, 255", JOB: "92, 200, 255" };

export const SYNTX_INVESTIGATION_SELECTOR_CSS = `
[data-testid="investigation-mode-selector"] button::before { content: none; display: none; }
[data-testid="investigation-mode-selector"] button:active { transform: none; }
[data-testid="investigation-mode-selector"] button[aria-checked="false"]:hover { color: rgba(226, 244, 252, 0.94); background: rgba(var(--sx-tone), 0.07); }
[data-testid="investigation-mode-selector"] button:focus-visible { outline: 1px solid rgba(var(--sx-tone), 0.85); outline-offset: 2px; }
/* Below 1366 px the Capability Field's SEMANTIC GUIDE stands 8 px to the right of the membrane: one step smaller and tighter there, so
 * the membrane is no wider than before the typography sweep (2026-10-20). */
@media (max-width: 1365px) { [data-testid="investigation-mode-selector"] button { font-size: 9.5px !important; letter-spacing: 0.3px !important; padding: 0 7px !important; } }
@media (prefers-reduced-motion: reduce) { [data-testid="investigation-mode-selector"], [data-testid="investigation-mode-selector"] * { transition: none !important; animation: none !important; } }
`;

export interface SyntxInvestigationSelectorCopy {
  group: string;
  modes: Record<InvestigationMode, string>;
  hints: Record<InvestigationMode, string>;
}

export function SyntxInvestigationSelector({ mode, copy, onSelect }: { mode: InvestigationMode; copy: SyntxInvestigationSelectorCopy; onSelect(next: InvestigationMode): void }) {
  const buttons = useRef<Partial<Record<InvestigationMode, HTMLButtonElement | null>>>({});
  const choose = (next: InvestigationMode) => { if (next !== mode) onSelect(next); };
  const onKeyDown = (event: React.KeyboardEvent) => {
    const index = INVESTIGATION_MODES.indexOf(mode);
    const next = event.key === "ArrowLeft" ? INVESTIGATION_MODES[Math.max(0, index - 1)] : event.key === "ArrowRight" ? INVESTIGATION_MODES[Math.min(INVESTIGATION_MODES.length - 1, index + 1)] : event.key === "Home" ? INVESTIGATION_MODES[0] : event.key === "End" ? INVESTIGATION_MODES[INVESTIGATION_MODES.length - 1] : null;
    if (next === null) return;
    event.preventDefault();
    choose(next);
    buttons.current[next]?.focus();
  };
  return (
    <div
      data-testid="investigation-mode-selector"
      data-investigation-mode={mode}
      data-sx-shell="investigation"
      role="radiogroup"
      aria-label={copy.group}
      title={copy.group}
      style={{ position: "fixed", left: "calc(50% + 245px)", top: "94px", transform: "translateY(-50%)", zIndex: 60, display: "flex", alignItems: "center", gap: "2px", boxSizing: "border-box", height: "34px", padding: "3px", borderRadius: "999px", border: "1px solid rgba(120, 214, 255, 0.24)", background: "linear-gradient(180deg, rgba(8, 21, 34, 0.92), rgba(3, 8, 15, 0.95))", boxShadow: "0 0 0 1px rgba(3, 8, 16, 0.6), 0 12px 32px rgba(0, 0, 0, 0.55), 0 0 22px rgba(56, 229, 255, 0.07), inset 0 1px 0 rgba(200, 245, 255, 0.12)", backdropFilter: "blur(10px)", fontFamily: SIL_TOKENS.typography.mono }}
    >
      <style>{SYNTX_INVESTIGATION_SELECTOR_CSS}</style>
      {INVESTIGATION_MODES.map(option => {
        const active = option === mode;
        const tone = TONE[option];
        return (
          <button
            key={option}
            type="button"
            role="radio"
            ref={element => { buttons.current[option] = element; }}
            data-testid={`investigation-mode-${option}`}
            data-investigation-mode-active={active ? "true" : "false"}
            aria-checked={active}
            aria-label={`${copy.modes[option]}: ${copy.hints[option]}`}
            title={copy.hints[option]}
            tabIndex={active ? 0 : -1}
            onClick={() => choose(option)}
            onKeyDown={onKeyDown}
            style={{ "--sx-tone": tone, display: "inline-flex", alignItems: "center", gap: "5px", height: "26px", padding: "0 9px", borderRadius: "999px", border: `1px solid ${active ? `rgba(${tone}, 0.75)` : "transparent"}`, background: active ? `radial-gradient(120% 170% at 50% 0%, rgba(${tone}, 0.3), rgba(${tone}, 0.08) 65%)` : "transparent", boxShadow: active ? `0 0 14px rgba(${tone}, 0.24), inset 0 1px 0 rgba(220, 250, 255, 0.22)` : "none", color: active ? "#f2fdff" : "rgba(176, 210, 228, 0.84)", textShadow: active ? `0 0 10px rgba(${tone}, 0.55)` : "none", fontFamily: SIL_TOKENS.typography.mono, fontSize: "10px", fontWeight: 700, letterSpacing: "0.6px", whiteSpace: "nowrap", cursor: active ? "default" : "pointer", transition: "background 0.35s ease, color 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease" } as React.CSSProperties}
          >
            <span aria-hidden="true" style={{ width: "5px", height: "5px", borderRadius: "50%", flexShrink: 0, border: `1px solid rgba(${tone}, ${active ? 1 : 0.4})`, background: active ? `rgb(${tone})` : "transparent", boxShadow: active ? `0 0 6px rgba(${tone}, 0.9)` : "none" }} />
            {copy.modes[option]}
          </button>
        );
      })}
    </div>
  );
}
