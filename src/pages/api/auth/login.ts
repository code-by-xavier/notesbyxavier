// File: src/pages/api/auth/login.ts
// ============================================================
// Notesby — Authentication Login API Endpoint
// Verifies credentials, generates session token, and sets cookie.
// ============================================================

import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import {
  verifyPassword,
  createSession,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from '@/lib/auth';
import { ROUTES } from '@/links';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const data = await request.json();
    const email = (data.email || '').trim().toLowerCase();
    const password = data.password || '';

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid email or password.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid email or password.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate secure session
    const session = await createSession(user.id);

    cookies.set(SESSION_COOKIE_NAME, session.token, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return new Response(JSON.stringify({ success: true, redirect: ROUTES.ADMIN.ROOT }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Login endpoint error:', error);
    return new Response(JSON.stringify({ error: 'Authentication failed. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
