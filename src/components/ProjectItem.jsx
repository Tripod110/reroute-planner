import { daysSince, isNearDone, isStalled } from '../lib/summary'

// Status badges are derived from completionPercent + lastTouchedAt, never
// stored (see DATA-MODEL.md) — "near done" and "stalled" are two
// independent signals, not stages of one status. The predicates live in
// summary.js so the status strip and this badge agree by construction.
function ProjectItem({ project, onUpdatePercent, onTouch }) {
  const since = daysSince(project.lastTouchedAt)
  const nearDone = isNearDone(project)
  const stalled = isStalled(project)

  return (
    <li className="item" data-cat={project.category}>
      <div className="item-main">
        <span className="item-title">{project.title}</span>
        <span className="item-category" data-cat={project.category}>
          {project.category}
        </span>
        {project.completedAt && <span className="badge badge-done">Done</span>}
        {nearDone && <span className="badge badge-near-done">Near done</span>}
        {stalled && <span className="badge badge-stalled">Stalled</span>}
      </div>
      {project.notes && <p className="item-notes">{project.notes}</p>}
      <div className="item-meta">
        <span>{since}d since last touched</span>
      </div>
      <div className="item-progress">
        <input
          type="range"
          min="0"
          max="100"
          value={project.completionPercent}
          disabled={!!project.completedAt}
          // Drives the filled portion of the track so it matches the
          // number beside it (see input[type='range'] in App.css).
          style={{ '--fill': `${project.completionPercent}%` }}
          onChange={(e) => onUpdatePercent(project.id, Number(e.target.value))}
        />
        <span className="item-percent">{project.completionPercent}%</span>
      </div>
      {!project.completedAt && (
        <button type="button" onClick={() => onTouch(project.id)}>
          Worked on it (no progress)
        </button>
      )}
    </li>
  )
}

export default ProjectItem
