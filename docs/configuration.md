# Customizing Your Site

All your publication's settings live in a single, friendly configuration file: [`notes.config.ts`](../notes.config.ts).

You do not need programming knowledge to edit this file. Simply change the words inside the single quotes (`'...`):

---

## Settings Explained

```typescript
export const notesConfig = {
  // 1. Your Identity & Branding
  siteTitle: 'Notesby', // The name shown on your homepage
  authorName: 'Jane Doe', // Your name
  authorBio: 'Writer, thinker, and researcher.', // A 1-2 sentence bio about yourself
  authorAvatar: '/images/avatar-placeholder.svg', // Your profile photo (shown in top left circle)
  favicon: '/favicon.webp', // Browser tab icon
  ogImage: '/images/og-image.png', // Preview image when shared on social media (1200x630px)

  // 2. Your Web Address & Search Engine Info
  domain: 'https://example.com', // Your website address
  description: 'An open-source, minimalist static publishing engine.', // Short description used by search engines
  repository: 'https://github.com/CLSTRE-ORG/Notesby', // Optional link to your GitHub repo

  // 3. Category Row Sliders (Shown on the homepage)
  categories: [
    { name: 'Essays', description: 'Deep-dive explorations and system blueprints.' },
    { name: 'Op-Eds', description: 'Perspectives on technology and the modern web.' },
    { name: 'Field Notes', description: 'Rapid dispatches and engineering observations.' },
  ],

  // 4. Social Media Links (leave empty if you don't use one)
  socials: {
    twitter: 'https://x.com/yourhandle',
    github: 'https://github.com/yourhandle',
    linkedin: 'https://linkedin.com/in/yourprofile',
    email: 'hello@example.com',
  },

  // 5. Navigation Links (Menu in the top right)
  navLinks: [
    { label: 'Notes', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'RSS', href: '/rss.xml', isRss: true },
    { label: 'CLSTRE ↗', href: 'https://clstre.com', external: true },
  ],

  // 6. Footer Notices
  footer: {
    copyrightText: '© 2026 Jane Doe. All rights reserved.',
    poweredByText: 'Built with Notesby — an open-source static publishing engine by CLSTRE.',
  },
};
```
