export interface CategoryConfig {
  name: string;
  description?: string;
}

export interface NotesConfig {
  siteTitle: string;
  authorName: string;
  authorBio: string;
  authorAvatar?: string;
  favicon?: string;
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
  authorBio: 'Writer, thinker, and researcher. Publishing long-form perspectives on technology, design, and architecture.',
  authorAvatar: '/images/avatar-placeholder.svg',
  favicon: '/favicon.webp',
  ogImage: '/images/og-image.png',
  domain: 'https://example.com',
  description: 'An open-source, minimalist static publishing engine where every post is a note.',
  repository: 'https://github.com/CLSTRE-ORG/Notesby',
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
    github: 'https://github.com/CLSTRE-ORG/Notesby',
    twitter: 'https://x.com',
    linkedin: 'https://linkedin.com',
    email: 'hello@example.com',
  },
  navLinks: [
    { label: 'Notes', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'RSS', href: '/rss.xml', isRss: true },
    { label: 'CLSTRE ↗', href: 'https://clstre.com', external: true },
  ],
  footer: {
    copyrightText: `© ${new Date().getFullYear()} Jane Doe. All rights reserved.`,
    poweredByText: 'Built with Notesby — an open-source static publishing engine by CLSTRE.',
  },
};
