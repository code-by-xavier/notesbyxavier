// File: src/lib/auth.ts
// ============================================================
// Notesby — Authentication & Session Management
// Type-safe session tokens, bcrypt password hashing, and user queries.
// Session tokens are stored only as SHA-256 hashes at rest.
// ============================================================

import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { eq, and, gt, lt } from 'drizzle-orm';
import { db } from '@/db';
import { users, sessions, siteSettings, type User, type Session } from '@/db/schema';

export const SESSION_COOKIE_NAME = 'notesby_session';
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

// bcrypt only considers the first 72 bytes; reject longer input instead of silently truncating.
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_BYTES = 72;

const TOKEN_RE = /^[0-9a-f]{64}$/;

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

let dummyHashPromise: Promise<string> | null = null;

/**
 * Spend the same bcrypt time as a real check when the account does not exist,
 * so response timing does not reveal which emails are registered.
 */
export async function burnPasswordCheck(password: string): Promise<void> {
  dummyHashPromise ??= hashPassword(crypto.randomBytes(16).toString('hex'));
  await bcrypt.compare(password, await dummyHashPromise);
}

/**
 * Generate a cryptographically secure random session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Create a new user session. The returned `token` is the raw cookie value;
 * only its hash is persisted.
 */
export async function createSession(userId: string): Promise<Session> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  const [session] = await db
    .insert(sessions)
    .values({ userId, token: hashToken(token), expiresAt })
    .returning();

  // Opportunistic cleanup of expired sessions; failure must never block sign-in.
  db.delete(sessions)
    .where(lt(sessions.expiresAt, new Date()))
    .catch((err) => console.warn('[auth] Expired session cleanup failed:', err));

  return { ...session, token };
}

/**
 * Validate a session token from request cookie
 */
export async function validateSession(
  token: string
): Promise<{ user: User; session: Session } | null> {
  if (!token || !TOKEN_RE.test(token)) return null;

  const result = await db
    .select({ user: users, session: sessions })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.token, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);

  return result[0] ?? null;
}

/**
 * Invalidate a session token on logout
 */
export async function invalidateSession(token: string): Promise<void> {
  if (!token || !TOKEN_RE.test(token)) return;
  await db.delete(sessions).where(eq(sessions.token, hashToken(token)));
}

// Setup can never be reverted, so once observed it is cached for the process lifetime.
let setupCompleted = false;

export function markSetupCompleted(): void {
  setupCompleted = true;
}

/**
 * Check whether the publication has been claimed and setup.
 * Throws on database failure: treating an outage as "not set up" would let
 * anyone reach the first-run wizard on a live site.
 */
export async function isSetupCompleted(): Promise<boolean> {
  if (setupCompleted) return true;

  const [settings] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
  if (settings?.isSetupCompleted) {
    setupCompleted = true;
    return true;
  }

  const existingUsers = await db.select({ id: users.id }).from(users).limit(1);
  if (existingUsers.length > 0) {
    setupCompleted = true;
    return true;
  }
  return false;
}
