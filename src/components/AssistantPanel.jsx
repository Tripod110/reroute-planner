import { useState } from 'react'
import { askAssistant, updateAssistantMemory } from '../lib/assistantApi'
import { buildAssistantContext } from '../lib/assistantContext'

const BRIEFING_PROMPT =
  'Give me a quick briefing: any scheduling conflicts coming up between my habits and course assignments, and what should I prioritize this week? Also flag any stalled project worth resuming, with a concrete next action.'

// Chat UI for the Gemini-backed assistant. The assistant only talks — see
// server/geminiClient.js for why that's true by construction, not just
// prompting. "Today's briefing" is the proactive-suggestions entry point;
// it's the same chat flow with a canned prompt, not a separate feature.
//
// Memory (task #8): after each reply, fires a background call to update
// the persistent memory summary. Deliberately not awaited or blocking —
// it's a quality-of-life enhancement, not core chat functionality, so a
// failure here shouldn't interrupt the conversation or show a scary
// error banner. Memory writes happen automatically (not suggest/confirm
// like reroutes) because they're low-stakes — they change what the
// assistant remembers about you, not your actual plan data — but stay
// visible and clearable below so it's never a black box.
function AssistantPanel({ habits, projects, assignments, memory, onMemoryChange }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [memoryOpen, setMemoryOpen] = useState(false)

  async function send(message) {
    if (!message.trim() || loading) return
    setLoading(true)
    setError(null)
    const history = messages.map((m) => ({ role: m.role, text: m.text }))
    const nextMessages = [...messages, { role: 'user', text: message }]
    setMessages(nextMessages)
    setInput('')
    try {
      const context = buildAssistantContext(habits, projects, assignments)
      const reply = await askAssistant({ ...context, memory }, message, history)
      setMessages([...nextMessages, { role: 'model', text: reply }])

      updateAssistantMemory(memory, context, `User: ${message}\nAssistant: ${reply}`)
        .then((updated) => {
          if (updated && updated !== memory) onMemoryChange(updated)
        })
        .catch((err) => console.error('Memory update failed:', err))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button type="button" onClick={() => send(BRIEFING_PROMPT)} disabled={loading}>
        {loading ? 'Thinking…' : "Today's briefing"}
      </button>

      {memory && (
        <div className="item-meta">
          <button type="button" onClick={() => setMemoryOpen((v) => !v)}>
            {memoryOpen ? 'Hide' : 'Show'} what the assistant knows about you
          </button>
          {memoryOpen && (
            <button type="button" onClick={() => onMemoryChange('')}>
              Clear
            </button>
          )}
        </div>
      )}
      {memory && memoryOpen && <p className="item-notes">{memory}</p>}

      {error && (
        <p className="empty">
          Couldn't reach the assistant: {error}. Is <code>npm run server</code> running,
          and is <code>GEMINI_API_KEY</code> set in <code>.env</code>?
        </p>
      )}

      {messages.length > 0 && (
        <ul className="item-list">
          {messages.map((m, i) => (
            <li key={i} className={m.role === 'user' ? 'item msg-user' : 'item'}>
              <div className="item-main">
                <span className="item-category">{m.role === 'user' ? 'You' : 'Assistant'}</span>
              </div>
              <p className="item-notes">{m.text}</p>
            </li>
          ))}
        </ul>
      )}

      <form
        className="add-form"
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
      >
        <input
          type="text"
          placeholder="Ask about scheduling, projects, or what to focus on…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          Send
        </button>
      </form>
    </>
  )
}

export default AssistantPanel
