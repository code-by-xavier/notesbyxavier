// File: src/db/index.ts
// ============================================================
// Notesby — PostgreSQL Database Connection & Drizzle ORM Instance
// Type-safe query engine connecting to Cloud SQL or local Postgres.
// ============================================================

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';
import 'dotenv/config';

const connectionString =
  process.env.DATABASE_URL || 'postgresql://notesby:notesby@127.0.0.1:5432/notesby';

const maxConnections = Number(process.env.DB_MAX_CONNECTIONS || 10);
const ssl =
  process.env.DATABASE_SSL === 'true'
    ? 'require'
    : connectionString.includes('sslmode=require')
      ? 'require'
      : undefined;

// Postgres.js client with lightweight connection pooling optimized for Cloud Run & Cloud SQL
const client = postgres(connectionString, {
  max: maxConnections,
  ...(ssl ? { ssl } : {}),
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
export { schema };
