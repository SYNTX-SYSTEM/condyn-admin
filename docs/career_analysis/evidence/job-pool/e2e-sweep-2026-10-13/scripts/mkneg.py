import json, sys
D = sys.argv[1]
d = json.load(open("/home/codi/Entwicklung/condyn-admin-e2e/docs/examples/job-pool-tests/DLL_JOBPOOL_ENGINEERING.json"))
bad = json.loads(json.dumps(d)); bad["requirements"][0]["weight"] = 1.5; json.dump(bad, open(f"{D}/neg-weight.json", "w"))
ref = json.loads(json.dumps(d)); ref["roles"][0]["organization_id"] = "org_does_not_exist"; json.dump(ref, open(f"{D}/neg-ref.json", "w"))
big = json.loads(json.dumps(d)); big["pool"]["description"] = "x" * (1100 * 1024); json.dump(big, open(f"{D}/neg-big.json", "w"))
open(f"{D}/neg-syntax.json", "w").write('{"pool": {')
print("ok")
