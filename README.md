# Hours-Based Roadmap Tracker

A responsive tracker for robotics and AI/ML work. Tasks are loaded from `data/tasks.json`; v2 task status and evidence are persisted in this browser with Zustand.

## Hours-based roadmap layer

The repo now includes a data-planning layer for the new roadmap-by-hours model:

- `scripts/parse-roadmap.ts` reads `docs/Roadmap_by_Hours.md` and writes `data/tasks.json`, `data/phases.json`, `data/cut-order.json`, and `data/topics.json`.
- `src/lib/roadmap.ts` contains the pure gate logic for `isUnlocked`, `nextUnlocked`, progress tracking, dependency-cycle checks, and swipe resolution.
- The parser validates unique IDs, missing dependencies, and cycles. Vitest verifies exact topic/group coverage against `data/topics.json`.

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

The supplied 186 task rows are loaded from `data/tasks.json`. Each task has a stable ID, track code, phase, step, hour budget, dependencies, completion criteria, topic, and group. Progress fields are `status`, `doneAt`, `notes`, `proofLink`, `minimumPass`, and `skippedAt`.

Task status is `not_started`, `in_progress`, `done`, or `parked`. A lock is derived from prerequisite completion and is never stored. The persisted store uses schema version 2. When v1 week-based data is found, the app asks you to download a JSON backup before continuing with a fresh plan. Settings imports and exports schema-v2 JSON backups.

Core-hour budgets exclude optional steps; optional work is displayed separately. Phase B provides Dashboard, Tracker, Topics, Phases, Task Detail, and Settings screens. Strict gates are on by default. Timers and swipe mode are not implemented yet.

Run `npm test` to run the Vitest parser, taxonomy, migration, and roadmap tests.

The sidebar and mobile navigation use Dashboard, Tracker, Topics, Phases, and Settings. Legacy week, project, review, and analytics routes are no longer part of the app.

## Optional cross-device sync

Local storage remains the offline cache and sync is disabled unless both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set. Copy `.env.example` to `.env`, fill in the Supabase project URL and anon key, then restart Vite. Never use a service-role key in the browser.

Run `supabase/schema.sql` in the Supabase SQL Editor. Enable email authentication. In Auth URL Configuration, set the production Site URL and add redirect allow-list entries for `http://localhost:5173/**` and `https://<your-app>.vercel.app/**` (plus any custom domain). Settings provides email magic-link sign-in; task updates merge by `updated_at` and are pushed back to the account. The fixed `data/tasks.json` plan is never synced. Last-write-wins ordering uses device timestamps, so keep device clocks current.

## Deploy

The app is a static Vite build. Import this folder into Vercel and use the defaults (`npm run build`, output directory `dist`). `vercel.json` rewrites deep links to the app entry point. For GitHub Pages, set Vite's `base` to the repository path and deploy the `dist/` directory; use a Pages SPA 404 fallback for deep links.

## Data and privacy

Edits are stored in the browser and optionally synced to the signed-in user's Supabase account. Without configuration or a connection, the app remains usable from local storage. Settings supports schema-v2 JSON backup and restore. The included `/api/chat` file belongs to the previous Life Assistant app and is not used by the roadmap tracker.