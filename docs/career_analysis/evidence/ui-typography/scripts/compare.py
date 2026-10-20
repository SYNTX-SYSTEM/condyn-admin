# Baseline vs after, per text carrier (data-testid key): rendered size range, weakest contrast, clipped runs, and the collisions of
# every frame. argv: <baseline dir> <after dir> [--md]. Only runs at opacity >= 0.5 and at least 3 px (receded depth layers excluded).
import json, glob, os, sys, collections
def load(d):
    frames = {}
    for f in sorted(glob.glob(os.path.join(d, "*.inv.json"))):
        name = os.path.basename(f)[:-9]; name = name.split("-", 1)[1].rsplit("-", 1)[0]
        frames[name] = json.load(open(f))
    return frames
def carriers(frames):
    agg = collections.defaultdict(lambda: {"sizes": [], "contrast": [], "clipped": 0, "n": 0, "text": ""})
    for fr in frames.values():
        for it in fr["items"]:
            if it["opacity"] < 0.5 or it["box"][2] < 3 or it["box"][3] < 3: continue
            a = agg[it["key"]]; a["sizes"].append(it["size"]); a["contrast"].append(it["contrast"]); a["clipped"] += it["clipped"]; a["n"] += 1
            if not a["text"]: a["text"] = it["text"][:36]
    return agg
def collisions(frames):
    out = []
    for name, fr in frames.items():
        for c in fr.get("collisions", []):
            if c["at"].strip(" :·") and c["bt"].strip(" :·"): out.append((name, c["a"], c["at"], c["b"], c["bt"], c["area"]))
    return out
B, A = load(sys.argv[1]), load(sys.argv[2]); md = "--md" in sys.argv
cb, ca = carriers(B), carriers(A)
print(f"frames: baseline {len(B)}, after {len(A)}")
rows = []
for k in sorted(set(cb) | set(ca), key=lambda k: min(cb[k]["sizes"] or [99]) if k in cb else 99):
    b, a = cb.get(k), ca.get(k)
    f = lambda x: f'{min(x["sizes"]):.1f}–{max(x["sizes"]):.1f}' if x and x["sizes"] else "—"
    g = lambda x: f'{min(x["contrast"]):.1f}' if x and x["contrast"] else "—"
    rows.append((k, f(b), f(a), g(b), g(a), b["clipped"] if b else "—", a["clipped"] if a else "—", (b or a)["text"]))
if md:
    print("| carrier | size before | size after | contrast before | after | clipped before | after | sample |\n|---|---|---|---|---|---|---|---|")
    for r in rows: print("| `" + r[0] + "` | " + " | ".join(str(x) for x in r[1:7]) + f" | {r[7]} |")
else:
    for r in rows: print(f"{r[0][:44]:44s} {r[1]:>11s} → {r[2]:<11s} c {r[3]:>5s} → {r[4]:<5s} clip {r[5]!s:>3s} → {r[6]!s:<3s} {r[7]}")
print("\ncollisions baseline:"); [print("  ", *c) for c in collisions(B)]
print("collisions after:"); [print("  ", *c) for c in collisions(A)]
