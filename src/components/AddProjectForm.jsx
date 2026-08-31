import { useState } from 'react'
import { CATEGORIES } from '../config/categories'

// New projects always start at 0% — if it's actually already partway
// done, drag the slider up right after adding rather than backdating it
// here. Keeps this form to one concern: registering the project exists.
function AddProjectForm({ onAdd }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [notes, setNotes] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    onAdd({ title: title.trim(), category, notes: notes.trim() })
    setTitle('')
    setNotes('')
  }

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="New project"
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
      <input
        type="text"
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <button type="submit">Add project</button>
    </form>
  )
}

export default AddProjectForm
