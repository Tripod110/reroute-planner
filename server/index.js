import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { fetchCoursesWithAssignments } from './canvasClient.js'
import { generateAssistantReply, generateMemoryUpdate } from './geminiClient.js'

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/api/canvas/courses', async (_req, res) => {
  try {
    const courses = await fetchCoursesWithAssignments()
    res.json({ courses })
  } catch (err) {
    console.error(err)
    res.status(502).json({ error: err.message })
  }
})

app.post('/api/assistant', async (req, res) => {
  const { context, message, history } = req.body ?? {}
  if (!message) {
    res.status(400).json({ error: 'message is required' })
    return
  }
  try {
    const reply = await generateAssistantReply(context, message, history ?? [])
    res.json({ reply })
  } catch (err) {
    console.error(err)
    res.status(502).json({ error: err.message })
  }
})

app.post('/api/assistant/memory', async (req, res) => {
  const { existingMemory, context, latestExchange } = req.body ?? {}
  if (!latestExchange) {
    res.status(400).json({ error: 'latestExchange is required' })
    return
  }
  try {
    const memory = await generateMemoryUpdate(existingMemory ?? '', context, latestExchange)
    res.json({ memory })
  } catch (err) {
    console.error(err)
    res.status(502).json({ error: err.message })
  }
})

const port = process.env.SERVER_PORT || 3001
app.listen(port, () => {
  console.log(`Canvas proxy server listening on http://localhost:${port}`)
})
