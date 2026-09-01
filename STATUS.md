# Status

Last updated: 2026-09-02

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

- **Canvas integration (2026-09-01):** new third entity, **Courses**,
  synced live from Rowan's Canvas (`rowan.instructure.com`) instead of
  stored in Firestore — see `DATA-MODEL.md` "Courses (from Canvas)" for
  why it doesn't fit Habits or Projects. `server/` is a minimal Express
  proxy holding the Canvas personal-access-token server-side (mirrors
  the "keys never reach the client" rule `claude.md` sets for AI calls);
  Vite dev-proxies `/api` to it so the browser never talks to Canvas
  directly. `CoursesView.jsx` adds a manual "Sync from Canvas" button
  showing each active course's upcoming assignments with due-date
  badges (overdue / due today / due soon). Setup steps in
  `CANVAS-SETUP.md`. Not yet run/verified in-browser — this dev machine
  doesn't have Node.js installed, so `npm install` / `npm run dev` /
  `npm run server` are still untested; do that first before trusting
  this works end-to-end.

- **Firebase Auth + Firestore wired (2026-09-02):** Google sign-in
  (`src/lib/auth.js`, `SignIn.jsx`) and real Firestore persistence
  (`src/lib/firestoreData.js`) replace the mock-data state that
  `App.jsx` used to hold — `src/data/mockData.js` deleted, no longer
  referenced. Firestore Timestamps converted to JS `Date` on every read
  so existing components (`ProjectItem`, `scheduling.js`) didn't need
  changes. Security rules in `firestore.rules` lock each user to their
  own `users/{uid}` subtree; pasted into Firebase console manually (no
  CLI deploy set up). Firebase web config lives in `.env`
  (`VITE_FIREBASE_*`) — not secret, but gitignored anyway for
  cleanliness. Writes now surface failures in the UI (a `dbError`
  banner in `App.jsx`) instead of failing silently — this caught a real
  bug: the first attempt to add a habit failed silently because the
  rules hadn't been published yet in the console. **Verified in-browser
  end to end:** signed in with Google, added a habit, checked it off,
  confirmed the write persisted (not just local state).

- **Tests for firestoreData.js (2026-09-02):** 12 tests in
  `src/lib/firestoreData.test.js`, mocking the Firebase SDK (no emulator)
  — covers the Timestamp-to-Date conversion, write payloads (habit
  cadence defaults, project 0%-start, `completedAt` set only at 100%),
  and confirms `onError` is actually forwarded to `onSnapshot`, which is
  the exact wiring gap that caused the silent add-habit failure earlier
  this session. `fromFirestore` exported from `firestoreData.js`
  specifically to make this testable. 23/23 tests passing, lint clean.

- **Canvas assignments merged into CalendarView (2026-09-02):** the
  weekly grid now shows Canvas due dates alongside Habits, not just in
  the separate Courses section. `scheduling.js` gained
  `groupAssignmentsByDay` — deliberately simpler than the habit
  bucketing: real due dates need no cadence math, and (unlike a missed
  habit) an assignment outside the visible window is just absent, not
  clamped onto today — "never resets to zero" is a habit-specific rule,
  not a general one. Canvas sync state moved from `CoursesView` up into
  `App.jsx` so both `CoursesView` and `CalendarView` can read the same
  synced data; `flattenAssignments` (`canvasApi.js`) turns the nested
  per-course response into one list, scoping ids by course to avoid key
  collisions. Assignment items get a purple left border in the grid to
  read as visually distinct from habits (no check-off button — Canvas
  data is read-only here). 6 new tests (29 total), lint clean, build
  clean. Not yet visually confirmed in-browser — asked the user to check.

- **AI reasoning layer v1 (2026-09-02):** `src/lib/reroute.js` —
  deterministic rules, no external model call (user chose Gemini over
  Claude for cost reasons if/when this becomes LLM-backed; v1 doesn't need
  either). `suggestHabitReroute` flags a habit once it's overdue by a full
  extra cadence cycle (not just "due today") and proposes relaxing
  `currentCadenceDays` by one `targetEveryDays`-sized step — gradual, and
  never below the current cadence, matching "resumes at the last
  comfortable cadence" rather than an arbitrary jump.
  `RerouteSuggestions.jsx` surfaces these above the Habits section with
  Accept/Dismiss — nothing is written automatically (claude.md: "suggests,
  does not silently reschedule"). Accept calls the one write this layer is
  allowed to make, `applyRerouteCadence` (`currentCadenceDays` only, never
  `targetEveryDays`). Dismiss is session-only (no persistence — full
  dismiss-tracking is a later scope decision, not snuck in here). Project
  stalled/near-done resume candidates were already surfaced via badges in
  step 3, so v1 scope is habits only. 8 new tests for the reroute rules + 1
  for `applyRerouteCadence` (38 total), lint clean, build clean. Not yet
  visually confirmed in-browser (same tooling gap as before).

- **Gemini-backed assistant (2026-09-02):** the reasoning layer got a
  second half — v1 was deterministic rules only, but the actual product
  vision (confirmed with the user) is a real personal assistant that helps
  with scheduling conflicts and project management, which date-math rules
  can't do. `server/geminiClient.js` proxies the Gemini REST API
  (`gemini-2.5-flash-lite` — cheapest current tier, matches the user's
  stated reason for choosing Gemini over Claude) with the key server-side
  only, same shape as the Canvas proxy. `src/lib/assistantContext.js`
  builds a compact snapshot (active habits, open projects, upcoming
  Canvas assignments) sent fresh on every message — not baked into
  conversation history, so it stays current as data changes mid-chat.
  `AssistantPanel.jsx` is a chat UI plus a "Today's briefing" quick-action
  (canned prompt asking for scheduling conflicts + priorities + a stalled
  project's next action) — same endpoint, no separate suggestion
  infrastructure. The assistant has no tools and no Firestore write
  access, so "suggests, doesn't decide" holds structurally, not just by
  prompt instruction. `GEMINI_API_KEY`/`GEMINI_MODEL` added to `.env` (key
  left blank — user has one but pastes it directly into the file, not
  chat, per the Canvas-token lesson from earlier this session). 4 new
  tests for the context builder (42 total), lint clean, build clean.
  **Verified end-to-end with a real key and a real Gemini response**
  (2026-09-02): the intended default model, `gemini-2.5-flash-lite`, had
  been retired for new users since this was scoped — Google's 404 named
  the replacement directly (`gemini-3.5-flash-lite`), confirmed against
  the live API rather than guessed. Swapped the default in
  `geminiClient.js` and `.env`(.example); a follow-up POST to
  `/api/assistant` returned a real, on-topic reply. **Confirmed working
  through the actual chat UI** the same day: "Today's briefing" correctly
  flagged the 5-assignment cluster due 2026-09-08 for INTRO EVOL/SCI
  INQ-RS-1 from live Canvas data, referenced the real "Shower" habit by
  name, and correctly reported no active projects rather than inventing
  one. Task #6 done end to end.

- **Persistent, inferred assistant memory (2026-09-02, task #8):** the
  Gemini assistant now genuinely remembers the user across sessions,
  building on the 2026-09-02 scoping conversation (persistent, pattern-
  based, inferred not explicit, LLM-layer only). Two prerequisite gaps
  got closed first: `checkOffHabit` now writes a real `completions`
  history entry alongside the habit doc (previously only overwrote a
  single `lastCompletedAt` timestamp), and reroute-suggestion accept/
  dismiss decisions are now persisted (`recordRerouteDecision`) instead
  of session-only. A new `users/{uid}/assistantMemory/summary` doc holds
  one evolving plain-text profile, read into every assistant call and
  updated automatically after each exchange via a dedicated Gemini call
  (`generateMemoryUpdate`, `server/geminiClient.js` — a separate prompt
  from the main reply, whose only job is maintaining a concise, under-
  200-word summary). Memory writes are automatic rather than suggest/
  confirm — a deliberate call, since it only changes what the assistant
  remembers, not real plan data — but stays visible and clearable in the
  Assistant panel ("Show what the assistant knows about you") so it's
  never a silent black box. Scoped to the LLM layer only, per the user's
  choice — the deterministic reroute engine (`src/lib/reroute.js`)
  doesn't read it. 3 new tests (61 total), lint clean, build clean.
  Landed concurrently with the UI/design pass (task #7) running in a
  parallel session on the same working tree — no collisions, verified
  after each shared-file overlap.

## Build order (from claude.md)
1. **Scaffold + auth** — done (Google sign-in via Firebase Auth)
2. Data model — done (`DATA-MODEL.md`)
3. **Rendering + check-off** — done against real Firestore data, includes
   a calendar view
4. **AI reasoning layer** — v1 done (deterministic rules); LLM-backed
   phrasing/reasoning would be a future upgrade, not required

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
Core build order (1-3) is functionally done and verified. What's left
before calling the app "done" as a daily driver, roughly in order:
1. Regression coverage for the Firestore data layer — `scheduling.js`
   has tests, `firestoreData.js` doesn't (no tests touched Firebase
   yet).
2. Hosting — not chosen (Firebase Hosting is the default fit, not
   confirmed) — app currently only runs via `npm run dev` + `npm run
   server` locally.
3. PWA/mobile-installable — named as a stack goal in `claude.md`, never
   actually implemented (manifest, service worker, icons).
4. Step 4, AI reasoning layer — last on purpose, not started.

## Open decisions / not yet chosen
- No hosting target chosen yet.
- Canvas sync is manual (button click) — whether it should become
  automatic/scheduled, and whether synced course data should get cached
  in Firestore, aren't decided.
- Canvas token was pasted into chat during setup — should be revoked and
  regenerated at canvas.rowan.edu/profile/settings when convenient, then
  swapped into `.env`.
