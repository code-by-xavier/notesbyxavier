export interface Project {
  title: string;
  slug: string;
  tagline: string;
  status: 'Production' | 'Active' | 'Open Source' | 'Archived';
  role: string;
  period: string;
  liveUrl?: string;
  githubUrl?: string;
  stack: string[];
  specs: {
    label: string;
    value: string;
  }[];
  overview: string;
  whyKeepItSimple: string;
}

export const projects: Project[] = [
  /*
  {
    title: 'CLSTRE Platform',
    slug: 'clstre-platform',
    tagline: 'Automated Single-Tenant Cloud Run SaaS platform with sovereign client GCP projects.',
    status: 'Production',
    role: 'Founder & Lead Architect',
    period: '2025 — Present',
    liveUrl: 'https://clstre.com',
    githubUrl: 'https://github.com/CLSTRE-ORG/CLSTRE',
    stack: ['Google Cloud Run', 'Cloud SQL PostgreSQL', 'Hono', 'Astro', 'TypeScript', 'Docker', 'Drizzle ORM'],
    specs: [
      { label: 'Deployment', value: 'Isolated Google Cloud Run microservices per client' },
      { label: 'Database', value: 'Dedicated Google Cloud SQL PostgreSQL instance (Zero multi-tenancy)' },
      { label: 'API Architecture', value: 'Decoupled edge-ready Hono backend engine' },
      { label: 'Distribution', value: 'Master upstream Git sync directly into private client repositories' },
    ],
    overview: 'A turnkey platform delivering decoupled, Google-Workspace-like business software where every client owns their underlying Google Cloud infrastructure. Zero vendor lock-in, zero multi-tenant security leaks.',
    whyKeepItSimple: 'Traditional SaaS architectures pile hundreds of companies into a massive shared multi-tenant database, creating constant risks of cross-tenant data leaks and complex row-level security. By dedicating sovereign Cloud Run and Cloud SQL instances to each client via automated Git synchronization, we eliminate multi-tenant complexity entirely. If a client ever wants to leave, they already own 100% of their data and infrastructure.',
  },
  */
  {
    title: 'Notesby Publishing Engine',
    slug: 'notesby',
    tagline: 'Minimalist open-source static publishing engine where every post is an editorial note.',
    status: 'Open Source',
    role: 'Creator & Lead Developer',
    period: '2026 — Present',
    liveUrl: 'https://notesbyxavier.com',
    githubUrl: 'https://github.com/CLSTRE-ORG/Notesby',
    stack: ['Astro v5', 'TypeScript', 'SCSS', 'Nginx Alpine', 'Docker', 'Google Cloud Run'],
    specs: [
      { label: 'Rendering Mode', value: 'Pure static pre-rendering (output: "static")' },
      { label: 'Container Size', value: 'Alpine Nginx image weighing under 25MB' },
      { label: 'Runtime Overhead', value: 'Zero client-side JavaScript hydration bloat' },
      { label: 'Content Source', value: 'Native MDX collection with Zod schema validation' },
    ],
    overview: 'An open-source, distraction-free publishing platform designed for writers, thinkers, and architects who value typography, reading flow, and zero-maintenance infrastructure.',
    whyKeepItSimple: 'Traditional CMS platforms like WordPress or Ghost require database servers, memory-hungry node runtimes, cache plugins, and weekly security updates. Notesby compiles Markdown directly into static HTML served by a 25MB Alpine Nginx container on Cloud Run. It scales to zero when idle, costs pennies per month, and is virtually impervious to web injection attacks.',
  },
  {
    title: 'Sovereign Cloud Build Pipeline',
    slug: 'sovereign-cloud-pipeline',
    tagline: 'Automated zero-trust container build and deployment pipeline on Google Cloud.',
    status: 'Production',
    role: 'Cloud Architect',
    period: '2026',
    stack: ['Google Cloud Build', 'Google Artifact Registry', 'Google Cloud Run', 'IAM', 'Secret Manager'],
    specs: [
      { label: 'Build Cycle', value: 'Sub-60-second build and zero-downtime traffic migration' },
      { label: 'Security Model', value: 'Least-privilege service accounts with sealed secret injection' },
      { label: 'Infrastructure', value: 'Serverless container orchestration scaling 0 to N instances' },
      { label: 'Edge Delivery', value: 'Global Google edge proxy with automatic managed SSL certificates' },
    ],
    overview: 'A resilient continuous deployment architecture connecting GitHub repositories directly to isolated Google Cloud Run environments without third-party CI/CD intermediaries.',
    whyKeepItSimple: 'Relying on external CI/CD vendors often means granting broad third-party access to production credentials. By anchoring our deployment pipeline inside native Google Cloud Build and Secret Manager, credentials never leave the Google Cloud trust boundary. A single git push triggers a sealed build and atomic rollout.',
  },
];
