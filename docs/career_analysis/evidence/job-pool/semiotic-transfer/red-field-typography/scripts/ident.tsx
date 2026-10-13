import React from "react";
import { renderToStaticMarkup } from "/home/codi/Entwicklung/condyn-admin-job-field/node_modules/react-dom/server";
import * as Head from "./SyntxFocusShell.head";
import * as Now from "/home/codi/Entwicklung/condyn-admin-job-field/app/components/career/demo/manifestation/SyntxFocusShell";
let n = 0, same = 0;
for (const isCosmosAnchor of [false, true]) for (const isCosmosBackground of [false, true]) for (const showFocusPulse of [false, true]) for (const pulseKeyframes of [true, false]) for (const withEmpty of [false, true]) {
  const props: any = { stageId: "05", x: -285.79, y: 165, isCosmosAnchor, isCosmosBackground, showFocusPulse, pulseKeyframes, emptyVisualUnderlay: withEmpty ? <i>u</i> : undefined, emptyCopyForeground: withEmpty ? <b>c</b> : undefined, children: <span>body</span> };
  const a = renderToStaticMarkup(<Head.FocusTransitionStageShell {...props} />), b = renderToStaticMarkup(<Now.FocusTransitionStageShell {...props} />);
  n++; if (a === b) same++; else console.log("DIFF", JSON.stringify({ isCosmosAnchor, isCosmosBackground, showFocusPulse, pulseKeyframes, withEmpty }));
}
console.log("default (Job Field) render identity:", same, "/", n);
const lifted = renderToStaticMarkup(<Now.FocusTransitionStageShell stageId="05" x={0} y={0} isCosmosAnchor isCosmosBackground={false} showFocusPulse copyAboveAnchorOpacity emptyVisualUnderlay={<i>u</i>} emptyCopyForeground={<b>c</b>}><span>body</span></Now.FocusTransitionStageShell>);
console.log(lifted.replace(/<style>[\s\S]*?<\/style>/, "<style/>").replace(/<svg[\s\S]*?<\/svg>/, "<svg/>"));
