import fs from 'fs';
import path from 'path';

const filesToDelete = [
  'bisection.ts', 'check.ts', 'schema-bisection.ts', 'schema-bisection-mjs.ts',
  'runner.js', 'test-full.mjs', 'trace-pdf.ts', 'trace-pdf-5.ts', 'migrate.js',
  'pdflist.txt', 'schema_output.json', 'bisection_results.txt', 'find_pdf.ts',
  'forensics-step2.ts', 'forensics.ts', 'test-schema.ts',
  'scripts/split.ts', 'scripts/split-fixtures.js', 'scripts/extract-git.sh', 'scripts/update-imports.ts'
];

for (const file of filesToDelete) {
  try {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`Deleted ${file}`);
    }
  } catch (e) {
    console.log(`Failed to delete ${file}`);
  }
}

const diagDir = path.join(__dirname, '../scripts/diagnostics');
if (!fs.existsSync(diagDir)) {
  fs.mkdirSync(diagDir, { recursive: true });
}

if (fs.existsSync('test-pdf.ts')) {
  fs.renameSync('test-pdf.ts', path.join(diagDir, 'test-pdf.ts'));
  console.log('Moved test-pdf.ts');
}

console.log('Cleanup done');
