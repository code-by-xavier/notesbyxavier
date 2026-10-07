// File: src/pages/api/auth/setup.ts
// ============================================================
// Notesby — Onboarding Setup API Endpoint
// Creates the primary publication owner, initializes site settings,
// and issues an active session cookie. The claim is atomic: a Postgres
// advisory lock serializes concurrent attempts so only one can win.
// ============================================================

import type { APIRoute } from 'astro';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { users, siteSettings } from '@/db/schema';
import {
  hashPassword,
  createSession,
  isSetupCompleted,
  markSetupCompleted,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_BYTES,
} from '@/lib/auth';
import { ROUTES } from '@/links';
import { json, handleError, readJson, HttpError } from '@/lib/http';
import { rateLimit, tooManyRequests, clientKey } from '@/lib/rate-limit';
import { isValidEmail, isSafeMediaRef, normalizeHttpUrl, optString } from '@/lib/validation';

export const prerender = false;

const SETUP_LOCK_ID = 727_274_001;

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  try {
    const limit = rateLimit(`setup:${clientKey(() => clientAddress)}`, 10, 15 * 60 * 1000);
    if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

    if (await isSetupCompleted()) {
      return json({ error: 'Publication setup has already been completed.' }, 403);
    }

    const data = await readJson(request, 50_000);
    const siteTitle = optString(data, 'siteTitle', 255) ?? '';
    const authorName = optString(data, 'authorName', 255) ?? '';
    const authorBio = optString(data, 'authorBio', 5000) || null;
    const rawDomain = optString(data, 'domain', 255) ?? '';
    const avatarUrl = optString(data, 'avatarUrl', 2048) || null;
    const email = (optString(data, 'email', 254) ?? '').toLowerCase();
    const password = typeof data.password === 'string' ? data.password : '';

    if (!siteTitle) throw new HttpError(400, 'Publication title is required.');
    if (!authorName) throw new HttpError(400, 'Author name is required.');
    if (!isValidEmail(email)) throw new HttpError(400, 'A valid email address is required.');

    if (password.length < PASSWORD_MIN_LENGTH) {
      throw new HttpError(400, `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`);
    }
    if (Buffer.byteLength(password, 'utf8') > PASSWORD_MAX_BYTES) {
      throw new HttpError(400, `Password must be at most ${PASSWORD_MAX_BYTES} bytes long.`);
    }

    let domain: string | null = null;
    if (rawDomain) {
      const normalized = normalizeHttpUrl(rawDomain);
      if (!normalized) throw new HttpError(400, 'Domain must be a valid http(s) URL.');
      domain = new URL(normalized).origin;
    }
    if (avatarUrl && !isSafeMediaRef(avatarUrl)) {
      throw new HttpError(400, 'Avatar must be an http(s) URL or a site-relative path.');
    }

    const passwordHash = await hashPassword(password);

    const newUser = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${SETUP_LOCK_ID})`);

      const [settings] = await tx
        .select({ done: siteSettings.isSetupCompleted })
        .from(siteSettings)
        .where(eq(siteSettings.id, 1))
        .limit(1);
      const existing = await tx.select({ id: users.id }).from(users).limit(1);
      if (settings?.done || existing.length > 0) return null;

      const [created] = await tx
        .insert(users)
        .values({ name: authorName, email, passwordHash, role: 'admin' })
        .returning();

      const values = {
        isSetupCompleted: true,
        siteTitle,
        authorName,
        ...(authorBio ? { authorBio } : {}),
        ...(domain ? { domain } : {}),
        ...(avatarUrl ? { authorAvatar: avatarUrl } : {}),
      };
      await tx
        .insert(siteSettings)
        .values({ id: 1, ...values })
        .onConflictDoUpdate({
          target: siteSettings.id,
          set: { ...values, updatedAt: new Date() },
        });

      return created;
    });

    if (!newUser) {
      markSetupCompleted();
      return json({ error: 'Publication setup has already been completed.' }, 403);
    }
    markSetupCompleted();

    const session = await createSession(newUser.id);
    cookies.set(SESSION_COOKIE_NAME, session.token, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return json({ success: true, redirect: ROUTES.ADMIN.ROOT });
  } catch (error: unknown) {
    return handleError('setup', error, 'Failed to initialize publication.');
  }
};
