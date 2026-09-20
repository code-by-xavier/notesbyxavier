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
  siteTitle: 'Notes by Xavier',
  authorName: 'Xavier Lawrence',
  authorBio:
    'Founder & Cloud Architect. Writing about software engineering, autonomous systems, and sovereign infrastructure.',
  authorAvatar: '/images/xavier-avatar.webp',
  siteLogo: '/images/notesby-logo-black.svg',
  siteLogoDark: '/images/notesby-logo-white.svg',
  favicon: '/images/xavier-avatar.webp',
  appleTouchIcon: '/images/notesby-logo-dark.png',
  ogImage: '/images/og-image.png',
  domain: 'https://www.notesbyxavier.com',
  description: 'Essays, architectural blueprints, and personal reflections by Xavier Lawrence.',
  repository: 'https://github.com/code-by-xavier/notesbyxavier',
  categories: [
    {
      name: 'Essays',
      description: 'Deep-dive explorations, systems design, and architectural blueprints.',
    },
    {
      name: 'Op-Eds',
      description: 'Perspectives on technology, digital sovereignty, and the modern web.',
    },
    {
      name: 'Field Notes',
      description: 'Rapid dispatches, benchmarks, and engineering observations.',
    },
  ],
  socials: {
    github: 'https://github.com/code-by-xavier/notesbyxavier',
    twitter: 'https://x.com/notesbyxavier',
    linkedin: 'https://www.linkedin.com/in/notesbyxavier/',
    email: 'XLawrence@clstre.com',
  },
  navLinks: [
    { label: 'Notes', href: ROUTES.HOME },
    { label: 'Projects', href: '/projects' },
    { label: 'About', href: ROUTES.ABOUT },
    { label: 'RSS', href: ROUTES.RSS, isRss: true },
    { label: 'CLSTRE ↗', href: EXTERNAL_LINKS.CLSTRE, external: true },
  ],
  footer: {
    copyrightText: `© ${new Date().getFullYear()} notesbyxavier.com. All rights reserved.`,
    poweredByText: 'Built with Notesby — an open-source static publishing engine by CLSTRE.',
  },
};
