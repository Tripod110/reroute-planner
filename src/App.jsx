import { useEffect, useState } from 'react'
import AssistantPanel from './components/AssistantPanel'
import HabitList from './components/HabitList'
import ProjectList from './components/ProjectList'
import CalendarView from './components/CalendarView'
import AddHabitForm from './components/AddHabitForm'
import AddProjectForm from './components/AddProjectForm'
import CoursesView from './components/CoursesView'
import RerouteSuggestions from './components/RerouteSuggestions'
import SignIn from './components/SignIn'
import StatusStrip from './components/StatusStrip'
import { useAuth, signOutUser } from './lib/auth'
import { fetchCanvasCourses, flattenAssignments } from './lib/canvasApi'
import { buildSummary } from './lib/summary'
import {
  addHabit,
  addProject,
  applyRerouteCadence,
  checkOffHabit,
  recordRerouteDecision,
  setAssistantMemory,
  subscribeAssistantMemory,
  subscribeHabits,
  subscribeProjects,
  touchProject,
  updateProjectPercent,
} from './lib/firestoreData'
import './App.css'

function PlannerApp({ uid, displayName }) {
  const [habits, setHabits] = useState([])
  const [projects, setProjects] = useState([])
  const [habitView, setHabitView] = useState('calendar')
  const [dbError, setDbError] = useState(null)
  const [memory, setMemory] = useState('')

  // Canvas sync state lives here, not inside CoursesView, so CalendarView
  // can merge the same synced assignments onto the weekly grid.
  const [courses, setCourses] = useState(null)
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [coursesError, setCoursesError] = useState(null)
  const assignments = courses ? flattenAssignments(courses) : []
  const summary = buildSummary(habits, projects, assignments)

  async function handleCanvasSync() {
    setCoursesLoading(true)
    setCoursesError(null)
    try {
      setCourses(await fetchCanvasCourses())
    } catch (err) {
      setCoursesError(err.message)
    } finally {
      setCoursesLoading(false)
    }
  }

  useEffect(() => subscribeHabits(uid, setHabits, (err) => setDbError(err.message)), [uid])
  useEffect(() => subscribeProjects(uid, setProjects, (err) => setDbError(err.message)), [uid])
  useEffect(() => subscribeAssistantMemory(uid, setMemory, (err) => setDbError(err.message)), [uid])

  // Firestore writes (addDoc/updateDoc) reject on permission-denied etc.
  // instead of throwing synchronously — without this, a blocked write
  // (e.g. security rules not yet deployed) fails completely silently.
  function runWrite(promise) {
    promise.catch((err) => setDbError(err.message))
  }

  return (
    <main className="app">
      <header className="topbar">
        <h1>Reroute Planner</h1>
        <div className="topbar-account">
          <span>{displayName}</span>
          <button type="button" onClick={() => signOutUser()}>
            Sign out
          </button>
        </div>
      </header>

      <StatusStrip summary={summary} />

      {dbError && (
        <p className="empty">
          Database error: {dbError}. If you haven't yet, paste{' '}
          <code>firestore.rules</code> into Firebase console → Firestore
          Database → Rules.
        </p>
      )}

      <RerouteSuggestions
        habits={habits}
        onAccept={(habitId, cadenceDays) => {
          runWrite(applyRerouteCadence(uid, habitId, cadenceDays))
          runWrite(recordRerouteDecision(uid, habitId, 'accepted', cadenceDays))
        }}
        onDismiss={(habitId, cadenceDays) =>
          runWrite(recordRerouteDecision(uid, habitId, 'dismissed', cadenceDays))
        }
      />

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
          <CalendarView
            habits={habits}
            assignments={assignments}
            onCheckOff={(id) => runWrite(checkOffHabit(uid, id))}
          />
        ) : (
          <HabitList habits={habits} onCheckOff={(id) => runWrite(checkOffHabit(uid, id))} />
        )}
        <AddHabitForm onAdd={(habit) => runWrite(addHabit(uid, habit))} />
      </section>

      <section>
        <h2>Projects</h2>
        <ProjectList
          projects={projects}
          onUpdatePercent={(id, percent) => runWrite(updateProjectPercent(uid, id, percent))}
          onTouch={(id) => runWrite(touchProject(uid, id))}
        />
        <AddProjectForm onAdd={(project) => runWrite(addProject(uid, project))} />
      </section>

      <section>
        <h2>Courses</h2>
        <CoursesView
          courses={courses}
          loading={coursesLoading}
          error={coursesError}
          onSync={handleCanvasSync}
        />
      </section>

      <section>
        <h2>Assistant</h2>
        <AssistantPanel
          habits={habits}
          projects={projects}
          assignments={assignments}
          memory={memory}
          onMemoryChange={(text) => runWrite(setAssistantMemory(uid, text))}
        />
      </section>
    </main>
  )
}

function App() {
  const { user, loading } = useAuth()

  if (loading) return null
  if (!user) return <SignIn />
  return <PlannerApp uid={user.uid} displayName={user.displayName} />
}

export default App
