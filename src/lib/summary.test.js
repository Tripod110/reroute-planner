import { describe, it, expect } from 'vitest'
import { buildSummary, isNearDone, isOnRoute, isStalled } from './summary'
import { NEAR_DONE_PERCENT, STALLED_AFTER_DAYS } from '../config/thresholds'

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function daysAhead(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d
}

function makeHabit(overrides) {
  return {
    id: 'h1',
    title: 'Test habit',
    category: 'other',
    targetEveryDays: 2,
    currentCadenceDays: 2,
    lastCompletedAt: daysAgo(1),
    createdAt: daysAgo(30),
    archivedAt: null,
    ...overrides,
  }
}

function makeProject(overrides) {
  return {
    id: 'p1',
    title: 'Test project',
    category: 'other',
    completionPercent: 40,
    lastTouchedAt: daysAgo(1),
    notes: '',
    createdAt: daysAgo(30),
    completedAt: null,
    ...overrides,
  }
}

describe('isNearDone', () => {
  it('is true at or above the near-done threshold', () => {
    expect(isNearDone(makeProject({ completionPercent: NEAR_DONE_PERCENT }))).toBe(true)
  })

  it('is false below the threshold', () => {
    expect(isNearDone(makeProject({ completionPercent: NEAR_DONE_PERCENT - 1 }))).toBe(false)
  })

  it('is false once the project is completed', () => {
    const done = makeProject({ completionPercent: 100, completedAt: daysAgo(1) })
    expect(isNearDone(done)).toBe(false)
  })
})

describe('isStalled', () => {
  it('is true for a low-percent project untouched past the threshold', () => {
    const project = makeProject({ completionPercent: 20, lastTouchedAt: daysAgo(STALLED_AFTER_DAYS) })
    expect(isStalled(project)).toBe(true)
  })

  it('is false while the project was touched recently', () => {
    const project = makeProject({ completionPercent: 20, lastTouchedAt: daysAgo(1) })
    expect(isStalled(project)).toBe(false)
  })

  // Two independent signals, not stages of one status — a near-done
  // project left alone is near done, not stalled.
  it('is false for a near-done project even when long untouched', () => {
    const project = makeProject({
      completionPercent: NEAR_DONE_PERCENT,
      lastTouchedAt: daysAgo(STALLED_AFTER_DAYS * 3),
    })
    expect(isStalled(project)).toBe(false)
  })

  it('is false for a completed project', () => {
    const project = makeProject({
      completionPercent: 100,
      completedAt: daysAgo(1),
      lastTouchedAt: daysAgo(STALLED_AFTER_DAYS * 2),
    })
    expect(isStalled(project)).toBe(false)
  })
})

describe('isOnRoute', () => {
  it('counts a habit whose next due date is still ahead', () => {
    expect(isOnRoute(makeHabit({ lastCompletedAt: daysAgo(0), currentCadenceDays: 3 }))).toBe(true)
  })

  it('counts a habit due today', () => {
    expect(isOnRoute(makeHabit({ lastCompletedAt: daysAgo(2), currentCadenceDays: 2 }))).toBe(true)
  })

  it('does not count an overdue habit', () => {
    expect(isOnRoute(makeHabit({ lastCompletedAt: daysAgo(9), currentCadenceDays: 2 }))).toBe(false)
  })

  it('does not count an archived habit', () => {
    const archived = makeHabit({ lastCompletedAt: daysAgo(0), archivedAt: daysAgo(1) })
    expect(isOnRoute(archived)).toBe(false)
  })
})

describe('buildSummary', () => {
  it('returns zeroes for empty inputs', () => {
    expect(buildSummary()).toEqual({
      onRoute: 0,
      needsReroute: 0,
      dueThisWeek: 0,
      stalled: 0,
    })
  })

  it('counts reroute suggestions and stalled projects', () => {
    const habits = [
      makeHabit({ id: 'a', lastCompletedAt: daysAgo(0), currentCadenceDays: 3 }),
      // 6 days since last, cadence 2 => 4 days overdue => suggestion.
      makeHabit({ id: 'b', lastCompletedAt: daysAgo(6), currentCadenceDays: 2 }),
    ]
    const projects = [
      makeProject({ id: 'p1', completionPercent: 20, lastTouchedAt: daysAgo(STALLED_AFTER_DAYS) }),
      makeProject({ id: 'p2', completionPercent: 20, lastTouchedAt: daysAgo(1) }),
    ]

    const summary = buildSummary(habits, projects)
    expect(summary.needsReroute).toBe(1)
    expect(summary.stalled).toBe(1)
    expect(summary.onRoute).toBe(1)
  })

  it('counts assignments falling inside the visible week', () => {
    const assignments = [
      { id: 'a1', name: 'Due soon', dueAt: daysAhead(2).toISOString() },
      { id: 'a2', name: 'Far future', dueAt: daysAhead(60).toISOString() },
    ]
    expect(buildSummary([], [], assignments).dueThisWeek).toBe(1)
  })

  it('does not mutate its inputs', () => {
    const habits = [makeHabit({ lastCompletedAt: daysAgo(6) })]
    const projects = [makeProject()]
    const before = JSON.stringify({ habits, projects })
    buildSummary(habits, projects)
    expect(JSON.stringify({ habits, projects })).toBe(before)
  })
})
