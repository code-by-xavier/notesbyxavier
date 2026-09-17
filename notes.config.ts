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
  siteTitle: 'Notes by Xavier',
  authorName: 'Xavier Lawrence',
  authorBio: 'Founder & Cloud Architect. Writing about software engineering, autonomous systems, and sovereign infrastructure.',
  authorAvatar: '/images/xavier-avatar.webp',
  favicon: '/images/xavier-avatar.webp',
  ogImage: '/images/og-image.png',
  domain: 'https://www.notesbyxavier.com',
  description: 'Essays, architectural blueprints, and personal reflections by Xavier Lawrence.',
  repository: 'https://github.com/XPANSION-ORG/NOTES',
  socials: {
    github: 'https://github.com/XPANSION-ORG/NOTES',
    twitter: 'https://x.com/notesbyxavier',
    linkedin: 'https://www.linkedin.com/in/notesbyxavier/',
    email: 'XLawrence@clstre.com',
  },
  navLinks: [
    { label: 'Notes', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'RSS', href: '/rss.xml', isRss: true },
    { label: 'CLSTRE ↗', href: 'https://www.clstre.com', external: true },
  ],
  footer: {
    copyrightText: `© ${new Date().getFullYear()} notesbyxavier.com. All rights reserved.`,
    poweredByText: 'Built with NOTES — an open-source static publishing engine.',
  },
};
