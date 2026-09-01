// Thin wrapper around the Gemini REST API. Runs server-side only — same
// reasoning as canvasClient.js: the API key never reaches the browser
// bundle. Model defaults to gemini-3.5-flash-lite, the cheapest current
// tier — appropriate for a single-user personal app where cost was the
// explicit reason for choosing Gemini over Claude. (gemini-2.5-flash-lite
// was the intended default at build time but Google retired it for new
// users mid-session — confirmed against the live API, not guessed.)

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

function model() {
  return process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'
}

async function callGemini(systemInstruction, contents) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set (see .env.example)')

  const res = await fetch(`${API_BASE}/${model()}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Gemini API ${res.status}: ${body}`)
  }

  const data = await res.json()
  const parts = data.candidates?.[0]?.content?.parts ?? []
  return parts.map((p) => p.text ?? '').join('')
}

// The assistant only ever talks — it has no tools and no write access to
// Firestore, so "suggest, don't decide" (claude.md's non-negotiable rule,
// which applies to any reasoning layer regardless of provider) holds by
// construction, not by prompting alone.
const SYSTEM_INSTRUCTION = `You are the built-in planning assistant inside Reroute Planner, a personal habit/project/course tracker for a single user (a CS student).

You will be given a JSON snapshot of the user's current Habits, Projects, and upcoming Canvas course assignments on every message, plus a "memory" field — a short summary of patterns you've inferred about this user from past sessions (empty if none yet). Use memory to personalize your answers, but never mention it's called "memory" or refer to it as a system detail; just use it naturally, the way a person who already knows you would.

Use all of this to help with:
- Spotting scheduling conflicts (e.g. several assignments or habits clustering on the same day)
- Deciding what to prioritize this week
- Suggesting a concrete next action for a stalled or near-done project, grounded in its notes field

Non-negotiable rules:
- You cannot change any data yourself — you have no tools. Every suggestion is something the user must act on themselves.
- Never frame a missed habit as failure or a "reset" — cadence can relax, it never starts over from zero.
- Only ever suggest increasing frequency/intensity as optional — never imply it's required or already decided.
- Be concise and specific. Reference actual titles and dates from the snapshot, not generic advice.`

export async function generateAssistantReply(context, message, history = []) {
  const contents = [
    ...history.map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] })),
    {
      role: 'user',
      parts: [{ text: `Current data snapshot:\n${JSON.stringify(context)}\n\n${message}` }],
    },
  ]
  return callGemini(SYSTEM_INSTRUCTION, contents)
}

// Runs after a chat exchange (fire-and-forget from the client) to keep the
// memory summary current. Deliberately a separate call from the main
// reply, not folded into it — this one's whole job is maintaining a
// concise, evolving profile, not answering the user's question.
const MEMORY_SYSTEM_INSTRUCTION = `You maintain a short evolving memory profile about a single user of Reroute Planner, for another instance of yourself to use in future conversations.

You'll receive the current memory text (may be empty), the user's current data snapshot, and the latest exchange between the user and the assistant. Return ONLY the updated memory text — no preamble, no markdown headers, no quotes around it.

Rules:
- Plain sentences, not bullet points. Under 200 words.
- Only include things that are actually inferable from the data or conversation — don't invent detail.
- Merge new observations into the existing memory; drop anything that's stale or now contradicted rather than letting it accumulate forever.
- Never record secrets, credentials, or anything sensitive — this is behavioral/preference patterns only (e.g. "tends to let gym cadence drift on busy weeks," "prefers short, direct answers").
- If nothing new or notable happened this exchange, return the existing memory text unchanged.`

export async function generateMemoryUpdate(existingMemory, context, latestExchange) {
  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: `Existing memory:\n${existingMemory || '(none yet)'}\n\nCurrent data snapshot:\n${JSON.stringify(context)}\n\nLatest exchange:\n${latestExchange}`,
        },
      ],
    },
  ]
  return callGemini(MEMORY_SYSTEM_INSTRUCTION, contents)
}
