import { useState } from 'react'
import HabitList from './components/HabitList'
import ProjectList from './components/ProjectList'
import { initialHabits, initialProjects } from './data/mockData'
import './App.css'

function App() {
  const [habits, setHabits] = useState(initialHabits)
  const [projects, setProjects] = useState(initialProjects)

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

  return (
    <main className="app">
      <h1>Reroute Planner</h1>

      <section>
        <h2>Habits</h2>
        <HabitList habits={habits} onCheckOff={handleCheckOff} />
      </section>

      <section>
        <h2>Projects</h2>
        <ProjectList
          projects={projects}
          onUpdatePercent={handleUpdatePercent}
          onTouch={handleTouch}
        />
      </section>
    </main>
  )
}

export default App
