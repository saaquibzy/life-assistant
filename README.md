# 24-Week Roadmap Tracker

A responsive, multi-page roadmap for robotics and AI/ML work. Tasks are loaded from `data/tasks.json`; editable status, notes, dates, reviews, and links are persisted in this browser with Zustand. The data access stays behind a store boundary so remote synchronization can be added later.

## Run locally

```sh
npm install
npm run dev
```

Run `npm run build` to type-check and produce the static site in `dist/`.

## Load the task plan

Replace `data/tasks.json` with the supplied task rows. Each row follows this shape:

```json
{
  "id": "W01-AI-01",
  "phase": 1,
  "week": 1,
  "track": "AI/ML",
  "project": "H5 Paper reproduction",
  "topic": "Set up the baseline",
  "output": "A reproducible training run",
  "resource": "https://example.com/reference",
  "status": "Not started",
  "dateDone": "",
  "notes": ""
}
```

Valid tracks are `AI/ML`, `Robotics`, `Design/Web`, `Video/Social`, and `Resume`. Valid statuses are `Not started`, `In progress`, and `Done`. The checked-in JSON is a 10-row starter fixture because the full 187 task rows were not included with the request. Existing browser data is independent of this file; use Settings to export a backup before replacing the plan.

## Deploy

The app is a static Vite build. Import this folder into Vercel and use the defaults (`npm run build`, output directory `dist`). `vercel.json` rewrites deep links to the app entry point. For GitHub Pages, set Vite's `base` to the repository path and deploy the `dist/` directory; use a Pages SPA 404 fallback for deep links.

## Data and privacy

All edits stay in the browser's local storage. Settings supports JSON backup/restore and CSV task export. The included `/api/chat` file belongs to the previous Life Assistant app and is not used by the roadmap tracker.