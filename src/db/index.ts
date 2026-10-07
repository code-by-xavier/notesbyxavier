// File: src/db/index.ts
// ============================================================
// Notesby — PostgreSQL Database Connection & Drizzle ORM Instance
// Type-safe query engine connecting to Cloud SQL or local Postgres.
// ============================================================

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';
import 'dotenv/config';

// Never fall back to the dev credentials on Cloud Run (K_SERVICE is set there; it is not set during build).
if (!process.env.DATABASE_URL && process.env.K_SERVICE) {
  throw new Error('DATABASE_URL must be set in production.');
}

const connectionString =
  process.env.DATABASE_URL || 'postgresql://notesby:notesby@127.0.0.1:5432/notesby';

// db-f1-micro allows ~25 connections total; keep per-instance pools small so
// several Cloud Run instances cannot exhaust it.
const parsedMax = Number(process.env.DB_MAX_CONNECTIONS);
const maxConnections = Number.isInteger(parsedMax) && parsedMax > 0 ? parsedMax : 5;
const ssl =
  process.env.DATABASE_SSL === 'true'
    ? 'require'
    : connectionString.includes('sslmode=require')
      ? 'require'
      : undefined;

let socketHost: string | undefined;
let cleanConnectionString = connectionString;
try {
  const parsedUrl = new URL(connectionString);
  const hostQuery = parsedUrl.searchParams.get('host');
  if (hostQuery && hostQuery.startsWith('/')) {
    socketHost = hostQuery;
    parsedUrl.searchParams.delete('host');
    cleanConnectionString = parsedUrl.toString();
  }
} catch {
  // Use default TCP connection if connectionString is not a valid URL
}

// Postgres.js client with lightweight connection pooling optimized for Cloud Run & Cloud SQL
const client = postgres(cleanConnectionString, {
  max: maxConnections,
  ...(socketHost ? { host: socketHost } : {}),
  ...(ssl ? { ssl } : {}),
  idle_timeout: 20,
  connect_timeout: 10,
  max_lifetime: 60 * 30,
  onnotice: () => {},
  connection: { statement_timeout: 15_000 },
});

export const db = drizzle(client, { schema });
export { schema, client };

let schemaPromise: Promise<void> | null = null;

/** Idempotent schema bootstrap. Concurrent callers share one run; failures are retried on the next call. */
export function ensureSchema(): Promise<void> {
  schemaPromise ??= runSchemaBootstrap().catch((err) => {
    schemaPromise = null;
    console.error('[Database] Failed to ensure schema:', err);
  });
  return schemaPromise;
}

async function runSchemaBootstrap(): Promise<void> {
  await client.unsafe(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(255) NOT NULL,
        email varchar(255) NOT NULL UNIQUE,
        password_hash text NOT NULL,
        role varchar(50) DEFAULT 'admin' NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token text NOT NULL UNIQUE,
        expires_at timestamp NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
      CREATE TABLE IF NOT EXISTS site_settings (
        id integer PRIMARY KEY DEFAULT 1,
        is_setup_completed boolean DEFAULT false NOT NULL,
        site_title varchar(255) DEFAULT 'Notesby' NOT NULL,
        author_name varchar(255) DEFAULT 'Jane Doe' NOT NULL,
        author_bio text,
        author_avatar text,
        site_logo text,
        favicon text,
        apple_touch_icon text,
        og_image text,
        copyright_text text,
        post_bottom_copy text,
        about_text text,
        legal_entity_name varchar(255),
        privacy_policy_text text,
        terms_of_service_text text,
        ai_policy_text text,
        domain varchar(255) DEFAULT 'https://example.com',
        description text,
        twitter_url varchar(255),
        linkedin_url varchar(255),
        github_url varchar(255),
        contact_email varchar(255),
        subscription_enabled boolean DEFAULT true,
        subscription_section_headline varchar(255),
        subscription_section_subtext text,
        subscription_section_cta_label varchar(100),
        subscription_popup_enabled boolean DEFAULT true,
        subscription_popup_headline varchar(255),
        subscription_popup_subtext text,
        subscription_confirmed_headline varchar(255),
        subscription_confirmed_subtext text,
        showcase_enabled boolean DEFAULT false,
        showcase_eyebrow varchar(100),
        showcase_headline varchar(255),
        showcase_subtext text,
        showcase_cta_label varchar(100),
        showcase_cta_url varchar(500),
        showcase_image text,
        updated_at timestamp DEFAULT now() NOT NULL
      );
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS subscription_enabled boolean DEFAULT true;
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS subscription_section_headline varchar(255);
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS subscription_section_subtext text;
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS subscription_section_cta_label varchar(100);
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS subscription_popup_enabled boolean DEFAULT true;
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS subscription_popup_headline varchar(255);
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS subscription_popup_subtext text;
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS subscription_confirmed_headline varchar(255);
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS subscription_confirmed_subtext text;
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS showcase_enabled boolean DEFAULT false;
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS showcase_eyebrow varchar(100);
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS showcase_headline varchar(255);
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS showcase_subtext text;
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS showcase_cta_label varchar(100);
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS showcase_cta_url varchar(500);
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS showcase_image text;
      CREATE TABLE IF NOT EXISTS notes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title varchar(255) NOT NULL,
        subtitle text,
        slug varchar(255) NOT NULL UNIQUE,
        category varchar(50) DEFAULT 'Essays' NOT NULL,
        content text DEFAULT '' NOT NULL,
        excerpt text DEFAULT '' NOT NULL,
        tags text[],
        status varchar(20) DEFAULT 'draft' NOT NULL,
        reading_time varchar(50) DEFAULT '1 min read' NOT NULL,
        cover_image text,
        cover_image_alt text,
        author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        published_at timestamp,
        has_unpublished_changes boolean DEFAULT false NOT NULL,
        published_title varchar(255),
        published_subtitle text,
        published_content text,
        published_category varchar(50),
        published_cover_image text,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
      CREATE TABLE IF NOT EXISTS subscribers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email varchar(255) NOT NULL UNIQUE,
        source varchar(20) DEFAULT 'section' NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);
      CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);
      CREATE INDEX IF NOT EXISTS notes_author_id_idx ON notes (author_id);
      CREATE INDEX IF NOT EXISTS notes_status_published_at_idx ON notes (status, published_at DESC);
  `);
}
