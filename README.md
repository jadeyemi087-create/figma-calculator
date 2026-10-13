# Daybook

A calm, local-first day planner prototype. Capture tasks, give them a place on your timeline, set gentle reminders, and see the shape of your week.

## Run locally

```bash
npm install
npm run dev
```

## What’s here

- Daily timeline with task completion, time changes, and drag-to-reschedule on desktop
- Quick task capture with optional time, duration, category, reminder, and recurrence settings
- Day, week, and routines views
- One-tap carry-forward for unfinished one-off tasks
- Browser notifications when permission is granted and the page is open
- Tasks saved locally in this browser with `localStorage`; no account or backend
- Responsive layouts for mobile and desktop

This repository is a React + TypeScript web prototype of the Daybook brief. A production iOS/Android app would still need the Expo / SQLite / native local-notification implementation described in the PRD. Browser notifications are best-effort and are not guaranteed when the browser is closed.
