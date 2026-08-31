import HabitItem from './HabitItem'

function HabitList({ habits, onCheckOff }) {
  return (
    <ul className="item-list">
      {habits.map((habit) => (
        <HabitItem key={habit.id} habit={habit} onCheckOff={onCheckOff} />
      ))}
      {habits.length === 0 && <li className="empty">No habits yet.</li>}
    </ul>
  )
}

export default HabitList
