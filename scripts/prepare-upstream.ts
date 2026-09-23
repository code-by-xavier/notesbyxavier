// File: scripts/prepare-upstream.ts
// ============================================================
// Notesby — Sovereign Upstream Sync Preparation Script
// Prepares a clean 'upstream-syncing' branch with all engine fixes
// and modularization, while strictly excluding personal content,
// personal identity, deployment cheatsheets, and bespoke pages.
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
  console.log('🧹 Stripping personal files, cheatsheets, and sync scripts...');
  const filesToRemove = [
    'src/pages/projects.astro',
    'src/data/projects.ts',
    'src/content/notes/first-note.mdx',
    'docs/deployment-cheatsheet.md',
    'public/images/xavier-avatar.webp',
    'scripts/prepare-upstream.ts',
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
    configContent = configContent.replace(
      /siteLogo:\s*'[^']+'/,
      "siteLogo: '/images/notesby-logo-black.svg'"
    );
    configContent = configContent.replace(
      /siteLogoDark:\s*'[^']+'/,
      "siteLogoDark: '/images/notesby-logo-white.svg'"
    );

    fs.writeFileSync(configPath, configContent, 'utf-8');
    run('git add notes.config.ts', true);
    console.log('  ✓ Cleaned notes.config.ts (removed /projects nav link & genericized defaults)');
  }

  // 6. Sanitize astro.config.mjs (generic fallback domain)
  console.log('🌐 Sanitizing astro.config.mjs fallback domain...');
  const astroConfigPath = path.join(process.cwd(), 'astro.config.mjs');
  if (fs.existsSync(astroConfigPath)) {
    let astroContent = fs.readFileSync(astroConfigPath, 'utf-8');
    astroContent = astroContent.replace(
      /site:\s*process\.env\.PUBLIC_SITE_URL\s*\|\|\s*'[^']+'/,
      "site: process.env.PUBLIC_SITE_URL || 'https://example.com'"
    );
    fs.writeFileSync(astroConfigPath, astroContent, 'utf-8');
    run('git add astro.config.mjs', true);
    console.log('  ✓ Genericized astro.config.mjs domain fallback');
  }

  // 7. Sanitize src/links.ts (ecosystem brand link + personal routes)
  console.log('🔗 Sanitizing src/links.ts (author link + personal PROJECTS route)...');
  const linksPath = path.join(process.cwd(), 'src/links.ts');
  if (fs.existsSync(linksPath)) {
    let linksContent = fs.readFileSync(linksPath, 'utf-8');
    // Strip personal PROJECTS route — only lives in downstream notesbyxavier
    linksContent = linksContent.replace(/\s*PROJECTS:\s*'\/projects',?\n?/g, '\n');
    // Reset author link to generic ecosystem URL
    linksContent = linksContent.replace(/AUTHOR:\s*'[^']+'/, "AUTHOR: 'https://clstre.com'");
    fs.writeFileSync(linksPath, linksContent, 'utf-8');
    run('git add src/links.ts', true);
    console.log('  ✓ Removed ROUTES.PROJECTS and set EXTERNAL_LINKS.AUTHOR to https://clstre.com');
  }

  // 8. Sanitize package.json (name, description, repo links, and strip prepare:upstream)
  console.log('📦 Genericizing package.json for open-source engine...');
  const pkgPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    pkg.name = 'notesby';
    pkg.description =
      'An open-source, minimalist static publishing engine where every post is a note. Built for distraction-free reading, editorial essays, and sovereign cloud deployment.';
    pkg.homepage = 'https://github.com/code-by-xavier/';
    if (pkg.bugs) {
      pkg.bugs.url = 'https://github.com/CLSTRE-ORG/Notesby/issues';
      pkg.bugs.email = 'support@clstre.com';
    }
    if (pkg.scripts && pkg.scripts['prepare:upstream']) {
      delete pkg.scripts['prepare:upstream'];
    }
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
    run('git add package.json', true);
    console.log('  ✓ Genericized package.json and stripped prepare:upstream');
  }

  // 9. Format staged changes
  runSilent('pnpm run format');
  runSilent('git add -A');

  // 10. Validate upstream engine integrity
  console.log('\n🛡️  Running full platform validation on upstream-syncing branch...');
  run('pnpm run validate');

  // 11. Commit clean upstream changes
  console.log('\n💾 Committing upstream engine changes...');
  run(
    'git commit -m "chore(upstream): prepare engine sync excluding personal portfolio, cheatsheet, and downstream config"',
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
