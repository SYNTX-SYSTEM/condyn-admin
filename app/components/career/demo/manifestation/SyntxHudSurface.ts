import type React from "react";
import { SIL_TOKENS } from "../SILTokens";
import type { SilFocusedManifestationPlacement } from "../../../../../lib/career/view-model/focused-orbit-placement";

/**
 * SYNTX manifestation grammar · hologram HUD surface (domain-neutral).
 *
 * The opaque observation surface of the planetarium's hover HUD (OrbitalResonanceBubble): one solid universe body under
 * decorative star layers, the cyan frame and the deep shadow. Shared by the Capability Field's HUD and by every other
 * field that opens an observation surface beside a resonance body.
 */
export type SyntxHudPlacement = SilFocusedManifestationPlacement;

export const SYNTX_HUD_SURFACE: React.CSSProperties = {
  position: "absolute",
  width: "380px",
  // The observation surface must visually isolate its evidence from the
  // organism behind it; this is quiet spatial framing, not a new HUD state.
  // A true, opaque observation surface. The atmosphere layers decorate a
  // solid universe rather than functioning as transparent glass.
  // The final opaque gradient is the actual body surface; decorative star
  // layers never expose the organism underneath the observation HUD.
  background: "#02070d",
  backgroundColor: "#02070d",
  backgroundImage:
    "radial-gradient(circle at 8% 14%, rgba(255,255,255,0.95) 0 1px, transparent 1.8px), radial-gradient(circle at 19% 68%, rgba(56,229,255,0.95) 0 1.2px, transparent 2px), radial-gradient(circle at 34% 30%, rgba(255,255,255,0.78) 0 0.9px, transparent 1.7px), radial-gradient(circle at 52% 15%, rgba(126,255,204,0.90) 0 1px, transparent 1.8px), radial-gradient(circle at 67% 73%, rgba(255,255,255,0.82) 0 1px, transparent 1.8px), radial-gradient(circle at 82% 22%, rgba(142,156,255,0.96) 0 1.1px, transparent 2px), radial-gradient(circle at 91% 61%, rgba(56,229,255,0.94) 0 1.2px, transparent 2px), radial-gradient(circle at 44% 88%, rgba(255,255,255,0.70) 0 0.9px, transparent 1.7px), radial-gradient(ellipse at 18% 27%, rgba(0,218,255,0.34) 0%, rgba(0,141,190,0.22) 20%, rgba(0,84,118,0.10) 38%, transparent 57%), radial-gradient(ellipse at 84% 24%, rgba(108,92,255,0.30) 0%, rgba(75,55,180,0.16) 23%, transparent 49%), radial-gradient(ellipse at 58% 82%, rgba(0,255,213,0.18) 0%, rgba(0,118,130,0.08) 32%, transparent 55%), radial-gradient(ellipse at 50% 50%, rgba(20,90,120,0.18) 0%, rgba(5,25,40,0.06) 44%, transparent 68%), linear-gradient(145deg, #0a1c2b 0%, #071321 28%, #050c18 62%, #02070d 100%)",
  border: `1.5px solid ${SIL_TOKENS.colors.cyanActive}`,
  borderRadius: "10px",
  padding: "16px 18px",
  boxShadow: `0 16px 44px rgba(0, 0, 0, 0.92), 0 0 34px rgba(56, 229, 255, 0.28), 0 0 72px rgba(56, 229, 255, 0.10), inset 0 0 54px rgba(0, 0, 0, 0.88)`,
  backgroundSize: "auto",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "center",
  opacity: 1,
  mixBlendMode: "normal",
  backgroundBlendMode: "normal",
  backdropFilter: "none",
  isolation: "isolate",
  zIndex: 50,
  textAlign: "left",
  pointerEvents: "auto",
  fontFamily: SIL_TOKENS.typography.mono,
  WebkitFontSmoothing: "antialiased"
};

/** The HUD beside a 168 px resonance body, placed by the focused manifestation placement. */
export function syntxHudPlacementStyle(placement: SyntxHudPlacement): React.CSSProperties {
  const base = SYNTX_HUD_SURFACE;

  switch (placement) {
    case "top":
      return { ...base, bottom: "215px", left: "-106px" }; // (380 - 168) / 2 = 106
    case "bottom":
      return { ...base, top: "215px", left: "-106px" };
    case "left":
      return { ...base, right: "215px", top: "-50px" }; // Approximate vertical center without dynamic calc
    case "right":
      return { ...base, left: "215px", top: "-50px" };
    case "top-left":
      return { ...base, bottom: "175px", right: "175px" };
    case "top-right":
      return { ...base, bottom: "175px", left: "175px" };
    case "bottom-left":
      return { ...base, top: "175px", right: "175px" };
    case "bottom-right":
      return { ...base, top: "175px", left: "175px" };
    default:
      return { ...base, bottom: "215px", left: "-106px" };
  }
}
