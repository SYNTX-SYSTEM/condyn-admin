import React from "react";
import { CareerDemoHistory } from "../../components/career/demo/CareerDemoHistory";
import { careerDemoPropsFromSearchParams, type CareerDemoSearchParams } from "../../../lib/career/ui/career-demo-url";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "./demo-data";

/** The URL's parameters and their meaning: `CareerDemoUrlProps` (lib/career/ui/career-demo-url.ts), read by the one parser the
 *  in-app history uses as well, so a reload and Back / Forward mount the same field. */
export default async function CareerIntelligenceDemoPage({ searchParams }: { searchParams: Promise<CareerDemoSearchParams> }) {
  return <CareerDemoHistory data={EMPTY_CAREER_INTELLIGENCE_DATA} initial={careerDemoPropsFromSearchParams(await searchParams)} />;
}
