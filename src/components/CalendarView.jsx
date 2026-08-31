import { getWeekDays, groupHabitsByDay } from '../lib/scheduling'

const DAY_LABEL = { weekday: 'short', month: 'short', day: 'numeric' }

// Only habits are placed on the grid — projects don't have a due date in
// the data model (deliberately: DATA-MODEL.md derives near-done/stalled
// from completion-% + last-touched, not a schedule). Deciding *which day*
// to nudge a project is a judgment call, so that belongs to the AI
// reasoning layer (step 4), not this deterministic view.
function CalendarView({ habits, onCheckOff }) {
  const days = getWeekDays()
  const buckets = groupHabitsByDay(habits, days)
  const todayKey = days[0].getTime()

  return (
    <div className="calendar">
      {days.map((day) => {
        const key = day.getTime()
        const items = buckets.get(key) ?? []
        const isToday = key === todayKey

        return (
          <div className={`calendar-day${isToday ? ' calendar-day-today' : ''}`} key={key}>
            <div className="calendar-day-label">
              <span>{day.toLocaleDateString(undefined, DAY_LABEL)}</span>
              {isToday && <span className="calendar-today-tag">Today</span>}
            </div>
            <ul className="calendar-items">
              {items.map((habit) => (
                <li key={habit.id} className="calendar-item">
                  <span>{habit.title}</span>
                  <button type="button" onClick={() => onCheckOff(habit.id)}>
                    Check off
                  </button>
                </li>
              ))}
              {items.length === 0 && <li className="calendar-empty">—</li>}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

export default CalendarView
