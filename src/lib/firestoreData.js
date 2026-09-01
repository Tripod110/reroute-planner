import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'

// Firestore Timestamps come back with .toDate(), not .getTime() — the
// components (ProjectItem, scheduling.js) expect real JS Dates, so every
// read converts these three fields uniformly.
const DATE_FIELDS = ['lastCompletedAt', 'createdAt', 'archivedAt', 'lastTouchedAt', 'completedAt']

export function fromFirestore(docSnap) {
  const data = docSnap.data()
  const converted = { id: docSnap.id, ...data }
  for (const field of DATE_FIELDS) {
    if (converted[field]?.toDate) converted[field] = converted[field].toDate()
  }
  return converted
}

function habitsCollection(uid) {
  return collection(db, 'users', uid, 'habits')
}

function projectsCollection(uid) {
  return collection(db, 'users', uid, 'projects')
}

export function subscribeHabits(uid, onChange, onError) {
  const q = query(habitsCollection(uid), orderBy('createdAt', 'asc'))
  return onSnapshot(q, (snap) => onChange(snap.docs.map(fromFirestore)), onError)
}

export function subscribeProjects(uid, onChange, onError) {
  const q = query(projectsCollection(uid), orderBy('createdAt', 'asc'))
  return onSnapshot(q, (snap) => onChange(snap.docs.map(fromFirestore)), onError)
}

export function addHabit(uid, { title, category, everyDays }) {
  return addDoc(habitsCollection(uid), {
    title,
    category,
    targetEveryDays: everyDays,
    currentCadenceDays: everyDays,
    lastCompletedAt: null,
    createdAt: new Date(),
    archivedAt: null,
  })
}

// Updates the habit doc AND records a completions/{id} entry in one batch —
// lastCompletedAt alone can't answer "how often do I actually complete
// this," only "when was the last time." The completions subcollection is
// what makes real pattern data (task #8's assistant-memory feature)
// possible instead of just a single point-in-time snapshot.
export function checkOffHabit(uid, habitId) {
  const batch = writeBatch(db)
  const now = new Date()
  batch.update(doc(db, 'users', uid, 'habits', habitId), { lastCompletedAt: now })
  batch.set(doc(collection(db, 'users', uid, 'habits', habitId, 'completions')), {
    completedAt: now,
  })
  return batch.commit()
}

// The only write the reroute layer (src/lib/reroute.js) is allowed to
// trigger, and only when the user explicitly accepts a suggestion — never
// called automatically. Deliberately touches currentCadenceDays only, never
// targetEveryDays, matching DATA-MODEL.md's "two cadence fields" reasoning.
export function applyRerouteCadence(uid, habitId, cadenceDays) {
  return updateDoc(doc(db, 'users', uid, 'habits', habitId), {
    currentCadenceDays: cadenceDays,
  })
}

// Records whether a reroute suggestion was accepted or dismissed — the
// other half of "pattern data" for task #8 (e.g. "dismissed 3 of the last
// 4 suggestions for this habit"). Doesn't itself change the habit; that's
// applyRerouteCadence's job, called separately by the caller on accept.
export function recordRerouteDecision(uid, habitId, decision, suggestedCadenceDays) {
  return addDoc(collection(db, 'users', uid, 'habits', habitId, 'rerouteDecisions'), {
    decision,
    suggestedCadenceDays,
    decidedAt: new Date(),
  })
}

export function addProject(uid, { title, category, notes }) {
  return addDoc(projectsCollection(uid), {
    title,
    category,
    completionPercent: 0,
    lastTouchedAt: new Date(),
    notes,
    createdAt: new Date(),
    completedAt: null,
  })
}

export function updateProjectPercent(uid, projectId, percent) {
  return updateDoc(doc(db, 'users', uid, 'projects', projectId), {
    completionPercent: percent,
    lastTouchedAt: new Date(),
    completedAt: percent === 100 ? new Date() : null,
  })
}

export function touchProject(uid, projectId) {
  return updateDoc(doc(db, 'users', uid, 'projects', projectId), {
    lastTouchedAt: new Date(),
  })
}

// Single doc, not a collection — the assistant's memory is one evolving
// summary, not a log. See server/geminiClient.js's memory system
// instruction for the format/length constraints it's written under.
function assistantMemoryDoc(uid) {
  return doc(db, 'users', uid, 'assistantMemory', 'summary')
}

export function subscribeAssistantMemory(uid, onChange, onError) {
  return onSnapshot(
    assistantMemoryDoc(uid),
    (snap) => onChange(snap.exists() ? snap.data().text : ''),
    onError,
  )
}

export function setAssistantMemory(uid, text) {
  return setDoc(assistantMemoryDoc(uid), { text, updatedAt: new Date() })
}
