# Customizing Your Site

All your publication's settings live in a single, friendly configuration file: [`notes.config.ts`](../notes.config.ts).

You do not need programming knowledge to edit this file. Simply change the words inside the single quotes (`'...`):

---

## Settings Explained

```typescript
export const notesConfig = {
  // 1. Your Identity & Branding
  siteTitle: 'Notes by Jane',                     // The name shown on your homepage
  authorName: 'Jane Doe',                         // Your name
  authorBio: 'Writer, designer, and researcher.', // A 1-2 sentence bio about yourself
  authorAvatar: '/images/avatar.webp',            // Your profile photo (shown in top left circle)
  favicon: '/images/avatar.webp',                 // Browser tab icon
  ogImage: '/images/og-image.png',                // Preview image when shared on social media (1200x630px)
  
  // 2. Your Web Address & Search Engine Info
  domain: 'https://yourdomain.com',               // Your website address
  description: 'Essays, thoughts, and notes.',    // Short description used by search engines
  repository: 'https://github.com/your-name/notes',// Optional link to your GitHub repo
  
  // 3. Social Media Links (leave empty if you don't use one)
  socials: {
    twitter: 'https://x.com/yourhandle',
    github: 'https://github.com/yourhandle',
    linkedin: 'https://linkedin.com/in/yourprofile',
    email: 'hello@yourdomain.com',
  },
  
  // 4. Navigation Links (Menu in the top right)
  navLinks: [
    { label: 'Notes', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'RSS', href: '/rss.xml', isRss: true },
    { label: 'External Link ↗', href: 'https://example.com', external: true },
  ],
  
  // 5. Footer Notices
  footer: {
    copyrightText: '© 2026 yourdomain.com. All rights reserved.',
    poweredByText: 'Built with NOTES — an open-source static publishing engine.',
  },
};
```

---

## Replacing Your Profile Picture

1. Find your photo and save it as a square image.
2. Put it in `public/images/` (e.g. `avatar.webp` or `avatar.png`).
3. Set `authorAvatar: '/images/avatar.webp'` in `notes.config.ts`.
4. NOTES automatically formats it into a circle beside your name in the header!
