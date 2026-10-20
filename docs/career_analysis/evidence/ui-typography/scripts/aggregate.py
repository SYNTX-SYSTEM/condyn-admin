import json, sys, glob, collections, os
files = sorted(glob.glob(os.path.join(sys.argv[1], "*.inv.json")))
agg = collections.OrderedDict()
for f in files:
    st = os.path.basename(f).split("-", 1)[1].rsplit("-", 1)[0]
    for it in json.load(open(f))["items"]:
        if it["opacity"] < 0.5 or it["box"][2] < 3 or it["box"][3] < 3: continue
        k = it["key"]
        a = agg.setdefault(k, {"n": 0, "sizes": collections.Counter(), "minc": 99, "texts": [], "states": set(), "clipped": 0, "tt": set()})
        a["n"] += 1; a["sizes"][it["size"]] += 1; a["minc"] = min(a["minc"], it["contrast"]); a["states"].add(st); a["clipped"] += it["clipped"]; a["tt"].add(it["tt"])
        if len(a["texts"]) < 4 and it["text"] not in [t for t, _ in a["texts"]]: a["texts"].append((it["text"][:40], it["size"]))
rows = sorted(agg.items(), key=lambda kv: min(kv[1]["sizes"]))
for k, a in rows:
    mn = min(a["sizes"]); mx = max(a["sizes"])
    if mn >= float(sys.argv[2] if len(sys.argv) > 2 else 99): continue
    print(f'{mn:5.2f}-{mx:5.2f} c{a["minc"]:5.2f} n{a["n"]:4d} clip{a["clipped"]:3d} {k[:48]:48s} {"; ".join(f"{t}@{s}" for t, s in a["texts"][:3])[:150]}')
