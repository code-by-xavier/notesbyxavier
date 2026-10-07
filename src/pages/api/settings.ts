// File: src/pages/api/settings.ts
// ============================================================
// Notesby — Publication Settings API Endpoint
// GET: Fetch resolved site settings | PUT: Update site settings
// Both require an authenticated session (enforced by middleware and re-checked here).
// ============================================================

import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { siteSettings, users } from '@/db/schema';
import { getSiteSettings } from '@/lib/settings';
import { json, handleError, unauthorized, readJson, HttpError } from '@/lib/http';
import { isValidEmail, isSafeMediaRef, normalizeHttpUrl, optString } from '@/lib/validation';

export const prerender = false;

const TEXT_FIELDS: Record<string, number> = {
  siteTitle: 255,
  authorName: 255,
  authorBio: 5_000,
  copyrightText: 1_000,
  postBottomCopy: 5_000,
  aboutText: 20_000,
  legalEntityName: 255,
  privacyPolicyText: 100_000,
  termsOfServiceText: 100_000,
  aiPolicyText: 100_000,
  description: 2_000,
  subscriptionSectionHeadline: 255,
  subscriptionSectionSubtext: 1_000,
  subscriptionSectionCtaLabel: 100,
  subscriptionPopupHeadline: 255,
  subscriptionPopupSubtext: 1_000,
  subscriptionConfirmedHeadline: 255,
  subscriptionConfirmedSubtext: 1_000,
  // Generic Showcase Callout
  showcaseEyebrow: 100,
  showcaseHeadline: 255,
  showcaseSubtext: 1_000,
  showcaseCtaLabel: 100,
};

// Rendered as hrefs on public pages: must be http(s) only (no javascript: etc.).
const LINK_FIELDS = ['twitterUrl', 'linkedinUrl', 'githubUrl', 'showcaseCtaUrl'] as const;

// Rendered as <img>/<link> sources: http(s) URL or site-relative path.
const MEDIA_FIELDS = [
  'authorAvatar',
  'siteLogo',
  'favicon',
  'appleTouchIcon',
  'ogImage',
  'showcaseImage',
] as const;

const BOOLEAN_FIELDS = [
  'subscriptionEnabled',
  'subscriptionPopupEnabled',
  'showcaseEnabled',
] as const;

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user) return unauthorized();

  try {
    return json({ success: true, settings: await getSiteSettings() });
  } catch (err: unknown) {
    return handleError('settings:get', err, 'Failed to fetch settings');
  }
};

export const PUT: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return unauthorized();

  try {
    const body = await readJson(request, 500_000);
    const payload: Record<string, string | boolean> = {};

    for (const [key, max] of Object.entries(TEXT_FIELDS)) {
      const value = optString(body, key, max);
      if (value !== undefined) payload[key] = value;
    }

    for (const key of LINK_FIELDS) {
      const value = optString(body, key, 255);
      if (value === undefined) continue;
      if (value !== '' && !normalizeHttpUrl(value)) {
        throw new HttpError(400, `"${key}" must be an http(s) URL.`);
      }
      payload[key] = value;
    }

    for (const key of MEDIA_FIELDS) {
      const value = optString(body, key, 2_048);
      if (value === undefined) continue;
      if (value !== '' && !isSafeMediaRef(value)) {
        throw new HttpError(400, `"${key}" must be an http(s) URL or a site-relative path.`);
      }
      payload[key] = value;
    }

    const domain = optString(body, 'domain', 255);
    if (domain !== undefined) {
      const normalized = domain === '' ? '' : normalizeHttpUrl(domain);
      if (normalized === null) throw new HttpError(400, '"domain" must be an http(s) URL.');
      payload.domain = normalized === '' ? '' : new URL(normalized).origin;
    }

    const contactEmail = optString(body, 'contactEmail', 254);
    if (contactEmail !== undefined) {
      if (contactEmail !== '' && !isValidEmail(contactEmail)) {
        throw new HttpError(400, '"contactEmail" must be a valid email address.');
      }
      payload.contactEmail = contactEmail;
    }

    for (const key of BOOLEAN_FIELDS) {
      if (body[key] === undefined) continue;
      if (typeof body[key] !== 'boolean') throw new HttpError(400, `"${key}" must be a boolean.`);
      payload[key] = body[key] as boolean;
    }

    const now = new Date();
    await db
      .insert(siteSettings)
      .values({ id: 1, isSetupCompleted: true, ...payload })
      .onConflictDoUpdate({
        target: siteSettings.id,
        set: { ...payload, updatedAt: now },
      });

    // Also sync the author's display name to the users table
    if (typeof payload.authorName === 'string' && payload.authorName) {
      await db
        .update(users)
        .set({ name: payload.authorName, updatedAt: now })
        .where(eq(users.id, user.id));
    }

    return json({ success: true, settings: await getSiteSettings() });
  } catch (err: unknown) {
    return handleError('settings:update', err, 'Failed to update settings');
  }
};
