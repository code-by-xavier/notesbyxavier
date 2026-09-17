# Syncing Updates from Upstream (Master)

When you deploy or maintain your own publication (such as a personal fork or clone of Notesby), your repository contains:

1. **Your Personal Content**: All your published notes in `src/content/notes/`.
2. **Your Personal Identity**: Your author details, domain, and branding in `notes.config.ts`.
3. **Your Media Assets**: Your avatar, photos, and essay images in `public/`.
4. **The Notesby Engine**: The underlying Astro layouts, components, card sliders, typography, and build scripts.

As the master Notesby repository (`CLSTRE-ORG/Notesby`) releases new features, performance enhancements, and bug fixes, this guide explains how to safely pull updates without overwriting your content, personal identity, or configuration.

---

## The Golden Rule: Engine vs. Content Isolation

- **Safe to update**: `src/components/`, `src/layouts/`, `src/styles/`, `src/pages/`, and `package.json` dependencies.
- **Never overwritten**: Your personal notes in `src/content/notes/` are unique to your repository. Git merge will never delete notes that only exist on your branch.
- **Protected configuration**: `notes.config.ts` contains your personal author information and domain.

---

## Method 1: Engine-Only Update (Recommended — 100% Conflict-Free)

If you have tens or hundreds of published notes and want to import a new UI feature (like a new slider, table of contents enhancement, or style fix) from the master repository without touching any content or configuration:

### Step 1: Ensure your local working tree is clean

```bash
git status
# Commit or stash any work in progress before updating
git add -A && git commit -m "chore: save local changes before engine update"
```

### Step 2: Fetch the latest upstream changes

```bash
# Ensure the upstream remote points to the master repo
git remote add upstream git@github.com:CLSTRE-ORG/Notesby.git 2>/dev/null || true

# Fetch the latest commits without merging
git fetch upstream
```

### Step 3: Check out only the UI components, layouts, and styles

```bash
# Pull only engine components, layouts, and styles from upstream
git checkout upstream/main -- src/components/ src/layouts/ src/styles/ src/pages/
```

### Step 4: Verify and commit

```bash
# Run validation and build to verify compatibility
pnpm validate
pnpm build

# Commit the engine update to your repository
git add -A
git commit -m "chore: update Notesby engine components from upstream"
git push origin main
```

This method guarantees:

- **Zero merge conflicts**.
- **Zero changes** to your existing notes in `src/content/notes/`.
- **Zero changes** to your personal `notes.config.ts` or domain settings.
- **Zero unwanted placeholder notes** imported.

---

## Method 2: Full Git Merge (For Major Upgrades)

When upstream releases major structural changes (such as new schema fields or updated dependencies in `package.json`), you can perform a standard Git merge.

### Step 1: Fetch and merge upstream

```bash
git fetch upstream
git merge upstream/main
```

### Step 2: What happens during a full merge?

1. **Your existing notes are safe**: Git merge does not delete files that only exist in your repository. All your live notes remain untouched.
2. **If upstream added new placeholder notes**: Upstream may include starter or example notes (e.g., `getting-started.mdx`). If you already deleted them, Git may re-introduce them as new files. Simply delete any unwanted placeholder files:

   ```bash
   git rm src/content/notes/placeholder-note.mdx
   ```

3. **If `notes.config.ts` has a merge conflict**: Git will pause and flag a conflict in `notes.config.ts` because upstream uses template defaults (`Jane Doe`) while your repository uses your personal identity. Open `notes.config.ts`, keep your personal values (name, domain, avatar, bio), and accept any new configuration keys introduced by the update. Save the file and mark resolved:

   ```bash
   git add notes.config.ts
   git commit -m "chore: merge upstream updates and preserve personal configuration"
   ```

### Step 3: Update dependencies and verify

```bash
pnpm install
pnpm validate
pnpm build
git push origin main
```

---

## Frequently Asked Questions

### Will pulling updates overwrite my existing notes?

No. Git tracks files by path. Your custom note files (e.g. `my-essay-title.mdx`) do not exist in the upstream repository, so Git will never modify or delete them.

### What if upstream adds a new field to the schema?

When upstream introduces a new frontmatter field (for example, `category: z.string().default('Essays')`), it is always implemented with a sensible default value using Zod. This ensures that all your existing notes continue compiling seamlessly without requiring manual updates.

### How do I check what has changed in the upstream repo before pulling?

You can inspect the diff between your branch and upstream before merging:

```bash
git fetch upstream
git log HEAD..upstream/main --oneline
git diff HEAD..upstream/main --stat
```
