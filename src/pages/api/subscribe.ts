// File: src/pages/api/subscribe.ts
// ============================================================
// Notesby — Public Email Subscription Endpoint
// POST: Capture email opt-in, store in subscribers table.
// No auth required. Deduplicates on unique email constraint.
// ============================================================

import type { APIRoute } from 'astro';
import { db } from '@/db';
import { subscribers } from '@/db/schema';
import { ROUTES } from '@/links';

export const prerender = false;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const source = body.source === 'popup' ? 'popup' : 'section';

    // Server-side email validation
    if (!email || !EMAIL_REGEX.test(email)) {
      return new Response(JSON.stringify({ error: 'Please enter a valid email address.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Insert — on conflict (duplicate email) do nothing, still return success
    await db
      .insert(subscribers)
      .values({ email, source })
      .onConflictDoNothing({ target: subscribers.email });

    return new Response(JSON.stringify({ success: true, redirect: ROUTES.SUBSCRIBE_CONFIRMED }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[subscribe] Error:', err);
    return new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
