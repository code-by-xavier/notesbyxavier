# Configuration & Publication Settings

Notesby provides two seamless ways to configure and customize your publication:

1. **The In-Browser Settings Portal** (`/admin/settings`) — Change logos, avatars, bios, legal policies, and PWA icons without touching code.
2. **The Code Blueprint** (`notes.config.ts`) — Version-controlled defaults and initial fallbacks.

---

## 1. The In-Browser Settings Portal (`/admin/settings`)

Access the sovereign settings dashboard from your admin bar or at `/admin/settings`. Settings are organized into modular, focused cards:

### A. Identity & Header Branding

- **Author / Publisher Name**: Rendered in the header next to your avatar, essay bylines, and about pages.
- **Publication Title**: Displayed in the header, RSS feed title, and homepage hero.
- **Author Tagline / Short Bio**: Displayed prominently on the homepage hero under your name and in post footers.
- **Profile Avatar / Photo**: Upload your portrait photo (PNG, JPEG, WebP, AVIF, GIF). Includes fallback initials badge if omitted.
- **Site Logo / Brand Mark**: Upload a custom SVG, PNG, or WebP logo mark to replace or accent the header brand text. A one-click **Reset** button restores the default platform SVG logo anytime.

### B. PWA & Web App Icons

- **Favicon**: Upload your browser tab icon in `.ico`, `.png`, `.svg`, or `.webp` format.
- **Apple Touch Icon**: Upload your high-resolution mobile bookmark icon for iOS and Android home screens.
- **Dynamic Web App Manifest**: Notesby automatically generates `/manifest.webmanifest` reflecting your custom title, colors, and uploaded icons.

### C. Legal Compliance & Rights

- **Legal Company / Entity Name**: Automatically populates throughout your footer copyright, Terms of Service (`/terms`), and Privacy Policy (`/privacy`).
- **Copyright Notice**: Customizable copyright string (defaults to `© {Year} {Entity}. All rights reserved.`).
- **Terms of Service**: Full Markdown editor to define your publication's terms, available to readers at `/terms`.
- **Privacy Policy**: Full Markdown editor for your privacy notice and cookie-free disclosure at `/privacy`.
- **AI Training & Scraping Policy**: Explicit licensing notice and reservation of rights protecting your intellectual property from unauthorized AI model training and scraper ingestion, available to readers at `/ai-policy` and linked across page footers.
- **Platform Colophon Invariant**: The footer attribution (`Built with Notesby — an open-source static publishing engine by CLSTRE.`) is permanently preserved as a core platform invariant.

### D. SEO & Social Profiles

- **Canonical Domain**: Your production web address (e.g. `https://example.com`).
- **Meta Description**: Search engine summary indexed by Google and shared on social cards.
- **Social Profiles**: Links for X (Twitter), LinkedIn, GitHub, and contact email rendered in page footers and headers.

### E. Reading Experience & Pages

- **Post Bottom Copy**: Custom sign-off text rendered at the bottom of every essay and field note.
- **About Page Text**: Markdown content rendered on `/about`.

---

## 2. The Code Blueprint (`notes.config.ts`)

For developers or fresh deployments before database hydration, [`notes.config.ts`](../notes.config.ts) serves as the baseline fallback:

```typescript
export const notesConfig = {
  // 1. Identity & Branding
  siteTitle: 'Notesby',
  authorName: 'Jane Doe',
  authorBio: 'Writer, thinker, and researcher.',
  authorAvatar: '/images/avatar.webp',
  siteLogo: '/images/notesby-logo-black.svg',
  siteLogoDark: '/images/notesby-logo-white.svg',
  favicon: '/favicon.webp',
  appleTouchIcon: '/images/notesby-logo-white.svg',
  ogImage: '/images/og-image.png',

  // 2. Web Address & Search Engine Info
  domain: 'https://example.com',
  description: 'An open-source, minimalist static publishing engine.',
  repository: 'https://github.com/CLSTRE-ORG/Notesby',

  // 3. Category Row Sliders (Shown on homepage)
  categories: [
    {
      name: 'Essays',
      description:
        'Long-form editorial explorations, architectural thought, and in-depth research.',
    },
    {
      name: 'Op-Eds',
      description: 'Sharp commentary, cultural critique, and focused perspectives.',
    },
    {
      name: 'Field Notes',
      description: 'Short-form dispatches, micro-essays, and raw observations.',
    },
  ],

  // 4. Social Media Links
  socials: {
    twitter: 'https://x.com/yourhandle',
    github: 'https://github.com/yourhandle',
    linkedin: 'https://linkedin.com/in/yourprofile',
    email: 'hello@example.com',
  },

  // 5. Navigation Links
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
