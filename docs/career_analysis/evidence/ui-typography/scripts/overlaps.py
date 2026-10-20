# Text collisions: two visible text runs of different elements whose text rects intersect (> 6 px²), per snapshot.
import json, glob, sys, os
def items(f):
    for i, it in enumerate(json.load(open(f))["items"]):
        if it["opacity"] < 0.5 or not it.get("rects"): continue
        yield i, it
def overlaps(f):
    its = list(items(f)); out = []
    for a in range(len(its)):
        for b in range(a + 1, len(its)):
            (ia, A), (ib, B) = its[a], its[b]
            for ra in A["rects"]:
                for rb in B["rects"]:
                    w = min(ra[2], rb[2]) - max(ra[0], rb[0]); h = min(ra[3], rb[3]) - max(ra[1], rb[1])
                    if w > 2 and h > 2 and w * h > 6:
                        out.append((A["key"], A["text"][:30], B["key"], B["text"][:30], round(w * h))); break
                else: continue
                break
    return out
if __name__ == "__main__":
    for f in sorted(glob.glob(os.path.join(sys.argv[1], "*.inv.json"))):
        o = overlaps(f)
        for x in o: print(os.path.basename(f)[:-9], "|", x[0][:30], repr(x[1]), "×", x[2][:30], repr(x[3]), x[4])
