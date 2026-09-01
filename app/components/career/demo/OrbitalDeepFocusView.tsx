"use client";

import React from "react";
import type { OrbitFocusItem } from "../../../../lib/career/view-model/orbit-focus-projection";
import { buildOrbitalDeepFocusLayout } from "../../../../lib/career/view-model/orbital-deep-focus-layout";
import { SIL_TOKENS } from "./SILTokens";

interface OrbitalDeepFocusViewProps {
  stageId: string;
  stageName: string;
  selectedItemId: string;
  items: OrbitFocusItem[];
  onSelectItem: (itemId: string) => void;
  onBack: () => void;
}

/** Shared L2 shell; it renders only supplied stage-specific secondary content. */
export function OrbitalDeepFocusView({ stageId, stageName, selectedItemId, items, onSelectItem, onBack }: OrbitalDeepFocusViewProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = React.useState({ width: 1200, height: 760 });
  const selected = items.find((item) => item.id === selectedItemId) ?? items[0];
  React.useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => setViewport({ width: Math.max(320, Math.floor(entry.contentRect.width)), height: Math.max(300, Math.floor(entry.contentRect.height)) }));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const layout = React.useMemo(() => selected ? buildOrbitalDeepFocusLayout({ items, selectedItemId: selected.id, width: viewport.width, height: viewport.height }) : null, [items, selected, viewport]);
  if (!selected || !layout) return null;
  return <div ref={containerRef} data-testid={`orbital-deep-focus-view-${stageId}`} data-reduced-motion-contract="static deterministic hierarchy" style={{ position: "absolute", inset: 0, zIndex: 23, overflow: "hidden", background: "radial-gradient(circle at 50% 42%, rgba(14, 66, 73, 0.22), transparent 26%), radial-gradient(ellipse at 50% 54%, rgba(2, 12, 20, 0.62), rgba(1, 3, 8, 0.97) 76%)" }}>
    <style>{`@keyframes orbitalDeepFocusSettle { from { opacity: 0; transform: translate(-50%, -50%) scale(.78); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } } @media (prefers-reduced-motion: reduce) { [data-orbital-deep-focus-motion] { animation: none !important; } }`}</style>
    <svg aria-hidden="true" width={layout.width} height={layout.height} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>{layout.satellites.map((satellite) => <line key={satellite.id} x1={layout.focus.x} y1={layout.focus.y} x2={satellite.x} y2={satellite.y} stroke="rgba(56, 229, 255, 0.12)" strokeWidth="1" strokeDasharray="3 10" />)}</svg>
    {layout.satellites.map((satellite) => <button key={satellite.id} type="button" data-testid={`orbital-focus-satellite-${satellite.id}`} data-orbital-deep-focus-motion onClick={() => onSelectItem(satellite.id)} style={{ position: "absolute", left: satellite.x, top: satellite.y, width: satellite.width, minHeight: satellite.height, transform: `translate(-50%, -50%) scale(${satellite.scale})`, opacity: satellite.opacity, border: "1px solid rgba(56, 229, 255, 0.28)", borderRadius: "16px", padding: "9px 11px", background: "rgba(3, 12, 20, 0.94)", color: "rgba(222, 242, 247, 0.82)", fontFamily: SIL_TOKENS.typography.mono, fontSize: "9px", fontWeight: 700, textAlign: "left", cursor: "pointer", overflowWrap: "anywhere", hyphens: "auto" }}>{satellite.title}</button>)}
    <button type="button" data-testid={`orbital-focus-nucleus-${selected.id}`} data-orbital-deep-focus-motion onClick={onBack} style={{ position: "absolute", left: layout.focus.x, top: layout.focus.y, width: layout.focus.width, minHeight: layout.focus.height, transform: "translate(-50%, -50%)", animation: "orbitalDeepFocusSettle .78s cubic-bezier(.16, 1, .3, 1) both", border: `1.5px solid ${SIL_TOKENS.colors.cyanActive}`, borderRadius: "50%", padding: "26px 34px", background: "radial-gradient(circle at 50% 30%, rgba(126, 255, 204, 0.28), transparent 40%), radial-gradient(circle, rgba(7, 45, 53, 0.98), rgba(2, 8, 14, 1) 76%)", boxShadow: "0 0 52px rgba(56, 229, 255, 0.36)", color: SIL_TOKENS.colors.textPrimary, cursor: "pointer", fontFamily: SIL_TOKENS.typography.mono, textAlign: "center", overflowWrap: "anywhere", hyphens: "auto" }}><span style={{ display: "block", color: SIL_TOKENS.colors.cyanActive, fontSize: "9px", fontWeight: 800, letterSpacing: "1.1px" }}>{stageName} NUCLEUS</span><span style={{ display: "block", marginTop: "8px", fontSize: "14px", fontWeight: 800, lineHeight: 1.34 }}>{selected.title}</span><span style={{ display: "block", marginTop: "10px", color: "rgba(56, 229, 255, 0.66)", fontSize: "8px", letterSpacing: "0.7px" }}>RETURN TO {stageName} COSMOS</span></button>
    {selected.secondary.length > 0 && <section data-testid={`orbital-focus-secondary-${selected.id}`} style={{ position: "absolute", left: layout.evidence.x, top: layout.evidence.y, width: layout.evidence.width, minHeight: layout.evidence.height, transform: "translate(-50%, -50%)", border: "1px solid rgba(126, 255, 204, 0.48)", borderRadius: "15px", padding: "12px 15px", background: "rgba(3, 14, 20, 0.98)", color: SIL_TOKENS.colors.textPrimary, fontFamily: SIL_TOKENS.typography.mono }}><div style={{ color: "#7effcc", fontSize: "8px", fontWeight: 800, letterSpacing: "0.9px" }}>STAGE CONTENT</div>{selected.secondary.map((content) => <div key={content} style={{ marginTop: "7px", fontSize: "9px", lineHeight: 1.4, overflowWrap: "anywhere" }}>{content}</div>)}</section>}
  </div>;
}
