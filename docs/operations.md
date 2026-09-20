# Operations & CLI Reference Guide

This guide documents the day-to-day operations, Docker infrastructure, environment configuration, database management, and platform cleanup engine for Notesby.

---

## 1. Local Infrastructure Services

Notesby uses Docker Compose (`docker-compose.yml`) to orchestrate its sovereign local development dependencies:

| Service           | Container Name    | Image                           | Port   | Description                                                          |
| :---------------- | :---------------- | :------------------------------ | :----- | :------------------------------------------------------------------- |
| **PostgreSQL 16** | `notesby_db`      | `postgres:16-alpine`            | `5432` | Relational database holding notes, users, and site settings.         |
| **GCS Emulator**  | `notesby_storage` | `fsouza/fake-gcs-server:latest` | `4443` | High-fidelity Google Cloud Storage emulator for local media uploads. |

### Data Volumes & Persistence

Local persistent data is stored in two named Docker volumes:

- **`notesby_pgdata`**: Stores PostgreSQL database tables, records, and indexes.
- **`notesby_storage_data`**: Stores uploaded media files inside the local GCS emulator.

> [!IMPORTANT]
> Running standard Docker commands like `docker compose down` or `docker compose restart` leaves these volumes **completely untouched**. Your local essays, user accounts, and uploaded cover images will survive container restarts. Volumes are only wiped when explicitly requested with `docker compose down -v` or `pnpm run clean:full`.

---

## 2. Infrastructure CLI Commands

| Command                     | Action                                                                          | Data Preserved? |
| :-------------------------- | :------------------------------------------------------------------------------ | :-------------: |
| `pnpm run services:infra`   | Spins up both `notesby_db` and `notesby_storage` in background mode (`-d`)      |     ✅ Yes      |
| `pnpm run services:storage` | Spins up only the GCS storage emulator                                          |     ✅ Yes      |
| `pnpm run services:status`  | Inspects container status, uptime, and healthchecks (`docker compose ps`)       |     ✅ Yes      |
| `pnpm run services:logs`    | Streams live container logs (`docker compose logs -f`)                          |     ✅ Yes      |
| `pnpm run services:stop`    | Pauses containers without unmounting networks                                   |     ✅ Yes      |
| `pnpm run services:down`    | Gracefully stops containers and removes networks (volumes intact)               |     ✅ Yes      |
| `pnpm run services:restart` | Stops containers and restarts them cleanly (volumes intact)                     |     ✅ Yes      |
| `pnpm run services:reset`   | Stops containers, removes networks, and **purges all data volumes** (`down -v`) |  ❌ Data wiped  |

---

## 3. Platform Cleanup Engine

Notesby includes a centralized, cross-platform cleanup engine powered by Node.js (`scripts/clean.ts`).

### Available Cleanup Scripts

```bash
# 1. Standard build & cache clean (Keeps packages, database, and uploads)
pnpm run clean
pnpm run clean:cache

# 2. Dependency clean (Purges node_modules, .astro, and dist)
pnpm run clean:deps

# 3. Uploads clean (Purges public/uploads/* while preserving .gitkeep)
pnpm run clean:uploads

# 4. Full platform reset (Purges cache, node_modules, uploads, AND Docker volumes)
pnpm run clean:full
pnpm run clean:all
```

### Cleanup Targets Comparison

| Target                                                    |  `clean`   | `clean:deps` | `clean:uploads` | `clean:full` |
| :-------------------------------------------------------- | :--------: | :----------: | :-------------: | :----------: |
| `.astro` Framework Cache                                  | 🧹 Removed |  🧹 Removed  |        —        |  🧹 Removed  |
| `dist/` Build Output                                      | 🧹 Removed |  🧹 Removed  |        —        |  🧹 Removed  |
| Debug Logs & Scratch Files                                | 🧹 Removed |  🧹 Removed  |        —        |  🧹 Removed  |
| `node_modules/`                                           |     —      |  🧹 Removed  |        —        |  🧹 Removed  |
| `public/uploads/*`                                        |     —      |      —       |   🧹 Removed    |  🧹 Removed  |
| Docker Volumes (`notesby_pgdata`, `notesby_storage_data`) |     —      |      —       |        —        |  🧹 Removed  |

> [!NOTE]
> If you run `pnpm run clean:full` or `pnpm run clean:deps`, `node_modules/` will be removed. Run `pnpm install` afterwards to restore your dependencies.

---

## 4. Platform Restart Workflows

To restart your development environment without losing your local database posts or uploaded assets:

### `pnpm run restart`

Executes three steps sequentially:

1. Cleans stale Astro caches (`.astro/`).
2. Reboots Docker services (`notesby_db` and `notesby_storage`) without wiping volumes.
3. Synchronizes environment variables via `scripts/setup-env.ts`.

### `pnpm run fresh`

Performs a rapid dev server restart:

1. Purges `.astro/` and `dist/`.
2. Starts `astro dev --port 4330`.

---

## 5. Database Operations

Notesby uses Drizzle ORM connected to PostgreSQL.

| Command                | Purpose                                                                                                                                        |
| :--------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run db:push`     | Directly applies `src/db/schema.ts` to the active PostgreSQL database without generating SQL migration files. Best for fast local development. |
| `pnpm run db:studio`   | Launches Drizzle Studio, a visual browser interface for inspecting and editing database records directly.                                      |
| `pnpm run db:generate` | Generates SQL migration files in `drizzle/` based on schema changes.                                                                           |
| `pnpm run db:migrate`  | Runs formal SQL migration scripts against the target database (recommended for production Cloud Run deployments).                              |

---

## 6. Emergency Admin Rescue Utility

If you forget your admin credentials or need to create an emergency admin directly on a server without SMTP email configuration:

```bash
# View all registered users
pnpm run rescue:admin

# Reset password for a specific user
pnpm run rescue:admin admin@example.com MyNewSecurePassword123
```

The script updates the user's password hash using `bcryptjs` and ensures site settings are marked active.

---

## 7. Platform Integrity & Validation Suite

Always run the validation suite before pushing code to upstream:

```bash
pnpm run validate
```

Notesby's validation engine (`scripts/validate.ts`) executes 8 bulletproof integrity checks:

1. **Publication Configuration**: Validates `notes.config.ts` structure, site title, domain format, categories, and navigation links.
2. **Route Registry**: Enforces trailing slashes (`/notes/[slug]/`), RSS route integrity, and admin namespaces in `src/links.ts`.
3. **Content Collections & Schema**: Inspects all note markdown files for YAML frontmatter delimiters, required fields, date formats, and slug collision avoidance.
4. **SCSS Design System**: Verifies CLSTRE brand blue (`#075aaa`), RSS orange (`#f97316`), responsive breakpoint maps, and runs a standalone Sass syntax compilation test.
5. **Path Aliases**: Enforces zero relative `../` imports within `src/` (strictly requires `@/` and `@config`).
6. **Astro Diagnostics**: Runs `astro check` across all components and pages.
7. **TypeScript Typecheck**: Executes `tsc --noEmit` to verify type safety.
8. **Prettier Formatting**: Verifies styling compliance across all code files (`prettier --check`).
