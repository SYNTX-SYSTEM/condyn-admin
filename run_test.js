const { execSync } = require('child_process');
const fs = require('fs');
try {
  const out = execSync('npx vitest run test/career-pipeline.test.ts', { encoding: 'utf-8' });
  fs.writeFileSync('output.txt', out);
} catch (err) {
  fs.writeFileSync('output.txt', err.stdout + '\n\n' + err.stderr);
}
