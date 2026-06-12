# ADHD Planner — rebuilt

A streamlined rebuild of the original `ADHDPlannerWorking` app: an executive-function
support system disguised as a task manager. This version keeps the genius ADHD
accommodations and throws out the accumulated cruft (4–5 parallel versions of every page,
three half-wired backends, ~41k lines).

## Stack

- **React 18 + TypeScript + Vite + Tailwind** — fast, typed, simple.
- **Zustand + IndexedDB** — one state store, persisted locally via `idb-keyval`.
  Everything stays on your device: instant, private, offline, nothing to provision or pay for.
- **@dnd-kit** — drag-and-drop time blocking.

### Why local-first?

For a tool you open constantly, the lowest-overhead option that can never lose your data to
a paused cloud project wins. The persistence layer is a single adapter
(`src/store/storage.ts`) behind Zustand's `StateStorage` interface, so adding cloud sync
later (e.g. Supabase) is additive — implement the same three methods or layer a sync engine
on top, and no call sites change.

## The ADHD accommodations (preserved)

| Challenge | Accommodation | Where |
|---|---|---|
| "Can't decide what to do." | **What Now?** wizard recommends tasks by time + energy + blockers. | `pages/WhatNowPage.tsx`, `utils/taskFilters.ts` |
| "Everything feels huge/vague." | Rich task fields + sort modes surface *startable* tasks. | `utils/taskPrioritization.ts` |
| "I forget tasks unless I capture them now." | Friction-free quick capture with natural-language dates + `!priority`. | `components/tasks/QuickCapture.tsx`, `utils/dateUtils.ts` |
| "I misjudge time." | Time presets + custom minutes; productive-hours-remaining banner. | `TaskFormModal`, `utils/timeAwareness.ts` |
| "My energy changes." | Energy fields + energy-match sorting + What Now energy step. | `taskPrioritization.ts` |
| "Some tasks are emotionally hard." | Emotional-weight field feeds smart score, quick-wins, eat-the-frog. | `taskPrioritization.ts` |
| "Visual clutter distracts me." | Font size, density, reduced motion, high contrast, theme. | `pages/SettingsPage.tsx`, `utils/applySettings.ts` |

### The six sort modes
`smart` · `energymatch` · `quickwins` · `eatthefrog` · `deadline` · `priority` — each one
changes *which* tasks are shown so the list matches your current capacity, not just an
abstract priority.

## What's built (core loop)

- **Today** — time-awareness banner, due-today / overdue, quick capture, What Now CTA.
- **Tasks** — capture, six sort modes, energy selector, full task form, completed view.
- **What Now?** — the time → energy → blockers → recommendations wizard.
- **Planner** — drag tasks into time blocks per day.
- **Settings** — visual/sensory, time/transitions, bring-your-own-key AI, data export/import.

## Roadmap (next phases)

- Projects + Categories management pages, project breakdown.
- Brain Dump (rotating prompts) and Weekly Review (journal + reflection).
- Accountability check-in (non-shaming overdue/undated review with reasons → actions).
- Fuzzy Task Breakdown (bring-your-own-key OpenAI, with offline guided-prompt fallback).
- Subtasks & dependencies UI; focus/hyperfocus tracking (task-switch + break nudges).
- Calendar view; recurring tasks; deleted-tasks (soft-delete) bin.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build
```
