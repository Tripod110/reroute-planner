import { describe, it, expect } from 'vitest'
import { getDueDate, getWeekDays, groupHabitsByDay } from './scheduling'

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function makeHabit(overrides) {
  return {
    id: 'h1',
    title: 'Test habit',
    category: 'other',
    targetEveryDays: 2,
    currentCadenceDays: 2,
    lastCompletedAt: null,
    createdAt: daysAgo(10),
    archivedAt: null,
    ...overrides,
  }
}

describe('getDueDate', () => {
  it('is due today for a habit that has never been completed', () => {
    const habit = makeHabit({ lastCompletedAt: null })
    expect(getDueDate(habit).getTime()).toBe(startOfDay(new Date()).getTime())
  })

  it('projects forward lastCompletedAt + currentCadenceDays', () => {
    const habit = makeHabit({ lastCompletedAt: daysAgo(1), currentCadenceDays: 3 })
    const expected = startOfDay(daysAgo(1))
    expected.setDate(expected.getDate() + 3)
    expect(getDueDate(habit).getTime()).toBe(expected.getTime())
  })

  it('produces a due date in the past when the cadence has been missed', () => {
    // Completed 4 days ago on a 2-day cadence: due date was 2 days ago.
    const habit = makeHabit({ lastCompletedAt: daysAgo(4), currentCadenceDays: 2 })
    const due = getDueDate(habit)
    expect(due.getTime()).toBeLessThan(startOfDay(new Date()).getTime())
  })

  it('ignores targetEveryDays and only projects from currentCadenceDays', () => {
    // This is the field the reroute logic (step 4) is meant to adjust —
    // getDueDate must never fall back to the original target.
    const habit = makeHabit({
      lastCompletedAt: daysAgo(1),
      targetEveryDays: 1,
      currentCadenceDays: 5,
    })
    const expected = startOfDay(daysAgo(1))
    expected.setDate(expected.getDate() + 5)
    expect(getDueDate(habit).getTime()).toBe(expected.getTime())
  })
})

describe('getWeekDays', () => {
  it('returns `count` consecutive midnight-normalized days starting today', () => {
    const days = getWeekDays(new Date(), 7)
    expect(days).toHaveLength(7)
    expect(days[0].getTime()).toBe(startOfDay(new Date()).getTime())
    for (let i = 1; i < days.length; i++) {
      const diff = days[i].getTime() - days[i - 1].getTime()
      expect(diff).toBe(24 * 60 * 60 * 1000)
    }
  })

  it('defaults to 7 days when count is omitted', () => {
    expect(getWeekDays(new Date())).toHaveLength(7)
  })
})

describe('groupHabitsByDay', () => {
  it('buckets a habit onto its exact due date within the window', () => {
    const days = getWeekDays(new Date(), 7)
    const habit = makeHabit({ lastCompletedAt: daysAgo(0), currentCadenceDays: 2 })
    const buckets = groupHabitsByDay([habit], days)
    expect(buckets.get(days[2].getTime())).toContainEqual(habit)
  })

  it('clamps an overdue habit onto the first day instead of dropping it', () => {
    // This is the behavioral guarantee behind "missing a cycle never
    // resets to zero" — a missed habit must keep showing up, not vanish.
    const days = getWeekDays(new Date(), 7)
    const overdueHabit = makeHabit({ lastCompletedAt: daysAgo(10), currentCadenceDays: 2 })
    const buckets = groupHabitsByDay([overdueHabit], days)
    expect(buckets.get(days[0].getTime())).toContainEqual(overdueHabit)
  })

  it('excludes a habit whose due date falls after the visible window', () => {
    const days = getWeekDays(new Date(), 7)
    const farFutureHabit = makeHabit({ lastCompletedAt: daysAgo(0), currentCadenceDays: 30 })
    const buckets = groupHabitsByDay([farFutureHabit], days)
    for (const day of days) {
      expect(buckets.get(day.getTime())).not.toContainEqual(farFutureHabit)
    }
  })

  it('excludes archived habits entirely', () => {
    const days = getWeekDays(new Date(), 7)
    const archivedHabit = makeHabit({ lastCompletedAt: null, archivedAt: daysAgo(1) })
    const buckets = groupHabitsByDay([archivedHabit], days)
    for (const day of days) {
      expect(buckets.get(day.getTime())).not.toContainEqual(archivedHabit)
    }
  })

  it('buckets multiple habits due the same day together', () => {
    const days = getWeekDays(new Date(), 7)
    const a = makeHabit({ id: 'a', lastCompletedAt: null })
    const b = makeHabit({ id: 'b', lastCompletedAt: null })
    const buckets = groupHabitsByDay([a, b], days)
    expect(buckets.get(days[0].getTime())).toEqual([a, b])
  })
})
