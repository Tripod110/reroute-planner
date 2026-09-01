// Summary before detail: four read-only counts derived by
// src/lib/summary.js from the same scheduling functions the calendar
// uses, so the strip can't disagree with the week below it.
//
// "Needs reroute" is the only cell allowed to go orange, and only when
// it's non-zero — in this design colour means deviation, so a signal
// that's always lit stops being a signal.
function StatusStrip({ summary }) {
  return (
    <div className="status-strip">
      <div className="stat">
        <span className="stat-num">{summary.onRoute}</span>
        <span className="stat-label">On route</span>
      </div>
      <div className={summary.needsReroute > 0 ? 'stat stat-alert' : 'stat'}>
        <span className="stat-num">{summary.needsReroute}</span>
        <span className="stat-label">Needs reroute</span>
      </div>
      <div className="stat">
        <span className="stat-num">{summary.dueThisWeek}</span>
        <span className="stat-label">Due this week</span>
      </div>
      <div className="stat">
        <span className="stat-num">{summary.stalled}</span>
        <span className="stat-label">Stalled</span>
      </div>
    </div>
  )
}

export default StatusStrip
