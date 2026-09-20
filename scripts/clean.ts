// File: scripts/clean.ts
// ============================================================
// Notesby — Sovereign Platform Cleanup Engine
// Granular, cross-platform maintenance utility for clearing caches,
// build artifacts, node_modules, local uploads, and Docker volumes.
//
// Usage:
//   tsx ./scripts/clean.ts [flags]
//
// Flags:
//   --cache     Clean build artifacts and caches (.astro, dist, logs) [default]
//   --deps      Clean node_modules and build caches
//   --uploads   Clean uploaded files in public/uploads/ (preserves .gitkeep)
//   --docker    Reset Docker containers and purge volumes (down -v)
//   --all       Full reset: cache + deps + uploads + Docker volumes
//   --full      Alias for --all
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT_DIR = process.cwd();

// Parse CLI flags
const rawArgs = process.argv.slice(2);
const flags = new Set(rawArgs.map((arg) => arg.toLowerCase().trim()));

const isAll = flags.has('--all') || flags.has('--full');
const isDeps = isAll || flags.has('--deps');
const isUploads = isAll || flags.has('--uploads');
const isDocker = isAll || flags.has('--docker');
// If no specific flag is supplied, default to cleaning cache
const isCache =
  isAll ||
  flags.has('--cache') ||
  (!flags.has('--deps') && !flags.has('--uploads') && !flags.has('--docker'));

console.log('\n============================================================');
console.log('🧹 Notesby Platform Cleanup Engine');
console.log('============================================================\n');

let removedCount = 0;
let bytesFreed = 0;

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function calculateDirSize(dirPath: string): number {
  let size = 0;
  if (!fs.existsSync(dirPath)) return 0;
  try {
    const stats = fs.statSync(dirPath);
    if (!stats.isDirectory()) return stats.size;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        size += calculateDirSize(fullPath);
      } else {
        try {
          size += fs.statSync(fullPath).size;
        } catch {
          // Ignore transient or permission errors
        }
      }
    }
  } catch {
    // Ignore stat errors
  }
  return size;
}

function safeRemove(relPath: string, description: string) {
  const targetPath = path.join(ROOT_DIR, relPath);
  if (!fs.existsSync(targetPath)) {
    return;
  }

  // Safety check: Ensure target path resides within ROOT_DIR and is not ROOT_DIR itself
  const resolved = path.resolve(targetPath);
  if (resolved === ROOT_DIR || !resolved.startsWith(ROOT_DIR)) {
    console.warn(`  ⚠️  Skipped unsafe path: ${relPath}`);
    return;
  }

  try {
    const size = calculateDirSize(targetPath);
    fs.rmSync(targetPath, { recursive: true, force: true });
    bytesFreed += size;
    removedCount++;
    console.log(
      `  ✓ Removed ${description} (${relPath}) ${size > 0 ? `[${formatBytes(size)}]` : ''}`
    );
  } catch (err: any) {
    console.error(`  ✗ Failed to remove ${relPath}: ${err.message}`);
  }
}

function cleanUploadsDir() {
  const uploadsDir = path.join(ROOT_DIR, 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) return;

  console.log('\n📦 Purging Local Uploads (public/uploads/)...');
  let filesRemoved = 0;
  let uploadBytes = 0;

  try {
    const entries = fs.readdirSync(uploadsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === '.gitkeep') continue;
      const fullPath = path.join(uploadsDir, entry.name);
      const size = calculateDirSize(fullPath);
      fs.rmSync(fullPath, { recursive: true, force: true });
      uploadBytes += size;
      filesRemoved++;
    }
    bytesFreed += uploadBytes;
    removedCount += filesRemoved;
    console.log(
      `  ✓ Cleaned ${filesRemoved} uploaded media file(s) [${formatBytes(uploadBytes)}] (kept .gitkeep)`
    );
  } catch (err: any) {
    console.error(`  ✗ Error cleaning uploads directory: ${err.message}`);
  }
}

function cleanLogsAndTemp() {
  try {
    const entries = fs.readdirSync(ROOT_DIR);
    for (const file of entries) {
      if (
        file.endsWith('.log') ||
        file.includes('-debug.log') ||
        file.endsWith('.tsbuildinfo') ||
        file === '.system_test_styles.css'
      ) {
        safeRemove(file, 'log/temporary file');
      }
    }
  } catch {
    // Ignore readdir errors
  }
}

function resetDocker() {
  console.log('\n🐳 Resetting Docker Services & Volumes...');
  try {
    execSync('docker compose down -v', { cwd: ROOT_DIR, stdio: 'inherit' });
    console.log(
      '  ✓ Docker containers stopped and volumes (notesby_pgdata, notesby_storage_data) wiped'
    );
  } catch (err: any) {
    console.warn(`  ⚠️  Docker command failed or Docker is not running: ${err.message}`);
  }
}

// 1. Clean Cache & Build Artifacts
if (isCache) {
  console.log('⚡ Purging Build Caches & Artifacts...');
  safeRemove('.astro', 'Astro framework cache');
  safeRemove('dist', 'Production build output');
  safeRemove('.temp', 'Temporary scratch directory');
  cleanLogsAndTemp();
}

// 2. Clean Dependencies
if (isDeps) {
  console.log('\n📦 Purging Dependencies (node_modules)...');
  safeRemove('node_modules', 'Node modules directory');
}

// 3. Clean Local Uploads
if (isUploads) {
  cleanUploadsDir();
}

// 4. Reset Docker Volumes
if (isDocker) {
  resetDocker();
}

console.log('\n============================================================');
console.log(
  `✅ Cleanup Completed! Removed ${removedCount} item(s) ~ ${formatBytes(bytesFreed)} freed.`
);
console.log('============================================================\n');
