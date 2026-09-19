// File: src/db/schema.ts
// ============================================================
// Notesby — Relational Database Schema (PostgreSQL)
// Defines users, sessions, and siteSettings models.
// ============================================================

import { pgTable, uuid, varchar, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

/**
 * Users Table — Authors, Editors, and Administrators
 */
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 50 }).default('admin').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Sessions Table — Active Authenticated Web Sessions
 */
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Site Settings Table — Sovereign Engine Configuration State
 */
export const siteSettings = pgTable('site_settings', {
  id: integer('id').primaryKey().default(1),
  isSetupCompleted: boolean('is_setup_completed').default(false).notNull(),
  siteTitle: varchar('site_title', { length: 255 }).default('Notesby').notNull(),
  authorName: varchar('author_name', { length: 255 }).default('Admin').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type SiteSettings = typeof siteSettings.$inferSelect;
