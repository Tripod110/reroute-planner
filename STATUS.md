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

## Build order (from claude.md)
1. **Scaffold + auth** — scaffold done, auth not started
2. Data model — done (`DATA-MODEL.md`)
3. **Rendering + check-off** — UI done against mock data; real Firestore
   wiring blocked on step 1 (auth/Firebase project)
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
— that's a decision for when we resume.

## Open decisions / not yet chosen
- Firebase project not created yet.
- No hosting target chosen yet (Firebase Hosting is the default fit given
  the stack, but not confirmed).
