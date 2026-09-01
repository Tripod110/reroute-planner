import { describe, it, expect } from 'vitest'
import { suggestHabitReroute, suggestReroutes } from './reroute'

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
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
    createdAt: daysAgo(30),
    archivedAt: null,
    ...overrides,
  }
}

describe('suggestHabitReroute', () => {
  it('suggests nothing for a habit that has never been completed', () => {
    // Due-today by default, not "missed" in the reroute sense.
    expect(suggestHabitReroute(makeHabit({ lastCompletedAt: null }))).toBeNull()
  })

  it('suggests nothing for an archived habit', () => {
    const habit = makeHabit({ lastCompletedAt: daysAgo(10), archivedAt: daysAgo(1) })
    expect(suggestHabitReroute(habit)).toBeNull()
  })

  it('suggests nothing when only slightly overdue (less than one full extra cycle)', () => {
    // Due 2 days ago (cadence 2), only 1 day overdue — under the threshold.
    const habit = makeHabit({ lastCompletedAt: daysAgo(3), currentCadenceDays: 2 })
    expect(suggestHabitReroute(habit)).toBeNull()
  })

  it('suggests relaxing cadence by one target-step once a full cycle is missed', () => {
    // Due date = daysAgo(4), 4 days overdue >= currentCadenceDays (2).
    const habit = makeHabit({ lastCompletedAt: daysAgo(6), currentCadenceDays: 2, targetEveryDays: 2 })
    const suggestion = suggestHabitReroute(habit)
    expect(suggestion).not.toBeNull()
    expect(suggestion.habitId).toBe('h1')
    expect(suggestion.currentCadenceDays).toBe(2)
    expect(suggestion.suggestedCadenceDays).toBe(4)
  })

  it('never suggests below currentCadenceDays — only relaxes, never tightens', () => {
    const habit = makeHabit({ lastCompletedAt: daysAgo(6), currentCadenceDays: 2, targetEveryDays: 2 })
    const suggestion = suggestHabitReroute(habit)
    expect(suggestion.suggestedCadenceDays).toBeGreaterThan(habit.currentCadenceDays)
  })

  it('does not mutate the habit or touch lastCompletedAt — suggestion only', () => {
    const habit = makeHabit({ lastCompletedAt: daysAgo(6), currentCadenceDays: 2 })
    const before = { ...habit }
    suggestHabitReroute(habit)
    expect(habit).toEqual(before)
  })
})

describe('suggestReroutes', () => {
  it('filters to only habits with an actual suggestion', () => {
    const onTrack = makeHabit({ id: 'a', lastCompletedAt: daysAgo(0) })
    const chronicallyMissed = makeHabit({ id: 'b', lastCompletedAt: daysAgo(6), currentCadenceDays: 2 })
    const neverCompleted = makeHabit({ id: 'c', lastCompletedAt: null })

    const suggestions = suggestReroutes([onTrack, chronicallyMissed, neverCompleted])
    expect(suggestions).toHaveLength(1)
    expect(suggestions[0].habitId).toBe('b')
  })

  it('returns an empty array when nothing needs a reroute', () => {
    const onTrack = makeHabit({ lastCompletedAt: daysAgo(0) })
    expect(suggestReroutes([onTrack])).toEqual([])
  })
})
