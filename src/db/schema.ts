// File: src/db/schema.ts
// ============================================================
// Notesby — Relational Database Schema (PostgreSQL)
// Defines users, sessions, siteSettings, notes, and subscribers models.
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
  authorName: varchar('author_name', { length: 255 }).default('Jane Doe').notNull(),
  authorBio: text('author_bio'),
  authorAvatar: text('author_avatar'),
  siteLogo: text('site_logo'),
  favicon: text('favicon'),
  appleTouchIcon: text('apple_touch_icon'),
  ogImage: text('og_image'),
  copyrightText: text('copyright_text'),
  postBottomCopy: text('post_bottom_copy'),
  aboutText: text('about_text'),
  legalEntityName: varchar('legal_entity_name', { length: 255 }),
  privacyPolicyText: text('privacy_policy_text'),
  termsOfServiceText: text('terms_of_service_text'),
  aiPolicyText: text('ai_policy_text'),
  domain: varchar('domain', { length: 255 }).default('https://example.com'),
  description: text('description'),
  twitterUrl: varchar('twitter_url', { length: 255 }),
  linkedinUrl: varchar('linkedin_url', { length: 255 }),
  githubUrl: varchar('github_url', { length: 255 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  // Email Subscription Copy
  subscriptionEnabled: boolean('subscription_enabled').default(true),
  subscriptionSectionHeadline: varchar('subscription_section_headline', { length: 255 }),
  subscriptionSectionSubtext: text('subscription_section_subtext'),
  subscriptionSectionCtaLabel: varchar('subscription_section_cta_label', { length: 100 }),
  subscriptionPopupEnabled: boolean('subscription_popup_enabled').default(true),
  subscriptionPopupHeadline: varchar('subscription_popup_headline', { length: 255 }),
  subscriptionPopupSubtext: text('subscription_popup_subtext'),
  subscriptionConfirmedHeadline: varchar('subscription_confirmed_headline', { length: 255 }),
  subscriptionConfirmedSubtext: text('subscription_confirmed_subtext'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Notes Table — Essays, Op-Eds, and Field Notes
 */
export const notes = pgTable('notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  subtitle: text('subtitle'),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  category: varchar('category', { length: 50 }).default('Essays').notNull(),
  content: text('content').default('').notNull(),
  excerpt: text('excerpt').default('').notNull(),
  tags: text('tags').array(),
  status: varchar('status', { length: 20 }).default('draft').notNull(), // 'draft' | 'published' | 'archived'
  readingTime: varchar('reading_time', { length: 50 }).default('1 min read').notNull(),
  coverImage: text('cover_image'),
  coverImageAlt: text('cover_image_alt'),
  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  publishedAt: timestamp('published_at'),
  hasUnpublishedChanges: boolean('has_unpublished_changes').default(false).notNull(),
  publishedTitle: varchar('published_title', { length: 255 }),
  publishedSubtitle: text('published_subtitle'),
  publishedContent: text('published_content'),
  publishedCategory: varchar('published_category', { length: 50 }),
  publishedCoverImage: text('published_cover_image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Subscribers Table — Email List Opt-ins
 */
export const subscribers = pgTable('subscribers', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  source: varchar('source', { length: 20 }).default('section').notNull(), // 'section' | 'popup'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type Subscriber = typeof subscribers.$inferSelect;
export type NewSubscriber = typeof subscribers.$inferInsert;
