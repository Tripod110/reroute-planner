// Local stand-in for Firestore until auth + a Firebase project exist
// (see STATUS.md open decisions). Shaped to match DATA-MODEL.md exactly
// so swapping this out for real Firestore reads/writes later shouldn't
// require touching the components, only where the data comes from.

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

export const initialHabits = [
  {
    id: 'h1',
    title: 'Gym session',
    category: 'gym',
    targetEveryDays: 2,
    currentCadenceDays: 2,
    lastCompletedAt: daysAgo(1),
    createdAt: daysAgo(30),
    archivedAt: null,
  },
  {
    id: 'h2',
    title: 'DSA practice',
    category: 'school',
    targetEveryDays: 1,
    currentCadenceDays: 3,
    lastCompletedAt: daysAgo(4),
    createdAt: daysAgo(20),
    archivedAt: null,
  },
]

export const initialProjects = [
  {
    id: 'p1',
    title: 'Reroute Planner',
    category: 'other',
    completionPercent: 35,
    lastTouchedAt: daysAgo(0),
    notes: 'Rendering + check-off UI (step 3)',
    createdAt: daysAgo(2),
    completedAt: null,
  },
  {
    id: 'p2',
    title: 'Old side project',
    category: 'other',
    completionPercent: 60,
    lastTouchedAt: daysAgo(45),
    notes: 'Stalled — pick back up',
    createdAt: daysAgo(90),
    completedAt: null,
  },
]
