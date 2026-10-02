# 24-Week Roadmap Tracker

A responsive, multi-page roadmap for robotics and AI/ML work. Tasks are loaded from `data/tasks.json`; editable status, notes, dates, reviews, and links are persisted in this browser with Zustand. The data access stays behind a store boundary so remote synchronization can be added later.

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

## Deploy

The app is a static Vite build. Import this folder into Vercel and use the defaults (`npm run build`, output directory `dist`). `vercel.json` rewrites deep links to the app entry point. For GitHub Pages, set Vite's `base` to the repository path and deploy the `dist/` directory; use a Pages SPA 404 fallback for deep links.

## Data and privacy

All edits stay in the browser's local storage. Settings supports JSON backup/restore and CSV task export. The included `/api/chat` file belongs to the previous Life Assistant app and is not used by the roadmap tracker.