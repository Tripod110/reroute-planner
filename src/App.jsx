import { useState } from 'react'
import HabitList from './components/HabitList'
import ProjectList from './components/ProjectList'
import CalendarView from './components/CalendarView'
import AddHabitForm from './components/AddHabitForm'
import AddProjectForm from './components/AddProjectForm'
import { initialHabits, initialProjects } from './data/mockData'
import './App.css'

function App() {
  const [habits, setHabits] = useState(initialHabits)
  const [projects, setProjects] = useState(initialProjects)
  const [habitView, setHabitView] = useState('calendar')

  function handleCheckOff(habitId) {
    setHabits((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, lastCompletedAt: new Date() } : h)),
    )
  }

  function handleUpdatePercent(projectId, percent) {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              completionPercent: percent,
              lastTouchedAt: new Date(),
              completedAt: percent === 100 ? new Date() : null,
            }
          : p,
      ),
    )
  }

  function handleTouch(projectId) {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, lastTouchedAt: new Date() } : p)),
    )
  }

  function handleAddHabit({ title, category, everyDays }) {
    setHabits((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title,
        category,
        targetEveryDays: everyDays,
        currentCadenceDays: everyDays,
        lastCompletedAt: null,
        createdAt: new Date(),
        archivedAt: null,
      },
    ])
  }

  function handleAddProject({ title, category, notes }) {
    setProjects((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title,
        category,
        completionPercent: 0,
        lastTouchedAt: new Date(),
        notes,
        createdAt: new Date(),
        completedAt: null,
      },
    ])
  }

  return (
    <main className="app">
      <h1>Reroute Planner</h1>

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
          <CalendarView habits={habits} onCheckOff={handleCheckOff} />
        ) : (
          <HabitList habits={habits} onCheckOff={handleCheckOff} />
        )}
        <AddHabitForm onAdd={handleAddHabit} />
      </section>

      <section>
        <h2>Projects</h2>
        <ProjectList
          projects={projects}
          onUpdatePercent={handleUpdatePercent}
          onTouch={handleTouch}
        />
        <AddProjectForm onAdd={handleAddProject} />
      </section>
    </main>
  )
}

export default App
