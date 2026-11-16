#!/usr/bin/env python3
"""PINK · PHASE G · A-G16 SECOND PASS — the green-by-coincidence count, enumerated rather than taken.

A-G16 (PHASE_G §9) claimed: "twenty-two instrument or proof defects, of which nine could not change their
verdict in either direction. The surface now finds them faster than we create them, which is the only measure
of the discipline that matters." The running count is now 46 (A-G73).

GELB asked PINK to settle whether that means the surface outruns the defect rate, or whether GELB has been
creating defects faster than one lane could find them. GELB deliberately did not pre-classify the new entries.

Each row below is PINK's classification of defects 23..46 — the ones added since A-G16, which are the ones the
claim is now being tested on. Fields:
  owner   whose artifact was defective          (gelb = spec/adjudication, gruen = build, pink = instrument)
  finder  which lane first surfaced it
  status  what the defect had already conferred when it was found:
            'none'     caught before it carried anything
            'verdict'  a measurement/verdict rested on it
            'status'   an ACCEPTANCE or GO rested on it (strictly worse — A-G72's distinction)
  neutral True if it could not change a verdict in either direction (A-G16's own sub-count criterion)
Source for owner/finder: the adjudication text in PERSON_X_JOB_MAPPING_PHASE_G.md and the lane exchanges it
records. Where the document does not state attribution, the value is PINK's reading and marked note='judged'.
"""
import json, collections

D = [
 # id, adjudication, owner,  finder, status,   neutral, note
 (23,"A-G26 PG-10 max-swing limb below the instrument floor","gelb","pink","none",False,""),
 (24,"A-G27 PG-2 satisfied by the stage ground colour alone","gelb","gelb","none",True,""),
 (25,"A-G28 PG-21 satisfied by its own remedy","gelb","gelb","none",True,""),
 (26,"A-G29 PG-13 already passed 12-50x on the rejected stage","gelb","gelb","none",True,"on PINK's Q-F5 data"),
 (27,"A-G30 PG-11 a ratio of two floor values; guard dropped","gelb","gelb","none",False,"PINK's PF-10 guard, dropped by GELB"),
 (28,"A-G41 the four §12 reds are void as measurements","gruen","pink","verdict",False,""),
 (29,"A-G42 PF-8 / PG-11 frequency collision","gelb","pink","none",False,""),
 (30,"A-G43 PG-20's splay keys on the mark, not the state","gruen","pink","none",False,""),
 (31,"A-G44 A-G23's scaling inherits a fixture","gelb","pink","none",False,""),
 (32,"A-G49 a semantic carrier lives only in className","gruen","pink","none",False,"PINK F-G1"),
 (33,"A-G50 A-G4's justification falsified — L1 not densest","gelb","pink","none",True,"justification, not bound"),
 (34,"A-G51 PG-18 has no satisfier at L1","gruen","pink","none",False,"PINK F-G3"),
 (35,"A-G54 a floor inherits the ground it was measured on","pink","gelb","verdict",False,"went against PINK"),
 (36,"A-G55 PG-1 cannot score an occluding semantic","gelb","gruen","none",False,"PINK reproduced independently"),
 (37,"A-G56 the shelf ring is absent at its darkest angle","gelb","gruen","none",False,""),
 (38,"A-G62 the shelf floor limb fails on arithmetic","gelb","gelb","none",False,"on GRUEN's number"),
 (39,"A-G64 GELB credited PINK with a reading PINK had not taken","gelb","pink","status",False,"a decision rested on it"),
 (40,"A-G65 min() is contaminated exactly as max() was","gelb","pink","verdict",False,""),
 (41,"A-G66 PF-15's local-ground limb ill-posed for the shelf","gelb","pink","none",False,""),
 (42,"A-G71(a) G_ENTRY is in its own whitelist, doc never enumerates","gelb","pink","none",True,"boundary, not obligation"),
 (43,"A-G71(b) the provider/API scan exempts phase G's own JSON","gruen","pink","none",True,""),
 (44,"A-G71(c) deleting field-g.test.tsx satisfies MAP-G-ARCH","gruen","pink","none",False,"no mechanism for the SFE no-delete rule"),
 (45,"A-G72 A-G14 is VOID — it accepted a tree that did not exist","gelb","pink","status",False,"range falsified 120/120 in LV11"),
 (46,"A-G73 the vectors cannot witness their own no-touch bound","gruen","pink","none",True,"record precision < margin"),
]

n = len(D)
def cnt(f): 
    c = collections.Counter(r[f] for r in [dict(zip(("id","adj","owner","finder","status","neutral","note"),row)) for row in D])
    return dict(c)

rows = [dict(zip(("id","adj","owner","finder","status","neutral","note"), r)) for r in D]
owner  = collections.Counter(r["owner"] for r in rows)
finder = collections.Counter(r["finder"] for r in rows)
status = collections.Counter(r["status"] for r in rows)
neutral = sum(1 for r in rows if r["neutral"])
selfcaught = sum(1 for r in rows if r["owner"] == r["finder"])
crosscaught = n - selfcaught
carried = sum(1 for r in rows if r["status"] != "none")

out = {
 "scope": "defects 23..46, i.e. every defect added since A-G16 — the window the claim is now tested on",
 "n": n,
 "owner_whose_artifact_was_defective": dict(owner),
 "finder_which_lane_surfaced_it": dict(finder),
 "self_caught_owner_equals_finder": selfcaught,
 "cross_caught_found_by_another_lane": crosscaught,
 "cross_caught_fraction": round(crosscaught/n, 3),
 "already_carried_something_when_found": {"total": carried, "by_kind": dict(status)},
 "verdict_neutral_A_G16_criterion": neutral,
 "verdict_neutral_fraction": round(neutral/n, 3),
 "A_G16_reference_point": {"count": 22, "neutral": 9, "neutral_fraction": round(9/22, 3)},
 "rows": rows,
}
print(json.dumps(out, indent=1))
