#!/bin/bash
git cat-file -p $(git rev-parse HEAD:test/gold/case_001_minimal_valid/expected/expected.json) > test/gold/case_001_minimal_valid/expected/canonical-expected.json
cp test/gold/case_001_minimal_valid/expected/expected.json test/gold/case_001_minimal_valid/expected/gemini-inference.json
