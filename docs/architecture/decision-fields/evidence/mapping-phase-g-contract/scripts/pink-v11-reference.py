#!/usr/bin/env python3
"""PINK · PHASE G · A-G14's MISSING SECOND INSTRUMENT.

A-G14 accepted MAPPING_LAYOUT_V1.1 "as built" on GRUEN's own reference implementation and its own golden
vectors. One implementation checked against vectors it produced is not an independent check: the §3.95
precedent is that 9 of 43 PINK mutants survived GRUEN's suite, 5 of them real gaps. This is PINK's
INDEPENDENT re-derivation, written from the SPEC TEXT only (layout-spec-v1.1.json), in a different language,
never importing or reading layout.ts or layout-reference.ts. It recomputes what the spec determines in closed
form and checks every invariant A-G14 claims, against all twelve recorded vectors.

Closed-form from the spec:
  rho_mass  = clamp(body.base + body.perSqrtWeight * sqrt(weightSum), body.min, body.max)
  rho_drawn = drawn.min + (rho_mass - body.min)/(body.max - body.min) * (drawn.max - drawn.min)
The SEARCH (placement) is iterative and order-dependent, so positions are NOT re-derived here; they are
checked against the spec's stated INVARIANTS instead, which is the part a second instrument can falsify.
"""
import json, math, sys, pathlib

ROOT = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".")
SPEC = json.loads((ROOT/"docs/architecture/decision-fields/mapping-spec/layout-spec-v1.1.json").read_text())
VEC  = json.loads((ROOT/"docs/architecture/decision-fields/mapping-spec/layout-golden-vectors-v1.1.json").read_text())

B, F, R, DR = SPEC["body"], SPEC["field"], SPEC["rings"], SPEC["body"]["drawn"]
GAP = B["gap"]
AGG14_CLAIMED_RANGE = (32.2, 52.6)   # as written in PHASE_G §7 / §9 / A-G14
SPEC_RANGE = (DR["min"], DR["max"])  # as shipped

def rnd(v): return math.floor(v*1e6 + 0.5)/1e6 if v >= 0 else -(math.floor(-v*1e6 + 0.5)/1e6)
def rho_mass(w): return min(B["max"], max(B["min"], B["base"] + B["perSqrtWeight"]*math.sqrt(w)))
def rho_drawn(rm): return DR["min"] + (rm - B["min"])/(B["max"] - B["min"])*(DR["max"] - DR["min"])

TOL = 1e-6
report = {"instrument": "PINK independent re-derivation from spec text (python)", "specVersion": SPEC["specVersion"],
          "specRange": SPEC_RANGE, "A_G14_claimedRange": AGG14_CLAIMED_RANGE, "tolerance": TOL, "layouts": {}}
tot = {"bodies": 0, "massOk": 0, "drawnOk": 0}
fail = []

for name in sorted(VEC["layouts"]):
    L = VEC["layouts"][name]
    roles = {(r["poolId"], r["roleId"]): r for r in L["input"]["roles"]}
    exp = L["expected"]
    bodies = exp["bodies"]
    res = {"bodies": len(bodies), "overflowCount": exp["overflowCount"], "checks": {}}

    # 1 + 2 · the two radii, re-derived from the input in closed form
    mass_bad, drawn_bad, rng_bad, rng_bad_claimed = [], [], [], []
    for b in bodies:
        r = roles[(b["poolId"], b["roleId"])]
        tot["bodies"] += 1
        rm_mine, rd_mine = rnd(rho_mass(r["weightSum"])), rnd(rho_drawn(rho_mass(r["weightSum"])))
        if abs(rm_mine - b["bodyRadius"]) <= TOL: tot["massOk"] += 1
        else: mass_bad.append({"role": b["roleId"], "mine": rm_mine, "vector": b["bodyRadius"]})
        if abs(rd_mine - b["drawnRadius"]) <= TOL: tot["drawnOk"] += 1
        else: drawn_bad.append({"role": b["roleId"], "mine": rd_mine, "vector": b["drawnRadius"]})
        if not (SPEC_RANGE[0]-TOL <= b["drawnRadius"] <= SPEC_RANGE[1]+TOL): rng_bad.append(b["roleId"])
        if not (AGG14_CLAIMED_RANGE[0]-TOL <= b["drawnRadius"] <= AGG14_CLAIMED_RANGE[1]+TOL): rng_bad_claimed.append(b["roleId"])
    res["checks"]["massRadius_rederived"] = {"pass": not mass_bad, "mismatches": mass_bad}
    res["checks"]["drawnRadius_rederived"] = {"pass": not drawn_bad, "mismatches": drawn_bad}
    res["checks"]["drawnRadius_in_SPEC_range"] = {"pass": not rng_bad, "outside": rng_bad}
    res["checks"]["drawnRadius_in_A_G14_claimed_range"] = {"pass": not rng_bad_claimed, "outside": rng_bad_claimed}

    # 3 · monotone in mass
    pairs = sorted(((b["bodyRadius"], b["drawnRadius"], b["roleId"]) for b in bodies))
    mono = all(pairs[i][1] <= pairs[i+1][1] + TOL for i in range(len(pairs)-1))
    res["checks"]["drawn_monotone_in_mass"] = {"pass": mono}

    # 4 · no two DRAWN bodies touch: centre distance >= rd(a)+rd(b)+gap
    drawn = [b for b in bodies if not b["overflow"]]
    touches, worst = [], None
    for i in range(len(drawn)):
        for j in range(i+1, len(drawn)):
            a, c = drawn[i], drawn[j]
            d = math.hypot(a["x"]-c["x"], a["y"]-c["y"])
            need = a["drawnRadius"] + c["drawnRadius"] + GAP
            slack = d - need
            if worst is None or slack < worst["slack"]:
                worst = {"a": a["roleId"], "b": c["roleId"], "dist": rnd(d), "need": rnd(need), "slack": rnd(slack)}
            if slack < -TOL: touches.append({"a": a["roleId"], "b": c["roleId"], "dist": rnd(d), "need": rnd(need), "slack": rnd(slack)})
    res["checks"]["no_two_drawn_bodies_touch"] = {"pass": not touches, "violations": touches, "tightestPair": worst}

    # 5 · the radial band is stated with the MASS radius, inclusive on both edges
    band_bad = []
    for b in drawn:
        rm = b["bodyRadius"]
        lo, hi = (R["shelfNear"], F["radius"]-rm) if b["shelf"] else (R["bestFit"], R["horizon"]-rm)
        if not (lo-TOL <= b["distance"] <= hi+TOL):
            band_bad.append({"role": b["roleId"], "shelf": b["shelf"], "distance": b["distance"], "band": [lo, rnd(hi)]})
    res["checks"]["band_by_MASS_radius"] = {"pass": not band_bad, "violations": band_bad}

    # 6 · an undisplaced body sits at its fit position
    disp_bad = [{"role": b["roleId"], "displacement": b["displacement"]} for b in drawn
                if b["displacement"] == [0, 0] and abs(math.hypot(b["x"], b["y"]) - b["distance"]) > 1e-4]
    res["checks"]["undisplaced_at_its_fit"] = {"pass": not disp_bad, "violations": disp_bad}

    # 7 · the shelf survives wherever the input has shelf roles
    shelf_in = any(r for r in L["input"]["roles"] if any(b["shelf"] and b["roleId"] == r["roleId"] for b in bodies))
    shelf_drawn = sum(1 for b in drawn if b["shelf"])
    shelf_total = sum(1 for b in bodies if b["shelf"])
    res["checks"]["shelf_survives"] = {"shelfBodies": shelf_total, "shelfDrawn": shelf_drawn,
                                       "pass": (shelf_drawn > 0) if shelf_total > 0 else True}

    # 8 · every angular position lies inside its pool's sector
    sec = {s["poolId"]: s for s in exp["sectors"]}
    ang_bad = []
    for b in drawn:
        s = sec.get(b["poolId"])
        if s is None: continue
        lo, hi = s["startDegrees"], s["startDegrees"]+s["spanDegrees"]
        a = b["angleDegrees"]
        cand = [a, a+360, a-360]
        if not any(lo-1e-4 <= v <= hi+1e-4 for v in cand):
            ang_bad.append({"role": b["roleId"], "angle": a, "sector": [lo, rnd(hi)]})
    res["checks"]["angle_inside_its_sector"] = {"pass": not ang_bad, "violations": ang_bad}

    # 9 · every emitted number is rounded to 6 decimals
    rb = [k for b in bodies for k, v in b.items() if isinstance(v, float) and abs(v - rnd(v)) > 1e-12]
    res["checks"]["rounded_to_6dp"] = {"pass": not rb, "fields": sorted(set(rb))}

    for k, v in res["checks"].items():
        if v.get("pass") is False: fail.append(f"{name}:{k}")
    report["layouts"][name] = res

report["totals"] = tot
report["failures"] = fail
report["verdict"] = "ALL INVARIANTS HOLD" if not fail else "FAILURES PRESENT"
print(json.dumps(report, indent=1))
