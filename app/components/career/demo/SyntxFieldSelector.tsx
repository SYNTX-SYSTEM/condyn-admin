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
 *
 * Job scope (SFE invariant): the selected job — or its absence — rides on the same shell row, left of the capsule in the
 * column of the left surfaces (`job-scope-indicator`, `data-sx-shell="job-scope"`), so it stays visible in both fields and
 * at every depth. It is outside the strip (the strip keeps exactly two buttons). Static; activating it opens the job.
 */
export type SyntxFieldFocus = "CAPABILITY" | "FIELD";

const TONE: Record<SyntxFieldFocus, string> = { CAPABILITY: "56, 229, 255", FIELD: "92, 200, 255" };

export const SYNTX_FIELD_SELECTOR_CSS = `
@keyframes syntxFieldVeil { from { opacity: .9; } to { opacity: 0; } }
@keyframes syntxFieldSweepRight { from { transform: translateX(-60%); opacity: 0; } 25% { opacity: 1; } to { transform: translateX(160%); opacity: 0; } }
@keyframes syntxFieldSweepLeft { from { transform: translateX(160%); opacity: 0; } 25% { opacity: 1; } to { transform: translateX(-60%); opacity: 0; } }
[data-testid="field-focus-strip"] button::before { content: none; display: none; }
[data-testid="field-focus-strip"] button:active { transform: none; }
[data-testid="field-focus-strip"] button[data-field-focus-active="false"]:hover { color: rgba(226, 244, 252, 0.94); border-color: rgba(var(--sx-tone), 0.3); background: rgba(var(--sx-tone), 0.06); }
[data-testid="field-focus-strip"] button[data-field-focus-active="false"]:hover > [data-sx-lamp] { border-color: rgba(var(--sx-tone), 0.8); }
[data-testid="field-focus-strip"] button:focus-visible { outline: 1px solid rgba(var(--sx-tone), 0.85); outline-offset: 3px; }
[data-testid="job-scope-indicator"]:hover { border-color: rgba(var(--sx-tone), 0.55) !important; background: linear-gradient(180deg, rgba(14, 34, 50, 0.95), rgba(5, 12, 22, 0.96)) !important; }
[data-testid="job-scope-indicator"]:focus-visible { outline: 1px solid rgba(var(--sx-tone), 0.85); outline-offset: 3px; }
[data-testid="job-scope-indicator"]::before { content: none; display: none; }
[data-testid="job-scope-indicator"]:active { transform: translateY(-50%) !important; }
@media (prefers-reduced-motion: reduce) {
  [data-testid="field-focus-strip"], [data-testid="field-focus-strip"] *, [data-sx-field-veil], [data-testid="job-scope-indicator"] { transition: none !important; animation: none !important; }
  [data-sx-field-sweep] { display: none; }
}
`;

/** What the shell shows of the selected job scope; only VALID admits ANALYZE. */
export interface SyntxJobScopePresentation {
  state: "NONE" | "CHECKING" | "VALID" | "INVALID";
  label: string;
  /** The role title when VALID, else the state sentence. */
  title: string;
  /** Organization (and pool) of a VALID scope. */
  detail: string | null;
  /** Accessible description of the activation (open the job / choose a job). */
  hint: string;
}

const SCOPE_TONE: Record<SyntxJobScopePresentation["state"], string> = { VALID: "92, 200, 255", CHECKING: "120, 170, 200", NONE: "255, 190, 92", INVALID: "255, 150, 92" };

function SyntxJobScopeIndicator({ scope, onActivate }: { scope: SyntxJobScopePresentation; onActivate?: () => void }) {
  const tone = SCOPE_TONE[scope.state];
  const valid = scope.state === "VALID";
  return (
    <button
      type="button"
      data-testid="job-scope-indicator"
      data-sx-shell="job-scope"
      data-job-scope-state={scope.state}
      aria-label={`${scope.label}: ${scope.title}${scope.detail ? ` · ${scope.detail}` : ""}. ${scope.hint}`}
      title={`${scope.title}${scope.detail ? ` · ${scope.detail}` : ""}`}
      onClick={() => onActivate?.()}
      style={{ "--sx-tone": tone, position: "fixed", left: "28px", top: "94px", transform: "translateY(-50%)", zIndex: 60, display: "inline-flex", alignItems: "center", gap: "10px", boxSizing: "border-box", height: "40px", maxWidth: "calc(50% - 283px)", padding: "0 16px 0 13px", borderRadius: "999px", border: `1px solid rgba(${tone}, ${valid ? 0.42 : 0.36})`, background: "linear-gradient(180deg, rgba(8, 21, 34, 0.92), rgba(3, 8, 15, 0.95))", boxShadow: `0 0 0 1px rgba(3, 8, 16, 0.6), 0 12px 32px rgba(0, 0, 0, 0.55), 0 0 22px rgba(${tone}, ${valid ? 0.14 : 0.1}), inset 0 1px 0 rgba(200, 245, 255, 0.12)`, backdropFilter: "blur(10px)", color: "#eaf9ff", fontFamily: SIL_TOKENS.typography.mono, cursor: "pointer", textAlign: "left", transition: "border-color 0.3s ease, background 0.3s ease" } as React.CSSProperties}
    >
      <span aria-hidden="true" style={{ width: "7px", height: "7px", boxSizing: "border-box", borderRadius: "50%", flexShrink: 0, border: `1px solid rgb(${tone})`, background: valid || scope.state === "NONE" || scope.state === "INVALID" ? `rgb(${tone})` : "transparent", boxShadow: `0 0 8px rgba(${tone}, 0.8)` }} />
      <span style={{ fontSize: "9.5px", fontWeight: 700, letterSpacing: "2.2px", color: `rgba(${tone}, 0.95)`, flexShrink: 0 }}>{scope.label}</span>
      <span aria-hidden="true" style={{ width: "1px", height: "16px", background: `rgba(${tone}, 0.3)`, flexShrink: 0 }} />
      <span style={{ display: "flex", flexDirection: "column", minWidth: 0, lineHeight: 1.2 }}>
        <span data-testid="job-scope-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: valid ? SIL_TOKENS.typography.sans : SIL_TOKENS.typography.mono, fontSize: valid ? "12.5px" : "10px", fontWeight: valid ? 600 : 700, letterSpacing: valid ? "0.2px" : "1.6px", color: valid ? "#eef9ff" : `rgba(${tone}, 0.95)` }}>{scope.title}</span>
        {scope.detail !== null && <span data-testid="job-scope-detail" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "8.5px", fontWeight: 600, letterSpacing: "1px", color: "rgba(168, 206, 226, 0.78)", marginTop: "2px" }}>{scope.detail}</span>}
      </span>
    </button>
  );
}

export function SyntxFieldSelector({ focus, groupLabel, capabilityLabel, jobLabel, onSelect, jobScope, onJobScopeActivate }: { focus: SyntxFieldFocus; groupLabel: string; capabilityLabel: string; jobLabel: string; onSelect(next: SyntxFieldFocus): void; jobScope?: SyntxJobScopePresentation; onJobScopeActivate?(): void }) {
  const buttons = useRef<Record<SyntxFieldFocus, HTMLButtonElement | null>>({ CAPABILITY: null, FIELD: null });
  const options: Array<{ id: string; focus: SyntxFieldFocus; label: string }> = [
    { id: "field-focus-capability-btn", focus: "CAPABILITY", label: capabilityLabel },
    { id: "job-pool-panel-toggle", focus: "FIELD", label: jobLabel }
  ];
  /** The sweep belongs to a field change, never to the first paint. */
  const switched = useRef(false);
  const select = (next: SyntxFieldFocus) => { if (next !== focus) { switched.current = true; onSelect(next); } };
  const onKeyDown = (event: React.KeyboardEvent) => {
    const next: SyntxFieldFocus | null = event.key === "ArrowLeft" || event.key === "Home" ? "CAPABILITY" : event.key === "ArrowRight" || event.key === "End" ? "FIELD" : null;
    if (next === null) return;
    event.preventDefault();
    select(next);
    buttons.current[next]?.focus();
  };
  return (
    <>
    {jobScope !== undefined && <SyntxJobScopeIndicator scope={jobScope} onActivate={onJobScopeActivate} />}
    <div
      data-testid="field-focus-strip"
      data-field-focus={focus}
      data-sx-shell="selector"
      role="group"
      aria-label={groupLabel}
      style={{ position: "fixed", left: "50%", top: "70px", transform: "translateX(-50%)", zIndex: 60, display: "flex", alignItems: "center", padding: "5px", borderRadius: "999px", border: "1px solid rgba(120, 214, 255, 0.26)", overflow: "visible", background: "radial-gradient(80% 140% at 50% 0%, rgba(84, 232, 236, 0.08), transparent 70%), linear-gradient(180deg, rgba(8, 21, 34, 0.92), rgba(3, 8, 15, 0.95))", boxShadow: "0 0 0 1px rgba(3, 8, 16, 0.6), 0 12px 32px rgba(0, 0, 0, 0.6), 0 0 30px rgba(56, 229, 255, 0.11), 0 0 70px rgba(72, 210, 240, 0.05), inset 0 1px 0 rgba(200, 245, 255, 0.16), inset 0 -1px 0 rgba(0, 0, 0, 0.4), inset 0 0 18px rgba(92, 200, 255, 0.05)", backdropFilter: "blur(10px)", fontFamily: SIL_TOKENS.typography.mono }}
    >
      <style>{SYNTX_FIELD_SELECTOR_CSS}</style>
      {/* The membrane: an outer resonance ring, the upper light edge and a lower counter-light (static). */}
      <span aria-hidden="true" style={{ position: "absolute", inset: "-5px", borderRadius: "999px", border: "1px solid rgba(120, 214, 255, 0.09)", boxShadow: "0 0 22px rgba(56, 229, 255, 0.06)", pointerEvents: "none" }} />
      <span aria-hidden="true" style={{ position: "absolute", left: "28px", right: "28px", top: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(170, 240, 255, 0.7), transparent)", pointerEvents: "none" }} />
      <span aria-hidden="true" style={{ position: "absolute", left: "34%", right: "34%", bottom: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(92, 200, 255, 0.35), transparent)", pointerEvents: "none" }} />
      {/* Field change: one light passes through the capsule towards the field now active (finite, .9 s; none in REDUCED). */}
      <span aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: "999px", overflow: "hidden", pointerEvents: "none" }}>
        {switched.current && <span key={focus} data-sx-field-sweep style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "40%", background: "linear-gradient(90deg, transparent, rgba(170, 240, 255, 0.16), transparent)", animation: `${focus === "FIELD" ? "syntxFieldSweepRight" : "syntxFieldSweepLeft"} 0.9s cubic-bezier(0.16, 1, 0.3, 1) both` }} />}
      </span>
      {options.map((option, index) => {
        const active = focus === option.focus;
        const tone = TONE[option.focus];
        return (
          <React.Fragment key={option.id}>
            {index > 0 && (
              <span aria-hidden="true" data-sx-selector-link style={{ position: "relative", display: "flex", alignItems: "center", width: "34px", justifyContent: "center", flexShrink: 0 }}>
                <svg width="34" height="14" viewBox="0 0 34 14" style={{ overflow: "visible" }}>
                  <path d="M17 7 C 13 1.5, 4 1.5, 4 7 C 4 12.5, 13 12.5, 17 7" fill="none" stroke={`rgba(56, 229, 255, ${focus === "CAPABILITY" ? 0.85 : 0.22})`} strokeWidth="1" style={{ transition: "stroke 0.45s ease", filter: focus === "CAPABILITY" ? "drop-shadow(0 0 2px rgba(56, 229, 255, 0.8))" : "none" }} />
                  <path d="M17 7 C 21 1.5, 30 1.5, 30 7 C 30 12.5, 21 12.5, 17 7" fill="none" stroke={`rgba(92, 200, 255, ${focus === "FIELD" ? 0.85 : 0.22})`} strokeWidth="1" style={{ transition: "stroke 0.45s ease", filter: focus === "FIELD" ? "drop-shadow(0 0 2px rgba(92, 200, 255, 0.8))" : "none" }} />
                  <circle cx="17" cy="7" r="1.6" fill="#d8f7ff" style={{ filter: "drop-shadow(0 0 3px rgba(150, 230, 255, 0.9))" }} />
                </svg>
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
              style={{ "--sx-tone": tone, position: "relative", display: "inline-flex", alignItems: "center", gap: "9px", padding: "10px 20px 10px 15px", width: "214px", justifyContent: "center", borderRadius: "999px", border: `1px solid ${active ? `rgba(${tone}, 0.8)` : "transparent"}`, background: active ? `radial-gradient(120% 170% at 50% 0%, rgba(${tone}, 0.32), rgba(${tone}, 0.1) 62%, rgba(${tone}, 0.04))` : "transparent", boxShadow: active ? `0 0 22px rgba(${tone}, 0.3), 0 0 46px rgba(${tone}, 0.1), inset 0 1px 0 rgba(220, 250, 255, 0.28), inset 0 0 16px rgba(${tone}, 0.14)` : "none", color: active ? "#f2fdff" : "rgba(160, 196, 214, 0.66)", textShadow: active ? `0 0 12px rgba(${tone}, 0.6)` : "none", fontFamily: SIL_TOKENS.typography.mono, fontSize: "11px", fontWeight: 700, letterSpacing: "2.2px", textTransform: "uppercase", whiteSpace: "nowrap", cursor: active ? "default" : "pointer", transition: "background 0.45s ease, color 0.45s ease, box-shadow 0.45s ease, border-color 0.45s ease, text-shadow 0.45s ease" } as React.CSSProperties}
            >
              <span data-sx-lamp aria-hidden="true" style={{ width: "7px", height: "7px", boxSizing: "border-box", borderRadius: "50%", flexShrink: 0, border: `1px solid rgba(${tone}, ${active ? 1 : 0.38})`, background: active ? `rgb(${tone})` : "transparent", boxShadow: active ? `0 0 8px rgba(${tone}, 0.95), 0 0 2px #ffffff` : "none", transition: "background 0.45s ease, box-shadow 0.45s ease, border-color 0.45s ease" }} />
              {option.label}
              <span aria-hidden="true" style={{ position: "absolute", left: "22%", right: "22%", bottom: "3px", height: "1px", borderRadius: "1px", background: `linear-gradient(90deg, transparent, rgba(${tone}, 0.9), transparent)`, opacity: active ? 1 : 0, transition: "opacity 0.45s ease" }} />
            </button>
          </React.Fragment>
        );
      })}
    </div>
    </>
  );
}
