import { NEAR_DONE_PERCENT, STALLED_AFTER_DAYS } from '../config/thresholds'

function daysSince(date) {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
}

// Status badges are derived from completionPercent + lastTouchedAt, never
// stored (see DATA-MODEL.md) — "near done" and "stalled" are two
// independent signals, not stages of one status.
function ProjectItem({ project, onUpdatePercent, onTouch }) {
  const since = daysSince(project.lastTouchedAt)
  const nearDone = !project.completedAt && project.completionPercent >= NEAR_DONE_PERCENT
  const stalled =
    !project.completedAt &&
    project.completionPercent < NEAR_DONE_PERCENT &&
    since >= STALLED_AFTER_DAYS

  return (
    <li className="item">
      <div className="item-main">
        <span className="item-title">{project.title}</span>
        <span className="item-category">{project.category}</span>
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
          onChange={(e) => onUpdatePercent(project.id, Number(e.target.value))}
        />
        <span>{project.completionPercent}%</span>
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
