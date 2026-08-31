# Status

Last updated: 2026-08-31

## Where things stand
- Repo created and public: https://github.com/Tripod110/reroute-planner
- `claude.md` written (project context, design rules, stack, build order,
  working protocol). No Firebase yet — auth still not wired up.
- Vite + React scaffold in place, verified working.
- `DATA-MODEL.md` written — Habits + Projects schema, Firestore-shaped,
  ready to wire to real Firestore once auth exists.
- Rendering + check-off UI built and verified in-browser against local
  mock data (`src/data/mockData.js`) shaped to match the Firestore schema
  1:1, so swapping in real Firestore later shouldn't require touching the
  components. Habit check-off, project completion-% slider, derived
  near-done/stalled badges, and the "show completed" filter all tested
  working.
- **Calendar (prototype T1, 2026-08-31, built unattended via `/loop`):**
  `CalendarView.jsx` + `src/lib/scheduling.js` add a 7-day grid that
  places each habit on its next due date (`lastCompletedAt +
  currentCadenceDays`). An overdue habit is clamped onto today instead of
  dropped — this is the actual visual expression of "missing a cycle
  never resets to zero." Habits view now toggles Calendar/List (Calendar
  default); Projects stay list-only since they have no due date in the
  schema — deriving *when* to nudge a stalled/near-done project is a
  judgment call reserved for step 4 (AI reasoning), not this deterministic
  view. Verified in-browser: correct day placement, check-off from the
  calendar re-buckets the habit live, List/Calendar share state. Widened
  `#root` to 1080px to fit the 7-column grid.
- **Add habit / add project forms (2026-08-31, same unattended `/loop`
  run):** `AddHabitForm.jsx` and `AddProjectForm.jsx`. Before this, the
  only habits/projects that existed were the two hardcoded mock entries
  per type — not actually usable as a planner. New habits default
  `currentCadenceDays` to whatever cadence you pick (no drift yet, so the
  two cadence fields start equal — matches the DATA-MODEL.md reasoning).
  New projects always start at 0%; if it's really already partway done,
  drag the slider up right after adding rather than backdating it in the
  form. Verified in-browser: both forms add live, new habit correctly
  lands in Calendar's "Today" column since an uncompleted habit defaults
  to due-today.
- **Hardening pass (2026-08-31, same unattended `/loop` run):** shifted
  from adding features to verifying what's built, since a prototype that
  only works in dev-server-with-hot-reload isn't actually proven. `npm
  run lint` (oxlint) clean, `npm run build` (production Vite build) clean
  — 198KB JS / 4.75KB CSS gzipped to ~62KB total, no errors. Checked the
  mobile viewport (375×812, iPhone-class) since `claude.md` names PWA/
  mobile as a stack goal and it had never been tested: everything wraps
  correctly, nothing overflows, the calendar's 7-day grid scrolls
  horizontally on narrow screens rather than breaking (no fix needed).
- **Regression tests for scheduling.js (2026-08-31, same unattended
  `/loop` run):** added `vitest` (`npm test`), 11 tests in
  `src/lib/scheduling.test.js`, all passing. Scoped narrowly to
  `scheduling.js` specifically because it's the one piece of logic in the
  app doing date-math that's easy to get subtly wrong and hard to notice
  wrong just by looking at the UI. The load-bearing one: a test asserting
  an overdue habit clamps onto day one instead of being dropped — that's
  the actual behavioral proof behind "missing a cycle never resets to
  zero," not just a docstring claim. Also covers: never-completed habits
  default to due-today, due dates project from `currentCadenceDays` and
  never fall back to `targetEveryDays` (the field the future AI reroute
  logic is meant to adjust), archived habits are excluded, and
  same-day/out-of-window bucketing. This is QA on existing logic, not new
  app scope — didn't touch components or the data model.

## Build order (from claude.md)
1. **Scaffold + auth** — scaffold done, auth not started
2. Data model — done (`DATA-MODEL.md`)
3. **Rendering + check-off** — UI done against mock data, now includes a
   calendar view; real Firestore wiring blocked on step 1 (auth/Firebase
   project)
4. AI reasoning layer — not started (last)

## Scope decision — Projects tracking (2026-08-30)
Added a second entity type alongside recurring Habits: **Projects** — things
started and not finished, or close to done. Not recurring/cadence-based like
habits, so they don't fit the existing model.
- Separate entity from Habits, not a status bolted onto the same item type.
- "Near-done" is derived from a completion-% field I maintain per project,
  not a manual status and not inferred from inactivity.
- Folded into the existing build order, not a separate track: data model
  (step 2) covers both entities, rendering (step 3) covers check-off *and*
  completion-% updates, AI reasoning (step 4) surfaces stalled/near-done
  projects as resume candidates using the same suggest-don't-decide rule
  as habit reroutes.
Schema/fields not decided yet — that's step 2, mine to write.

## Next step
Wire up Firebase Auth (Google sign-in). Nothing has been decided yet about
Firebase project setup (new project vs. existing, billing, hosting choice)
— that's a decision for when we resume, not something to pick unattended.
Nothing else in the app is blocked on it, so further unattended polish
(responsive layout, small UX gaps, more mock-data coverage) is fair game
in the meantime — but the Firebase/auth decision itself waits.

## Open decisions / not yet chosen
- Firebase project not created yet.
- No hosting target chosen yet (Firebase Hosting is the default fit given
  the stack, but not confirmed).
