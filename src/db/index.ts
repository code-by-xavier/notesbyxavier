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
export { schema, client };

let schemaInitialized = false;

export async function ensureSchema() {
  if (schemaInitialized) return;
  try {
    await client`
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
        updated_at timestamp DEFAULT now() NOT NULL
      );
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
    `;
    schemaInitialized = true;
  } catch (err) {
    console.error('[Database] Failed to ensure schema:', err);
  }
}
