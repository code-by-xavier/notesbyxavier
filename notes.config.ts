export interface NotesConfig {
  siteTitle: string;
  authorName: string;
  authorBio: string;
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
  domain: 'https://notesbyxavier.com',
  description: 'Essays, architectural blueprints, and personal reflections by Xavier Lawrence.',
  repository: 'https://github.com/XPANSION-ORG/NOTES',
  socials: {
    github: 'https://github.com/XPANSION-ORG',
    twitter: 'https://x.com',
    linkedin: 'https://linkedin.com',
    email: 'xavier@clstre.com',
  },
  navLinks: [
    { label: 'Notes', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'RSS', href: '/rss.xml' },
    { label: 'CLSTRE ↗', href: 'https://clstre.com', external: true },
  ],
  footer: {
    copyrightText: `© ${new Date().getFullYear()} Xavier Lawrence. All rights reserved.`,
    poweredByText: 'Built with NOTES — an open-source static publishing engine.',
  },
};
