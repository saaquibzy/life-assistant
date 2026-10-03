# 24-Week Roadmap Tracker

A responsive, multi-page roadmap for robotics and AI/ML work. Tasks are loaded from `data/tasks.json`; editable status, notes, dates, reviews, and links are persisted in this browser with Zustand and can optionally sync through Supabase.

## Hours-based roadmap layer

The repo now includes a data-planning layer for the new roadmap-by-hours model:

- `scripts/parse-roadmap.ts` reads `docs/Roadmap_by_Hours.md` and writes `data/tasks.json`, `data/phases.json`, `data/cut-order.json`, and `data/topics.json`.
- `src/lib/roadmap.ts` contains the pure gate logic for `isUnlocked`, `nextUnlocked`, progress tracking, dependency-cycle checks, and swipe resolution.
- The parser validates unique IDs, missing dependencies, cycles, orphaned topic/group assignments, and optional summary-hour checks.

Run the parser with:

```sh
npm run parse-roadmap
```

The generated JSON is built for the new schema and is ready to feed the hours-based UI without hardcoding task data into the app shell.

## Run locally

```sh
npm install
npm run dev
```

Run `npm run build` to type-check and produce the static site in `dist/`.

## Load the task plan

The supplied 187 task rows are loaded from `data/tasks.json`. Numeric IDs and phase labels such as `1 Foundations` are normalized by the store. Additional task imports should keep the same fields:

```json
{
  "id": 1,
  "phase": "1 Foundations",
  "week": 1,
  "track": "AI/ML",
  "project": "Foundations",
  "topic": "Set up the baseline",
  "output": "A reproducible training run",
  "resource": "https://example.com/reference",
  "status": "Not started",
  "dateDone": "",
  "notes": ""
}
```

Valid tracks are `AI/ML`, `Robotics`, `Design/Web`, `Video/Social`, and `Resume`. Valid statuses are `Not started`, `In progress`, and `Done`. User edits are stored separately from the fixed plan; matching IDs retain their updates when the plan is replaced. Export a backup before changing task IDs.

Settings imports and exports JSON backups and CSV task rows. CSV imports must match the exported task columns. Changing the exam pause count shifts the plan start date by the difference in weeks, so current-week and finish-date calculations move with it.

Run `npm test` to run the Vitest data and metrics tests.

Each route is a lazily loaded page module under `src/pages/`; the app shell and shared UI live in `src/App.tsx` and `src/components/shared.tsx`. Vite emits separate route chunks in production builds.

## Optional cross-device sync

Local storage remains the offline cache and sync is disabled unless both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set. Copy `.env.example` to `.env`, fill in the Supabase project URL and anon key, then restart Vite. Never use a service-role key in the browser.

Run `supabase/schema.sql` in the Supabase SQL Editor. Enable email authentication. In Auth URL Configuration, set the production Site URL and add redirect allow-list entries for `http://localhost:5173/**` and `https://<your-app>.vercel.app/**` (plus any custom domain). Settings provides email magic-link sign-in; after sign-in, editable records merge by `updated_at` and are pushed back to the account. The fixed `data/tasks.json` plan is never synced. Task status/date/notes, reviews, project links, resume checklist values, plan start date, and pause offset are synced. Deletions use timestamped tombstones so they propagate to other devices. Last-write-wins ordering uses device timestamps, so keep device clocks current.

## Deploy

The app is a static Vite build. Import this folder into Vercel and use the defaults (`npm run build`, output directory `dist`). `vercel.json` rewrites deep links to the app entry point. For GitHub Pages, set Vite's `base` to the repository path and deploy the `dist/` directory; use a Pages SPA 404 fallback for deep links.

## Data and privacy

Edits are stored in the browser and optionally synced to the signed-in user's Supabase account. Without configuration or a connection, the app remains usable from local storage. Settings supports JSON backup/restore and CSV task export. The included `/api/chat` file belongs to the previous Life Assistant app and is not used by the roadmap tracker.