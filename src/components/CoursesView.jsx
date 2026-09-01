function daysUntil(dueAt) {
  const ms = new Date(dueAt).getTime() - Date.now()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

// Deadline pressure is its own scale, separate from project status:
// badge-near-done is a *good* green state for a project, so reusing it
// for "assignment due soon" made a warning read as reassurance. Due
// dates get badge-due / badge-overdue instead.
function DueBadge({ dueAt }) {
  const days = daysUntil(dueAt)
  if (days < 0) return <span className="badge badge-overdue">Overdue</span>
  if (days === 0) return <span className="badge badge-due">Due today</span>
  if (days <= 3) return <span className="badge badge-due">Due in {days}d</span>
  return <span className="item-category">Due in {days}d</span>
}

// Live-fetched from Canvas on demand (manual sync, not stored in Firestore
// yet) — see DATA-MODEL.md "Courses (from Canvas)" for why this isn't
// folded into Habits/Projects. Sync state lives in App.jsx, not here,
// since CalendarView also needs the synced assignments (merged onto the
// weekly grid alongside Habits).
function CoursesView({ courses, loading, error, onSync }) {
  return (
    <>
      <button type="button" onClick={onSync} disabled={loading}>
        {loading ? 'Syncing…' : 'Sync from Canvas'}
      </button>
      {error && (
        <p className="empty">
          Couldn't reach Canvas: {error}. Is <code>npm run server</code> running?
        </p>
      )}
      {courses && (
        <ul className="item-list">
          {courses.map((course) => (
            <li key={course.id} className="item" data-cat="school">
              <div className="item-main">
                <span className="item-title">{course.name}</span>
                <span className="item-category" data-cat="school">
                  {course.code}
                </span>
              </div>
              {course.assignments.length === 0 ? (
                <p className="calendar-empty">No upcoming assignments.</p>
              ) : (
                <ul className="item-list">
                  {course.assignments.map((a) => (
                    <li
                      key={a.id}
                      className="calendar-item calendar-item-assignment"
                      data-cat="school"
                    >
                      <a href={a.htmlUrl} target="_blank" rel="noreferrer">
                        {a.name}
                      </a>
                      <div className="item-meta">
                        <DueBadge dueAt={a.dueAt} />
                        {a.submitted && <span className="item-category">Submitted</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
          {courses.length === 0 && <li className="empty">No active courses found.</li>}
        </ul>
      )}
    </>
  )
}

export default CoursesView
