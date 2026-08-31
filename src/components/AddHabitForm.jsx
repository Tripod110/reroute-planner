import { useState } from 'react'
import { CATEGORIES } from '../config/categories'

function AddHabitForm({ onAdd }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [everyDays, setEveryDays] = useState(1)

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    onAdd({ title: title.trim(), category, everyDays: Number(everyDays) })
    setTitle('')
    setEveryDays(1)
  }

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="New habit"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <label className="add-form-inline">
        every
        <input
          type="number"
          min="1"
          value={everyDays}
          onChange={(e) => setEveryDays(e.target.value)}
        />
        day(s)
      </label>
      <button type="submit">Add habit</button>
    </form>
  )
}

export default AddHabitForm
