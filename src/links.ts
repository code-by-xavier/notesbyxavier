// File: src/links.ts
// ============================================================
// Notesby — Centralized Route & Link Registry
// Single source of truth for all internal navigation routes and external links.
// Eliminates hardcoded URL strings, prevents broken links/typos, and makes
// future refactoring instantaneous and type-safe.
// ============================================================

export const ROUTES = {
  // Public Reader Pages
  HOME: '/',
  ABOUT: '/about',
  PROJECTS: '/projects',
  TERMS: '/terms',
  PRIVACY: '/privacy',
  AI_POLICY: '/ai-policy',
  RSS: '/rss.xml',
  NOTE: (slug: string) => `/notes/${slug}/`,

  // Sovereign Studio & Admin
  ADMIN: {
    ROOT: '/admin',
    LOGIN: '/admin/login',
    SETTINGS: '/admin/settings',
    SETUP: '/admin/setup',
    RESET_PASSWORD: '/admin/reset-password',
    EDITOR: '/admin/editor',
    EDIT_NOTE: (id: string | number) => `/admin/editor/${id}`,
  },

  // API Endpoints
  API: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    MAGIC_LINK: '/api/auth/magic-link',
    VERIFY: '/api/auth/verify',
    RESET_PASSWORD: '/api/auth/reset-password',
    SETTINGS: '/api/settings',
    NOTES: '/api/notes',
    NOTE: (id: string | number) => `/api/notes/${id}`,
    PUBLISH_NOTE: (id: string | number) => `/api/notes/${id}/publish`,
    UPLOAD: '/api/upload',
  },
} as const;

export const EXTERNAL_LINKS = {
  CLSTRE: 'https://clstre.com',
  AUTHOR: 'https://notesbyxavier.com',
  REPOSITORY: 'https://github.com/CLSTRE-ORG/Notesby',
  ISSUES: 'https://github.com/CLSTRE-ORG/Notesby/issues',
  SUPPORT_EMAIL: 'mailto:support@clstre.com',
} as const;
