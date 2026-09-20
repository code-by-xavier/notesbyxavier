// File: src/lib/settings.ts
// ============================================================
// Notesby — Sovereign Settings Resolver & Repository
// Loads configuration from PostgreSQL with graceful fallbacks
// to notes.config.ts defaults and enforces platform invariants.
// ============================================================

import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { siteSettings, type SiteSettings } from '@/db/schema';
import { notesConfig } from '@config';

export const LOCKED_COLOPHON_TEXT =
  'Built with Notesby — an open-source static publishing engine by CLSTRE.';

export const DEFAULT_AI_POLICY =
  'This publication strictly prohibits the unauthorized scraping, harvesting, or ingestion of our essays, notes, and research for training artificial intelligence models or generative AI systems without prior explicit written license.';

export const DEFAULT_SITE_LOGO_LIGHT = '/images/notesby-logo-black.svg';
export const DEFAULT_SITE_LOGO_DARK = '/images/notesby-logo-white.svg';

export interface ResolvedSiteSettings {
  siteTitle: string;
  authorName: string;
  authorBio: string;
  authorAvatar: string;
  siteLogo: string;
  siteLogoDark: string;
  customLogo: string | null;
  favicon: string;
  appleTouchIcon: string;
  ogImage: string;
  copyrightText: string;
  colophonText: string;
  postBottomCopy: string;
  aboutText: string;
  legalEntityName: string;
  privacyPolicyText: string | null;
  termsOfServiceText: string | null;
  aiPolicyText: string;
  domain: string;
  description: string;
  twitterUrl: string;
  linkedinUrl: string;
  githubUrl: string;
  contactEmail: string;
}

export async function getSiteSettings(): Promise<ResolvedSiteSettings> {
  let dbSettings: SiteSettings | null = null;
  try {
    const [row] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
    if (row) {
      dbSettings = row;
    }
  } catch (err) {
    console.warn(
      '[Notesby] Warning: Could not query site_settings from database, using config fallbacks:',
      err
    );
  }

  const currentYear = new Date().getFullYear();
  const defaultEntity = dbSettings?.authorName || notesConfig.authorName || 'Notesby Publisher';
  const rawLogo = dbSettings?.siteLogo ? dbSettings.siteLogo.trim() : '';
  const customLogo = rawLogo !== '' ? rawLogo : null;
  const siteLogo = customLogo || notesConfig.siteLogo || DEFAULT_SITE_LOGO_LIGHT;
  const siteLogoDark = customLogo || notesConfig.siteLogoDark || DEFAULT_SITE_LOGO_DARK;

  return {
    siteTitle: dbSettings?.siteTitle || notesConfig.siteTitle,
    authorName: dbSettings?.authorName || notesConfig.authorName,
    authorBio: dbSettings?.authorBio || notesConfig.authorBio,
    authorAvatar: dbSettings?.authorAvatar || notesConfig.authorAvatar || '/images/avatar.webp',
    siteLogo,
    siteLogoDark,
    customLogo,
    favicon: dbSettings?.favicon || notesConfig.favicon || '/favicon.webp',
    appleTouchIcon:
      dbSettings?.appleTouchIcon ||
      customLogo ||
      notesConfig.appleTouchIcon ||
      DEFAULT_SITE_LOGO_DARK,
    ogImage: dbSettings?.ogImage || notesConfig.ogImage || '/images/og-image.png',
    copyrightText:
      dbSettings?.copyrightText ||
      `© ${currentYear} ${dbSettings?.legalEntityName || defaultEntity}. All rights reserved.`,
    colophonText: LOCKED_COLOPHON_TEXT,
    postBottomCopy: dbSettings?.postBottomCopy || dbSettings?.authorBio || notesConfig.authorBio,
    aboutText:
      dbSettings?.aboutText ||
      `Welcome to **${dbSettings?.siteTitle || notesConfig.siteTitle}**, a personal space for essays, working notes, and considered perspectives.`,
    legalEntityName: dbSettings?.legalEntityName || defaultEntity,
    privacyPolicyText: dbSettings?.privacyPolicyText || null,
    termsOfServiceText: dbSettings?.termsOfServiceText || null,
    aiPolicyText: dbSettings?.aiPolicyText || DEFAULT_AI_POLICY,
    domain: dbSettings?.domain || notesConfig.domain,
    description: dbSettings?.description || notesConfig.description,
    twitterUrl: dbSettings?.twitterUrl || notesConfig.socials.twitter || 'https://x.com',
    linkedinUrl: dbSettings?.linkedinUrl || notesConfig.socials.linkedin || 'https://linkedin.com',
    githubUrl: dbSettings?.githubUrl || notesConfig.socials.github || '',
    contactEmail: dbSettings?.contactEmail || notesConfig.socials.email || 'hello@example.com',
  };
}
