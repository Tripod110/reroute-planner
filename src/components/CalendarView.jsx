import { getWeekDays, groupAssignmentsByDay, groupHabitsByDay } from '../lib/scheduling'

// Weekday and date are formatted separately so the signage treatment can
// set them at different weights and sizes (see .calendar-dow /
// .calendar-date in App.css), rather than styling one run of text.
const DAY_OF_WEEK = { weekday: 'short' }
const DAY_DATE = { month: 'short', day: 'numeric' }

// Projects still aren't placed on the grid — no due date in the data
// model (deliberately: DATA-MODEL.md derives near-done/stalled from
// completion-% + last-touched, not a schedule). Deciding *which day* to
// nudge a project is a judgment call, reserved for the AI reasoning
// layer (step 4). Canvas assignments, added 2026-09-02, do have a real
// due date from Canvas, so they're placed the same deterministic way
// habits are — just without cadence math or overdue-clamping (see
// scheduling.js groupAssignmentsByDay).
function CalendarView({ habits, assignments = [], onCheckOff }) {
  const days = getWeekDays()
  const habitBuckets = groupHabitsByDay(habits, days)
  const assignmentBuckets = groupAssignmentsByDay(assignments, days)
  const todayKey = days[0].getTime()

  return (
    <div className="calendar">
      {days.map((day) => {
        const key = day.getTime()
        const dayHabits = habitBuckets.get(key) ?? []
        const dayAssignments = assignmentBuckets.get(key) ?? []
        const isToday = key === todayKey
        const isEmpty = dayHabits.length === 0 && dayAssignments.length === 0

        return (
          <div className={`calendar-day${isToday ? ' calendar-day-today' : ''}`} key={key}>
            <div className="calendar-day-label">
              <span className="calendar-dow">
                {day.toLocaleDateString(undefined, DAY_OF_WEEK)}
              </span>
              <span className="calendar-date">
                {day.toLocaleDateString(undefined, DAY_DATE)}
              </span>
              {isToday && <span className="calendar-today-tag">Today</span>}
            </div>
            <ul className="calendar-items">
              {dayHabits.map((habit) => (
                <li key={`h-${habit.id}`} className="calendar-item" data-cat={habit.category}>
                  <span>{habit.title}</span>
                  <button type="button" onClick={() => onCheckOff(habit.id)}>
                    Check off
                  </button>
                </li>
              ))}
              {dayAssignments.map((assignment) => (
                <li
                  key={`a-${assignment.id}`}
                  className="calendar-item calendar-item-assignment"
                  data-cat="school"
                >
                  <a href={assignment.htmlUrl} target="_blank" rel="noreferrer">
                    {assignment.name}
                  </a>
                  <span className="item-category" data-cat="school">
                    {assignment.courseCode}
                  </span>
                </li>
              ))}
              {isEmpty && <li className="calendar-empty">—</li>}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

export default CalendarView
