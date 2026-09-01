import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Firestore SDK — these tests check that our functions build the
// right collection paths and payloads, not that Firestore itself works.
// A fake Timestamp mirrors the real one: any object with a .toDate().
const addDoc = vi.fn()
const updateDoc = vi.fn()
const setDoc = vi.fn()
const onSnapshot = vi.fn()
const doc = vi.fn((..._args) => ({ __type: 'docRef' }))
const collection = vi.fn((..._args) => ({ __type: 'collectionRef' }))
const query = vi.fn((ref, ..._clauses) => ref)
const orderBy = vi.fn()
const batchUpdate = vi.fn()
const batchSet = vi.fn()
const batchCommit = vi.fn()
const writeBatch = vi.fn(() => ({ update: batchUpdate, set: batchSet, commit: batchCommit }))

vi.mock('firebase/firestore', () => ({
  addDoc: (...args) => addDoc(...args),
  updateDoc: (...args) => updateDoc(...args),
  setDoc: (...args) => setDoc(...args),
  onSnapshot: (...args) => onSnapshot(...args),
  doc: (...args) => doc(...args),
  collection: (...args) => collection(...args),
  query: (...args) => query(...args),
  orderBy: (...args) => orderBy(...args),
  writeBatch: (...args) => writeBatch(...args),
}))

vi.mock('./firebase', () => ({ db: { __type: 'db' } }))

const {
  addHabit,
  addProject,
  applyRerouteCadence,
  checkOffHabit,
  fromFirestore,
  recordRerouteDecision,
  setAssistantMemory,
  subscribeAssistantMemory,
  subscribeHabits,
  subscribeProjects,
  touchProject,
  updateProjectPercent,
} = await import('./firestoreData')

function fakeTimestamp(date) {
  return { toDate: () => date }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fromFirestore', () => {
  it('converts Firestore Timestamp fields to real Dates', () => {
    const completedAt = new Date('2026-01-01')
    const docSnap = {
      id: 'h1',
      data: () => ({
        title: 'Gym',
        lastCompletedAt: fakeTimestamp(completedAt),
        createdAt: fakeTimestamp(completedAt),
      }),
    }
    const result = fromFirestore(docSnap)
    expect(result.id).toBe('h1')
    expect(result.lastCompletedAt).toBeInstanceOf(Date)
    expect(result.lastCompletedAt.getTime()).toBe(completedAt.getTime())
  })

  it('leaves null date fields as null instead of throwing', () => {
    const docSnap = {
      id: 'h1',
      data: () => ({ title: 'Gym', lastCompletedAt: null, archivedAt: null }),
    }
    const result = fromFirestore(docSnap)
    expect(result.lastCompletedAt).toBeNull()
    expect(result.archivedAt).toBeNull()
  })

  it('leaves non-date fields untouched', () => {
    const docSnap = { id: 'h1', data: () => ({ title: 'Gym', completionPercent: 40 }) }
    const result = fromFirestore(docSnap)
    expect(result.title).toBe('Gym')
    expect(result.completionPercent).toBe(40)
  })
})

describe('addHabit', () => {
  it('defaults currentCadenceDays to the chosen everyDays, matching targetEveryDays', () => {
    addHabit('uid1', { title: 'Gym', category: 'gym', everyDays: 3 })
    const payload = addDoc.mock.calls[0][1]
    expect(payload.targetEveryDays).toBe(3)
    expect(payload.currentCadenceDays).toBe(3)
    expect(payload.lastCompletedAt).toBeNull()
    expect(payload.archivedAt).toBeNull()
    expect(payload.createdAt).toBeInstanceOf(Date)
  })

  it('writes into users/{uid}/habits', () => {
    addHabit('uid1', { title: 'Gym', category: 'gym', everyDays: 1 })
    expect(collection).toHaveBeenCalledWith({ __type: 'db' }, 'users', 'uid1', 'habits')
  })
})

describe('checkOffHabit', () => {
  it('batches a lastCompletedAt update with a new completions entry', () => {
    checkOffHabit('uid1', 'habit1')
    expect(writeBatch).toHaveBeenCalledWith({ __type: 'db' })
    expect(doc).toHaveBeenCalledWith({ __type: 'db' }, 'users', 'uid1', 'habits', 'habit1')
    const updatePayload = batchUpdate.mock.calls[0][1]
    expect(updatePayload.lastCompletedAt).toBeInstanceOf(Date)

    expect(collection).toHaveBeenCalledWith(
      { __type: 'db' },
      'users',
      'uid1',
      'habits',
      'habit1',
      'completions',
    )
    const setPayload = batchSet.mock.calls[0][1]
    expect(setPayload.completedAt).toBeInstanceOf(Date)

    expect(batchCommit).toHaveBeenCalled()
  })
})

describe('recordRerouteDecision', () => {
  it('records the decision and suggested cadence in a habit-scoped subcollection', () => {
    recordRerouteDecision('uid1', 'habit1', 'dismissed', 6)
    expect(collection).toHaveBeenCalledWith(
      { __type: 'db' },
      'users',
      'uid1',
      'habits',
      'habit1',
      'rerouteDecisions',
    )
    const payload = addDoc.mock.calls[0][1]
    expect(payload.decision).toBe('dismissed')
    expect(payload.suggestedCadenceDays).toBe(6)
    expect(payload.decidedAt).toBeInstanceOf(Date)
  })
})

describe('assistant memory', () => {
  it('setAssistantMemory writes text to a single summary doc', () => {
    setAssistantMemory('uid1', 'Tends to skip gym on weekends.')
    expect(doc).toHaveBeenCalledWith(
      { __type: 'db' },
      'users',
      'uid1',
      'assistantMemory',
      'summary',
    )
    const payload = setDoc.mock.calls[0][1]
    expect(payload.text).toBe('Tends to skip gym on weekends.')
    expect(payload.updatedAt).toBeInstanceOf(Date)
  })

  it('subscribeAssistantMemory passes an empty string when no memory doc exists yet', () => {
    const onChange = vi.fn()
    subscribeAssistantMemory('uid1', onChange, vi.fn())
    const snapshotCallback = onSnapshot.mock.calls[0][1]
    snapshotCallback({ exists: () => false })
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('subscribeAssistantMemory passes the stored text when the doc exists', () => {
    const onChange = vi.fn()
    subscribeAssistantMemory('uid1', onChange, vi.fn())
    const snapshotCallback = onSnapshot.mock.calls[0][1]
    snapshotCallback({ exists: () => true, data: () => ({ text: 'Prefers mornings.' }) })
    expect(onChange).toHaveBeenCalledWith('Prefers mornings.')
  })
})

describe('addProject', () => {
  it('always starts at 0% with no completedAt', () => {
    addProject('uid1', { title: 'Side project', category: 'other', notes: 'notes' })
    const payload = addDoc.mock.calls[0][1]
    expect(payload.completionPercent).toBe(0)
    expect(payload.completedAt).toBeNull()
    expect(payload.lastTouchedAt).toBeInstanceOf(Date)
  })
})

describe('updateProjectPercent', () => {
  it('sets completedAt when percent reaches 100', () => {
    updateProjectPercent('uid1', 'p1', 100)
    const payload = updateDoc.mock.calls[0][1]
    expect(payload.completionPercent).toBe(100)
    expect(payload.completedAt).toBeInstanceOf(Date)
  })

  it('keeps completedAt null below 100', () => {
    updateProjectPercent('uid1', 'p1', 80)
    const payload = updateDoc.mock.calls[0][1]
    expect(payload.completedAt).toBeNull()
  })
})

describe('touchProject', () => {
  it('only updates lastTouchedAt, not completionPercent', () => {
    touchProject('uid1', 'p1')
    const payload = updateDoc.mock.calls[0][1]
    expect(Object.keys(payload)).toEqual(['lastTouchedAt'])
  })
})

describe('applyRerouteCadence', () => {
  it('updates only currentCadenceDays, never targetEveryDays', () => {
    applyRerouteCadence('uid1', 'habit1', 4)
    expect(doc).toHaveBeenCalledWith({ __type: 'db' }, 'users', 'uid1', 'habits', 'habit1')
    const payload = updateDoc.mock.calls[0][1]
    expect(payload).toEqual({ currentCadenceDays: 4 })
  })
})

describe('subscribeHabits / subscribeProjects', () => {
  it('orders by createdAt and forwards onError to onSnapshot', () => {
    const onChange = vi.fn()
    const onError = vi.fn()
    subscribeHabits('uid1', onChange, onError)
    expect(orderBy).toHaveBeenCalledWith('createdAt', 'asc')
    expect(onSnapshot).toHaveBeenCalledWith(expect.anything(), expect.any(Function), onError)
  })

  it('maps snapshot docs through fromFirestore before calling onChange', () => {
    const onChange = vi.fn()
    subscribeProjects('uid1', onChange, vi.fn())
    const snapshotCallback = onSnapshot.mock.calls[0][1]
    const fakeSnap = {
      docs: [{ id: 'p1', data: () => ({ title: 'Thing', completionPercent: 10 }) }],
    }
    snapshotCallback(fakeSnap)
    expect(onChange).toHaveBeenCalledWith([{ id: 'p1', title: 'Thing', completionPercent: 10 }])
  })
})
