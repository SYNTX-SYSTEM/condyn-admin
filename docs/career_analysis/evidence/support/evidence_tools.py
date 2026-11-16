"""GELB · the Python half of the evidence resolver — same principle as evidence-tools.mjs, F-R12/F-R13.

Two instruments (`mkneg.py`, `scale.py`) read a fixture through an absolute path into
an absolute path into a sibling worktree that *** NO LONGER EXISTS ON THIS MACHINE ***, while
the file they want is tracked in this repository at the identical relative path. So they resolved nowhere.

The root is DERIVED from this file's location and the derivation REFUSES if it lands somewhere that is not a
checkout of this repository, pinned on the REPOSITORY'S ROOT COMMIT — the one object every clone holds on
every branch (F-R13; the phase-G base commit used elsewhere is in 7 of 124 refs and not an ancestor of
`main`, so it would refuse a genuine checkout). `existsSync`-style presence is not identity: an input must
be GIT-TRACKED here, because an untracked file is satisfied by `touch` and makes the run unreproducible.
"""
import pathlib
import subprocess

IDENTITY_COMMIT = "29266f9c4958d75ac7261e3748e71df12d50b8e4"
# <repo>/docs/career_analysis/evidence/support/evidence_tools.py -> <repo>
REPO_ROOT = pathlib.Path(__file__).resolve().parents[4]


def _assert_this_repository() -> None:
    if not (REPO_ROOT / ".git").exists():
        raise SystemExit(f"REFUSE evidence_tools: derived REPO_ROOT {REPO_ROOT} holds no .git — refusing to read a "
                         "tree that is not a checkout of this repository rather than reporting a measurement from one.")
    try:
        subprocess.run(["git", "-C", str(REPO_ROOT), "cat-file", "-e", f"{IDENTITY_COMMIT}^{{commit}}"],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except subprocess.CalledProcessError:
        raise SystemExit(f"REFUSE evidence_tools: {REPO_ROOT} is a git checkout but NOT of this repository — it does "
                         f"not hold the root commit {IDENTITY_COMMIT[:8]}. A shallow clone lacks it too: "
                         "`git fetch --unshallow` and run again.")


def repo_file(relative_path: str) -> str:
    """A declared, repository-relative input. Refuses loudly rather than reading a stray file."""
    _assert_this_repository()
    absolute = REPO_ROOT / relative_path
    if not absolute.exists():
        raise SystemExit(f"REFUSE evidence_tools: declared input {relative_path} is absent at {absolute}. It is a "
                         "tracked file of this repository, so a checkout missing it is incomplete — fetch rather "
                         "than substitute (F-R12).")
    try:
        subprocess.run(["git", "-C", str(REPO_ROOT), "ls-files", "--error-unmatch", relative_path],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except subprocess.CalledProcessError:
        raise SystemExit(f"REFUSE evidence_tools: {relative_path} exists but is NOT git-tracked here — presence is "
                         "satisfied by touch, and an untracked input makes the run unreproducible.")
    return str(absolute)
