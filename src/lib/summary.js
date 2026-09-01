// Derived counts for the status strip at the top of the app.
//
// Read-only and purely derived — nothing here writes, stores, or
// decides anything, so it stays clear of the "AI suggests but never
// decides" rule. It reuses scheduling.js and reroute.js rather than
// re-deriving due dates, so the strip can never disagree with the
// calendar it sits above.
//
// The project predicates live here rather than inside ProjectItem so
// that "stalled" and "near done" have exactly one definition (see
// DATA-MODEL.md — both are derived, never stored).
import { NEAR_DONE_PERCENT, STALLED_AFTER_DAYS } from '../config/thresholds'
import { getDueDate, getWeekDays, groupAssignmentsByDay, groupHabitsByDay, startOfDay } from './scheduling'
import { suggestReroutes } from './reroute'

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function daysSince(date, today = new Date()) {
  if (!date) return null
  return Math.floor((today.getTime() - date.getTime()) / MS_PER_DAY)
}

export function isNearDone(project) {
  return !project.completedAt && project.completionPercent >= NEAR_DONE_PERCENT
}

// Deliberately excludes near-done projects: a project sitting at 90%
// that you haven't touched in a month is "near done", not "stalled".
// Two independent signals, not stages of one status.
export function isStalled(project, today = new Date()) {
  if (project.completedAt) return false
  if (project.completionPercent >= NEAR_DONE_PERCENT) return false
  return daysSince(project.lastTouchedAt, today) >= STALLED_AFTER_DAYS
}

// "On route" means the next due date hasn't passed yet — due today
// still counts. An overdue habit is not on route, but it is also not
// failed; it just isn't part of this count.
export function isOnRoute(habit, today = new Date()) {
  if (habit.archivedAt) return false
  return getDueDate(habit) >= startOfDay(today)
}

export function buildSummary(habits = [], projects = [], assignments = [], today = new Date()) {
  const days = getWeekDays(today)
  const habitBuckets = groupHabitsByDay(habits, days)
  const assignmentBuckets = groupAssignmentsByDay(assignments, days)

  const countBuckets = (buckets) =>
    [...buckets.values()].reduce((total, items) => total + items.length, 0)

  return {
    onRoute: habits.filter((habit) => isOnRoute(habit, today)).length,
    needsReroute: suggestReroutes(habits, today).length,
    dueThisWeek: countBuckets(habitBuckets) + countBuckets(assignmentBuckets),
    stalled: projects.filter((project) => isStalled(project, today)).length,
  }
}
