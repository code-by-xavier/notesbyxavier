// File: src/pages/api/subscribe.ts
// ============================================================
// Notesby — Public Email Subscription Endpoint
// POST: Capture email opt-in, store in subscribers table.
// No auth required. Rate-limited; deduplicates on unique email constraint.
// ============================================================

import type { APIRoute } from 'astro';
import { db } from '@/db';
import { subscribers } from '@/db/schema';
import { ROUTES } from '@/links';
import { json, handleError, readJson } from '@/lib/http';
import { rateLimit, tooManyRequests, clientKey } from '@/lib/rate-limit';
import { isValidEmail } from '@/lib/validation';

export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const limit = rateLimit(`subscribe:${clientKey(() => clientAddress)}`, 10, 10 * 60 * 1000);
    if (!limit.ok) {
      return tooManyRequests(limit.retryAfterSeconds, 'Too many attempts. Please try again later.');
    }

    const body = await readJson(request, 2_000);
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const source = body.source === 'popup' ? 'popup' : 'section';

    if (!isValidEmail(email)) {
      return json({ error: 'Please enter a valid email address.' }, 400);
    }

    // Duplicate emails are a no-op but still report success (no enumeration signal).
    await db
      .insert(subscribers)
      .values({ email, source })
      .onConflictDoNothing({ target: subscribers.email });

    return json({ success: true, redirect: ROUTES.SUBSCRIBE_CONFIRMED });
  } catch (err: unknown) {
    return handleError('subscribe', err, 'Something went wrong. Please try again.');
  }
};
