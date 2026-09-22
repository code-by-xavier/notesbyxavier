// File: scripts/prepare-upstream.ts
// ============================================================
// Notesby — Sovereign Upstream Sync Preparation Script
// Prepares a clean 'upstream-syncing' branch with all engine fixes
// and modularization, while strictly excluding personal content,
// personal identity, and the site-specific projects showcase page.
// ============================================================

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function run(cmd: string, silent = false): string {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: silent ? 'pipe' : 'inherit' });
  } catch (err: any) {
    if (!silent) {
      console.error(`❌ Command failed: ${cmd}`);
    }
    throw err;
  }
}

function runSilent(cmd: string): string {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch {
    return '';
  }
}

console.log('============================================================');
console.log('🚀 Preparing Clean Upstream Sync Branch for Notesby Master');
console.log('============================================================\n');

// 1. Ensure working directory is clean
const status = runSilent('git status --porcelain');
if (status.length > 0) {
  console.error('❌ Error: Working tree contains uncommitted changes.');
  console.error('Please commit or stash your changes before preparing the upstream branch.\n');
  process.exit(1);
}

// 2. Identify current branch
const originalBranch = runSilent('git rev-parse --abbrev-ref HEAD') || 'main';
console.log(`📌 Current working branch: "${originalBranch}"`);

try {
  // 3. Create or reset upstream-syncing branch to current branch
  console.log('🔄 Checking out or creating "upstream-syncing" branch...');
  runSilent('git checkout -B upstream-syncing');

  // 4. Remove site-specific personal files
  console.log('🧹 Stripping site-specific portfolio and personal notes...');
  const filesToRemove = [
    'src/pages/projects.astro',
    'src/data/projects.ts',
    'src/content/notes/first-note.mdx',
    'docs/deployment-cheatsheet.md', // Personal project-specific cheatsheet — downstream only
  ];

  for (const relPath of filesToRemove) {
    const fullPath = path.join(process.cwd(), relPath);
    if (fs.existsSync(fullPath)) {
      run(`git rm -f --ignore-unmatch ${relPath}`, true);
      console.log(`  ✓ Removed ${relPath}`);
    }
  }

  // 5. Sanitize notes.config.ts for generic open-source upstream
  console.log('⚙️  Sanitizing notes.config.ts for generic open-source distribution...');
  const configPath = path.join(process.cwd(), 'notes.config.ts');
  if (fs.existsSync(configPath)) {
    let configContent = fs.readFileSync(configPath, 'utf-8');

    // Remove the Projects navigation link
    configContent = configContent.replace(
      /\s*\{\s*label:\s*'Projects',\s*href:\s*'\/projects'\s*\},?\n?/g,
      '\n'
    );

    // Reset author name, site title, and domain to generic template defaults
    configContent = configContent.replace(/siteTitle:\s*'[^']+'/, "siteTitle: 'Notesby'");
    configContent = configContent.replace(/authorName:\s*'[^']+'/, "authorName: 'Jane Doe'");
    configContent = configContent.replace(/domain:\s*'[^']+'/, "domain: 'https://example.com'");
    configContent = configContent.replace(
      /description:\s*'[^']+'/,
      "description: 'A personal publication featuring essays, op-eds, and field notes.'"
    );

    fs.writeFileSync(configPath, configContent, 'utf-8');
    run('git add notes.config.ts', true);
    console.log('  ✓ Cleaned notes.config.ts (removed /projects nav link & genericized defaults)');
  }

  // 6. Sanitize package.json (name & description)
  console.log('📦 Genericizing package.json for open-source engine...');
  const pkgPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    pkg.name = 'notesby';
    pkg.description =
      'An open-source, minimalist static publishing engine where every post is a note. Built for distraction-free reading, editorial essays, and sovereign cloud deployment.';
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
    run('git add package.json', true);
    console.log('  ✓ Set package.json name to "notesby"');
  }

  // 7. Format staged changes
  runSilent('pnpm run format');
  runSilent('git add -A');

  // 8. Validate upstream engine integrity
  console.log('\n🛡️  Running full platform validation on upstream-syncing branch...');
  run('pnpm run validate');

  // 9. Commit clean upstream changes
  console.log('\n💾 Committing upstream engine changes...');
  run(
    'git commit -m "chore(upstream): prepare engine sync excluding site-specific portfolio and personal notes"',
    true
  );

  console.log('\n============================================================');
  console.log('✅ "upstream-syncing" branch is prepared, validated, and ready!');
  console.log('============================================================');
  console.log('\nTo push these changes to the upstream master repository:');
  console.log('  git push upstream upstream-syncing:main');
  console.log('or:');
  console.log('  git push upstream upstream-syncing:develop\n');
} finally {
  // Always return to original branch
  console.log(`🔙 Returning to original branch: "${originalBranch}"...`);
  runSilent(`git checkout ${originalBranch}`);
  console.log(`✓ Back on "${originalBranch}".\n`);
}
