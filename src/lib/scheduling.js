// Deterministic schedule math for the calendar view — NOT the AI
// reasoning layer (build order step 4). This only projects forward
// "last completed + cadence" to a due date; it never adjusts cadence or
// suggests anything. A missed habit stays due (bucketed onto today)
// instead of disappearing, which is what actually implements "missing a
// cycle never resets to zero" visually.

export function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getDueDate(habit) {
  if (!habit.lastCompletedAt) return startOfDay(new Date())
  const due = startOfDay(habit.lastCompletedAt)
  due.setDate(due.getDate() + habit.currentCadenceDays)
  return due
}

export function getWeekDays(startDate = new Date(), count = 7) {
  const start = startOfDay(startDate)
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return d
  })
}

// Buckets each habit onto a day in `days`. A habit due before the first
// day (overdue) is clamped onto the first day rather than dropped.
export function groupHabitsByDay(habits, days) {
  const buckets = new Map(days.map((d) => [d.getTime(), []]))
  const first = days[0]
  const last = days[days.length - 1]

  habits.forEach((habit) => {
    if (habit.archivedAt) return
    let due = getDueDate(habit)
    if (due < first) due = first
    if (due > last) return
    buckets.get(due.getTime())?.push(habit)
  })

  return buckets
}

// Assignments have a hard due date from Canvas, unlike habits — no
// cadence math, and no clamping an overdue one onto today. Canvas is
// queried with bucket=upcoming (see server/canvasClient.js), so overdue
// assignments won't reach this function in practice; one that's outside
// the visible window (before or after) is simply not shown here, not
// dropped from Canvas.
export function groupAssignmentsByDay(assignments, days) {
  const buckets = new Map(days.map((d) => [d.getTime(), []]))
  assignments.forEach((assignment) => {
    const due = startOfDay(new Date(assignment.dueAt))
    buckets.get(due.getTime())?.push(assignment)
  })
  return buckets
}
