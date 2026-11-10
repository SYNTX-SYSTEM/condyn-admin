#!/usr/bin/env python3
"""PINK · PHASE G · §8 ADDENDUM — testing A-G16's OWN criterion before answering GELB on row 36.

GELB asked PINK to confirm or refuse reclassifying row 36 (A-G55) as verdict-neutral, on the ground that PG-1
passes with the occluder at its negative value and correcting it "can only raise the figure". Under A-G64 only
PINK may answer. Answering required asking what A-G16's criterion — "could not change their verdict in either
direction" — actually means. It admits two readings, and they are not close:

  (a) RETROSPECTIVE: the verdict that was ACTUALLY returned was not affected by the defect.
  (b) STRUCTURAL:    the defect is INCAPABLE of affecting any verdict the pin could ever return.

Classified below under both, for all 24 rows of the §8 ledger. 'n/a' = no verdict has been returned for that
pin on any committed artifact, which under (a) makes the row vacuously neutral.
"""
import json

# id, adjudication, (a) retrospective neutral?, (b) structural neutral?, why
R = [
 (23,"A-G26 max-swing limb below the instrument floor", True,  False,"limb withdrawn before any verdict; but a ceiling under its own floor cannot ever discriminate"),
 (24,"A-G27 PG-2 satisfied by the stage ground constant", True,  False,"no PG-2 verdict returned; structurally it would PASS a bright medium"),
 (25,"A-G28 PG-21 satisfied by its own remedy",           True,  False,"no verdict returned; structurally it passes without witnessing the ghost"),
 (26,"A-G29 PG-13 passed 12-50x on the rejected stage",   True,  False,"no verdict returned; a bound of 8 against 97-400 can never fail"),
 (27,"A-G30 PG-11 a ratio of two floor values",           True,  False,"no verdict returned; a ratio of noise can report any value"),
 (28,"A-G41 the four §12 reds are void",                  False, False,"four REDs were returned and are void"),
 (29,"A-G42 PF-8 / PG-11 frequency collision",            True,  False,"no verdict returned; it would misattribute energy when one is"),
 (30,"A-G43 splay keys on the mark, not the state",       True,  False,"no verdict returned; a counterTick mutant would pass PG-20"),
 (31,"A-G44 A-G23's scaling inherits a fixture",          True,  False,"no verdict returned; the bound moves with the fixture"),
 (32,"A-G49 a semantic carrier lives only in className",  False, False,"PINK's own PG-1 instrument would have under-counted the largest term"),
 (33,"A-G50 A-G4's justification falsified",              True,  True, "falsifies a justification; PG-5's bound is untouched either way"),
 (34,"A-G51 PG-18 has no satisfier at L1",                True,  False,"no verdict returned; PG-18 would be unsatisfiable at L1"),
 (35,"A-G54 a floor inherits its ground",                 False, False,"PINK's charge against PG-10 rested on it and was withdrawn"),
 (36,"A-G55 PG-1 cannot score an occluding semantic",     True,  False,"PG-1 PASSED and correction only raises it -> (a) neutral; but the measure sign-flips between sizes, so a near-0.55 build's verdict turns on the convention"),
 (37,"A-G56 the shelf ring absent at its darkest angle",  True,  False,"no PF-15 verdict returned; the rung it ladders is invisible"),
 (38,"A-G62 the shelf floor limb fails on arithmetic",    True,  True, "the limb was never measurable, so no verdict could rest on it"),
 (39,"A-G64 a reading credited to a lane that never took it", False, False,"a DECISION (A-G62) rested on it"),
 (40,"A-G65 min() contaminated exactly as max() was",     False, False,"GRÜN's ladder figures and A-G56's 'vindicated' rested on it"),
 (41,"A-G66 PF-15's local-ground limb ill-posed",         True,  False,"no verdict returned; which side is chosen decides it"),
 (42,"A-G71(a) G_ENTRY is in its own whitelist",          True,  False,"MAP-G-ARCH HELD and the set was tight; structurally it permits an undocumented widening"),
 (43,"A-G71(b) the scan exempts phase G's own JSON",      True,  False,"MAP-G-ARCH HELD; structurally a provider string in the spec JSON would pass"),
 (44,"A-G71(c) deleting field-g.test.tsx satisfies it",   True,  False,"MAP-G-ARCH HELD; structurally the proofs can be removed and the boundary still pass"),
 (45,"A-G72 A-G14 is VOID",                               False, False,"an ACCEPTANCE was conferred"),
 (46,"A-G73 the vectors cannot witness no-touch",         True,  False,"A-G14 HELD on the evidence; structurally a real violation at <1.4e-6 is invisible to the record"),
]
rows=[dict(zip(("id","adj","retro","struct","why"),r)) for r in R]
n=len(rows)
a=sum(1 for r in rows if r["retro"]); b=sum(1 for r in rows if r["struct"])
out={"criterion":"A-G16: 'could not change their verdict in either direction'",
 "readings":{"a_retrospective":"the verdict actually returned was unaffected",
             "b_structural":"the defect is incapable of affecting any verdict the pin could return"},
 "n":n,
 "neutral_under_a_retrospective":{"count":a,"fraction":round(a/n,3)},
 "neutral_under_b_structural":{"count":b,"fraction":round(b/n,3)},
 "PINK_original_mixed_count":{"count":7,"fraction":round(7/n,3),
   "defect":"PINK applied (b) to some rows and (a) to others without declaring which; the 29.2% is an undeclared mixture, not a measurement"},
 "A_G16_reference":{"count":9,"of":22,"fraction":round(9/22,3)},
 "conclusion":("The sub-count swings from %.1f%% to %.1f%% on an unstated reading of A-G16's own words. "
   "A quantity whose value moves by a factor of %.1f depending on which of two readings is taken, neither of "
   "which A-G16 declares, is not a measurement. So the neutral sub-count cannot carry PINK's charge (3), and "
   "PINK withdraws charge (3) as stated.")%(100*a/n,100*b/n,(a/n)/(b/n) if b else float('inf')),
 "rows":rows}
print(json.dumps(out,indent=1))
