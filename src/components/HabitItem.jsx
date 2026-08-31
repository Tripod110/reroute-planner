function daysSince(date) {
  if (!date) return null
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
}

// Check-off only records the completion — it does NOT touch
// currentCadenceDays. Adjusting cadence after a miss is the AI reasoning
// layer's job (build order step 4), not this one.
function HabitItem({ habit, onCheckOff }) {
  const since = daysSince(habit.lastCompletedAt)
  const drifted = habit.currentCadenceDays !== habit.targetEveryDays

  return (
    <li className="item">
      <div className="item-main">
        <span className="item-title">{habit.title}</span>
        <span className="item-category">{habit.category}</span>
      </div>
      <div className="item-meta">
        <span>
          Every {habit.currentCadenceDays}d
          {drifted && <em> (target: {habit.targetEveryDays}d)</em>}
        </span>
        <span>{since === null ? 'Never done' : `${since}d since last`}</span>
      </div>
      <button type="button" onClick={() => onCheckOff(habit.id)}>
        Check off
      </button>
    </li>
  )
}

export default HabitItem
