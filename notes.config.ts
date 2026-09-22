// File: notes.config.ts
// ============================================================
// Notesby — Publication Configuration
// Global configuration for author identity, metadata, and nav.
// ============================================================

import { ROUTES, EXTERNAL_LINKS } from '@/links';

export interface CategoryConfig {
  name: string;
  description?: string;
}

export interface NotesConfig {
  siteTitle: string;
  authorName: string;
  authorBio: string;
  authorAvatar?: string;
  siteLogo?: string;
  siteLogoDark?: string;
  favicon?: string;
  appleTouchIcon?: string;
  ogImage?: string;
  domain: string;
  description: string;
  repository?: string;
  categories?: CategoryConfig[];
  socials: {
    github?: string;
    twitter?: string;
    linkedin?: string;
    email?: string;
  };
  navLinks: {
    label: string;
    href: string;
    external?: boolean;
    isRss?: boolean;
  }[];
  footer: {
    copyrightText: string;
    poweredByText: string;
  };
}

export const notesConfig: NotesConfig = {
  siteTitle: 'Notesby',
  authorName: 'Jane Doe',
  authorBio: 'Writer and researcher. Exploring ideas, culture, and long-form writing.',
  authorAvatar: '',
  siteLogo: '/images/notesby-logo-black.svg',
  siteLogoDark: '/images/notesby-logo-white.svg',
  favicon: '/images/notesby-logo-black.svg',
  appleTouchIcon: '/images/notesby-logo-black.svg',
  ogImage: '/images/og-image.png',
  domain: 'https://example.com',
  description: 'A personal publication featuring essays, op-eds, and field notes.',
  repository: EXTERNAL_LINKS.REPOSITORY,
  // Primary Content Categories displayed across sliders and feeds
  categories: [
    {
      name: 'Essays',
      description: 'Long-form pieces, in-depth research, and detailed explorations.',
    },
    {
      name: 'Op-Eds',
      description: 'Commentary, critiques, and opinion pieces on current topics.',
    },
    {
      name: 'Field Notes',
      description: 'Brief thoughts, working logs, and everyday observations.',
    },
  ],
  socials: {
    github: EXTERNAL_LINKS.REPOSITORY,
    twitter: 'https://x.com',
    linkedin: 'https://linkedin.com',
    email: 'hello@example.com',
  },
  navLinks: [
    { label: 'Notes', href: ROUTES.HOME },
    { label: 'Projects', href: ROUTES.PROJECTS },
    { label: 'About', href: ROUTES.ABOUT },
    { label: 'RSS', href: ROUTES.RSS, isRss: true },
    { label: 'CLSTRE ↗', href: EXTERNAL_LINKS.CLSTRE, external: true },
  ],
  footer: {
    copyrightText: `© ${new Date().getFullYear()} Jane Doe. All rights reserved.`,
    poweredByText: 'Built with Notesby — an open-source static publishing engine by CLSTRE.',
  },
};
