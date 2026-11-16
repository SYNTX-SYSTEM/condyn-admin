# PINK — PORTABLE EVIDENCE LAYER V1 · GENERATION RECORD

Generated `2026-11-16T12:22:16.405Z` from `validation/hr-decision-loop-pink` @ `aafeae46`.

## What this layer is, and what it is not

It is a **separately versioned regeneration** of the 83 PINK instruments sealed in
`mapping-phase-{e,f,g}-contract/scripts/`, carrying the portability repair. It is **additive**:
all **167** historical seal entries are unchanged, and this generator has no
`--in-place` mode and does not read `PINK_SEAL_OVERRIDE`.

It is **not** a re-measurement. Not one figure in the sealed outputs is recomputed here. The repair is
to **resolution and provenance only** — an instrument that resolves everywhere and is pointed at a
different build measures *that* build, exactly as `PINK-SYSTEM-VALIDATION.md` §1 bounds it.

## Why a manifest would not have been enough (A-G499)

> A checksum answers 'is this venue internally consistent?' and never 'does it describe the build it claims to'. This layer's own manifest.sha256 is therefore NOT evidence of provenance — it would verify perfectly against any content generated at the same time. The per-instrument triple below is the provenance evidence: manifest digest, recomputed digest, output digest. Generation REFUSES if any recomputed source digest differs from its historical manifest line.

So each of the 83 instruments below carries **three** digests — the digest **as read from the
historical manifest line**, the digest **recomputed from disk**, and the **output** digest — and
**generation refuses entirely if any recomputed source digest differs from its manifest line**
(exit 4, before the first output file is written).

## The resolver is not copied into this layer

> pink-tools.mjs derives REPO_ROOT five levels up from its own directory. A copy at <layer>/mapping-phase-pink-tools/ is one level too deep, derives REPO_ROOT=<repo>/docs, finds no .git and THROWS AT IMPORT by its own guard. Measured, not reasoned. One canonical copy also cannot drift.

Imported as `../../../mapping-phase-pink-tools/pink-tools.mjs` (3 levels up), digest
`b52f9878290fdbea…`. **Cost:** the layer is valid only at the depth it was
generated for; `--verify` re-derives that depth rather than trusting it.

## Census

| | |
|---|---|
| instruments | 83 |
| in the historical seal | 83 |
| rewritten into this layer | 80 |
| unchanged (nothing to repair) | 3 |
| change sites | 222 |
| historical seal entries, before and after | 167 |

## Verifying this layer

Two independent checks, and the second is the one that matters:

```
cd <layer> && sha256sum -c manifest.sha256          # internal consistency only
node ../mapping-phase-pink-tools/pink-layer-build.mjs --verify <layer>   # provenance against the seal
```

## Per-instrument record

| instrument | source digest (manifest) | recomputed | integrity | output digest | repairs |
|---|---|---|---|---|---|
| `mapping-phase-e-contract/scripts/pink-a8.mjs` | `982b604888c4` | `982b604888c4` | MATCHES SEAL | `84a34d71c5ea` | 2 |
| `mapping-phase-e-contract/scripts/pink-breath.mjs` | `f9fa8d935e2c` | `f9fa8d935e2c` | MATCHES SEAL | `622d72ce9d14` | 2 |
| `mapping-phase-e-contract/scripts/pink-e8b.mjs` | `2876dc77224a` | `2876dc77224a` | MATCHES SEAL | `c930666934af` | 2 |
| `mapping-phase-e-contract/scripts/pink-facade-p13.mts` | `04df789f786d` | `04df789f786d` | MATCHES SEAL | `098cf8f65a35` | 2 |
| `mapping-phase-e-contract/scripts/pink-facade-p4.mts` | `46eb20fc55e6` | `46eb20fc55e6` | MATCHES SEAL | `0b61ba5bd196` | 2 |
| `mapping-phase-e-contract/scripts/pink-facade.mts` | `15c0d0d669f3` | `15c0d0d669f3` | MATCHES SEAL | `a1cc975c848b` | 1 |
| `mapping-phase-e-contract/scripts/pink-p1235.mjs` | `35c8e3a43ecd` | `35c8e3a43ecd` | MATCHES SEAL | `f98ea06bb9f3` | 2 |
| `mapping-phase-e-contract/scripts/pink-p13.mjs` | `b54dde6ed628` | `b54dde6ed628` | MATCHES SEAL | `36cb5990b2e4` | 2 |
| `mapping-phase-e-contract/scripts/pink-p4-mutants.mjs` | `3acda0484b93` | `3acda0484b93` | MATCHES SEAL | `58efc1ee73c4` | 2 |
| `mapping-phase-e-contract/scripts/pink-p4.mjs` | `5895f9069dc4` | `5895f9069dc4` | MATCHES SEAL | `30807d28a1df` | 2 |
| `mapping-phase-e-contract/scripts/pink-p6-jsbranch.mjs` | `2aa841a1ab94` | `2aa841a1ab94` | MATCHES SEAL | `af7929412ec4` | 2 |
| `mapping-phase-e-contract/scripts/pink-p8-rendered.mjs` | `bab66dc300f5` | `bab66dc300f5` | MATCHES SEAL | `78fd4499c8c7` | 2 |
| `mapping-phase-e-contract/scripts/pink-pending-breath.mjs` | `2717d7ebac74` | `2717d7ebac74` | MATCHES SEAL | `3345df123df6` | 2 |
| `mapping-phase-e-contract/scripts/pink-prep2.mjs` | `26b387a31b01` | `26b387a31b01` | MATCHES SEAL | `6cb44f332b3b` | 2 |
| `mapping-phase-e-contract/scripts/pink-static-mutants.mjs` | `0d95052650af` | `0d95052650af` | MATCHES SEAL | `a6e38c06ad4b` | 2 |
| `mapping-phase-f-contract/scripts/pink-breath-vs-floor.mjs` | `f6ffc1c54b0b` | `f6ffc1c54b0b` | MATCHES SEAL | `5f863f7a9734` | 3 |
| `mapping-phase-f-contract/scripts/pink-class-probe.mjs` | `b134c7b559ab` | `b134c7b559ab` | MATCHES SEAL | `e9f956eb831a` | 1 |
| `mapping-phase-f-contract/scripts/pink-continuity.mjs` | `d13dd5cd3132` | `d13dd5cd3132` | MATCHES SEAL | `5587842db9a3` | 2 |
| `mapping-phase-f-contract/scripts/pink-continuity2.mjs` | `8c07e007f897` | `8c07e007f897` | MATCHES SEAL | `e1d4b95af4a7` | 2 |
| `mapping-phase-f-contract/scripts/pink-facade.mts` | `15c0d0d669f3` | `15c0d0d669f3` | MATCHES SEAL | `a1cc975c848b` | 1 |
| `mapping-phase-f-contract/scripts/pink-floor-regions.mjs` | `900b8510db22` | `900b8510db22` | MATCHES SEAL | `8c0c5904e996` | 3 |
| `mapping-phase-f-contract/scripts/pink-pf8-lockin.mjs` | `611af804462e` | `611af804462e` | MATCHES SEAL | `4e826b2ec08d` | 3 |
| `mapping-phase-f-contract/scripts/pink-pf8-lockin2.mjs` | `c77c70f02fc1` | `c77c70f02fc1` | MATCHES SEAL | `72538211ae56` | 3 |
| `mapping-phase-f-contract/scripts/pink-pf8-lockin3.mjs` | `b55c1d2cc69c` | `b55c1d2cc69c` | MATCHES SEAL | `a4543fba823d` | 3 |
| `mapping-phase-f-contract/scripts/pink-pf8-lockin3b.mjs` | `a708875a17e3` | `a708875a17e3` | MATCHES SEAL | `22c40a9e95d6` | 3 |
| `mapping-phase-f-contract/scripts/pink-pf8-perclass.mjs` | `11d77e279f03` | `11d77e279f03` | MATCHES SEAL | `16b93519436c` | 4 |
| `mapping-phase-f-contract/scripts/pink-pf8-perclass2.mjs` | `2f79541f31d1` | `2f79541f31d1` | MATCHES SEAL | `241ceebcbe43` | 4 |
| `mapping-phase-f-contract/scripts/pink-pf8-tip.mjs` | `507a0575e7e8` | `507a0575e7e8` | MATCHES SEAL | `0ba2a2b546e9` | 4 |
| `mapping-phase-f-contract/scripts/pink-pf8-under.mjs` | `a4b7ffa3197c` | `a4b7ffa3197c` | MATCHES SEAL | `05aeb9768222` | 2 |
| `mapping-phase-f-contract/scripts/pink-pf8-window.mjs` | `3c501fbf8dce` | `3c501fbf8dce` | MATCHES SEAL | `855013a85e4a` | 3 |
| `mapping-phase-f-contract/scripts/pink-pg1-attr.mjs` | `4ea03b3d9198` | `4ea03b3d9198` | MATCHES SEAL | `3e81444afa5a` | 2 |
| `mapping-phase-f-contract/scripts/pink-pg1.mjs` | `9b72681e85cc` | `9b72681e85cc` | MATCHES SEAL | `2bceb761e502` | 3 |
| `mapping-phase-f-contract/scripts/pink-pixels-floor.mjs` | `82a810cd6032` | `82a810cd6032` | MATCHES SEAL | `78ccbdb4b97d` | 2 |
| `mapping-phase-f-contract/scripts/pink-pixels.mjs` | `44caa40ea60f` | `44caa40ea60f` | MATCHES SEAL | `2a2675293b36` | 4 |
| `mapping-phase-f-contract/scripts/pink-probe-dom.mjs` | `5e667c8d877f` | `5e667c8d877f` | MATCHES SEAL | `a509411bf4f5` | 1 |
| `mapping-phase-f-contract/scripts/pink-probe-rings.mjs` | `cd00e8292ea5` | `cd00e8292ea5` | MATCHES SEAL | `1cf77c98ffd2` | 1 |
| `mapping-phase-f-contract/scripts/pink-rings-pixels.mjs` | `246b935dc910` | `246b935dc910` | MATCHES SEAL | `4b3648e2b161` | 3 |
| `mapping-phase-f-contract/scripts/pink-shot-timing.mjs` | `576903e32419` | `576903e32419` | MATCHES SEAL | `b2763c17d9d9` | 2 |
| `mapping-phase-f-contract/scripts/pink-tip-probe.mjs` | `0d1be70dda9d` | `0d1be70dda9d` | MATCHES SEAL | `770dae8f3553` | 1 |
| `mapping-phase-f-contract/scripts/pink-tip-timing.mjs` | `9a73d062c9c5` | `9a73d062c9c5` | MATCHES SEAL | `c9a8512fccce` | 2 |
| `mapping-phase-g-contract/scripts/pink-ag16-criterion.py` | `64f1d4fdc418` | `64f1d4fdc418` | MATCHES SEAL | `—` | — |
| `mapping-phase-g-contract/scripts/pink-ag16-ledger.py` | `db2b1c292479` | `db2b1c292479` | MATCHES SEAL | `—` | — |
| `mapping-phase-g-contract/scripts/pink-ag340-capability-g.mjs` | `9d76fd6f7a91` | `9d76fd6f7a91` | MATCHES SEAL | `edb5ea0ceeda` | 4 |
| `mapping-phase-g-contract/scripts/pink-ag366-foreign-g.mjs` | `63ff460f2577` | `63ff460f2577` | MATCHES SEAL | `4d54edfa9e0a` | 4 |
| `mapping-phase-g-contract/scripts/pink-ag373-numerator-g.mjs` | `0e2bf125b7c7` | `0e2bf125b7c7` | MATCHES SEAL | `2db1e3d12e8d` | 4 |
| `mapping-phase-g-contract/scripts/pink-ag406-seam-g.mjs` | `14425cb4a68c` | `14425cb4a68c` | MATCHES SEAL | `ee69345528c4` | 3 |
| `mapping-phase-g-contract/scripts/pink-ag412-carrier-g.mjs` | `5b8897eb4ca8` | `5b8897eb4ca8` | MATCHES SEAL | `623c3c7b361b` | 3 |
| `mapping-phase-g-contract/scripts/pink-ag412-isolated-g.mjs` | `f303d5399b1c` | `f303d5399b1c` | MATCHES SEAL | `229013bd9c34` | 3 |
| `mapping-phase-g-contract/scripts/pink-ag412-swingratio-g.mjs` | `06a7873429b2` | `06a7873429b2` | MATCHES SEAL | `affc021d12e4` | 3 |
| `mapping-phase-g-contract/scripts/pink-ag425-alphasweep-g.mjs` | `4c2ab1ff8b17` | `4c2ab1ff8b17` | MATCHES SEAL | `b9bf24e2b3b4` | 2 |
| `mapping-phase-g-contract/scripts/pink-ag434-seamprofile-g.mjs` | `0617ac01fa70` | `0617ac01fa70` | MATCHES SEAL | `208d8efd8b11` | 3 |
| `mapping-phase-g-contract/scripts/pink-ag442-rasterbackend-g.mjs` | `d89587ef8032` | `d89587ef8032` | MATCHES SEAL | `a4a40044e582` | 2 |
| `mapping-phase-g-contract/scripts/pink-depthgain-normalisation-g.mjs` | `253515580af1` | `253515580af1` | MATCHES SEAL | `9cf932a83577` | 2 |
| `mapping-phase-g-contract/scripts/pink-facade.mts` | `15c0d0d669f3` | `15c0d0d669f3` | MATCHES SEAL | `a1cc975c848b` | 1 |
| `mapping-phase-g-contract/scripts/pink-floor-g.mjs` | `fdef87ae8088` | `fdef87ae8088` | MATCHES SEAL | `49f92f790c74` | 4 |
| `mapping-phase-g-contract/scripts/pink-glow-travel.mjs` | `ed3c20dd3961` | `ed3c20dd3961` | MATCHES SEAL | `f18a8d6ac380` | 3 |
| `mapping-phase-g-contract/scripts/pink-halo-mask.mjs` | `80b933bc1d41` | `80b933bc1d41` | MATCHES SEAL | `017666aa452c` | 3 |
| `mapping-phase-g-contract/scripts/pink-pf11-pf6-blurred-g.mjs` | `9401e6c52ee9` | `9401e6c52ee9` | MATCHES SEAL | `9e69fbe67f36` | 4 |
| `mapping-phase-g-contract/scripts/pink-pf15-g.mjs` | `3005a474b0fa` | `3005a474b0fa` | MATCHES SEAL | `dfeed1afc899` | 4 |
| `mapping-phase-g-contract/scripts/pink-pf15-shelf-alpha-sweep-g.mjs` | `948b78f3c626` | `948b78f3c626` | MATCHES SEAL | `7ee21b496aeb` | 4 |
| `mapping-phase-g-contract/scripts/pink-pf2-dim-inversion-g.mjs` | `9d425c3cc1aa` | `9d425c3cc1aa` | MATCHES SEAL | `749cbe37c5b7` | 4 |
| `mapping-phase-g-contract/scripts/pink-pf3-halo-differential-g.mjs` | `8d50352413fd` | `8d50352413fd` | MATCHES SEAL | `a813491163dc` | 4 |
| `mapping-phase-g-contract/scripts/pink-pf4-limb3-focus-g.mjs` | `64d85032aa12` | `64d85032aa12` | MATCHES SEAL | `37ea0c3ce213` | 3 |
| `mapping-phase-g-contract/scripts/pink-pf5-pf7-mutants-g.mjs` | `78f87a04becb` | `78f87a04becb` | MATCHES SEAL | `06c13ae914e6` | 3 |
| `mapping-phase-g-contract/scripts/pink-pf6-pf4-g.mjs` | `6bc97ed47f57` | `6bc97ed47f57` | MATCHES SEAL | `6fdae4f7c681` | 4 |
| `mapping-phase-g-contract/scripts/pink-pf8-rings-retake-g.mjs` | `bf034f646321` | `bf034f646321` | MATCHES SEAL | `e9de36803c23` | 4 |
| `mapping-phase-g-contract/scripts/pink-pg1-g.mjs` | `cacff1121d9a` | `cacff1121d9a` | MATCHES SEAL | `341bdaf2ddc2` | 4 |
| `mapping-phase-g-contract/scripts/pink-pg10-g.mjs` | `d7c81a4b51a6` | `d7c81a4b51a6` | MATCHES SEAL | `367cb6376688` | 4 |
| `mapping-phase-g-contract/scripts/pink-pg10-limb1-blur-g.mjs` | `41670eb20776` | `41670eb20776` | MATCHES SEAL | `dd6530ffa2fc` | 4 |
| `mapping-phase-g-contract/scripts/pink-pg10-limb1-maskfloor-g.mjs` | `5582460d49fd` | `5582460d49fd` | MATCHES SEAL | `fb7b55b15e50` | 4 |
| `mapping-phase-g-contract/scripts/pink-pg10-limb3-g.mjs` | `39325cbde602` | `39325cbde602` | MATCHES SEAL | `e5bee978dda2` | 4 |
| `mapping-phase-g-contract/scripts/pink-pg10-radial-pg23-g.mjs` | `d9ebd477bdd7` | `d9ebd477bdd7` | MATCHES SEAL | `7ba14967fabf` | 4 |
| `mapping-phase-g-contract/scripts/pink-pg14-label-containment-g.mjs` | `9033168194c9` | `9033168194c9` | MATCHES SEAL | `d4608024d15f` | 3 |
| `mapping-phase-g-contract/scripts/pink-pg17-extent-g.mjs` | `f29a9a2f6258` | `f29a9a2f6258` | MATCHES SEAL | `044872aadab4` | 3 |
| `mapping-phase-g-contract/scripts/pink-pg17-extent-sweep-g.mjs` | `cb2aee3d88b0` | `cb2aee3d88b0` | MATCHES SEAL | `47fd7338b173` | 3 |
| `mapping-phase-g-contract/scripts/pink-pg23-alpha-g.mjs` | `de6b5c41102a` | `de6b5c41102a` | MATCHES SEAL | `174640c0bf87` | 3 |
| `mapping-phase-g-contract/scripts/pink-pg23-diag-g.mjs` | `f0a673bedc59` | `f0a673bedc59` | MATCHES SEAL | `128f0014ed2e` | 2 |
| `mapping-phase-g-contract/scripts/pink-pg3-sizefloor-g.mjs` | `71966ec2b602` | `71966ec2b602` | MATCHES SEAL | `2bea7dce3bb5` | 3 |
| `mapping-phase-g-contract/scripts/pink-seat-occluder-g.mjs` | `2a8455133834` | `2a8455133834` | MATCHES SEAL | `cadf7efc6e17` | 1 |
| `mapping-phase-g-contract/scripts/pink-shelf-g.mjs` | `f10253648efc` | `f10253648efc` | MATCHES SEAL | `823dd65960e5` | 4 |
| `mapping-phase-g-contract/scripts/pink-taxonomy-g.mjs` | `b74ef75e6ba4` | `b74ef75e6ba4` | MATCHES SEAL | `90a8c42a3801` | 3 |
| `mapping-phase-g-contract/scripts/pink-tip-timing-g.mjs` | `d90963f6d1a3` | `d90963f6d1a3` | MATCHES SEAL | `d5c8f3f537d7` | 4 |
| `mapping-phase-g-contract/scripts/pink-v11-reference.py` | `e766ac834b3f` | `e766ac834b3f` | MATCHES SEAL | `—` | — |

*PINK. Validation only — never implementation, never integration. No merge, no push to `main`, no
production deployment. Gemini disabled throughout.*
