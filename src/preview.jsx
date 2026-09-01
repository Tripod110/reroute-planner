// TEMPORARY design-verification harness — renders the real components
// with mock data so the Waypoint pass can be checked at both viewports
// and both themes without a Firebase sign-in. Delete along with
// preview.html once the design pass is verified.
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import AddHabitForm from './components/AddHabitForm'
import AddProjectForm from './components/AddProjectForm'
import CalendarView from './components/CalendarView'
import CoursesView from './components/CoursesView'
import HabitList from './components/HabitList'
import ProjectList from './components/ProjectList'
import RerouteSuggestions from './components/RerouteSuggestions'
import StatusStrip from './components/StatusStrip'
import { flattenAssignments } from './lib/canvasApi'
import { buildSummary } from './lib/summary'
import './index.css'
import './App.css'

const day = (n) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d
}

const HABITS = [
  {
    id: 'h1',
    title: 'Gym — push day',
    category: 'gym',
    targetEveryDays: 2,
    currentCadenceDays: 2,
    lastCompletedAt: day(-1),
    createdAt: day(-60),
    archivedAt: null,
  },
  {
    id: 'h2',
    title: 'Read CS papers',
    category: 'school',
    targetEveryDays: 3,
    currentCadenceDays: 5,
    lastCompletedAt: day(-12),
    createdAt: day(-60),
    archivedAt: null,
  },
  {
    id: 'h3',
    title: 'Guitar practice',
    category: 'other',
    targetEveryDays: 1,
    currentCadenceDays: 1,
    lastCompletedAt: day(0),
    createdAt: day(-60),
    archivedAt: null,
  },
  {
    id: 'h4',
    title: 'Shift at the lab',
    category: 'work',
    targetEveryDays: 7,
    currentCadenceDays: 7,
    lastCompletedAt: day(-3),
    createdAt: day(-60),
    archivedAt: null,
  },
]

const PROJECTS = [
  {
    id: 'p1',
    title: 'Reroute Planner',
    category: 'other',
    completionPercent: 72,
    notes: 'Design pass, then PWA install and hosting.',
    lastTouchedAt: day(-2),
    createdAt: day(-40),
    completedAt: null,
  },
  {
    id: 'p2',
    title: 'Portfolio site',
    category: 'work',
    completionPercent: 15,
    notes: 'About page still a placeholder.',
    lastTouchedAt: day(-21),
    createdAt: day(-90),
    completedAt: null,
  },
  {
    id: 'p3',
    title: 'Data structures notes',
    category: 'school',
    completionPercent: 45,
    notes: '',
    lastTouchedAt: day(-3),
    createdAt: day(-30),
    completedAt: null,
  },
]

const COURSES = [
  {
    id: 'c1',
    name: 'Data Structures & Algorithms',
    code: 'CS04222',
    assignments: [
      {
        id: 'a1',
        name: 'Project 2: AVL Trees',
        dueAt: day(2).toISOString(),
        htmlUrl: '#',
        pointsPossible: 100,
        submitted: false,
      },
      {
        id: 'a2',
        name: 'Quiz 4',
        dueAt: day(-1).toISOString(),
        htmlUrl: '#',
        pointsPossible: 20,
        submitted: false,
      },
    ],
  },
  {
    id: 'c2',
    name: 'Linear Algebra',
    code: 'MATH01230',
    assignments: [
      {
        id: 'a3',
        name: 'Problem Set 6',
        dueAt: day(0).toISOString(),
        htmlUrl: '#',
        pointsPossible: 50,
        submitted: true,
      },
    ],
  },
]

function Preview() {
  const [habitView, setHabitView] = useState('calendar')
  const assignments = flattenAssignments(COURSES)
  const summary = buildSummary(HABITS, PROJECTS, assignments)
  const noop = () => {}

  return (
    <main className="app">
      <header className="topbar">
        <h1>Reroute Planner</h1>
        <div className="topbar-account">
          <span>AJ</span>
          <button type="button">Sign out</button>
        </div>
      </header>

      <StatusStrip summary={summary} />

      <RerouteSuggestions habits={HABITS} onAccept={noop} onDismiss={noop} />

      <section>
        <div className="section-header">
          <h2>Habits</h2>
          <div className="view-toggle">
            <button
              type="button"
              className={habitView === 'calendar' ? 'active' : ''}
              onClick={() => setHabitView('calendar')}
            >
              Calendar
            </button>
            <button
              type="button"
              className={habitView === 'list' ? 'active' : ''}
              onClick={() => setHabitView('list')}
            >
              List
            </button>
          </div>
        </div>
        {habitView === 'calendar' ? (
          <CalendarView habits={HABITS} assignments={assignments} onCheckOff={noop} />
        ) : (
          <HabitList habits={HABITS} onCheckOff={noop} />
        )}
        <AddHabitForm onAdd={noop} />
      </section>

      <section>
        <h2>Projects</h2>
        <ProjectList projects={PROJECTS} onUpdatePercent={noop} onTouch={noop} />
        <AddProjectForm onAdd={noop} />
      </section>

      <section>
        <h2>Courses</h2>
        <CoursesView courses={COURSES} loading={false} error={null} onSync={noop} />
      </section>
    </main>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Preview />
  </StrictMode>,
)
