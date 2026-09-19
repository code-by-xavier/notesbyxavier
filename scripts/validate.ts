// File: scrips/validate.ts
// ============================================================
// Validate Notesby configuration and content.
// ============================================================

import fs from 'fs';
import path from 'path';
import { notesConfig } from '../notes.config';

console.log('Running Notesby validation suite...');

let hasErrors = false;

// 1. Validate notes.config.ts
console.log('  Checking notes.config.ts...');
if (!notesConfig.siteTitle || !notesConfig.authorName || !notesConfig.domain) {
  console.error('  Error: notesConfig is missing required siteTitle, authorName, or domain.');
  hasErrors = true;
} else {
  console.log('  notes.config.ts is valid.');
}

// 2. Validate Content Collection directory
console.log('  Checking src/content/notes/...');
const notesDir = path.join(process.cwd(), 'src/content/notes');
if (!fs.existsSync(notesDir)) {
  console.error('  Error: src/content/notes directory does not exist.');
  hasErrors = true;
} else {
  const files = fs.readdirSync(notesDir).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
  console.log(`  Found ${files.length} essay files (.md / .mdx).`);

  files.forEach((file) => {
    const content = fs.readFileSync(path.join(notesDir, file), 'utf8');
    if (!content.startsWith('---')) {
      console.error(`  Error: ${file} is missing YAML frontmatter delimiters (---).`);
      hasErrors = true;
    }
  });
  console.log('  Content files validated successfully.');
}

// 3. Exit code
if (hasErrors) {
  console.error('\nValidation failed with errors.');
  process.exit(1);
} else {
  console.log('\nAll Notesby validation checks passed cleanly.');
}
