// File: src/lib/auth.ts
// ============================================================
// Notesby — Authentication & Session Management
// Type-safe session tokens, bcrypt password hashing, and user queries.
// ============================================================

import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { eq, and, gt } from 'drizzle-orm';
import { db } from '@/db';
import { users, sessions, siteSettings, type User, type Session } from '@/db/schema';

export const SESSION_COOKIE_NAME = 'notesby_session';
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

/**
 * Hash password securely with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verify plaintext password against stored hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a cryptographically secure random session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a new user session in the database
 */
export async function createSession(userId: string): Promise<Session> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  const [session] = await db
    .insert(sessions)
    .values({
      userId,
      token,
      expiresAt,
    })
    .returning();

  return session;
}

/**
 * Validate a session token from request cookie
 */
export async function validateSession(
  token: string
): Promise<{ user: User; session: Session } | null> {
  if (!token) return null;

  const now = new Date();
  const result = await db
    .select({
      user: users,
      session: sessions,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, now)))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return result[0];
}

/**
 * Invalidate a session token on logout
 */
export async function invalidateSession(token: string): Promise<void> {
  if (!token) return;
  await db.delete(sessions).where(eq(sessions.token, token));
}

/**
 * Check whether the publication has been claimed and setup
 */
export async function isSetupCompleted(): Promise<boolean> {
  try {
    const [settings] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);

    if (settings?.isSetupCompleted) {
      return true;
    }

    const existingUsers = await db.select({ id: users.id }).from(users).limit(1);
    return existingUsers.length > 0;
  } catch (error) {
    console.error('Error checking setup status:', error);
    return false;
  }
}
