// File: src/schemas/jsonLd.ts
// ============================================================
// Notesby — Structured Data Schemas (JSON-LD)
// Schema.org compliant structured data for WebSite and BlogPosting.
// ============================================================

import { notesConfig } from '@config';

export interface JsonLdOptions {
  title: string;
  description: string;
  canonicalUrl: string;
  resolvedOgImage?: string;
  isEssay?: boolean;
  pubDate?: Date | string;
  updatedDate?: Date | string;
  keywords?: string[] | string;
}

/**
 * Generate JSON-LD schema for website home and index views.
 */
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: notesConfig.siteTitle,
    url: notesConfig.domain,
    description: notesConfig.description,
    author: {
      '@type': 'Person',
      name: notesConfig.authorName,
      url: `${notesConfig.domain}/about`,
    },
  };
}

/**
 * Generate JSON-LD schema for essays and note publications.
 */
export function generateArticleSchema(options: JsonLdOptions) {
  const { title, description, canonicalUrl, resolvedOgImage, pubDate, updatedDate, keywords } =
    options;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: description,
    url: canonicalUrl,
    datePublished: pubDate ? new Date(pubDate).toISOString() : undefined,
    dateModified: updatedDate
      ? new Date(updatedDate).toISOString()
      : pubDate
        ? new Date(pubDate).toISOString()
        : undefined,
    image: resolvedOgImage,
    keywords: Array.isArray(keywords) ? keywords.join(', ') : keywords,
    author: {
      '@type': 'Person',
      name: notesConfig.authorName,
      url: notesConfig.domain,
    },
    publisher: {
      '@type': 'Organization',
      name: notesConfig.siteTitle,
      url: notesConfig.domain,
      logo: resolvedOgImage,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
  };
}

/**
 * Generate context-sensitive JSON-LD structured data.
 */
export function generateJsonLd(options: JsonLdOptions) {
  return options.isEssay ? generateArticleSchema(options) : generateWebsiteSchema();
}
