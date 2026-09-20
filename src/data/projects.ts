// File: src/data/projects.ts
// ============================================================
// Notesby — Projects & Systems Architecture Showcase
// Sovereign infrastructure, open-source software, and cloud platforms
// designed and built by Xavier Lawrence.
// ============================================================

export interface Project {
  title: string;
  slug: string;
  tagline: string;
  status: 'Production' | 'Active' | 'Open Source' | 'Archived';
  role: string;
  period: string;
  liveUrl?: string;
  githubUrl?: string;
  deployUrl?: string;
  deployLabel?: string;
  logo?: string;
  logoDark?: string;
  stack: string[];
  specs: {
    label: string;
    value: string;
  }[];
  overview: string;
  whyKeepItSimple: string;
}

export const projects: Project[] = [
  {
    title: 'Notesby Publishing Engine',
    slug: 'notesby',
    tagline:
      'Sovereign open-source publishing engine with Zen Studio, Cloud Run, and Cloud SQL micro-PostgreSQL.',
    status: 'Open Source',
    role: 'Creator & Lead Architect',
    period: '2026 — Present',
    liveUrl: 'https://notesbyxavier.com',
    githubUrl: 'https://github.com/CLSTRE-ORG/Notesby',
    deployUrl:
      'https://shell.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https://github.com/CLSTRE-ORG/Notesby&cloudshell_tutorial=docs/deployment.md',
    deployLabel: 'Deploy to GCP',
    logo: '/images/notesby-logo-black.svg',
    logoDark: '/images/notesby-logo-white.svg',
    stack: [
      'Astro 5',
      'Google Cloud Run',
      'PostgreSQL',
      'Drizzle ORM',
      'Google Cloud Storage',
      'Docker',
      'TypeScript',
      'SCSS',
    ],
    specs: [
      {
        label: 'Rendering Architecture',
        value: 'Hybrid SSR with static pre-rendered reader edge caching',
      },
      {
        label: 'Database Standard',
        value: 'Google Cloud SQL (db-f1-micro PostgreSQL) dedicated per writer',
      },
      {
        label: 'Media Storage',
        value: 'Google Cloud Storage (GCS) sovereign media bucket',
      },
      {
        label: 'Writing Studio',
        value: 'Zen Studio editor with slash commands, Markdown/MDX & auto-save',
      },
      {
        label: 'Compute Cost',
        value: 'Cloud Run serverless container auto-scaling 0 to N (~$10–$15/mo)',
      },
      {
        label: 'Zero Bloat',
        value: 'Strictly zero Redis, zero tracking scripts, sub-2ms query responses',
      },
    ],
    overview:
      'A sovereign, distraction-free publishing platform engineered for serious essayists, researchers, and technical architects who value high-contrast typography, reading flow, and complete infrastructure ownership.',
    whyKeepItSimple:
      'Traditional CMS platforms (WordPress, Ghost, Substack) either require complex multi-tenant database clusters, costly Redis caches (~$40/mo), or lock your publication behind closed subscriptions. Notesby dedicates an isolated Cloud Run container, Cloud SQL micro-instance, and GCS bucket to every writer. You own 100% of your data and infrastructure with zero vendor lock-in.',
  },
  {
    title: 'Sovereign Cloud Build Pipeline',
    slug: 'sovereign-cloud-pipeline',
    tagline: 'Automated zero-trust container build and deployment pipeline on Google Cloud.',
    status: 'Production',
    role: 'Cloud Architect',
    period: '2026',
    stack: [
      'Google Cloud Build',
      'Google Artifact Registry',
      'Google Cloud Run',
      'IAM',
      'Secret Manager',
    ],
    specs: [
      {
        label: 'Build Cycle',
        value: 'Sub-60-second build and zero-downtime traffic migration',
      },
      {
        label: 'Security Model',
        value: 'Least-privilege service accounts with sealed secret injection',
      },
      {
        label: 'Infrastructure',
        value: 'Serverless container orchestration scaling 0 to N instances',
      },
      {
        label: 'Edge Delivery',
        value: 'Global Google edge proxy with automatic managed SSL certificates',
      },
    ],
    overview:
      'A resilient continuous deployment architecture connecting GitHub repositories directly to isolated Google Cloud Run environments without third-party CI/CD intermediaries.',
    whyKeepItSimple:
      'Relying on external CI/CD vendors often means granting broad third-party access to production credentials. By anchoring our deployment pipeline inside native Google Cloud Build and Secret Manager, credentials never leave the Google Cloud trust boundary. A single git push triggers a sealed build and atomic rollout.',
  },
];
