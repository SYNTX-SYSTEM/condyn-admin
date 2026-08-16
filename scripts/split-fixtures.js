const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dir = path.join(__dirname, 'test/gold/case_001_minimal_valid/expected');
const expectedPath = path.join(dir, 'expected.json');
const inferencePath = path.join(dir, 'gemini-inference.json');
const canonicalPath = path.join(dir, 'canonical-expected.json');

// 1. Copy current expected (which is inference) to gemini-inference.json
fs.copyFileSync(expectedPath, inferencePath);
console.log('Copied to gemini-inference.json');

// 2. Restore expected.json from git HEAD
execSync(`git checkout HEAD -- ${expectedPath}`);
console.log('Restored expected.json from git HEAD');

// 3. Rename expected.json to canonical-expected.json
fs.renameSync(expectedPath, canonicalPath);
console.log('Renamed expected.json to canonical-expected.json');
