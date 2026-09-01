import { useMemo, useState } from 'react'
import { suggestReroutes } from '../lib/reroute'

// Surfaces v1 of the AI reasoning layer's output — never applies anything
// on its own. Hiding a dismissed card is session-only (re-appears next
// visit if still overdue), but the decision itself is now persisted via
// onDismiss (task #8) so the assistant's memory can eventually notice
// patterns like "dismissed 3 of the last 4 suggestions for this habit."
function RerouteSuggestions({ habits, onAccept, onDismiss }) {
  const suggestions = useMemo(() => suggestReroutes(habits), [habits])
  const [dismissed, setDismissed] = useState(() => new Set())

  const visible = suggestions.filter((s) => !dismissed.has(s.habitId))
  if (visible.length === 0) return null

  return (
    <ul className="item-list">
      {visible.map((suggestion) => {
        const habit = habits.find((h) => h.id === suggestion.habitId)
        return (
          <li
            key={suggestion.habitId}
            className="item item-reroute"
            data-cat={habit?.category}
          >
            <div className="item-main">
              <span className="item-title">{habit?.title ?? 'Habit'}</span>
              <span className="badge badge-reroute">Reroute suggestion</span>
            </div>
            <p className="item-notes">
              {suggestion.reason} Suggest moving from every{' '}
              {suggestion.currentCadenceDays}d to every {suggestion.suggestedCadenceDays}d.
            </p>
            <div className="item-progress">
              <button
                type="button"
                onClick={() => onAccept(suggestion.habitId, suggestion.suggestedCadenceDays)}
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => {
                  setDismissed((prev) => new Set(prev).add(suggestion.habitId))
                  onDismiss(suggestion.habitId, suggestion.suggestedCadenceDays)
                }}
              >
                Dismiss
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default RerouteSuggestions
