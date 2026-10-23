PINK · OWNER_GO_FULL_PXJ_CLOSURE · candidate 421e382 (frontend/pxj-first-screen-g1, fast-forward of 88539d3 + N-1…N-5)
Section §3.60 of docs/architecture/decision-fields/JOB_POOL_CONNECTION_VALIDATION.md.

Evidence classes, kept apart:
  STAND_IN               PINK's own lab :41873, deterministic loopback stand-in (STAND-IN · keine Modellausführung), disposable DB.
                         nav-STANDIN-dev-*, nav-STANDIN-prod-*, repro-AB-dev-vs-prod, x22-prod-*, regression-*.
                         "prod" = local production build (next start) with LAB_ONLY_BUILD_FLAG (LAB_ONLY_BUILD_FLAG.txt; never committed).
  PERSISTED_REAL_RESULT  GELB's owner acceptance lab :41872, GET only, no token: accept-41872-*, lineage-41872-api.txt.
                         No quote text, no screenshots; first-screen text only as sha256/16.
  CODE_INSPECTION        static-421e382.txt.
  SUITE                  suite-421e382.txt.
Scripts (scripts/*.txt): pink-nav, pink-accept, pink-repro, pink-g1-walk, summ.py, run-fc.sh, run-suite.sh. pink-rf-sweep and
pink-x22 are unchanged from evidence/role-field-closure-88539d3/scripts. Local paths are placeholders (${PINK_SCRATCH}, ${PINK_REPO}).
Proof scripts are evidence, not live tests.
