# Data Model (draft)

First take — meant to be modified, not final. Reasoning inline so it's
clear why each piece is shaped the way it is.

## Firestore layout

```
users/{uid}/habits/{habitId}
users/{uid}/habits/{habitId}/completions/{completionId}
users/{uid}/habits/{habitId}/rerouteDecisions/{decisionId}
users/{uid}/projects/{projectId}
users/{uid}/assistantMemory/summary
```

Everything nests under `users/{uid}` even though it's single-user today.
Reason: Firestore security rules key off path structure, and
`request.auth.uid == uid` on the top-level doc is the simplest rule that
still locks the data down once Auth is wired up in step 1. Costs nothing
now, saves a migration later.

## `habits/{habitId}`

| field | type | notes |
|---|---|---|
| `title` | string | |
| `category` | string | `'school' \| 'work' \| 'gym' \| 'other'` |
| `targetEveryDays` | number | the *intended* cadence, e.g. `1` = daily, `7` = weekly |
| `currentCadenceDays` | number | the *actual* cadence you're resuming at — starts equal to `targetEveryDays`, but can drift up after a miss |
| `lastCompletedAt` | timestamp \| null | |
| `createdAt` | timestamp | |
| `archivedAt` | timestamp \| null | |

Subcollection `completions/{completionId}`: just `{ completedAt: timestamp }`
per check-off. Kept separate from the habit doc instead of an array field
so the history can grow indefinitely without hitting Firestore's 1MiB
document-size limit, and so the AI reasoning layer (step 4) can query it
directly for streak/gap analysis. **Implemented 2026-09-02** —
`checkOffHabit` writes both the habit doc's `lastCompletedAt` and a new
`completions` entry in one batch (`src/lib/firestoreData.js`); before
this it only overwrote the single timestamp, so no real history existed.

Subcollection `rerouteDecisions/{decisionId}`: `{ decision: 'accepted' |
'dismissed', suggestedCadenceDays: number, decidedAt: timestamp }`.
Records what happened to each reroute suggestion (`src/lib/reroute.js`)
— the other half of "pattern data," e.g. "dismissed 3 of the last 4
suggestions for this habit." Written by `recordRerouteDecision`.

## `users/{uid}/assistantMemory/summary`

Single doc, not a collection — one evolving plain-text summary of
patterns the Gemini assistant has inferred about the user (added
2026-09-02, task #8). `{ text: string, updatedAt: timestamp }`. Read into
every assistant call's context; updated automatically (not suggest/
confirm) after each chat exchange via a separate Gemini call
(`generateMemoryUpdate` in `server/geminiClient.js`) — lower stakes than
a plan-changing suggestion since it only affects what the assistant
remembers, not real habit/project data, but stays visible and clearable
in the Assistant panel so it's never a black box. Deliberately scoped to
the LLM layer only — the deterministic reroute engine never reads it.

**Why two cadence fields instead of one:** this is where "missing a cycle
never resets to zero" actually lives. `targetEveryDays` is what you set
out to do; `currentCadenceDays` is what the reroute logic is allowed to
adjust downward-in-frequency (never delete or zero out) when you miss a
few cycles. The AI reasoning layer (`src/lib/reroute.js`, v1 as of
2026-09-02) reads/writes `currentCadenceDays`, never `targetEveryDays` —
so your original intent stays visible even after a reroute. The write
itself only happens through `applyRerouteCadence` in
`firestoreData.js`, and only when you explicitly accept a suggestion in
the UI — never automatically.

## `projects/{projectId}`

| field | type | notes |
|---|---|---|
| `title` | string | |
| `category` | string | same enum as habits, or free text — your call |
| `completionPercent` | number | 0–100, you update it manually |
| `lastTouchedAt` | timestamp | updated whenever you touch the project |
| `notes` | string | optional freeform — "next action" or context for future-you |
| `createdAt` | timestamp | |
| `completedAt` | timestamp \| null | set once `completionPercent` hits 100 |

**No stored `status` field.** Both signals you asked for — *stalled* and
*close to done* — are derived, not stored, so there's no separate state
machine to keep in sync with the two fields above:

- **stalled** = low/mid `completionPercent` + `lastTouchedAt` far in the past
- **near-done** = high `completionPercent`, regardless of recency

Thresholds (how "far in the past," how "high" a percent) aren't picked
yet — that's a small config decision, not a schema one, so it's easy to
tune later without a migration.

## Courses (from Canvas, 2026-09-01)

Not a Firestore collection — fetched live from Canvas via the local
proxy server (`server/`, see `CANVAS-SETUP.md`) on manual sync, not
persisted. Kept as a third entity type rather than mapped into Habits or
Projects: assignments have a hard `due_at` from Canvas, not a cadence
you control or a completion-% you maintain, so neither existing schema
fits without lying about what the field means.

Shape returned by `GET /api/canvas/courses` (`server/canvasClient.js`):

```
{ courses: [
  { id, name, code,
    assignments: [ { id, name, dueAt, htmlUrl, pointsPossible, submitted } ]
  }
] }
```

Read-only for now — nothing writes back to Canvas. If this later feeds
the AI reasoning layer (step 4) or gets cached in Firestore for
offline/history purposes, that's a fresh decision, not assumed here.

## Decisions (2026-08-30)

- `category` is the same enum for both habits and projects.
- No fields missing — schema above is final for now.
- No deletion, ever. Completed/archived items are filtered out of the
  default view via `completedAt`/`archivedAt`, not removed. Matches the
  "no reset to zero" spirit.
