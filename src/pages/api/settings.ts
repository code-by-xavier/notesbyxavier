// File: src/pages/api/settings.ts
// ============================================================
// Notesby — Publication Settings API Endpoint
// GET: Fetch resolved site settings | PUT: Update site settings
// ============================================================

import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { siteSettings, users } from '@/db/schema';
import { getSiteSettings } from '@/lib/settings';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const settings = await getSiteSettings();
    return new Response(JSON.stringify({ success: true, settings }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Failed to fetch settings' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();

    const updatePayload = {
      siteTitle: typeof body.siteTitle === 'string' ? body.siteTitle.trim() : undefined,
      authorName: typeof body.authorName === 'string' ? body.authorName.trim() : undefined,
      authorBio: typeof body.authorBio === 'string' ? body.authorBio.trim() : undefined,
      authorAvatar: typeof body.authorAvatar === 'string' ? body.authorAvatar.trim() : undefined,
      siteLogo: typeof body.siteLogo === 'string' ? body.siteLogo.trim() : undefined,
      favicon: typeof body.favicon === 'string' ? body.favicon.trim() : undefined,
      appleTouchIcon:
        typeof body.appleTouchIcon === 'string' ? body.appleTouchIcon.trim() : undefined,
      ogImage: typeof body.ogImage === 'string' ? body.ogImage.trim() : undefined,
      copyrightText: typeof body.copyrightText === 'string' ? body.copyrightText.trim() : undefined,
      postBottomCopy:
        typeof body.postBottomCopy === 'string' ? body.postBottomCopy.trim() : undefined,
      aboutText: typeof body.aboutText === 'string' ? body.aboutText.trim() : undefined,
      legalEntityName:
        typeof body.legalEntityName === 'string' ? body.legalEntityName.trim() : undefined,
      privacyPolicyText:
        typeof body.privacyPolicyText === 'string' ? body.privacyPolicyText.trim() : undefined,
      termsOfServiceText:
        typeof body.termsOfServiceText === 'string' ? body.termsOfServiceText.trim() : undefined,
      aiPolicyText: typeof body.aiPolicyText === 'string' ? body.aiPolicyText.trim() : undefined,
      domain: typeof body.domain === 'string' ? body.domain.trim() : undefined,
      description: typeof body.description === 'string' ? body.description.trim() : undefined,
      twitterUrl: typeof body.twitterUrl === 'string' ? body.twitterUrl.trim() : undefined,
      linkedinUrl: typeof body.linkedinUrl === 'string' ? body.linkedinUrl.trim() : undefined,
      githubUrl: typeof body.githubUrl === 'string' ? body.githubUrl.trim() : undefined,
      contactEmail: typeof body.contactEmail === 'string' ? body.contactEmail.trim() : undefined,
      // Email Subscription Copy
      subscriptionEnabled:
        typeof body.subscriptionEnabled === 'boolean' ? body.subscriptionEnabled : undefined,
      subscriptionSectionHeadline:
        typeof body.subscriptionSectionHeadline === 'string'
          ? body.subscriptionSectionHeadline.trim()
          : undefined,
      subscriptionSectionSubtext:
        typeof body.subscriptionSectionSubtext === 'string'
          ? body.subscriptionSectionSubtext.trim()
          : undefined,
      subscriptionSectionCtaLabel:
        typeof body.subscriptionSectionCtaLabel === 'string'
          ? body.subscriptionSectionCtaLabel.trim()
          : undefined,
      subscriptionPopupEnabled:
        typeof body.subscriptionPopupEnabled === 'boolean'
          ? body.subscriptionPopupEnabled
          : undefined,
      subscriptionPopupHeadline:
        typeof body.subscriptionPopupHeadline === 'string'
          ? body.subscriptionPopupHeadline.trim()
          : undefined,
      subscriptionPopupSubtext:
        typeof body.subscriptionPopupSubtext === 'string'
          ? body.subscriptionPopupSubtext.trim()
          : undefined,
      subscriptionConfirmedHeadline:
        typeof body.subscriptionConfirmedHeadline === 'string'
          ? body.subscriptionConfirmedHeadline.trim()
          : undefined,
      subscriptionConfirmedSubtext:
        typeof body.subscriptionConfirmedSubtext === 'string'
          ? body.subscriptionConfirmedSubtext.trim()
          : undefined,
      updatedAt: new Date(),
    };

    // Filter out undefined keys
    const cleanPayload = Object.fromEntries(
      Object.entries(updatePayload).filter(([_, v]) => v !== undefined)
    );

    // Upsert into site_settings
    await db
      .insert(siteSettings)
      .values({
        id: 1,
        isSetupCompleted: true,
        ...cleanPayload,
      })
      .onConflictDoUpdate({
        target: siteSettings.id,
        set: {
          ...cleanPayload,
          updatedAt: new Date(),
        },
      });

    // Also sync the author's display name to the users table
    if (cleanPayload.authorName) {
      await db
        .update(users)
        .set({ name: cleanPayload.authorName as string, updatedAt: new Date() })
        .where(eq(users.id, user.id));
    }

    const resolved = await getSiteSettings();

    return new Response(JSON.stringify({ success: true, settings: resolved }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Failed to update settings' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
