import { describe, it, expect } from 'vitest'
import { flattenAssignments } from './canvasApi'

describe('flattenAssignments', () => {
  it('flattens nested course assignments into one list with course info attached', () => {
    const courses = [
      {
        id: 1,
        name: 'DSA',
        code: 'CS101',
        assignments: [{ id: 10, name: 'HW1', dueAt: '2026-09-10T00:00:00Z' }],
      },
      {
        id: 2,
        name: 'Bio',
        code: 'BIO101',
        assignments: [{ id: 20, name: 'Lab report', dueAt: '2026-09-11T00:00:00Z' }],
      },
    ]
    const result = flattenAssignments(courses)
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ name: 'HW1', courseName: 'DSA', courseCode: 'CS101' })
    expect(result[1]).toMatchObject({ name: 'Lab report', courseName: 'Bio', courseCode: 'BIO101' })
  })

  it('scopes assignment ids by course to avoid key collisions across courses', () => {
    const courses = [
      { id: 1, name: 'A', code: 'A1', assignments: [{ id: 10, name: 'X', dueAt: '2026-09-10' }] },
      { id: 2, name: 'B', code: 'B1', assignments: [{ id: 10, name: 'Y', dueAt: '2026-09-11' }] },
    ]
    const result = flattenAssignments(courses)
    const ids = result.map((a) => a.id)
    expect(new Set(ids).size).toBe(2)
  })

  it('returns an empty list for a course with no assignments', () => {
    const courses = [{ id: 1, name: 'A', code: 'A1', assignments: [] }]
    expect(flattenAssignments(courses)).toEqual([])
  })
})
