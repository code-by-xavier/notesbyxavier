// File: src/pages/api/auth/setup.ts
// ============================================================
// Notesby — Onboarding Setup API Endpoint
// Creates the primary publication owner, initializes site settings,
// and issues an active session cookie.
// ============================================================

import type { APIRoute } from 'astro';
import { db } from '@/db';
import { users, siteSettings } from '@/db/schema';
import {
  hashPassword,
  createSession,
  isSetupCompleted,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from '@/lib/auth';
import { ROUTES } from '@/links';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const alreadySetup = await isSetupCompleted();
    if (alreadySetup) {
      return new Response(
        JSON.stringify({ error: 'Publication setup has already been completed.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await request.json();
    const siteTitle = (data.siteTitle || '').trim();
    const authorName = (data.authorName || '').trim();
    const authorBio = (data.authorBio || '').trim() || null;
    const domain = (data.domain || '').trim() || null;
    const avatarUrl = (data.avatarUrl || '').trim() || null;
    const email = (data.email || '').trim().toLowerCase();
    const password = data.password || '';

    if (!siteTitle) {
      return new Response(JSON.stringify({ error: 'Publication title is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!authorName) {
      return new Response(JSON.stringify({ error: 'Author name is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'A valid email address is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!password || password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters long.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const passwordHash = await hashPassword(password);

    // Create the master admin user
    const [newUser] = await db
      .insert(users)
      .values({
        name: authorName,
        email,
        passwordHash,
        role: 'admin',
      })
      .returning();

    // Initialize or update site settings
    await db
      .insert(siteSettings)
      .values({
        id: 1,
        isSetupCompleted: true,
        siteTitle,
        authorName,
        ...(authorBio ? { authorBio } : {}),
        ...(domain ? { domain } : {}),
        ...(avatarUrl ? { authorAvatar: avatarUrl } : {}),
      })
      .onConflictDoUpdate({
        target: siteSettings.id,
        set: {
          isSetupCompleted: true,
          siteTitle,
          authorName,
          ...(authorBio ? { authorBio } : {}),
          ...(domain ? { domain } : {}),
          ...(avatarUrl ? { authorAvatar: avatarUrl } : {}),
          updatedAt: new Date(),
        },
      });

    // Establish immediate session
    const session = await createSession(newUser.id);

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
    console.error('Setup endpoint error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to initialize publication.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
