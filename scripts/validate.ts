// File: scripts/validate.ts
// ============================================================
// Notesby — Platform Integrity & Resilient Validation Suite
// Bulletproof multi-phase verification of configuration, routing,
// content schemas, design system tokens, SCSS compilation,
// import path hygiene, Astro checks, TypeScript, and linting.
// ============================================================

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { notesConfig } from '@config';
import { ROUTES, EXTERNAL_LINKS } from '@/links';

console.log('\n============================================================');
console.log('🛡️  Notesby Full Platform Integrity & Validation Suite');
console.log('============================================================\n');

let errorCount = 0;
let warningCount = 0;

function pass(message: string) {
  console.log(`  ✓ ${message}`);
}

function fail(message: string) {
  console.error(`  ✗ ERROR: ${message}`);
  errorCount++;
}

function warn(message: string) {
  console.warn(`  ⚠️  WARN: ${message}`);
  warningCount++;
}

// ============================================================
// Phase 1: Publication Configuration Verification
// ============================================================
console.log('[1/8] Validating Publication Configuration (notes.config.ts)...');

if (!notesConfig.siteTitle || typeof notesConfig.siteTitle !== 'string') {
  fail('notesConfig.siteTitle must be a non-empty string.');
} else {
  pass(`Site Title: "${notesConfig.siteTitle}"`);
}

if (!notesConfig.authorName || typeof notesConfig.authorName !== 'string') {
  fail('notesConfig.authorName must be a non-empty string.');
} else {
  pass(`Author Name: "${notesConfig.authorName}"`);
}

if (!notesConfig.domain || !notesConfig.domain.startsWith('http')) {
  fail(
    `notesConfig.domain must be a valid URL starting with http:// or https:// (found: "${notesConfig.domain}").`
  );
} else {
  pass(`Domain: ${notesConfig.domain}`);
}

if (!Array.isArray(notesConfig.categories) || notesConfig.categories.length === 0) {
  fail('notesConfig.categories must be a non-empty array of categories.');
} else {
  const categoryNames = notesConfig.categories.map((c) => c.name);
  pass(`Configured Categories: [${categoryNames.join(', ')}]`);
}

if (!Array.isArray(notesConfig.navLinks) || notesConfig.navLinks.length === 0) {
  fail('notesConfig.navLinks must contain at least one navigation link.');
} else {
  let navLinksValid = true;
  notesConfig.navLinks.forEach((link) => {
    if (!link.label || !link.href) {
      fail(`Invalid nav link item: ${JSON.stringify(link)}`);
      navLinksValid = false;
    }
  });
  if (navLinksValid) {
    pass(`Navigation Links (${notesConfig.navLinks.length} items validated)`);
  }
}

// ============================================================
// Phase 2: Route & Link Registry Integrity
// ============================================================
console.log('\n[2/8] Validating Route Registry & Link Integrity (src/links.ts)...');

if (ROUTES.HOME !== '/') {
  fail(`ROUTES.HOME must be "/" (found: "${ROUTES.HOME}")`);
} else {
  pass('ROUTES.HOME === "/"');
}

if (ROUTES.RSS !== '/rss.xml') {
  fail(`ROUTES.RSS must be "/rss.xml" (found: "${ROUTES.RSS}")`);
} else {
  pass('ROUTES.RSS === "/rss.xml"');
}

const testSlug = 'sample-essay';
const generatedNoteRoute = ROUTES.NOTE(testSlug);
if (generatedNoteRoute !== `/notes/${testSlug}/`) {
  fail(
    `ROUTES.NOTE("${testSlug}") must end with strict trailing slash "/notes/${testSlug}/" (found: "${generatedNoteRoute}")`
  );
} else {
  pass('ROUTES.NOTE(slug) enforces strict trailing slash');
}

if (!ROUTES.ADMIN.LOGIN.startsWith('/admin/')) {
  fail(`ROUTES.ADMIN.LOGIN must start with "/admin/" (found: "${ROUTES.ADMIN.LOGIN}")`);
} else {
  pass('Admin routes namespace intact');
}

if (!EXTERNAL_LINKS.CLSTRE.startsWith('https://')) {
  fail(`EXTERNAL_LINKS.CLSTRE must start with https:// (found: "${EXTERNAL_LINKS.CLSTRE}")`);
} else {
  pass(`External Ecosystem Link: ${EXTERNAL_LINKS.CLSTRE}`);
}

// ============================================================
// Phase 3: Content Collections & Data Flow Consistency
// ============================================================
console.log('\n[3/8] Validating Content Collections & Frontmatter Schema...');

const notesDir = path.join(process.cwd(), 'src/content/notes');
if (!fs.existsSync(notesDir)) {
  fail(`src/content/notes directory not found at: ${notesDir}`);
} else {
  const noteFiles = fs.readdirSync(notesDir).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
  pass(`Discovered ${noteFiles.length} note files (.md / .mdx)`);

  const allowedCategories = new Set(
    (notesConfig.categories || []).map((c) => c.name.toLowerCase())
  );
  const seenSlugs = new Set<string>();

  noteFiles.forEach((file) => {
    const filePath = path.join(notesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const slug = file.replace(/\.(md|mdx)$/, '');

    // 1. Slug Collision Detection
    if (seenSlugs.has(slug)) {
      fail(`Slug collision detected! File "${file}" shares slug "${slug}" with another note.`);
    }
    seenSlugs.add(slug);

    // 2. Frontmatter Delimiters
    if (!content.startsWith('---')) {
      fail(`${file}: Missing opening YAML frontmatter delimiter (---).`);
      return;
    }

    const endDelimiterIdx = content.indexOf('\n---', 3);
    if (endDelimiterIdx === -1) {
      fail(`${file}: Missing closing YAML frontmatter delimiter (---).`);
      return;
    }

    const frontmatter = content.slice(3, endDelimiterIdx);

    // 3. Extract Frontmatter Fields
    const titleMatch = frontmatter.match(/title:\s*['"]?([^'"\n]+)['"]?/);
    const dateMatch = frontmatter.match(/pubDate:\s*['"]?([^'"\n]+)['"]?/);
    const categoryMatch = frontmatter.match(/category:\s*['"]?([^'"\n]+)['"]?/);
    const draftMatch = frontmatter.match(/draft:\s*(true|false)/);

    if (!titleMatch) {
      fail(`${file}: Missing required frontmatter "title".`);
    }

    if (!dateMatch) {
      fail(`${file}: Missing required frontmatter "pubDate".`);
    } else {
      const parsedDate = new Date(dateMatch[1]);
      if (isNaN(parsedDate.getTime())) {
        fail(`${file}: Invalid pubDate format "${dateMatch[1]}". Must be parseable date.`);
      }
    }

    if (!categoryMatch) {
      fail(`${file}: Missing required frontmatter "category".`);
    } else {
      const noteCategory = categoryMatch[1].trim().toLowerCase();
      if (!allowedCategories.has(noteCategory)) {
        warn(
          `${file}: Category "${categoryMatch[1]}" is not explicitly configured in notes.config.ts categories. It will be generated dynamically.`
        );
      }
    }

    if (!draftMatch) {
      warn(
        `${file}: "draft" field is omitted (will default to false). Explicit "draft: true/false" is recommended.`
      );
    }
  });

  pass('Content frontmatter schema and slug uniqueness validated cleanly');
}

// ============================================================
// Phase 4: SCSS Design System & Standalone Compilation
// ============================================================
console.log('\n[4/8] Validating SCSS Design System & Compilation...');

const abstractsDir = path.join(process.cwd(), 'src/styles/abstracts');
const variablesFile = path.join(abstractsDir, '_variables.scss');
const mixinsFile = path.join(abstractsDir, '_mixins.scss');
const indexFile = path.join(abstractsDir, '_index.scss');
const mainStylesFile = path.join(process.cwd(), 'src/styles/main.scss');

let variablesContent = '';

if (!fs.existsSync(variablesFile) || !fs.existsSync(mixinsFile) || !fs.existsSync(indexFile)) {
  fail('SCSS abstracts directory missing one of: _variables.scss, _mixins.scss, _index.scss');
} else {
  variablesContent = fs.readFileSync(variablesFile, 'utf8');

  // Verify CLSTRE Brand Blue
  if (!variablesContent.includes('#075aaa')) {
    fail('_variables.scss is missing the signature CLSTRE brand blue (#075aaa).');
  } else {
    pass('CLSTRE Brand Blue ($primary-accent: #075aaa) verified');
  }

  // Verify RSS Orange
  if (!variablesContent.includes('#f97316')) {
    fail('_variables.scss is missing the RSS accent color (#f97316).');
  } else {
    pass('RSS Accent Token ($rss-accent: #f97316) verified');
  }

  // Verify Breakpoints Map
  if (!variablesContent.includes('$breakpoints:')) {
    fail('_variables.scss is missing the $breakpoints map.');
  } else {
    pass('Responsive $breakpoints map verified');
  }

  // Verify Spacing Unit
  if (!variablesContent.includes('$spacing-unit:')) {
    fail('_variables.scss is missing $spacing-unit.');
  } else {
    pass('Spacing scale & unit tokens verified');
  }
}

if (!fs.existsSync(mainStylesFile)) {
  fail('src/styles/main.scss not found.');
} else {
  // Test standalone Sass compilation to temporary destination
  try {
    const tmpOut = path.join(process.cwd(), '.system_test_styles.css');
    execSync(`pnpm exec sass --no-source-map "${mainStylesFile}" "${tmpOut}"`, {
      stdio: 'pipe',
    });
    if (fs.existsSync(tmpOut)) {
      fs.unlinkSync(tmpOut);
    }
    pass('SCSS standalone compilation succeeded with zero syntax errors');
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    fail(`SCSS compilation failed: ${errorMsg}`);
  }

  // Verify all design system tokens used across .astro and .scss files exist in _variables.scss
  const definedTokens = new Set<string>();
  for (const match of variablesContent.matchAll(/\$([a-zA-Z0-9_-]+):/g)) {
    definedTokens.add(match[1]);
  }

  let undefinedTokenErrors = 0;
  function scanStyles(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanStyles(fullPath);
      } else if (/\.(astro|scss)$/.test(entry.name)) {
        const fileContent = fs.readFileSync(fullPath, 'utf8');
        for (const match of fileContent.matchAll(/(?:ui|v)\.\$([a-zA-Z0-9_-]+)/g)) {
          const varName = match[1];
          if (!definedTokens.has(varName)) {
            fail(
              `${path.relative(process.cwd(), fullPath)}: Undefined SCSS variable "${match[0]}". Not found in _variables.scss.`
            );
            undefinedTokenErrors++;
          }
        }
      }
    }
  }
  scanStyles(path.join(process.cwd(), 'src'));
  if (undefinedTokenErrors === 0) {
    pass('All SCSS design system tokens across .astro and .scss files verified');
  }
}

// ============================================================
// Phase 5: Import Path Enforcement & Zero-Relative-Import Rule
// ============================================================
console.log('\n[5/8] Enforcing Clean Path Aliases & Zero Relative Imports in src/...');

function scanForRelativeImports(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanForRelativeImports(fullPath);
    } else if (/\.(astro|ts|tsx|js|mjs)$/.test(entry.name)) {
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      const lines = fileContent.split('\n');
      lines.forEach((line, idx) => {
        // Look for import statements containing ../
        if (/import\s+.*from\s+['"]\.\.\//.test(line) || /import\s+['"]\.\.\//.test(line)) {
          fail(
            `${path.relative(process.cwd(), fullPath)}:${idx + 1}: Found relative import "${line.trim()}". Must use "@/" or "@config".`
          );
        }
      });
    }
  }
}

scanForRelativeImports(path.join(process.cwd(), 'src'));
pass('All source files adhere strictly to path aliases (@/, @config)');

// ============================================================
// Phase 6: Astro Diagnostic Check
// ============================================================
console.log('\n[6/8] Running Astro Diagnostic Check (astro check)...');

try {
  const astroCheckOutput = execSync('pnpm exec astro check', { encoding: 'utf8' });
  const errorMatch = astroCheckOutput.match(/(\d+)\s+errors?/i);
  if (errorMatch && parseInt(errorMatch[1], 10) > 0) {
    fail(`Astro check reported ${errorMatch[1]} error(s)`);
  } else {
    pass('Astro check passed with 0 errors');
  }
} catch (err: unknown) {
  const errorMsg =
    err instanceof Error && 'stdout' in err && (err as { stdout?: unknown }).stdout
      ? String((err as { stdout?: unknown }).stdout)
      : err instanceof Error
        ? err.message
        : String(err);
  fail(`Astro check failed:\n${errorMsg}`);
}

// ============================================================
// Phase 7: TypeScript Type Integrity
// ============================================================
console.log('\n[7/8] Running TypeScript Typecheck (tsc --noEmit)...');

try {
  execSync('pnpm exec tsc --noEmit', { stdio: 'pipe' });
  pass('TypeScript typecheck passed with 0 type errors');
} catch (err: unknown) {
  const errorMsg =
    err instanceof Error && 'stdout' in err && (err as { stdout?: unknown }).stdout
      ? String((err as { stdout?: unknown }).stdout)
      : err instanceof Error
        ? err.message
        : String(err);
  fail(`TypeScript typecheck failed:\n${errorMsg}`);
}

// ============================================================
// Phase 8: Code Formatting & Style Linting
// ============================================================
console.log('\n[8/8] Running Code Formatting & Lint Validation (prettier --check)...');

try {
  execSync('pnpm exec prettier --check .', { stdio: 'pipe' });
  pass('Prettier formatting & lint validation passed cleanly');
} catch {
  fail('Prettier detected unformatted files. Run "pnpm format" to fix.');
}

// ============================================================
// Summary & Exit
// ============================================================
console.log('\n============================================================');
if (errorCount > 0) {
  console.error(`❌ Validation FAILED: ${errorCount} error(s), ${warningCount} warning(s).`);
  console.log('============================================================\n');
  process.exit(1);
} else {
  console.log(
    `✅ All 8 Notesby integrity & quality checks PASSED cleanly! (${warningCount} warning(s))`
  );
  console.log('============================================================\n');
}
