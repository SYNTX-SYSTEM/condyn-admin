BUG 007: STABLE
BUG 008: STABLE
BUG 009: STABLE (Targeted Green)

BUG 010A: TARGETED GREEN PENDING
BUG 010B: CANDIDATE / MINIMAL GREEN IMPLEMENTED / TARGETED GREEN PENDING
Root Cause: Gemini rejects the projected schema due to `definitions` usage (needs `$defs`).
Action: Fixed a false positive in the test walker regarding the `$schema` domain property. No production changes. Awaiting test execution.

TEST 001B: OPEN
