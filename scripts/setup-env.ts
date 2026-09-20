// File: scripts/setup-env.ts
// ============================================================
// Notesby — Environment Variable Synchronization Script
// Reads .env.local and process.env, resolves environment topology
// (Local, GitHub Codespaces, Google Cloud Shell, Cloud Run),
// hydrates .env.template, and generates the active .env file.
// ============================================================

import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();

function getLocalEnvValues(): Record<string, string> {
  const localEnvPath = path.join(ROOT_DIR, '.env.local');
  const values: Record<string, string> = {};

  if (fs.existsSync(localEnvPath)) {
    const content = fs.readFileSync(localEnvPath, 'utf-8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const [key, ...valueParts] = trimmed.split('=');
      if (key) values[key.trim()] = valueParts.join('=').trim();
    });
  }
  return values;
}

function hydrate(): void {
  console.log('⚡ Synchronizing Notesby Environment Configuration...');
  const localValues = getLocalEnvValues();
  const getVal = (key: string): string => process.env[key] || localValues[key] || '';

  const codespaceName = getVal('CODESPACE_NAME');
  const cloudShellHost =
    getVal('WEB_HOST') || (process.env.DEVSHELL_PROJECT_ID ? 'cloudshell' : '');
  const port = getVal('PORT') || '4330';
  const postgresPort = getVal('POSTGRES_PORT') || '5432';

  let siteUrl = getVal('PUBLIC_SITE_URL') || `http://localhost:${port}`;

  if (codespaceName && codespaceName !== 'local') {
    siteUrl = `https://${codespaceName}-${port}.app.github.dev`;
    console.log(`🌐 Detected Environment: GitHub Codespaces (${codespaceName})`);
  } else if (cloudShellHost && cloudShellHost !== 'local') {
    siteUrl = `https://${port}-${cloudShellHost}`;
    console.log(`🌐 Detected Environment: Google Cloud Shell`);
  } else {
    console.log(`🌐 Detected Environment: Local Machine (${siteUrl})`);
  }

  const overrides: Record<string, string> = {
    PORT: port,
    HOST: getVal('HOST') || '0.0.0.0',
    PUBLIC_SITE_URL: siteUrl,
    POSTGRES_USER: getVal('POSTGRES_USER') || 'notesby',
    POSTGRES_PASSWORD: getVal('POSTGRES_PASSWORD') || 'notesby',
    POSTGRES_DB: getVal('POSTGRES_DB') || 'notesby',
    POSTGRES_PORT: postgresPort,
    SESSION_SECRET:
      getVal('SESSION_SECRET') ||
      'notesby_dev_secret_key_change_in_production_min_32_chars_long_random',
    NOTESBY_SETUP_COMPLETED: getVal('NOTESBY_SETUP_COMPLETED') || 'false',
    GCS_BUCKET_NAME: getVal('GCS_BUCKET_NAME') || 'notesby-media',
    STORAGE_EMULATOR_HOST: getVal('STORAGE_EMULATOR_HOST') || 'http://127.0.0.1:4443',
    GCS_PUBLIC_URL: getVal('GCS_PUBLIC_URL') || 'http://localhost:4443',
  };

  const templatePath = path.join(ROOT_DIR, '.env.template');
  const targetPath = path.join(ROOT_DIR, '.env');

  if (!fs.existsSync(templatePath)) {
    throw new Error('.env.template not found in root directory.');
  }

  const templateLines = fs.readFileSync(templatePath, 'utf-8').split('\n');
  const finalLines: string[] = [];

  for (const line of templateLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      finalLines.push(line);
      continue;
    }

    const [key] = trimmed.split('=');

    if (key === 'DATABASE_URL') {
      const explicitDbUrl = getVal('DATABASE_URL');
      if (explicitDbUrl) {
        finalLines.push(`DATABASE_URL=${explicitDbUrl}`);
      } else {
        const user = overrides.POSTGRES_USER;
        const pass = overrides.POSTGRES_PASSWORD;
        const dbName = overrides.POSTGRES_DB;
        const pPort = overrides.POSTGRES_PORT;
        finalLines.push(`DATABASE_URL=postgresql://${user}:${pass}@127.0.0.1:${pPort}/${dbName}`);
      }
      continue;
    }

    if (key && overrides[key] !== undefined) {
      finalLines.push(`${key}=${overrides[key]}`);
      continue;
    }

    let processedLine = line.replace(/\${(\w+)}/g, (_, varName: string) => {
      return getVal(varName) || overrides[varName] || '';
    });

    if (key && getVal(key)) {
      processedLine = `${key}=${getVal(key)}`;
    }

    finalLines.push(processedLine);
  }

  fs.writeFileSync(targetPath, finalLines.join('\n') + '\n');
  console.log('✅ Generated .env from .env.template and .env.local');

  // If local GCS emulator is running, ensure default bucket exists
  const emulatorHost = overrides.STORAGE_EMULATOR_HOST;
  const bucketName = overrides.GCS_BUCKET_NAME;
  if (emulatorHost && emulatorHost.includes('127.0.0.1')) {
    fetch(`${emulatorHost}/storage/v1/b`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: bucketName }),
    }).catch(() => {
      // Emulator might not be up yet, safe to ignore
    });
  }
}

try {
  hydrate();
} catch (error) {
  console.error('❌ Environment synchronization failed:', error);
  process.exit(1);
}
