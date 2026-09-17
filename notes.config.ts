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
  siteTitle: 'NoteBy',
  authorName: 'Jane Doe',
  authorBio: 'Writer, thinker, and researcher. Publishing long-form perspectives on technology, design, and architecture.',
  authorAvatar: '/images/avatar-placeholder.svg',
  favicon: '/favicon.webp',
  ogImage: '/images/og-image.png',
  domain: 'https://example.com',
  description: 'An open-source, minimalist static publishing engine designed for distraction-free reading.',
  repository: 'https://github.com/CLSTRE-ORG/noteby',
  socials: {
    github: 'https://github.com/CLSTRE-ORG/noteby',
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
    poweredByText: 'Built with NoteBy — an open-source static publishing engine by CLSTRE.',
  },
};
