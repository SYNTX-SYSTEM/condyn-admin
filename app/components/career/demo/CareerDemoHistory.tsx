"use client";

import React, { useEffect, useState } from "react";
import type { DemoCareerIntelligenceData } from "../../../career/demo/demo-data";
import { CareerIntelligenceDashboard } from "./CareerIntelligenceDashboard";
import { careerDemoPropsFromSearchParams, careerDemoSearchParamsFromSearch, type CareerDemoUrlProps } from "../../../../lib/career/ui/career-demo-url";

/**
 * In-app history (owner "OWNER_GO_FULL_PXJ_CLOSURE" §05, N-1 B-NAV). Back / Forward land on an entry the field wrote itself; the
 * field is then mounted afresh from that entry's URL through the same parser the page uses for a reload, so a history entry shows
 * exactly what reloading its URL shows (NAV ≡ RELOAD). What the URL does not carry (language, orbit and zoom, staged sources) is
 * reset, as on a reload. The previous mount's reads are released by its own unmount.
 */
export function CareerDemoHistory({ data, initial }: { data: DemoCareerIntelligenceData; initial: CareerDemoUrlProps }) {
  const [entry, setEntry] = useState<{ generation: number; props: CareerDemoUrlProps } | null>(null);
  useEffect(() => {
    const restore = () => setEntry(previous => ({ generation: (previous?.generation ?? 0) + 1, props: careerDemoPropsFromSearchParams(careerDemoSearchParamsFromSearch(window.location.search)) }));
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  return <CareerIntelligenceDashboard key={entry === null ? "mount" : `entry-${entry.generation}`} data={data} {...(entry?.props ?? initial)} />;
}
