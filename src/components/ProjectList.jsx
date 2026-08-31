import { useState } from 'react'
import ProjectItem from './ProjectItem'

// "No deletion, just filtered from default view" (DATA-MODEL.md) — done
// projects stay in state, this toggle just hides/shows them.
function ProjectList({ projects, onUpdatePercent, onTouch }) {
  const [showCompleted, setShowCompleted] = useState(false)
  const visible = projects.filter((p) => showCompleted || !p.completedAt)

  return (
    <>
      <label className="toggle">
        <input
          type="checkbox"
          checked={showCompleted}
          onChange={(e) => setShowCompleted(e.target.checked)}
        />
        Show completed
      </label>
      <ul className="item-list">
        {visible.map((project) => (
          <ProjectItem
            key={project.id}
            project={project}
            onUpdatePercent={onUpdatePercent}
            onTouch={onTouch}
          />
        ))}
        {visible.length === 0 && <li className="empty">Nothing here.</li>}
      </ul>
    </>
  )
}

export default ProjectList
