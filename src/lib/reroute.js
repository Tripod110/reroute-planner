// v1 of the AI reasoning layer (build order step 4) — deterministic rules,
// no external model call. claude.md's non-negotiable rules apply directly:
// - Missing a cycle never resets progress to zero — it resumes at the last
//   comfortable cadence, so a suggestion only ever relaxes currentCadenceDays
//   (more days between), never resets lastCompletedAt or drops the habit.
// - Frequency/intensity increases are opt-in only — this module never makes
//   a habit *more* frequent; it only proposes relaxing one that's chronically
//   missed.
// - The AI suggests reroutes; it does not silently reschedule things — this
//   module only returns suggestions. Nothing here writes to Firestore; the
//   caller decides whether to apply one (see applyCadence in firestoreData.js).
import { getDueDate, startOfDay } from './scheduling'

const MS_PER_DAY = 24 * 60 * 60 * 1000

// A habit only gets a reroute suggestion once its due date has been missed
// by a full extra cadence cycle — a habit that's merely due today or a
// couple days overdue isn't "chronically missed" yet.
export function suggestHabitReroute(habit, today = new Date()) {
  if (habit.archivedAt || !habit.lastCompletedAt) return null

  const due = getDueDate(habit)
  const daysOverdue = Math.floor((startOfDay(today) - due) / MS_PER_DAY)
  if (daysOverdue < habit.currentCadenceDays) return null

  return {
    habitId: habit.id,
    currentCadenceDays: habit.currentCadenceDays,
    // Relax by one target-sized step rather than jumping straight to
    // "however overdue you are" — a gradual step is what "resumes at the
    // last comfortable cadence" actually means, not an arbitrary leap.
    suggestedCadenceDays: habit.currentCadenceDays + habit.targetEveryDays,
    reason: `Missed for ${daysOverdue} day${daysOverdue === 1 ? '' : 's'} past the last due date.`,
  }
}

export function suggestReroutes(habits, today = new Date()) {
  return habits
    .map((habit) => suggestHabitReroute(habit, today))
    .filter((suggestion) => suggestion !== null)
}
