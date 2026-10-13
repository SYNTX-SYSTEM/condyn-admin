"use client";

import React, { useRef } from "react";
import { SIL_TOKENS } from "./SILTokens";

/**
 * SYNTX field selector (application shell, not field logic).
 *
 * One system, two fields: the CAPABILITY FIELD and the JOB FIELD as two equal options on one membrane, centred in the upper
 * application area. Exactly one field is active; selecting the active one changes nothing. Each option is lit in its own field's
 * tone (the Capability cyan, the Job Field azure). Keyboard: Tab reaches the options, Enter / Space selects, ←/→ (and Home / End)
 * move the selection between the two fields. Reduced motion: no transition.
 *
 * Contract kept from the field-state strip it replaces: `field-focus-strip` (`data-field-focus`) holding exactly two buttons,
 * `field-focus-capability-btn` and `job-pool-panel-toggle`, each with `data-field-focus-active` and `aria-pressed`.
 */
export type SyntxFieldFocus = "CAPABILITY" | "FIELD";

const TONE: Record<SyntxFieldFocus, string> = { CAPABILITY: "56, 229, 255", FIELD: "92, 200, 255" };

export const SYNTX_FIELD_SELECTOR_CSS = `
@keyframes syntxFieldVeil { from { opacity: .9; } to { opacity: 0; } }
[data-testid="field-focus-strip"] button::before { content: none; display: none; }
[data-testid="field-focus-strip"] button:active { transform: none; }
[data-testid="field-focus-strip"] button[data-field-focus-active="false"]:hover { color: rgba(226, 244, 252, 0.94); border-color: rgba(var(--sx-tone), 0.3); background: rgba(var(--sx-tone), 0.06); }
[data-testid="field-focus-strip"] button[data-field-focus-active="false"]:hover > [data-sx-lamp] { border-color: rgba(var(--sx-tone), 0.8); }
[data-testid="field-focus-strip"] button:focus-visible { outline: 1px solid rgba(var(--sx-tone), 0.85); outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) {
  [data-testid="field-focus-strip"], [data-testid="field-focus-strip"] *, [data-sx-field-veil] { transition: none !important; animation: none !important; }
}
`;

export function SyntxFieldSelector({ focus, groupLabel, capabilityLabel, jobLabel, onSelect }: { focus: SyntxFieldFocus; groupLabel: string; capabilityLabel: string; jobLabel: string; onSelect(next: SyntxFieldFocus): void }) {
  const buttons = useRef<Record<SyntxFieldFocus, HTMLButtonElement | null>>({ CAPABILITY: null, FIELD: null });
  const options: Array<{ id: string; focus: SyntxFieldFocus; label: string }> = [
    { id: "field-focus-capability-btn", focus: "CAPABILITY", label: capabilityLabel },
    { id: "job-pool-panel-toggle", focus: "FIELD", label: jobLabel }
  ];
  const select = (next: SyntxFieldFocus) => { if (next !== focus) onSelect(next); };
  const onKeyDown = (event: React.KeyboardEvent) => {
    const next: SyntxFieldFocus | null = event.key === "ArrowLeft" || event.key === "Home" ? "CAPABILITY" : event.key === "ArrowRight" || event.key === "End" ? "FIELD" : null;
    if (next === null) return;
    event.preventDefault();
    select(next);
    buttons.current[next]?.focus();
  };
  return (
    <div
      data-testid="field-focus-strip"
      data-field-focus={focus}
      data-sx-shell="selector"
      role="group"
      aria-label={groupLabel}
      style={{ position: "fixed", left: "50%", top: "70px", transform: "translateX(-50%)", zIndex: 60, display: "flex", alignItems: "center", padding: "4px", borderRadius: "999px", border: "1px solid rgba(120, 214, 255, 0.22)", background: "linear-gradient(180deg, rgba(8, 20, 33, 0.88), rgba(3, 8, 15, 0.92))", boxShadow: "0 0 0 1px rgba(3, 8, 16, 0.6), 0 10px 28px rgba(0, 0, 0, 0.55), 0 0 26px rgba(56, 229, 255, 0.08), inset 0 1px 0 rgba(200, 245, 255, 0.1)", backdropFilter: "blur(10px)", fontFamily: SIL_TOKENS.typography.mono }}
    >
      <style>{SYNTX_FIELD_SELECTOR_CSS}</style>
      <span aria-hidden="true" style={{ position: "absolute", left: "28px", right: "28px", top: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(150, 236, 255, 0.5), transparent)", pointerEvents: "none" }} />
      {options.map((option, index) => {
        const active = focus === option.focus;
        const tone = TONE[option.focus];
        return (
          <React.Fragment key={option.id}>
            {index > 0 && (
              <span aria-hidden="true" style={{ position: "relative", display: "flex", alignItems: "center", width: "26px", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ width: "26px", height: "1px", background: "linear-gradient(90deg, rgba(56, 229, 255, 0.35), rgba(92, 200, 255, 0.35))" }} />
                <span style={{ position: "absolute", width: "3px", height: "3px", borderRadius: "50%", background: "rgba(170, 232, 255, 0.8)", boxShadow: "0 0 6px rgba(120, 220, 255, 0.8)" }} />
              </span>
            )}
            <button
              type="button"
              ref={element => { buttons.current[option.focus] = element; }}
              data-testid={option.id}
              data-field-focus-active={active ? "true" : "false"}
              aria-pressed={active}
              onClick={() => select(option.focus)}
              onKeyDown={onKeyDown}
              style={{ "--sx-tone": tone, position: "relative", display: "inline-flex", alignItems: "center", gap: "9px", padding: "9px 18px 9px 14px", borderRadius: "999px", border: `1px solid ${active ? `rgba(${tone}, 0.72)` : "transparent"}`, background: active ? `radial-gradient(120% 170% at 50% 0%, rgba(${tone}, 0.26), rgba(${tone}, 0.08) 62%, rgba(${tone}, 0.03))` : "transparent", boxShadow: active ? `0 0 18px rgba(${tone}, 0.24), inset 0 1px 0 rgba(220, 250, 255, 0.24), inset 0 0 14px rgba(${tone}, 0.12)` : "none", color: active ? "#effcff" : "rgba(168, 204, 222, 0.7)", textShadow: active ? `0 0 10px rgba(${tone}, 0.5)` : "none", fontFamily: SIL_TOKENS.typography.mono, fontSize: "10.5px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", whiteSpace: "nowrap", cursor: active ? "default" : "pointer", transition: "background 0.45s ease, color 0.45s ease, box-shadow 0.45s ease, border-color 0.45s ease, text-shadow 0.45s ease" } as React.CSSProperties}
            >
              <span data-sx-lamp aria-hidden="true" style={{ width: "7px", height: "7px", boxSizing: "border-box", borderRadius: "50%", flexShrink: 0, border: `1px solid rgba(${tone}, ${active ? 1 : 0.45})`, background: active ? `rgb(${tone})` : "transparent", boxShadow: active ? `0 0 8px rgba(${tone}, 0.95), 0 0 2px #ffffff` : "none", transition: "background 0.45s ease, box-shadow 0.45s ease, border-color 0.45s ease" }} />
              {option.label}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}
