# Baseline vs after of condition-probe.mjs: per frame (zoom, font, locale, state) the clipped runs and collisions that are new after
# the sweep, those that are gone, and the smallest rendered size. argv: <baseline conditions.json> <after conditions.json>.
import json, sys, collections
B, A = (json.load(open(p)) for p in sys.argv[1:3])
key = lambda r: (r["zoom"], r["font"], r["lang"], r["state"])
b, a = {key(r): r for r in B}, {key(r): r for r in A}
new_clip, gone_clip, new_col, gone_col, sizes, n = collections.Counter(), collections.Counter(), collections.Counter(), collections.Counter(), [], 0
for k, ra in a.items():
    rb = b.get(k)
    if rb is None or "error" in ra or "error" in rb: print("not compared", k, ra.get("error"), (rb or {}).get("error")); continue
    n += 1; sizes.append((rb["minSize"], ra["minSize"]))
    for x in set(ra["clipped"]) - set(rb["clipped"]): new_clip[(k[0], x[:60])] += 1
    for x in set(rb["clipped"]) - set(ra["clipped"]): gone_clip[(k[0], x[:60])] += 1
    for x in set(ra["collisions"]) - set(rb["collisions"]): new_col[(k[0], k[1], x[:110])] += 1
    for x in set(rb["collisions"]) - set(ra["collisions"]): gone_col[(k[0], k[1], x[:110])] += 1
print(f"frames compared: {n}; smallest rendered size: baseline {min(s[0] for s in sizes):.1f} px, after {min(s[1] for s in sizes):.1f} px")
for title, c in (("new clipped", new_clip), ("no longer clipped", gone_clip), ("new collisions", new_col), ("collisions gone", gone_col)):
    print(f"{title}: {sum(c.values())}"); [print("  ", v, *k) for k, v in sorted(c.items())]
