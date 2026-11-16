import json, sys
import importlib.util as _ilu, pathlib as _pl
# F-R12: the fixture below used to be read through an absolute path into a sibling worktree that no longer
# exists, while the file is tracked HERE at the same relative path. The dead path is NOT reproduced in this
# comment: a scanner cannot tell prose from code, so quoting it would keep the string alive and make this
# file indistinguishable from an unrepaired one. Loaded by explicit path rather than via sys.path so nothing
# in the working directory can shadow the helper.
_spec = _ilu.spec_from_file_location("evidence_tools", _pl.Path(__file__).resolve().parents[4] / "docs/career_analysis/evidence/support/evidence_tools.py")
_et = _ilu.module_from_spec(_spec); _spec.loader.exec_module(_et)
D = sys.argv[1]
d = json.load(open(_et.repo_file("docs/examples/job-pool-tests/DLL_JOBPOOL_ENGINEERING.json")))
bad = json.loads(json.dumps(d)); bad["requirements"][0]["weight"] = 1.5; json.dump(bad, open(f"{D}/neg-weight.json", "w"))
ref = json.loads(json.dumps(d)); ref["roles"][0]["organization_id"] = "org_does_not_exist"; json.dump(ref, open(f"{D}/neg-ref.json", "w"))
big = json.loads(json.dumps(d)); big["pool"]["description"] = "x" * (1100 * 1024); json.dump(big, open(f"{D}/neg-big.json", "w"))
open(f"{D}/neg-syntax.json", "w").write('{"pool": {')
print("ok")
