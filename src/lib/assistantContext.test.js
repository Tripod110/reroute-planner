import { describe, it, expect } from 'vitest'
import { buildAssistantContext } from './assistantContext'

function daysAgo(n) {
  const d = new Date('2026-09-02T00:00:00Z')
  d.setDate(d.getDate() - n)
  return d
}

describe('buildAssistantContext', () => {
  it('excludes archived habits and completed projects', () => {
    const habits = [
      { title: 'Active', category: 'gym', targetEveryDays: 2, currentCadenceDays: 2, lastCompletedAt: null, archivedAt: null },
      { title: 'Archived', category: 'gym', targetEveryDays: 2, currentCadenceDays: 2, lastCompletedAt: null, archivedAt: daysAgo(1) },
    ]
    const projects = [
      { title: 'Ongoing', category: 'other', completionPercent: 40, notes: '', lastTouchedAt: daysAgo(0), completedAt: null },
      { title: 'Done', category: 'other', completionPercent: 100, notes: '', lastTouchedAt: daysAgo(0), completedAt: daysAgo(0) },
    ]
    const context = buildAssistantContext(habits, projects, [])
    expect(context.habits).toHaveLength(1)
    expect(context.habits[0].title).toBe('Active')
    expect(context.projects).toHaveLength(1)
    expect(context.projects[0].title).toBe('Ongoing')
  })

  it('formats dates as plain YYYY-MM-DD, not full ISO timestamps', () => {
    const habits = [
      { title: 'Gym', category: 'gym', targetEveryDays: 2, currentCadenceDays: 2, lastCompletedAt: daysAgo(1), archivedAt: null },
    ]
    const context = buildAssistantContext(habits, [], [], new Date('2026-09-02T00:00:00Z'))
    expect(context.today).toBe('2026-09-02')
    expect(context.habits[0].lastCompletedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('passes through assignment name, course, and due date', () => {
    const assignments = [{ name: 'Essay 1', courseName: 'English 101', dueAt: '2026-09-05T03:59:00Z' }]
    const context = buildAssistantContext([], [], assignments)
    expect(context.upcomingAssignments).toEqual([
      { name: 'Essay 1', course: 'English 101', dueAt: '2026-09-05T03:59:00Z' },
    ])
  })

  it('handles a habit that has never been completed', () => {
    const habits = [
      { title: 'New habit', category: 'other', targetEveryDays: 1, currentCadenceDays: 1, lastCompletedAt: null, archivedAt: null },
    ]
    const context = buildAssistantContext(habits, [], [])
    expect(context.habits[0].lastCompletedAt).toBeNull()
  })
})
