// Talks to the local proxy server (server/index.js) — same pattern as
// canvasApi.js. The Gemini key never reaches the browser.
export async function askAssistant(context, message, history = []) {
  const res = await fetch('/api/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context, message, history }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed: ${res.status}`)
  }
  const { reply } = await res.json()
  return reply
}

// Fire-and-forget from the caller's perspective — updates the memory
// summary after a chat exchange. Errors are the caller's problem to
// decide whether to surface; this is a background enhancement, not core
// chat functionality, so most callers should swallow failures quietly.
export async function updateAssistantMemory(existingMemory, context, latestExchange) {
  const res = await fetch('/api/assistant/memory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ existingMemory, context, latestExchange }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed: ${res.status}`)
  }
  const { memory } = await res.json()
  return memory
}
