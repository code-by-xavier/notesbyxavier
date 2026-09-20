// File: drizzle.config.ts
// ============================================================
// Notesby — Drizzle Kit Configuration
// Specifies schema path, migrations directory, and credentials.
// ============================================================

import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://notesby:notesby@127.0.0.1:5432/notesby',
  },
});
