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

// Postgres.js client with lightweight connection pooling
const client = postgres(connectionString, { max: 10 });

export const db = drizzle(client, { schema });
export { schema };
