// File: src/pages/api/auth/login.ts
// ============================================================
// Notesby — Authentication Login API Endpoint
// Verifies credentials, generates session token, and sets cookie.
// Rate-limited per client and per account; constant-time on unknown emails.
// ============================================================

import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import {
  verifyPassword,
  burnPasswordCheck,
  createSession,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from '@/lib/auth';
import { ROUTES } from '@/links';
import { json, handleError, readJson } from '@/lib/http';
import { rateLimit, resetRateLimit, tooManyRequests, clientKey } from '@/lib/rate-limit';

export const prerender = false;

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_CLIENT = 20;
const MAX_PER_ACCOUNT = 8;

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  try {
    const body = await readJson(request, 10_000);
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password || email.length > 254 || password.length > 1024) {
      return json({ error: 'Email and password are required.' }, 400);
    }

    const clientLimit = rateLimit(
      `login:ip:${clientKey(() => clientAddress)}`,
      MAX_PER_CLIENT,
      WINDOW_MS
    );
    const accountKey = `login:acct:${email}`;
    const accountLimit = rateLimit(accountKey, MAX_PER_ACCOUNT, WINDOW_MS);
    if (!clientLimit.ok || !accountLimit.ok) {
      return tooManyRequests(
        Math.max(clientLimit.retryAfterSeconds, accountLimit.retryAfterSeconds),
        'Too many sign-in attempts. Please try again later.'
      );
    }

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    const isValid = user
      ? await verifyPassword(password, user.passwordHash)
      : (await burnPasswordCheck(password), false);

    if (!user || !isValid) {
      return json({ error: 'Invalid email or password.' }, 401);
    }

    resetRateLimit(accountKey);
    const session = await createSession(user.id);

    cookies.set(SESSION_COOKIE_NAME, session.token, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return json({ success: true, redirect: ROUTES.ADMIN.ROOT });
  } catch (error: unknown) {
    return handleError('login', error, 'Authentication failed. Please try again.');
  }
};
